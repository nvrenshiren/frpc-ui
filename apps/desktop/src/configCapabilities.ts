import type { TunnelType } from "./model";

export type ConfigurationScope = "profile" | "tunnel";
export interface ConfigurationField {
  key: string;
  labelZh: string;
  labelEn: string;
  scope: ConfigurationScope;
  group: string;
  minVersion: string;
  kind: "field" | "choice";
  condition?: {
    protocols?: string[];
    roles?: ("provider" | "visitor")[];
    pluginTypes?: string[];
    authMethods?: string[];
  };
}
export interface ConfigCapability {
  supported: boolean;
  minVersion: string;
  reasonZh: string;
  reasonEn: string;
}
export interface UnsupportedAdvancedPath extends ConfigCapability { path: string }

const fields: ConfigurationField[] = [];
function add(scope: ConfigurationScope, group: string, keys: string[], minimum = 52, condition?: ConfigurationField["condition"], kind: ConfigurationField["kind"] = "field") {
  for (const key of keys) fields.push({ key, labelZh: key, labelEn: key, scope, group, minVersion: `0.${minimum}.0`, kind, condition });
}
add("profile", "基础连接", ["serverAddr", "serverPort", "user", "auth.token", "transport.protocol", "transport.tls.enable", "webServer.addr", "webServer.port", "loginFailExit", "log.to", "log.level", "log.disablePrintColor"]);
add("profile", "连接高级", ["natHoleStunServer", "dnsServer", "udpPacketSize", "metadatas"]);
add("profile", "连接身份", ["clientID"], 67);
add("profile", "认证", ["auth.method", "auth.additionalScopes", "auth.oidc.clientID", "auth.oidc.clientSecret", "auth.oidc.audience", "auth.oidc.scope", "auth.oidc.tokenEndpointURL", "auth.oidc.additionalEndpointParams"]);
add("profile", "OIDC TLS 与代理", ["auth.oidc.trustedCaFile", "auth.oidc.insecureSkipVerify", "auth.oidc.proxyURL"], 65, { authMethods: ["oidc"] });
add("profile", "Token 文件来源", ["auth.tokenSource", "auth.tokenSource.type", "auth.tokenSource.file.path"], 64, { authMethods: ["token"] });
add("profile", "OIDC 文件来源", ["auth.oidc.tokenSource", "auth.oidc.tokenSource.type", "auth.oidc.tokenSource.file.path"], 66, { authMethods: ["oidc"] });
add("profile", "传输", ["transport.dialServerTimeout", "transport.dialServerKeepalive", "transport.poolCount", "transport.tcpMux", "transport.tcpMuxKeepaliveInterval", "transport.heartbeatInterval", "transport.heartbeatTimeout"]);
add("profile", "传输", ["transport.proxyURL"], 52, { protocols: ["tcp", "websocket", "wss"] });
add("profile", "传输", ["transport.connectServerLocalIP"], 52, { protocols: ["tcp", "websocket", "wss"] });
add("profile", "Wire 协议", ["transport.wireProtocol"], 69);
add("profile", "QUIC", ["transport.quic.keepalivePeriod", "transport.quic.maxIdleTimeout", "transport.quic.maxIncomingStreams"], 52, { protocols: ["quic"] });
add("profile", "TLS", ["transport.tls.certFile", "transport.tls.keyFile", "transport.tls.trustedCaFile", "transport.tls.serverName", "transport.tls.disableCustomTLSFirstByte"]);
add("profile", "本机管理", ["webServer.user", "webServer.password", "webServer.assetsDir", "webServer.pprofEnable", "webServer.tls.certFile", "webServer.tls.keyFile", "webServer.tls.trustedCaFile", "webServer.tls.serverName"]);
add("profile", "传输协议", ["tcp", "kcp", "quic", "websocket", "wss"].map((name) => "transport.protocol." + name), 52, undefined, "choice");
add("profile", "认证方式", ["auth.method.token", "auth.method.oidc"], 52, undefined, "choice");

