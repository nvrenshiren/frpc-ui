# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

桌面应用中的 WebView 界面，宿主为 Tauri 2。正式实现位于 apps/desktop，初版面向 Windows x64；桌面模式连接真实 Rust 后端，浏览器模式明确标记为演示。

## Stack

用户指定以 scoopUI 技术栈、配色与基础组件为参考：React 19、TypeScript 严格模式、Vite 8、Tailwind CSS 4、shadcn/ui 与 Radix UI、Zustand 5、Sonner、Lucide、npm。深蓝与绿色主题沿用其语义 token，页面信息架构重新设计。后端使用 Tauri 2 与 Rust，Tokio 管理进程，原子 JSON 保存本地配置，穿透能力使用官方 frpc 二进制。

## Users

用户已确认主要场景是多连接与批量维护，强调信息密度。操作者需要集中维护多个 frps 连接配置及其隧道，快速找到异常、切换连接、批量执行操作。

## Product Purpose

将 frpc 的配置、版本、运行状态、隧道和日志放在一个桌面工作台中。成功表现为连接归属清楚、批量操作范围可见、修改与实际生效状态分明，以及故障能够定位到具体连接或隧道。

## Operating Context

旧功能基线为 D:\Work\frpc-desktop；UI 技术、配色与组件基线为 D:\Work\dawi\scoopUI。新界面整体重新设计，不保留旧项目页面布局或导航组织。用户随后明确要求配色和组件直接参考 scoopUI，优先于此前独立视觉方向。

## Capabilities and Constraints

- 多连接配置管理；隧道搜索、筛选、创建、编辑及批量启停。
- TCP、UDP、HTTP、HTTPS、STCP、SUDP、XTCP 与相应提供者、访客配置。
- frpc 版本下载、导入、校验、选择与删除；连接配置、TOML 导入导出、分享与重置。
- 日志、运行状态、自启动、静默启动、自动连接、托盘、单实例与中英双语。
- 用户已选择直接编写 React 交互原型，并随后明确要求开发真实桌面版本；原型保留用于设计追溯。
- 桌面启动和注册状态来自真实 frpc 日志；浏览器中的连接状态和下载进度是模拟反馈，不展示虚构流量、带宽或延迟。
- 支持审核过的 frpc 0.52–0.71 现代 TOML 配置，逐版本清单驱动编辑器显示；新的 minor/major 先审核能力，同 minor 补丁继承清单并由实际二进制 verify。连接/隧道常用高级字段、八种协议与九种 provider 插件已贯通交换与迁移。未知字段明确拒绝；旧 NeDB 只读预览和指纹校验后新增导入。
- 官方默认值直接显示在输入/选择控件中，按精确补丁与当前配置联动；未修改的高级值保持省略。已有覆盖保留并可恢复默认，环境/必填值不编造。版本清单同时提供默认值和来源。
- 工作台只显示服务器连接卡片；隧道列表集中到隧道页。
- macOS/Linux 打包、旧 INI、系统服务、应用自动更新、exec TokenSource、外部 includes/Store/VirtualNet 尚未实现。HTTPS 插件实际 TLS 和全协议流量联调仍待扩展。

## Evidence on Hand

docs/rust-rewrite-assessment.md 提供源码功能覆盖和实现缺口。旧项目实际管理单个连接，多连接是用户本次新增的产品要求。旧界面仅作功能研究，不能作为新视觉权威。

## Product Principles

1. 多连接归属和批量操作范围始终可见。
2. 高密度信息以表格、筛选和渐进展开呈现。
3. 配置已保存、修改待生效和实际运行状态分别表达。
4. 关键动作给出对象数量、结果和失败恢复入口。
