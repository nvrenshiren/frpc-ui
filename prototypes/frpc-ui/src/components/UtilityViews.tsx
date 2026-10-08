import { useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  Copy,
  Download,
  FileUp,
  Info,
  LoaderCircle,
  Pause,
  Play,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "../i18n";
import type { AppSettings, LogEntry, Version } from "../model";
import { useAppStore } from "../store";
import { Badge, Button, Checkbox, Field, Input, Select } from "./ui";

export function VersionsView() {
  const { t } = useI18n();
  const versions = useAppStore((state) => state.versions);
  const profiles = useAppStore((state) => state.profiles);
  const installVersion = useAppStore((state) => state.installVersion);
  const deleteVersion = useAppStore((state) => state.deleteVersion);
  const [search, setSearch] = useState("");
  const [installing, setInstalling] = useState<string[]>([]);
  const pendingInstalls = useRef(new Set<string>());
  const fileInput = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
  } | null>(null);
  const visibleVersions = versions.filter((version) =>
    version.version.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const installedCount = versions.filter((version) => version.installed).length;

  const install = async (version: Version) => {
    if (pendingInstalls.current.has(version.id)) return;
    pendingInstalls.current.add(version.id);
    setInstalling([...pendingInstalls.current]);
    try {
      await installVersion(version.id);
      const current = useAppStore
        .getState()
        .versions.find((item) => item.id === version.id);
      if (current?.installed) {
        toast.success(
          t(
            `演示：frpc ${version.version} 安装完成`,
            `Demo: frpc ${version.version} installation complete`,
          ),
        );
      }
    } catch {
      toast.error(
        t(
          "模拟安装失败，请重试。",
          "The simulated installation failed. Try again.",
        ),
      );
    } finally {
      pendingInstalls.current.delete(version.id);
      setInstalling([...pendingInstalls.current]);
    }
  };

  const uninstall = (version: Version) => {
    const error = deleteVersion(version.id);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(
      t(
        `演示：frpc ${version.version} 已卸载`,
        `Demo: frpc ${version.version} uninstalled`,
      ),
    );
  };

  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile({ name: file.name, size: file.size });
    event.target.value = "";
    toast.info(
      t(
        "已选择文件。实际版本识别、校验与安装需要 Rust 后端。",
        "File selected. Version detection, verification, and installation require the Rust backend.",
      ),
    );
  };

  return (
    <div className="utility-view">
      <div className="utility-intro">
        <p>
          {t(
            "每个连接独立选择 frpc 版本。卸载前，先切换仍在使用该版本的连接。",
            "Each connection selects its own frpc version. Reassign connections before uninstalling a version they use.",
          )}
        </p>
        <Badge tone="neutral">
          {t(
            `${installedCount} 个已安装 · 演示数据`,
            `${installedCount} installed · demo data`,
          )}
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
        <Button variant="outline" onClick={() => fileInput.current?.click()}>
          <FileUp size={16} aria-hidden="true" />
          {t("选择本地 frpc", "Select local frpc")}
        </Button>
        <input
          ref={fileInput}
          type="file"
          hidden
          aria-label={t("选择本地 frpc 文件", "Select a local frpc file")}
          accept=".exe,.zip,.gz,.tgz,.tar,application/octet-stream"
          onChange={chooseFile}
        />
      </div>

      {selectedFile && (
        <div className="prototype-note" role="status">
          <Info size={16} aria-hidden="true" />
          <div>
            <strong>{selectedFile.name}</strong>
            <span className="mono">
              {" "}
              · {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </span>
            <p>
              {t(
                "仅展示所选文件的信息；此原型不能运行二进制、识别版本或验证 SHA-256，也未将文件加入版本库。",
                "Only selected-file metadata is shown. This prototype cannot run binaries, detect their version, or verify SHA-256; the file has not been added to the library.",
              )}
            </p>
          </div>
        </div>
      )}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">{t("编号", "No.")}</th>
              <th scope="col">{t("版本", "Version")}</th>
              <th scope="col">{t("包大小", "Package size")}</th>
              <th scope="col">{t("本地状态", "Local status")}</th>
              <th scope="col">
                {t("使用此版本的连接", "Assigned connections")}
              </th>
              <th scope="col" className="align-right">
                {t("操作", "Actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleVersions.map((version) => {
              const busy =
                installing.includes(version.id) ||
                (version.progress > 0 && version.progress < 100);
              const assigned = profiles.filter(
                (profile) =>
                  profile.version === version.version ||
                  profile.version === version.id,
              );
              return (
                <tr key={version.id}>
                  <td className="mono row-index">
                    {String(versions.indexOf(version) + 1).padStart(2, "0")}
                  </td>
                  <td>
                    <strong className="mono">frpc {version.version}</strong>
                  </td>
                  <td className="mono">{version.size}</td>
                  <td>
                    {busy ? (
                      <div className="version-progress" aria-live="polite">
                        <span className="mono">
                          {t("模拟安装", "Simulated install")}{" "}
                          {version.progress}%
                        </span>
                        <progress
                          max={100}
                          value={version.progress}
                          aria-label={t(
                            `frpc ${version.version} 模拟安装进度`,
                            `frpc ${version.version} simulated installation progress`,
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
                    {assigned.length > 0 ? (
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
                    {version.installed ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => uninstall(version)}
                        aria-label={t(
                          `卸载 frpc ${version.version}`,
                          `Uninstall frpc ${version.version}`,
                        )}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                        {t("卸载", "Uninstall")}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => void install(version)}
                      >
                        {busy ? (
                          <LoaderCircle
                            size={14}
                            className="spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <Download size={14} aria-hidden="true" />
                        )}
                        {busy
                          ? t("安装中", "Installing")
                          : t("模拟安装", "Simulate install")}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
            {visibleVersions.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    {t(
                      "没有匹配的版本。请更换搜索条件。",
                      "No matching versions. Try another search.",
                    )}
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
            "版本号与包大小为演示样本；安装进度为模拟，未下载或运行真实 frpc。",
            "Versions and package sizes are demo samples. Installation progress is simulated; no real frpc is downloaded or run.",
          )}
        </span>
      </div>
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
            : t("演示日志", "Demo logs")}
        </Badge>
      </div>

      <div className="view-toolbar log-toolbar">
        <Select
          aria-label={t("日志连接范围", "Log connection scope")}
          value={scope}
          onChange={(event) => setScope(event.target.value)}
        >
          <option value="all">{t("所有连接", "All connections")}</option>
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name}
            </option>
          ))}
        </Select>
        <Select
          aria-label={t("日志级别", "Log level")}
          value={level}
          onChange={(event) =>
            setLevel(event.target.value as LogEntry["level"] | "all")
          }
        >
          <option value="all">{t("全部级别", "All levels")}</option>
          <option value="error">ERROR</option>
          <option value="warn">WARN</option>
          <option value="info">INFO</option>
          <option value="debug">DEBUG</option>
        </Select>
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
            "最多保留最近 200 条演示记录。日志内容按纯文本显示。",
            "Up to 200 recent demo entries. Log content is displayed as plain text.",
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
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);

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
            "修改立即生效，偏好保存在当前浏览器。",
            "Changes take effect immediately. Preferences are saved in this browser.",
          )}
        </p>
        <div className="field-grid">
          <Field
            label={t("界面语言", "Interface language")}
            htmlFor="settings-language"
          >
            <Select
              id="settings-language"
              value={settings.language}
              onChange={(event) =>
                updateSettings({
                  language: event.target.value as AppSettings["language"],
                })
              }
            >
              <option value="zh">简体中文</option>
              <option value="en">English</option>
            </Select>
          </Field>
          <Field label={t("主题", "Theme")} htmlFor="settings-theme">
            <Select
              id="settings-theme"
              value={settings.theme}
              onChange={(event) =>
                updateSettings({
                  theme: event.target.value as AppSettings["theme"],
                })
              }
            >
              <option value="light">{t("浅色", "Light")}</option>
              <option value="dark">{t("深色", "Dark")}</option>
              <option value="system">{t("跟随系统", "System")}</option>
            </Select>
          </Field>
        </div>
      </section>

      <section className="settings-section" aria-labelledby="desktop-heading">
        <h2 id="desktop-heading">{t("桌面行为", "Desktop behavior")}</h2>
        <div className="prototype-note">
          <Info size={16} aria-hidden="true" />
          <p>
            {t(
              "以下开关仅保存原型偏好，不会修改系统启动项、隐藏浏览器窗口或创建系统托盘。",
              "These switches only save prototype preferences. They do not change system startup entries, hide the browser window, or create a system tray icon.",
            )}
          </p>
        </div>
        <div className="setting-row">
          <div>
            <strong>{t("开机启动", "Launch at sign-in")}</strong>
            <p>
              {t(
                "桌面版登录系统后启动应用；自动连接由各连接单独设置。",
                "For the desktop app: launch after system sign-in. Auto-connect is configured per connection.",
              )}
            </p>
          </div>
          <Checkbox
            checked={settings.autoStart}
            onCheckedChange={(checked) =>
              updateSettings({ autoStart: checked })
            }
            aria-label={t("开机启动", "Launch at sign-in")}
          />
        </div>
        <div className="setting-row">
          <div>
            <strong>{t("静默启动", "Silent startup")}</strong>
            <p>
              {t(
                "桌面版启动时保持主窗口隐藏，通过托盘打开。",
                "For the desktop app: keep the main window hidden at startup and open it from the tray.",
              )}
            </p>
          </div>
          <Checkbox
            checked={settings.silentStart}
            onCheckedChange={(checked) =>
              updateSettings({ silentStart: checked })
            }
            aria-label={t("静默启动", "Silent startup")}
          />
        </div>
        <div className="setting-row">
          <div>
            <strong>{t("关闭窗口时保留托盘", "Close to tray")}</strong>
            <p>
              {t(
                "桌面版关闭主窗口后继续运行，从托盘菜单真正退出。",
                "For the desktop app: keep running after closing the window. Quit from the tray menu.",
              )}
            </p>
          </div>
          <Checkbox
            checked={settings.closeToTray}
            onCheckedChange={(checked) =>
              updateSettings({ closeToTray: checked })
            }
            aria-label={t("关闭窗口时保留托盘", "Close to tray")}
          />
        </div>
      </section>

      <footer className="settings-section settings-about">
        <h2>{t("关于此原型", "About this prototype")}</h2>
        <p>
          {t(
            "frpc-ui · 多连接与隧道维护界面。连接、版本和日志使用演示数据；Rust 后端尚未接入。",
            "frpc-ui · An interface for maintaining connections and tunnels. Connections, versions, and logs use demo data; the Rust backend is not connected yet.",
          )}
        </p>
        <p>
          {t(
            "技术栈：React 19、TypeScript、shadcn/ui 风格组件、Radix UI、Zustand。",
            "Stack: React 19, TypeScript, shadcn/ui-style components, Radix UI, and Zustand.",
          )}
        </p>
        <p>
          {t("Rust 重写评估文档", "Rust rewrite assessment")}{" "}
          <span className="mono">docs/rust-rewrite-assessment.md</span>
        </p>
      </footer>
    </div>
  );
}
