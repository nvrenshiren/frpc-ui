# frpc-ui

[English](README.en.md)

使用 **Tauri 2 + Rust + React** 的多连接 frpc 桌面管理工作台。界面遵循 COHESION 逐科设计系统，面向高密度隧道检索与批量维护；技术栈采用 scoopUI 项目验证过的 React 生态。

真实桌面实现位于 `apps/desktop`；`prototypes/frpc-ui` 仅作历史设计原型。应用管理官方 frpc 二进制，不重写 frp 协议。Windows x64 发布、验证范围与未覆盖的验收见[验证记录](docs/development/verification.md)。

## 运行桌面应用

Windows x64 下载见 [GitHub Releases](https://github.com/nvrenshiren/frpc-ui/releases)：提供直接运行的 EXE、NSIS 安装包和 SHA-256 校验清单。每次推送 `main` 自动编译并发布预发布版；`vX.Y.Z` 标签发布正式版。全部测试及真实启动检查通过后才发布，详见[自动发布说明](docs/development/releases.md)和 [Actions](https://github.com/nvrenshiren/frpc-ui/actions/workflows/ci.yml)。当前产物未签名，应用内自动更新尚未实现。

开发环境使用 Node.js 24、npm、Rust MSVC 工具链（MSRV 1.90）、Microsoft C++ Build Tools 与 WebView2。系统依赖安装方法见 [Tauri 官方说明](https://v2.tauri.app/start/prerequisites/#windows)。

```powershell
cd apps/desktop
npm ci
npm run desktop:dev
```

Tauri 会启动 Vite 并打开本机桌面窗口。构建命令：

```powershell
npm run desktop:build:exe
npm run test:desktop:smoke
```

该命令编译前端与 Rust，仅生成 exe，不生成安装包。默认输出到仓库的 `target/release/frpc-ui-desktop.exe`。`npm run desktop:build` 按配置生成 Windows NSIS 安装包；CI 增加临时目录首次安装与安装后启动检查，升级和签名仍需单独验收。

只检查前端时执行 `npm run build`；构建包含严格 TypeScript 检查。`npm run dev` 在 `http://127.0.0.1:5188/` 打开的是**浏览器演示模式**，进程、网络及系统动作使用模拟数据，不等同于桌面运行。

## 首次使用

1. 桌面首次启动为空连接、空版本库，不写演示配置。
2. 在“版本库”刷新官方版本并下载安装，或选择本地 frpc 可执行文件导入。版本库可识别 0.52.0 及以上现代 TOML 版本；配置能力仅对已审核版本开放，未审核的新 minor/major 不会被当作兼容版本。当前清单见[逐版本配置文档](docs/frpc-version-configuration.md)。本地导入会实际运行 `frpc -v` 识别版本。
3. 新增连接，填写 frps 地址、端口、token，并选择已安装的 frpc 版本；再新增隧道。
4. 启动连接。进程运行、服务器登录确认与隧道注册状态分别显示；批量操作逐连接返回结果，可重试失败项。
5. 编辑、启停或删除隧道后显示“待应用”。点击“重启并应用”先执行官方 `frpc verify`，通过后重启该连接的进程，期间连接会短暂中断；已停止的连接只验证配置。更换 frpc 版本必须先停止连接。
6. 默认关闭窗口保留托盘；托盘可显示窗口、停止全部连接或退出。退出会停止托管的 frpc 进程。开机启动、登录启动时隐藏窗口及每连接自动连接分别设置。

TOML 导入和旧客户端迁移都新增停止的连接，不覆盖现有连接，也不自动连接。旧迁移在设置页明确选择 `userData` 或 `db` 目录并预览；确认时重新检查源文件指纹，源数据改变则要求重新预览。

## 已实现能力与技术栈

- 多连接与八种隧道协议：TCP、UDP、HTTP、HTTPS、STCP、SUDP、XTCP、TCPMUX；工作台仅展示服务器连接卡片，隧道集中维护。
- 高级认证/OIDC/文件 Token、网络/TLS/QUIC、HTTP 多域名与路由、XTCP 回退、限流、负载均衡、健康检查及九种 provider 插件；可选值沿用对应版本默认。
- 版本库提供 0.52–0.71 共 32 个已审核官方稳定标签的配置清单；连接和隧道编辑器按版本及协议条件显示可用选项，降级保留并提示不兼容参数。未审核版本不会推定兼容。
- 有官方默认值的控件直接显示对应版本默认值，TCP 复用等联动项同步更新；明确修改才保存高级覆盖，可恢复默认。清单列出默认值及来源，补丁差异单独核验。
- 批量启停、受控应用配置、真实 frpc 验证与进程监督、部分失败与原动作重试。
- 官方 GitHub 版本查询、SHA-256 校验下载、安全解压、原子安装、本地导入、每次启动前二进制校验及引用版本删除保护。
- 有界日志、筛选与暂停快照、复制下载；TOML 导入导出和分享；NeDB 只读迁移预览。
- 中英文、浅色/深色/系统主题；托盘、单实例、系统开机启动。

| 层 | 实际技术栈 |
| --- | --- |
| 前端 | React 19、TypeScript 严格模式、Vite 8、npm / package-lock.json |
| 组件与样式 | Tailwind CSS 4、Radix UI、shadcn 风格源码组件、集中语义 token |
| 状态与反馈 | Zustand 5、Sonner、Lucide |
| 桌面与业务 | Tauri 2、独立 Rust core 与 versions crates、Tokio |
| 配置与存储 | 前端 smol-toml、后端 toml、schemaVersion JSON 原子保存 |
| 穿透核心 | 按连接选择的官方 frpc 可执行文件 |

## 数据与当前边界

设置页显示实际 `dataDir`。其中 `state.json` 保存连接、隧道与偏好，`versions/` 保存二进制和 SHA-256 元数据，`runtime/` 保存运行时临时 TOML。配置重启后保留，运行标记重新置为停止/未确认；启用自动连接的连接在应用启动后重新启动。日志为内存缓存，不提供磁盘历史日志。

**认证 token 与隧道密钥目前以明文保存到本机配置，运行时 TOML 也包含所需凭据。** 尚未接入系统凭据库或加密存储。日志进行凭据脱敏；导出默认移除 token 与密钥，分享链接只是编码，没有加密。桌面凭据不写入 localStorage；浏览器演示配置与凭据只保存在内存。

完整字段与协议条件见[配置覆盖清单](docs/frp-configuration-coverage.md)，各发布版本见[逐版本清单](docs/frpc-version-configuration.md)。支持的高级参数保留原值迁移；未知、版本不兼容和不适用参数明确拒绝。执行型 TokenSource、外部 includes、官方 Store、VirtualNet、全局 start 与自由日志策略尚未开放。文件和证书仅传递路径，不随配置复制。分享 schema2 保留高级参数，读取原 schema1；默认过滤新增凭据，旧客户端分享格式不保证兼容。

官方 0.71.0 的基础/高级配置验证和真实 TCP/文件 Token 闭环已通过；所有协议、插件及历史二进制尚未逐一完成真实流量端到端验收。macOS、Linux、安装包升级和签名发布未验收，完整状态见[验证记录](docs/development/verification.md)。

## 测试与文档

```powershell
# apps/desktop
npm test
npm run build

# 仓库根目录
cargo test --workspace
```

网络下载与官方 frpc/frps 联调为显式执行的 ignored 测试，普通测试不访问公网。最近一次可复现的代码检查及已完成的官方二进制验证范围见[验证记录](docs/development/verification.md)。Windows 发布前仍须对最终 release EXE 执行真实 WebView 启动/IPC/退出 smoke；debug 存活或 MockRuntime 通过不能代替。首次 EXE 闪退的原因与修复见[Windows 启动说明](docs/development/windows-startup.md)。

[架构](docs/development/architecture.md) · [IPC 契约](docs/development/ipc-contract.md) · [验证记录](docs/development/verification.md) · [产品范围](PRODUCT.md) · [设计规范](DESIGN.md) · [Rust 评估](docs/rust-rewrite-assessment.md) · [项目记忆](docs/memory/MEMORY.md)

原型只用于设计追溯，不作为生产行为或视觉规范的依据。新项目许可证尚未决定，未擅自指定 LICENSE。
