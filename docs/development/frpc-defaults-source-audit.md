# frpc 官方默认值源码审计

审核日期：2026-10-09。范围为 [reviewedFrpcReleases.ts](../../apps/desktop/src/reviewedFrpcReleases.ts) 中的 32 个官方 stable 标签：0.52.0、0.52.1、0.52.2、0.52.3、0.53.0、0.53.2、0.54.0、0.55.0、0.55.1、0.56.0、0.57.0、0.58.0、0.58.1、0.59.0、0.60.0、0.61.0、0.61.1、0.61.2、0.62.0、0.62.1、0.63.0、0.64.0、0.65.0、0.66.0、0.67.0、0.68.0、0.68.1、0.69.0、0.69.1、0.70.0、0.70.1、0.71.0。

逐标签对比 `pkg/config/v1/{client,common,proxy,visitor,plugin/proxy_plugin}.go` 中的结构、零值、`Complete()`，再核对健康检查、TLS、连接器、OIDC 与私有访问权限的运行时回退。`plugin.go` 后来更名为 `proxy_plugin.go`；0.52.x 的连接器代码在 `client/service.go`，0.53 起在 `client/connector.go`。表中“全部版本”指字段存在的已审核版本；新增字段仍需先经过 [配置能力清单](../../apps/desktop/src/configCapabilities.ts) 的版本和协议/角色/插件/认证限制。

这是 32 个固定标签的源码审核。已有真实二进制配置验证范围为 0.52.0 与 0.71.0，真实 TCP 数据面闭环为 0.71.0；不能据此声称其它 30 个二进制或所有 TLS/OIDC/插件数据面均已联调。历史配置能力审核见 [frpc-version-source-audit.md](frpc-version-source-audit.md)。

## 补丁与上下文变化

