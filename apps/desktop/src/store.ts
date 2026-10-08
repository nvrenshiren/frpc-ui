import { create } from "zustand";
import {
  desktopHost,
  desktopInvoke,
  errorMessage,
  type DesktopSnapshot,
  type RunResult,
  type LegacyPreview,
} from "./desktop";
import { useMockStore, type LogInput } from "./mockStore";
import type {
  AppSettings,
  BatchResult,
  LogEntry,
  Page,
  Profile,
  Tunnel,
  Version,
} from "./model";

export { makeProfile, makeTunnel } from "./model";

export interface AppStore {
  page: Page;
  scope: string;
  profiles: Profile[];
  tunnels: Tunnel[];
  versions: Version[];
  logs: LogEntry[];
  settings: AppSettings;
  batchResults: BatchResult[];
  dataDir: string;
  ready: boolean;
  loadError: string | null;
  busy: boolean;
  bootstrap: () => Promise<void>;
  refresh: () => Promise<void>;
  retryLoading: () => Promise<void>;
  setPage: (page: Page) => void;
  setScope: (scope: string) => void;
  clearBatchResults: () => void;
  startProfiles: (ids: string[]) => Promise<BatchResult[]>;
  stopProfiles: (ids: string[]) => Promise<BatchResult[]>;
  applyProfiles: (ids: string[]) => Promise<BatchResult[]>;
  saveProfile: (profile: Profile) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  saveTunnel: (tunnel: Tunnel) => Promise<void>;
  deleteTunnels: (ids: string[]) => Promise<void>;
  toggleTunnels: (ids: string[], enabled: boolean) => Promise<void>;
  importConfiguration: (
    profile: Profile,
    tunnels: Tunnel[],
  ) => Promise<Profile>;
  installVersion: (id: string) => Promise<void>;
  deleteVersion: (id: string) => Promise<void>;
  refreshVersions: () => Promise<void>;
  importVersion: (path: string) => Promise<void>;
  previewLegacy: (path: string, version: string) => Promise<LegacyPreview>;
  importLegacy: (
    path: string,
    version: string,
    sourceFingerprint: string,
  ) => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  addLog: (
    entry: LogInput | string,
    profileId?: string,
    level?: LogEntry["level"],
  ) => void;
}

const defaultSettings: AppSettings = {
  language: "zh",
  theme: "dark",
  autoStart: false,
  silentStart: false,
  closeToTray: true,
};

function demoData() {
  const {
    profiles,
    tunnels,
    versions,
    logs,
    settings,
    page,
    scope,
    batchResults,
  } = useMockStore.getState();
  return {
    profiles,
    tunnels,
    versions,
    logs,
    settings,
    page,
    scope,
    batchResults,
  };
}

// Desktop configuration is persisted only by Rust. Browser demo preferences use a separate storage key.
const useBrowserStore = create<AppStore>(() => {
  const mock = () => useMockStore.getState();
  return {
    ...demoData(),
    dataDir: "",
    ready: true,
    loadError: null,
    busy: false,
    bootstrap: async () => {},
    refresh: async () => {},
    retryLoading: async () => {},
    setPage: (page) => mock().setPage(page),
    setScope: (scope) => mock().setScope(scope),
    clearBatchResults: () => mock().clearBatchResults(),
    startProfiles: (ids) => mock().startProfiles(ids),
    stopProfiles: (ids) => mock().stopProfiles(ids),
    applyProfiles: (ids) => mock().applyProfiles(ids),
    saveProfile: async (profile) => {
      mock().saveProfile(profile);
    },
    deleteProfile: async (id) => {
      mock().deleteProfile(id);
    },
    saveTunnel: async (tunnel) => {
      mock().saveTunnel(tunnel);
    },
    deleteTunnels: async (ids) => {
      mock().deleteTunnels(ids);
    },
    toggleTunnels: async (ids, enabled) => {
      mock().toggleTunnels(ids, enabled);
    },
    importConfiguration: async (profile, tunnels) => {
      if (mock().profiles.some((item) => item.id === profile.id))
        throw new Error("Connection already exists");
      useMockStore.setState((state) => ({
        profiles: [...state.profiles, profile],
        tunnels: [...state.tunnels, ...tunnels],
      }));
      return profile;
    },
    installVersion: (id) => mock().installVersion(id),
    deleteVersion: async (id) => {
      const error = mock().deleteVersion(id);
      if (error) throw new Error(error);
    },
    refreshVersions: async () => {},
    importVersion: async () => {
      throw new Error("Local binary import is available in the desktop app");
    },
    previewLegacy: async () => {
      throw new Error("Legacy import is available in the desktop app");
    },
    importLegacy: async () => {
      throw new Error("Legacy import is available in the desktop app");
    },
    updateSettings: async (settings) => {
      mock().updateSettings(settings);
    },
    addLog: (entry, profileId, level) => mock().addLog(entry, profileId, level),
  };
});
useMockStore.subscribe(() => useBrowserStore.setState(demoData()));

