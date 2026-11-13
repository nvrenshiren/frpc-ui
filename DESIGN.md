---
name: frpc-ui
description: "多连接管理的高密度桌面工作台"
colors:
  primary-dark: "#519f77"
  primary-hover-dark: "#77b292"
  primary-foreground-dark: "#141414"
  primary-light: "#167c4b"
  primary-hover-light: "#2d8558"
  action-primary-light: "#167c4b"
  action-primary-hover-light: "#2d8558"
  success-text-light: "#368011"
  success-text-dark: "#49aa19"
  background-dark: "#141414"
  foreground-dark: "oklch(0.985 0 0)"
  surface-dark: "#1f1f1f"
  secondary-dark: "oklch(0.269 0 0)"
  muted-foreground-dark: "oklch(0.708 0 0)"
  border-dark: "oklch(1 0 0 / 10%)"
  border-strong-dark: "oklch(1 0 0 / 15%)"
  background-light: "#ffffff"
  foreground-light: "oklch(0.145 0 0)"
  surface-light: "#fff"
  primary-foreground-light: "#fff"
  secondary-light: "oklch(0.97 0 0)"
  muted-foreground-light: "oklch(0.556 0 0)"
  border-light: "oklch(0.922 0 0)"
  border-strong-light: "oklch(0.922 0 0)"
  info-dark: "#4486e3"
  info-light: "#1369e2"
  warning-dark: "#d89614"
  warning-light: "#96670c"
  destructive-dark: "#e0595a"
  destructive-light: "#ca3d3f"
  danger-text-dark: "#e0595a"
  danger-text-light: "#ca3d3f"
  action-danger: "#d44143"
  action-danger-hover: "#bb5856"
  action-danger-light: "#d54042"
  action-danger-hover-light: "#bb5856"
  accent-dark: "#1f2c25"
  accent-foreground-dark: "#519f77"
  sidebar-dark: "oklch(0.205 0 0)"
  accent-light: "#ecefed"
  accent-foreground-light: "#167c4b"
  sidebar-light: "oklch(0.985 0 0)"
  success-soft-dark: "#162312"
  success-soft-light: "#f6ffed"
  warning-soft-dark: "#2b2111"
  warning-soft-light: "#fffbe6"
  danger-soft-dark: "#2c1618"
  danger-soft-light: "#fff2f0"
  scrollbar-thumb-dark: "#626262"
  scrollbar-thumb-hover-dark: "#7b7b7b"
  scrollbar-thumb-active-dark: "#999"
  scrollbar-track-dark: "rgb(255 255 255 / 0.045)"
  scrollbar-thumb-light: "#b4b4b4"
  scrollbar-thumb-hover-light: "#8f8f8f"
  scrollbar-thumb-active-light: "#6f6f6f"
  scrollbar-track-light: "rgb(15 23 42 / 0.045)"
typography:
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Microsoft YaHei UI\", \"Noto Sans\", sans-serif"
    fontSize: "27px"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.035em"
  headline-compact:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Microsoft YaHei UI\", \"Noto Sans\", sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.035em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Microsoft YaHei UI\", \"Noto Sans\", sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.5
  title-record:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Microsoft YaHei UI\", \"Noto Sans\", sans-serif"
    fontSize: "15px"
    fontWeight: 550
    lineHeight: 1.5
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Microsoft YaHei UI\", \"Noto Sans\", sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  body-compact:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Microsoft YaHei UI\", \"Noto Sans\", sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Microsoft YaHei UI\", \"Noto Sans\", sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.5
  label-compact:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Microsoft YaHei UI\", \"Noto Sans\", sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontFamily: "ui-monospace, \"SFMono-Regular\", Consolas, \"Liberation Mono\", Menlo, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.5
  mono-index:
    fontFamily: "ui-monospace, \"SFMono-Regular\", Consolas, \"Liberation Mono\", Menlo, monospace"
    fontSize: "10px"
    fontWeight: 400
    lineHeight: 1.5
  mono-editor:
    fontFamily: "ui-monospace, \"SFMono-Regular\", Consolas, \"Liberation Mono\", Menlo, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.7
