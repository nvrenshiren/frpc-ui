use crate::{config, lock, model::*, Inner, Manager, Runtime};
use anyhow::{bail, ensure, Context, Result};
use std::{
    collections::{HashMap, HashSet},
    io::Write,
    path::PathBuf,
    process::Stdio,
    sync::{atomic::Ordering, Arc, Weak},
    time::{Duration, Instant},
};
use tokio::{
    io::{AsyncRead, AsyncReadExt},
    process::Command,
    sync::{oneshot, watch},
    time::timeout,
};

const LOG_LIMIT: usize = 1000;
const LINE_LIMIT: usize = 4096;

fn command(binary: &std::path::Path) -> Command {
    let mut command = Command::new(binary);
    command
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .kill_on_drop(true);
    #[cfg(windows)]
    command.creation_flags(0x08000000); // CREATE_NO_WINDOW
    command
}

pub(crate) async fn run(
    manager: &Manager,
    id: &str,
    action: &RunAction,
    binary: Option<PathBuf>,
) -> Result<String> {
    if matches!(action, RunAction::Stop) {
        return stop(manager, id).await;
    }
    let result = start(manager, id, action, binary).await;
    if let Err(error) = &result {
        let message = redact(manager, id, &format!("{error:#}"), &[]);
        let running = lock(&manager.inner.runtimes)
            .get(id)
            .map(|r| !r.task.is_finished())
            .unwrap_or(false);
        let mut state = lock(&manager.inner.state);
        if let Some(p) = state.stored.profiles.iter_mut().find(|p| p.id == id) {
            p.last_error = Some(message.clone());
            if !running {
                p.process = ProcessStatus::Failed;
                p.connection = ConnectionStatus::Failed;
            }
        }
        push_log(&mut state.logs, id, LogLevel::Error, message);
    }
    result.map_err(|error| anyhow::anyhow!(redact(manager, id, &format!("{error:#}"), &[])))
}