const provider = { roles: ["provider"] as ("provider" | "visitor")[] };
const visitor = { roles: ["visitor"] as ("provider" | "visitor")[] };
const domainProtocols = ["http", "https", "tcpmux"];
const streamProtocols = ["tcp", "stcp", "xtcp", "http", "https", "tcpmux"];
add("tunnel", "基础隧道", ["name", "type", "enabled", "transport.useEncryption", "transport.useCompression"]);
add("tunnel", "本地后端", ["localIP", "localPort"], 52, provider);
add("tunnel", "远程端口", ["remotePort"], 52, { ...provider, protocols: ["tcp", "udp"] });
add("tunnel", "访问者", ["serverName", "serverUser", "bindAddr", "bindPort"], 52, { ...visitor, protocols: ["stcp", "sudp", "xtcp"] });
add("tunnel", "私有隧道", ["secretKey"], 52, { protocols: ["stcp", "sudp", "xtcp"] });
add("tunnel", "访问权限", ["allowUsers"], 52, { ...provider, protocols: ["stcp", "sudp", "xtcp"] });
add("tunnel", "域名", ["customDomains", "subdomain"], 52, { ...provider, protocols: domainProtocols });
add("tunnel", "元数据", ["metadatas"], 52, provider);
add("tunnel", "注解", ["annotations"], 55, provider);
add("tunnel", "代理传输", ["transport.bandwidthLimit", "transport.bandwidthLimitMode", "transport.proxyProtocolVersion"], 52, provider);
add("tunnel", "负载均衡", ["loadBalancer.group", "loadBalancer.groupKey"], 52, { ...provider, protocols: ["tcp", "http", "https", "tcpmux"] });
add("tunnel", "健康检查", ["healthCheck.type", "healthCheck.timeoutSeconds", "healthCheck.maxFailed", "healthCheck.intervalSeconds", "healthCheck.path"], 52, provider);
add("tunnel", "健康检查", ["healthCheck.httpHeaders"], 56, provider);
add("tunnel", "HTTP", ["httpUser", "httpPassword", "routeByHTTPUser"], 52, { ...provider, protocols: ["http", "tcpmux"] });
add("tunnel", "HTTP", ["locations", "hostHeaderRewrite", "requestHeaders.set"], 52, { ...provider, protocols: ["http"] });
add("tunnel", "HTTP 响应头", ["responseHeaders.set"], 58, { ...provider, protocols: ["http"] });
add("tunnel", "TCPMUX", ["multiplexer"], 52, { ...provider, protocols: ["tcpmux"] });
add("tunnel", "XTCP", ["protocol", "keepTunnelOpen", "maxRetriesAnHour", "minRetryInterval", "fallbackTo", "fallbackTimeoutMs"], 52, { ...visitor, protocols: ["xtcp"] });
add("tunnel", "NAT 穿透", ["natTraversal.disableAssistedAddrs"], 65, { protocols: ["xtcp"] });
add("tunnel", "隧道协议", ["tcp", "udp", "http", "https", "stcp", "sudp", "xtcp", "tcpmux"].map((name) => "type." + name), 52, undefined, "choice");

const plugins = ["http2https", "http2http", "https2http", "https2https", "http_proxy", "socks5", "static_file", "unix_domain_socket", "tls2raw"];
add("tunnel", "插件", ["plugin.type"], 52, { ...provider, protocols: streamProtocols });
for (const pluginType of plugins) add("tunnel", "插件类型", ["plugin.type." + pluginType], pluginType === "tls2raw" ? 60 : pluginType === "http2http" ? 59 : 52, { ...provider, protocols: streamProtocols, pluginTypes: [pluginType] }, "choice");
add("tunnel", "插件目标", ["plugin.localAddr"], 52, { ...provider, protocols: streamProtocols, pluginTypes: ["http2https", "http2http", "https2http", "https2https", "tls2raw"] });
add("tunnel", "插件 HTTP", ["plugin.hostHeaderRewrite", "plugin.requestHeaders.set"], 52, { ...provider, pluginTypes: ["http2https", "http2http", "https2http", "https2https"] });
add("tunnel", "插件 HTTP/2", ["plugin.enableHTTP2"], 59, { ...provider, pluginTypes: ["https2http", "https2https"] });
add("tunnel", "插件 TLS", ["plugin.crtPath", "plugin.keyPath"], 52, { ...provider, pluginTypes: ["https2http", "https2https", "tls2raw"] });
add("tunnel", "插件认证", ["plugin.httpUser", "plugin.httpPassword"], 52, { ...provider, pluginTypes: ["http_proxy", "static_file"] });
add("tunnel", "SOCKS5", ["plugin.username", "plugin.password"], 52, { ...provider, pluginTypes: ["socks5"] });
add("tunnel", "静态文件", ["plugin.localPath", "plugin.stripPrefix"], 52, { ...provider, pluginTypes: ["static_file"] });
add("tunnel", "Unix socket", ["plugin.unixPath"], 52, { ...provider, pluginTypes: ["unix_domain_socket"] });
for (const field of fields) {
  if (field.key.startsWith("plugin.") && field.condition && !field.condition.protocols) field.condition.protocols = streamProtocols;
  if (field.scope === "profile" && field.key.startsWith("auth.oidc.") && !field.condition) field.condition = { authMethods: ["oidc"] };
}
export const configurationFields: readonly ConfigurationField[] = fields;

