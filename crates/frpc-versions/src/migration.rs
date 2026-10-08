//! Read-only, explicit migration preview of the old application's NeDB logs.
//! Preserve supported advanced configuration; unknown fields block import.
use anyhow::{bail, Context, Result};
use serde::Serialize;
use serde_json::{json, Map, Value};
use sha2::{Digest, Sha256};
use std::{collections::BTreeMap, fs, io::Read, path::Path};

const MAX_DB_BYTES: u64 = 16 * 1024 * 1024;
const MAX_LINE_BYTES: usize = 512 * 1024;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MigrationPreview {
    pub profiles: Vec<Value>,
    pub tunnels: Vec<Value>,
    pub issues: Vec<String>,
    pub warnings: Vec<String>,
    pub can_import: bool,
    pub source_fingerprint: String,
}

/// No default old user-data path is searched. The caller must explicitly select
/// the legacy database directory and an already installed modern frpc version.
pub fn preview_legacy(
    data_dir: impl AsRef<Path>,
    selected_version: &str,
) -> Result<MigrationPreview> {
    crate::valid_version(selected_version)?;
    let server_bytes = read_database(&data_dir.as_ref().join("server-v2.db"))?;
    let proxy_bytes = read_database(&data_dir.as_ref().join("proxy-v2.db"))?;
    let mut hasher = Sha256::new();
    hasher.update((server_bytes.len() as u64).to_le_bytes());
    hasher.update(&server_bytes);
    hasher.update((proxy_bytes.len() as u64).to_le_bytes());
    hasher.update(&proxy_bytes);
    let source_fingerprint = format!("{:x}", hasher.finalize());
    let servers = replay(&server_bytes, "server-v2.db")?;
    let proxies = replay(&proxy_bytes, "proxy-v2.db")?;
    let mut preview = MigrationPreview {
        profiles: vec![], tunnels: vec![], issues: vec![],
        warnings: vec!["旧项目的自动连接、系统启动与静默启动偏好不自动启用；迁移连接保持停止，使用明确选择的已安装 frpc 版本。".into(),
                       "旧日志及进程重连采用新应用管理策略；导入不会覆盖或修改旧数据库。".into(),
                       "连接与隧道已启用的高级配置保留原值；所选 frpc 版本仍须通过配置校验，应用继续接管日志与登录重试。".into(),
                       "旧界面未启用 HTTP BasicAuth 时缓存的用户名与密码不激活；空域名占位等未使用的表单默认项不会写入运行配置。".into()],
        can_import: false, source_fingerprint,
    };
    if servers.len() != 1 {
        preview.issues.push(format!(
            "旧单连接项目应有唯一服务器配置，当前有效记录数为 {}。",
            servers.len()
        ));
        return Ok(preview);
    }
    let server = servers.into_values().next().unwrap();
    let server = server.as_object().context("旧服务器记录不是对象")?;
    let server_id = required_string(server, "_id")?;
    let profile_id = stable_id("legacy-profile", &server_id);
    check_keys(
        server,
        &[
            "_id",
            "createdAt",
            "updatedAt",
            "multiuser",
            "frpcVersion",
            "loginFailExit",
            "udpPacketSize",
            "clientID",
            "natHoleStunServer",
            "dnsServer",
            "serverAddr",
            "serverPort",
            "user",
            "auth",
            "log",
            "transport",
            "metadatas",
            "webServer",
            "system",
        ],
        "server",
        &mut preview.issues,
    );
    check_defaults(
        server,
        &json!({"loginFailExit":false}),
        "server",
        &mut preview.issues,
    );
    let auth = object(server, "auth")?;
    check_keys(
        &auth,
        &["method", "token", "additionalScopes", "oidc", "tokenSource"],
        "server.auth",
        &mut preview.issues,
    );
    let method = string(&auth, "method", "")?;
    if !["", "token", "none", "oidc"].contains(&method.as_str()) {
        preview
            .issues
            .push("server.auth.method：不支持的认证方式。".into());
    }
    let transport = object(server, "transport")?;
    check_keys(
        &transport,
        &[
            "dialServerTimeout",
            "dialServerKeepalive",
            "poolCount",
            "tcpMux",
            "tcpMuxKeepaliveInterval",
            "protocol",
            "connectServerLocalIP",
            "proxyURL",
            "tls",
            "heartbeatInterval",
            "heartbeatTimeout",
            "wireProtocol",
            "quic",
        ],
        "server.transport",
        &mut preview.issues,
    );
    let tls = object(&transport, "tls")?;
    check_keys(
        &tls,
        &[
            "enable",
            "certFile",
            "keyFile",
            "trustedCaFile",
            "serverName",
            "disableCustomTLSFirstByte",
        ],
        "server.transport.tls",
        &mut preview.issues,
    );
    let log = object(server, "log")?;
    check_keys(
        &log,
        &["to", "level", "maxDays", "disablePrintColor"],
        "server.log",
        &mut preview.issues,
    );
    check_defaults(
        &log,
        &json!({"to":"","level":"info","maxDays":3,"disablePrintColor":false}),
        "server.log",
        &mut preview.issues,
    );
    let metadata = object(server, "metadatas")?;
    if metadata.values().any(|value| !value.is_string()) {
        preview
            .issues
            .push("server.metadatas：元数据值必须是字符串。".into());
    }
    let web = object(server, "webServer")?;
    check_keys(
        &web,
        &[
            "addr",
            "port",
            "user",
            "password",
            "pprofEnable",
            "assetsDir",
            "tls",
        ],
        "server.webServer",
        &mut preview.issues,
    );
    check_defaults(
        &web,
        &json!({"addr":"127.0.0.1"}),
        "server.webServer",
        &mut preview.issues,
    );
    let system = object(server, "system")?;
    check_keys(
        &system,
        &[
            "launchAtStartup",
            "silentStartup",
            "autoConnectOnStartup",
            "language",
        ],
        "server.system",
        &mut preview.issues,
    );
    let address = required_string(server, "serverAddr")?;
    let mut advanced = selected_fields(
        server,
        &[
            "clientID",
            "natHoleStunServer",
            "dnsServer",
            "udpPacketSize",
        ],
    );
    if !metadata.is_empty() && metadata.values().any(|value| value.as_str() != Some("")) {
        advanced.insert("metadatas".into(), Value::Object(metadata));
    }
    let mut advanced_auth = selected_fields(&auth, &["additionalScopes", "oidc", "tokenSource"]);
    if method == "oidc" {
        advanced_auth.insert("method".into(), json!("oidc"));
    }
    insert_object(&mut advanced, "auth", advanced_auth);
    let mut advanced_transport = selected_fields(
        &transport,
        &[
            "dialServerTimeout",
            "dialServerKeepalive",
            "poolCount",
            "tcpMux",
            "tcpMuxKeepaliveInterval",
            "connectServerLocalIP",
            "proxyURL",
            "heartbeatInterval",
            "heartbeatTimeout",
            "wireProtocol",
            "quic",
        ],
    );
    insert_object(
        &mut advanced_transport,
        "tls",
        selected_fields(
            &tls,
            &[
                "certFile",
                "keyFile",
                "trustedCaFile",
                "serverName",
                "disableCustomTLSFirstByte",
            ],
        ),
    );
    insert_object(&mut advanced, "transport", advanced_transport);
    insert_object(
        &mut advanced,
        "webServer",
        selected_fields(
            &web,
            &["user", "password", "pprofEnable", "assetsDir", "tls"],
        ),
    );
    preview.profiles.push(json!({
        "id":profile_id,"name":format!("迁移 · {address}"),"serverAddr":address,
        "serverPort":port(server.get("serverPort"),7000)?,"version":selected_version,
        "process":"stopped","connection":"unknown","autoConnect":false,"pending":true,
        "user":string(server,"user","")?,"authToken":if method == "none" || method == "oidc" {String::new()} else {string(&auth,"token","")?},
        "webPort":port(web.get("port"),0)?,"transport":string(&transport,"protocol","tcp")?,
        "tls":boolean(&tls,"enable",true)?,"lastError":null,"uptime":"—","advanced":advanced
    }));
    for proxy in proxies.into_values() {
        let proxy = proxy.as_object().context("旧隧道记录不是对象")?;
        preview
            .tunnels
            .extend(convert_proxy(proxy, &profile_id, &mut preview.issues)?);
    }
    preview.can_import = preview.issues.is_empty();
    Ok(preview)
}

