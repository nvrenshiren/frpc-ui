import type { ConfigurationScope } from "./configCapabilities.ts";
import { configurationFields, getConfigCapability, getConfigurationVersionState } from "./configCapabilities.ts";
import { reviewedFrpcReleases } from "./reviewedFrpcReleases.ts";

export type ConfigDefaultValue = string | number | boolean | null | ConfigDefaultValue[] | { [key: string]: ConfigDefaultValue };
export type ConfigDefaultKind = "fixed" | "context" | "environment" | "managed" | "unavailable";
export interface ConfigDefaultContext {
  protocol?: string;
  role?: "provider" | "visitor";
  pluginType?: string;
  authMethod?: string;
  tcpMux?: boolean;
  user?: string;
  serverAddr?: string;
}
export interface ConfigDefault {
  hasDefault: boolean;
  value?: ConfigDefaultValue;
  kind: ConfigDefaultKind;
  reasonZh: string;
  reasonEn: string;
  officialValue?: ConfigDefaultValue;
  audited?: boolean;
  sourceVersion?: string;
}

const aliases: Record<ConfigurationScope, Record<string, string>> = {
  profile: { webPort: "webServer.port", authToken: "auth.token", transport: "transport.protocol", tls: "transport.tls.enable" },
  tunnel: { encryption: "transport.useEncryption", compression: "transport.useCompression", certPath: "plugin.crtPath", keyPath: "plugin.keyPath" },
};
function none(reasonZh: string, reasonEn: string, kind: ConfigDefaultKind = "unavailable"): ConfigDefault {
  return { hasDefault: false, kind, reasonZh, reasonEn };
}
function fixed(value: ConfigDefaultValue, reasonZh = "官方默认；保持未指定时由所选 frpc 使用", reasonEn = "Official default; the selected frpc applies it while the field remains unset"): ConfigDefault {
  return { hasDefault: true, value, kind: "fixed", reasonZh, reasonEn };
}
function contextual(value: ConfigDefaultValue | undefined, reasonZh: string, reasonEn: string): ConfigDefault {
  return { hasDefault: value !== undefined, ...(value === undefined ? {} : { value }), kind: "context", reasonZh, reasonEn };
}
function managed(value: ConfigDefaultValue, officialValue: ConfigDefaultValue | undefined, reasonZh: string, reasonEn: string): ConfigDefault {
  return { hasDefault: true, value, ...(officialValue === undefined ? {} : { officialValue }), kind: "managed", reasonZh, reasonEn };
}
function versionParts(version: string): number[] { return version.split(".").map(Number); }
function atLeast(version: string, target: string): boolean {
  const left = versionParts(version), right = versionParts(target);
  return left[1] > right[1] || (left[1] === right[1] && left[2] >= right[2]);
}
function reviewedDefaultVersion(version: string): string {
  const minor = versionParts(version)[1];
  return reviewedFrpcReleases.find((release) => versionParts(release)[1] === minor && atLeast(version, release)) ?? `0.${minor}.0`;
}

