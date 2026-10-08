# 桌面开发验证记录

更新于 2026-10-09。区分默认代码测试、官方二进制验证、浏览器演示和原生 EXE 检查。参考项目只读；测试使用临时目录、专用回环配置与演示数据，未读取用户凭据或真实旧数据库。本轮为前端默认值显示与清单更新，Rust 未改；Rust 和官方进程验证保留 2026-10-08 的通过记录。

## 当前完成结果

| 检查 | 结果与范围 |
| --- | --- |
| `npm test` | 44 项通过：7 store、28 config、2 browser store、7 configDefaults。 |
| Rust 默认测试 | 最终完整 workspace 45 项通过，5 项 ignored：core 19、versions 25、Tauri IPC 1。 |
| `cargo fmt --all -- --check` | 完整 workspace 通过。 |
| `cargo clippy --workspace --all-targets -- -D warnings` | 最终完整 workspace 通过。 |
| TypeScript / Vite | 最终 release 前端构建通过；编辑器与交换弹窗按需加载，主入口 487.31 kB，gzip 153.28 kB，没有 500 kB chunk 提示。 |
| 官方 0.71.0 配置 | 基础协议/visitor 与 14 份高级 fixtures 均通过实际 verify：完整连接、HTTP/TCPMUX/XTCP、OIDC、文件 Token、QUIC 和九种 provider 插件。 |
| 官方 0.52.0 配置 | SHA-256 校验官方归档并确认版本，11 份基线配置通过 verify；覆盖八种 provider、三种 visitor、七种旧插件、OIDC 与 QUIC。 |
| 官方 TCP/文件 Token 回环 | 2026-10-08 显式通过：实际转发、登录、认证失败、应用重启、禁用恢复、异常退出、停止/shutdown、持久恢复和 Drop 回收。 |
| core 4 个 ignored 测试 | 2026-10-08 全部显式通过。versions 网络安装 ignored 测试此前通过，本轮未重复。 |
| 版本源码审计 | 32 个 stable tag、171 份源码与 142 个配置键/choice；纠正 http2http 最低 0.59，补丁未发现当前支持字段新增/移除。 |
| 最终 Windows release | 构建输出与实际交付副本各一次真实 smoke 通过：打包 WebView 首次快照 IPC、三秒存活、正常 shutdown。 |

前端新增测试覆盖高级 TOML/schema2 往返、旧 schema1/原型分享读取、各版本引入门槛、未审核 minor/major 与非法版本拒绝、协议/角色/插件条件、OIDC/文件来源互斥、全新增凭据过滤不改变原模型、Windows 路径、Header/带宽/代理规则，以及原 500 项与 UTF-8 1 MiB 边界。

Rust 新增测试覆盖 advanced 原子存储、旧 JSON 缺省兼容、完整插件、域名别名规范、门槛拒绝时文件/内存不变、Token 文件有界读取和日志脱敏。迁移测试覆盖高级连接、HTTP 多域名/路由、XTCP 等待/回退、不监听 visitor、远端 0、未知/不适用字段，以及旧完整表单的空域名占位不会误阻止 TCP 迁移。

## 界面检查

2026-10-09 默认值检查：新建连接管理端口为 0，新建 TCP 隧道远端端口为 0；已移除新建入口的自动 7400 分配。未设置字段直接显示数字/开关/枚举默认，0.71 的拨号 10、保活 7200、连接池 1、TCP mux 开启与心跳 -1/-1 已确认。自定义心跳 50 后关闭 mux，50 保留、未修改超时变 90；分别恢复后跟随上下文回 30/90 与 -1/-1。只打开默认组再保存的实际浏览器 TOML 没有自动写入这些高级字段或本机管理表。

健康检查保持关闭，选择 TCP 后展示 3/1/10，恢复默认再次关闭；XTCP visitor 展示 quic、保持关闭、8 次、90 秒和 1000 毫秒。版本清单默认列显示 0.58.1 的保活 30 与补丁差异说明，官方来源链接指向精确审核标签。390px 默认值表单与提示没有对话框/字段横向溢出。默认规则单测覆盖 32 标签及 0.52.1/0.58.0/0.58.1 差异，源码证据见 [默认值审核](frpc-defaults-source-audit.md)。

继续使用 scoopUI 配色和共享 Radix/shadcn 组件。工作台四张服务器卡片、零隧道表格已确认；编辑后的配置只标待应用。版本库清单支持 32 个发布选择、搜索与范围筛选，0.52 不列 http2http/tls2raw，0.71 列九种插件。

