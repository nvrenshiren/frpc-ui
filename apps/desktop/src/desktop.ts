import { invoke, isTauri } from "@tauri-apps/api/core";
import type {
  AppSettings,
  BatchResult,
  LogEntry,
  Profile,
  Tunnel,
  Version,
} from "./model";

export const desktopHost = isTauri();

export interface DesktopSnapshot {
  profiles: Profile[];
  tunnels: Tunnel[];
  logs: LogEntry[];
  settings: AppSettings;
  versions: Version[];
  dataDir: string;
}

export interface RunResult {
  results: BatchResult[];
  snapshot: DesktopSnapshot;
}

export interface LegacyPreview {
  profiles: Profile[];
  tunnels: Tunnel[];
  issues: string[];
  warnings: string[];
  canImport: boolean;
  sourceFingerprint: string;
}

export function desktopInvoke<T>(
  command: string,
  args?: Record<string, unknown>,
): Promise<T> {
  return invoke<T>(command, args);
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