async fn start(
    manager: &Manager,
    id: &str,
    action: &RunAction,
    binary: Option<PathBuf>,
) -> Result<String> {
    let (profile, tunnels, revision) = {
        let state = lock(&manager.inner.state);
        let profile = state
            .stored
            .profiles
            .iter()
            .find(|p| p.id == id)
            .context("Unknown connection")?
            .clone();
        let tunnels: Vec<_> = state
            .stored
            .tunnels
            .iter()
            .filter(|t| t.profile_id == id)
            .cloned()
            .collect();
        (profile, tunnels, *state.revisions.get(id).unwrap_or(&0))
    };
    let running = lock(&manager.inner.runtimes)
        .get(id)
        .map(|r| !r.task.is_finished())
        .unwrap_or(false);
    if matches!(action, RunAction::Start) && running {
        let login = lock(&manager.inner.runtimes)
            .get(id)
            .map(|r| r.login.clone())
            .context("Connection stopped while checking")?;
        return await_login(login).await;
    }
    let binary = binary.context("Install and select an frpc version first")?;
    ensure!(binary.is_absolute(), "frpc binary path must be absolute");
    let binary = binary
        .canonicalize()
        .context("Cannot find the selected frpc binary")?;
    ensure!(binary.is_file(), "frpc binary path must be a file");
    let generated = config::render_runtime_toml(&profile, &tunnels)?;
    let file_tokens = crate::advanced::file_source_tokens(&profile)?;
    let secrets: Vec<_> = std::iter::once(profile.auth_token.clone())
        .chain(crate::advanced::sensitive_values(&profile.advanced))
        .chain(
            tunnels
                .iter()
                .flat_map(|t| crate::advanced::sensitive_values(&t.advanced)),
        )
        .chain(file_tokens)
        .chain(tunnels.iter().map(|t| t.secret_key.clone()))
        .filter(|s| !s.is_empty())
        .collect();
    let mut file = tempfile::Builder::new()
        .prefix("frpc-ui-")
        .suffix(".toml")
        .tempfile_in(&manager.inner.runtime_dir)?;
    file.write_all(generated.as_bytes())?;
    file.flush()?;
    let config_path = file.path().to_path_buf();
    let mut verify = command(&binary);
    verify.arg("verify").arg("-c").arg(&config_path);
    let mut child = verify.spawn().context("Cannot execute frpc verify")?;
    let stdout = child.stdout.take().context("Missing verify stdout")?;
    let stderr = child.stderr.take().context("Missing verify stderr")?;
    let verify_result = timeout(Duration::from_secs(15), async {
        let (stdout, stderr, status) = tokio::join!(
            read_limited(stdout, 16 * 1024),
            read_limited(stderr, 16 * 1024),
            child.wait()
        );
        Ok::<_, anyhow::Error>((status?, format!("{}{}", stdout?, stderr?)))
    })
    .await;
    let (status, output) = match verify_result {
        Ok(result) => result?,
        Err(_) => {
            let _ = child.kill().await;
            bail!("frpc verify timed out after 15 seconds");
        }
    };
    ensure!(
        status.success(),
        "frpc verify rejected configuration: {}",
        redact(manager, id, output.trim(), &secrets)
    );
    // A concurrent edit must not be declared applied by this older revision.
    ensure!(
        *lock(&manager.inner.state).revisions.get(id).unwrap_or(&0) == revision,
        "Configuration changed while verifying; apply again"
    );
    if matches!(action, RunAction::Apply) && !running {
        return Ok("配置验证通过；启动连接后生效".into());
    }
    if running || lock(&manager.inner.runtimes).contains_key(id) {
        stop(manager, id).await?;
    }
    ensure!(
        !manager.inner.shutting_down.load(Ordering::Acquire),
        "Application is shutting down"
    );
    let generation = uuid::Uuid::new_v4().to_string();
    let mut start_command = command(&binary);
    start_command.arg("-c").arg(&config_path);
    let mut child = start_command.spawn().context("Cannot start frpc")?;
    let pid = child.id().context("frpc PID is unavailable")?;
    let stdout = child.stdout.take().context("Missing frpc stdout")?;
    let stderr = child.stderr.take().context("Missing frpc stderr")?;
    {
        let mut state = lock(&manager.inner.state);
        let p = state
            .stored
            .profiles
            .iter_mut()
            .find(|p| p.id == id)
            .context("Connection was removed")?;
        p.process = ProcessStatus::Starting;
        p.connection = ConnectionStatus::Unknown;
        p.last_error = None;
        state.started.insert(id.into(), Instant::now());
    }
    let (stop_tx, mut stop_rx) = oneshot::channel();
    let (ready_tx, ready_rx) = oneshot::channel();
    let (login_tx, login_rx) = watch::channel(None);
    let weak = Arc::downgrade(&manager.inner);
    let profile_id = id.to_owned();
    let task_generation = generation.clone();
    let ack = Arc::new(std::sync::Mutex::new(Acknowledgements::new(
        &profile, &tunnels,
    )));
    let task = tokio::spawn(async move {
        let _configuration = file;
        if ready_rx.await.is_err() {
            return;
        }
        if let Some(inner) = weak.upgrade() {
            if let Some(p) = lock(&inner.state)
                .stored
                .profiles
                .iter_mut()
                .find(|p| p.id == profile_id)
            {
                p.process = ProcessStatus::Running;
            }
        }
        let stdout_task = tokio::spawn(read_logs(
            stdout,
            weak.clone(),
            profile_id.clone(),
            task_generation.clone(),
            revision,
            secrets.clone(),
            login_tx.clone(),
            ack.clone(),
        ));
        let stderr_task = tokio::spawn(read_logs(
            stderr,
            weak.clone(),
            profile_id.clone(),
            task_generation.clone(),
            revision,
            secrets,
            login_tx.clone(),
            ack,
        ));
        let (stopped, result) = tokio::select! {
            _ = &mut stop_rx => {
                let result = child.kill().await;
                (true, result.map(|_| ()))
            },
            result = child.wait() => (false, result.map(|_| ())),
        };
        // Streams are finite when the child is reaped; cap their drain for defensive imported binaries.
        for mut stream in [stdout_task, stderr_task] {
            if timeout(Duration::from_secs(2), &mut stream).await.is_err() {
                stream.abort();
            }
        }
        let _ = login_tx.send(Some(false));
        if let Some(inner) = weak.upgrade() {
            if current(&inner, &profile_id, &task_generation) {
                let mut state = lock(&inner.state);
                state.started.remove(&profile_id);
                if let Some(p) = state
                    .stored
                    .profiles
                    .iter_mut()
                    .find(|p| p.id == profile_id)
                {
                    p.process = if stopped {
                        ProcessStatus::Stopped
                    } else {
                        ProcessStatus::Failed
                    };
                    p.connection = ConnectionStatus::Unknown;
                    p.uptime = "—".into();
                    if !stopped {
                        p.last_error = Some("frpc 进程已退出，请检查日志".into());
                    }
                }
                let message = if stopped {
                    "frpc 已停止"
                } else {
                    "frpc 意外退出"
                };
                push_log(
                    &mut state.logs,
                    &profile_id,
                    if stopped {
                        LogLevel::Info
                    } else {
                        LogLevel::Error
                    },
                    if let Err(error) = result {
                        format!("{message}: {error}")
                    } else {
                        message.into()
                    },
                );
            }
        }
    });
    lock(&manager.inner.runtimes).insert(
        id.into(),
        Runtime {
            stop: Some(stop_tx),
            login: login_rx.clone(),
            task,
            generation,
            pid,
        },
    );
    let _ = ready_tx.send(());
    await_login(login_rx).await
}

