# frpc-ui 项目记忆

## 最终共识与入口

- 项目 `D:\Work\dawi\frpc-ui`，main；origin 为 `https://github.com/nvrenshiren/frpc-ui.git`。建立时远端为空；2026-10-09 用户授权提交 Git 并启用自动编译发布，许可证待用户决定。项目规范见根 AGENTS.md。
- 使用简体中文沟通，自主完成可逆开发，不重复请求已授权的操作。多连接、批量维护、高信息密度；根据旧功能重新设计，不保留旧界面。
- UI 技术栈、配色和组件明确参考 `D:\Work\dawi\scoopUI`：React 19、strict TypeScript、Vite 8、Tailwind 4、Radix/shadcn、Zustand 5、Sonner/Lucide，npm/package-lock。深蓝/绿色 token 集中于正式 index.css。
- 最新工作台只显示服务器连接卡片，包含基本信息、版本、传输、进程/登录状态、待应用和错误；隧道表格集中在隧道页。
- 功能参考只读项目 `D:\Work\frpc-desktop`，HEAD 1d244e0，版本1.2.2；UI参考 scoopUI HEAD 5818fde，版本0.1.11。参考项目没有修改。

## 架构与约束

正式实现为 `apps/desktop`（Tauri2/React）、`crates/frpc-core`（领域/配置/原子存储/进程监督）、`crates/frpc-versions`（官方版本校验安装/本地导入/旧NeDB转换）。冻结原型在 `prototypes/frpc-ui`，不回填生产逻辑。[产品范围](../../PRODUCT.md)、[设计系统](../../DESIGN.md)、[架构](../development/architecture.md)与[初始重写评估](../rust-rewrite-assessment.md)为相关入口。

Rust 重写管理层，实际网络由官方 frpc 执行。桌面全新启动为空；浏览器5188为演示适配器、刷新恢复测试数据，不能视为真实网络。桌面快照来自Rust，进程存活与登录确认分开，按INFO/stdout识别登录和隧道注册。保存只标待应用；明确“重启并应用”会中断现有会话。运行/启动/停止期间不能切换版本。

本地采用原子JSON：单实例、有界配置、无跨用户查询，减少数据库依赖；写失败不推进内存。凭据仍是本机应用数据目录中的明文，未集成OS凭据库；日志有界并脱敏。官方安装与每次启动执行SHA校验；本地导入标来源，不伪装官方。引用中的版本不可删除，删除通过原子移除处理。退出等待所有受管进程清理，关窗默认托盘。

## 当前配置能力

高级 `advanced` 对象严格按官方路径白名单验证，旧JSON缺省兼容，不允许覆盖基础字段。连接TLS/网络/QUIC/OIDC/file Token/管理/元数据，八种协议，HTTP多域名/路由/鉴权/Header，私有用户、XTCP重试/回退/NAT，限流/ProxyProtocol/LB/健康检查，九种provider插件已贯通编辑、保存、TOML、分享和迁移。可选数字/开关省略时保留对应版本默认；0、false、负禁用值保留语义。

版本库提供32个官方stable（0.52–0.71）的可搜索清单，统一142个字段/choice。连接按选定版本、隧道按所属连接版本，同时按协议/角色/认证/插件条件显示。不存在的字段不显示编辑控件；降级保留不兼容值并显示明确摘要/显式清除，关联隧道只读提示而不从连接表单擅自修改。非法或未审核minor/major不推定兼容；同minor补丁继承清单（含未列出的合法补丁）并由实际二进制verify。

[逐版本清单](../frpc-version-configuration.md)、[完整覆盖与边界](../frp-configuration-coverage.md)、[固定源码审核](../development/frpc-version-source-audit.md)为事实入口。审核171份固定标签源码；http2http精确注册从0.59起，避免与HTTP2HTTPS子串混淆。其它门槛：annotations55、healthHeaders56、responseHeaders58、HTTPS插件HTTP2 59、tls2raw60、TokenSource64、OIDC TLS/NAT65、OIDCSource66、clientID67、wireProtocol69。支持字段在已发布补丁未新增/移除，仍由实际verify兜底。清单由共享TS能力表生成，Node24运行 `node scripts/generate-frpc-config-docs.mjs`。

TOML导出启用项并展开范围；schema2分享保留advanced/范围/禁用，读取schema1/原型格式。默认过滤新增凭据及可能敏感Header/元数据，不改变原配置。仅有OIDC文件来源时移除来源会导致无效认证，明确拒绝脱敏导出而不改认证方式。单次交换500项/UTF-8 1MiB。文件与目录只是路径引用，不随导入复制；Windows绝对路径约束，不声称浏览器检查过文件。

TCP/UDP单映射remotePort0自动分配，范围不能用0；STCP/XTCP visitor允许bindPort=-1，不监听，SUDP不允许。HTTPS插件证书/私钥可同时省略（官方随机自签），不能单边填写。新插件去除普通目标配置；旧https2http兼容。

