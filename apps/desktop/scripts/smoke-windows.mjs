import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";

if (process.platform !== "win32") throw new Error("This smoke check requires Windows and WebView2.");
const executable = resolve(process.argv[2] ?? "../../target/release/frpc-ui-desktop.exe");
const temporaryRoot = resolve(tmpdir());
const profile = await mkdtemp(join(temporaryRoot, "frpc-ui-webview-smoke-"));
try {
  const child = spawn(executable, ["--smoke-test"], {
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, WEBVIEW2_USER_DATA_FOLDER: profile },
  });
  let diagnostic = "";
  child.stdout.on("data", (chunk) => { diagnostic += chunk.toString(); });
  child.stderr.on("data", (chunk) => { diagnostic += chunk.toString(); });
  const deadline = setTimeout(() => { child.kill(); }, 35_000);
  const result = await new Promise((accept, reject) => {
    child.once("error", reject);
    child.once("close", (code, signal) => accept({ code, signal }));
  }).finally(() => clearTimeout(deadline));
  if (result.code !== 0 || !diagnostic.includes("FRPC_UI_SMOKE_READY") || diagnostic.includes("FRPC_UI_SMOKE_FAILED")) {
    throw new Error(`Release startup/IPC smoke check failed (${JSON.stringify(result)}):\n${diagnostic}`);
  }
  console.log("Release WebView startup, snapshot IPC, three-second survival and clean shutdown passed.");
} finally {
  // Only remove the exact random directory created for this child's browser profile.
  if (dirname(profile) !== temporaryRoot || !basename(profile).startsWith("frpc-ui-webview-smoke-")) {
    throw new Error("Unexpected smoke profile path; refusing cleanup.");
  }
  await rm(profile, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 });
}
