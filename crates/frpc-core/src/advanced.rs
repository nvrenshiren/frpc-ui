//! Strict v0.71.0 extensions. Application-owned fields cannot be overridden.

use serde_json::Map;

mod secrets;
mod validation;

pub type Object = Map<String, serde_json::Value>;

pub(crate) use secrets::file_source_tokens;
pub use secrets::{sensitive_values, without_credentials};
/// Validates profile advanced fields and keeps the legacy anyhow signature.
pub fn validate_profile_advanced(profile: &crate::Profile) -> anyhow::Result<()> {
    validation::validate_profile_advanced(profile)
}

/// Typed-error entry point for new callers.
pub fn try_validate_profile_advanced(profile: &crate::Profile) -> crate::CoreResult<()> {
    validation::validate_profile_advanced(profile).map_err(Into::into)
}

/// Validates tunnel advanced fields and keeps the legacy anyhow signature.
pub fn validate_tunnel_advanced(tunnel: &crate::Tunnel) -> anyhow::Result<()> {
    validation::validate_tunnel_advanced(tunnel)
}

/// Typed-error entry point for new callers.
pub fn try_validate_tunnel_advanced(tunnel: &crate::Tunnel) -> crate::CoreResult<()> {
    validation::validate_tunnel_advanced(tunnel).map_err(Into::into)
}

pub(crate) use validation::{merge, object, string};
