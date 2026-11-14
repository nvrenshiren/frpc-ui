//! Validation of advanced profile and tunnel fields against the supported frpc schema.

use super::Object;
use crate::{
    config::{domain, host},
    model::*,
};
use anyhow::{bail, ensure, Context, Result};
use serde_json::{Map, Value};
use std::path::Path;
pub(crate) fn object<'a>(value: &'a Value, path: &str) -> Result<&'a Object> {
    value
        .as_object()
        .with_context(|| format!("{path} must be an object"))
}
fn keys(value: &Object, allowed: &[&str], path: &str) -> Result<()> {
    for key in value.keys() {
        ensure!(
            allowed.contains(&key.as_str()),
            "Unsupported field {path}.{key}"
        );
    }
    Ok(())
}
pub(crate) fn string<'a>(value: &'a Value, path: &str) -> Result<&'a str> {
    let text = value
        .as_str()
        .with_context(|| format!("{path} must be a string"))?;
    ensure!(
        text.len() <= 65536 && !text.contains('\0'),
        "{path} is too long or contains NUL"
    );
    Ok(text)
}
fn strings(value: &Value, path: &str) -> Result<()> {
    let values = value
        .as_array()
        .with_context(|| format!("{path} must be an array"))?;
    ensure!(values.len() <= 500, "{path} exceeds 500 entries");
    for text in values {
        string(text, path)?;
    }
    Ok(())
}
fn integer(value: &Value, path: &str, min: i64, max: i64) -> Result<i64> {
    let integer = value
        .as_i64()
        .with_context(|| format!("{path} must be an integer"))?;
    ensure!(
        (min..=max).contains(&integer),
        "{path} must be between {min} and {max}"
    );
    Ok(integer)
}
fn boolean(value: &Value, path: &str) -> Result<()> {
    ensure!(value.is_boolean(), "{path} must be boolean");
    Ok(())
}
fn choice(value: &Value, path: &str, values: &[&str]) -> Result<()> {
    ensure!(
        values.contains(&string(value, path)?),
        "Unsupported value for {path}"
    );
    Ok(())
}
fn string_map(value: &Value, path: &str) -> Result<()> {
    let map = object(value, path)?;
    ensure!(map.len() <= 500, "{path} exceeds 500 entries");
    let mut bytes = 0;
    for (key, value) in map {
        ensure!(
            !key.is_empty() && !key.chars().any(char::is_control),
            "{path} has an invalid key"
        );
        bytes += key.len() + string(value, path)?.len();
    }
    ensure!(bytes <= 256 * 1024, "{path} exceeds 256 KiB");
    Ok(())
}
fn path(value: &Value, key: &str, absolute: bool) -> Result<()> {
    let value = string(value, key)?;
    ensure!(
        !value.trim().is_empty() && !value.chars().any(char::is_control),
        "{key} requires a valid path"
    );
    ensure!(
        !absolute || Path::new(value).is_absolute(),
        "{key} requires an absolute path"
    );
    Ok(())
}
fn pair(value: &Object, first: &str, second: &str, label: &str) -> Result<()> {
    let first = value.get(first).and_then(Value::as_str).unwrap_or("");
    let second = value.get(second).and_then(Value::as_str).unwrap_or("");
    ensure!(
        first.is_empty() == second.is_empty(),
        "{label} certificate and private key must both be set or both omitted"
    );
    Ok(())
}
fn http_url(value: &Value, label: &str, proxy: bool) -> Result<()> {
    let text = string(value, label)?;
    if text.is_empty() {
        return Ok(());
    }
    let url = url::Url::parse(text).with_context(|| format!("Invalid {label}"))?;
    let schemes: &[&str] = if proxy {
        &["http", "https", "socks5"]
    } else {
        &["http", "https"]
    };
    ensure!(
        schemes.contains(&url.scheme())
            && url.host_str().is_some()
            && text
                .to_ascii_lowercase()
                .starts_with(&format!("{}://", url.scheme())),
        "{label} requires an absolute supported URL"
    );
    ensure!(
        proxy || (url.username().is_empty() && url.password().is_none()),
        "{label} cannot contain URL userinfo; use OIDC clientID/clientSecret"
    );
    Ok(())
}
fn header_name(value: &str) -> bool {
    !value.is_empty()
        && value
            .bytes()
            .all(|c| c.is_ascii_alphanumeric() || b"!#$%&'*+-.^_`|~".contains(&c))
}
fn headers(value: &Value, label: &str) -> Result<()> {
    let map = object(value, label)?;
    keys(map, &["set"], label)?;
    if let Some(set) = map.get("set") {
        string_map(set, label)?;
        for (name, value) in object(set, label)? {
            ensure!(
                header_name(name) && !string(value, label)?.contains(['\r', '\n']),
                "Invalid HTTP header in {label}"
            );
        }
    }
    Ok(())
}
fn tls(value: &Value, label: &str, client: bool) -> Result<()> {
    let map = object(value, label)?;
    keys(
        map,
        if client {
            &[
                "certFile",
                "keyFile",
                "trustedCaFile",
                "serverName",
                "disableCustomTLSFirstByte",
            ]
        } else {
            &["certFile", "keyFile", "trustedCaFile", "serverName"]
        },
        label,
    )?;
    for (key, value) in map {
        if key == "disableCustomTLSFirstByte" {
            boolean(value, label)?;
        } else {
            string(value, label)?;
        }
    }
    pair(map, "certFile", "keyFile", label)
}
fn token_source(value: &Value, label: &str) -> Result<()> {
    let map = object(value, label)?;
    keys(map, &["type", "file"], label)?;
    ensure!(
        map.get("type").and_then(Value::as_str) == Some("file"),
        "{label} supports only file sources; executing commands is not supported"
    );
    let file = object(
        map.get("file").context("Token source requires file.path")?,
        label,
    )?;
    keys(file, &["path"], label)?;
    path(
        file.get("path")
            .context("Token source requires file.path")?,
        label,
        true,
    )
}
fn oidc(value: &Value) -> Result<()> {
    let label = "advanced.auth.oidc";
    let map = object(value, label)?;
    keys(
        map,
        &[
            "clientID",
            "clientSecret",
            "audience",
            "scope",
            "tokenEndpointURL",
            "additionalEndpointParams",
            "trustedCaFile",
            "insecureSkipVerify",
            "proxyURL",
            "tokenSource",
        ],
        label,
    )?;
    for (key, value) in map {
        match key.as_str() {
            "tokenSource" => token_source(value, label)?,
            "insecureSkipVerify" => boolean(value, label)?,
            "additionalEndpointParams" => string_map(value, label)?,
            "tokenEndpointURL" => http_url(value, label, false)?,
            "proxyURL" => http_url(value, label, true)?,
            _ => {
                string(value, label)?;
            }
        }
    }
    if map.contains_key("tokenSource") {
        ensure!(
            map.iter().all(|(key, value)| key == "tokenSource"
                || value.as_str().is_some_and(str::is_empty)
                || value.as_object().is_some_and(Map::is_empty)
                || value == &Value::Bool(false)),
            "OIDC tokenSource is mutually exclusive with other nonempty OIDC fields"
        );
    } else {
        ensure!(
            map.get("clientID")
                .and_then(Value::as_str)
                .is_some_and(|v| !v.trim().is_empty()),
            "OIDC requires clientID"
        );
        ensure!(
            map.get("tokenEndpointURL")
                .and_then(Value::as_str)
                .is_some_and(|v| !v.trim().is_empty()),
            "OIDC requires tokenEndpointURL"
        );
    }
    if let Some(params) = map
        .get("additionalEndpointParams")
        .and_then(Value::as_object)
    {
        ensure!(
            !params.contains_key("scope"),
            "Use auth.oidc.scope instead of additionalEndpointParams.scope"
        );
        ensure!(
            !params.contains_key("audience")
                || map
                    .get("audience")
                    .and_then(Value::as_str)
                    .is_none_or(str::is_empty),
            "OIDC audience is specified twice"
        );
    }
    Ok(())
}

