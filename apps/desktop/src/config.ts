import { parse, stringify } from "smol-toml";
import {
  makeProfile,
  makeTunnel,
  type Profile,
  type Tunnel,
  type TunnelType,
} from "./model";
import {
  ConfigError, advancedTable, exportAdvanced, validateProfileAdvanced,
  validateTunnelAdvanced, validateAdvancedVersion,
} from "./advancedConfig";
export { ConfigError, validateProfileAdvanced, validateTunnelAdvanced } from "./advancedConfig";

type Table = Record<string, unknown>;

export interface ConfigPreview {
  profile: Profile;
  tunnels: Tunnel[];
  source: "toml" | "share";
}

const types: TunnelType[] = [
  "tcp",
  "udp",
  "http",
  "https",
  "stcp",
  "sudp",
  "xtcp",
  "tcpmux",
];
const privateTypes: TunnelType[] = ["stcp", "sudp", "xtcp"];
const protocols = ["tcp", "kcp", "quic", "websocket", "wss"];
const MAX_INPUT = 1024 * 1024;
const MAX_TUNNELS = 500;

function fail(zh: string, en: string): never {
  throw new ConfigError(zh, en);
}
function checkedSize(value: string): string {
  if (!value.trim() || new TextEncoder().encode(value).byteLength > MAX_INPUT)
    fail(
      "配置不能为空且 UTF-8 大小不得超过 1 MiB",
      "Configuration must not be empty or exceed 1 MiB in UTF-8",
    );
  return value;
}
function tunnelCount(count: number): void {
  if (count > MAX_TUNNELS)
    fail(
      "单份配置最多支持 500 条隧道，端口范围按展开后数量计算",
      "A configuration supports at most 500 tunnels, counting expanded port ranges",
    );
}
function table(value: unknown, path: string): Table {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    value instanceof Date
  ) {
    return fail(`${path} 必须是配置表`, `${path} must be a table`);
  }
  return value as Table;
}
function optionalTable(value: unknown, path: string): Table {
  return value === undefined ? {} : table(value, path);
}
function keys(value: Table, allowed: string[], path: string): void {
  const unsupported = Object.keys(value).filter(
    (key) => !allowed.includes(key),
  );
  if (unsupported.length) {
    fail(
      `暂不支持字段 ${path}.${unsupported.join(`、${path}.`)}，请移除或在完整 frpc 配置中维护。`,
      `Unsupported fields: ${unsupported.map((key) => `${path}.${key}`).join(", ")}. Remove them or maintain them in a full frpc configuration.`,
    );
  }
}
function string(value: unknown, path: string, fallback?: string): string {
  if (value === undefined && fallback !== undefined) return fallback;
  if (typeof value !== "string")
    return fail(`${path} 必须是文本`, `${path} must be a string`);
  return value;
}
function required(value: unknown, path: string): string {
  const text = string(value, path).trim();
  if (!text || text.length > 255)
    fail(
      `${path} 必须填写且不能超过 255 个字符`,
      `${path} is required and must not exceed 255 characters`,
    );
  return text;
}
function bool(value: unknown, path: string, fallback = false): boolean {
  if (value === undefined) return fallback;
  if (typeof value !== "boolean")
    return fail(`${path} 必须是布尔值`, `${path} must be a boolean`);
  return value;
}
function port(
  value: unknown,
  path: string,
  fallback?: number,
  allowZero = false,
): number {
  const number = value === undefined ? fallback : value;
  if (
    typeof number !== "number" ||
    !Number.isInteger(number) ||
    number < (allowZero ? 0 : 1) ||
    number > 65535
  ) {
    return fail(
      `${path} 必须是 ${allowZero ? "0" : "1"}–65535 的整数`,
      `${path} must be an integer from ${allowZero ? "0" : "1"} to 65535`,
    );
  }
  return number;
}
function tunnelType(value: unknown, path: string): TunnelType {
  const type = string(value, path);
  if (!types.includes(type as TunnelType))
    return fail(
      `${path} 不支持此隧道类型`,
      `${path} has an unsupported tunnel type`,
    );
  return type as TunnelType;
}
function address(value: unknown, path: string): string {
  const host = required(value, path);
  if (/\s|[@/?#\\]/.test(host) || host.includes("://"))
    fail(
      `${path} 请填写主机名或 IP，不含协议与路径`,
      `${path} must be a hostname or IP without a scheme or path`,
    );
  try {
    if (host.includes(":")) {
      if (host.startsWith("[") && !host.endsWith("]"))
        throw new Error("IPv6 must not include a port");
      const literal = host.startsWith("[") ? host : `[${host}]`;
      const parsed = new URL(`http://${literal}`);
      if (
        !parsed.hostname.startsWith("[") ||
        parsed.port || parsed.username || parsed.password
      )
        throw new Error("Invalid IPv6 host");
    } else if (
      !host.split(".").every(
        (part) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(part),
      )
    ) {
      throw new Error("Invalid hostname labels");
    }
  } catch {
    fail(
      `${path} 请填写有效主机名或 IP，端口使用独立字段`,
      `${path} must be a valid hostname or IP; enter the port separately`,
    );
  }
  return host.startsWith("[") && host.endsWith("]")
    ? host.slice(1, -1)
    : host;
}
function domain(value: unknown, path: string): string {
  const name = required(value, path);
  const host = name.startsWith("*.") ? name.slice(2) : name;
  if (
    !host.includes(".") ||
    (/^(?:0|[1-9]\d{0,2})(?:\.(?:0|[1-9]\d{0,2})){3}$/.test(host) &&
      host.split(".").every((part) => Number(part) <= 255)) ||
    !host
      .split(".")
      .every((part) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(part))
  ) {
    fail(
      `${path} 请填写有效域名，不含协议、端口或路径`,
      `${path} must be a valid domain without a scheme, port, or path`,
    );
  }
  return name;
}
function protocol(value: unknown): string {
  const result = string(value, "transport.protocol", "tcp");
  if (!protocols.includes(result))
    fail("暂不支持此传输协议", "Unsupported transport protocol");
  return result;
}
function list(value: unknown, path: string): unknown[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_TUNNELS)
    fail(
      `${path} 必须是数组且不超过 500 项`,
      `${path} must be an array with no more than 500 entries`,
    );
  return value;
}
function uniqueTunnelNames(tunnels: Tunnel[]): void {
  const names = new Set<string>();
  for (const tunnel of tunnels) {
    if (names.has(tunnel.name))
      fail(
        `隧道名称重复：${tunnel.name}`,
        `Duplicate tunnel name: ${tunnel.name}`,
      );
    names.add(tunnel.name);
  }
}
function omit(value: Table, names: string[]): Table {
  return Object.fromEntries(Object.entries(value).filter(([name]) => !names.includes(name)));
}
function validateProfileExtensions(profile: Profile, tunnels: Tunnel[]): void {
  validateProfileAdvanced(profile.advanced, profile.transport, profile.authToken);
  const auth = advancedTable(advancedTable(profile.advanced).auth);
  if (profile.authToken && (auth.method === "oidc" || auth.tokenSource !== undefined))
    fail("OIDC 或 tokenSource 不能与认证 token 同时设置", "OIDC or tokenSource cannot be combined with auth.token");
  validateAdvancedVersion(advancedTable(profile.advanced), tunnels.map((tunnel) => advancedTable(tunnel.advanced)), profile.version);
}

export function hasConfigurationCredentials(profile: Profile, tunnels: Tunnel[]): boolean {
  const sensitive = new Set(["clientSecret", "password", "httpPassword", "httpUser", "username", "groupKey", "tokenSource", "metadatas", "annotations", "requestHeaders", "responseHeaders", "httpHeaders", "additionalEndpointParams", "user"]);
  const content = (value: unknown): boolean => {
    if (typeof value === "string") return value.length > 0;
    if (value && typeof value === "object") return Object.values(value).some(content);
    return false;
  };
  const visit = (value: unknown): boolean => {
    if (!value || typeof value !== "object") return false;
    return Object.entries(value).some(([name, entry]) => {
      if (sensitive.has(name) && content(entry)) return true;
      if (name === "proxyURL" && typeof entry === "string") {
        try { const parsed = new URL(entry); if (parsed.username || parsed.password) return true; } catch { /* Validation handles malformed URLs. */ }
      }
      return visit(entry);
    });
  };
  return Boolean(profile.authToken) || visit(profile.advanced) || tunnels.some((tunnel) => tunnel.profileId === profile.id && (Boolean(tunnel.secretKey) || visit(tunnel.advanced)));
}

export interface ConfigurationFileReference {
  path: string;
  field: string;
  profileId: string;
  tunnelId?: string;
}
// Lists references for review; this browser-safe helper does not inspect local files.
export function getConfigurationFileReferences(profile: Profile, tunnels: Tunnel[]): ConfigurationFileReference[] {
  const references: ConfigurationFileReference[] = [];
  const collect = (value: unknown, field: string, tunnelId?: string) => {
    if (!value || typeof value !== "object") return;
    for (const [name, entry] of Object.entries(value)) {
      const current = field ? field + "." + name : name;
      if (["certFile", "keyFile", "trustedCaFile", "crtPath", "keyPath", "localPath", "assetsDir", "unixPath"].includes(name) || current.endsWith("tokenSource.file.path")) {
        if (typeof entry === "string" && entry) references.push({ path: entry, field: current, profileId: profile.id, ...(tunnelId ? { tunnelId } : {}) });
      } else collect(entry, current, tunnelId);
    }
  };
  collect(profile.advanced, "");
  for (const tunnel of tunnels.filter((item) => item.profileId === profile.id)) {
    collect(tunnel.advanced, "", tunnel.id);
    if (tunnel.https2http) {
      for (const [field, path] of [["plugin.crtPath", tunnel.certPath], ["plugin.keyPath", tunnel.keyPath]])
        if (path) references.push({ path, field, profileId: profile.id, tunnelId: tunnel.id });
    }
  }
  return references;
}

function validateTunnel(tunnel: Tunnel): void {
  const advanced = advancedTable(tunnel.advanced);
  validateTunnelAdvanced(advanced, tunnel.type, tunnel.role);
  required(tunnel.name, "name");
  tunnelType(tunnel.type, "type");
  address(tunnel.localIP, "localIP / bindAddr");
  port(tunnel.localPort, "localPort / bindPort");
  if (tunnel.https2http) {
    if (advanced.plugin !== undefined)
      fail("旧 HTTPS 转 HTTP 开关不能与高级插件同时设置", "Legacy HTTPS conversion cannot be combined with an advanced plugin");
    if (tunnel.role !== "provider" || tunnel.type !== "https")
      fail(
        "HTTPS 转 HTTP 仅支持 HTTPS 提供者",
        "HTTPS to HTTP is supported only for HTTPS providers",
      );
    if (Boolean(tunnel.certPath) !== Boolean(tunnel.keyPath))
      fail("证书与私钥必须同时填写或同时省略", "Certificate and key must be supplied together or both omitted");
  }
  if (tunnel.role === "visitor") {
    if (!privateTypes.includes(tunnel.type))
      fail(
        "只有 STCP、SUDP、XTCP 支持访问者模式",
        "Only STCP, SUDP, and XTCP support visitor mode",
      );
    required(tunnel.serverName, "serverName");
  } else if (tunnel.type === "tcp" || tunnel.type === "udp") {
    port(tunnel.remotePort, "remotePort", undefined, true);
  } else if (["http", "https", "tcpmux"].includes(tunnel.type)) {
    const domains = advanced.customDomains === undefined ? (tunnel.domain ? [tunnel.domain] : []) : advanced.customDomains as string[];
    domains.forEach((name) => domain(name, "customDomains"));
    if (!domains.length && !advanced.subdomain)
      fail("请填写域名或子域名", "A custom domain or subdomain is required");
  }
  if (tunnel.localPortEnd || tunnel.remotePortEnd) {
    if (advanced.plugin !== undefined || tunnel.remotePort === 0)
      fail("端口范围不能使用插件或自动远程端口", "Port ranges cannot use plugins or automatic remote ports");
    if (tunnel.role === "visitor" || !["tcp", "udp"].includes(tunnel.type))
      fail(
        "只有 TCP、UDP 提供者支持端口范围",
        "Port ranges are supported only for TCP and UDP providers",
      );
    port(tunnel.localPortEnd, "localPortEnd");
    port(tunnel.remotePortEnd, "remotePortEnd");
    const localCount = tunnel.localPortEnd - tunnel.localPort + 1;
    const remoteCount = tunnel.remotePortEnd - tunnel.remotePort + 1;
    if (localCount < 1 || localCount !== remoteCount || localCount > 128)
      fail(
        "本地与远程范围数量须一致，最多展开 128 个端口",
        "Local and remote ranges must have the same length, up to 128 ports",
      );
  }
}

export function exportProfileToml(profile: Profile, tunnels: Tunnel[], includeCredentials = false): string {
  const serverAddr = address(profile.serverAddr, "serverAddr");
  port(profile.serverPort, "serverPort");
  port(profile.webPort, "webServer.port", undefined, true);
  protocol(profile.transport);
  const enabled = tunnels.filter((tunnel) => tunnel.profileId === profile.id && tunnel.enabled);
  enabled.forEach(validateTunnel);
  validateProfileExtensions(profile, enabled);
  tunnelCount(enabled.reduce((count, tunnel) => count + (tunnel.role === "provider" && tunnel.localPortEnd ? tunnel.localPortEnd - tunnel.localPort + 1 : 1), 0));
  uniqueTunnelNames(enabled);
  const profileAdvanced = exportAdvanced(profile.advanced, includeCredentials, "profile");
  const advancedTransport = advancedTable(profileAdvanced.transport);
  const advancedAuth = advancedTable(profileAdvanced.auth);
  const proxies: Table[] = [];
  const visitors: Table[] = [];
  for (const tunnel of enabled) {
    const advanced = exportAdvanced(tunnel.advanced, includeCredentials, "tunnel");
    const localIP = address(tunnel.localIP, "localIP / bindAddr");
    const transport = { ...advancedTable(advanced.transport), useEncryption: tunnel.encryption, useCompression: tunnel.compression };
    const secret = includeCredentials && tunnel.secretKey ? { secretKey: tunnel.secretKey } : {};
    if (tunnel.role === "visitor") {
      visitors.push({
        ...advanced, name: tunnel.name, type: tunnel.type, serverName: tunnel.serverName,
        bindAddr: localIP, bindPort: advanced.bindPort ?? tunnel.localPort, transport, ...secret,
      });
      continue;
    }
    const count = tunnel.localPortEnd ? tunnel.localPortEnd - tunnel.localPort + 1 : 1;
    for (let offset = 0; offset < count; offset += 1) {
      const item: Table = {
        ...advanced, name: count > 1 ? tunnel.name + "-" + (tunnel.localPort + offset) : tunnel.name,
        type: tunnel.type, localIP, localPort: tunnel.localPort + offset, transport,
      };
      if (tunnel.type === "tcp" || tunnel.type === "udp") item.remotePort = tunnel.remotePort + offset;
      if (["http", "https", "tcpmux"].includes(tunnel.type) && advanced.customDomains === undefined && tunnel.domain)
        item.customDomains = [tunnel.domain];
      if (tunnel.type === "tcpmux" && item.multiplexer === undefined) item.multiplexer = "httpconnect";
      if (tunnel.https2http) item.plugin = {
        type: "https2http", localAddr: (localIP.includes(":") ? "[" + localIP + "]" : localIP) + ":" + tunnel.localPort,
        crtPath: tunnel.certPath, keyPath: tunnel.keyPath,
      };
      if (item.plugin !== undefined) { delete item.localIP; delete item.localPort; }
      if (privateTypes.includes(tunnel.type)) Object.assign(item, secret);
      proxies.push(item);
    }
  }
  const generatedNames = [...proxies, ...visitors].map((item) => item.name);
  if (new Set(generatedNames).size !== generatedNames.length)
    fail("展开端口范围后的隧道名称重复，请调整名称", "Tunnel names collide after expanding port ranges");
  const auth: Table = { ...advancedAuth };
  if (auth.method !== "oidc") {
    if (includeCredentials && profile.authToken) auth.token = profile.authToken;
  }
  const output: Table = {
    ...profileAdvanced, serverAddr, serverPort: profile.serverPort,
    ...(profile.user ? { user: profile.user } : {}),
    loginFailExit: false, log: { to: "console", level: "info", disablePrintColor: true },
    transport: { ...advancedTransport, protocol: profile.transport, tls: { ...advancedTable(advancedTransport.tls), enable: profile.tls } },
    ...(profile.webPort || profileAdvanced.webServer !== undefined ? { webServer: { ...advancedTable(profileAdvanced.webServer), addr: "127.0.0.1", port: profile.webPort } } : {}),
    ...(Object.keys(auth).length ? { auth } : {}),
    ...(proxies.length ? { proxies } : {}), ...(visitors.length ? { visitors } : {}),
  };
  return checkedSize("# frpc-ui: " + JSON.stringify(profile.name) + "\n# Version is selected in the application. Disabled tunnels are excluded.\n# " + (includeCredentials ? "Sensitive credentials may be included." : "Credentials omitted; supply them before connecting if required.") + "\n\n" + stringify(output));
}

function importToml(source: string, version: string, name: string): ConfigPreview {
  let parsed: Table;
  try { parsed = table(parse(source, { unsafeKeyBehaviour: "throw" }), "config"); }
  catch (error) {
    if (error instanceof ConfigError) throw error;
    return fail("TOML 语法错误，请检查引号、配置表和字段类型。", "Invalid TOML. Check quoting, tables, and field types.");
  }
  if (bool(parsed.loginFailExit, "loginFailExit"))
    fail("loginFailExit=true 无法由受管客户端保留", "loginFailExit=true cannot be preserved by the supervised client");
  if (parsed.log !== undefined) {
    const log = table(parsed.log, "log");
    keys(log, ["to", "level", "disablePrintColor"], "log");
    if (string(log.to, "log.to") !== "console" || string(log.level, "log.level") !== "info" || !bool(log.disablePrintColor, "log.disablePrintColor"))
      fail("当前仅支持应用管理的控制台 info 日志，并关闭终端颜色", "Only supervised console info logging with disabled print color is supported");
  }
  const auth = optionalTable(parsed.auth, "auth");
  const transport = optionalTable(parsed.transport, "transport");
  const tls = optionalTable(transport.tls, "transport.tls");
  const web = optionalTable(parsed.webServer, "webServer");
  if (string(web.addr, "webServer.addr", "127.0.0.1") !== "127.0.0.1")
    fail("管理接口仅支持 127.0.0.1", "The management interface supports only 127.0.0.1");
  const advanced = omit(parsed, ["serverAddr", "serverPort", "user", "auth", "transport", "webServer", "proxies", "visitors", "loginFailExit", "log"]);
  const authAdvanced = omit(auth, ["token"]);
  if (Object.keys(authAdvanced).length) advanced.auth = authAdvanced;
  const transportAdvanced = omit(transport, ["protocol", "tls"]);
  const tlsAdvanced = omit(tls, ["enable"]);
  if (Object.keys(tlsAdvanced).length) transportAdvanced.tls = tlsAdvanced;
  if (Object.keys(transportAdvanced).length) advanced.transport = transportAdvanced;
  const webAdvanced = omit(web, ["addr", "port"]);
  if (Object.keys(webAdvanced).length) advanced.webServer = webAdvanced;
  validateProfileAdvanced(advanced);
  const profile = makeProfile({
    name: required(name, "connection name"), version,
    serverAddr: address(parsed.serverAddr, "serverAddr"),
    serverPort: port(parsed.serverPort, "serverPort", 7000),
    user: string(parsed.user, "user", ""), authToken: string(auth.token, "auth.token", ""),
    webPort: port(web.port, "webServer.port", 0, true),
    transport: protocol(transport.protocol), tls: bool(tls.enable, "transport.tls.enable", true),
    advanced,
  });
  const tunnels: Tunnel[] = [];
  const proxies = list(parsed.proxies, "proxies");
  const visitors = list(parsed.visitors, "visitors");
  tunnelCount(proxies.length + visitors.length);
  for (const [role, entries] of [["provider", proxies], ["visitor", visitors]] as const) {
    for (const [index, value] of entries.entries()) {
      const path = (role === "provider" ? "proxies" : "visitors") + "[" + index + "]";
      const item = table(value, path);
      const type = tunnelType(item.type, path + ".type");
      const extension = omit(item, role === "provider"
        ? ["name", "type", "localIP", "localPort", "remotePort", "secretKey", "transport", "enabled"]
        : ["name", "type", "serverName", "bindAddr", "bindPort", "secretKey", "transport", "enabled"]);
      const proxyTransport = optionalTable(item.transport, path + ".transport");
      const transportExtension = omit(proxyTransport, ["useEncryption", "useCompression"]);
      if (Object.keys(transportExtension).length) extension.transport = transportExtension;
      const plugin = item.plugin === undefined ? undefined : table(item.plugin, path + ".plugin");
      if (plugin && (item.localIP !== undefined || item.localPort !== undefined))
        fail(path + " 使用插件时只能指定 plugin 的本地地址", path + " must use only plugin backend settings");
      if (role === "visitor" && item.bindPort === -1) extension.bindPort = -1;
      validateTunnelAdvanced(extension, type, role);
      let localIP = "127.0.0.1";
      let localPort = 8080;
      if (plugin && typeof plugin.localAddr === "string") {
        const match = plugin.localAddr.match(/^\[([^\]]+)\]:(\d+)$/) ?? plugin.localAddr.match(/^([^:]+):(\d+)$/);
        if (match) {
          localIP = address(match[1], path + ".plugin.localAddr");
          localPort = port(Number(match[2]), path + ".plugin.localAddr port");
        }
      } else if (!plugin) {
        localIP = address(role === "visitor" ? (item.bindAddr ?? "127.0.0.1") : (item.localIP ?? "127.0.0.1"), path + ".localIP / bindAddr");
        localPort = role === "visitor" && item.bindPort === -1 ? 8080
          : port(role === "visitor" ? item.bindPort : item.localPort, path + ".localPort / bindPort");
      }
      if (item.remotePort !== undefined && (role !== "provider" || !["tcp", "udp"].includes(type)))
        fail(path + " 此类型不支持 remotePort", path + " does not support remotePort");
      if (item.secretKey !== undefined && !privateTypes.includes(type))
        fail(path + " 此类型不支持 secretKey", path + " does not support secretKey");
      const domains = extension.customDomains === undefined ? [] : extension.customDomains as string[];
      const tunnel = makeTunnel({
        profileId: profile.id, name: required(item.name, path + ".name"), type, role,
        localIP, localPort,
        remotePort: role === "provider" && ["tcp", "udp"].includes(type) ? port(item.remotePort, path + ".remotePort", 0, true) : 0,
        domain: domains[0] ?? "",
        serverName: role === "visitor" ? required(item.serverName, path + ".serverName") : "",
        secretKey: string(item.secretKey, path + ".secretKey", ""),
        encryption: bool(proxyTransport.useEncryption, path + ".transport.useEncryption"),
        compression: bool(proxyTransport.useCompression, path + ".transport.useCompression"),
        https2http: false,
        certPath: string(plugin?.crtPath, path + ".plugin.crtPath", ""),
        keyPath: string(plugin?.keyPath, path + ".plugin.keyPath", ""),
        enabled: bool(item.enabled, path + ".enabled", true),
        advanced: extension,
      });
      validateTunnel(tunnel);
      tunnels.push(tunnel);
    }
  }
  validateProfileExtensions(profile, tunnels);
  uniqueTunnelNames(tunnels);
  return { profile, tunnels, source: "toml" };
}

