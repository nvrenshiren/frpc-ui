//! Official frpc release installation, local import and executable integrity.
//! The crate owns all binary paths and does not depend on a desktop host.

mod archive;
pub mod migration;
mod remote;

pub use anyhow::Result;
use anyhow::{bail, Context};
use futures_util::StreamExt;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    collections::{BTreeMap, HashMap},
    fs,
    path::{Path, PathBuf},
    process::Stdio,
    sync::{Arc, Mutex},
    time::Duration,
};
use tokio::io::{AsyncReadExt, AsyncWriteExt};

const MAX_ARCHIVE_BYTES: u64 = 80 * 1024 * 1024;
const API_URL: &str = "https://api.github.com/repos/fatedier/frp/releases?per_page=60";
const BINARY_NAME: &str = if cfg!(windows) { "frpc.exe" } else { "frpc" };

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Version {
    pub id: String,
    pub version: String,
    pub installed: bool,
    pub size: String,
    pub progress: u8,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub sha256: Option<String>,
    pub source: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct InstalledManifest {
    schema_version: u32,
    version: String,
    sha256: String,
    size: u64,
    source: String,
}

#[derive(Default)]
struct State {
    installed: BTreeMap<String, InstalledManifest>,
    candidates: HashMap<String, remote::Candidate>,
    progress: HashMap<String, u8>,
}

struct Inner {
    root: PathBuf,
    client: Client,
    state: Mutex<State>,
    mutation: tokio::sync::Mutex<()>,
}

#[derive(Clone)]
pub struct VersionManager {
    inner: Arc<Inner>,
}

impl VersionManager {
    pub fn new(data_dir: impl AsRef<Path>) -> Result<Self> {
        let root = data_dir.as_ref().join("versions");
        fs::create_dir_all(&root).context("无法创建 frpc 版本目录")?;
        let root = fs::canonicalize(root)?;
        let mut state = State::default();
        for entry in fs::read_dir(&root)? {
            let entry = entry?;
            let name = entry.file_name().to_string_lossy().to_string();
            // Interrupted staging directories are not treated as installations.
            if name.starts_with('.') {
                continue;
            }
            valid_version(&name).context("版本目录名称不合法")?;
            if !entry.file_type()?.is_dir() {
                bail!("版本目录中包含非目录条目");
            }
            let directory = fs::canonicalize(entry.path())?;
            if directory.parent() != Some(root.as_path()) {
                bail!("版本目录超出安装路径");
            }
            let manifest: InstalledManifest =
                serde_json::from_slice(&fs::read(directory.join("manifest.json"))?)
                    .context("frpc 安装元数据损坏")?;
            validate_manifest(&manifest, &name)?;
            let binary = directory.join(BINARY_NAME);
            regular_binary(&binary)?;
            state.installed.insert(name, manifest);
        }
        let client = Client::builder()
            .user_agent(concat!("frpc-ui/", env!("CARGO_PKG_VERSION")))
            .connect_timeout(Duration::from_secs(15))
            .timeout(Duration::from_secs(120))
            .redirect(reqwest::redirect::Policy::custom(|attempt| {
                let url = attempt.url();
                let allowed = matches!(
                    url.host_str(),
                    Some(
                        "github.com"
                            | "release-assets.githubusercontent.com"
                            | "objects.githubusercontent.com"
                            | "api.github.com"
                    )
                );
                if attempt.previous().len() >= 5 || url.scheme() != "https" || !allowed {
                    attempt.error("非官方下载跳转或跳转次数过多")
                } else {
                    attempt.follow()
                }
            }))
            .build()?;
        Ok(Self {
            inner: Arc::new(Inner {
                root,
                client,
                state: Mutex::new(state),
                mutation: tokio::sync::Mutex::new(()),
            }),
        })
    }

    fn state(&self) -> std::sync::MutexGuard<'_, State> {
        self.inner
            .state
            .lock()
            .unwrap_or_else(std::sync::PoisonError::into_inner)
    }

    /// Local installations and the last explicitly refreshed release catalog.
    /// This method never makes network requests or trusts existence as integrity.
    pub fn list(&self) -> Vec<Version> {
        let state = self.state();
        let mut result: BTreeMap<String, Version> = state
            .candidates
            .values()
            .map(|candidate| {
                let version = Version {
                    id: candidate.version.clone(),
                    version: candidate.version.clone(),
                    installed: false,
                    size: size_label(candidate.asset.size),
                    progress: *state.progress.get(&candidate.version).unwrap_or(&0),
                    sha256: candidate
                        .asset
                        .digest
                        .as_deref()
                        .and_then(remote::parse_digest),
                    source: "official".into(),
                };
                (candidate.version.clone(), version)
            })
            .collect();
        for (id, manifest) in &state.installed {
            result.insert(id.clone(), version_dto(manifest));
        }
        let mut result: Vec<_> = result.into_values().collect();
        result.sort_by(|left, right| {
            semver::Version::parse(&right.version)
                .unwrap()
                .cmp(&semver::Version::parse(&left.version).unwrap())
        });
        result
    }

    pub async fn refresh(&self) -> Result<Vec<Version>> {
        let (os, arch) = remote::platform()?;
        let response = self
            .inner
            .client
            .get(API_URL)
            .header("Accept", "application/vnd.github+json")
            .send()
            .await
            .context("无法访问 GitHub 官方版本 API")?;
        if response.status() == reqwest::StatusCode::FORBIDDEN
            || response.status() == reqwest::StatusCode::TOO_MANY_REQUESTS
        {
            bail!("GitHub 版本 API 已限流，请稍后重试");
        }
        let bytes = bounded_response(response.error_for_status()?, 8 * 1024 * 1024).await?;
        let releases: Vec<remote::Release> =
            serde_json::from_slice(&bytes).context("官方版本响应格式错误")?;
        let mut candidates = HashMap::new();
        for release in releases {
            if let Some(candidate) = remote::select_release(release, os, arch)? {
                candidates.insert(candidate.version.clone(), candidate);
            }
        }
        self.state().candidates = candidates;
        Ok(self.list())
    }

    pub async fn install(&self, id: &str) -> Result<Version> {
        valid_version(id)?;
        let _mutation = self.inner.mutation.lock().await;
        let candidate = {
            let state = self.state();
            if state.installed.contains_key(id) {
                bail!("此版本已经安装");
            }
            state
                .candidates
                .get(id)
                .cloned()
                .context("请先刷新官方版本列表，再选择安装")?
        };
        self.state().progress.insert(id.into(), 1);
        let operation = self.install_candidate(candidate).await;
        self.state().progress.remove(id);
        operation
    }

    async fn install_candidate(&self, candidate: remote::Candidate) -> Result<Version> {
        let checksum = remote::expected_checksum(&self.inner.client, &candidate).await?;
        let stage = tempfile::Builder::new()
            .prefix(".install-")
            .tempdir_in(&self.inner.root)?;
        let archive_path = stage.path().join("archive");
        let response = self
            .inner
            .client
            .get(remote::official_url(&candidate.asset.browser_download_url)?)
            .send()
            .await?
            .error_for_status()?;
        if response
            .content_length()
            .is_some_and(|size| size > MAX_ARCHIVE_BYTES || size != candidate.asset.size)
        {
            bail!("官方下载大小与元数据不一致");
        }
        let mut file = tokio::fs::File::create(&archive_path).await?;
        let mut stream = response.bytes_stream();
        let mut downloaded = 0_u64;
        let mut hasher = Sha256::new();
        while let Some(chunk) = stream.next().await {
            let chunk = chunk?;
            downloaded += chunk.len() as u64;
            if downloaded > MAX_ARCHIVE_BYTES || downloaded > candidate.asset.size {
                bail!("下载大小超过限制");
            }
            file.write_all(&chunk).await?;
            hasher.update(&chunk);
            self.state().progress.insert(
                candidate.version.clone(),
                ((downloaded * 95 / candidate.asset.size) as u8).clamp(1, 95),
            );
        }
        file.sync_all().await?;
        drop(file);
        if downloaded != candidate.asset.size {
            bail!("下载未完成，安装已取消");
        }
        verify_hash(&format!("{:x}", hasher.finalize()), &checksum)?;
        self.state().progress.insert(candidate.version.clone(), 96);
        let (os, arch) = remote::platform()?;
        let expected = format!("frp_{}_{os}_{arch}/{BINARY_NAME}", candidate.version);
        let binary_path = stage.path().join(BINARY_NAME);
        let extraction_binary = binary_path.clone();
        let zip_format = os == "windows";
        tokio::task::spawn_blocking(move || {
            archive::extract_frpc(&archive_path, zip_format, &expected, &extraction_binary)
        })
        .await??;
        let detected = detect_version(&binary_path).await?;
        if detected != candidate.version {
            bail!("解压得到的 frpc 版本与官方发布不一致");
        }
        let hash = file_hash(&binary_path).await?;
        let size = regular_binary(&binary_path)?.len();
        // The archive is deliberately excluded from the atomic installation.
        fs::remove_file(stage.path().join("archive"))?;
        self.commit(
            stage,
            InstalledManifest {
                schema_version: 1,
                version: candidate.version,
                sha256: hash,
                size,
                source: "official".into(),
            },
        )
    }

    /// The caller obtains this path from a native file picker. The selected
    /// executable is copied before validation; its original file is never changed.
    pub async fn import(&self, path: impl AsRef<Path>) -> Result<Version> {
        let _mutation = self.inner.mutation.lock().await;
        let path = path.as_ref();
        regular_binary(path)?;
        let stage = tempfile::Builder::new()
            .prefix(".import-")
            .tempdir_in(&self.inner.root)?;
        let binary = stage.path().join(BINARY_NAME);
        tokio::fs::copy(path, &binary).await?;
        regular_binary(&binary)?;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(&binary, fs::Permissions::from_mode(0o755))?;
        }
        let version = detect_version(&binary).await?;
        if self.state().installed.contains_key(&version) {
            bail!("此版本已经安装，请先移除现有版本");
        }
        let hash = file_hash(&binary).await?;
        let size = regular_binary(&binary)?.len();
        self.commit(
            stage,
            InstalledManifest {
                schema_version: 1,
                version,
                sha256: hash,
                size,
                source: "local".into(),
            },
        )
    }

    fn commit(&self, stage: tempfile::TempDir, manifest: InstalledManifest) -> Result<Version> {
        valid_version(&manifest.version)?;
        let destination = self.inner.root.join(&manifest.version);
        if destination.exists() {
            bail!("版本安装目录已存在，不会覆盖现有二进制");
        }
        let metadata_path = stage.path().join("manifest.json");
        let mut metadata = fs::File::options()
            .write(true)
            .create_new(true)
            .open(metadata_path)?;
        use std::io::Write;
        metadata.write_all(&serde_json::to_vec_pretty(&manifest)?)?;
        metadata.sync_all()?;
        drop(metadata);
        fs::rename(stage.path(), &destination).context("无法原子安装 frpc")?;
        // TempDir cleanup now sees a missing source path and never removes the
        // committed directory. State is published only after the rename succeeds.
        let result = version_dto(&manifest);
        self.state()
            .installed
            .insert(manifest.version.clone(), manifest);
        Ok(result)
    }

    pub async fn remove(&self, id: &str, assigned_versions: &[String]) -> Result<()> {
        self.remove_with_rename(id, assigned_versions, |source, destination| {
            fs::rename(source, destination)
        })
        .await
    }

    async fn remove_with_rename(
        &self,
        id: &str,
        assigned_versions: &[String],
        rename: impl FnOnce(&Path, &Path) -> std::io::Result<()>,
    ) -> Result<()> {
        valid_version(id)?;
        let _mutation = self.inner.mutation.lock().await;
        if assigned_versions
            .iter()
            .any(|version| version.trim_start_matches('v') == id)
        {
            bail!("此版本已被连接使用，请先更换连接的 frpc 版本");
        }
        if !self.state().installed.contains_key(id) {
            bail!("版本尚未安装");
        }
        let directory = self.inner.root.join(id);
        let metadata = fs::symlink_metadata(&directory)?;
        let canonical = fs::canonicalize(&directory)?;
        if !canonical.is_absolute()
            || canonical.parent() != Some(self.inner.root.as_path())
            || !metadata.is_dir()
            || metadata.file_type().is_symlink()
        {
            bail!("安装目录不安全，拒绝删除");
        }
        let reservation = tempfile::Builder::new()
            .prefix(".removing-")
            .rand_bytes(16)
            .tempdir_in(&self.inner.root)
            .context("无法创建版本移除暂存目录")?;
        let tombstone = reservation.path().to_owned();
        // Windows cannot rename a directory over an existing directory. Release
        // only our empty reservation; the random sibling remains the target.
        reservation.close().context("无法释放版本移除暂存目录")?;
        if !tombstone.is_absolute() || tombstone.parent() != Some(self.inner.root.as_path()) {
            bail!("版本移除暂存路径不安全");
        }
        match fs::symlink_metadata(&tombstone) {
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
            Err(error) => return Err(error).context("无法校验版本移除暂存路径"),
            Ok(_) => bail!("版本移除暂存路径已存在"),
        }
        // This rename is the removal commit point. Until it succeeds neither
        // files nor installed state change; afterward interrupted cleanup can
        // only leave a hidden directory which startup already ignores.
        rename(&directory, &tombstone).context("无法原子移除 frpc 安装目录")?;
        {
            let mut state = self.state();
            state.installed.remove(id);
            state.progress.remove(id);
        }
        // Keep catalog candidates available for reinstallation. Cleanup failure
        // does not resurrect an installation or turn a committed removal into
        // an error that invites a destructive retry.
        let _ = tokio::fs::remove_dir_all(tombstone).await;
        Ok(())
    }

    /// Checks SHA-256 again for every launch; callers may never cache this path
    /// instead of calling this method when starting or verifying frpc.
    pub async fn binary_path(&self, version: &str) -> Result<PathBuf> {
        let version = version.strip_prefix('v').unwrap_or(version);
        valid_version(version)?;
        let manifest = self
            .state()
            .installed
            .get(version)
            .cloned()
            .context("所选 frpc 版本尚未安装")?;
        let binary = self.inner.root.join(version).join(BINARY_NAME);
        regular_binary(&binary)?;
        let canonical = fs::canonicalize(&binary)?;
        let expected_directory = self.inner.root.join(version);
        if canonical.parent() != Some(expected_directory.as_path()) {
            bail!("frpc 文件超出安装目录");
        }
        let hash = file_hash(&binary).await?;
        verify_hash(&hash, &manifest.sha256)
            .context("frpc 二进制校验失败，文件可能已被修改；请重新安装")?;
        Ok(canonical)
    }
}

