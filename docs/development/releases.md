# 自动构建与发布

工作流为 [Build and release](../../.github/workflows/ci.yml)，运行结果见 [GitHub Actions](https://github.com/nvrenshiren/frpc-ui/actions/workflows/ci.yml)，下载见 [GitHub Releases](https://github.com/nvrenshiren/frpc-ui/releases)。本地 `git commit` 后需要 `git push`，GitHub 才会接收到提交并运行。

| 触发 | 版本与行为 |
| --- | --- |
| 推送 `main` | 每次 push 自动构建，并发布独立预发布版 `v<基础版本>-dev.<运行序号>`，例如 `v0.1.0-dev.1` |
| 推送 `vX.Y.Z` 标签 | 版本与源码清单完全一致后，构建并发布正式版 |
| PR | 测试、构建和启动验收，保留 Actions 产物，不发布 |
| Actions 手动运行 | 只检查和构建；失败的发布使用原运行的 Re-run 重试 |

每次 push 对应一次构建；同一次 push 中的多条 commit 合并构建其最终 HEAD。main 和标签运行不互相取消，PR 的旧检查可以取消。预发布不占用正式版 Latest；正式版标签只接受三段数字版本。

## 构建与验收

Linux 执行 Rust 格式检查、领域测试和 Clippy；Windows 执行前端测试、完整 Rust workspace 测试和 Clippy，Tauri 构建前执行 TypeScript 检查及 Vite 构建。版本计划与打包脚本另有 Node 内置测试。

Windows x64 生成 NSIS 安装包及直接运行的 EXE，检查/安装 Microsoft WebView2 Runtime，执行真实 Release WebView 启动、首次快照 IPC、三秒存活和退出检查。打包后的 EXE 再次验证，并在临时目录静默安装 NSIS 后检查安装的 EXE。任何检查失败都会阻止发布；Fresh install 检查不代表已有安装升级/卸载已经验收。

发布附件包含：

- `frpc-ui-<版本>-windows-x64.exe`：直接运行的应用，使用系统 WebView2。
- `frpc-ui-<版本>-windows-x64-setup.exe`：当前用户 NSIS 安装包，可安装缺失的 WebView2（需要联网）。
- `SHA256SUMS.txt`：两个二进制和发布元数据的 SHA-256。
- `release.json`：实际应用版本、完整源码 SHA、构建来源及产物校验信息。

应用和安装包当前未签名；实际 frpc 二进制在应用的版本库中另行下载安装。本地凭据的保存边界见 README。此流程发布 GitHub 下载版本；应用内自动更新尚未实现。

## 正式版本

基础版本保存在 `apps/desktop/package.json`，Tauri 读取该字段；`apps/desktop/package-lock.json` 的顶层与根 package 版本，以及根 `Cargo.toml` 的 `workspace.package.version` 必须一致。Rust 本地 crates 的锁定版本随 Cargo 清单同步。预发布仅用 Tauri `--config` 覆盖实际应用版本，保持 Git 源码与依赖锁文件不变。

发布下一正式版时，修改上述基础版本，更新锁文件，提交并推送。下面以 `0.1.1` 为例：

```powershell
cd apps/desktop
npm version 0.1.1 --no-git-tag-version
cd ../..
# 将 Cargo.toml 中 workspace.package.version 同步为 0.1.1
cargo check --workspace
git add apps/desktop/package.json apps/desktop/package-lock.json Cargo.toml Cargo.lock
git commit -m "发布 0.1.1"
git push origin main
git tag v0.1.1
git push origin v0.1.1
```

不要复用或移动已经发布的标签。标签与清单不一致时计划步骤明确失败，不发布错误版本。未来新增平台必须补相应构建、启动和发布验收。

## 权限与重试

构建 job 只有 `contents: read`；只有等待全部检查成功的发布 job 获得 `contents: write`。使用 GitHub 自动提供的 `GITHUB_TOKEN`，不需要另存 PAT。Actions 版本固定到核验过的官方 commit SHA。

发布先创建 draft，上传全部附件并验证校验和，再公开。重试自己的未完成 draft 可以补附件；已公开的版本验证 tag/source SHA 后保留原附件，不覆盖已交付二进制。自动创建的 tag 直接在本次工作流发布，避免 `GITHUB_TOKEN` 创建 tag 后不会触发新 push workflow 的接力问题。

官方依据：[GitHub 工作流令牌权限](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#permissions)、[令牌触发规则](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow)、[Release CLI](https://cli.github.com/manual/gh_release_create)、[Tauri Windows 打包](https://v2.tauri.app/distribute/windows-installer/)、[WebView2 检测与安装](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/distribution)。
