pub mod advanced;
pub mod config;
pub mod model;
mod persistence;
mod process;

use anyhow::{ensure, Context, Result};
pub use model::*;
use persistence::StoredState;
use std::{
    collections::HashMap,
    path::{Path, PathBuf},
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex, MutexGuard,
    },
    time::Instant,
};
use tokio::sync::{oneshot, watch};

pub(crate) fn lock<T>(mutex: &Mutex<T>) -> MutexGuard<'_, T> {
    mutex.lock().unwrap_or_else(|poison| poison.into_inner())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn active_profiles_keep_their_associated_binary_version() {
        let directory = tempfile::tempdir().unwrap();
        let manager = Manager::new(directory.path()).unwrap();
        let (profile, _) = config::parse_toml("serverAddr='127.0.0.1'", "0.71.0", "test").unwrap();
        manager.save_profile(profile.clone()).unwrap();
        let persisted_before = std::fs::read(directory.path().join("state.json")).unwrap();
        for process in [
            ProcessStatus::Starting,
            ProcessStatus::Running,
            ProcessStatus::Stopping,
        ] {
            lock(&manager.inner.state).stored.profiles[0].process = process.clone();
            let mut changed = profile.clone();
            changed.version = "0.70.0".into();
            changed.name = "changed".into();
            let error = manager.save_profile(changed).unwrap_err();
            assert!(error.to_string().contains("请先停止连接"));
            let saved = &manager.snapshot().profiles[0];
            assert_eq!(saved.version, "0.71.0");
            assert_eq!(saved.name, "test");
            assert_eq!(saved.process, process);
            assert_eq!(
                std::fs::read(directory.path().join("state.json")).unwrap(),
                persisted_before
            );
        }
        lock(&manager.inner.state).stored.profiles[0].process = ProcessStatus::Stopped;
        let mut changed = profile;
        changed.version = "0.70.0".into();
        manager.save_profile(changed).unwrap();
        assert_eq!(manager.snapshot().profiles[0].version, "0.70.0");
        assert_eq!(
            Manager::new(directory.path()).unwrap().snapshot().profiles[0].version,
            "0.70.0"
        );
    }
}

struct State {
    stored: StoredState,
    logs: Vec<LogEntry>,
    revisions: HashMap<String, u64>,
    started: HashMap<String, Instant>,
}
pub(crate) struct Runtime {
    stop: Option<oneshot::Sender<()>>,
    login: watch::Receiver<Option<bool>>,
    task: tokio::task::JoinHandle<()>,
    generation: String,
    pid: u32,
}
pub(crate) struct Inner {
    state: Mutex<State>,
    path: PathBuf,
    runtime_dir: PathBuf,
    runtimes: Mutex<HashMap<String, Runtime>>,
    operations: Mutex<HashMap<String, Arc<tokio::sync::Mutex<()>>>>,
    shutting_down: AtomicBool,
}
impl Drop for Inner {
    fn drop(&mut self) {
        for (_, mut runtime) in lock(&self.runtimes).drain() {
            if let Some(stop) = runtime.stop.take() {
                let _ = stop.send(());
            }
            // Dropping a kill_on_drop child in the aborted task also kills it if no executor time remains.
            runtime.task.abort();
        }
    }
}

