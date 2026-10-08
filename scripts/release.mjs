import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const plainVersion = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const events = new Set(['push', 'pull_request', 'workflow_dispatch']);

function requireVersion(value, label) {
  if (typeof value !== 'string' || !plainVersion.test(value) || !value.split('.').every((part) => Number.isSafeInteger(Number(part)))) {
    throw new Error(`${label} must be a strict X.Y.Z version`);
  }
  return value;
}

function validateRef(value) {
  if (typeof value !== 'string' || !/^refs\/(?:heads|tags)\/[A-Za-z0-9_./-]+$/.test(value)) {
    if (typeof value === 'string' && /^refs\/pull\/[1-9]\d*\/(?:merge|head)$/.test(value)) return value;
    throw new Error('Invalid GitHub ref');
  }
  const components = value.split('/');
  if (components.some((part) => !part || part.startsWith('.') || part.endsWith('.') || part.endsWith('.lock')) || value.includes('..')) {
    throw new Error('Invalid GitHub ref');
  }
  return value;
}

function validateVersions(versions) {
  const entries = ['packageVersion', 'cargoVersion', 'lockVersion', 'lockPackageVersion'];
  for (const key of entries) requireVersion(versions?.[key], key);
  if (entries.some((key) => versions[key] !== versions.packageVersion)) throw new Error('Package, Cargo workspace and npm lock versions must match');
  return versions.packageVersion;
}

/** Event eligibility is decided independently from ref text: PRs can never publish. */
export function createReleasePlan(input, versions) {
  const baseVersion = validateVersions(versions);
  if (!events.has(input.eventName)) throw new Error('Unsupported GitHub event');
  const ref = validateRef(input.ref);
  if (typeof input.runNumber !== 'string' || !/^[1-9]\d*$/.test(input.runNumber) || !Number.isSafeInteger(Number(input.runNumber))) {
    throw new Error('GITHUB_RUN_NUMBER must be a positive safe integer');
  }
  if (typeof input.sha !== 'string' || !/^[a-fA-F0-9]{40}$/.test(input.sha)) throw new Error('GITHUB_SHA must be a 40-character commit SHA');
  let version = baseVersion;
  let tag = '';
  let channel = 'build';
  let publish = false;
  let prerelease = false;
  if (input.eventName === 'push' && ref === 'refs/heads/main') {
    version = `${baseVersion}-dev.${input.runNumber}`;
    tag = `v${version}`;
    channel = 'dev';
    publish = true;
    prerelease = true;
  } else if (input.eventName === 'push' && ref.startsWith('refs/tags/')) {
    const requested = ref.slice('refs/tags/'.length);
    if (!requested.startsWith('v')) throw new Error('Release tags must be strict vX.Y.Z');
    requireVersion(requested.slice(1), 'Release tag');
    if (requested !== `v${baseVersion}`) throw new Error('Release tag must match the package, Cargo workspace and npm lock versions');
    tag = requested;
    channel = 'stable';
    publish = true;
  }
  return { schemaVersion: 1, eventName: input.eventName, ref, runNumber: input.runNumber, sourceSha: input.sha, baseVersion, version, tag, channel, publish, prerelease };
}

function within(root, candidate) {
  const relative = path.relative(root, candidate);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error('Path escapes the repository');
  return candidate;
}

async function safePath(root, relative) {
  const destination = within(root, path.resolve(root, relative));
  const parts = path.relative(root, destination).split(path.sep).filter(Boolean);
  let current = root;
  for (const part of parts) {
    current = path.join(current, part);
    try {
      const entry = await fs.lstat(current);
      if (entry.isSymbolicLink()) throw new Error('Release paths cannot use symbolic links or junctions');
    } catch (error) {
      if (error.code === 'ENOENT') break;
      throw error;
    }
  }
  return destination;
}

async function canonicalRoot(root) {
  const canonical = await fs.realpath(root);
  if (!(await fs.stat(canonical)).isDirectory()) throw new Error('Repository root must be a directory');
  return canonical;
}

async function readJson(root, relative) {
  const target = await safePath(root, relative);
  if (!(await fs.lstat(target)).isFile()) throw new Error(`${relative} must be a regular file`);
  return JSON.parse(await fs.readFile(target, 'utf8'));
}

