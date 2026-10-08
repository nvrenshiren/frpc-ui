import { mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

const output = "node_modules/.cache/frpc-ui";
mkdirSync(output, { recursive: true });
for (const name of ["store", "config", "configDefaults", "browserStore"]) {
  const bundle = spawnSync(process.execPath, [
    "node_modules/rolldown/bin/cli.mjs", `src/${name}.test.mjs`,
    "--file", `${output}/${name}.test.mjs`, "--platform", "node", "--format", "esm", "--no-codeSplitting",
  ], { stdio: "inherit" });
  if (bundle.status !== 0) process.exit(bundle.status ?? 1);
  const tests = spawnSync(process.execPath, [`${output}/${name}.test.mjs`], { stdio: "inherit" });
  if (tests.status !== 0) process.exit(tests.status ?? 1);
}
