import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createReleasePlan, githubOutputText, packageRelease, prepareRelease, readRepositoryVersions, writeGithubOutputs } from './release.mjs';

const sourceScript = fileURLToPath(new URL('./release.mjs', import.meta.url));
const sha = 'a'.repeat(40);
const versions = { packageVersion: '0.1.0', cargoVersion: '0.1.0', lockVersion: '0.1.0', lockPackageVersion: '0.1.0' };
const input = { eventName: 'push', ref: 'refs/heads/main', runNumber: '42', sha };
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function fixture(t, changes = {}) {
  const root = await fs.mkdtemp(path.join(path.resolve(tmpdir()), 'frpc-release-test-'));
  t.after(async () => {
    assert.equal(path.dirname(root), path.resolve(tmpdir()));
    assert.ok(path.basename(root).startsWith('frpc-release-test-'));
    await fs.rm(root, { recursive: true, force: true });
  });
  const current = { ...versions, ...changes };
  await fs.mkdir(path.join(root, 'apps/desktop'), { recursive: true });
  await fs.mkdir(path.join(root, 'scripts'));
  await fs.copyFile(sourceScript, path.join(root, 'scripts/release.mjs'));
  await fs.writeFile(path.join(root, 'apps/desktop/package.json'), JSON.stringify({ name: 'frpc-ui-desktop', version: current.packageVersion }));
  await fs.writeFile(path.join(root, 'apps/desktop/package-lock.json'), JSON.stringify({ version: current.lockVersion, packages: { '': { version: current.lockPackageVersion } } }));
  await fs.writeFile(path.join(root, 'Cargo.toml'), `[workspace]\nmembers = []\n[workspace.package]\nedition = "2021"\nversion = "${current.cargoVersion}"\n[profile.release]\nstrip = true\n`);
  return root;
}

function cli(root, command, env = {}) {
  return spawnSync(process.execPath, [path.join(root, 'scripts/release.mjs'), command], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, CI: '', GITHUB_OUTPUT: '', GITHUB_EVENT_NAME: input.eventName, GITHUB_REF: input.ref, GITHUB_RUN_NUMBER: input.runNumber, GITHUB_SHA: input.sha, ...env },
    shell: false,
  });
}

async function buildFixture(root, { installer = true, version = '0.1.0-dev.42' } = {}) {
  await fs.mkdir(path.join(root, 'target/release/bundle/nsis'), { recursive: true });
  const portable = Buffer.from('portable test executable\0different bytes');
  const setup = Buffer.from('NSIS fixture executable\0installer bytes');
  await fs.writeFile(path.join(root, 'target/release/frpc-ui-desktop.exe'), portable);
  if (installer) await fs.writeFile(path.join(root, `target/release/bundle/nsis/frpc-ui_${version}_x64-setup.exe`), setup);
  return { portable, setup };
}

test('main pushes have an independent run-number prerelease', () => {
  const plan = createReleasePlan(input, versions);
  assert.equal(plan.version, '0.1.0-dev.42');
  assert.equal(plan.tag, 'v0.1.0-dev.42');
  assert.equal(plan.channel, 'dev');
  assert.equal(plan.publish, true);
  assert.equal(plan.prerelease, true);
  assert.equal(createReleasePlan({ ...input, runNumber: '43' }, versions).tag, 'v0.1.0-dev.43');
});

test('only matching strict release tags produce a stable release', () => {
  const plan = createReleasePlan({ ...input, ref: 'refs/tags/v0.1.0' }, versions);
  assert.equal(plan.version, '0.1.0');
  assert.equal(plan.tag, 'v0.1.0');
  assert.equal(plan.publish, true);
  assert.equal(plan.prerelease, false);
  assert.throws(() => createReleasePlan({ ...input, ref: 'refs/tags/v0.2.0' }, versions), /tag must match/);
  for (const ref of ['refs/tags/0.1.0', 'refs/tags/v00.1.0', 'refs/tags/v0.1', 'refs/tags/v0.1.0-dev.42', 'refs/tags/v0.1.0.1']) {
    assert.throws(() => createReleasePlan({ ...input, ref }, versions), /strict|X.Y.Z/);
  }
});

test('npm top-level, lock root and Cargo versions must remain aligned', () => {
  for (const field of ['cargoVersion', 'lockVersion', 'lockPackageVersion']) {
    assert.throws(() => createReleasePlan({ ...input, ref: 'refs/tags/v0.1.0' }, { ...versions, [field]: '0.2.0' }), /versions must match/);
  }
  for (const value of ['0.1.0-dev.1', '01.1.0', '0.1.0\npublish=true', '../0.1.0', '', null]) {
    assert.throws(() => createReleasePlan(input, { ...versions, packageVersion: value }), /strict X.Y.Z/);
  }
});

