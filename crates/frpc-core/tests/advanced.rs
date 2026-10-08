use anyhow::{ensure, Context, Result};
use frpc_core::{advanced, config, Manager};
use serde_json::json;

const COMMON: &str = r#"
serverAddr='127.0.0.1'
serverPort=7000
clientID='client-advanced'
natHoleStunServer='stun.example.test:3478'
dnsServer='1.1.1.1:53'
udpPacketSize=1500
[metadatas]
token='metadata-secret'
[auth]
token='auth-secret'
additionalScopes=['HeartBeats','NewWorkConns']
[transport]
wireProtocol='v2'
dialServerTimeout=15
dialServerKeepalive=-20
connectServerLocalIP='127.0.0.1'
proxyURL='http://proxy-user:proxy%40secret@127.0.0.1:8080'
poolCount=3
tcpMux=false
tcpMuxKeepaliveInterval=20
heartbeatInterval=30
heartbeatTimeout=90
[transport.tls]
enable=true
disableCustomTLSFirstByte=false
serverName='frps.example.test'
[webServer]
port=0
user='admin'
password='admin-secret'
assetsDir='C:/assets'
pprofEnable=false
[[proxies]]
name='http-full'
type='http'
localIP='127.0.0.1'
localPort=8080
customDomains=['one.example.test','*.two.example.test']
subdomain='app'
locations=['/api','/v1']
httpUser='http-user'
httpPassword='http-secret'
hostHeaderRewrite='backend.example.test'
routeByHTTPUser='user-route'
[proxies.requestHeaders.set]
X-Token='header-secret'
[proxies.responseHeaders.set]
X-Internal='response-secret'
[proxies.annotations]
'example.test/owner'='annotation-secret'
[proxies.metadatas]
token='proxy-metadata-secret'
[proxies.transport]
useEncryption=true
useCompression=false
bandwidthLimit='1.5MB'
bandwidthLimitMode='server'
proxyProtocolVersion='v2'
[proxies.loadBalancer]
group='web-group'
groupKey='group-secret'
[proxies.healthCheck]
type='http'
path='/health'
timeoutSeconds=3
intervalSeconds=10
maxFailed=2
[[proxies.healthCheck.httpHeaders]]
name='Authorization'
value='health-secret'
[[proxies]]
name='tcp-auto'
type='tcp'
localPort=22
remotePort=0
[[proxies]]
name='connect'
type='tcpmux'
localPort=8080
subdomain='connect'
httpUser='connect-user'
httpPassword='connect-secret'
[[proxies]]
name='xtcp-provider'
type='xtcp'
localPort=22
allowUsers=['alice','*']
secretKey='private-secret'
[proxies.natTraversal]
disableAssistedAddrs=true
[[visitors]]
name='fallback'
type='stcp'
serverName='provider'
serverUser='alice'
bindPort=-1
[[visitors]]
name='xtcp-visitor'
type='xtcp'
serverName='xtcp-provider'
bindPort=9000
protocol='kcp'
keepTunnelOpen=true
maxRetriesAnHour=6
minRetryInterval=8
fallbackTo='fallback'
fallbackTimeoutMs=500
[visitors.natTraversal]
disableAssistedAddrs=true
"#;