fn version_dto(manifest: &InstalledManifest) -> Version {
    Version {
        id: manifest.version.clone(),
        version: manifest.version.clone(),
        installed: true,
        size: size_label(manifest.size),
        progress: 100,
        sha256: Some(manifest.sha256.clone()),
        source: manifest.source.clone(),
    }
}

fn size_label(size: u64) -> String {
    format!("{:.1} MB", size as f64 / 1_048_576.0)
}

pub(crate) fn valid_version(value: &str) -> Result<semver::Version> {
    if value.len() > 32
        || !value
            .bytes()
            .all(|byte| byte.is_ascii_digit() || byte == b'.')
    {
        bail!("frpc 版本号不合法");
    }
    let version = semver::Version::parse(value).context("frpc 版本号必须采用 major.minor.patch")?;
    if version < semver::Version::new(0, 52, 0) {
        bail!("当前仅支持 frpc 0.52.0 及以上的 TOML 版本");
    }
    Ok(version)
}

fn validate_manifest(manifest: &InstalledManifest, expected: &str) -> Result<()> {
    valid_version(&manifest.version)?;
    if manifest.schema_version != 1
        || manifest.version != expected
        || remote::parse_digest(&format!("sha256:{}", manifest.sha256)).is_none()
        || !matches!(manifest.source.as_str(), "official" | "local")
        || manifest.size == 0
        || manifest.size > archive::MAX_BINARY_BYTES
    {
        bail!("frpc 安装元数据不合法");
    }
    Ok(())
}

