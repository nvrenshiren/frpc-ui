import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  createId,
  makeProfile as makeBaseProfile,
  makeTunnel,
  type AppSettings,
  type BatchResult,
  type LogEntry,
  type Page,
  type Profile,
  type Tunnel,
  type Version,
} from "./model";

const makeProfile = (overrides: Partial<Profile> = {}) =>
  makeBaseProfile({ version: "0.65.0", ...overrides });

export type LogInput = Omit<LogEntry, "id" | "time"> &
  Partial<Pick<LogEntry, "id" | "time">>;

export interface AppStore {
  page: Page;
  setPage: (page: Page) => void;
  scope: string | "all";
  setScope: (scope: string | "all") => void;
  profiles: Profile[];
  tunnels: Tunnel[];
  versions: Version[];
  logs: LogEntry[];
  settings: AppSettings;
  batchResults: BatchResult[];
  startProfiles: (ids: string[]) => Promise<BatchResult[]>;
  stopProfiles: (ids: string[]) => Promise<BatchResult[]>;
  saveProfile: (profile: Profile) => void;
  deleteProfile: (id: string) => void;
  saveTunnel: (tunnel: Tunnel) => void;
  deleteTunnels: (ids: string[]) => void;
  toggleTunnels: (ids: string[], enabled: boolean) => void;
  applyProfiles: (ids: string[]) => Promise<BatchResult[]>;
  clearBatchResults: () => void;
  installVersion: (id: string) => Promise<void>;
  deleteVersion: (id: string) => string | null;
  updateSettings: (settings: Partial<AppSettings>) => void;
  addLog: (
    entry: LogInput | string,
    profileId?: string,
    level?: LogEntry["level"],
  ) => void;
}

const initialProfiles: Profile[] = [
  makeProfile({
    id: "profile-hk",
    name: "香港 · 生产",
    serverAddr: "203.0.113.10",
    process: "running",
    connection: "confirmed",
    autoConnect: true,
    pending: false,
    user: "production",
    webPort: 7400,
    uptime: "2 天 06 时",
  }),
  makeProfile({
    id: "profile-dev",
    name: "上海 · 开发",
    serverAddr: "203.0.113.20",
    process: "running",
    connection: "confirmed",
    pending: true,
    user: "development",
    webPort: 7401,
    uptime: "03 时 42 分",
  }),
  makeProfile({
    id: "profile-nas",
    name: "家庭 NAS",
    serverAddr: "203.0.113.30",
    version: "0.61.1",
    pending: false,
    webPort: 7402,
  }),
  makeProfile({
    id: "profile-backup",
    name: "备用节点",
    serverAddr: "203.0.113.40",
    process: "failed",
    connection: "failed",
    pending: true,
    webPort: 7403,
    lastError: "演示：上次连接超时，可重试",
  }),
];

const initialTunnels: Tunnel[] = [
  makeTunnel({
    id: "tunnel-ssh",
    name: "运维 SSH",
    profileId: "profile-hk",
    localPort: 22,
    remotePort: 22022,
    apply: "applied",
  }),
  makeTunnel({
    id: "tunnel-ops",
    name: "运维控制台",
    profileId: "profile-hk",
    type: "http",
    localPort: 3000,
    remotePort: 0,
    domain: "ops.example.test",
    apply: "applied",
  }),
  makeTunnel({
    id: "tunnel-wiki",
    name: "团队知识库",
    profileId: "profile-hk",
    type: "https",
    localPort: 8080,
    remotePort: 0,
    domain: "wiki.example.test",
    apply: "applied",
  }),
  makeTunnel({
    id: "tunnel-dns",
    name: "内部 DNS",
    profileId: "profile-hk",
    type: "udp",
    localPort: 53,
    remotePort: 53053,
    apply: "applied",
  }),
  makeTunnel({
    id: "tunnel-api",
    name: "API 联调",
    profileId: "profile-dev",
    localPort: 8080,
    remotePort: 18080,
    apply: "applied",
  }),
  makeTunnel({
    id: "tunnel-preview",
    name: "前端预览",
    profileId: "profile-dev",
    type: "http",
    localPort: 5173,
    remotePort: 0,
    domain: "preview.example.test",
    apply: "pending",
  }),
  makeTunnel({
    id: "tunnel-database",
    name: "开发数据库",
    profileId: "profile-dev",
    type: "stcp",
    localPort: 5432,
    remotePort: 0,
    secretKey: "demo-database-key",
    enabled: false,
    apply: "pending",
  }),
  makeTunnel({
    id: "tunnel-smb",
    name: "文件共享",
    profileId: "profile-nas",
    localPort: 445,
    remotePort: 10445,
    apply: "applied",
  }),
  makeTunnel({
    id: "tunnel-nas-web",
    name: "NAS 管理",
    profileId: "profile-nas",
    type: "https",
    localPort: 5001,
    remotePort: 0,
    domain: "nas.example.test",
    apply: "applied",
  }),
  makeTunnel({
    id: "tunnel-nas-peer",
    name: "NAS 点对点",
    profileId: "profile-nas",
    type: "xtcp",
    localPort: 5000,
    remotePort: 0,
    role: "visitor",
    serverName: "nas-provider",
    secretKey: "demo-nas-key",
    apply: "applied",
  }),
  makeTunnel({
    id: "tunnel-metrics",
    name: "备用指标采集",
    profileId: "profile-backup",
    type: "sudp",
    localPort: 8125,
    remotePort: 0,
    secretKey: "demo-metrics-key",
    apply: "pending",
  }),
];

