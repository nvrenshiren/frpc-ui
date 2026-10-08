//! Modern frpc TOML with explicitly validated extensions.
use crate::{
    advanced::{self, Object},
    model::*,
};
use anyhow::{ensure, Context, Result};
use serde_json::{json, Map, Value};
use std::{collections::HashSet, net::IpAddr};

pub fn validate_profile(p: &Profile) -> Result<()> {
    text(&p.id, "id")?;
    text(&p.name, "name")?;
    host(&p.server_addr, "serverAddr")?;
    ensure!(p.server_port != 0, "serverPort must be 1–65535");
    text(&p.version, "version")?;
    ensure!(
        ["tcp", "kcp", "quic", "websocket", "wss"].contains(&p.transport.as_str()),
        "Unsupported transport protocol"
    );
    advanced::validate_profile_advanced(p)
}
pub fn validate_tunnel(t: &Tunnel) -> Result<()> {
    text(&t.id, "id")?;
    text(&t.profile_id, "profileId")?;
    text(&t.name, "name")?;
    host(&t.local_ip, "localIP")?;
    ensure!(t.local_port != 0, "localPort must be 1–65535");
    advanced::validate_tunnel_advanced(t)?;
    if t.role == TunnelRole::Visitor {
        ensure!(
            t.tunnel_type.private(),
            "Only STCP, SUDP and XTCP support visitor mode"
        );
        text(&t.server_name, "serverName")?;
    } else if t.tunnel_type.domain() {
        let domains = if let Some(v) = t.advanced.get("customDomains") {
            v.as_array()
                .unwrap()
                .iter()
                .map(|v| v.as_str().unwrap())
                .collect::<Vec<_>>()
        } else if t.domain.is_empty() {
            vec![]
        } else {
            vec![t.domain.as_str()]
        };
        let sub = t
            .advanced
            .get("subdomain")
            .and_then(Value::as_str)
            .unwrap_or("");
        ensure!(
            !domains.is_empty() || !sub.is_empty(),
            "Provide custom domains or subdomain"
        );
        for v in domains {
            domain(v)?;
        }
    }
    if t.https2http {
        ensure!(
            t.role == TunnelRole::Provider && t.tunnel_type == TunnelType::Https,
            "https2http requires an HTTPS provider"
        );
        ensure!(
            t.cert_path.trim().is_empty() == t.key_path.trim().is_empty(),
            "HTTPS certificate and private key must both be set or both omitted"
        );
    }
    if t.local_port_end != 0 || t.remote_port_end != 0 {
        ensure!(
            t.role == TunnelRole::Provider && t.tunnel_type.public_port(),
            "Port ranges require a TCP/UDP provider"
        );
        ensure!(
            t.remote_port != 0
                && t.local_port_end >= t.local_port
                && t.remote_port_end >= t.remote_port,
            "Invalid port range; remotePort=0 cannot use a range"
        );
        let n = t.local_port_end as u32 - t.local_port as u32 + 1;
        ensure!(
            n <= 128 && n == t.remote_port_end as u32 - t.remote_port as u32 + 1,
            "Port ranges must have equal lengths of at most 128"
        );
    }
    Ok(())
}
pub fn validate_configuration(profiles: &[Profile], tunnels: &[Tunnel]) -> Result<()> {
    let (mut ids, mut names, mut ports) = (HashSet::new(), HashSet::new(), HashSet::new());
    for p in profiles {
        validate_profile(p)?;
        ensure!(ids.insert(p.id.as_str()), "Duplicate profile id");
        ensure!(names.insert(p.name.as_str()), "Duplicate connection name");
        ensure!(
            p.web_port == 0 || ports.insert(p.web_port),
            "Management port is already used by another connection"
        );
    }
    let (mut tids, mut tnames) = (HashSet::new(), HashSet::new());
    for t in tunnels {
        validate_tunnel(t)?;
        ensure!(
            ids.contains(t.profile_id.as_str()),
            "Tunnel references an unknown connection"
        );
        ensure!(tids.insert(t.id.as_str()), "Duplicate tunnel id");
        ensure!(
            tnames.insert((t.profile_id.as_str(), t.name.as_str())),
            "Duplicate tunnel name in connection"
        );
    }
    for p in profiles {
        render_runtime_toml(p, tunnels)?;
    }
    Ok(())
}
fn text(v: &str, k: &str) -> Result<()> {
    ensure!(
        !v.trim().is_empty() && v.len() <= 255 && !v.chars().any(char::is_control),
        "{k} must contain 1–255 printable characters"
    );
    Ok(())
}
pub(crate) fn host(v: &str, k: &str) -> Result<()> {
    text(v, k)?;
    if v.parse::<IpAddr>().is_ok() {
        return Ok(());
    }
    ensure!(
        !v.contains(':')
            && v.split('.').all(|s| !s.is_empty()
                && s.len() <= 63
                && !s.starts_with('-')
                && !s.ends_with('-')
                && s.bytes().all(|c| c.is_ascii_alphanumeric() || c == b'-')),
        "{k} must be an IP or hostname without scheme, port or path"
    );
    Ok(())
}
pub(crate) fn domain(v: &str) -> Result<()> {
    let v = v.strip_prefix("*.").unwrap_or(v);
    ensure!(
        v.contains('.') && v.parse::<IpAddr>().is_err(),
        "customDomains requires a hostname"
    );
    host(v, "customDomains")
}