let revision = 0;
let mutations = 0;
let pendingMutations = 0;
let polling = false;
let queue: Promise<unknown> = Promise.resolve();
let bootstrapPromise: Promise<void> | null = null;

const useDesktopStore = create<AppStore>((set, get) => {
  const accept = (snapshot: DesktopSnapshot) => {
    set({
      ...snapshot,
      ready: true,
      loadError: null,
      scope:
        get().scope === "all" ||
        snapshot.profiles.some((item) => item.id === get().scope)
          ? get().scope
          : "all",
    });
  };
  const enqueue = <T>(
    operation: () => Promise<T>,
    allowPolling = false,
  ): Promise<T> => {
    pendingMutations += 1;
    revision += 1;
    set({ busy: true });
    const task = queue
      .catch(() => {})
      .then(async () => {
        mutations += allowPolling ? 0 : 1;
        revision += 1;
        try {
          return await operation();
        } finally {
          mutations -= allowPolling ? 0 : 1;
          pendingMutations -= 1;
          revision += 1;
          set({ busy: pendingMutations > 0 });
        }
      });
    queue = task;
    return task;
  };
  const mutate = (
    command: string,
    args?: Record<string, unknown>,
    allowPolling = false,
  ) =>
    enqueue(
      async () => accept(await desktopInvoke<DesktopSnapshot>(command, args)),
      allowPolling,
    );
  const run = (ids: string[], action: "start" | "stop" | "apply") =>
    enqueue(async () => {
      set({ batchResults: [] });
      const response = await desktopInvoke<RunResult>("run_profiles", {
        ids: [...new Set(ids)],
        action,
      });
      accept(response.snapshot);
      const results = response.results.map((result) => ({ ...result, action }));
      set({ batchResults: results });
      return results;
    }, true);
  const refresh = async () => {
    if (polling || mutations > 0 || !get().ready) return;
    const requestedRevision = revision;
    polling = true;
    try {
      const snapshot = await desktopInvoke<DesktopSnapshot>("get_snapshot");
      if (requestedRevision === revision && mutations === 0) accept(snapshot);
    } catch (error) {
      // Preserve the last authoritative snapshot on transient refresh failures.
      if (requestedRevision === revision)
        set({ loadError: errorMessage(error) });
    } finally {
      polling = false;
    }
  };
  return {
    page: "overview",
    scope: "all",
    profiles: [],
    tunnels: [],
    versions: [],
    logs: [],
    settings: defaultSettings,
    batchResults: [],
    dataDir: "",
    ready: false,
    loadError: null,
    busy: false,
    setPage: (page) => set({ page }),
    setScope: (scope) => set({ scope }),
    clearBatchResults: () => set({ batchResults: [] }),
    bootstrap: () => {
      if (bootstrapPromise) return bootstrapPromise;
      set({ loadError: null });
      bootstrapPromise = desktopInvoke<DesktopSnapshot>("get_snapshot")
        .then(accept)
        .catch((error) => {
          set({ loadError: errorMessage(error) });
        })
        .finally(() => {
          bootstrapPromise = null;
        });
      return bootstrapPromise;
    },
    refresh,
    retryLoading: () => (get().ready ? refresh() : get().bootstrap()),
    startProfiles: (ids) => run(ids, "start"),
    stopProfiles: (ids) => run(ids, "stop"),
    applyProfiles: (ids) => run(ids, "apply"),
    saveProfile: (profile) => mutate("save_profile", { profile }),
    deleteProfile: (id) => mutate("delete_profile", { id }),
    saveTunnel: (tunnel) => mutate("save_tunnel", { tunnel }),
    deleteTunnels: (ids) => mutate("delete_tunnels", { ids }),
    toggleTunnels: (ids, enabled) => mutate("toggle_tunnels", { ids, enabled }),
    importConfiguration: (profile, tunnels) =>
      enqueue(async () => {
        const previousIds = new Set(get().profiles.map((item) => item.id));
        const snapshot = await desktopInvoke<DesktopSnapshot>(
          "import_configuration",
          { profile, tunnels },
        );
        accept(snapshot);
        const imported = snapshot.profiles.find(
          (item) => !previousIds.has(item.id),
        );
        if (!imported)
          throw new Error(
            "Imported connection is missing from the backend snapshot",
          );
        return imported;
      }),
    installVersion: (id) => mutate("install_version", { id }, true),
    deleteVersion: (id) => mutate("remove_version", { id }),
    refreshVersions: () => mutate("refresh_versions", undefined, true),
    importVersion: (path) => mutate("import_version", { path }),
    previewLegacy: (path, version) =>
      desktopInvoke<LegacyPreview>("preview_legacy", { path, version }),
    importLegacy: (path, version, sourceFingerprint) =>
      mutate("import_legacy", { path, version, sourceFingerprint }),
    updateSettings: (changes) =>
      enqueue(async () => {
        accept(
          await desktopInvoke<DesktopSnapshot>("set_settings", {
            settings: { ...get().settings, ...changes },
          }),
        );
      }),
    addLog: () => {},
  };
});

export const useAppStore = desktopHost ? useDesktopStore : useBrowserStore;
