//! Opt in with SHA-verified official binaries supplied by the caller.
use anyhow::{ensure, Context, Result};
use frpc_core::{config, *};
use std::{path::PathBuf, process::Stdio, time::Duration};
use tokio::{
    io::{AsyncReadExt, AsyncWriteExt},
    net::{TcpListener, TcpStream},
    process::Command,
    time::{sleep, timeout},
};

fn available_port() -> u16 {
    std::net::TcpListener::bind("127.0.0.1:0")
        .unwrap()
        .local_addr()
        .unwrap()
        .port()
}
async fn echo(prefix: &'static [u8]) -> Result<(u16, tokio::task::JoinHandle<()>)> {
    let listener = TcpListener::bind("127.0.0.1:0").await?;
    let port = listener.local_addr()?.port();
    let task = tokio::spawn(async move {
        while let Ok((mut stream, _)) = listener.accept().await {
            tokio::spawn(async move {
                let mut buffer = [0; 32];
                if let Ok(Ok(count)) =
                    timeout(Duration::from_secs(3), stream.read(&mut buffer)).await
                {
                    let _ = stream.write_all(prefix).await;
                    let _ = stream.write_all(&buffer[..count]).await;
                }
            });
        }
    });
    Ok((port, task))
}
async fn exchange(port: u16, expected: &[u8]) -> Result<()> {
    timeout(Duration::from_secs(8), async {
        loop {
            if let Ok(mut stream) = TcpStream::connect(("127.0.0.1", port)).await {
                if stream.write_all(b"ping").await.is_ok() {
                    let mut received = vec![0; expected.len()];
                    if let Ok(Ok(_)) =
                        timeout(Duration::from_secs(1), stream.read_exact(&mut received)).await
                    {
                        if received == expected {
                            return Ok::<(), anyhow::Error>(());
                        }
                    }
                }
            }
            sleep(Duration::from_millis(50)).await;
        }
    })
    .await
    .context("Timed out forwarding loopback TCP")??;
    Ok(())
}