#[derive(Clone)]
pub struct Manager {
    pub(crate) inner: Arc<Inner>,
}
impl Manager {
    pub fn new(data_dir: impl AsRef<Path>) -> Result<Self> {
        std::fs::create_dir_all(data_dir.as_ref())?;
        let data_dir = data_dir.as_ref().canonicalize()?;
        let path = data_dir.join("state.json");
        let stored = persistence::load(&path)?;
        let revisions = stored.profiles.iter().map(|p| (p.id.clone(), 1)).collect();
        let runtime_dir = data_dir.join("runtime");
        std::fs::create_dir_all(&runtime_dir)?;
        // Only our stale generated files are removed; IDs never form filesystem paths.
        for item in std::fs::read_dir(&runtime_dir)? {
            let item = item?;
            if item.file_type()?.is_file()
                && item.file_name().to_string_lossy().starts_with("frpc-ui-")
            {
                std::fs::remove_file(item.path())?;
            }
        }
        Ok(Self {
            inner: Arc::new(Inner {
                state: Mutex::new(State {
                    stored,
                    logs: Vec::new(),
                    revisions,
                    started: HashMap::new(),
                }),
                path,
                runtime_dir,
                runtimes: Mutex::new(HashMap::new()),
                operations: Mutex::new(HashMap::new()),
                shutting_down: AtomicBool::new(false),
            }),
        })
    }
    pub fn snapshot(&self) -> Snapshot {
        let state = lock(&self.inner.state);
        let mut profiles = state.stored.profiles.clone();
        for p in &mut profiles {
            if let Some(start) = state.started.get(&p.id) {
                let secs = start.elapsed().as_secs();
                p.uptime = format!("{:02}:{:02}:{:02}", secs / 3600, secs / 60 % 60, secs % 60);
            }
        }
        Snapshot {
            profiles,
            tunnels: state.stored.tunnels.clone(),
            logs: state.logs.clone(),
            settings: state.stored.settings.clone(),
        }
    }
    fn update(
        &self,
        operation: impl FnOnce(&mut StoredState) -> Result<Vec<String>>,
    ) -> Result<()> {
        let mut state = lock(&self.inner.state);
        let mut next = state.stored.clone();
        let changed = operation(&mut next)?;
        ensure!(
            next.profiles.len() <= 100 && next.tunnels.len() <= 10_000,
            "Configuration limit exceeded"
        );
        config::validate_configuration(&next.profiles, &next.tunnels)?;
        persistence::validate_settings(&next.settings)?;
        // Commit in memory only when the atomic write succeeds.
        persistence::write(&self.inner.path, &next)?;
        state.stored = next;
        for id in changed {
            *state.revisions.entry(id.clone()).or_default() += 1;
            if let Some(p) = state.stored.profiles.iter_mut().find(|p| p.id == id) {
                p.pending = true;
            }
        }
        Ok(())
    }
    pub fn save_profile(&self, mut profile: Profile) -> Result<()> {
        self.update(|state| {
            let id = profile.id.clone();
            if let Some(existing) = state.profiles.iter_mut().find(|p| p.id == id) {
                ensure!(
                    profile.version == existing.version
                        || !matches!(
                            existing.process,
                            ProcessStatus::Starting
                                | ProcessStatus::Running
                                | ProcessStatus::Stopping
                        ),
                    "请先停止连接，再切换 frpc 版本"
                );
                profile.process = existing.process.clone();
                profile.connection = existing.connection.clone();
                profile.last_error = existing.last_error.clone();
                profile.uptime = existing.uptime.clone();
                profile.pending = true;
                *existing = profile;
            } else {
                profile.reset_runtime();
                state.profiles.push(profile);
            }
            for t in state.tunnels.iter_mut().filter(|t| t.profile_id == id) {
                t.apply = ApplyStatus::Pending;
            }
            Ok(vec![id])
        })
    }
    pub fn delete_profiles(&self, ids: Vec<String>) -> Result<()> {
        self.update(|state| {
            ensure!(
                !state.profiles.iter().any(|p| ids.contains(&p.id)
                    && matches!(
                        p.process,
                        ProcessStatus::Starting | ProcessStatus::Running | ProcessStatus::Stopping
                    )),
                "Stop the connection before deleting it"
            );
            ensure!(
                !ids.iter()
                    .any(|id| lock(&self.inner.runtimes).contains_key(id)),
                "Stop the connection before deleting it"
            );
            state.profiles.retain(|p| !ids.contains(&p.id));
            state.tunnels.retain(|t| !ids.contains(&t.profile_id));
            Ok(Vec::new())
        })
    }
    pub fn save_tunnel(&self, mut tunnel: Tunnel) -> Result<()> {
        normalize_domain_alias(&mut tunnel);
        self.update(|state| {
            let mut changed = vec![tunnel.profile_id.clone()];
            tunnel.apply = ApplyStatus::Pending;
            if let Some(existing) = state.tunnels.iter_mut().find(|t| t.id == tunnel.id) {
                if existing.profile_id != tunnel.profile_id {
                    changed.push(existing.profile_id.clone());
                }
                *existing = tunnel;
            } else {
                state.tunnels.push(tunnel);
            }
            Ok(changed)
        })
    }
    pub fn delete_tunnels(&self, ids: Vec<String>) -> Result<()> {
        self.update(|state| {
            let changed = state
                .tunnels
                .iter()
                .filter(|t| ids.contains(&t.id))
                .map(|t| t.profile_id.clone())
                .collect();
            state.tunnels.retain(|t| !ids.contains(&t.id));
            Ok(changed)
        })
    }
    pub fn toggle_tunnels(&self, ids: Vec<String>, enabled: bool) -> Result<()> {
        self.update(|state| {
            let mut changed = Vec::new();
            for t in state.tunnels.iter_mut().filter(|t| ids.contains(&t.id)) {
                t.enabled = enabled;
                t.apply = ApplyStatus::Pending;
                changed.push(t.profile_id.clone());
            }
            Ok(changed)
        })
    }
    pub fn import_configuration(
        &self,
        mut profile: Profile,
        mut tunnels: Vec<Tunnel>,
    ) -> Result<()> {
        self.update(|state| {
            profile.id = format!("profile-{}", uuid::Uuid::new_v4());
            profile.reset_runtime();
            profile.auto_connect = false;
            let base = profile.name.clone();
            let mut suffix = 2;
            while state.profiles.iter().any(|p| p.name == profile.name) {
                profile.name = format!("{base} ({suffix})");
                suffix += 1;
            }
            if profile.web_port != 0
                && state
                    .profiles
                    .iter()
                    .any(|p| p.web_port == profile.web_port)
            {
                profile.web_port = (7400..=65535)
                    .find(|port| !state.profiles.iter().any(|p| p.web_port == *port))
                    .context("No management port available")?;
            }
            let id = profile.id.clone();
            for t in &mut tunnels {
                normalize_domain_alias(t);
                t.id = format!("tunnel-{}", uuid::Uuid::new_v4());
                t.profile_id = id.clone();
                t.apply = ApplyStatus::Pending;
            }
            state.profiles.push(profile);
            state.tunnels.extend(tunnels);
            Ok(vec![id])
        })
    }
    pub fn set_settings(&self, settings: AppSettings) -> Result<()> {
        self.update(|state| {
            state.settings = settings;
            Ok(Vec::new())
        })
    }
    pub fn clear_logs(&self) {
        lock(&self.inner.state).logs.clear();
    }
    /// IDs of this manager's currently supervised children, for local diagnostics.
    pub fn process_ids(&self) -> Vec<(String, u32)> {
        lock(&self.inner.runtimes)
            .iter()
            .filter(|(_, runtime)| !runtime.task.is_finished())
            .map(|(id, runtime)| (id.clone(), runtime.pid))
            .collect()
    }
    pub async fn run(
        &self,
        profile_id: &str,
        action: RunAction,
        binary_path: Option<PathBuf>,
    ) -> BatchResult {
        let operation = lock(&self.inner.operations)
            .entry(profile_id.to_owned())
            .or_insert_with(|| Arc::new(tokio::sync::Mutex::new(())))
            .clone();
        let _guard = operation.lock().await;
        let result = if !matches!(action, RunAction::Stop)
            && self.inner.shutting_down.load(Ordering::Acquire)
        {
            Err(anyhow::anyhow!("Application is shutting down"))
        } else {
            process::run(self, profile_id, &action, binary_path).await
        };
        BatchResult {
            profile_id: profile_id.into(),
            action,
            success: result.is_ok(),
            message: result.unwrap_or_else(|error| format!("{error:#}")),
        }
    }
    pub async fn shutdown(&self) {
        self.inner.shutting_down.store(true, Ordering::Release);
        for runtime in lock(&self.inner.runtimes).values_mut() {
            if let Some(stop) = runtime.stop.take() {
                let _ = stop.send(());
            }
        }
        // Include operations still in verification so they cannot spawn after this drain.
        let ids: Vec<_> = lock(&self.inner.operations).keys().cloned().collect();
        let mut tasks = tokio::task::JoinSet::new();
        for id in ids {
            let manager = self.clone();
            tasks.spawn(async move { manager.run(&id, RunAction::Stop, None).await });
        }
        while tasks.join_next().await.is_some() {}
    }
}
fn normalize_domain_alias(tunnel: &mut Tunnel) {
    if let Some(domains) = tunnel
        .advanced
        .get("customDomains")
        .and_then(serde_json::Value::as_array)
    {
        tunnel.domain = domains
            .first()
            .and_then(serde_json::Value::as_str)
            .unwrap_or("")
            .to_owned();
    }
}