#[test]
fn advanced_values_round_trip_store_and_omit_secrets_without_mutating_runtime() {
    let (p, t) = config::parse_toml(COMMON, "0.71.0", "advanced").unwrap();
    let full = config::render_profile_toml(&p, &t, true).unwrap();
    let (p2, t2) = config::parse_toml(&full, "0.71.0", "again").unwrap();
    assert_eq!(p.advanced, p2.advanced);
    for (a, b) in t.iter().zip(&t2) {
        if a.name == "connect" {
            assert_eq!(b.advanced["multiplexer"], "httpconnect");
        } else {
            assert_eq!(a.advanced, b.advanced);
        }
    }
    assert_eq!(t2[0].domain, "one.example.test");
    assert_eq!(t2[1].remote_port, 0);
    assert_eq!(t2[4].advanced["bindPort"], -1);
    let safe = config::render_profile_toml(&p, &t, false).unwrap();
    assert!(
        !safe.contains("admin") && !safe.contains("http-user") && !safe.contains("connect-user")
    );
    for secret in [
        "auth-secret",
        "metadata-secret",
        "admin-secret",
        "http-secret",
        "header-secret",
        "response-secret",
        "annotation-secret",
        "proxy-metadata-secret",
        "group-secret",
        "health-secret",
        "connect-secret",
        "private-secret",
        "proxy%40secret",
    ] {
        assert!(!safe.contains(secret), "leaked {secret}");
    }
    assert_eq!(p.advanced["webServer"]["password"], "admin-secret");
    assert_eq!(t[0].advanced["loadBalancer"]["groupKey"], "group-secret");
    let secrets = advanced::sensitive_values(&p.advanced);
    assert!(secrets.contains(&"proxy@secret".to_string()));
    let dir = tempfile::tempdir().unwrap();
    let manager = Manager::new(dir.path()).unwrap();
    manager.import_configuration(p.clone(), t).unwrap();
    let reloaded = Manager::new(dir.path()).unwrap();
    assert_eq!(reloaded.snapshot().profiles[0].advanced, p.advanced);
    let mut old = serde_json::to_value(&p).unwrap();
    old.as_object_mut().unwrap().remove("advanced");
    assert!(serde_json::from_value::<frpc_core::Profile>(old)
        .unwrap()
        .advanced
        .is_empty());
    let stored = reloaded.snapshot();
    let mut stale_domain = stored.tunnels[0].clone();
    stale_domain.domain = "outdated.example.test".into();
    reloaded.save_tunnel(stale_domain).unwrap();
    assert_eq!(reloaded.snapshot().tunnels[0].domain, "one.example.test");
}

#[test]
fn capability_minima_and_unknown_versions_are_enforced_at_save() {
    let (base, tunnels) = config::parse_toml("serverAddr='127.0.0.1'\n[[proxies]]\nname='web'\ntype='http'\nlocalPort=8080\ncustomDomains=['web.example.test']", "0.71.0", "gates").unwrap();
    let directory = tempfile::tempdir().unwrap();
    let token_file = directory.path().join("token.txt");
    let jwt_file = directory.path().join("jwt.txt");
    std::fs::write(&token_file, "test-token").unwrap();
    std::fs::write(&jwt_file, "test-jwt").unwrap();
    let profile_fields = [
        (67, json!({"clientID":"client"})),
        (69, json!({"transport":{"wireProtocol":"v2"}})),
        (
            64,
            json!({"auth":{"tokenSource":{"type":"file","file":{"path":token_file}}}}),
        ),
        (
            65,
            json!({"auth":{"method":"oidc","oidc":{"clientID":"public","tokenEndpointURL":"https://issuer.example.test/token","insecureSkipVerify":false}}}),
        ),
        (
            66,
            json!({"auth":{"method":"oidc","oidc":{"tokenSource":{"type":"file","file":{"path":jwt_file}}}}}),
        ),
    ];
    for (minimum, extension) in profile_fields {
        let mut p = base.clone();
        p.advanced = extension.as_object().unwrap().clone();
        p.version = format!("0.{}.99", minimum - 1);
        assert!(config::validate_version_capabilities(&p, &[]).is_err());
        p.version = format!("0.{minimum}.0");
        assert!(config::render_profile_toml(&p, &[], true).is_ok());
    }
    let tunnel_fields = [
        (55, json!({"annotations":{"owner":"test"}})),
        (
            56,
            json!({"healthCheck":{"type":"http","path":"/","httpHeaders":[{"name":"X-Test","value":"test"}]}}),
        ),
        (58, json!({"responseHeaders":{"set":{"X-Test":"test"}}})),
        (
            59,
            json!({"plugin":{"type":"https2http","localAddr":"127.0.0.1:8080","enableHTTP2":false}}),
        ),
        (
            59,
            json!({"plugin":{"type":"http2http","localAddr":"127.0.0.1:8080"}}),
        ),
        (
            60,
            json!({"plugin":{"type":"tls2raw","localAddr":"127.0.0.1:8080"}}),
        ),
        (65, json!({"natTraversal":{"disableAssistedAddrs":false}})),
    ];
    for (minimum, extension) in tunnel_fields {
        let mut p = base.clone();
        let mut t = tunnels[0].clone();
        if extension.get("natTraversal").is_some() {
            t.tunnel_type = frpc_core::TunnelType::Xtcp;
            t.domain.clear();
        }
        t.advanced = extension.as_object().unwrap().clone();
        p.version = format!("0.{}.99", minimum - 1);
        assert!(config::validate_version_capabilities(&p, &[t.clone()]).is_err());
        t.enabled = false;
        assert!(config::validate_version_capabilities(&p, &[t.clone()]).is_ok());
        t.enabled = true;
        p.version = format!("0.{minimum}.0");
        assert!(config::render_profile_toml(&p, &[t], true).is_ok());
    }
    let manager = Manager::new(directory.path()).unwrap();
    manager.save_profile(base.clone()).unwrap();
    let bytes = std::fs::read(directory.path().join("state.json")).unwrap();
    for version in [
        "0.51.9",
        "0.72.0",
        "1.0.0",
        "custom",
        "0.71",
        "0.71.0-beta",
        "00.71.0",
    ] {
        let mut p = base.clone();
        p.version = version.into();
        assert!(manager.save_profile(p).is_err(), "accepted {version}");
        assert_eq!(
            std::fs::read(directory.path().join("state.json")).unwrap(),
            bytes
        );
        assert_eq!(manager.snapshot().profiles[0].version, "0.71.0");
    }
    let mut p = base;
    p.version = "0.71.42".into();
    assert!(manager.save_profile(p).is_ok());
}