rounded:
  sm: "4px"
  notice: "6px"
  md: "8px"
  root: "10px"
  card: "12px"
  dialog: "14px"
spacing:
  "4": "4px"
  "6": "6px"
  "8": "8px"
  "12": "12px"
  "15": "15px"
  "16": "16px"
  "24": "24px"
  "32": "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary-dark}"
    textColor: "{colors.primary-foreground-dark}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 13px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover-dark}"
  button-primary-light:
    backgroundColor: "{colors.action-primary-light}"
    textColor: "{colors.primary-foreground-light}"
  button-primary-light-hover:
    backgroundColor: "{colors.action-primary-hover-light}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.foreground-dark}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 13px"
    height: "36px"
  button-outline-hover:
    backgroundColor: "{colors.secondary-dark}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground-dark}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 13px"
    height: "36px"
  button-ghost-hover:
    backgroundColor: "{colors.secondary-dark}"
  button-danger:
    backgroundColor: "{colors.action-danger}"
    textColor: "{colors.primary-foreground-light}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 13px"
    height: "36px"
  button-danger-hover:
    backgroundColor: "{colors.action-danger-hover}"
  button-danger-light:
    backgroundColor: "{colors.action-danger-light}"
    textColor: "{colors.primary-foreground-light}"
  button-danger-hover-light:
    backgroundColor: "{colors.action-danger-hover-light}"
  button-small:
    height: "30px"
    padding: "0 9px"
    size: "12px"
  button-icon:
    height: "30px"
    width: "30px"
    padding: "0"
  input-field:
    backgroundColor: "{colors.secondary-dark}"
    textColor: "{colors.foreground-dark}"
    rounded: "{rounded.md}"
    padding: "0 11px"
    height: "36px"
    width: "100%"
    size: "13px"
  input-field-light:
    backgroundColor: "{colors.secondary-light}"
    textColor: "{colors.foreground-light}"
  select-trigger:
    backgroundColor: "{colors.secondary-dark}"
    textColor: "{colors.foreground-dark}"
    rounded: "{rounded.md}"
    padding: "0 10px 0 11px"
    height: "36px"
    size: "13px"
  select-panel:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.foreground-dark}"
    rounded: "{rounded.md}"
    padding: "4px"
  select-item:
    textColor: "{colors.foreground-dark}"
    padding: "6px 30px 6px 10px"
    size: "12px"
  select-item-selected:
    backgroundColor: "{colors.accent-dark}"
    textColor: "{colors.accent-foreground-dark}"
  select-trigger-light:
    backgroundColor: "{colors.secondary-light}"
    textColor: "{colors.foreground-light}"
  select-panel-light:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.foreground-light}"
  select-item-selected-light:
    backgroundColor: "{colors.accent-light}"
    textColor: "{colors.accent-foreground-light}"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.muted-foreground-dark}"
    padding: "0 11px"
    height: "40px"
    size: "13px"
  nav-item-active:
    backgroundColor: "{colors.accent-dark}"
    textColor: "{colors.accent-foreground-dark}"
  nav-item-active-light:
    backgroundColor: "{colors.accent-light}"
    textColor: "{colors.accent-foreground-light}"
  badge-neutral:
    backgroundColor: "transparent"
    textColor: "{colors.muted-foreground-dark}"
    typography: "{typography.label-compact}"
    rounded: "{rounded.sm}"
    padding: "0 6px"
  badge-success:
    backgroundColor: "{colors.success-soft-dark}"
    textColor: "{colors.success-text-dark}"
  badge-success-light:
    backgroundColor: "{colors.success-soft-light}"
    textColor: "{colors.success-text-light}"
  badge-warning:
    backgroundColor: "{colors.warning-soft-dark}"
    textColor: "{colors.warning-dark}"
  badge-warning-light:
    backgroundColor: "{colors.warning-soft-light}"
    textColor: "{colors.warning-light}"
  badge-danger:
    backgroundColor: "{colors.danger-soft-dark}"
    textColor: "{colors.danger-text-dark}"
  badge-danger-light:
    backgroundColor: "{colors.danger-soft-light}"
    textColor: "{colors.danger-text-light}"
  connection-record:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.foreground-dark}"
    padding: "15px 17px 10px"
    rounded: "{rounded.card}"
  connection-record-selected:
    backgroundColor: "{colors.accent-dark}"
  register-panel:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.foreground-dark}"
    rounded: "{rounded.card}"
  dialog-panel:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.foreground-dark}"
    rounded: "{rounded.dialog}"
    width: "min(640px, calc(100vw - 32px))"
  button-outline-light:
    textColor: "{colors.foreground-light}"
  button-outline-light-hover:
    backgroundColor: "{colors.secondary-light}"
  button-ghost-light:
    textColor: "{colors.foreground-light}"
  button-ghost-light-hover:
    backgroundColor: "{colors.secondary-light}"
  nav-item-light:
    textColor: "{colors.muted-foreground-light}"
  nav-item-light-active:
    textColor: "{colors.foreground-light}"
  badge-neutral-light:
    textColor: "{colors.muted-foreground-light}"
  connection-record-light:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.foreground-light}"
  register-panel-light:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.foreground-light}"
  dialog-panel-light:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.foreground-light}"
