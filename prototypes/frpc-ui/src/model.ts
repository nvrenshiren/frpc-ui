export type Page =
  "overview" | "connections" | "tunnels" | "versions" | "logs" | "settings";

export type ProcessStatus =
  "stopped" | "starting" | "running" | "stopping" | "failed";
export type ConnectionStatus = "unknown" | "confirmed" | "failed";
export type TunnelType =
  "tcp" | "udp" | "http" | "https" | "stcp" | "sudp" | "xtcp";

export interface Profile {
  id: string;
  name: string;
  serverAddr: string;
  serverPort: number;
  version: string;
  process: ProcessStatus;
  connection: ConnectionStatus;
  autoConnect: boolean;
  pending: boolean;
  user: string;
  authToken: string;
  webPort: number;
  transport: string;
  tls: boolean;
  lastError?: string;
  uptime: string;
}

export interface Tunnel {
  id: string;
  name: string;
  profileId: string;
  type: TunnelType;
  localIP: string;
  localPort: number;
  localPortEnd: number;
  remotePort: number;
  remotePortEnd: number;
  domain: string;
  enabled: boolean;
  apply: "applied" | "pending" | "failed";
  role: "provider" | "visitor";
  secretKey: string;
  serverName: string;
  encryption: boolean;
  compression: boolean;
  https2http: boolean;
  certPath: string;
  keyPath: string;
}

export interface Version {
  id: string;
  version: string;
  installed: boolean;
  size: string;
  progress: number;
}

export interface LogEntry {
  id: string;
  time: string;
  profileId: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
}

export interface AppSettings {
  language: "zh" | "en";
  theme: "light" | "dark" | "system";
  autoStart: boolean;
  silentStart: boolean;
  closeToTray: boolean;
}

export interface BatchResult {
  profileId: string;
  success: boolean;
  message: string;
  action?: "start" | "stop" | "apply";
}

let idCounter = 0;

export function createId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter.toString(36)}`;
}

export function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: createId("profile"),
    name: "新建连接",
    serverAddr: "",
    serverPort: 7000,
    version: "0.65.0",
    process: "stopped",
    connection: "unknown",
    autoConnect: false,
    pending: true,
    user: "",
    authToken: "",
    webPort: 7400,
    transport: "tcp",
    tls: true,
    uptime: "—",
    ...overrides,
  };
}

export function makeTunnel(overrides: Partial<Tunnel> = {}): Tunnel {
  return {
    id: createId("tunnel"),
    name: "新建隧道",
    profileId: "",
    type: "tcp",
    localIP: "127.0.0.1",
    localPort: 8080,
    localPortEnd: 0,
    remotePort: 18080,
    remotePortEnd: 0,
    domain: "",
    enabled: true,
    apply: "pending",
    role: "provider",
    secretKey: "",
    serverName: "",
    encryption: false,
    compression: false,
    https2http: false,
    certPath: "",
    keyPath: "",
    ...overrides,
  };
}