#[test]
fn proxy_bandwidth_paths_and_http_semantics_are_explicit() {
    let (mut profile, tunnels) = config::parse_toml("serverAddr='127.0.0.1'\n[[proxies]]\nname='web'\ntype='http'\nlocalPort=8080\ncustomDomains=['web.example.test']", "0.71.0", "semantics").unwrap();
    profile.advanced = json!({"transport":{"proxyURL":"socks5://user:password@127.0.0.1:1080","connectServerLocalIP":"127.0.0.1"}}).as_object().unwrap().clone();
    for protocol in ["tcp", "websocket", "wss"] {
        profile.transport = protocol.into();
        assert!(config::validate_profile(&profile).is_ok());
    }
    for protocol in ["quic", "kcp"] {
        profile.transport = protocol.into();
        assert!(config::validate_profile(&profile).is_err());
    }
    profile.transport = "tcp".into();
    profile.advanced = json!({"transport":{"proxyURL":"socks5h://127.0.0.1:1080"}})
        .as_object()
        .unwrap()
        .clone();
    assert!(config::validate_profile(&profile).is_err());
    let mut tunnel = tunnels[0].clone();
    for value in ["", "  ", "1KB", "1.5MB", " 1.5MB "] {
        tunnel.advanced = json!({"transport":{"bandwidthLimit":value}})
            .as_object()
            .unwrap()
            .clone();
        assert!(
            config::validate_tunnel(&tunnel).is_ok(),
            "rejected {value:?}"
        );
    }
    for value in ["1024", "1kb", "1mb", "1 MB", "-1MB", "NaNMB", "infMB"] {
        tunnel.advanced = json!({"transport":{"bandwidthLimit":value}})
            .as_object()
            .unwrap()
            .clone();
        assert!(
            config::validate_tunnel(&tunnel).is_err(),
            "accepted {value:?}"
        );
    }
    for extension in [
        json!({"locations":["relative"]}),
        json!({"requestHeaders":{"set":{"Authorization":"secret\r\nInjected: yes"}}}),
        json!({"healthCheck":{"type":"http","path":"relative"}}),
        json!({"plugin":{"type":"virtual_net"}}),
        json!({"plugin":{"type":"unix_domain_socket","unixPath":"relative.sock"}}),
    ] {
        tunnel.advanced = extension.as_object().unwrap().clone();
        assert!(config::validate_tunnel(&tunnel).is_err());
    }
    #[cfg(windows)]
    for path in ["/tmp/token", "C:relative", "\\token"] {
        profile.advanced = json!({"auth":{"tokenSource":{"type":"file","file":{"path":path}}}})
            .as_object()
            .unwrap()
            .clone();
        assert!(
            config::validate_profile(&profile).is_err(),
            "accepted {path}"
        );
    }
}