---

# Design System: frpc-ui

## Overview

**Creative North Star: "连接索引工作台"**

连接索引工作台把连接、隧道和运行反馈组织成可扫描、可定位、可操作的记录。界面现按 `D:\Work\dawi\design` 的 COHESION 2.0.0 设计系统实施，采用 shadcn/ui New York / Neutral 基础、COHESION 品牌主题和 Radix 交互；信息密度由侧栏导航、稳定列与记录边界承载。

系统的气质是克制、清晰和连续。页面使用 COHESION 派生的中性色表面与绿色主操作；成功、警告、错误和信息状态继续使用各自语义色并保留文字提示。技术信息使用系统等宽字体帮助逐列比较。

当前主题由 COHESION 的 `theme/shadcn-tokens.json` 派生；应用适配层与控件状态集中于 `apps/desktop/src/index.css`、`apps/desktop/src/components/ui.tsx` 与 `apps/desktop/src/components/select.tsx`。正式 COHESION 标识来自设计系统的 `原色.png` 与 `白色.png`，裁切副本放在 `apps/desktop/src/assets/`。桌面使用持久侧栏，中等宽度收为图标栏，窄窗口改为横向导航。原型保留用于设计追溯。真实桌面状态来自 Rust 后端，浏览器演示反馈不能作为运行验证。

后续 UI 设计与修改应配合 `ui-ux-pro-max`：按具体产品场景、React 技术栈及响应式／无障碍问题检索，并先判断结果是否适用于本桌面运维工具。该技能提供辅助审视，不作为第二套品牌或 token 来源；颜色、组件基础和品牌表达仍以 COHESION 设计系统及本项目约定为准。没有匹配建议时明确使用通用 UX 原则，不将不相关搜索结果写成项目规范。

应用图标源仍为 `apps/desktop/app-icon.svg`；PNG/ICO 等衍生尺寸由官方 Tauri CLI 导出，来源与再生成命令记录在 `apps/desktop/src-tauri/icons/PROVENANCE.md`。窗口内使用独立产品标识，不把 Logo 资产色用作状态文字。

**Key Characteristics:**

- COHESION 深色与浅色主题共用同一套语义角色。
- 紧凑控件、稳定列对齐和低装饰度支持连续维护。
- 工作台独立服务器卡片与隧道页索引保留明确对象归属。
- 状态同时使用颜色与文字；键盘焦点清楚可见。

## Colors

色彩以 COHESION 品牌绿色和 Neutral 中性色为中心。Frontmatter 的颜色值来自逐科 shadcn token 快照；所有主题切换由 CSS 语义变量实现。组件主条目记录暗色默认值，`*-light` 条目记录亮色差异，其余形状、尺寸和状态共用。

### Primary

- **品牌绿**：`primary-dark` / `primary-light` 取自 COHESION 派生主题，用于主操作、选中范围和键盘焦点；`primary-hover-*` 保持主题对应的悬停状态。
- **动作前景**：主按钮前景随浅深主题配对；品牌 Logo 三色固定，只用于标识资产，不承担状态或正文语义。
- **成功文字绿**：状态文字取 COHESION 语义 token；成功底色使用 `success-soft-*`，让文字与记录内容都保持清楚。

