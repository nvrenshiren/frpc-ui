import type { TunnelType } from "./model";
import { getConfigurationVersionState, getUnsupportedAdvancedPaths } from "./configCapabilities";

export type AdvancedConfig = Record<string, unknown>;
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

type Check = (value: unknown, path: string) => void;
type Schema = Record<string, Check>;
function error(path: string, message: string, english: string): never {
  throw new ConfigError(`${path}：${message}`, `${path}: ${english}`);
}
export function advancedTable(value: unknown, path = "advanced"): AdvancedConfig {
  if (value === undefined) return {};
  if (!value || typeof value !== "object" || Array.isArray(value) || value instanceof Date)
    error(path, "必须是配置对象", "must be a configuration object");
  return value as AdvancedConfig;
}
function object(schema: Schema): Check {
  return (value, path) => {
    const record = advancedTable(value, path);
    for (const [key, entry] of Object.entries(record)) {
      if (!["__proto__", "constructor", "prototype"].includes(key) && Object.hasOwn(schema, key))
        schema[key](entry, `${path}.${key}`);
      else error(`${path}.${key}`, "未知或不适用的高级字段", "unknown or inapplicable advanced field");
    }
  };
}
const text: Check = (value, path) => {
  if (typeof value !== "string" || /[\u0000-\u001f\u007f]/.test(value) || new TextEncoder().encode(value).byteLength > 65536)
    error(path, "必须是不含控制字符的文本", "must be text without control characters");
};
const requiredText: Check = (value, path) => {
  text(value, path);
  if (!(value as string).trim()) error(path, "不能为空", "must not be empty");
};
const flag: Check = (value, path) => {
  if (typeof value !== "boolean") error(path, "必须是布尔值", "must be a boolean");
};
const integer = (minimum = 0, maximum = 2_147_483_647): Check => (value, path) => {
  if (typeof value !== "number" || !Number.isInteger(value) || value < minimum || value > maximum)
    error(path, `必须是 ${minimum}–${maximum} 的整数`, `must be an integer from ${minimum} to ${maximum}`);
};
const choice = (...allowed: string[]): Check => (value, path) => {
  if (typeof value !== "string" || !allowed.includes(value))
    error(path, `可选值为 ${allowed.join("、")}`, `must be one of ${allowed.join(", ")}`);
};
const strings: Check = (value, path) => {
  if (!Array.isArray(value) || value.length > 500) error(path, "必须是最多 500 项的文本数组", "must be a string array of at most 500 entries");
  value.forEach((item, index) => text(item, `${path}[${index}]`));
};
const stringMap: Check = (value, path) => {
  const map = advancedTable(value, path);
  if (Object.keys(map).length > 500) error(path, "字典最多支持500项", "dictionary supports at most 500 entries");
  let bytes = 0;
  for (const [key, entry] of Object.entries(map)) {
    if (["__proto__", "constructor", "prototype"].includes(key)) error(path, "不允许此键名", "unsafe key");
    requiredText(key, `${path} key`);
    text(entry, `${path}.${key}`);
    bytes += new TextEncoder().encode(key + entry).byteLength;
  }
  if (bytes > 256 * 1024) error(path, "字典大小不能超过256 KiB", "dictionary cannot exceed 256 KiB");
};
const url: Check = (value, path) => {
  text(value, path);
  if (value === "") return;
  try {
    const parsed = new URL(value as string);
    if (!/^https?:\/\//i.test(value as string) || !["http:", "https:"].includes(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password) throw new Error();
  } catch { error(path, "必须是 HTTP/HTTPS URL", "must be an HTTP/HTTPS URL"); }
};
const proxyURL: Check = (value, path) => {
  text(value, path);
  if (value === "") return;
  try {
    const parsed = new URL(value as string);
    if (!/^(?:http|https|socks5):\/\//i.test(value as string) || !["http:", "https:", "socks5:"].includes(parsed.protocol) || !parsed.hostname) throw new Error();
  } catch { error(path, "必须是 HTTP/HTTPS/SOCKS5 代理 URL", "must be an HTTP/HTTPS/SOCKS5 proxy URL"); }
};
const endpoint: Check = (value, path) => {
  requiredText(value, path);
  const match = (value as string).match(/^\[([^\]]+)\]:(\d+)$/) ?? (value as string).match(/^([^:]+):(\d+)$/);
  if (!match) error(path, "需要 host:port，IPv6 需要方括号", "requires host:port with bracketed IPv6");
  const host = match[1];
  let valid = host.length <= 255;
  if (host.includes(":")) {
    try { valid = valid && new URL(`http://[${host}]`).hostname.startsWith("["); }
    catch { valid = false; }
  } else valid = valid && host.split(".").every((part) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(part));
  if (!valid) error(path, "本地目标主机名或 IP 无效", "invalid backend hostname or IP");
  integer(1, 65535)(Number(match[2]), path + " port");
};
const headerName = (value: string) => /^[!#$%&'*+.^_`|~\da-z-]+$/i.test(value);
const headers: Check = (value, path) => {
  object({ set: stringMap })(value, path);
  for (const name of Object.keys(advancedTable(advancedTable(value).set)))
    if (!headerName(name)) error(path + ".set", "HTTP 请求头名称无效", "invalid HTTP header name");
};
const tlsFields: Schema = { certFile: text, keyFile: text, trustedCaFile: text, serverName: text };
function pair(value: AdvancedConfig, left: string, right: string, path: string): void {
  if (Boolean(value[left]) !== Boolean(value[right]))
    error(path, `${left} 与 ${right} 必须同时填写或同时省略`, `${left} and ${right} must be supplied together or both omitted`);
}
const tls: Check = (value, path) => {
  object(tlsFields)(value, path);
  pair(advancedTable(value), "certFile", "keyFile", path);
};
const tokenSource: Check = (value, path) => {
  object({ type: choice("file"), file: object({ path: requiredText }) })(value, path);
  const source = advancedTable(value);
  if (source.type !== "file" || !advancedTable(source.file).path)
    error(path, "仅支持 type=file 且需要 file.path；执行型来源尚未启用", "only type=file with file.path is supported; executable sources are not enabled");
  if (!/^(?:[a-z]:[\\/]|\\\\[^\\/]+[\\/][^\\/]+)/i.test(advancedTable(source.file).path as string))
    error(path + ".file.path", "需要 Windows 盘符根路径或 UNC 绝对路径", "requires a Windows drive-root or UNC absolute file path");
};
const oidcFields: Schema = {
  clientID: text, clientSecret: text, audience: text, scope: text,
  tokenEndpointURL: url, additionalEndpointParams: stringMap,
  trustedCaFile: text, insecureSkipVerify: flag, proxyURL, tokenSource,
};
const authFields: Schema = {
  method: choice("token", "oidc"),
  additionalScopes: (value, path) => {
    strings(value, path);
    (value as string[]).forEach((scope, index) => choice("HeartBeats", "NewWorkConns")(scope, `${path}[${index}]`));
  },
  oidc: object(oidcFields), tokenSource,
};
const transportFields: Schema = {
  wireProtocol: choice("v1", "v2"), dialServerTimeout: integer(),
  dialServerKeepalive: integer(-2_147_483_648), connectServerLocalIP: text, proxyURL,
  poolCount: integer(), tcpMux: flag, tcpMuxKeepaliveInterval: integer(),
  heartbeatInterval: integer(-2_147_483_648), heartbeatTimeout: integer(-2_147_483_648),
  quic: object({ keepalivePeriod: integer(), maxIdleTimeout: integer(), maxIncomingStreams: integer() }),
  tls: (value, path) => {
    object({ ...tlsFields, disableCustomTLSFirstByte: flag })(value, path);
    pair(advancedTable(value), "certFile", "keyFile", path);
  },
};
const profileFields: Schema = {
  clientID: text, natHoleStunServer: text, dnsServer: text,
  udpPacketSize: integer(0, 65535), metadatas: stringMap,
  auth: object(authFields), transport: object(transportFields),
  webServer: object({ user: text, password: text, assetsDir: text, pprofEnable: flag, tls }),
};
export const PROFILE_ADVANCED_FIELDS = Object.keys(profileFields);

export function validateProfileAdvanced(value: unknown, protocol?: string, fixedToken?: string): void {
  const advanced = advancedTable(value);
  object(profileFields)(advanced, "advanced");
  const auth = advancedTable(advanced.auth);
  const method = auth.method ?? "token";
  if (fixedToken && (method === "oidc" || auth.tokenSource !== undefined))
    error("advanced.auth", "OIDC 或来源不能同时使用固定 token", "OIDC or a source cannot be combined with a fixed token");
  const transport = advancedTable(advanced.transport);
  const interval = Number(transport.heartbeatInterval ?? 0);
  const timeout = Number(transport.heartbeatTimeout ?? 0);
  if (interval > 0 && timeout > 0 && timeout < interval)
    error("advanced.transport.heartbeatTimeout", "不能小于心跳间隔", "must not be shorter than the heartbeat interval");
  if (transport.connectServerLocalIP) {
    const ip = transport.connectServerLocalIP as string;
    let validIP = /^(?:0|[1-9]\d{0,2})(?:\.(?:0|[1-9]\d{0,2})){3}$/.test(ip) && ip.split(".").every((part) => Number(part) <= 255);
    if (ip.includes(":") && !ip.includes("[")) {
      try { validIP = new URL(`http://[${ip}]`).hostname.startsWith("["); } catch { validIP = false; }
    }
    if (!validIP) error("advanced.transport.connectServerLocalIP", "需要有效裸 IP 地址", "requires a valid unbracketed IP address");
  }
  if (protocol !== undefined) {
    if (transport.quic !== undefined && protocol !== "quic") error("advanced.transport.quic", "仅适用于 QUIC 连接", "requires QUIC transport");
    if ((transport.proxyURL || transport.connectServerLocalIP) && !["tcp", "websocket", "wss"].includes(protocol))
      error("advanced.transport", "代理与源 IP 仅适用于 TCP/WebSocket/WSS", "proxy and source IP require TCP/WebSocket/WSS transport");
  }
  if (method === "token" && auth.oidc !== undefined)
    error("advanced.auth.oidc", "仅适用于 OIDC 认证", "requires OIDC authentication");
  if (method === "oidc") {
    if (auth.tokenSource !== undefined) error("advanced.auth.tokenSource", "OIDC 来源请放在 oidc.tokenSource", "OIDC sources belong in oidc.tokenSource");
    const oidc = advancedTable(auth.oidc);
    const params = advancedTable(oidc.additionalEndpointParams);
    if (params.scope !== undefined || (oidc.audience && params.audience !== undefined))
      error("advanced.auth.oidc.additionalEndpointParams", "scope 不可重复设置，audience 不能与专用字段重复", "scope must use its dedicated field; audience must not be specified twice");
    if (oidc.tokenSource !== undefined) {
      if (Object.entries(oidc).some(([key, entry]) => key !== "tokenSource" && entry !== "" && entry !== false && (typeof entry !== "object" || Object.keys(advancedTable(entry)).length > 0)))
        error("advanced.auth.oidc", "tokenSource 不能与其它 OIDC 参数同时设置", "tokenSource cannot be combined with other OIDC parameters");
    } else {
      requiredText(oidc.clientID, "advanced.auth.oidc.clientID");
      requiredText(oidc.tokenEndpointURL, "advanced.auth.oidc.tokenEndpointURL");
      url(oidc.tokenEndpointURL, "advanced.auth.oidc.tokenEndpointURL");
    }
  }
}

const natTraversal = object({ disableAssistedAddrs: flag });
const pluginSchemas: Record<string, Schema> = {
  http2https: { localAddr: endpoint, hostHeaderRewrite: text, requestHeaders: headers },
  http2http: { localAddr: endpoint, hostHeaderRewrite: text, requestHeaders: headers },
  https2http: { localAddr: endpoint, hostHeaderRewrite: text, requestHeaders: headers, enableHTTP2: flag, crtPath: text, keyPath: text },
  https2https: { localAddr: endpoint, hostHeaderRewrite: text, requestHeaders: headers, enableHTTP2: flag, crtPath: text, keyPath: text },
  http_proxy: { httpUser: text, httpPassword: text },
  socks5: { username: text, password: text },
  static_file: { localPath: requiredText, stripPrefix: text, httpUser: text, httpPassword: text },
  unix_domain_socket: { unixPath: requiredText },
  tls2raw: { localAddr: endpoint, crtPath: text, keyPath: text },
};
export const PLUGIN_TYPES = Object.keys(pluginSchemas);
export const PLUGIN_FIELDS = Object.fromEntries(Object.entries(pluginSchemas).map(([name, fields]) => [name, Object.keys(fields)]));
const plugin: Check = (value, path) => {
  const config = advancedTable(value, path);
  choice(...PLUGIN_TYPES)(config.type, `${path}.type`);
  const schema = pluginSchemas[config.type as string];
  object({ type: choice(...PLUGIN_TYPES), ...schema })(value, path);
  for (const name of ["localAddr", "localPath", "unixPath"]) {
    if (Object.hasOwn(schema, name)) requiredText(config[name], `${path}.${name}`);
  }
  pair(config, "crtPath", "keyPath", path);
  if (config.type === "unix_domain_socket" && !/^(?:[a-z]:[\\/]|\\\\[^\\/]+[\\/][^\\/]+)/i.test(config.unixPath as string))
    error(`${path}.unixPath`, "需要 Windows 盘符根或 UNC 绝对 socket 路径", "requires a Windows drive-root or UNC absolute socket path");
};
const commonFields: Schema = {
  annotations: stringMap, metadatas: stringMap,
  transport: object({
    bandwidthLimit: (value, path) => {
      text(value, path);
      const quantity = (value as string).trim();
      if (quantity === "") return;
      const match = quantity.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)(KB|MB)$/);
      if (!match || !Number.isFinite(Number(match[1])) || Number(match[1]) < 0) error(path, "格式为 100KB 或 1MB，单位区分大小写", "must be a nonnegative quantity with uppercase KB or MB units");
    },
    bandwidthLimitMode: choice("client", "server"), proxyProtocolVersion: choice("", "v1", "v2"),
  }),
  loadBalancer: object({ group: text, groupKey: text }),
  healthCheck: (value, path) => {
    object({
      type: choice("", "tcp", "http"), timeoutSeconds: integer(), maxFailed: integer(), intervalSeconds: integer(), path: text,
      httpHeaders: (entries, headerPath) => {
        if (!Array.isArray(entries) || entries.length > 500) error(headerPath, "必须是最多500项的请求头数组", "must be a header array of at most 500 entries");
        entries.forEach((entry, index) => {
          object({ name: requiredText, value: text })(entry, `${headerPath}[${index}]`);
          const header = advancedTable(entry);
          requiredText(header.name, `${headerPath}[${index}].name`);
          if (!headerName(header.name as string)) error(headerPath, "请求头名称无效", "invalid HTTP header name");
          text(header.value, `${headerPath}[${index}].value`);
        });
      },
    })(value, path);
    if (advancedTable(value).type === "http" && !(advancedTable(value).path as string | undefined)?.startsWith("/")) error(path + ".path", "HTTP 健康检查路径必须以 / 开头", "HTTP health check path must begin with /");
  },
  plugin,
};
const domainFields: Schema = {
  customDomains: (value, path) => {
    strings(value, path);
    (value as string[]).forEach((name, index) => {
      const plain = name.replace(/^\*\./, "");
      if (!plain.includes(".") || plain.length > 255 || /^\d+(?:\.\d+){3}$/.test(plain) || !plain.split(".").every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label)))
        error(`${path}[${index}]`, "必须是有效域名", "must be a valid hostname domain");
    });
  },
  subdomain: (value, path) => {
    text(value, path);
    if (value !== "" && !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(value as string)) error(path, "必须是单个子域名标签", "must be a single subdomain label");
  },
};
const webAuth: Schema = { httpUser: text, httpPassword: text, routeByHTTPUser: text };
const httpFields: Schema = {
  locations: (value, path) => {
    strings(value, path);
    if (!(value as string[]).every((item) => item.startsWith("/"))) error(path, "HTTP 路径必须以 / 开头", "HTTP locations must begin with /");
  }, hostHeaderRewrite: text, requestHeaders: headers, responseHeaders: headers,
};
const xtcpVisitorFields: Schema = {
  protocol: choice("kcp", "quic"), keepTunnelOpen: flag,
  maxRetriesAnHour: integer(), minRetryInterval: integer(), fallbackTo: text, fallbackTimeoutMs: integer(), natTraversal,
};
export function validateTunnelAdvanced(value: unknown, type: TunnelType, role: "provider" | "visitor"): void {
  const advanced = advancedTable(value);
  if (role === "visitor") {
    if (!["stcp", "sudp", "xtcp"].includes(type)) error("advanced", "此协议不支持访问者", "this protocol does not support visitors");
    object({
      serverUser: text,
      ...(type !== "sudp" ? { bindPort: (port, path) => { if (port !== -1) error(path, "只支持 -1 关闭监听", "only -1 disables listening"); } } : {}),
      ...(type === "xtcp" ? xtcpVisitorFields : {}),
    })(advanced, "advanced");
    return;
  }
  object({
    ...commonFields,
    ...(["http", "https", "tcpmux"].includes(type) ? domainFields : {}),
    ...(["http", "tcpmux"].includes(type) ? webAuth : {}),
    ...(type === "http" ? httpFields : {}),
    ...(["stcp", "sudp", "xtcp"].includes(type) ? { allowUsers: strings } : {}),
    ...(type === "xtcp" ? { natTraversal } : {}),
    ...(type === "tcpmux" ? { multiplexer: choice("httpconnect") } : {}),
  })(advanced, "advanced");
  if (advanced.plugin !== undefined && ["udp", "sudp"].includes(type)) error("advanced.plugin", "插件仅支持流式提供者", "plugins require a stream provider");
  if (advanced.loadBalancer !== undefined && !["tcp", "http", "https", "tcpmux"].includes(type)) error("advanced.loadBalancer", "负载均衡仅适用于 TCP/HTTP/HTTPS/TCPMUX", "load balancing requires TCP/HTTP/HTTPS/TCPMUX");
}