#[test]
fn unknown_types_roles_tls_pairs_and_version_gates_reject() {
    for extra in [
        "[transport]\ntcpMux='true'",
        "[transport.tls]\ncertFile='cert.pem'",
        "[auth]\nmethod='oidc'",
        "[auth.tokenSource]\ntype='exec'\ncommand='unsafe'",
        "store.path='runtime.json'",
        "clientID=123",
    ] {
        assert!(
            config::parse_toml(&format!("serverAddr='127.0.0.1'\n{extra}"), "0.71.0", "bad")
                .is_err(),
            "accepted {extra}"
        );
    }
    let (p, mut t) = config::parse_toml(COMMON, "0.71.0", "advanced").unwrap();
    t[1].advanced = json!({"customDomains":["wrong.example.test"]})
        .as_object()
        .unwrap()
        .clone();
    assert!(config::validate_tunnel(&t[1]).is_err());
    let mut old = p;
    old.version = "0.66.0".into();
    assert!(config::validate_version_capabilities(&old, &[])
        .unwrap_err()
        .to_string()
        .contains("clientID"));
    old.advanced.remove("clientID");
    assert!(config::validate_version_capabilities(&old, &[])
        .unwrap_err()
        .to_string()
        .contains("wireProtocol"));
    let source="serverAddr='127.0.0.1'\n[[visitors]]\nname='bad'\ntype='sudp'\nserverName='provider'\nbindPort=-1";
    assert!(config::parse_toml(source, "0.71.0", "bad").is_err());
}

#[test]
fn oidc_file_source_and_client_parameters_are_explicit_and_safe() {
    let source="serverAddr='127.0.0.1'\n[auth]\nmethod='oidc'\n[auth.oidc]\nclientID='public-client'\nclientSecret='oidc-secret'\ntokenEndpointURL='https://issuer.example.test/token'\nscope='profile'\ninsecureSkipVerify=false\nproxyURL='http://user:password@127.0.0.1:8080'\n[auth.oidc.additionalEndpointParams]\nresource='oidc-parameter-secret'";
    let (p, t) = config::parse_toml(source, "0.71.0", "oidc").unwrap();
    let safe = config::render_profile_toml(&p, &t, false).unwrap();
    assert!(
        !safe.contains("oidc-secret")
            && !safe.contains("password")
            && !safe.contains("oidc-parameter-secret")
    );
    assert!(config::parse_toml(&safe, "0.71.0", "safe").is_ok());
    let unsafe_endpoint = source.replace(
        "https://issuer.example.test/token",
        "https://user:secret@issuer.example.test/token",
    );
    assert!(config::parse_toml(&unsafe_endpoint, "0.71.0", "unsafe").is_err());
    let dir = tempfile::tempdir().unwrap();
    let file = dir.path().join("token.txt");
    std::fs::write(&file, "test-jwt").unwrap();
    let source=format!("serverAddr='127.0.0.1'\n[auth]\nmethod='oidc'\n[auth.oidc.tokenSource]\ntype='file'\n[auth.oidc.tokenSource.file]\npath={}\n",serde_json::to_string(&file.to_string_lossy()).unwrap());
    let (p, t) = config::parse_toml(&source, "0.71.0", "source").unwrap();
    assert!(config::render_profile_toml(&p, &t, false).is_err());
    assert!(config::render_profile_toml(&p, &t, true).is_ok());
}