### Neutral

- **Neutral 工作底**：`background-*` 承担页面、日志和配置文本的基础画布。
- **记录表面**：`surface-*` 对应卡面与 popover 共用的语义值，覆盖连接记录、登记表、设置与对话框。
- **次级底色**：`secondary-*` 用于输入、表头、悬停与提示区域。
- **主文字 / 辅助文字**：`foreground-*` 承担对象名和正文；`muted-foreground-*` 承担地址、说明、次要状态和列头。
- **常规边界 / 强边界**：`border-*` 区分区域与行；`border-strong-*` 加强输入悬停和未选复选框。
- **按钮前景**：`primary-foreground-*` 随主题配对。危险按钮始终使用浅色前景。
- **滚动条**：`scrollbar-thumb-*`、`scrollbar-thumb-hover-*`、`scrollbar-thumb-active-*` 与 `scrollbar-track-*` 随主题切换。细滑块、圆角和低对比轨道融入工作底，悬停与拖动提高滑块辨识度。

### 状态与反馈

信息蓝用于链接、访客角色和日志级别；警告色用于待应用、等待确认与警告日志；破坏色用于错误边界和错误级别。危险徽标文字使用 `danger-text-*`，危险按钮使用 `action-danger` 系列。警告和危险柔和底色不承担唯一的状态说明。

**The 语义与可读性 Rule.** COHESION 主题色承担操作、选择和焦点语义；操作背景与状态文字使用各自的可读性 token。浅深主题的主按钮前景、成功文字和危险文字分别取值，保持实际前景与背景组合清晰。

Sidecar 的 tonal ramps 是由当前颜色衍生的预览色阶；它们不是新增应用 token，也不改变 CSS 的主题语义。

## Typography

标题、正文和技术文本分别使用 frontmatter 中的字体角色。界面沿用 COHESION Web 基线的系统字体栈与系统等宽字体；仓库不下载或远程加载品牌字体，实际渲染采用本机可用字体。

- **Headline**：页面标题，紧凑断点使用 `headline-compact`；短标题直接建立层级，不加额外眉题。
- **Title**：对话框标题；`title-record` 用于连接名称。
- **Body**：正文基线；`body-compact` 用于表格内容和短说明。
- **Label**：按钮和主要操作标签；紧凑说明与徽标使用 `label-compact`。
- **Mono**：技术值与日志；`mono-index` 用于编号，`mono-editor` 用于 TOML 文本。

没有独立的营销 display 字级。字号按界面角色组织，不宣称统一比例字体阶。标题使用平衡换行，说明、长地址与日志允许断行，数据表保留单行扫描；设置说明与空状态文本限制可读行长。字段帮助与错误跟随各自输入，长选项在菜单中自然换行，触发器内的长值省略并保留完整 title。

**The 技术对齐 Rule.** 主机、端口、版本、索引和日志时间使用技术等宽角色及等宽数字；说明与动作文案使用正文角色。不要用字体变化替代对象归属或状态标签。

## Layout

桌面界面采用 248px 持久侧栏与独立内容画布；内容区最大宽度 1720px，宽度不足时侧栏收为 74px 图标栏，窄窗口切换为横向导航。标题、工具和工作区留白依据任务调整，控件、表头与记录使用更小步骤。实际间距集中在 CSS 的组件规则中，frontmatter 不假定这些值已经是独立 CSS spacing 变量。

工作台只显示独立服务器卡片：宽屏四列、中等两列、最窄单列，卡片间距 16px、边距 18px、圆角 12px。卡片包含名称、地址、版本、传输、进程/登录状态、待应用状态和错误，底部操作对齐；空状态占满网格。隧道登记表仅在隧道页显示，搜索、筛选、选择和批量动作紧邻记录。表头和行保持紧凑、稳定。

