use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ProcessStatus {
    Stopped,
    Starting,
    Running,
    Stopping,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ConnectionStatus {
    Unknown,
    Confirmed,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum TunnelType {
    Tcp,
    Udp,
    Http,
    Https,
    Stcp,
    Sudp,
    Xtcp,
    Tcpmux,
}
impl TunnelType {
    pub fn private(&self) -> bool {
        matches!(self, Self::Stcp | Self::Sudp | Self::Xtcp)
    }
    pub fn public_port(&self) -> bool {
        matches!(self, Self::Tcp | Self::Udp)
    }
    pub fn domain(&self) -> bool {
        matches!(self, Self::Http | Self::Https | Self::Tcpmux)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ApplyStatus {
    Applied,
    Pending,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum TunnelRole {
    Provider,
    Visitor,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Profile {
    pub id: String,
    pub name: String,
    pub server_addr: String,
    pub server_port: u16,
    pub version: String,
    pub process: ProcessStatus,
    pub connection: ConnectionStatus,
    pub auto_connect: bool,
    pub pending: bool,
    pub user: String,
    pub auth_token: String,
    pub web_port: u16,
    pub transport: String,
    pub tls: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_error: Option<String>,
    pub uptime: String,
    #[serde(default)]
    pub advanced: serde_json::Map<String, serde_json::Value>,
}
impl Profile {
    pub fn reset_runtime(&mut self) {
        self.process = ProcessStatus::Stopped;
        self.connection = ConnectionStatus::Unknown;
        self.pending = true;
        self.last_error = None;
        self.uptime = "—".to_owned();
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Tunnel {
    pub id: String,
    pub name: String,
    pub profile_id: String,
    #[serde(rename = "type")]
    pub tunnel_type: TunnelType,
    #[serde(rename = "localIP")]
    pub local_ip: String,
    pub local_port: u16,
    pub local_port_end: u16,
    pub remote_port: u16,
    pub remote_port_end: u16,
    pub domain: String,
    pub enabled: bool,
    pub apply: ApplyStatus,
    pub role: TunnelRole,
    pub secret_key: String,
    pub server_name: String,
    pub encryption: bool,
    pub compression: bool,
    pub https2http: bool,
    pub cert_path: String,
    pub key_path: String,
    #[serde(default)]
    pub advanced: serde_json::Map<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum LogLevel {
    Info,
    Warn,
    Error,
    Debug,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LogEntry {
    pub id: String,
    pub time: String,
    pub profile_id: String,
    pub level: LogLevel,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct AppSettings {
    pub language: String,
    pub theme: String,
    pub auto_start: bool,
    pub silent_start: bool,
    pub close_to_tray: bool,
}
impl Default for AppSettings {
    fn default() -> Self {
        Self {
            language: "zh".into(),
            theme: "system".into(),
            auto_start: false,
            silent_start: false,
            close_to_tray: true,
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum RunAction {
    Start,
    Stop,
    Apply,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchResult {
    pub profile_id: String,
    pub success: bool,
    pub message: String,
    pub action: RunAction,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Snapshot {
    pub profiles: Vec<Profile>,
    pub tunnels: Vec<Tunnel>,
    pub logs: Vec<LogEntry>,
    pub settings: AppSettings,
}
