import assert from "node:assert/strict";
import { test } from "node:test";

// Exercise the production adapter at its real Tauri invoke boundary.
let backend;
const writes = [];
globalThis.isTauri = true;
globalThis.window = {
  __TAURI_INTERNALS__: { invoke: (command, args) => backend(command, args) },
};
globalThis.localStorage = {
  getItem: () => null,
  setItem: (...args) => writes.push(args),
  removeItem: () => {},
};
const { useAppStore, makeProfile } = await import("./store.ts");
const store = () => useAppStore.getState();
const clone = (value) => structuredClone(value);
let snapshot = {
  profiles: [],
  tunnels: [],
  logs: [],
  versions: [],
  dataDir: "C:/test-data",
  settings: {
    language: "zh",
    theme: "dark",
    autoStart: false,
    silentStart: false,
    closeToTray: true,
  },
};
const profile = makeProfile({
  id: "real-profile",
  name: "Test connection",
  serverAddr: "127.0.0.1",
  version: "1.0.0",
});

await test("desktop boot is empty, reports load failure, and the user retry action bootstraps while not ready", async () => {
  assert.deepEqual(store().profiles, []);
  assert.equal(store().ready, false);
  backend = async () => {
    throw "config read failed";
  };
  await store().bootstrap();
  assert.equal(store().ready, false);
  assert.equal(store().loadError, "config read failed");
  snapshot.profiles = [profile];
  let retryReads = 0;
  backend = async (command) => {
    assert.equal(command, "get_snapshot");
    retryReads += 1;
    return clone(snapshot);
  };
  await store().retryLoading();
  assert.equal(retryReads, 1);
  assert.equal(store().ready, true);
  assert.equal(store().loadError, null);
  assert.equal(store().profiles[0].id, profile.id);
});

await test("failed saves retain authoritative data and release busy state", async () => {
  backend = async () => {
    throw "disk write failed";
  };
  await assert.rejects(
    store().saveProfile({ ...profile, name: "unsaved" }),
    (error) => error === "disk write failed",
  );
  assert.equal(store().profiles[0].name, profile.name);
  assert.equal(store().busy, false);
});

await test("an older refresh cannot overwrite a completed configuration save", async () => {
  let resolveRefresh;
  const old = clone(snapshot);
  backend = async (command, args) => {
    if (command === "get_snapshot")
      return new Promise((resolve) => {
        resolveRefresh = resolve;
      });
    assert.equal(command, "save_profile");
    snapshot.profiles = [args.profile];
    return clone(snapshot);
  };
  const refresh = store().refresh();
  await store().saveProfile({ ...profile, name: "saved" });
  resolveRefresh(old);
  await refresh;
  assert.equal(store().profiles[0].name, "saved");
});

await test("queued settings changes merge against the last committed settings", async () => {
  const received = [];
  backend = async (command, args) => {
    assert.equal(command, "set_settings");
    received.push(clone(args.settings));
    snapshot.settings = args.settings;
    return clone(snapshot);
  };
  await Promise.all([
    store().updateSettings({ language: "en" }),
    store().updateSettings({ theme: "light" }),
  ]);
  assert.equal(received.length, 2);
  assert.equal(received[1].language, "en");
  assert.equal(store().settings.theme, "light");
});

await test("download snapshots expose real progress while install is pending", async () => {
  let completeInstall;
  backend = async (command) => {
    if (command === "install_version") {
      snapshot.versions = [
        {
          id: "1.0.0",
          version: "1.0.0",
          installed: false,
          size: "1 MB",
          progress: 37,
        },
      ];
      return new Promise((resolve) => {
        completeInstall = resolve;
      });
    }
    assert.equal(command, "get_snapshot");
    return clone(snapshot);
  };
  const installation = store().installVersion("1.0.0");
  await Promise.resolve();
  await Promise.resolve();
  await store().refresh();
  assert.equal(store().versions[0].progress, 37);
  snapshot.versions[0] = {
    ...snapshot.versions[0],
    installed: true,
    progress: 100,
  };
  completeInstall(clone(snapshot));
  await installation;
  assert.equal(store().versions[0].installed, true);
});

await test("partial batch failure preserves the original retry action and exact requested IDs", async () => {
  backend = async (command, args) => {
    assert.equal(command, "run_profiles");
    assert.deepEqual(args.ids, [profile.id, "missing"]);
    assert.equal(args.action, "stop");
    return {
      results: [
        { profileId: profile.id, success: true, message: "stopped" },
        { profileId: "missing", success: false, message: "not found" },
      ],
      snapshot: clone(snapshot),
    };
  };
  const results = await store().stopProfiles([
    profile.id,
    "missing",
    profile.id,
  ]);
  assert.equal(results[1].success, false);
  assert.equal(results[1].action, "stop");
  assert.deepEqual(store().batchResults, results);
});

await test("import sends one atomic command, returns the rewritten backend ID, and never persists desktop secrets in localStorage", async () => {
  const imported = {
    ...profile,
    id: "imported",
    authToken: "test-private-token",
  };
  const received = [];
  backend = async (command, args) => {
    received.push(command);
    assert.equal(command, "import_configuration");
    assert.equal(args.profile.authToken, imported.authToken);
    snapshot.profiles.push({
      ...args.profile,
      id: "backend-generated-import-id",
    });
    return clone(snapshot);
  };
  const actualProfile = await store().importConfiguration(imported, []);
  store().setScope(actualProfile.id);
  assert.equal(actualProfile.id, "backend-generated-import-id");
  assert.equal(store().scope, "backend-generated-import-id");
  assert.equal(
    store().profiles.some((item) => item.id === actualProfile.id),
    true,
  );
  assert.deepEqual(received, ["import_configuration"]);
  assert.deepEqual(writes, []);
});