async fn await_login(mut login: watch::Receiver<Option<bool>>) -> Result<String> {
    timeout(Duration::from_secs(12), async {
        loop {
            match *login.borrow_and_update() {
                Some(true) => return Ok("已确认登录服务器".into()),
                Some(false) => bail!("服务器登录失败，请检查日志；运行中的 frpc 会自动重试"),
                None => {}
            }
            login
                .changed()
                .await
                .context("frpc exited before login was confirmed")?;
        }
    })
    .await
    .context("frpc 已启动，但 12 秒内未确认服务器登录，请检查日志")?
}
async fn stop(manager: &Manager, id: &str) -> Result<String> {
    let runtime = lock(&manager.inner.runtimes).remove(id);
    if let Some(mut runtime) = runtime {
        if let Some(p) = lock(&manager.inner.state)
            .stored
            .profiles
            .iter_mut()
            .find(|p| p.id == id)
        {
            p.process = ProcessStatus::Stopping;
        }
        if let Some(stop) = runtime.stop.take() {
            let _ = stop.send(());
        }
        if timeout(Duration::from_secs(5), &mut runtime.task)
            .await
            .is_err()
        {
            runtime.task.abort();
            let _ = timeout(Duration::from_secs(2), runtime.task).await;
        }
    }
    let mut state = lock(&manager.inner.state);
    let p = state
        .stored
        .profiles
        .iter_mut()
        .find(|p| p.id == id)
        .context("Unknown connection")?;
    p.process = ProcessStatus::Stopped;
    p.connection = ConnectionStatus::Unknown;
    p.last_error = None;
    p.uptime = "—".into();
    state.started.remove(id);
    push_log(&mut state.logs, id, LogLevel::Info, "连接已停止".into());
    Ok("连接已停止".into())
}

fn current(inner: &Inner, id: &str, generation: &str) -> bool {
    lock(&inner.runtimes)
        .get(id)
        .map(|r| r.generation == generation)
        .unwrap_or(false)
}
async fn read_limited(mut stream: impl AsyncRead + Unpin, limit: usize) -> std::io::Result<String> {
    let mut output = Vec::new();
    let mut buffer = [0; 1024];
    loop {
        let count = stream.read(&mut buffer).await?;
        if count == 0 {
            break;
        }
        let room = limit.saturating_sub(output.len());
        output.extend_from_slice(&buffer[..count.min(room)]);
    }
    Ok(String::from_utf8_lossy(&output).into_owned())
}

