import { lazy, Suspense, useEffect, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
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
import {
  VersionsView,
  LogsView,
  SettingsView,
} from "./components/UtilityViews";
import { desktopHost, errorMessage } from "./desktop";

const ProfileEditor = lazy(() => import("./components/Editors").then((module) => ({ default: module.ProfileEditor })));
const TunnelEditor = lazy(() => import("./components/Editors").then((module) => ({ default: module.TunnelEditor })));
const ConfigExchange = lazy(() => import("./components/ConfigExchange").then((module) => ({ default: module.ConfigExchange })));

async function completeMutation(
  action: () => Promise<unknown>,
  onSuccess?: () => void,
  message?: string,
) {
  try {
    await action();
    onSuccess?.();
    if (message) toast.success(message);
  } catch (error) {
    toast.error(errorMessage(error));
  }
}

const pageNames: Record<Page, [string, string]> = {
  overview: ["工作台", "Workspace"],
  connections: ["连接", "Connections"],
  tunnels: ["隧道", "Tunnels"],
  versions: ["版本库", "Versions"],
  logs: ["日志", "Logs"],
  settings: ["设置", "Settings"],
};

function useBatchAction() {
  const [localBusy, setBusy] = useState(false);
  const storeBusy = useAppStore((state) => state.busy);
  const busy = localBusy || storeBusy;
  const { t } = useI18n();
  async function execute(action: () => Promise<BatchResult[]>) {
    if (busy) return;
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
    } catch (error) {
      toast.error(errorMessage(error));
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
  const [exchangeImport, setExchangeImport] = useState(false);
  const [help, setHelp] = useState(false);
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  const dark =
    store.settings.theme === "dark" ||
    (store.settings.theme === "system" && systemDark);
  useEffect(() => {
    void useAppStore.getState().bootstrap();
    if (!desktopHost) return;
    const interval = window.setInterval(() => {
      void useAppStore.getState().refresh();
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);
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
  const failed = store.profiles.filter(
    (p) => p.connection === "failed" || p.process === "failed",
  ).length;
  const newProfile = () => {
    setProfileEdit(
      makeProfile({
        name: t("新建连接", "New connection"),
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
  const importConfiguration = () => {
    setExchangeImport(true);
    setExchange(
      makeProfile({
        name: t("导入连接", "Imported connection"),
        version:
          store.versions.find((version) => version.installed)?.version ?? "",
      }),
    );
  };
  if (!store.ready)
    return (
      <div className="app-shell">
        <main className="workspace">
          <div className="empty-state" aria-live="polite">
            <Network size={32} />
            <h1>{t("frpc 连接工作台", "frpc connection workspace")}</h1>
            {store.loadError ? (
              <>
                <p role="alert">{store.loadError}</p>
                <Button onClick={() => void store.retryLoading()}>
                  {t("重新加载", "Retry loading")}
                </Button>
              </>
            ) : (
              <p>
                <LoaderCircle size={16} className="spin" />{" "}
                {t("正在读取本机配置…", "Loading local configuration…")}
              </p>
            )}
          </div>
        </main>
      </div>
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
          {!desktopHost && (
            <span className="demo-tag">
              <span className="status-dot" />
              {t("浏览器演示模式", "Browser demo mode")}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            disabled={store.busy}
            aria-label={
              dark
                ? t("切换亮色", "Switch to light theme")
                : t("切换暗色", "Switch to dark theme")
            }
            onClick={() =>
              completeMutation(() =>
                store.updateSettings({ theme: dark ? "light" : "dark" }),
              )
            }
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={store.busy}
            aria-label={t("切换英文", "Switch to Chinese")}
            onClick={() =>
              completeMutation(() =>
                store.updateSettings({
                  language: language === "zh" ? "en" : "zh",
                }),
              )
            }
          >
            {language === "zh" ? "EN" : "中文"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("使用说明", "User guide")}
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
        {store.loadError && (
          <div className="prototype-note" role="alert">
            <p>
              {t("状态刷新失败：", "Status refresh failed: ")}
              {store.loadError}
            </p>
            <Button size="sm" onClick={() => void store.retryLoading()}>
              {t("重试", "Retry")}
            </Button>
          </div>
        )}
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
                    "查看服务器连接的基本信息、运行状态与待应用修改。",
                    "Review server details, connection status and pending changes.",
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
            {store.page === "tunnels" && (
              <Button
                variant="primary"
                onClick={newTunnel}
                disabled={store.profiles.length === 0}
              >
                <Plus size={16} />
                {t("新建隧道", "New tunnel")}
              </Button>
            )}
            {(store.page === "connections" || store.page === "overview") && (
              <Button onClick={importConfiguration}>
                <ArrowDownToLine size={16} />
                {t("导入配置", "Import configuration")}
              </Button>
            )}
            {(store.page === "connections" || store.page === "overview") && (
              <Button variant="primary" onClick={newProfile}>
                <Plus size={16} />
                {t("新建连接", "New connection")}
              </Button>
            )}
          </div>
        </div>
        {store.page === "overview" && (
          <ConnectionCards onEdit={setProfileEdit} />
        )}
        {store.page === "tunnels" && (
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
            onExchange={(profile) => {
              setExchangeImport(false);
              setExchange(profile);
            }}
          />
        )}
        {store.page === "versions" && <VersionsView />}
        {store.page === "logs" && <LogsView />}
        {store.page === "settings" && <SettingsView />}
        <BatchResults />
        <footer className="workspace-footer">
          <span>
            {t(
              desktopHost
                ? "进程、登录确认与配置状态由本机 frpc 提供。"
                : "浏览器仅演示交互；真实连接和持久配置请使用桌面应用。",
              desktopHost
                ? "Runtime, login confirmation and configuration status come from local frpc."
                : "The browser demonstrates interactions. Use the desktop app for live connections and persistent configuration.",
            )}
          </span>
          <span className="mono">
            {desktopHost ? "TAURI / RUST" : "BROWSER / DEMO"}
          </span>
        </footer>
      </main>
      <Suspense fallback={null}>
      {profileEdit && <ProfileEditor
        profile={profileEdit}
        onClose={() => setProfileEdit(null)}
      />}
      {tunnelEdit && <TunnelEditor tunnel={tunnelEdit} onClose={() => setTunnelEdit(null)} />}
      {exchange && <ConfigExchange
        profile={exchange}
        initialMode={exchangeImport ? "import" : "export"}
        onClose={() => setExchange(null)}
      />}
      </Suspense>
      <Dialog
        open={help}
        onOpenChange={setHelp}
        title={t("使用说明", "User guide")}
        description={t(
          "可直接检查的主要流程",
          "Key workflows available to review",
        )}
      >
        <div className="help-content">
          <ol>
            <li>
              {t(
                "工作台查看服务器连接卡片。进入隧道页筛选所属连接，勾选结果后批量启用或停用。",
                "Review server cards in Workspace. Filter by connection in Tunnels and select results to enable or disable them in bulk.",
              )}
            </li>
            <li>
              {t(
                "修改后显示待应用。选择连接并重启应用配置，检查逐项执行结果。",
                "Edits are marked pending. Restart selected connections to apply configuration, then inspect per-connection outcomes.",
              )}
            </li>
            <li>
              {t(
                "启动进程后，等待服务器登录确认；失败时查看日志并重试原操作。",
                "After starting the process, wait for server login confirmation. Inspect logs on failure and retry the original action.",
              )}
            </li>
            <li>
              {t(
                "连接页编辑和交换配置；版本库查看逐版本配置清单。编辑器只显示该版本支持的参数，引用中的版本不可删除。",
                "Edit and exchange configuration in Connections. Review release inventories in Versions; editors show supported options and assigned versions cannot be deleted.",
              )}
            </li>
          </ol>
          <p className="notice">
            {t(
              desktopHost
                ? "配置与设置保存到本机应用数据目录。退出应用将停止由应用管理的 frpc 进程。"
                : "浏览器演示配置与凭据仅在内存；刷新后恢复演示数据。界面偏好保存在浏览器。",
              desktopHost
                ? "Configuration and settings are saved in the local application data directory. Quitting stops frpc processes managed by the app."
                : "Browser demo configuration and credentials remain in memory. Reloading restores demo data; interface preferences persist in the browser.",
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

function ConnectionCards({ onEdit }: { onEdit: (profile: Profile) => void }) {
  const store = useAppStore();
  const { t } = useI18n();
  const { busy, execute } = useBatchAction();
  return (
    <div className="connection-plates" aria-label={t("服务器连接", "Server connections")}>
      {store.profiles.length === 0 && (
        <div className="empty-state">
          <p>
            {t(
              "还没有连接。先在版本库安装或导入 frpc，再添加服务器连接。",
              "No connections yet. Install or import frpc in Versions, then add a server connection.",
            )}
          </p>
          <Button onClick={() => store.setPage("versions")}>
            {t("打开版本库", "Open versions")}
          </Button>
        </div>
      )}
      {store.profiles.map((profile) => (
        <article
          key={profile.id}
          className="connection-plate"
          aria-label={profile.name}
        >
          <div className="plate-top">
            <h2 className="plate-title">{profile.name}</h2>
            <Status profile={profile} />
          </div>
          <div className="plate-identity">
            <p className="plate-address mono" title={`${profile.serverAddr}:${profile.serverPort}`}>
              {profile.serverAddr.includes(":") ? `[${profile.serverAddr}]` : profile.serverAddr}:{profile.serverPort}
            </p>
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
          <dl className="plate-details">
            <div><dt>{t("客户端版本", "Client version")}</dt><dd className="mono">v{profile.version}</dd></div>
            <div><dt>{t("传输方式", "Transport")}</dt><dd>{profile.transport.toUpperCase()}{profile.tls ? " · TLS" : ""}</dd></div>
            <div><dt>{t("进程状态", "Process")}</dt><dd>{t(
              profile.process === "running" ? "运行中" : profile.process === "starting" ? "启动中" : profile.process === "stopping" ? "停止中" : profile.process === "failed" ? "异常退出" : "已停止",
              profile.process === "running" ? "Running" : profile.process === "starting" ? "Starting" : profile.process === "stopping" ? "Stopping" : profile.process === "failed" ? "Failed" : "Stopped",
            )}</dd></div>
            <div><dt>{t("配置状态", "Configuration")}</dt><dd className={profile.pending ? "pending-label" : ""}>{profile.pending ? t("待应用", "Pending") : t("已应用", "Applied")}</dd></div>
          </dl>
          {profile.lastError && <p className="plate-error" title={profile.lastError}>{profile.lastError}</p>}
          <div className="plate-footer">
            <span className="muted">
              {profile.process === "running" ? profile.uptime : t("进程未运行", "Process stopped")}
            </span>
            <div className="plate-actions">
            {profile.pending && <Button
              variant="ghost"
              size="sm"
              disabled={busy || profile.process === "starting" || profile.process === "stopping"}
              onClick={() => execute(() => store.applyProfiles([profile.id]))}
            ><RotateCw size={12} />{profile.process === "running" ? t("重启并应用", "Restart & apply") : t("验证配置", "Verify config")}</Button>}
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
                  profile.process === "running"
                    ? store.stopProfiles([profile.id])
                    : store.startProfiles([profile.id]),
                )
              }
            >
              {profile.process === "running" ? (
                <Square size={12} />
              ) : (
                <Play size={12} />
              )}{" "}
              {profile.process === "running"
                ? t("停止", "Stop")
                : profile.connection === "failed"
                  ? t("重试", "Retry")
                  : t("启动", "Start")}
            </Button>
            </div>
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
      `${tunnel.name} ${profile?.name} ${tunnel.localIP} ${tunnel.localPort} ${tunnel.remotePort} ${tunnel.domain} ${String(tunnel.advanced?.subdomain ?? "")} ${Array.isArray(tunnel.advanced?.customDomains) ? tunnel.advanced.customDomains.join(" ") : ""}`
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
          onValueChange={(value) => changeFilter(() => store.setScope(value))}
          options={[
            { value: "all", label: t("所有连接", "All connections") },
            ...store.profiles.map((profile) => ({
              value: profile.id,
              label: profile.name,
            })),
          ]}
        />
        <Select
          aria-label={t("筛选协议", "Filter protocol")}
          value={type}
          onValueChange={(value) => changeFilter(() => setType(value))}
          options={[
            { value: "all", label: t("所有协议", "All protocols") },
            ...["tcp", "udp", "http", "https", "stcp", "sudp", "xtcp", "tcpmux"].map(
              (value) => ({ value, label: value.toUpperCase() }),
            ),
          ]}
        />
        <Select
          aria-label={t("筛选配置状态", "Filter configuration state")}
          value={state}
          onValueChange={(value) => changeFilter(() => setState(value))}
          options={[
            { value: "all", label: t("所有状态", "All states") },
            { value: "pending", label: t("待应用 / 失败", "Pending / failed") },
            { value: "enabled", label: t("已启用", "Enabled") },
            { value: "disabled", label: t("已停用", "Disabled") },
          ]}
        />
        <Button
          size="sm"
          disabled={busy || pendingProfiles.length === 0}
          onClick={() =>
            execute(() => store.applyProfiles(pendingProfiles.map((p) => p.id)))
          }
        >
          <RotateCw size={14} className={busy ? "spin" : ""} />
          {t("重启并应用", "Restart & apply")}
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
            <Button
              size="sm"
              disabled={store.busy}
              onClick={() =>
                void completeMutation(() => store.toggleTunnels(chosen, true))
              }
            >
              <Play size={13} />
              {t("启用", "Enable")}
            </Button>
            <Button
              size="sm"
              disabled={store.busy}
              onClick={() =>
                void completeMutation(() => store.toggleTunnels(chosen, false))
              }
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
              {t("重启并应用", "Restart & apply")}
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
                    {tunnel.role === "visitor" && tunnel.advanced?.bindPort === -1
                      ? t("不监听", "No listener")
                      : tunnel.advanced?.plugin && typeof tunnel.advanced.plugin === "object"
                        ? String((tunnel.advanced.plugin as Record<string, unknown>).type ?? "plugin")
                        : <>{tunnel.localIP.includes(":") ? `[${tunnel.localIP}]` : tunnel.localIP}:{tunnel.localPort}{tunnel.localPortEnd > 0 ? `–${tunnel.localPortEnd}` : ""}</>}
                  </td>
                  <td className="mono endpoint">
                    {tunnel.type === "tcp" || tunnel.type === "udp" ? (
                      <>
                        {tunnel.remotePort === 0 ? t("自动分配", "Automatic") : tunnel.remotePort}
                        {tunnel.remotePortEnd > 0
                          ? `–${tunnel.remotePortEnd}`
                          : ""}
                      </>
                    ) : (
                      (Array.isArray(tunnel.advanced?.customDomains) && tunnel.advanced.customDomains.length > 0
                        ? tunnel.advanced.customDomains.join(", ")
                        : tunnel.domain || (typeof tunnel.advanced?.subdomain === "string" ? `${tunnel.advanced.subdomain} · ${t("子域名", "subdomain")}` : "")) ||
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
                      disabled={store.busy}
                      onCheckedChange={(checked) =>
                        void completeMutation(() =>
                          store.toggleTunnels([tunnel.id], checked),
                        )
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
              "删除后，所属连接会标记待应用；重启应用配置后移除运行中的隧道。",
              "Their connections will be marked pending. Restart and apply to remove the running tunnels.",
            )}
          </p>
          <div className="form-footer">
            <Button onClick={() => setRemove(false)}>
              {t("取消", "Cancel")}
            </Button>
            <Button
              variant="danger"
              disabled={store.busy}
              onClick={() =>
                void completeMutation(async () => {
                  await store.deleteTunnels(chosen);
                  setSelected([]);
                  setRemove(false);
                  toast.success(
                    t(
                      "隧道已删除，等待应用。",
                      "Tunnels deleted; awaiting apply.",
                    ),
                  );
                })
              }
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
          onValueChange={(value) => {
            store.setScope(value);
            setSelected([]);
          }}
          options={[
            { value: "all", label: t("所有连接", "All connections") },
            ...store.profiles.map((profile) => ({
              value: profile.id,
              label: profile.name,
            })),
          ]}
        />
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
            {t("重启并应用", "Restart & apply")}
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
              "删除会停止此连接的进程，并移除连接配置和所属隧道。此操作不可撤销。",
              "Deleting stops this connection’s process and removes its configuration and tunnels. This cannot be undone.",
            )}
          </p>
          <div className="form-footer">
            <Button onClick={() => setRemove(null)}>
              {t("取消", "Cancel")}
            </Button>
            <Button
              variant="danger"
              disabled={store.busy}
              onClick={() =>
                void completeMutation(async () => {
                  if (remove) await store.deleteProfile(remove.id);
                  setRemove(null);
                  toast.success(t("连接已删除。", "Connection deleted."));
                })
              }
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