宽视口对齐内容留白，中等视口收窄侧栏并重排连接卡片，820px 以下使用图标栏，700px 以下改为可横向滚动的顶部导航。对话框宽度随视口收缩、内容在自身内部滚动，标题区保持可见。表单通常两列，在 560px 以下折叠为单列；日志消息在窄屏独占下一行。配置交换的字段、说明、预览与操作共享统一的水平边界，不因 fieldset 包裹改变内距。设置正文、迁移预览与列表项保持独立段落间距，长技术值允许断行。

**The 滚动边界 Rule.** 窄屏保留登记表的稳定列关系，由表格容器承担横向滚动；侧栏导航独立横向滚动。页面外框和正文保持在视口内。

页面、表格、导航、对话框、日志、配置文本和下拉菜单共用滚动条主题。WebView2 使用 10px 轨道与留有透明边界的圆角滑块，Firefox 使用 thin 滚动条和同一套颜色。页面、对话框、日志、配置文本与下拉视口保留稳定的 scrollbar gutter，避免出现滚动条时挤动相邻内容；横向表格保持独立的滚动边界。

## Elevation & Depth

界面以色调分层为主。工作底、记录表面与次级底色提供结构，细边界保持密集记录可分。对话框的投影与遮罩表示临时编辑层，下拉菜单使用更轻的浮层投影；主按钮悬停光晕、输入焦点环与选中记录内侧标记只反馈动作或状态。具体投影与运动值由 sidecar 扩展层记录。

连接卡片、表格和设置区域依靠背景色与边界建立层次。投影用于对话框与选择浮层，主按钮悬停仅有轻微反馈；工作台卡片不承担隧道筛选范围选择。

## Shapes

形状沿用 shadcn/ui New York / Neutral 的紧凑圆角语言。基础半径为 10px，输入与按钮为 8px，连接卡片为 12px、编辑弹窗为 14px。服务器卡片有独立边框，登记表行用分隔线连接；状态点为小圆点，协议和角色为紧凑矩形。

**The 紧凑圆角 Rule.** 常用按钮、输入和面板共享中等圆角；徽标与复选框更紧，提示区域和对话框采用各自已实现的圆角角色。小标记保持方中带圆，不改成胶囊外观。

## Components

### Buttons

按钮紧凑、语义明确，由 `Button` 的 primary、outline、ghost、danger 变体与 default、sm、icon 尺寸组成。常规边界按钮是默认变体，主按钮承载页面关键动作，ghost 用于记录内辅助动作，danger 用于明确的破坏性确认。

颜色、尺寸与内边距见 frontmatter。悬停加强底色或边界；按下时轻微下移；禁用降低不透明度并停止位移；焦点沿用 COHESION 主色环。图标按钮必须保留对象明确的可访问名称。

### Inputs and selection

`Input` 与受控的 Radix `Select` 共用次级底色、边界和圆角。正式界面的筛选、设置、连接与隧道编辑、配置交换和旧数据迁移复用同一选择组件。悬停加强边界，键盘焦点与展开状态显示主题色边界与柔和环，错误以红色边界和附近的文字说明表达。搜索框给图标预留左侧空间；标签由 Radix Label 关联到可见触发器，帮助和错误通过 aria-describedby 关联。

选择菜单由 Radix Portal 呈现，popper 定位随视口避让，可在编辑对话框上方操作。方向键、输入字符定位、Enter 确认与 Escape 关闭使用 Radix 行为；选中项同时显示勾选标记和颜色，禁用项保持不可选。触发器箭头在展开时旋转，菜单依实际弹出方向淡入并轻移，关闭时淡出。空字符串选项通过内部非空值映射保留清空选择语义，无可用项时禁用。

配置交换的文件选择使用现有 `Button` 触发隐藏的文件输入，标签、帮助和错误关联到可见按钮。按钮旁显示已读取文件名与大小，长文件名自然换行；读取中禁用文件选择、操作切换和配置文本，并显示进度状态。文件读取失败保留原文本、清除文件信息且暂停确认导入；手动编辑文本清除文件状态和错误，同一文件可重新选择。

复选框由 Radix 管理 checked 与 indeterminate 状态，批量选择保持可见数量。

### Navigation

桌面导航使用图标、文字和侧栏选中底色，当前页设置 `aria-current`；切换页面后焦点移到新页面标题。中等宽度保留图标轨道，窄窗口改为横向滚动导航。日志异常数量显示在对应入口，并由单一原子状态区域播报完整上下文。

