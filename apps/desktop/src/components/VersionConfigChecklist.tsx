import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  configurationFields,
  getConfigCapability,
  getConfigurationVersionState,
  type ConfigurationField,
  type ConfigurationScope,
} from "../configCapabilities";
import { reviewedFrpcReleases } from "../reviewedFrpcReleases";
import { formatConfigDefault, getConfigDefault } from "../configDefaults";
import { useI18n } from "../i18n";
import { useAppStore } from "../store";
import { Badge, Dialog, Input, Select } from "./ui";

export function VersionConfigChecklist({ version, onClose }: { version: string; onClose: () => void }) {
  const { t, language } = useI18n();
  const versions = useAppStore((state) => state.versions);
  const [selectedVersion, setSelectedVersion] = useState(version);
  const [scope, setScope] = useState<ConfigurationScope | "all">("all");
  const [search, setSearch] = useState("");
  const state = getConfigurationVersionState(selectedVersion);
  const sourceVersion = getConfigDefault(selectedVersion, "serverAddr", "profile").sourceVersion ?? selectedVersion;
  const supported = useMemo(() => configurationFields.filter((field) => getConfigCapability(selectedVersion, field.key, field.scope).supported), [selectedVersion]);
  const visible = supported.filter((field) => (scope === "all" || field.scope === scope) && `${field.key} ${field.group} ${field.labelZh} ${field.labelEn}`.toLowerCase().includes(search.trim().toLowerCase()));
  const versionOptions = [...new Set([selectedVersion, ...versions.map((item) => item.version), ...reviewedFrpcReleases])].sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

  function applicability(field: ConfigurationField): string {
    const condition = field.condition;
    const labels: string[] = [];
    if (condition?.roles) labels.push(condition.roles.map((role) => role === "provider" ? t("提供者", "provider") : t("访问者", "visitor")).join(" / "));
    if (condition?.protocols) labels.push(condition.protocols.map((protocol) => protocol.toUpperCase()).join(" / "));
    if (condition?.pluginTypes) labels.push(condition.pluginTypes.join(" / "));
    if (condition?.authMethods) labels.push(condition.authMethods.join(" / "));
    if (["webServer.addr", "loginFailExit", "log.to", "log.level", "log.disablePrintColor", "enabled"].includes(field.key)) labels.push(t("应用管理", "managed by app"));
    return labels.join(" · ") || t("通用", "General");
  }

  function defaultValue(field: ConfigurationField) {
    if (field.kind === "choice") return <span className="muted">—</span>;
    const result = getConfigDefault(selectedVersion, field.key, field.scope);
    const label = formatConfigDefault(result, language);
    const note = language === "zh" ? result.reasonZh : result.reasonEn;
    return <div className="version-config-default"><code>{label}</code>{note && <span>{note}</span>}</div>;
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }} title={t("frpc 版本配置清单", "frpc configuration checklist")} description={t("查看指定版本可用的连接、隧道与插件配置。编辑器按此清单和协议条件展示选项。", "View connection, tunnel and plugin options for a release. Editors use this inventory and protocol conditions.")} className="version-config-dialog">
      <div className="version-config-body">
        <div className="version-config-filters">
          <Select aria-label={t("配置清单版本", "Checklist version")} value={selectedVersion} onValueChange={setSelectedVersion} options={versionOptions.map((value) => ({ value, label: `frpc ${value}` }))} />
          <Select aria-label={t("配置清单范围", "Checklist scope")} value={scope} onValueChange={(value) => setScope(value as ConfigurationScope | "all")} options={[
            { value: "all", label: t("全部配置", "All configuration") },
            { value: "profile", label: t("服务器连接", "Server connection") },
            { value: "tunnel", label: t("隧道与插件", "Tunnels and plugins") },
          ]} />
          <div className="search-field"><Search size={15} aria-hidden="true" /><Input aria-label={t("搜索配置字段", "Search configuration fields")} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("搜索配置键…", "Search configuration keys…")} /></div>
        </div>
        <div className="version-config-context" aria-live="polite">
          <Badge tone={state.supported ? "success" : "warning"}>frpc {selectedVersion}</Badge>
          <p>{language === "zh" ? state.reasonZh : state.reasonEn}</p>
        </div>
        {state.supported && <>
          <p className="field-hint">{t(`本版本共有 ${supported.length} 项配置键与类型选项，当前显示 ${visible.length} 项。编辑器直接显示该版本默认值；未修改的高级项由 frpc 处理。`, `${supported.length} configuration keys and choices are available; ${visible.length} shown. Editors display this release’s defaults; untouched advanced fields remain managed by frpc.`)}</p>
          <div className="table-wrap version-config-table">
            <table className="data-table">
              <thead><tr><th>{t("范围", "Scope")}</th><th>{t("配置键 / 类型选项", "Configuration key / choice")}</th><th>{t("最低版本", "First supported")}</th><th>{t("默认值", "Default value")}</th><th>{t("适用条件", "Applies to")}</th></tr></thead>
              <tbody>{visible.map((field) => <tr key={`${field.scope}:${field.key}`}>
                <td>{field.scope === "profile" ? t("连接", "Connection") : t("隧道", "Tunnel")}</td>
                <td className="mono">{field.key}{field.kind === "choice" && <span className="role-label">{t("类型选项", "choice")}</span>}</td>
                <td className="mono">{field.minVersion}</td><td>{defaultValue(field)}</td><td>{applicability(field)}</td>
              </tr>)}{visible.length === 0 && <tr><td colSpan={5}><div className="empty-state"><p>{t("没有匹配的配置项。", "No matching configuration fields.")}</p></div></td></tr>}</tbody>
            </table>
          </div>
        </>}
        <p className="field-hint">{t("清单覆盖本应用已实现的参数。日志、登录重试与本机监听地址由应用管理；执行型 Token 来源、外部 includes、Store 和 VirtualNet 尚未开放。未知版本不会推定兼容。", "The inventory covers options implemented by this app. Logging, login retries and the local management address are managed by the app. Executable token sources, external includes, Store and VirtualNet are not enabled. Unknown releases are not assumed compatible.")}</p>
        {state.supported && <a className="version-config-source" href={`https://github.com/fatedier/frp/tree/v${sourceVersion}/pkg/config/v1`} target="_blank" rel="noreferrer">{t("查看该版本官方配置定义", "View official configuration definitions")}</a>}
      </div>
    </Dialog>
  );
}
