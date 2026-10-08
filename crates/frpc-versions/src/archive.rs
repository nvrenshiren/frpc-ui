use anyhow::{bail, Context, Result};
use flate2::read::GzDecoder;
use std::{
    fs::File,
    io::{Read, Write},
    path::Path,
};

pub const MAX_BINARY_BYTES: u64 = 128 * 1024 * 1024;
const MAX_UNPACKED_BYTES: u64 = 256 * 1024 * 1024;
const MAX_ENTRIES: usize = 100;

/// No archive-derived path is ever passed to the filesystem. Even ignored
/// entries are checked so malformed archives fail closed.
pub fn safe_entry_name(name: &str) -> Result<()> {
    if name.starts_with('/')
        || name.contains('\\')
        || name.contains(':')
        || name.contains('\0')
        || name.split('/').any(|part| part == ".." || part == ".")
    {
        bail!("压缩包包含不安全路径: {name}");
    }
    Ok(())
}

pub fn extract_frpc(
    archive: &Path,
    zip_format: bool,
    expected: &str,
    destination: &Path,
) -> Result<()> {
    let mut found = false;
    let mut total = 0_u64;
    if zip_format {
        let mut archive = zip::ZipArchive::new(File::open(archive)?)?;
        if archive.len() > MAX_ENTRIES {
            bail!("压缩包文件数超过限制");
        }
        for index in 0..archive.len() {
            let mut entry = archive.by_index(index)?;
            safe_entry_name(entry.name())?;
            if entry
                .unix_mode()
                .is_some_and(|mode| mode & 0o170000 == 0o120000)
            {
                bail!("压缩包不能包含符号链接");
            }
            total = total.checked_add(entry.size()).context("压缩包大小溢出")?;
            if total > MAX_UNPACKED_BYTES {
                bail!("压缩包解压大小超过限制");
            }
            if entry.name() == expected {
                if found || entry.is_dir() {
                    bail!("压缩包 frpc 条目重复或类型错误");
                }
                let size = entry.size();
                copy_binary(&mut entry, destination, size)?;
                found = true;
            }
        }
    } else {
        let mut archive = tar::Archive::new(GzDecoder::new(File::open(archive)?));
        for (index, entry) in archive.entries()?.enumerate() {
            if index >= MAX_ENTRIES {
                bail!("压缩包文件数超过限制");
            }
            let mut entry = entry?;
            let name =
                String::from_utf8(entry.path_bytes().to_vec()).context("压缩包路径不是 UTF-8")?;
            safe_entry_name(&name)?;
            let kind = entry.header().entry_type();
            if !kind.is_file() && !kind.is_dir() {
                bail!("压缩包不能包含链接或特殊文件");
            }
            let size = entry.header().size()?;
            total = total.checked_add(size).context("压缩包大小溢出")?;
            if total > MAX_UNPACKED_BYTES {
                bail!("压缩包解压大小超过限制");
            }
            if name == expected {
                if found || !kind.is_file() {
                    bail!("压缩包 frpc 条目重复或类型错误");
                }
                copy_binary(&mut entry, destination, size)?;
                found = true;
            }
        }
    }
    if !found {
        bail!("官方压缩包没有当前平台的 frpc 文件");
    }
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(destination, std::fs::Permissions::from_mode(0o755))?;
    }
    Ok(())
}

fn copy_binary(reader: &mut impl Read, destination: &Path, declared_size: u64) -> Result<()> {
    if declared_size == 0 || declared_size > MAX_BINARY_BYTES {
        bail!("frpc 大小超过限制或为空");
    }
    let mut file = File::options()
        .write(true)
        .create_new(true)
        .open(destination)?;
    let copied = std::io::copy(&mut reader.take(MAX_BINARY_BYTES + 1), &mut file)?;
    if copied != declared_size || copied > MAX_BINARY_BYTES {
        bail!("frpc 解压大小与元数据不一致");
    }
    file.flush()?;
    file.sync_all()?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use zip::write::SimpleFileOptions;

    #[test]
    fn rejects_archive_traversal_on_every_platform() {
        for name in [
            "../frpc.exe",
            "/frpc",
            "a/../frpc",
            "C:/frpc.exe",
            "a\\frpc.exe",
            "./frpc",
        ] {
            assert!(safe_entry_name(name).is_err(), "{name}");
        }
        assert!(safe_entry_name("frp_0.71.0_windows_amd64/frpc.exe").is_ok());
    }

    #[test]
    fn zip_extracts_only_expected_binary() {
        let directory = tempfile::tempdir().unwrap();
        let path = directory.path().join("release.zip");
        let expected = "frp_0.71.0_windows_amd64/frpc.exe";
        let mut writer = zip::ZipWriter::new(File::create(&path).unwrap());
        writer
            .start_file(expected, SimpleFileOptions::default())
            .unwrap();
        writer.write_all(b"binary").unwrap();
        writer
            .start_file(
                "frp_0.71.0_windows_amd64/frps.exe",
                SimpleFileOptions::default(),
            )
            .unwrap();
        writer.write_all(b"server").unwrap();
        writer.finish().unwrap();
        let destination = directory.path().join("frpc.exe");
        extract_frpc(&path, true, expected, &destination).unwrap();
        assert_eq!(std::fs::read(destination).unwrap(), b"binary");
        assert!(!directory.path().join("frps.exe").exists());
    }

    #[test]
    fn refuses_archive_missing_expected_platform_binary() {
        let directory = tempfile::tempdir().unwrap();
        let path = directory.path().join("release.zip");
        let writer = zip::ZipWriter::new(File::create(&path).unwrap());
        writer.finish().unwrap();
        assert!(extract_frpc(
            &path,
            true,
            "expected/frpc.exe",
            &directory.path().join("frpc.exe")
        )
        .is_err());
    }

    #[test]
    fn malicious_zip_paths_and_symlinks_are_rejected_without_writing() {
        for symlink in [false, true] {
            let directory = tempfile::tempdir().unwrap();
            let path = directory.path().join("release.zip");
            let destination = directory.path().join("frpc.exe");
            let mut writer = zip::ZipWriter::new(File::create(&path).unwrap());
            if symlink {
                writer
                    .add_symlink(
                        "frp/frpc.exe",
                        "../../outside",
                        SimpleFileOptions::default(),
                    )
                    .unwrap();
            } else {
                writer
                    .start_file("../outside", SimpleFileOptions::default())
                    .unwrap();
                writer.write_all(b"escape").unwrap();
            }
            writer.finish().unwrap();
            assert!(extract_frpc(&path, true, "frp/frpc.exe", &destination).is_err());
            assert!(!destination.exists());
            assert!(!directory.path().join("outside").exists());
        }
    }
}