连接演示检查：0.71 显示 clientID/wireProtocol/file Token；负保活 -2、连接池 0 和带连续空行的元数据能保存。改为 0.52 后新字段隐藏，原值保留在不兼容摘要；保存被阻止，取消仍保留原 0.71 配置。0.52 保留基础 OIDC 输入，隐藏 OIDC TLS 与文件来源。关联隧道的降级冲突只读提示，不从连接编辑器修改其它记录。

HTTP 演示检查：多域名/通配域名首项同步并锁定基础输入、路径列表、请求/响应 Header 可保存与重新编辑；错误字典保留草稿并阻止保存，改正后成功。九种插件菜单和 HTTPS 插件完整输入已确认，证书/私钥同时省略语义保留；普通本机目标让位给插件参数。实际插件 TLS、OIDC 网络握手不是这项浏览器验证的范围。

1280px 中文深色、860px 英文浅色六页，以及 390px 高级编辑器/版本清单均未发现根页面或对话框横向溢出；密集表格使用独立水平滚动。提示/长键名自然换行，共享菜单动画和主题滚动条保留。最终干净预览控制台 warning/error 为零；恢复中文深色和默认视口，刷新清除测试记录。截图使用浏览器演示数据：

- `.impeccable/review/server-connection-cards.png`
- `.impeccable/review/frpc-version-checklist.png`
- `.impeccable/review/frpc-default-inputs.png`
- `.impeccable/review/frpc-default-checklist.png`

之前已完成共享 Select 的键盘导航、焦点恢复、170ms 入场/110ms 退场与 reduced-motion 检查；配置文件选择按钮、同文件重选、超限错误保留文本/阻止确认、手动编辑恢复与长文件名换行检查。原生系统对话框取消仍未人工验收。

## 当前交付

2026-10-09 默认值更新的最终构建输出与实际交付副本，各一次真实 WebView smoke 通过。`target/release/frpc-ui-desktop.exe`、`artifacts/frpc-ui-0.1.0-windows-x64.exe` 与旧交付路径 `artifacts/frpc-ui-0.1.0-windows-x64-fixed.exe` 为相同的最终产物，均 **10,071,552 字节**。

```text
SHA-256 396F9F6D6CD513898A585AA1D8808DAF575701CB3FB9CE7FEF6B25C5327FBA6C
```

应用版本仍为 0.1.0，Windows x64 开发检查版，未签名，需要本机 WebView2。产物与本机 QA 截图位于忽略目录，源代码/能力清单/验证文档随仓库维护；尚未提交、推送或发布，远端 CI 没有运行结果。

首版 release 闪退曾由异步状态中的 64 KiB 栈数组引起；已改用堆 Vec，保留 future 大小防回归测试与真实 release smoke，不增加 PE 栈 reserve。详情见 [Windows 启动说明](windows-startup.md)。

## 验收边界

未完成所有历史二进制/协议/插件的真实流量端到端验证；实际数据面当前为 TCP 回环。原生窗口/托盘/系统启动、完整原生配置编辑/下载/剪贴板、NSIS 安装升级/签名及 macOS/Linux 未完整人工验收。浏览器演示不能代替原生 GUI，MockRuntime 不能代替 WebView；本轮 smoke 只证明最终发行启动、IPC 与退出路径。

执行型 TokenSource、外部 includes/Store、VirtualNet/featureGates、全局 start 与自由日志策略未开放。所选实际 frpc verify 是最后一道配置兼容检查，不代表所有外部文件存在、TLS/OIDC 握手成功或远端配置正确。详见 [覆盖清单](../frp-configuration-coverage.md)和 [逐版本清单](../frpc-version-configuration.md)。

## 可复现命令

在 `apps/desktop`：

```powershell
npm ci
npm test
npm run build
node scripts/generate-frpc-config-docs.mjs
npm run desktop:build:exe
npm run test:desktop:smoke
npm run test:desktop:smoke -- ../../artifacts/frpc-ui-0.1.0-windows-x64.exe
```

仓库根目录：

```powershell
cargo fmt --all -- --check
cargo test --workspace
cargo clippy --workspace --all-targets -- -D warnings
```

官方进程检查使用调用者已校验的二进制，测试仅访问回环网络：

```powershell
$env:FRPC_TEST_BINARY = 'D:\path\to\verified\0.71.0\frpc.exe'
$env:FRPS_TEST_BINARY = 'D:\path\to\verified\0.71.0\frps.exe'
$env:FRPC_TEST_LEGACY_BINARY = 'D:\path\to\verified\0.52.0\frpc.exe'
cargo test -p frpc-core -- --ignored --nocapture
```

官方版本下载安装测试需要公网，单独执行：

```powershell
cargo test -p frpc-versions official_network_install_roundtrip -- --ignored --nocapture
```