const initialVersions: Version[] = [
  {
    id: "v0.71.0",
    version: "0.71.0",
    installed: false,
    size: "—",
    progress: 0,
  },
  {
    id: "v0.65.0",
    version: "0.65.0",
    installed: true,
    size: "13.8 MB",
    progress: 100,
  },
  {
    id: "v0.61.1",
    version: "0.61.1",
    installed: true,
    size: "12.6 MB",
    progress: 100,
  },
  {
    id: "v0.58.1",
    version: "0.58.1",
    installed: false,
    size: "11.9 MB",
    progress: 0,
  },
  {
    id: "v0.52.0",
    version: "0.52.0",
    installed: false,
    size: "—",
    progress: 0,
  },
];

const initialSettings: AppSettings = {
  language: "zh",
  theme: "dark",
  autoStart: false,
  silentStart: false,
  closeToTray: true,
};

const initialLogs: LogEntry[] = [
  {
    id: "log-1",
    time: "14:32:06",
    profileId: "profile-hk",
    level: "info",
    message: "演示：已收到服务器连接确认，4 条隧道已应用。",
  },
  {
    id: "log-2",
    time: "14:33:12",
    profileId: "profile-dev",
    level: "info",
    message: "演示：已收到服务器连接确认。",
  },
  {
    id: "log-3",
    time: "14:35:41",
    profileId: "profile-dev",
    level: "warn",
    message: "前端预览配置已修改，等待应用。",
  },
  {
    id: "log-4",
    time: "14:36:18",
    profileId: "profile-backup",
    level: "error",
    message: "演示：连接服务器超时，请重试。",
  },
  {
    id: "log-5",
    time: "14:37:02",
    profileId: "profile-nas",
    level: "debug",
    message: "演示：本地配置已加载，进程尚未启动。",
  },
];

const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
const unique = (ids: string[]) => [...new Set(ids)];
const processOperations = new Map<string, number>();
const startAttempts = new Map<string, number>();
const applyAttempts = new Map<string, number>();
const configRevisions = new Map<string, number>();
const applyOperations = new Map<string, number>();
const versionOperations = new Map<string, number>();
let latestBatch = 0;

function nextOperation(operations: Map<string, number>, id: string): number {
  const operation = (operations.get(id) ?? 0) + 1;
  operations.set(id, operation);
  return operation;
}