/** Pure display lookup. Reading a default never adds a JSON/TOML override. */
export function getConfigDefault(version: string, inputKey: string, scope: ConfigurationScope = "profile", context: ConfigDefaultContext = {}): ConfigDefault {
  const state = getConfigurationVersionState(version);
  if (!state.supported) return none(state.reasonZh, state.reasonEn);
  const normalized = inputKey.replace(/^advanced\./, "");
  const key = aliases[scope][normalized] ?? normalized;
  const capability = getConfigCapability(version, key, scope);
  if (!capability.supported) return none(capability.reasonZh, capability.reasonEn);
  const field = configurationFields.find((item) => item.scope === scope && item.key === key);
  if (field?.kind === "choice") return none("选项本身没有独立默认；默认值由对应配置字段决定", "An option has no separate default; its configuration field determines the default");
  const condition = field?.condition;
  if ((context.protocol !== undefined && condition?.protocols && !condition.protocols.includes(context.protocol))
      || (context.role !== undefined && condition?.roles && !condition.roles.includes(context.role))
      || (context.pluginType !== undefined && condition?.pluginTypes && !condition.pluginTypes.includes(context.pluginType))
      || (context.authMethod !== undefined && condition?.authMethods && !condition.authMethods.includes(context.authMethod))) {
    return none("此字段不适用于当前协议、角色、插件或认证方式", "This field does not apply to the current protocol, role, plugin or authentication method");
  }
  if (key.startsWith("plugin.") && context.pluginType) {
    const plugin = getConfigCapability(version, `plugin.type.${context.pluginType}`, "tunnel");
    if (!plugin.supported) return none(plugin.reasonZh, plugin.reasonEn);
  }
  const sourceVersion = reviewedDefaultVersion(version);
  const result = scope === "profile" ? profileDefault(sourceVersion, key, context) : tunnelDefault(sourceVersion, key, context);
  const audited = (reviewedFrpcReleases as readonly string[]).includes(version);
  if (!audited) {
    result.reasonZh += `；默认规则继承已审核 ${sourceVersion}，该补丁未逐标签审核`;
    result.reasonEn += `; defaults inherit reviewed ${sourceVersion}; this patch tag has not been audited`;
  }
  return { ...result, audited, sourceVersion };
}

function profileDefault(version: string, key: string, context: ConfigDefaultContext): ConfigDefault {
  const values: Record<string, ConfigDefaultValue> = {
    serverAddr: "0.0.0.0", serverPort: 7000, user: "", clientID: "", udpPacketSize: 1500,
    metadatas: {}, "auth.method": "token", "auth.token": "", "auth.additionalScopes": [],
    "auth.oidc.clientSecret": "", "auth.oidc.audience": "", "auth.oidc.scope": "", "auth.oidc.additionalEndpointParams": {},
    "auth.oidc.trustedCaFile": "", "auth.oidc.insecureSkipVerify": false,
    "transport.protocol": "tcp", "transport.wireProtocol": "v1", "transport.dialServerTimeout": 10,
    "transport.dialServerKeepalive": 7200, "transport.connectServerLocalIP": "", "transport.poolCount": 1,
    "transport.tcpMux": true, "transport.tls.enable": true, "transport.tls.disableCustomTLSFirstByte": true,
    "transport.tls.certFile": "", "transport.tls.keyFile": "", "transport.tls.trustedCaFile": "",
    "transport.quic.keepalivePeriod": 10, "transport.quic.maxIdleTimeout": 30, "transport.quic.maxIncomingStreams": 100000,
    "webServer.port": 0, "webServer.user": "", "webServer.password": "", "webServer.assetsDir": "", "webServer.pprofEnable": false,
    "webServer.tls.certFile": "", "webServer.tls.keyFile": "", "webServer.tls.trustedCaFile": "", "webServer.tls.serverName": "",
  };
  if (key === "natHoleStunServer") return fixed(atLeast(version, "0.52.1") ? "stun.easyvoip.com:3478" : "", "0.52.0 没有 STUN 回退；从 0.52.1 起默认使用官方 STUN 地址", "0.52.0 has no STUN fallback; the official STUN address becomes the default in 0.52.1");
  if (key === "transport.tcpMuxKeepaliveInterval") return fixed(atLeast(version, "0.58.1") ? 30 : 60, "0.58.1 起默认 30 秒；此前为 60 秒", "Default is 30 seconds from 0.58.1; earlier releases use 60 seconds");
  if (key === "transport.heartbeatInterval" || key === "transport.heartbeatTimeout") {
    const mux = context.tcpMux ?? true;
    const disabled = atLeast(version, "0.58.0") && mux;
    return contextual(disabled ? -1 : key.endsWith("Interval") ? 30 : 90, "0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒", "From 0.58.0, TCP mux defaults application heartbeats to -1 (disabled); otherwise interval is 30 seconds and timeout is 90 seconds");
  }
  if (key === "transport.proxyURL") return none("默认读取 frpc 进程的 http_proxy 环境变量；前端无法确定其值", "Defaults to the frpc process's http_proxy environment variable; its value is unavailable to the frontend", "environment");
  if (key === "dnsServer") return contextual("", "空值使用操作系统 DNS，没有固定默认 IP", "Empty uses the operating system DNS; there is no fixed default IP");
  if (key === "transport.tls.serverName") return contextual(context.serverAddr, "留空时 TLS SNI 使用当前 serverAddr；显示回退值不会保存覆盖", "When unset, TLS SNI uses the current serverAddr; displaying the fallback does not save an override");
  if (key === "loginFailExit") return managed(false, true, "应用固定为 false，以持续监督登录重试；官方默认 true", "The application forces false to supervise login retries; the official default is true");
  if (key === "log.to" || key === "log.level" || key === "log.disablePrintColor") return managed(key === "log.to" ? "console" : key === "log.level" ? "info" : true, key === "log.to" ? "console" : key === "log.level" ? "info" : false, "应用接管控制台/info/无色日志；官方默认未禁用颜色", "The application manages console/info/uncolored logs; official defaults leave colors enabled");
  if (key === "webServer.addr") return managed("127.0.0.1", "127.0.0.1", "应用固定绑定本机地址，与官方默认相同", "The application binds to loopback, matching the official default");
  if (key === "auth.oidc.proxyURL") return contextual("", "默认空。未设置 OIDC CA/跳过验证/专用代理时使用默认 HTTP 客户端（可读取环境代理）；设置自定义 TLS 后，空 proxyURL 明确禁用代理", "Empty by default. Without OIDC CA/skip-verification/custom proxy options, the default HTTP client may use environment proxies; with custom TLS, an empty proxyURL explicitly disables proxies");
  if (key === "transport.tls.trustedCaFile") return contextual("", "默认无 CA 文件；frpc 的 TLS 客户端此时跳过服务端证书验证，指定 CA 后启用验证", "No CA file by default; the frpc TLS client skips server-certificate verification until a CA file is configured");
  if (key.endsWith("tokenSource.type")) return managed("file", undefined, "来源默认未启用；显式启用时应用仅提供 file 类型", "Sources are disabled by default; the application only offers file when explicitly enabled");
  if (Object.hasOwn(values, key)) return fixed(structuredClone(values[key]));
  return none("此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置", "This field has no valid fill-in default; configure it explicitly when enabling the feature");
}