### Chips and status

`Badge` 支持 neutral、success、warning、danger，状态点或加载图标与短文字一起出现。协议与角色标记使用相近的紧凑小矩形，但保持各自语义；状态不可仅靠色点表达。success 和 danger 的文字 token 与操作按钮分开，确保两套主题中的可读性。

### Connection records and register

服务器卡片显示基本连接信息和状态，不展示隧道列表或数量。连接、隧道和版本登记表使用稳定列、明确归属、紧邻记录的工具栏和行内动作；选中行共享范围底色。日志采用对齐的技术列。

**The 操作范围 Rule.** 批量工具必须紧邻所作用的记录，数量和连接归属可见。保存后的待应用状态、启用意图和进程反馈保持各自表达；失败结果保留逐项重试入口。

### Dialogs and feedback

`Dialog` 使用 Radix Portal、Overlay、Content、Title、Description 和 Close；标题区固定在对话框滚动区顶部，主体按配置主题分段。表单依协议渐进披露字段，并保留帮助、错误与确认文案。Sonner 在右下角提供可关闭的简短反馈，详细批量结果仍留在工作区。

配置表单与导入规则保持一致：本机管理端口以 0 表示关闭，启用时检查冲突；服务器及普通本机目标端口为正数，TCP/UDP 远端 0 表示自动分配，STCP/XTCP visitor 可选择 -1 不监听。域名支持多项、子域名与 `*.` 通配前缀，方括号 IPv6 保存为裸地址。私有密钥可留空并要求双方一致。交换超出数量或 UTF-8 大小上限时显示字段错误并禁用生成操作。

高级表单以共享版本清单过滤每一个字段和类型，并按协议/角色/插件分组渐进披露。有默认值的输入框和选项直接显示所选完整版本及当前上下文的默认，用户修改后明确保存覆盖；恢复默认移除覆盖。仅已有覆盖时显示恢复按钮，默认提示与字段相邻，环境代理和必填目标不填示例。数字与字典允许保留编辑草稿，格式错误保留草稿并阻止保存。版本降级保留不兼容值，以字段路径和原因摘要显示，逐项清除需要明确点击；关联隧道仅提示，不在连接编辑器中擅自修改。新 UI 包含 OIDC/file Token、网络/TLS/QUIC、HTTP 多域名、XTCP 回退及九种插件。版本清单弹窗可选 32 个官方发布、搜索键名、筛选范围及查看默认值/来源说明；密集表格保持独立横向滚动。编辑器与配置交换按需加载，保持工作台入口大小。

运动用于按钮状态、对话框淡入、下拉选择反馈和正在进行的加载图标。选择菜单以 170ms 的 ease-out 展开、110ms 的 ease-in 收起，使用 opacity、4px 位移与 0.98 → 1 的轻微缩放；箭头过渡为 160ms。不添加装饰性循环动画。系统开启 reduced-motion 时关闭动画与过渡。

## Do's and Don'ts

### Do

- 沿用 COHESION shadcn token，并为浅色动作和状态文字使用已有的可读性 token。
- 用稳定列、编号、连接归属和明确文字状态支撑信息密度。
- 沿用 Button、Input、Select、Badge、Checkbox 与 Dialog 的现有状态和尺寸。
- 保留焦点、禁用、错误、加载、部分失败和 reduced-motion 行为。
- 新增选择使用共享 Radix Select；滚动容器继承统一滚动条 token，并保留明确的滚动边界。
- 新增页面时复用连接记录与登记表语言，并将页面策略维护在对应 surface brief。

### Don't

- 不要恢复旧项目的页面布局，或为 COHESION 语义 token 再建一套独立配色。
- 不要添加虚构的流量、带宽、延迟图表或巨型指标卡。
- 不要仅凭颜色区分成功、待应用、异常、启用意图与实际运行状态。
- 不要把本机 QA 截图当成设计资产，也不要声称 CSS 中声明的字体已经下载或打包。
- 原型和浏览器演示的网络、下载进度与桌面选项保持明确的模拟标记；桌面模式只展示后端确认的结果。
