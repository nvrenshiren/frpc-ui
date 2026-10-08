# 高级配置实现契约（2026-10-08）

用户要求补齐配置清单中的高级能力，同时工作台只展示连接卡片。继续使用官方 frpc 和现有应用模型，不迁移旧存储。

## DTO 与兼容

- Profile / Tunnel 各增加 `advanced` 对象，旧 JSON 缺省为空；TS 可选，make 默认 `{}`；Rust `#[serde(default)] serde_json::Map<String, Value>`。
- `advanced` 是严格校验的官方 frpc 配置扩展，未知键/不适用协议/非法类型必须拒绝，不是任意 TOML 透传。叶子字段遵循 v0.71.0 官方 camelCase 名称与嵌套结构。
- 现有字段仍是唯一基础来源：serverAddr/serverPort/user/authToken/webPort/transport/tls；隧道 name/type/localIP/localPort/remotePort/enabled/secretKey/serverName/encryption/compression 等。advanced 禁止覆盖这些基础字段。
- 连接 advanced：clientID、natHoleStunServer、dnsServer、udpPacketSize、metadatas；auth 内 method（token/oidc）、additionalScopes、oidc、tokenSource；transport 内 wireProtocol、拨号/保活/源地址/代理/连接池/mux/QUIC/心跳及 tls 文件/CA/SNI/首字节；webServer 内 user/password/assetsDir/pprofEnable/tls。
- 应用接管 webServer.addr/port、loginFailExit 和控制台监督日志。外部 includes/store、执行型 TokenSource、VirtualNet 等需要额外来源、平台与执行语义，尚未开放，未知配置明确拒绝；完整范围见 [配置覆盖清单](../frp-configuration-coverage.md)。
- 隧道 advanced：customDomains、subdomain、annotations、metadatas；transport 内 bandwidthLimit/bandwidthLimitMode/proxyProtocolVersion；loadBalancer、healthCheck；HTTP locations/httpUser/httpPassword/hostHeaderRewrite/requestHeaders/responseHeaders/routeByHTTPUser；provider allowUsers；visitor serverUser；XTCP protocol/keepTunnelOpen/maxRetriesAnHour/minRetryInterval/fallbackTo/fallbackTimeoutMs/natTraversal；TCPMUX multiplexer；plugin。
- `advanced.customDomains` 有值时作为完整域名列表，domain 保留首项用于旧显示；仅 subdomain 时 domain 可空。
- Visitor 的负 bindPort 使用 `advanced.bindPort`，仅 STCP/XTCP 接受 -1，现有 localPort 保留一个正值作为基础/编辑兼容；生成端优先 advanced.bindPort。TCP/UDP remotePort=0 表示自动分配，只用于非范围映射。
- 完整 plugin 在 advanced.plugin；旧 https2http 字段继续兼容。新 plugin 设置时 https2http=false，生成去除普通 localIP/localPort。除 Windows 不适用的 virtual_net 外覆盖官方 provider 插件（含 unix_domain_socket 的路径校验）；HTTPS 插件 crtPath/keyPath 可同时缺省，不能只填其中之一。
- 分享 schema2 写入 advanced，仍读取 schema1 与旧原型格式。默认导出移除所有新增凭据（OIDC secret、管理/HTTP/插件密码、groupKey、tokenSource、带凭据的 proxyURL、可能敏感的 metadata/header），包含凭据才完整保留。确保不改变运行配置。
- 选定 frpc 的 `verify` 作为最终兼容校验；扩展先做版本能力检查（例如 wireProtocol/clientID 新字段），空高级值不固化版本默认。
- 输入框与选择控件直接显示已审核的版本默认值。`configDefaults.ts` 解析完整补丁版本与 TCP 复用、用户、TLS 等上下文；未操作的高级项保持省略，版本或上下文改变会更新显示默认，已有明确覆盖不被替换。恢复默认移除覆盖。外部环境、必填目标、运行时生成证书保持对应说明，不以示例填充。

## 模块边界

- `crates/frpc-core`：模型、高级验证、解析/生成、进程监督与凭据脱敏，不依赖 UI 或 Tauri。
- 前端 `model.ts`、`config.ts`、`advancedConfig.ts`：DTO、交换与配置验证，向编辑器提供 `validateProfileAdvanced` / `validateTunnelAdvanced` 和双语 `ConfigError`。
- `configCapabilities.ts`：连接/隧道编辑器、版本库清单与交换校验共用的字段、版本门槛及适用条件；逐版本文档由该表生成。已审核 stable 发布列于 `reviewedFrpcReleases.ts`，Rust 校验保持相同门槛。
- `Editors.tsx`、`AdvancedFields.tsx`：沿用 scoopUI 配色与共享动画 Select，按版本和协议条件组织高级表单。不兼容旧值保留，明确提示，保存前校验。
- `App.tsx`：连接卡片工作台与页面组合；迁移位于 `crates/frpc-versions`，通过宿主组合后再做 core DTO 校验。

## 交付验证

需要编辑、JSON 存储、TOML、分享、旧迁移和真实 frpc verify 全链路。运行中的保存只标待应用，版本/应用操作保护保持。最终 release 必须真实 WebView smoke。
