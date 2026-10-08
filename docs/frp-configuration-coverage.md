# frpc 配置覆盖清单

核验日期：2026-10-08。连接、隧道、访问者与九种适用的 provider 插件高级参数已贯通模型、表单、保存、TOML 导入导出、分享和旧项目迁移。界面依据所选版本、协议、角色、认证方式与插件类型显示参数。逐字段和逐版本清单见 [32 个官方稳定版本的配置清单](frpc-version-configuration.md)，源码核验见 [版本源码审计](development/frpc-version-source-audit.md)。

## 基线与状态

官方基线为 [frp v0.71.0](https://github.com/fatedier/frp/releases/tag/v0.71.0)，历史版本固定核对 0.52–0.71 的官方 tag。参考结构：[Client](https://github.com/fatedier/frp/blob/v0.71.0/pkg/config/v1/client.go)、[Proxy](https://github.com/fatedier/frp/blob/v0.71.0/pkg/config/v1/proxy.go)、[Visitor](https://github.com/fatedier/frp/blob/v0.71.0/pkg/config/v1/visitor.go)、[Common](https://github.com/fatedier/frp/blob/v0.71.0/pkg/config/v1/common.go)、[Plugin](https://github.com/fatedier/frp/blob/v0.71.0/pkg/config/v1/proxy_plugin.go)、[ValueSource](https://github.com/fatedier/frp/blob/v0.71.0/pkg/config/v1/value_source.go)。已实现不等于所有历史版本或所有协议组合均做过真实流量验收；运行前仍由实际选中的二进制执行 verify。

| 状态 | 含义 |
| --- | --- |
| 已实现 | 模型、编辑器、严格校验、保存和配置交换都能表达该能力。 |
| 应用管理 | 为确保进程监督和本机管理，应用固定或转换官方行为。 |
| 尚未开放 | UI 不显示编辑控件，导入明确拒绝，避免静默丢失。 |
| 平台限制 | 官方或操作系统限制，区别于已实现但尚未端到端联调。 |

高级字段保存于向后兼容的 `advanced` 对象，按官方字段结构严格白名单校验，不能覆盖基础字段。未知字段和不适用的字段明确报错。未填写的高级数字/布尔值不固化到 TOML，由对应 frpc 版本采用默认值；0、false 和负值的有效语义会保留。

## 服务器连接

| 配置 | 状态与条件 |
| --- | --- |
| `serverAddr`、`serverPort`、`user` | 已实现；IP/hostname 校验，IPv6 方括号输入规范成裸地址。 |
| `clientID` | 已实现，0.67 起。 |
| `natHoleStunServer`、`dnsServer`、`udpPacketSize`、`metadatas` | 已实现，UDP 包长保留官方 0 的未指定语义。 |
| `auth.method`、`auth.token`、`auth.additionalScopes` | 已实现 token/oidc，HeartBeats/NewWorkConns；无 Token 时可留空。 |
| `auth.tokenSource.type/file.path` | 已实现文件来源，0.64 起；需要绝对 Windows 文件路径，与直接 Token 互斥。 |
| `auth.oidc.clientID/clientSecret/audience/scope/tokenEndpointURL/additionalEndpointParams` | 已实现；客户端参数与 OIDC Token 文件来源互斥。 |
| `auth.oidc.trustedCaFile/insecureSkipVerify/proxyURL` | 已实现，0.65 起。 |
| `auth.oidc.tokenSource.type/file.path` | 已实现文件来源，0.66 起。 |
| `transport.protocol` | 已实现 tcp/kcp/quic/websocket/wss。 |
| `transport.wireProtocol` | 已实现 v1/v2，0.69 起；服务端须支持对应协议。 |
| `transport.dialServerTimeout/dialServerKeepalive/poolCount/tcpMux/tcpMuxKeepaliveInterval/heartbeatInterval/heartbeatTimeout` | 已实现；负 TCP 保活/心跳值的禁用语义保留。 |
| `transport.connectServerLocalIP/proxyURL` | 已实现 TCP/WebSocket/WSS，KCP/QUIC 不适用；代理支持 HTTP/HTTPS/SOCKS5。NTLM 尚未开放。 |
| `transport.quic.keepalivePeriod/maxIdleTimeout/maxIncomingStreams` | 已实现，仅 QUIC 显示。 |
| `transport.tls.enable/certFile/keyFile/trustedCaFile/serverName/disableCustomTLSFirstByte` | 已实现；证书和密钥成对或同时省略。 |
| `webServer.port/user/password/assetsDir/pprofEnable/tls.certFile/keyFile/trustedCaFile/serverName` | 已实现；端口 0 关闭管理服务，多个关闭连接不冲突；管理鉴权/HTTPS 仅在管理端口启用时显示。 |
| `webServer.addr` | 应用管理，固定 127.0.0.1。 |
| `loginFailExit`、`log.to/level/disablePrintColor` | 应用管理，false、console、info、无色输出；确保登录/注册状态采集。 |

## 隧道与访问者

| 协议/功能 | 已实现配置与条件 |
| --- | --- |
| 通用 provider | name/type/localIP/localPort、加密压缩、metadatas、annotations（0.55 起）、带宽限制/限流位置、Proxy Protocol。 |
| 负载均衡 | `loadBalancer.group/groupKey`；只适用 TCP/HTTP/HTTPS/TCPMUX。 |
| 健康检查 | type/timeoutSeconds/maxFailed/intervalSeconds/path；HTTP 探测 Header 从 0.56 起。 |
| TCP/UDP | 单端口或等长范围；单映射 remotePort=0 自动分配，0 不用于范围。 |
| HTTP | 完整 customDomains 数组、通配域名、仅 subdomain 模式、locations、httpUser/httpPassword、hostHeaderRewrite、requestHeaders.set、routeByHTTPUser；responseHeaders.set 从 0.58 起。 |
| HTTPS | 多域名/subdomain 与插件；普通透传不开放 HTTP 专用路径和 Header 操作。 |
| STCP/SUDP | provider 的 secretKey/allowUsers；visitor 的 serverName/serverUser/bindAddr/bindPort 和加密压缩。密钥可空但双方需匹配。 |
| XTCP | 上述私有参数；provider/visitor 的 natTraversal.disableAssistedAddrs 从 0.65 起；visitor 的 protocol、keepTunnelOpen、maxRetriesAnHour、minRetryInterval、fallbackTo、fallbackTimeoutMs。 |
| STCP/XTCP visitor | bindPort=-1 可关闭监听，用于接收其它 visitor 回退；SUDP 不支持此模式。 |
| TCPMUX | multiplexer=httpconnect、customDomains/subdomain、HTTP 鉴权和 routeByHTTPUser，以及适用通用 provider 配置。 |
| 启用状态 | 应用 enabled 管理；导入可消费单条 enabled，生成和 TOML 导出剔除停用项；不会向旧二进制写入其不认识的 enabled。分享保留启用状态。 |

工作台只显示服务器连接卡片与基本状态。隧道表格集中在隧道页，并正确显示自动远端端口、不监听 visitor、多域名和插件目标。

## Provider 插件

插件用于流式 provider，不向 UDP/SUDP 或 visitor 开放。选择插件后配置由插件处理目标，生成时移除普通 localIP/localPort。均包含 type。

| 插件 | 已实现专用字段 | 最低版本 |
| --- | --- | --- |
| http2https | localAddr、hostHeaderRewrite、requestHeaders.set | 0.52 |
| http2http | localAddr、hostHeaderRewrite、requestHeaders.set | 0.59 |
| https2http / https2https | localAddr、crtPath、keyPath、hostHeaderRewrite、requestHeaders.set；enableHTTP2 从 0.59 起 | 0.52 |
| tls2raw | localAddr、crtPath、keyPath | 0.60 |
| http_proxy | httpUser、httpPassword | 0.52 |
| socks5 | username、password | 0.52 |
| static_file | localPath、stripPrefix、httpUser、httpPassword | 0.52 |
| unix_domain_socket | unixPath | 0.52 |

HTTPS 插件的证书和私钥可同时省略，使用官方自动随机自签证书；不能只填写一个，不将此功能误称为 ACME。Unix socket 路径和实际目标可用性仍须在 Windows 上验证，不能仅因名称而断言现代 Windows 永远不支持。旧 https2http 字段继续兼容，新高级插件为单一配置来源。

## 明确未开放的官方配置

| 字段/功能 | 边界 |
| --- | --- |
| exec TokenSource | 需要额外 unsafe 启动授权与外部执行归属，本轮不开放，仅实现 file 来源。 |
| `includes` | 外部代理文件的归属与动态同步尚未设计，导入拒绝。 |
| `store.path` | 官方运行时 Store 与本应用 JSON 存储不同，尚未同步。 |
| `featureGates`、`virtualNet.address`、provider/visitor `virtual_net` | 未开放；官方 VirtualNet 还存在 Linux/macOS/TUN 平台限制。 |
| `start` | 官方全局名称筛选尚未映射；应用通过隧道 enabled 管理。 |
| `log.maxDays`、其它日志级别/目的地 | 当前受管 console/info 日志不能等价开放文件留存；需先解耦状态采集。 |
| API 元数据 `version` | 不是二进制版本选择字段，尚未开放原文往返。 |
| NTLM 代理 | 本轮只开放已核对的 HTTP/HTTPS/SOCKS5。 |

## 交换、迁移与验证

分享 schema2 保存 advanced，继续读取 schema1 与此前原型格式。默认导出移除 Token、OIDC 密钥、HTTP/管理/插件凭据、负载均衡密钥、文件认证来源、带认证的代理 URL，以及可能敏感的 Header/元数据。不修改原记录或正在运行的配置。仅依赖 OIDC 文件 Token 的配置在移除来源后无法表达有效认证，因此明确提示包含凭据或补齐 OIDC 参数，不偷偷改成 Token 认证。

TOML 仅包含启用项，范围展开为标准独立代理，无法无损恢复原范围分组和停用状态；分享链接可以保留。单次交换仍为 500 项与 UTF-8 1 MiB。证书、文件来源和目录只是路径引用，导入不复制文件，实际 frpc 负责校验；浏览器不会声称检查过本机文件。

旧 NeDB 迁移只读预览，保留支持的高级参数、完整域名、HTTP 路由、XTCP 回退/原等待时长、负 visitor 端口和远端 0。不兼容/未知/非默认不适用配置阻止导入；确认重新检查指纹并通过领域校验。不会启用旧自动连接或系统启动设置，不覆盖源数据。

代码入口：[Rust 配置与校验](../crates/frpc-core/src/config.rs)、[Rust 高级模型校验](../crates/frpc-core/src/advanced.rs)、[前端能力表](../apps/desktop/src/configCapabilities.ts)、[配置交换](../apps/desktop/src/config.ts)、[高级表单](../apps/desktop/src/components/AdvancedFields.tsx)、[旧数据迁移](../crates/frpc-versions/src/migration.rs)。默认测试、固定官方二进制 verify、TCP/文件 Token 实际闭环、浏览器和最终 EXE smoke 结果见 [验证记录](development/verification.md)。