fn read_database(path: &Path) -> Result<Vec<u8>> {
    let metadata = fs::symlink_metadata(path).with_context(|| {
        format!(
            "无法读取 {}，请选择旧数据库目录",
            path.file_name().unwrap_or_default().to_string_lossy()
        )
    })?;
    if !metadata.is_file() || metadata.file_type().is_symlink() || metadata.len() > MAX_DB_BYTES {
        bail!("旧数据库必须为大小不超过 16 MiB 的普通文件");
    }
    let mut bytes = Vec::new();
    fs::File::open(path)?
        .take(MAX_DB_BYTES + 1)
        .read_to_end(&mut bytes)?;
    if bytes.len() as u64 > MAX_DB_BYTES {
        bail!("旧数据库读取时超过大小限制");
    }
    Ok(bytes)
}

/// NeDB writes replacements and tombstones, rather than a JSON array. Replay
/// must process every line in order; the last valid record for each id wins.
fn replay(bytes: &[u8], filename: &str) -> Result<BTreeMap<String, Value>> {
    let text = std::str::from_utf8(bytes).with_context(|| format!("{filename} 不是 UTF-8"))?;
    let mut records = BTreeMap::new();
    for (index, line) in text.lines().enumerate() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        if line.len() > MAX_LINE_BYTES {
            bail!("{filename} 第 {} 行超过大小限制", index + 1);
        }
        let value: Value = serde_json::from_str(line)
            .with_context(|| format!("{filename} 第 {} 行 JSON 损坏", index + 1))?;
        let object = value
            .as_object()
            .with_context(|| format!("{filename} 第 {} 行不是对象", index + 1))?;
        if object.len() == 1
            && (object.contains_key("$$indexCreated") || object.contains_key("$$indexRemoved"))
        {
            continue;
        }
        let id = object
            .get("_id")
            .and_then(Value::as_str)
            .filter(|id| !id.is_empty() && id.len() <= 255)
            .with_context(|| format!("{filename} 第 {} 行缺少合法 _id", index + 1))?;
        if let Some(deleted) = object.get("$$deleted") {
            if deleted != &Value::Bool(true) || object.len() != 2 {
                bail!("{filename} 第 {} 行删除标记不合法", index + 1);
            }
            records.remove(id);
        } else {
            records.insert(id.into(), value);
        }
        if records.len() > 10000 {
            bail!("{filename} 有效记录数超过限制");
        }
    }
    Ok(records)
}

