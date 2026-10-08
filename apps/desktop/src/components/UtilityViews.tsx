import { useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  Copy,
  Download,
  FileUp,
  Info,
  ListChecks,
  LoaderCircle,
  Pause,
  Play,
  Search,
  Trash2,
  RotateCw,
} from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";
import { useI18n } from "../i18n";
import type { AppSettings, LogEntry } from "../model";
import { useAppStore } from "../store";
import { desktopHost, errorMessage } from "../desktop";
import { Badge, Button, Checkbox, Field, Input, Select } from "./ui";
import { LegacyMigration } from "./LegacyMigration";
import { VersionConfigChecklist } from "./VersionConfigChecklist";

export function VersionsView() {
  const { t } = useI18n();
  const store = useAppStore();
  const [search, setSearch] = useState("");
  const [working, setWorking] = useState<string | null>(null);
  const [checklistVersion, setChecklistVersion] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
  } | null>(null);
  const visibleVersions = store.versions.filter((version) =>
    version.version.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const installedCount = store.versions.filter(
    (version) => version.installed,
  ).length;

  async function task(
    id: string,
    action: () => Promise<void>,
    message: string,
  ) {
    if (working || store.busy) return;
    setWorking(id);
    try {
      await action();
      toast.success(message);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setWorking(null);
    }
  }

  async function importLocal() {
    if (!desktopHost) {
      fileInput.current?.click();
      return;
    }
    if (working || store.busy) return;
    setWorking("import");
    try {
      const path = await open({
        title: t("选择本地 frpc 可执行文件", "Select a local frpc executable"),
        multiple: false,
        directory: false,
        filters: [{ name: "frpc executable", extensions: ["exe"] }],
      });
      if (typeof path !== "string") return;
      await store.importVersion(path);
      toast.success(
        t(
          "已识别版本并导入本机版本库。",
          "Version detected and imported into the local library.",
        ),
      );
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setWorking(null);
    }
  }

  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile({ name: file.name, size: file.size });
    event.target.value = "";
  };

  return (
    <div className="utility-view">
      <div className="utility-intro">
        <p>
          {t(
            "每个连接独立选择 frpc 版本。卸载前，先切换仍在使用该版本的连接。",
            "Each connection selects its own frpc version. Reassign connections before uninstalling their version.",
          )}
        </p>
        <Badge>
          {t(`${installedCount} 个已安装`, `${installedCount} installed`)}
        </Badge>
      </div>
      <div className="view-toolbar">
        <div className="search-field">
          <Search size={16} aria-hidden="true" />
          <Input
            aria-label={t("搜索 frpc 版本", "Search frpc versions")}
            placeholder={t("搜索版本号…", "Search version…")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Button onClick={() => setChecklistVersion(store.versions.find((item) => item.installed)?.version ?? "0.71.0")}><ListChecks size={16} />{t("版本配置清单", "Configuration checklists")}</Button>
        {desktopHost && (
          <Button
            disabled={Boolean(working) || store.busy}
            onClick={() =>
              void task(
                "refresh",
                store.refreshVersions,
                t("版本列表已更新。", "Version list updated."),
              )
            }
          >
            <RotateCw
              size={16}
              className={working === "refresh" ? "spin" : ""}
            />
            {t("刷新官方版本", "Refresh official versions")}
          </Button>
        )}
        <Button
          disabled={Boolean(working) || store.busy}
          onClick={() => void importLocal()}
        >
          <FileUp size={16} />
          {working === "import"
            ? t("正在导入…", "Importing…")
            : t("导入本地 frpc", "Import local frpc")}
        </Button>
        {!desktopHost && (
          <input
            ref={fileInput}
            type="file"
            hidden
            accept=".exe"
            onChange={chooseFile}
            aria-label={t("选择本地 frpc 文件", "Select local frpc file")}
          />
        )}
      </div>
      {!desktopHost && selectedFile && (
        <div className="prototype-note" role="status">
          <Info size={16} />
          <p>
            {selectedFile.name} · {(selectedFile.size / 1024 / 1024).toFixed(2)}{" "}
            MB ·{" "}
            {t(
              "浏览器只展示文件信息；请在桌面应用导入二进制。",
              "The browser displays metadata only. Import the binary in the desktop app.",
            )}
          </p>
        </div>
      )}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("编号", "No.")}</th>
              <th>{t("版本", "Version")}</th>
              <th>{t("包大小", "Package size")}</th>
              <th>{t("本地状态", "Local status")}</th>
              <th>{t("使用此版本的连接", "Assigned connections")}</th>
              <th className="align-right">{t("操作", "Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {visibleVersions.map((version) => {
              const downloading =
                working === version.id ||
                (version.progress > 0 && version.progress < 100);
              const assigned = store.profiles.filter(
                (profile) =>
                  profile.version === version.version ||
                  profile.version === version.id,
              );
              return (
                <tr key={version.id}>
                  <td className="mono row-index">
                    {String(store.versions.indexOf(version) + 1).padStart(
                      2,
                      "0",
                    )}
                  </td>
                  <td>
                    <strong className="mono">frpc {version.version}</strong>
                    {version.source && (
                      <div className="muted">
                        {version.source === "local"
                          ? t("本地导入", "Local import")
                          : t("官方发布", "Official release")}
                      </div>
                    )}
                  </td>
                  <td className="mono">{version.size}</td>
                  <td>
                    {downloading ? (
                      <div className="version-progress" aria-live="polite">
                        <span className="mono">
                          {t(
                            desktopHost ? "下载与安装" : "模拟安装",
                            desktopHost
                              ? "Download & install"
                              : "Simulated install",
                          )}{" "}
                          {version.progress}%
                        </span>
                        <progress
                          max={100}
                          value={version.progress}
                          aria-label={t(
                            `frpc ${version.version} 安装进度`,
                            `frpc ${version.version} installation progress`,
                          )}
                        />
                      </div>
                    ) : (
                      <Badge tone={version.installed ? "success" : "neutral"}>
                        {version.installed
                          ? t("已安装", "Installed")
                          : t("未安装", "Not installed")}
                      </Badge>
                    )}
                  </td>
                  <td>
                    {assigned.length ? (
                      <div className="version-assignment">
                        {assigned.map((profile) => (
                          <span key={profile.id}>{profile.name}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="muted">
                        {t("未被使用", "Unassigned")}
                      </span>
                    )}
                  </td>
                  <td className="align-right">
                    <div className="version-row-actions">
                    <Button size="sm" variant="ghost" onClick={() => setChecklistVersion(version.version)} aria-label={t(`查看 frpc ${version.version} 配置清单`, `View frpc ${version.version} configuration checklist`)}><ListChecks size={14} />{t("配置清单", "Configuration")}</Button>
                    {version.installed ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={Boolean(working) || store.busy}
                        onClick={() =>
                          void task(
                            version.id,
                            () => store.deleteVersion(version.id),
                            t(
                              `frpc ${version.version} 已卸载。`,
                              `frpc ${version.version} uninstalled.`,
                            ),
                          )
                        }
                        aria-label={t(
                          `卸载 frpc ${version.version}`,
                          `Uninstall frpc ${version.version}`,
                        )}
                      >
                        <Trash2 size={14} />
                        {t("卸载", "Uninstall")}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={Boolean(working) || store.busy || downloading}
                        onClick={() =>
                          void task(
                            version.id,
                            () => store.installVersion(version.id),
                            t(
                              desktopHost
                                ? `frpc ${version.version} 安装完成。`
                                : `演示：frpc ${version.version} 安装完成。`,
                              desktopHost
                                ? `frpc ${version.version} installed.`
                                : `Demo: frpc ${version.version} installed.`,
                            ),
                          )
                        }
                      >
                        {downloading ? (
                          <LoaderCircle size={14} className="spin" />
                        ) : (
                          <Download size={14} />
                        )}
                        {downloading
                          ? t("安装中", "Installing")
                          : t(
                              desktopHost ? "下载安装" : "模拟安装",
                              desktopHost
                                ? "Download & install"
                                : "Simulate install",
                            )}
                      </Button>
                    )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {visibleVersions.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <p>
                      {search
                        ? t("没有匹配的版本。", "No matching versions.")
                        : t(
                            "本机版本库为空。刷新官方版本或导入本地 frpc 文件。",
                            "The local library is empty. Refresh official versions or import a local frpc binary.",
                          )}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <span>
          {t(
            `${visibleVersions.length} 个版本`,
            `${visibleVersions.length} versions`,
          )}
        </span>
        <span>
          {t(
            desktopHost
              ? "下载由 Rust 执行；安装完成后才可分配给连接。"
              : "浏览器演示不会下载或运行 frpc。",
            desktopHost
              ? "Rust performs downloads. Assign versions only after installation completes."
              : "The browser demo does not download or run frpc.",
          )}
        </span>
      </div>
      {checklistVersion && <VersionConfigChecklist key={checklistVersion} version={checklistVersion} onClose={() => setChecklistVersion(null)} />}
    </div>
  );
}
export function LogsView() {
  const { t } = useI18n();
  const logs = useAppStore((state) => state.logs);
  const profiles = useAppStore((state) => state.profiles);
  const scope = useAppStore((state) => state.scope);
  const setScope = useAppStore((state) => state.setScope);
  const [level, setLevel] = useState<LogEntry["level"] | "all">("all");
  const [search, setSearch] = useState("");
  const [pausedSnapshot, setPausedSnapshot] = useState<LogEntry[] | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => new Set());
  const paused = pausedSnapshot !== null;
  const profileNames = useMemo(
    () => new Map(profiles.map((profile) => [profile.id, profile.name])),
    [profiles],
  );
  const nameFor = (entry: LogEntry) =>
    entry.profileId
      ? (profileNames.get(entry.profileId) ?? entry.profileId)
      : t("应用", "Application");
  const source = (pausedSnapshot ?? logs).slice(-200);
  const scopedLogs = source.filter(
    (entry) =>
      !hiddenIds.has(entry.id) &&
      (scope === "all" || entry.profileId === scope),
  );
  const query = search.trim().toLowerCase();
  const filteredLogs = scopedLogs.filter(
    (entry) =>
      (level === "all" || entry.level === level) &&
      (!query ||
        `${entry.time} ${entry.level} ${nameFor(entry)} ${entry.message}`
          .toLowerCase()
          .includes(query)),
  );
  const text = filteredLogs
    .map(
      (entry) =>
        `${entry.time} [${entry.level.toUpperCase()}] [${nameFor(entry)}] ${entry.message}`,
    )
    .join("\n");
  const snapshotIds = new Set(pausedSnapshot?.map((entry) => entry.id));
  const waitingCount = paused
    ? logs.filter(
        (entry) =>
          !snapshotIds.has(entry.id) &&
          (scope === "all" || entry.profileId === scope),
      ).length
    : 0;

  const togglePause = () => {
    setPausedSnapshot((snapshot) =>
      snapshot === null ? logs.map((entry) => ({ ...entry })) : null,
    );
  };

  const clearView = () => {
    setHiddenIds(
      (previous) =>
        new Set([...previous, ...filteredLogs.map((entry) => entry.id)]),
    );
    toast.success(
      t(
        "已清空当前筛选的可见缓存。未修改历史日志或磁盘文件。",
        "Cleared the visible cache for the current filters. History and disk files are unchanged.",
      ),
    );
  };

  const copyLogs = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("已复制当前筛选日志。", "Copied the filtered logs."));
    } catch {
      toast.error(
        t(
          "无法访问剪贴板，请使用下载文本。",
          "Clipboard access failed. Use Download text instead.",
        ),
      );
    }
  };

  const downloadLogs = () => {
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "frpc-logs.txt";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success(
      t("已生成当前筛选日志文件。", "Generated a file of the filtered logs."),
    );
  };

  return (
    <div className="utility-view">
      <div className="utility-intro">
        <p>
          {t(
            "按连接、级别或关键字检查日志。暂停时保留当前快照，恢复后显示新记录。",
            "Inspect logs by connection, level, or keyword. Pause freezes the snapshot; resuming reveals new entries.",
          )}
        </p>
        <Badge tone={paused ? "warning" : "neutral"}>
          {paused
            ? t("显示已暂停", "Display paused")
            : t(
                desktopHost ? "实时日志" : "演示日志",
                desktopHost ? "Live logs" : "Demo logs",
              )}
        </Badge>
      </div>

      <div className="view-toolbar log-toolbar">
        <Select
          aria-label={t("日志连接范围", "Log connection scope")}
          value={scope}
          onValueChange={setScope}
          options={[
            { value: "all", label: t("所有连接", "All connections") },
            ...profiles.map((profile) => ({
              value: profile.id,
              label: profile.name,
            })),
          ]}
        />
        <Select
          aria-label={t("日志级别", "Log level")}
          value={level}
          onValueChange={(value) =>
            setLevel(value as LogEntry["level"] | "all")
          }
          options={[
            { value: "all", label: t("全部级别", "All levels") },
            ...["error", "warn", "info", "debug"].map((value) => ({
              value,
              label: value.toUpperCase(),
            })),
          ]}
        />
        <div className="search-field">
          <Search size={16} aria-hidden="true" />
          <Input
            aria-label={t("搜索日志", "Search logs")}
            placeholder={t("搜索日志内容…", "Search log content…")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={togglePause}
          aria-pressed={paused}
        >
          {paused ? (
            <Play size={14} aria-hidden="true" />
          ) : (
            <Pause size={14} aria-hidden="true" />
          )}
          {paused ? t("恢复显示", "Resume") : t("暂停显示", "Pause")}
        </Button>
      </div>

      <div className="view-toolbar log-actions">
        <span className="muted">
          {t(
            "最多显示最近 200 条记录。日志内容按纯文本显示。",
            "Up to 200 recent entries. Log content is displayed as plain text.",
          )}
        </span>
        <div className="button-group">
          <Button
            variant="ghost"
            size="sm"
            disabled={filteredLogs.length === 0}
            onClick={() => void copyLogs()}
          >
            <Copy size={14} aria-hidden="true" />
            {t("复制", "Copy")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={filteredLogs.length === 0}
            onClick={downloadLogs}
          >
            <Download size={14} aria-hidden="true" />
            {t("下载文本", "Download text")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={filteredLogs.length === 0}
            onClick={clearView}
            title={t(
              "只清空本页当前筛选结果，不删除历史或磁盘日志",
              "Clear only the current filtered view; history and disk logs are unchanged",
            )}
          >
            <Trash2 size={14} aria-hidden="true" />
            {t("清空视图", "Clear view")}
          </Button>
        </div>
      </div>

      <div
        className="log-list"
        role="log"
        aria-label={t("当前筛选日志", "Filtered logs")}
        aria-live={paused ? "off" : "polite"}
        aria-relevant="additions"
      >
        {filteredLogs.map((entry) => (
          <div key={entry.id} className={`log-row log-${entry.level}`}>
            <time className="mono">{entry.time}</time>
            <span className="log-level mono">{entry.level.toUpperCase()}</span>
            <span className="log-connection" title={nameFor(entry)}>
              {nameFor(entry)}
            </span>
            <span className="log-message">{entry.message}</span>
          </div>
        ))}
        {filteredLogs.length === 0 && (
          <div className="empty-state">
            <p>
              {t("当前没有匹配的日志。", "No logs match the current filters.")}
            </p>
            <span>
              {t(
                "调整连接、级别或搜索条件；清空视图后，新记录仍会显示。",
                "Adjust the connection, level, or search. New entries still appear after clearing the view.",
              )}
            </span>
          </div>
        )}
      </div>
      <div className="table-footer log-footer" aria-live="polite">
        <span>
          {t(
            `${filteredLogs.length} 条显示 · ${scopedLogs.length} 条可见缓存`,
            `${filteredLogs.length} shown · ${scopedLogs.length} cached`,
          )}
        </span>
        <span>
          {paused
            ? t(
                `当前快照已冻结 · ${waitingCount} 条新记录等待显示`,
                `Snapshot frozen · ${waitingCount} new entries waiting`,
              )
            : t(
                "复制与下载仅包含当前筛选结果。",
                "Copy and download include only the current filters.",
              )}
        </span>
      </div>
    </div>
  );
}

export function SettingsView() {
  const { t } = useI18n();
  const { settings, updateSettings, busy, dataDir } = useAppStore();
  const [saving, setSaving] = useState(false);
  async function update(changes: Partial<AppSettings>) {
    if (saving || busy) return;
    setSaving(true);
    try {
      await updateSettings(changes);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }
  const disabled = saving || busy;
  return (
    <div className="utility-view settings-view">
      <section
        className="settings-section"
        aria-labelledby="appearance-heading"
      >
        <h2 id="appearance-heading">
          {t("界面与语言", "Appearance and language")}
        </h2>
        <p className="muted">
          {t(
            desktopHost
              ? "偏好保存到本机配置，保存成功后生效。"
              : "演示偏好保存在当前浏览器。",
            desktopHost
              ? "Preferences are saved locally and take effect after successful saving."
              : "Demo preferences are saved in this browser.",
          )}
        </p>
        <div className="field-grid">
          <Field
            label={t("界面语言", "Interface language")}
            htmlFor="settings-language"
          >
            <Select
              id="settings-language"
              disabled={disabled}
              value={settings.language}
              onValueChange={(value) =>
                void update({
                  language: value as AppSettings["language"],
                })
              }
              options={[
                { value: "zh", label: "简体中文" },
                { value: "en", label: "English" },
              ]}
            />
          </Field>
          <Field label={t("主题", "Theme")} htmlFor="settings-theme">
            <Select
              id="settings-theme"
              disabled={disabled}
              value={settings.theme}
              onValueChange={(value) =>
                void update({
                  theme: value as AppSettings["theme"],
                })
              }
              options={[
                { value: "light", label: t("浅色", "Light") },
                { value: "dark", label: t("深色", "Dark") },
                { value: "system", label: t("跟随系统", "System") },
              ]}
            />
          </Field>
        </div>
      </section>
      <section className="settings-section" aria-labelledby="desktop-heading">
        <h2 id="desktop-heading">{t("桌面行为", "Desktop behavior")}</h2>
        {!desktopHost && (
          <div className="prototype-note">
            <Info size={16} />
            <p>
              {t(
                "浏览器开关仅保存演示偏好。系统启动、窗口与托盘行为请在桌面应用中设置。",
                "Browser switches save demo preferences only. Configure startup, window and tray behavior in the desktop app.",
              )}
            </p>
          </div>
        )}
        <div className="setting-row">
          <div>
            <strong>{t("开机启动", "Launch at sign-in")}</strong>
            <p>
              {t(
                "登录系统后启动应用；自动连接由各连接单独设置。",
                "Launch after system sign-in. Auto-connect is configured per connection.",
              )}
            </p>
          </div>
          <Checkbox
            disabled={disabled}
            checked={settings.autoStart}
            onCheckedChange={(checked) => void update({ autoStart: checked })}
            aria-label={t("开机启动", "Launch at sign-in")}
          />
        </div>
        <div className="setting-row">
          <div>
            <strong>{t("静默启动", "Silent startup")}</strong>
            <p>
              {t(
                "启动时保持主窗口隐藏，通过托盘打开。",
                "Keep the main window hidden at startup and open it from the tray.",
              )}
            </p>
          </div>
          <Checkbox
            disabled={disabled}
            checked={settings.silentStart}
            onCheckedChange={(checked) => void update({ silentStart: checked })}
            aria-label={t("静默启动", "Silent startup")}
          />
        </div>
        <div className="setting-row">
          <div>
            <strong>{t("关闭窗口时保留托盘", "Close to tray")}</strong>
            <p>
              {t(
                "关闭主窗口后继续运行，从托盘菜单退出并停止进程。",
                "Continue running after closing the window. Quit from the tray menu to stop processes.",
              )}
            </p>
          </div>
          <Checkbox
            disabled={disabled}
            checked={settings.closeToTray}
            onCheckedChange={(checked) => void update({ closeToTray: checked })}
            aria-label={t("关闭窗口时保留托盘", "Close to tray")}
          />
        </div>
      </section>
      {desktopHost && <LegacyMigration />}
      <footer className="settings-section settings-about">
        <h2>{t("关于 frpc-ui", "About frpc-ui")}</h2>
        <p>
          {t(
            desktopHost
              ? "多连接与隧道维护客户端。Rust 管理官方 frpc 进程，运行状态以实际进程和服务器确认为准。"
              : "浏览器演示多连接与隧道管理界面，配置与凭据仅在内存。",
            desktopHost
              ? "A client for maintaining connections and tunnels. Rust manages official frpc processes; runtime state follows the actual process and server confirmation."
              : "A browser demo of connection and tunnel management. Configuration and credentials stay in memory.",
          )}
        </p>
        {desktopHost && (
          <>
            <p>{t("本机数据目录", "Local data directory")}</p>
            <p className="mono data-directory">{dataDir}</p>
          </>
        )}
        <p>
          {t(
            "技术栈：Tauri 2、Rust、React 19、TypeScript、Radix UI、Zustand。",
            "Stack: Tauri 2, Rust, React 19, TypeScript, Radix UI and Zustand.",
          )}
        </p>
      </footer>
    </div>
  );
}
