import { parse, stringify } from "smol-toml";
import {
  makeProfile,
  makeTunnel,
  type Profile,
  type Tunnel,
  type TunnelType,
} from "./model";

type Table = Record<string, unknown>;

export class ConfigError extends Error {
  readonly zh: string;
  readonly en: string;
  constructor(zh: string, en: string) {
    super(zh);
    this.name = "ConfigError";
    this.zh = zh;
    this.en = en;
  }
}

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
];
const privateTypes: TunnelType[] = ["stcp", "sudp", "xtcp"];
const protocols = ["tcp", "kcp", "quic", "websocket", "wss"];
const MAX_INPUT = 1024 * 1024;

function fail(zh: string, en: string): never {
  throw new ConfigError(zh, en);
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
  if (/\s|[@/?#]/.test(host) || host.includes("://"))
    fail(
      `${path} 请填写主机名或 IP，不含协议与路径`,
      `${path} must be a hostname or IP without a scheme or path`,
    );
  try {
    const parsed = new URL(
      `http://${host.includes(":") && !host.startsWith("[") ? `[${host}]` : host}`,
    );
    if (parsed.port || parsed.username || parsed.password)
      throw new Error("Host includes a port or credentials");
  } catch {
    fail(
      `${path} 请填写有效主机名或 IP，端口使用独立字段`,
      `${path} must be a valid hostname or IP; enter the port separately`,
    );
  }
  return host;
}
function domain(value: unknown, path: string): string {
  const name = required(value, path);
  const host = name.startsWith("*.") ? name.slice(2) : name;
  if (
    !host.includes(".") ||
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
  if (!Array.isArray(value) || value.length > 500)
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

function validateTunnel(tunnel: Tunnel): void {
  required(tunnel.name, "name");
  tunnelType(tunnel.type, "type");
  address(tunnel.localIP, "localIP / bindAddr");
  port(tunnel.localPort, "localPort / bindPort");
  if (tunnel.https2http) {
    if (tunnel.role !== "provider" || tunnel.type !== "https")
      fail(
        "HTTPS 转 HTTP 仅支持 HTTPS 提供者",
        "HTTPS to HTTP is supported only for HTTPS providers",
      );
    required(tunnel.certPath, "plugin.crtPath");
    required(tunnel.keyPath, "plugin.keyPath");
  }
  if (tunnel.role === "visitor") {
    if (!privateTypes.includes(tunnel.type))
      fail(
        "只有 STCP、SUDP、XTCP 支持访问者模式",
        "Only STCP, SUDP, and XTCP support visitor mode",
      );
    required(tunnel.serverName, "serverName");
  } else if (tunnel.type === "tcp" || tunnel.type === "udp") {
    port(tunnel.remotePort, "remotePort");
  } else if (tunnel.type === "http" || tunnel.type === "https") {
    domain(tunnel.domain, "customDomains");
  }
  if (tunnel.localPortEnd || tunnel.remotePortEnd) {
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

export function exportProfileToml(
  profile: Profile,
  tunnels: Tunnel[],
  includeCredentials = false,
): string {
  address(profile.serverAddr, "serverAddr");
  port(profile.serverPort, "serverPort");
  port(profile.webPort, "webServer.port", undefined, true);
  protocol(profile.transport);
  const enabled = tunnels.filter(
    (tunnel) => tunnel.profileId === profile.id && tunnel.enabled,
  );
  enabled.forEach(validateTunnel);
  uniqueTunnelNames(enabled);
  const proxies: Table[] = [];
  const visitors: Table[] = [];
  for (const tunnel of enabled) {
    const transport = {
      useEncryption: tunnel.encryption,
      useCompression: tunnel.compression,
    };
    const secret =
      includeCredentials && tunnel.secretKey
        ? { secretKey: tunnel.secretKey }
        : {};
    if (tunnel.role === "visitor") {
      visitors.push({
        name: tunnel.name,
        type: tunnel.type,
        serverName: tunnel.serverName,
        bindAddr: tunnel.localIP,
        bindPort: tunnel.localPort,
        transport,
        ...secret,
      });
      continue;
    }
    const count = tunnel.localPortEnd
      ? tunnel.localPortEnd - tunnel.localPort + 1
      : 1;
    for (let offset = 0; offset < count; offset += 1) {
      const item: Table = {
        name:
          count > 1
            ? `${tunnel.name}-${tunnel.localPort + offset}`
            : tunnel.name,
        type: tunnel.type,
        localIP: tunnel.localIP,
        localPort: tunnel.localPort + offset,
        transport,
      };
      if (tunnel.type === "tcp" || tunnel.type === "udp")
        item.remotePort = tunnel.remotePort + offset;
      if (tunnel.type === "http" || tunnel.type === "https")
        item.customDomains = [tunnel.domain];
      if (tunnel.https2http) {
        delete item.localIP;
        delete item.localPort;
        const localIP =
          tunnel.localIP.includes(":") && !tunnel.localIP.startsWith("[")
            ? `[${tunnel.localIP}]`
            : tunnel.localIP;
        item.plugin = {
          type: "https2http",
          localAddr: `${localIP}:${tunnel.localPort}`,
          crtPath: tunnel.certPath,
          keyPath: tunnel.keyPath,
        };
      }
      if (privateTypes.includes(tunnel.type)) Object.assign(item, secret);
      proxies.push(item);
    }
  }
  const generatedNames = [...proxies, ...visitors].map((item) => item.name);
  if (new Set(generatedNames).size !== generatedNames.length)
    fail(
      "展开端口范围后的隧道名称重复，请调整名称",
      "Tunnel names collide after expanding port ranges",
    );
  const output: Table = {
    serverAddr: profile.serverAddr,
    serverPort: profile.serverPort,
    ...(profile.user ? { user: profile.user } : {}),
    transport: { protocol: profile.transport, tls: { enable: profile.tls } },
    ...(profile.webPort
      ? { webServer: { addr: "127.0.0.1", port: profile.webPort } }
      : {}),
    ...(includeCredentials && profile.authToken
      ? { auth: { method: "token", token: profile.authToken } }
      : {}),
    ...(proxies.length ? { proxies } : {}),
    ...(visitors.length ? { visitors } : {}),
  };
  return `# frpc-ui: ${JSON.stringify(profile.name)}\n# Version is selected in the application. Disabled tunnels are excluded.\n# ${includeCredentials ? "Sensitive credentials may be included." : "Credentials omitted; supply them before connecting if required."}\n\n${stringify(output)}`;
}

function importToml(
  source: string,
  version: string,
  name: string,
): ConfigPreview {
  let parsed: Table;
  try {
    parsed = table(parse(source, { unsafeKeyBehaviour: "throw" }), "config");
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    return fail(
      "TOML 语法错误，请检查引号、配置表和字段类型。",
      "Invalid TOML. Check quoting, tables, and field types.",
    );
  }
  keys(
    parsed,
    [
      "serverAddr",
      "serverPort",
      "user",
      "auth",
      "transport",
      "webServer",
      "proxies",
      "visitors",
    ],
    "config",
  );
  const auth = optionalTable(parsed.auth, "auth");
  keys(auth, ["method", "token"], "auth");
  if (string(auth.method, "auth.method", "token") !== "token")
    fail(
      "当前仅支持 token 认证；OIDC 配置请在完整 frpc 配置中维护。",
      "Only token authentication is supported here. Maintain OIDC in a full frpc configuration.",
    );
  const transport = optionalTable(parsed.transport, "transport");
  keys(transport, ["protocol", "tls"], "transport");
  const tls = optionalTable(transport.tls, "transport.tls");
  keys(tls, ["enable"], "transport.tls");
  const web = optionalTable(parsed.webServer, "webServer");
  keys(web, ["addr", "port"], "webServer");
  if (string(web.addr, "webServer.addr", "127.0.0.1") !== "127.0.0.1")
    fail(
      "管理接口仅支持 127.0.0.1，以免导入后意外暴露到网络。",
      "The management interface supports only 127.0.0.1 to avoid unintended network exposure.",
    );
  const profile = makeProfile({
    name: required(name, "connection name"),
    version,
    serverAddr: address(parsed.serverAddr, "serverAddr"),
    serverPort: port(parsed.serverPort, "serverPort", 7000),
    user: string(parsed.user, "user", ""),
    authToken: string(auth.token, "auth.token", ""),
    webPort: port(web.port, "webServer.port", 0, true),
    transport: protocol(transport.protocol),
    tls: bool(tls.enable, "transport.tls.enable", true),
  });
  const tunnels: Tunnel[] = [];
  for (const [role, entries] of [
    ["provider", list(parsed.proxies, "proxies")],
    ["visitor", list(parsed.visitors, "visitors")],
  ] as const) {
    for (const [index, value] of entries.entries()) {
      const path = `${role === "provider" ? "proxies" : "visitors"}[${index}]`;
      const item = table(value, path);
      keys(
        item,
        role === "provider"
          ? [
              "name",
              "type",
              "localIP",
              "localPort",
              "remotePort",
              "customDomains",
              "secretKey",
              "transport",
              "plugin",
            ]
          : [
              "name",
              "type",
              "serverName",
              "bindAddr",
              "bindPort",
              "secretKey",
              "transport",
            ],
        path,
      );
      const type = tunnelType(item.type, `${path}.type`);
      const plugin = optionalTable(item.plugin, `${path}.plugin`);
      keys(
        plugin,
        ["type", "localAddr", "crtPath", "keyPath"],
        `${path}.plugin`,
      );
      let pluginIP = "";
      let pluginPort = 0;
      if (item.plugin !== undefined) {
        if (
          role !== "provider" ||
          type !== "https" ||
          plugin.type !== "https2http"
        )
          fail(
            `${path} 仅支持 HTTPS 的 https2http 插件`,
            `${path} supports only the https2http plugin for HTTPS`,
          );
        if (item.localIP !== undefined || item.localPort !== undefined)
          fail(
            `${path} 使用插件时请仅配置 plugin.localAddr，避免两种本地地址冲突`,
            `${path} must use only plugin.localAddr when using a plugin`,
          );
        const localAddr = required(
          plugin.localAddr,
          `${path}.plugin.localAddr`,
        );
        const match =
          localAddr.match(/^\[([^\]]+)\]:(\d+)$/) ??
          localAddr.match(/^([^:]+):(\d+)$/);
        if (!match)
          fail(
            `${path}.plugin.localAddr 必须为 IP:端口，IPv6 使用方括号`,
            `${path}.plugin.localAddr must be host:port; bracket IPv6 addresses`,
          );
        pluginIP = address(match[1], `${path}.plugin.localAddr`);
        pluginPort = port(Number(match[2]), `${path}.plugin.localAddr port`);
      }
      if (role === "visitor" && !privateTypes.includes(type))
        fail(
          `${path} 仅支持 STCP、SUDP、XTCP 访问者`,
          `${path} supports only STCP, SUDP, and XTCP visitors`,
        );
      const proxyTransport = optionalTable(item.transport, `${path}.transport`);
      keys(
        proxyTransport,
        ["useEncryption", "useCompression"],
        `${path}.transport`,
      );
      let customDomain = "";
      if (type === "http" || type === "https") {
        const domains = list(item.customDomains, `${path}.customDomains`);
        if (domains.length !== 1)
          fail(
            `${path}.customDomains 当前须恰好包含一个域名`,
            `${path}.customDomains currently requires exactly one domain`,
          );
        customDomain = domain(domains[0], `${path}.customDomains[0]`);
      } else if (item.customDomains !== undefined)
        fail(
          `${path} 的此类型不支持域名字段`,
          `${path} does not support domain fields for this type`,
        );
      if (item.remotePort !== undefined && !["tcp", "udp"].includes(type))
        fail(
          `${path} 的此类型不支持 remotePort`,
          `${path} does not support remotePort for this type`,
        );
      if (item.secretKey !== undefined && !privateTypes.includes(type))
        fail(
          `${path} 的此类型不支持 secretKey`,
          `${path} does not support secretKey for this type`,
        );
      const tunnel = makeTunnel({
        profileId: profile.id,
        name: required(item.name, `${path}.name`),
        type,
        role,
        localIP:
          pluginIP ||
          address(
            role === "visitor"
              ? (item.bindAddr ?? "127.0.0.1")
              : (item.localIP ?? "127.0.0.1"),
            `${path}.localIP / bindAddr`,
          ),
        localPort:
          pluginPort ||
          port(
            role === "visitor" ? item.bindPort : item.localPort,
            `${path}.localPort / bindPort`,
          ),
        remotePort:
          role === "provider" && ["tcp", "udp"].includes(type)
            ? port(item.remotePort, `${path}.remotePort`)
            : 0,
        domain: customDomain,
        serverName:
          role === "visitor"
            ? required(item.serverName, `${path}.serverName`)
            : "",
        secretKey: string(item.secretKey, `${path}.secretKey`, ""),
        encryption: bool(
          proxyTransport.useEncryption,
          `${path}.transport.useEncryption`,
        ),
        compression: bool(
          proxyTransport.useCompression,
          `${path}.transport.useCompression`,
        ),
        https2http: item.plugin !== undefined,
        certPath: string(plugin.crtPath, `${path}.plugin.crtPath`, ""),
        keyPath: string(plugin.keyPath, `${path}.plugin.keyPath`, ""),
      });
      validateTunnel(tunnel);
      tunnels.push(tunnel);
    }
  }
  uniqueTunnelNames(tunnels);
  return { profile, tunnels, source: "toml" };
}

export function createShareUri(
  profile: Profile,
  tunnels: Tunnel[],
  includeCredentials = false,
): string {
  required(profile.name, "name");
  address(profile.serverAddr, "serverAddr");
  port(profile.serverPort, "serverPort");
  port(profile.webPort, "webPort", undefined, true);
  protocol(profile.transport);
  const selected = tunnels.filter((tunnel) => tunnel.profileId === profile.id);
  selected.forEach(validateTunnel);
  uniqueTunnelNames(selected);
  const payload = {
    format: "frpc-ui-prototype",
    schema: 1,
    profile: {
      name: profile.name,
      serverAddr: profile.serverAddr,
      serverPort: profile.serverPort,
      version: profile.version,
      user: profile.user,
      authToken: includeCredentials ? profile.authToken : "",
      webPort: profile.webPort,
      transport: profile.transport,
      tls: profile.tls,
      autoConnect: false,
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
      }) => ({
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
        secretKey: includeCredentials ? secretKey : "",
      }),
    ),
  };
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  return `frp://${btoa(
    Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""),
  )
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "")}`;
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
      "无效分享链接；只支持本原型生成的 frp:// 链接。",
      "Invalid share link. Only frp:// links generated by this prototype are supported.",
    );
  }
  keys(payload, ["format", "schema", "profile", "tunnels"], "share");
  if (payload.format !== "frpc-ui-prototype" || payload.schema !== 1)
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
    });
    validateTunnel(tunnel);
    return tunnel;
  });
  uniqueTunnelNames(tunnels);
  return { profile, tunnels, source: "share" };
}

export function parseConfigImport(
  source: string,
  version: string,
  name: string,
): ConfigPreview {
  if (!source.trim() || source.length > MAX_INPUT)
    fail(
      "配置不能为空且不得超过 1 MB",
      "Configuration must not be empty or exceed 1 MB",
    );
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
