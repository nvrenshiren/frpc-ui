use std::{path::PathBuf, sync::Arc};

use frpc_core::{AppSettings, Profile, RunAction, Tunnel};
use frpc_versions::migration::MigrationPreview;
use tauri::{AppHandle, State};
use tauri_plugin_autostart::ManagerExt;

use crate::service::{BatchExecution, DesktopSnapshot, Service};

type Backend<'a> = State<'a, Arc<Service>>;
type Response = Result<DesktopSnapshot, String>;

#[tauri::command]
pub fn get_snapshot(state: Backend<'_>) -> DesktopSnapshot {
    let snapshot = state.snapshot();
    state
        .ipc_ready
        .store(true, std::sync::atomic::Ordering::SeqCst);
    snapshot
}

#[tauri::command]
pub async fn save_profile(state: Backend<'_>, profile: Profile) -> Response {
    let _guard = state.mutation.lock().await;
    state
        .core
        .save_profile(profile)
        .map_err(|error| error.to_string())?;
    Ok(state.snapshot())
}

#[tauri::command]
pub async fn delete_profile(state: Backend<'_>, id: String) -> Response {
    let _guard = state.mutation.lock().await;
    state
        .core
        .delete_profiles(vec![id])
        .map_err(|error| error.to_string())?;
    Ok(state.snapshot())
}

#[tauri::command]
pub async fn save_tunnel(state: Backend<'_>, tunnel: Tunnel) -> Response {
    let _guard = state.mutation.lock().await;
    state
        .core
        .save_tunnel(tunnel)
        .map_err(|error| error.to_string())?;
    Ok(state.snapshot())
}

#[tauri::command]
pub async fn delete_tunnels(state: Backend<'_>, ids: Vec<String>) -> Response {
    let _guard = state.mutation.lock().await;
    state
        .core
        .delete_tunnels(ids)
        .map_err(|error| error.to_string())?;
    Ok(state.snapshot())
}

#[tauri::command]
pub async fn toggle_tunnels(state: Backend<'_>, ids: Vec<String>, enabled: bool) -> Response {
    let _guard = state.mutation.lock().await;
    state
        .core
        .toggle_tunnels(ids, enabled)
        .map_err(|error| error.to_string())?;
    Ok(state.snapshot())
}

#[tauri::command]
pub async fn import_configuration(
    state: Backend<'_>,
    profile: Profile,
    tunnels: Vec<Tunnel>,
) -> Response {
    let _guard = state.mutation.lock().await;
    state
        .core
        .import_configuration(profile, tunnels)
        .map_err(|error| error.to_string())?;
    Ok(state.snapshot())
}

#[tauri::command]
pub async fn run_profiles(
    state: Backend<'_>,
    ids: Vec<String>,
    action: RunAction,
) -> Result<BatchExecution, String> {
    Ok(state.run(ids, action).await)
}

#[tauri::command]
pub async fn set_settings(app: AppHandle, state: Backend<'_>, settings: AppSettings) -> Response {
    let _guard = state.settings.lock().await;
    let autostart = app.autolaunch();
    let registered = autostart.is_enabled().map_err(|error| error.to_string())?;
    let changed = registered != settings.auto_start;
    if changed {
        if settings.auto_start {
            autostart.enable()
        } else {
            autostart.disable()
        }
        .map_err(|error| format!("无法更新开机启动：{error}"))?;
    }
    if let Err(error) = state.core.set_settings(settings) {
        if changed {
            let rollback = if registered {
                autostart.enable()
            } else {
                autostart.disable()
            };
            if let Err(rollback_error) = rollback {
                return Err(format!(
                    "设置保存失败：{error}；开机启动恢复失败：{rollback_error}"
                ));
            }
        }
        return Err(error.to_string());
    }
    // This is a saved preference; close-to-tray and silent launch read it at the point of use.
    Ok(state.snapshot())
}

#[tauri::command]
pub async fn refresh_versions(state: Backend<'_>) -> Response {
    state
        .versions
        .refresh()
        .await
        .map_err(|error| error.to_string())?;
    Ok(state.snapshot())
}

