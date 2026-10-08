# Desktop IPC contract

2026-10-08：用户授权正式开发。生产前端位于 `apps/desktop`，原型保留在 `prototypes/frpc-ui`。Windows 优先，使用 Tauri 2 与官方 frpc。本地配置采用 schemaVersion JSON 与原子保存；核心领域独立于 Tauri。

DTO 沿用原型 model.ts 的 camelCase 字段。`DesktopSnapshot` 为 `{profiles, tunnels, logs, settings, versions, dataDir}`。`versions` 沿用原型 Version，可增加来源与校验信息；其路径只由后端管理。空安装首次启动不写演示配置。

所有命令在错误时 reject 字符串；普通配置与版本命令成功返回完整 DesktopSnapshot，前端以返回值更新，禁止将模拟运行状态写入后端。`run_profiles` 返回 `{results: BatchResult[], snapshot: DesktopSnapshot}`，`preview_legacy` 返回下文的预览结构。运行状态由后端权威提供，前端每秒刷新 snapshot；不依赖 UI 声称连接成功。

| Command | camelCase arguments |
| --- | --- |
| `get_snapshot` | 无 |
| `save_profile` | `profile` |
| `delete_profile` | `id` |
| `save_tunnel` | `tunnel` |
| `delete_tunnels` | `ids` |
| `toggle_tunnels` | `ids, enabled` |
| `import_configuration` | `profile, tunnels`（原子新增） |
| `run_profiles` | `ids, action`（start / stop / apply） |
| `set_settings` | `settings`（完整 AppSettings） |
| `refresh_versions` | 无 |
| `install_version` | `id` |
| `remove_version` | `id` |
| `import_version` | `path`（原生对话框选出的本地 frpc） |
| `preview_legacy` | `path, version`（原生对话框选择旧 userData 或 db 目录） |
| `import_legacy` | `path, version, sourceFingerprint`（预览确认后重新读取比对） |

生产 UI 通过 isTauri 判断宿主。在普通浏览器明确展示浏览器演示模式；桌面无演示连接。所有持久操作必须 await 完成，失败保留表单与数据。连接参数变更采用受控重启应用配置，前端明确提示；进程运行、登录确认、隧道生效状态分别呈现。Starting/Running/Stopping 期间禁止切换 frpc 版本，必须先停止；保存错误不得改变内存或文件状态。

`preview_legacy` 返回 `{profiles, tunnels, issues, warnings, canImport, sourceFingerprint}`。旧项目 NeDB 逐行重放更新与删除，不读取旧二进制。预览不修改数据；确认时要求原文件内容 fingerprint 未变。仅新增一个停止的连接，不应用旧开机启动与自动连接偏好；未支持的非默认配置阻止导入。