export const useMockStore = create<AppStore>()(
  persist(
    (set, get) => {
      const text = (zh: string, en: string) =>
        get().settings.language === "en" ? en : zh;
      const result = (
        profileId: string,
        success: boolean,
        message: string,
      ): BatchResult => ({ profileId, success, message });
      const patchProfile = (id: string, patch: Partial<Profile>) => {
        set((state) => ({
          profiles: state.profiles.map((profile) =>
            profile.id === id ? { ...profile, ...patch } : profile,
          ),
        }));
      };
      const log = (
        profileId: string,
        level: LogEntry["level"],
        message: string,
      ) => get().addLog({ profileId, level, message });
      const finishBatch = (
        batch: number,
        results: BatchResult[],
        action: "start" | "stop" | "apply",
      ) => {
        const tagged = results.map((entry) => ({ ...entry, action }));
        if (batch === latestBatch) set({ batchResults: tagged });
        return tagged;
      };

      return {
        page: "overview",
        scope: "all",
        profiles: initialProfiles,
        tunnels: initialTunnels,
        versions: initialVersions,
        logs: initialLogs,
        settings: initialSettings,
        batchResults: [],
        setPage: (page) => set({ page }),
        setScope: (scope) => set({ scope }),
        clearBatchResults: () => set({ batchResults: [] }),

        addLog: (entry, profileId = "", level = "info") => {
          const input: LogInput =
            typeof entry === "string"
              ? { profileId, level, message: entry }
              : entry;
          const newEntry: LogEntry = {
            ...input,
            id: input.id ?? createId("log"),
            time:
              input.time ??
              new Date().toLocaleTimeString("zh-CN", { hour12: false }),
          };
          set((state) => ({ logs: [...state.logs, newEntry].slice(-200) }));
        },

        startProfiles: async (ids) => {
          const batch = ++latestBatch;
          set({ batchResults: [] });
          const results = await Promise.all(
            unique(ids).map(async (id, index) => {
              const profile = get().profiles.find((item) => item.id === id);
              if (!profile)
                return result(
                  id,
                  false,
                  text("连接已不存在", "Connection no longer exists"),
                );
              if (
                profile.process === "running" &&
                profile.connection === "confirmed"
              ) {
                return result(
                  id,
                  true,
                  text(
                    "已运行且连接已确认",
                    "Already running with a confirmed connection",
                  ),
                );
              }
              const operation = nextOperation(processOperations, id);
              patchProfile(id, {
                process: "starting",
                connection: "unknown",
                lastError: undefined,
                uptime: "—",
              });
              log(
                id,
                "info",
                text("演示：正在启动进程…", "Demo: starting the process…"),
              );
              await delay(550 + index * 130);
              if (
                processOperations.get(id) !== operation ||
                !get().profiles.some((item) => item.id === id)
              ) {
                return result(
                  id,
                  false,
                  text("操作已取消", "Operation canceled"),
                );
              }
              patchProfile(id, {
                process: "running",
                connection: "unknown",
                uptime: "00 分 00 秒",
              });
              log(
                id,
                "debug",
                text(
                  "演示：进程已启动，等待服务器确认。",
                  "Demo: process started; awaiting server confirmation.",
                ),
              );
              await delay(430);
              if (
                processOperations.get(id) !== operation ||
                !get().profiles.some((item) => item.id === id)
              ) {
                return result(
                  id,
                  false,
                  text("操作已取消", "Operation canceled"),
                );
              }
              const attempt = nextOperation(startAttempts, id);
              if (id === "profile-backup" && attempt === 1) {
                const message = text(
                  "演示：连接超时；进程仍在运行，可重试",
                  "Demo: connection timed out; the process is running. Retry is available.",
                );
                patchProfile(id, { connection: "failed", lastError: message });
                log(id, "error", message);
                return result(id, false, message);
              }
              patchProfile(id, {
                connection: "confirmed",
                lastError: undefined,
              });
              const message = text(
                "演示：进程已启动，服务器连接已确认",
                "Demo: process started and server connection confirmed",
              );
              log(id, "info", message);
              return result(id, true, message);
            }),
          );
          return finishBatch(batch, results, "start");
        },

        stopProfiles: async (ids) => {
          const batch = ++latestBatch;
          set({ batchResults: [] });
          const results = await Promise.all(
            unique(ids).map(async (id, index) => {
              const profile = get().profiles.find((item) => item.id === id);
              if (!profile)
                return result(
                  id,
                  false,
                  text("连接已不存在", "Connection no longer exists"),
                );
              const operation = nextOperation(processOperations, id);
              patchProfile(id, { process: "stopping" });
              await delay(360 + index * 90);
              if (
                processOperations.get(id) !== operation ||
                !get().profiles.some((item) => item.id === id)
              ) {
                return result(
                  id,
                  false,
                  text("操作已取消", "Operation canceled"),
                );
              }
              patchProfile(id, {
                process: "stopped",
                connection: "unknown",
                lastError: undefined,
                uptime: "—",
              });
              const message = text(
                "演示：进程已停止，待应用修改已保留",
                "Demo: process stopped; pending changes retained",
              );
              log(id, "info", message);
              return result(id, true, message);
            }),
          );
          return finishBatch(batch, results, "stop");
        },

        saveProfile: (profile) => {
          nextOperation(configRevisions, profile.id);
          const previous = get().profiles.find(
            (item) => item.id === profile.id,
          );
          const saved: Profile = previous
            ? {
                ...profile,
                process: previous.process,
                connection: previous.connection,
                uptime: previous.uptime,
                lastError: previous.lastError,
                pending: true,
              }
            : {
                ...profile,
                process: "stopped",
                connection: "unknown",
                uptime: "—",
                lastError: undefined,
                pending: true,
              };
          set((state) => ({
            profiles: previous
              ? state.profiles.map((item) =>
                  item.id === saved.id ? saved : item,
                )
              : [...state.profiles, saved],
          }));
          log(
            saved.id,
            "info",
            text(
              "连接配置已保存，等待应用。",
              "Connection configuration saved; awaiting apply.",
            ),
          );
        },

        deleteProfile: (id) => {
          nextOperation(processOperations, id);
          nextOperation(applyOperations, id);
          set((state) => ({
            profiles: state.profiles.filter((profile) => profile.id !== id),
            tunnels: state.tunnels.filter((tunnel) => tunnel.profileId !== id),
            scope: state.scope === id ? "all" : state.scope,
            batchResults: state.batchResults.filter(
              (entry) => entry.profileId !== id,
            ),
          }));
          log(
            "",
            "info",
            text("连接及其隧道已删除。", "Connection and its tunnels deleted."),
          );
        },

        saveTunnel: (tunnel) => {
          if (
            !get().profiles.some((profile) => profile.id === tunnel.profileId)
          )
            return;
          const previous = get().tunnels.find((item) => item.id === tunnel.id);
          const affectedProfiles = new Set([
            tunnel.profileId,
            ...(previous ? [previous.profileId] : []),
          ]);
          affectedProfiles.forEach((id) => nextOperation(configRevisions, id));
          const saved: Tunnel = { ...tunnel, apply: "pending" };
          set((state) => ({
            tunnels: previous
              ? state.tunnels.map((item) =>
                  item.id === saved.id ? saved : item,
                )
              : [...state.tunnels, saved],
            profiles: state.profiles.map((profile) =>
              affectedProfiles.has(profile.id)
                ? { ...profile, pending: true }
                : profile,
            ),
          }));
          log(
            tunnel.profileId,
            "info",
            text(
              "隧道配置已保存，等待应用。",
              "Tunnel configuration saved; awaiting apply.",
            ),
          );
        },

        deleteTunnels: (ids) => {
          const selected = new Set(ids);
          const affectedProfiles = new Set(
            get()
              .tunnels.filter((tunnel) => selected.has(tunnel.id))
              .map((tunnel) => tunnel.profileId),
          );
          affectedProfiles.forEach((id) => nextOperation(configRevisions, id));
          set((state) => ({
            tunnels: state.tunnels.filter((tunnel) => !selected.has(tunnel.id)),
            profiles: state.profiles.map((profile) =>
              affectedProfiles.has(profile.id)
                ? { ...profile, pending: true }
                : profile,
            ),
          }));
          affectedProfiles.forEach((id) =>
            log(
              id,
              "info",
              text(
                "隧道已删除，等待应用到运行配置。",
                "Tunnel deleted; awaiting apply to the running configuration.",
              ),
            ),
          );
        },

        toggleTunnels: (ids, enabled) => {
          const selected = new Set(ids);
          const affectedProfiles = new Set(
            get()
              .tunnels.filter(
                (tunnel) =>
                  selected.has(tunnel.id) && tunnel.enabled !== enabled,
              )
              .map((tunnel) => tunnel.profileId),
          );
          affectedProfiles.forEach((id) => nextOperation(configRevisions, id));
          set((state) => ({
            tunnels: state.tunnels.map((tunnel) =>
              selected.has(tunnel.id) && tunnel.enabled !== enabled
                ? { ...tunnel, enabled, apply: "pending" }
                : tunnel,
            ),
            profiles: state.profiles.map((profile) =>
              affectedProfiles.has(profile.id)
                ? { ...profile, pending: true }
                : profile,
            ),
          }));
          affectedProfiles.forEach((id) =>
            log(
              id,
              "info",
              enabled
                ? text(
                    "隧道已启用，等待应用。",
                    "Tunnel enabled; awaiting apply.",
                  )
                : text(
                    "隧道已停用，等待应用。",
                    "Tunnel disabled; awaiting apply.",
                  ),
            ),
          );
        },

        applyProfiles: async (ids) => {
          const batch = ++latestBatch;
          set({ batchResults: [] });
          const results = await Promise.all(
            unique(ids).map(async (id, index) => {
              const profile = get().profiles.find((item) => item.id === id);
              if (!profile)
                return result(
                  id,
                  false,
                  text("连接已不存在", "Connection no longer exists"),
                );
              if (
                profile.process !== "running" ||
                profile.connection !== "confirmed"
              ) {
                const message = text(
                  "请先启动并确认服务器连接，再应用修改",
                  "Start and confirm the server connection before applying changes",
                );
                log(id, "warn", message);
                return result(id, false, message);
              }
              const operation = processOperations.get(id);
              const applyOperation = nextOperation(applyOperations, id);
              const revision = configRevisions.get(id);
              log(
                id,
                "info",
                text(
                  "演示：正在校验并应用配置…",
                  "Demo: validating and applying configuration…",
                ),
              );
              await delay(650 + index * 120);
              const current = get().profiles.find((item) => item.id === id);
              if (applyOperations.get(id) !== applyOperation) {
                return result(
                  id,
                  false,
                  text(
                    "应用操作已被更新的操作替代",
                    "Apply operation superseded by a newer operation",
                  ),
                );
              }
              if (
                !current ||
                current.process !== "running" ||
                current.connection !== "confirmed" ||
                processOperations.get(id) !== operation
              ) {
                return result(
                  id,
                  false,
                  text(
                    "连接状态已改变，修改仍待应用",
                    "Connection state changed; changes remain pending",
                  ),
                );
              }
              if (configRevisions.get(id) !== revision) {
                const message = text(
                  "配置在应用期间发生变化，请重新应用",
                  "Configuration changed while applying. Apply again.",
                );
                log(id, "warn", message);
                return result(id, false, message);
              }
              const attempt = nextOperation(applyAttempts, id);
              if (id === "profile-backup" && attempt === 1) {
                const message = text(
                  "演示：配置应用超时，修改已保留，可重试",
                  "Demo: apply timed out; changes retained. Retry is available.",
                );
                set((state) => ({
                  profiles: state.profiles.map((item) =>
                    item.id === id
                      ? { ...item, pending: true, lastError: message }
                      : item,
                  ),
                  tunnels: state.tunnels.map((tunnel) =>
                    tunnel.profileId === id && tunnel.apply !== "applied"
                      ? { ...tunnel, apply: "failed" }
                      : tunnel,
                  ),
                }));
                log(id, "error", message);
                return result(id, false, message);
              }
              set((state) => ({
                profiles: state.profiles.map((item) =>
                  item.id === id
                    ? { ...item, pending: false, lastError: undefined }
                    : item,
                ),
                tunnels: state.tunnels.map((tunnel) =>
                  tunnel.profileId === id
                    ? { ...tunnel, apply: "applied" }
                    : tunnel,
                ),
              }));
              const message = text(
                "演示：配置已应用，待应用标记已清除",
                "Demo: configuration applied; pending changes cleared",
              );
              log(id, "info", message);
              return result(id, true, message);
            }),
          );
          return finishBatch(batch, results, "apply");
        },

        installVersion: async (id) => {
          const version = get().versions.find((item) => item.id === id);
          if (
            !version ||
            version.installed ||
            (version.progress > 0 && version.progress < 100)
          )
            return;
          const operation = nextOperation(versionOperations, id);
          for (const progress of [8, 24, 43, 68, 87, 100]) {
            await delay(260);
            if (versionOperations.get(id) !== operation) return;
            set((state) => ({
              versions: state.versions.map((item) =>
                item.id === id
                  ? { ...item, progress, installed: progress === 100 }
                  : item,
              ),
            }));
          }
          log(
            "",
            "info",
            text(
              `演示：frpc ${version.version} 已安装。`,
              `Demo: frpc ${version.version} installed.`,
            ),
          );
        },

        deleteVersion: (id) => {
          const version = get().versions.find((item) => item.id === id);
          if (!version) return null;
          const users = get().profiles.filter(
            (profile) =>
              profile.version === version.version || profile.version === id,
          );
          if (users.length > 0) {
            return text(
              `此版本被 ${users.map((profile) => profile.name).join("、")} 使用，请先切换连接版本。`,
              `This version is used by ${users.map((profile) => profile.name).join(", ")}. Change their version first.`,
            );
          }
          nextOperation(versionOperations, id);
          set((state) => ({
            versions: state.versions.map((item) =>
              item.id === id
                ? { ...item, installed: false, progress: 0 }
                : item,
            ),
          }));
          log(
            "",
            "info",
            text(
              `演示：frpc ${version.version} 已卸载。`,
              `Demo: frpc ${version.version} uninstalled.`,
            ),
          );
          return null;
        },

        updateSettings: (settings) =>
          set((state) => ({ settings: { ...state.settings, ...settings } })),
      };
    },
    {
      name: "frpc-ui-browser-demo-preferences",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Credentials, connection configuration, tunnels, and logs stay in memory.
      partialize: (state) => ({
        page: state.page,
        scope: state.scope,
        settings: state.settings,
      }),
    },
  ),
);
