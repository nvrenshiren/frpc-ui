//! Credential projection and explicitly configured token file reads.

use super::Object;
use crate::model::Profile;
use anyhow::{ensure, Context, Result};
use serde_json::Value;
use tokio::io::AsyncReadExt;
/// Remove credentials only from an exported copy. Runtime data is never modified.
pub fn without_credentials(map: &Object) -> Object {
    let mut value = Value::Object(map.clone());
    scrub(&mut value);
    // `scrub` only edits nested entries and never changes the root Value variant.
    value
        .as_object()
        .expect("scrub preserves the root JSON object")
        .clone()
}
fn scrub(value: &mut Value) {
    match value {
        Value::Object(map) => {
            let remove: Vec<_> = map
                .keys()
                .filter(|key| {
                    matches!(
                        key.as_str(),
                        "clientSecret"
                            | "user"
                            | "username"
                            | "httpUser"
                            | "password"
                            | "httpPassword"
                            | "groupKey"
                            | "tokenSource"
                            | "metadatas"
                            | "annotations"
                            | "requestHeaders"
                            | "responseHeaders"
                            | "httpHeaders"
                            | "additionalEndpointParams"
                    )
                })
                .cloned()
                .collect();
            for key in remove {
                map.remove(&key);
            }
            if let Some(Value::String(proxy)) = map.get("proxyURL") {
                if url::Url::parse(proxy)
                    .is_ok_and(|url| !url.username().is_empty() || url.password().is_some())
                {
                    map.remove("proxyURL");
                }
            }
            for value in map.values_mut() {
                scrub(value);
            }
        }
        Value::Array(values) => {
            for value in values {
                scrub(value);
            }
        }
        _ => (),
    }
}
/// All potentially sensitive values are also removed from collected process logs.
pub fn sensitive_values(map: &Object) -> Vec<String> {
    fn visit(value: &Value, sensitive: bool, out: &mut Vec<String>) {
        match value {
            Value::Object(map) => {
                for (key, value) in map {
                    let sensitive = sensitive
                        || matches!(
                            key.as_str(),
                            "clientSecret"
                                | "user"
                                | "username"
                                | "httpUser"
                                | "password"
                                | "httpPassword"
                                | "groupKey"
                                | "metadatas"
                                | "annotations"
                                | "requestHeaders"
                                | "responseHeaders"
                                | "httpHeaders"
                                | "additionalEndpointParams"
                        );
                    if key == "proxyURL" {
                        if let Some(text) = value.as_str() {
                            if let Ok(url) = url::Url::parse(text) {
                                if !url.username().is_empty() {
                                    out.push(url.username().into());
                                    out.push(
                                        percent_encoding::percent_decode_str(url.username())
                                            .decode_utf8_lossy()
                                            .into_owned(),
                                    );
                                }
                                if let Some(password) = url.password() {
                                    out.push(password.into());
                                    out.push(
                                        percent_encoding::percent_decode_str(password)
                                            .decode_utf8_lossy()
                                            .into_owned(),
                                    );
                                }
                                if !url.username().is_empty() || url.password().is_some() {
                                    out.push(text.into());
                                }
                            }
                        }
                    }
                    visit(value, sensitive, out);
                }
            }
            Value::Array(values) => {
                for value in values {
                    visit(value, sensitive, out);
                }
            }
            Value::String(text) if sensitive && !text.is_empty() => out.push(text.clone()),
            _ => (),
        }
    }
    let mut out = Vec::new();
    visit(&Value::Object(map.clone()), false, &mut out);
    out
}

/// Read only explicitly configured file token sources, bounded for process-log redaction.
pub(crate) async fn file_source_tokens(profile: &Profile) -> Result<Vec<String>> {
    let auth = profile.advanced.get("auth");
    let sources = [
        auth.and_then(|a| a.get("tokenSource")),
        auth.and_then(|a| a.get("oidc"))
            .and_then(|a| a.get("tokenSource")),
    ];
    let mut tokens = Vec::new();
    for source in sources.into_iter().flatten() {
        let path = source
            .get("file")
            .and_then(|file| file.get("path"))
            .and_then(Value::as_str)
            .context("Token file source requires path")?;
        let metadata = tokio::fs::metadata(path)
            .await
            .context("Cannot read the configured token file")?;
        ensure!(
            metadata.is_file() && metadata.len() <= 65536,
            "Token source must be a regular file of at most 64 KiB"
        );
        let mut contents = String::new();
        tokio::fs::File::open(path)
            .await?
            .take(65537)
            .read_to_string(&mut contents)
            .await
            .context("Token file must be UTF-8")?;
        ensure!(contents.len() <= 65536, "Token source exceeds 64 KiB");
        let token = contents.trim().to_owned();
        ensure!(!token.is_empty(), "Token file cannot be empty");
        tokens.push(token);
    }
    Ok(tokens)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn token_files_are_bounded_utf8_and_only_explicit_sources_are_read() {
        let directory = tempfile::tempdir().unwrap();
        let file = directory.path().join("token.txt");
        let (mut profile, _) =
            crate::config::parse_toml("serverAddr='127.0.0.1'", "0.71.0", "source").unwrap();
        assert!(file_source_tokens(&profile).await.unwrap().is_empty());
        profile.advanced =
            serde_json::json!({"auth":{"tokenSource":{"type":"file","file":{"path":file}}}})
                .as_object()
                .unwrap()
                .clone();
        assert!(file_source_tokens(&profile).await.is_err());
        std::fs::write(&file, " file-secret\r\n").unwrap();
        assert_eq!(file_source_tokens(&profile).await.unwrap(), ["file-secret"]);
        std::fs::write(&file, vec![b'x'; 65537]).unwrap();
        assert!(file_source_tokens(&profile).await.is_err());
        std::fs::write(&file, [0xff, 0xfe]).unwrap();
        assert!(file_source_tokens(&profile).await.is_err());
        std::fs::write(&file, " \r\n").unwrap();
        assert!(file_source_tokens(&profile).await.is_err());
    }
}
