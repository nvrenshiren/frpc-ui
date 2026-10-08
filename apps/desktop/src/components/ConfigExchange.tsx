import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { Copy, Download, FileInput, FileUp, LoaderCircle, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  ConfigError,
  createShareUri,
  exportProfileToml,
  hasConfigurationCredentials,
  getConfigurationFileReferences,
  parseConfigImport,
  uniqueProfileName,
  type ConfigPreview,
} from "../config";
import { useI18n } from "../i18n";
import { createId, makeProfile, makeTunnel, type Profile } from "../model";
import { useAppStore } from "../store";
import { desktopHost, errorMessage } from "../desktop";
import { Badge, Button, Checkbox, Dialog, Field, Input, Select } from "./ui";

type Mode = "export" | "import" | "share";

export function ConfigExchange({
  profile,
  onClose,
  initialMode = "export",
}: {
  profile: Profile | null;
  onClose: () => void;
  initialMode?: Mode;
}) {
  return profile ? (
    <ExchangeSession
      key={profile.id}
      profile={profile}
      onClose={onClose}
      initialMode={initialMode}
    />
  ) : null;
}

function ExchangeSession({
  profile,
  onClose,
  initialMode,
}: {
  profile: Profile;
  onClose: () => void;
  initialMode: Mode;
}) {
  const { t, language } = useI18n();
  const profiles = useAppStore((state) => state.profiles);
  const tunnels = useAppStore((state) => state.tunnels);
  const versions = useAppStore((state) => state.versions);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [includeCredentials, setIncludeCredentials] = useState(false);
  const [source, setSource] = useState("");
  const [name, setName] = useState(
    initialMode === "import"
      ? profile.name
      : `${profile.name} ${t("导入", "imported")}`,
  );
  const installed = versions.filter((version) => version.installed);
  const [version, setVersion] = useState(
    installed.some((item) => item.version === profile.version)
      ? profile.version
      : (installed[0]?.version ?? ""),
  );
  const [fileError, setFileError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
  } | null>(null);
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const currentProfile =
    profiles.find((item) => item.id === profile.id) ?? profile;
  const currentTunnels = tunnels.filter(
    (tunnel) => tunnel.profileId === profile.id,
  );

  function errorText(error: unknown): string {
    return error instanceof ConfigError ? error[language] : errorMessage(error);
  }

  const output = useMemo(() => {
    if (mode === "import") return { value: "", error: "" };
    try {
      return {
        value:
          mode === "share"
            ? createShareUri(currentProfile, currentTunnels, includeCredentials)
            : exportProfileToml(
                currentProfile,
                currentTunnels,
                includeCredentials,
              ),
        error: "",
      };
    } catch (error) {
      return {
        value: "",
        error:
          error instanceof ConfigError
            ? error[language]
            : language === "zh"
              ? "配置处理失败，请检查字段。"
              : "Unable to process configuration. Check the fields.",
      };
    }
  }, [mode, currentProfile, tunnels, includeCredentials, language]);

  const preview = useMemo<{
    value: ConfigPreview | null;
    error: string;
  }>(() => {
    if (mode !== "import" || !source.trim()) return { value: null, error: "" };
    try {
      const nextName = uniqueProfileName(name, profiles);
      return { value: parseConfigImport(source, version, nextName), error: "" };
    } catch (error) {
      return {
        value: null,
        error:
          error instanceof ConfigError
            ? error[language]
            : language === "zh"
              ? "配置处理失败，请检查输入。"
              : "Unable to process configuration. Check the input.",
      };
    }
  }, [mode, source, name, version, profiles, language]);

  const existingPorts = new Set(
    profiles.map((item) => item.webPort).filter(Boolean),
  );
  let importWebPort = preview.value?.profile.webPort ?? 0;
  while (
    importWebPort > 0 &&
    existingPorts.has(importWebPort) &&
    importWebPort < 65535
  )
    importWebPort += 1;
  const portConflict = importWebPort > 0 && existingPorts.has(importWebPort);
  const adjustedPort =
    preview.value && importWebPort !== preview.value.profile.webPort;
  const hasCredentials = Boolean(
    preview.value &&
    hasConfigurationCredentials(preview.value.profile, preview.value.tunnels),
  );
  const hasExternalPaths = Boolean(preview.value && getConfigurationFileReferences(preview.value.profile, preview.value.tunnels).length);

  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file || reading || saving) return;
    setFileError("");
    setSelectedFile(null);
    if (file.size > 1024 * 1024) {
      setFileError(t("文件不得超过 1 MB。", "Files must not exceed 1 MB."));
      input.value = "";
      return;
    }
    setReading(true);
    try {
      setSource(await file.text());
      setSelectedFile({ name: file.name, size: file.size });
    } catch {
      setFileError(
        t(
          "无法读取此文件，请粘贴配置文本。",
          "Unable to read this file. Paste the configuration text.",
        ),
      );
    } finally {
      setReading(false);
      input.value = "";
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(output.value);
      toast.success(t("已复制到剪贴板", "Copied to clipboard"));
    } catch {
      toast.error(
        t(
          "无法访问剪贴板，请在文本框中手动复制。",
          "Clipboard unavailable. Copy manually from the text field.",
        ),
      );
    }
  }

  function download() {
    const blob = new Blob([output.value], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${currentProfile.name.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_") || "frpc"}.toml`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success(t("TOML 文件已生成", "TOML file generated"));
  }

  async function saveImport() {
    if (saving || reading || fileError) return;
    if (
      !preview.value ||
      !installed.some((item) => item.version === version) ||
      portConflict
    )
      return;
    try {
      setSaving(true);
      setSaveError("");
      // Re-parse at confirmation; imports always receive fresh IDs and cannot overwrite another connection.
      const draft = parseConfigImport(
        source,
        version,
        uniqueProfileName(name, useAppStore.getState().profiles),
      );
      const savedProfile = makeProfile({
        ...draft.profile,
        id: createId("profile"),
        webPort: importWebPort,
        autoConnect: false,
      });
      const importedProfile = await useAppStore.getState().importConfiguration(
        savedProfile,
        draft.tunnels.map((tunnel) => ({
          ...tunnel,
          id: makeTunnel().id,
          profileId: savedProfile.id,
          apply: "pending",
        })),
      );
      useAppStore.getState().setScope(importedProfile.id);
      useAppStore.getState().setPage("connections");
      toast.success(
        t(
          `已新增连接「${savedProfile.name}」，配置等待应用`,
          `Added “${savedProfile.name}”; configuration is pending apply`,
        ),
      );
      onClose();
    } catch (error) {
      setSaveError(errorText(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
      title={t("配置导入、导出与分享", "Import, export & share configuration")}
      description={t(
        `当前连接：${currentProfile.name}。导入将原子新增连接及其隧道。`,
        `Current connection: ${currentProfile.name}. Import atomically adds a connection and its tunnels.`,
      )}
      className="exchange-dialog"
    >
      <fieldset className="editor-fields" disabled={saving}>
        <Field label={t("操作", "Action")} htmlFor="exchange-mode">
          <Select
            id="exchange-mode"
            className="exchange-tabs"
            value={mode}
            disabled={reading}
            onValueChange={(value) => setMode(value as Mode)}
            options={[
              { value: "export", label: t("导出 TOML", "Export TOML") },
              { value: "import", label: t("导入配置", "Import configuration") },
              { value: "share", label: t("生成分享链接", "Create share link") },
            ]}
          />
        </Field>

        {mode === "import" ? (
          <>
            <div className="form-grid">
              <Field
                label={t("新连接名称", "New connection name")}
                htmlFor="exchange-name"
                hint={t(
                  "名称重复时自动添加数字后缀。",
                  "Duplicate names receive a numeric suffix.",
                )}
              >
                <Input
                  id="exchange-name"
                  value={name}
                  maxLength={255}
                  onChange={(event) => setName(event.target.value)}
                />
              </Field>
              <Field
                label={t("使用已安装版本", "Installed frpc version")}
                htmlFor="exchange-version"
                hint={t(
                  "TOML 不包含 frpc 版本；请明确选择。",
                  "TOML contains no frpc version; select one explicitly.",
                )}
              >
                <Select
                  id="exchange-version"
                  value={version}
                  onValueChange={setVersion}
                  placeholder={t("请先安装一个版本", "Install a version first")}
                  options={installed.map((item) => ({
                    value: item.version,
                    label: item.version,
                  }))}
                />
              </Field>
            </div>
            <Field
              label={t("读取 TOML 文件", "Read a TOML file")}
              htmlFor="exchange-file"
              error={fileError}
            >
              <div
                className="config-file-control"
                data-invalid={fileError ? "true" : undefined}
                aria-busy={reading}
              >
                <input
                  ref={fileInput}
                  type="file"
                  hidden
                  accept=".toml,text/plain"
                  disabled={reading}
                  onChange={(event) => void readFile(event)}
                />
                <Button
                  id="exchange-file"
                  className="config-file-button"
                  disabled={reading}
                  onClick={() => fileInput.current?.click()}
                  aria-label={
                    selectedFile
                      ? t("重新选择 TOML 文件", "Choose another TOML file")
                      : t("选择文件：TOML 配置", "Choose file: TOML configuration")
                  }
                >
                  {reading ? (
                    <LoaderCircle size={15} className="spin" aria-hidden="true" />
                  ) : (
                    <FileUp size={15} aria-hidden="true" />
                  )}
                  {selectedFile
                    ? t("重新选择", "Choose another")
                    : t("选择文件", "Choose file")}
                </Button>
                <div className="config-file-summary" role="status" aria-atomic="true">
                  <span className="config-file-name" title={selectedFile?.name}>
                    {reading
                      ? t("正在读取文件…", "Reading file…")
                      : (selectedFile?.name ?? t("未选择文件", "No file selected"))}
                  </span>
                  <span className="config-file-meta">
                    {selectedFile
                      ? t(
                          `已读取 · ${(selectedFile.size / 1024).toFixed(1)} KB`,
                          `Loaded · ${(selectedFile.size / 1024).toFixed(1)} KB`,
                        )
                      : t(".toml 文件 · 最大 1 MB", ".toml files · Up to 1 MB")}
                  </span>
                </div>
              </div>
            </Field>
            <Field
              label={t(
                "TOML 文本或 frpc-ui 分享链接",
                "TOML text or a frpc-ui share link",
              )}
              htmlFor="exchange-source"
              error={preview.error}
            >
              <textarea
                id="exchange-source"
                className="exchange-textarea"
                rows={8}
                spellCheck={false}
                disabled={reading}
                aria-busy={reading}
                value={source}
                onChange={(event) => {
                  setSource(event.target.value);
                  setFileError("");
                  setSelectedFile(null);
                }}
                placeholder={'serverAddr = "203.0.113.10"\nserverPort = 7000'}
              />
            </Field>
            <details className="notice">
              <summary>
                {t("支持的配置范围", "Supported configuration fields")}
              </summary>
              <p>
                {t(
                  "连接认证、OIDC、网络与完整 TLS、管理服务；八种隧道协议、多域名与 HTTP 路由、访问权限、XTCP 回退、限流、负载均衡、健康检查及九种提供者插件。支持范围随所选 frpc 版本变化，未知字段和不兼容选项会明确报错。版本库可查看逐版本配置清单。",
                  "Connection authentication, OIDC, networking, full TLS and management; eight tunnel protocols, multiple domains and HTTP routes, access rules, XTCP fallback, bandwidth limits, load balancing, health checks and nine provider plugins. Availability depends on the selected frpc version. Unknown and incompatible options are rejected. See each version’s configuration checklist in Versions.",
                )}
              </p>
            </details>
            {preview.value && !fileError && !reading && (
              <div className="notice" aria-live="polite">
                <Badge tone="success">
                  {t(
                    "有效配置 · 新增连接",
                    "Valid configuration · new connection",
                  )}
                </Badge>
                <p>
                  <strong>{preview.value.profile.name}</strong> ·{" "}
                  {preview.value.profile.serverAddr}:
                  {preview.value.profile.serverPort}
                </p>
                <p>
                  frpc {version} · {preview.value.tunnels.length}{" "}
                  {t("条隧道", "tunnels")} · {t("管理端口", "Management port")}{" "}
                  {importWebPort || t("关闭", "disabled")}
                </p>
                {adjustedPort && (
                  <p>
                    {t(
                      "原管理端口已被其他连接使用，新增连接将使用上面显示的空闲端口。",
                      "The original management port is in use. The new connection will use the available port shown above.",
                    )}
                  </p>
                )}
                {portConflict && (
                  <p role="alert">
                    {t(
                      "没有可分配的管理端口，请修改源配置。",
                      "No management port is available. Update the source configuration.",
                    )}
                  </p>
                )}
                {hasCredentials && (
                  <Badge tone="warning">
                    {t(
                      desktopHost
                        ? "包含凭据，导入后存入本机配置"
                        : "包含凭据，浏览器演示仅保存在内存",
                      desktopHost
                        ? "Contains credentials; import saves them in local configuration"
                        : "Contains credentials; browser demo keeps them in memory",
                    )}
                  </Badge>
                )}
                {hasExternalPaths && (
                  <p>
                    {t(
                      "外部文件和目录路径仅写入配置；文件不会随导入传输，启动前由所选 frpc 验证。",
                      "External file and directory paths are saved in configuration. Files are not transferred by import; the selected frpc validates them before starting.",
                    )}
                  </p>
                )}
                <p>
                  {t(
                    "确认后将新增一个停止的连接及其隧道，不替换现有连接，也不会启动进程。",
                    "Confirmation adds a stopped connection and its tunnels. Existing connections stay intact; no process starts.",
                  )}
                </p>
              </div>
            )}
            {saveError && (
              <p className="field-error" role="alert">
                {saveError}
              </p>
            )}
            <div className="form-footer">
              <Button onClick={onClose} disabled={saving}>
                {t("取消", "Cancel")}
              </Button>
              <Button
                variant="primary"
                onClick={saveImport}
                disabled={
                  !preview.value ||
                  !installed.some((item) => item.version === version) ||
                  Boolean(portConflict) ||
                  Boolean(fileError) ||
                  reading ||
                  saving
                }
              >
                <FileInput size={15} />
                {saving
                  ? t("保存中…", "Saving…")
                  : t("确认新增连接", "Add connection")}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="notice">
              <Checkbox
                checked={includeCredentials}
                onCheckedChange={setIncludeCredentials}
                label={t(
                  "包含认证、隧道、HTTP、管理与插件凭据",
                  "Include authentication, tunnel, HTTP, admin and plugin credentials",
                )}
              />
              <p>
                {includeCredentials
                  ? t(
                      "敏感配置：输出会包含已填写的凭据。分享链接只是编码，没有加密。",
                      "Sensitive configuration: supplied credentials will be included. Share links are encoded, not encrypted.",
                    )
                  : t(
                      "默认移除 Token、OIDC 密钥、密码、认证文件来源，以及可能包含凭据的 Header 和元数据；使用前可能需要补填。",
                      "Tokens, OIDC secrets, passwords, credential-file sources, and potentially sensitive headers and metadata are omitted by default. Supply any required credentials before use.",
                    )}
              </p>
            </div>
            <p className="field-hint">
              {mode === "share"
                ? t(
                    "frp:// 使用 frpc-ui 的结构化分享格式，不支持旧客户端格式。保留停用隧道，导入时需选择已安装版本。",
                    "frp:// uses frpc-ui’s structured format; legacy formats are not supported. Disabled tunnels are retained. Select an installed version when importing.",
                  )
                : t(
                    `导出当前连接已启用的 ${currentTunnels.filter((tunnel) => tunnel.enabled).length} 条隧道。端口范围展开为标准配置，不包含停用隧道。证书路径仅写入配置，不验证本机文件。`,
                    `Exports ${currentTunnels.filter((tunnel) => tunnel.enabled).length} enabled tunnels for this connection. Port ranges expand into standard entries. Disabled tunnels are excluded. Certificate paths are not checked against local files.`,
                  )}
            </p>
            <Field
              label={
                mode === "share"
                  ? t("分享链接", "Share link")
                  : t("现代 frpc TOML", "Modern frpc TOML")
              }
              htmlFor="exchange-output"
              error={output.error}
            >
              <textarea
                id="exchange-output"
                className="exchange-textarea"
                rows={12}
                spellCheck={false}
                readOnly
                value={output.value}
              />
            </Field>
            <div className="form-footer">
              <Button onClick={() => setMode("import")}>
                <Upload size={15} />
                {t("导入配置", "Import")}
              </Button>
              <Button
                onClick={() => {
                  void copy();
                }}
                disabled={!output.value}
              >
                <Copy size={15} />
                {t("复制", "Copy")}
              </Button>
              {mode === "export" && (
                <Button
                  variant="primary"
                  onClick={download}
                  disabled={!output.value}
                >
                  <Download size={15} />
                  {t("下载 TOML", "Download TOML")}
                </Button>
              )}
            </div>
          </>
        )}
      </fieldset>
    </Dialog>
  );
}