struct Acknowledgements {
    expected: HashMap<String, Vec<String>>,
    successful: HashSet<String>,
}
impl Acknowledgements {
    fn new(profile: &Profile, tunnels: &[Tunnel]) -> Self {
        let mut expected = HashMap::new();
        for t in tunnels.iter().filter(|t| t.enabled) {
            let count = if t.local_port_end == 0 {
                1
            } else {
                t.local_port_end as u32 - t.local_port as u32 + 1
            };
            let names = (0..count)
                .map(|offset| {
                    let name = if count == 1 {
                        t.name.clone()
                    } else {
                        format!("{}-{}", t.name, t.local_port as u32 + offset)
                    };
                    if profile.user.is_empty() {
                        name
                    } else {
                        format!("{}.{}", profile.user, name)
                    }
                })
                .collect();
            expected.insert(t.id.clone(), names);
        }
        Self {
            expected,
            successful: HashSet::new(),
        }
    }
}
#[allow(clippy::too_many_arguments)]
async fn read_logs(
    mut stream: impl AsyncRead + Unpin,
    weak: Weak<Inner>,
    id: String,
    generation: String,
    revision: u64,
    secrets: Vec<String>,
    login: watch::Sender<Option<bool>>,
    ack: Arc<std::sync::Mutex<Acknowledgements>>,
) {
    let mut buffer = [0; 1024];
    let mut line = Vec::new();
    let mut truncated = false;
    loop {
        let read = match stream.read(&mut buffer).await {
            Ok(0) | Err(_) => break,
            Ok(read) => read,
        };
        for byte in &buffer[..read] {
            if *byte == b'\n' {
                let mut message = String::from_utf8_lossy(&line).into_owned();
                if truncated {
                    message.push_str(" …[truncated]");
                }
                record_line(
                    &weak,
                    &id,
                    &generation,
                    revision,
                    &message,
                    &secrets,
                    &login,
                    &ack,
                );
                line.clear();
                truncated = false;
            } else if line.len() < LINE_LIMIT {
                line.push(*byte);
            } else {
                truncated = true;
            }
        }
    }
    if !line.is_empty() {
        record_line(
            &weak,
            &id,
            &generation,
            revision,
            &String::from_utf8_lossy(&line),
            &secrets,
            &login,
            &ack,
        );
    }
}

