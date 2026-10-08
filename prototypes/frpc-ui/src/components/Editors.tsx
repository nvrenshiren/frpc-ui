import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import type { Profile, Tunnel, TunnelType } from "../model";
import { useAppStore } from "../store";
import { useI18n } from "../i18n";
import { Button, Checkbox, Dialog, Field, Input, Select } from "./ui";

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
  if (!host || /[\s/@?#\\]/.test(host)) return false;
  if (/^[\d.]+$/.test(host)) {
    const parts = host.split(".");
    return (
      parts.length === 4 &&
      parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)
    );
  }
  try {
    if (host.includes(":")) {
      const literal = host.startsWith("[") ? host : `[${host}]`;
      return new URL(`http://${literal}`).hostname.startsWith("[");
    }
    const normalized = new URL(`http://${host}`).hostname.replace(/\.$/, "");
    return (
      normalized.length <= 253 &&
      normalized
        .split(".")
        .every((part) => /^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/i.test(part))
    );
  } catch {
    return false;
  }
}

function portValue(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const port = Number(value);
  return Number.isInteger(port) && port >= 1 && port <= 65535 ? port : null;
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
  const { t } = useI18n();
  const profiles = useAppStore((state) => state.profiles);
  const versions = useAppStore((state) => state.versions);
  const saveProfile = useAppStore((state) => state.saveProfile);
  const [draft, setDraft] = useState<ProfileDraft>({
    ...profile,
    serverPort: String(profile.serverPort),
    webPort: String(profile.webPort),
  });
  const [errors, setErrors] = useState<Errors>({});
  const [showToken, setShowToken] = useState(false);
  const isNew = !profiles.some((item) => item.id === profile.id);
  const installed = versions.filter((version) => version.installed);
  const selectedInstalled = installed.some(
    (version) => version.version === draft.version,
  );
  const prefix = `profile-${profile.id}`;
  const patch = (changes: Partial<ProfileDraft>) =>
    setDraft((value) => ({ ...value, ...changes }));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    const webPort = portValue(draft.webPort);
    if (serverPort === null)
      next.serverPort = t(
        "端口需为 1–65535 的整数。",
        "Enter an integer from 1 to 65535.",
      );
    if (webPort === null)
      next.webPort = t(
        "端口需为 1–65535 的整数。",
        "Enter an integer from 1 to 65535.",
      );
    const conflict = profiles.find(
      (item) => item.id !== profile.id && item.webPort === webPort,
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
    setErrors(next);
    if (Object.keys(next).length > 0 || serverPort === null || webPort === null)
      return;
    saveProfile({
      ...draft,
      name: draft.name.trim(),
      serverAddr: draft.serverAddr.trim(),
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
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
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
      <form className="editor-form" onSubmit={submit} noValidate>
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
                !selectedInstalled
                  ? t(
                      "当前版本尚未安装。请在版本库安装后再使用。",
                      "This version is not installed. Install it in the version library first.",
                    )
                  : t(
                      "仅显示已安装版本。",
                      "Only installed versions are available.",
                    )
              }
            >
              <Select
                id={`${prefix}-version`}
                value={draft.version}
                onChange={(event) => patch({ version: event.target.value })}
                aria-invalid={Boolean(errors.version)}
              >
                {!selectedInstalled && (
                  <option value={draft.version} disabled>
                    {draft.version || t("请选择版本", "Select a version")} ·{" "}
                    {t("未安装", "not installed")}
                  </option>
                )}
                {installed.map((version) => (
                  <option key={version.id} value={version.version}>
                    {version.version}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label={t("服务器地址", "Server address")}
              htmlFor={`${prefix}-address`}
              error={errors.serverAddr}
            >
              <Input
                id={`${prefix}-address`}
                value={draft.serverAddr}
                onChange={(event) => patch({ serverAddr: event.target.value })}
                placeholder="frps.example.test"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={Boolean(errors.serverAddr)}
              />
            </Field>
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
                onChange={(event) => patch({ serverPort: event.target.value })}
                aria-invalid={Boolean(errors.serverPort)}
              />
            </Field>
          </div>
        </section>
        <section className="form-section">
          <h3 className="section-caption">
            {t("鉴权与命名空间", "Authentication & namespace")}
          </h3>
          <div className="field-grid">
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
                  onChange={(event) => patch({ authToken: event.target.value })}
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
                value={draft.transport}
                onChange={(event) => patch({ transport: event.target.value })}
              >
                {["tcp", "kcp", "quic", "websocket", "wss"].map((protocol) => (
                  <option key={protocol} value={protocol}>
                    {protocol.toUpperCase()}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label={t("本机管理端口", "Local management port")}
              htmlFor={`${prefix}-webport`}
              error={errors.webPort}
              hint={t(
                "不同连接使用不同端口，管理接口限本机。",
                "Use a unique port for each connection; management is local only.",
              )}
            >
              <Input
                id={`${prefix}-webport`}
                type="number"
                min={1}
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
        <footer className="form-footer">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("取消", "Cancel")}
          </Button>
          <Button type="submit" variant="primary">
            {t("保存连接", "Save connection")}
          </Button>
        </footer>
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
  const { t } = useI18n();
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
  const isNew = !tunnels.some((item) => item.id === tunnel.id);
  const isPort = draft.type === "tcp" || draft.type === "udp";
  const isWeb = draft.type === "http" || draft.type === "https";
  const isPrivate =
    draft.type === "stcp" || draft.type === "sudp" || draft.type === "xtcp";
  const isVisitor = isPrivate && draft.role === "visitor";
  const prefix = `tunnel-${tunnel.id}`;
  const patch = (changes: Partial<TunnelDraft>) =>
    setDraft((value) => ({ ...value, ...changes }));

  function changeType(type: TunnelType) {
    patch({ type });
    setErrors({});
    if (type !== "tcp" && type !== "udp") setRange(false);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    if (!validHost(draft.localIP))
      next.localIP = t(
        "输入有效 IP 或主机名。",
        "Enter a valid IP address or hostname.",
      );
    const localPort = portValue(draft.localPort);
    const remotePort = isPort ? portValue(draft.remotePort) : 0;
    if (localPort === null)
      next.localPort = t(
        "端口需为 1–65535 的整数。",
        "Enter an integer from 1 to 65535.",
      );
    if (isPort && remotePort === null)
      next.remotePort = t(
        "端口需为 1–65535 的整数。",
        "Enter an integer from 1 to 65535.",
      );
    let localPortEnd = 0;
    let remotePortEnd = 0;
    if (isPort && range) {
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
      (!validHost(draft.domain) ||
        !draft.domain.trim().includes(".") ||
        /^\d+(\.\d+){3}$/.test(draft.domain.trim()))
    ) {
      next.domain = t(
        "输入有效域名，如 app.example.test，不含协议或路径。",
        "Enter a domain such as app.example.test, without a scheme or path.",
      );
    }
    if (isPrivate && !draft.secretKey.trim())
      next.secretKey = t(
        "提供者与访客需使用相同的访问密钥。",
        "A provider and its visitor need the same access key.",
      );
    if (isVisitor && !validName(draft.serverName))
      next.serverName = t(
        "输入目标服务器上的提供者隧道名称。",
        "Enter the provider tunnel name on the target server.",
      );
    if (draft.type === "https" && draft.https2http) {
      if (!draft.certPath.trim())
        next.certPath = t(
          "填写 HTTPS 证书文件路径。",
          "Enter the HTTPS certificate file path.",
        );
      if (!draft.keyPath.trim())
        next.keyPath = t(
          "填写证书对应的私钥文件路径。",
          "Enter the matching private-key file path.",
        );
    }
    setErrors(next);
    if (
      Object.keys(next).length > 0 ||
      localPort === null ||
      remotePort === null
    )
      return;
    saveTunnel({
      ...draft,
      name: draft.name.trim(),
      localIP: draft.localIP.trim(),
      localPort,
      remotePort,
      localPortEnd,
      remotePortEnd,
      domain: isWeb ? draft.domain.trim() : "",
      role: isPrivate ? draft.role : "provider",
      secretKey: isPrivate ? draft.secretKey : "",
      serverName: isVisitor ? draft.serverName.trim() : "",
      https2http: draft.type === "https" && draft.https2http,
      certPath:
        draft.type === "https" && draft.https2http ? draft.certPath.trim() : "",
      keyPath:
        draft.type === "https" && draft.https2http ? draft.keyPath.trim() : "",
    });
    toast.success(
      t(
        "隧道配置已保存，等待应用。",
        "Tunnel configuration saved; awaiting apply.",
      ),
    );
    onClose();
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={isNew ? t("新建隧道", "New tunnel") : t("编辑隧道", "Edit tunnel")}
      description={t(
        "按协议填写规格。保存后在所属连接应用配置。",
        "Define the protocol-specific configuration, then apply it to its connection after saving.",
      )}
      className="editor-dialog"
    >
      <form className="editor-form" onSubmit={submit} noValidate>
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
            >
              <Select
                id={`${prefix}-profile`}
                value={draft.profileId}
                onChange={(event) => patch({ profileId: event.target.value })}
                aria-invalid={Boolean(errors.profileId)}
              >
                <option value="">{t("选择连接", "Select a connection")}</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label={t("隧道协议", "Tunnel protocol")}
              htmlFor={`${prefix}-type`}
            >
              <Select
                id={`${prefix}-type`}
                value={draft.type}
                onChange={(event) =>
                  changeType(event.target.value as TunnelType)
                }
              >
                {(
                  [
                    "tcp",
                    "udp",
                    "http",
                    "https",
                    "stcp",
                    "sudp",
                    "xtcp",
                  ] satisfies TunnelType[]
                ).map((type) => (
                  <option key={type} value={type}>
                    {type.toUpperCase()}
                  </option>
                ))}
              </Select>
            </Field>
            {isPrivate ? (
              <Field
                label={t("连接角色", "Connection role")}
                htmlFor={`${prefix}-role`}
              >
                <Select
                  id={`${prefix}-role`}
                  value={draft.role}
                  onChange={(event) =>
                    patch({ role: event.target.value as Tunnel["role"] })
                  }
                >
                  <option value="provider">
                    {t(
                      "提供者 · 暴露本机服务",
                      "Provider · expose a local service",
                    )}
                  </option>
                  <option value="visitor">
                    {t(
                      "访客 · 访问提供者服务",
                      "Visitor · access a provider service",
                    )}
                  </option>
                </Select>
              </Field>
            ) : (
              <Checkbox
                checked={draft.enabled}
                onCheckedChange={(enabled) => patch({ enabled })}
                label={t("启用此隧道", "Enable this tunnel")}
              />
            )}
          </div>
        </section>
        <section className="form-section">
          <h3 className="section-caption">
            {isVisitor
              ? t("本机访问入口", "Local access endpoint")
              : t("本机服务目标", "Local service target")}
          </h3>
          <div className="field-grid">
            <Field
              label={
                isVisitor
                  ? t("本机监听地址", "Local bind address")
                  : t("本机地址", "Local address")
              }
              htmlFor={`${prefix}-localip`}
              error={errors.localIP}
              hint={
                isVisitor
                  ? t(
                      "访客通过此本机地址访问远端服务。",
                      "The visitor accesses the remote service through this local address.",
                    )
                  : undefined
              }
            >
              <Input
                id={`${prefix}-localip`}
                value={draft.localIP}
                onChange={(event) => patch({ localIP: event.target.value })}
                placeholder="127.0.0.1"
                spellCheck={false}
                autoComplete="off"
                aria-invalid={Boolean(errors.localIP)}
              />
            </Field>
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
            >
              <Input
                id={`${prefix}-localport`}
                type="number"
                min={1}
                max={65535}
                step={1}
                value={draft.localPort}
                onChange={(event) => patch({ localPort: event.target.value })}
                aria-invalid={Boolean(errors.localPort)}
              />
            </Field>
            {isPort && (
              <Field
                label={
                  range
                    ? t("远端起始端口", "Remote start port")
                    : t("远端端口", "Remote port")
                }
                htmlFor={`${prefix}-remoteport`}
                error={errors.remotePort}
              >
                <Input
                  id={`${prefix}-remoteport`}
                  type="number"
                  min={1}
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
              >
                <Input
                  id={`${prefix}-domain`}
                  value={draft.domain}
                  onChange={(event) => patch({ domain: event.target.value })}
                  placeholder="app.example.test"
                  spellCheck={false}
                  autoComplete="off"
                  aria-invalid={Boolean(errors.domain)}
                />
              </Field>
            )}
          </div>
          {isPort && (
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
          {isPort && range && (
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
        {isPrivate && (
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
                  "提供者与访客的密钥必须一致。",
                  "The provider and visitor must use the same key.",
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
            {draft.type === "https" && (
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
          {draft.type === "https" && draft.https2http && (
            <div className="field-grid">
              <Field
                label={t("HTTPS 证书路径", "HTTPS certificate path")}
                htmlFor={`${prefix}-certificate`}
                error={errors.certPath}
                hint={t(
                  "原型记录路径，不读取或验证本机文件。",
                  "The prototype records the path without reading or validating local files.",
                )}
              >
                <Input
                  id={`${prefix}-certificate`}
                  value={draft.certPath}
                  onChange={(event) => patch({ certPath: event.target.value })}
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
                  onChange={(event) => patch({ keyPath: event.target.value })}
                  placeholder="C:/certs/server.key"
                  spellCheck={false}
                  autoComplete="off"
                  aria-invalid={Boolean(errors.keyPath)}
                />
              </Field>
            </div>
          )}
        </section>
        <p className="form-note">
          {t(
            "保存只更新配置并标记待应用。请在所属连接应用修改。",
            "Saving updates the configuration and marks it as pending. Apply changes to its connection afterward.",
          )}
        </p>
        <footer className="form-footer">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("取消", "Cancel")}
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={profiles.length === 0}
          >
            {t("保存隧道", "Save tunnel")}
          </Button>
        </footer>
      </form>
    </Dialog>
  );
}
