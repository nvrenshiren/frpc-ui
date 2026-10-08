use crate::{valid_version, Result, MAX_ARCHIVE_BYTES};
use anyhow::{bail, Context};
use reqwest::{Client, Url};
use serde::Deserialize;

#[derive(Clone, Debug, Deserialize)]
pub(crate) struct Asset {
    pub name: String,
    pub size: u64,
    pub browser_download_url: String,
    #[serde(default)]
    pub digest: Option<String>,
}

#[derive(Debug, Deserialize)]
pub(crate) struct Release {
    pub tag_name: String,
    #[serde(default)]
    pub draft: bool,
    #[serde(default)]
    pub prerelease: bool,
    pub assets: Vec<Asset>,
}

#[derive(Clone, Debug)]
pub(crate) struct Candidate {
    pub version: String,
    pub asset: Asset,
    pub checksum_asset: Option<Asset>,
}

pub(crate) fn platform() -> Result<(&'static str, &'static str)> {
    let os = match std::env::consts::OS {
        "windows" => "windows",
        "macos" => "darwin",
        "linux" => "linux",
        _ => bail!("当前操作系统暂不支持自动安装 frpc"),
    };
    let arch = match std::env::consts::ARCH {
        "x86_64" => "amd64",
        "aarch64" => "arm64",
        _ => bail!("当前架构暂不支持自动安装 frpc"),
    };
    Ok((os, arch))
}

pub(crate) fn select_release(release: Release, os: &str, arch: &str) -> Result<Option<Candidate>> {
    if release.draft || release.prerelease {
        return Ok(None);
    }
    let version = release
        .tag_name
        .strip_prefix('v')
        .unwrap_or(&release.tag_name)
        .to_owned();
    if valid_version(&version).is_err() {
        return Ok(None);
    }
    let suffix = if os == "windows" { "zip" } else { "tar.gz" };
    let name = format!("frp_{version}_{os}_{arch}.{suffix}");
    let asset = match release.assets.iter().find(|asset| asset.name == name) {
        Some(asset) => asset.clone(),
        None => return Ok(None),
    };
    if asset.size == 0 || asset.size > MAX_ARCHIVE_BYTES {
        return Ok(None);
    }
    official_url(&asset.browser_download_url)?;
    let checksum_asset = release
        .assets
        .iter()
        .find(|asset| asset.name == "frp_sha256_checksums.txt")
        .cloned();
    // Old assets without a GitHub digest are usable only with the upstream
    // SHA-256 manifest; downloading unverified archives is never a fallback.
    if asset.digest.as_deref().and_then(parse_digest).is_none() && checksum_asset.is_none() {
        return Ok(None);
    }
    Ok(Some(Candidate {
        version,
        asset,
        checksum_asset,
    }))
}

pub(crate) fn parse_digest(digest: &str) -> Option<String> {
    let hex = digest.strip_prefix("sha256:")?;
    if hex.len() == 64 && hex.bytes().all(|byte| byte.is_ascii_hexdigit()) {
        Some(hex.to_ascii_lowercase())
    } else {
        None
    }
}

pub(crate) fn checksum_from_manifest(text: &str, name: &str) -> Result<String> {
    let mut found = None;
    for line in text.lines() {
        let fields: Vec<_> = line.split_whitespace().collect();
        if fields.len() == 2 && fields[1].trim_start_matches('*') == name {
            let checksum =
                parse_digest(&format!("sha256:{}", fields[0])).context("官方 checksum 格式错误")?;
            if found.is_some() {
                bail!("官方 checksum 条目重复");
            }
            found = Some(checksum);
        }
    }
    found.context("官方 checksum 清单不包含目标压缩包")
}

pub(crate) fn official_url(value: &str) -> Result<Url> {
    let url = Url::parse(value)?;
    if url.scheme() != "https"
        || url.host_str() != Some("github.com")
        || !url.path().starts_with("/fatedier/frp/releases/download/")
        || url.username() != ""
        || url.password().is_some()
        || url.query().is_some()
    {
        bail!("frpc 资产下载地址不属于官方 GitHub 仓库");
    }
    Ok(url)
}

pub(crate) async fn expected_checksum(client: &Client, candidate: &Candidate) -> Result<String> {
    if let Some(digest) = candidate.asset.digest.as_deref().and_then(parse_digest) {
        return Ok(digest);
    }
    let asset = candidate
        .checksum_asset
        .as_ref()
        .context("官方资产未提供 SHA-256 校验值")?;
    if asset.size > 64 * 1024 {
        bail!("官方 checksum 清单超过大小限制");
    }
    let response = client
        .get(official_url(&asset.browser_download_url)?)
        .send()
        .await?
        .error_for_status()?;
    if response
        .content_length()
        .is_some_and(|size| size > 64 * 1024)
    {
        bail!("官方 checksum 清单超过大小限制");
    }
    let bytes = crate::bounded_response(response, 64 * 1024).await?;
    if let Some(digest) = asset.digest.as_deref().and_then(parse_digest) {
        crate::verify_bytes(&bytes, &digest)?;
    }
    checksum_from_manifest(std::str::from_utf8(&bytes)?, &candidate.asset.name)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn checksum_manifest_matches_entire_filename_not_substrings() {
        let checksum = "a".repeat(64);
        let text = format!(
            "{checksum}  frp_0.71.0_windows_amd64.zip\n{}  unrelated.zip\n",
            "b".repeat(64)
        );
        assert_eq!(
            checksum_from_manifest(&text, "frp_0.71.0_windows_amd64.zip").unwrap(),
            checksum
        );
        assert!(checksum_from_manifest(&text, "windows_amd64.zip").is_err());
        assert!(
            checksum_from_manifest(&(text.clone() + &text), "frp_0.71.0_windows_amd64.zip")
                .is_err()
        );
    }

    #[test]
    fn release_url_rejects_foreign_sources() {
        assert!(
            official_url("https://github.com/fatedier/frp/releases/download/v0.71.0/frp.zip")
                .is_ok()
        );
        for url in [
            "http://github.com/fatedier/frp/releases/download/v0.71.0/frp.zip",
            "https://github.com/other/frp/releases/download/v1/frp.zip",
            "https://github.com.evil.test/fatedier/frp/releases/download/v1/frp.zip",
        ] {
            assert!(official_url(url).is_err());
        }
    }
}