fn convert_proxy(
    proxy: &Map<String, Value>,
    profile_id: &str,
    issues: &mut Vec<String>,
) -> Result<Vec<Value>> {
    let id = required_string(proxy, "_id")?;
    let path = format!("proxy[{id}]");
    check_keys(
        proxy,
        &[
            "_id",
            "createdAt",
            "updatedAt",
            "name",
            "type",
            "localIP",
            "localPort",
            "remotePort",
            "customDomains",
            "locations",
            "hostHeaderRewrite",
            "visitorsModel",
            "serverName",
            "secretKey",
            "bindAddr",
            "bindPort",
            "subdomain",
            "basicAuth",
            "httpUser",
            "httpPassword",
            "fallbackTo",
            "fallbackTimeoutMs",
            "https2http",
            "https2httpCaFile",
            "https2httpKeyFile",
            "keepTunnelOpen",
            "transport",
            "status",
            "allowUsers",
            "serverUser",
            "protocol",
            "maxRetriesAnHour",
            "minRetryInterval",
            "natTraversal",
            "requestHeaders",
            "responseHeaders",
            "routeByHTTPUser",
            "loadBalancer",
            "healthCheck",
            "annotations",
            "metadatas",
            "plugin",
            "multiplexer",
        ],
        &path,
        issues,
    );
    let transport = object(proxy, "transport")?;
    check_keys(
        &transport,
        &[
            "useEncryption",
            "useCompression",
            "bandwidthLimit",
            "bandwidthLimitMode",
            "proxyProtocolVersion",
        ],
        &format!("{path}.transport"),
        issues,
    );
    let protocol = required_string(proxy, "type")?;
    if ![
        "tcp", "udp", "http", "https", "stcp", "sudp", "xtcp", "tcpmux",
    ]
    .contains(&protocol.as_str())
    {
        issues.push(format!("{path}.type：不支持的隧道协议。"));
        return Ok(vec![]);
    }
    let private = ["stcp", "sudp", "xtcp"].contains(&protocol.as_str());
    let visitor_mode = string(proxy, "visitorsModel", "visitorsProvider")?;
    if private && !["visitors", "visitorsProvider"].contains(&visitor_mode.as_str()) {
        issues.push(format!("{path}.visitorsModel：访问端模式不合法。"));
    }
    let visitor = private && visitor_mode == "visitors";
    if !["http", "https", "tcpmux"].contains(&protocol.as_str()) {
        if proxy
            .get("customDomains")
            .and_then(Value::as_array)
            .is_some_and(|values| values.iter().any(|value| value.as_str() != Some("")))
        {
            issues.push(format!("{path}.customDomains：此协议不支持非空域名。"));
        }
        check_defaults(proxy, &json!({"subdomain":""}), &path, issues);
    }
    if !private || visitor {
        check_defaults(proxy, &json!({"allowUsers":[]}), &path, issues);
    }
    if !visitor {
        check_defaults(proxy, &json!({"serverUser":""}), &path, issues);
    }
    if protocol != "xtcp" || !visitor {
        check_defaults(
            proxy,
            &json!({"protocol":"","keepTunnelOpen":false,"maxRetriesAnHour":8,"minRetryInterval":90,"fallbackTo":"","fallbackTimeoutMs":500}),
            &path,
            issues,
        );
    }
    if protocol != "xtcp" {
        check_defaults(proxy, &json!({"natTraversal":{}}), &path, issues);
    }
    if visitor {
        check_defaults(
            proxy,
            &json!({"annotations":{},"metadatas":{},"loadBalancer":{},"healthCheck":{},"plugin":{}}),
            &path,
            issues,
        );
        check_defaults(
            &transport,
            &json!({"bandwidthLimit":"","bandwidthLimitMode":"client","proxyProtocolVersion":""}),
            &format!("{path}.transport"),
            issues,
        );
    }
    let mut advanced = Map::new();
    let raw_bind_port = proxy.get("bindPort").and_then(|value| {
        value
            .as_i64()
            .or_else(|| value.as_str().and_then(|value| value.parse().ok()))
    });
    let no_listener =
        visitor && ["stcp", "xtcp"].contains(&protocol.as_str()) && raw_bind_port == Some(-1);
    if no_listener {
        advanced.insert("bindPort".into(), json!(-1));
    }
    let local_ip_field = if visitor { "bindAddr" } else { "localIP" };
    let local_ip = string(proxy, local_ip_field, "127.0.0.1")?;
    let local_ip = if local_ip.is_empty() {
        "127.0.0.1".to_owned()
    } else {
        local_ip
    };
    let local_port_field = if visitor { "bindPort" } else { "localPort" };
    let local_ports = if ["tcp", "udp"].contains(&protocol.as_str()) {
        port_list(
            proxy
                .get(local_port_field)
                .context("旧隧道缺少 localPort")?,
            false,
        )?
    } else {
        vec![if no_listener {
            1
        } else {
            port(proxy.get(local_port_field), 0)?
        }]
    };
    let remote_ports = if ["tcp", "udp"].contains(&protocol.as_str()) {
        port_list(
            proxy.get("remotePort").context("旧隧道缺少 remotePort")?,
            true,
        )?
    } else {
        vec![0; local_ports.len()]
    };
    if local_ports.len() != remote_ports.len() {
        bail!("{path} 本地与远程端口数量不一致");
    }
    let domains = match proxy.get("customDomains") {
        Some(value) => value
            .as_array()
            .context("旧 customDomains 类型错误")?
            .iter()
            .map(|value| value.as_str().context("旧 customDomains 不是字符串"))
            .collect::<Result<Vec<_>>>()?
            .into_iter()
            .filter(|domain| !domain.is_empty())
            .collect::<Vec<_>>(),
        None => vec![],
    };
    if !domains.is_empty() {
        advanced.insert("customDomains".into(), json!(domains));
    }
    let domain = domains.first().copied().unwrap_or("");
    if ["http", "https", "tcpmux"].contains(&protocol.as_str()) {
        advanced.extend(selected_fields(proxy, &["subdomain"]));
    }
    if protocol == "http" {
        if let Some(locations) = proxy.get("locations") {
            let values = locations.as_array().context("旧 locations 类型错误")?;
            let paths = values
                .iter()
                .map(|value| value.as_str().context("旧 locations 值必须是字符串"))
                .collect::<Result<Vec<_>>>()?;
            let paths = paths
                .into_iter()
                .filter(|value| !value.is_empty())
                .collect::<Vec<_>>();
            if !paths.is_empty() {
                advanced.insert("locations".into(), json!(paths));
            }
        }
        advanced.extend(selected_fields(
            proxy,
            &[
                "hostHeaderRewrite",
                "requestHeaders",
                "responseHeaders",
                "routeByHTTPUser",
            ],
        ));
    } else if proxy
        .get("locations")
        .and_then(Value::as_array)
        .is_some_and(|values| values.iter().any(|value| value.as_str() != Some("")))
        || !string(proxy, "hostHeaderRewrite", "")?.is_empty()
    {
        issues.push(format!("{path}：HTTP 路由字段不能应用于此协议。"));
    }
    if boolean(proxy, "basicAuth", false)? || protocol == "tcpmux" {
        if !["http", "tcpmux"].contains(&protocol.as_str()) {
            issues.push(format!("{path}.basicAuth：此协议不支持 HTTP 鉴权。"));
        }
        advanced.extend(selected_fields(proxy, &["httpUser", "httpPassword"]));
    }
    if private && !visitor {
        advanced.extend(selected_fields(proxy, &["allowUsers"]));
    }
    if visitor {
        advanced.extend(selected_fields(proxy, &["serverUser"]));
    }
    if protocol == "xtcp" {
        advanced.extend(selected_fields(proxy, &["natTraversal"]));
        if visitor {
            advanced.extend(selected_fields(
                proxy,
                &[
                    "protocol",
                    "keepTunnelOpen",
                    "maxRetriesAnHour",
                    "minRetryInterval",
                    "fallbackTo",
                    "fallbackTimeoutMs",
                ],
            ));
        }
    }
    if protocol == "tcpmux" {
        advanced.extend(selected_fields(proxy, &["multiplexer", "routeByHTTPUser"]));
    }
    if !visitor {
        advanced.extend(selected_fields(
            proxy,
            &[
                "annotations",
                "metadatas",
                "loadBalancer",
                "healthCheck",
                "plugin",
            ],
        ));
        insert_object(
            &mut advanced,
            "transport",
            selected_fields(
                &transport,
                &[
                    "bandwidthLimit",
                    "bandwidthLimitMode",
                    "proxyProtocolVersion",
                ],
            ),
        );
    }
    let enabled = match proxy.get("status") {
        None => true,
        Some(value) if value.as_i64() == Some(0) => false,
        Some(value) if value.as_i64() == Some(1) => true,
        _ => {
            issues.push(format!("{path}.status：启用状态不合法。"));
            false
        }
    };
    let name = required_string(proxy, "name")?;
    let expanded = local_ports.len() > 1;
    local_ports.into_iter().zip(remote_ports).enumerate().map(|(index, (local_port, remote_port))| Ok(json!({
        "id":stable_id("legacy-tunnel",&format!("{id}:{index}")),"profileId":profile_id,
        "name":if expanded {format!("{name}-{local_port}")} else {name.clone()},"type":protocol,
        "localIP":local_ip,"localPort":local_port,"localPortEnd":0,"remotePort":remote_port,"remotePortEnd":0,
        "domain":domain,"enabled":enabled,"apply":"pending","role":if visitor {"visitor"} else {"provider"},
        "secretKey":string(proxy,"secretKey","")?,"serverName":string(proxy,"serverName","")?,
        "encryption":boolean(&transport,"useEncryption",false)?,"compression":boolean(&transport,"useCompression",false)?,
        "https2http":boolean(proxy,"https2http",false)?,"certPath":string(proxy,"https2httpCaFile","")?,"keyPath":string(proxy,"https2httpKeyFile","")?,"advanced":advanced
    }))).collect()
}

