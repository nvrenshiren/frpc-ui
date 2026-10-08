use crate::{config::validate_configuration, model::*};
use anyhow::{ensure, Context, Result};
use serde::{Deserialize, Serialize};
use std::{fs, io::Write, path::Path};

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct StoredState {
    pub schema_version: u32,
    pub profiles: Vec<Profile>,
    pub tunnels: Vec<Tunnel>,
    pub settings: AppSettings,
}
impl Default for StoredState {
    fn default() -> Self {
        Self {
            schema_version: 1,
            profiles: Vec::new(),
            tunnels: Vec::new(),
            settings: AppSettings::default(),
        }
    }
}
pub(crate) fn load(path: &Path) -> Result<StoredState> {
    if !path.exists() {
        return Ok(StoredState::default());
    }
    ensure!(
        fs::metadata(path)?.len() <= 16 * 1024 * 1024,
        "State file exceeds 16 MB"
    );
    let mut state: StoredState = serde_json::from_slice(&fs::read(path)?)
        .context("Cannot load saved configuration; the original file was left untouched")?;
    ensure!(
        state.schema_version == 1,
        "Unsupported state schemaVersion {}",
        state.schema_version
    );
    validate_configuration(&state.profiles, &state.tunnels)?;
    validate_settings(&state.settings)?;
    for profile in &mut state.profiles {
        profile.reset_runtime();
    }
    for tunnel in &mut state.tunnels {
        tunnel.apply = ApplyStatus::Pending;
    }
    Ok(state)
}
pub(crate) fn write(path: &Path, state: &StoredState) -> Result<()> {
    let parent = path
        .parent()
        .context("State file needs a parent directory")?;
    fs::create_dir_all(parent)?;
    let mut stored = state.clone();
    // Saved process flags are never trusted on the next application start.
    for profile in &mut stored.profiles {
        profile.reset_runtime();
    }
    for tunnel in &mut stored.tunnels {
        tunnel.apply = ApplyStatus::Pending;
    }
    let mut temporary = tempfile::NamedTempFile::new_in(parent)?;
    serde_json::to_writer_pretty(&mut temporary, &stored)?;
    temporary.flush()?;
    temporary.as_file().sync_all()?;
    temporary
        .persist(path)
        .map_err(|error| error.error)
        .context("Cannot atomically save configuration")?;
    #[cfg(unix)]
    fs::File::open(parent)?.sync_all()?;
    Ok(())
}
pub(crate) fn validate_settings(settings: &AppSettings) -> Result<()> {
    ensure!(
        ["zh", "en"].contains(&settings.language.as_str()),
        "Unsupported language"
    );
    ensure!(
        ["light", "dark", "system"].contains(&settings.theme.as_str()),
        "Unsupported theme"
    );
    Ok(())
}
