use frpc_core::{config, *};

fn profile() -> Profile {
    Profile {
        id: "profile-test".into(),
        name: "测试连接".into(),
        server_addr: "127.0.0.1".into(),
        server_port: 7000,
        version: "0.65.0".into(),
        process: ProcessStatus::Stopped,
        connection: ConnectionStatus::Unknown,
        auto_connect: false,
        pending: true,
        user: "test-user".into(),
        auth_token: "test-token".into(),
        web_port: 0,
        transport: "tcp".into(),
        tls: true,
        last_error: None,
        uptime: "—".into(),
        advanced: Default::default(),
    }
}
fn tunnel(kind: TunnelType) -> Tunnel {
    Tunnel {
        id: uuid::Uuid::new_v4().to_string(),
        name: format!("proxy-{kind:?}"),
        profile_id: "profile-test".into(),
        tunnel_type: kind,
        local_ip: "127.0.0.1".into(),
        local_port: 8080,
        local_port_end: 0,
        remote_port: 18080,
        remote_port_end: 0,
        domain: "example.test".into(),
        enabled: true,
        apply: ApplyStatus::Pending,
        role: TunnelRole::Provider,
        secret_key: "test-secret".into(),
        server_name: String::new(),
        encryption: true,
        compression: true,
        https2http: false,
        cert_path: String::new(),
        key_path: String::new(),
        advanced: Default::default(),
    }
}

#[test]
fn seven_protocols_and_visitors_round_trip_with_credentials() {
    let p = profile();
    let mut tunnels: Vec<_> = [
        TunnelType::Tcp,
        TunnelType::Udp,
        TunnelType::Http,
        TunnelType::Https,
        TunnelType::Stcp,
        TunnelType::Sudp,
        TunnelType::Xtcp,
    ]
    .into_iter()
    .map(tunnel)
    .collect();
    for kind in [TunnelType::Stcp, TunnelType::Sudp, TunnelType::Xtcp] {
        let mut visitor = tunnel(kind);
        visitor.name.push_str("-visitor");
        visitor.role = TunnelRole::Visitor;
        visitor.server_name = "provider".into();
        tunnels.push(visitor);
    }
    let toml = config::render_profile_toml(&p, &tunnels, true).unwrap();
    let (parsed, proxies) = config::parse_toml(&toml, &p.version, &p.name).unwrap();
    assert_eq!(parsed.auth_token, "test-token");
    assert_eq!(parsed.user, "test-user");
    assert_eq!(proxies.len(), 10);
    assert_eq!(
        proxies
            .iter()
            .filter(|t| t.role == TunnelRole::Visitor)
            .count(),
        3
    );
    assert!(proxies.iter().all(|t| t.encryption && t.compression));
    let safe = config::render_profile_toml(&p, &tunnels, false).unwrap();
    assert!(!safe.contains("test-token") && !safe.contains("test-secret"));
}

#[test]
fn ranges_expand_and_collisions_fail() {
    let mut t = tunnel(TunnelType::Tcp);
    t.local_port_end = 8082;
    t.remote_port_end = 18082;
    let toml = config::render_profile_toml(&profile(), &[t.clone()], true).unwrap();
    let (_, expanded) = config::parse_toml(&toml, "0.65.0", "test").unwrap();
    assert_eq!(expanded.len(), 3);
    assert_eq!(expanded[2].local_port, 8082);
    assert_eq!(expanded[2].remote_port, 18082);
    let mut collision = tunnel(TunnelType::Tcp);
    collision.name = format!("{}-8080", t.name);
    assert!(config::render_profile_toml(&profile(), &[t.clone(), collision], true).is_err());
    t.remote_port_end = 18084;
    assert!(config::validate_tunnel(&t).is_err());
}