#[allow(clippy::too_many_arguments)]
fn record_line(
    weak: &Weak<Inner>,
    id: &str,
    generation: &str,
    revision: u64,
    raw: &str,
    captured: &[String],
    login: &watch::Sender<Option<bool>>,
    acknowledgements: &Arc<std::sync::Mutex<Acknowledgements>>,
) {
    let Some(inner) = weak.upgrade() else {
        return;
    };
    if !current(&inner, id, generation) {
        return;
    }
    let manager = Manager {
        inner: inner.clone(),
    };
    let message = redact(&manager, id, raw.trim(), captured);
    let level = if raw.contains("[E]") || raw.contains("start error:") {
        LogLevel::Error
    } else if raw.contains("[W]") {
        LogLevel::Warn
    } else if raw.contains("[D]") {
        LogLevel::Debug
    } else {
        LogLevel::Info
    };
    let mut state = lock(&inner.state);
    let is_revision = *state.revisions.get(id).unwrap_or(&0) == revision;
    if matches!(level, LogLevel::Info)
        && raw.find("[I]").is_some_and(|offset| offset < 60)
        && raw.contains("] login to server success, get run id [")
    {
        if let Some(p) = state.stored.profiles.iter_mut().find(|p| p.id == id) {
            p.connection = ConnectionStatus::Confirmed;
            p.last_error = None;
            if is_revision {
                p.pending = false;
            }
        }
        if is_revision {
            for t in state
                .stored
                .tunnels
                .iter_mut()
                .filter(|t| t.profile_id == id && !t.enabled)
            {
                t.apply = ApplyStatus::Applied;
            }
        }
        let _ = login.send(Some(true));
    } else if raw.contains("connect to server error:")
        || raw.contains("login to the server failed:")
        || raw.contains("control writer is closing")
        || raw.contains("control reader is closing")
    {
        if let Some(p) = state.stored.profiles.iter_mut().find(|p| p.id == id) {
            p.connection = ConnectionStatus::Failed;
            p.last_error = Some(message.clone());
        }
        let _ = login.send(Some(false));
        lock(acknowledgements).successful.clear();
    }
    if is_revision
        && (raw.contains("start proxy success")
            || raw.contains("start visitor success")
            || raw.contains("start error:"))
    {
        let mut ack = lock(acknowledgements);
        let matched: Vec<_> = ack
            .expected
            .iter()
            .flat_map(|(tunnel_id, names)| {
                names
                    .iter()
                    .filter(|name| raw.contains(&format!("[{name}]")))
                    .map(move |name| (tunnel_id.clone(), name.clone()))
            })
            .collect();
        for (tunnel_id, name) in matched {
            if raw.contains("start error:") {
                if let Some(t) = state.stored.tunnels.iter_mut().find(|t| t.id == tunnel_id) {
                    t.apply = ApplyStatus::Failed;
                }
            } else {
                ack.successful.insert(name);
                let all = ack.expected[&tunnel_id]
                    .iter()
                    .all(|n| ack.successful.contains(n));
                if all {
                    if let Some(t) = state.stored.tunnels.iter_mut().find(|t| t.id == tunnel_id) {
                        t.apply = ApplyStatus::Applied;
                    }
                }
            }
        }
    }
    push_log(&mut state.logs, id, level, message);
}

