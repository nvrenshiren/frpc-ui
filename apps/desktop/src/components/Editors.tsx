import { useMemo, useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import type { Profile, Tunnel, TunnelType } from "../model";
import { useAppStore } from "../store";
import { useI18n } from "../i18n";
import { errorMessage } from "../desktop";
import { Button, Checkbox, Dialog, Field, Input, Select } from "./ui";
import {
  ConfigError,
  validateProfileAdvanced,
  validateTunnelAdvanced,
} from "../config";
import {
  getConfigCapability,
  getConfigurationVersionState,
  getUnsupportedAdvancedPaths,
  isConfigCapabilitySupported,
} from "../configCapabilities";
import {
  advancedRecord,
  applicableTunnelAdvanced,
  ProfileAuthenticationFields,
  ProfileAdvancedFields,
  TunnelAdvancedFields,
  IncompatibleSettings,
  updateAdvanced,
  type Advanced,
} from "./AdvancedFields";

type ProfileDraft = Omit<Profile, "serverPort" | "webPort"> & {
  serverPort: string;
  webPort: string;
};
type TunnelDraft = Omit<
  Tunnel,
  "localPort" | "localPortEnd" | "remotePort" | "remotePortEnd"
> & {
  localPort: string;
  localPortEnd: string;
  remotePort: string;
  remotePortEnd: string;
};
type Errors = Record<string, string>;

function validName(value: string): boolean {
  return (
    value.trim().length > 0 &&
    value.trim().length <= 80 &&
    !/[\u0000-\u001f\u007f]/.test(value)
  );
}

function validHost(value: string): boolean {
  const host = value.trim();
  if (!host || host.length > 255 || /[\s/@?#\\]/.test(host)) return false;
  if (/^[\d.]+$/.test(host)) {
    const parts = host.split(".");
    return (
      parts.length === 4 &&
      parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)
    );
  }
  try {
    if (host.includes(":")) {
      if (host.startsWith("[") && !host.endsWith("]")) return false;
      const literal = host.startsWith("[") ? host : `[${host}]`;
      return new URL(`http://${literal}`).hostname.startsWith("[");
    }
    return (
      host.length <= 253 &&
      host
        .split(".")
        .every((part) => /^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/i.test(part))
    );
  } catch {
    return false;
  }
}

function normalizedHost(value: string): string {
  const host = value.trim();
  return host.startsWith("[") && host.endsWith("]") ? host.slice(1, -1) : host;
}

function validDomain(value: string): boolean {
  const domain = value.trim().replace(/^\*\./, "");
  return (
    validHost(domain) &&
    domain.includes(".") &&
    !domain.includes(":") &&
    !/^\d+(\.\d+){3}$/.test(domain)
  );
}

function portValue(value: string, minimum = 1): number | null {
  if (!/^\d+$/.test(value)) return null;
  const port = Number(value);
  return Number.isInteger(port) && port >= minimum && port <= 65535
    ? port
    : null;
}

export function ProfileEditor({
  profile,
  onClose,
}: {
  profile: Profile | null;
  onClose: () => void;
}) {
  return profile ? (
    <ProfileForm key={profile.id} profile={profile} onClose={onClose} />
  ) : null;
}

function ProfileForm({
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
  const saveProfile = useAppStore((state) => state.saveProfile);
  const [draft, setDraft] = useState<ProfileDraft>({
    ...profile,
    serverPort: String(profile.serverPort),
    webPort: String(profile.webPort),
  });
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showToken, setShowToken] = useState(false);
  const isNew = !profiles.some((item) => item.id === profile.id);
  const currentProcess = profiles.find(
    (item) => item.id === profile.id,
  )?.process;
  const versionLocked =
    !isNew &&
    ["starting", "running", "stopping"].includes(
      currentProcess ?? profile.process,
    );
  const installed = versions.filter((version) => version.installed);
  const selectedInstalled = installed.some(
    (version) => version.version === draft.version,
  );
  const prefix = `profile-${profile.id}`;
  const patch = (changes: Partial<ProfileDraft>) =>
    setDraft((value) => ({ ...value, ...changes }));
  const advanced = draft.advanced ?? {};
  const versionState = getConfigurationVersionState(draft.version);
  const auth = advancedRecord(advanced.auth);
  const transportAdvanced = advancedRecord(advanced.transport);
  const defaultContext = {
    protocol: draft.transport,
    authMethod: typeof auth.method === "string" ? auth.method : "token",
    tcpMux:
      typeof transportAdvanced.tcpMux === "boolean"
        ? transportAdvanced.tcpMux
        : undefined,
    user: draft.user,
    serverAddr: normalizedHost(draft.serverAddr),
  };
  const usesExternalToken = auth.method === "oidc" || Boolean(auth.tokenSource);
  const transportSupported = isConfigCapabilitySupported(
    draft.version,
    `transport.protocol.${draft.transport}`,
    "profile",
  );
  const incompatible = getUnsupportedAdvancedPaths(
    advanced,
    draft.version,
    "profile",
  ).map((setting) => ({
    path: setting.path,
    reason: setting[language === "zh" ? "reasonZh" : "reasonEn"],
  }));
  if (versionState.supported && !transportSupported) {
    const capability = getConfigCapability(
      draft.version,
      `transport.protocol.${draft.transport}`,
      "profile",
    );
    incompatible.push({
      path: "transport.protocol",
      reason: capability[language === "zh" ? "reasonZh" : "reasonEn"],
    });
  }
  const changeAdvanced = (value: Advanced) => {
    const nextAuth = advancedRecord(value.auth);
    patch({
      advanced: value,
      ...(nextAuth.method === "oidc" || nextAuth.tokenSource
        ? { authToken: "" }
        : {}),
    });
  };
  const clearIncompatible = (path: string) => {
    if (path === "transport.protocol") {
      patch({ transport: "tcp" });
      return;
    }
    let value = updateAdvanced(advanced, path, undefined);
    if (path === "auth.method") {
      value = updateAdvanced(value, "auth.oidc", undefined);
      value = updateAdvanced(value, "auth.method", "token");
    }
    changeAdvanced(value);
  };
  const linkedIncompatible = useMemo(() => {
    if (!draft.version) return [];
    return tunnels
      .filter((tunnel) => tunnel.profileId === profile.id)
      .flatMap((tunnel) => {
        const settings = getUnsupportedAdvancedPaths(
          tunnel.advanced,
          draft.version,
          "tunnel",
        ).map((setting) => ({
          path: `${tunnel.name} · ${setting.path}`,
          reason: setting[language === "zh" ? "reasonZh" : "reasonEn"],
        }));
        const typeCapability = getConfigCapability(
          draft.version,
          `type.${tunnel.type}`,
          "tunnel",
        );
        if (!typeCapability.supported)
          settings.push({
            path: `${tunnel.name} · type`,
            reason: typeCapability[language === "zh" ? "reasonZh" : "reasonEn"],
          });
        if (tunnel.https2http) {
          const capability = getConfigCapability(
            draft.version,
            "plugin.type.https2http",
            "tunnel",
          );
          if (!capability.supported)
            settings.push({
              path: `${tunnel.name} · https2http`,
              reason: capability[language === "zh" ? "reasonZh" : "reasonEn"],
            });
        }
        return settings;
      });
  }, [tunnels, profile.id, draft.version, language]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaveError("");
    const next: Errors = {};
    if (!validName(draft.name))
      next.name = t(
        "名称需为 1–80 个字符，不含换行。",
        "Use 1–80 characters without line breaks.",
      );
    if (
      profiles.some(
        (item) =>
          item.id !== profile.id &&
          item.name.trim().toLocaleLowerCase() ===
            draft.name.trim().toLocaleLowerCase(),
      )
    ) {
      next.name = t(
        "已有同名连接，请使用其他名称。",
        "A connection with this name already exists.",
      );
    }
    if (!validHost(draft.serverAddr))
      next.serverAddr = t(
        "输入有效 IP 或主机名，不包含协议或端口。",
        "Enter an IP address or hostname without a scheme or port.",
      );
    const serverPort = portValue(draft.serverPort);
    const webPort = portValue(draft.webPort, 0);
    if (serverPort === null)
      next.serverPort = t(
        "端口需为 1–65535 的整数。",
        "Enter an integer from 1 to 65535.",
      );
    if (webPort === null)
      next.webPort = t(
        "端口需为 0–65535 的整数，0 表示关闭本机管理。",
        "Enter an integer from 0 to 65535; 0 disables local management.",
      );
    const conflict = profiles.find(
      (item) =>
        webPort !== 0 && item.id !== profile.id && item.webPort === webPort,
    );
    if (conflict)
      next.webPort = t(
        `此端口已由「${conflict.name}」使用，请为每个连接设置独立端口。`,
        `This port is used by “${conflict.name}”. Each connection needs a separate port.`,
      );
    if (!selectedInstalled)
      next.version = t(
        "请先安装此版本，或选择已安装的版本。",
        "Install this version first or select an installed version.",
      );
    if (selectedInstalled && !versionState.supported)
      next.version = versionState[language === "zh" ? "reasonZh" : "reasonEn"];
    try {
      validateProfileAdvanced(advanced, draft.transport, draft.authToken);
      if (linkedIncompatible.length)
        throw new ConfigError(
          "请先调整关联隧道中的不兼容配置，再切换连接版本。",
          "Update incompatible settings in the related tunnels before changing this connection’s version.",
        );
      if (incompatible.length)
        throw new ConfigError(
          "当前版本不支持部分配置，请切换版本或清除不兼容设置。",
          "This version does not support some settings. Change the version or clear incompatible settings.",
        );
    } catch (error) {
      next.advanced =
        error instanceof ConfigError ? error[language] : errorMessage(error);
    }
    setErrors(next);
    if (Object.keys(next).length > 0 || serverPort === null || webPort === null)
      return;
    setSaving(true);
    try {
      await saveProfile({
        ...draft,
        name: draft.name.trim(),
        serverAddr: normalizedHost(draft.serverAddr),
        user: draft.user.trim(),
        serverPort,
        webPort,
      });
      toast.success(
        t(
          "连接配置已保存，等待应用。",
          "Connection configuration saved; awaiting apply.",
        ),
      );
      onClose();
    } catch (error) {
      setSaveError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && !saving && onClose()}
      title={
        isNew
          ? t("新建连接", "New connection")
          : t("编辑连接", "Edit connection")
      }
      description={t(
        "每个连接使用独立的客户端配置与本机管理端口。",
        "Each connection has its own client configuration and local management port.",
      )}
      className="editor-dialog"
    >
      <form
        className="editor-form"
        onSubmit={submit}
        noValidate
        aria-busy={saving}
      >
        <fieldset className="editor-fields" disabled={saving}>
          <IncompatibleSettings
            settings={incompatible}
            onClear={clearIncompatible}
            disabled={saving}
          />
          <IncompatibleSettings
            settings={linkedIncompatible}
            title={t(
              "关联隧道需要先调整",
              "Related tunnels need to be updated",
            )}
            description={t(
              "以下隧道的配置不受所选版本支持。请先关闭此编辑器，在隧道页调整这些配置，再回来切换版本。",
              "The selected version does not support these tunnel settings. Close this editor, update them in Tunnels, then return to change the version.",
            )}
          />
          <section className="form-section">
            <h3 className="section-caption">
              {t("连接标识", "Connection identity")}
            </h3>
            <div className="field-grid">
              <Field
                label={t("连接名称", "Connection name")}
                htmlFor={`${prefix}-name`}
                error={errors.name}
              >
                <Input
                  id={`${prefix}-name`}
                  value={draft.name}
                  onChange={(event) => patch({ name: event.target.value })}
                  maxLength={80}
                  autoComplete="off"
                  aria-invalid={Boolean(errors.name)}
                />
              </Field>
              <Field
                label={t("frpc 版本", "frpc version")}
                htmlFor={`${prefix}-version`}
                error={errors.version}
                hint={
                  versionLocked
                    ? t(
                        "请先停止连接，再切换 frpc 版本。",
                        "Stop the connection before changing its frpc version.",
                      )
                    : selectedInstalled && !versionState.supported
                      ? versionState[
                          language === "zh" ? "reasonZh" : "reasonEn"
                        ]
                      : !selectedInstalled
                        ? t(
                            "当前版本尚未安装。请在版本库安装后再使用。",
                            "This version is not installed. Install it in the version library first.",
                          )
                        : t(
                            `仅显示已安装版本。${versionState.reasonZh}`,
                            `Only installed versions are available. ${versionState.reasonEn}`,
                          )
                }
              >
                <Select
                  id={`${prefix}-version`}
                  value={draft.version}
                  disabled={versionLocked}
                  onValueChange={(value) => patch({ version: value })}
                  aria-invalid={Boolean(errors.version)}
                  placeholder={t("请选择版本", "Select a version")}
                  options={[
                    ...(!selectedInstalled && draft.version
                      ? [
                          {
                            value: draft.version,
                            label: `${draft.version} · ${t("未安装", "not installed")}`,
                            disabled: true,
                          },
                        ]
                      : []),
                    ...installed.map((version) => ({
                      value: version.version,
                      label: version.version,
                    })),
                  ]}
                />
              </Field>
              {versionState.supported && (
                <Field
                  label={t("服务器地址", "Server address")}
                  htmlFor={`${prefix}-address`}
                  error={errors.serverAddr}
                >
                  <Input
                    id={`${prefix}-address`}
                    value={draft.serverAddr}
                    onChange={(event) =>
                      patch({ serverAddr: event.target.value })
                    }
                    placeholder="frps.example.test"
                    autoComplete="off"
                    spellCheck={false}
                    aria-invalid={Boolean(errors.serverAddr)}
                  />
                </Field>
              )}
              {versionState.supported && (
                <Field
                  label={t("服务器端口", "Server port")}
                  htmlFor={`${prefix}-port`}
                  error={errors.serverPort}
                >
                  <Input
                    id={`${prefix}-port`}
                    type="number"
                    min={1}
                    max={65535}
                    step={1}
                    value={draft.serverPort}
                    onChange={(event) =>
                      patch({ serverPort: event.target.value })
                    }
                    aria-invalid={Boolean(errors.serverPort)}
                  />
                </Field>
              )}
            </div>
          </section>
          {versionState.supported && (
            <section className="form-section">
              <h3 className="section-caption">
                {t("鉴权与命名空间", "Authentication & namespace")}
              </h3>
              <ProfileAuthenticationFields
                value={advanced}
                onChange={changeAdvanced}
                prefix={prefix}
                disabled={saving}
                version={draft.version}
                scope="profile"
                context={defaultContext}
              />
              <div className="field-grid">
                {!usesExternalToken && (
                  <Field
                    label="Token"
                    htmlFor={`${prefix}-token`}
                    hint={t(
                      "与服务器配置一致；无需 Token 时留空。",
                      "Match the server configuration; leave empty if no token is required.",
                    )}
                  >
                    <div className="input-action-row">
                      <Input
                        id={`${prefix}-token`}
                        type={showToken ? "text" : "password"}
                        value={draft.authToken}
                        onChange={(event) =>
                          patch({ authToken: event.target.value })
                        }
                        autoComplete="new-password"
                        spellCheck={false}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={
                          showToken
                            ? t("隐藏 Token", "Hide token")
                            : t("显示 Token", "Show token")
                        }
                        onClick={() => setShowToken((value) => !value)}
                      >
                        {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                      </Button>
                    </div>
                  </Field>
                )}
                <Field
                  label={t("用户前缀", "User prefix")}
                  htmlFor={`${prefix}-user`}
                  hint={t(
                    "用于区分服务器上的隧道名称，可留空。",
                    "Namespaces tunnel names on the server. Optional.",
                  )}
                >
                  <Input
                    id={`${prefix}-user`}
                    value={draft.user}
                    onChange={(event) => patch({ user: event.target.value })}
                    placeholder={t("例如 production", "e.g. production")}
                    autoComplete="off"
                  />
                </Field>
              </div>
            </section>
          )}
          {versionState.supported && (
            <section className="form-section">
              <h3 className="section-caption">
                {t("传输与本机管理", "Transport & local management")}
              </h3>
              <div className="field-grid">
                <Field
                  label={t("传输协议", "Transport protocol")}
                  htmlFor={`${prefix}-transport`}
                >
                  <Select
                    id={`${prefix}-transport`}
                    value={transportSupported ? draft.transport : ""}
                    placeholder={t(
                      "请选择当前版本支持的协议",
                      "Select a protocol supported by this version",
                    )}
                    onValueChange={(value) => patch({ transport: value })}
                    options={["tcp", "kcp", "quic", "websocket", "wss"]
                      .filter((value) =>
                        isConfigCapabilitySupported(
                          draft.version,
                          `transport.protocol.${value}`,
                          "profile",
                        ),
                      )
                      .map((value) => ({ value, label: value.toUpperCase() }))}
                  />
                </Field>
                <Field
                  label={t("本机管理端口", "Local management port")}
                  htmlFor={`${prefix}-webport`}
                  error={errors.webPort}
                  hint={t(
                    "0 表示关闭；启用时使用独立端口，接口限本机。",
                    "0 disables management. Use a unique local-only port when enabled.",
                  )}
                >
                  <Input
                    id={`${prefix}-webport`}
                    type="number"
                    min={0}
                    max={65535}
                    step={1}
                    value={draft.webPort}
                    onChange={(event) => patch({ webPort: event.target.value })}
                    aria-invalid={Boolean(errors.webPort)}
                  />
                </Field>
                <Checkbox
                  checked={draft.tls}
                  onCheckedChange={(tls) => patch({ tls })}
                  label={t("启用传输 TLS", "Enable transport TLS")}
                />
                <Checkbox
                  checked={draft.autoConnect}
                  onCheckedChange={(autoConnect) => patch({ autoConnect })}
                  label={t(
                    "启动应用时启动此连接",
                    "Start this connection when the app starts",
                  )}
                />
              </div>
            </section>
          )}
          <ProfileAdvancedFields
            value={advanced}
            onChange={changeAdvanced}
            prefix={prefix}
            disabled={saving}
            version={draft.version}
            scope="profile"
            context={defaultContext}
            transport={draft.transport}
            tls={draft.tls}
            webPort={Number(draft.webPort)}
          />
          {errors.advanced && (
            <p className="field-error" role="alert">
              {errors.advanced}
            </p>
          )}
          <p className="form-note">
            {profile.process === "running"
              ? t(
                  "客户端正在运行。保存后标记为待应用，运行配置不会立即改变。",
                  "The client is running. Saving marks changes as pending and does not immediately change the running configuration.",
                )
              : t(
                  "保存配置后，可在连接页启动客户端并应用修改。",
                  "After saving, start the client and apply changes from Connections.",
                )}
          </p>
          {saveError && (
            <p className="field-error" role="alert">
              {saveError}
            </p>
          )}
          <footer className="form-footer">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("取消", "Cancel")}
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving
                ? t("保存中…", "Saving…")
                : t("保存连接", "Save connection")}
            </Button>
          </footer>
        </fieldset>
      </form>
    </Dialog>
  );
}

export function TunnelEditor({
  tunnel,
  onClose,
}: {
  tunnel: Tunnel | null;
  onClose: () => void;
}) {
  return tunnel ? (
    <TunnelForm key={tunnel.id} tunnel={tunnel} onClose={onClose} />
  ) : null;
}

function TunnelForm({
  tunnel,
  onClose,
}: {
  tunnel: Tunnel;
  onClose: () => void;
}) {
  const { t, language } = useI18n();
  const profiles = useAppStore((state) => state.profiles);
  const tunnels = useAppStore((state) => state.tunnels);
  const saveTunnel = useAppStore((state) => state.saveTunnel);
  const [draft, setDraft] = useState<TunnelDraft>({
    ...tunnel,
    localPort: String(tunnel.localPort),
    localPortEnd: String(tunnel.localPortEnd),
    remotePort: String(tunnel.remotePort),
    remotePortEnd: String(tunnel.remotePortEnd),
  });
  const [range, setRange] = useState(
    tunnel.localPortEnd > 0 || tunnel.remotePortEnd > 0,
  );
  const [showSecret, setShowSecret] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const isNew = !tunnels.some((item) => item.id === tunnel.id);
  const isPort = draft.type === "tcp" || draft.type === "udp";
  const isWeb =
    draft.type === "http" || draft.type === "https" || draft.type === "tcpmux";
  const isPrivate =
    draft.type === "stcp" || draft.type === "sudp" || draft.type === "xtcp";
  const isVisitor = isPrivate && draft.role === "visitor";
  const prefix = `tunnel-${tunnel.id}`;
  const patch = (changes: Partial<TunnelDraft>) =>
    setDraft((value) => ({ ...value, ...changes }));
  const advanced = draft.advanced ?? {};
  const selectedProfile = profiles.find((item) => item.id === draft.profileId);
  const profileVersion = selectedProfile?.version ?? "";
  const versionState = getConfigurationVersionState(profileVersion);
  const typeSupported = isConfigCapabilitySupported(
    profileVersion,
    `type.${draft.type}`,
    "tunnel",
  );
  const oldPluginSupported = isConfigCapabilitySupported(
    profileVersion,
    "plugin.type.https2http",
    "tunnel",
  );
  const incompatible = getUnsupportedAdvancedPaths(
    advanced,
    profileVersion,
    "tunnel",
  ).map((setting) => ({
    path: setting.path,
    reason: setting[language === "zh" ? "reasonZh" : "reasonEn"],
  }));
  if (versionState.supported && !typeSupported) {
    const capability = getConfigCapability(
      profileVersion,
      `type.${draft.type}`,
      "tunnel",
    );
    incompatible.push({
      path: "type",
      reason: capability[language === "zh" ? "reasonZh" : "reasonEn"],
    });
  }
  if (versionState.supported && draft.https2http && !oldPluginSupported) {
    const capability = getConfigCapability(
      profileVersion,
      "plugin.type.https2http",
      "tunnel",
    );
    incompatible.push({
      path: "https2http",
      reason: capability[language === "zh" ? "reasonZh" : "reasonEn"],
    });
  }
  const plugin = advancedRecord(advanced.plugin);
  const profileTransport = advancedRecord(selectedProfile?.advanced?.transport);
  const defaultContext = {
    protocol: draft.type,
    role: isVisitor ? ("visitor" as const) : ("provider" as const),
    pluginType: typeof plugin.type === "string" ? plugin.type : undefined,
    tcpMux:
      typeof profileTransport.tcpMux === "boolean"
        ? profileTransport.tcpMux
        : undefined,
    user: selectedProfile?.user ?? "",
    serverAddr: selectedProfile?.serverAddr ?? "",
  };
  const usesPlugin = !isVisitor && Boolean(plugin.type);
  const noListener = isVisitor && advanced.bindPort === -1;
  const domains = Array.isArray(advanced.customDomains)
    ? (advanced.customDomains as string[])
    : [];
  const changeAdvanced = (value: Advanced) => {
    const list = Array.isArray(value.customDomains)
      ? (value.customDomains as string[])
      : [];
    patch({
      advanced: value,
      ...(list.length ? { domain: list[0] } : {}),
      ...(value.plugin ? { https2http: false } : {}),
    });
    if (value.plugin) setRange(false);
  };
  const clearIncompatible = (path: string) => {
    if (path === "type") {
      changeType("tcp");
      return;
    }
    if (path === "https2http") {
      patch({ https2http: false, certPath: "", keyPath: "" });
      return;
    }
    changeAdvanced(
      updateAdvanced(
        advanced,
        path === "plugin.type" ? "plugin" : path,
        undefined,
      ),
    );
  };
  const changeProtocolAdvanced = (
    type: TunnelType,
    role: "provider" | "visitor",
  ) => {
    const next = applicableTunnelAdvanced(advanced, type, role);
    if (Object.keys(advanced).some((key) => !(key in next)))
      toast.info(
        t(
          "不适用的高级设置已从草稿清除，请在保存前检查。",
          "Inapplicable advanced settings were removed from the draft. Review before saving.",
        ),
      );
    return next;
  };

  function changeType(type: TunnelType) {
    patch({
      type,
      advanced: changeProtocolAdvanced(type, draft.role),
      ...(type !== "https" ? { https2http: false } : {}),
    });
    setErrors({});
    if (type !== "tcp" && type !== "udp") setRange(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaveError("");
    const next: Errors = {};
    if (!validName(draft.name))
      next.name = t(
        "名称需为 1–80 个字符，不含换行。",
        "Use 1–80 characters without line breaks.",
      );
    if (
      tunnels.some(
        (item) =>
          item.id !== tunnel.id &&
          item.profileId === draft.profileId &&
          item.name.trim().toLocaleLowerCase() ===
            draft.name.trim().toLocaleLowerCase(),
      )
    ) {
      next.name = t(
        "此连接已有同名隧道，请使用其他名称。",
        "This connection already has a tunnel with this name.",
      );
    }
    if (!profiles.some((profile) => profile.id === draft.profileId))
      next.profileId = t("请选择现有连接。", "Select an existing connection.");
    else if (!versionState.supported)
      next.profileId =
        versionState[language === "zh" ? "reasonZh" : "reasonEn"];
    if (!usesPlugin && !validHost(draft.localIP))
      next.localIP = t(
        "输入有效 IP 或主机名。",
        "Enter a valid IP address or hostname.",
      );
    const localPort = portValue(draft.localPort);
    const remotePort = isPort
      ? portValue(draft.remotePort, range && !usesPlugin ? 1 : 0)
      : 0;
    if (!usesPlugin && localPort === null)
      next.localPort = t(
        "端口需为 1–65535 的整数。",
        "Enter an integer from 1 to 65535.",
      );
    if (isPort && remotePort === null)
      next.remotePort = t(
        range && !usesPlugin
          ? "端口范围需为 1–65535 的整数。"
          : "端口需为 0–65535 的整数；0 表示自动分配。",
        range && !usesPlugin
          ? "Port ranges require an integer from 1 to 65535."
          : "Enter an integer from 0 to 65535; 0 requests automatic allocation.",
      );
    let localPortEnd = 0;
    let remotePortEnd = 0;
    if (isPort && range && !usesPlugin) {
      const localEnd = portValue(draft.localPortEnd);
      const remoteEnd = portValue(draft.remotePortEnd);
      if (localEnd === null)
        next.localPortEnd = t(
          "结束端口需为 1–65535 的整数。",
          "Enter an end port from 1 to 65535.",
        );
      else if (localPort !== null && localEnd < localPort)
        next.localPortEnd = t(
          "结束端口不能小于起始端口。",
          "The end port cannot be less than the start port.",
        );
      if (remoteEnd === null)
        next.remotePortEnd = t(
          "结束端口需为 1–65535 的整数。",
          "Enter an end port from 1 to 65535.",
        );
      else if (remotePort !== null && remoteEnd < remotePort)
        next.remotePortEnd = t(
          "结束端口不能小于起始端口。",
          "The end port cannot be less than the start port.",
        );
      if (
        localPort !== null &&
        remotePort !== null &&
        localEnd !== null &&
        remoteEnd !== null &&
        localEnd - localPort !== remoteEnd - remotePort
      ) {
        next.remotePortEnd = t(
          "本机与远端端口范围需包含相同数量的端口。",
          "Local and remote ranges must contain the same number of ports.",
        );
      }
      localPortEnd = localEnd ?? 0;
      remotePortEnd = remoteEnd ?? 0;
    }
    if (
      isWeb &&
      !(
        domains.length ||
        (typeof advanced.subdomain === "string" && advanced.subdomain.trim())
      ) &&
      !validDomain(draft.domain)
    ) {
      next.domain = t(
        "输入有效域名，如 app.example.test 或 *.example.test，不含协议或路径。",
        "Enter a domain such as app.example.test or *.example.test, without a scheme or path.",
      );
    }
    if (isVisitor && !validName(draft.serverName))
      next.serverName = t(
        "输入目标服务器上的提供者隧道名称。",
        "Enter the provider tunnel name on the target server.",
      );
    if (!usesPlugin && draft.type === "https" && draft.https2http) {
      if (!draft.certPath.trim() && draft.keyPath.trim())
        next.certPath = t(
          "填写 HTTPS 证书文件路径。",
          "Enter the HTTPS certificate file path.",
        );
      if (!draft.keyPath.trim() && draft.certPath.trim())
        next.keyPath = t(
          "填写证书对应的私钥文件路径。",
          "Enter the matching private-key file path.",
        );
    }
    try {
      validateTunnelAdvanced(
        advanced,
        draft.type,
        isVisitor ? "visitor" : "provider",
      );
      if (incompatible.length)
        throw new ConfigError(
          "所属连接的 frpc 版本不支持部分配置，请切换版本或清除不兼容设置。",
          "The connection’s frpc version does not support some settings. Change the version or clear incompatible settings.",
        );
    } catch (error) {
      next.advanced =
        error instanceof ConfigError ? error[language] : errorMessage(error);
    }
    setErrors(next);
    if (
      Object.keys(next).length > 0 ||
      (!usesPlugin && localPort === null) ||
      remotePort === null
    )
      return;
    setSaving(true);
    try {
      await saveTunnel({
        ...draft,
        name: draft.name.trim(),
        localIP:
          usesPlugin && !validHost(draft.localIP)
            ? "127.0.0.1"
            : normalizedHost(draft.localIP),
        localPort: localPort ?? 8080,
        remotePort,
        localPortEnd: usesPlugin ? 0 : localPortEnd,
        remotePortEnd: usesPlugin ? 0 : remotePortEnd,
        domain: isWeb ? (domains[0] ?? draft.domain.trim()) : "",
        role: isPrivate ? draft.role : "provider",
        secretKey: isPrivate ? draft.secretKey : "",
        serverName: isVisitor ? draft.serverName.trim() : "",
        https2http: !usesPlugin && draft.type === "https" && draft.https2http,
        certPath:
          !usesPlugin && draft.type === "https" && draft.https2http
            ? draft.certPath.trim()
            : "",
        keyPath:
          !usesPlugin && draft.type === "https" && draft.https2http
            ? draft.keyPath.trim()
            : "",
      });
      toast.success(
        t(
          "隧道配置已保存，等待应用。",
          "Tunnel configuration saved; awaiting apply.",
        ),
      );
      onClose();
    } catch (error) {
      setSaveError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && !saving && onClose()}
      title={isNew ? t("新建隧道", "New tunnel") : t("编辑隧道", "Edit tunnel")}
      description={t(
        "按协议填写规格。保存后在所属连接应用配置。",
        "Define the protocol-specific configuration, then apply it to its connection after saving.",
      )}
      className="editor-dialog"
    >
      <form
        className="editor-form"
        onSubmit={submit}
        noValidate
        aria-busy={saving}
      >
        <fieldset className="editor-fields" disabled={saving}>
          <IncompatibleSettings
            settings={incompatible}
            onClear={clearIncompatible}
            disabled={saving}
          />
          <section className="form-section">
            <h3 className="section-caption">
              {t("隧道标识", "Tunnel identity")}
            </h3>
            <div className="field-grid">
              <Field
                label={t("隧道名称", "Tunnel name")}
                htmlFor={`${prefix}-name`}
                error={errors.name}
              >
                <Input
                  id={`${prefix}-name`}
                  value={draft.name}
                  onChange={(event) => patch({ name: event.target.value })}
                  maxLength={80}
                  autoComplete="off"
                  aria-invalid={Boolean(errors.name)}
                />
              </Field>
              <Field
                label={t("所属连接", "Connection")}
                htmlFor={`${prefix}-profile`}
                error={errors.profileId}
                hint={
                  profileVersion
                    ? t(
                        `frpc ${profileVersion} · ${versionState.reasonZh}`,
                        `frpc ${profileVersion} · ${versionState.reasonEn}`,
                      )
                    : t(
                        "选择连接后显示该 frpc 版本支持的字段。",
                        "Choose a connection to show fields supported by its frpc version.",
                      )
                }
              >
                <Select
                  id={`${prefix}-profile`}
                  value={draft.profileId}
                  onValueChange={(value) => patch({ profileId: value })}
                  aria-invalid={Boolean(errors.profileId)}
                  options={[
                    { value: "", label: t("选择连接", "Select a connection") },
                    ...profiles.map((profile) => ({
                      value: profile.id,
                      label: profile.name,
                    })),
                  ]}
                />
              </Field>
              <Field
                label={t("隧道协议", "Tunnel protocol")}
                htmlFor={`${prefix}-type`}
              >
                <Select
                  id={`${prefix}-type`}
                  value={typeSupported ? draft.type : ""}
                  placeholder={t(
                    "请选择当前版本支持的协议",
                    "Select a protocol supported by this version",
                  )}
                  onValueChange={(value) => changeType(value as TunnelType)}
                  options={(
                    [
                      "tcp",
                      "udp",
                      "http",
                      "https",
                      "stcp",
                      "sudp",
                      "xtcp",
                      "tcpmux",
                    ] satisfies TunnelType[]
                  )
                    .filter((value) =>
                      isConfigCapabilitySupported(
                        profileVersion,
                        `type.${value}`,
                        "tunnel",
                      ),
                    )
                    .map((value) => ({ value, label: value.toUpperCase() }))}
                />
              </Field>
              {versionState.supported &&
                (isPrivate ? (
                  <Field
                    label={t("连接角色", "Connection role")}
                    htmlFor={`${prefix}-role`}
                  >
                    <Select
                      id={`${prefix}-role`}
                      value={draft.role}
                      onValueChange={(value) => {
                        const role = value as Tunnel["role"];
                        patch({
                          role,
                          advanced: changeProtocolAdvanced(draft.type, role),
                        });
                        setErrors({});
                      }}
                      options={[
                        {
                          value: "provider",
                          label: t(
                            "提供者 · 暴露本机服务",
                            "Provider · expose a local service",
                          ),
                        },
                        {
                          value: "visitor",
                          label: t(
                            "访客 · 访问提供者服务",
                            "Visitor · access a provider service",
                          ),
                        },
                      ]}
                    />
                  </Field>
                ) : (
                  <Checkbox
                    checked={draft.enabled}
                    onCheckedChange={(enabled) => patch({ enabled })}
                    label={t("启用此隧道", "Enable this tunnel")}
                  />
                ))}
            </div>
          </section>
          {versionState.supported && (
            <section className="form-section">
              <h3 className="section-caption">
                {isVisitor
                  ? t("本机访问入口", "Local access endpoint")
                  : t("本机服务目标", "Local service target")}
              </h3>
              {usesPlugin && (
                <p className="field-hint">
                  {t(
                    "本机服务目标在下方客户端插件参数中设置。",
                    "Set the local service target in the client plugin parameters below.",
                  )}
                </p>
              )}
              <div className="field-grid">
                {!usesPlugin && (
                  <Field
                    label={
                      isVisitor
                        ? t("本机监听地址", "Local bind address")
                        : t("本机地址", "Local address")
                    }
                    htmlFor={`${prefix}-localip`}
                    error={errors.localIP}
                    hint={
                      noListener
                        ? t(
                            "已关闭本机监听；此地址暂不使用。",
                            "Local listening is disabled; this address is currently unused.",
                          )
                        : isVisitor
                          ? t(
                              "访客通过此本机地址访问远端服务。",
                              "The visitor accesses the remote service through this local address.",
                            )
                          : undefined
                    }
                  >
                    <Input
                      id={`${prefix}-localip`}
                      disabled={noListener}
                      value={draft.localIP}
                      onChange={(event) =>
                        patch({ localIP: event.target.value })
                      }
                      placeholder="127.0.0.1"
                      spellCheck={false}
                      autoComplete="off"
                      aria-invalid={Boolean(errors.localIP)}
                    />
                  </Field>
                )}
                {!usesPlugin && (
                  <Field
                    label={
                      isVisitor
                        ? t("本机监听端口", "Local bind port")
                        : range && isPort
                          ? t("本机起始端口", "Local start port")
                          : t("本机端口", "Local port")
                    }
                    htmlFor={`${prefix}-localport`}
                    error={errors.localPort}
                    hint={
                      noListener
                        ? t(
                            "已关闭本机监听；保留端口以便恢复监听。",
                            "Local listening is disabled; this port is retained for re-enabling it.",
                          )
                        : isVisitor
                          ? t(
                              "填写本机访问入口实际监听的端口。",
                              "Enter the local access endpoint’s listening port.",
                            )
                          : t(
                              "填写本机服务实际监听的端口。",
                              "Enter the local service’s listening port.",
                            )
                    }
                  >
                    <Input
                      id={`${prefix}-localport`}
                      disabled={noListener}
                      type="number"
                      min={1}
                      max={65535}
                      step={1}
                      value={draft.localPort}
                      onChange={(event) =>
                        patch({ localPort: event.target.value })
                      }
                      aria-invalid={Boolean(errors.localPort)}
                    />
                  </Field>
                )}
                {isPort && (
                  <Field
                    label={
                      range
                        ? t("远端起始端口", "Remote start port")
                        : t("远端端口", "Remote port")
                    }
                    htmlFor={`${prefix}-remoteport`}
                    error={errors.remotePort}
                    hint={
                      !range || usesPlugin
                        ? t(
                            "0 由服务器自动分配端口。",
                            "0 lets the server allocate a port automatically.",
                          )
                        : undefined
                    }
                  >
                    <Input
                      id={`${prefix}-remoteport`}
                      type="number"
                      min={range && !usesPlugin ? 1 : 0}
                      max={65535}
                      step={1}
                      value={draft.remotePort}
                      onChange={(event) =>
                        patch({ remotePort: event.target.value })
                      }
                      aria-invalid={Boolean(errors.remotePort)}
                    />
                  </Field>
                )}
                {isWeb && (
                  <Field
                    label={t("访问域名", "Public domain")}
                    htmlFor={`${prefix}-domain`}
                    error={errors.domain}
                    hint={
                      domains.length
                        ? t(
                            "由高级配置的多域名列表维护。",
                            "Managed by the domain list in advanced configuration.",
                          )
                        : typeof advanced.subdomain === "string" &&
                            advanced.subdomain.trim()
                          ? t(
                              "已指定子域名，此域名可留空。",
                              "A subdomain is configured; this domain may be left empty.",
                            )
                          : undefined
                    }
                  >
                    <Input
                      id={`${prefix}-domain`}
                      disabled={domains.length > 0}
                      value={draft.domain}
                      onChange={(event) =>
                        patch({ domain: event.target.value })
                      }
                      placeholder="app.example.test"
                      spellCheck={false}
                      autoComplete="off"
                      aria-invalid={Boolean(errors.domain)}
                    />
                  </Field>
                )}
              </div>
              {isPort && !usesPlugin && (
                <div className="form-option">
                  <Checkbox
                    checked={range}
                    onCheckedChange={(checked) => {
                      setRange(checked);
                      if (checked)
                        patch({
                          localPortEnd:
                            draft.localPortEnd === "0"
                              ? draft.localPort
                              : draft.localPortEnd,
                          remotePortEnd:
                            draft.remotePortEnd === "0"
                              ? draft.remotePort
                              : draft.remotePortEnd,
                        });
                    }}
                    label={t("映射端口范围", "Map a port range")}
                  />
                </div>
              )}
              {isPort && range && !usesPlugin && (
                <div className="field-grid">
                  <Field
                    label={t("本机结束端口", "Local end port")}
                    htmlFor={`${prefix}-localend`}
                    error={errors.localPortEnd}
                  >
                    <Input
                      id={`${prefix}-localend`}
                      type="number"
                      min={1}
                      max={65535}
                      step={1}
                      value={draft.localPortEnd}
                      onChange={(event) =>
                        patch({ localPortEnd: event.target.value })
                      }
                      aria-invalid={Boolean(errors.localPortEnd)}
                    />
                  </Field>
                  <Field
                    label={t("远端结束端口", "Remote end port")}
                    htmlFor={`${prefix}-remoteend`}
                    error={errors.remotePortEnd}
                    hint={t(
                      "本机与远端范围中的端口数量需一致。",
                      "Local and remote ranges must contain the same number of ports.",
                    )}
                  >
                    <Input
                      id={`${prefix}-remoteend`}
                      type="number"
                      min={1}
                      max={65535}
                      step={1}
                      value={draft.remotePortEnd}
                      onChange={(event) =>
                        patch({ remotePortEnd: event.target.value })
                      }
                      aria-invalid={Boolean(errors.remotePortEnd)}
                    />
                  </Field>
                </div>
              )}
            </section>
          )}
          {versionState.supported && isPrivate && (
            <section className="form-section">
              <h3 className="section-caption">
                {t("私有访问", "Private access")}
              </h3>
              <div className="field-grid">
                {isVisitor && (
                  <Field
                    label={t("目标提供者名称", "Target provider name")}
                    htmlFor={`${prefix}-provider`}
                    error={errors.serverName}
                    hint={t(
                      "填写服务器上提供者的隧道名称，不是连接名称。",
                      "Use the provider tunnel name on the server, not its connection name.",
                    )}
                  >
                    <Input
                      id={`${prefix}-provider`}
                      value={draft.serverName}
                      onChange={(event) =>
                        patch({ serverName: event.target.value })
                      }
                      maxLength={80}
                      autoComplete="off"
                      aria-invalid={Boolean(errors.serverName)}
                    />
                  </Field>
                )}
                <Field
                  label={t("访问密钥", "Access key")}
                  htmlFor={`${prefix}-secret`}
                  error={errors.secretKey}
                  hint={t(
                    "可留空；提供者与访客的密钥需保持一致。",
                    "Optional; the provider and visitor must use the same key.",
                  )}
                >
                  <div className="input-action-row">
                    <Input
                      id={`${prefix}-secret`}
                      type={showSecret ? "text" : "password"}
                      value={draft.secretKey}
                      onChange={(event) =>
                        patch({ secretKey: event.target.value })
                      }
                      autoComplete="new-password"
                      spellCheck={false}
                      aria-invalid={Boolean(errors.secretKey)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={
                        showSecret
                          ? t("隐藏访问密钥", "Hide access key")
                          : t("显示访问密钥", "Show access key")
                      }
                      onClick={() => setShowSecret((value) => !value)}
                    >
                      {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                </Field>
              </div>
            </section>
          )}
          {versionState.supported && (
            <section className="form-section">
              <h3 className="section-caption">
                {t("传输选项", "Transport options")}
              </h3>
              <div className="field-grid">
                <Checkbox
                  checked={draft.encryption}
                  onCheckedChange={(encryption) => patch({ encryption })}
                  label={t("启用加密", "Enable encryption")}
                />
                <Checkbox
                  checked={draft.compression}
                  onCheckedChange={(compression) => patch({ compression })}
                  label={t("启用压缩", "Enable compression")}
                />
                {draft.type === "https" &&
                  !usesPlugin &&
                  oldPluginSupported && (
                    <Checkbox
                      checked={draft.https2http}
                      onCheckedChange={(https2http) => patch({ https2http })}
                      label={t(
                        "HTTPS 转发至本机 HTTP",
                        "Forward HTTPS to local HTTP",
                      )}
                    />
                  )}
                {isPrivate && (
                  <Checkbox
                    checked={draft.enabled}
                    onCheckedChange={(enabled) => patch({ enabled })}
                    label={t("启用此隧道", "Enable this tunnel")}
                  />
                )}
              </div>
              {draft.type === "https" &&
                !usesPlugin &&
                oldPluginSupported &&
                draft.https2http && (
                  <div className="field-grid">
                    <Field
                      label={t("HTTPS 证书路径", "HTTPS certificate path")}
                      htmlFor={`${prefix}-certificate`}
                      error={errors.certPath}
                      hint={t(
                        "证书和私钥需同时填写或同时留空；启动时由 frpc 验证。",
                        "Set both certificate and key paths, or leave both empty; frpc validates them when starting.",
                      )}
                    >
                      <Input
                        id={`${prefix}-certificate`}
                        value={draft.certPath}
                        onChange={(event) =>
                          patch({ certPath: event.target.value })
                        }
                        placeholder="C:/certs/server.crt"
                        spellCheck={false}
                        autoComplete="off"
                        aria-invalid={Boolean(errors.certPath)}
                      />
                    </Field>
                    <Field
                      label={t("私钥路径", "Private-key path")}
                      htmlFor={`${prefix}-keypath`}
                      error={errors.keyPath}
                    >
                      <Input
                        id={`${prefix}-keypath`}
                        value={draft.keyPath}
                        onChange={(event) =>
                          patch({ keyPath: event.target.value })
                        }
                        placeholder="C:/certs/server.key"
                        spellCheck={false}
                        autoComplete="off"
                        aria-invalid={Boolean(errors.keyPath)}
                      />
                    </Field>
                  </div>
                )}
            </section>
          )}
          <TunnelAdvancedFields
            value={advanced}
            onChange={changeAdvanced}
            prefix={prefix}
            disabled={saving}
            version={profileVersion}
            scope="tunnel"
            context={defaultContext}
            type={draft.type}
            role={isVisitor ? "visitor" : "provider"}
          />
          {errors.advanced && (
            <p className="field-error" role="alert">
              {errors.advanced}
            </p>
          )}
          <p className="form-note">
            {t(
              "保存只更新配置并标记待应用。请在所属连接应用修改。",
              "Saving updates the configuration and marks it as pending. Apply changes to its connection afterward.",
            )}
          </p>
          {saveError && (
            <p className="field-error" role="alert">
              {saveError}
            </p>
          )}
          <footer className="form-footer">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("取消", "Cancel")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={saving || profiles.length === 0}
            >
              {saving ? t("保存中…", "Saving…") : t("保存隧道", "Save tunnel")}
            </Button>
          </footer>
        </fieldset>
      </form>
    </Dialog>
  );
}
