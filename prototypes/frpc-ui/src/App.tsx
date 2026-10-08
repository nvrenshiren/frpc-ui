import { useEffect, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  FileSliders,
  ListFilter,
  LoaderCircle,
  Moon,
  Network,
  Pencil,
  Play,
  Plus,
  RotateCw,
  Search,
  Square,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { useAppStore } from "./store";
import {
  makeProfile,
  makeTunnel,
  type BatchResult,
  type Page,
  type Profile,
  type Tunnel,
} from "./model";
import { useI18n } from "./i18n";
import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  Input,
  Select,
} from "./components/ui";
import { ProfileEditor, TunnelEditor } from "./components/Editors";
import {
  VersionsView,
  LogsView,
  SettingsView,
} from "./components/UtilityViews";
import { ConfigExchange } from "./components/ConfigExchange";

const pageNames: Record<Page, [string, string]> = {
  overview: ["工作台", "Workspace"],
  connections: ["连接", "Connections"],
  tunnels: ["隧道", "Tunnels"],
  versions: ["版本库", "Versions"],
  logs: ["日志", "Logs"],
  settings: ["设置", "Settings"],
};

function useBatchAction() {
  const [busy, setBusy] = useState(false);
  const { t } = useI18n();
  async function execute(action: () => Promise<BatchResult[]>) {
    setBusy(true);
    try {
      const results = await action();
      const failed = results.filter((result) => !result.success).length;
      if (failed)
        toast.warning(
          t(
            `${results.length} 个连接处理完成，${failed} 个需要重试。`,
            `${results.length} connections processed; ${failed} need attention.`,
          ),
        );
      else
        toast.success(
          t(
            `${results.length} 个连接处理完成。`,
            `${results.length} connections processed.`,
          ),
        );
    } catch {
      toast.error(
        t("操作未完成，请重试。", "Operation did not complete. Please retry."),
      );
    } finally {
      setBusy(false);
    }
  }
  return { busy, execute };
}

function Status({ profile }: { profile: Profile }) {
  const { t } = useI18n();
  if (profile.process === "starting" || profile.process === "stopping")
    return (
      <Badge>
        <LoaderCircle size={12} className="spin" />
        {profile.process === "starting"
          ? t("启动中", "Starting")
          : t("停止中", "Stopping")}
      </Badge>
    );
  if (profile.connection === "failed" || profile.process === "failed")
    return (
      <Badge tone="danger">
        <span className="status-dot" />
        {t("连接异常", "Connection error")}
      </Badge>
    );
  if (profile.process === "running")
    return (
      <Badge tone={profile.connection === "confirmed" ? "success" : "warning"}>
        <span className="status-dot" />
        {profile.connection === "confirmed"
          ? t("已连接", "Connected")
          : t("等待确认", "Awaiting confirmation")}
      </Badge>
    );
  return (
    <Badge>
      <span className="status-dot" />
      {t("已停止", "Stopped")}
    </Badge>
  );
}

