# frpc-ui Rust 重写评估

本文是 2026-10-08 的历史迁移评估，记录旧 Electron/Vue 项目的功能基线和重写时需要处理的问题，不代表当前 UI、架构或验证状态。实际实现见[架构说明](development/architecture.md)，当前能力与验收边界见[产品范围](../PRODUCT.md)和[验证记录](development/verification.md)。

## 评估基线

- 功能参考：`frpc-desktop` 1.2.2，源码快照 `1d244e0`。旧界面仅用于识别行为，不沿用页面布局。
- 前端技术参考：scoopUI 0.1.11，源码快照 `5818fde`。其 React、TypeScript、Vite、Tailwind、Radix/shadcn、Zustand、Sonner 与 Lucide 作为技术栈参考；当前品牌、颜色与组件规范由 COHESION 逐科设计系统及 [DESIGN.md](../DESIGN.md) 管理。
- 产品目标：运行官方 frpc 二进制，重新组织多连接配置、隧道、版本和日志管理，支持批量操作；不重写 frp 协议。

## 旧项目行为与重写处理

| 旧项目风险或限制 | 当前实现处理 |
| --- | --- |
| 二进制路径依赖工作目录和平台后缀 | 版本库管理绝对路径；启动前校验版本与 SHA-256，使用独立参数启动。 |
| 子进程停止和退出时序不可靠 | Rust 进程监督区分进程、连接和隧道状态；停止与应用退出会等待受管进程清理。 |
| 下载解压与版本登记可能部分完成 | 下载校验官方 SHA-256，限制解压路径与目标文件；安装通过暂存目录和原子提交。 |
| 配置生成没有逐版本能力边界 | `configCapabilities.ts` 与 Rust 校验使用已审核版本门槛；未知能力拒绝，降级不静默删除配置，启动前执行 `frpc verify`。 |
| NeDB 更新/删除记录需要重放 | 迁移只读预览旧数据库，确认时复核文件指纹，验证后新增停止状态的连接，不覆盖现有配置。 |
| IPC 日志和网页日志可能暴露凭据或注入 HTML | 运行日志有界并脱敏；UI 以文本节点显示日志，Tauri CSP 限制资源来源。 |

## 当前结构

`apps/desktop` 提供 Tauri 与 React 组合；`crates/frpc-core` 管理配置、校验、存储及进程；`crates/frpc-versions` 管理官方版本、导入和旧 NeDB 转换。持久化采用带 schema 版本的原子 JSON，理由与边界见[架构说明](development/architecture.md)。初版面向 Windows x64；其它平台状态和未完成的真实协议验收见[验证记录](development/verification.md)。