#[tauri::command]
pub async fn install_version(state: Backend<'_>, id: String) -> Response {
    state
        .versions
        .install(&id)
        .await
        .map_err(|error| error.to_string())?;
    Ok(state.snapshot())
}

#[tauri::command]
pub async fn remove_version(state: Backend<'_>, id: String) -> Response {
    let _guard = state.mutation.lock().await;
    let assigned = state
        .core
        .snapshot()
        .profiles
        .into_iter()
        .map(|profile| profile.version)
        .collect::<Vec<_>>();
    state
        .versions
        .remove(&id, &assigned)
        .await
        .map_err(|error| error.to_string())?;
    Ok(state.snapshot())
}

#[tauri::command]
pub async fn import_version(state: Backend<'_>, path: String) -> Response {
    state
        .versions
        .import(path)
        .await
        .map_err(|error| error.to_string())?;
    Ok(state.snapshot())
}

fn legacy_directory(path: String) -> Result<PathBuf, String> {
    let directory = PathBuf::from(path);
    if !directory.is_absolute() {
        return Err("请选择旧数据目录的绝对路径".into());
    }
    let directory = directory
        .canonicalize()
        .map_err(|_| "无法打开选择的旧数据目录".to_string())?;
    if directory.join("server-v2.db").is_file() {
        return Ok(directory);
    }
    let database = directory
        .join("db")
        .canonicalize()
        .map_err(|_| "目录中未找到旧数据库，请选择 userData 或 db 目录".to_string())?;
    if !database.starts_with(&directory) {
        return Err("旧数据库目录超出所选路径".into());
    }
    Ok(database)
}

async fn legacy_preview(path: String, version: String) -> Result<MigrationPreview, String> {
    let directory = legacy_directory(path)?;
    tokio::task::spawn_blocking(move || {
        let mut preview = frpc_versions::migration::preview_legacy(directory, &version)
            .map_err(|error| error.to_string())?;
        if preview.can_import {
            let profiles: Vec<Profile> = preview
                .profiles
                .iter()
                .cloned()
                .map(serde_json::from_value)
                .collect::<Result<_, _>>()
                .map_err(|_| "旧服务器配置无法转换为受支持的格式".to_string())?;
            let tunnels: Vec<Tunnel> = preview
                .tunnels
                .iter()
                .cloned()
                .map(serde_json::from_value)
                .collect::<Result<_, _>>()
                .map_err(|_| "旧隧道配置无法转换为受支持的格式".to_string())?;
            if let Err(error) = frpc_core::config::validate_configuration(&profiles, &tunnels) {
                preview.issues.push(error.to_string());
                preview.can_import = false;
            }
        }
        Ok(preview)
    })
    .await
    .map_err(|_| "读取旧数据失败".to_string())?
}

#[tauri::command]
pub async fn preview_legacy(
    state: Backend<'_>,
    path: String,
    version: String,
) -> Result<MigrationPreview, String> {
    state
        .versions
        .binary_path(&version)
        .await
        .map_err(|error| error.to_string())?;
    legacy_preview(path, version).await
}

#[tauri::command]
pub async fn import_legacy(
    state: Backend<'_>,
    path: String,
    version: String,
    source_fingerprint: String,
) -> Response {
    let _guard = state.mutation.lock().await;
    state
        .versions
        .binary_path(&version)
        .await
        .map_err(|error| error.to_string())?;
    let preview = legacy_preview(path, version).await?;
    if preview.source_fingerprint != source_fingerprint {
        return Err("旧数据在预览后已改变，请重新预览".into());
    }
    if !preview.can_import || preview.profiles.len() != 1 {
        return Err("旧配置存在未支持的字段或无效数据，请先解决预览中的问题".into());
    }
    let profile: Profile = serde_json::from_value(preview.profiles.into_iter().next().unwrap())
        .map_err(|_| "旧连接转换失败".to_string())?;
    let tunnels: Vec<Tunnel> = preview
        .tunnels
        .into_iter()
        .map(serde_json::from_value)
        .collect::<Result<_, _>>()
        .map_err(|_| "旧隧道转换失败".to_string())?;
    state
        .core
        .import_configuration(profile, tunnels)
        .map_err(|error| error.to_string())?;
    Ok(state.snapshot())
}
