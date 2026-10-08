import { writeFile } from "node:fs/promises";
import { configurationFields, getConfigCapability, getConfigurationVersionState } from "../src/configCapabilities.ts";
import { reviewedFrpcReleases } from "../src/reviewedFrpcReleases.ts";
import { formatConfigDefault, getConfigDefault } from "../src/configDefaults.ts";

const lines = [
  "# frpc 逐版本配置清单",
  "",
  "配置能力核验：2026-10-08；默认值核验：2026-10-09。由 `apps/desktop/src/configCapabilities.ts` 和 `configDefaults.ts` 的共享规则生成；连接/隧道编辑器、版本库清单与前端交换校验共用能力表，Rust 按相同门槛校验。",
  "",
  "清单针对本应用已实现的 frpc 参数，不把官方存在但本应用尚未开放的能力标为可编辑。支持 0.52–0.71 的现代 TOML 配置；主 minor 按官方固定 tag 审核，同 minor 的补丁版本继承字段清单，未列出的合法补丁也按此规则处理并须由实际二进制执行 `frpc verify`。不声称每一个历史二进制均已完成真实穿透联调。未审核的 minor/major 或无法识别的版本不会推定兼容。",
  "",
  "## 使用规则",
  "",
  "- 在版本库点击“配置清单”，可以切换每一个已知官方稳定版本，搜索配置键，并筛选连接或隧道。",
  "- 连接编辑器以所选版本为准；隧道编辑器以所属连接版本为准，同时按协议、角色、认证方式和插件类型显示。不存在的参数和类型不显示为编辑控件。",
  "- 切换版本不会静默删除已有配置。不兼容项显示字段路径和最低版本，用户可明确清除，或选择兼容版本；保存、交换和启动继续校验。",
  "- 有官方默认值的控件直接显示该版本默认值；未修改的高级项不写入 TOML。修改后成为明确覆盖，恢复默认会移除覆盖值。",
  "- 默认值按完整 major.minor.patch 和当前配置上下文核验，不能仅按 minor 继承。环境变量或必填目标没有可确定的固定值时保持未设置并说明来源。固定源码、补丁差异和应用接管策略见 [默认值审核](development/frpc-defaults-source-audit.md)。",
  "- 下方 `type.xxx`、`plugin.type.xxx`、`transport.protocol.xxx` 和 `auth.method.xxx` 是类型选项清单，表示某个枚举值可用，不是新增 TOML 字段。",
  "- `webServer.addr`、`loginFailExit`、`log.to/level/disablePrintColor` 由应用接管；`enabled` 对应应用启用状态，生成时剔除停用隧道。",
  "",
  "## 新增字段门槛",
  "",
  "| 首个版本 | 新增可用项 | 官方定义 |",
  "| --- | --- | --- |",
];
const introduced = new Map();
for (const field of configurationFields) {
  if (field.minVersion === "0.52.0") continue;
  const items = introduced.get(field.minVersion) ?? [];
  items.push(`${field.scope === "profile" ? "连接" : "隧道"} \`${field.key}\``);
  introduced.set(field.minVersion, items);
}
for (const [version, keys] of [...introduced].sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true })))
  lines.push(`| ${version} | ${keys.join("、")} | [v${version}](https://github.com/fatedier/frp/tree/v${version}/pkg/config/v1) |`);
lines.push("", "其他已实现字段从基线 0.52.0 起可用，仍需遵循协议条件。`proxyURL` 当前开放 HTTP/HTTPS/SOCKS5；NTLM 不在本轮开放范围。执行型 Token 来源、外部 `includes`、官方 Store、实验 `featureGates` 与 VirtualNet 尚未开放；未知字段明确拒绝。Windows 平台不提供 VirtualNet/TUN UI。完整产品边界见 [配置覆盖清单](frp-configuration-coverage.md)。", "", "## 每个官方稳定版本", "", "官方稳定发布列表依据 [frp Releases](https://github.com/fatedier/frp/releases) 在核验日期读取；没有为未发布的补丁号伪造条目。", "");
function condition(field) {
  const value = field.condition;
  const entries = [];
  if (value?.roles) entries.push(value.roles.join("/"));
  if (value?.protocols) entries.push(value.protocols.join("/"));
  if (value?.authMethods) entries.push("认证 " + value.authMethods.join("/"));
  if (value?.pluginTypes) entries.push("插件 " + value.pluginTypes.join("/"));
  return entries.length ? `（${entries.join("；")}）` : "";
}
function defaultText(result) {
  return "`" + formatConfigDefault(result).replaceAll("|", "\\|") + "`";
}
for (const version of [...reviewedFrpcReleases].reverse()) {
  const fields = configurationFields.filter((field) => getConfigCapability(version, field.key, field.scope).supported);
  const state = getConfigurationVersionState(version);
  lines.push(`<details>`, `<summary>frpc ${version} · ${fields.length} 项配置键与类型选项</summary>`, "", `[官方发布](https://github.com/fatedier/frp/releases/tag/v${version})。${state.reasonZh}。`, "");
  for (const scope of ["profile", "tunnel"]) {
    lines.push(`### ${scope === "profile" ? "服务器连接" : "隧道、访问者与插件"}`, "");
    const groups = new Map();
    for (const field of fields.filter((item) => item.scope === scope)) {
      const key = field.group + condition(field);
      const values = groups.get(key) ?? [];
      values.push("`" + field.key + "`");
      groups.set(key, values);
    }
    for (const [group, keys] of groups) lines.push(`- **${group}**：${keys.join("、")}。`);
    lines.push("");
  }
  lines.push("### 配置默认值", "", "以下按新建配置上下文列出；TCP 复用、所属用户、TLS 服务名等联动值会随表单上下文更新。类型选项不是独立字段，不重复列默认值。应用接管项同时说明官方默认和应用实际策略。", "", "| 范围 | 配置键 | 默认值 | 说明 |", "| --- | --- | --- | --- |");
  for (const field of fields.filter((item) => item.kind === "field")) {
    const result = getConfigDefault(version, field.key, field.scope);
    lines.push(`| ${field.scope === "profile" ? "连接" : "隧道"} | \`${field.key}\` | ${defaultText(result)} | ${result.reasonZh.replaceAll("|", "\\|") || "—"} |`);
  }
  lines.push("", "</details>", "");
}
lines.push("## 维护与验证", "", "更新能力表、官方发布列表与 Rust 门槛后，在 `apps/desktop` 用 Node 24 执行 `node scripts/generate-frpc-config-docs.mjs` 重新生成本文件。新增版本先核验固定标签的 Client/Proxy/Visitor/Common/Plugin/ValueSource 定义和默认行为，再执行所选官方二进制校验。", "", "源码基线：[v0.52.0](https://github.com/fatedier/frp/tree/v0.52.0/pkg/config/v1)、[v0.71.0](https://github.com/fatedier/frp/tree/v0.71.0/pkg/config/v1)。验证结果与未完成的真实协议联调边界见 [验证记录](development/verification.md)。", "");
const output = new URL("../../../docs/frpc-version-configuration.md", import.meta.url);
await writeFile(output, lines.join("\n"));
console.log(`Generated ${reviewedFrpcReleases.length} release checklists from ${configurationFields.length} capability entries.`);
