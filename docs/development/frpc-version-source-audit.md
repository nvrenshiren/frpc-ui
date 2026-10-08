# frpc 版本能力源码审核（2026-10-08）

已复核清单中的 **32 个官方 stable tag、20 个 minor（0.52–0.71）**。审核对象是本应用支持的配置能力，不是官方全部功能或全部版本的端到端测试。[版本索引](../../apps/desktop/src/reviewedFrpcReleases.ts)与[字段清单](../../apps/desktop/src/configCapabilities.ts)是展示入口，Rust 在生成配置前执行相同门槛，随后仍运行所选二进制的 `frpc verify -c`。

## 方法与基线

逐 tag 读取 `pkg/config/v1/client.go`、`common.go`、`proxy.go`、`visitor.go`，以及旧版 `plugin.go` / 新版 `proxy_plugin.go`；0.64 以后补读 `value_source.go`。共核对 171 份固定标签源码，以完整 JSON 路径、嵌入结构和精确插件注册常量对比，避免把 `HTTP2HTTPS` 当作 `HTTP2HTTP`。142 个清单条目中，126 个字段或插件选项逐项核对首次出现标签；15 个协议/认证选项检查基线注册；`enabled` 单独按应用语义处理。

0.52 已具备基础连接、Token/OIDC、传输拨号/保活/代理/连接池/mux/心跳、QUIC、TLS、本机管理；五种连接传输 `tcp/kcp/quic/websocket/wss`；八种 provider `tcp/udp/http/https/stcp/sudp/xtcp/tcpmux`、三种 visitor，以及私有访问权限、域名、HTTP 路由/请求头、限流、负载均衡、健康检查和 XTCP 回退字段。[client.go](https://raw.githubusercontent.com/fatedier/frp/v0.52.0/pkg/config/v1/client.go)、[common.go](https://raw.githubusercontent.com/fatedier/frp/v0.52.0/pkg/config/v1/common.go)、[proxy.go](https://raw.githubusercontent.com/fatedier/frp/v0.52.0/pkg/config/v1/proxy.go)、[visitor.go](https://raw.githubusercontent.com/fatedier/frp/v0.52.0/pkg/config/v1/visitor.go)。

0.52 的 provider 插件为七种：`http2https/https2http/https2https/http_proxy/socks5/static_file/unix_domain_socket`。`http2http` 的精确注册首次出现在 0.59，0.58.1 仍未提供；已修正 TS 清单与 Rust 门槛，并增加上下界用例。[0.52 plugin.go](https://raw.githubusercontent.com/fatedier/frp/v0.52.0/pkg/config/v1/plugin.go)、[0.58.1 plugin.go](https://raw.githubusercontent.com/fatedier/frp/v0.58.1/pkg/config/v1/plugin.go)、[0.59 plugin.go](https://raw.githubusercontent.com/fatedier/frp/v0.59.0/pkg/config/v1/plugin.go)。

## 支持字段的新增门槛

表中“新增”仅指本应用支持项；各门槛均对比前一个已发布标签的缺失和该标签的声明/注册。

| 首次版本 | 新增支持项 | 固定源码 |
| --- | --- | --- |
| 0.55.0 | `annotations` | [proxy.go](https://raw.githubusercontent.com/fatedier/frp/v0.55.0/pkg/config/v1/proxy.go) |
| 0.56.0 | `healthCheck.httpHeaders` | [proxy.go](https://raw.githubusercontent.com/fatedier/frp/v0.56.0/pkg/config/v1/proxy.go) |
| 0.58.0 | `responseHeaders.set` | [proxy.go](https://raw.githubusercontent.com/fatedier/frp/v0.58.0/pkg/config/v1/proxy.go) |
| 0.59.0 | `plugin.type=http2http`、HTTPS 插件 `enableHTTP2` | [plugin.go](https://raw.githubusercontent.com/fatedier/frp/v0.59.0/pkg/config/v1/plugin.go) |
| 0.60.0 | `plugin.type=tls2raw` | [plugin.go](https://raw.githubusercontent.com/fatedier/frp/v0.60.0/pkg/config/v1/plugin.go) |
| 0.64.0 | `auth.tokenSource` 文件来源及 `type/file.path` | [client.go](https://raw.githubusercontent.com/fatedier/frp/v0.64.0/pkg/config/v1/client.go)、[value_source.go](https://raw.githubusercontent.com/fatedier/frp/v0.64.0/pkg/config/v1/value_source.go) |
| 0.65.0 | OIDC `trustedCaFile/insecureSkipVerify/proxyURL`、XTCP `natTraversal.disableAssistedAddrs` | [client.go](https://raw.githubusercontent.com/fatedier/frp/v0.65.0/pkg/config/v1/client.go)、[proxy.go](https://raw.githubusercontent.com/fatedier/frp/v0.65.0/pkg/config/v1/proxy.go)、[visitor.go](https://raw.githubusercontent.com/fatedier/frp/v0.65.0/pkg/config/v1/visitor.go) |
| 0.66.0 | `auth.oidc.tokenSource` 文件来源及 `type/file.path` | [client.go](https://raw.githubusercontent.com/fatedier/frp/v0.66.0/pkg/config/v1/client.go) |
| 0.67.0 | 顶层 `clientID`；OIDC 的同名字段从 0.52 已有 | [client.go](https://raw.githubusercontent.com/fatedier/frp/v0.67.0/pkg/config/v1/client.go) |
| 0.69.0 | `transport.wireProtocol` | [client.go](https://raw.githubusercontent.com/fatedier/frp/v0.69.0/pkg/config/v1/client.go) |

0.53、0.54、0.57、0.61–0.63、0.68、0.70、0.71 没有新增本应用当前支持的字段或插件类型。官方原生 `enabled` 于 0.66 出现；应用的启用开关在生成时过滤隧道，始终不向 TOML 写出该字段，因此应用清单标为 0.52。外部 includes、执行型来源、VirtualNet/featureGates、store 等保持明确拒绝，不因源码中存在而宣布应用支持。

## 补丁与验证边界

逐项比较 12 个补丁标签：0.52.1/2/3、0.53.2、0.55.1、0.58.1、0.61.1/2、0.62.1、0.68.1、0.69.1、0.70.1。未发现当前支持字段或 provider 插件类型的新增/移除。0.52.1 的服务端 HTTP 插件 `tls_verify → tlsVerify` 命名变化不属于本应用 provider 插件范围。补丁清单仍标注为继承同 minor，不能将此源码比较写成逐版本二进制联调。默认值或运行实现可能变化；未填写的高级字段保持省略，由所选 frpc 决定默认。

真实二进制检查已覆盖官方 **0.52.0** 与 **0.71.0**，没有下载/联调其余 30 个版本。0.52.0 Windows amd64 资产经[官方 SHA-256 清单](https://github.com/fatedier/frp/releases/download/v0.52.0/frp_sha256_checksums.txt)校验，归档 SHA-256 为 `5953e84b6a1590568b6d77a0b75093552577aa61484aff41b3ad0fb35c68719f`；测试同时读取 `frpc -v` 确认为 0.52.0。

- 0.52.0：11 份生成配置通过 `verify`，包含基线高级配置、全部八种 provider/三种 visitor、七种旧插件、OIDC 与 QUIC；同时确认 0.58.1 配置不能生成 `http2http`。
- 0.71.0：14 份高级配置及原协议配置通过 `verify`；受控本机 TCP/frps 联调覆盖登录、文件令牌认证、应用重启、停用恢复、异常退出、持久恢复和 Drop 清理。
- Rust 门槛测试检查引入版本前后的拒绝/接受；未知格式、低于 0.52、未来 minor/major 均明确拒绝，不推定兼容。

新增忽略测试入口为 `cargo test -p frpc-core --test advanced official_frpc_verifies_reviewed_052_baseline -- --ignored --nocapture`，需将 `FRPC_TEST_LEGACY_BINARY` 指向调用者已校验的官方 0.52.0 `frpc.exe`。源码审核不能代替 TLS/OIDC 网络握手、Unix socket 和全部协议的端到端检查。