export function createShareUri(
  profile: Profile,
  tunnels: Tunnel[],
  includeCredentials = false,
): string {
  required(profile.name, "name");
  const serverAddr = address(profile.serverAddr, "serverAddr");
  port(profile.serverPort, "serverPort");
  port(profile.webPort, "webPort", undefined, true);
  protocol(profile.transport);
  const selected = tunnels.filter((tunnel) => tunnel.profileId === profile.id);
  tunnelCount(selected.length);
  selected.forEach(validateTunnel);
  validateProfileExtensions(profile, selected);
  uniqueTunnelNames(selected);
  const payload = {
    format: "frpc-ui",
    schema: 2,
    profile: {
      name: profile.name,
      serverAddr,
      serverPort: profile.serverPort,
      version: profile.version,
      user: profile.user,
      authToken: includeCredentials ? profile.authToken : "",
      webPort: profile.webPort,
      transport: profile.transport,
      tls: profile.tls,
      autoConnect: false,
      advanced: exportAdvanced(profile.advanced, includeCredentials, "profile"),
    },
    tunnels: selected.map(
      ({
        name,
        type,
        localIP,
        localPort,
        localPortEnd,
        remotePort,
        remotePortEnd,
        domain,
        enabled,
        role,
        serverName,
        encryption,
        compression,
        https2http,
        certPath,
        keyPath,
        secretKey,
        advanced,
      }) => ({
        name,
        type,
        localIP: address(localIP, "localIP / bindAddr"),
        localPort,
        localPortEnd,
        remotePort,
        remotePortEnd,
        domain,
        enabled,
        role,
        serverName,
        encryption,
        compression,
        https2http,
        certPath,
        keyPath,
        secretKey: includeCredentials ? secretKey : "",
        advanced: exportAdvanced(advanced, includeCredentials, "tunnel"),
      }),
    ),
  };
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  return checkedSize(`frp://${btoa(
    Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""),
  )
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "")}`);
}