pub(crate) fn validate_profile_advanced(profile: &Profile) -> Result<()> {
    let map = &profile.advanced;
    let label = "advanced";
    keys(
        map,
        &[
            "clientID",
            "natHoleStunServer",
            "dnsServer",
            "udpPacketSize",
            "metadatas",
            "auth",
            "transport",
            "webServer",
        ],
        label,
    )?;
    for (key, value) in map {
        match key.as_str() {
            "udpPacketSize" => {
                integer(value, key, 0, 65535)?;
            }
            "metadatas" => string_map(value, key)?,
            "auth" => {
                let auth = object(value, "advanced.auth")?;
                keys(
                    auth,
                    &["method", "additionalScopes", "oidc", "tokenSource"],
                    "advanced.auth",
                )?;
                for (key, value) in auth {
                    match key.as_str() {
                        "method" => choice(value, "auth.method", &["token", "oidc"])?,
                        "additionalScopes" => {
                            strings(value, key)?;
                            for scope in value
                                .as_array()
                                .context("auth.additionalScopes must be an array")?
                            {
                                choice(scope, key, &["HeartBeats", "NewWorkConns"])?;
                            }
                        }
                        "oidc" => oidc(value)?,
                        "tokenSource" => token_source(value, key)?,
                        _ => bail!("Unsupported auth field {key}"),
                    }
                }
                let method = auth
                    .get("method")
                    .and_then(Value::as_str)
                    .unwrap_or("token");
                if method == "oidc" {
                    ensure!(
                        profile.auth_token.is_empty() && !auth.contains_key("tokenSource"),
                        "OIDC cannot be combined with a fixed token or auth.tokenSource"
                    );
                    ensure!(
                        auth.contains_key("oidc"),
                        "OIDC requires auth.oidc configuration"
                    );
                } else {
                    ensure!(!auth.contains_key("oidc"), "auth.oidc requires method=oidc");
                    ensure!(
                        !auth.contains_key("tokenSource") || profile.auth_token.is_empty(),
                        "Fixed token and tokenSource are mutually exclusive"
                    );
                }
            }
            "transport" => {
                let map = object(value, "advanced.transport")?;
                keys(
                    map,
                    &[
                        "wireProtocol",
                        "dialServerTimeout",
                        "dialServerKeepalive",
                        "connectServerLocalIP",
                        "proxyURL",
                        "poolCount",
                        "tcpMux",
                        "tcpMuxKeepaliveInterval",
                        "quic",
                        "heartbeatInterval",
                        "heartbeatTimeout",
                        "tls",
                    ],
                    "advanced.transport",
                )?;
                for (key, value) in map {
                    match key.as_str() {
                        "wireProtocol" => choice(value, key, &["v1", "v2"])?,
                        "tcpMux" => boolean(value, key)?,
                        "tls" => tls(value, "transport.tls", true)?,
                        "proxyURL" => {
                            http_url(value, key, true)?;
                            ensure!(
                                ["tcp", "websocket", "wss"].contains(&profile.transport.as_str())
                                    || string(value, key)?.is_empty(),
                                "proxyURL requires TCP or WebSocket transport"
                            );
                        }
                        "connectServerLocalIP" => {
                            let ip = string(value, key)?;
                            if !ip.is_empty() {
                                ensure!(
                                    ip.parse::<std::net::IpAddr>().is_ok(),
                                    "connectServerLocalIP requires an IP"
                                );
                                ensure!(
                                    ["tcp", "websocket", "wss"]
                                        .contains(&profile.transport.as_str()),
                                    "connectServerLocalIP requires TCP or WebSocket transport"
                                );
                            }
                        }
                        "quic" => {
                            ensure!(
                                profile.transport == "quic",
                                "QUIC options require QUIC transport"
                            );
                            let options = object(value, key)?;
                            keys(
                                options,
                                &["keepalivePeriod", "maxIdleTimeout", "maxIncomingStreams"],
                                key,
                            )?;
                            for (key, value) in options {
                                integer(value, key, 0, i32::MAX as i64)?;
                            }
                        }
                        "dialServerKeepalive" | "heartbeatInterval" | "heartbeatTimeout" => {
                            integer(value, key, i32::MIN as i64, i32::MAX as i64)?;
                        }
                        _ => {
                            integer(value, key, 0, i32::MAX as i64)?;
                        }
                    }
                }
                let interval = map
                    .get("heartbeatInterval")
                    .and_then(Value::as_i64)
                    .unwrap_or(0);
                let timeout = map
                    .get("heartbeatTimeout")
                    .and_then(Value::as_i64)
                    .unwrap_or(0);
                ensure!(
                    interval <= 0 || timeout <= 0 || timeout >= interval,
                    "Heartbeat timeout cannot be shorter than interval"
                );
            }
            "webServer" => {
                let map = object(value, "advanced.webServer")?;
                keys(
                    map,
                    &["user", "password", "assetsDir", "pprofEnable", "tls"],
                    "advanced.webServer",
                )?;
                for (key, value) in map {
                    match key.as_str() {
                        "pprofEnable" => boolean(value, key)?,
                        "tls" => tls(value, "webServer.tls", false)?,
                        _ => {
                            string(value, key)?;
                        }
                    }
                }
            }
            _ => {
                string(value, key)?;
            }
        }
    }
    Ok(())
}

