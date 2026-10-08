import { useMemo, useState, type ChangeEvent } from "react";
import { Copy, Download, FileInput, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  ConfigError,
  createShareUri,
  exportProfileToml,
  parseConfigImport,
  uniqueProfileName,
  type ConfigPreview,
} from "../config";
import { useI18n } from "../i18n";
import { createId, makeProfile, makeTunnel, type Profile } from "../model";
import { useAppStore } from "../store";
import { Badge, Button, Checkbox, Dialog, Field, Input, Select } from "./ui";

type Mode = "export" | "import" | "share";

export function ConfigExchange({
  profile,
  onClose,
}: {
  profile: Profile | null;
  onClose: () => void;
}) {
  return profile ? (
    <ExchangeSession key={profile.id} profile={profile} onClose={onClose} />
  ) : null;
}

function ExchangeSession({
  profile,
  onClose,
}: {
  profile: Profile;
  onClose: () => void;
}) {
  const { t, language } = useI18n();
  const profiles = useAppStore((state) => state.profiles);
  const tunnels = useAppStore((state) => state.tunnels);
  const versions = useAppStore((state) => state.versions);
  const [mode, setMode] = useState<Mode>("export");
  const [includeCredentials, setIncludeCredentials] = useState(false);
  const [source, setSource] = useState("");
  const [name, setName] = useState(`${profile.name} ${t("导入", "imported")}`);
  const installed = versions.filter((version) => version.installed);
  const [version, setVersion] = useState(
    installed.some((item) => item.version === profile.version)
      ? profile.version
      : (installed[0]?.version ?? ""),
  );
  const [fileError, setFileError] = useState("");
  const [reading, setReading] = useState(false);
  const currentProfile =
    profiles.find((item) => item.id === profile.id) ?? profile;
  const currentTunnels = tunnels.filter(
    (tunnel) => tunnel.profileId === profile.id,
  );

  function errorText(error: unknown): string {
    return error instanceof ConfigError
      ? error[language]
      : t(
          "配置处理失败，请检查输入。",
          "Unable to process configuration. Check the input.",
        );
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
    (preview.value.profile.authToken ||
      preview.value.tunnels.some((tunnel) => tunnel.secretKey)),
  );

  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileError("");
    if (file.size > 1024 * 1024) {
      setFileError(t("文件不得超过 1 MB。", "Files must not exceed 1 MB."));
      event.target.value = "";
      return;
    }
    setReading(true);
    try {
      setSource(await file.text());
    } catch {
      setFileError(
        t(
          "无法读取此文件，请粘贴配置文本。",
          "Unable to read this file. Paste the configuration text.",
        ),
      );
    } finally {
      setReading(false);
      event.target.value = "";
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

  function saveImport() {
    if (
      !preview.value ||
      !installed.some((item) => item.version === version) ||
      portConflict
    )
      return;
    try {
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
      useAppStore.getState().saveProfile(savedProfile);
      draft.tunnels.forEach((tunnel) => {
        const fresh = makeTunnel();
        useAppStore
          .getState()
          .saveTunnel({
            ...tunnel,
            id: fresh.id,
            profileId: savedProfile.id,
            apply: "pending",
          });
      });
      useAppStore.getState().setScope(savedProfile.id);
      useAppStore.getState().setPage("connections");
      toast.success(
        t(
          `已新增连接「${savedProfile.name}」，配置等待应用`,
          `Added “${savedProfile.name}”; configuration is pending apply`,
        ),
      );
      onClose();
    } catch (error) {
      toast.error(errorText(error));
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t("配置导入、导出与分享", "Import, export & share configuration")}
      description={t(
        `当前连接：${currentProfile.name}。文件与剪贴板操作可用，连接状态仍为模拟。`,
        `Current connection: ${currentProfile.name}. File and clipboard actions work; connections remain simulated.`,
      )}
      className="exchange-dialog"
    >
      <Field label={t("操作", "Action")} htmlFor="exchange-mode">
        <Select
          id="exchange-mode"
          className="exchange-tabs"
          value={mode}
          onChange={(event) => setMode(event.target.value as Mode)}
        >
          <option value="export">{t("导出 TOML", "Export TOML")}</option>
          <option value="import">
            {t("导入配置", "Import configuration")}
          </option>
          <option value="share">
            {t("生成分享链接", "Create share link")}
          </option>
        </Select>
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
                onChange={(event) => setVersion(event.target.value)}
              >
                {!installed.length && (
                  <option value="">
                    {t("请先安装一个版本", "Install a version first")}
                  </option>
                )}
                {installed.map((item) => (
                  <option key={item.id} value={item.version}>
                    {item.version}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field
            label={t("读取 TOML 文件", "Read a TOML file")}
            htmlFor="exchange-file"
            error={fileError}
          >
            <Input
              id="exchange-file"
              type="file"
              accept=".toml,text/plain"
              disabled={reading}
              onChange={(event) => {
                void readFile(event);
              }}
            />
          </Field>
          <Field
            label={t(
              "TOML 文本或本原型分享链接",
              "TOML text or a prototype share link",
            )}
            htmlFor="exchange-source"
            error={preview.error}
          >
            <textarea
              id="exchange-source"
              className="exchange-textarea"
              rows={8}
              spellCheck={false}
              value={source}
              onChange={(event) => {
                setSource(event.target.value);
                setFileError("");
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
                "serverAddr、serverPort、user、auth.token、transport.protocol、transport.tls.enable、本地 webServer；TCP/UDP、HTTP/HTTPS、STCP/SUDP/XTCP 提供者与访问者，以及 https2http 证书路径。每条 HTTP/HTTPS 仅支持一个域名。未知字段明确报错。",
                "serverAddr, serverPort, user, auth.token, transport.protocol, transport.tls.enable, local webServer; TCP/UDP, HTTP/HTTPS, STCP/SUDP/XTCP providers and visitors, plus https2http certificate paths. One domain per HTTP/HTTPS tunnel. Unknown fields are rejected.",
              )}
            </p>
          </details>
          {preview.value && (
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
                    "包含凭据，仅保存在本次会话内存",
                    "Contains credentials; stored only in session memory",
                  )}
                </Badge>
              )}
              {preview.value.tunnels.some((tunnel) => tunnel.https2http) && (
                <p>
                  {t(
                    "证书和私钥路径仅写入配置，原型不读取或验证本机文件。",
                    "Certificate and private-key paths are configuration only; the prototype does not read or verify local files.",
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
          <div className="form-footer">
            <Button onClick={onClose}>{t("取消", "Cancel")}</Button>
            <Button
              variant="primary"
              onClick={saveImport}
              disabled={
                !preview.value ||
                !installed.some((item) => item.version === version) ||
                Boolean(portConflict) ||
                reading
              }
            >
              <FileInput size={15} />
              {t("确认新增连接", "Add connection")}
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
                "包含认证 token 和隧道密钥",
                "Include authentication token and tunnel secrets",
              )}
            />
            <p>
              {includeCredentials
                ? t(
                    "敏感配置：输出会包含已填写的凭据。分享链接只是编码，没有加密。",
                    "Sensitive configuration: supplied credentials will be included. Share links are encoded, not encrypted.",
                  )
                : t(
                    "默认移除 token 和密钥；使用配置前可能需要补填凭据。",
                    "Tokens and secrets are omitted by default. Credentials may need to be supplied before use.",
                  )}
            </p>
          </div>
          <p className="field-hint">
            {mode === "share"
              ? t(
                  "frp:// 是本原型的结构化分享格式，不宣称兼容旧客户端。保留停用隧道，导入时需选择版本。",
                  "frp:// is this prototype’s structured share format; legacy clients are not supported. Disabled tunnels are retained. Select a version when importing.",
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
    </Dialog>
  );
}
