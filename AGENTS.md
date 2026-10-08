# frpc-ui 项目约定

## 项目记忆

入口为 `docs/memory/MEMORY.md`。可复用的约定、决策理由、验证状态和下一步保存在项目文档中；更新索引并移除过时结论，不记录凭据或原始聊天。

## 已确认的 UI 技术栈

用户指定以 `D:\Work\dawi\scoopUI` 的技术栈、配色和基础组件为参考：React 19、TypeScript 严格模式、Vite 8、Tailwind CSS 4、shadcn/ui 与 Radix UI、Zustand 5、Sonner、Lucide。使用 npm 和 `package-lock.json`；正式界面 token 集中在 `apps/desktop/src/index.css` 的 CSS 变量与 Tailwind `@theme` 中维护。桌面宿主为 Tauri 2，Rust 后端管理官方 frpc 二进制。

## 当前范围

用户已要求开始开发。正式桌面实现位于 `apps/desktop`，共享业务与版本模块位于 `crates/frpc-core` 和 `crates/frpc-versions`。`prototypes/frpc-ui` 保留为已验收的设计原型，不把后续生产逻辑回填到原型。功能参考 `D:\Work\frpc-desktop`；评估入口为 `docs/rust-rewrite-assessment.md`。用户确认多连接与批量维护，强调信息密度；全部重新组织 UI，不保留旧项目界面。配色与组件直接参考 scoopUI。

`PRODUCT.md` 记录产品范围，`DESIGN.md` 记录已实现的设计系统。`docs/development/` 记录架构、IPC 和验证边界。桌面版从空数据启动，状态以 Rust 快照为准；生产前端的浏览器模式与旧原型都使用演示数据，不能当作真实 frpc 验证。初版面向 Windows x64；参考项目只读使用。

## 开发与验证

在 `apps/desktop` 执行 `npm ci`、`npm test`、`npm run build`；使用 `npm run desktop:dev` 启动真实桌面应用，`npm run desktop:build:exe` 构建 Windows EXE。在根目录执行 `cargo fmt --all -- --check`、`cargo test --workspace` 和 `cargo clippy --workspace --all-targets -- -D warnings`。涉及网络下载或真实进程的忽略测试按验证文档显式执行。

业务逻辑尽量保留在独立 Rust crate；Tauri 命令负责系统集成和参数桥接，前端不推断进程真实状态。原子 JSON 存储是初版本地应用的选择；配置和凭据保存在应用数据目录，日志有界且脱敏。不要将凭据写入文档或演示数据，不要让未知配置静默丢失。运行中的“重启并应用”会中断已有会话。

配置 UI 按所选 frpc 版本及协议、角色、认证和插件条件显示。前端能力以 `apps/desktop/src/configCapabilities.ts` 为统一来源，Rust 校验保持相同门槛；变更时核对官方固定标签源码，更新逐版本清单和对应验证。未审核的 minor/major 不推定兼容，同 minor 补丁继承清单并由实际二进制 verify；版本降级不能静默删除已有配置。文档入口为 `docs/frpc-version-configuration.md` 与 `docs/development/frpc-version-source-audit.md`。

有官方默认值的输入框和选项直接显示对应版本默认值，规则集中于 `apps/desktop/src/configDefaults.ts`。默认值须按完整补丁版本及当前上下文核验，不能仅继承 minor。展示默认不将未修改的高级值固化到 JSON/TOML；明确修改后保存覆盖，恢复默认则移除覆盖。环境依赖或必填目标不能用示例冒充默认，应用接管值注明应用策略。

Windows EXE 交付前在 `apps/desktop` 执行 `npm run test:desktop:smoke` 检查最终 release 产物；不能用 debug 启动或 MockRuntime 代替。异步状态避免在 await 间携带大数组，见 `docs/development/windows-startup.md`。

GitHub 自动构建发布规则见 `docs/development/releases.md`。main push 自动发布独立预发布，匹配清单版本的 `vX.Y.Z` 标签发布正式版，PR 仅检查。发布脚本的行为测试为根目录 `node --test scripts/release.test.mjs`。仅发布 job 获得写权限；已公开版本及附件不可覆盖，不用 GITHUB_TOKEN 创建标签后期待另一个 push 工作流接力。
