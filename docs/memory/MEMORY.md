# 项目记忆

## 权威入口

- 项目约定和验证门禁：[AGENTS.md](../../AGENTS.md)、[CONTRIBUTING.md](../../CONTRIBUTING.md)。
- 当前产品范围与视觉规范：[PRODUCT.md](../../PRODUCT.md)、[DESIGN.md](../../DESIGN.md)。前端技术栈参考 scoopUI；当前品牌与组件规则以逐科 / whzhuke 设计系统为准，COHESION 是其共享主题配置的内部标识。
- 当前架构和 IPC：[架构说明](../development/architecture.md)、[IPC 契约](../development/ipc-contract.md)。初始重写评估只记录历史分析，不代表现状。
- 配置能力、源码依据和默认值：[覆盖清单](../frp-configuration-coverage.md)、[逐版本清单](../frpc-version-configuration.md)、[源码审计](../development/frpc-version-source-audit.md)、[默认值审计](../development/frpc-defaults-source-audit.md)。
- 可复现检查和未覆盖范围：[验证记录](../development/verification.md)；发布流程：[releases.md](../development/releases.md)。

## 稳定决策

- 正式桌面应用位于 `apps/desktop`，领域逻辑位于 `crates/frpc-core` 与 `crates/frpc-versions`。`prototypes/frpc-ui` 是冻结的历史设计原型，不承载生产逻辑。
- 桌面应用首次启动为空；浏览器模式使用模拟数据。只有 Rust 返回的快照代表桌面运行状态。
- 由官方 frpc 执行实际穿透。进程存活、服务器登录和隧道注册是不同状态；配置修改只标记待应用，重启应用会中断现有会话。
- 高级配置使用白名单和版本门槛；未知或不适用字段明确拒绝。降级时保留不兼容值，只有用户显式清除才移除。官方默认值按完整版本和上下文展示，未修改值不写入配置。
- 配置能力只对已审核的 minor 开放；同 minor 补丁继承清单，未知的新 minor/major 不推定兼容。详细版本边界见逐版本配置清单。所有实际配置仍须由所选二进制执行 `frpc verify`。
- 连接凭据目前以明文保存在本机应用数据目录；日志脱敏，默认导出移除凭据。不要把凭据或个人运行数据写入仓库。

测试结果、发布状态和待验收事项随验证记录更新；不在本索引保存旧提交号、临时产物哈希或逐轮聊天记录。