旧NeDB只读预览、指纹复核后新增停止的连接，不覆盖/自动连接；支持高级项保留原值，原XTCP等待值不强制新默认。未知/非默认不适用字段阻止导入；旧空域名占位不误阻止TCP。未启用BasicAuth的缓存凭据不激活，并在预览说明。

exec TokenSource、外部includes、官方Store、VirtualNet/featureGates、全局start、自定义日志目的地/级别与NTLM代理未开放。监督日志固定console/info/无色，loginFailExit=false；管理监听固定127.0.0.1。扩展这些功能需明确来源、状态采集与平台语义，不能静默吞字段或假装兼容。

## UI与验证状态（2026-10-09）

生产Select统一Radix，170ms入场/110ms退场/160ms箭头，尊重reduced-motion；各滚动区采用主题token。配置文件控件为共享按钮+隐藏文件输入，文件名/大小自然换行，超限保留文本并禁止导入，同文件可重选。高级字典保留连续换行草稿和非法输入，保存失败留表单；中英/深浅、1280/860/390检查无根/对话框溢出，密集表格局部滚动。最终干净预览无warning/error，恢复中文深色/默认视口并清除演示测试记录。

2026-10-09：有默认值的输入/选项直接显示所选完整版本及上下文默认。`configDefaults.ts` 纯查询不写配置，修改才形成覆盖，恢复默认移除覆盖；显式0/false/空集合保留。32标签已审核默认差异：0.52.0无STUN回退、0.52.1起有STUN；0.58.0起mux开启时心跳-1/-1（关闭仍30/90）；0.58.1起mux保活60改30。新建serverAddr=0.0.0.0、webPort=0、remotePort=0；localPort8080仅应用预设，非官方有效默认。环境代理、必填目标和运行时自签不猜值。清单包含默认列和精确标签来源；[默认值审核](../development/frpc-defaults-source-audit.md)记录理由和边界。

前端44项通过（含7默认规则和4默认行为）；Rust默认45项通过（core19/versions25/IPC1）、5项ignored，格式和Clippy记录保留2026-10-08通过，本轮Rust未改未重跑。core4个ignored在2026-10-08显式全部通过：官方0.71高级14fixtures+基础配置、0.52基线11fixtures、真实TCP与file Token生命周期闭环。官方版本网络安装此前通过，本轮未重复。完整记录在 [verification.md](../development/verification.md)。

首版release闪退根因是file_hash的64KiB栈数组跨await，扩大完整IPC分发future；改堆Vec并加future大小防回归，保留正常PE栈reserve。不要重新引入大栈数组或仅增加stack来掩盖。交付前必须实际release WebView smoke；详见 [Windows启动说明](../development/windows-startup.md)。

2026-10-09默认值更新最终release及交付副本两次真实smoke通过（首次快照IPC、3秒存活、正常shutdown）。三个相同文件：target/release/frpc-ui-desktop.exe、artifacts/frpc-ui-0.1.0-windows-x64.exe、旧-fixed.exe路径；10,071,552字节，SHA256 `396F9F6D6CD513898A585AA1D8808DAF575701CB3FB9CE7FEF6B25C5327FBA6C`。主入口487.31kB/gzip153.28，无chunk超限。1280桌面/390窄窗默认表单、heart/mux联动、健康/XTCP实际默认与打开后保存不固化均检查；最终新建干净预览无warning/error，保留未保存的默认表单供检查。未签名Windows x64开发检查版，版本0.1.0，WebView2必需。

## 后续验证范围

继续原生窗口/托盘/系统启动/完整GUI操作验收，以及TLS/OIDC实际网络握手、Unix socket和全部协议/插件真实流量。现有数据面为TCP回环，历史版本仅0.52/0.71做了实际配置verify，不能声称其它30个版本已联调。macOS/Linux打包、系统服务、应用自动更新、NSIS升级和签名尚未验收。

## Git 与自动发布（2026-10-09）

用户要求提交并自动发布。工作流 `.github/workflows/ci.yml` 每次 main push 编译独立 `v<base>-dev.<run>` 预发布，`vX.Y.Z` 标签发布正式版；PR/手动运行仅检查。正式 tag 必须匹配 package/Cargo/npm lock，预发布通过 Tauri config 覆盖应用版本，不修改源码清单。各次 push 保留运行，所有测试与真实 release smoke 成功后发布job才获得contents:write，使用GITHUB_TOKEN，无额外PAT。先draft上传完整EXE/NSIS/SHA256/metadata再公开；已公开附件不覆盖。详情和首次运行状态入口见[自动发布说明](../development/releases.md)与[GitHub Actions](https://github.com/nvrenshiren/frpc-ui/actions/workflows/ci.yml)。本机前端44项、发布脚本14项、Rust格式及actionlint本轮通过；安装后的EXE首次启动由CI新增验收，不能推定升级/签名验收。