#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
#[ignore = "requires FRPC_TEST_BINARY and FRPS_TEST_BINARY official binaries"]
async fn official_frp_start_apply_disable_stop_and_persist() -> Result<()> {
    let client = PathBuf::from(std::env::var("FRPC_TEST_BINARY")?).canonicalize()?;
    let server = PathBuf::from(std::env::var("FRPS_TEST_BINARY")?).canonicalize()?;
    let directory = tempfile::tempdir()?;
    let server_port = available_port();
    let remote_port = available_port();
    let server_config = directory.path().join("frps.toml");
    std::fs::write(&server_config, format!("bindAddr = '127.0.0.1'\nbindPort = {server_port}\n[auth]\nmethod = 'token'\ntoken = 'loopback-test-token'\n[log]\nto = 'console'\ndisablePrintColor = true\n"))?;
    let mut command = Command::new(server);
    command
        .arg("-c")
        .arg(server_config)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .kill_on_drop(true);
    #[cfg(windows)]
    command.creation_flags(0x08000000);
    let mut frps = command.spawn()?;
    timeout(Duration::from_secs(5), async {
        while TcpStream::connect(("127.0.0.1", server_port))
            .await
            .is_err()
        {
            sleep(Duration::from_millis(50)).await;
        }
    })
    .await
    .context("frps did not listen")?;
    let (first_port, first_echo) = echo(b"ONE-").await?;
    let (second_port, second_echo) = echo(b"TWO-").await?;
    let manager = Manager::new(directory.path().join("client"))?;
    let source = format!("serverAddr = '127.0.0.1'\nserverPort = {server_port}\n[auth]\nmethod = 'token'\ntoken = 'loopback-test-token'\n[[proxies]]\nname = 'loopback-tcp'\ntype = 'tcp'\nlocalIP = '127.0.0.1'\nlocalPort = {first_port}\nremotePort = {remote_port}\n");
    let (profile, tunnels) = config::parse_toml(&source, "0.71.0", "Loopback")?;
    let id = profile.id.clone();
    manager.save_profile(profile)?;
    manager.save_tunnel(tunnels[0].clone())?;
    let result = manager
        .run(&id, RunAction::Start, Some(client.clone()))
        .await;
    ensure!(result.success, "{}", result.message);
    exchange(remote_port, b"ONE-ping").await?;
    let state = manager.snapshot();
    ensure!(
        state.profiles[0].connection == ConnectionStatus::Confirmed,
        "Login not confirmed"
    );
    ensure!(
        state.tunnels[0].apply == ApplyStatus::Applied,
        "Proxy registration not confirmed"
    );
    ensure!(
        manager.delete_profiles(vec![id.clone()]).is_err(),
        "Must reject deletion of a running process"
    );
    let persisted_before = std::fs::read(directory.path().join("client/state.json"))?;
    let mut switched_version = state.profiles[0].clone();
    switched_version.version = "0.70.0".into();
    switched_version.name = "This edit must remain uncommitted".into();
    ensure!(
        manager.save_profile(switched_version).is_err(),
        "Running version switch was accepted"
    );
    let unchanged = manager
        .snapshot()
        .profiles
        .into_iter()
        .find(|p| p.id == id)
        .context("Running profile is missing")?;
    ensure!(
        unchanged.version == "0.71.0"
            && unchanged.name == "Loopback"
            && unchanged.process == ProcessStatus::Running,
        "Rejected version switch changed runtime state"
    );
    ensure!(
        std::fs::read(directory.path().join("client/state.json"))? == persisted_before,
        "Rejected version switch changed persisted configuration"
    );
    let mut wrong_auth = state.profiles[0].clone();
    wrong_auth.id = format!("profile-{}", uuid::Uuid::new_v4());
    wrong_auth.name = "Wrong authentication".into();
    wrong_auth.auth_token = "deliberately-wrong-test-token".into();
    let failed_id = wrong_auth.id.clone();
    manager.save_profile(wrong_auth)?;
    let rejected = manager
        .run(&failed_id, RunAction::Start, Some(client.clone()))
        .await;
    ensure!(!rejected.success, "Incorrect authentication was accepted");
    let failed = manager
        .snapshot()
        .profiles
        .into_iter()
        .find(|p| p.id == failed_id)
        .context("Failure profile is missing")?;
    ensure!(
        failed.process == ProcessStatus::Running && failed.connection == ConnectionStatus::Failed,
        "A running process was mistaken for a successful server login"
    );
    let stopped = manager.run(&failed_id, RunAction::Stop, None).await;
    ensure!(stopped.success, "Could not stop the retrying client");
    manager.delete_profiles(vec![failed_id])?;
    // Exercise the file token source through real server authentication and an apply.
    let token_file = directory.path().join("auth-token.txt");
    std::fs::write(&token_file, "loopback-test-token\n")?;
    let mut file_profile = manager.snapshot().profiles[0].clone();
    file_profile.auth_token.clear();
    file_profile.advanced.insert(
        "auth".into(),
        serde_json::json!({"tokenSource":{"type":"file","file":{"path":token_file}}}),
    );
    file_profile.advanced.insert(
        "transport".into(),
        serde_json::json!({"poolCount":2,"heartbeatInterval":-2,"heartbeatTimeout":-2}),
    );
    manager.save_profile(file_profile)?;
    let mut edited = state.tunnels[0].clone();
    edited.local_port = second_port;
    manager.save_tunnel(edited)?;
    let result = manager
        .run(&id, RunAction::Apply, Some(client.clone()))
        .await;
    ensure!(result.success, "{}", result.message);
    exchange(remote_port, b"TWO-ping").await?;
    let tunnel_id = manager.snapshot().tunnels[0].id.clone();
    manager.toggle_tunnels(vec![tunnel_id.clone()], false)?;
    let result = manager
        .run(&id, RunAction::Apply, Some(client.clone()))
        .await;
    ensure!(result.success, "{}", result.message);
    timeout(Duration::from_secs(5), async {
        while TcpStream::connect(("127.0.0.1", remote_port)).await.is_ok() {
            sleep(Duration::from_millis(50)).await;
        }
    })
    .await
    .context("Disabled remote port still accepts connections")?;
    manager.toggle_tunnels(vec![tunnel_id], true)?;
    let result = manager
        .run(&id, RunAction::Apply, Some(client.clone()))
        .await;
    ensure!(result.success, "{}", result.message);
    exchange(remote_port, b"TWO-ping").await?;
    // Kill only the PID returned by this manager, then verify unexpected exit detection.
    let pid = manager
        .process_ids()
        .into_iter()
        .find(|(profile_id, _)| profile_id == &id)
        .context("Managed PID is missing")?
        .1;
    #[cfg(windows)]
    let status = Command::new("taskkill.exe")
        .args(["/PID", &pid.to_string(), "/F"])
        .creation_flags(0x08000000)
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .await?;
    #[cfg(unix)]
    let status = Command::new("kill")
        .args(["-KILL", &pid.to_string()])
        .status()
        .await?;
    ensure!(status.success(), "Could not terminate the test child");
    timeout(Duration::from_secs(5), async {
        while manager.snapshot().profiles[0].process != ProcessStatus::Failed {
            sleep(Duration::from_millis(50)).await;
        }
    })
    .await
    .context("Unexpected exit was not observed")?;
    let result = manager
        .run(&id, RunAction::Start, Some(client.clone()))
        .await;
    ensure!(result.success, "{}", result.message);
    exchange(remote_port, b"TWO-ping").await?;
    manager.shutdown().await;
    ensure!(
        manager.snapshot().profiles[0].process == ProcessStatus::Stopped,
        "Process did not stop"
    );
    ensure!(
        TcpStream::connect(("127.0.0.1", remote_port))
            .await
            .is_err(),
        "Remote port remains open after shutdown"
    );
    let loaded = Manager::new(directory.path().join("client"))?;
    ensure!(
        loaded.snapshot().profiles[0].process == ProcessStatus::Stopped,
        "Saved runtime was trusted"
    );
    ensure!(
        loaded.snapshot().tunnels[0].local_port == second_port,
        "Edited target was not persisted"
    );
    ensure!(
        !manager
            .snapshot()
            .logs
            .iter()
            .any(|line| line.message.contains("loopback-test-token")),
        "Credentials leaked into logs"
    );
    let result = loaded.run(&id, RunAction::Start, Some(client)).await;
    ensure!(result.success, "{}", result.message);
    exchange(remote_port, b"TWO-ping").await?;
    drop(loaded);
    timeout(Duration::from_secs(5), async {
        while TcpStream::connect(("127.0.0.1", remote_port)).await.is_ok() {
            sleep(Duration::from_millis(50)).await;
        }
    })
    .await
    .context("Dropping the manager did not release the remote port")?;
    frps.kill().await?;
    first_echo.abort();
    second_echo.abort();
    Ok(())
}