fn plugin_sources(directory: &std::path::Path) -> Vec<String> {
    let site_directory = directory.join("site");
    std::fs::create_dir_all(&site_directory).unwrap();
    let site_path = serde_json::to_string(&site_directory).unwrap();
    let socket_path = serde_json::to_string(&directory.join("app.sock")).unwrap();
    [
        "type='https2http'\nlocalAddr='127.0.0.1:8080'\nenableHTTP2=false".into(),
        "type='https2https'\nlocalAddr='[::1]:8443'\nenableHTTP2=true".into(),
        "type='http2http'\nlocalAddr='127.0.0.1:8080'".into(),
        "type='http2https'\nlocalAddr='127.0.0.1:8443'".into(),
        "type='http_proxy'\nhttpUser='user'\nhttpPassword='plugin-secret'".into(),
        "type='socks5'\nusername='user'\npassword='plugin-secret'".into(),
        format!("type='static_file'\nlocalPath={site_path}\nstripPrefix='/static'\nhttpPassword='plugin-secret'"),
        format!("type='unix_domain_socket'\nunixPath={socket_path}"),
        "type='tls2raw'\nlocalAddr='127.0.0.1:8080'".into(),
    ]
    .into_iter()
    .enumerate()
    .map(|(index, plugin)| format!("serverAddr='127.0.0.1'\n[[proxies]]\nname='plugin-{index}'\ntype='tcp'\nremotePort=0\n[proxies.plugin]\n{plugin}\n"))
    .collect()
}
#[test]
fn all_supported_plugins_preserve_fields_and_remove_unused_backend() {
    let directory = tempfile::tempdir().unwrap();
    for source in plugin_sources(directory.path()) {
        let (p, t) = config::parse_toml(&source, "0.71.0", "plugin").unwrap();
        let output = config::render_profile_toml(&p, &t, true).unwrap();
        assert!(!output.contains("localPort") && !output.contains("localIP"));
        let (_, again) = config::parse_toml(&output, "0.71.0", "plugin").unwrap();
        assert_eq!(t[0].advanced, again[0].advanced);
        let safe = config::render_profile_toml(&p, &t, false).unwrap();
        assert!(!safe.contains("plugin-secret"));
    }
}

#[tokio::test]
#[ignore = "requires official FRPC_TEST_BINARY"]
async fn official_frpc_verifies_advanced_and_all_nine_provider_plugins() -> Result<()> {
    let binary = std::path::PathBuf::from(std::env::var("FRPC_TEST_BINARY")?).canonicalize()?;
    let dir = tempfile::tempdir()?;
    let oidc="serverAddr='127.0.0.1'\n[auth]\nmethod='oidc'\n[auth.oidc]\nclientID='client'\nclientSecret='test-secret'\ntokenEndpointURL='https://issuer.example.test/token'";
    let token_file = dir.path().join("token.txt");
    std::fs::write(&token_file, "test-token")?;
    let token_path = serde_json::to_string(&token_file.to_string_lossy())?;
    let token_source = format!("serverAddr='127.0.0.1'\n[auth.tokenSource]\ntype='file'\n[auth.tokenSource.file]\npath={token_path}");
    let oidc_source = format!("serverAddr='127.0.0.1'\n[auth]\nmethod='oidc'\n[auth.oidc.tokenSource]\ntype='file'\n[auth.oidc.tokenSource.file]\npath={token_path}");
    let quic = "serverAddr='127.0.0.1'\n[transport]\nprotocol='quic'\n[transport.quic]\nkeepalivePeriod=5\nmaxIdleTimeout=10\nmaxIncomingStreams=100";
    for (index, source) in std::iter::once(COMMON.to_string())
        .chain(std::iter::once(oidc.to_string()))
        .chain([token_source, oidc_source, quic.into()])
        .chain(plugin_sources(dir.path()))
        .enumerate()
    {
        let (p, t) = config::parse_toml(&source, "0.71.0", "official")?;
        let path = dir.path().join(format!("advanced-{index}.toml"));
        std::fs::write(&path, config::render_profile_toml(&p, &t, true)?)?;
        verify_fixture(&binary, &path).await?;
    }
    Ok(())
}

