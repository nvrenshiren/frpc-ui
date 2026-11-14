# 历史原型验证

日期：2026-10-08。本文只记录 `prototypes/frpc-ui` 的浏览器模拟验证，不代表当前生产桌面应用的测试状态。原型冻结为设计追溯材料；生产行为和未覆盖范围见[当前验证记录](development/verification.md)。

原型当时通过了严格 TypeScript 检查、Vite 构建，以及连接筛选、批量操作、部分失败重试、条件表单、TOML 往返、分享脱敏、版本占用保护、日志筛选、主题和中英文切换等模拟交互。测试数据保存在内存或模拟 store；不涉及 Rust、真实 frpc/frps、系统托盘、版本下载或安装包。

旧原型的组件、色彩和布局不是当前产品的视觉规范。当前规范以 [DESIGN.md](../DESIGN.md) 和 `apps/desktop/src/index.css` 为准。
