# Product

<!-- impeccable:product-schema 1 -->

## Platform

desktop（Tauri 2 WebView）

桌面应用中的 WebView 界面，宿主为 Tauri 2。正式实现位于 apps/desktop，初版面向 Windows x64；桌面模式连接真实 Rust 后端，浏览器模式明确标记为演示。

## Stack

用户指定以前端技术栈和组件基础参考 scoopUI：React 19、TypeScript 严格模式、Vite 8、Tailwind CSS 4、shadcn/ui 与 Radix UI、Zustand 5、Sonner、Lucide、npm。2026-11-13 起视觉规范采用 `D:\Work\dawi\design` 的逐科 / whzhuke 设计系统 2.0.0，使用 shadcn New York / Neutral 品牌 token 与正式 Logo；COHESION 是共享主题配置的内部标识。页面信息架构围绕多连接运维设计。后端使用 Tauri 2 与 Rust，Tokio 管理进程，原子 JSON 保存本地配置，穿透能力使用官方 frpc 二进制。

## Users

用户已确认主要场景是多连接与批量维护，强调信息密度。操作者需要集中维护多个 frps 连接配置及其隧道，快速找到异常、切换连接、批量执行操作。

## Product Purpose

将 frpc 的配置、版本、运行状态、隧道和日志放在一个桌面工作台中。成功表现为连接归属清楚、批量操作范围可见、修改与实际生效状态分明，以及故障能够定位到具体连接或隧道。

## Operating Context

旧功能基线为 D:\Work\frpc-desktop；前端技术栈和早期组件基础参考 D:\Work\dawi\scoopUI。视觉基线现为 D:\Work\dawi\design 的逐科 / whzhuke 设计系统及其 COHESION 主题配置，优先于早期 scoopUI 配色。新界面整体重新设计，不保留旧项目页面布局或导航组织。

## Capabilities and Constraints

- 多连接配置管理；隧道搜索、筛选、创建、编辑及批量启停。
- TCP、UDP、HTTP、HTTPS、STCP、SUDP、XTCP、TCPMUX，以及相应 provider、visitor 配置。
- frpc 版本下载、导入、校验、选择与删除；连接配置、TOML 导入导出、分享与重置。
- 日志、运行状态、自启动、静默启动、自动连接、托盘、单实例与中英双语。
- `prototypes/frpc-ui` 保留用于设计追溯；生产实现只位于 `apps/desktop`。
- 桌面启动和注册状态来自真实 frpc 日志；浏览器中的连接状态和下载进度是模拟反馈，不展示虚构流量、带宽或延迟。
- 配置字段按 32 个固定官方 stable 标签（0.52.0–0.71.0）审核；同 minor 补丁继承能力清单，并由所选二进制执行 verify。默认值按完整补丁版本和上下文单独核验；未审核的 minor/major 不推定兼容。高级字段、八种协议与九种 provider 插件已贯通配置交换和旧数据迁移，未知字段明确拒绝。
- 官方默认值直接显示在输入/选择控件中，按精确补丁与当前配置联动；未修改的高级值保持省略。已有覆盖保留并可恢复默认，环境/必填值不编造。版本清单同时提供默认值和来源。
- 桌面使用顶部横向导航进入运行总览、资源、事件日志和版本；设置从工具区打开。资源页在连接与隧道登记表之间切换。运行总览呈现连接运行概况、连接操作清单、最近事件和隧道摘要；进程状态与服务端确认状态分开表达，顶部计数只使用 Rust 快照中的服务端确认连接。主题 token 与正式 `canvasAtmosphere` 适配保存在 `apps/desktop/src/index.css`。
- 桌面进程状态由 Rust 监督；服务端登录和隧道注册状态依据真实 frpc 日志回执。浏览器模式使用演示数据，不展示虚构流量、带宽或延迟。
- 旧 NeDB 迁移只读预览并检查源指纹，确认后新增停止状态的连接，不覆盖现有配置。
- macOS/Linux 打包、旧 INI、系统服务、应用自动更新、exec TokenSource、外部 includes/Store/VirtualNet 尚未实现。HTTPS 插件实际 TLS 和全协议流量联调仍待扩展。

## Evidence on Hand

docs/rust-rewrite-assessment.md 提供源码功能覆盖和实现缺口。旧项目实际管理单个连接，多连接是用户本次新增的产品要求。旧界面仅作功能研究，不能作为新视觉权威。

## Product Principles

1. 多连接归属和批量操作范围始终可见。
2. 高密度信息以表格、筛选和渐进展开呈现。
3. 配置已保存、修改待生效和实际运行状态分别表达。
4. 关键动作给出对象数量、结果和失败恢复入口。