| 字段 | 已核验规则 | 固定标签证据 |
| --- | --- | --- |
| `natHoleStunServer` | 0.52.0 为空且运行时没有隐藏回退；0.52.1 起为 `stun.easyvoip.com:3478` | [0.52.0 ClientCommonConfig.Complete](https://github.com/fatedier/frp/blob/v0.52.0/pkg/config/v1/client.go)、[0.52.1](https://github.com/fatedier/frp/blob/v0.52.1/pkg/config/v1/client.go)、[0.52.0 XTCP provider](https://github.com/fatedier/frp/blob/v0.52.0/client/proxy/xtcp.go)、[STUN Discover](https://github.com/fatedier/frp/blob/v0.52.0/pkg/nathole/discovery.go) |
| `transport.tcpMuxKeepaliveInterval` | 0.52.0–0.58.0 为 60 秒；0.58.1 起为 30 秒 | [0.58.0 ClientTransportConfig.Complete](https://github.com/fatedier/frp/blob/v0.58.0/pkg/config/v1/client.go)、[0.58.1](https://github.com/fatedier/frp/blob/v0.58.1/pkg/config/v1/client.go) |
| `transport.heartbeatInterval/Timeout` | 0.52–0.57 为 30/90 秒；0.58.0 起在 `tcpMux=true` 时均为 -1，停用应用层心跳；`tcpMux=false` 时仍为 30/90 秒 | [0.57.0](https://github.com/fatedier/frp/blob/v0.57.0/pkg/config/v1/client.go)、[0.58.0](https://github.com/fatedier/frp/blob/v0.58.0/pkg/config/v1/client.go) |
| `plugin.enableHTTP2` | 字段从 0.59.0 出现；省略时为 true，显式 false 保留 | [0.59.0 插件 Complete](https://github.com/fatedier/frp/blob/v0.59.0/pkg/config/v1/plugin.go)、[0.71.0](https://github.com/fatedier/frp/blob/v0.71.0/pkg/config/v1/proxy_plugin.go) |
| `transport.wireProtocol` | 字段从 0.69.0 出现；默认为 `v1` | [0.69.0 ClientTransportConfig.Complete](https://github.com/fatedier/frp/blob/v0.69.0/pkg/config/v1/client.go) |

未列出的合法同 minor 补丁仍继承配置能力。默认 API 选择不高于该补丁的最近已审核同 minor 标签，返回 `audited=false`、`sourceVersion` 和明确的继承说明；不会声称未读取过的补丁标签已审核。例如 0.53.1 继承 0.53.0，0.58.99 继承 0.58.1。未知 major/minor 不推定默认或兼容性。

## 稳定的可显示值

以下规则逐标签无变化。空字符串、空数组、空字典表示没有额外设置；它们与不存在的必填默认分开处理。读取子字段默认不会创建或启用父对象。

| 范围 | 字段与默认值 | 语义及来源 |
| --- | --- | --- |
| 基础连接 | `serverAddr=0.0.0.0`、`serverPort=7000`、`udpPacketSize=1500` | `ClientCommonConfig.Complete`，不是推测的 loopback 地址：[0.52.0](https://github.com/fatedier/frp/blob/v0.52.0/pkg/config/v1/client.go)、[0.71.0](https://github.com/fatedier/frp/blob/v0.71.0/pkg/config/v1/client.go) |
| 传输 | `protocol=tcp`、`dialServerTimeout=10` 秒、`dialServerKeepalive=7200` 秒、`poolCount=1`、`tcpMux=true` | 同上 `ClientTransportConfig.Complete`；源 IP 空值由系统选择 |
| TLS | `enable=true`、`disableCustomTLSFirstByte=true`，证书/私钥/CA 路径为空 | 同上 `TLSClientConfig.Complete`；显示路径空值不启用文件配置 |
| QUIC | `keepalivePeriod=10` 秒、`maxIdleTimeout=30` 秒、`maxIncomingStreams=100000` | [0.52.0 QUICOptions.Complete](https://github.com/fatedier/frp/blob/v0.52.0/pkg/config/v1/common.go)、[0.71.0](https://github.com/fatedier/frp/blob/v0.71.0/pkg/config/v1/common.go) |
| 本机管理 | `addr=127.0.0.1`、`port=0`、`pprofEnable=false`，用户名/密码/资源目录为空 | `port=0` 不启动管理服务；空资源目录使用内嵌资源，同上 `WebServerConfig` |
| 认证 | `method=token`，token、OIDC clientSecret/audience/scope 为空，额外 scopes 为 `[]`、端点参数为 `{}`；OIDC `insecureSkipVerify=false` | [0.52.0 AuthClientConfig](https://github.com/fatedier/frp/blob/v0.52.0/pkg/config/v1/client.go)、[0.71.0](https://github.com/fatedier/frp/blob/v0.71.0/pkg/config/v1/client.go)；OIDC TLS 子字段从 0.65 起才提供 |
| Provider | `localIP=127.0.0.1`、`remotePort=0`、加密/压缩为 false、`bandwidthLimitMode=client` | 远程单映射 0 表示服务端分配端口；空带宽限制/0KB/0MB 表示不限速；空 PROXY 协议版本不发送 PROXY 头：[0.52.0 ProxyBaseConfig](https://github.com/fatedier/frp/blob/v0.52.0/pkg/config/v1/proxy.go)、[0.71.0](https://github.com/fatedier/frp/blob/v0.71.0/pkg/config/v1/proxy.go) |
| Visitor | `bindAddr=127.0.0.1`；XTCP `protocol=quic`、`keepTunnelOpen=false`、`maxRetriesAnHour=8`、`minRetryInterval=90` 秒、`fallbackTimeoutMs=1000` 毫秒，fallbackTo 为空 | [0.52.0 Visitor.Complete](https://github.com/fatedier/frp/blob/v0.52.0/pkg/config/v1/visitor.go)、[0.71.0](https://github.com/fatedier/frp/blob/v0.71.0/pkg/config/v1/visitor.go) |
| 健康检查 | `type` 空值为关闭；启用后 `timeoutSeconds=3`、`maxFailed=1`、`intervalSeconds=10` | 运行时 `NewMonitor` 将非正数回退到这三个值，32 标签均核对：[0.52.0](https://github.com/fatedier/frp/blob/v0.52.0/client/health/health.go)、[0.71.0](https://github.com/fatedier/frp/blob/v0.71.0/client/health/health.go)；HTTP path 没有可填入的有效默认 |
| 插件与可选项 | plugin.type 空值为关闭；可选 Header/map 为 `{}`，locations/customDomains/httpHeaders 为 `[]`，可选字符串为空 | 不因默认展示激活 plugin/healthCheck/auth 子功能；必需的插件目标/目录/socket 路径仍没有默认 |

## 动态和环境默认

| 字段 | 行为 | 固定标签证据 |
| --- | --- | --- |
| `transport.proxyURL` | 默认取 **frpc 子进程**的 `http_proxy` 环境变量；前端没有可靠环境值，显示“由环境决定” | [0.52.0 ClientTransportConfig.Complete](https://github.com/fatedier/frp/blob/v0.52.0/pkg/config/v1/client.go)、[0.71.0](https://github.com/fatedier/frp/blob/v0.71.0/pkg/config/v1/client.go) |
| `dnsServer` | 空值使用操作系统 DNS，不虚构 DNS IP | 同上 `ClientCommonConfig` |
| `transport.tls.serverName` | 空值时连接器使用当前 serverAddr；展示这个上下文回退不保存覆盖 | [0.52.0 service.go](https://github.com/fatedier/frp/blob/v0.52.0/client/service.go)、[0.71.0 connector.go](https://github.com/fatedier/frp/blob/v0.71.0/client/connector.go)，32 标签逐一核对 |
| `transport.tls.trustedCaFile` | 默认空路径；frpc TLS 客户端此时跳过服务器证书验证，配置 CA 后启用验证 | [0.52.0 NewClientTLSConfig](https://github.com/fatedier/frp/blob/v0.52.0/pkg/transport/tls.go)、[0.71.0](https://github.com/fatedier/frp/blob/v0.71.0/pkg/transport/tls.go)，32 标签逐一核对 |
| `auth.oidc.proxyURL` | 默认空；没有专用 TLS/代理选项时沿用默认 HTTP 客户端的环境代理。启用 OIDC 自定义 CA/跳过验证后，空专用 proxyURL 则明确关闭代理 | [0.65.0 NewOidcAuthSetter](https://github.com/fatedier/frp/blob/v0.65.0/pkg/auth/oidc.go)、[0.71.0](https://github.com/fatedier/frp/blob/v0.71.0/pkg/auth/oidc.go)，全部 0.65+ 标签逐一核对 |
| `serverUser` | 空值动态使用当前连接 user；0.68 起命名前缀从 Complete 移到运行时，不能写回表单 | [0.52.0 visitor.go](https://github.com/fatedier/frp/blob/v0.52.0/pkg/config/v1/visitor.go)、[0.71.0](https://github.com/fatedier/frp/blob/v0.71.0/pkg/config/v1/visitor.go) |
| `allowUsers` | 空数组只允许当前 provider 的用户，不能展示成 `['*']` 或写入具体用户名 | [0.52.0 STCP](https://github.com/fatedier/frp/blob/v0.52.0/server/proxy/stcp.go)、[0.71.0 shared helper](https://github.com/fatedier/frp/blob/v0.71.0/server/proxy/proxy.go)，STCP/SUDP/XTCP 各标签运行代码已核对 |
| HTTPS/TLS 插件 `crtPath/keyPath` | 两者均空时，在进程内生成随机自签证书，没有可填入的默认文件路径；tls2raw 从 0.60 起提供 | [0.52.0 https2http](https://github.com/fatedier/frp/blob/v0.52.0/pkg/plugin/client/https2http.go)、[0.71.0 HTTPS server](https://github.com/fatedier/frp/blob/v0.71.0/pkg/plugin/client/internal/httpsserver/server.go)、[NewServerTLSConfig](https://github.com/fatedier/frp/blob/v0.71.0/pkg/transport/tls.go) |

## 应用接管与必填边界

| 字段 | 应用显示/生成 | 官方差异 |
| --- | --- | --- |
| `loginFailExit` | false，保持可监督的登录重试 | 官方默认 true |
| `log.to/level/disablePrintColor` | console/info/true | 官方 console/info/false；应用固定无色日志便于状态识别和脱敏 |
| `webServer.addr` | 固定 127.0.0.1 | 与官方默认一致，本机安全边界由应用接管 |
| TCPMUX `multiplexer` | 应用生成时提供 httpconnect，表单显示应用预设 | **官方没有默认**，validator 要求明确 httpconnect：[0.71.0 ValidateTCPMuxProxyConfig](https://github.com/fatedier/frp/blob/v0.71.0/pkg/config/v1/validation/proxy.go) |
| 隧道 `type` / `enabled` | 新建 TCP/启用；停用隧道不生成 | type 官方必填；原生 enabled 字段从 0.66 起默认 true，旧版本由应用过滤实现 |
| 新建普通 `localPort` | 8080 为应用预设 | 零值不能充当有效后端默认，不显示成官方 0 |
| 新建连接/管理/远程端口 | serverAddr 0.0.0.0、serverPort 7000、webPort 0、remotePort 0 | 本轮只修正新建工厂，已有与导入的显式值保持原值 |
| Token source 类型 | 显式启用时应用仅提供 file | 来源默认没有启用，路径无默认，不为展示创建 source 对象 |

`name`、visitor `serverName/bindPort`、普通后端 `localPort`、HTTP health path、OIDC `clientID/tokenEndpointURL`、source 文件路径以及插件目标/目录/socket 路径没有可用默认。API 返回 `hasDefault=false`，避免把缺失的零值或空字符串误当作推荐配置。

## API 与验证

[configDefaults.ts](../../apps/desktop/src/configDefaults.ts) 提供纯函数 `getConfigDefault(version, key, scope, context)`；返回 `hasDefault/value/kind/reasonZh/reasonEn/officialValue/audited/sourceVersion`。`kind` 区分固定、上下文、环境、应用接管和无可用默认。`formatConfigDefault` 为 UI/文档提供同一简短值表示。数组/字典返回独立副本，调用方改动不会污染后续查找。

默认展示与运行配置省略分开：未指定的 advanced 字段仍不写 JSON/TOML；恢复默认删除 override；版本/上下文切换只改变展示回退。显式 0、false 和其它合法值保留为用户输入。`Complete()` 对特定零值的替换语义由所选官方二进制执行，不因展示而改变。

验证：独立 `configDefaults.test.mjs` 7 项，覆盖完整 32 标签矩阵、补丁边界、mux 上下文、0/false/空集合、必填项、环境/应用来源、版本/协议/插件限制、未审核补丁标记与副本隔离；`config.test.mjs` 另验证默认查询不会写入配置、schema2 缺省、显式值往返及新建工厂 override。2026-10-09 `npm test` 共 44 项通过，TypeScript 检查通过。
