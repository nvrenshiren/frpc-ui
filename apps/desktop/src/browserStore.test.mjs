import assert from "node:assert/strict";
import { test } from "node:test";

const writes = [];
globalThis.isTauri = false;
globalThis.window = {
  __TAURI_INTERNALS__: {
    invoke: () => {
      throw new Error("Browser must not invoke Tauri");
    },
  },
};
globalThis.localStorage = {
  getItem: () => null,
  setItem: (...args) => writes.push(args),
  removeItem: () => {},
};
const { useAppStore, makeProfile, makeTunnel } = await import("./store.ts");
const store = () => useAppStore.getState();
const imported = makeProfile({
  id: "browser-import",
  name: "Browser test",
  serverAddr: "127.0.0.1",
  version: "1.0.0",
  authToken: "test-browser-secret",
});
const tunnel = makeTunnel({
  id: "browser-tunnel",
  profileId: imported.id,
  name: "Test tunnel",
});

await test("browser import returns its actual profile and supports the same selection path as desktop import", async () => {
  const previousCount = store().profiles.length;
  const actual = await store().importConfiguration(imported, [tunnel]);
  store().setScope(actual.id);
  assert.equal(actual.id, imported.id);
  assert.equal(store().scope, actual.id);
  assert.equal(store().profiles.length, previousCount + 1);
  assert.equal(
    store().tunnels.some(
      (item) => item.id === tunnel.id && item.profileId === actual.id,
    ),
    true,
  );
  assert.equal(
    writes.some(([, value]) => value.includes(imported.authToken)),
    false,
  );
});

await test("browser duplicate import rejects without adding a partial profile or tunnel", async () => {
  const profiles = store().profiles.length;
  const tunnels = store().tunnels.length;
  await assert.rejects(
    store().importConfiguration(imported, [tunnel]),
    /already exists/,
  );
  assert.equal(store().profiles.length, profiles);
  assert.equal(store().tunnels.length, tunnels);
});