pub(crate) fn validate_tunnel_advanced(t: &Tunnel) -> Result<()> {
    let map = &t.advanced;
    if t.role == TunnelRole::Visitor {
        keys(
            map,
            if t.tunnel_type == TunnelType::Xtcp {
                &[
                    "serverUser",
                    "bindPort",
                    "protocol",
                    "keepTunnelOpen",
                    "maxRetriesAnHour",
                    "minRetryInterval",
                    "fallbackTo",
                    "fallbackTimeoutMs",
                    "natTraversal",
                ]
            } else {
                &["serverUser", "bindPort"]
            },
            "advanced",
        )?;
        for (key, value) in map {
            match key.as_str() {
                "bindPort" => {
                    ensure!(
                        matches!(t.tunnel_type, TunnelType::Stcp | TunnelType::Xtcp)
                            && integer(value, key, -1, -1)? == -1,
                        "Negative bindPort requires STCP/XTCP visitor and value -1"
                    );
                }
                "protocol" => choice(value, key, &["quic", "kcp"])?,
                "keepTunnelOpen" => boolean(value, key)?,
                "maxRetriesAnHour" | "minRetryInterval" | "fallbackTimeoutMs" => {
                    integer(value, key, 0, i32::MAX as i64)?;
                }
                "natTraversal" => nat(value)?,
                _ => {
                    string(value, key)?;
                }
            }
        }
        return Ok(());
    }
    keys(
        map,
        &[
            "customDomains",
            "subdomain",
            "annotations",
            "metadatas",
            "transport",
            "loadBalancer",
            "healthCheck",
            "locations",
            "httpUser",
            "httpPassword",
            "hostHeaderRewrite",
            "requestHeaders",
            "responseHeaders",
            "routeByHTTPUser",
            "allowUsers",
            "natTraversal",
            "multiplexer",
            "plugin",
        ],
        "advanced",
    )?;
    for (key, value) in map {
        match key.as_str() {
            "annotations" | "metadatas" => string_map(value, key)?,
            "customDomains" => {
                ensure!(
                    t.tunnel_type.domain(),
                    "customDomains requires HTTP/HTTPS/TCPMUX"
                );
                strings(value, key)?;
                for value in value.as_array().context("customDomains must be an array")? {
                    domain(string(value, key)?)?;
                }
            }
            "subdomain" => {
                ensure!(
                    t.tunnel_type.domain(),
                    "subdomain requires HTTP/HTTPS/TCPMUX"
                );
                let s = string(value, key)?;
                if !s.is_empty() {
                    ensure!(
                        !s.contains(['.', '*']),
                        "subdomain cannot contain dots or wildcards"
                    );
                    host(s, key)?;
                }
            }
            "locations" => {
                ensure!(t.tunnel_type == TunnelType::Http, "locations requires HTTP");
                strings(value, key)?;
                let locations = value.as_array().context("locations must be an array")?;
                ensure!(
                    locations
                        .iter()
                        .all(|value| value.as_str().is_some_and(|value| value.starts_with('/'))),
                    "HTTP locations must be strings beginning with /"
                );
            }
            "httpUser" | "httpPassword" | "routeByHTTPUser" => {
                ensure!(
                    matches!(t.tunnel_type, TunnelType::Http | TunnelType::Tcpmux),
                    "HTTP authentication/routing requires HTTP/TCPMUX"
                );
                string(value, key)?;
            }
            "hostHeaderRewrite" | "requestHeaders" | "responseHeaders" => {
                ensure!(
                    t.tunnel_type == TunnelType::Http,
                    "HTTP header operations require HTTP"
                );
                if key == "hostHeaderRewrite" {
                    string(value, key)?;
                } else {
                    headers(value, key)?;
                }
            }
            "allowUsers" => {
                ensure!(
                    t.tunnel_type.private(),
                    "allowUsers requires a private provider"
                );
                strings(value, key)?;
            }
            "natTraversal" => {
                ensure!(
                    t.tunnel_type == TunnelType::Xtcp,
                    "natTraversal requires XTCP"
                );
                nat(value)?;
            }
            "multiplexer" => {
                ensure!(
                    t.tunnel_type == TunnelType::Tcpmux,
                    "multiplexer requires TCPMUX"
                );
                choice(value, key, &["httpconnect"])?;
            }
            "transport" => proxy_transport(value)?,
            "loadBalancer" => {
                ensure!(
                    matches!(
                        t.tunnel_type,
                        TunnelType::Tcp | TunnelType::Http | TunnelType::Https | TunnelType::Tcpmux
                    ),
                    "Load balancing requires TCP/HTTP/HTTPS/TCPMUX"
                );
                let map = object(value, key)?;
                keys(map, &["group", "groupKey"], key)?;
                for value in map.values() {
                    string(value, key)?;
                }
            }
            "healthCheck" => health(value)?,
            "plugin" => {
                ensure!(
                    !matches!(t.tunnel_type, TunnelType::Udp | TunnelType::Sudp),
                    "Provider plugins require a stream protocol"
                );
                ensure!(
                    !t.https2http,
                    "Use either legacy https2http or advanced.plugin"
                );
                plugin(value)?;
            }
            _ => bail!("Unsupported advanced tunnel field {key}"),
        }
    }
    Ok(())
}
fn nat(value: &Value) -> Result<()> {
    let map = object(value, "natTraversal")?;
    keys(map, &["disableAssistedAddrs"], "natTraversal")?;
    for value in map.values() {
        boolean(value, "natTraversal.disableAssistedAddrs")?;
    }
    Ok(())
}
fn proxy_transport(value: &Value) -> Result<()> {
    let map = object(value, "advanced.transport")?;
    keys(
        map,
        &[
            "bandwidthLimit",
            "bandwidthLimitMode",
            "proxyProtocolVersion",
        ],
        "advanced.transport",
    )?;
    for (key, value) in map {
        match key.as_str() {
            "bandwidthLimitMode" => choice(value, key, &["client", "server"])?,
            "proxyProtocolVersion" => choice(value, key, &["", "v1", "v2"])?,
            _ => {
                let text = string(value, key)?.trim();
                if !text.is_empty() {
                    let number = text
                        .strip_suffix("KB")
                        .or_else(|| text.strip_suffix("MB"))
                        .context("bandwidthLimit requires KB or MB units")?;
                    let amount: f64 = number.parse().context("Invalid bandwidthLimit")?;
                    ensure!(
                        amount.is_finite() && amount >= 0.0,
                        "Invalid bandwidthLimit"
                    );
                }
            }
        }
    }
    Ok(())
}
fn health(value: &Value) -> Result<()> {
    let map = object(value, "healthCheck")?;
    keys(
        map,
        &[
            "type",
            "timeoutSeconds",
            "maxFailed",
            "intervalSeconds",
            "path",
            "httpHeaders",
        ],
        "healthCheck",
    )?;
    for (key, value) in map {
        match key.as_str() {
            "type" => choice(value, key, &["", "tcp", "http"])?,
            "path" => {
                string(value, key)?;
            }
            "httpHeaders" => {
                let values = value
                    .as_array()
                    .context("healthCheck.httpHeaders must be an array")?;
                ensure!(values.len() <= 500, "Too many health check headers");
                for value in values {
                    let header = object(value, key)?;
                    keys(header, &["name", "value"], key)?;
                    let name = string(header.get("name").context("Header requires name")?, key)?;
                    let value = string(header.get("value").context("Header requires value")?, key)?;
                    ensure!(
                        header_name(name) && !value.contains(['\r', '\n']),
                        "Invalid health check header"
                    );
                }
            }
            _ => {
                integer(value, key, 0, i32::MAX as i64)?;
            }
        }
    }
    if map.get("type").and_then(Value::as_str) == Some("http") {
        ensure!(
            map.get("path")
                .and_then(Value::as_str)
                .is_some_and(|v| v.starts_with('/')),
            "HTTP health check requires a path beginning with /"
        );
    }
    Ok(())
}
fn plugin(value: &Value) -> Result<()> {
    let map = object(value, "plugin")?;
    let kind = map
        .get("type")
        .and_then(Value::as_str)
        .context("Plugin requires type")?;
    let allowed: &[&str] = match kind {
        "https2http" | "https2https" => &[
            "type",
            "localAddr",
            "crtPath",
            "keyPath",
            "hostHeaderRewrite",
            "requestHeaders",
            "enableHTTP2",
        ],
        "http2http" | "http2https" => &["type", "localAddr", "hostHeaderRewrite", "requestHeaders"],
        "http_proxy" => &["type", "httpUser", "httpPassword"],
        "socks5" => &["type", "username", "password"],
        "static_file" => &[
            "type",
            "localPath",
            "stripPrefix",
            "httpUser",
            "httpPassword",
        ],
        "unix_domain_socket" => &["type", "unixPath"],
        "tls2raw" => &["type", "localAddr", "crtPath", "keyPath"],
        "virtual_net" => bail!("virtual_net is not supported by this Windows desktop client"),
        _ => bail!("Unsupported plugin type"),
    };
    keys(map, allowed, "plugin")?;
    for (key, value) in map {
        match key.as_str() {
            "enableHTTP2" => boolean(value, key)?,
            "requestHeaders" => headers(value, key)?,
            "unixPath" => path(value, key, true)?,
            "localPath" => path(value, key, false)?,
            _ => {
                string(value, key)?;
            }
        }
    }
    if [
        "https2http",
        "https2https",
        "http2http",
        "http2https",
        "tls2raw",
    ]
    .contains(&kind)
    {
        let address = map.get("localAddr").context("Plugin requires localAddr")?;
        crate::config::local_address(string(address, "plugin.localAddr")?)?;
    }
    if kind == "static_file" {
        ensure!(
            map.contains_key("localPath"),
            "static_file requires localPath"
        );
    }
    if kind == "unix_domain_socket" {
        ensure!(
            map.contains_key("unixPath"),
            "unix_domain_socket requires unixPath"
        );
    }
    pair(map, "crtPath", "keyPath", "plugin")
}

pub(crate) fn merge(base: &mut Object, extension: &Object) {
    for (key, value) in extension {
        if let (Some(Value::Object(existing)), Value::Object(value)) = (base.get_mut(key), value) {
            merge(existing, value);
        } else {
            base.insert(key.clone(), value.clone());
        }
    }
}