#[test]
fn https_plugin_ipv6_round_trip_and_unsupported_fields_rejected() {
    let mut t = tunnel(TunnelType::Https);
    t.https2http = true;
    t.local_ip = "::1".into();
    t.cert_path = "C:\\certs\\site.crt".into();
    t.key_path = "C:\\certs\\site.key".into();
    let toml = config::render_profile_toml(&profile(), &[t], true).unwrap();
    let (_, parsed) = config::parse_toml(&toml, "0.65.0", "test").unwrap();
    assert_eq!(parsed[0].local_ip, "::1");
    assert_eq!(parsed[0].advanced["plugin"]["type"], "https2http");
    let mut invalid_plugin = parsed[0].clone();
    invalid_plugin.advanced["plugin"]
        .as_object_mut()
        .unwrap()
        .remove("crtPath");
    assert!(config::validate_tunnel(&invalid_plugin).is_err());
    assert!(config::parse_toml(
        "serverAddr = '127.0.0.1'\nincludes = ['secret.toml']",
        "0.65.0",
        "test"
    )
    .is_err());
    assert!(config::parse_toml(
        "serverAddr = '127.0.0.1'\n[transport.tls]\ncertFile = 'test.crt'",
        "0.65.0",
        "test"
    )
    .is_err());
    assert!(config::parse_toml(
        "serverAddr = '127.0.0.1'\n[webServer]\naddr = '0.0.0.0'\nport = 7400",
        "0.65.0",
        "test"
    )
    .is_err());
}

#[test]
fn exported_supervised_policy_round_trips_and_other_policies_fail() {
    let output = config::render_profile_toml(&profile(), &[], true).unwrap();
    let document: toml::Value = toml::from_str(&output).unwrap();
    assert_eq!(document["loginFailExit"].as_bool(), Some(false));
    assert_eq!(document["log"]["to"].as_str(), Some("console"));
    assert_eq!(document["log"]["level"].as_str(), Some("info"));
    assert_eq!(document["log"]["disablePrintColor"].as_bool(), Some(true));
    assert!(config::parse_toml(&output, "0.71.0", "imported").is_ok());
    for policy in [
        "loginFailExit = true",
        "loginFailExit = 'false'",
        "[log]\nto = 'frpc.log'\nlevel = 'info'\ndisablePrintColor = true",
        "[log]\nto = 'console'\nlevel = 'debug'\ndisablePrintColor = true",
        "[log]\nto = 'console'\nlevel = 'info'\ndisablePrintColor = false",
        "[log]\nto = 'console'\nlevel = 'info'\ndisablePrintColor = true\nmaxDays = 3",
        "[auth]\nadditionalScopes = ['UnsupportedScope']",
    ] {
        let source = format!("serverAddr = '127.0.0.1'\n{policy}");
        assert!(
            config::parse_toml(&source, "0.71.0", "imported").is_err(),
            "{policy}"
        );
    }
}

#[test]
fn empty_management_table_and_zero_port_preserve_disabled_management() {
    for settings in ["addr = '127.0.0.1'", "port = 0"] {
        let source = format!("serverAddr = '127.0.0.1'\n[webServer]\n{settings}");
        let (profile, tunnels) = config::parse_toml(&source, "0.71.0", "imported").unwrap();
        assert_eq!(profile.web_port, 0);
        let rendered = config::render_profile_toml(&profile, &tunnels, false).unwrap();
        let document: toml::Value = toml::from_str(&rendered).unwrap();
        assert!(document.get("webServer").is_none());
    }
}

#[test]
fn raw_ipv6_hosts_are_valid_but_ip_custom_domains_are_rejected() {
    let source = "serverAddr = '::1'\n[[proxies]]\nname = 'tcp'\ntype = 'tcp'\nlocalIP = '2001:db8::1'\nlocalPort = 8080\nremotePort = 18080";
    let (profile, tunnels) = config::parse_toml(source, "0.71.0", "imported").unwrap();
    assert_eq!(profile.server_addr, "::1");
    assert_eq!(tunnels[0].local_ip, "2001:db8::1");
    for domain in ["127.0.0.1", "*.127.0.0.1"] {
        let source = format!("serverAddr = '127.0.0.1'\n[[proxies]]\nname = 'http'\ntype = 'http'\nlocalPort = 80\ncustomDomains = ['{domain}']");
        assert!(config::parse_toml(&source, "0.71.0", "imported").is_err());
    }
}

#[test]
fn import_tunnel_limit_counts_providers_and_visitors_together() {
    let mut source = "serverAddr = '127.0.0.1'\n".to_owned();
    for index in 0..250 {
        source.push_str(&format!(
            "[[proxies]]\nname = 'tcp-{index}'\ntype = 'tcp'\nlocalPort = 8080\nremotePort = {}\n",
            18000 + index
        ));
    }
    for index in 0..250 {
        source.push_str(&format!("[[visitors]]\nname = 'visitor-{index}'\ntype = 'stcp'\nserverName = 'provider'\nbindPort = {}\n", 19000 + index));
    }
    assert_eq!(
        config::parse_toml(&source, "0.71.0", "imported")
            .unwrap()
            .1
            .len(),
        500
    );
    source.push_str("[[visitors]]\nname = 'visitor-extra'\ntype = 'stcp'\nserverName = 'provider'\nbindPort = 19999\n");
    assert!(config::parse_toml(&source, "0.71.0", "imported").is_err());
}