fn regular_binary(path: &Path) -> Result<fs::Metadata> {
    let metadata = fs::symlink_metadata(path).context("无法读取 frpc 文件")?;
    if !metadata.is_file()
        || metadata.file_type().is_symlink()
        || metadata.len() == 0
        || metadata.len() > archive::MAX_BINARY_BYTES
    {
        bail!("frpc 必须是大小合理的普通文件");
    }
    Ok(metadata)
}

async fn detect_version(path: &Path) -> Result<String> {
    regular_binary(path)?;
    let mut command = tokio::process::Command::new(path);
    command
        .arg("-v")
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .kill_on_drop(true);
    #[cfg(windows)]
    {
        command.creation_flags(0x08000000);
    }
    let mut child = command
        .spawn()
        .context("无法运行 frpc，请确认平台和架构匹配")?;
    let mut stdout = child.stdout.take().context("无法读取 frpc 版本输出")?;
    let mut bytes = Vec::new();
    let operation = async {
        (&mut stdout).take(4097).read_to_end(&mut bytes).await?;
        if bytes.len() > 4096 {
            bail!("frpc 版本输出异常");
        }
        let status = child.wait().await?;
        if !status.success() {
            bail!("frpc -v 执行失败");
        }
        Ok::<(), anyhow::Error>(())
    };
    match tokio::time::timeout(Duration::from_secs(8), operation).await {
        Ok(Ok(())) => (),
        Ok(Err(error)) => {
            let _ = child.kill().await;
            return Err(error);
        }
        Err(_) => {
            let _ = child.kill().await;
            bail!("frpc 版本检测超时");
        }
    }
    let version = std::str::from_utf8(&bytes)?.trim().to_owned();
    valid_version(&version)?;
    Ok(version)
}

