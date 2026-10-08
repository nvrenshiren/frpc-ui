# 参与开发

生产界面位于 `apps/desktop`，Rust 领域核心位于 `crates/frpc-core`，版本管理与旧数据转换位于 `crates/frpc-versions`。`prototypes/frpc-ui` 保留早期原型，不把原型中的模拟副作用带入桌面实现。

安装与运行步骤见 [README](README.md)。开始工作前读取 [AGENTS.md](AGENTS.md) 与 [项目记忆](docs/memory/MEMORY.md)，接口变更同步维护 [IPC 契约](docs/development/ipc-contract.md)。

提交前执行前端构建、`cargo fmt --all -- --check`、Rust 测试与适用的 Clippy 检查。配置和运行状态改动围绕真实行为测试；官方版本下载与 loopback 隧道测试须显式运行，不能用模拟结果替代。

凭据、个人配置、运行目录和下载的二进制不入库。错误报告提供脱敏的错误信息和复现步骤，不附带原始 token、secretKey、NeDB 或 state.json。PR 描述聚焦改动和验证，沿用 scoopUI 的主题与组件风格，不恢复旧界面。

项目许可证尚未选定；提交前请确认对贡献代码拥有相应权利。

CI 和发布规则见[自动发布说明](docs/development/releases.md)。PR 只执行检查，main push 自动发布预发布版，正式版使用与源码版本一致的 `vX.Y.Z` 标签。修改发布脚本时执行 `node --test scripts/release.test.mjs`，不要复用已公开的标签或覆盖其附件。