export function getConfigurationVersionState(version: string): { supported: boolean; audited: boolean; kind: string; reasonZh: string; reasonEn: string } {
  const match = version.match(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
  if (!match) return { supported: false, audited: false, kind: "invalid", reasonZh: "版本号必须是 major.minor.patch", reasonEn: "Version must be major.minor.patch" };
  const [major, minor, patch] = match.slice(1).map(Number);
  if (![major, minor, patch].every(Number.isSafeInteger)) return { supported: false, audited: false, kind: "invalid", reasonZh: "版本号数字超出支持范围", reasonEn: "Version components exceed the supported integer range" };
  if (major === 0 && minor < 52) return { supported: false, audited: false, kind: "unsupported", reasonZh: "低于 TOML 配置基线 0.52.0", reasonEn: "Below the TOML configuration baseline 0.52.0" };
  if (major !== 0 || minor > 71) return { supported: false, audited: false, kind: "unreviewed", reasonZh: "此版本配置能力尚未审核，请使用已审核的 0.52–0.71 版本", reasonEn: "Configuration capabilities for this version have not been reviewed; use a reviewed 0.52–0.71 release" };
  return { supported: true, audited: patch === 0, kind: patch === 0 ? "audited" : "patch-inherited", reasonZh: patch === 0 ? "已审核的版本配置清单" : "补丁版本继承同一 minor 清单，运行前仍由 frpc verify 校验", reasonEn: patch === 0 ? "Reviewed configuration inventory" : "Patch release inherits its minor inventory; frpc verify remains required before running" };
}
function findField(key: string, scope: ConfigurationScope): ConfigurationField | undefined {
  const exact = fields.find((field) => field.scope === scope && field.key === key);
  if (exact) return exact;
  const children = fields.filter((field) => field.scope === scope && field.key.startsWith(key + "."));
  return children.sort((left, right) => Number(left.minVersion.split(".")[1]) - Number(right.minVersion.split(".")[1]))[0];
}
export function getConfigCapability(version: string, key: string, scope: ConfigurationScope = "profile"): ConfigCapability {
  const state = getConfigurationVersionState(version);
  const field = findField(key.replace(/^advanced\./, ""), scope);
  const minVersion = field?.minVersion ?? "0.52.0";
  if (!state.supported) return { supported: false, minVersion, reasonZh: state.reasonZh, reasonEn: state.reasonEn };
  if (!field) return { supported: false, minVersion, reasonZh: "此字段尚未实现或不适用于此配置范围", reasonEn: "This field is not implemented or applicable to this configuration scope" };
  if (Number(version.split(".")[1]) < Number(minVersion.split(".")[1]))
    return { supported: false, minVersion, reasonZh: `需要 frpc ${minVersion} 或更新版本`, reasonEn: `Requires frpc ${minVersion} or later` };
  return { supported: true, minVersion, reasonZh: "此版本支持", reasonEn: "Supported by this version" };
}
export function isConfigCapabilitySupported(version: string, key: string, scope: ConfigurationScope = "profile"): boolean {
  return getConfigCapability(version, key, scope).supported;
}
export function getUnsupportedAdvancedPaths(advanced: unknown, version: string, scope: ConfigurationScope): UnsupportedAdvancedPath[] {
  const result: UnsupportedAdvancedPath[] = [];
  const visit = (value: unknown, path: string) => {
    const capability = getConfigCapability(version, path, scope);
    if (!capability.supported) { result.push({ path, ...capability }); return; }
    const field = fields.find((entry) => entry.scope === scope && entry.key === path && entry.kind === "field");
    if (field && typeof value === "object" && (Array.isArray(value) || !fields.some((entry) => entry.scope === scope && entry.key.startsWith(path + ".")))) return;
    if (path === "plugin.type" && typeof value === "string") {
      const plugin = getConfigCapability(version, path + "." + value, scope);
      if (!plugin.supported) result.push({ path, ...plugin });
    }
    if (value && typeof value === "object" && !Array.isArray(value))
      for (const [name, entry] of Object.entries(value)) visit(entry, path ? path + "." + name : name);
  };
  if (advanced && typeof advanced === "object" && !Array.isArray(advanced))
    for (const [name, value] of Object.entries(advanced)) visit(value, name);
  return result;
}

export function isConfigurationFieldApplicable(field: ConfigurationField, context: { protocol?: string | TunnelType; role?: "provider" | "visitor"; pluginType?: string; authMethod?: string }): boolean {
  const condition = field.condition;
  return !condition || (
    (!condition.protocols || (context.protocol !== undefined && condition.protocols.includes(context.protocol))) &&
    (!condition.roles || (context.role !== undefined && condition.roles.includes(context.role))) &&
    (!condition.pluginTypes || (context.pluginType !== undefined && condition.pluginTypes.includes(context.pluginType))) &&
    (!condition.authMethods || (context.authMethod !== undefined && condition.authMethods.includes(context.authMethod)))
  );
}
