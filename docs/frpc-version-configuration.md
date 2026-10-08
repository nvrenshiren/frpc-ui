# frpc 逐版本配置清单

配置能力核验：2026-10-08；默认值核验：2026-10-09。由 `apps/desktop/src/configCapabilities.ts` 和 `configDefaults.ts` 的共享规则生成；连接/隧道编辑器、版本库清单与前端交换校验共用能力表，Rust 按相同门槛校验。

清单针对本应用已实现的 frpc 参数，不把官方存在但本应用尚未开放的能力标为可编辑。支持 0.52–0.71 的现代 TOML 配置；主 minor 按官方固定 tag 审核，同 minor 的补丁版本继承字段清单，未列出的合法补丁也按此规则处理并须由实际二进制执行 `frpc verify`。不声称每一个历史二进制均已完成真实穿透联调。未审核的 minor/major 或无法识别的版本不会推定兼容。

## 使用规则

- 在版本库点击“配置清单”，可以切换每一个已知官方稳定版本，搜索配置键，并筛选连接或隧道。
- 连接编辑器以所选版本为准；隧道编辑器以所属连接版本为准，同时按协议、角色、认证方式和插件类型显示。不存在的参数和类型不显示为编辑控件。
- 切换版本不会静默删除已有配置。不兼容项显示字段路径和最低版本，用户可明确清除，或选择兼容版本；保存、交换和启动继续校验。
- 有官方默认值的控件直接显示该版本默认值；未修改的高级项不写入 TOML。修改后成为明确覆盖，恢复默认会移除覆盖值。
- 默认值按完整 major.minor.patch 和当前配置上下文核验，不能仅按 minor 继承。环境变量或必填目标没有可确定的固定值时保持未设置并说明来源。固定源码、补丁差异和应用接管策略见 [默认值审核](development/frpc-defaults-source-audit.md)。
- 下方 `type.xxx`、`plugin.type.xxx`、`transport.protocol.xxx` 和 `auth.method.xxx` 是类型选项清单，表示某个枚举值可用，不是新增 TOML 字段。
- `webServer.addr`、`loginFailExit`、`log.to/level/disablePrintColor` 由应用接管；`enabled` 对应应用启用状态，生成时剔除停用隧道。

## 新增字段门槛

| 首个版本 | 新增可用项 | 官方定义 |
| --- | --- | --- |
| 0.55.0 | 隧道 `annotations` | [v0.55.0](https://github.com/fatedier/frp/tree/v0.55.0/pkg/config/v1) |
| 0.56.0 | 隧道 `healthCheck.httpHeaders` | [v0.56.0](https://github.com/fatedier/frp/tree/v0.56.0/pkg/config/v1) |
| 0.58.0 | 隧道 `responseHeaders.set` | [v0.58.0](https://github.com/fatedier/frp/tree/v0.58.0/pkg/config/v1) |
| 0.59.0 | 隧道 `plugin.type.http2http`、隧道 `plugin.enableHTTP2` | [v0.59.0](https://github.com/fatedier/frp/tree/v0.59.0/pkg/config/v1) |
| 0.60.0 | 隧道 `plugin.type.tls2raw` | [v0.60.0](https://github.com/fatedier/frp/tree/v0.60.0/pkg/config/v1) |
| 0.64.0 | 连接 `auth.tokenSource`、连接 `auth.tokenSource.type`、连接 `auth.tokenSource.file.path` | [v0.64.0](https://github.com/fatedier/frp/tree/v0.64.0/pkg/config/v1) |
| 0.65.0 | 连接 `auth.oidc.trustedCaFile`、连接 `auth.oidc.insecureSkipVerify`、连接 `auth.oidc.proxyURL`、隧道 `natTraversal.disableAssistedAddrs` | [v0.65.0](https://github.com/fatedier/frp/tree/v0.65.0/pkg/config/v1) |
| 0.66.0 | 连接 `auth.oidc.tokenSource`、连接 `auth.oidc.tokenSource.type`、连接 `auth.oidc.tokenSource.file.path` | [v0.66.0](https://github.com/fatedier/frp/tree/v0.66.0/pkg/config/v1) |
| 0.67.0 | 连接 `clientID` | [v0.67.0](https://github.com/fatedier/frp/tree/v0.67.0/pkg/config/v1) |
| 0.69.0 | 连接 `transport.wireProtocol` | [v0.69.0](https://github.com/fatedier/frp/tree/v0.69.0/pkg/config/v1) |

其他已实现字段从基线 0.52.0 起可用，仍需遵循协议条件。`proxyURL` 当前开放 HTTP/HTTPS/SOCKS5；NTLM 不在本轮开放范围。执行型 Token 来源、外部 `includes`、官方 Store、实验 `featureGates` 与 VirtualNet 尚未开放；未知字段明确拒绝。Windows 平台不提供 VirtualNet/TUN UI。完整产品边界见 [配置覆盖清单](frp-configuration-coverage.md)。

## 每个官方稳定版本

官方稳定发布列表依据 [frp Releases](https://github.com/fatedier/frp/releases) 在核验日期读取；没有为未发布的补丁号伪造条目。

<details>
<summary>frpc 0.52.0 · 124 项配置键与类型选项</summary>

[官方发布](https://github.com/fatedier/frp/releases/tag/v0.52.0)。已审核的版本配置清单。

### 服务器连接

- **基础连接**：`serverAddr`、`serverPort`、`user`、`auth.token`、`transport.protocol`、`transport.tls.enable`、`webServer.addr`、`webServer.port`、`loginFailExit`、`log.to`、`log.level`、`log.disablePrintColor`。
- **连接高级**：`natHoleStunServer`、`dnsServer`、`udpPacketSize`、`metadatas`。
- **认证**：`auth.method`、`auth.additionalScopes`。
- **认证（认证 oidc）**：`auth.oidc.clientID`、`auth.oidc.clientSecret`、`auth.oidc.audience`、`auth.oidc.scope`、`auth.oidc.tokenEndpointURL`、`auth.oidc.additionalEndpointParams`。
- **传输**：`transport.dialServerTimeout`、`transport.dialServerKeepalive`、`transport.poolCount`、`transport.tcpMux`、`transport.tcpMuxKeepaliveInterval`、`transport.heartbeatInterval`、`transport.heartbeatTimeout`。
- **传输（tcp/websocket/wss）**：`transport.proxyURL`、`transport.connectServerLocalIP`。
- **QUIC（quic）**：`transport.quic.keepalivePeriod`、`transport.quic.maxIdleTimeout`、`transport.quic.maxIncomingStreams`。
- **TLS**：`transport.tls.certFile`、`transport.tls.keyFile`、`transport.tls.trustedCaFile`、`transport.tls.serverName`、`transport.tls.disableCustomTLSFirstByte`。
- **本机管理**：`webServer.user`、`webServer.password`、`webServer.assetsDir`、`webServer.pprofEnable`、`webServer.tls.certFile`、`webServer.tls.keyFile`、`webServer.tls.trustedCaFile`、`webServer.tls.serverName`。
- **传输协议**：`transport.protocol.tcp`、`transport.protocol.kcp`、`transport.protocol.quic`、`transport.protocol.websocket`、`transport.protocol.wss`。
- **认证方式**：`auth.method.token`、`auth.method.oidc`。

### 隧道、访问者与插件

- **基础隧道**：`name`、`type`、`enabled`、`transport.useEncryption`、`transport.useCompression`。
- **本地后端（provider）**：`localIP`、`localPort`。
- **远程端口（provider；tcp/udp）**：`remotePort`。
- **访问者（visitor；stcp/sudp/xtcp）**：`serverName`、`serverUser`、`bindAddr`、`bindPort`。
- **私有隧道（stcp/sudp/xtcp）**：`secretKey`。
- **访问权限（provider；stcp/sudp/xtcp）**：`allowUsers`。
- **域名（provider；http/https/tcpmux）**：`customDomains`、`subdomain`。
- **元数据（provider）**：`metadatas`。
- **代理传输（provider）**：`transport.bandwidthLimit`、`transport.bandwidthLimitMode`、`transport.proxyProtocolVersion`。
- **负载均衡（provider；tcp/http/https/tcpmux）**：`loadBalancer.group`、`loadBalancer.groupKey`。
- **健康检查（provider）**：`healthCheck.type`、`healthCheck.timeoutSeconds`、`healthCheck.maxFailed`、`healthCheck.intervalSeconds`、`healthCheck.path`。
- **HTTP（provider；http/tcpmux）**：`httpUser`、`httpPassword`、`routeByHTTPUser`。
- **HTTP（provider；http）**：`locations`、`hostHeaderRewrite`、`requestHeaders.set`。
- **TCPMUX（provider；tcpmux）**：`multiplexer`。
- **XTCP（visitor；xtcp）**：`protocol`、`keepTunnelOpen`、`maxRetriesAnHour`、`minRetryInterval`、`fallbackTo`、`fallbackTimeoutMs`。
- **隧道协议**：`type.tcp`、`type.udp`、`type.http`、`type.https`、`type.stcp`、`type.sudp`、`type.xtcp`、`type.tcpmux`。
- **插件（provider；tcp/stcp/xtcp/http/https/tcpmux）**：`plugin.type`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https）**：`plugin.type.http2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http）**：`plugin.type.https2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2https）**：`plugin.type.https2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy）**：`plugin.type.http_proxy`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.type.socks5`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.type.static_file`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.type.unix_domain_socket`。
- **插件目标（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https/tls2raw）**：`plugin.localAddr`。
- **插件 HTTP（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https）**：`plugin.hostHeaderRewrite`、`plugin.requestHeaders.set`。
- **插件 TLS（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https/tls2raw）**：`plugin.crtPath`、`plugin.keyPath`。
- **插件认证（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy/static_file）**：`plugin.httpUser`、`plugin.httpPassword`。
- **SOCKS5（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.username`、`plugin.password`。
- **静态文件（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.localPath`、`plugin.stripPrefix`。
- **Unix socket（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.unixPath`。

### 配置默认值

以下按新建配置上下文列出；TCP 复用、所属用户、TLS 服务名等联动值会随表单上下文更新。类型选项不是独立字段，不重复列默认值。应用接管项同时说明官方默认和应用实际策略。

| 范围 | 配置键 | 默认值 | 说明 |
| --- | --- | --- | --- |
| 连接 | `serverAddr` | `0.0.0.0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `serverPort` | `7000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.token` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.protocol` | `tcp` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.enable` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.addr` | `127.0.0.1` | 应用固定绑定本机地址，与官方默认相同 |
| 连接 | `webServer.port` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `loginFailExit` | `false` | 应用固定为 false，以持续监督登录重试；官方默认 true |
| 连接 | `log.to` | `console` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.level` | `info` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.disablePrintColor` | `true` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `natHoleStunServer` | `空值` | 0.52.0 没有 STUN 回退；从 0.52.1 起默认使用官方 STUN 地址 |
| 连接 | `dnsServer` | `空值` | 空值使用操作系统 DNS，没有固定默认 IP |
| 连接 | `udpPacketSize` | `1500` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.method` | `token` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.additionalScopes` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.clientID` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.clientSecret` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.audience` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.scope` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.tokenEndpointURL` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.additionalEndpointParams` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerTimeout` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerKeepalive` | `7200` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.poolCount` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMux` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMuxKeepaliveInterval` | `60` | 0.58.1 起默认 30 秒；此前为 60 秒 |
| 连接 | `transport.heartbeatInterval` | `30` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.heartbeatTimeout` | `90` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.proxyURL` | `由环境决定` | 默认读取 frpc 进程的 http_proxy 环境变量；前端无法确定其值 |
| 连接 | `transport.connectServerLocalIP` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.keepalivePeriod` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIdleTimeout` | `30` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIncomingStreams` | `100000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.trustedCaFile` | `空值` | 默认无 CA 文件；frpc 的 TLS 客户端此时跳过服务端证书验证，指定 CA 后启用验证 |
| 连接 | `transport.tls.serverName` | `由上下文决定` | 留空时 TLS SNI 使用当前 serverAddr；显示回退值不会保存覆盖 |
| 连接 | `transport.tls.disableCustomTLSFirstByte` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.assetsDir` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.pprofEnable` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.serverName` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `name` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `type` | `tcp` | 官方 type 必填且没有默认；应用新建隧道预设 TCP |
| 隧道 | `enabled` | `true` | 应用默认启用，并在生成时过滤停用隧道；原生 enabled 字段从 0.66 才提供 |
| 隧道 | `transport.useEncryption` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.useCompression` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localIP` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localPort` | `无默认` | localPort 没有有效官方默认，启用普通后端时必须填正值；8080 是应用新建预设 |
| 隧道 | `remotePort` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `serverName` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `serverUser` | `空值` | 留空时使用当前连接的 user，不固定用户名或写回命名前缀 |
| 隧道 | `bindAddr` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `bindPort` | `无默认` | bindPort 默认零值无效，必须明确填写正值；STCP/XTCP 的 -1 是可选重定向设置 |
| 隧道 | `secretKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `allowUsers` | `[]` | 空列表仅允许当前 provider 的用户；不等于允许所有用户 |
| 隧道 | `customDomains` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `subdomain` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.bandwidthLimit` | `空值` | 空值或 0KB/0MB 不限速；不填写具体带宽上限 |
| 隧道 | `transport.bandwidthLimitMode` | `client` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.proxyProtocolVersion` | `空值` | 空值不生成 PROXY 协议头，不是自动选择版本 |
| 隧道 | `loadBalancer.group` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `loadBalancer.groupKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.type` | `空值` | 默认不启用健康检查；展示数值默认不会创建或启用 healthCheck |
| 隧道 | `healthCheck.timeoutSeconds` | `3` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.maxFailed` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.intervalSeconds` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.path` | `无默认` | HTTP 健康检查必须明确填写路径，没有有效官方默认；健康检查关闭时此字段不生效 |
| 隧道 | `httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `routeByHTTPUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `locations` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `multiplexer` | `httpconnect` | 官方没有默认，TCPMUX 必须明确指定 httpconnect；应用生成时提供唯一合法预设 |
| 隧道 | `protocol` | `quic` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `keepTunnelOpen` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `maxRetriesAnHour` | `8` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `minRetryInterval` | `90` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTo` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTimeoutMs` | `1000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.type` | `空值` | 默认不启用插件；展示插件字段默认不会创建或启用 plugin |
| 隧道 | `plugin.localAddr` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.crtPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.keyPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.username` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.localPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.stripPrefix` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.unixPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |

</details>

<details>
<summary>frpc 0.52.1 · 124 项配置键与类型选项</summary>

[官方发布](https://github.com/fatedier/frp/releases/tag/v0.52.1)。补丁版本继承同一 minor 清单，运行前仍由 frpc verify 校验。

### 服务器连接

- **基础连接**：`serverAddr`、`serverPort`、`user`、`auth.token`、`transport.protocol`、`transport.tls.enable`、`webServer.addr`、`webServer.port`、`loginFailExit`、`log.to`、`log.level`、`log.disablePrintColor`。
- **连接高级**：`natHoleStunServer`、`dnsServer`、`udpPacketSize`、`metadatas`。
- **认证**：`auth.method`、`auth.additionalScopes`。
- **认证（认证 oidc）**：`auth.oidc.clientID`、`auth.oidc.clientSecret`、`auth.oidc.audience`、`auth.oidc.scope`、`auth.oidc.tokenEndpointURL`、`auth.oidc.additionalEndpointParams`。
- **传输**：`transport.dialServerTimeout`、`transport.dialServerKeepalive`、`transport.poolCount`、`transport.tcpMux`、`transport.tcpMuxKeepaliveInterval`、`transport.heartbeatInterval`、`transport.heartbeatTimeout`。
- **传输（tcp/websocket/wss）**：`transport.proxyURL`、`transport.connectServerLocalIP`。
- **QUIC（quic）**：`transport.quic.keepalivePeriod`、`transport.quic.maxIdleTimeout`、`transport.quic.maxIncomingStreams`。
- **TLS**：`transport.tls.certFile`、`transport.tls.keyFile`、`transport.tls.trustedCaFile`、`transport.tls.serverName`、`transport.tls.disableCustomTLSFirstByte`。
- **本机管理**：`webServer.user`、`webServer.password`、`webServer.assetsDir`、`webServer.pprofEnable`、`webServer.tls.certFile`、`webServer.tls.keyFile`、`webServer.tls.trustedCaFile`、`webServer.tls.serverName`。
- **传输协议**：`transport.protocol.tcp`、`transport.protocol.kcp`、`transport.protocol.quic`、`transport.protocol.websocket`、`transport.protocol.wss`。
- **认证方式**：`auth.method.token`、`auth.method.oidc`。

### 隧道、访问者与插件

- **基础隧道**：`name`、`type`、`enabled`、`transport.useEncryption`、`transport.useCompression`。
- **本地后端（provider）**：`localIP`、`localPort`。
- **远程端口（provider；tcp/udp）**：`remotePort`。
- **访问者（visitor；stcp/sudp/xtcp）**：`serverName`、`serverUser`、`bindAddr`、`bindPort`。
- **私有隧道（stcp/sudp/xtcp）**：`secretKey`。
- **访问权限（provider；stcp/sudp/xtcp）**：`allowUsers`。
- **域名（provider；http/https/tcpmux）**：`customDomains`、`subdomain`。
- **元数据（provider）**：`metadatas`。
- **代理传输（provider）**：`transport.bandwidthLimit`、`transport.bandwidthLimitMode`、`transport.proxyProtocolVersion`。
- **负载均衡（provider；tcp/http/https/tcpmux）**：`loadBalancer.group`、`loadBalancer.groupKey`。
- **健康检查（provider）**：`healthCheck.type`、`healthCheck.timeoutSeconds`、`healthCheck.maxFailed`、`healthCheck.intervalSeconds`、`healthCheck.path`。
- **HTTP（provider；http/tcpmux）**：`httpUser`、`httpPassword`、`routeByHTTPUser`。
- **HTTP（provider；http）**：`locations`、`hostHeaderRewrite`、`requestHeaders.set`。
- **TCPMUX（provider；tcpmux）**：`multiplexer`。
- **XTCP（visitor；xtcp）**：`protocol`、`keepTunnelOpen`、`maxRetriesAnHour`、`minRetryInterval`、`fallbackTo`、`fallbackTimeoutMs`。
- **隧道协议**：`type.tcp`、`type.udp`、`type.http`、`type.https`、`type.stcp`、`type.sudp`、`type.xtcp`、`type.tcpmux`。
- **插件（provider；tcp/stcp/xtcp/http/https/tcpmux）**：`plugin.type`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https）**：`plugin.type.http2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http）**：`plugin.type.https2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2https）**：`plugin.type.https2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy）**：`plugin.type.http_proxy`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.type.socks5`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.type.static_file`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.type.unix_domain_socket`。
- **插件目标（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https/tls2raw）**：`plugin.localAddr`。
- **插件 HTTP（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https）**：`plugin.hostHeaderRewrite`、`plugin.requestHeaders.set`。
- **插件 TLS（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https/tls2raw）**：`plugin.crtPath`、`plugin.keyPath`。
- **插件认证（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy/static_file）**：`plugin.httpUser`、`plugin.httpPassword`。
- **SOCKS5（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.username`、`plugin.password`。
- **静态文件（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.localPath`、`plugin.stripPrefix`。
- **Unix socket（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.unixPath`。

### 配置默认值

以下按新建配置上下文列出；TCP 复用、所属用户、TLS 服务名等联动值会随表单上下文更新。类型选项不是独立字段，不重复列默认值。应用接管项同时说明官方默认和应用实际策略。

| 范围 | 配置键 | 默认值 | 说明 |
| --- | --- | --- | --- |
| 连接 | `serverAddr` | `0.0.0.0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `serverPort` | `7000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.token` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.protocol` | `tcp` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.enable` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.addr` | `127.0.0.1` | 应用固定绑定本机地址，与官方默认相同 |
| 连接 | `webServer.port` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `loginFailExit` | `false` | 应用固定为 false，以持续监督登录重试；官方默认 true |
| 连接 | `log.to` | `console` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.level` | `info` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.disablePrintColor` | `true` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `natHoleStunServer` | `stun.easyvoip.com:3478` | 0.52.0 没有 STUN 回退；从 0.52.1 起默认使用官方 STUN 地址 |
| 连接 | `dnsServer` | `空值` | 空值使用操作系统 DNS，没有固定默认 IP |
| 连接 | `udpPacketSize` | `1500` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.method` | `token` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.additionalScopes` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.clientID` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.clientSecret` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.audience` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.scope` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.tokenEndpointURL` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.additionalEndpointParams` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerTimeout` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerKeepalive` | `7200` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.poolCount` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMux` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMuxKeepaliveInterval` | `60` | 0.58.1 起默认 30 秒；此前为 60 秒 |
| 连接 | `transport.heartbeatInterval` | `30` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.heartbeatTimeout` | `90` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.proxyURL` | `由环境决定` | 默认读取 frpc 进程的 http_proxy 环境变量；前端无法确定其值 |
| 连接 | `transport.connectServerLocalIP` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.keepalivePeriod` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIdleTimeout` | `30` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIncomingStreams` | `100000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.trustedCaFile` | `空值` | 默认无 CA 文件；frpc 的 TLS 客户端此时跳过服务端证书验证，指定 CA 后启用验证 |
| 连接 | `transport.tls.serverName` | `由上下文决定` | 留空时 TLS SNI 使用当前 serverAddr；显示回退值不会保存覆盖 |
| 连接 | `transport.tls.disableCustomTLSFirstByte` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.assetsDir` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.pprofEnable` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.serverName` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `name` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `type` | `tcp` | 官方 type 必填且没有默认；应用新建隧道预设 TCP |
| 隧道 | `enabled` | `true` | 应用默认启用，并在生成时过滤停用隧道；原生 enabled 字段从 0.66 才提供 |
| 隧道 | `transport.useEncryption` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.useCompression` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localIP` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localPort` | `无默认` | localPort 没有有效官方默认，启用普通后端时必须填正值；8080 是应用新建预设 |
| 隧道 | `remotePort` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `serverName` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `serverUser` | `空值` | 留空时使用当前连接的 user，不固定用户名或写回命名前缀 |
| 隧道 | `bindAddr` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `bindPort` | `无默认` | bindPort 默认零值无效，必须明确填写正值；STCP/XTCP 的 -1 是可选重定向设置 |
| 隧道 | `secretKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `allowUsers` | `[]` | 空列表仅允许当前 provider 的用户；不等于允许所有用户 |
| 隧道 | `customDomains` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `subdomain` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.bandwidthLimit` | `空值` | 空值或 0KB/0MB 不限速；不填写具体带宽上限 |
| 隧道 | `transport.bandwidthLimitMode` | `client` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.proxyProtocolVersion` | `空值` | 空值不生成 PROXY 协议头，不是自动选择版本 |
| 隧道 | `loadBalancer.group` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `loadBalancer.groupKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.type` | `空值` | 默认不启用健康检查；展示数值默认不会创建或启用 healthCheck |
| 隧道 | `healthCheck.timeoutSeconds` | `3` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.maxFailed` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.intervalSeconds` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.path` | `无默认` | HTTP 健康检查必须明确填写路径，没有有效官方默认；健康检查关闭时此字段不生效 |
| 隧道 | `httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `routeByHTTPUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `locations` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `multiplexer` | `httpconnect` | 官方没有默认，TCPMUX 必须明确指定 httpconnect；应用生成时提供唯一合法预设 |
| 隧道 | `protocol` | `quic` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `keepTunnelOpen` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `maxRetriesAnHour` | `8` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `minRetryInterval` | `90` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTo` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTimeoutMs` | `1000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.type` | `空值` | 默认不启用插件；展示插件字段默认不会创建或启用 plugin |
| 隧道 | `plugin.localAddr` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.crtPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.keyPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.username` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.localPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.stripPrefix` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.unixPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |

</details>

<details>
<summary>frpc 0.52.2 · 124 项配置键与类型选项</summary>

[官方发布](https://github.com/fatedier/frp/releases/tag/v0.52.2)。补丁版本继承同一 minor 清单，运行前仍由 frpc verify 校验。

### 服务器连接

- **基础连接**：`serverAddr`、`serverPort`、`user`、`auth.token`、`transport.protocol`、`transport.tls.enable`、`webServer.addr`、`webServer.port`、`loginFailExit`、`log.to`、`log.level`、`log.disablePrintColor`。
- **连接高级**：`natHoleStunServer`、`dnsServer`、`udpPacketSize`、`metadatas`。
- **认证**：`auth.method`、`auth.additionalScopes`。
- **认证（认证 oidc）**：`auth.oidc.clientID`、`auth.oidc.clientSecret`、`auth.oidc.audience`、`auth.oidc.scope`、`auth.oidc.tokenEndpointURL`、`auth.oidc.additionalEndpointParams`。
- **传输**：`transport.dialServerTimeout`、`transport.dialServerKeepalive`、`transport.poolCount`、`transport.tcpMux`、`transport.tcpMuxKeepaliveInterval`、`transport.heartbeatInterval`、`transport.heartbeatTimeout`。
- **传输（tcp/websocket/wss）**：`transport.proxyURL`、`transport.connectServerLocalIP`。
- **QUIC（quic）**：`transport.quic.keepalivePeriod`、`transport.quic.maxIdleTimeout`、`transport.quic.maxIncomingStreams`。
- **TLS**：`transport.tls.certFile`、`transport.tls.keyFile`、`transport.tls.trustedCaFile`、`transport.tls.serverName`、`transport.tls.disableCustomTLSFirstByte`。
- **本机管理**：`webServer.user`、`webServer.password`、`webServer.assetsDir`、`webServer.pprofEnable`、`webServer.tls.certFile`、`webServer.tls.keyFile`、`webServer.tls.trustedCaFile`、`webServer.tls.serverName`。
- **传输协议**：`transport.protocol.tcp`、`transport.protocol.kcp`、`transport.protocol.quic`、`transport.protocol.websocket`、`transport.protocol.wss`。
- **认证方式**：`auth.method.token`、`auth.method.oidc`。

### 隧道、访问者与插件

- **基础隧道**：`name`、`type`、`enabled`、`transport.useEncryption`、`transport.useCompression`。
- **本地后端（provider）**：`localIP`、`localPort`。
- **远程端口（provider；tcp/udp）**：`remotePort`。
- **访问者（visitor；stcp/sudp/xtcp）**：`serverName`、`serverUser`、`bindAddr`、`bindPort`。
- **私有隧道（stcp/sudp/xtcp）**：`secretKey`。
- **访问权限（provider；stcp/sudp/xtcp）**：`allowUsers`。
- **域名（provider；http/https/tcpmux）**：`customDomains`、`subdomain`。
- **元数据（provider）**：`metadatas`。
- **代理传输（provider）**：`transport.bandwidthLimit`、`transport.bandwidthLimitMode`、`transport.proxyProtocolVersion`。
- **负载均衡（provider；tcp/http/https/tcpmux）**：`loadBalancer.group`、`loadBalancer.groupKey`。
- **健康检查（provider）**：`healthCheck.type`、`healthCheck.timeoutSeconds`、`healthCheck.maxFailed`、`healthCheck.intervalSeconds`、`healthCheck.path`。
- **HTTP（provider；http/tcpmux）**：`httpUser`、`httpPassword`、`routeByHTTPUser`。
- **HTTP（provider；http）**：`locations`、`hostHeaderRewrite`、`requestHeaders.set`。
- **TCPMUX（provider；tcpmux）**：`multiplexer`。
- **XTCP（visitor；xtcp）**：`protocol`、`keepTunnelOpen`、`maxRetriesAnHour`、`minRetryInterval`、`fallbackTo`、`fallbackTimeoutMs`。
- **隧道协议**：`type.tcp`、`type.udp`、`type.http`、`type.https`、`type.stcp`、`type.sudp`、`type.xtcp`、`type.tcpmux`。
- **插件（provider；tcp/stcp/xtcp/http/https/tcpmux）**：`plugin.type`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https）**：`plugin.type.http2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http）**：`plugin.type.https2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2https）**：`plugin.type.https2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy）**：`plugin.type.http_proxy`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.type.socks5`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.type.static_file`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.type.unix_domain_socket`。
- **插件目标（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https/tls2raw）**：`plugin.localAddr`。
- **插件 HTTP（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https）**：`plugin.hostHeaderRewrite`、`plugin.requestHeaders.set`。
- **插件 TLS（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https/tls2raw）**：`plugin.crtPath`、`plugin.keyPath`。
- **插件认证（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy/static_file）**：`plugin.httpUser`、`plugin.httpPassword`。
- **SOCKS5（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.username`、`plugin.password`。
- **静态文件（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.localPath`、`plugin.stripPrefix`。
- **Unix socket（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.unixPath`。

### 配置默认值

以下按新建配置上下文列出；TCP 复用、所属用户、TLS 服务名等联动值会随表单上下文更新。类型选项不是独立字段，不重复列默认值。应用接管项同时说明官方默认和应用实际策略。

| 范围 | 配置键 | 默认值 | 说明 |
| --- | --- | --- | --- |
| 连接 | `serverAddr` | `0.0.0.0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `serverPort` | `7000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.token` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.protocol` | `tcp` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.enable` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.addr` | `127.0.0.1` | 应用固定绑定本机地址，与官方默认相同 |
| 连接 | `webServer.port` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `loginFailExit` | `false` | 应用固定为 false，以持续监督登录重试；官方默认 true |
| 连接 | `log.to` | `console` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.level` | `info` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.disablePrintColor` | `true` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `natHoleStunServer` | `stun.easyvoip.com:3478` | 0.52.0 没有 STUN 回退；从 0.52.1 起默认使用官方 STUN 地址 |
| 连接 | `dnsServer` | `空值` | 空值使用操作系统 DNS，没有固定默认 IP |
| 连接 | `udpPacketSize` | `1500` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.method` | `token` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.additionalScopes` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.clientID` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.clientSecret` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.audience` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.scope` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.tokenEndpointURL` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.additionalEndpointParams` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerTimeout` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerKeepalive` | `7200` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.poolCount` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMux` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMuxKeepaliveInterval` | `60` | 0.58.1 起默认 30 秒；此前为 60 秒 |
| 连接 | `transport.heartbeatInterval` | `30` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.heartbeatTimeout` | `90` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.proxyURL` | `由环境决定` | 默认读取 frpc 进程的 http_proxy 环境变量；前端无法确定其值 |
| 连接 | `transport.connectServerLocalIP` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.keepalivePeriod` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIdleTimeout` | `30` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIncomingStreams` | `100000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.trustedCaFile` | `空值` | 默认无 CA 文件；frpc 的 TLS 客户端此时跳过服务端证书验证，指定 CA 后启用验证 |
| 连接 | `transport.tls.serverName` | `由上下文决定` | 留空时 TLS SNI 使用当前 serverAddr；显示回退值不会保存覆盖 |
| 连接 | `transport.tls.disableCustomTLSFirstByte` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.assetsDir` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.pprofEnable` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.serverName` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `name` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `type` | `tcp` | 官方 type 必填且没有默认；应用新建隧道预设 TCP |
| 隧道 | `enabled` | `true` | 应用默认启用，并在生成时过滤停用隧道；原生 enabled 字段从 0.66 才提供 |
| 隧道 | `transport.useEncryption` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.useCompression` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localIP` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localPort` | `无默认` | localPort 没有有效官方默认，启用普通后端时必须填正值；8080 是应用新建预设 |
| 隧道 | `remotePort` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `serverName` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `serverUser` | `空值` | 留空时使用当前连接的 user，不固定用户名或写回命名前缀 |
| 隧道 | `bindAddr` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `bindPort` | `无默认` | bindPort 默认零值无效，必须明确填写正值；STCP/XTCP 的 -1 是可选重定向设置 |
| 隧道 | `secretKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `allowUsers` | `[]` | 空列表仅允许当前 provider 的用户；不等于允许所有用户 |
| 隧道 | `customDomains` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `subdomain` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.bandwidthLimit` | `空值` | 空值或 0KB/0MB 不限速；不填写具体带宽上限 |
| 隧道 | `transport.bandwidthLimitMode` | `client` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.proxyProtocolVersion` | `空值` | 空值不生成 PROXY 协议头，不是自动选择版本 |
| 隧道 | `loadBalancer.group` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `loadBalancer.groupKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.type` | `空值` | 默认不启用健康检查；展示数值默认不会创建或启用 healthCheck |
| 隧道 | `healthCheck.timeoutSeconds` | `3` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.maxFailed` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.intervalSeconds` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.path` | `无默认` | HTTP 健康检查必须明确填写路径，没有有效官方默认；健康检查关闭时此字段不生效 |
| 隧道 | `httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `routeByHTTPUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `locations` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `multiplexer` | `httpconnect` | 官方没有默认，TCPMUX 必须明确指定 httpconnect；应用生成时提供唯一合法预设 |
| 隧道 | `protocol` | `quic` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `keepTunnelOpen` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `maxRetriesAnHour` | `8` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `minRetryInterval` | `90` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTo` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTimeoutMs` | `1000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.type` | `空值` | 默认不启用插件；展示插件字段默认不会创建或启用 plugin |
| 隧道 | `plugin.localAddr` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.crtPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.keyPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.username` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.localPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.stripPrefix` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.unixPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |

</details>

<details>
<summary>frpc 0.52.3 · 124 项配置键与类型选项</summary>

[官方发布](https://github.com/fatedier/frp/releases/tag/v0.52.3)。补丁版本继承同一 minor 清单，运行前仍由 frpc verify 校验。

### 服务器连接

- **基础连接**：`serverAddr`、`serverPort`、`user`、`auth.token`、`transport.protocol`、`transport.tls.enable`、`webServer.addr`、`webServer.port`、`loginFailExit`、`log.to`、`log.level`、`log.disablePrintColor`。
- **连接高级**：`natHoleStunServer`、`dnsServer`、`udpPacketSize`、`metadatas`。
- **认证**：`auth.method`、`auth.additionalScopes`。
- **认证（认证 oidc）**：`auth.oidc.clientID`、`auth.oidc.clientSecret`、`auth.oidc.audience`、`auth.oidc.scope`、`auth.oidc.tokenEndpointURL`、`auth.oidc.additionalEndpointParams`。
- **传输**：`transport.dialServerTimeout`、`transport.dialServerKeepalive`、`transport.poolCount`、`transport.tcpMux`、`transport.tcpMuxKeepaliveInterval`、`transport.heartbeatInterval`、`transport.heartbeatTimeout`。
- **传输（tcp/websocket/wss）**：`transport.proxyURL`、`transport.connectServerLocalIP`。
- **QUIC（quic）**：`transport.quic.keepalivePeriod`、`transport.quic.maxIdleTimeout`、`transport.quic.maxIncomingStreams`。
- **TLS**：`transport.tls.certFile`、`transport.tls.keyFile`、`transport.tls.trustedCaFile`、`transport.tls.serverName`、`transport.tls.disableCustomTLSFirstByte`。
- **本机管理**：`webServer.user`、`webServer.password`、`webServer.assetsDir`、`webServer.pprofEnable`、`webServer.tls.certFile`、`webServer.tls.keyFile`、`webServer.tls.trustedCaFile`、`webServer.tls.serverName`。
- **传输协议**：`transport.protocol.tcp`、`transport.protocol.kcp`、`transport.protocol.quic`、`transport.protocol.websocket`、`transport.protocol.wss`。
- **认证方式**：`auth.method.token`、`auth.method.oidc`。

### 隧道、访问者与插件

- **基础隧道**：`name`、`type`、`enabled`、`transport.useEncryption`、`transport.useCompression`。
- **本地后端（provider）**：`localIP`、`localPort`。
- **远程端口（provider；tcp/udp）**：`remotePort`。
- **访问者（visitor；stcp/sudp/xtcp）**：`serverName`、`serverUser`、`bindAddr`、`bindPort`。
- **私有隧道（stcp/sudp/xtcp）**：`secretKey`。
- **访问权限（provider；stcp/sudp/xtcp）**：`allowUsers`。
- **域名（provider；http/https/tcpmux）**：`customDomains`、`subdomain`。
- **元数据（provider）**：`metadatas`。
- **代理传输（provider）**：`transport.bandwidthLimit`、`transport.bandwidthLimitMode`、`transport.proxyProtocolVersion`。
- **负载均衡（provider；tcp/http/https/tcpmux）**：`loadBalancer.group`、`loadBalancer.groupKey`。
- **健康检查（provider）**：`healthCheck.type`、`healthCheck.timeoutSeconds`、`healthCheck.maxFailed`、`healthCheck.intervalSeconds`、`healthCheck.path`。
- **HTTP（provider；http/tcpmux）**：`httpUser`、`httpPassword`、`routeByHTTPUser`。
- **HTTP（provider；http）**：`locations`、`hostHeaderRewrite`、`requestHeaders.set`。
- **TCPMUX（provider；tcpmux）**：`multiplexer`。
- **XTCP（visitor；xtcp）**：`protocol`、`keepTunnelOpen`、`maxRetriesAnHour`、`minRetryInterval`、`fallbackTo`、`fallbackTimeoutMs`。
- **隧道协议**：`type.tcp`、`type.udp`、`type.http`、`type.https`、`type.stcp`、`type.sudp`、`type.xtcp`、`type.tcpmux`。
- **插件（provider；tcp/stcp/xtcp/http/https/tcpmux）**：`plugin.type`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https）**：`plugin.type.http2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http）**：`plugin.type.https2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2https）**：`plugin.type.https2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy）**：`plugin.type.http_proxy`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.type.socks5`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.type.static_file`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.type.unix_domain_socket`。
- **插件目标（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https/tls2raw）**：`plugin.localAddr`。
- **插件 HTTP（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https）**：`plugin.hostHeaderRewrite`、`plugin.requestHeaders.set`。
- **插件 TLS（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https/tls2raw）**：`plugin.crtPath`、`plugin.keyPath`。
- **插件认证（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy/static_file）**：`plugin.httpUser`、`plugin.httpPassword`。
- **SOCKS5（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.username`、`plugin.password`。
- **静态文件（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.localPath`、`plugin.stripPrefix`。
- **Unix socket（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.unixPath`。

### 配置默认值

以下按新建配置上下文列出；TCP 复用、所属用户、TLS 服务名等联动值会随表单上下文更新。类型选项不是独立字段，不重复列默认值。应用接管项同时说明官方默认和应用实际策略。

| 范围 | 配置键 | 默认值 | 说明 |
| --- | --- | --- | --- |
| 连接 | `serverAddr` | `0.0.0.0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `serverPort` | `7000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.token` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.protocol` | `tcp` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.enable` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.addr` | `127.0.0.1` | 应用固定绑定本机地址，与官方默认相同 |
| 连接 | `webServer.port` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `loginFailExit` | `false` | 应用固定为 false，以持续监督登录重试；官方默认 true |
| 连接 | `log.to` | `console` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.level` | `info` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.disablePrintColor` | `true` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `natHoleStunServer` | `stun.easyvoip.com:3478` | 0.52.0 没有 STUN 回退；从 0.52.1 起默认使用官方 STUN 地址 |
| 连接 | `dnsServer` | `空值` | 空值使用操作系统 DNS，没有固定默认 IP |
| 连接 | `udpPacketSize` | `1500` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.method` | `token` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.additionalScopes` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.clientID` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.clientSecret` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.audience` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.scope` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.tokenEndpointURL` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.additionalEndpointParams` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerTimeout` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerKeepalive` | `7200` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.poolCount` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMux` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMuxKeepaliveInterval` | `60` | 0.58.1 起默认 30 秒；此前为 60 秒 |
| 连接 | `transport.heartbeatInterval` | `30` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.heartbeatTimeout` | `90` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.proxyURL` | `由环境决定` | 默认读取 frpc 进程的 http_proxy 环境变量；前端无法确定其值 |
| 连接 | `transport.connectServerLocalIP` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.keepalivePeriod` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIdleTimeout` | `30` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIncomingStreams` | `100000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.trustedCaFile` | `空值` | 默认无 CA 文件；frpc 的 TLS 客户端此时跳过服务端证书验证，指定 CA 后启用验证 |
| 连接 | `transport.tls.serverName` | `由上下文决定` | 留空时 TLS SNI 使用当前 serverAddr；显示回退值不会保存覆盖 |
| 连接 | `transport.tls.disableCustomTLSFirstByte` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.assetsDir` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.pprofEnable` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.serverName` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `name` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `type` | `tcp` | 官方 type 必填且没有默认；应用新建隧道预设 TCP |
| 隧道 | `enabled` | `true` | 应用默认启用，并在生成时过滤停用隧道；原生 enabled 字段从 0.66 才提供 |
| 隧道 | `transport.useEncryption` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.useCompression` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localIP` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localPort` | `无默认` | localPort 没有有效官方默认，启用普通后端时必须填正值；8080 是应用新建预设 |
| 隧道 | `remotePort` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `serverName` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `serverUser` | `空值` | 留空时使用当前连接的 user，不固定用户名或写回命名前缀 |
| 隧道 | `bindAddr` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `bindPort` | `无默认` | bindPort 默认零值无效，必须明确填写正值；STCP/XTCP 的 -1 是可选重定向设置 |
| 隧道 | `secretKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `allowUsers` | `[]` | 空列表仅允许当前 provider 的用户；不等于允许所有用户 |
| 隧道 | `customDomains` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `subdomain` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.bandwidthLimit` | `空值` | 空值或 0KB/0MB 不限速；不填写具体带宽上限 |
| 隧道 | `transport.bandwidthLimitMode` | `client` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.proxyProtocolVersion` | `空值` | 空值不生成 PROXY 协议头，不是自动选择版本 |
| 隧道 | `loadBalancer.group` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `loadBalancer.groupKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.type` | `空值` | 默认不启用健康检查；展示数值默认不会创建或启用 healthCheck |
| 隧道 | `healthCheck.timeoutSeconds` | `3` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.maxFailed` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.intervalSeconds` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.path` | `无默认` | HTTP 健康检查必须明确填写路径，没有有效官方默认；健康检查关闭时此字段不生效 |
| 隧道 | `httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `routeByHTTPUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `locations` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `multiplexer` | `httpconnect` | 官方没有默认，TCPMUX 必须明确指定 httpconnect；应用生成时提供唯一合法预设 |
| 隧道 | `protocol` | `quic` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `keepTunnelOpen` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `maxRetriesAnHour` | `8` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `minRetryInterval` | `90` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTo` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTimeoutMs` | `1000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.type` | `空值` | 默认不启用插件；展示插件字段默认不会创建或启用 plugin |
| 隧道 | `plugin.localAddr` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.crtPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.keyPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.username` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.localPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.stripPrefix` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.unixPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |

</details>

<details>
<summary>frpc 0.53.0 · 124 项配置键与类型选项</summary>

[官方发布](https://github.com/fatedier/frp/releases/tag/v0.53.0)。已审核的版本配置清单。

### 服务器连接

- **基础连接**：`serverAddr`、`serverPort`、`user`、`auth.token`、`transport.protocol`、`transport.tls.enable`、`webServer.addr`、`webServer.port`、`loginFailExit`、`log.to`、`log.level`、`log.disablePrintColor`。
- **连接高级**：`natHoleStunServer`、`dnsServer`、`udpPacketSize`、`metadatas`。
- **认证**：`auth.method`、`auth.additionalScopes`。
- **认证（认证 oidc）**：`auth.oidc.clientID`、`auth.oidc.clientSecret`、`auth.oidc.audience`、`auth.oidc.scope`、`auth.oidc.tokenEndpointURL`、`auth.oidc.additionalEndpointParams`。
- **传输**：`transport.dialServerTimeout`、`transport.dialServerKeepalive`、`transport.poolCount`、`transport.tcpMux`、`transport.tcpMuxKeepaliveInterval`、`transport.heartbeatInterval`、`transport.heartbeatTimeout`。
- **传输（tcp/websocket/wss）**：`transport.proxyURL`、`transport.connectServerLocalIP`。
- **QUIC（quic）**：`transport.quic.keepalivePeriod`、`transport.quic.maxIdleTimeout`、`transport.quic.maxIncomingStreams`。
- **TLS**：`transport.tls.certFile`、`transport.tls.keyFile`、`transport.tls.trustedCaFile`、`transport.tls.serverName`、`transport.tls.disableCustomTLSFirstByte`。
- **本机管理**：`webServer.user`、`webServer.password`、`webServer.assetsDir`、`webServer.pprofEnable`、`webServer.tls.certFile`、`webServer.tls.keyFile`、`webServer.tls.trustedCaFile`、`webServer.tls.serverName`。
- **传输协议**：`transport.protocol.tcp`、`transport.protocol.kcp`、`transport.protocol.quic`、`transport.protocol.websocket`、`transport.protocol.wss`。
- **认证方式**：`auth.method.token`、`auth.method.oidc`。

### 隧道、访问者与插件

- **基础隧道**：`name`、`type`、`enabled`、`transport.useEncryption`、`transport.useCompression`。
- **本地后端（provider）**：`localIP`、`localPort`。
- **远程端口（provider；tcp/udp）**：`remotePort`。
- **访问者（visitor；stcp/sudp/xtcp）**：`serverName`、`serverUser`、`bindAddr`、`bindPort`。
- **私有隧道（stcp/sudp/xtcp）**：`secretKey`。
- **访问权限（provider；stcp/sudp/xtcp）**：`allowUsers`。
- **域名（provider；http/https/tcpmux）**：`customDomains`、`subdomain`。
- **元数据（provider）**：`metadatas`。
- **代理传输（provider）**：`transport.bandwidthLimit`、`transport.bandwidthLimitMode`、`transport.proxyProtocolVersion`。
- **负载均衡（provider；tcp/http/https/tcpmux）**：`loadBalancer.group`、`loadBalancer.groupKey`。
- **健康检查（provider）**：`healthCheck.type`、`healthCheck.timeoutSeconds`、`healthCheck.maxFailed`、`healthCheck.intervalSeconds`、`healthCheck.path`。
- **HTTP（provider；http/tcpmux）**：`httpUser`、`httpPassword`、`routeByHTTPUser`。
- **HTTP（provider；http）**：`locations`、`hostHeaderRewrite`、`requestHeaders.set`。
- **TCPMUX（provider；tcpmux）**：`multiplexer`。
- **XTCP（visitor；xtcp）**：`protocol`、`keepTunnelOpen`、`maxRetriesAnHour`、`minRetryInterval`、`fallbackTo`、`fallbackTimeoutMs`。
- **隧道协议**：`type.tcp`、`type.udp`、`type.http`、`type.https`、`type.stcp`、`type.sudp`、`type.xtcp`、`type.tcpmux`。
- **插件（provider；tcp/stcp/xtcp/http/https/tcpmux）**：`plugin.type`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https）**：`plugin.type.http2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http）**：`plugin.type.https2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2https）**：`plugin.type.https2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy）**：`plugin.type.http_proxy`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.type.socks5`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.type.static_file`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.type.unix_domain_socket`。
- **插件目标（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https/tls2raw）**：`plugin.localAddr`。
- **插件 HTTP（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https）**：`plugin.hostHeaderRewrite`、`plugin.requestHeaders.set`。
- **插件 TLS（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https/tls2raw）**：`plugin.crtPath`、`plugin.keyPath`。
- **插件认证（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy/static_file）**：`plugin.httpUser`、`plugin.httpPassword`。
- **SOCKS5（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.username`、`plugin.password`。
- **静态文件（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.localPath`、`plugin.stripPrefix`。
- **Unix socket（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.unixPath`。

### 配置默认值

以下按新建配置上下文列出；TCP 复用、所属用户、TLS 服务名等联动值会随表单上下文更新。类型选项不是独立字段，不重复列默认值。应用接管项同时说明官方默认和应用实际策略。

| 范围 | 配置键 | 默认值 | 说明 |
| --- | --- | --- | --- |
| 连接 | `serverAddr` | `0.0.0.0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `serverPort` | `7000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.token` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.protocol` | `tcp` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.enable` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.addr` | `127.0.0.1` | 应用固定绑定本机地址，与官方默认相同 |
| 连接 | `webServer.port` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `loginFailExit` | `false` | 应用固定为 false，以持续监督登录重试；官方默认 true |
| 连接 | `log.to` | `console` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.level` | `info` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.disablePrintColor` | `true` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `natHoleStunServer` | `stun.easyvoip.com:3478` | 0.52.0 没有 STUN 回退；从 0.52.1 起默认使用官方 STUN 地址 |
| 连接 | `dnsServer` | `空值` | 空值使用操作系统 DNS，没有固定默认 IP |
| 连接 | `udpPacketSize` | `1500` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.method` | `token` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.additionalScopes` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.clientID` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.clientSecret` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.audience` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.scope` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.tokenEndpointURL` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.additionalEndpointParams` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerTimeout` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerKeepalive` | `7200` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.poolCount` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMux` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMuxKeepaliveInterval` | `60` | 0.58.1 起默认 30 秒；此前为 60 秒 |
| 连接 | `transport.heartbeatInterval` | `30` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.heartbeatTimeout` | `90` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.proxyURL` | `由环境决定` | 默认读取 frpc 进程的 http_proxy 环境变量；前端无法确定其值 |
| 连接 | `transport.connectServerLocalIP` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.keepalivePeriod` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIdleTimeout` | `30` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIncomingStreams` | `100000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.trustedCaFile` | `空值` | 默认无 CA 文件；frpc 的 TLS 客户端此时跳过服务端证书验证，指定 CA 后启用验证 |
| 连接 | `transport.tls.serverName` | `由上下文决定` | 留空时 TLS SNI 使用当前 serverAddr；显示回退值不会保存覆盖 |
| 连接 | `transport.tls.disableCustomTLSFirstByte` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.assetsDir` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.pprofEnable` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.serverName` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `name` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `type` | `tcp` | 官方 type 必填且没有默认；应用新建隧道预设 TCP |
| 隧道 | `enabled` | `true` | 应用默认启用，并在生成时过滤停用隧道；原生 enabled 字段从 0.66 才提供 |
| 隧道 | `transport.useEncryption` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.useCompression` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localIP` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localPort` | `无默认` | localPort 没有有效官方默认，启用普通后端时必须填正值；8080 是应用新建预设 |
| 隧道 | `remotePort` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `serverName` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `serverUser` | `空值` | 留空时使用当前连接的 user，不固定用户名或写回命名前缀 |
| 隧道 | `bindAddr` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `bindPort` | `无默认` | bindPort 默认零值无效，必须明确填写正值；STCP/XTCP 的 -1 是可选重定向设置 |
| 隧道 | `secretKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `allowUsers` | `[]` | 空列表仅允许当前 provider 的用户；不等于允许所有用户 |
| 隧道 | `customDomains` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `subdomain` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.bandwidthLimit` | `空值` | 空值或 0KB/0MB 不限速；不填写具体带宽上限 |
| 隧道 | `transport.bandwidthLimitMode` | `client` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.proxyProtocolVersion` | `空值` | 空值不生成 PROXY 协议头，不是自动选择版本 |
| 隧道 | `loadBalancer.group` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `loadBalancer.groupKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.type` | `空值` | 默认不启用健康检查；展示数值默认不会创建或启用 healthCheck |
| 隧道 | `healthCheck.timeoutSeconds` | `3` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.maxFailed` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.intervalSeconds` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.path` | `无默认` | HTTP 健康检查必须明确填写路径，没有有效官方默认；健康检查关闭时此字段不生效 |
| 隧道 | `httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `routeByHTTPUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `locations` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `multiplexer` | `httpconnect` | 官方没有默认，TCPMUX 必须明确指定 httpconnect；应用生成时提供唯一合法预设 |
| 隧道 | `protocol` | `quic` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `keepTunnelOpen` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `maxRetriesAnHour` | `8` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `minRetryInterval` | `90` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTo` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTimeoutMs` | `1000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.type` | `空值` | 默认不启用插件；展示插件字段默认不会创建或启用 plugin |
| 隧道 | `plugin.localAddr` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.crtPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.keyPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.username` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.localPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.stripPrefix` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.unixPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |

</details>

<details>
<summary>frpc 0.53.2 · 124 项配置键与类型选项</summary>

[官方发布](https://github.com/fatedier/frp/releases/tag/v0.53.2)。补丁版本继承同一 minor 清单，运行前仍由 frpc verify 校验。

### 服务器连接

- **基础连接**：`serverAddr`、`serverPort`、`user`、`auth.token`、`transport.protocol`、`transport.tls.enable`、`webServer.addr`、`webServer.port`、`loginFailExit`、`log.to`、`log.level`、`log.disablePrintColor`。
- **连接高级**：`natHoleStunServer`、`dnsServer`、`udpPacketSize`、`metadatas`。
- **认证**：`auth.method`、`auth.additionalScopes`。
- **认证（认证 oidc）**：`auth.oidc.clientID`、`auth.oidc.clientSecret`、`auth.oidc.audience`、`auth.oidc.scope`、`auth.oidc.tokenEndpointURL`、`auth.oidc.additionalEndpointParams`。
- **传输**：`transport.dialServerTimeout`、`transport.dialServerKeepalive`、`transport.poolCount`、`transport.tcpMux`、`transport.tcpMuxKeepaliveInterval`、`transport.heartbeatInterval`、`transport.heartbeatTimeout`。
- **传输（tcp/websocket/wss）**：`transport.proxyURL`、`transport.connectServerLocalIP`。
- **QUIC（quic）**：`transport.quic.keepalivePeriod`、`transport.quic.maxIdleTimeout`、`transport.quic.maxIncomingStreams`。
- **TLS**：`transport.tls.certFile`、`transport.tls.keyFile`、`transport.tls.trustedCaFile`、`transport.tls.serverName`、`transport.tls.disableCustomTLSFirstByte`。
- **本机管理**：`webServer.user`、`webServer.password`、`webServer.assetsDir`、`webServer.pprofEnable`、`webServer.tls.certFile`、`webServer.tls.keyFile`、`webServer.tls.trustedCaFile`、`webServer.tls.serverName`。
- **传输协议**：`transport.protocol.tcp`、`transport.protocol.kcp`、`transport.protocol.quic`、`transport.protocol.websocket`、`transport.protocol.wss`。
- **认证方式**：`auth.method.token`、`auth.method.oidc`。

### 隧道、访问者与插件

- **基础隧道**：`name`、`type`、`enabled`、`transport.useEncryption`、`transport.useCompression`。
- **本地后端（provider）**：`localIP`、`localPort`。
- **远程端口（provider；tcp/udp）**：`remotePort`。
- **访问者（visitor；stcp/sudp/xtcp）**：`serverName`、`serverUser`、`bindAddr`、`bindPort`。
- **私有隧道（stcp/sudp/xtcp）**：`secretKey`。
- **访问权限（provider；stcp/sudp/xtcp）**：`allowUsers`。
- **域名（provider；http/https/tcpmux）**：`customDomains`、`subdomain`。
- **元数据（provider）**：`metadatas`。
- **代理传输（provider）**：`transport.bandwidthLimit`、`transport.bandwidthLimitMode`、`transport.proxyProtocolVersion`。
- **负载均衡（provider；tcp/http/https/tcpmux）**：`loadBalancer.group`、`loadBalancer.groupKey`。
- **健康检查（provider）**：`healthCheck.type`、`healthCheck.timeoutSeconds`、`healthCheck.maxFailed`、`healthCheck.intervalSeconds`、`healthCheck.path`。
- **HTTP（provider；http/tcpmux）**：`httpUser`、`httpPassword`、`routeByHTTPUser`。
- **HTTP（provider；http）**：`locations`、`hostHeaderRewrite`、`requestHeaders.set`。
- **TCPMUX（provider；tcpmux）**：`multiplexer`。
- **XTCP（visitor；xtcp）**：`protocol`、`keepTunnelOpen`、`maxRetriesAnHour`、`minRetryInterval`、`fallbackTo`、`fallbackTimeoutMs`。
- **隧道协议**：`type.tcp`、`type.udp`、`type.http`、`type.https`、`type.stcp`、`type.sudp`、`type.xtcp`、`type.tcpmux`。
- **插件（provider；tcp/stcp/xtcp/http/https/tcpmux）**：`plugin.type`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https）**：`plugin.type.http2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http）**：`plugin.type.https2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2https）**：`plugin.type.https2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy）**：`plugin.type.http_proxy`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.type.socks5`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.type.static_file`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.type.unix_domain_socket`。
- **插件目标（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https/tls2raw）**：`plugin.localAddr`。
- **插件 HTTP（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https）**：`plugin.hostHeaderRewrite`、`plugin.requestHeaders.set`。
- **插件 TLS（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https/tls2raw）**：`plugin.crtPath`、`plugin.keyPath`。
- **插件认证（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy/static_file）**：`plugin.httpUser`、`plugin.httpPassword`。
- **SOCKS5（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.username`、`plugin.password`。
- **静态文件（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.localPath`、`plugin.stripPrefix`。
- **Unix socket（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.unixPath`。

### 配置默认值

以下按新建配置上下文列出；TCP 复用、所属用户、TLS 服务名等联动值会随表单上下文更新。类型选项不是独立字段，不重复列默认值。应用接管项同时说明官方默认和应用实际策略。

| 范围 | 配置键 | 默认值 | 说明 |
| --- | --- | --- | --- |
| 连接 | `serverAddr` | `0.0.0.0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `serverPort` | `7000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.token` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.protocol` | `tcp` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.enable` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.addr` | `127.0.0.1` | 应用固定绑定本机地址，与官方默认相同 |
| 连接 | `webServer.port` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `loginFailExit` | `false` | 应用固定为 false，以持续监督登录重试；官方默认 true |
| 连接 | `log.to` | `console` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.level` | `info` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.disablePrintColor` | `true` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `natHoleStunServer` | `stun.easyvoip.com:3478` | 0.52.0 没有 STUN 回退；从 0.52.1 起默认使用官方 STUN 地址 |
| 连接 | `dnsServer` | `空值` | 空值使用操作系统 DNS，没有固定默认 IP |
| 连接 | `udpPacketSize` | `1500` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.method` | `token` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.additionalScopes` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.clientID` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.clientSecret` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.audience` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.scope` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.tokenEndpointURL` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.additionalEndpointParams` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerTimeout` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerKeepalive` | `7200` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.poolCount` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMux` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMuxKeepaliveInterval` | `60` | 0.58.1 起默认 30 秒；此前为 60 秒 |
| 连接 | `transport.heartbeatInterval` | `30` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.heartbeatTimeout` | `90` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.proxyURL` | `由环境决定` | 默认读取 frpc 进程的 http_proxy 环境变量；前端无法确定其值 |
| 连接 | `transport.connectServerLocalIP` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.keepalivePeriod` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIdleTimeout` | `30` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIncomingStreams` | `100000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.trustedCaFile` | `空值` | 默认无 CA 文件；frpc 的 TLS 客户端此时跳过服务端证书验证，指定 CA 后启用验证 |
| 连接 | `transport.tls.serverName` | `由上下文决定` | 留空时 TLS SNI 使用当前 serverAddr；显示回退值不会保存覆盖 |
| 连接 | `transport.tls.disableCustomTLSFirstByte` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.assetsDir` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.pprofEnable` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.serverName` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `name` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `type` | `tcp` | 官方 type 必填且没有默认；应用新建隧道预设 TCP |
| 隧道 | `enabled` | `true` | 应用默认启用，并在生成时过滤停用隧道；原生 enabled 字段从 0.66 才提供 |
| 隧道 | `transport.useEncryption` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.useCompression` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localIP` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localPort` | `无默认` | localPort 没有有效官方默认，启用普通后端时必须填正值；8080 是应用新建预设 |
| 隧道 | `remotePort` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `serverName` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `serverUser` | `空值` | 留空时使用当前连接的 user，不固定用户名或写回命名前缀 |
| 隧道 | `bindAddr` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `bindPort` | `无默认` | bindPort 默认零值无效，必须明确填写正值；STCP/XTCP 的 -1 是可选重定向设置 |
| 隧道 | `secretKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `allowUsers` | `[]` | 空列表仅允许当前 provider 的用户；不等于允许所有用户 |
| 隧道 | `customDomains` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `subdomain` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.bandwidthLimit` | `空值` | 空值或 0KB/0MB 不限速；不填写具体带宽上限 |
| 隧道 | `transport.bandwidthLimitMode` | `client` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.proxyProtocolVersion` | `空值` | 空值不生成 PROXY 协议头，不是自动选择版本 |
| 隧道 | `loadBalancer.group` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `loadBalancer.groupKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.type` | `空值` | 默认不启用健康检查；展示数值默认不会创建或启用 healthCheck |
| 隧道 | `healthCheck.timeoutSeconds` | `3` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.maxFailed` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.intervalSeconds` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.path` | `无默认` | HTTP 健康检查必须明确填写路径，没有有效官方默认；健康检查关闭时此字段不生效 |
| 隧道 | `httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `routeByHTTPUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `locations` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `multiplexer` | `httpconnect` | 官方没有默认，TCPMUX 必须明确指定 httpconnect；应用生成时提供唯一合法预设 |
| 隧道 | `protocol` | `quic` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `keepTunnelOpen` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `maxRetriesAnHour` | `8` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `minRetryInterval` | `90` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTo` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTimeoutMs` | `1000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.type` | `空值` | 默认不启用插件；展示插件字段默认不会创建或启用 plugin |
| 隧道 | `plugin.localAddr` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.crtPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.keyPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.username` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.localPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.stripPrefix` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.unixPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |

</details>

<details>
<summary>frpc 0.54.0 · 124 项配置键与类型选项</summary>

[官方发布](https://github.com/fatedier/frp/releases/tag/v0.54.0)。已审核的版本配置清单。

### 服务器连接

- **基础连接**：`serverAddr`、`serverPort`、`user`、`auth.token`、`transport.protocol`、`transport.tls.enable`、`webServer.addr`、`webServer.port`、`loginFailExit`、`log.to`、`log.level`、`log.disablePrintColor`。
- **连接高级**：`natHoleStunServer`、`dnsServer`、`udpPacketSize`、`metadatas`。
- **认证**：`auth.method`、`auth.additionalScopes`。
- **认证（认证 oidc）**：`auth.oidc.clientID`、`auth.oidc.clientSecret`、`auth.oidc.audience`、`auth.oidc.scope`、`auth.oidc.tokenEndpointURL`、`auth.oidc.additionalEndpointParams`。
- **传输**：`transport.dialServerTimeout`、`transport.dialServerKeepalive`、`transport.poolCount`、`transport.tcpMux`、`transport.tcpMuxKeepaliveInterval`、`transport.heartbeatInterval`、`transport.heartbeatTimeout`。
- **传输（tcp/websocket/wss）**：`transport.proxyURL`、`transport.connectServerLocalIP`。
- **QUIC（quic）**：`transport.quic.keepalivePeriod`、`transport.quic.maxIdleTimeout`、`transport.quic.maxIncomingStreams`。
- **TLS**：`transport.tls.certFile`、`transport.tls.keyFile`、`transport.tls.trustedCaFile`、`transport.tls.serverName`、`transport.tls.disableCustomTLSFirstByte`。
- **本机管理**：`webServer.user`、`webServer.password`、`webServer.assetsDir`、`webServer.pprofEnable`、`webServer.tls.certFile`、`webServer.tls.keyFile`、`webServer.tls.trustedCaFile`、`webServer.tls.serverName`。
- **传输协议**：`transport.protocol.tcp`、`transport.protocol.kcp`、`transport.protocol.quic`、`transport.protocol.websocket`、`transport.protocol.wss`。
- **认证方式**：`auth.method.token`、`auth.method.oidc`。

### 隧道、访问者与插件

- **基础隧道**：`name`、`type`、`enabled`、`transport.useEncryption`、`transport.useCompression`。
- **本地后端（provider）**：`localIP`、`localPort`。
- **远程端口（provider；tcp/udp）**：`remotePort`。
- **访问者（visitor；stcp/sudp/xtcp）**：`serverName`、`serverUser`、`bindAddr`、`bindPort`。
- **私有隧道（stcp/sudp/xtcp）**：`secretKey`。
- **访问权限（provider；stcp/sudp/xtcp）**：`allowUsers`。
- **域名（provider；http/https/tcpmux）**：`customDomains`、`subdomain`。
- **元数据（provider）**：`metadatas`。
- **代理传输（provider）**：`transport.bandwidthLimit`、`transport.bandwidthLimitMode`、`transport.proxyProtocolVersion`。
- **负载均衡（provider；tcp/http/https/tcpmux）**：`loadBalancer.group`、`loadBalancer.groupKey`。
- **健康检查（provider）**：`healthCheck.type`、`healthCheck.timeoutSeconds`、`healthCheck.maxFailed`、`healthCheck.intervalSeconds`、`healthCheck.path`。
- **HTTP（provider；http/tcpmux）**：`httpUser`、`httpPassword`、`routeByHTTPUser`。
- **HTTP（provider；http）**：`locations`、`hostHeaderRewrite`、`requestHeaders.set`。
- **TCPMUX（provider；tcpmux）**：`multiplexer`。
- **XTCP（visitor；xtcp）**：`protocol`、`keepTunnelOpen`、`maxRetriesAnHour`、`minRetryInterval`、`fallbackTo`、`fallbackTimeoutMs`。
- **隧道协议**：`type.tcp`、`type.udp`、`type.http`、`type.https`、`type.stcp`、`type.sudp`、`type.xtcp`、`type.tcpmux`。
- **插件（provider；tcp/stcp/xtcp/http/https/tcpmux）**：`plugin.type`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https）**：`plugin.type.http2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http）**：`plugin.type.https2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2https）**：`plugin.type.https2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy）**：`plugin.type.http_proxy`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.type.socks5`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.type.static_file`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.type.unix_domain_socket`。
- **插件目标（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https/tls2raw）**：`plugin.localAddr`。
- **插件 HTTP（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https）**：`plugin.hostHeaderRewrite`、`plugin.requestHeaders.set`。
- **插件 TLS（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https/tls2raw）**：`plugin.crtPath`、`plugin.keyPath`。
- **插件认证（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy/static_file）**：`plugin.httpUser`、`plugin.httpPassword`。
- **SOCKS5（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.username`、`plugin.password`。
- **静态文件（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.localPath`、`plugin.stripPrefix`。
- **Unix socket（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.unixPath`。

### 配置默认值

以下按新建配置上下文列出；TCP 复用、所属用户、TLS 服务名等联动值会随表单上下文更新。类型选项不是独立字段，不重复列默认值。应用接管项同时说明官方默认和应用实际策略。

| 范围 | 配置键 | 默认值 | 说明 |
| --- | --- | --- | --- |
| 连接 | `serverAddr` | `0.0.0.0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `serverPort` | `7000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.token` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.protocol` | `tcp` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.enable` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.addr` | `127.0.0.1` | 应用固定绑定本机地址，与官方默认相同 |
| 连接 | `webServer.port` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `loginFailExit` | `false` | 应用固定为 false，以持续监督登录重试；官方默认 true |
| 连接 | `log.to` | `console` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.level` | `info` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.disablePrintColor` | `true` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `natHoleStunServer` | `stun.easyvoip.com:3478` | 0.52.0 没有 STUN 回退；从 0.52.1 起默认使用官方 STUN 地址 |
| 连接 | `dnsServer` | `空值` | 空值使用操作系统 DNS，没有固定默认 IP |
| 连接 | `udpPacketSize` | `1500` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.method` | `token` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.additionalScopes` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.clientID` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.clientSecret` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.audience` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.scope` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.tokenEndpointURL` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.additionalEndpointParams` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerTimeout` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerKeepalive` | `7200` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.poolCount` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMux` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMuxKeepaliveInterval` | `60` | 0.58.1 起默认 30 秒；此前为 60 秒 |
| 连接 | `transport.heartbeatInterval` | `30` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.heartbeatTimeout` | `90` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.proxyURL` | `由环境决定` | 默认读取 frpc 进程的 http_proxy 环境变量；前端无法确定其值 |
| 连接 | `transport.connectServerLocalIP` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.keepalivePeriod` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIdleTimeout` | `30` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIncomingStreams` | `100000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.trustedCaFile` | `空值` | 默认无 CA 文件；frpc 的 TLS 客户端此时跳过服务端证书验证，指定 CA 后启用验证 |
| 连接 | `transport.tls.serverName` | `由上下文决定` | 留空时 TLS SNI 使用当前 serverAddr；显示回退值不会保存覆盖 |
| 连接 | `transport.tls.disableCustomTLSFirstByte` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.assetsDir` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.pprofEnable` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.serverName` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `name` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `type` | `tcp` | 官方 type 必填且没有默认；应用新建隧道预设 TCP |
| 隧道 | `enabled` | `true` | 应用默认启用，并在生成时过滤停用隧道；原生 enabled 字段从 0.66 才提供 |
| 隧道 | `transport.useEncryption` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.useCompression` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localIP` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localPort` | `无默认` | localPort 没有有效官方默认，启用普通后端时必须填正值；8080 是应用新建预设 |
| 隧道 | `remotePort` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `serverName` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `serverUser` | `空值` | 留空时使用当前连接的 user，不固定用户名或写回命名前缀 |
| 隧道 | `bindAddr` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `bindPort` | `无默认` | bindPort 默认零值无效，必须明确填写正值；STCP/XTCP 的 -1 是可选重定向设置 |
| 隧道 | `secretKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `allowUsers` | `[]` | 空列表仅允许当前 provider 的用户；不等于允许所有用户 |
| 隧道 | `customDomains` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `subdomain` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.bandwidthLimit` | `空值` | 空值或 0KB/0MB 不限速；不填写具体带宽上限 |
| 隧道 | `transport.bandwidthLimitMode` | `client` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.proxyProtocolVersion` | `空值` | 空值不生成 PROXY 协议头，不是自动选择版本 |
| 隧道 | `loadBalancer.group` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `loadBalancer.groupKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.type` | `空值` | 默认不启用健康检查；展示数值默认不会创建或启用 healthCheck |
| 隧道 | `healthCheck.timeoutSeconds` | `3` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.maxFailed` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.intervalSeconds` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.path` | `无默认` | HTTP 健康检查必须明确填写路径，没有有效官方默认；健康检查关闭时此字段不生效 |
| 隧道 | `httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `routeByHTTPUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `locations` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `multiplexer` | `httpconnect` | 官方没有默认，TCPMUX 必须明确指定 httpconnect；应用生成时提供唯一合法预设 |
| 隧道 | `protocol` | `quic` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `keepTunnelOpen` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `maxRetriesAnHour` | `8` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `minRetryInterval` | `90` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTo` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTimeoutMs` | `1000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.type` | `空值` | 默认不启用插件；展示插件字段默认不会创建或启用 plugin |
| 隧道 | `plugin.localAddr` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.crtPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.keyPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.username` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.localPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.stripPrefix` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.unixPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |

</details>

<details>
<summary>frpc 0.55.0 · 125 项配置键与类型选项</summary>

[官方发布](https://github.com/fatedier/frp/releases/tag/v0.55.0)。已审核的版本配置清单。

### 服务器连接

- **基础连接**：`serverAddr`、`serverPort`、`user`、`auth.token`、`transport.protocol`、`transport.tls.enable`、`webServer.addr`、`webServer.port`、`loginFailExit`、`log.to`、`log.level`、`log.disablePrintColor`。
- **连接高级**：`natHoleStunServer`、`dnsServer`、`udpPacketSize`、`metadatas`。
- **认证**：`auth.method`、`auth.additionalScopes`。
- **认证（认证 oidc）**：`auth.oidc.clientID`、`auth.oidc.clientSecret`、`auth.oidc.audience`、`auth.oidc.scope`、`auth.oidc.tokenEndpointURL`、`auth.oidc.additionalEndpointParams`。
- **传输**：`transport.dialServerTimeout`、`transport.dialServerKeepalive`、`transport.poolCount`、`transport.tcpMux`、`transport.tcpMuxKeepaliveInterval`、`transport.heartbeatInterval`、`transport.heartbeatTimeout`。
- **传输（tcp/websocket/wss）**：`transport.proxyURL`、`transport.connectServerLocalIP`。
- **QUIC（quic）**：`transport.quic.keepalivePeriod`、`transport.quic.maxIdleTimeout`、`transport.quic.maxIncomingStreams`。
- **TLS**：`transport.tls.certFile`、`transport.tls.keyFile`、`transport.tls.trustedCaFile`、`transport.tls.serverName`、`transport.tls.disableCustomTLSFirstByte`。
- **本机管理**：`webServer.user`、`webServer.password`、`webServer.assetsDir`、`webServer.pprofEnable`、`webServer.tls.certFile`、`webServer.tls.keyFile`、`webServer.tls.trustedCaFile`、`webServer.tls.serverName`。
- **传输协议**：`transport.protocol.tcp`、`transport.protocol.kcp`、`transport.protocol.quic`、`transport.protocol.websocket`、`transport.protocol.wss`。
- **认证方式**：`auth.method.token`、`auth.method.oidc`。

### 隧道、访问者与插件

- **基础隧道**：`name`、`type`、`enabled`、`transport.useEncryption`、`transport.useCompression`。
- **本地后端（provider）**：`localIP`、`localPort`。
- **远程端口（provider；tcp/udp）**：`remotePort`。
- **访问者（visitor；stcp/sudp/xtcp）**：`serverName`、`serverUser`、`bindAddr`、`bindPort`。
- **私有隧道（stcp/sudp/xtcp）**：`secretKey`。
- **访问权限（provider；stcp/sudp/xtcp）**：`allowUsers`。
- **域名（provider；http/https/tcpmux）**：`customDomains`、`subdomain`。
- **元数据（provider）**：`metadatas`。
- **注解（provider）**：`annotations`。
- **代理传输（provider）**：`transport.bandwidthLimit`、`transport.bandwidthLimitMode`、`transport.proxyProtocolVersion`。
- **负载均衡（provider；tcp/http/https/tcpmux）**：`loadBalancer.group`、`loadBalancer.groupKey`。
- **健康检查（provider）**：`healthCheck.type`、`healthCheck.timeoutSeconds`、`healthCheck.maxFailed`、`healthCheck.intervalSeconds`、`healthCheck.path`。
- **HTTP（provider；http/tcpmux）**：`httpUser`、`httpPassword`、`routeByHTTPUser`。
- **HTTP（provider；http）**：`locations`、`hostHeaderRewrite`、`requestHeaders.set`。
- **TCPMUX（provider；tcpmux）**：`multiplexer`。
- **XTCP（visitor；xtcp）**：`protocol`、`keepTunnelOpen`、`maxRetriesAnHour`、`minRetryInterval`、`fallbackTo`、`fallbackTimeoutMs`。
- **隧道协议**：`type.tcp`、`type.udp`、`type.http`、`type.https`、`type.stcp`、`type.sudp`、`type.xtcp`、`type.tcpmux`。
- **插件（provider；tcp/stcp/xtcp/http/https/tcpmux）**：`plugin.type`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https）**：`plugin.type.http2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http）**：`plugin.type.https2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2https）**：`plugin.type.https2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy）**：`plugin.type.http_proxy`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.type.socks5`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.type.static_file`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.type.unix_domain_socket`。
- **插件目标（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https/tls2raw）**：`plugin.localAddr`。
- **插件 HTTP（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https）**：`plugin.hostHeaderRewrite`、`plugin.requestHeaders.set`。
- **插件 TLS（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https/tls2raw）**：`plugin.crtPath`、`plugin.keyPath`。
- **插件认证（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy/static_file）**：`plugin.httpUser`、`plugin.httpPassword`。
- **SOCKS5（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.username`、`plugin.password`。
- **静态文件（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.localPath`、`plugin.stripPrefix`。
- **Unix socket（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.unixPath`。

### 配置默认值

以下按新建配置上下文列出；TCP 复用、所属用户、TLS 服务名等联动值会随表单上下文更新。类型选项不是独立字段，不重复列默认值。应用接管项同时说明官方默认和应用实际策略。

| 范围 | 配置键 | 默认值 | 说明 |
| --- | --- | --- | --- |
| 连接 | `serverAddr` | `0.0.0.0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `serverPort` | `7000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.token` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.protocol` | `tcp` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.enable` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.addr` | `127.0.0.1` | 应用固定绑定本机地址，与官方默认相同 |
| 连接 | `webServer.port` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `loginFailExit` | `false` | 应用固定为 false，以持续监督登录重试；官方默认 true |
| 连接 | `log.to` | `console` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.level` | `info` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.disablePrintColor` | `true` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `natHoleStunServer` | `stun.easyvoip.com:3478` | 0.52.0 没有 STUN 回退；从 0.52.1 起默认使用官方 STUN 地址 |
| 连接 | `dnsServer` | `空值` | 空值使用操作系统 DNS，没有固定默认 IP |
| 连接 | `udpPacketSize` | `1500` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.method` | `token` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.additionalScopes` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.clientID` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.clientSecret` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.audience` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.scope` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.tokenEndpointURL` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.additionalEndpointParams` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerTimeout` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerKeepalive` | `7200` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.poolCount` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMux` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMuxKeepaliveInterval` | `60` | 0.58.1 起默认 30 秒；此前为 60 秒 |
| 连接 | `transport.heartbeatInterval` | `30` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.heartbeatTimeout` | `90` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.proxyURL` | `由环境决定` | 默认读取 frpc 进程的 http_proxy 环境变量；前端无法确定其值 |
| 连接 | `transport.connectServerLocalIP` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.keepalivePeriod` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIdleTimeout` | `30` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIncomingStreams` | `100000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.trustedCaFile` | `空值` | 默认无 CA 文件；frpc 的 TLS 客户端此时跳过服务端证书验证，指定 CA 后启用验证 |
| 连接 | `transport.tls.serverName` | `由上下文决定` | 留空时 TLS SNI 使用当前 serverAddr；显示回退值不会保存覆盖 |
| 连接 | `transport.tls.disableCustomTLSFirstByte` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.assetsDir` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.pprofEnable` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.serverName` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `name` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `type` | `tcp` | 官方 type 必填且没有默认；应用新建隧道预设 TCP |
| 隧道 | `enabled` | `true` | 应用默认启用，并在生成时过滤停用隧道；原生 enabled 字段从 0.66 才提供 |
| 隧道 | `transport.useEncryption` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.useCompression` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localIP` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localPort` | `无默认` | localPort 没有有效官方默认，启用普通后端时必须填正值；8080 是应用新建预设 |
| 隧道 | `remotePort` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `serverName` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `serverUser` | `空值` | 留空时使用当前连接的 user，不固定用户名或写回命名前缀 |
| 隧道 | `bindAddr` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `bindPort` | `无默认` | bindPort 默认零值无效，必须明确填写正值；STCP/XTCP 的 -1 是可选重定向设置 |
| 隧道 | `secretKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `allowUsers` | `[]` | 空列表仅允许当前 provider 的用户；不等于允许所有用户 |
| 隧道 | `customDomains` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `subdomain` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `annotations` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.bandwidthLimit` | `空值` | 空值或 0KB/0MB 不限速；不填写具体带宽上限 |
| 隧道 | `transport.bandwidthLimitMode` | `client` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.proxyProtocolVersion` | `空值` | 空值不生成 PROXY 协议头，不是自动选择版本 |
| 隧道 | `loadBalancer.group` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `loadBalancer.groupKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.type` | `空值` | 默认不启用健康检查；展示数值默认不会创建或启用 healthCheck |
| 隧道 | `healthCheck.timeoutSeconds` | `3` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.maxFailed` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.intervalSeconds` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.path` | `无默认` | HTTP 健康检查必须明确填写路径，没有有效官方默认；健康检查关闭时此字段不生效 |
| 隧道 | `httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `routeByHTTPUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `locations` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `multiplexer` | `httpconnect` | 官方没有默认，TCPMUX 必须明确指定 httpconnect；应用生成时提供唯一合法预设 |
| 隧道 | `protocol` | `quic` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `keepTunnelOpen` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `maxRetriesAnHour` | `8` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `minRetryInterval` | `90` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTo` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTimeoutMs` | `1000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.type` | `空值` | 默认不启用插件；展示插件字段默认不会创建或启用 plugin |
| 隧道 | `plugin.localAddr` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.crtPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.keyPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.username` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.localPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.stripPrefix` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.unixPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |

</details>

<details>
<summary>frpc 0.55.1 · 125 项配置键与类型选项</summary>

[官方发布](https://github.com/fatedier/frp/releases/tag/v0.55.1)。补丁版本继承同一 minor 清单，运行前仍由 frpc verify 校验。

### 服务器连接

- **基础连接**：`serverAddr`、`serverPort`、`user`、`auth.token`、`transport.protocol`、`transport.tls.enable`、`webServer.addr`、`webServer.port`、`loginFailExit`、`log.to`、`log.level`、`log.disablePrintColor`。
- **连接高级**：`natHoleStunServer`、`dnsServer`、`udpPacketSize`、`metadatas`。
- **认证**：`auth.method`、`auth.additionalScopes`。
- **认证（认证 oidc）**：`auth.oidc.clientID`、`auth.oidc.clientSecret`、`auth.oidc.audience`、`auth.oidc.scope`、`auth.oidc.tokenEndpointURL`、`auth.oidc.additionalEndpointParams`。
- **传输**：`transport.dialServerTimeout`、`transport.dialServerKeepalive`、`transport.poolCount`、`transport.tcpMux`、`transport.tcpMuxKeepaliveInterval`、`transport.heartbeatInterval`、`transport.heartbeatTimeout`。
- **传输（tcp/websocket/wss）**：`transport.proxyURL`、`transport.connectServerLocalIP`。
- **QUIC（quic）**：`transport.quic.keepalivePeriod`、`transport.quic.maxIdleTimeout`、`transport.quic.maxIncomingStreams`。
- **TLS**：`transport.tls.certFile`、`transport.tls.keyFile`、`transport.tls.trustedCaFile`、`transport.tls.serverName`、`transport.tls.disableCustomTLSFirstByte`。
- **本机管理**：`webServer.user`、`webServer.password`、`webServer.assetsDir`、`webServer.pprofEnable`、`webServer.tls.certFile`、`webServer.tls.keyFile`、`webServer.tls.trustedCaFile`、`webServer.tls.serverName`。
- **传输协议**：`transport.protocol.tcp`、`transport.protocol.kcp`、`transport.protocol.quic`、`transport.protocol.websocket`、`transport.protocol.wss`。
- **认证方式**：`auth.method.token`、`auth.method.oidc`。

### 隧道、访问者与插件

- **基础隧道**：`name`、`type`、`enabled`、`transport.useEncryption`、`transport.useCompression`。
- **本地后端（provider）**：`localIP`、`localPort`。
- **远程端口（provider；tcp/udp）**：`remotePort`。
- **访问者（visitor；stcp/sudp/xtcp）**：`serverName`、`serverUser`、`bindAddr`、`bindPort`。
- **私有隧道（stcp/sudp/xtcp）**：`secretKey`。
- **访问权限（provider；stcp/sudp/xtcp）**：`allowUsers`。
- **域名（provider；http/https/tcpmux）**：`customDomains`、`subdomain`。
- **元数据（provider）**：`metadatas`。
- **注解（provider）**：`annotations`。
- **代理传输（provider）**：`transport.bandwidthLimit`、`transport.bandwidthLimitMode`、`transport.proxyProtocolVersion`。
- **负载均衡（provider；tcp/http/https/tcpmux）**：`loadBalancer.group`、`loadBalancer.groupKey`。
- **健康检查（provider）**：`healthCheck.type`、`healthCheck.timeoutSeconds`、`healthCheck.maxFailed`、`healthCheck.intervalSeconds`、`healthCheck.path`。
- **HTTP（provider；http/tcpmux）**：`httpUser`、`httpPassword`、`routeByHTTPUser`。
- **HTTP（provider；http）**：`locations`、`hostHeaderRewrite`、`requestHeaders.set`。
- **TCPMUX（provider；tcpmux）**：`multiplexer`。
- **XTCP（visitor；xtcp）**：`protocol`、`keepTunnelOpen`、`maxRetriesAnHour`、`minRetryInterval`、`fallbackTo`、`fallbackTimeoutMs`。
- **隧道协议**：`type.tcp`、`type.udp`、`type.http`、`type.https`、`type.stcp`、`type.sudp`、`type.xtcp`、`type.tcpmux`。
- **插件（provider；tcp/stcp/xtcp/http/https/tcpmux）**：`plugin.type`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https）**：`plugin.type.http2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http）**：`plugin.type.https2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2https）**：`plugin.type.https2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy）**：`plugin.type.http_proxy`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.type.socks5`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.type.static_file`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.type.unix_domain_socket`。
- **插件目标（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https/tls2raw）**：`plugin.localAddr`。
- **插件 HTTP（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https）**：`plugin.hostHeaderRewrite`、`plugin.requestHeaders.set`。
- **插件 TLS（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https/tls2raw）**：`plugin.crtPath`、`plugin.keyPath`。
- **插件认证（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy/static_file）**：`plugin.httpUser`、`plugin.httpPassword`。
- **SOCKS5（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.username`、`plugin.password`。
- **静态文件（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.localPath`、`plugin.stripPrefix`。
- **Unix socket（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.unixPath`。

### 配置默认值

以下按新建配置上下文列出；TCP 复用、所属用户、TLS 服务名等联动值会随表单上下文更新。类型选项不是独立字段，不重复列默认值。应用接管项同时说明官方默认和应用实际策略。

| 范围 | 配置键 | 默认值 | 说明 |
| --- | --- | --- | --- |
| 连接 | `serverAddr` | `0.0.0.0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `serverPort` | `7000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.token` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.protocol` | `tcp` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.enable` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.addr` | `127.0.0.1` | 应用固定绑定本机地址，与官方默认相同 |
| 连接 | `webServer.port` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `loginFailExit` | `false` | 应用固定为 false，以持续监督登录重试；官方默认 true |
| 连接 | `log.to` | `console` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.level` | `info` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.disablePrintColor` | `true` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `natHoleStunServer` | `stun.easyvoip.com:3478` | 0.52.0 没有 STUN 回退；从 0.52.1 起默认使用官方 STUN 地址 |
| 连接 | `dnsServer` | `空值` | 空值使用操作系统 DNS，没有固定默认 IP |
| 连接 | `udpPacketSize` | `1500` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.method` | `token` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.additionalScopes` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.clientID` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.clientSecret` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.audience` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.scope` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.tokenEndpointURL` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.additionalEndpointParams` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerTimeout` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerKeepalive` | `7200` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.poolCount` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMux` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMuxKeepaliveInterval` | `60` | 0.58.1 起默认 30 秒；此前为 60 秒 |
| 连接 | `transport.heartbeatInterval` | `30` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.heartbeatTimeout` | `90` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.proxyURL` | `由环境决定` | 默认读取 frpc 进程的 http_proxy 环境变量；前端无法确定其值 |
| 连接 | `transport.connectServerLocalIP` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.keepalivePeriod` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIdleTimeout` | `30` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIncomingStreams` | `100000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.trustedCaFile` | `空值` | 默认无 CA 文件；frpc 的 TLS 客户端此时跳过服务端证书验证，指定 CA 后启用验证 |
| 连接 | `transport.tls.serverName` | `由上下文决定` | 留空时 TLS SNI 使用当前 serverAddr；显示回退值不会保存覆盖 |
| 连接 | `transport.tls.disableCustomTLSFirstByte` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.assetsDir` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.pprofEnable` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.serverName` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `name` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `type` | `tcp` | 官方 type 必填且没有默认；应用新建隧道预设 TCP |
| 隧道 | `enabled` | `true` | 应用默认启用，并在生成时过滤停用隧道；原生 enabled 字段从 0.66 才提供 |
| 隧道 | `transport.useEncryption` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.useCompression` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localIP` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localPort` | `无默认` | localPort 没有有效官方默认，启用普通后端时必须填正值；8080 是应用新建预设 |
| 隧道 | `remotePort` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `serverName` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `serverUser` | `空值` | 留空时使用当前连接的 user，不固定用户名或写回命名前缀 |
| 隧道 | `bindAddr` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `bindPort` | `无默认` | bindPort 默认零值无效，必须明确填写正值；STCP/XTCP 的 -1 是可选重定向设置 |
| 隧道 | `secretKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `allowUsers` | `[]` | 空列表仅允许当前 provider 的用户；不等于允许所有用户 |
| 隧道 | `customDomains` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `subdomain` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `annotations` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.bandwidthLimit` | `空值` | 空值或 0KB/0MB 不限速；不填写具体带宽上限 |
| 隧道 | `transport.bandwidthLimitMode` | `client` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.proxyProtocolVersion` | `空值` | 空值不生成 PROXY 协议头，不是自动选择版本 |
| 隧道 | `loadBalancer.group` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `loadBalancer.groupKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.type` | `空值` | 默认不启用健康检查；展示数值默认不会创建或启用 healthCheck |
| 隧道 | `healthCheck.timeoutSeconds` | `3` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.maxFailed` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.intervalSeconds` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.path` | `无默认` | HTTP 健康检查必须明确填写路径，没有有效官方默认；健康检查关闭时此字段不生效 |
| 隧道 | `httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `routeByHTTPUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `locations` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `multiplexer` | `httpconnect` | 官方没有默认，TCPMUX 必须明确指定 httpconnect；应用生成时提供唯一合法预设 |
| 隧道 | `protocol` | `quic` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `keepTunnelOpen` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `maxRetriesAnHour` | `8` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `minRetryInterval` | `90` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTo` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTimeoutMs` | `1000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.type` | `空值` | 默认不启用插件；展示插件字段默认不会创建或启用 plugin |
| 隧道 | `plugin.localAddr` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.crtPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.keyPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.username` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.localPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.stripPrefix` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.unixPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |

</details>

<details>
<summary>frpc 0.56.0 · 126 项配置键与类型选项</summary>

[官方发布](https://github.com/fatedier/frp/releases/tag/v0.56.0)。已审核的版本配置清单。

### 服务器连接

- **基础连接**：`serverAddr`、`serverPort`、`user`、`auth.token`、`transport.protocol`、`transport.tls.enable`、`webServer.addr`、`webServer.port`、`loginFailExit`、`log.to`、`log.level`、`log.disablePrintColor`。
- **连接高级**：`natHoleStunServer`、`dnsServer`、`udpPacketSize`、`metadatas`。
- **认证**：`auth.method`、`auth.additionalScopes`。
- **认证（认证 oidc）**：`auth.oidc.clientID`、`auth.oidc.clientSecret`、`auth.oidc.audience`、`auth.oidc.scope`、`auth.oidc.tokenEndpointURL`、`auth.oidc.additionalEndpointParams`。
- **传输**：`transport.dialServerTimeout`、`transport.dialServerKeepalive`、`transport.poolCount`、`transport.tcpMux`、`transport.tcpMuxKeepaliveInterval`、`transport.heartbeatInterval`、`transport.heartbeatTimeout`。
- **传输（tcp/websocket/wss）**：`transport.proxyURL`、`transport.connectServerLocalIP`。
- **QUIC（quic）**：`transport.quic.keepalivePeriod`、`transport.quic.maxIdleTimeout`、`transport.quic.maxIncomingStreams`。
- **TLS**：`transport.tls.certFile`、`transport.tls.keyFile`、`transport.tls.trustedCaFile`、`transport.tls.serverName`、`transport.tls.disableCustomTLSFirstByte`。
- **本机管理**：`webServer.user`、`webServer.password`、`webServer.assetsDir`、`webServer.pprofEnable`、`webServer.tls.certFile`、`webServer.tls.keyFile`、`webServer.tls.trustedCaFile`、`webServer.tls.serverName`。
- **传输协议**：`transport.protocol.tcp`、`transport.protocol.kcp`、`transport.protocol.quic`、`transport.protocol.websocket`、`transport.protocol.wss`。
- **认证方式**：`auth.method.token`、`auth.method.oidc`。

### 隧道、访问者与插件

- **基础隧道**：`name`、`type`、`enabled`、`transport.useEncryption`、`transport.useCompression`。
- **本地后端（provider）**：`localIP`、`localPort`。
- **远程端口（provider；tcp/udp）**：`remotePort`。
- **访问者（visitor；stcp/sudp/xtcp）**：`serverName`、`serverUser`、`bindAddr`、`bindPort`。
- **私有隧道（stcp/sudp/xtcp）**：`secretKey`。
- **访问权限（provider；stcp/sudp/xtcp）**：`allowUsers`。
- **域名（provider；http/https/tcpmux）**：`customDomains`、`subdomain`。
- **元数据（provider）**：`metadatas`。
- **注解（provider）**：`annotations`。
- **代理传输（provider）**：`transport.bandwidthLimit`、`transport.bandwidthLimitMode`、`transport.proxyProtocolVersion`。
- **负载均衡（provider；tcp/http/https/tcpmux）**：`loadBalancer.group`、`loadBalancer.groupKey`。
- **健康检查（provider）**：`healthCheck.type`、`healthCheck.timeoutSeconds`、`healthCheck.maxFailed`、`healthCheck.intervalSeconds`、`healthCheck.path`、`healthCheck.httpHeaders`。
- **HTTP（provider；http/tcpmux）**：`httpUser`、`httpPassword`、`routeByHTTPUser`。
- **HTTP（provider；http）**：`locations`、`hostHeaderRewrite`、`requestHeaders.set`。
- **TCPMUX（provider；tcpmux）**：`multiplexer`。
- **XTCP（visitor；xtcp）**：`protocol`、`keepTunnelOpen`、`maxRetriesAnHour`、`minRetryInterval`、`fallbackTo`、`fallbackTimeoutMs`。
- **隧道协议**：`type.tcp`、`type.udp`、`type.http`、`type.https`、`type.stcp`、`type.sudp`、`type.xtcp`、`type.tcpmux`。
- **插件（provider；tcp/stcp/xtcp/http/https/tcpmux）**：`plugin.type`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https）**：`plugin.type.http2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http）**：`plugin.type.https2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2https）**：`plugin.type.https2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy）**：`plugin.type.http_proxy`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.type.socks5`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.type.static_file`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.type.unix_domain_socket`。
- **插件目标（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https/tls2raw）**：`plugin.localAddr`。
- **插件 HTTP（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https）**：`plugin.hostHeaderRewrite`、`plugin.requestHeaders.set`。
- **插件 TLS（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https/tls2raw）**：`plugin.crtPath`、`plugin.keyPath`。
- **插件认证（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy/static_file）**：`plugin.httpUser`、`plugin.httpPassword`。
- **SOCKS5（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.username`、`plugin.password`。
- **静态文件（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.localPath`、`plugin.stripPrefix`。
- **Unix socket（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.unixPath`。

### 配置默认值

以下按新建配置上下文列出；TCP 复用、所属用户、TLS 服务名等联动值会随表单上下文更新。类型选项不是独立字段，不重复列默认值。应用接管项同时说明官方默认和应用实际策略。

| 范围 | 配置键 | 默认值 | 说明 |
| --- | --- | --- | --- |
| 连接 | `serverAddr` | `0.0.0.0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `serverPort` | `7000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.token` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.protocol` | `tcp` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.enable` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.addr` | `127.0.0.1` | 应用固定绑定本机地址，与官方默认相同 |
| 连接 | `webServer.port` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `loginFailExit` | `false` | 应用固定为 false，以持续监督登录重试；官方默认 true |
| 连接 | `log.to` | `console` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.level` | `info` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.disablePrintColor` | `true` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `natHoleStunServer` | `stun.easyvoip.com:3478` | 0.52.0 没有 STUN 回退；从 0.52.1 起默认使用官方 STUN 地址 |
| 连接 | `dnsServer` | `空值` | 空值使用操作系统 DNS，没有固定默认 IP |
| 连接 | `udpPacketSize` | `1500` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.method` | `token` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.additionalScopes` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.clientID` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.clientSecret` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.audience` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.scope` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.tokenEndpointURL` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.additionalEndpointParams` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerTimeout` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerKeepalive` | `7200` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.poolCount` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMux` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMuxKeepaliveInterval` | `60` | 0.58.1 起默认 30 秒；此前为 60 秒 |
| 连接 | `transport.heartbeatInterval` | `30` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.heartbeatTimeout` | `90` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.proxyURL` | `由环境决定` | 默认读取 frpc 进程的 http_proxy 环境变量；前端无法确定其值 |
| 连接 | `transport.connectServerLocalIP` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.keepalivePeriod` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIdleTimeout` | `30` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIncomingStreams` | `100000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.trustedCaFile` | `空值` | 默认无 CA 文件；frpc 的 TLS 客户端此时跳过服务端证书验证，指定 CA 后启用验证 |
| 连接 | `transport.tls.serverName` | `由上下文决定` | 留空时 TLS SNI 使用当前 serverAddr；显示回退值不会保存覆盖 |
| 连接 | `transport.tls.disableCustomTLSFirstByte` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.assetsDir` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.pprofEnable` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.serverName` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `name` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `type` | `tcp` | 官方 type 必填且没有默认；应用新建隧道预设 TCP |
| 隧道 | `enabled` | `true` | 应用默认启用，并在生成时过滤停用隧道；原生 enabled 字段从 0.66 才提供 |
| 隧道 | `transport.useEncryption` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.useCompression` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localIP` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localPort` | `无默认` | localPort 没有有效官方默认，启用普通后端时必须填正值；8080 是应用新建预设 |
| 隧道 | `remotePort` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `serverName` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `serverUser` | `空值` | 留空时使用当前连接的 user，不固定用户名或写回命名前缀 |
| 隧道 | `bindAddr` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `bindPort` | `无默认` | bindPort 默认零值无效，必须明确填写正值；STCP/XTCP 的 -1 是可选重定向设置 |
| 隧道 | `secretKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `allowUsers` | `[]` | 空列表仅允许当前 provider 的用户；不等于允许所有用户 |
| 隧道 | `customDomains` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `subdomain` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `annotations` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.bandwidthLimit` | `空值` | 空值或 0KB/0MB 不限速；不填写具体带宽上限 |
| 隧道 | `transport.bandwidthLimitMode` | `client` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.proxyProtocolVersion` | `空值` | 空值不生成 PROXY 协议头，不是自动选择版本 |
| 隧道 | `loadBalancer.group` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `loadBalancer.groupKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.type` | `空值` | 默认不启用健康检查；展示数值默认不会创建或启用 healthCheck |
| 隧道 | `healthCheck.timeoutSeconds` | `3` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.maxFailed` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.intervalSeconds` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.path` | `无默认` | HTTP 健康检查必须明确填写路径，没有有效官方默认；健康检查关闭时此字段不生效 |
| 隧道 | `healthCheck.httpHeaders` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `routeByHTTPUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `locations` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `multiplexer` | `httpconnect` | 官方没有默认，TCPMUX 必须明确指定 httpconnect；应用生成时提供唯一合法预设 |
| 隧道 | `protocol` | `quic` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `keepTunnelOpen` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `maxRetriesAnHour` | `8` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `minRetryInterval` | `90` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTo` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTimeoutMs` | `1000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.type` | `空值` | 默认不启用插件；展示插件字段默认不会创建或启用 plugin |
| 隧道 | `plugin.localAddr` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.crtPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.keyPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.username` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.localPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.stripPrefix` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.unixPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |

</details>

<details>
<summary>frpc 0.57.0 · 126 项配置键与类型选项</summary>

[官方发布](https://github.com/fatedier/frp/releases/tag/v0.57.0)。已审核的版本配置清单。

### 服务器连接

- **基础连接**：`serverAddr`、`serverPort`、`user`、`auth.token`、`transport.protocol`、`transport.tls.enable`、`webServer.addr`、`webServer.port`、`loginFailExit`、`log.to`、`log.level`、`log.disablePrintColor`。
- **连接高级**：`natHoleStunServer`、`dnsServer`、`udpPacketSize`、`metadatas`。
- **认证**：`auth.method`、`auth.additionalScopes`。
- **认证（认证 oidc）**：`auth.oidc.clientID`、`auth.oidc.clientSecret`、`auth.oidc.audience`、`auth.oidc.scope`、`auth.oidc.tokenEndpointURL`、`auth.oidc.additionalEndpointParams`。
- **传输**：`transport.dialServerTimeout`、`transport.dialServerKeepalive`、`transport.poolCount`、`transport.tcpMux`、`transport.tcpMuxKeepaliveInterval`、`transport.heartbeatInterval`、`transport.heartbeatTimeout`。
- **传输（tcp/websocket/wss）**：`transport.proxyURL`、`transport.connectServerLocalIP`。
- **QUIC（quic）**：`transport.quic.keepalivePeriod`、`transport.quic.maxIdleTimeout`、`transport.quic.maxIncomingStreams`。
- **TLS**：`transport.tls.certFile`、`transport.tls.keyFile`、`transport.tls.trustedCaFile`、`transport.tls.serverName`、`transport.tls.disableCustomTLSFirstByte`。
- **本机管理**：`webServer.user`、`webServer.password`、`webServer.assetsDir`、`webServer.pprofEnable`、`webServer.tls.certFile`、`webServer.tls.keyFile`、`webServer.tls.trustedCaFile`、`webServer.tls.serverName`。
- **传输协议**：`transport.protocol.tcp`、`transport.protocol.kcp`、`transport.protocol.quic`、`transport.protocol.websocket`、`transport.protocol.wss`。
- **认证方式**：`auth.method.token`、`auth.method.oidc`。

### 隧道、访问者与插件

- **基础隧道**：`name`、`type`、`enabled`、`transport.useEncryption`、`transport.useCompression`。
- **本地后端（provider）**：`localIP`、`localPort`。
- **远程端口（provider；tcp/udp）**：`remotePort`。
- **访问者（visitor；stcp/sudp/xtcp）**：`serverName`、`serverUser`、`bindAddr`、`bindPort`。
- **私有隧道（stcp/sudp/xtcp）**：`secretKey`。
- **访问权限（provider；stcp/sudp/xtcp）**：`allowUsers`。
- **域名（provider；http/https/tcpmux）**：`customDomains`、`subdomain`。
- **元数据（provider）**：`metadatas`。
- **注解（provider）**：`annotations`。
- **代理传输（provider）**：`transport.bandwidthLimit`、`transport.bandwidthLimitMode`、`transport.proxyProtocolVersion`。
- **负载均衡（provider；tcp/http/https/tcpmux）**：`loadBalancer.group`、`loadBalancer.groupKey`。
- **健康检查（provider）**：`healthCheck.type`、`healthCheck.timeoutSeconds`、`healthCheck.maxFailed`、`healthCheck.intervalSeconds`、`healthCheck.path`、`healthCheck.httpHeaders`。
- **HTTP（provider；http/tcpmux）**：`httpUser`、`httpPassword`、`routeByHTTPUser`。
- **HTTP（provider；http）**：`locations`、`hostHeaderRewrite`、`requestHeaders.set`。
- **TCPMUX（provider；tcpmux）**：`multiplexer`。
- **XTCP（visitor；xtcp）**：`protocol`、`keepTunnelOpen`、`maxRetriesAnHour`、`minRetryInterval`、`fallbackTo`、`fallbackTimeoutMs`。
- **隧道协议**：`type.tcp`、`type.udp`、`type.http`、`type.https`、`type.stcp`、`type.sudp`、`type.xtcp`、`type.tcpmux`。
- **插件（provider；tcp/stcp/xtcp/http/https/tcpmux）**：`plugin.type`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https）**：`plugin.type.http2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http）**：`plugin.type.https2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2https）**：`plugin.type.https2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy）**：`plugin.type.http_proxy`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.type.socks5`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.type.static_file`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.type.unix_domain_socket`。
- **插件目标（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https/tls2raw）**：`plugin.localAddr`。
- **插件 HTTP（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https）**：`plugin.hostHeaderRewrite`、`plugin.requestHeaders.set`。
- **插件 TLS（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https/tls2raw）**：`plugin.crtPath`、`plugin.keyPath`。
- **插件认证（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy/static_file）**：`plugin.httpUser`、`plugin.httpPassword`。
- **SOCKS5（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.username`、`plugin.password`。
- **静态文件（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.localPath`、`plugin.stripPrefix`。
- **Unix socket（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.unixPath`。

### 配置默认值

以下按新建配置上下文列出；TCP 复用、所属用户、TLS 服务名等联动值会随表单上下文更新。类型选项不是独立字段，不重复列默认值。应用接管项同时说明官方默认和应用实际策略。

| 范围 | 配置键 | 默认值 | 说明 |
| --- | --- | --- | --- |
| 连接 | `serverAddr` | `0.0.0.0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `serverPort` | `7000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.token` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.protocol` | `tcp` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.enable` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.addr` | `127.0.0.1` | 应用固定绑定本机地址，与官方默认相同 |
| 连接 | `webServer.port` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `loginFailExit` | `false` | 应用固定为 false，以持续监督登录重试；官方默认 true |
| 连接 | `log.to` | `console` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.level` | `info` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.disablePrintColor` | `true` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `natHoleStunServer` | `stun.easyvoip.com:3478` | 0.52.0 没有 STUN 回退；从 0.52.1 起默认使用官方 STUN 地址 |
| 连接 | `dnsServer` | `空值` | 空值使用操作系统 DNS，没有固定默认 IP |
| 连接 | `udpPacketSize` | `1500` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.method` | `token` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.additionalScopes` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.clientID` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.clientSecret` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.audience` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.scope` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.tokenEndpointURL` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.additionalEndpointParams` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerTimeout` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerKeepalive` | `7200` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.poolCount` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMux` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMuxKeepaliveInterval` | `60` | 0.58.1 起默认 30 秒；此前为 60 秒 |
| 连接 | `transport.heartbeatInterval` | `30` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.heartbeatTimeout` | `90` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.proxyURL` | `由环境决定` | 默认读取 frpc 进程的 http_proxy 环境变量；前端无法确定其值 |
| 连接 | `transport.connectServerLocalIP` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.keepalivePeriod` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIdleTimeout` | `30` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIncomingStreams` | `100000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.trustedCaFile` | `空值` | 默认无 CA 文件；frpc 的 TLS 客户端此时跳过服务端证书验证，指定 CA 后启用验证 |
| 连接 | `transport.tls.serverName` | `由上下文决定` | 留空时 TLS SNI 使用当前 serverAddr；显示回退值不会保存覆盖 |
| 连接 | `transport.tls.disableCustomTLSFirstByte` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.assetsDir` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.pprofEnable` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.serverName` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `name` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `type` | `tcp` | 官方 type 必填且没有默认；应用新建隧道预设 TCP |
| 隧道 | `enabled` | `true` | 应用默认启用，并在生成时过滤停用隧道；原生 enabled 字段从 0.66 才提供 |
| 隧道 | `transport.useEncryption` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.useCompression` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localIP` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localPort` | `无默认` | localPort 没有有效官方默认，启用普通后端时必须填正值；8080 是应用新建预设 |
| 隧道 | `remotePort` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `serverName` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `serverUser` | `空值` | 留空时使用当前连接的 user，不固定用户名或写回命名前缀 |
| 隧道 | `bindAddr` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `bindPort` | `无默认` | bindPort 默认零值无效，必须明确填写正值；STCP/XTCP 的 -1 是可选重定向设置 |
| 隧道 | `secretKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `allowUsers` | `[]` | 空列表仅允许当前 provider 的用户；不等于允许所有用户 |
| 隧道 | `customDomains` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `subdomain` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `annotations` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.bandwidthLimit` | `空值` | 空值或 0KB/0MB 不限速；不填写具体带宽上限 |
| 隧道 | `transport.bandwidthLimitMode` | `client` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.proxyProtocolVersion` | `空值` | 空值不生成 PROXY 协议头，不是自动选择版本 |
| 隧道 | `loadBalancer.group` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `loadBalancer.groupKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.type` | `空值` | 默认不启用健康检查；展示数值默认不会创建或启用 healthCheck |
| 隧道 | `healthCheck.timeoutSeconds` | `3` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.maxFailed` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.intervalSeconds` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.path` | `无默认` | HTTP 健康检查必须明确填写路径，没有有效官方默认；健康检查关闭时此字段不生效 |
| 隧道 | `healthCheck.httpHeaders` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `routeByHTTPUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `locations` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `multiplexer` | `httpconnect` | 官方没有默认，TCPMUX 必须明确指定 httpconnect；应用生成时提供唯一合法预设 |
| 隧道 | `protocol` | `quic` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `keepTunnelOpen` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `maxRetriesAnHour` | `8` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `minRetryInterval` | `90` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTo` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTimeoutMs` | `1000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.type` | `空值` | 默认不启用插件；展示插件字段默认不会创建或启用 plugin |
| 隧道 | `plugin.localAddr` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.crtPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.keyPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.username` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.localPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.stripPrefix` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.unixPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |

</details>

<details>
<summary>frpc 0.58.0 · 127 项配置键与类型选项</summary>

[官方发布](https://github.com/fatedier/frp/releases/tag/v0.58.0)。已审核的版本配置清单。

### 服务器连接

- **基础连接**：`serverAddr`、`serverPort`、`user`、`auth.token`、`transport.protocol`、`transport.tls.enable`、`webServer.addr`、`webServer.port`、`loginFailExit`、`log.to`、`log.level`、`log.disablePrintColor`。
- **连接高级**：`natHoleStunServer`、`dnsServer`、`udpPacketSize`、`metadatas`。
- **认证**：`auth.method`、`auth.additionalScopes`。
- **认证（认证 oidc）**：`auth.oidc.clientID`、`auth.oidc.clientSecret`、`auth.oidc.audience`、`auth.oidc.scope`、`auth.oidc.tokenEndpointURL`、`auth.oidc.additionalEndpointParams`。
- **传输**：`transport.dialServerTimeout`、`transport.dialServerKeepalive`、`transport.poolCount`、`transport.tcpMux`、`transport.tcpMuxKeepaliveInterval`、`transport.heartbeatInterval`、`transport.heartbeatTimeout`。
- **传输（tcp/websocket/wss）**：`transport.proxyURL`、`transport.connectServerLocalIP`。
- **QUIC（quic）**：`transport.quic.keepalivePeriod`、`transport.quic.maxIdleTimeout`、`transport.quic.maxIncomingStreams`。
- **TLS**：`transport.tls.certFile`、`transport.tls.keyFile`、`transport.tls.trustedCaFile`、`transport.tls.serverName`、`transport.tls.disableCustomTLSFirstByte`。
- **本机管理**：`webServer.user`、`webServer.password`、`webServer.assetsDir`、`webServer.pprofEnable`、`webServer.tls.certFile`、`webServer.tls.keyFile`、`webServer.tls.trustedCaFile`、`webServer.tls.serverName`。
- **传输协议**：`transport.protocol.tcp`、`transport.protocol.kcp`、`transport.protocol.quic`、`transport.protocol.websocket`、`transport.protocol.wss`。
- **认证方式**：`auth.method.token`、`auth.method.oidc`。

### 隧道、访问者与插件

- **基础隧道**：`name`、`type`、`enabled`、`transport.useEncryption`、`transport.useCompression`。
- **本地后端（provider）**：`localIP`、`localPort`。
- **远程端口（provider；tcp/udp）**：`remotePort`。
- **访问者（visitor；stcp/sudp/xtcp）**：`serverName`、`serverUser`、`bindAddr`、`bindPort`。
- **私有隧道（stcp/sudp/xtcp）**：`secretKey`。
- **访问权限（provider；stcp/sudp/xtcp）**：`allowUsers`。
- **域名（provider；http/https/tcpmux）**：`customDomains`、`subdomain`。
- **元数据（provider）**：`metadatas`。
- **注解（provider）**：`annotations`。
- **代理传输（provider）**：`transport.bandwidthLimit`、`transport.bandwidthLimitMode`、`transport.proxyProtocolVersion`。
- **负载均衡（provider；tcp/http/https/tcpmux）**：`loadBalancer.group`、`loadBalancer.groupKey`。
- **健康检查（provider）**：`healthCheck.type`、`healthCheck.timeoutSeconds`、`healthCheck.maxFailed`、`healthCheck.intervalSeconds`、`healthCheck.path`、`healthCheck.httpHeaders`。
- **HTTP（provider；http/tcpmux）**：`httpUser`、`httpPassword`、`routeByHTTPUser`。
- **HTTP（provider；http）**：`locations`、`hostHeaderRewrite`、`requestHeaders.set`。
- **HTTP 响应头（provider；http）**：`responseHeaders.set`。
- **TCPMUX（provider；tcpmux）**：`multiplexer`。
- **XTCP（visitor；xtcp）**：`protocol`、`keepTunnelOpen`、`maxRetriesAnHour`、`minRetryInterval`、`fallbackTo`、`fallbackTimeoutMs`。
- **隧道协议**：`type.tcp`、`type.udp`、`type.http`、`type.https`、`type.stcp`、`type.sudp`、`type.xtcp`、`type.tcpmux`。
- **插件（provider；tcp/stcp/xtcp/http/https/tcpmux）**：`plugin.type`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https）**：`plugin.type.http2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http）**：`plugin.type.https2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2https）**：`plugin.type.https2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy）**：`plugin.type.http_proxy`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.type.socks5`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.type.static_file`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.type.unix_domain_socket`。
- **插件目标（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https/tls2raw）**：`plugin.localAddr`。
- **插件 HTTP（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https）**：`plugin.hostHeaderRewrite`、`plugin.requestHeaders.set`。
- **插件 TLS（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https/tls2raw）**：`plugin.crtPath`、`plugin.keyPath`。
- **插件认证（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy/static_file）**：`plugin.httpUser`、`plugin.httpPassword`。
- **SOCKS5（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.username`、`plugin.password`。
- **静态文件（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.localPath`、`plugin.stripPrefix`。
- **Unix socket（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.unixPath`。

### 配置默认值

以下按新建配置上下文列出；TCP 复用、所属用户、TLS 服务名等联动值会随表单上下文更新。类型选项不是独立字段，不重复列默认值。应用接管项同时说明官方默认和应用实际策略。

| 范围 | 配置键 | 默认值 | 说明 |
| --- | --- | --- | --- |
| 连接 | `serverAddr` | `0.0.0.0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `serverPort` | `7000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.token` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.protocol` | `tcp` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.enable` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.addr` | `127.0.0.1` | 应用固定绑定本机地址，与官方默认相同 |
| 连接 | `webServer.port` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `loginFailExit` | `false` | 应用固定为 false，以持续监督登录重试；官方默认 true |
| 连接 | `log.to` | `console` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.level` | `info` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.disablePrintColor` | `true` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `natHoleStunServer` | `stun.easyvoip.com:3478` | 0.52.0 没有 STUN 回退；从 0.52.1 起默认使用官方 STUN 地址 |
| 连接 | `dnsServer` | `空值` | 空值使用操作系统 DNS，没有固定默认 IP |
| 连接 | `udpPacketSize` | `1500` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.method` | `token` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.additionalScopes` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.clientID` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.clientSecret` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.audience` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.scope` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.tokenEndpointURL` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.additionalEndpointParams` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerTimeout` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerKeepalive` | `7200` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.poolCount` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMux` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMuxKeepaliveInterval` | `60` | 0.58.1 起默认 30 秒；此前为 60 秒 |
| 连接 | `transport.heartbeatInterval` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.heartbeatTimeout` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.proxyURL` | `由环境决定` | 默认读取 frpc 进程的 http_proxy 环境变量；前端无法确定其值 |
| 连接 | `transport.connectServerLocalIP` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.keepalivePeriod` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIdleTimeout` | `30` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIncomingStreams` | `100000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.trustedCaFile` | `空值` | 默认无 CA 文件；frpc 的 TLS 客户端此时跳过服务端证书验证，指定 CA 后启用验证 |
| 连接 | `transport.tls.serverName` | `由上下文决定` | 留空时 TLS SNI 使用当前 serverAddr；显示回退值不会保存覆盖 |
| 连接 | `transport.tls.disableCustomTLSFirstByte` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.assetsDir` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.pprofEnable` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.serverName` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `name` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `type` | `tcp` | 官方 type 必填且没有默认；应用新建隧道预设 TCP |
| 隧道 | `enabled` | `true` | 应用默认启用，并在生成时过滤停用隧道；原生 enabled 字段从 0.66 才提供 |
| 隧道 | `transport.useEncryption` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.useCompression` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localIP` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localPort` | `无默认` | localPort 没有有效官方默认，启用普通后端时必须填正值；8080 是应用新建预设 |
| 隧道 | `remotePort` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `serverName` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `serverUser` | `空值` | 留空时使用当前连接的 user，不固定用户名或写回命名前缀 |
| 隧道 | `bindAddr` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `bindPort` | `无默认` | bindPort 默认零值无效，必须明确填写正值；STCP/XTCP 的 -1 是可选重定向设置 |
| 隧道 | `secretKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `allowUsers` | `[]` | 空列表仅允许当前 provider 的用户；不等于允许所有用户 |
| 隧道 | `customDomains` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `subdomain` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `annotations` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.bandwidthLimit` | `空值` | 空值或 0KB/0MB 不限速；不填写具体带宽上限 |
| 隧道 | `transport.bandwidthLimitMode` | `client` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.proxyProtocolVersion` | `空值` | 空值不生成 PROXY 协议头，不是自动选择版本 |
| 隧道 | `loadBalancer.group` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `loadBalancer.groupKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.type` | `空值` | 默认不启用健康检查；展示数值默认不会创建或启用 healthCheck |
| 隧道 | `healthCheck.timeoutSeconds` | `3` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.maxFailed` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.intervalSeconds` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.path` | `无默认` | HTTP 健康检查必须明确填写路径，没有有效官方默认；健康检查关闭时此字段不生效 |
| 隧道 | `healthCheck.httpHeaders` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `routeByHTTPUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `locations` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `responseHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `multiplexer` | `httpconnect` | 官方没有默认，TCPMUX 必须明确指定 httpconnect；应用生成时提供唯一合法预设 |
| 隧道 | `protocol` | `quic` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `keepTunnelOpen` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `maxRetriesAnHour` | `8` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `minRetryInterval` | `90` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTo` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTimeoutMs` | `1000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.type` | `空值` | 默认不启用插件；展示插件字段默认不会创建或启用 plugin |
| 隧道 | `plugin.localAddr` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.crtPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.keyPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.username` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.localPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.stripPrefix` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.unixPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |

</details>

<details>
<summary>frpc 0.58.1 · 127 项配置键与类型选项</summary>

[官方发布](https://github.com/fatedier/frp/releases/tag/v0.58.1)。补丁版本继承同一 minor 清单，运行前仍由 frpc verify 校验。

### 服务器连接

- **基础连接**：`serverAddr`、`serverPort`、`user`、`auth.token`、`transport.protocol`、`transport.tls.enable`、`webServer.addr`、`webServer.port`、`loginFailExit`、`log.to`、`log.level`、`log.disablePrintColor`。
- **连接高级**：`natHoleStunServer`、`dnsServer`、`udpPacketSize`、`metadatas`。
- **认证**：`auth.method`、`auth.additionalScopes`。
- **认证（认证 oidc）**：`auth.oidc.clientID`、`auth.oidc.clientSecret`、`auth.oidc.audience`、`auth.oidc.scope`、`auth.oidc.tokenEndpointURL`、`auth.oidc.additionalEndpointParams`。
- **传输**：`transport.dialServerTimeout`、`transport.dialServerKeepalive`、`transport.poolCount`、`transport.tcpMux`、`transport.tcpMuxKeepaliveInterval`、`transport.heartbeatInterval`、`transport.heartbeatTimeout`。
- **传输（tcp/websocket/wss）**：`transport.proxyURL`、`transport.connectServerLocalIP`。
- **QUIC（quic）**：`transport.quic.keepalivePeriod`、`transport.quic.maxIdleTimeout`、`transport.quic.maxIncomingStreams`。
- **TLS**：`transport.tls.certFile`、`transport.tls.keyFile`、`transport.tls.trustedCaFile`、`transport.tls.serverName`、`transport.tls.disableCustomTLSFirstByte`。
- **本机管理**：`webServer.user`、`webServer.password`、`webServer.assetsDir`、`webServer.pprofEnable`、`webServer.tls.certFile`、`webServer.tls.keyFile`、`webServer.tls.trustedCaFile`、`webServer.tls.serverName`。
- **传输协议**：`transport.protocol.tcp`、`transport.protocol.kcp`、`transport.protocol.quic`、`transport.protocol.websocket`、`transport.protocol.wss`。
- **认证方式**：`auth.method.token`、`auth.method.oidc`。

### 隧道、访问者与插件

- **基础隧道**：`name`、`type`、`enabled`、`transport.useEncryption`、`transport.useCompression`。
- **本地后端（provider）**：`localIP`、`localPort`。
- **远程端口（provider；tcp/udp）**：`remotePort`。
- **访问者（visitor；stcp/sudp/xtcp）**：`serverName`、`serverUser`、`bindAddr`、`bindPort`。
- **私有隧道（stcp/sudp/xtcp）**：`secretKey`。
- **访问权限（provider；stcp/sudp/xtcp）**：`allowUsers`。
- **域名（provider；http/https/tcpmux）**：`customDomains`、`subdomain`。
- **元数据（provider）**：`metadatas`。
- **注解（provider）**：`annotations`。
- **代理传输（provider）**：`transport.bandwidthLimit`、`transport.bandwidthLimitMode`、`transport.proxyProtocolVersion`。
- **负载均衡（provider；tcp/http/https/tcpmux）**：`loadBalancer.group`、`loadBalancer.groupKey`。
- **健康检查（provider）**：`healthCheck.type`、`healthCheck.timeoutSeconds`、`healthCheck.maxFailed`、`healthCheck.intervalSeconds`、`healthCheck.path`、`healthCheck.httpHeaders`。
- **HTTP（provider；http/tcpmux）**：`httpUser`、`httpPassword`、`routeByHTTPUser`。
- **HTTP（provider；http）**：`locations`、`hostHeaderRewrite`、`requestHeaders.set`。
- **HTTP 响应头（provider；http）**：`responseHeaders.set`。
- **TCPMUX（provider；tcpmux）**：`multiplexer`。
- **XTCP（visitor；xtcp）**：`protocol`、`keepTunnelOpen`、`maxRetriesAnHour`、`minRetryInterval`、`fallbackTo`、`fallbackTimeoutMs`。
- **隧道协议**：`type.tcp`、`type.udp`、`type.http`、`type.https`、`type.stcp`、`type.sudp`、`type.xtcp`、`type.tcpmux`。
- **插件（provider；tcp/stcp/xtcp/http/https/tcpmux）**：`plugin.type`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https）**：`plugin.type.http2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http）**：`plugin.type.https2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2https）**：`plugin.type.https2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy）**：`plugin.type.http_proxy`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.type.socks5`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.type.static_file`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.type.unix_domain_socket`。
- **插件目标（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https/tls2raw）**：`plugin.localAddr`。
- **插件 HTTP（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https）**：`plugin.hostHeaderRewrite`、`plugin.requestHeaders.set`。
- **插件 TLS（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https/tls2raw）**：`plugin.crtPath`、`plugin.keyPath`。
- **插件认证（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy/static_file）**：`plugin.httpUser`、`plugin.httpPassword`。
- **SOCKS5（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.username`、`plugin.password`。
- **静态文件（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.localPath`、`plugin.stripPrefix`。
- **Unix socket（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.unixPath`。

### 配置默认值

以下按新建配置上下文列出；TCP 复用、所属用户、TLS 服务名等联动值会随表单上下文更新。类型选项不是独立字段，不重复列默认值。应用接管项同时说明官方默认和应用实际策略。

| 范围 | 配置键 | 默认值 | 说明 |
| --- | --- | --- | --- |
| 连接 | `serverAddr` | `0.0.0.0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `serverPort` | `7000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.token` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.protocol` | `tcp` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.enable` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.addr` | `127.0.0.1` | 应用固定绑定本机地址，与官方默认相同 |
| 连接 | `webServer.port` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `loginFailExit` | `false` | 应用固定为 false，以持续监督登录重试；官方默认 true |
| 连接 | `log.to` | `console` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.level` | `info` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.disablePrintColor` | `true` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `natHoleStunServer` | `stun.easyvoip.com:3478` | 0.52.0 没有 STUN 回退；从 0.52.1 起默认使用官方 STUN 地址 |
| 连接 | `dnsServer` | `空值` | 空值使用操作系统 DNS，没有固定默认 IP |
| 连接 | `udpPacketSize` | `1500` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.method` | `token` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.additionalScopes` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.clientID` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.clientSecret` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.audience` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.scope` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.tokenEndpointURL` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.additionalEndpointParams` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerTimeout` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerKeepalive` | `7200` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.poolCount` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMux` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMuxKeepaliveInterval` | `30` | 0.58.1 起默认 30 秒；此前为 60 秒 |
| 连接 | `transport.heartbeatInterval` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.heartbeatTimeout` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.proxyURL` | `由环境决定` | 默认读取 frpc 进程的 http_proxy 环境变量；前端无法确定其值 |
| 连接 | `transport.connectServerLocalIP` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.keepalivePeriod` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIdleTimeout` | `30` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIncomingStreams` | `100000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.trustedCaFile` | `空值` | 默认无 CA 文件；frpc 的 TLS 客户端此时跳过服务端证书验证，指定 CA 后启用验证 |
| 连接 | `transport.tls.serverName` | `由上下文决定` | 留空时 TLS SNI 使用当前 serverAddr；显示回退值不会保存覆盖 |
| 连接 | `transport.tls.disableCustomTLSFirstByte` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.assetsDir` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.pprofEnable` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.serverName` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `name` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `type` | `tcp` | 官方 type 必填且没有默认；应用新建隧道预设 TCP |
| 隧道 | `enabled` | `true` | 应用默认启用，并在生成时过滤停用隧道；原生 enabled 字段从 0.66 才提供 |
| 隧道 | `transport.useEncryption` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.useCompression` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localIP` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localPort` | `无默认` | localPort 没有有效官方默认，启用普通后端时必须填正值；8080 是应用新建预设 |
| 隧道 | `remotePort` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `serverName` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `serverUser` | `空值` | 留空时使用当前连接的 user，不固定用户名或写回命名前缀 |
| 隧道 | `bindAddr` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `bindPort` | `无默认` | bindPort 默认零值无效，必须明确填写正值；STCP/XTCP 的 -1 是可选重定向设置 |
| 隧道 | `secretKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `allowUsers` | `[]` | 空列表仅允许当前 provider 的用户；不等于允许所有用户 |
| 隧道 | `customDomains` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `subdomain` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `annotations` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.bandwidthLimit` | `空值` | 空值或 0KB/0MB 不限速；不填写具体带宽上限 |
| 隧道 | `transport.bandwidthLimitMode` | `client` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.proxyProtocolVersion` | `空值` | 空值不生成 PROXY 协议头，不是自动选择版本 |
| 隧道 | `loadBalancer.group` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `loadBalancer.groupKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.type` | `空值` | 默认不启用健康检查；展示数值默认不会创建或启用 healthCheck |
| 隧道 | `healthCheck.timeoutSeconds` | `3` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.maxFailed` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.intervalSeconds` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.path` | `无默认` | HTTP 健康检查必须明确填写路径，没有有效官方默认；健康检查关闭时此字段不生效 |
| 隧道 | `healthCheck.httpHeaders` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `routeByHTTPUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `locations` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `responseHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `multiplexer` | `httpconnect` | 官方没有默认，TCPMUX 必须明确指定 httpconnect；应用生成时提供唯一合法预设 |
| 隧道 | `protocol` | `quic` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `keepTunnelOpen` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `maxRetriesAnHour` | `8` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `minRetryInterval` | `90` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTo` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTimeoutMs` | `1000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.type` | `空值` | 默认不启用插件；展示插件字段默认不会创建或启用 plugin |
| 隧道 | `plugin.localAddr` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.crtPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.keyPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.username` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.localPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.stripPrefix` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.unixPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |

</details>

<details>
<summary>frpc 0.59.0 · 129 项配置键与类型选项</summary>

[官方发布](https://github.com/fatedier/frp/releases/tag/v0.59.0)。已审核的版本配置清单。

### 服务器连接

- **基础连接**：`serverAddr`、`serverPort`、`user`、`auth.token`、`transport.protocol`、`transport.tls.enable`、`webServer.addr`、`webServer.port`、`loginFailExit`、`log.to`、`log.level`、`log.disablePrintColor`。
- **连接高级**：`natHoleStunServer`、`dnsServer`、`udpPacketSize`、`metadatas`。
- **认证**：`auth.method`、`auth.additionalScopes`。
- **认证（认证 oidc）**：`auth.oidc.clientID`、`auth.oidc.clientSecret`、`auth.oidc.audience`、`auth.oidc.scope`、`auth.oidc.tokenEndpointURL`、`auth.oidc.additionalEndpointParams`。
- **传输**：`transport.dialServerTimeout`、`transport.dialServerKeepalive`、`transport.poolCount`、`transport.tcpMux`、`transport.tcpMuxKeepaliveInterval`、`transport.heartbeatInterval`、`transport.heartbeatTimeout`。
- **传输（tcp/websocket/wss）**：`transport.proxyURL`、`transport.connectServerLocalIP`。
- **QUIC（quic）**：`transport.quic.keepalivePeriod`、`transport.quic.maxIdleTimeout`、`transport.quic.maxIncomingStreams`。
- **TLS**：`transport.tls.certFile`、`transport.tls.keyFile`、`transport.tls.trustedCaFile`、`transport.tls.serverName`、`transport.tls.disableCustomTLSFirstByte`。
- **本机管理**：`webServer.user`、`webServer.password`、`webServer.assetsDir`、`webServer.pprofEnable`、`webServer.tls.certFile`、`webServer.tls.keyFile`、`webServer.tls.trustedCaFile`、`webServer.tls.serverName`。
- **传输协议**：`transport.protocol.tcp`、`transport.protocol.kcp`、`transport.protocol.quic`、`transport.protocol.websocket`、`transport.protocol.wss`。
- **认证方式**：`auth.method.token`、`auth.method.oidc`。

### 隧道、访问者与插件

- **基础隧道**：`name`、`type`、`enabled`、`transport.useEncryption`、`transport.useCompression`。
- **本地后端（provider）**：`localIP`、`localPort`。
- **远程端口（provider；tcp/udp）**：`remotePort`。
- **访问者（visitor；stcp/sudp/xtcp）**：`serverName`、`serverUser`、`bindAddr`、`bindPort`。
- **私有隧道（stcp/sudp/xtcp）**：`secretKey`。
- **访问权限（provider；stcp/sudp/xtcp）**：`allowUsers`。
- **域名（provider；http/https/tcpmux）**：`customDomains`、`subdomain`。
- **元数据（provider）**：`metadatas`。
- **注解（provider）**：`annotations`。
- **代理传输（provider）**：`transport.bandwidthLimit`、`transport.bandwidthLimitMode`、`transport.proxyProtocolVersion`。
- **负载均衡（provider；tcp/http/https/tcpmux）**：`loadBalancer.group`、`loadBalancer.groupKey`。
- **健康检查（provider）**：`healthCheck.type`、`healthCheck.timeoutSeconds`、`healthCheck.maxFailed`、`healthCheck.intervalSeconds`、`healthCheck.path`、`healthCheck.httpHeaders`。
- **HTTP（provider；http/tcpmux）**：`httpUser`、`httpPassword`、`routeByHTTPUser`。
- **HTTP（provider；http）**：`locations`、`hostHeaderRewrite`、`requestHeaders.set`。
- **HTTP 响应头（provider；http）**：`responseHeaders.set`。
- **TCPMUX（provider；tcpmux）**：`multiplexer`。
- **XTCP（visitor；xtcp）**：`protocol`、`keepTunnelOpen`、`maxRetriesAnHour`、`minRetryInterval`、`fallbackTo`、`fallbackTimeoutMs`。
- **隧道协议**：`type.tcp`、`type.udp`、`type.http`、`type.https`、`type.stcp`、`type.sudp`、`type.xtcp`、`type.tcpmux`。
- **插件（provider；tcp/stcp/xtcp/http/https/tcpmux）**：`plugin.type`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https）**：`plugin.type.http2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2http）**：`plugin.type.http2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http）**：`plugin.type.https2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2https）**：`plugin.type.https2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy）**：`plugin.type.http_proxy`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.type.socks5`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.type.static_file`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.type.unix_domain_socket`。
- **插件目标（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https/tls2raw）**：`plugin.localAddr`。
- **插件 HTTP（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https）**：`plugin.hostHeaderRewrite`、`plugin.requestHeaders.set`。
- **插件 HTTP/2（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https）**：`plugin.enableHTTP2`。
- **插件 TLS（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https/tls2raw）**：`plugin.crtPath`、`plugin.keyPath`。
- **插件认证（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy/static_file）**：`plugin.httpUser`、`plugin.httpPassword`。
- **SOCKS5（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.username`、`plugin.password`。
- **静态文件（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.localPath`、`plugin.stripPrefix`。
- **Unix socket（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.unixPath`。

### 配置默认值

以下按新建配置上下文列出；TCP 复用、所属用户、TLS 服务名等联动值会随表单上下文更新。类型选项不是独立字段，不重复列默认值。应用接管项同时说明官方默认和应用实际策略。

| 范围 | 配置键 | 默认值 | 说明 |
| --- | --- | --- | --- |
| 连接 | `serverAddr` | `0.0.0.0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `serverPort` | `7000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.token` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.protocol` | `tcp` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.enable` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.addr` | `127.0.0.1` | 应用固定绑定本机地址，与官方默认相同 |
| 连接 | `webServer.port` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `loginFailExit` | `false` | 应用固定为 false，以持续监督登录重试；官方默认 true |
| 连接 | `log.to` | `console` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.level` | `info` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.disablePrintColor` | `true` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `natHoleStunServer` | `stun.easyvoip.com:3478` | 0.52.0 没有 STUN 回退；从 0.52.1 起默认使用官方 STUN 地址 |
| 连接 | `dnsServer` | `空值` | 空值使用操作系统 DNS，没有固定默认 IP |
| 连接 | `udpPacketSize` | `1500` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.method` | `token` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.additionalScopes` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.clientID` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.clientSecret` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.audience` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.scope` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.tokenEndpointURL` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.additionalEndpointParams` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerTimeout` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerKeepalive` | `7200` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.poolCount` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMux` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMuxKeepaliveInterval` | `30` | 0.58.1 起默认 30 秒；此前为 60 秒 |
| 连接 | `transport.heartbeatInterval` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.heartbeatTimeout` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.proxyURL` | `由环境决定` | 默认读取 frpc 进程的 http_proxy 环境变量；前端无法确定其值 |
| 连接 | `transport.connectServerLocalIP` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.keepalivePeriod` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIdleTimeout` | `30` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIncomingStreams` | `100000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.trustedCaFile` | `空值` | 默认无 CA 文件；frpc 的 TLS 客户端此时跳过服务端证书验证，指定 CA 后启用验证 |
| 连接 | `transport.tls.serverName` | `由上下文决定` | 留空时 TLS SNI 使用当前 serverAddr；显示回退值不会保存覆盖 |
| 连接 | `transport.tls.disableCustomTLSFirstByte` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.assetsDir` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.pprofEnable` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.serverName` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `name` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `type` | `tcp` | 官方 type 必填且没有默认；应用新建隧道预设 TCP |
| 隧道 | `enabled` | `true` | 应用默认启用，并在生成时过滤停用隧道；原生 enabled 字段从 0.66 才提供 |
| 隧道 | `transport.useEncryption` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.useCompression` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localIP` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localPort` | `无默认` | localPort 没有有效官方默认，启用普通后端时必须填正值；8080 是应用新建预设 |
| 隧道 | `remotePort` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `serverName` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `serverUser` | `空值` | 留空时使用当前连接的 user，不固定用户名或写回命名前缀 |
| 隧道 | `bindAddr` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `bindPort` | `无默认` | bindPort 默认零值无效，必须明确填写正值；STCP/XTCP 的 -1 是可选重定向设置 |
| 隧道 | `secretKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `allowUsers` | `[]` | 空列表仅允许当前 provider 的用户；不等于允许所有用户 |
| 隧道 | `customDomains` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `subdomain` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `annotations` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.bandwidthLimit` | `空值` | 空值或 0KB/0MB 不限速；不填写具体带宽上限 |
| 隧道 | `transport.bandwidthLimitMode` | `client` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.proxyProtocolVersion` | `空值` | 空值不生成 PROXY 协议头，不是自动选择版本 |
| 隧道 | `loadBalancer.group` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `loadBalancer.groupKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.type` | `空值` | 默认不启用健康检查；展示数值默认不会创建或启用 healthCheck |
| 隧道 | `healthCheck.timeoutSeconds` | `3` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.maxFailed` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.intervalSeconds` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.path` | `无默认` | HTTP 健康检查必须明确填写路径，没有有效官方默认；健康检查关闭时此字段不生效 |
| 隧道 | `healthCheck.httpHeaders` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `routeByHTTPUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `locations` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `responseHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `multiplexer` | `httpconnect` | 官方没有默认，TCPMUX 必须明确指定 httpconnect；应用生成时提供唯一合法预设 |
| 隧道 | `protocol` | `quic` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `keepTunnelOpen` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `maxRetriesAnHour` | `8` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `minRetryInterval` | `90` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTo` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTimeoutMs` | `1000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.type` | `空值` | 默认不启用插件；展示插件字段默认不会创建或启用 plugin |
| 隧道 | `plugin.localAddr` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.enableHTTP2` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.crtPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.keyPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.username` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.localPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.stripPrefix` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.unixPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |

</details>

<details>
<summary>frpc 0.60.0 · 130 项配置键与类型选项</summary>

[官方发布](https://github.com/fatedier/frp/releases/tag/v0.60.0)。已审核的版本配置清单。

### 服务器连接

- **基础连接**：`serverAddr`、`serverPort`、`user`、`auth.token`、`transport.protocol`、`transport.tls.enable`、`webServer.addr`、`webServer.port`、`loginFailExit`、`log.to`、`log.level`、`log.disablePrintColor`。
- **连接高级**：`natHoleStunServer`、`dnsServer`、`udpPacketSize`、`metadatas`。
- **认证**：`auth.method`、`auth.additionalScopes`。
- **认证（认证 oidc）**：`auth.oidc.clientID`、`auth.oidc.clientSecret`、`auth.oidc.audience`、`auth.oidc.scope`、`auth.oidc.tokenEndpointURL`、`auth.oidc.additionalEndpointParams`。
- **传输**：`transport.dialServerTimeout`、`transport.dialServerKeepalive`、`transport.poolCount`、`transport.tcpMux`、`transport.tcpMuxKeepaliveInterval`、`transport.heartbeatInterval`、`transport.heartbeatTimeout`。
- **传输（tcp/websocket/wss）**：`transport.proxyURL`、`transport.connectServerLocalIP`。
- **QUIC（quic）**：`transport.quic.keepalivePeriod`、`transport.quic.maxIdleTimeout`、`transport.quic.maxIncomingStreams`。
- **TLS**：`transport.tls.certFile`、`transport.tls.keyFile`、`transport.tls.trustedCaFile`、`transport.tls.serverName`、`transport.tls.disableCustomTLSFirstByte`。
- **本机管理**：`webServer.user`、`webServer.password`、`webServer.assetsDir`、`webServer.pprofEnable`、`webServer.tls.certFile`、`webServer.tls.keyFile`、`webServer.tls.trustedCaFile`、`webServer.tls.serverName`。
- **传输协议**：`transport.protocol.tcp`、`transport.protocol.kcp`、`transport.protocol.quic`、`transport.protocol.websocket`、`transport.protocol.wss`。
- **认证方式**：`auth.method.token`、`auth.method.oidc`。

### 隧道、访问者与插件

- **基础隧道**：`name`、`type`、`enabled`、`transport.useEncryption`、`transport.useCompression`。
- **本地后端（provider）**：`localIP`、`localPort`。
- **远程端口（provider；tcp/udp）**：`remotePort`。
- **访问者（visitor；stcp/sudp/xtcp）**：`serverName`、`serverUser`、`bindAddr`、`bindPort`。
- **私有隧道（stcp/sudp/xtcp）**：`secretKey`。
- **访问权限（provider；stcp/sudp/xtcp）**：`allowUsers`。
- **域名（provider；http/https/tcpmux）**：`customDomains`、`subdomain`。
- **元数据（provider）**：`metadatas`。
- **注解（provider）**：`annotations`。
- **代理传输（provider）**：`transport.bandwidthLimit`、`transport.bandwidthLimitMode`、`transport.proxyProtocolVersion`。
- **负载均衡（provider；tcp/http/https/tcpmux）**：`loadBalancer.group`、`loadBalancer.groupKey`。
- **健康检查（provider）**：`healthCheck.type`、`healthCheck.timeoutSeconds`、`healthCheck.maxFailed`、`healthCheck.intervalSeconds`、`healthCheck.path`、`healthCheck.httpHeaders`。
- **HTTP（provider；http/tcpmux）**：`httpUser`、`httpPassword`、`routeByHTTPUser`。
- **HTTP（provider；http）**：`locations`、`hostHeaderRewrite`、`requestHeaders.set`。
- **HTTP 响应头（provider；http）**：`responseHeaders.set`。
- **TCPMUX（provider；tcpmux）**：`multiplexer`。
- **XTCP（visitor；xtcp）**：`protocol`、`keepTunnelOpen`、`maxRetriesAnHour`、`minRetryInterval`、`fallbackTo`、`fallbackTimeoutMs`。
- **隧道协议**：`type.tcp`、`type.udp`、`type.http`、`type.https`、`type.stcp`、`type.sudp`、`type.xtcp`、`type.tcpmux`。
- **插件（provider；tcp/stcp/xtcp/http/https/tcpmux）**：`plugin.type`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https）**：`plugin.type.http2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2http）**：`plugin.type.http2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http）**：`plugin.type.https2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2https）**：`plugin.type.https2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy）**：`plugin.type.http_proxy`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.type.socks5`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.type.static_file`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.type.unix_domain_socket`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 tls2raw）**：`plugin.type.tls2raw`。
- **插件目标（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https/tls2raw）**：`plugin.localAddr`。
- **插件 HTTP（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https）**：`plugin.hostHeaderRewrite`、`plugin.requestHeaders.set`。
- **插件 HTTP/2（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https）**：`plugin.enableHTTP2`。
- **插件 TLS（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https/tls2raw）**：`plugin.crtPath`、`plugin.keyPath`。
- **插件认证（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy/static_file）**：`plugin.httpUser`、`plugin.httpPassword`。
- **SOCKS5（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.username`、`plugin.password`。
- **静态文件（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.localPath`、`plugin.stripPrefix`。
- **Unix socket（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.unixPath`。

### 配置默认值

以下按新建配置上下文列出；TCP 复用、所属用户、TLS 服务名等联动值会随表单上下文更新。类型选项不是独立字段，不重复列默认值。应用接管项同时说明官方默认和应用实际策略。

| 范围 | 配置键 | 默认值 | 说明 |
| --- | --- | --- | --- |
| 连接 | `serverAddr` | `0.0.0.0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `serverPort` | `7000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.token` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.protocol` | `tcp` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.enable` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.addr` | `127.0.0.1` | 应用固定绑定本机地址，与官方默认相同 |
| 连接 | `webServer.port` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `loginFailExit` | `false` | 应用固定为 false，以持续监督登录重试；官方默认 true |
| 连接 | `log.to` | `console` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.level` | `info` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.disablePrintColor` | `true` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `natHoleStunServer` | `stun.easyvoip.com:3478` | 0.52.0 没有 STUN 回退；从 0.52.1 起默认使用官方 STUN 地址 |
| 连接 | `dnsServer` | `空值` | 空值使用操作系统 DNS，没有固定默认 IP |
| 连接 | `udpPacketSize` | `1500` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.method` | `token` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.additionalScopes` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.clientID` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.clientSecret` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.audience` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.scope` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.tokenEndpointURL` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.additionalEndpointParams` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerTimeout` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerKeepalive` | `7200` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.poolCount` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMux` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMuxKeepaliveInterval` | `30` | 0.58.1 起默认 30 秒；此前为 60 秒 |
| 连接 | `transport.heartbeatInterval` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.heartbeatTimeout` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.proxyURL` | `由环境决定` | 默认读取 frpc 进程的 http_proxy 环境变量；前端无法确定其值 |
| 连接 | `transport.connectServerLocalIP` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.keepalivePeriod` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIdleTimeout` | `30` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIncomingStreams` | `100000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.trustedCaFile` | `空值` | 默认无 CA 文件；frpc 的 TLS 客户端此时跳过服务端证书验证，指定 CA 后启用验证 |
| 连接 | `transport.tls.serverName` | `由上下文决定` | 留空时 TLS SNI 使用当前 serverAddr；显示回退值不会保存覆盖 |
| 连接 | `transport.tls.disableCustomTLSFirstByte` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.assetsDir` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.pprofEnable` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.serverName` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `name` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `type` | `tcp` | 官方 type 必填且没有默认；应用新建隧道预设 TCP |
| 隧道 | `enabled` | `true` | 应用默认启用，并在生成时过滤停用隧道；原生 enabled 字段从 0.66 才提供 |
| 隧道 | `transport.useEncryption` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.useCompression` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localIP` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localPort` | `无默认` | localPort 没有有效官方默认，启用普通后端时必须填正值；8080 是应用新建预设 |
| 隧道 | `remotePort` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `serverName` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `serverUser` | `空值` | 留空时使用当前连接的 user，不固定用户名或写回命名前缀 |
| 隧道 | `bindAddr` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `bindPort` | `无默认` | bindPort 默认零值无效，必须明确填写正值；STCP/XTCP 的 -1 是可选重定向设置 |
| 隧道 | `secretKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `allowUsers` | `[]` | 空列表仅允许当前 provider 的用户；不等于允许所有用户 |
| 隧道 | `customDomains` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `subdomain` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `annotations` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.bandwidthLimit` | `空值` | 空值或 0KB/0MB 不限速；不填写具体带宽上限 |
| 隧道 | `transport.bandwidthLimitMode` | `client` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.proxyProtocolVersion` | `空值` | 空值不生成 PROXY 协议头，不是自动选择版本 |
| 隧道 | `loadBalancer.group` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `loadBalancer.groupKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.type` | `空值` | 默认不启用健康检查；展示数值默认不会创建或启用 healthCheck |
| 隧道 | `healthCheck.timeoutSeconds` | `3` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.maxFailed` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.intervalSeconds` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.path` | `无默认` | HTTP 健康检查必须明确填写路径，没有有效官方默认；健康检查关闭时此字段不生效 |
| 隧道 | `healthCheck.httpHeaders` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `routeByHTTPUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `locations` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `responseHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `multiplexer` | `httpconnect` | 官方没有默认，TCPMUX 必须明确指定 httpconnect；应用生成时提供唯一合法预设 |
| 隧道 | `protocol` | `quic` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `keepTunnelOpen` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `maxRetriesAnHour` | `8` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `minRetryInterval` | `90` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTo` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTimeoutMs` | `1000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.type` | `空值` | 默认不启用插件；展示插件字段默认不会创建或启用 plugin |
| 隧道 | `plugin.localAddr` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.enableHTTP2` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.crtPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.keyPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.username` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.localPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.stripPrefix` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.unixPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |

</details>

<details>
<summary>frpc 0.61.0 · 130 项配置键与类型选项</summary>

[官方发布](https://github.com/fatedier/frp/releases/tag/v0.61.0)。已审核的版本配置清单。

### 服务器连接

- **基础连接**：`serverAddr`、`serverPort`、`user`、`auth.token`、`transport.protocol`、`transport.tls.enable`、`webServer.addr`、`webServer.port`、`loginFailExit`、`log.to`、`log.level`、`log.disablePrintColor`。
- **连接高级**：`natHoleStunServer`、`dnsServer`、`udpPacketSize`、`metadatas`。
- **认证**：`auth.method`、`auth.additionalScopes`。
- **认证（认证 oidc）**：`auth.oidc.clientID`、`auth.oidc.clientSecret`、`auth.oidc.audience`、`auth.oidc.scope`、`auth.oidc.tokenEndpointURL`、`auth.oidc.additionalEndpointParams`。
- **传输**：`transport.dialServerTimeout`、`transport.dialServerKeepalive`、`transport.poolCount`、`transport.tcpMux`、`transport.tcpMuxKeepaliveInterval`、`transport.heartbeatInterval`、`transport.heartbeatTimeout`。
- **传输（tcp/websocket/wss）**：`transport.proxyURL`、`transport.connectServerLocalIP`。
- **QUIC（quic）**：`transport.quic.keepalivePeriod`、`transport.quic.maxIdleTimeout`、`transport.quic.maxIncomingStreams`。
- **TLS**：`transport.tls.certFile`、`transport.tls.keyFile`、`transport.tls.trustedCaFile`、`transport.tls.serverName`、`transport.tls.disableCustomTLSFirstByte`。
- **本机管理**：`webServer.user`、`webServer.password`、`webServer.assetsDir`、`webServer.pprofEnable`、`webServer.tls.certFile`、`webServer.tls.keyFile`、`webServer.tls.trustedCaFile`、`webServer.tls.serverName`。
- **传输协议**：`transport.protocol.tcp`、`transport.protocol.kcp`、`transport.protocol.quic`、`transport.protocol.websocket`、`transport.protocol.wss`。
- **认证方式**：`auth.method.token`、`auth.method.oidc`。

### 隧道、访问者与插件

- **基础隧道**：`name`、`type`、`enabled`、`transport.useEncryption`、`transport.useCompression`。
- **本地后端（provider）**：`localIP`、`localPort`。
- **远程端口（provider；tcp/udp）**：`remotePort`。
- **访问者（visitor；stcp/sudp/xtcp）**：`serverName`、`serverUser`、`bindAddr`、`bindPort`。
- **私有隧道（stcp/sudp/xtcp）**：`secretKey`。
- **访问权限（provider；stcp/sudp/xtcp）**：`allowUsers`。
- **域名（provider；http/https/tcpmux）**：`customDomains`、`subdomain`。
- **元数据（provider）**：`metadatas`。
- **注解（provider）**：`annotations`。
- **代理传输（provider）**：`transport.bandwidthLimit`、`transport.bandwidthLimitMode`、`transport.proxyProtocolVersion`。
- **负载均衡（provider；tcp/http/https/tcpmux）**：`loadBalancer.group`、`loadBalancer.groupKey`。
- **健康检查（provider）**：`healthCheck.type`、`healthCheck.timeoutSeconds`、`healthCheck.maxFailed`、`healthCheck.intervalSeconds`、`healthCheck.path`、`healthCheck.httpHeaders`。
- **HTTP（provider；http/tcpmux）**：`httpUser`、`httpPassword`、`routeByHTTPUser`。
- **HTTP（provider；http）**：`locations`、`hostHeaderRewrite`、`requestHeaders.set`。
- **HTTP 响应头（provider；http）**：`responseHeaders.set`。
- **TCPMUX（provider；tcpmux）**：`multiplexer`。
- **XTCP（visitor；xtcp）**：`protocol`、`keepTunnelOpen`、`maxRetriesAnHour`、`minRetryInterval`、`fallbackTo`、`fallbackTimeoutMs`。
- **隧道协议**：`type.tcp`、`type.udp`、`type.http`、`type.https`、`type.stcp`、`type.sudp`、`type.xtcp`、`type.tcpmux`。
- **插件（provider；tcp/stcp/xtcp/http/https/tcpmux）**：`plugin.type`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https）**：`plugin.type.http2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2http）**：`plugin.type.http2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http）**：`plugin.type.https2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2https）**：`plugin.type.https2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy）**：`plugin.type.http_proxy`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.type.socks5`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.type.static_file`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.type.unix_domain_socket`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 tls2raw）**：`plugin.type.tls2raw`。
- **插件目标（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https/tls2raw）**：`plugin.localAddr`。
- **插件 HTTP（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https）**：`plugin.hostHeaderRewrite`、`plugin.requestHeaders.set`。
- **插件 HTTP/2（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https）**：`plugin.enableHTTP2`。
- **插件 TLS（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https/tls2raw）**：`plugin.crtPath`、`plugin.keyPath`。
- **插件认证（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy/static_file）**：`plugin.httpUser`、`plugin.httpPassword`。
- **SOCKS5（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.username`、`plugin.password`。
- **静态文件（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.localPath`、`plugin.stripPrefix`。
- **Unix socket（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.unixPath`。

### 配置默认值

以下按新建配置上下文列出；TCP 复用、所属用户、TLS 服务名等联动值会随表单上下文更新。类型选项不是独立字段，不重复列默认值。应用接管项同时说明官方默认和应用实际策略。

| 范围 | 配置键 | 默认值 | 说明 |
| --- | --- | --- | --- |
| 连接 | `serverAddr` | `0.0.0.0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `serverPort` | `7000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.token` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.protocol` | `tcp` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.enable` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.addr` | `127.0.0.1` | 应用固定绑定本机地址，与官方默认相同 |
| 连接 | `webServer.port` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `loginFailExit` | `false` | 应用固定为 false，以持续监督登录重试；官方默认 true |
| 连接 | `log.to` | `console` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.level` | `info` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.disablePrintColor` | `true` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `natHoleStunServer` | `stun.easyvoip.com:3478` | 0.52.0 没有 STUN 回退；从 0.52.1 起默认使用官方 STUN 地址 |
| 连接 | `dnsServer` | `空值` | 空值使用操作系统 DNS，没有固定默认 IP |
| 连接 | `udpPacketSize` | `1500` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.method` | `token` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.additionalScopes` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.clientID` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.clientSecret` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.audience` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.scope` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.tokenEndpointURL` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.additionalEndpointParams` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerTimeout` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerKeepalive` | `7200` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.poolCount` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMux` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMuxKeepaliveInterval` | `30` | 0.58.1 起默认 30 秒；此前为 60 秒 |
| 连接 | `transport.heartbeatInterval` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.heartbeatTimeout` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.proxyURL` | `由环境决定` | 默认读取 frpc 进程的 http_proxy 环境变量；前端无法确定其值 |
| 连接 | `transport.connectServerLocalIP` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.keepalivePeriod` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIdleTimeout` | `30` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIncomingStreams` | `100000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.trustedCaFile` | `空值` | 默认无 CA 文件；frpc 的 TLS 客户端此时跳过服务端证书验证，指定 CA 后启用验证 |
| 连接 | `transport.tls.serverName` | `由上下文决定` | 留空时 TLS SNI 使用当前 serverAddr；显示回退值不会保存覆盖 |
| 连接 | `transport.tls.disableCustomTLSFirstByte` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.assetsDir` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.pprofEnable` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.serverName` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `name` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `type` | `tcp` | 官方 type 必填且没有默认；应用新建隧道预设 TCP |
| 隧道 | `enabled` | `true` | 应用默认启用，并在生成时过滤停用隧道；原生 enabled 字段从 0.66 才提供 |
| 隧道 | `transport.useEncryption` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.useCompression` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localIP` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localPort` | `无默认` | localPort 没有有效官方默认，启用普通后端时必须填正值；8080 是应用新建预设 |
| 隧道 | `remotePort` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `serverName` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `serverUser` | `空值` | 留空时使用当前连接的 user，不固定用户名或写回命名前缀 |
| 隧道 | `bindAddr` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `bindPort` | `无默认` | bindPort 默认零值无效，必须明确填写正值；STCP/XTCP 的 -1 是可选重定向设置 |
| 隧道 | `secretKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `allowUsers` | `[]` | 空列表仅允许当前 provider 的用户；不等于允许所有用户 |
| 隧道 | `customDomains` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `subdomain` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `annotations` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.bandwidthLimit` | `空值` | 空值或 0KB/0MB 不限速；不填写具体带宽上限 |
| 隧道 | `transport.bandwidthLimitMode` | `client` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.proxyProtocolVersion` | `空值` | 空值不生成 PROXY 协议头，不是自动选择版本 |
| 隧道 | `loadBalancer.group` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `loadBalancer.groupKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.type` | `空值` | 默认不启用健康检查；展示数值默认不会创建或启用 healthCheck |
| 隧道 | `healthCheck.timeoutSeconds` | `3` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.maxFailed` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.intervalSeconds` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.path` | `无默认` | HTTP 健康检查必须明确填写路径，没有有效官方默认；健康检查关闭时此字段不生效 |
| 隧道 | `healthCheck.httpHeaders` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `routeByHTTPUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `locations` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `responseHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `multiplexer` | `httpconnect` | 官方没有默认，TCPMUX 必须明确指定 httpconnect；应用生成时提供唯一合法预设 |
| 隧道 | `protocol` | `quic` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `keepTunnelOpen` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `maxRetriesAnHour` | `8` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `minRetryInterval` | `90` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTo` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTimeoutMs` | `1000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.type` | `空值` | 默认不启用插件；展示插件字段默认不会创建或启用 plugin |
| 隧道 | `plugin.localAddr` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.enableHTTP2` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.crtPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.keyPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.username` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.localPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.stripPrefix` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.unixPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |

</details>

<details>
<summary>frpc 0.61.1 · 130 项配置键与类型选项</summary>

[官方发布](https://github.com/fatedier/frp/releases/tag/v0.61.1)。补丁版本继承同一 minor 清单，运行前仍由 frpc verify 校验。

### 服务器连接

- **基础连接**：`serverAddr`、`serverPort`、`user`、`auth.token`、`transport.protocol`、`transport.tls.enable`、`webServer.addr`、`webServer.port`、`loginFailExit`、`log.to`、`log.level`、`log.disablePrintColor`。
- **连接高级**：`natHoleStunServer`、`dnsServer`、`udpPacketSize`、`metadatas`。
- **认证**：`auth.method`、`auth.additionalScopes`。
- **认证（认证 oidc）**：`auth.oidc.clientID`、`auth.oidc.clientSecret`、`auth.oidc.audience`、`auth.oidc.scope`、`auth.oidc.tokenEndpointURL`、`auth.oidc.additionalEndpointParams`。
- **传输**：`transport.dialServerTimeout`、`transport.dialServerKeepalive`、`transport.poolCount`、`transport.tcpMux`、`transport.tcpMuxKeepaliveInterval`、`transport.heartbeatInterval`、`transport.heartbeatTimeout`。
- **传输（tcp/websocket/wss）**：`transport.proxyURL`、`transport.connectServerLocalIP`。
- **QUIC（quic）**：`transport.quic.keepalivePeriod`、`transport.quic.maxIdleTimeout`、`transport.quic.maxIncomingStreams`。
- **TLS**：`transport.tls.certFile`、`transport.tls.keyFile`、`transport.tls.trustedCaFile`、`transport.tls.serverName`、`transport.tls.disableCustomTLSFirstByte`。
- **本机管理**：`webServer.user`、`webServer.password`、`webServer.assetsDir`、`webServer.pprofEnable`、`webServer.tls.certFile`、`webServer.tls.keyFile`、`webServer.tls.trustedCaFile`、`webServer.tls.serverName`。
- **传输协议**：`transport.protocol.tcp`、`transport.protocol.kcp`、`transport.protocol.quic`、`transport.protocol.websocket`、`transport.protocol.wss`。
- **认证方式**：`auth.method.token`、`auth.method.oidc`。

### 隧道、访问者与插件

- **基础隧道**：`name`、`type`、`enabled`、`transport.useEncryption`、`transport.useCompression`。
- **本地后端（provider）**：`localIP`、`localPort`。
- **远程端口（provider；tcp/udp）**：`remotePort`。
- **访问者（visitor；stcp/sudp/xtcp）**：`serverName`、`serverUser`、`bindAddr`、`bindPort`。
- **私有隧道（stcp/sudp/xtcp）**：`secretKey`。
- **访问权限（provider；stcp/sudp/xtcp）**：`allowUsers`。
- **域名（provider；http/https/tcpmux）**：`customDomains`、`subdomain`。
- **元数据（provider）**：`metadatas`。
- **注解（provider）**：`annotations`。
- **代理传输（provider）**：`transport.bandwidthLimit`、`transport.bandwidthLimitMode`、`transport.proxyProtocolVersion`。
- **负载均衡（provider；tcp/http/https/tcpmux）**：`loadBalancer.group`、`loadBalancer.groupKey`。
- **健康检查（provider）**：`healthCheck.type`、`healthCheck.timeoutSeconds`、`healthCheck.maxFailed`、`healthCheck.intervalSeconds`、`healthCheck.path`、`healthCheck.httpHeaders`。
- **HTTP（provider；http/tcpmux）**：`httpUser`、`httpPassword`、`routeByHTTPUser`。
- **HTTP（provider；http）**：`locations`、`hostHeaderRewrite`、`requestHeaders.set`。
- **HTTP 响应头（provider；http）**：`responseHeaders.set`。
- **TCPMUX（provider；tcpmux）**：`multiplexer`。
- **XTCP（visitor；xtcp）**：`protocol`、`keepTunnelOpen`、`maxRetriesAnHour`、`minRetryInterval`、`fallbackTo`、`fallbackTimeoutMs`。
- **隧道协议**：`type.tcp`、`type.udp`、`type.http`、`type.https`、`type.stcp`、`type.sudp`、`type.xtcp`、`type.tcpmux`。
- **插件（provider；tcp/stcp/xtcp/http/https/tcpmux）**：`plugin.type`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https）**：`plugin.type.http2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2http）**：`plugin.type.http2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http）**：`plugin.type.https2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2https）**：`plugin.type.https2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy）**：`plugin.type.http_proxy`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.type.socks5`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.type.static_file`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.type.unix_domain_socket`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 tls2raw）**：`plugin.type.tls2raw`。
- **插件目标（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https/tls2raw）**：`plugin.localAddr`。
- **插件 HTTP（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https）**：`plugin.hostHeaderRewrite`、`plugin.requestHeaders.set`。
- **插件 HTTP/2（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https）**：`plugin.enableHTTP2`。
- **插件 TLS（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https/tls2raw）**：`plugin.crtPath`、`plugin.keyPath`。
- **插件认证（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy/static_file）**：`plugin.httpUser`、`plugin.httpPassword`。
- **SOCKS5（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.username`、`plugin.password`。
- **静态文件（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.localPath`、`plugin.stripPrefix`。
- **Unix socket（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.unixPath`。

### 配置默认值

以下按新建配置上下文列出；TCP 复用、所属用户、TLS 服务名等联动值会随表单上下文更新。类型选项不是独立字段，不重复列默认值。应用接管项同时说明官方默认和应用实际策略。

| 范围 | 配置键 | 默认值 | 说明 |
| --- | --- | --- | --- |
| 连接 | `serverAddr` | `0.0.0.0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `serverPort` | `7000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.token` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.protocol` | `tcp` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.enable` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.addr` | `127.0.0.1` | 应用固定绑定本机地址，与官方默认相同 |
| 连接 | `webServer.port` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `loginFailExit` | `false` | 应用固定为 false，以持续监督登录重试；官方默认 true |
| 连接 | `log.to` | `console` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.level` | `info` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.disablePrintColor` | `true` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `natHoleStunServer` | `stun.easyvoip.com:3478` | 0.52.0 没有 STUN 回退；从 0.52.1 起默认使用官方 STUN 地址 |
| 连接 | `dnsServer` | `空值` | 空值使用操作系统 DNS，没有固定默认 IP |
| 连接 | `udpPacketSize` | `1500` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.method` | `token` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.additionalScopes` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.clientID` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.clientSecret` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.audience` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.scope` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.tokenEndpointURL` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.additionalEndpointParams` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerTimeout` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerKeepalive` | `7200` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.poolCount` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMux` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMuxKeepaliveInterval` | `30` | 0.58.1 起默认 30 秒；此前为 60 秒 |
| 连接 | `transport.heartbeatInterval` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.heartbeatTimeout` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.proxyURL` | `由环境决定` | 默认读取 frpc 进程的 http_proxy 环境变量；前端无法确定其值 |
| 连接 | `transport.connectServerLocalIP` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.keepalivePeriod` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIdleTimeout` | `30` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIncomingStreams` | `100000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.trustedCaFile` | `空值` | 默认无 CA 文件；frpc 的 TLS 客户端此时跳过服务端证书验证，指定 CA 后启用验证 |
| 连接 | `transport.tls.serverName` | `由上下文决定` | 留空时 TLS SNI 使用当前 serverAddr；显示回退值不会保存覆盖 |
| 连接 | `transport.tls.disableCustomTLSFirstByte` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.assetsDir` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.pprofEnable` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.serverName` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `name` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `type` | `tcp` | 官方 type 必填且没有默认；应用新建隧道预设 TCP |
| 隧道 | `enabled` | `true` | 应用默认启用，并在生成时过滤停用隧道；原生 enabled 字段从 0.66 才提供 |
| 隧道 | `transport.useEncryption` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.useCompression` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localIP` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localPort` | `无默认` | localPort 没有有效官方默认，启用普通后端时必须填正值；8080 是应用新建预设 |
| 隧道 | `remotePort` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `serverName` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `serverUser` | `空值` | 留空时使用当前连接的 user，不固定用户名或写回命名前缀 |
| 隧道 | `bindAddr` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `bindPort` | `无默认` | bindPort 默认零值无效，必须明确填写正值；STCP/XTCP 的 -1 是可选重定向设置 |
| 隧道 | `secretKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `allowUsers` | `[]` | 空列表仅允许当前 provider 的用户；不等于允许所有用户 |
| 隧道 | `customDomains` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `subdomain` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `annotations` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.bandwidthLimit` | `空值` | 空值或 0KB/0MB 不限速；不填写具体带宽上限 |
| 隧道 | `transport.bandwidthLimitMode` | `client` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.proxyProtocolVersion` | `空值` | 空值不生成 PROXY 协议头，不是自动选择版本 |
| 隧道 | `loadBalancer.group` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `loadBalancer.groupKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.type` | `空值` | 默认不启用健康检查；展示数值默认不会创建或启用 healthCheck |
| 隧道 | `healthCheck.timeoutSeconds` | `3` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.maxFailed` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.intervalSeconds` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.path` | `无默认` | HTTP 健康检查必须明确填写路径，没有有效官方默认；健康检查关闭时此字段不生效 |
| 隧道 | `healthCheck.httpHeaders` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `routeByHTTPUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `locations` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `responseHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `multiplexer` | `httpconnect` | 官方没有默认，TCPMUX 必须明确指定 httpconnect；应用生成时提供唯一合法预设 |
| 隧道 | `protocol` | `quic` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `keepTunnelOpen` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `maxRetriesAnHour` | `8` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `minRetryInterval` | `90` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTo` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTimeoutMs` | `1000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.type` | `空值` | 默认不启用插件；展示插件字段默认不会创建或启用 plugin |
| 隧道 | `plugin.localAddr` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.enableHTTP2` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.crtPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.keyPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.username` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.localPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.stripPrefix` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.unixPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |

</details>

<details>
<summary>frpc 0.61.2 · 130 项配置键与类型选项</summary>

[官方发布](https://github.com/fatedier/frp/releases/tag/v0.61.2)。补丁版本继承同一 minor 清单，运行前仍由 frpc verify 校验。

### 服务器连接

- **基础连接**：`serverAddr`、`serverPort`、`user`、`auth.token`、`transport.protocol`、`transport.tls.enable`、`webServer.addr`、`webServer.port`、`loginFailExit`、`log.to`、`log.level`、`log.disablePrintColor`。
- **连接高级**：`natHoleStunServer`、`dnsServer`、`udpPacketSize`、`metadatas`。
- **认证**：`auth.method`、`auth.additionalScopes`。
- **认证（认证 oidc）**：`auth.oidc.clientID`、`auth.oidc.clientSecret`、`auth.oidc.audience`、`auth.oidc.scope`、`auth.oidc.tokenEndpointURL`、`auth.oidc.additionalEndpointParams`。
- **传输**：`transport.dialServerTimeout`、`transport.dialServerKeepalive`、`transport.poolCount`、`transport.tcpMux`、`transport.tcpMuxKeepaliveInterval`、`transport.heartbeatInterval`、`transport.heartbeatTimeout`。
- **传输（tcp/websocket/wss）**：`transport.proxyURL`、`transport.connectServerLocalIP`。
- **QUIC（quic）**：`transport.quic.keepalivePeriod`、`transport.quic.maxIdleTimeout`、`transport.quic.maxIncomingStreams`。
- **TLS**：`transport.tls.certFile`、`transport.tls.keyFile`、`transport.tls.trustedCaFile`、`transport.tls.serverName`、`transport.tls.disableCustomTLSFirstByte`。
- **本机管理**：`webServer.user`、`webServer.password`、`webServer.assetsDir`、`webServer.pprofEnable`、`webServer.tls.certFile`、`webServer.tls.keyFile`、`webServer.tls.trustedCaFile`、`webServer.tls.serverName`。
- **传输协议**：`transport.protocol.tcp`、`transport.protocol.kcp`、`transport.protocol.quic`、`transport.protocol.websocket`、`transport.protocol.wss`。
- **认证方式**：`auth.method.token`、`auth.method.oidc`。

### 隧道、访问者与插件

- **基础隧道**：`name`、`type`、`enabled`、`transport.useEncryption`、`transport.useCompression`。
- **本地后端（provider）**：`localIP`、`localPort`。
- **远程端口（provider；tcp/udp）**：`remotePort`。
- **访问者（visitor；stcp/sudp/xtcp）**：`serverName`、`serverUser`、`bindAddr`、`bindPort`。
- **私有隧道（stcp/sudp/xtcp）**：`secretKey`。
- **访问权限（provider；stcp/sudp/xtcp）**：`allowUsers`。
- **域名（provider；http/https/tcpmux）**：`customDomains`、`subdomain`。
- **元数据（provider）**：`metadatas`。
- **注解（provider）**：`annotations`。
- **代理传输（provider）**：`transport.bandwidthLimit`、`transport.bandwidthLimitMode`、`transport.proxyProtocolVersion`。
- **负载均衡（provider；tcp/http/https/tcpmux）**：`loadBalancer.group`、`loadBalancer.groupKey`。
- **健康检查（provider）**：`healthCheck.type`、`healthCheck.timeoutSeconds`、`healthCheck.maxFailed`、`healthCheck.intervalSeconds`、`healthCheck.path`、`healthCheck.httpHeaders`。
- **HTTP（provider；http/tcpmux）**：`httpUser`、`httpPassword`、`routeByHTTPUser`。
- **HTTP（provider；http）**：`locations`、`hostHeaderRewrite`、`requestHeaders.set`。
- **HTTP 响应头（provider；http）**：`responseHeaders.set`。
- **TCPMUX（provider；tcpmux）**：`multiplexer`。
- **XTCP（visitor；xtcp）**：`protocol`、`keepTunnelOpen`、`maxRetriesAnHour`、`minRetryInterval`、`fallbackTo`、`fallbackTimeoutMs`。
- **隧道协议**：`type.tcp`、`type.udp`、`type.http`、`type.https`、`type.stcp`、`type.sudp`、`type.xtcp`、`type.tcpmux`。
- **插件（provider；tcp/stcp/xtcp/http/https/tcpmux）**：`plugin.type`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https）**：`plugin.type.http2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2http）**：`plugin.type.http2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http）**：`plugin.type.https2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2https）**：`plugin.type.https2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy）**：`plugin.type.http_proxy`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.type.socks5`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.type.static_file`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.type.unix_domain_socket`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 tls2raw）**：`plugin.type.tls2raw`。
- **插件目标（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https/tls2raw）**：`plugin.localAddr`。
- **插件 HTTP（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https）**：`plugin.hostHeaderRewrite`、`plugin.requestHeaders.set`。
- **插件 HTTP/2（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https）**：`plugin.enableHTTP2`。
- **插件 TLS（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https/tls2raw）**：`plugin.crtPath`、`plugin.keyPath`。
- **插件认证（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy/static_file）**：`plugin.httpUser`、`plugin.httpPassword`。
- **SOCKS5（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.username`、`plugin.password`。
- **静态文件（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.localPath`、`plugin.stripPrefix`。
- **Unix socket（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.unixPath`。

### 配置默认值

以下按新建配置上下文列出；TCP 复用、所属用户、TLS 服务名等联动值会随表单上下文更新。类型选项不是独立字段，不重复列默认值。应用接管项同时说明官方默认和应用实际策略。

| 范围 | 配置键 | 默认值 | 说明 |
| --- | --- | --- | --- |
| 连接 | `serverAddr` | `0.0.0.0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `serverPort` | `7000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.token` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.protocol` | `tcp` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.enable` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.addr` | `127.0.0.1` | 应用固定绑定本机地址，与官方默认相同 |
| 连接 | `webServer.port` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `loginFailExit` | `false` | 应用固定为 false，以持续监督登录重试；官方默认 true |
| 连接 | `log.to` | `console` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.level` | `info` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.disablePrintColor` | `true` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `natHoleStunServer` | `stun.easyvoip.com:3478` | 0.52.0 没有 STUN 回退；从 0.52.1 起默认使用官方 STUN 地址 |
| 连接 | `dnsServer` | `空值` | 空值使用操作系统 DNS，没有固定默认 IP |
| 连接 | `udpPacketSize` | `1500` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.method` | `token` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.additionalScopes` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.clientID` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.clientSecret` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.audience` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.scope` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.tokenEndpointURL` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.additionalEndpointParams` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerTimeout` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerKeepalive` | `7200` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.poolCount` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMux` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMuxKeepaliveInterval` | `30` | 0.58.1 起默认 30 秒；此前为 60 秒 |
| 连接 | `transport.heartbeatInterval` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.heartbeatTimeout` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.proxyURL` | `由环境决定` | 默认读取 frpc 进程的 http_proxy 环境变量；前端无法确定其值 |
| 连接 | `transport.connectServerLocalIP` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.keepalivePeriod` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIdleTimeout` | `30` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIncomingStreams` | `100000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.trustedCaFile` | `空值` | 默认无 CA 文件；frpc 的 TLS 客户端此时跳过服务端证书验证，指定 CA 后启用验证 |
| 连接 | `transport.tls.serverName` | `由上下文决定` | 留空时 TLS SNI 使用当前 serverAddr；显示回退值不会保存覆盖 |
| 连接 | `transport.tls.disableCustomTLSFirstByte` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.assetsDir` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.pprofEnable` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.serverName` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `name` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `type` | `tcp` | 官方 type 必填且没有默认；应用新建隧道预设 TCP |
| 隧道 | `enabled` | `true` | 应用默认启用，并在生成时过滤停用隧道；原生 enabled 字段从 0.66 才提供 |
| 隧道 | `transport.useEncryption` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.useCompression` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localIP` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localPort` | `无默认` | localPort 没有有效官方默认，启用普通后端时必须填正值；8080 是应用新建预设 |
| 隧道 | `remotePort` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `serverName` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `serverUser` | `空值` | 留空时使用当前连接的 user，不固定用户名或写回命名前缀 |
| 隧道 | `bindAddr` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `bindPort` | `无默认` | bindPort 默认零值无效，必须明确填写正值；STCP/XTCP 的 -1 是可选重定向设置 |
| 隧道 | `secretKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `allowUsers` | `[]` | 空列表仅允许当前 provider 的用户；不等于允许所有用户 |
| 隧道 | `customDomains` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `subdomain` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `annotations` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.bandwidthLimit` | `空值` | 空值或 0KB/0MB 不限速；不填写具体带宽上限 |
| 隧道 | `transport.bandwidthLimitMode` | `client` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.proxyProtocolVersion` | `空值` | 空值不生成 PROXY 协议头，不是自动选择版本 |
| 隧道 | `loadBalancer.group` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `loadBalancer.groupKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.type` | `空值` | 默认不启用健康检查；展示数值默认不会创建或启用 healthCheck |
| 隧道 | `healthCheck.timeoutSeconds` | `3` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.maxFailed` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.intervalSeconds` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.path` | `无默认` | HTTP 健康检查必须明确填写路径，没有有效官方默认；健康检查关闭时此字段不生效 |
| 隧道 | `healthCheck.httpHeaders` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `routeByHTTPUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `locations` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `responseHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `multiplexer` | `httpconnect` | 官方没有默认，TCPMUX 必须明确指定 httpconnect；应用生成时提供唯一合法预设 |
| 隧道 | `protocol` | `quic` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `keepTunnelOpen` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `maxRetriesAnHour` | `8` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `minRetryInterval` | `90` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTo` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTimeoutMs` | `1000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.type` | `空值` | 默认不启用插件；展示插件字段默认不会创建或启用 plugin |
| 隧道 | `plugin.localAddr` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.enableHTTP2` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.crtPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.keyPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.username` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.localPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.stripPrefix` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.unixPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |

</details>

<details>
<summary>frpc 0.62.0 · 130 项配置键与类型选项</summary>

[官方发布](https://github.com/fatedier/frp/releases/tag/v0.62.0)。已审核的版本配置清单。

### 服务器连接

- **基础连接**：`serverAddr`、`serverPort`、`user`、`auth.token`、`transport.protocol`、`transport.tls.enable`、`webServer.addr`、`webServer.port`、`loginFailExit`、`log.to`、`log.level`、`log.disablePrintColor`。
- **连接高级**：`natHoleStunServer`、`dnsServer`、`udpPacketSize`、`metadatas`。
- **认证**：`auth.method`、`auth.additionalScopes`。
- **认证（认证 oidc）**：`auth.oidc.clientID`、`auth.oidc.clientSecret`、`auth.oidc.audience`、`auth.oidc.scope`、`auth.oidc.tokenEndpointURL`、`auth.oidc.additionalEndpointParams`。
- **传输**：`transport.dialServerTimeout`、`transport.dialServerKeepalive`、`transport.poolCount`、`transport.tcpMux`、`transport.tcpMuxKeepaliveInterval`、`transport.heartbeatInterval`、`transport.heartbeatTimeout`。
- **传输（tcp/websocket/wss）**：`transport.proxyURL`、`transport.connectServerLocalIP`。
- **QUIC（quic）**：`transport.quic.keepalivePeriod`、`transport.quic.maxIdleTimeout`、`transport.quic.maxIncomingStreams`。
- **TLS**：`transport.tls.certFile`、`transport.tls.keyFile`、`transport.tls.trustedCaFile`、`transport.tls.serverName`、`transport.tls.disableCustomTLSFirstByte`。
- **本机管理**：`webServer.user`、`webServer.password`、`webServer.assetsDir`、`webServer.pprofEnable`、`webServer.tls.certFile`、`webServer.tls.keyFile`、`webServer.tls.trustedCaFile`、`webServer.tls.serverName`。
- **传输协议**：`transport.protocol.tcp`、`transport.protocol.kcp`、`transport.protocol.quic`、`transport.protocol.websocket`、`transport.protocol.wss`。
- **认证方式**：`auth.method.token`、`auth.method.oidc`。

### 隧道、访问者与插件

- **基础隧道**：`name`、`type`、`enabled`、`transport.useEncryption`、`transport.useCompression`。
- **本地后端（provider）**：`localIP`、`localPort`。
- **远程端口（provider；tcp/udp）**：`remotePort`。
- **访问者（visitor；stcp/sudp/xtcp）**：`serverName`、`serverUser`、`bindAddr`、`bindPort`。
- **私有隧道（stcp/sudp/xtcp）**：`secretKey`。
- **访问权限（provider；stcp/sudp/xtcp）**：`allowUsers`。
- **域名（provider；http/https/tcpmux）**：`customDomains`、`subdomain`。
- **元数据（provider）**：`metadatas`。
- **注解（provider）**：`annotations`。
- **代理传输（provider）**：`transport.bandwidthLimit`、`transport.bandwidthLimitMode`、`transport.proxyProtocolVersion`。
- **负载均衡（provider；tcp/http/https/tcpmux）**：`loadBalancer.group`、`loadBalancer.groupKey`。
- **健康检查（provider）**：`healthCheck.type`、`healthCheck.timeoutSeconds`、`healthCheck.maxFailed`、`healthCheck.intervalSeconds`、`healthCheck.path`、`healthCheck.httpHeaders`。
- **HTTP（provider；http/tcpmux）**：`httpUser`、`httpPassword`、`routeByHTTPUser`。
- **HTTP（provider；http）**：`locations`、`hostHeaderRewrite`、`requestHeaders.set`。
- **HTTP 响应头（provider；http）**：`responseHeaders.set`。
- **TCPMUX（provider；tcpmux）**：`multiplexer`。
- **XTCP（visitor；xtcp）**：`protocol`、`keepTunnelOpen`、`maxRetriesAnHour`、`minRetryInterval`、`fallbackTo`、`fallbackTimeoutMs`。
- **隧道协议**：`type.tcp`、`type.udp`、`type.http`、`type.https`、`type.stcp`、`type.sudp`、`type.xtcp`、`type.tcpmux`。
- **插件（provider；tcp/stcp/xtcp/http/https/tcpmux）**：`plugin.type`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https）**：`plugin.type.http2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2http）**：`plugin.type.http2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http）**：`plugin.type.https2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2https）**：`plugin.type.https2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy）**：`plugin.type.http_proxy`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.type.socks5`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.type.static_file`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.type.unix_domain_socket`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 tls2raw）**：`plugin.type.tls2raw`。
- **插件目标（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https/tls2raw）**：`plugin.localAddr`。
- **插件 HTTP（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https）**：`plugin.hostHeaderRewrite`、`plugin.requestHeaders.set`。
- **插件 HTTP/2（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https）**：`plugin.enableHTTP2`。
- **插件 TLS（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https/tls2raw）**：`plugin.crtPath`、`plugin.keyPath`。
- **插件认证（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy/static_file）**：`plugin.httpUser`、`plugin.httpPassword`。
- **SOCKS5（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.username`、`plugin.password`。
- **静态文件（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.localPath`、`plugin.stripPrefix`。
- **Unix socket（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.unixPath`。

### 配置默认值

以下按新建配置上下文列出；TCP 复用、所属用户、TLS 服务名等联动值会随表单上下文更新。类型选项不是独立字段，不重复列默认值。应用接管项同时说明官方默认和应用实际策略。

| 范围 | 配置键 | 默认值 | 说明 |
| --- | --- | --- | --- |
| 连接 | `serverAddr` | `0.0.0.0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `serverPort` | `7000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.token` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.protocol` | `tcp` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.enable` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.addr` | `127.0.0.1` | 应用固定绑定本机地址，与官方默认相同 |
| 连接 | `webServer.port` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `loginFailExit` | `false` | 应用固定为 false，以持续监督登录重试；官方默认 true |
| 连接 | `log.to` | `console` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.level` | `info` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.disablePrintColor` | `true` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `natHoleStunServer` | `stun.easyvoip.com:3478` | 0.52.0 没有 STUN 回退；从 0.52.1 起默认使用官方 STUN 地址 |
| 连接 | `dnsServer` | `空值` | 空值使用操作系统 DNS，没有固定默认 IP |
| 连接 | `udpPacketSize` | `1500` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.method` | `token` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.additionalScopes` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.clientID` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.clientSecret` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.audience` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.scope` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.tokenEndpointURL` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.additionalEndpointParams` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerTimeout` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerKeepalive` | `7200` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.poolCount` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMux` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMuxKeepaliveInterval` | `30` | 0.58.1 起默认 30 秒；此前为 60 秒 |
| 连接 | `transport.heartbeatInterval` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.heartbeatTimeout` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.proxyURL` | `由环境决定` | 默认读取 frpc 进程的 http_proxy 环境变量；前端无法确定其值 |
| 连接 | `transport.connectServerLocalIP` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.keepalivePeriod` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIdleTimeout` | `30` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIncomingStreams` | `100000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.trustedCaFile` | `空值` | 默认无 CA 文件；frpc 的 TLS 客户端此时跳过服务端证书验证，指定 CA 后启用验证 |
| 连接 | `transport.tls.serverName` | `由上下文决定` | 留空时 TLS SNI 使用当前 serverAddr；显示回退值不会保存覆盖 |
| 连接 | `transport.tls.disableCustomTLSFirstByte` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.assetsDir` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.pprofEnable` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.serverName` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `name` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `type` | `tcp` | 官方 type 必填且没有默认；应用新建隧道预设 TCP |
| 隧道 | `enabled` | `true` | 应用默认启用，并在生成时过滤停用隧道；原生 enabled 字段从 0.66 才提供 |
| 隧道 | `transport.useEncryption` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.useCompression` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localIP` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localPort` | `无默认` | localPort 没有有效官方默认，启用普通后端时必须填正值；8080 是应用新建预设 |
| 隧道 | `remotePort` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `serverName` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `serverUser` | `空值` | 留空时使用当前连接的 user，不固定用户名或写回命名前缀 |
| 隧道 | `bindAddr` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `bindPort` | `无默认` | bindPort 默认零值无效，必须明确填写正值；STCP/XTCP 的 -1 是可选重定向设置 |
| 隧道 | `secretKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `allowUsers` | `[]` | 空列表仅允许当前 provider 的用户；不等于允许所有用户 |
| 隧道 | `customDomains` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `subdomain` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `annotations` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.bandwidthLimit` | `空值` | 空值或 0KB/0MB 不限速；不填写具体带宽上限 |
| 隧道 | `transport.bandwidthLimitMode` | `client` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.proxyProtocolVersion` | `空值` | 空值不生成 PROXY 协议头，不是自动选择版本 |
| 隧道 | `loadBalancer.group` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `loadBalancer.groupKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.type` | `空值` | 默认不启用健康检查；展示数值默认不会创建或启用 healthCheck |
| 隧道 | `healthCheck.timeoutSeconds` | `3` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.maxFailed` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.intervalSeconds` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.path` | `无默认` | HTTP 健康检查必须明确填写路径，没有有效官方默认；健康检查关闭时此字段不生效 |
| 隧道 | `healthCheck.httpHeaders` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `routeByHTTPUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `locations` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `responseHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `multiplexer` | `httpconnect` | 官方没有默认，TCPMUX 必须明确指定 httpconnect；应用生成时提供唯一合法预设 |
| 隧道 | `protocol` | `quic` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `keepTunnelOpen` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `maxRetriesAnHour` | `8` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `minRetryInterval` | `90` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTo` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTimeoutMs` | `1000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.type` | `空值` | 默认不启用插件；展示插件字段默认不会创建或启用 plugin |
| 隧道 | `plugin.localAddr` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.enableHTTP2` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.crtPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.keyPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.username` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.localPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.stripPrefix` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.unixPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |

</details>

<details>
<summary>frpc 0.62.1 · 130 项配置键与类型选项</summary>

[官方发布](https://github.com/fatedier/frp/releases/tag/v0.62.1)。补丁版本继承同一 minor 清单，运行前仍由 frpc verify 校验。

### 服务器连接

- **基础连接**：`serverAddr`、`serverPort`、`user`、`auth.token`、`transport.protocol`、`transport.tls.enable`、`webServer.addr`、`webServer.port`、`loginFailExit`、`log.to`、`log.level`、`log.disablePrintColor`。
- **连接高级**：`natHoleStunServer`、`dnsServer`、`udpPacketSize`、`metadatas`。
- **认证**：`auth.method`、`auth.additionalScopes`。
- **认证（认证 oidc）**：`auth.oidc.clientID`、`auth.oidc.clientSecret`、`auth.oidc.audience`、`auth.oidc.scope`、`auth.oidc.tokenEndpointURL`、`auth.oidc.additionalEndpointParams`。
- **传输**：`transport.dialServerTimeout`、`transport.dialServerKeepalive`、`transport.poolCount`、`transport.tcpMux`、`transport.tcpMuxKeepaliveInterval`、`transport.heartbeatInterval`、`transport.heartbeatTimeout`。
- **传输（tcp/websocket/wss）**：`transport.proxyURL`、`transport.connectServerLocalIP`。
- **QUIC（quic）**：`transport.quic.keepalivePeriod`、`transport.quic.maxIdleTimeout`、`transport.quic.maxIncomingStreams`。
- **TLS**：`transport.tls.certFile`、`transport.tls.keyFile`、`transport.tls.trustedCaFile`、`transport.tls.serverName`、`transport.tls.disableCustomTLSFirstByte`。
- **本机管理**：`webServer.user`、`webServer.password`、`webServer.assetsDir`、`webServer.pprofEnable`、`webServer.tls.certFile`、`webServer.tls.keyFile`、`webServer.tls.trustedCaFile`、`webServer.tls.serverName`。
- **传输协议**：`transport.protocol.tcp`、`transport.protocol.kcp`、`transport.protocol.quic`、`transport.protocol.websocket`、`transport.protocol.wss`。
- **认证方式**：`auth.method.token`、`auth.method.oidc`。

### 隧道、访问者与插件

- **基础隧道**：`name`、`type`、`enabled`、`transport.useEncryption`、`transport.useCompression`。
- **本地后端（provider）**：`localIP`、`localPort`。
- **远程端口（provider；tcp/udp）**：`remotePort`。
- **访问者（visitor；stcp/sudp/xtcp）**：`serverName`、`serverUser`、`bindAddr`、`bindPort`。
- **私有隧道（stcp/sudp/xtcp）**：`secretKey`。
- **访问权限（provider；stcp/sudp/xtcp）**：`allowUsers`。
- **域名（provider；http/https/tcpmux）**：`customDomains`、`subdomain`。
- **元数据（provider）**：`metadatas`。
- **注解（provider）**：`annotations`。
- **代理传输（provider）**：`transport.bandwidthLimit`、`transport.bandwidthLimitMode`、`transport.proxyProtocolVersion`。
- **负载均衡（provider；tcp/http/https/tcpmux）**：`loadBalancer.group`、`loadBalancer.groupKey`。
- **健康检查（provider）**：`healthCheck.type`、`healthCheck.timeoutSeconds`、`healthCheck.maxFailed`、`healthCheck.intervalSeconds`、`healthCheck.path`、`healthCheck.httpHeaders`。
- **HTTP（provider；http/tcpmux）**：`httpUser`、`httpPassword`、`routeByHTTPUser`。
- **HTTP（provider；http）**：`locations`、`hostHeaderRewrite`、`requestHeaders.set`。
- **HTTP 响应头（provider；http）**：`responseHeaders.set`。
- **TCPMUX（provider；tcpmux）**：`multiplexer`。
- **XTCP（visitor；xtcp）**：`protocol`、`keepTunnelOpen`、`maxRetriesAnHour`、`minRetryInterval`、`fallbackTo`、`fallbackTimeoutMs`。
- **隧道协议**：`type.tcp`、`type.udp`、`type.http`、`type.https`、`type.stcp`、`type.sudp`、`type.xtcp`、`type.tcpmux`。
- **插件（provider；tcp/stcp/xtcp/http/https/tcpmux）**：`plugin.type`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https）**：`plugin.type.http2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2http）**：`plugin.type.http2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http）**：`plugin.type.https2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2https）**：`plugin.type.https2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy）**：`plugin.type.http_proxy`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.type.socks5`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.type.static_file`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.type.unix_domain_socket`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 tls2raw）**：`plugin.type.tls2raw`。
- **插件目标（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https/tls2raw）**：`plugin.localAddr`。
- **插件 HTTP（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https）**：`plugin.hostHeaderRewrite`、`plugin.requestHeaders.set`。
- **插件 HTTP/2（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https）**：`plugin.enableHTTP2`。
- **插件 TLS（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https/tls2raw）**：`plugin.crtPath`、`plugin.keyPath`。
- **插件认证（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy/static_file）**：`plugin.httpUser`、`plugin.httpPassword`。
- **SOCKS5（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.username`、`plugin.password`。
- **静态文件（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.localPath`、`plugin.stripPrefix`。
- **Unix socket（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.unixPath`。

### 配置默认值

以下按新建配置上下文列出；TCP 复用、所属用户、TLS 服务名等联动值会随表单上下文更新。类型选项不是独立字段，不重复列默认值。应用接管项同时说明官方默认和应用实际策略。

| 范围 | 配置键 | 默认值 | 说明 |
| --- | --- | --- | --- |
| 连接 | `serverAddr` | `0.0.0.0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `serverPort` | `7000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.token` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.protocol` | `tcp` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.enable` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.addr` | `127.0.0.1` | 应用固定绑定本机地址，与官方默认相同 |
| 连接 | `webServer.port` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `loginFailExit` | `false` | 应用固定为 false，以持续监督登录重试；官方默认 true |
| 连接 | `log.to` | `console` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.level` | `info` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.disablePrintColor` | `true` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `natHoleStunServer` | `stun.easyvoip.com:3478` | 0.52.0 没有 STUN 回退；从 0.52.1 起默认使用官方 STUN 地址 |
| 连接 | `dnsServer` | `空值` | 空值使用操作系统 DNS，没有固定默认 IP |
| 连接 | `udpPacketSize` | `1500` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.method` | `token` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.additionalScopes` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.clientID` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.clientSecret` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.audience` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.scope` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.tokenEndpointURL` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.additionalEndpointParams` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerTimeout` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerKeepalive` | `7200` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.poolCount` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMux` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMuxKeepaliveInterval` | `30` | 0.58.1 起默认 30 秒；此前为 60 秒 |
| 连接 | `transport.heartbeatInterval` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.heartbeatTimeout` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.proxyURL` | `由环境决定` | 默认读取 frpc 进程的 http_proxy 环境变量；前端无法确定其值 |
| 连接 | `transport.connectServerLocalIP` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.keepalivePeriod` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIdleTimeout` | `30` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIncomingStreams` | `100000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.trustedCaFile` | `空值` | 默认无 CA 文件；frpc 的 TLS 客户端此时跳过服务端证书验证，指定 CA 后启用验证 |
| 连接 | `transport.tls.serverName` | `由上下文决定` | 留空时 TLS SNI 使用当前 serverAddr；显示回退值不会保存覆盖 |
| 连接 | `transport.tls.disableCustomTLSFirstByte` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.assetsDir` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.pprofEnable` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.serverName` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `name` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `type` | `tcp` | 官方 type 必填且没有默认；应用新建隧道预设 TCP |
| 隧道 | `enabled` | `true` | 应用默认启用，并在生成时过滤停用隧道；原生 enabled 字段从 0.66 才提供 |
| 隧道 | `transport.useEncryption` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.useCompression` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localIP` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localPort` | `无默认` | localPort 没有有效官方默认，启用普通后端时必须填正值；8080 是应用新建预设 |
| 隧道 | `remotePort` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `serverName` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `serverUser` | `空值` | 留空时使用当前连接的 user，不固定用户名或写回命名前缀 |
| 隧道 | `bindAddr` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `bindPort` | `无默认` | bindPort 默认零值无效，必须明确填写正值；STCP/XTCP 的 -1 是可选重定向设置 |
| 隧道 | `secretKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `allowUsers` | `[]` | 空列表仅允许当前 provider 的用户；不等于允许所有用户 |
| 隧道 | `customDomains` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `subdomain` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `annotations` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.bandwidthLimit` | `空值` | 空值或 0KB/0MB 不限速；不填写具体带宽上限 |
| 隧道 | `transport.bandwidthLimitMode` | `client` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.proxyProtocolVersion` | `空值` | 空值不生成 PROXY 协议头，不是自动选择版本 |
| 隧道 | `loadBalancer.group` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `loadBalancer.groupKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.type` | `空值` | 默认不启用健康检查；展示数值默认不会创建或启用 healthCheck |
| 隧道 | `healthCheck.timeoutSeconds` | `3` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.maxFailed` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.intervalSeconds` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.path` | `无默认` | HTTP 健康检查必须明确填写路径，没有有效官方默认；健康检查关闭时此字段不生效 |
| 隧道 | `healthCheck.httpHeaders` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `routeByHTTPUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `locations` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `responseHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `multiplexer` | `httpconnect` | 官方没有默认，TCPMUX 必须明确指定 httpconnect；应用生成时提供唯一合法预设 |
| 隧道 | `protocol` | `quic` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `keepTunnelOpen` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `maxRetriesAnHour` | `8` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `minRetryInterval` | `90` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTo` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTimeoutMs` | `1000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.type` | `空值` | 默认不启用插件；展示插件字段默认不会创建或启用 plugin |
| 隧道 | `plugin.localAddr` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.enableHTTP2` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.crtPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.keyPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.username` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.localPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.stripPrefix` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.unixPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |

</details>

<details>
<summary>frpc 0.63.0 · 130 项配置键与类型选项</summary>

[官方发布](https://github.com/fatedier/frp/releases/tag/v0.63.0)。已审核的版本配置清单。

### 服务器连接

- **基础连接**：`serverAddr`、`serverPort`、`user`、`auth.token`、`transport.protocol`、`transport.tls.enable`、`webServer.addr`、`webServer.port`、`loginFailExit`、`log.to`、`log.level`、`log.disablePrintColor`。
- **连接高级**：`natHoleStunServer`、`dnsServer`、`udpPacketSize`、`metadatas`。
- **认证**：`auth.method`、`auth.additionalScopes`。
- **认证（认证 oidc）**：`auth.oidc.clientID`、`auth.oidc.clientSecret`、`auth.oidc.audience`、`auth.oidc.scope`、`auth.oidc.tokenEndpointURL`、`auth.oidc.additionalEndpointParams`。
- **传输**：`transport.dialServerTimeout`、`transport.dialServerKeepalive`、`transport.poolCount`、`transport.tcpMux`、`transport.tcpMuxKeepaliveInterval`、`transport.heartbeatInterval`、`transport.heartbeatTimeout`。
- **传输（tcp/websocket/wss）**：`transport.proxyURL`、`transport.connectServerLocalIP`。
- **QUIC（quic）**：`transport.quic.keepalivePeriod`、`transport.quic.maxIdleTimeout`、`transport.quic.maxIncomingStreams`。
- **TLS**：`transport.tls.certFile`、`transport.tls.keyFile`、`transport.tls.trustedCaFile`、`transport.tls.serverName`、`transport.tls.disableCustomTLSFirstByte`。
- **本机管理**：`webServer.user`、`webServer.password`、`webServer.assetsDir`、`webServer.pprofEnable`、`webServer.tls.certFile`、`webServer.tls.keyFile`、`webServer.tls.trustedCaFile`、`webServer.tls.serverName`。
- **传输协议**：`transport.protocol.tcp`、`transport.protocol.kcp`、`transport.protocol.quic`、`transport.protocol.websocket`、`transport.protocol.wss`。
- **认证方式**：`auth.method.token`、`auth.method.oidc`。

### 隧道、访问者与插件

- **基础隧道**：`name`、`type`、`enabled`、`transport.useEncryption`、`transport.useCompression`。
- **本地后端（provider）**：`localIP`、`localPort`。
- **远程端口（provider；tcp/udp）**：`remotePort`。
- **访问者（visitor；stcp/sudp/xtcp）**：`serverName`、`serverUser`、`bindAddr`、`bindPort`。
- **私有隧道（stcp/sudp/xtcp）**：`secretKey`。
- **访问权限（provider；stcp/sudp/xtcp）**：`allowUsers`。
- **域名（provider；http/https/tcpmux）**：`customDomains`、`subdomain`。
- **元数据（provider）**：`metadatas`。
- **注解（provider）**：`annotations`。
- **代理传输（provider）**：`transport.bandwidthLimit`、`transport.bandwidthLimitMode`、`transport.proxyProtocolVersion`。
- **负载均衡（provider；tcp/http/https/tcpmux）**：`loadBalancer.group`、`loadBalancer.groupKey`。
- **健康检查（provider）**：`healthCheck.type`、`healthCheck.timeoutSeconds`、`healthCheck.maxFailed`、`healthCheck.intervalSeconds`、`healthCheck.path`、`healthCheck.httpHeaders`。
- **HTTP（provider；http/tcpmux）**：`httpUser`、`httpPassword`、`routeByHTTPUser`。
- **HTTP（provider；http）**：`locations`、`hostHeaderRewrite`、`requestHeaders.set`。
- **HTTP 响应头（provider；http）**：`responseHeaders.set`。
- **TCPMUX（provider；tcpmux）**：`multiplexer`。
- **XTCP（visitor；xtcp）**：`protocol`、`keepTunnelOpen`、`maxRetriesAnHour`、`minRetryInterval`、`fallbackTo`、`fallbackTimeoutMs`。
- **隧道协议**：`type.tcp`、`type.udp`、`type.http`、`type.https`、`type.stcp`、`type.sudp`、`type.xtcp`、`type.tcpmux`。
- **插件（provider；tcp/stcp/xtcp/http/https/tcpmux）**：`plugin.type`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https）**：`plugin.type.http2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2http）**：`plugin.type.http2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http）**：`plugin.type.https2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2https）**：`plugin.type.https2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy）**：`plugin.type.http_proxy`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.type.socks5`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.type.static_file`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.type.unix_domain_socket`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 tls2raw）**：`plugin.type.tls2raw`。
- **插件目标（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https/tls2raw）**：`plugin.localAddr`。
- **插件 HTTP（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https）**：`plugin.hostHeaderRewrite`、`plugin.requestHeaders.set`。
- **插件 HTTP/2（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https）**：`plugin.enableHTTP2`。
- **插件 TLS（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https/tls2raw）**：`plugin.crtPath`、`plugin.keyPath`。
- **插件认证（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy/static_file）**：`plugin.httpUser`、`plugin.httpPassword`。
- **SOCKS5（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.username`、`plugin.password`。
- **静态文件（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.localPath`、`plugin.stripPrefix`。
- **Unix socket（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.unixPath`。

### 配置默认值

以下按新建配置上下文列出；TCP 复用、所属用户、TLS 服务名等联动值会随表单上下文更新。类型选项不是独立字段，不重复列默认值。应用接管项同时说明官方默认和应用实际策略。

| 范围 | 配置键 | 默认值 | 说明 |
| --- | --- | --- | --- |
| 连接 | `serverAddr` | `0.0.0.0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `serverPort` | `7000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.token` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.protocol` | `tcp` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.enable` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.addr` | `127.0.0.1` | 应用固定绑定本机地址，与官方默认相同 |
| 连接 | `webServer.port` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `loginFailExit` | `false` | 应用固定为 false，以持续监督登录重试；官方默认 true |
| 连接 | `log.to` | `console` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.level` | `info` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.disablePrintColor` | `true` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `natHoleStunServer` | `stun.easyvoip.com:3478` | 0.52.0 没有 STUN 回退；从 0.52.1 起默认使用官方 STUN 地址 |
| 连接 | `dnsServer` | `空值` | 空值使用操作系统 DNS，没有固定默认 IP |
| 连接 | `udpPacketSize` | `1500` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.method` | `token` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.additionalScopes` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.clientID` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.clientSecret` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.audience` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.scope` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.tokenEndpointURL` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.additionalEndpointParams` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerTimeout` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerKeepalive` | `7200` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.poolCount` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMux` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMuxKeepaliveInterval` | `30` | 0.58.1 起默认 30 秒；此前为 60 秒 |
| 连接 | `transport.heartbeatInterval` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.heartbeatTimeout` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.proxyURL` | `由环境决定` | 默认读取 frpc 进程的 http_proxy 环境变量；前端无法确定其值 |
| 连接 | `transport.connectServerLocalIP` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.keepalivePeriod` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIdleTimeout` | `30` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIncomingStreams` | `100000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.trustedCaFile` | `空值` | 默认无 CA 文件；frpc 的 TLS 客户端此时跳过服务端证书验证，指定 CA 后启用验证 |
| 连接 | `transport.tls.serverName` | `由上下文决定` | 留空时 TLS SNI 使用当前 serverAddr；显示回退值不会保存覆盖 |
| 连接 | `transport.tls.disableCustomTLSFirstByte` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.assetsDir` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.pprofEnable` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.serverName` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `name` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `type` | `tcp` | 官方 type 必填且没有默认；应用新建隧道预设 TCP |
| 隧道 | `enabled` | `true` | 应用默认启用，并在生成时过滤停用隧道；原生 enabled 字段从 0.66 才提供 |
| 隧道 | `transport.useEncryption` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.useCompression` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localIP` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localPort` | `无默认` | localPort 没有有效官方默认，启用普通后端时必须填正值；8080 是应用新建预设 |
| 隧道 | `remotePort` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `serverName` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `serverUser` | `空值` | 留空时使用当前连接的 user，不固定用户名或写回命名前缀 |
| 隧道 | `bindAddr` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `bindPort` | `无默认` | bindPort 默认零值无效，必须明确填写正值；STCP/XTCP 的 -1 是可选重定向设置 |
| 隧道 | `secretKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `allowUsers` | `[]` | 空列表仅允许当前 provider 的用户；不等于允许所有用户 |
| 隧道 | `customDomains` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `subdomain` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `annotations` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.bandwidthLimit` | `空值` | 空值或 0KB/0MB 不限速；不填写具体带宽上限 |
| 隧道 | `transport.bandwidthLimitMode` | `client` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.proxyProtocolVersion` | `空值` | 空值不生成 PROXY 协议头，不是自动选择版本 |
| 隧道 | `loadBalancer.group` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `loadBalancer.groupKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.type` | `空值` | 默认不启用健康检查；展示数值默认不会创建或启用 healthCheck |
| 隧道 | `healthCheck.timeoutSeconds` | `3` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.maxFailed` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.intervalSeconds` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.path` | `无默认` | HTTP 健康检查必须明确填写路径，没有有效官方默认；健康检查关闭时此字段不生效 |
| 隧道 | `healthCheck.httpHeaders` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `routeByHTTPUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `locations` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `responseHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `multiplexer` | `httpconnect` | 官方没有默认，TCPMUX 必须明确指定 httpconnect；应用生成时提供唯一合法预设 |
| 隧道 | `protocol` | `quic` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `keepTunnelOpen` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `maxRetriesAnHour` | `8` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `minRetryInterval` | `90` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTo` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTimeoutMs` | `1000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.type` | `空值` | 默认不启用插件；展示插件字段默认不会创建或启用 plugin |
| 隧道 | `plugin.localAddr` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.enableHTTP2` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.crtPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.keyPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.username` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.localPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.stripPrefix` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.unixPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |

</details>

<details>
<summary>frpc 0.64.0 · 133 项配置键与类型选项</summary>

[官方发布](https://github.com/fatedier/frp/releases/tag/v0.64.0)。已审核的版本配置清单。

### 服务器连接

- **基础连接**：`serverAddr`、`serverPort`、`user`、`auth.token`、`transport.protocol`、`transport.tls.enable`、`webServer.addr`、`webServer.port`、`loginFailExit`、`log.to`、`log.level`、`log.disablePrintColor`。
- **连接高级**：`natHoleStunServer`、`dnsServer`、`udpPacketSize`、`metadatas`。
- **认证**：`auth.method`、`auth.additionalScopes`。
- **认证（认证 oidc）**：`auth.oidc.clientID`、`auth.oidc.clientSecret`、`auth.oidc.audience`、`auth.oidc.scope`、`auth.oidc.tokenEndpointURL`、`auth.oidc.additionalEndpointParams`。
- **Token 文件来源（认证 token）**：`auth.tokenSource`、`auth.tokenSource.type`、`auth.tokenSource.file.path`。
- **传输**：`transport.dialServerTimeout`、`transport.dialServerKeepalive`、`transport.poolCount`、`transport.tcpMux`、`transport.tcpMuxKeepaliveInterval`、`transport.heartbeatInterval`、`transport.heartbeatTimeout`。
- **传输（tcp/websocket/wss）**：`transport.proxyURL`、`transport.connectServerLocalIP`。
- **QUIC（quic）**：`transport.quic.keepalivePeriod`、`transport.quic.maxIdleTimeout`、`transport.quic.maxIncomingStreams`。
- **TLS**：`transport.tls.certFile`、`transport.tls.keyFile`、`transport.tls.trustedCaFile`、`transport.tls.serverName`、`transport.tls.disableCustomTLSFirstByte`。
- **本机管理**：`webServer.user`、`webServer.password`、`webServer.assetsDir`、`webServer.pprofEnable`、`webServer.tls.certFile`、`webServer.tls.keyFile`、`webServer.tls.trustedCaFile`、`webServer.tls.serverName`。
- **传输协议**：`transport.protocol.tcp`、`transport.protocol.kcp`、`transport.protocol.quic`、`transport.protocol.websocket`、`transport.protocol.wss`。
- **认证方式**：`auth.method.token`、`auth.method.oidc`。

### 隧道、访问者与插件

- **基础隧道**：`name`、`type`、`enabled`、`transport.useEncryption`、`transport.useCompression`。
- **本地后端（provider）**：`localIP`、`localPort`。
- **远程端口（provider；tcp/udp）**：`remotePort`。
- **访问者（visitor；stcp/sudp/xtcp）**：`serverName`、`serverUser`、`bindAddr`、`bindPort`。
- **私有隧道（stcp/sudp/xtcp）**：`secretKey`。
- **访问权限（provider；stcp/sudp/xtcp）**：`allowUsers`。
- **域名（provider；http/https/tcpmux）**：`customDomains`、`subdomain`。
- **元数据（provider）**：`metadatas`。
- **注解（provider）**：`annotations`。
- **代理传输（provider）**：`transport.bandwidthLimit`、`transport.bandwidthLimitMode`、`transport.proxyProtocolVersion`。
- **负载均衡（provider；tcp/http/https/tcpmux）**：`loadBalancer.group`、`loadBalancer.groupKey`。
- **健康检查（provider）**：`healthCheck.type`、`healthCheck.timeoutSeconds`、`healthCheck.maxFailed`、`healthCheck.intervalSeconds`、`healthCheck.path`、`healthCheck.httpHeaders`。
- **HTTP（provider；http/tcpmux）**：`httpUser`、`httpPassword`、`routeByHTTPUser`。
- **HTTP（provider；http）**：`locations`、`hostHeaderRewrite`、`requestHeaders.set`。
- **HTTP 响应头（provider；http）**：`responseHeaders.set`。
- **TCPMUX（provider；tcpmux）**：`multiplexer`。
- **XTCP（visitor；xtcp）**：`protocol`、`keepTunnelOpen`、`maxRetriesAnHour`、`minRetryInterval`、`fallbackTo`、`fallbackTimeoutMs`。
- **隧道协议**：`type.tcp`、`type.udp`、`type.http`、`type.https`、`type.stcp`、`type.sudp`、`type.xtcp`、`type.tcpmux`。
- **插件（provider；tcp/stcp/xtcp/http/https/tcpmux）**：`plugin.type`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https）**：`plugin.type.http2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2http）**：`plugin.type.http2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http）**：`plugin.type.https2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2https）**：`plugin.type.https2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy）**：`plugin.type.http_proxy`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.type.socks5`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.type.static_file`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.type.unix_domain_socket`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 tls2raw）**：`plugin.type.tls2raw`。
- **插件目标（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https/tls2raw）**：`plugin.localAddr`。
- **插件 HTTP（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https）**：`plugin.hostHeaderRewrite`、`plugin.requestHeaders.set`。
- **插件 HTTP/2（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https）**：`plugin.enableHTTP2`。
- **插件 TLS（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https/tls2raw）**：`plugin.crtPath`、`plugin.keyPath`。
- **插件认证（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy/static_file）**：`plugin.httpUser`、`plugin.httpPassword`。
- **SOCKS5（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.username`、`plugin.password`。
- **静态文件（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.localPath`、`plugin.stripPrefix`。
- **Unix socket（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.unixPath`。

### 配置默认值

以下按新建配置上下文列出；TCP 复用、所属用户、TLS 服务名等联动值会随表单上下文更新。类型选项不是独立字段，不重复列默认值。应用接管项同时说明官方默认和应用实际策略。

| 范围 | 配置键 | 默认值 | 说明 |
| --- | --- | --- | --- |
| 连接 | `serverAddr` | `0.0.0.0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `serverPort` | `7000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.token` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.protocol` | `tcp` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.enable` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.addr` | `127.0.0.1` | 应用固定绑定本机地址，与官方默认相同 |
| 连接 | `webServer.port` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `loginFailExit` | `false` | 应用固定为 false，以持续监督登录重试；官方默认 true |
| 连接 | `log.to` | `console` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.level` | `info` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.disablePrintColor` | `true` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `natHoleStunServer` | `stun.easyvoip.com:3478` | 0.52.0 没有 STUN 回退；从 0.52.1 起默认使用官方 STUN 地址 |
| 连接 | `dnsServer` | `空值` | 空值使用操作系统 DNS，没有固定默认 IP |
| 连接 | `udpPacketSize` | `1500` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.method` | `token` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.additionalScopes` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.clientID` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.clientSecret` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.audience` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.scope` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.tokenEndpointURL` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.additionalEndpointParams` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.tokenSource` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.tokenSource.type` | `file` | 来源默认未启用；显式启用时应用仅提供 file 类型 |
| 连接 | `auth.tokenSource.file.path` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `transport.dialServerTimeout` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerKeepalive` | `7200` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.poolCount` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMux` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMuxKeepaliveInterval` | `30` | 0.58.1 起默认 30 秒；此前为 60 秒 |
| 连接 | `transport.heartbeatInterval` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.heartbeatTimeout` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.proxyURL` | `由环境决定` | 默认读取 frpc 进程的 http_proxy 环境变量；前端无法确定其值 |
| 连接 | `transport.connectServerLocalIP` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.keepalivePeriod` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIdleTimeout` | `30` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIncomingStreams` | `100000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.trustedCaFile` | `空值` | 默认无 CA 文件；frpc 的 TLS 客户端此时跳过服务端证书验证，指定 CA 后启用验证 |
| 连接 | `transport.tls.serverName` | `由上下文决定` | 留空时 TLS SNI 使用当前 serverAddr；显示回退值不会保存覆盖 |
| 连接 | `transport.tls.disableCustomTLSFirstByte` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.assetsDir` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.pprofEnable` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.serverName` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `name` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `type` | `tcp` | 官方 type 必填且没有默认；应用新建隧道预设 TCP |
| 隧道 | `enabled` | `true` | 应用默认启用，并在生成时过滤停用隧道；原生 enabled 字段从 0.66 才提供 |
| 隧道 | `transport.useEncryption` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.useCompression` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localIP` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localPort` | `无默认` | localPort 没有有效官方默认，启用普通后端时必须填正值；8080 是应用新建预设 |
| 隧道 | `remotePort` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `serverName` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `serverUser` | `空值` | 留空时使用当前连接的 user，不固定用户名或写回命名前缀 |
| 隧道 | `bindAddr` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `bindPort` | `无默认` | bindPort 默认零值无效，必须明确填写正值；STCP/XTCP 的 -1 是可选重定向设置 |
| 隧道 | `secretKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `allowUsers` | `[]` | 空列表仅允许当前 provider 的用户；不等于允许所有用户 |
| 隧道 | `customDomains` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `subdomain` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `annotations` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.bandwidthLimit` | `空值` | 空值或 0KB/0MB 不限速；不填写具体带宽上限 |
| 隧道 | `transport.bandwidthLimitMode` | `client` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.proxyProtocolVersion` | `空值` | 空值不生成 PROXY 协议头，不是自动选择版本 |
| 隧道 | `loadBalancer.group` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `loadBalancer.groupKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.type` | `空值` | 默认不启用健康检查；展示数值默认不会创建或启用 healthCheck |
| 隧道 | `healthCheck.timeoutSeconds` | `3` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.maxFailed` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.intervalSeconds` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.path` | `无默认` | HTTP 健康检查必须明确填写路径，没有有效官方默认；健康检查关闭时此字段不生效 |
| 隧道 | `healthCheck.httpHeaders` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `routeByHTTPUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `locations` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `responseHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `multiplexer` | `httpconnect` | 官方没有默认，TCPMUX 必须明确指定 httpconnect；应用生成时提供唯一合法预设 |
| 隧道 | `protocol` | `quic` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `keepTunnelOpen` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `maxRetriesAnHour` | `8` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `minRetryInterval` | `90` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTo` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTimeoutMs` | `1000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.type` | `空值` | 默认不启用插件；展示插件字段默认不会创建或启用 plugin |
| 隧道 | `plugin.localAddr` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.enableHTTP2` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.crtPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.keyPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.username` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.localPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.stripPrefix` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.unixPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |

</details>

<details>
<summary>frpc 0.65.0 · 137 项配置键与类型选项</summary>

[官方发布](https://github.com/fatedier/frp/releases/tag/v0.65.0)。已审核的版本配置清单。

### 服务器连接

- **基础连接**：`serverAddr`、`serverPort`、`user`、`auth.token`、`transport.protocol`、`transport.tls.enable`、`webServer.addr`、`webServer.port`、`loginFailExit`、`log.to`、`log.level`、`log.disablePrintColor`。
- **连接高级**：`natHoleStunServer`、`dnsServer`、`udpPacketSize`、`metadatas`。
- **认证**：`auth.method`、`auth.additionalScopes`。
- **认证（认证 oidc）**：`auth.oidc.clientID`、`auth.oidc.clientSecret`、`auth.oidc.audience`、`auth.oidc.scope`、`auth.oidc.tokenEndpointURL`、`auth.oidc.additionalEndpointParams`。
- **OIDC TLS 与代理（认证 oidc）**：`auth.oidc.trustedCaFile`、`auth.oidc.insecureSkipVerify`、`auth.oidc.proxyURL`。
- **Token 文件来源（认证 token）**：`auth.tokenSource`、`auth.tokenSource.type`、`auth.tokenSource.file.path`。
- **传输**：`transport.dialServerTimeout`、`transport.dialServerKeepalive`、`transport.poolCount`、`transport.tcpMux`、`transport.tcpMuxKeepaliveInterval`、`transport.heartbeatInterval`、`transport.heartbeatTimeout`。
- **传输（tcp/websocket/wss）**：`transport.proxyURL`、`transport.connectServerLocalIP`。
- **QUIC（quic）**：`transport.quic.keepalivePeriod`、`transport.quic.maxIdleTimeout`、`transport.quic.maxIncomingStreams`。
- **TLS**：`transport.tls.certFile`、`transport.tls.keyFile`、`transport.tls.trustedCaFile`、`transport.tls.serverName`、`transport.tls.disableCustomTLSFirstByte`。
- **本机管理**：`webServer.user`、`webServer.password`、`webServer.assetsDir`、`webServer.pprofEnable`、`webServer.tls.certFile`、`webServer.tls.keyFile`、`webServer.tls.trustedCaFile`、`webServer.tls.serverName`。
- **传输协议**：`transport.protocol.tcp`、`transport.protocol.kcp`、`transport.protocol.quic`、`transport.protocol.websocket`、`transport.protocol.wss`。
- **认证方式**：`auth.method.token`、`auth.method.oidc`。

### 隧道、访问者与插件

- **基础隧道**：`name`、`type`、`enabled`、`transport.useEncryption`、`transport.useCompression`。
- **本地后端（provider）**：`localIP`、`localPort`。
- **远程端口（provider；tcp/udp）**：`remotePort`。
- **访问者（visitor；stcp/sudp/xtcp）**：`serverName`、`serverUser`、`bindAddr`、`bindPort`。
- **私有隧道（stcp/sudp/xtcp）**：`secretKey`。
- **访问权限（provider；stcp/sudp/xtcp）**：`allowUsers`。
- **域名（provider；http/https/tcpmux）**：`customDomains`、`subdomain`。
- **元数据（provider）**：`metadatas`。
- **注解（provider）**：`annotations`。
- **代理传输（provider）**：`transport.bandwidthLimit`、`transport.bandwidthLimitMode`、`transport.proxyProtocolVersion`。
- **负载均衡（provider；tcp/http/https/tcpmux）**：`loadBalancer.group`、`loadBalancer.groupKey`。
- **健康检查（provider）**：`healthCheck.type`、`healthCheck.timeoutSeconds`、`healthCheck.maxFailed`、`healthCheck.intervalSeconds`、`healthCheck.path`、`healthCheck.httpHeaders`。
- **HTTP（provider；http/tcpmux）**：`httpUser`、`httpPassword`、`routeByHTTPUser`。
- **HTTP（provider；http）**：`locations`、`hostHeaderRewrite`、`requestHeaders.set`。
- **HTTP 响应头（provider；http）**：`responseHeaders.set`。
- **TCPMUX（provider；tcpmux）**：`multiplexer`。
- **XTCP（visitor；xtcp）**：`protocol`、`keepTunnelOpen`、`maxRetriesAnHour`、`minRetryInterval`、`fallbackTo`、`fallbackTimeoutMs`。
- **NAT 穿透（xtcp）**：`natTraversal.disableAssistedAddrs`。
- **隧道协议**：`type.tcp`、`type.udp`、`type.http`、`type.https`、`type.stcp`、`type.sudp`、`type.xtcp`、`type.tcpmux`。
- **插件（provider；tcp/stcp/xtcp/http/https/tcpmux）**：`plugin.type`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https）**：`plugin.type.http2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2http）**：`plugin.type.http2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http）**：`plugin.type.https2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2https）**：`plugin.type.https2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy）**：`plugin.type.http_proxy`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.type.socks5`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.type.static_file`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.type.unix_domain_socket`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 tls2raw）**：`plugin.type.tls2raw`。
- **插件目标（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https/tls2raw）**：`plugin.localAddr`。
- **插件 HTTP（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https）**：`plugin.hostHeaderRewrite`、`plugin.requestHeaders.set`。
- **插件 HTTP/2（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https）**：`plugin.enableHTTP2`。
- **插件 TLS（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https/tls2raw）**：`plugin.crtPath`、`plugin.keyPath`。
- **插件认证（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy/static_file）**：`plugin.httpUser`、`plugin.httpPassword`。
- **SOCKS5（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.username`、`plugin.password`。
- **静态文件（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.localPath`、`plugin.stripPrefix`。
- **Unix socket（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.unixPath`。

### 配置默认值

以下按新建配置上下文列出；TCP 复用、所属用户、TLS 服务名等联动值会随表单上下文更新。类型选项不是独立字段，不重复列默认值。应用接管项同时说明官方默认和应用实际策略。

| 范围 | 配置键 | 默认值 | 说明 |
| --- | --- | --- | --- |
| 连接 | `serverAddr` | `0.0.0.0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `serverPort` | `7000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.token` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.protocol` | `tcp` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.enable` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.addr` | `127.0.0.1` | 应用固定绑定本机地址，与官方默认相同 |
| 连接 | `webServer.port` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `loginFailExit` | `false` | 应用固定为 false，以持续监督登录重试；官方默认 true |
| 连接 | `log.to` | `console` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.level` | `info` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.disablePrintColor` | `true` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `natHoleStunServer` | `stun.easyvoip.com:3478` | 0.52.0 没有 STUN 回退；从 0.52.1 起默认使用官方 STUN 地址 |
| 连接 | `dnsServer` | `空值` | 空值使用操作系统 DNS，没有固定默认 IP |
| 连接 | `udpPacketSize` | `1500` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.method` | `token` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.additionalScopes` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.clientID` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.clientSecret` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.audience` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.scope` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.tokenEndpointURL` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.additionalEndpointParams` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.insecureSkipVerify` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.proxyURL` | `空值` | 默认空。未设置 OIDC CA/跳过验证/专用代理时使用默认 HTTP 客户端（可读取环境代理）；设置自定义 TLS 后，空 proxyURL 明确禁用代理 |
| 连接 | `auth.tokenSource` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.tokenSource.type` | `file` | 来源默认未启用；显式启用时应用仅提供 file 类型 |
| 连接 | `auth.tokenSource.file.path` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `transport.dialServerTimeout` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerKeepalive` | `7200` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.poolCount` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMux` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMuxKeepaliveInterval` | `30` | 0.58.1 起默认 30 秒；此前为 60 秒 |
| 连接 | `transport.heartbeatInterval` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.heartbeatTimeout` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.proxyURL` | `由环境决定` | 默认读取 frpc 进程的 http_proxy 环境变量；前端无法确定其值 |
| 连接 | `transport.connectServerLocalIP` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.keepalivePeriod` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIdleTimeout` | `30` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIncomingStreams` | `100000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.trustedCaFile` | `空值` | 默认无 CA 文件；frpc 的 TLS 客户端此时跳过服务端证书验证，指定 CA 后启用验证 |
| 连接 | `transport.tls.serverName` | `由上下文决定` | 留空时 TLS SNI 使用当前 serverAddr；显示回退值不会保存覆盖 |
| 连接 | `transport.tls.disableCustomTLSFirstByte` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.assetsDir` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.pprofEnable` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.serverName` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `name` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `type` | `tcp` | 官方 type 必填且没有默认；应用新建隧道预设 TCP |
| 隧道 | `enabled` | `true` | 应用默认启用，并在生成时过滤停用隧道；原生 enabled 字段从 0.66 才提供 |
| 隧道 | `transport.useEncryption` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.useCompression` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localIP` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localPort` | `无默认` | localPort 没有有效官方默认，启用普通后端时必须填正值；8080 是应用新建预设 |
| 隧道 | `remotePort` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `serverName` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `serverUser` | `空值` | 留空时使用当前连接的 user，不固定用户名或写回命名前缀 |
| 隧道 | `bindAddr` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `bindPort` | `无默认` | bindPort 默认零值无效，必须明确填写正值；STCP/XTCP 的 -1 是可选重定向设置 |
| 隧道 | `secretKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `allowUsers` | `[]` | 空列表仅允许当前 provider 的用户；不等于允许所有用户 |
| 隧道 | `customDomains` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `subdomain` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `annotations` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.bandwidthLimit` | `空值` | 空值或 0KB/0MB 不限速；不填写具体带宽上限 |
| 隧道 | `transport.bandwidthLimitMode` | `client` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.proxyProtocolVersion` | `空值` | 空值不生成 PROXY 协议头，不是自动选择版本 |
| 隧道 | `loadBalancer.group` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `loadBalancer.groupKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.type` | `空值` | 默认不启用健康检查；展示数值默认不会创建或启用 healthCheck |
| 隧道 | `healthCheck.timeoutSeconds` | `3` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.maxFailed` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.intervalSeconds` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.path` | `无默认` | HTTP 健康检查必须明确填写路径，没有有效官方默认；健康检查关闭时此字段不生效 |
| 隧道 | `healthCheck.httpHeaders` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `routeByHTTPUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `locations` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `responseHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `multiplexer` | `httpconnect` | 官方没有默认，TCPMUX 必须明确指定 httpconnect；应用生成时提供唯一合法预设 |
| 隧道 | `protocol` | `quic` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `keepTunnelOpen` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `maxRetriesAnHour` | `8` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `minRetryInterval` | `90` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTo` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTimeoutMs` | `1000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `natTraversal.disableAssistedAddrs` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.type` | `空值` | 默认不启用插件；展示插件字段默认不会创建或启用 plugin |
| 隧道 | `plugin.localAddr` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.enableHTTP2` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.crtPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.keyPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.username` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.localPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.stripPrefix` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.unixPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |

</details>

<details>
<summary>frpc 0.66.0 · 140 项配置键与类型选项</summary>

[官方发布](https://github.com/fatedier/frp/releases/tag/v0.66.0)。已审核的版本配置清单。

### 服务器连接

- **基础连接**：`serverAddr`、`serverPort`、`user`、`auth.token`、`transport.protocol`、`transport.tls.enable`、`webServer.addr`、`webServer.port`、`loginFailExit`、`log.to`、`log.level`、`log.disablePrintColor`。
- **连接高级**：`natHoleStunServer`、`dnsServer`、`udpPacketSize`、`metadatas`。
- **认证**：`auth.method`、`auth.additionalScopes`。
- **认证（认证 oidc）**：`auth.oidc.clientID`、`auth.oidc.clientSecret`、`auth.oidc.audience`、`auth.oidc.scope`、`auth.oidc.tokenEndpointURL`、`auth.oidc.additionalEndpointParams`。
- **OIDC TLS 与代理（认证 oidc）**：`auth.oidc.trustedCaFile`、`auth.oidc.insecureSkipVerify`、`auth.oidc.proxyURL`。
- **Token 文件来源（认证 token）**：`auth.tokenSource`、`auth.tokenSource.type`、`auth.tokenSource.file.path`。
- **OIDC 文件来源（认证 oidc）**：`auth.oidc.tokenSource`、`auth.oidc.tokenSource.type`、`auth.oidc.tokenSource.file.path`。
- **传输**：`transport.dialServerTimeout`、`transport.dialServerKeepalive`、`transport.poolCount`、`transport.tcpMux`、`transport.tcpMuxKeepaliveInterval`、`transport.heartbeatInterval`、`transport.heartbeatTimeout`。
- **传输（tcp/websocket/wss）**：`transport.proxyURL`、`transport.connectServerLocalIP`。
- **QUIC（quic）**：`transport.quic.keepalivePeriod`、`transport.quic.maxIdleTimeout`、`transport.quic.maxIncomingStreams`。
- **TLS**：`transport.tls.certFile`、`transport.tls.keyFile`、`transport.tls.trustedCaFile`、`transport.tls.serverName`、`transport.tls.disableCustomTLSFirstByte`。
- **本机管理**：`webServer.user`、`webServer.password`、`webServer.assetsDir`、`webServer.pprofEnable`、`webServer.tls.certFile`、`webServer.tls.keyFile`、`webServer.tls.trustedCaFile`、`webServer.tls.serverName`。
- **传输协议**：`transport.protocol.tcp`、`transport.protocol.kcp`、`transport.protocol.quic`、`transport.protocol.websocket`、`transport.protocol.wss`。
- **认证方式**：`auth.method.token`、`auth.method.oidc`。

### 隧道、访问者与插件

- **基础隧道**：`name`、`type`、`enabled`、`transport.useEncryption`、`transport.useCompression`。
- **本地后端（provider）**：`localIP`、`localPort`。
- **远程端口（provider；tcp/udp）**：`remotePort`。
- **访问者（visitor；stcp/sudp/xtcp）**：`serverName`、`serverUser`、`bindAddr`、`bindPort`。
- **私有隧道（stcp/sudp/xtcp）**：`secretKey`。
- **访问权限（provider；stcp/sudp/xtcp）**：`allowUsers`。
- **域名（provider；http/https/tcpmux）**：`customDomains`、`subdomain`。
- **元数据（provider）**：`metadatas`。
- **注解（provider）**：`annotations`。
- **代理传输（provider）**：`transport.bandwidthLimit`、`transport.bandwidthLimitMode`、`transport.proxyProtocolVersion`。
- **负载均衡（provider；tcp/http/https/tcpmux）**：`loadBalancer.group`、`loadBalancer.groupKey`。
- **健康检查（provider）**：`healthCheck.type`、`healthCheck.timeoutSeconds`、`healthCheck.maxFailed`、`healthCheck.intervalSeconds`、`healthCheck.path`、`healthCheck.httpHeaders`。
- **HTTP（provider；http/tcpmux）**：`httpUser`、`httpPassword`、`routeByHTTPUser`。
- **HTTP（provider；http）**：`locations`、`hostHeaderRewrite`、`requestHeaders.set`。
- **HTTP 响应头（provider；http）**：`responseHeaders.set`。
- **TCPMUX（provider；tcpmux）**：`multiplexer`。
- **XTCP（visitor；xtcp）**：`protocol`、`keepTunnelOpen`、`maxRetriesAnHour`、`minRetryInterval`、`fallbackTo`、`fallbackTimeoutMs`。
- **NAT 穿透（xtcp）**：`natTraversal.disableAssistedAddrs`。
- **隧道协议**：`type.tcp`、`type.udp`、`type.http`、`type.https`、`type.stcp`、`type.sudp`、`type.xtcp`、`type.tcpmux`。
- **插件（provider；tcp/stcp/xtcp/http/https/tcpmux）**：`plugin.type`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https）**：`plugin.type.http2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2http）**：`plugin.type.http2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http）**：`plugin.type.https2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2https）**：`plugin.type.https2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy）**：`plugin.type.http_proxy`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.type.socks5`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.type.static_file`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.type.unix_domain_socket`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 tls2raw）**：`plugin.type.tls2raw`。
- **插件目标（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https/tls2raw）**：`plugin.localAddr`。
- **插件 HTTP（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https）**：`plugin.hostHeaderRewrite`、`plugin.requestHeaders.set`。
- **插件 HTTP/2（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https）**：`plugin.enableHTTP2`。
- **插件 TLS（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https/tls2raw）**：`plugin.crtPath`、`plugin.keyPath`。
- **插件认证（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy/static_file）**：`plugin.httpUser`、`plugin.httpPassword`。
- **SOCKS5（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.username`、`plugin.password`。
- **静态文件（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.localPath`、`plugin.stripPrefix`。
- **Unix socket（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.unixPath`。

### 配置默认值

以下按新建配置上下文列出；TCP 复用、所属用户、TLS 服务名等联动值会随表单上下文更新。类型选项不是独立字段，不重复列默认值。应用接管项同时说明官方默认和应用实际策略。

| 范围 | 配置键 | 默认值 | 说明 |
| --- | --- | --- | --- |
| 连接 | `serverAddr` | `0.0.0.0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `serverPort` | `7000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.token` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.protocol` | `tcp` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.enable` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.addr` | `127.0.0.1` | 应用固定绑定本机地址，与官方默认相同 |
| 连接 | `webServer.port` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `loginFailExit` | `false` | 应用固定为 false，以持续监督登录重试；官方默认 true |
| 连接 | `log.to` | `console` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.level` | `info` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.disablePrintColor` | `true` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `natHoleStunServer` | `stun.easyvoip.com:3478` | 0.52.0 没有 STUN 回退；从 0.52.1 起默认使用官方 STUN 地址 |
| 连接 | `dnsServer` | `空值` | 空值使用操作系统 DNS，没有固定默认 IP |
| 连接 | `udpPacketSize` | `1500` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.method` | `token` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.additionalScopes` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.clientID` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.clientSecret` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.audience` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.scope` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.tokenEndpointURL` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.additionalEndpointParams` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.insecureSkipVerify` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.proxyURL` | `空值` | 默认空。未设置 OIDC CA/跳过验证/专用代理时使用默认 HTTP 客户端（可读取环境代理）；设置自定义 TLS 后，空 proxyURL 明确禁用代理 |
| 连接 | `auth.tokenSource` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.tokenSource.type` | `file` | 来源默认未启用；显式启用时应用仅提供 file 类型 |
| 连接 | `auth.tokenSource.file.path` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.tokenSource` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.tokenSource.type` | `file` | 来源默认未启用；显式启用时应用仅提供 file 类型 |
| 连接 | `auth.oidc.tokenSource.file.path` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `transport.dialServerTimeout` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerKeepalive` | `7200` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.poolCount` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMux` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMuxKeepaliveInterval` | `30` | 0.58.1 起默认 30 秒；此前为 60 秒 |
| 连接 | `transport.heartbeatInterval` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.heartbeatTimeout` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.proxyURL` | `由环境决定` | 默认读取 frpc 进程的 http_proxy 环境变量；前端无法确定其值 |
| 连接 | `transport.connectServerLocalIP` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.keepalivePeriod` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIdleTimeout` | `30` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIncomingStreams` | `100000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.trustedCaFile` | `空值` | 默认无 CA 文件；frpc 的 TLS 客户端此时跳过服务端证书验证，指定 CA 后启用验证 |
| 连接 | `transport.tls.serverName` | `由上下文决定` | 留空时 TLS SNI 使用当前 serverAddr；显示回退值不会保存覆盖 |
| 连接 | `transport.tls.disableCustomTLSFirstByte` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.assetsDir` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.pprofEnable` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.serverName` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `name` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `type` | `tcp` | 官方 type 必填且没有默认；应用新建隧道预设 TCP |
| 隧道 | `enabled` | `true` | 应用默认启用，并在生成时过滤停用隧道；原生 enabled 字段从 0.66 才提供 |
| 隧道 | `transport.useEncryption` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.useCompression` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localIP` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localPort` | `无默认` | localPort 没有有效官方默认，启用普通后端时必须填正值；8080 是应用新建预设 |
| 隧道 | `remotePort` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `serverName` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `serverUser` | `空值` | 留空时使用当前连接的 user，不固定用户名或写回命名前缀 |
| 隧道 | `bindAddr` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `bindPort` | `无默认` | bindPort 默认零值无效，必须明确填写正值；STCP/XTCP 的 -1 是可选重定向设置 |
| 隧道 | `secretKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `allowUsers` | `[]` | 空列表仅允许当前 provider 的用户；不等于允许所有用户 |
| 隧道 | `customDomains` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `subdomain` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `annotations` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.bandwidthLimit` | `空值` | 空值或 0KB/0MB 不限速；不填写具体带宽上限 |
| 隧道 | `transport.bandwidthLimitMode` | `client` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.proxyProtocolVersion` | `空值` | 空值不生成 PROXY 协议头，不是自动选择版本 |
| 隧道 | `loadBalancer.group` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `loadBalancer.groupKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.type` | `空值` | 默认不启用健康检查；展示数值默认不会创建或启用 healthCheck |
| 隧道 | `healthCheck.timeoutSeconds` | `3` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.maxFailed` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.intervalSeconds` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.path` | `无默认` | HTTP 健康检查必须明确填写路径，没有有效官方默认；健康检查关闭时此字段不生效 |
| 隧道 | `healthCheck.httpHeaders` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `routeByHTTPUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `locations` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `responseHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `multiplexer` | `httpconnect` | 官方没有默认，TCPMUX 必须明确指定 httpconnect；应用生成时提供唯一合法预设 |
| 隧道 | `protocol` | `quic` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `keepTunnelOpen` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `maxRetriesAnHour` | `8` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `minRetryInterval` | `90` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTo` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTimeoutMs` | `1000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `natTraversal.disableAssistedAddrs` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.type` | `空值` | 默认不启用插件；展示插件字段默认不会创建或启用 plugin |
| 隧道 | `plugin.localAddr` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.enableHTTP2` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.crtPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.keyPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.username` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.localPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.stripPrefix` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.unixPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |

</details>

<details>
<summary>frpc 0.67.0 · 141 项配置键与类型选项</summary>

[官方发布](https://github.com/fatedier/frp/releases/tag/v0.67.0)。已审核的版本配置清单。

### 服务器连接

- **基础连接**：`serverAddr`、`serverPort`、`user`、`auth.token`、`transport.protocol`、`transport.tls.enable`、`webServer.addr`、`webServer.port`、`loginFailExit`、`log.to`、`log.level`、`log.disablePrintColor`。
- **连接高级**：`natHoleStunServer`、`dnsServer`、`udpPacketSize`、`metadatas`。
- **连接身份**：`clientID`。
- **认证**：`auth.method`、`auth.additionalScopes`。
- **认证（认证 oidc）**：`auth.oidc.clientID`、`auth.oidc.clientSecret`、`auth.oidc.audience`、`auth.oidc.scope`、`auth.oidc.tokenEndpointURL`、`auth.oidc.additionalEndpointParams`。
- **OIDC TLS 与代理（认证 oidc）**：`auth.oidc.trustedCaFile`、`auth.oidc.insecureSkipVerify`、`auth.oidc.proxyURL`。
- **Token 文件来源（认证 token）**：`auth.tokenSource`、`auth.tokenSource.type`、`auth.tokenSource.file.path`。
- **OIDC 文件来源（认证 oidc）**：`auth.oidc.tokenSource`、`auth.oidc.tokenSource.type`、`auth.oidc.tokenSource.file.path`。
- **传输**：`transport.dialServerTimeout`、`transport.dialServerKeepalive`、`transport.poolCount`、`transport.tcpMux`、`transport.tcpMuxKeepaliveInterval`、`transport.heartbeatInterval`、`transport.heartbeatTimeout`。
- **传输（tcp/websocket/wss）**：`transport.proxyURL`、`transport.connectServerLocalIP`。
- **QUIC（quic）**：`transport.quic.keepalivePeriod`、`transport.quic.maxIdleTimeout`、`transport.quic.maxIncomingStreams`。
- **TLS**：`transport.tls.certFile`、`transport.tls.keyFile`、`transport.tls.trustedCaFile`、`transport.tls.serverName`、`transport.tls.disableCustomTLSFirstByte`。
- **本机管理**：`webServer.user`、`webServer.password`、`webServer.assetsDir`、`webServer.pprofEnable`、`webServer.tls.certFile`、`webServer.tls.keyFile`、`webServer.tls.trustedCaFile`、`webServer.tls.serverName`。
- **传输协议**：`transport.protocol.tcp`、`transport.protocol.kcp`、`transport.protocol.quic`、`transport.protocol.websocket`、`transport.protocol.wss`。
- **认证方式**：`auth.method.token`、`auth.method.oidc`。

### 隧道、访问者与插件

- **基础隧道**：`name`、`type`、`enabled`、`transport.useEncryption`、`transport.useCompression`。
- **本地后端（provider）**：`localIP`、`localPort`。
- **远程端口（provider；tcp/udp）**：`remotePort`。
- **访问者（visitor；stcp/sudp/xtcp）**：`serverName`、`serverUser`、`bindAddr`、`bindPort`。
- **私有隧道（stcp/sudp/xtcp）**：`secretKey`。
- **访问权限（provider；stcp/sudp/xtcp）**：`allowUsers`。
- **域名（provider；http/https/tcpmux）**：`customDomains`、`subdomain`。
- **元数据（provider）**：`metadatas`。
- **注解（provider）**：`annotations`。
- **代理传输（provider）**：`transport.bandwidthLimit`、`transport.bandwidthLimitMode`、`transport.proxyProtocolVersion`。
- **负载均衡（provider；tcp/http/https/tcpmux）**：`loadBalancer.group`、`loadBalancer.groupKey`。
- **健康检查（provider）**：`healthCheck.type`、`healthCheck.timeoutSeconds`、`healthCheck.maxFailed`、`healthCheck.intervalSeconds`、`healthCheck.path`、`healthCheck.httpHeaders`。
- **HTTP（provider；http/tcpmux）**：`httpUser`、`httpPassword`、`routeByHTTPUser`。
- **HTTP（provider；http）**：`locations`、`hostHeaderRewrite`、`requestHeaders.set`。
- **HTTP 响应头（provider；http）**：`responseHeaders.set`。
- **TCPMUX（provider；tcpmux）**：`multiplexer`。
- **XTCP（visitor；xtcp）**：`protocol`、`keepTunnelOpen`、`maxRetriesAnHour`、`minRetryInterval`、`fallbackTo`、`fallbackTimeoutMs`。
- **NAT 穿透（xtcp）**：`natTraversal.disableAssistedAddrs`。
- **隧道协议**：`type.tcp`、`type.udp`、`type.http`、`type.https`、`type.stcp`、`type.sudp`、`type.xtcp`、`type.tcpmux`。
- **插件（provider；tcp/stcp/xtcp/http/https/tcpmux）**：`plugin.type`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https）**：`plugin.type.http2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2http）**：`plugin.type.http2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http）**：`plugin.type.https2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2https）**：`plugin.type.https2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy）**：`plugin.type.http_proxy`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.type.socks5`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.type.static_file`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.type.unix_domain_socket`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 tls2raw）**：`plugin.type.tls2raw`。
- **插件目标（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https/tls2raw）**：`plugin.localAddr`。
- **插件 HTTP（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https）**：`plugin.hostHeaderRewrite`、`plugin.requestHeaders.set`。
- **插件 HTTP/2（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https）**：`plugin.enableHTTP2`。
- **插件 TLS（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https/tls2raw）**：`plugin.crtPath`、`plugin.keyPath`。
- **插件认证（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy/static_file）**：`plugin.httpUser`、`plugin.httpPassword`。
- **SOCKS5（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.username`、`plugin.password`。
- **静态文件（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.localPath`、`plugin.stripPrefix`。
- **Unix socket（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.unixPath`。

### 配置默认值

以下按新建配置上下文列出；TCP 复用、所属用户、TLS 服务名等联动值会随表单上下文更新。类型选项不是独立字段，不重复列默认值。应用接管项同时说明官方默认和应用实际策略。

| 范围 | 配置键 | 默认值 | 说明 |
| --- | --- | --- | --- |
| 连接 | `serverAddr` | `0.0.0.0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `serverPort` | `7000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.token` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.protocol` | `tcp` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.enable` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.addr` | `127.0.0.1` | 应用固定绑定本机地址，与官方默认相同 |
| 连接 | `webServer.port` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `loginFailExit` | `false` | 应用固定为 false，以持续监督登录重试；官方默认 true |
| 连接 | `log.to` | `console` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.level` | `info` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.disablePrintColor` | `true` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `natHoleStunServer` | `stun.easyvoip.com:3478` | 0.52.0 没有 STUN 回退；从 0.52.1 起默认使用官方 STUN 地址 |
| 连接 | `dnsServer` | `空值` | 空值使用操作系统 DNS，没有固定默认 IP |
| 连接 | `udpPacketSize` | `1500` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `clientID` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.method` | `token` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.additionalScopes` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.clientID` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.clientSecret` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.audience` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.scope` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.tokenEndpointURL` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.additionalEndpointParams` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.insecureSkipVerify` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.proxyURL` | `空值` | 默认空。未设置 OIDC CA/跳过验证/专用代理时使用默认 HTTP 客户端（可读取环境代理）；设置自定义 TLS 后，空 proxyURL 明确禁用代理 |
| 连接 | `auth.tokenSource` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.tokenSource.type` | `file` | 来源默认未启用；显式启用时应用仅提供 file 类型 |
| 连接 | `auth.tokenSource.file.path` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.tokenSource` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.tokenSource.type` | `file` | 来源默认未启用；显式启用时应用仅提供 file 类型 |
| 连接 | `auth.oidc.tokenSource.file.path` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `transport.dialServerTimeout` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerKeepalive` | `7200` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.poolCount` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMux` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMuxKeepaliveInterval` | `30` | 0.58.1 起默认 30 秒；此前为 60 秒 |
| 连接 | `transport.heartbeatInterval` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.heartbeatTimeout` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.proxyURL` | `由环境决定` | 默认读取 frpc 进程的 http_proxy 环境变量；前端无法确定其值 |
| 连接 | `transport.connectServerLocalIP` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.keepalivePeriod` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIdleTimeout` | `30` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIncomingStreams` | `100000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.trustedCaFile` | `空值` | 默认无 CA 文件；frpc 的 TLS 客户端此时跳过服务端证书验证，指定 CA 后启用验证 |
| 连接 | `transport.tls.serverName` | `由上下文决定` | 留空时 TLS SNI 使用当前 serverAddr；显示回退值不会保存覆盖 |
| 连接 | `transport.tls.disableCustomTLSFirstByte` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.assetsDir` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.pprofEnable` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.serverName` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `name` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `type` | `tcp` | 官方 type 必填且没有默认；应用新建隧道预设 TCP |
| 隧道 | `enabled` | `true` | 应用默认启用，并在生成时过滤停用隧道；原生 enabled 字段从 0.66 才提供 |
| 隧道 | `transport.useEncryption` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.useCompression` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localIP` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localPort` | `无默认` | localPort 没有有效官方默认，启用普通后端时必须填正值；8080 是应用新建预设 |
| 隧道 | `remotePort` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `serverName` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `serverUser` | `空值` | 留空时使用当前连接的 user，不固定用户名或写回命名前缀 |
| 隧道 | `bindAddr` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `bindPort` | `无默认` | bindPort 默认零值无效，必须明确填写正值；STCP/XTCP 的 -1 是可选重定向设置 |
| 隧道 | `secretKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `allowUsers` | `[]` | 空列表仅允许当前 provider 的用户；不等于允许所有用户 |
| 隧道 | `customDomains` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `subdomain` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `annotations` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.bandwidthLimit` | `空值` | 空值或 0KB/0MB 不限速；不填写具体带宽上限 |
| 隧道 | `transport.bandwidthLimitMode` | `client` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.proxyProtocolVersion` | `空值` | 空值不生成 PROXY 协议头，不是自动选择版本 |
| 隧道 | `loadBalancer.group` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `loadBalancer.groupKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.type` | `空值` | 默认不启用健康检查；展示数值默认不会创建或启用 healthCheck |
| 隧道 | `healthCheck.timeoutSeconds` | `3` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.maxFailed` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.intervalSeconds` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.path` | `无默认` | HTTP 健康检查必须明确填写路径，没有有效官方默认；健康检查关闭时此字段不生效 |
| 隧道 | `healthCheck.httpHeaders` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `routeByHTTPUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `locations` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `responseHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `multiplexer` | `httpconnect` | 官方没有默认，TCPMUX 必须明确指定 httpconnect；应用生成时提供唯一合法预设 |
| 隧道 | `protocol` | `quic` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `keepTunnelOpen` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `maxRetriesAnHour` | `8` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `minRetryInterval` | `90` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTo` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTimeoutMs` | `1000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `natTraversal.disableAssistedAddrs` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.type` | `空值` | 默认不启用插件；展示插件字段默认不会创建或启用 plugin |
| 隧道 | `plugin.localAddr` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.enableHTTP2` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.crtPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.keyPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.username` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.localPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.stripPrefix` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.unixPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |

</details>

<details>
<summary>frpc 0.68.0 · 141 项配置键与类型选项</summary>

[官方发布](https://github.com/fatedier/frp/releases/tag/v0.68.0)。已审核的版本配置清单。

### 服务器连接

- **基础连接**：`serverAddr`、`serverPort`、`user`、`auth.token`、`transport.protocol`、`transport.tls.enable`、`webServer.addr`、`webServer.port`、`loginFailExit`、`log.to`、`log.level`、`log.disablePrintColor`。
- **连接高级**：`natHoleStunServer`、`dnsServer`、`udpPacketSize`、`metadatas`。
- **连接身份**：`clientID`。
- **认证**：`auth.method`、`auth.additionalScopes`。
- **认证（认证 oidc）**：`auth.oidc.clientID`、`auth.oidc.clientSecret`、`auth.oidc.audience`、`auth.oidc.scope`、`auth.oidc.tokenEndpointURL`、`auth.oidc.additionalEndpointParams`。
- **OIDC TLS 与代理（认证 oidc）**：`auth.oidc.trustedCaFile`、`auth.oidc.insecureSkipVerify`、`auth.oidc.proxyURL`。
- **Token 文件来源（认证 token）**：`auth.tokenSource`、`auth.tokenSource.type`、`auth.tokenSource.file.path`。
- **OIDC 文件来源（认证 oidc）**：`auth.oidc.tokenSource`、`auth.oidc.tokenSource.type`、`auth.oidc.tokenSource.file.path`。
- **传输**：`transport.dialServerTimeout`、`transport.dialServerKeepalive`、`transport.poolCount`、`transport.tcpMux`、`transport.tcpMuxKeepaliveInterval`、`transport.heartbeatInterval`、`transport.heartbeatTimeout`。
- **传输（tcp/websocket/wss）**：`transport.proxyURL`、`transport.connectServerLocalIP`。
- **QUIC（quic）**：`transport.quic.keepalivePeriod`、`transport.quic.maxIdleTimeout`、`transport.quic.maxIncomingStreams`。
- **TLS**：`transport.tls.certFile`、`transport.tls.keyFile`、`transport.tls.trustedCaFile`、`transport.tls.serverName`、`transport.tls.disableCustomTLSFirstByte`。
- **本机管理**：`webServer.user`、`webServer.password`、`webServer.assetsDir`、`webServer.pprofEnable`、`webServer.tls.certFile`、`webServer.tls.keyFile`、`webServer.tls.trustedCaFile`、`webServer.tls.serverName`。
- **传输协议**：`transport.protocol.tcp`、`transport.protocol.kcp`、`transport.protocol.quic`、`transport.protocol.websocket`、`transport.protocol.wss`。
- **认证方式**：`auth.method.token`、`auth.method.oidc`。

### 隧道、访问者与插件

- **基础隧道**：`name`、`type`、`enabled`、`transport.useEncryption`、`transport.useCompression`。
- **本地后端（provider）**：`localIP`、`localPort`。
- **远程端口（provider；tcp/udp）**：`remotePort`。
- **访问者（visitor；stcp/sudp/xtcp）**：`serverName`、`serverUser`、`bindAddr`、`bindPort`。
- **私有隧道（stcp/sudp/xtcp）**：`secretKey`。
- **访问权限（provider；stcp/sudp/xtcp）**：`allowUsers`。
- **域名（provider；http/https/tcpmux）**：`customDomains`、`subdomain`。
- **元数据（provider）**：`metadatas`。
- **注解（provider）**：`annotations`。
- **代理传输（provider）**：`transport.bandwidthLimit`、`transport.bandwidthLimitMode`、`transport.proxyProtocolVersion`。
- **负载均衡（provider；tcp/http/https/tcpmux）**：`loadBalancer.group`、`loadBalancer.groupKey`。
- **健康检查（provider）**：`healthCheck.type`、`healthCheck.timeoutSeconds`、`healthCheck.maxFailed`、`healthCheck.intervalSeconds`、`healthCheck.path`、`healthCheck.httpHeaders`。
- **HTTP（provider；http/tcpmux）**：`httpUser`、`httpPassword`、`routeByHTTPUser`。
- **HTTP（provider；http）**：`locations`、`hostHeaderRewrite`、`requestHeaders.set`。
- **HTTP 响应头（provider；http）**：`responseHeaders.set`。
- **TCPMUX（provider；tcpmux）**：`multiplexer`。
- **XTCP（visitor；xtcp）**：`protocol`、`keepTunnelOpen`、`maxRetriesAnHour`、`minRetryInterval`、`fallbackTo`、`fallbackTimeoutMs`。
- **NAT 穿透（xtcp）**：`natTraversal.disableAssistedAddrs`。
- **隧道协议**：`type.tcp`、`type.udp`、`type.http`、`type.https`、`type.stcp`、`type.sudp`、`type.xtcp`、`type.tcpmux`。
- **插件（provider；tcp/stcp/xtcp/http/https/tcpmux）**：`plugin.type`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https）**：`plugin.type.http2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2http）**：`plugin.type.http2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http）**：`plugin.type.https2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2https）**：`plugin.type.https2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy）**：`plugin.type.http_proxy`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.type.socks5`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.type.static_file`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.type.unix_domain_socket`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 tls2raw）**：`plugin.type.tls2raw`。
- **插件目标（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https/tls2raw）**：`plugin.localAddr`。
- **插件 HTTP（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https）**：`plugin.hostHeaderRewrite`、`plugin.requestHeaders.set`。
- **插件 HTTP/2（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https）**：`plugin.enableHTTP2`。
- **插件 TLS（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https/tls2raw）**：`plugin.crtPath`、`plugin.keyPath`。
- **插件认证（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy/static_file）**：`plugin.httpUser`、`plugin.httpPassword`。
- **SOCKS5（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.username`、`plugin.password`。
- **静态文件（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.localPath`、`plugin.stripPrefix`。
- **Unix socket（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.unixPath`。

### 配置默认值

以下按新建配置上下文列出；TCP 复用、所属用户、TLS 服务名等联动值会随表单上下文更新。类型选项不是独立字段，不重复列默认值。应用接管项同时说明官方默认和应用实际策略。

| 范围 | 配置键 | 默认值 | 说明 |
| --- | --- | --- | --- |
| 连接 | `serverAddr` | `0.0.0.0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `serverPort` | `7000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.token` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.protocol` | `tcp` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.enable` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.addr` | `127.0.0.1` | 应用固定绑定本机地址，与官方默认相同 |
| 连接 | `webServer.port` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `loginFailExit` | `false` | 应用固定为 false，以持续监督登录重试；官方默认 true |
| 连接 | `log.to` | `console` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.level` | `info` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.disablePrintColor` | `true` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `natHoleStunServer` | `stun.easyvoip.com:3478` | 0.52.0 没有 STUN 回退；从 0.52.1 起默认使用官方 STUN 地址 |
| 连接 | `dnsServer` | `空值` | 空值使用操作系统 DNS，没有固定默认 IP |
| 连接 | `udpPacketSize` | `1500` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `clientID` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.method` | `token` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.additionalScopes` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.clientID` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.clientSecret` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.audience` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.scope` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.tokenEndpointURL` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.additionalEndpointParams` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.insecureSkipVerify` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.proxyURL` | `空值` | 默认空。未设置 OIDC CA/跳过验证/专用代理时使用默认 HTTP 客户端（可读取环境代理）；设置自定义 TLS 后，空 proxyURL 明确禁用代理 |
| 连接 | `auth.tokenSource` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.tokenSource.type` | `file` | 来源默认未启用；显式启用时应用仅提供 file 类型 |
| 连接 | `auth.tokenSource.file.path` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.tokenSource` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.tokenSource.type` | `file` | 来源默认未启用；显式启用时应用仅提供 file 类型 |
| 连接 | `auth.oidc.tokenSource.file.path` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `transport.dialServerTimeout` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerKeepalive` | `7200` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.poolCount` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMux` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMuxKeepaliveInterval` | `30` | 0.58.1 起默认 30 秒；此前为 60 秒 |
| 连接 | `transport.heartbeatInterval` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.heartbeatTimeout` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.proxyURL` | `由环境决定` | 默认读取 frpc 进程的 http_proxy 环境变量；前端无法确定其值 |
| 连接 | `transport.connectServerLocalIP` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.keepalivePeriod` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIdleTimeout` | `30` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIncomingStreams` | `100000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.trustedCaFile` | `空值` | 默认无 CA 文件；frpc 的 TLS 客户端此时跳过服务端证书验证，指定 CA 后启用验证 |
| 连接 | `transport.tls.serverName` | `由上下文决定` | 留空时 TLS SNI 使用当前 serverAddr；显示回退值不会保存覆盖 |
| 连接 | `transport.tls.disableCustomTLSFirstByte` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.assetsDir` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.pprofEnable` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.serverName` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `name` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `type` | `tcp` | 官方 type 必填且没有默认；应用新建隧道预设 TCP |
| 隧道 | `enabled` | `true` | 应用默认启用，并在生成时过滤停用隧道；原生 enabled 字段从 0.66 才提供 |
| 隧道 | `transport.useEncryption` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.useCompression` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localIP` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localPort` | `无默认` | localPort 没有有效官方默认，启用普通后端时必须填正值；8080 是应用新建预设 |
| 隧道 | `remotePort` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `serverName` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `serverUser` | `空值` | 留空时使用当前连接的 user，不固定用户名或写回命名前缀 |
| 隧道 | `bindAddr` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `bindPort` | `无默认` | bindPort 默认零值无效，必须明确填写正值；STCP/XTCP 的 -1 是可选重定向设置 |
| 隧道 | `secretKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `allowUsers` | `[]` | 空列表仅允许当前 provider 的用户；不等于允许所有用户 |
| 隧道 | `customDomains` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `subdomain` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `annotations` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.bandwidthLimit` | `空值` | 空值或 0KB/0MB 不限速；不填写具体带宽上限 |
| 隧道 | `transport.bandwidthLimitMode` | `client` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.proxyProtocolVersion` | `空值` | 空值不生成 PROXY 协议头，不是自动选择版本 |
| 隧道 | `loadBalancer.group` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `loadBalancer.groupKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.type` | `空值` | 默认不启用健康检查；展示数值默认不会创建或启用 healthCheck |
| 隧道 | `healthCheck.timeoutSeconds` | `3` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.maxFailed` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.intervalSeconds` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.path` | `无默认` | HTTP 健康检查必须明确填写路径，没有有效官方默认；健康检查关闭时此字段不生效 |
| 隧道 | `healthCheck.httpHeaders` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `routeByHTTPUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `locations` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `responseHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `multiplexer` | `httpconnect` | 官方没有默认，TCPMUX 必须明确指定 httpconnect；应用生成时提供唯一合法预设 |
| 隧道 | `protocol` | `quic` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `keepTunnelOpen` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `maxRetriesAnHour` | `8` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `minRetryInterval` | `90` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTo` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTimeoutMs` | `1000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `natTraversal.disableAssistedAddrs` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.type` | `空值` | 默认不启用插件；展示插件字段默认不会创建或启用 plugin |
| 隧道 | `plugin.localAddr` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.enableHTTP2` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.crtPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.keyPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.username` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.localPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.stripPrefix` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.unixPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |

</details>

<details>
<summary>frpc 0.68.1 · 141 项配置键与类型选项</summary>

[官方发布](https://github.com/fatedier/frp/releases/tag/v0.68.1)。补丁版本继承同一 minor 清单，运行前仍由 frpc verify 校验。

### 服务器连接

- **基础连接**：`serverAddr`、`serverPort`、`user`、`auth.token`、`transport.protocol`、`transport.tls.enable`、`webServer.addr`、`webServer.port`、`loginFailExit`、`log.to`、`log.level`、`log.disablePrintColor`。
- **连接高级**：`natHoleStunServer`、`dnsServer`、`udpPacketSize`、`metadatas`。
- **连接身份**：`clientID`。
- **认证**：`auth.method`、`auth.additionalScopes`。
- **认证（认证 oidc）**：`auth.oidc.clientID`、`auth.oidc.clientSecret`、`auth.oidc.audience`、`auth.oidc.scope`、`auth.oidc.tokenEndpointURL`、`auth.oidc.additionalEndpointParams`。
- **OIDC TLS 与代理（认证 oidc）**：`auth.oidc.trustedCaFile`、`auth.oidc.insecureSkipVerify`、`auth.oidc.proxyURL`。
- **Token 文件来源（认证 token）**：`auth.tokenSource`、`auth.tokenSource.type`、`auth.tokenSource.file.path`。
- **OIDC 文件来源（认证 oidc）**：`auth.oidc.tokenSource`、`auth.oidc.tokenSource.type`、`auth.oidc.tokenSource.file.path`。
- **传输**：`transport.dialServerTimeout`、`transport.dialServerKeepalive`、`transport.poolCount`、`transport.tcpMux`、`transport.tcpMuxKeepaliveInterval`、`transport.heartbeatInterval`、`transport.heartbeatTimeout`。
- **传输（tcp/websocket/wss）**：`transport.proxyURL`、`transport.connectServerLocalIP`。
- **QUIC（quic）**：`transport.quic.keepalivePeriod`、`transport.quic.maxIdleTimeout`、`transport.quic.maxIncomingStreams`。
- **TLS**：`transport.tls.certFile`、`transport.tls.keyFile`、`transport.tls.trustedCaFile`、`transport.tls.serverName`、`transport.tls.disableCustomTLSFirstByte`。
- **本机管理**：`webServer.user`、`webServer.password`、`webServer.assetsDir`、`webServer.pprofEnable`、`webServer.tls.certFile`、`webServer.tls.keyFile`、`webServer.tls.trustedCaFile`、`webServer.tls.serverName`。
- **传输协议**：`transport.protocol.tcp`、`transport.protocol.kcp`、`transport.protocol.quic`、`transport.protocol.websocket`、`transport.protocol.wss`。
- **认证方式**：`auth.method.token`、`auth.method.oidc`。

### 隧道、访问者与插件

- **基础隧道**：`name`、`type`、`enabled`、`transport.useEncryption`、`transport.useCompression`。
- **本地后端（provider）**：`localIP`、`localPort`。
- **远程端口（provider；tcp/udp）**：`remotePort`。
- **访问者（visitor；stcp/sudp/xtcp）**：`serverName`、`serverUser`、`bindAddr`、`bindPort`。
- **私有隧道（stcp/sudp/xtcp）**：`secretKey`。
- **访问权限（provider；stcp/sudp/xtcp）**：`allowUsers`。
- **域名（provider；http/https/tcpmux）**：`customDomains`、`subdomain`。
- **元数据（provider）**：`metadatas`。
- **注解（provider）**：`annotations`。
- **代理传输（provider）**：`transport.bandwidthLimit`、`transport.bandwidthLimitMode`、`transport.proxyProtocolVersion`。
- **负载均衡（provider；tcp/http/https/tcpmux）**：`loadBalancer.group`、`loadBalancer.groupKey`。
- **健康检查（provider）**：`healthCheck.type`、`healthCheck.timeoutSeconds`、`healthCheck.maxFailed`、`healthCheck.intervalSeconds`、`healthCheck.path`、`healthCheck.httpHeaders`。
- **HTTP（provider；http/tcpmux）**：`httpUser`、`httpPassword`、`routeByHTTPUser`。
- **HTTP（provider；http）**：`locations`、`hostHeaderRewrite`、`requestHeaders.set`。
- **HTTP 响应头（provider；http）**：`responseHeaders.set`。
- **TCPMUX（provider；tcpmux）**：`multiplexer`。
- **XTCP（visitor；xtcp）**：`protocol`、`keepTunnelOpen`、`maxRetriesAnHour`、`minRetryInterval`、`fallbackTo`、`fallbackTimeoutMs`。
- **NAT 穿透（xtcp）**：`natTraversal.disableAssistedAddrs`。
- **隧道协议**：`type.tcp`、`type.udp`、`type.http`、`type.https`、`type.stcp`、`type.sudp`、`type.xtcp`、`type.tcpmux`。
- **插件（provider；tcp/stcp/xtcp/http/https/tcpmux）**：`plugin.type`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https）**：`plugin.type.http2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2http）**：`plugin.type.http2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http）**：`plugin.type.https2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2https）**：`plugin.type.https2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy）**：`plugin.type.http_proxy`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.type.socks5`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.type.static_file`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.type.unix_domain_socket`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 tls2raw）**：`plugin.type.tls2raw`。
- **插件目标（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https/tls2raw）**：`plugin.localAddr`。
- **插件 HTTP（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https）**：`plugin.hostHeaderRewrite`、`plugin.requestHeaders.set`。
- **插件 HTTP/2（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https）**：`plugin.enableHTTP2`。
- **插件 TLS（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https/tls2raw）**：`plugin.crtPath`、`plugin.keyPath`。
- **插件认证（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy/static_file）**：`plugin.httpUser`、`plugin.httpPassword`。
- **SOCKS5（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.username`、`plugin.password`。
- **静态文件（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.localPath`、`plugin.stripPrefix`。
- **Unix socket（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.unixPath`。

### 配置默认值

以下按新建配置上下文列出；TCP 复用、所属用户、TLS 服务名等联动值会随表单上下文更新。类型选项不是独立字段，不重复列默认值。应用接管项同时说明官方默认和应用实际策略。

| 范围 | 配置键 | 默认值 | 说明 |
| --- | --- | --- | --- |
| 连接 | `serverAddr` | `0.0.0.0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `serverPort` | `7000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.token` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.protocol` | `tcp` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.enable` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.addr` | `127.0.0.1` | 应用固定绑定本机地址，与官方默认相同 |
| 连接 | `webServer.port` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `loginFailExit` | `false` | 应用固定为 false，以持续监督登录重试；官方默认 true |
| 连接 | `log.to` | `console` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.level` | `info` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.disablePrintColor` | `true` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `natHoleStunServer` | `stun.easyvoip.com:3478` | 0.52.0 没有 STUN 回退；从 0.52.1 起默认使用官方 STUN 地址 |
| 连接 | `dnsServer` | `空值` | 空值使用操作系统 DNS，没有固定默认 IP |
| 连接 | `udpPacketSize` | `1500` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `clientID` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.method` | `token` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.additionalScopes` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.clientID` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.clientSecret` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.audience` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.scope` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.tokenEndpointURL` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.additionalEndpointParams` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.insecureSkipVerify` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.proxyURL` | `空值` | 默认空。未设置 OIDC CA/跳过验证/专用代理时使用默认 HTTP 客户端（可读取环境代理）；设置自定义 TLS 后，空 proxyURL 明确禁用代理 |
| 连接 | `auth.tokenSource` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.tokenSource.type` | `file` | 来源默认未启用；显式启用时应用仅提供 file 类型 |
| 连接 | `auth.tokenSource.file.path` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.tokenSource` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.tokenSource.type` | `file` | 来源默认未启用；显式启用时应用仅提供 file 类型 |
| 连接 | `auth.oidc.tokenSource.file.path` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `transport.dialServerTimeout` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerKeepalive` | `7200` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.poolCount` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMux` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMuxKeepaliveInterval` | `30` | 0.58.1 起默认 30 秒；此前为 60 秒 |
| 连接 | `transport.heartbeatInterval` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.heartbeatTimeout` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.proxyURL` | `由环境决定` | 默认读取 frpc 进程的 http_proxy 环境变量；前端无法确定其值 |
| 连接 | `transport.connectServerLocalIP` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.keepalivePeriod` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIdleTimeout` | `30` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIncomingStreams` | `100000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.trustedCaFile` | `空值` | 默认无 CA 文件；frpc 的 TLS 客户端此时跳过服务端证书验证，指定 CA 后启用验证 |
| 连接 | `transport.tls.serverName` | `由上下文决定` | 留空时 TLS SNI 使用当前 serverAddr；显示回退值不会保存覆盖 |
| 连接 | `transport.tls.disableCustomTLSFirstByte` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.assetsDir` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.pprofEnable` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.serverName` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `name` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `type` | `tcp` | 官方 type 必填且没有默认；应用新建隧道预设 TCP |
| 隧道 | `enabled` | `true` | 应用默认启用，并在生成时过滤停用隧道；原生 enabled 字段从 0.66 才提供 |
| 隧道 | `transport.useEncryption` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.useCompression` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localIP` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localPort` | `无默认` | localPort 没有有效官方默认，启用普通后端时必须填正值；8080 是应用新建预设 |
| 隧道 | `remotePort` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `serverName` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `serverUser` | `空值` | 留空时使用当前连接的 user，不固定用户名或写回命名前缀 |
| 隧道 | `bindAddr` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `bindPort` | `无默认` | bindPort 默认零值无效，必须明确填写正值；STCP/XTCP 的 -1 是可选重定向设置 |
| 隧道 | `secretKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `allowUsers` | `[]` | 空列表仅允许当前 provider 的用户；不等于允许所有用户 |
| 隧道 | `customDomains` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `subdomain` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `annotations` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.bandwidthLimit` | `空值` | 空值或 0KB/0MB 不限速；不填写具体带宽上限 |
| 隧道 | `transport.bandwidthLimitMode` | `client` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.proxyProtocolVersion` | `空值` | 空值不生成 PROXY 协议头，不是自动选择版本 |
| 隧道 | `loadBalancer.group` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `loadBalancer.groupKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.type` | `空值` | 默认不启用健康检查；展示数值默认不会创建或启用 healthCheck |
| 隧道 | `healthCheck.timeoutSeconds` | `3` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.maxFailed` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.intervalSeconds` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.path` | `无默认` | HTTP 健康检查必须明确填写路径，没有有效官方默认；健康检查关闭时此字段不生效 |
| 隧道 | `healthCheck.httpHeaders` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `routeByHTTPUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `locations` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `responseHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `multiplexer` | `httpconnect` | 官方没有默认，TCPMUX 必须明确指定 httpconnect；应用生成时提供唯一合法预设 |
| 隧道 | `protocol` | `quic` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `keepTunnelOpen` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `maxRetriesAnHour` | `8` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `minRetryInterval` | `90` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTo` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTimeoutMs` | `1000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `natTraversal.disableAssistedAddrs` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.type` | `空值` | 默认不启用插件；展示插件字段默认不会创建或启用 plugin |
| 隧道 | `plugin.localAddr` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.enableHTTP2` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.crtPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.keyPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.username` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.localPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.stripPrefix` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.unixPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |

</details>

<details>
<summary>frpc 0.69.0 · 142 项配置键与类型选项</summary>

[官方发布](https://github.com/fatedier/frp/releases/tag/v0.69.0)。已审核的版本配置清单。

### 服务器连接

- **基础连接**：`serverAddr`、`serverPort`、`user`、`auth.token`、`transport.protocol`、`transport.tls.enable`、`webServer.addr`、`webServer.port`、`loginFailExit`、`log.to`、`log.level`、`log.disablePrintColor`。
- **连接高级**：`natHoleStunServer`、`dnsServer`、`udpPacketSize`、`metadatas`。
- **连接身份**：`clientID`。
- **认证**：`auth.method`、`auth.additionalScopes`。
- **认证（认证 oidc）**：`auth.oidc.clientID`、`auth.oidc.clientSecret`、`auth.oidc.audience`、`auth.oidc.scope`、`auth.oidc.tokenEndpointURL`、`auth.oidc.additionalEndpointParams`。
- **OIDC TLS 与代理（认证 oidc）**：`auth.oidc.trustedCaFile`、`auth.oidc.insecureSkipVerify`、`auth.oidc.proxyURL`。
- **Token 文件来源（认证 token）**：`auth.tokenSource`、`auth.tokenSource.type`、`auth.tokenSource.file.path`。
- **OIDC 文件来源（认证 oidc）**：`auth.oidc.tokenSource`、`auth.oidc.tokenSource.type`、`auth.oidc.tokenSource.file.path`。
- **传输**：`transport.dialServerTimeout`、`transport.dialServerKeepalive`、`transport.poolCount`、`transport.tcpMux`、`transport.tcpMuxKeepaliveInterval`、`transport.heartbeatInterval`、`transport.heartbeatTimeout`。
- **传输（tcp/websocket/wss）**：`transport.proxyURL`、`transport.connectServerLocalIP`。
- **Wire 协议**：`transport.wireProtocol`。
- **QUIC（quic）**：`transport.quic.keepalivePeriod`、`transport.quic.maxIdleTimeout`、`transport.quic.maxIncomingStreams`。
- **TLS**：`transport.tls.certFile`、`transport.tls.keyFile`、`transport.tls.trustedCaFile`、`transport.tls.serverName`、`transport.tls.disableCustomTLSFirstByte`。
- **本机管理**：`webServer.user`、`webServer.password`、`webServer.assetsDir`、`webServer.pprofEnable`、`webServer.tls.certFile`、`webServer.tls.keyFile`、`webServer.tls.trustedCaFile`、`webServer.tls.serverName`。
- **传输协议**：`transport.protocol.tcp`、`transport.protocol.kcp`、`transport.protocol.quic`、`transport.protocol.websocket`、`transport.protocol.wss`。
- **认证方式**：`auth.method.token`、`auth.method.oidc`。

### 隧道、访问者与插件

- **基础隧道**：`name`、`type`、`enabled`、`transport.useEncryption`、`transport.useCompression`。
- **本地后端（provider）**：`localIP`、`localPort`。
- **远程端口（provider；tcp/udp）**：`remotePort`。
- **访问者（visitor；stcp/sudp/xtcp）**：`serverName`、`serverUser`、`bindAddr`、`bindPort`。
- **私有隧道（stcp/sudp/xtcp）**：`secretKey`。
- **访问权限（provider；stcp/sudp/xtcp）**：`allowUsers`。
- **域名（provider；http/https/tcpmux）**：`customDomains`、`subdomain`。
- **元数据（provider）**：`metadatas`。
- **注解（provider）**：`annotations`。
- **代理传输（provider）**：`transport.bandwidthLimit`、`transport.bandwidthLimitMode`、`transport.proxyProtocolVersion`。
- **负载均衡（provider；tcp/http/https/tcpmux）**：`loadBalancer.group`、`loadBalancer.groupKey`。
- **健康检查（provider）**：`healthCheck.type`、`healthCheck.timeoutSeconds`、`healthCheck.maxFailed`、`healthCheck.intervalSeconds`、`healthCheck.path`、`healthCheck.httpHeaders`。
- **HTTP（provider；http/tcpmux）**：`httpUser`、`httpPassword`、`routeByHTTPUser`。
- **HTTP（provider；http）**：`locations`、`hostHeaderRewrite`、`requestHeaders.set`。
- **HTTP 响应头（provider；http）**：`responseHeaders.set`。
- **TCPMUX（provider；tcpmux）**：`multiplexer`。
- **XTCP（visitor；xtcp）**：`protocol`、`keepTunnelOpen`、`maxRetriesAnHour`、`minRetryInterval`、`fallbackTo`、`fallbackTimeoutMs`。
- **NAT 穿透（xtcp）**：`natTraversal.disableAssistedAddrs`。
- **隧道协议**：`type.tcp`、`type.udp`、`type.http`、`type.https`、`type.stcp`、`type.sudp`、`type.xtcp`、`type.tcpmux`。
- **插件（provider；tcp/stcp/xtcp/http/https/tcpmux）**：`plugin.type`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https）**：`plugin.type.http2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2http）**：`plugin.type.http2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http）**：`plugin.type.https2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2https）**：`plugin.type.https2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy）**：`plugin.type.http_proxy`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.type.socks5`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.type.static_file`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.type.unix_domain_socket`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 tls2raw）**：`plugin.type.tls2raw`。
- **插件目标（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https/tls2raw）**：`plugin.localAddr`。
- **插件 HTTP（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https）**：`plugin.hostHeaderRewrite`、`plugin.requestHeaders.set`。
- **插件 HTTP/2（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https）**：`plugin.enableHTTP2`。
- **插件 TLS（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https/tls2raw）**：`plugin.crtPath`、`plugin.keyPath`。
- **插件认证（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy/static_file）**：`plugin.httpUser`、`plugin.httpPassword`。
- **SOCKS5（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.username`、`plugin.password`。
- **静态文件（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.localPath`、`plugin.stripPrefix`。
- **Unix socket（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.unixPath`。

### 配置默认值

以下按新建配置上下文列出；TCP 复用、所属用户、TLS 服务名等联动值会随表单上下文更新。类型选项不是独立字段，不重复列默认值。应用接管项同时说明官方默认和应用实际策略。

| 范围 | 配置键 | 默认值 | 说明 |
| --- | --- | --- | --- |
| 连接 | `serverAddr` | `0.0.0.0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `serverPort` | `7000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.token` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.protocol` | `tcp` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.enable` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.addr` | `127.0.0.1` | 应用固定绑定本机地址，与官方默认相同 |
| 连接 | `webServer.port` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `loginFailExit` | `false` | 应用固定为 false，以持续监督登录重试；官方默认 true |
| 连接 | `log.to` | `console` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.level` | `info` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.disablePrintColor` | `true` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `natHoleStunServer` | `stun.easyvoip.com:3478` | 0.52.0 没有 STUN 回退；从 0.52.1 起默认使用官方 STUN 地址 |
| 连接 | `dnsServer` | `空值` | 空值使用操作系统 DNS，没有固定默认 IP |
| 连接 | `udpPacketSize` | `1500` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `clientID` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.method` | `token` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.additionalScopes` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.clientID` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.clientSecret` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.audience` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.scope` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.tokenEndpointURL` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.additionalEndpointParams` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.insecureSkipVerify` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.proxyURL` | `空值` | 默认空。未设置 OIDC CA/跳过验证/专用代理时使用默认 HTTP 客户端（可读取环境代理）；设置自定义 TLS 后，空 proxyURL 明确禁用代理 |
| 连接 | `auth.tokenSource` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.tokenSource.type` | `file` | 来源默认未启用；显式启用时应用仅提供 file 类型 |
| 连接 | `auth.tokenSource.file.path` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.tokenSource` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.tokenSource.type` | `file` | 来源默认未启用；显式启用时应用仅提供 file 类型 |
| 连接 | `auth.oidc.tokenSource.file.path` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `transport.dialServerTimeout` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerKeepalive` | `7200` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.poolCount` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMux` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMuxKeepaliveInterval` | `30` | 0.58.1 起默认 30 秒；此前为 60 秒 |
| 连接 | `transport.heartbeatInterval` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.heartbeatTimeout` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.proxyURL` | `由环境决定` | 默认读取 frpc 进程的 http_proxy 环境变量；前端无法确定其值 |
| 连接 | `transport.connectServerLocalIP` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.wireProtocol` | `v1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.keepalivePeriod` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIdleTimeout` | `30` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIncomingStreams` | `100000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.trustedCaFile` | `空值` | 默认无 CA 文件；frpc 的 TLS 客户端此时跳过服务端证书验证，指定 CA 后启用验证 |
| 连接 | `transport.tls.serverName` | `由上下文决定` | 留空时 TLS SNI 使用当前 serverAddr；显示回退值不会保存覆盖 |
| 连接 | `transport.tls.disableCustomTLSFirstByte` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.assetsDir` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.pprofEnable` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.serverName` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `name` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `type` | `tcp` | 官方 type 必填且没有默认；应用新建隧道预设 TCP |
| 隧道 | `enabled` | `true` | 应用默认启用，并在生成时过滤停用隧道；原生 enabled 字段从 0.66 才提供 |
| 隧道 | `transport.useEncryption` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.useCompression` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localIP` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localPort` | `无默认` | localPort 没有有效官方默认，启用普通后端时必须填正值；8080 是应用新建预设 |
| 隧道 | `remotePort` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `serverName` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `serverUser` | `空值` | 留空时使用当前连接的 user，不固定用户名或写回命名前缀 |
| 隧道 | `bindAddr` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `bindPort` | `无默认` | bindPort 默认零值无效，必须明确填写正值；STCP/XTCP 的 -1 是可选重定向设置 |
| 隧道 | `secretKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `allowUsers` | `[]` | 空列表仅允许当前 provider 的用户；不等于允许所有用户 |
| 隧道 | `customDomains` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `subdomain` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `annotations` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.bandwidthLimit` | `空值` | 空值或 0KB/0MB 不限速；不填写具体带宽上限 |
| 隧道 | `transport.bandwidthLimitMode` | `client` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.proxyProtocolVersion` | `空值` | 空值不生成 PROXY 协议头，不是自动选择版本 |
| 隧道 | `loadBalancer.group` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `loadBalancer.groupKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.type` | `空值` | 默认不启用健康检查；展示数值默认不会创建或启用 healthCheck |
| 隧道 | `healthCheck.timeoutSeconds` | `3` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.maxFailed` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.intervalSeconds` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.path` | `无默认` | HTTP 健康检查必须明确填写路径，没有有效官方默认；健康检查关闭时此字段不生效 |
| 隧道 | `healthCheck.httpHeaders` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `routeByHTTPUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `locations` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `responseHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `multiplexer` | `httpconnect` | 官方没有默认，TCPMUX 必须明确指定 httpconnect；应用生成时提供唯一合法预设 |
| 隧道 | `protocol` | `quic` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `keepTunnelOpen` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `maxRetriesAnHour` | `8` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `minRetryInterval` | `90` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTo` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTimeoutMs` | `1000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `natTraversal.disableAssistedAddrs` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.type` | `空值` | 默认不启用插件；展示插件字段默认不会创建或启用 plugin |
| 隧道 | `plugin.localAddr` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.enableHTTP2` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.crtPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.keyPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.username` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.localPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.stripPrefix` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.unixPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |

</details>

<details>
<summary>frpc 0.69.1 · 142 项配置键与类型选项</summary>

[官方发布](https://github.com/fatedier/frp/releases/tag/v0.69.1)。补丁版本继承同一 minor 清单，运行前仍由 frpc verify 校验。

### 服务器连接

- **基础连接**：`serverAddr`、`serverPort`、`user`、`auth.token`、`transport.protocol`、`transport.tls.enable`、`webServer.addr`、`webServer.port`、`loginFailExit`、`log.to`、`log.level`、`log.disablePrintColor`。
- **连接高级**：`natHoleStunServer`、`dnsServer`、`udpPacketSize`、`metadatas`。
- **连接身份**：`clientID`。
- **认证**：`auth.method`、`auth.additionalScopes`。
- **认证（认证 oidc）**：`auth.oidc.clientID`、`auth.oidc.clientSecret`、`auth.oidc.audience`、`auth.oidc.scope`、`auth.oidc.tokenEndpointURL`、`auth.oidc.additionalEndpointParams`。
- **OIDC TLS 与代理（认证 oidc）**：`auth.oidc.trustedCaFile`、`auth.oidc.insecureSkipVerify`、`auth.oidc.proxyURL`。
- **Token 文件来源（认证 token）**：`auth.tokenSource`、`auth.tokenSource.type`、`auth.tokenSource.file.path`。
- **OIDC 文件来源（认证 oidc）**：`auth.oidc.tokenSource`、`auth.oidc.tokenSource.type`、`auth.oidc.tokenSource.file.path`。
- **传输**：`transport.dialServerTimeout`、`transport.dialServerKeepalive`、`transport.poolCount`、`transport.tcpMux`、`transport.tcpMuxKeepaliveInterval`、`transport.heartbeatInterval`、`transport.heartbeatTimeout`。
- **传输（tcp/websocket/wss）**：`transport.proxyURL`、`transport.connectServerLocalIP`。
- **Wire 协议**：`transport.wireProtocol`。
- **QUIC（quic）**：`transport.quic.keepalivePeriod`、`transport.quic.maxIdleTimeout`、`transport.quic.maxIncomingStreams`。
- **TLS**：`transport.tls.certFile`、`transport.tls.keyFile`、`transport.tls.trustedCaFile`、`transport.tls.serverName`、`transport.tls.disableCustomTLSFirstByte`。
- **本机管理**：`webServer.user`、`webServer.password`、`webServer.assetsDir`、`webServer.pprofEnable`、`webServer.tls.certFile`、`webServer.tls.keyFile`、`webServer.tls.trustedCaFile`、`webServer.tls.serverName`。
- **传输协议**：`transport.protocol.tcp`、`transport.protocol.kcp`、`transport.protocol.quic`、`transport.protocol.websocket`、`transport.protocol.wss`。
- **认证方式**：`auth.method.token`、`auth.method.oidc`。

### 隧道、访问者与插件

- **基础隧道**：`name`、`type`、`enabled`、`transport.useEncryption`、`transport.useCompression`。
- **本地后端（provider）**：`localIP`、`localPort`。
- **远程端口（provider；tcp/udp）**：`remotePort`。
- **访问者（visitor；stcp/sudp/xtcp）**：`serverName`、`serverUser`、`bindAddr`、`bindPort`。
- **私有隧道（stcp/sudp/xtcp）**：`secretKey`。
- **访问权限（provider；stcp/sudp/xtcp）**：`allowUsers`。
- **域名（provider；http/https/tcpmux）**：`customDomains`、`subdomain`。
- **元数据（provider）**：`metadatas`。
- **注解（provider）**：`annotations`。
- **代理传输（provider）**：`transport.bandwidthLimit`、`transport.bandwidthLimitMode`、`transport.proxyProtocolVersion`。
- **负载均衡（provider；tcp/http/https/tcpmux）**：`loadBalancer.group`、`loadBalancer.groupKey`。
- **健康检查（provider）**：`healthCheck.type`、`healthCheck.timeoutSeconds`、`healthCheck.maxFailed`、`healthCheck.intervalSeconds`、`healthCheck.path`、`healthCheck.httpHeaders`。
- **HTTP（provider；http/tcpmux）**：`httpUser`、`httpPassword`、`routeByHTTPUser`。
- **HTTP（provider；http）**：`locations`、`hostHeaderRewrite`、`requestHeaders.set`。
- **HTTP 响应头（provider；http）**：`responseHeaders.set`。
- **TCPMUX（provider；tcpmux）**：`multiplexer`。
- **XTCP（visitor；xtcp）**：`protocol`、`keepTunnelOpen`、`maxRetriesAnHour`、`minRetryInterval`、`fallbackTo`、`fallbackTimeoutMs`。
- **NAT 穿透（xtcp）**：`natTraversal.disableAssistedAddrs`。
- **隧道协议**：`type.tcp`、`type.udp`、`type.http`、`type.https`、`type.stcp`、`type.sudp`、`type.xtcp`、`type.tcpmux`。
- **插件（provider；tcp/stcp/xtcp/http/https/tcpmux）**：`plugin.type`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https）**：`plugin.type.http2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2http）**：`plugin.type.http2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http）**：`plugin.type.https2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2https）**：`plugin.type.https2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy）**：`plugin.type.http_proxy`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.type.socks5`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.type.static_file`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.type.unix_domain_socket`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 tls2raw）**：`plugin.type.tls2raw`。
- **插件目标（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https/tls2raw）**：`plugin.localAddr`。
- **插件 HTTP（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https）**：`plugin.hostHeaderRewrite`、`plugin.requestHeaders.set`。
- **插件 HTTP/2（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https）**：`plugin.enableHTTP2`。
- **插件 TLS（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https/tls2raw）**：`plugin.crtPath`、`plugin.keyPath`。
- **插件认证（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy/static_file）**：`plugin.httpUser`、`plugin.httpPassword`。
- **SOCKS5（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.username`、`plugin.password`。
- **静态文件（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.localPath`、`plugin.stripPrefix`。
- **Unix socket（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.unixPath`。

### 配置默认值

以下按新建配置上下文列出；TCP 复用、所属用户、TLS 服务名等联动值会随表单上下文更新。类型选项不是独立字段，不重复列默认值。应用接管项同时说明官方默认和应用实际策略。

| 范围 | 配置键 | 默认值 | 说明 |
| --- | --- | --- | --- |
| 连接 | `serverAddr` | `0.0.0.0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `serverPort` | `7000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.token` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.protocol` | `tcp` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.enable` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.addr` | `127.0.0.1` | 应用固定绑定本机地址，与官方默认相同 |
| 连接 | `webServer.port` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `loginFailExit` | `false` | 应用固定为 false，以持续监督登录重试；官方默认 true |
| 连接 | `log.to` | `console` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.level` | `info` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.disablePrintColor` | `true` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `natHoleStunServer` | `stun.easyvoip.com:3478` | 0.52.0 没有 STUN 回退；从 0.52.1 起默认使用官方 STUN 地址 |
| 连接 | `dnsServer` | `空值` | 空值使用操作系统 DNS，没有固定默认 IP |
| 连接 | `udpPacketSize` | `1500` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `clientID` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.method` | `token` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.additionalScopes` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.clientID` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.clientSecret` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.audience` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.scope` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.tokenEndpointURL` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.additionalEndpointParams` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.insecureSkipVerify` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.proxyURL` | `空值` | 默认空。未设置 OIDC CA/跳过验证/专用代理时使用默认 HTTP 客户端（可读取环境代理）；设置自定义 TLS 后，空 proxyURL 明确禁用代理 |
| 连接 | `auth.tokenSource` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.tokenSource.type` | `file` | 来源默认未启用；显式启用时应用仅提供 file 类型 |
| 连接 | `auth.tokenSource.file.path` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.tokenSource` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.tokenSource.type` | `file` | 来源默认未启用；显式启用时应用仅提供 file 类型 |
| 连接 | `auth.oidc.tokenSource.file.path` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `transport.dialServerTimeout` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerKeepalive` | `7200` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.poolCount` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMux` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMuxKeepaliveInterval` | `30` | 0.58.1 起默认 30 秒；此前为 60 秒 |
| 连接 | `transport.heartbeatInterval` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.heartbeatTimeout` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.proxyURL` | `由环境决定` | 默认读取 frpc 进程的 http_proxy 环境变量；前端无法确定其值 |
| 连接 | `transport.connectServerLocalIP` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.wireProtocol` | `v1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.keepalivePeriod` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIdleTimeout` | `30` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIncomingStreams` | `100000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.trustedCaFile` | `空值` | 默认无 CA 文件；frpc 的 TLS 客户端此时跳过服务端证书验证，指定 CA 后启用验证 |
| 连接 | `transport.tls.serverName` | `由上下文决定` | 留空时 TLS SNI 使用当前 serverAddr；显示回退值不会保存覆盖 |
| 连接 | `transport.tls.disableCustomTLSFirstByte` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.assetsDir` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.pprofEnable` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.serverName` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `name` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `type` | `tcp` | 官方 type 必填且没有默认；应用新建隧道预设 TCP |
| 隧道 | `enabled` | `true` | 应用默认启用，并在生成时过滤停用隧道；原生 enabled 字段从 0.66 才提供 |
| 隧道 | `transport.useEncryption` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.useCompression` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localIP` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localPort` | `无默认` | localPort 没有有效官方默认，启用普通后端时必须填正值；8080 是应用新建预设 |
| 隧道 | `remotePort` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `serverName` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `serverUser` | `空值` | 留空时使用当前连接的 user，不固定用户名或写回命名前缀 |
| 隧道 | `bindAddr` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `bindPort` | `无默认` | bindPort 默认零值无效，必须明确填写正值；STCP/XTCP 的 -1 是可选重定向设置 |
| 隧道 | `secretKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `allowUsers` | `[]` | 空列表仅允许当前 provider 的用户；不等于允许所有用户 |
| 隧道 | `customDomains` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `subdomain` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `annotations` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.bandwidthLimit` | `空值` | 空值或 0KB/0MB 不限速；不填写具体带宽上限 |
| 隧道 | `transport.bandwidthLimitMode` | `client` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.proxyProtocolVersion` | `空值` | 空值不生成 PROXY 协议头，不是自动选择版本 |
| 隧道 | `loadBalancer.group` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `loadBalancer.groupKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.type` | `空值` | 默认不启用健康检查；展示数值默认不会创建或启用 healthCheck |
| 隧道 | `healthCheck.timeoutSeconds` | `3` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.maxFailed` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.intervalSeconds` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.path` | `无默认` | HTTP 健康检查必须明确填写路径，没有有效官方默认；健康检查关闭时此字段不生效 |
| 隧道 | `healthCheck.httpHeaders` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `routeByHTTPUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `locations` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `responseHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `multiplexer` | `httpconnect` | 官方没有默认，TCPMUX 必须明确指定 httpconnect；应用生成时提供唯一合法预设 |
| 隧道 | `protocol` | `quic` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `keepTunnelOpen` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `maxRetriesAnHour` | `8` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `minRetryInterval` | `90` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTo` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTimeoutMs` | `1000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `natTraversal.disableAssistedAddrs` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.type` | `空值` | 默认不启用插件；展示插件字段默认不会创建或启用 plugin |
| 隧道 | `plugin.localAddr` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.enableHTTP2` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.crtPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.keyPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.username` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.localPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.stripPrefix` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.unixPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |

</details>

<details>
<summary>frpc 0.70.0 · 142 项配置键与类型选项</summary>

[官方发布](https://github.com/fatedier/frp/releases/tag/v0.70.0)。已审核的版本配置清单。

### 服务器连接

- **基础连接**：`serverAddr`、`serverPort`、`user`、`auth.token`、`transport.protocol`、`transport.tls.enable`、`webServer.addr`、`webServer.port`、`loginFailExit`、`log.to`、`log.level`、`log.disablePrintColor`。
- **连接高级**：`natHoleStunServer`、`dnsServer`、`udpPacketSize`、`metadatas`。
- **连接身份**：`clientID`。
- **认证**：`auth.method`、`auth.additionalScopes`。
- **认证（认证 oidc）**：`auth.oidc.clientID`、`auth.oidc.clientSecret`、`auth.oidc.audience`、`auth.oidc.scope`、`auth.oidc.tokenEndpointURL`、`auth.oidc.additionalEndpointParams`。
- **OIDC TLS 与代理（认证 oidc）**：`auth.oidc.trustedCaFile`、`auth.oidc.insecureSkipVerify`、`auth.oidc.proxyURL`。
- **Token 文件来源（认证 token）**：`auth.tokenSource`、`auth.tokenSource.type`、`auth.tokenSource.file.path`。
- **OIDC 文件来源（认证 oidc）**：`auth.oidc.tokenSource`、`auth.oidc.tokenSource.type`、`auth.oidc.tokenSource.file.path`。
- **传输**：`transport.dialServerTimeout`、`transport.dialServerKeepalive`、`transport.poolCount`、`transport.tcpMux`、`transport.tcpMuxKeepaliveInterval`、`transport.heartbeatInterval`、`transport.heartbeatTimeout`。
- **传输（tcp/websocket/wss）**：`transport.proxyURL`、`transport.connectServerLocalIP`。
- **Wire 协议**：`transport.wireProtocol`。
- **QUIC（quic）**：`transport.quic.keepalivePeriod`、`transport.quic.maxIdleTimeout`、`transport.quic.maxIncomingStreams`。
- **TLS**：`transport.tls.certFile`、`transport.tls.keyFile`、`transport.tls.trustedCaFile`、`transport.tls.serverName`、`transport.tls.disableCustomTLSFirstByte`。
- **本机管理**：`webServer.user`、`webServer.password`、`webServer.assetsDir`、`webServer.pprofEnable`、`webServer.tls.certFile`、`webServer.tls.keyFile`、`webServer.tls.trustedCaFile`、`webServer.tls.serverName`。
- **传输协议**：`transport.protocol.tcp`、`transport.protocol.kcp`、`transport.protocol.quic`、`transport.protocol.websocket`、`transport.protocol.wss`。
- **认证方式**：`auth.method.token`、`auth.method.oidc`。

### 隧道、访问者与插件

- **基础隧道**：`name`、`type`、`enabled`、`transport.useEncryption`、`transport.useCompression`。
- **本地后端（provider）**：`localIP`、`localPort`。
- **远程端口（provider；tcp/udp）**：`remotePort`。
- **访问者（visitor；stcp/sudp/xtcp）**：`serverName`、`serverUser`、`bindAddr`、`bindPort`。
- **私有隧道（stcp/sudp/xtcp）**：`secretKey`。
- **访问权限（provider；stcp/sudp/xtcp）**：`allowUsers`。
- **域名（provider；http/https/tcpmux）**：`customDomains`、`subdomain`。
- **元数据（provider）**：`metadatas`。
- **注解（provider）**：`annotations`。
- **代理传输（provider）**：`transport.bandwidthLimit`、`transport.bandwidthLimitMode`、`transport.proxyProtocolVersion`。
- **负载均衡（provider；tcp/http/https/tcpmux）**：`loadBalancer.group`、`loadBalancer.groupKey`。
- **健康检查（provider）**：`healthCheck.type`、`healthCheck.timeoutSeconds`、`healthCheck.maxFailed`、`healthCheck.intervalSeconds`、`healthCheck.path`、`healthCheck.httpHeaders`。
- **HTTP（provider；http/tcpmux）**：`httpUser`、`httpPassword`、`routeByHTTPUser`。
- **HTTP（provider；http）**：`locations`、`hostHeaderRewrite`、`requestHeaders.set`。
- **HTTP 响应头（provider；http）**：`responseHeaders.set`。
- **TCPMUX（provider；tcpmux）**：`multiplexer`。
- **XTCP（visitor；xtcp）**：`protocol`、`keepTunnelOpen`、`maxRetriesAnHour`、`minRetryInterval`、`fallbackTo`、`fallbackTimeoutMs`。
- **NAT 穿透（xtcp）**：`natTraversal.disableAssistedAddrs`。
- **隧道协议**：`type.tcp`、`type.udp`、`type.http`、`type.https`、`type.stcp`、`type.sudp`、`type.xtcp`、`type.tcpmux`。
- **插件（provider；tcp/stcp/xtcp/http/https/tcpmux）**：`plugin.type`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https）**：`plugin.type.http2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2http）**：`plugin.type.http2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http）**：`plugin.type.https2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2https）**：`plugin.type.https2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy）**：`plugin.type.http_proxy`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.type.socks5`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.type.static_file`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.type.unix_domain_socket`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 tls2raw）**：`plugin.type.tls2raw`。
- **插件目标（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https/tls2raw）**：`plugin.localAddr`。
- **插件 HTTP（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https）**：`plugin.hostHeaderRewrite`、`plugin.requestHeaders.set`。
- **插件 HTTP/2（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https）**：`plugin.enableHTTP2`。
- **插件 TLS（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https/tls2raw）**：`plugin.crtPath`、`plugin.keyPath`。
- **插件认证（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy/static_file）**：`plugin.httpUser`、`plugin.httpPassword`。
- **SOCKS5（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.username`、`plugin.password`。
- **静态文件（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.localPath`、`plugin.stripPrefix`。
- **Unix socket（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.unixPath`。

### 配置默认值

以下按新建配置上下文列出；TCP 复用、所属用户、TLS 服务名等联动值会随表单上下文更新。类型选项不是独立字段，不重复列默认值。应用接管项同时说明官方默认和应用实际策略。

| 范围 | 配置键 | 默认值 | 说明 |
| --- | --- | --- | --- |
| 连接 | `serverAddr` | `0.0.0.0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `serverPort` | `7000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.token` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.protocol` | `tcp` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.enable` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.addr` | `127.0.0.1` | 应用固定绑定本机地址，与官方默认相同 |
| 连接 | `webServer.port` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `loginFailExit` | `false` | 应用固定为 false，以持续监督登录重试；官方默认 true |
| 连接 | `log.to` | `console` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.level` | `info` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.disablePrintColor` | `true` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `natHoleStunServer` | `stun.easyvoip.com:3478` | 0.52.0 没有 STUN 回退；从 0.52.1 起默认使用官方 STUN 地址 |
| 连接 | `dnsServer` | `空值` | 空值使用操作系统 DNS，没有固定默认 IP |
| 连接 | `udpPacketSize` | `1500` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `clientID` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.method` | `token` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.additionalScopes` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.clientID` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.clientSecret` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.audience` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.scope` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.tokenEndpointURL` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.additionalEndpointParams` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.insecureSkipVerify` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.proxyURL` | `空值` | 默认空。未设置 OIDC CA/跳过验证/专用代理时使用默认 HTTP 客户端（可读取环境代理）；设置自定义 TLS 后，空 proxyURL 明确禁用代理 |
| 连接 | `auth.tokenSource` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.tokenSource.type` | `file` | 来源默认未启用；显式启用时应用仅提供 file 类型 |
| 连接 | `auth.tokenSource.file.path` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.tokenSource` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.tokenSource.type` | `file` | 来源默认未启用；显式启用时应用仅提供 file 类型 |
| 连接 | `auth.oidc.tokenSource.file.path` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `transport.dialServerTimeout` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerKeepalive` | `7200` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.poolCount` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMux` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMuxKeepaliveInterval` | `30` | 0.58.1 起默认 30 秒；此前为 60 秒 |
| 连接 | `transport.heartbeatInterval` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.heartbeatTimeout` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.proxyURL` | `由环境决定` | 默认读取 frpc 进程的 http_proxy 环境变量；前端无法确定其值 |
| 连接 | `transport.connectServerLocalIP` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.wireProtocol` | `v1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.keepalivePeriod` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIdleTimeout` | `30` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIncomingStreams` | `100000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.trustedCaFile` | `空值` | 默认无 CA 文件；frpc 的 TLS 客户端此时跳过服务端证书验证，指定 CA 后启用验证 |
| 连接 | `transport.tls.serverName` | `由上下文决定` | 留空时 TLS SNI 使用当前 serverAddr；显示回退值不会保存覆盖 |
| 连接 | `transport.tls.disableCustomTLSFirstByte` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.assetsDir` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.pprofEnable` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.serverName` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `name` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `type` | `tcp` | 官方 type 必填且没有默认；应用新建隧道预设 TCP |
| 隧道 | `enabled` | `true` | 应用默认启用，并在生成时过滤停用隧道；原生 enabled 字段从 0.66 才提供 |
| 隧道 | `transport.useEncryption` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.useCompression` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localIP` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localPort` | `无默认` | localPort 没有有效官方默认，启用普通后端时必须填正值；8080 是应用新建预设 |
| 隧道 | `remotePort` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `serverName` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `serverUser` | `空值` | 留空时使用当前连接的 user，不固定用户名或写回命名前缀 |
| 隧道 | `bindAddr` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `bindPort` | `无默认` | bindPort 默认零值无效，必须明确填写正值；STCP/XTCP 的 -1 是可选重定向设置 |
| 隧道 | `secretKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `allowUsers` | `[]` | 空列表仅允许当前 provider 的用户；不等于允许所有用户 |
| 隧道 | `customDomains` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `subdomain` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `annotations` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.bandwidthLimit` | `空值` | 空值或 0KB/0MB 不限速；不填写具体带宽上限 |
| 隧道 | `transport.bandwidthLimitMode` | `client` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.proxyProtocolVersion` | `空值` | 空值不生成 PROXY 协议头，不是自动选择版本 |
| 隧道 | `loadBalancer.group` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `loadBalancer.groupKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.type` | `空值` | 默认不启用健康检查；展示数值默认不会创建或启用 healthCheck |
| 隧道 | `healthCheck.timeoutSeconds` | `3` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.maxFailed` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.intervalSeconds` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.path` | `无默认` | HTTP 健康检查必须明确填写路径，没有有效官方默认；健康检查关闭时此字段不生效 |
| 隧道 | `healthCheck.httpHeaders` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `routeByHTTPUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `locations` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `responseHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `multiplexer` | `httpconnect` | 官方没有默认，TCPMUX 必须明确指定 httpconnect；应用生成时提供唯一合法预设 |
| 隧道 | `protocol` | `quic` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `keepTunnelOpen` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `maxRetriesAnHour` | `8` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `minRetryInterval` | `90` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTo` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTimeoutMs` | `1000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `natTraversal.disableAssistedAddrs` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.type` | `空值` | 默认不启用插件；展示插件字段默认不会创建或启用 plugin |
| 隧道 | `plugin.localAddr` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.enableHTTP2` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.crtPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.keyPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.username` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.localPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.stripPrefix` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.unixPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |

</details>

<details>
<summary>frpc 0.70.1 · 142 项配置键与类型选项</summary>

[官方发布](https://github.com/fatedier/frp/releases/tag/v0.70.1)。补丁版本继承同一 minor 清单，运行前仍由 frpc verify 校验。

### 服务器连接

- **基础连接**：`serverAddr`、`serverPort`、`user`、`auth.token`、`transport.protocol`、`transport.tls.enable`、`webServer.addr`、`webServer.port`、`loginFailExit`、`log.to`、`log.level`、`log.disablePrintColor`。
- **连接高级**：`natHoleStunServer`、`dnsServer`、`udpPacketSize`、`metadatas`。
- **连接身份**：`clientID`。
- **认证**：`auth.method`、`auth.additionalScopes`。
- **认证（认证 oidc）**：`auth.oidc.clientID`、`auth.oidc.clientSecret`、`auth.oidc.audience`、`auth.oidc.scope`、`auth.oidc.tokenEndpointURL`、`auth.oidc.additionalEndpointParams`。
- **OIDC TLS 与代理（认证 oidc）**：`auth.oidc.trustedCaFile`、`auth.oidc.insecureSkipVerify`、`auth.oidc.proxyURL`。
- **Token 文件来源（认证 token）**：`auth.tokenSource`、`auth.tokenSource.type`、`auth.tokenSource.file.path`。
- **OIDC 文件来源（认证 oidc）**：`auth.oidc.tokenSource`、`auth.oidc.tokenSource.type`、`auth.oidc.tokenSource.file.path`。
- **传输**：`transport.dialServerTimeout`、`transport.dialServerKeepalive`、`transport.poolCount`、`transport.tcpMux`、`transport.tcpMuxKeepaliveInterval`、`transport.heartbeatInterval`、`transport.heartbeatTimeout`。
- **传输（tcp/websocket/wss）**：`transport.proxyURL`、`transport.connectServerLocalIP`。
- **Wire 协议**：`transport.wireProtocol`。
- **QUIC（quic）**：`transport.quic.keepalivePeriod`、`transport.quic.maxIdleTimeout`、`transport.quic.maxIncomingStreams`。
- **TLS**：`transport.tls.certFile`、`transport.tls.keyFile`、`transport.tls.trustedCaFile`、`transport.tls.serverName`、`transport.tls.disableCustomTLSFirstByte`。
- **本机管理**：`webServer.user`、`webServer.password`、`webServer.assetsDir`、`webServer.pprofEnable`、`webServer.tls.certFile`、`webServer.tls.keyFile`、`webServer.tls.trustedCaFile`、`webServer.tls.serverName`。
- **传输协议**：`transport.protocol.tcp`、`transport.protocol.kcp`、`transport.protocol.quic`、`transport.protocol.websocket`、`transport.protocol.wss`。
- **认证方式**：`auth.method.token`、`auth.method.oidc`。

### 隧道、访问者与插件

- **基础隧道**：`name`、`type`、`enabled`、`transport.useEncryption`、`transport.useCompression`。
- **本地后端（provider）**：`localIP`、`localPort`。
- **远程端口（provider；tcp/udp）**：`remotePort`。
- **访问者（visitor；stcp/sudp/xtcp）**：`serverName`、`serverUser`、`bindAddr`、`bindPort`。
- **私有隧道（stcp/sudp/xtcp）**：`secretKey`。
- **访问权限（provider；stcp/sudp/xtcp）**：`allowUsers`。
- **域名（provider；http/https/tcpmux）**：`customDomains`、`subdomain`。
- **元数据（provider）**：`metadatas`。
- **注解（provider）**：`annotations`。
- **代理传输（provider）**：`transport.bandwidthLimit`、`transport.bandwidthLimitMode`、`transport.proxyProtocolVersion`。
- **负载均衡（provider；tcp/http/https/tcpmux）**：`loadBalancer.group`、`loadBalancer.groupKey`。
- **健康检查（provider）**：`healthCheck.type`、`healthCheck.timeoutSeconds`、`healthCheck.maxFailed`、`healthCheck.intervalSeconds`、`healthCheck.path`、`healthCheck.httpHeaders`。
- **HTTP（provider；http/tcpmux）**：`httpUser`、`httpPassword`、`routeByHTTPUser`。
- **HTTP（provider；http）**：`locations`、`hostHeaderRewrite`、`requestHeaders.set`。
- **HTTP 响应头（provider；http）**：`responseHeaders.set`。
- **TCPMUX（provider；tcpmux）**：`multiplexer`。
- **XTCP（visitor；xtcp）**：`protocol`、`keepTunnelOpen`、`maxRetriesAnHour`、`minRetryInterval`、`fallbackTo`、`fallbackTimeoutMs`。
- **NAT 穿透（xtcp）**：`natTraversal.disableAssistedAddrs`。
- **隧道协议**：`type.tcp`、`type.udp`、`type.http`、`type.https`、`type.stcp`、`type.sudp`、`type.xtcp`、`type.tcpmux`。
- **插件（provider；tcp/stcp/xtcp/http/https/tcpmux）**：`plugin.type`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https）**：`plugin.type.http2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2http）**：`plugin.type.http2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http）**：`plugin.type.https2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2https）**：`plugin.type.https2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy）**：`plugin.type.http_proxy`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.type.socks5`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.type.static_file`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.type.unix_domain_socket`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 tls2raw）**：`plugin.type.tls2raw`。
- **插件目标（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https/tls2raw）**：`plugin.localAddr`。
- **插件 HTTP（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https）**：`plugin.hostHeaderRewrite`、`plugin.requestHeaders.set`。
- **插件 HTTP/2（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https）**：`plugin.enableHTTP2`。
- **插件 TLS（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https/tls2raw）**：`plugin.crtPath`、`plugin.keyPath`。
- **插件认证（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy/static_file）**：`plugin.httpUser`、`plugin.httpPassword`。
- **SOCKS5（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.username`、`plugin.password`。
- **静态文件（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.localPath`、`plugin.stripPrefix`。
- **Unix socket（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.unixPath`。

### 配置默认值

以下按新建配置上下文列出；TCP 复用、所属用户、TLS 服务名等联动值会随表单上下文更新。类型选项不是独立字段，不重复列默认值。应用接管项同时说明官方默认和应用实际策略。

| 范围 | 配置键 | 默认值 | 说明 |
| --- | --- | --- | --- |
| 连接 | `serverAddr` | `0.0.0.0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `serverPort` | `7000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.token` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.protocol` | `tcp` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.enable` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.addr` | `127.0.0.1` | 应用固定绑定本机地址，与官方默认相同 |
| 连接 | `webServer.port` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `loginFailExit` | `false` | 应用固定为 false，以持续监督登录重试；官方默认 true |
| 连接 | `log.to` | `console` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.level` | `info` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.disablePrintColor` | `true` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `natHoleStunServer` | `stun.easyvoip.com:3478` | 0.52.0 没有 STUN 回退；从 0.52.1 起默认使用官方 STUN 地址 |
| 连接 | `dnsServer` | `空值` | 空值使用操作系统 DNS，没有固定默认 IP |
| 连接 | `udpPacketSize` | `1500` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `clientID` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.method` | `token` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.additionalScopes` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.clientID` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.clientSecret` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.audience` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.scope` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.tokenEndpointURL` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.additionalEndpointParams` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.insecureSkipVerify` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.proxyURL` | `空值` | 默认空。未设置 OIDC CA/跳过验证/专用代理时使用默认 HTTP 客户端（可读取环境代理）；设置自定义 TLS 后，空 proxyURL 明确禁用代理 |
| 连接 | `auth.tokenSource` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.tokenSource.type` | `file` | 来源默认未启用；显式启用时应用仅提供 file 类型 |
| 连接 | `auth.tokenSource.file.path` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.tokenSource` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.tokenSource.type` | `file` | 来源默认未启用；显式启用时应用仅提供 file 类型 |
| 连接 | `auth.oidc.tokenSource.file.path` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `transport.dialServerTimeout` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerKeepalive` | `7200` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.poolCount` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMux` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMuxKeepaliveInterval` | `30` | 0.58.1 起默认 30 秒；此前为 60 秒 |
| 连接 | `transport.heartbeatInterval` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.heartbeatTimeout` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.proxyURL` | `由环境决定` | 默认读取 frpc 进程的 http_proxy 环境变量；前端无法确定其值 |
| 连接 | `transport.connectServerLocalIP` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.wireProtocol` | `v1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.keepalivePeriod` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIdleTimeout` | `30` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIncomingStreams` | `100000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.trustedCaFile` | `空值` | 默认无 CA 文件；frpc 的 TLS 客户端此时跳过服务端证书验证，指定 CA 后启用验证 |
| 连接 | `transport.tls.serverName` | `由上下文决定` | 留空时 TLS SNI 使用当前 serverAddr；显示回退值不会保存覆盖 |
| 连接 | `transport.tls.disableCustomTLSFirstByte` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.assetsDir` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.pprofEnable` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.serverName` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `name` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `type` | `tcp` | 官方 type 必填且没有默认；应用新建隧道预设 TCP |
| 隧道 | `enabled` | `true` | 应用默认启用，并在生成时过滤停用隧道；原生 enabled 字段从 0.66 才提供 |
| 隧道 | `transport.useEncryption` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.useCompression` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localIP` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localPort` | `无默认` | localPort 没有有效官方默认，启用普通后端时必须填正值；8080 是应用新建预设 |
| 隧道 | `remotePort` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `serverName` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `serverUser` | `空值` | 留空时使用当前连接的 user，不固定用户名或写回命名前缀 |
| 隧道 | `bindAddr` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `bindPort` | `无默认` | bindPort 默认零值无效，必须明确填写正值；STCP/XTCP 的 -1 是可选重定向设置 |
| 隧道 | `secretKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `allowUsers` | `[]` | 空列表仅允许当前 provider 的用户；不等于允许所有用户 |
| 隧道 | `customDomains` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `subdomain` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `annotations` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.bandwidthLimit` | `空值` | 空值或 0KB/0MB 不限速；不填写具体带宽上限 |
| 隧道 | `transport.bandwidthLimitMode` | `client` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.proxyProtocolVersion` | `空值` | 空值不生成 PROXY 协议头，不是自动选择版本 |
| 隧道 | `loadBalancer.group` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `loadBalancer.groupKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.type` | `空值` | 默认不启用健康检查；展示数值默认不会创建或启用 healthCheck |
| 隧道 | `healthCheck.timeoutSeconds` | `3` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.maxFailed` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.intervalSeconds` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.path` | `无默认` | HTTP 健康检查必须明确填写路径，没有有效官方默认；健康检查关闭时此字段不生效 |
| 隧道 | `healthCheck.httpHeaders` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `routeByHTTPUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `locations` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `responseHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `multiplexer` | `httpconnect` | 官方没有默认，TCPMUX 必须明确指定 httpconnect；应用生成时提供唯一合法预设 |
| 隧道 | `protocol` | `quic` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `keepTunnelOpen` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `maxRetriesAnHour` | `8` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `minRetryInterval` | `90` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTo` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTimeoutMs` | `1000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `natTraversal.disableAssistedAddrs` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.type` | `空值` | 默认不启用插件；展示插件字段默认不会创建或启用 plugin |
| 隧道 | `plugin.localAddr` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.enableHTTP2` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.crtPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.keyPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.username` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.localPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.stripPrefix` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.unixPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |

</details>

<details>
<summary>frpc 0.71.0 · 142 项配置键与类型选项</summary>

[官方发布](https://github.com/fatedier/frp/releases/tag/v0.71.0)。已审核的版本配置清单。

### 服务器连接

- **基础连接**：`serverAddr`、`serverPort`、`user`、`auth.token`、`transport.protocol`、`transport.tls.enable`、`webServer.addr`、`webServer.port`、`loginFailExit`、`log.to`、`log.level`、`log.disablePrintColor`。
- **连接高级**：`natHoleStunServer`、`dnsServer`、`udpPacketSize`、`metadatas`。
- **连接身份**：`clientID`。
- **认证**：`auth.method`、`auth.additionalScopes`。
- **认证（认证 oidc）**：`auth.oidc.clientID`、`auth.oidc.clientSecret`、`auth.oidc.audience`、`auth.oidc.scope`、`auth.oidc.tokenEndpointURL`、`auth.oidc.additionalEndpointParams`。
- **OIDC TLS 与代理（认证 oidc）**：`auth.oidc.trustedCaFile`、`auth.oidc.insecureSkipVerify`、`auth.oidc.proxyURL`。
- **Token 文件来源（认证 token）**：`auth.tokenSource`、`auth.tokenSource.type`、`auth.tokenSource.file.path`。
- **OIDC 文件来源（认证 oidc）**：`auth.oidc.tokenSource`、`auth.oidc.tokenSource.type`、`auth.oidc.tokenSource.file.path`。
- **传输**：`transport.dialServerTimeout`、`transport.dialServerKeepalive`、`transport.poolCount`、`transport.tcpMux`、`transport.tcpMuxKeepaliveInterval`、`transport.heartbeatInterval`、`transport.heartbeatTimeout`。
- **传输（tcp/websocket/wss）**：`transport.proxyURL`、`transport.connectServerLocalIP`。
- **Wire 协议**：`transport.wireProtocol`。
- **QUIC（quic）**：`transport.quic.keepalivePeriod`、`transport.quic.maxIdleTimeout`、`transport.quic.maxIncomingStreams`。
- **TLS**：`transport.tls.certFile`、`transport.tls.keyFile`、`transport.tls.trustedCaFile`、`transport.tls.serverName`、`transport.tls.disableCustomTLSFirstByte`。
- **本机管理**：`webServer.user`、`webServer.password`、`webServer.assetsDir`、`webServer.pprofEnable`、`webServer.tls.certFile`、`webServer.tls.keyFile`、`webServer.tls.trustedCaFile`、`webServer.tls.serverName`。
- **传输协议**：`transport.protocol.tcp`、`transport.protocol.kcp`、`transport.protocol.quic`、`transport.protocol.websocket`、`transport.protocol.wss`。
- **认证方式**：`auth.method.token`、`auth.method.oidc`。

### 隧道、访问者与插件

- **基础隧道**：`name`、`type`、`enabled`、`transport.useEncryption`、`transport.useCompression`。
- **本地后端（provider）**：`localIP`、`localPort`。
- **远程端口（provider；tcp/udp）**：`remotePort`。
- **访问者（visitor；stcp/sudp/xtcp）**：`serverName`、`serverUser`、`bindAddr`、`bindPort`。
- **私有隧道（stcp/sudp/xtcp）**：`secretKey`。
- **访问权限（provider；stcp/sudp/xtcp）**：`allowUsers`。
- **域名（provider；http/https/tcpmux）**：`customDomains`、`subdomain`。
- **元数据（provider）**：`metadatas`。
- **注解（provider）**：`annotations`。
- **代理传输（provider）**：`transport.bandwidthLimit`、`transport.bandwidthLimitMode`、`transport.proxyProtocolVersion`。
- **负载均衡（provider；tcp/http/https/tcpmux）**：`loadBalancer.group`、`loadBalancer.groupKey`。
- **健康检查（provider）**：`healthCheck.type`、`healthCheck.timeoutSeconds`、`healthCheck.maxFailed`、`healthCheck.intervalSeconds`、`healthCheck.path`、`healthCheck.httpHeaders`。
- **HTTP（provider；http/tcpmux）**：`httpUser`、`httpPassword`、`routeByHTTPUser`。
- **HTTP（provider；http）**：`locations`、`hostHeaderRewrite`、`requestHeaders.set`。
- **HTTP 响应头（provider；http）**：`responseHeaders.set`。
- **TCPMUX（provider；tcpmux）**：`multiplexer`。
- **XTCP（visitor；xtcp）**：`protocol`、`keepTunnelOpen`、`maxRetriesAnHour`、`minRetryInterval`、`fallbackTo`、`fallbackTimeoutMs`。
- **NAT 穿透（xtcp）**：`natTraversal.disableAssistedAddrs`。
- **隧道协议**：`type.tcp`、`type.udp`、`type.http`、`type.https`、`type.stcp`、`type.sudp`、`type.xtcp`、`type.tcpmux`。
- **插件（provider；tcp/stcp/xtcp/http/https/tcpmux）**：`plugin.type`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https）**：`plugin.type.http2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2http）**：`plugin.type.http2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http）**：`plugin.type.https2http`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2https）**：`plugin.type.https2https`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy）**：`plugin.type.http_proxy`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.type.socks5`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.type.static_file`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.type.unix_domain_socket`。
- **插件类型（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 tls2raw）**：`plugin.type.tls2raw`。
- **插件目标（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https/tls2raw）**：`plugin.localAddr`。
- **插件 HTTP（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http2https/http2http/https2http/https2https）**：`plugin.hostHeaderRewrite`、`plugin.requestHeaders.set`。
- **插件 HTTP/2（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https）**：`plugin.enableHTTP2`。
- **插件 TLS（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 https2http/https2https/tls2raw）**：`plugin.crtPath`、`plugin.keyPath`。
- **插件认证（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 http_proxy/static_file）**：`plugin.httpUser`、`plugin.httpPassword`。
- **SOCKS5（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 socks5）**：`plugin.username`、`plugin.password`。
- **静态文件（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 static_file）**：`plugin.localPath`、`plugin.stripPrefix`。
- **Unix socket（provider；tcp/stcp/xtcp/http/https/tcpmux；插件 unix_domain_socket）**：`plugin.unixPath`。

### 配置默认值

以下按新建配置上下文列出；TCP 复用、所属用户、TLS 服务名等联动值会随表单上下文更新。类型选项不是独立字段，不重复列默认值。应用接管项同时说明官方默认和应用实际策略。

| 范围 | 配置键 | 默认值 | 说明 |
| --- | --- | --- | --- |
| 连接 | `serverAddr` | `0.0.0.0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `serverPort` | `7000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.token` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.protocol` | `tcp` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.enable` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.addr` | `127.0.0.1` | 应用固定绑定本机地址，与官方默认相同 |
| 连接 | `webServer.port` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `loginFailExit` | `false` | 应用固定为 false，以持续监督登录重试；官方默认 true |
| 连接 | `log.to` | `console` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.level` | `info` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `log.disablePrintColor` | `true` | 应用接管控制台/info/无色日志；官方默认未禁用颜色 |
| 连接 | `natHoleStunServer` | `stun.easyvoip.com:3478` | 0.52.0 没有 STUN 回退；从 0.52.1 起默认使用官方 STUN 地址 |
| 连接 | `dnsServer` | `空值` | 空值使用操作系统 DNS，没有固定默认 IP |
| 连接 | `udpPacketSize` | `1500` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `clientID` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.method` | `token` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.additionalScopes` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.clientID` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.clientSecret` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.audience` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.scope` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.tokenEndpointURL` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.additionalEndpointParams` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.insecureSkipVerify` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `auth.oidc.proxyURL` | `空值` | 默认空。未设置 OIDC CA/跳过验证/专用代理时使用默认 HTTP 客户端（可读取环境代理）；设置自定义 TLS 后，空 proxyURL 明确禁用代理 |
| 连接 | `auth.tokenSource` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.tokenSource.type` | `file` | 来源默认未启用；显式启用时应用仅提供 file 类型 |
| 连接 | `auth.tokenSource.file.path` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.tokenSource` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `auth.oidc.tokenSource.type` | `file` | 来源默认未启用；显式启用时应用仅提供 file 类型 |
| 连接 | `auth.oidc.tokenSource.file.path` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 连接 | `transport.dialServerTimeout` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.dialServerKeepalive` | `7200` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.poolCount` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMux` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tcpMuxKeepaliveInterval` | `30` | 0.58.1 起默认 30 秒；此前为 60 秒 |
| 连接 | `transport.heartbeatInterval` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.heartbeatTimeout` | `-1` | 0.58.0 起启用 TCP mux 时默认 -1（停用应用层心跳）；否则间隔 30 秒、超时 90 秒 |
| 连接 | `transport.proxyURL` | `由环境决定` | 默认读取 frpc 进程的 http_proxy 环境变量；前端无法确定其值 |
| 连接 | `transport.connectServerLocalIP` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.wireProtocol` | `v1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.keepalivePeriod` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIdleTimeout` | `30` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.quic.maxIncomingStreams` | `100000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `transport.tls.trustedCaFile` | `空值` | 默认无 CA 文件；frpc 的 TLS 客户端此时跳过服务端证书验证，指定 CA 后启用验证 |
| 连接 | `transport.tls.serverName` | `由上下文决定` | 留空时 TLS SNI 使用当前 serverAddr；显示回退值不会保存覆盖 |
| 连接 | `transport.tls.disableCustomTLSFirstByte` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.user` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.assetsDir` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.pprofEnable` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.certFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.keyFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.trustedCaFile` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 连接 | `webServer.tls.serverName` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `name` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `type` | `tcp` | 官方 type 必填且没有默认；应用新建隧道预设 TCP |
| 隧道 | `enabled` | `true` | 应用默认启用，并在生成时过滤停用隧道；原生 enabled 字段从 0.66 才提供 |
| 隧道 | `transport.useEncryption` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.useCompression` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localIP` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `localPort` | `无默认` | localPort 没有有效官方默认，启用普通后端时必须填正值；8080 是应用新建预设 |
| 隧道 | `remotePort` | `0` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `serverName` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `serverUser` | `空值` | 留空时使用当前连接的 user，不固定用户名或写回命名前缀 |
| 隧道 | `bindAddr` | `127.0.0.1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `bindPort` | `无默认` | bindPort 默认零值无效，必须明确填写正值；STCP/XTCP 的 -1 是可选重定向设置 |
| 隧道 | `secretKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `allowUsers` | `[]` | 空列表仅允许当前 provider 的用户；不等于允许所有用户 |
| 隧道 | `customDomains` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `subdomain` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `metadatas` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `annotations` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.bandwidthLimit` | `空值` | 空值或 0KB/0MB 不限速；不填写具体带宽上限 |
| 隧道 | `transport.bandwidthLimitMode` | `client` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `transport.proxyProtocolVersion` | `空值` | 空值不生成 PROXY 协议头，不是自动选择版本 |
| 隧道 | `loadBalancer.group` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `loadBalancer.groupKey` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.type` | `空值` | 默认不启用健康检查；展示数值默认不会创建或启用 healthCheck |
| 隧道 | `healthCheck.timeoutSeconds` | `3` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.maxFailed` | `1` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.intervalSeconds` | `10` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `healthCheck.path` | `无默认` | HTTP 健康检查必须明确填写路径，没有有效官方默认；健康检查关闭时此字段不生效 |
| 隧道 | `healthCheck.httpHeaders` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `routeByHTTPUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `locations` | `[]` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `responseHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `multiplexer` | `httpconnect` | 官方没有默认，TCPMUX 必须明确指定 httpconnect；应用生成时提供唯一合法预设 |
| 隧道 | `protocol` | `quic` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `keepTunnelOpen` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `maxRetriesAnHour` | `8` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `minRetryInterval` | `90` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTo` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `fallbackTimeoutMs` | `1000` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `natTraversal.disableAssistedAddrs` | `false` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.type` | `空值` | 默认不启用插件；展示插件字段默认不会创建或启用 plugin |
| 隧道 | `plugin.localAddr` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.hostHeaderRewrite` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.requestHeaders.set` | `{}` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.enableHTTP2` | `true` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.crtPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.keyPath` | `空值` | 证书和私钥同时留空时，HTTPS/TLS 插件在进程内生成随机自签证书；不生成文件路径 |
| 隧道 | `plugin.httpUser` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.httpPassword` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.username` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.password` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.localPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |
| 隧道 | `plugin.stripPrefix` | `空值` | 官方默认；保持未指定时由所选 frpc 使用 |
| 隧道 | `plugin.unixPath` | `无默认` | 此字段没有可填入的有效官方默认，需要在启用相关功能时明确设置 |

</details>

## 维护与验证

更新能力表、官方发布列表与 Rust 门槛后，在 `apps/desktop` 用 Node 24 执行 `node scripts/generate-frpc-config-docs.mjs` 重新生成本文件。新增版本先核验固定标签的 Client/Proxy/Visitor/Common/Plugin/ValueSource 定义和默认行为，再执行所选官方二进制校验。

源码基线：[v0.52.0](https://github.com/fatedier/frp/tree/v0.52.0/pkg/config/v1)、[v0.71.0](https://github.com/fatedier/frp/tree/v0.71.0/pkg/config/v1)。验证结果与未完成的真实协议联调边界见 [验证记录](development/verification.md)。