async fn file_hash(path: &Path) -> Result<String> {
    let mut file = tokio::fs::File::open(path).await?;
    let mut hasher = Sha256::new();
    // Keep the buffer off the async state machine: it is carried through IPC futures.
    let mut buffer = vec![0_u8; 65536];
    let mut total = 0_u64;
    loop {
        let count = file.read(buffer.as_mut_slice()).await?;
        if count == 0 {
            break;
        }
        total += count as u64;
        if total > archive::MAX_BINARY_BYTES {
            bail!("frpc 文件超过大小限制");
        }
        hasher.update(&buffer[..count]);
    }
    Ok(format!("{:x}", hasher.finalize()))
}

pub(crate) fn verify_hash(actual: &str, expected: &str) -> Result<()> {
    if actual != expected {
        bail!("SHA-256 校验不匹配");
    }
    Ok(())
}

pub(crate) fn verify_bytes(bytes: &[u8], expected: &str) -> Result<()> {
    verify_hash(&format!("{:x}", Sha256::digest(bytes)), expected)
}

pub(crate) async fn bounded_response(response: reqwest::Response, max: u64) -> Result<Vec<u8>> {
    if response.content_length().is_some_and(|size| size > max) {
        bail!("响应大小超过限制");
    }
    let mut stream = response.bytes_stream();
    let mut bytes = Vec::new();
    while let Some(chunk) = stream.next().await {
        let chunk = chunk?;
        if bytes.len() as u64 + chunk.len() as u64 > max {
            bail!("响应大小超过限制");
        }
        bytes.extend_from_slice(&chunk);
    }
    Ok(bytes)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn file_hash_future_keeps_io_buffer_off_stack() {
        // Creating this future does not open the path; it measures the state passed into IPC.
        let future = file_hash(Path::new("unused-future-size-check"));
        let bytes = std::mem::size_of_val(&future);
        assert!(bytes < 16 * 1024, "file_hash future occupies {bytes} bytes");
    }

    #[test]
    fn refuses_old_versions_and_directory_injection() {
        for version in [
            "0.51.3",
            "../0.71.0",
            "0.71.0/other",
            "v0.71.0",
            "0.71.0-alpha",
            "01.71.0",
            "0.71",
        ] {
            assert!(valid_version(version).is_err(), "{version}");
        }
        assert!(valid_version("0.52.0").is_ok());
        assert!(valid_version("0.71.0").is_ok());
    }

    #[test]
    fn verifies_sha256_and_rejects_tampering() {
        let digest = format!("{:x}", Sha256::digest(b"original"));
        assert!(verify_bytes(b"original", &digest).is_ok());
        assert!(verify_bytes(b"changed", &digest).is_err());
        assert!(remote::parse_digest("sha256:wrong").is_none());
    }

    fn installed_test_manager() -> (tempfile::TempDir, VersionManager) {
        let temp = tempfile::tempdir().unwrap();
        let directory = temp.path().join("versions/0.71.0");
        fs::create_dir_all(&directory).unwrap();
        fs::write(directory.join(BINARY_NAME), b"test-binary").unwrap();
        let manifest = InstalledManifest {
            schema_version: 1,
            version: "0.71.0".into(),
            sha256: format!("{:x}", Sha256::digest(b"test-binary")),
            size: 11,
            source: "local".into(),
        };
        fs::write(
            directory.join("manifest.json"),
            serde_json::to_vec(&manifest).unwrap(),
        )
        .unwrap();
        let manager = VersionManager::new(temp.path()).unwrap();
        (temp, manager)
    }

    #[tokio::test]
    async fn launch_detects_modified_installed_binary() {
        let (_temp, manager) = installed_test_manager();
        let path = manager.binary_path("0.71.0").await.unwrap();
        fs::write(path, b"tampered").unwrap();
        assert!(manager.binary_path("0.71.0").await.is_err());
    }

    #[tokio::test]
    async fn used_version_cannot_be_deleted() {
        let (_temp, manager) = installed_test_manager();
        assert!(manager.remove("0.71.0", &["0.71.0".into()]).await.is_err());
        assert_eq!(manager.list().len(), 1);
        manager.remove("0.71.0", &[]).await.unwrap();
        assert!(manager.list().is_empty());
    }

    #[tokio::test]
    async fn removal_commits_before_cleanup_and_preserves_catalog_candidate() {
        let (temp, manager) = installed_test_manager();
        manager.state().candidates.insert(
            "0.71.0".into(),
            remote::Candidate {
                version: "0.71.0".into(),
                asset: remote::Asset {
                    name: "frp_0.71.0_windows_amd64.zip".into(),
                    size: 1024,
                    browser_download_url:
                        "https://github.com/fatedier/frp/releases/download/v0.71.0/frp_0.71.0_windows_amd64.zip".into(),
                    digest: None,
                },
                checksum_asset: None,
            },
        );
        manager.remove("0.71.0", &[]).await.unwrap();
        assert!(!temp.path().join("versions/0.71.0").exists());
        assert!(!manager.state().installed.contains_key("0.71.0"));
        let catalog = manager.list();
        assert_eq!(catalog.len(), 1);
        assert!(!catalog[0].installed);
        assert_eq!(catalog[0].source, "official");
        assert_eq!(catalog[0].progress, 0);
        assert!(VersionManager::new(temp.path()).unwrap().list().is_empty());
    }

    #[tokio::test]
    async fn failed_removal_rename_retains_complete_installation_and_state() {
        let (temp, manager) = installed_test_manager();
        let directory = temp.path().join("versions/0.71.0");
        let manifest = fs::read(directory.join("manifest.json")).unwrap();
        let error = manager
            .remove_with_rename("0.71.0", &[], |source, destination| {
                assert!(source.is_absolute());
                assert_eq!(source.parent(), destination.parent());
                assert!(destination
                    .file_name()
                    .unwrap()
                    .to_string_lossy()
                    .starts_with(".removing-"));
                assert!(!destination.exists());
                Err(std::io::Error::new(
                    std::io::ErrorKind::PermissionDenied,
                    "test rename denied",
                ))
            })
            .await
            .unwrap_err();
        assert!(error.to_string().contains("无法原子移除"));
        assert_eq!(fs::read(directory.join("manifest.json")).unwrap(), manifest);
        assert_eq!(
            fs::read(directory.join(BINARY_NAME)).unwrap(),
            b"test-binary"
        );
        assert!(manager.list()[0].installed);
        assert!(VersionManager::new(temp.path()).unwrap().list()[0].installed);
    }

    #[test]
    fn partial_hidden_removal_residue_does_not_block_restart() {
        let (temp, manager) = installed_test_manager();
        let residue = manager.inner.root.join(".removing-interrupted");
        fs::rename(manager.inner.root.join("0.71.0"), &residue).unwrap();
        fs::remove_file(residue.join("manifest.json")).unwrap();
        let restored = VersionManager::new(temp.path()).unwrap();
        assert!(restored.list().is_empty());
        assert!(residue.join(BINARY_NAME).exists());
    }

    #[test]
    fn new_installation_has_no_fake_versions_or_network_dependency() {
        let temp = tempfile::tempdir().unwrap();
        let manager = VersionManager::new(temp.path()).unwrap();
        assert!(manager.list().is_empty());
    }

    #[tokio::test]
    #[ignore = "downloads and executes an official frpc release; run explicitly for network verification"]
    async fn official_network_install_roundtrip() {
        let temp = tempfile::tempdir().unwrap();
        let manager = VersionManager::new(temp.path()).unwrap();
        let catalog = manager.refresh().await.unwrap();
        let latest = catalog
            .first()
            .expect("official release for current platform");
        let installed = manager.install(&latest.id).await.unwrap();
        assert!(installed.installed);
        assert_eq!(installed.source, "official");
        let path = manager.binary_path(&installed.version).await.unwrap();
        assert_eq!(detect_version(&path).await.unwrap(), installed.version);
        let restored = VersionManager::new(temp.path()).unwrap();
        assert_eq!(restored.list().len(), 1);
        assert_eq!(
            restored.binary_path(&installed.version).await.unwrap(),
            path
        );
        let imported_temp = tempfile::tempdir().unwrap();
        let imported_manager = VersionManager::new(imported_temp.path()).unwrap();
        let imported = imported_manager.import(&path).await.unwrap();
        assert_eq!(imported.source, "local");
        assert_eq!(imported.sha256, installed.sha256);
        imported_manager
            .binary_path(&imported.version)
            .await
            .unwrap();
        println!(
            "official frpc {} installed, version detected and pinned SHA-256 verified",
            installed.version
        );
        restored.remove(&installed.id, &[]).await.unwrap();
        assert!(restored.list().is_empty());
    }
}