export async function readRepositoryVersions(root = repositoryRoot) {
  root = await canonicalRoot(root);
  const [pkg, lock, cargo] = await Promise.all([
    readJson(root, 'apps/desktop/package.json'),
    readJson(root, 'apps/desktop/package-lock.json'),
    fs.readFile(await safePath(root, 'Cargo.toml'), 'utf8'),
  ]);
  let inWorkspacePackage = false;
  const versions = [];
  for (const line of cargo.split(/\r?\n/)) {
    if (/^\s*\[/.test(line)) inWorkspacePackage = /^\s*\[workspace\.package\]\s*(?:#.*)?$/.test(line);
    else if (inWorkspacePackage && /^\s*version\s*=/.test(line)) {
      const match = line.match(/^\s*version\s*=\s*['"]([^'"]+)['"]\s*(?:#.*)?$/);
      if (!match) throw new Error('Cargo workspace version must be a literal X.Y.Z');
      versions.push(match[1]);
    }
  }
  if (versions.length !== 1) throw new Error('Cargo.toml must define exactly one workspace.package.version');
  const result = { packageVersion: pkg.version, cargoVersion: versions[0], lockVersion: lock.version, lockPackageVersion: lock.packages?.['']?.version };
  validateVersions(result);
  return result;
}

function checkedPlan(plan, versions) {
  if (!plan || typeof plan !== 'object' || Array.isArray(plan)) throw new Error('Invalid release plan');
  const expected = createReleasePlan({ eventName: plan.eventName, ref: plan.ref, runNumber: plan.runNumber, sha: plan.sourceSha }, versions);
  if (Object.keys(plan).length !== Object.keys(expected).length || Object.entries(expected).some(([key, value]) => plan[key] !== value)) {
    throw new Error('Release plan does not match its event and repository versions');
  }
  return expected;
}

export function githubOutputText(plan) {
  const verified = checkedPlan(plan, { packageVersion: plan.baseVersion, cargoVersion: plan.baseVersion, lockVersion: plan.baseVersion, lockPackageVersion: plan.baseVersion });
  return [`tag=${verified.tag}`, `version=${verified.version}`, `prerelease=${verified.prerelease}`, `publish=${verified.publish}`, ''].join('\n');
}

export async function writeGithubOutputs(plan, outputFile) {
  const output = githubOutputText(plan);
  if (typeof outputFile !== 'string' || !path.isAbsolute(outputFile) || /[\0\r\n]/.test(outputFile)) throw new Error('GITHUB_OUTPUT must be an absolute file path');
  try {
    const entry = await fs.lstat(outputFile);
    if (!entry.isFile() || entry.isSymbolicLink()) throw new Error('GITHUB_OUTPUT must be a regular file');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await fs.appendFile(outputFile, output, 'utf8');
}

async function atomicJson(root, relative, value) {
  const destination = await safePath(root, relative);
  const temporary = await safePath(root, `${relative}.${randomUUID()}.tmp`);
  try {
    await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });
    await fs.rename(temporary, destination);
  } finally {
    await fs.unlink(temporary).catch((error) => { if (error.code !== 'ENOENT') throw error; });
  }
}

/** The config override changes bundle version without editing any tracked manifest. */
export async function prepareRelease(root, plan, { ci = false } = {}) {
  if (!ci) throw new Error('prepare is only available in CI');
  root = await canonicalRoot(root);
  plan = checkedPlan(plan, await readRepositoryVersions(root));
  await fs.mkdir(await safePath(root, 'artifacts'), { recursive: true });
  await atomicJson(root, 'artifacts/tauri-release.json', { version: plan.version });
  await atomicJson(root, 'artifacts/release-plan.json', plan);
  return plan;
}

async function requireExecutable(root, relative, label) {
  const source = await safePath(root, relative);
  const entry = await fs.lstat(source).catch((error) => {
    if (error.code === 'ENOENT') throw new Error(`Missing ${label}`);
    throw error;
  });
  if (!entry.isFile() || entry.size === 0) throw new Error(`${label} must be a nonempty regular file`);
  return source;
}

async function sha256(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

function releaseNotes(plan) {
  return `# frpc-ui ${plan.version}\n\nSource commit / 来源提交: \`${plan.sourceSha}\`\n\n- Windows x64 portable executable and NSIS installer / 便携 EXE 与 NSIS 安装包。\n- CI checks release EXE startup/IPC and a fresh NSIS install; upgrades of existing installations are not yet verified / CI 检查发布 EXE 启动与 IPC 及全新 NSIS 安装，现有安装升级路径尚未验收。\n- Unsigned build / 产物未签名。\n- Requires Microsoft Edge WebView2 Runtime / 需要 WebView2 运行时。\n- Configuration and credentials are stored in plaintext in the application data directory / 配置与凭据以明文保存在应用数据目录。\n- frpc is not bundled; install or import it from the version library / 不附带 frpc，首次使用请在版本库安装或导入。\n`;
}

export async function packageRelease(root = repositoryRoot) {
  root = await canonicalRoot(root);
  const plan = checkedPlan(await readJson(root, 'artifacts/release-plan.json'), await readRepositoryVersions(root));
  const portable = await requireExecutable(root, 'target/release/frpc-ui-desktop.exe', 'portable EXE');
  const nsisDirectory = await safePath(root, 'target/release/bundle/nsis');
  const expectedInstaller = `frpc-ui_${plan.version}_x64-setup.exe`;
  const installers = (await fs.readdir(nsisDirectory).catch((error) => {
    if (error.code === 'ENOENT') throw new Error('Missing NSIS setup executable');
    throw error;
  })).filter((name) => name.toLowerCase() === expectedInstaller.toLowerCase());
  if (installers.length !== 1) throw new Error(`Expected exactly one NSIS setup executable for ${plan.version}: ${expectedInstaller}`);
  const installer = await requireExecutable(root, `target/release/bundle/nsis/${installers[0]}`, 'NSIS setup executable');
  const output = await safePath(root, 'artifacts/release');
  try {
    await fs.lstat(output);
    throw new Error('artifacts/release already exists; packaging will not replace existing artifacts');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const staging = await fs.mkdtemp(await safePath(root, 'artifacts/.release-staging-'));
  try {
    const assets = [];
    for (const [source, kind] of [[portable, 'portable'], [installer, 'setup']]) {
      const filename = `frpc-ui-${plan.version}-windows-x64${kind === 'setup' ? '-setup' : ''}.exe`;
      const destination = within(root, path.join(staging, filename));
      await fs.copyFile(source, destination);
      assets.push({ filename, size: (await fs.stat(destination)).size, sha256: await sha256(destination) });
    }
    const metadata = { schemaVersion: 1, version: plan.version, tag: plan.tag, channel: plan.channel, publish: plan.publish, prerelease: plan.prerelease, sourceSha: plan.sourceSha, platform: 'windows', architecture: 'x64', signed: false, webView2Required: true, includesFrpc: false, credentialStorage: 'plaintext-in-application-data-directory', assets };
    const metadataFile = path.join(staging, 'release.json');
    await fs.writeFile(metadataFile, `${JSON.stringify(metadata, null, 2)}\n`);
    await fs.writeFile(path.join(staging, 'SHA256SUMS.txt'), `${assets.map((asset) => `${asset.sha256}  ${asset.filename}\n`).join('')}${await sha256(metadataFile)}  release.json\n`);
    await fs.writeFile(path.join(staging, 'release-notes.md'), releaseNotes(plan));
    await fs.rename(staging, output);
    return metadata;
  } catch (error) {
    const safeStaging = await safePath(root, path.relative(root, staging));
    if (path.dirname(safeStaging) !== path.join(root, 'artifacts') || !path.basename(safeStaging).startsWith('.release-staging-')) throw new Error('Invalid staging cleanup path', { cause: error });
    await fs.rm(safeStaging, { recursive: true, force: true });
    throw error;
  }
}

async function cli() {
  const [command, ...remaining] = process.argv.slice(2);
  if (remaining.length || !['plan', 'prepare', 'package'].includes(command)) throw new Error('Usage: node scripts/release.mjs <plan|prepare|package>');
  if (command === 'package') {
    const release = await packageRelease();
    console.log(JSON.stringify({ version: release.version, assets: release.assets.map((asset) => asset.filename) }));
    return;
  }
  const plan = createReleasePlan({ eventName: process.env.GITHUB_EVENT_NAME, ref: process.env.GITHUB_REF, runNumber: process.env.GITHUB_RUN_NUMBER, sha: process.env.GITHUB_SHA }, await readRepositoryVersions());
  if (command === 'prepare') await prepareRelease(repositoryRoot, plan, { ci: process.env.CI === 'true' });
  else if (process.env.GITHUB_OUTPUT) await writeGithubOutputs(plan, process.env.GITHUB_OUTPUT);
  else if (process.env.CI === 'true') throw new Error('GITHUB_OUTPUT is required in CI');
  console.log(JSON.stringify({ tag: plan.tag, version: plan.version, prerelease: plan.prerelease, publish: plan.publish }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  cli().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