test('PRs and manual runs cannot publish, even with otherwise publishable refs', () => {
  for (const eventName of ['pull_request', 'workflow_dispatch']) {
    for (const ref of ['refs/heads/main', 'refs/tags/v0.1.0', 'refs/pull/12/merge']) {
      const plan = createReleasePlan({ ...input, eventName, ref }, versions);
      assert.equal(plan.publish, false);
      assert.equal(plan.prerelease, false);
      assert.equal(plan.tag, '');
      assert.equal(plan.version, '0.1.0');
    }
  }
  assert.equal(createReleasePlan({ ...input, ref: 'refs/heads/feature/valid-change' }, versions).publish, false);
});

test('unsafe refs, run numbers and commit values are rejected before output', () => {
  for (const ref of ['refs/heads/main\npublish=true', 'refs/heads/../main', 'refs/heads/main.lock', 'refs/heads//main', 'refs/heads/main;echo', 'main', null]) {
    assert.throws(() => createReleasePlan({ ...input, ref }, versions), /Invalid GitHub ref/);
  }
  for (const runNumber of ['0', '-1', '01', '1.5', '42\ntag=v9.9.9', '9007199254740992', undefined]) {
    assert.throws(() => createReleasePlan({ ...input, runNumber }, versions), /positive safe integer/);
  }
  for (const value of ['abc', `${sha}\npublish=true`, 'x'.repeat(40)]) assert.throws(() => createReleasePlan({ ...input, sha: value }, versions), /commit SHA/);
  assert.throws(() => createReleasePlan({ ...input, eventName: 'release' }, versions), /Unsupported GitHub event/);
});

test('outputs contain exactly four validated keys and reject injected plan values', async (t) => {
  const root = await fixture(t);
  const output = path.join(root, 'github-output');
  const plan = createReleasePlan(input, versions);
  assert.equal(githubOutputText(plan), 'tag=v0.1.0-dev.42\nversion=0.1.0-dev.42\nprerelease=true\npublish=true\n');
  await writeGithubOutputs(plan, output);
  const before = await fs.readFile(output, 'utf8');
  await assert.rejects(writeGithubOutputs({ ...plan, tag: 'v0.1.0\nmalicious=true' }, output), /plan does not match/);
  await assert.rejects(writeGithubOutputs({ ...plan, publish: false }, output), /plan does not match/);
  assert.equal(await fs.readFile(output, 'utf8'), before);
});

test('CLI plan reads GitHub environment without requiring CI', async (t) => {
  const root = await fixture(t);
  const output = path.join(root, 'github-output');
  const result = cli(root, 'plan', { GITHUB_OUTPUT: output });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { tag: 'v0.1.0-dev.42', version: '0.1.0-dev.42', prerelease: true, publish: true });
  assert.match(await fs.readFile(output, 'utf8'), /version=0.1.0-dev.42/);
  const invalid = cli(root, 'plan', { GITHUB_OUTPUT: output, GITHUB_REF: 'refs/heads/main\npublish=false' });
  assert.notEqual(invalid.status, 0);
  assert.equal((await fs.readFile(output, 'utf8')).split('publish=').length, 2);
});

test('repository reading catches a drifted npm lock root', async (t) => {
  const root = await fixture(t, { lockPackageVersion: '0.2.0' });
  await assert.rejects(readRepositoryVersions(root), /versions must match/);
});

test('prepare writes a CI-only version override and keeps tracked versions unchanged', async (t) => {
  const root = await fixture(t);
  const manifestPaths = ['apps/desktop/package.json', 'apps/desktop/package-lock.json', 'Cargo.toml'];
  const before = await Promise.all(manifestPaths.map((item) => fs.readFile(path.join(root, item), 'utf8')));
  const plan = createReleasePlan(input, versions);
  await assert.rejects(prepareRelease(root, plan), /only available in CI/);
  assert.notEqual(cli(root, 'prepare').status, 0);
  const result = cli(root, 'prepare', { CI: 'true' });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(root, 'artifacts/tauri-release.json'), 'utf8')), { version: '0.1.0-dev.42' });
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(root, 'artifacts/release-plan.json'), 'utf8')), plan);
  await prepareRelease(root, plan, { ci: true });
  const nextPlan = createReleasePlan({ ...input, runNumber: '43' }, versions);
  await prepareRelease(root, nextPlan, { ci: true });
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(root, 'artifacts/tauri-release.json'), 'utf8')), { version: '0.1.0-dev.43' });
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(root, 'artifacts/release-plan.json'), 'utf8')), nextPlan);
  assert.deepEqual(await Promise.all(manifestPaths.map((item) => fs.readFile(path.join(root, item), 'utf8'))), before);
});