function importShare(
  source: string,
  version: string,
  name: string,
): ConfigPreview {
  let payload: Table;
  try {
    const encoded = source.slice(6);
    if (!/^[A-Za-z0-9_-]+$/.test(encoded)) throw new Error("Invalid base64url");
    const binary = atob(encoded.replaceAll("-", "+").replaceAll("_", "/"));
    payload = table(
      JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(
          Uint8Array.from(binary, (character) => character.charCodeAt(0)),
        ),
      ),
      "share",
    );
  } catch {
    return fail(
      "无效分享链接；只支持 frpc-ui 生成的 frp:// 链接。",
      "Invalid share link. Only frp:// links generated by frpc-ui are supported.",
    );
  }
  keys(payload, ["format", "schema", "profile", "tunnels"], "share");
  if (
    !["frpc-ui", "frpc-ui-prototype"].includes(String(payload.format)) ||
    (payload.schema !== 1 && payload.schema !== 2)
  )
    fail(
      "分享链接格式或版本不支持，不兼容旧客户端协议。",
      "Unsupported share format or version. Legacy client protocols are not supported.",
    );
  const item = table(payload.profile, "share.profile");
  keys(
    item,
    [
      "name",
      "serverAddr",
      "serverPort",
      "version",
      "user",
      "authToken",
      "webPort",
      "transport",
      "tls",
      "autoConnect",
      "advanced",
    ],
    "share.profile",
  );
  required(item.name, "share.profile.name");
  required(item.version, "share.profile.version");
  bool(item.autoConnect, "share.profile.autoConnect");
  const profile = makeProfile({
    name: required(name, "connection name"),
    serverAddr: address(item.serverAddr, "serverAddr"),
    serverPort: port(item.serverPort, "serverPort"),
    version,
    user: string(item.user, "user", ""),
    authToken: string(item.authToken, "authToken", ""),
    webPort: port(item.webPort, "webPort", 0, true),
    transport: protocol(item.transport),
    tls: bool(item.tls, "tls", true),
    autoConnect: false,
    advanced: advancedTable(item.advanced, "share.profile.advanced"),
  });
  const tunnels = list(payload.tunnels, "share.tunnels").map((value, index) => {
    const path = `share.tunnels[${index}]`;
    const row = table(value, path);
    keys(
      row,
      [
        "name",
        "type",
        "localIP",
        "localPort",
        "localPortEnd",
        "remotePort",
        "remotePortEnd",
        "domain",
        "enabled",
        "role",
        "secretKey",
        "serverName",
        "encryption",
        "compression",
        "https2http",
        "certPath",
        "keyPath",
        "advanced",
      ],
      path,
    );
    const role = string(row.role, `${path}.role`, "provider");
    if (role !== "provider" && role !== "visitor")
      fail(`${path}.role 不支持`, `${path}.role is unsupported`);
    const tunnel = makeTunnel({
      name: required(row.name, `${path}.name`),
      profileId: profile.id,
      type: tunnelType(row.type, `${path}.type`),
      role,
      localIP: address(row.localIP, `${path}.localIP`),
      localPort: port(row.localPort, `${path}.localPort`),
      localPortEnd: port(row.localPortEnd, `${path}.localPortEnd`, 0, true),
      remotePort: port(row.remotePort, `${path}.remotePort`, 0, true),
      remotePortEnd: port(row.remotePortEnd, `${path}.remotePortEnd`, 0, true),
      domain: string(row.domain, `${path}.domain`, ""),
      enabled: bool(row.enabled, `${path}.enabled`, true),
      secretKey: string(row.secretKey, `${path}.secretKey`, ""),
      serverName: string(row.serverName, `${path}.serverName`, ""),
      encryption: bool(row.encryption, `${path}.encryption`),
      compression: bool(row.compression, `${path}.compression`),
      https2http: bool(row.https2http, `${path}.https2http`),
      certPath: string(row.certPath, `${path}.certPath`, ""),
      keyPath: string(row.keyPath, `${path}.keyPath`, ""),
      advanced: advancedTable(row.advanced, `${path}.advanced`),
    });
    validateTunnel(tunnel);
    return tunnel;
  });
  uniqueTunnelNames(tunnels);
  validateProfileExtensions(profile, tunnels);
  return { profile, tunnels, source: "share" };
}

export function parseConfigImport(
  source: string,
  version: string,
  name: string,
): ConfigPreview {
  checkedSize(source);
  required(version, "frpc version");
  return source.trim().startsWith("frp://")
    ? importShare(source.trim(), version, name)
    : importToml(source, version, name);
}

export function uniqueProfileName(name: string, profiles: Profile[]): string {
  const base = name.trim();
  let result = base;
  let suffix = 2;
  while (profiles.some((profile) => profile.name === result))
    result = `${base} (${suffix++})`;
  return result;
}
