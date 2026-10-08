use std::{
    collections::HashSet,
    path::PathBuf,
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc,
    },
};

use frpc_core::{AppSettings, BatchResult, Manager, RunAction, Snapshot};
use frpc_versions::{Version, VersionManager};
use futures::future::join_all;
use serde::Serialize;
use tokio::sync::Mutex;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DesktopSnapshot {
    #[serde(flatten)]
    pub core: Snapshot,
    pub versions: Vec<Version>,
    pub data_dir: String,
}

#[derive(Serialize)]
pub struct BatchExecution {
    pub results: Vec<BatchResult>,
    pub snapshot: DesktopSnapshot,
}

pub struct Service {
    pub core: Arc<Manager>,
    pub versions: Arc<VersionManager>,
    pub mutation: Mutex<()>,
    pub settings: Mutex<()>,
    pub closing: AtomicBool,
    pub ipc_ready: AtomicBool,
    data_dir: PathBuf,
}

impl Service {
    pub fn new(data_dir: PathBuf) -> Result<Self, String> {
        Ok(Self {
            core: Arc::new(Manager::new(&data_dir).map_err(|error| error.to_string())?),
            versions: Arc::new(VersionManager::new(&data_dir).map_err(|error| error.to_string())?),
            mutation: Mutex::new(()),
            settings: Mutex::new(()),
            closing: AtomicBool::new(false),
            ipc_ready: AtomicBool::new(false),
            data_dir,
        })
    }

    pub fn snapshot(&self) -> DesktopSnapshot {
        DesktopSnapshot {
            core: self.core.snapshot(),
            versions: self.versions.list(),
            data_dir: self.data_dir.to_string_lossy().into_owned(),
        }
    }

    pub async fn run(&self, ids: Vec<String>, action: RunAction) -> BatchExecution {
        // Protect the profile/version association until each supervised start has completed.
        // Snapshot reads stay independent so progress and process logs remain available.
        let _guard = self.mutation.lock().await;
        let mut seen = HashSet::new();
        let ids: Vec<String> = ids
            .into_iter()
            .filter(|id| seen.insert(id.clone()))
            .collect();
        if self.closing.load(Ordering::SeqCst) {
            return BatchExecution {
                results: ids
                    .into_iter()
                    .map(|profile_id| BatchResult {
                        profile_id,
                        success: false,
                        message: "应用正在退出，不能启动新连接".to_string(),
                        action,
                    })
                    .collect(),
                snapshot: self.snapshot(),
            };
        }
        let results = join_all(ids.into_iter().map(|id| async move {
            if matches!(action, RunAction::Stop) {
                return self.core.run(&id, action, None).await;
            }
            let version = self
                .core
                .snapshot()
                .profiles
                .into_iter()
                .find(|p| p.id == id)
                .map(|p| p.version);
            let binary = match version {
                Some(version) => self
                    .versions
                    .binary_path(&version)
                    .await
                    .map_err(|error| error.to_string()),
                None => Err("连接不存在，请刷新后重试".to_string()),
            };
            match binary {
                Ok(path) => self.core.run(&id, action, Some(path)).await,
                Err(message) => BatchResult {
                    profile_id: id,
                    success: false,
                    message,
                    action,
                },
            }
        }))
        .await;
        BatchExecution {
            results,
            snapshot: self.snapshot(),
        }
    }

    pub fn settings(&self) -> AppSettings {
        self.core.snapshot().settings
    }
}