test('package copies actual bytes, hashes both EXEs and metadata, and records complete source SHA', async (t) => {
  const root = await fixture(t);
  const originalSha = 'Ab'.repeat(20);
  const plan = createReleasePlan({ ...input, sha: originalSha }, versions);
  await prepareRelease(root, plan, { ci: true });
  const bytes = await buildFixture(root);
  const release = await packageRelease(root);
  const directory = path.join(root, 'artifacts/release');
  assert.equal(release.sourceSha, originalSha);
  assert.equal(release.version, '0.1.0-dev.42');
  assert.equal(release.signed, false);
  assert.equal(release.includesFrpc, false);
  assert.deepEqual(release.assets.map((asset) => asset.filename), ['frpc-ui-0.1.0-dev.42-windows-x64.exe', 'frpc-ui-0.1.0-dev.42-windows-x64-setup.exe']);
  assert.deepEqual(release.assets.map((asset) => asset.sha256), [digest(bytes.portable), digest(bytes.setup)]);
  assert.deepEqual(release.assets.map((asset) => asset.size), [bytes.portable.length, bytes.setup.length]);
  for (const [index, asset] of release.assets.entries()) {
    assert.deepEqual(await fs.readFile(path.join(directory, asset.filename)), index === 0 ? bytes.portable : bytes.setup);
  }
  const metadataBytes = await fs.readFile(path.join(directory, 'release.json'));
  assert.equal(await fs.readFile(path.join(directory, 'SHA256SUMS.txt'), 'utf8'), `${release.assets.map((asset) => `${asset.sha256}  ${asset.filename}\n`).join('')}${digest(metadataBytes)}  release.json\n`);
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(directory, 'release.json'), 'utf8')), release);
  const notes = await fs.readFile(path.join(directory, 'release-notes.md'), 'utf8');
  for (const information of [originalSha, 'WebView2', 'plaintext', 'not bundled', 'not yet verified', 'Unsigned']) assert.ok(notes.includes(information));
  assert.equal((await fs.readdir(directory)).length, 5);
  await assert.rejects(packageRelease(root), /already exists/);
});

test('missing current NSIS setup fails even if the cache contains older setup executables', async (t) => {
  const root = await fixture(t);
  await prepareRelease(root, createReleasePlan(input, versions), { ci: true });
  await buildFixture(root, { installer: false });
  await assert.rejects(packageRelease(root), /exactly one NSIS/);
  await assert.rejects(fs.stat(path.join(root, 'artifacts/release')), { code: 'ENOENT' });
  await fs.writeFile(path.join(root, 'target/release/bundle/nsis/frpc-ui_0.1.0_x64-setup.exe'), 'older stable');
  await fs.writeFile(path.join(root, 'target/release/bundle/nsis/frpc-ui_0.1.0-dev.41_x64-setup.exe'), 'previous run');
  await assert.rejects(packageRelease(root), /exactly one NSIS/);
  await assert.rejects(fs.stat(path.join(root, 'artifacts/release')), { code: 'ENOENT' });
});

test('package selects only the installer matching the complete current version from cached bundles', async (t) => {
  const root = await fixture(t);
  const plan = createReleasePlan(input, versions);
  await prepareRelease(root, plan, { ci: true });
  const bytes = await buildFixture(root);
  await fs.writeFile(path.join(root, 'target/release/bundle/nsis/frpc-ui_0.1.0_x64-setup.exe'), 'older stable');
  await fs.writeFile(path.join(root, 'target/release/bundle/nsis/frpc-ui_0.1.0-dev.41_x64-setup.exe'), 'previous run');
  const release = await packageRelease(root);
  assert.equal(release.assets[1].sha256, digest(bytes.setup));
  assert.deepEqual(await fs.readFile(path.join(root, 'artifacts/release', release.assets[1].filename)), bytes.setup);
});

test('a forged stored release plan cannot change publication or destination', async (t) => {
  const root = await fixture(t);
  const plan = createReleasePlan({ ...input, eventName: 'pull_request', ref: 'refs/pull/12/merge' }, versions);
  await prepareRelease(root, plan, { ci: true });
  await buildFixture(root);
  await fs.writeFile(path.join(root, 'artifacts/release-plan.json'), JSON.stringify({ ...plan, publish: true, version: '../../escaped' }));
  await assert.rejects(packageRelease(root), /plan does not match/);
  await assert.rejects(fs.stat(path.join(root, 'artifacts/release')), { code: 'ENOENT' });
});

test('artifact directory junctions or symlinks cannot redirect prepare writes', async (t) => {
  const root = await fixture(t);
  await fs.mkdir(path.join(root, 'outside'));
  await fs.symlink(path.join(root, 'outside'), path.join(root, 'artifacts'), 'junction');
  await assert.rejects(prepareRelease(root, createReleasePlan(input, versions), { ci: true }), /symbolic links or junctions/);
  assert.deepEqual(await fs.readdir(path.join(root, 'outside')), []);
});