export default function App() {
  const store = useAppStore();
  const { t, language } = useI18n();
  const [profileEdit, setProfileEdit] = useState<Profile | null>(null);
  const [tunnelEdit, setTunnelEdit] = useState<Tunnel | null>(null);
  const [exchange, setExchange] = useState<Profile | null>(null);
  const [help, setHelp] = useState(false);
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  const dark =
    store.settings.theme === "dark" ||
    (store.settings.theme === "system" && systemDark);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => setSystemDark(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("light", !dark);
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  }, [dark, language]);
  const currentScope = store.profiles.find((p) => p.id === store.scope);
  const scopedProfiles = currentScope ? [currentScope] : store.profiles;
  const connected = store.profiles.filter(
    (p) => p.connection === "confirmed" && p.process === "running",
  ).length;
  const failed = store.profiles.filter(
    (p) => p.connection === "failed" || p.process === "failed",
  ).length;
  const pending = store.profiles.filter((p) => p.pending).length;
  const newProfile = () => {
    let webPort = 7400;
    while (store.profiles.some((p) => p.webPort === webPort)) webPort++;
    setProfileEdit(
      makeProfile({
        name: t("新建连接", "New connection"),
        webPort,
        version: store.versions.find((v) => v.installed)?.version ?? "",
      }),
    );
  };
  const newTunnel = () =>
    setTunnelEdit(
      makeTunnel({
        name: t("新建隧道", "New tunnel"),
        profileId: currentScope?.id ?? store.profiles[0]?.id ?? "",
      }),
    );
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        {t("跳转到工作区", "Skip to workspace")}
      </a>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            <Network size={23} />
          </span>
          <strong>
            frpc<span className="brand-suffix">/ ui</span>
          </strong>
          <span className="brand-description">
            {t("连接管理工作台", "Connection workspace")}
          </span>
        </div>
        <div className="topbar-tools">
          <span className="demo-tag">
            <span className="status-dot" />
            {t("交互原型 · 模拟数据", "Interactive prototype · demo data")}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label={
              dark
                ? t("切换亮色", "Switch to light theme")
                : t("切换暗色", "Switch to dark theme")
            }
            onClick={() =>
              store.updateSettings({ theme: dark ? "light" : "dark" })
            }
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label={t("切换英文", "Switch to Chinese")}
            onClick={() =>
              store.updateSettings({
                language: language === "zh" ? "en" : "zh",
              })
            }
          >
            {language === "zh" ? "EN" : "中文"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("原型使用说明", "Prototype guide")}
            onClick={() => setHelp(true)}
          >
            <CircleHelp size={17} />
          </Button>
        </div>
      </header>
      <nav className="section-nav" aria-label={t("主导航", "Main navigation")}>
        {(Object.keys(pageNames) as Page[]).map((page, index) => (
          <button
            key={page}
            className={store.page === page ? "nav-item active" : "nav-item"}
            aria-current={store.page === page ? "page" : undefined}
            onClick={() => store.setPage(page)}
          >
            <span className="nav-index">0{index + 1}</span>
            {t(...pageNames[page])}
            {page === "logs" && failed > 0 && <span className="nav-alert" />}
          </button>
        ))}
        <span className="nav-end mono">FRPC / MULTI-CONNECTION</span>
      </nav>
      <main id="main" className="workspace">
        <div className="page-heading">
          <div>
            <h1>
              {store.page === "overview"
                ? t("连接工作台", "Connection workspace")
                : t(...pageNames[store.page])}
            </h1>
            <p>
              {store.page === "overview"
                ? t(
                    "集中维护连接与隧道，让每一次修改都有明确归属。",
                    "Maintain connections and tunnels together, with clear ownership of every change.",
                  )
                : store.page === "connections"
                  ? t(
                      "独立配置、独立运行。选择连接后执行批量操作。",
                      "Independent configuration and runtime. Select connections for batch actions.",
                    )
                  : store.page === "tunnels"
                    ? t(
                        "所有映射统一检索。保存配置后，在所属连接应用。",
                        "Search every mapping. Apply saved changes to their connection.",
                      )
                    : store.page === "versions"
                      ? t(
                          "每个连接使用明确版本，下载与运行状态分别管理。",
                          "Assign a version to each connection; manage downloads separately from runtime.",
                        )
                      : store.page === "logs"
                        ? t(
                            "按连接定位事件，日志与进程状态一起判断。",
                            "Trace events by connection and assess them alongside runtime state.",
                          )
                        : t(
                            "工作台偏好与桌面行为。",
                            "Workspace preferences and desktop behavior.",
                          )}
            </p>
          </div>
          <div className="heading-actions">
            {(store.page === "overview" || store.page === "tunnels") && (
              <Button
                variant="primary"
                onClick={newTunnel}
                disabled={store.profiles.length === 0}
              >
                <Plus size={16} />
                {t("新建隧道", "New tunnel")}
              </Button>
            )}
            {store.page === "connections" && (
              <Button variant="primary" onClick={newProfile}>
                <Plus size={16} />
                {t("新建连接", "New connection")}
              </Button>
            )}
          </div>
        </div>
        {store.page === "overview" && (
          <>
            <div className="section-heading">
              <h2>
                <span className="section-number">01</span>
                {t("连接概况", "Connections at a glance")}
              </h2>
              <div className="summary-line">
                <span>
                  <i className="dot success" />
                  {connected} {t("已连接", "connected")}
                </span>
                <span>
                  <i className="dot danger" />
                  {failed} {t("异常", "errors")}
                </span>
                <span>
                  <i className="dot warning" />
                  {pending} {t("待应用", "pending")}
                </span>
                <Button variant="ghost" size="sm" onClick={newProfile}>
                  <Plus size={14} />
                  {t("添加连接", "Add connection")}
                </Button>
              </div>
            </div>
            <ConnectionPlates onEdit={setProfileEdit} />
            <div className="section-heading tunnel-heading">
              <h2>
                <span className="section-number">02</span>
                {t("隧道索引", "Tunnel register")}
                <span className="count">{store.tunnels.length}</span>
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => store.setPage("tunnels")}
              >
                {t("查看全部", "View all")}
                <ArrowRight size={14} />
              </Button>
            </div>
          </>
        )}
        {(store.page === "overview" || store.page === "tunnels") && (
          <TunnelRegister
            key={store.page}
            onEdit={setTunnelEdit}
            onAdd={newTunnel}
          />
        )}
        {store.page === "connections" && (
          <ConnectionTable
            profiles={scopedProfiles}
            onEdit={setProfileEdit}
            onExchange={setExchange}
          />
        )}
        {store.page === "versions" && <VersionsView />}
        {store.page === "logs" && <LogsView />}
        {store.page === "settings" && <SettingsView />}
        <BatchResults />
        <footer className="workspace-footer">
          <span>
            {t(
              "仅演示交互；当前未连接真实 frps 或启动本机 frpc。",
              "Interaction demo only; no live frps connection or local frpc process.",
            )}
          </span>
          <span className="mono">PROTOTYPE / 01</span>
        </footer>
      </main>
      <ProfileEditor
        profile={profileEdit}
        onClose={() => setProfileEdit(null)}
      />
      <TunnelEditor tunnel={tunnelEdit} onClose={() => setTunnelEdit(null)} />
      <ConfigExchange profile={exchange} onClose={() => setExchange(null)} />
      <Dialog
        open={help}
        onOpenChange={setHelp}
        title={t("检查原型", "Review the prototype")}
        description={t(
          "可直接检查的主要流程",
          "Key workflows available to review",
        )}
      >
        <div className="help-content">
          <ol>
            <li>
              {t(
                "在工作台点击连接，筛选所属隧道；勾选当前结果后批量启用或停用。",
                "Click a connection to filter its tunnels; select visible results to enable or disable them.",
              )}
            </li>
            <li>
              {t(
                "修改后显示待应用。选择连接并应用，检查逐项执行结果。",
                "Edits are marked pending. Apply them to selected connections and inspect per-connection outcomes.",
              )}
            </li>
            <li>
              {t(
                "备用节点首次启动或应用会模拟失败，再次重试成功，用于检查恢复流程。",
                "The backup node simulates failure on its first start or apply, then succeeds on retry.",
              )}
            </li>
            <li>
              {t(
                "连接页可以编辑、导入导出 TOML；版本页阻止删除被连接使用的版本。",
                "Edit connections, import or export TOML, and check version ownership protection.",
              )}
            </li>
          </ol>
          <p className="notice">
            {t(
              "配置与凭据仅保存在本页内存，刷新后重置。主题、语言和导航偏好保存在浏览器。",
              "Configuration and credentials stay in page memory and reset on reload. Theme, language and navigation preferences persist in the browser.",
            )}
          </p>
        </div>
      </Dialog>
      <Toaster
        theme={dark ? "dark" : "light"}
        position="bottom-right"
        richColors
        closeButton
      />
    </div>
  );
}