async fn verify_fixture(binary: &std::path::Path, path: &std::path::Path) -> Result<()> {
    let mut command = tokio::process::Command::new(binary);
    command.arg("verify").arg("-c").arg(path).kill_on_drop(true);
    #[cfg(windows)]
    command.creation_flags(0x08000000);
    let output = tokio::time::timeout(std::time::Duration::from_secs(10), command.output())
        .await
        .context("Official verification timed out")??;
    ensure!(
        output.status.success(),
        "fixture {}: {} {}",
        path.display(),
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    Ok(())
}

#[tokio::test]
#[ignore = "requires SHA-verified official FRPC_TEST_LEGACY_BINARY version 0.52.0"]
async fn official_frpc_verifies_reviewed_052_baseline() -> Result<()> {
    let binary =
        std::path::PathBuf::from(std::env::var("FRPC_TEST_LEGACY_BINARY")?).canonicalize()?;
    let mut version_command = tokio::process::Command::new(&binary);
    version_command.arg("-v").kill_on_drop(true);
    #[cfg(windows)]
    version_command.creation_flags(0x08000000);
    let detected =
        tokio::time::timeout(std::time::Duration::from_secs(10), version_command.output())
            .await??;
    ensure!(
        detected.status.success() && String::from_utf8_lossy(&detected.stdout).trim() == "0.52.0",
        "Legacy verification requires frpc 0.52.0"
    );
    let dir = tempfile::tempdir()?;
    let (mut profile, mut tunnels) = config::parse_toml(COMMON, "0.71.0", "baseline")?;
    profile.version = "0.52.0".into();
    profile.advanced.remove("clientID");
    profile
        .advanced
        .get_mut("transport")
        .and_then(serde_json::Value::as_object_mut)
        .unwrap()
        .remove("wireProtocol");
    for tunnel in &mut tunnels {
        for field in ["annotations", "responseHeaders", "natTraversal"] {
            tunnel.advanced.remove(field);
        }
        if let Some(health) = tunnel
            .advanced
            .get_mut("healthCheck")
            .and_then(serde_json::Value::as_object_mut)
        {
            health.remove("httpHeaders");
        }
    }
    let mut rendered = vec![config::render_profile_toml(&profile, &tunnels, true)?];
    for source in plugin_sources(dir.path()) {
        let (mut p, mut t) = config::parse_toml(&source, "0.71.0", "plugin")?;
        let plugin = t[0]
            .advanced
            .get_mut("plugin")
            .and_then(serde_json::Value::as_object_mut)
            .unwrap();
        if ["http2http", "tls2raw"].contains(&plugin["type"].as_str().unwrap()) {
            continue;
        }
        plugin.remove("enableHTTP2");
        p.version = "0.52.0".into();
        rendered.push(config::render_profile_toml(&p, &t, true)?);
    }
    let mut protocols = "serverAddr='127.0.0.1'\n".to_string();
    for kind in [
        "tcp", "udp", "http", "https", "stcp", "sudp", "xtcp", "tcpmux",
    ] {
        protocols.push_str(&format!(
            "[[proxies]]\nname='provider-{kind}'\ntype='{kind}'\nlocalPort=8080\n"
        ));
        if ["http", "https", "tcpmux"].contains(&kind) {
            protocols.push_str("customDomains=['test.example.test']\n");
        }
    }
    for (index, kind) in ["stcp", "sudp", "xtcp"].into_iter().enumerate() {
        protocols.push_str(&format!("[[visitors]]\nname='visitor-{kind}'\ntype='{kind}'\nserverName='provider-{kind}'\nbindPort={}\n", 9000+index));
    }
    for source in [protocols.as_str(), "serverAddr='127.0.0.1'\n[auth]\nmethod='oidc'\n[auth.oidc]\nclientID='client'\nclientSecret='test-secret'\ntokenEndpointURL='https://issuer.example.test/token'", "serverAddr='127.0.0.1'\n[transport]\nprotocol='quic'\n[transport.quic]\nkeepalivePeriod=5\nmaxIdleTimeout=10\nmaxIncomingStreams=100"] {
        let (p, t) = config::parse_toml(source, "0.52.0", "baseline")?;
        rendered.push(config::render_profile_toml(&p, &t, true)?);
    }
    for (index, source) in rendered.into_iter().enumerate() {
        let path = dir.path().join(format!("baseline-{index}.toml"));
        std::fs::write(&path, source)?;
        verify_fixture(&binary, &path).await?;
    }
    // Capability refusal must happen before the legacy binary gets an unknown plugin.
    let source = "serverAddr='127.0.0.1'\n[[proxies]]\nname='newer'\ntype='tcp'\n[proxies.plugin]\ntype='http2http'\nlocalAddr='127.0.0.1:8080'";
    ensure!(
        config::parse_toml(source, "0.58.1", "unsupported").is_err(),
        "http2http leaked into a pre-0.59 configuration"
    );
    Ok(())
}
