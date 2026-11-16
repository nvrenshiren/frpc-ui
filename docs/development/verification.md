# 桌面开发验证记录

## 2026-11-16 前端界面检查

- `npm run build` 通过，严格 TypeScript 检查与 Vite 构建完成。
- 浏览器演示模式检查了深色主题下的运行总览、资源切换与设置入口，视口宽度为 1280、768 和 375 CSS px。演示模式不验证真实进程、IPC 或桌面 WebView 行为。
- 本次界面更新没有重跑 `npm test`、Rust 检查或 Windows release EXE smoke；下方 2026-11-15 的门禁结果是其当时的记录，不代表本次重跑。

## 2026-11-15 代码与文档审查

本次检查了前端、Rust workspace、发布脚本、CI 配置及项目 Markdown。以下门禁在当前工作区通过：

| 检查 | 结果 |
| --- | --- |
| `npm test` | 44 项通过 |
| `npm run build` | 严格 TypeScript 检查与 Vite 生产构建通过 |
| `node --test scripts/release.test.mjs` | 14 项通过 |
| `cargo +stable fmt --all -- --check` | 通过 |
| `cargo +stable test --locked --workspace` | 45 项通过，5 项因依赖官方二进制或网络而忽略 |
| `cargo +stable check --locked --workspace` | 通过 |
| `cargo +stable clippy --locked --workspace --all-targets -- -D warnings` | 通过 |
| Rust 1.90.0 `check --locked --workspace` 与 `test --locked --workspace` | 均通过；测试 45 项通过、5 项忽略 |

前端构建产物未超过 Vite 的默认 chunk 提示阈值。Tauri 窗口背景已与当前深色逐科主题 token 对齐。Windows release EXE smoke 未在本次文档与静态审查中重跑；发布前仍须对最终产物执行 `npm run test:desktop:smoke`。CI 工作流已静态审阅，但本机未安装 `actionlint`，因此没有运行该工具。

## 已完成的行为验证

- 2026-11-14 的浏览器界面检查覆盖深浅主题、主页面、高级配置表单、Radix Select 以及桌面/窄屏布局；浏览器模式只使用演示数据，不证明真实 frpc 或原生桌面行为。
- 官方 0.52.0 与 0.71.0 二进制配置验证，以及 0.71.0 TCP/frps 与文件 Token 生命周期回环，曾在 2026-10-08 显式通过。该结果不等于其余版本、全部协议、TLS/OIDC 握手或所有插件均完成端到端验证。
- Windows release WebView/IPC/退出 smoke 曾在此前的正式构建和安装包副本上通过。每次发布仍须对当次最终 EXE、打包副本和全新安装执行 CI smoke。

## 当前边界

- 配置能力审核到 0.71.x；上游 [frpc v0.72.0](https://github.com/fatedier/frp/releases/tag/v0.72.0) 已发布，但本项目尚未审核该版本。能力门槛会拒绝未审核的 minor/major。
- macOS/Linux 发布、已安装版本升级/卸载、签名，以及 TLS/OIDC 网络握手、Unix socket 和全部协议的真实流量仍未完成验收。
- 连接 token 与隧道密钥以明文保存在本机应用数据目录，系统凭据库尚未接入。
- 浏览器预览、模拟运行时和历史 EXE 检查不能代替当前 release 产物 smoke。

## 可复现命令

在 `apps/desktop`：

```powershell
npm ci
npm test
npm run build
node scripts/generate-frpc-config-docs.mjs
npm run desktop:build:exe
npm run test:desktop:smoke
```

在仓库根目录：

```powershell
node --test scripts/release.test.mjs
cargo +stable fmt --all -- --check
cargo +stable test --locked --workspace
cargo +stable check --locked --workspace
cargo +stable clippy --locked --workspace --all-targets -- -D warnings
cargo +1.90.0 check --locked --workspace
cargo +1.90.0 test --locked --workspace
```

官方进程与网络下载测试为 ignored，须显式设置已审核的二进制路径并单独执行；默认测试不访问公网。Windows EXE 发布验收细节见 [Windows 启动说明](windows-startup.md)，发布门禁见 [releases.md](releases.md)。