#[test]
#[ignore = "requires FRPC_TEST_BINARY official binary"]
fn official_frpc_verifies_all_supported_protocols() {
    let binary = std::path::PathBuf::from(std::env::var("FRPC_TEST_BINARY").unwrap())
        .canonicalize()
        .unwrap();
    let directory = tempfile::tempdir().unwrap();
    let p = profile();
    let mut tunnels: Vec<_> = [
        TunnelType::Tcp,
        TunnelType::Udp,
        TunnelType::Http,
        TunnelType::Https,
        TunnelType::Stcp,
        TunnelType::Sudp,
        TunnelType::Xtcp,
    ]
    .into_iter()
    .map(tunnel)
    .collect();
    for (index, kind) in [TunnelType::Stcp, TunnelType::Sudp, TunnelType::Xtcp]
        .into_iter()
        .enumerate()
    {
        let mut visitor = tunnel(kind);
        visitor.name.push_str("-visitor");
        visitor.role = TunnelRole::Visitor;
        visitor.server_name = "provider".into();
        visitor.local_port += index as u16 + 1;
        tunnels.push(visitor);
    }
    let path = directory.path().join("protocols.toml");
    std::fs::write(
        &path,
        config::render_profile_toml(&p, &tunnels, true).unwrap(),
    )
    .unwrap();
    let mut command = std::process::Command::new(binary);
    command.arg("verify").arg("-c").arg(path);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(0x08000000);
    }
    let output = command.output().unwrap();
    assert!(
        output.status.success(),
        "{} {}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
}

#[test]
fn atomic_state_preserves_credentials_and_resets_runtime() {
    let dir = tempfile::tempdir().unwrap();
    let manager = Manager::new(dir.path()).unwrap();
    assert!(manager.snapshot().profiles.is_empty());
    let mut p = profile();
    p.process = ProcessStatus::Running;
    p.connection = ConnectionStatus::Confirmed;
    manager.save_profile(p).unwrap();
    manager.save_tunnel(tunnel(TunnelType::Tcp)).unwrap();
    let mut settings = manager.snapshot().settings;
    settings.theme = "dark".into();
    manager.set_settings(settings).unwrap();
    let manager = Manager::new(dir.path()).unwrap();
    let state = manager.snapshot();
    assert_eq!(state.profiles[0].process, ProcessStatus::Stopped);
    assert_eq!(state.profiles[0].connection, ConnectionStatus::Unknown);
    assert_eq!(state.profiles[0].auth_token, "test-token");
    assert!(state.profiles[0].pending);
    assert_eq!(state.tunnels[0].apply, ApplyStatus::Pending);
    assert_eq!(state.settings.theme, "dark");
    let before = std::fs::read(dir.path().join("state.json")).unwrap();
    let mut invalid = state.profiles[0].clone();
    invalid.server_port = 0;
    assert!(manager.save_profile(invalid).is_err());
    assert_eq!(
        before,
        std::fs::read(dir.path().join("state.json")).unwrap()
    );
    std::fs::write(dir.path().join("state.json"), b"{broken}").unwrap();
    assert!(Manager::new(dir.path()).is_err());
    assert_eq!(
        std::fs::read(dir.path().join("state.json")).unwrap(),
        b"{broken}"
    );
}

#[test]
fn import_adds_fresh_ids_and_avoids_management_port_conflicts() {
    let dir = tempfile::tempdir().unwrap();
    let manager = Manager::new(dir.path()).unwrap();
    let mut p = profile();
    p.web_port = 7400;
    manager.save_profile(p.clone()).unwrap();
    manager
        .import_configuration(p, vec![tunnel(TunnelType::Tcp)])
        .unwrap();
    let state = manager.snapshot();
    assert_eq!(state.profiles.len(), 2);
    assert_ne!(state.profiles[0].id, state.profiles[1].id);
    assert_eq!(state.profiles[1].name, "测试连接 (2)");
    assert_eq!(state.profiles[1].web_port, 7401);
    assert_eq!(state.tunnels[0].profile_id, state.profiles[1].id);
}