function stripProxyCredentials(record: AdvancedConfig): void {
  if (typeof record.proxyURL !== "string" || !record.proxyURL) return;
  const parsed = new URL(record.proxyURL);
  if (parsed.username || parsed.password) delete record.proxyURL;
}
export function exportAdvanced(value: unknown, credentials: boolean, kind: "profile" | "tunnel"): AdvancedConfig {
  const result = structuredClone(advancedTable(value));
  if (credentials) return result;
  delete result.metadatas;
  delete result.annotations;
  if (kind === "profile") {
    const auth = advancedTable(result.auth);
    delete auth.tokenSource;
    const oidc = advancedTable(auth.oidc);
    delete oidc.clientSecret;
    delete oidc.tokenSource;
    delete oidc.additionalEndpointParams;
    stripProxyCredentials(oidc);
    if (auth.method === "oidc" && !oidc.clientID && !oidc.tokenEndpointURL)
      error("export", "仅来源的 OIDC 配置需要勾选包含凭据，或先配置客户端认证参数", "source-only OIDC requires including credentials or configuring client authentication parameters before export");
    const web = advancedTable(result.webServer);
    delete web.password;
    delete web.user;
    stripProxyCredentials(advancedTable(result.transport));
  } else {
    delete result.httpPassword;
    delete result.httpUser;
    delete result.requestHeaders;
    delete result.responseHeaders;
    delete advancedTable(result.loadBalancer).groupKey;
    delete advancedTable(result.healthCheck).httpHeaders;
    const options = advancedTable(result.plugin);
    for (const key of ["httpPassword", "httpUser", "password", "username", "requestHeaders"]) delete options[key];
  }
  return result;
}

export function validateAdvancedVersion(profile: AdvancedConfig, tunnels: AdvancedConfig[], version: string): void {
  const state = getConfigurationVersionState(version);
  if (!state.supported) throw new ConfigError(state.reasonZh, state.reasonEn);
  const unsupported = [
    ...getUnsupportedAdvancedPaths(profile, version, "profile"),
    ...tunnels.flatMap((tunnel) => getUnsupportedAdvancedPaths(tunnel, version, "tunnel")),
  ];
  if (unsupported.length) throw new ConfigError(unsupported[0].path + "：" + unsupported[0].reasonZh, unsupported[0].path + ": " + unsupported[0].reasonEn);
}