function tunnelDefault(version: string, key: string, context: ConfigDefaultContext): ConfigDefault {
  const values: Record<string, ConfigDefaultValue> = {
    localIP: "127.0.0.1", remotePort: 0, bindAddr: "127.0.0.1", secretKey: "", serverUser: "",
    customDomains: [], subdomain: "", annotations: {}, metadatas: {}, allowUsers: [],
    "transport.useEncryption": false, "transport.useCompression": false,
    "transport.bandwidthLimit": "", "transport.bandwidthLimitMode": "client", "transport.proxyProtocolVersion": "",
    "loadBalancer.group": "", "loadBalancer.groupKey": "", "healthCheck.type": "",
    "healthCheck.timeoutSeconds": 3, "healthCheck.maxFailed": 1, "healthCheck.intervalSeconds": 10,
    "healthCheck.httpHeaders": [], httpUser: "", httpPassword: "", routeByHTTPUser: "",
    locations: [], hostHeaderRewrite: "", "requestHeaders.set": {}, "responseHeaders.set": {},
    protocol: "quic", keepTunnelOpen: false, maxRetriesAnHour: 8, minRetryInterval: 90, fallbackTo: "", fallbackTimeoutMs: 1000,
    "natTraversal.disableAssistedAddrs": false, "plugin.type": "", "plugin.hostHeaderRewrite": "", "plugin.requestHeaders.set": {},
    "plugin.enableHTTP2": true, "plugin.crtPath": "", "plugin.keyPath": "", "plugin.httpUser": "", "plugin.httpPassword": "",
    "plugin.username": "", "plugin.password": "", "plugin.stripPrefix": "",
  };
  if (key === "multiplexer") return managed("httpconnect", undefined, "官方没有默认，TCPMUX 必须明确指定 httpconnect；应用生成时提供唯一合法预设", "There is no official default; TCPMUX requires explicit httpconnect, which the application supplies when generating the configuration");
  if (key === "enabled") return managed(true, atLeast(version, "0.66.0") ? true : undefined, "应用默认启用，并在生成时过滤停用隧道；原生 enabled 字段从 0.66 才提供", "The application enables tunnels by default and filters disabled ones during generation; the native enabled field starts in 0.66");
  if (key === "type") return managed("tcp", undefined, "官方 type 必填且没有默认；应用新建隧道预设 TCP", "Official type is required and has no default; new application tunnels preset TCP");
  if (key === "serverUser") return contextual("", context.user ? `留空时使用当前连接的 user（${context.user}），不把命名前缀写回配置` : "留空时使用当前连接的 user，不固定用户名或写回命名前缀", "Empty uses the current connection user without persisting a naming prefix");
  if (key === "allowUsers") return contextual([], "空列表仅允许当前 provider 的用户；不等于允许所有用户", "An empty list only allows the current provider user; it does not allow every user");
  if (key === "healthCheck.type") return fixed("", "默认不启用健康检查；展示数值默认不会创建或启用 healthCheck", "Health checks are disabled by default; displaying numeric defaults does not create or activate healthCheck");
  if (key === "plugin.type") return fixed("", "默认不启用插件；展示插件字段默认不会创建或启用 plugin", "Plugins are disabled by default; displaying plugin-field defaults does not create or activate plugin");
  if (key === "transport.bandwidthLimit") return fixed("", "空值或 0KB/0MB 不限速；不填写具体带宽上限", "Empty or 0KB/0MB means no bandwidth limit");
  if (key === "transport.proxyProtocolVersion") return fixed("", "空值不生成 PROXY 协议头，不是自动选择版本", "Empty does not emit a PROXY protocol header; it does not auto-select a version");
  if (key === "plugin.crtPath" || key === "plugin.keyPath") return contextual("", "证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径", "With both paths empty, HTTPS/TLS plugins generate a random self-signed certificate in the process; no file path is generated");
  if (key === "localPort") return none("localPort 没有有效官方默认，启用普通后端时必须填正值；8080 是应用新建预设", "localPort has no valid official default and requires a positive value for a normal backend; 8080 is an application preset");
  if (key === "bindPort") return none("bindPort 默认零值无效，必须明确填写正值；STCP/XTCP 的 -1 是可选重定向设置", "The zero bindPort is invalid; provide a positive value, or explicitly select -1 for STCP/XTCP redirection");
  if (key === "healthCheck.path") return none("HTTP 健康检查必须明确填写路径，没有有效官方默认；健康检查关闭时此字段不生效", "HTTP health checks require an explicit path with no valid official default; this field is ignored while health checks are disabled");
  if (Object.hasOwn(values, key)) return fixed(structuredClone(values[key]));
  return none("此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置", "This field has no valid fill-in default; configure it explicitly when enabling the feature");
}

export function formatConfigDefault(result: ConfigDefault, language: "zh" | "en" = "zh"): string {
  if (!result.hasDefault) return language === "zh" ? (result.kind === "environment" ? "由环境决定" : result.kind === "context" ? "由上下文决定" : "无默认") : (result.kind === "environment" ? "Environment" : result.kind === "context" ? "Context" : "No default");
  if (result.value === "") return language === "zh" ? "空值" : "Empty";
  return typeof result.value === "string" ? result.value : JSON.stringify(result.value);
}