fn redact(manager: &Manager, id: &str, raw: &str, captured: &[String]) -> String {
    let state = lock(&manager.inner.state);
    let extra: Vec<_> = state
        .stored
        .profiles
        .iter()
        .filter(|p| p.id == id)
        .flat_map(|p| crate::advanced::sensitive_values(&p.advanced))
        .chain(
            state
                .stored
                .tunnels
                .iter()
                .filter(|t| t.profile_id == id)
                .flat_map(|t| crate::advanced::sensitive_values(&t.advanced)),
        )
        .collect();
    let mut secrets: Vec<_> = captured
        .iter()
        .chain(extra.iter())
        .map(String::as_str)
        .chain(
            state
                .stored
                .profiles
                .iter()
                .filter(|p| p.id == id)
                .map(|p| p.auth_token.as_str()),
        )
        .chain(
            state
                .stored
                .tunnels
                .iter()
                .filter(|t| t.profile_id == id)
                .map(|t| t.secret_key.as_str()),
        )
        // A multiline secret can be emitted over multiple separate log lines.
        .flat_map(|secret| std::iter::once(secret).chain(secret.lines()))
        .filter(|s| !s.is_empty())
        .collect();
    secrets.sort_by(|a, b| b.len().cmp(&a.len()).then_with(|| a.cmp(b)));
    secrets.dedup();
    let mut output = raw.to_owned();
    for secret in secrets {
        output = output.replace(secret, "[REDACTED]");
        // Validation output may display a quoted/escaped representation of a token.
        if let Ok(quoted) = serde_json::to_string(secret) {
            output = output.replace(quoted.trim_matches('"'), "[REDACTED]");
        }
    }
    output
        .chars()
        .filter(|c| !c.is_control() || *c == '\t')
        .collect()
}
fn push_log(logs: &mut Vec<LogEntry>, id: &str, level: LogLevel, message: String) {
    if message.is_empty() {
        return;
    }
    logs.push(LogEntry {
        id: uuid::Uuid::new_v4().to_string(),
        time: chrono::Local::now().format("%H:%M:%S").to_string(),
        profile_id: id.into(),
        level,
        message,
    });
    if logs.len() > LOG_LIMIT {
        logs.drain(..logs.len() - LOG_LIMIT);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[tokio::test]
    async fn limited_output_keeps_reading_without_growing() {
        let input = vec![b'a'; 100_000];
        assert_eq!(
            read_limited(input.as_slice(), 16).await.unwrap(),
            "a".repeat(16)
        );
    }
    #[tokio::test]
    async fn logs_are_bounded_redacted_and_cannot_clear_a_new_revision() {
        let directory = tempfile::tempdir().unwrap();
        let manager = Manager::new(directory.path()).unwrap();
        let (profile, tunnels) = config::parse_toml("serverAddr='127.0.0.1'\n[auth]\ntoken='old-secret'\n[[proxies]]\nname='echo'\ntype='tcp'\nlocalPort=8080\nremotePort=18080", "0.65.0", "test").unwrap();
        let id = profile.id.clone();
        manager.save_profile(profile.clone()).unwrap();
        manager.save_tunnel(tunnels[0].clone()).unwrap();
        let revision = lock(&manager.inner.state).revisions[&id];
        let (sender, receiver) = watch::channel(None);
        let task = tokio::spawn(async {});
        lock(&manager.inner.runtimes).insert(
            id.clone(),
            Runtime {
                stop: None,
                login: receiver.clone(),
                task,
                generation: "test".into(),
                pid: 0,
            },
        );
        let mut updated = profile.clone();
        updated.auth_token = "new-secret".into();
        updated.advanced = serde_json::json!({
            "webServer":{"user":"dashboard-user","password":"dashboard-secret\nsecond-password"},
            "metadatas":{"credential":"metadata-secret"},
            "transport":{"proxyURL":"http://proxy-user:proxy%40secret@127.0.0.1:8080"}
        })
        .as_object()
        .unwrap()
        .clone();
        manager.save_profile(updated).unwrap();
        let mut updated_tunnel = tunnels[0].clone();
        updated_tunnel.advanced = serde_json::json!({
            "plugin":{"type":"socks5","username":"plugin-user","password":"plugin-secret"},
            "loadBalancer":{"group":"test","groupKey":"group-secret"},
            "healthCheck":{"type":"http","path":"/","httpHeaders":[{"name":"Authorization","value":"header-secret"}]}
        }).as_object().unwrap().clone();
        manager.save_tunnel(updated_tunnel).unwrap();
        let ack = Arc::new(std::sync::Mutex::new(Acknowledgements::new(
            &profile, &tunnels,
        )));
        record_line(
            &Arc::downgrade(&manager.inner),
            &id,
            "test",
            revision,
            "[I] [service.go:287] login to server success, get run id [test] old-secret new-secret dashboard-user dashboard-secret second-password metadata-secret proxy-user proxy@secret plugin-user plugin-secret group-secret header-secret old-file-token",
            &["old-secret".into(), "old-file-token".into()],
            &sender,
            &ack,
        );
        record_line(
            &Arc::downgrade(&manager.inner),
            &id,
            "test",
            revision,
            "[echo] start proxy success",
            &[],
            &sender,
            &ack,
        );
        let state = manager.snapshot();
        assert_eq!(state.profiles[0].connection, ConnectionStatus::Confirmed);
        assert!(state.profiles[0].pending);
        assert_eq!(state.tunnels[0].apply, ApplyStatus::Pending);
        for secret in [
            "old-secret",
            "new-secret",
            "dashboard-user",
            "dashboard-secret",
            "second-password",
            "metadata-secret",
            "proxy-user",
            "proxy@secret",
            "plugin-user",
            "plugin-secret",
            "group-secret",
            "header-secret",
            "old-file-token",
        ] {
            assert!(
                !state.logs[0].message.contains(secret),
                "log leaked {secret}"
            );
        }
        for _ in 0..1100 {
            record_line(
                &Arc::downgrade(&manager.inner),
                &id,
                "test",
                revision,
                "a log line",
                &[],
                &sender,
                &ack,
            );
        }
        assert_eq!(manager.snapshot().logs.len(), LOG_LIMIT);
        manager.shutdown().await;
    }
}