fn stable_id(prefix: &str, source: &str) -> String {
    format!("{prefix}-{:x}", Sha256::digest(source.as_bytes()))
}
fn object(map: &Map<String, Value>, key: &str) -> Result<Map<String, Value>> {
    match map.get(key) {
        None | Some(Value::Null) => Ok(Map::new()),
        Some(value) => value
            .as_object()
            .cloned()
            .with_context(|| format!("旧 {key} 字段不是对象")),
    }
}
fn string(map: &Map<String, Value>, key: &str, default: &str) -> Result<String> {
    match map.get(key) {
        None | Some(Value::Null) => Ok(default.into()),
        Some(value) => value
            .as_str()
            .map(str::to_owned)
            .with_context(|| format!("旧 {key} 字段不是字符串")),
    }
}
fn required_string(map: &Map<String, Value>, key: &str) -> Result<String> {
    let value = string(map, key, "")?;
    if value.trim().is_empty() {
        bail!("旧 {key} 字段不能为空");
    }
    Ok(value)
}
fn boolean(map: &Map<String, Value>, key: &str, default: bool) -> Result<bool> {
    match map.get(key) {
        None | Some(Value::Null) => Ok(default),
        Some(value) => value
            .as_bool()
            .with_context(|| format!("旧 {key} 字段不是布尔值")),
    }
}
fn port(value: Option<&Value>, default: u16) -> Result<u16> {
    match value {
        None | Some(Value::Null) => Ok(default),
        Some(Value::Number(value)) => value
            .as_u64()
            .and_then(|number| u16::try_from(number).ok())
            .context("旧端口必须在 0–65535"),
        Some(Value::String(value)) => value.parse::<u16>().context("旧端口必须在 0–65535"),
        _ => bail!("旧端口类型不合法"),
    }
}
fn port_list(value: &Value, allow_zero: bool) -> Result<Vec<u16>> {
    let text = match value {
        Value::String(value) => value.clone(),
        Value::Number(value) => value.to_string(),
        _ => bail!("旧端口范围格式不合法"),
    };
    let mut ports = vec![];
    for part in text.split(',') {
        let mut range = part.trim().split('-');
        let start = range
            .next()
            .unwrap_or_default()
            .parse::<u16>()
            .context("旧端口范围格式不合法")?;
        let end = match range.next() {
            Some(end) => end.parse::<u16>().context("旧端口范围格式不合法")?,
            None => start,
        };
        if range.next().is_some()
            || (start == 0 && (!allow_zero || end != 0))
            || end < start
            || end as usize - start as usize + ports.len() >= 128
        {
            bail!("旧端口范围超过限制或顺序不合法");
        }
        ports.extend(start..=end);
    }
    Ok(ports)
}
fn check_keys(map: &Map<String, Value>, allowed: &[&str], path: &str, issues: &mut Vec<String>) {
    for key in map.keys() {
        if !allowed.contains(&key.as_str()) {
            issues.push(format!("{path}.{key}：无法识别旧配置字段，拒绝静默丢弃。"));
        }
    }
}
fn selected_fields(map: &Map<String, Value>, keys: &[&str]) -> Map<String, Value> {
    keys.iter()
        .filter_map(|key| {
            map.get(*key)
                .filter(|value| {
                    !value.is_null()
                        && value.as_str() != Some("")
                        && !value.as_array().is_some_and(Vec::is_empty)
                        && !value.as_object().is_some_and(Map::is_empty)
                })
                .map(|value| ((*key).into(), value.clone()))
        })
        .collect()
}
fn insert_object(map: &mut Map<String, Value>, key: &str, value: Map<String, Value>) {
    if !value.is_empty() {
        map.insert(key.into(), Value::Object(value));
    }
}
fn check_defaults(
    map: &Map<String, Value>,
    defaults: &Value,
    path: &str,
    issues: &mut Vec<String>,
) {
    for (key, default) in defaults.as_object().unwrap() {
        if let Some(value) = map.get(key) {
            if value != default {
                issues.push(format!(
                    "{path}.{key}：当前界面不支持迁移此非默认高级配置。"
                ));
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn source() -> (tempfile::TempDir, Value) {
        let directory = tempfile::tempdir().unwrap();
        let server = json!({"_id":"1","serverAddr":"example.test","serverPort":7000,"auth":{"method":"token","token":"demo-only"},"webServer":{"port":7400},"transport":{"protocol":"tcp","tls":{"enable":true}},"system":{"autoConnectOnStartup":true}});
        fs::write(directory.path().join("server-v2.db"), format!("{server}\n")).unwrap();
        fs::write(directory.path().join("proxy-v2.db"), "").unwrap();
        (directory, server)
    }
    #[test]
    fn replay_replacements_tombstones_and_indexes() {
        let records = replay(
            br#"{"$$indexCreated":{"fieldName":"name"}}
{"_id":"a","name":"first"}
{"_id":"b","name":"deleted"}
{"_id":"a","name":"last"}
{"_id":"b","$$deleted":true}
"#,
            "fixture.db",
        )
        .unwrap();
        assert_eq!(records.len(), 1);
        assert_eq!(records["a"]["name"], "last");
    }
    #[test]
    fn migration_is_read_only_and_never_autoconnects() {
        let (directory, _) = source();
        let before = fs::read(directory.path().join("server-v2.db")).unwrap();
        let preview = preview_legacy(directory.path(), "0.71.0").unwrap();
        assert!(preview.can_import);
        assert_eq!(preview.profiles[0]["autoConnect"], false);
        assert_eq!(preview.profiles[0]["process"], "stopped");
        assert_eq!(preview.profiles[0]["lastError"], Value::Null);
        assert_eq!(
            fs::read(directory.path().join("server-v2.db")).unwrap(),
            before
        );
    }
    #[test]
    fn unsupported_advanced_fields_block_import() {
        let (directory, mut server) = source();
        server["transport"]["unknownTransport"] = json!(true);
        fs::write(directory.path().join("server-v2.db"), format!("{server}\n")).unwrap();
        let preview = preview_legacy(directory.path(), "0.71.0").unwrap();
        assert!(!preview.can_import);
        assert!(preview
            .issues
            .iter()
            .any(|issue| issue.contains("unknownTransport")));
    }
    #[test]
    fn connection_and_http_advanced_settings_are_preserved() {
        let (directory, mut server) = source();
        server["transport"]["proxyURL"] = json!("http://proxy.example.test");
        server["transport"]["tcpMux"] = json!(false);
        server["transport"]["poolCount"] = json!(0);
        server["transport"]["tls"]["serverName"] = json!("tls.example.test");
        server["metadatas"] = json!({"region":"test"});
        server["webServer"]["user"] = json!("admin");
        fs::write(directory.path().join("server-v2.db"), format!("{server}\n")).unwrap();
        let proxy = json!({"_id":"http","name":"HTTP routes","type":"http","localPort":8080,"customDomains":["a.example.test","*.example.test"],"subdomain":"office","locations":["","/api","/assets"],"basicAuth":true,"httpUser":"user","httpPassword":"fixture-only","hostHeaderRewrite":"origin.example.test","transport":{"bandwidthLimit":"1MB","bandwidthLimitMode":"server"}});
        fs::write(directory.path().join("proxy-v2.db"), format!("{proxy}\n")).unwrap();
        let preview = preview_legacy(directory.path(), "0.71.0").unwrap();
        assert!(preview.can_import, "{:?}", preview.issues);
        let advanced = &preview.profiles[0]["advanced"];
        assert_eq!(
            advanced["transport"]["proxyURL"],
            "http://proxy.example.test"
        );
        assert_eq!(advanced["transport"]["tcpMux"], false);
        assert_eq!(advanced["transport"]["poolCount"], 0);
        assert_eq!(
            advanced["transport"]["tls"]["serverName"],
            "tls.example.test"
        );
        let tunnel = &preview.tunnels[0];
        assert_eq!(tunnel["domain"], "a.example.test");
        assert_eq!(
            tunnel["advanced"]["customDomains"]
                .as_array()
                .unwrap()
                .len(),
            2
        );
        assert_eq!(tunnel["advanced"]["locations"], json!(["/api", "/assets"]));
        assert_eq!(tunnel["advanced"]["httpPassword"], "fixture-only");
        assert_eq!(
            tunnel["advanced"]["transport"]["bandwidthLimitMode"],
            "server"
        );
    }
    #[test]
    fn xtcp_fallback_no_listener_and_automatic_remote_port_are_preserved() {
        let (directory, _) = source();
        let visitor = json!({"_id":"visitor","name":"XTCP visitor","type":"xtcp","visitorsModel":"visitors","bindPort":-1,"serverName":"provider","serverUser":"owner","keepTunnelOpen":true,"fallbackTo":"stcp-visitor","fallbackTimeoutMs":500,"natTraversal":{"disableAssistedAddrs":true}});
        let tcp =
            json!({"_id":"auto","name":"Auto port","type":"tcp","localPort":8080,"remotePort":0});
        fs::write(
            directory.path().join("proxy-v2.db"),
            format!("{visitor}\n{tcp}\n"),
        )
        .unwrap();
        let preview = preview_legacy(directory.path(), "0.71.0").unwrap();
        assert!(preview.can_import, "{:?}", preview.issues);
        let visitor = preview
            .tunnels
            .iter()
            .find(|tunnel| tunnel["type"] == "xtcp")
            .unwrap();
        assert_eq!(visitor["advanced"]["bindPort"], -1);
        assert_eq!(visitor["localPort"], 1);
        assert_eq!(visitor["advanced"]["fallbackTimeoutMs"], 500);
        assert_eq!(visitor["advanced"]["serverUser"], "owner");
        assert_eq!(
            preview
                .tunnels
                .iter()
                .find(|tunnel| tunnel["type"] == "tcp")
                .unwrap()["remotePort"],
            0
        );
    }
    #[test]
    fn inapplicable_nondefault_advanced_settings_block_migration() {
        let (directory, _) = source();
        let proxy = json!({"_id":"tcp","name":"TCP","type":"tcp","localPort":8080,"remotePort":18080,"subdomain":"lost"});
        fs::write(directory.path().join("proxy-v2.db"), format!("{proxy}\n")).unwrap();
        let preview = preview_legacy(directory.path(), "0.71.0").unwrap();
        assert!(!preview.can_import);
        assert!(preview
            .issues
            .iter()
            .any(|issue| issue.contains("subdomain")));
    }
    #[test]
    fn unused_legacy_form_placeholders_do_not_block_tcp_migration() {
        let (directory, _) = source();
        let proxy = json!({"_id":"tcp","name":"Legacy TCP","type":"tcp","localIP":"","localPort":"8080","remotePort":"18080","customDomains":[""],"locations":[""],"hostHeaderRewrite":"","subdomain":"","visitorsModel":"visitors","serverName":"","secretKey":"","bindAddr":"","bindPort":null,"basicAuth":false,"httpUser":"","httpPassword":"","fallbackTo":"","fallbackTimeoutMs":500,"https2http":false,"https2httpCaFile":"","https2httpKeyFile":"","keepTunnelOpen":false,"status":1,"transport":{"useEncryption":false,"useCompression":false}});
        fs::write(directory.path().join("proxy-v2.db"), format!("{proxy}\n")).unwrap();
        let preview = preview_legacy(directory.path(), "0.71.0").unwrap();
        assert!(preview.can_import, "{:?}", preview.issues);
        assert_eq!(preview.tunnels[0]["advanced"], json!({}));
        assert_eq!(preview.tunnels[0]["localIP"], "127.0.0.1");
    }
    #[test]
    fn malformed_lines_are_rejected_and_never_partially_imported() {
        for text in [
            "{broken",
            "[]",
            "{\"serverAddr\":\"x\"}",
            "{\"_id\":\"a\",\"$$deleted\":false}",
        ] {
            assert!(replay(text.as_bytes(), "fixture.db").is_err());
        }
    }
    #[test]
    fn fingerprints_change_after_source_update_and_multiple_servers_block() {
        let (directory, mut server) = source();
        let first = preview_legacy(directory.path(), "0.71.0").unwrap();
        server["serverPort"] = json!(7001);
        fs::write(directory.path().join("server-v2.db"), format!("{server}\n")).unwrap();
        let second = preview_legacy(directory.path(), "0.71.0").unwrap();
        assert_ne!(first.source_fingerprint, second.source_fingerprint);
        server["_id"] = json!("2");
        use std::io::Write;
        writeln!(
            fs::OpenOptions::new()
                .append(true)
                .open(directory.path().join("server-v2.db"))
                .unwrap(),
            "{server}"
        )
        .unwrap();
        assert!(
            !preview_legacy(directory.path(), "0.71.0")
                .unwrap()
                .can_import
        );
    }
    #[test]
    fn comma_ranges_expand_pairwise_and_preserve_disable() {
        let (directory, _) = source();
        let proxy = json!({"_id":"proxy-one","name":"TCP batch","type":"tcp","localIP":"127.0.0.1","localPort":"8080-8081,8090","remotePort":"18080-18081,18090","status":0});
        fs::write(directory.path().join("proxy-v2.db"), format!("{proxy}\n")).unwrap();
        let preview = preview_legacy(directory.path(), "0.71.0").unwrap();
        assert!(preview.can_import);
        assert_eq!(preview.tunnels.len(), 3);
        assert_eq!(preview.tunnels[2]["localPort"], 8090);
        assert_eq!(preview.tunnels[2]["remotePort"], 18090);
        assert_eq!(preview.tunnels[0]["enabled"], false);
    }
}