/// Minima are independently verified against fixed official release tags.
pub fn validate_version_capabilities(p: &Profile, tunnels: &[Tunnel]) -> Result<()> {
    let version = p.version.strip_prefix('v').unwrap_or(&p.version);
    ensure!(
        version.len() <= 32
            && version.bytes().all(|b| b.is_ascii_digit() || b == b'.')
            && version
                .split('.')
                .all(|p| p.len() == 1 || !p.starts_with('0')),
        "frpc version requires major.minor.patch"
    );
    let v: Vec<_> = version
        .split('.')
        .map(str::parse::<u64>)
        .collect::<std::result::Result<_, _>>()
        .context("frpc version requires major.minor.patch")?;
    ensure!(v.len() == 3, "frpc version requires major.minor.patch");
    ensure!(
        (v[0], v[1], v[2]) >= (0, 52, 0),
        "Modern TOML requires frpc >= 0.52.0"
    );
    ensure!(
        v[0] == 0 && v[1] <= 71,
        "frpc configuration capabilities are audited only for 0.52–0.71; update the capability list before using this version"
    );
    let gate = |used: bool, min: u64, key: &str| -> Result<()> {
        ensure!(
            !used || (v[0], v[1], v[2]) >= (0, min, 0),
            "{key} requires frpc >= 0.{min}.0"
        );
        Ok(())
    };
    let a = &p.advanced;
    gate(a.contains_key("clientID"), 67, "clientID")?;
    gate(
        a.get("transport")
            .and_then(|v| v.get("wireProtocol"))
            .is_some(),
        69,
        "transport.wireProtocol",
    )?;
    gate(
        a.get("auth").and_then(|v| v.get("tokenSource")).is_some(),
        64,
        "auth.tokenSource",
    )?;
    if let Some(o) = a
        .get("auth")
        .and_then(|v| v.get("oidc"))
        .and_then(Value::as_object)
    {
        gate(
            ["trustedCaFile", "insecureSkipVerify", "proxyURL"]
                .iter()
                .any(|k| o.contains_key(*k)),
            65,
            "OIDC TLS/proxy options",
        )?;
        gate(o.contains_key("tokenSource"), 66, "auth.oidc.tokenSource")?;
    }
    for t in tunnels.iter().filter(|t| t.profile_id == p.id && t.enabled) {
        let a = &t.advanced;
        gate(a.contains_key("annotations"), 55, "annotations")?;
        gate(
            a.get("healthCheck")
                .and_then(|v| v.get("httpHeaders"))
                .is_some(),
            56,
            "healthCheck.httpHeaders",
        )?;
        gate(a.contains_key("responseHeaders"), 58, "responseHeaders")?;
        gate(a.contains_key("natTraversal"), 65, "natTraversal")?;
        if let Some(o) = a.get("plugin").and_then(Value::as_object) {
            gate(o.contains_key("enableHTTP2"), 59, "plugin.enableHTTP2")?;
            gate(
                o.get("type").and_then(Value::as_str) == Some("http2http"),
                59,
                "http2http",
            )?;
            gate(
                o.get("type").and_then(Value::as_str) == Some("tls2raw"),
                60,
                "tls2raw",
            )?;
        }
    }
    Ok(())
}
pub fn render_profile_toml(p: &Profile, tunnels: &[Tunnel], credentials: bool) -> Result<String> {
    render(p, tunnels, credentials, true)
}
pub(crate) fn render_runtime_toml(p: &Profile, tunnels: &[Tunnel]) -> Result<String> {
    render(p, tunnels, true, false)
}
fn render(p: &Profile, tunnels: &[Tunnel], credentials: bool, exchange: bool) -> Result<String> {
    validate_profile(p)?;
    validate_version_capabilities(p, tunnels)?;
    if !credentials {
        ensure!(p.advanced.get("auth").and_then(|v|v.get("oidc")).and_then(|v|v.get("tokenSource")).is_none(),"OIDC token-source-only export requires including credentials or supplying client parameters");
    }
    let mut config=json!({"serverAddr":p.server_addr,"serverPort":p.server_port,"transport":{"protocol":p.transport,"tls":{"enable":p.tls}},"loginFailExit":false,"log":{"to":"console","level":"info","disablePrintColor":true}}).as_object().unwrap().clone();
    if !p.user.is_empty() {
        config.insert("user".into(), json!(p.user));
    }
    if credentials && !p.auth_token.is_empty() {
        config.insert("auth".into(), json!({"token":p.auth_token}));
    }
    if p.web_port != 0 || p.advanced.contains_key("webServer") {
        config.insert(
            "webServer".into(),
            json!({"addr":"127.0.0.1","port":p.web_port}),
        );
    }
    advanced::merge(
        &mut config,
        &if credentials {
            p.advanced.clone()
        } else {
            advanced::without_credentials(&p.advanced)
        },
    );
    let (mut proxies, mut visitors, mut names) = (vec![], vec![], HashSet::new());
    for t in tunnels.iter().filter(|t| t.profile_id == p.id && t.enabled) {
        validate_tunnel(t)?;
        let ext = if credentials {
            t.advanced.clone()
        } else {
            advanced::without_credentials(&t.advanced)
        };
        let count = if t.local_port_end == 0 {
            1
        } else {
            t.local_port_end as u32 - t.local_port as u32 + 1
        };
        for offset in 0..count {
            let name = if count > 1 {
                format!("{}-{}", t.name, t.local_port as u32 + offset)
            } else {
                t.name.clone()
            };
            ensure!(names.insert(name.clone()), "Generated tunnel names collide");
            let mut item=json!({"name":name,"type":t.tunnel_type,"transport":{"useEncryption":t.encryption,"useCompression":t.compression}}).as_object().unwrap().clone();
            if credentials && t.tunnel_type.private() && !t.secret_key.is_empty() {
                item.insert("secretKey".into(), json!(t.secret_key));
            }
            if t.role == TunnelRole::Visitor {
                item.insert("serverName".into(), json!(t.server_name));
                item.insert("bindAddr".into(), json!(t.local_ip));
                item.insert("bindPort".into(), json!(t.local_port));
                advanced::merge(&mut item, &ext);
                visitors.push(Value::Object(item));
                continue;
            }
            if t.https2http {
                let ip = if t.local_ip.contains(':') {
                    format!("[{}]", t.local_ip)
                } else {
                    t.local_ip.clone()
                };
                let mut plugin =
                    json!({"type":"https2http","localAddr":format!("{ip}:{}",t.local_port)})
                        .as_object()
                        .unwrap()
                        .clone();
                if !t.cert_path.is_empty() {
                    plugin.insert("crtPath".into(), json!(t.cert_path));
                    plugin.insert("keyPath".into(), json!(t.key_path));
                }
                item.insert("plugin".into(), Value::Object(plugin));
            } else if !ext.contains_key("plugin") {
                item.insert("localIP".into(), json!(t.local_ip));
                item.insert("localPort".into(), json!(t.local_port as u32 + offset));
            }
            if t.tunnel_type == TunnelType::Tcpmux {
                item.insert("multiplexer".into(), json!("httpconnect"));
            }
            if t.tunnel_type.public_port() {
                item.insert("remotePort".into(), json!(t.remote_port as u32 + offset));
            }
            if t.tunnel_type.domain() && !ext.contains_key("customDomains") && !t.domain.is_empty()
            {
                item.insert("customDomains".into(), json!([t.domain]));
            }
            advanced::merge(&mut item, &ext);
            proxies.push(Value::Object(item));
        }
    }
    ensure!(
        !exchange || proxies.len() + visitors.len() <= 500,
        "Configuration exchange supports at most 500 expanded tunnels"
    );
    if !proxies.is_empty() {
        config.insert("proxies".into(), Value::Array(proxies));
    }
    if !visitors.is_empty() {
        config.insert("visitors".into(), Value::Array(visitors));
    }
    let output = toml::to_string_pretty(&config).context("Cannot serialize frpc configuration")?;
    ensure!(
        !exchange || output.len() <= 1024 * 1024,
        "Configuration exchange cannot exceed 1 MiB"
    );
    Ok(output)
}
fn pop_string(m: &mut Object, k: &str, d: &str) -> Result<String> {
    match m.remove(k) {
        None => Ok(d.into()),
        Some(v) => Ok(advanced::string(&v, k)?.into()),
    }
}
fn pop_bool(m: &mut Object, k: &str, d: bool) -> Result<bool> {
    match m.remove(k) {
        None => Ok(d),
        Some(v) => v.as_bool().with_context(|| format!("{k} must be boolean")),
    }
}
fn pop_port(m: &mut Object, k: &str, d: u16, zero: bool) -> Result<u16> {
    let v = m
        .remove(k)
        .map(|v| {
            v.as_u64()
                .with_context(|| format!("{k} must be an integer"))
        })
        .transpose()?
        .unwrap_or(d as u64);
    ensure!(
        v <= 65535 && (zero || v != 0),
        "{k} must be {}–65535",
        if zero { 0 } else { 1 }
    );
    Ok(v as u16)
}
fn pop_object(m: &mut Object, k: &str) -> Result<Object> {
    match m.remove(k) {
        None => Ok(Map::new()),
        Some(v) => Ok(advanced::object(&v, k)?.clone()),
    }
}
fn array(m: &mut Object, k: &str) -> Result<Vec<Value>> {
    match m.remove(k) {
        None => Ok(vec![]),
        Some(Value::Array(v)) => Ok(v),
        _ => Err(anyhow::anyhow!("{k} must be an array")),
    }
}
fn preserve(m: &mut Object, k: &str, v: Object) {
    if !v.is_empty() {
        m.insert(k.into(), Value::Object(v));
    }
}
fn reject_datetime(v: &toml::Value) -> Result<()> {
    match v {
        toml::Value::Datetime(_) => anyhow::bail!("Datetime values are not supported"),
        toml::Value::Table(m) => {
            for v in m.values() {
                reject_datetime(v)?
            }
        }
        toml::Value::Array(a) => {
            for v in a {
                reject_datetime(v)?
            }
        }
        _ => (),
    }
    Ok(())
}
/// Import keeps exact advanced values and creates fresh identifiers.
pub fn parse_toml(source: &str, version: &str, name: &str) -> Result<(Profile, Vec<Tunnel>)> {
    ensure!(
        !source.trim().is_empty() && source.len() <= 1024 * 1024,
        "Configuration must contain 1 byte to 1 MiB"
    );
    let value: toml::Value = toml::from_str(source).context("Invalid frpc TOML")?;
    reject_datetime(&value)?;
    let mut root = serde_json::to_value(value)?
        .as_object()
        .context("Configuration must be a table")?
        .clone();
    let proxies = array(&mut root, "proxies")?;
    let visitors = array(&mut root, "visitors")?;
    ensure!(
        proxies.len() + visitors.len() <= 500,
        "At most 500 tunnels are supported"
    );
    let mut auth = pop_object(&mut root, "auth")?;
    let auth_token = pop_string(&mut auth, "token", "")?;
    let mut transport = pop_object(&mut root, "transport")?;
    let protocol = pop_string(&mut transport, "protocol", "tcp")?;
    let mut tls = pop_object(&mut transport, "tls")?;
    let enable = pop_bool(&mut tls, "enable", true)?;
    preserve(&mut transport, "tls", tls);
    let mut web = pop_object(&mut root, "webServer")?;
    ensure!(
        pop_string(&mut web, "addr", "127.0.0.1")? == "127.0.0.1",
        "Management address must be 127.0.0.1"
    );
    let web_port = pop_port(&mut web, "port", 0, true)?;
    if let Some(v) = root.remove("loginFailExit") {
        ensure!(v == Value::Bool(false), "loginFailExit must be false");
    }
    if let Some(v) = root.remove("log") {
        let mut m = advanced::object(&v, "log")?.clone();
        ensure!(
            pop_string(&mut m, "to", "console")? == "console"
                && pop_string(&mut m, "level", "info")? == "info"
                && pop_bool(&mut m, "disablePrintColor", true)?,
            "Only supervised console info logging without color is supported"
        );
        ensure!(m.is_empty(), "Unsupported log field");
    }
    let mut p = Profile {
        id: format!("profile-{}", uuid::Uuid::new_v4()),
        name: name.into(),
        server_addr: pop_string(&mut root, "serverAddr", "")?,
        server_port: pop_port(&mut root, "serverPort", 7000, false)?,
        version: version.into(),
        process: ProcessStatus::Stopped,
        connection: ConnectionStatus::Unknown,
        auto_connect: false,
        pending: true,
        user: pop_string(&mut root, "user", "")?,
        auth_token,
        web_port,
        transport: protocol,
        tls: enable,
        last_error: None,
        uptime: "—".into(),
        advanced: root,
    };
    preserve(&mut p.advanced, "auth", auth);
    preserve(&mut p.advanced, "transport", transport);
    preserve(&mut p.advanced, "webServer", web);
    let mut tunnels = vec![];
    for (role, entries) in [
        (TunnelRole::Provider, proxies),
        (TunnelRole::Visitor, visitors),
    ] {
        for value in entries {
            let mut item = advanced::object(&value, "tunnel")?.clone();
            let tunnel_type: TunnelType =
                serde_json::from_value(item.remove("type").context("Tunnel requires type")?)
                    .context("Unsupported tunnel type")?;
            let mut transport = pop_object(&mut item, "transport")?;
            let encryption = pop_bool(&mut transport, "useEncryption", false)?;
            let compression = pop_bool(&mut transport, "useCompression", false)?;
            let name = pop_string(&mut item, "name", "")?;
            let has_secret_key = item.contains_key("secretKey");
            let secret_key = pop_string(&mut item, "secretKey", "")?;
            ensure!(
                !has_secret_key || tunnel_type.private(),
                "secretKey requires a private tunnel"
            );
            let enabled = pop_bool(&mut item, "enabled", true)?;
            let (
                local_ip,
                local_port,
                remote_port,
                server_name,
                domain,
                https2http,
                cert_path,
                key_path,
            ) = if role == TunnelRole::Visitor {
                let bind = item
                    .remove("bindPort")
                    .context("Visitor requires bindPort")?;
                let bind = bind.as_i64().context("bindPort must be integer")?;
                ensure!(
                    bind == -1 || (1..=65535).contains(&bind),
                    "Invalid visitor bindPort"
                );
                if bind == -1 {
                    item.insert("bindPort".into(), json!(-1));
                }
                (
                    pop_string(&mut item, "bindAddr", "127.0.0.1")?,
                    if bind < 0 { 8080 } else { bind as u16 },
                    0,
                    pop_string(&mut item, "serverName", "")?,
                    String::new(),
                    false,
                    String::new(),
                    String::new(),
                )
            } else {
                ensure!(
                    !item.contains_key("remotePort") || tunnel_type.public_port(),
                    "remotePort requires TCP/UDP"
                );
                let remote = if tunnel_type.public_port() {
                    pop_port(&mut item, "remotePort", 0, true)?
                } else {
                    0
                };
                let domain = item
                    .get("customDomains")
                    .and_then(Value::as_array)
                    .and_then(|a| a.first())
                    .and_then(Value::as_str)
                    .unwrap_or("")
                    .into();
                let plugin = item
                    .get("plugin")
                    .map(|v| advanced::object(v, "plugin").cloned())
                    .transpose()?;
                if let Some(plugin) = plugin {
                    ensure!(
                        !item.contains_key("localIP") && !item.contains_key("localPort"),
                        "Plugin configuration must not also specify localIP/localPort"
                    );
                    let a = plugin
                        .get("localAddr")
                        .and_then(Value::as_str)
                        .map(local_address)
                        .transpose()?
                        .unwrap_or(("127.0.0.1".into(), 8080));
                    let legacy = false;
                    let cert = plugin
                        .get("crtPath")
                        .and_then(Value::as_str)
                        .unwrap_or("")
                        .into();
                    let key = plugin
                        .get("keyPath")
                        .and_then(Value::as_str)
                        .unwrap_or("")
                        .into();
                    if legacy {
                        item.remove("plugin");
                    }
                    (a.0, a.1, remote, String::new(), domain, legacy, cert, key)
                } else {
                    (
                        pop_string(&mut item, "localIP", "127.0.0.1")?,
                        pop_port(&mut item, "localPort", 0, false)?,
                        remote,
                        String::new(),
                        domain,
                        false,
                        String::new(),
                        String::new(),
                    )
                }
            };
            preserve(&mut item, "transport", transport);
            tunnels.push(Tunnel {
                id: format!("tunnel-{}", uuid::Uuid::new_v4()),
                name,
                profile_id: p.id.clone(),
                tunnel_type,
                local_ip,
                local_port,
                local_port_end: 0,
                remote_port,
                remote_port_end: 0,
                domain,
                enabled,
                apply: ApplyStatus::Pending,
                role: role.clone(),
                secret_key,
                server_name,
                encryption,
                compression,
                https2http,
                cert_path,
                key_path,
                advanced: item,
            });
        }
    }
    validate_configuration(std::slice::from_ref(&p), &tunnels)?;
    Ok((p, tunnels))
}
pub(crate) fn local_address(v: &str) -> Result<(String, u16)> {
    let (ip, port) = if v.starts_with('[') {
        let (ip, rest) = v
            .split_once("]:")
            .context("Bracket IPv6 plugin.localAddr")?;
        (ip.trim_start_matches('['), rest)
    } else {
        let (ip, port) = v
            .rsplit_once(':')
            .context("plugin.localAddr requires host:port")?;
        ensure!(!ip.contains(':'), "Bracket IPv6 plugin.localAddr");
        (ip, port)
    };
    host(ip, "plugin.localAddr")?;
    let port: u16 = port.parse().context("Invalid plugin.localAddr port")?;
    ensure!(port != 0, "plugin.localAddr port must be 1–65535");
    Ok((ip.into(), port))
}
