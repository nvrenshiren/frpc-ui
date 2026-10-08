# Windows 发布版启动栈溢出

2026-10-08。首版 EXE 编译成功，但首次 IPC 后闪退，stderr 为 `thread 'main' has overflowed its stack`。此前隔离启动检查使用 debug EXE，不能证明最终 release 可运行。

## 已确认原因与修复

旧 EXE 的 PE 主线程栈 reserve 为 1,048,576 字节；unwind 表中 IPC 分发的单个栈帧达到 1,007,592 字节。`frpc-versions::file_hash` 在 async future 中持有 64 KiB 数组并跨越 await，数组沿安装、导入、启动校验等嵌套 future 传播到完整命令分发器。前端第一次调用 `get_snapshot` 即触发该分发器。

当前 Tauri 2.12.1 IPC 在 debug 中额外装箱 future，release 路径不同，因此 debug 和只注册轻量命令的 MockRuntime 测试没有发现问题。

修复将哈希缓冲区改为堆分配 Vec，保留流式读取、大小限制和 SHA-256 语义；新增 future 大小小于 16 KiB 的回归约束。没有增加 EXE 栈 reserve。实际发布版验证和最终 hash 以[验证记录](verification.md)为准。

## 发布版启动检查

在 `apps/desktop` 完成构建后执行：

```powershell
npm run desktop:build:exe
npm run test:desktop:smoke
```

也可检查指定的最终交付 EXE：

```powershell
npm run test:desktop:smoke -- D:\Work\dawi\frpc-ui\artifacts\frpc-ui-0.1.0-windows-x64-fixed.exe
```

脚本启动真正的 release EXE 和打包 WebView，等待完整命令分发器处理 `get_snapshot`，再保持运行三秒并通过正常 shutdown 退出。启动错误、IPC 超时、异常退出或缺少就绪标记均使检查失败；CI 在上传 EXE 前执行同一检查。

`--smoke-test` 使用全新临时业务目录，跳过单实例唤醒和系统开机启动同步；smoke 使用 `run_return()` 后清理业务目录。Node 启动脚本为子进程设置独立临时 `WEBVIEW2_USER_DATA_FOLDER`，关闭后清理浏览器目录；该变量对 WebView2 用户目录参数的覆盖行为见 [Microsoft 官方说明](https://learn.microsoft.com/en-us/microsoft-edge/webview2/reference/win32/webview2-idl?view=webview2-1.0.3967.48)。测试不导入用户连接，不执行官方版本下载。

此检查覆盖发布版初始化、打包页面的真实首次 IPC 与退出路径，不代替托盘交互、开机启动注册或全部配置编辑的人工验收。