function ConnectionPlates({ onEdit }: { onEdit: (profile: Profile) => void }) {
  const store = useAppStore();
  const { t } = useI18n();
  const { busy, execute } = useBatchAction();
  return (
    <div className="connection-plates">
      {store.profiles.map((profile, index) => (
        <article
          key={profile.id}
          className={`connection-plate ${store.scope === profile.id ? "selected" : ""}`}
        >
          <div className="plate-top">
            <span className="plate-index mono">
              CN / {String(index + 1).padStart(2, "0")}
            </span>
            <Status profile={profile} />
          </div>
          <div className="plate-identity">
            <button
              className="plate-title"
              aria-pressed={store.scope === profile.id}
              onClick={() =>
                store.setScope(store.scope === profile.id ? "all" : profile.id)
              }
            >
              {profile.name}
              <ChevronRight size={15} />
            </button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t(
                `编辑连接 ${profile.name}`,
                `Edit connection ${profile.name}`,
              )}
              onClick={() => onEdit(profile)}
            >
              <Pencil size={14} />
            </Button>
          </div>
          <p className="plate-address mono">
            {profile.serverAddr}:{profile.serverPort}
          </p>
          <div className="plate-meta">
            <span>
              {store.tunnels.filter((v) => v.profileId === profile.id).length}{" "}
              {t("条隧道", "tunnels")}
            </span>
            <span className="mono">v{profile.version}</span>
            {profile.pending && (
              <span className="pending-label">{t("待应用", "Pending")}</span>
            )}
          </div>
          <div className="plate-footer">
            <span className="muted">
              {profile.lastError
                ? t("需重试连接", "Retry needed")
                : profile.process === "running"
                  ? t(`进程运行 ${profile.uptime}`, `Running ${profile.uptime}`)
                  : t("进程未运行", "Process stopped")}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={
                busy ||
                profile.process === "starting" ||
                profile.process === "stopping"
              }
              onClick={() =>
                execute(() =>
                  profile.process === "running" &&
                  profile.connection === "confirmed"
                    ? store.stopProfiles([profile.id])
                    : store.startProfiles([profile.id]),
                )
              }
            >
              {profile.process === "running" &&
              profile.connection === "confirmed" ? (
                <Square size={12} />
              ) : (
                <Play size={12} />
              )}{" "}
              {profile.process === "running" &&
              profile.connection === "confirmed"
                ? t("停止", "Stop")
                : profile.connection === "failed"
                  ? t("重试", "Retry")
                  : t("启动", "Start")}
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}

function TunnelRegister({
  onEdit,
  onAdd,
}: {
  onEdit: (tunnel: Tunnel) => void;
  onAdd: () => void;
}) {
  const store = useAppStore();
  const { t } = useI18n();
  const { busy, execute } = useBatchAction();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [state, setState] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [remove, setRemove] = useState(false);
  const tunnels = store.tunnels.filter((tunnel) => {
    const profile = store.profiles.find((p) => p.id === tunnel.profileId);
    return (
      (store.scope === "all" || tunnel.profileId === store.scope) &&
      (type === "all" || type === tunnel.type) &&
      (state === "all" ||
        (state === "pending" && tunnel.apply !== "applied") ||
        (state === "enabled" && tunnel.enabled) ||
        (state === "disabled" && !tunnel.enabled)) &&
      `${tunnel.name} ${profile?.name} ${tunnel.localIP} ${tunnel.localPort} ${tunnel.remotePort} ${tunnel.domain}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  });
  const visibleIds = tunnels.map((v) => v.id);
  const chosen = selected.filter((id) => visibleIds.includes(id));
  const chosenTunnels = tunnels.filter((v) => chosen.includes(v.id));
  const profileIds = [...new Set(chosenTunnels.map((v) => v.profileId))];
  const pendingProfiles = store.profiles.filter(
    (p) => p.pending && (store.scope === "all" || p.id === store.scope),
  );
  const toggle = (id: string, checked: boolean) =>
    setSelected((ids) =>
      checked ? [...new Set([...ids, id])] : ids.filter((v) => v !== id),
    );
  function changeFilter(action: () => void) {
    setSelected([]);
    action();
  }
  return (
    <section
      className="register-panel"
      aria-label={t("隧道列表", "Tunnel list")}
    >
      <div className="view-toolbar">
        <div className="search-field">
          <Search size={16} />
          <Input
            aria-label={t("搜索隧道", "Search tunnels")}
            placeholder={t(
              "搜索名称、地址或端口…",
              "Search names, addresses or ports…",
            )}
            value={search}
            onChange={(e) => changeFilter(() => setSearch(e.target.value))}
          />
        </div>
        <Select
          aria-label={t("筛选连接", "Filter connection")}
          value={store.scope}
          onChange={(e) => changeFilter(() => store.setScope(e.target.value))}
        >
          <option value="all">{t("所有连接", "All connections")}</option>
          {store.profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        <Select
          aria-label={t("筛选协议", "Filter protocol")}
          value={type}
          onChange={(e) => changeFilter(() => setType(e.target.value))}
        >
          <option value="all">{t("所有协议", "All protocols")}</option>
          {["tcp", "udp", "http", "https", "stcp", "sudp", "xtcp"].map((v) => (
            <option key={v} value={v}>
              {v.toUpperCase()}
            </option>
          ))}
        </Select>
        <Select
          aria-label={t("筛选配置状态", "Filter configuration state")}
          value={state}
          onChange={(e) => changeFilter(() => setState(e.target.value))}
        >
          <option value="all">{t("所有状态", "All states")}</option>
          <option value="pending">
            {t("待应用 / 失败", "Pending / failed")}
          </option>
          <option value="enabled">{t("已启用", "Enabled")}</option>
          <option value="disabled">{t("已停用", "Disabled")}</option>
        </Select>
        <Button
          size="sm"
          disabled={busy || pendingProfiles.length === 0}
          onClick={() =>
            execute(() => store.applyProfiles(pendingProfiles.map((p) => p.id)))
          }
        >
          <RotateCw size={14} className={busy ? "spin" : ""} />
          {t("应用修改", "Apply changes")}
          {pendingProfiles.length > 0 && (
            <span className="button-count">{pendingProfiles.length}</span>
          )}
        </Button>
      </div>
      {chosen.length > 0 && (
        <div className="selection-bar" role="status">
          <strong>
            {t(
              `已选 ${chosen.length} 条隧道 · ${profileIds.length} 个连接`,
              `${chosen.length} tunnels selected · ${profileIds.length} connections`,
            )}
          </strong>
          <div className="selection-actions">
            <Button size="sm" onClick={() => store.toggleTunnels(chosen, true)}>
              <Play size={13} />
              {t("启用", "Enable")}
            </Button>
            <Button
              size="sm"
              onClick={() => store.toggleTunnels(chosen, false)}
            >
              <Square size={13} />
              {t("停用", "Disable")}
            </Button>
            <Button
              size="sm"
              disabled={busy}
              onClick={() => execute(() => store.applyProfiles(profileIds))}
            >
              <RotateCw size={13} />
              {t("应用到连接", "Apply to connections")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setRemove(true)}>
              <Trash2 size={13} />
              {t("删除", "Delete")}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label={t("取消选择", "Clear selection")}
              onClick={() => setSelected([])}
            >
              <X size={14} />
            </Button>
          </div>
        </div>
      )}
      <div className="table-wrap">
        <table className="data-table tunnel-table">
          <thead>
            <tr>
              <th className="check-cell">
                <Checkbox
                  checked={
                    chosen.length === 0
                      ? false
                      : chosen.length === tunnels.length
                        ? true
                        : "indeterminate"
                  }
                  onCheckedChange={(checked) =>
                    setSelected(checked ? visibleIds : [])
                  }
                  disabled={tunnels.length === 0}
                  aria-label={t(
                    "选择当前筛选的全部隧道",
                    "Select all filtered tunnels",
                  )}
                />
              </th>
              <th className="index-cell">#</th>
              <th>{t("隧道名称", "Tunnel name")}</th>
              <th>{t("所属连接", "Connection")}</th>
              <th>{t("协议", "Protocol")}</th>
              <th>{t("本机目标 / 入口", "Local target / bind")}</th>
              <th>{t("远端端口 / 域名", "Remote port / domain")}</th>
              <th>{t("启用", "Enabled")}</th>
              <th>{t("配置状态", "Config state")}</th>
              <th className="align-right">{t("操作", "Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {tunnels.map((tunnel, index) => {
              const profile = store.profiles.find(
                (p) => p.id === tunnel.profileId,
              );
              return (
                <tr
                  key={tunnel.id}
                  className={chosen.includes(tunnel.id) ? "row-selected" : ""}
                >
                  <td className="check-cell">
                    <Checkbox
                      checked={chosen.includes(tunnel.id)}
                      onCheckedChange={(checked) => toggle(tunnel.id, checked)}
                      aria-label={t(
                        `选择隧道 ${tunnel.name}`,
                        `Select tunnel ${tunnel.name}`,
                      )}
                    />
                  </td>
                  <td className="index-cell mono">
                    {String(index + 1).padStart(2, "0")}
                  </td>
                  <td>
                    <button
                      className="table-name"
                      onClick={() => onEdit(tunnel)}
                    >
                      {tunnel.name}
                    </button>
                    {tunnel.role === "visitor" && (
                      <span className="role-label">{t("访客", "Visitor")}</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="connection-link"
                      onClick={() =>
                        changeFilter(() => store.setScope(tunnel.profileId))
                      }
                    >
                      <i
                        className={`dot ${profile?.connection === "confirmed" ? "success" : profile?.connection === "failed" ? "danger" : "neutral"}`}
                      />
                      {profile?.name ?? "—"}
                    </button>
                  </td>
                  <td>
                    <span className="protocol-tag mono">
                      {tunnel.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="mono endpoint">
                    {tunnel.localIP}:{tunnel.localPort}
                    {tunnel.localPortEnd > 0 ? `–${tunnel.localPortEnd}` : ""}
                  </td>
                  <td className="mono endpoint">
                    {tunnel.type === "tcp" || tunnel.type === "udp" ? (
                      <>
                        {tunnel.remotePort}
                        {tunnel.remotePortEnd > 0
                          ? `–${tunnel.remotePortEnd}`
                          : ""}
                      </>
                    ) : (
                      tunnel.domain ||
                      tunnel.serverName || (
                        <span className="muted">
                          {t("私有访问", "Private")}
                        </span>
                      )
                    )}
                  </td>
                  <td>
                    <Checkbox
                      checked={tunnel.enabled}
                      onCheckedChange={(checked) =>
                        store.toggleTunnels([tunnel.id], checked)
                      }
                      aria-label={t(
                        `启用隧道 ${tunnel.name}`,
                        `Enable tunnel ${tunnel.name}`,
                      )}
                    />
                  </td>
                  <td>
                    <Badge
                      tone={
                        tunnel.apply === "failed"
                          ? "danger"
                          : tunnel.apply === "pending"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {tunnel.apply === "failed"
                        ? t("应用失败", "Apply failed")
                        : tunnel.apply === "pending"
                          ? t("待应用", "Pending")
                          : t("已应用", "Applied")}
                    </Badge>
                  </td>
                  <td className="align-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t(
                        `编辑隧道 ${tunnel.name}`,
                        `Edit tunnel ${tunnel.name}`,
                      )}
                      onClick={() => onEdit(tunnel)}
                    >
                      <Pencil size={14} />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {tunnels.length === 0 && (
        <div className="empty-state">
          <ListFilter size={28} />
          <h3>
            {store.tunnels.length === 0
              ? t("尚未添加隧道", "No tunnels yet")
              : t("没有匹配的隧道", "No matching tunnels")}
          </h3>
          <p>
            {store.tunnels.length === 0
              ? t(
                  "先添加一条映射，连接配置即可统一管理。",
                  "Add a mapping to begin managing connection configurations.",
                )
              : t(
                  "调整连接、协议或状态筛选，或者换一个关键词。",
                  "Adjust the filters or try another search term.",
                )}
          </p>
          <Button
            onClick={
              store.tunnels.length === 0
                ? onAdd
                : () => {
                    setSearch("");
                    setState("all");
                    setType("all");
                    store.setScope("all");
                  }
            }
          >
            {store.tunnels.length === 0
              ? t("新建隧道", "New tunnel")
              : t("清除筛选", "Clear filters")}
          </Button>
        </div>
      )}
      <div className="table-footer">
        <span>
          {t(
            `显示 ${tunnels.length} / ${store.tunnels.length} 条`,
            `${tunnels.length} of ${store.tunnels.length} tunnels`,
          )}
          {store.scope !== "all" && (
            <>
              {" "}
              ·{" "}
              <button
                className="text-link"
                onClick={() => changeFilter(() => store.setScope("all"))}
              >
                {t("返回所有连接", "Show all connections")}
              </button>
            </>
          )}
        </span>
        <span>
          {t(
            "开关表示配置意图，应用后生效",
            "Switches set desired state; apply to take effect",
          )}
        </span>
      </div>
      <Dialog
        open={remove}
        onOpenChange={setRemove}
        title={t(
          `删除 ${chosen.length} 条隧道？`,
          `Delete ${chosen.length} tunnels?`,
        )}
        description={t(
          "操作对象限当前已选择的筛选结果。",
          "Only the selected filtered results are affected.",
        )}
      >
        <div className="confirm-content">
          <p>{chosenTunnels.map((v) => v.name).join("、")}</p>
          <p className="notice">
            {t(
              "删除后，所属连接会标记待应用。原型刷新后恢复演示数据。",
              "Their connections will be marked pending. Reloading restores the demo data.",
            )}
          </p>
          <div className="form-footer">
            <Button onClick={() => setRemove(false)}>
              {t("取消", "Cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                store.deleteTunnels(chosen);
                setSelected([]);
                setRemove(false);
                toast.success(
                  t(
                    "隧道已删除，等待应用。",
                    "Tunnels deleted; awaiting apply.",
                  ),
                );
              }}
            >
              {t("删除所选", "Delete selected")}
            </Button>
          </div>
        </div>
      </Dialog>
    </section>
  );
}

function ConnectionTable({
  profiles,
  onEdit,
  onExchange,
}: {
  profiles: Profile[];
  onEdit: (p: Profile) => void;
  onExchange: (p: Profile) => void;
}) {
  const store = useAppStore();
  const { t } = useI18n();
  const { busy, execute } = useBatchAction();
  const [selected, setSelected] = useState<string[]>([]);
  const [remove, setRemove] = useState<Profile | null>(null);
  const [search, setSearch] = useState("");
  const visible = profiles.filter((p) =>
    `${p.name} ${p.serverAddr}`.toLowerCase().includes(search.toLowerCase()),
  );
  const ids = visible.map((p) => p.id);
  const chosen = selected.filter((id) => ids.includes(id));
  return (
    <section className="register-panel">
      <div className="view-toolbar">
        <div className="search-field">
          <Search size={16} />
          <Input
            aria-label={t("搜索连接", "Search connections")}
            placeholder={t(
              "搜索连接名称或服务器…",
              "Search connections or servers…",
            )}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelected([]);
            }}
          />
        </div>
        <Select
          aria-label={t("连接范围", "Connection scope")}
          value={store.scope}
          onChange={(e) => {
            store.setScope(e.target.value);
            setSelected([]);
          }}
        >
          <option value="all">{t("所有连接", "All connections")}</option>
          {store.profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        <span className="toolbar-spacer" />
        <span className="muted">
          {t("先选择，再批量操作", "Select objects for batch actions")}
        </span>
      </div>
      <div className="selection-bar persistent">
        <span>
          {chosen.length > 0
            ? t(
                `已选 ${chosen.length} 个连接`,
                `${chosen.length} connections selected`,
              )
            : t("未选择连接", "No connections selected")}
        </span>
        <div className="selection-actions">
          <Button
            size="sm"
            disabled={busy || chosen.length === 0}
            onClick={() => execute(() => store.startProfiles(chosen))}
          >
            <Play size={13} />
            {t("启动", "Start")}
          </Button>
          <Button
            size="sm"
            disabled={busy || chosen.length === 0}
            onClick={() => execute(() => store.stopProfiles(chosen))}
          >
            <Square size={13} />
            {t("停止", "Stop")}
          </Button>
          <Button
            size="sm"
            disabled={busy || chosen.length === 0}
            onClick={() => execute(() => store.applyProfiles(chosen))}
          >
            <RotateCw size={13} />
            {t("应用配置", "Apply configuration")}
          </Button>
        </div>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th className="check-cell">
                <Checkbox
                  checked={
                    chosen.length === 0
                      ? false
                      : chosen.length === visible.length
                        ? true
                        : "indeterminate"
                  }
                  onCheckedChange={(checked) => setSelected(checked ? ids : [])}
                  disabled={visible.length === 0}
                  aria-label={t(
                    "选择当前筛选的全部连接",
                    "Select all filtered connections",
                  )}
                />
              </th>
              <th>{t("连接名称", "Connection name")}</th>
              <th>{t("服务器", "Server")}</th>
              <th>{t("连接状态", "Connection state")}</th>
              <th>{t("进程", "Process")}</th>
              <th>{t("版本 / 隧道", "Version / tunnels")}</th>
              <th>{t("配置", "Configuration")}</th>
              <th className="align-right">{t("操作", "Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => (
              <tr
                key={p.id}
                className={chosen.includes(p.id) ? "row-selected" : ""}
              >
                <td>
                  <Checkbox
                    checked={chosen.includes(p.id)}
                    onCheckedChange={(checked) =>
                      setSelected((values) =>
                        checked
                          ? [...new Set([...values, p.id])]
                          : values.filter((v) => v !== p.id),
                      )
                    }
                    aria-label={t(
                      `选择连接 ${p.name}`,
                      `Select connection ${p.name}`,
                    )}
                  />
                </td>
                <td>
                  <button className="table-name" onClick={() => onEdit(p)}>
                    {p.name}
                  </button>
                  {p.autoConnect && (
                    <span className="cell-description">
                      {t("启动应用时自动连接", "Connect on app startup")}
                    </span>
                  )}
                </td>
                <td className="mono">
                  {p.serverAddr}:{p.serverPort}
                </td>
                <td>
                  <Status profile={p} />
                </td>
                <td>
                  <span className="process-state">
                    <Activity size={12} />
                    {p.process === "running"
                      ? t("运行中", "Running")
                      : p.process === "failed"
                        ? t("失败", "Failed")
                        : p.process === "starting"
                          ? t("启动中", "Starting")
                          : p.process === "stopping"
                            ? t("停止中", "Stopping")
                            : t("停止", "Stopped")}
                  </span>
                </td>
                <td className="mono">
                  {p.version}{" "}
                  <span className="muted">
                    / {store.tunnels.filter((v) => v.profileId === p.id).length}
                  </span>
                </td>
                <td>
                  {p.pending ? (
                    <Badge tone="warning">{t("待应用", "Pending")}</Badge>
                  ) : (
                    <span className="muted">{t("已同步", "In sync")}</span>
                  )}
                </td>
                <td>
                  <div className="row-actions">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t(
                        `启动或重试 ${p.name}`,
                        `Start or retry ${p.name}`,
                      )}
                      disabled={
                        busy ||
                        p.process === "starting" ||
                        p.process === "stopping"
                      }
                      onClick={() => execute(() => store.startProfiles([p.id]))}
                    >
                      <Play size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t(
                        `停止连接 ${p.name}`,
                        `Stop connection ${p.name}`,
                      )}
                      disabled={busy || p.process === "stopped"}
                      onClick={() => execute(() => store.stopProfiles([p.id]))}
                    >
                      <Square size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t(
                        `编辑连接 ${p.name}`,
                        `Edit connection ${p.name}`,
                      )}
                      onClick={() => onEdit(p)}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t(
                        `导入导出 ${p.name}`,
                        `Import or export ${p.name}`,
                      )}
                      onClick={() => onExchange(p)}
                    >
                      <ArrowDownToLine size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t(
                        `删除连接 ${p.name}`,
                        `Delete connection ${p.name}`,
                      )}
                      onClick={() => setRemove(p)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {visible.length === 0 && (
        <div className="empty-state">
          <Network size={28} />
          <h3>{t("没有匹配的连接", "No matching connections")}</h3>
          <p>
            {t(
              "清除搜索或添加一个连接。",
              "Clear the search or add a connection.",
            )}
          </p>
          <Button
            onClick={() => {
              setSearch("");
              store.setScope("all");
            }}
          >
            {t("清除筛选", "Clear filters")}
          </Button>
        </div>
      )}
      <div className="table-footer">
        <span>
          {t(`${visible.length} 个连接`, `${visible.length} connections`)}
        </span>
        <span>
          {t(
            "进程存活与服务器连接分别记录",
            "Process lifetime and server connection are tracked separately",
          )}
        </span>
      </div>
      <Dialog
        open={Boolean(remove)}
        onOpenChange={(open) => !open && setRemove(null)}
        title={t("删除连接？", "Delete connection?")}
        description={t(
          "此连接下的隧道配置也会一并删除。",
          "Its tunnel configurations will also be deleted.",
        )}
      >
        <div className="confirm-content">
          <p>
            <strong>{remove?.name}</strong> ·{" "}
            {store.tunnels.filter((v) => v.profileId === remove?.id).length}{" "}
            {t("条隧道", "tunnels")}
          </p>
          <p className="notice">
            {t(
              "当前是内存演示。真实客户端应在删除前停止进程并保留恢复入口。",
              "This is an in-memory demo. A real client should stop the process and offer recovery before deleting.",
            )}
          </p>
          <div className="form-footer">
            <Button onClick={() => setRemove(null)}>
              {t("取消", "Cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (remove) store.deleteProfile(remove.id);
                setRemove(null);
                toast.success(t("连接已删除。", "Connection deleted."));
              }}
            >
              {t("删除连接", "Delete connection")}
            </Button>
          </div>
        </div>
      </Dialog>
    </section>
  );
}

function BatchResults() {
  const store = useAppStore();
  const { t } = useI18n();
  const { busy, execute } = useBatchAction();
  const [expanded, setExpanded] = useState(true);
  const failed = store.batchResults.filter((r) => !r.success);
  if (store.batchResults.length === 0) return null;
  return (
    <section
      className="batch-results"
      aria-label={t("批量执行结果", "Batch execution results")}
      aria-live="polite"
    >
      <div className="batch-heading">
        <button
          className="batch-title"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {failed.length ? (
            <FileSliders size={16} />
          ) : (
            <CheckCircle2 size={16} />
          )}{" "}
          {t("执行结果", "Execution results")}
          <span className="muted">
            {store.batchResults.length - failed.length} {t("成功", "succeeded")}{" "}
            / {failed.length} {t("需处理", "need attention")}
          </span>
          <ChevronRight size={15} className={expanded ? "rotated" : ""} />
        </button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("清除执行结果", "Dismiss results")}
          onClick={store.clearBatchResults}
        >
          <X size={15} />
        </Button>
      </div>
      {expanded && (
        <div className="batch-list">
          {store.batchResults.map((r) => (
            <div className="batch-row" key={r.profileId}>
              <span className={`dot ${r.success ? "success" : "danger"}`} />
              <strong>
                {store.profiles.find((p) => p.id === r.profileId)?.name ??
                  r.profileId}
              </strong>
              <span>{r.message}</span>
              {!r.success && (
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() =>
                    execute(() =>
                      r.action === "stop"
                        ? store.stopProfiles([r.profileId])
                        : r.action === "apply"
                          ? store.applyProfiles([r.profileId])
                          : store.startProfiles([r.profileId]),
                    )
                  }
                >
                  <RotateCw size={13} />
                  {t("重试", "Retry")}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
