import { useEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, ChevronDown, Eye, EyeOff } from "lucide-react";
import type { TunnelType } from "../model";
import { useI18n } from "../i18n";
import {
  getConfigCapability,
  isConfigCapabilitySupported,
} from "../configCapabilities";
import { getConfigDefault } from "../configDefaults";
import { Button, Checkbox, Field, Input, Select } from "./ui";
import "./advanced-fields.css";

export type Advanced = Record<string, unknown>;
type Labels = [string, string];
type Kind =
  | "text"
  | "password"
  | "number"
  | "boolean"
  | "select"
  | "list"
  | "map"
  | "headers";
type Spec = {
  path: string;
  label: Labels;
  kind?: Kind;
  hint?: Labels;
  options?: string[];
  min?: number;
  max?: number;
  placeholder?: string;
};
type Props = {
  value: Advanced;
  onChange: (value: Advanced) => void;
  prefix: string;
  disabled?: boolean;
  version: string;
  scope: "profile" | "tunnel";
  context?: NonNullable<Parameters<typeof getConfigDefault>[3]>;
};

function DefaultState({
  official,
  explicit,
  onReset,
  disabled,
  descriptionId,
}: {
  official: ReturnType<typeof getConfigDefault>;
  explicit: boolean;
  onReset: () => void;
  disabled?: boolean;
  descriptionId?: string;
}) {
  const { t, language } = useI18n();
  if (
    !official.hasDefault &&
    !["environment", "context"].includes(official.kind)
  )
    return null;
  const detailed = official.kind !== "fixed" || official.audited === false;
  return (
    <div className="advanced-default-state">
      <span id={descriptionId}>
        {explicit
          ? t("已自定义", "Custom")
          : official.kind === "managed"
            ? t("应用预设", "Application preset")
            : official.kind === "environment"
              ? t("环境默认", "Environment default")
              : official.kind === "context"
                ? t("联动默认", "Context default")
                : t("官方默认", "Official default")}
        {detailed && (
          <span className="advanced-default-reason">
            {official[language === "zh" ? "reasonZh" : "reasonEn"]}
          </span>
        )}
      </span>
      {explicit && (
        <Button variant="ghost" size="sm" disabled={disabled} onClick={onReset}>
          {t("恢复默认", "Reset to default")}
        </Button>
      )}
    </div>
  );
}

export type IncompatibleSetting = {
  path: string;
  reason: string;
};

export function IncompatibleSettings({
  settings,
  onClear,
  disabled,
  title,
  description,
}: {
  settings: IncompatibleSetting[];
  onClear?: (path: string) => void;
  disabled?: boolean;
  title?: string;
  description?: string;
}) {
  const { t } = useI18n();
  if (!settings.length) return null;
  return (
    <section className="version-incompatible" aria-live="polite">
      <h3>
        <AlertTriangle size={16} aria-hidden="true" />
        {title ??
          t(
            "当前版本不支持的配置",
            "Configuration unsupported by this version",
          )}
      </h3>
      <p>
        {description ??
          t(
            "原值仍保留。可切换版本，或明确清除以下配置后保存。",
            "Existing values are retained. Change the version or explicitly clear these settings before saving.",
          )}
      </p>
      <ul>
        {settings.map(({ path, reason }) => (
          <li key={path}>
            <div>
              <code>{path}</code>
              <span>{reason}</span>
            </div>
            {onClear && (
              <Button
                size="sm"
                variant="outline"
                disabled={disabled}
                onClick={() => onClear(path)}
                aria-label={t(
                  `清除不兼容配置 ${path}`,
                  `Clear unsupported setting ${path}`,
                )}
              >
                {t("清除", "Clear")}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function advancedRecord(value: unknown): Advanced {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Advanced)
    : {};
}
export function advancedValue(
  value: Advanced | undefined,
  path: string,
): unknown {
  return path
    .split(".")
    .reduce<unknown>((current, key) => advancedRecord(current)[key], value);
}
export function updateAdvanced(
  value: Advanced,
  path: string,
  next: unknown,
): Advanced {
  const keys = path.split(".");
  const write = (current: Advanced, index: number): Advanced => {
    const copy = { ...current };
    const key = keys[index];
    if (index === keys.length - 1) {
      if (next === undefined) delete copy[key];
      else copy[key] = next;
    } else {
      const child = write(advancedRecord(copy[key]), index + 1);
      if (Object.keys(child).length) copy[key] = child;
      else delete copy[key];
    }
    return copy;
  };
  return write(value, 0);
}

/** Known fields made inapplicable by an explicit protocol/role change are removed.
 * Unknown fields remain present so the strict validator can report them. */
export function applicableTunnelAdvanced(
  value: Advanced,
  type: TunnelType,
  role: "provider" | "visitor",
): Advanced {
  const visitor = role === "visitor" && ["stcp", "sudp", "xtcp"].includes(type);
  const allowed = new Set(
    visitor
      ? [
          "serverUser",
          ...(["stcp", "xtcp"].includes(type) ? ["bindPort"] : []),
          ...(type === "xtcp"
            ? [
                "protocol",
                "keepTunnelOpen",
                "maxRetriesAnHour",
                "minRetryInterval",
                "fallbackTo",
                "fallbackTimeoutMs",
                "natTraversal",
              ]
            : []),
        ]
      : [
          "transport",
          "healthCheck",
          "annotations",
          "metadatas",
          ...(!["udp", "sudp"].includes(type) ? ["plugin"] : []),
          ...(["tcp", "http", "https", "tcpmux"].includes(type)
            ? ["loadBalancer"]
            : []),
          ...(["http", "https", "tcpmux"].includes(type)
            ? ["customDomains", "subdomain"]
            : []),
          ...(["http", "tcpmux"].includes(type)
            ? ["httpUser", "httpPassword", "routeByHTTPUser"]
            : []),
          ...(type === "http"
            ? [
                "locations",
                "hostHeaderRewrite",
                "requestHeaders",
                "responseHeaders",
              ]
            : []),
          ...(type === "tcpmux" ? ["multiplexer"] : []),
          ...(["stcp", "sudp", "xtcp"].includes(type) ? ["allowUsers"] : []),
          ...(type === "xtcp" ? ["natTraversal"] : []),
        ],
  );
  const known = [
    "transport",
    "healthCheck",
    "annotations",
    "metadatas",
    "plugin",
    "loadBalancer",
    "customDomains",
    "subdomain",
    "httpUser",
    "httpPassword",
    "routeByHTTPUser",
    "locations",
    "hostHeaderRewrite",
    "requestHeaders",
    "responseHeaders",
    "multiplexer",
    "allowUsers",
    "natTraversal",
    "serverUser",
    "bindPort",
    "protocol",
    "keepTunnelOpen",
    "maxRetriesAnHour",
    "minRetryInterval",
    "fallbackTo",
    "fallbackTimeoutMs",
  ];
  const next = { ...value };
  for (const key of known) if (!allowed.has(key)) delete next[key];
  return next;
}

function lines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
function pairs(value: string): [string, string][] | null {
  const parsed: [string, string][] = [];
  for (const line of value.split(/\r?\n/).filter((line) => line.trim())) {
    const separator = line.indexOf("=");
    if (separator < 1) return null;
    const key = line.slice(0, separator).trim();
    if (!key) return null;
    parsed.push([key, line.slice(separator + 1)]);
  }
  return parsed;
}
function controlText(value: unknown, kind: Kind): string {
  if (typeof value === "string" || typeof value === "number")
    return String(value);
  if (kind === "list" && Array.isArray(value)) return value.join("\n");
  if (kind === "headers" && Array.isArray(value))
    return value
      .map(
        (row) =>
          `${advancedRecord(row).name ?? ""}=${advancedRecord(row).value ?? ""}`,
      )
      .join("\n");
  if (kind === "map")
    return Object.entries(advancedRecord(value))
      .map(([key, item]) => `${key}=${String(item)}`)
      .join("\n");
  return "";
}

function AdvancedField({
  spec,
  value,
  onChange,
  prefix,
  disabled,
  version,
  scope,
  context,
}: Props & { spec: Spec }) {
  const { t } = useI18n();
  const [reveal, setReveal] = useState(false);
  const kind = spec.kind ?? "text";
  const current = advancedValue(value, spec.path);
  const official = getConfigDefault(version, spec.path, scope, context);
  const effective =
    current === undefined && official.hasDefault ? official.value : current;
  const defaultKey = JSON.stringify([
    version,
    official.hasDefault,
    official.value,
  ]);
  const previousDefault = useRef(defaultKey);
  const lastSubmitted = useRef(current);
  const [rawText, setRawText] = useState(() => controlText(effective, kind));
  const [inputDraft, setInputDraft] = useState<string | null>(null);
  useEffect(() => {
    if (
      !Object.is(current, lastSubmitted.current) ||
      (current === undefined && previousDefault.current !== defaultKey)
    ) {
      setRawText(controlText(effective, kind));
      setInputDraft(null);
    }
    lastSubmitted.current = current;
    previousDefault.current = defaultKey;
  }, [current, kind, defaultKey, effective]);
  const id = `${prefix}-advanced-${spec.path.replaceAll(".", "-")}`;
  const defaultDescriptionId = `${id}-default`;
  const describesDefault =
    official.hasDefault || ["environment", "context"].includes(official.kind);
  const label = t(...spec.label);
  const text = inputDraft !== null ? inputDraft : controlText(effective, kind);
  const parsed =
    (kind === "map" || kind === "headers") && typeof current === "string"
      ? pairs(current)
      : null;
  const invalid =
    (kind === "map" || kind === "headers") &&
    typeof current === "string" &&
    (!parsed ||
      (kind === "map" &&
        new Set(parsed.map(([key]) => key)).size !== parsed.length));
  const hint = spec.hint
    ? t(...spec.hint)
    : !official.hasDefault &&
        (kind === "number" || kind === "boolean" || kind === "select")
      ? t(
          "修改后保存为明确配置；恢复默认会移除覆盖值。",
          "Changes are saved as explicit configuration; resetting removes the override.",
        )
      : kind === "list"
        ? t("每行一项；留空不指定。", "One item per line; leave empty to omit.")
        : kind === "map" || kind === "headers"
          ? t(
              "每行 key=value，值可包含等号。",
              "One key=value per line; values may contain equals signs.",
            )
          : undefined;
  const change = (next: unknown) => {
    lastSubmitted.current = next;
    onChange(updateAdvanced(value, spec.path, next));
  };
  return (
    <Field
      label={label}
      htmlFor={id}
      hint={hint}
      error={
        invalid
          ? t(
              "每行需为 key=value，字典的键不能重复。",
              "Use key=value on every line; dictionary keys must be unique.",
            )
          : undefined
      }
      className={
        kind === "list" || kind === "map" || kind === "headers"
          ? "advanced-wide"
          : undefined
      }
    >
      {kind === "boolean" ? (
        <Select
          id={id}
          aria-describedby={describesDefault ? defaultDescriptionId : undefined}
          disabled={disabled}
          value={
            effective === true ? "true" : effective === false ? "false" : ""
          }
          onValueChange={(next) =>
            change(next === "" ? undefined : next === "true")
          }
          options={[
            ...(!official.hasDefault
              ? [{ value: "", label: t("未指定", "Unset") }]
              : []),
            { value: "true", label: t("启用", "Enabled") },
            { value: "false", label: t("禁用", "Disabled") },
          ]}
        />
      ) : kind === "select" ? (
        <Select
          id={id}
          aria-describedby={describesDefault ? defaultDescriptionId : undefined}
          disabled={disabled}
          value={text}
          onValueChange={(next) => change(next === "" ? undefined : next)}
          options={[
            ...(official.value === "" || !official.hasDefault
              ? [
                  {
                    value: "",
                    label: official.hasDefault
                      ? t("未启用", "Disabled")
                      : t("未指定", "Unset"),
                  },
                ]
              : []),
            ...(spec.options ?? []).map((option) => ({
              value: option,
              label: option,
            })),
          ]}
        />
      ) : kind === "list" || kind === "map" || kind === "headers" ? (
        <textarea
          id={id}
          aria-describedby={describesDefault ? defaultDescriptionId : undefined}
          className="input advanced-textarea"
          disabled={disabled}
          rows={3}
          spellCheck={false}
          value={rawText}
          placeholder={spec.placeholder}
          onBlur={() => {
            if (current === undefined) setRawText(controlText(effective, kind));
          }}
          onChange={(event) => {
            const raw = event.target.value;
            setRawText(raw);
            if (!raw.trim()) {
              change(undefined);
              return;
            }
            if (kind === "list") {
              change(lines(raw));
              return;
            }
            const next = pairs(raw);
            if (
              !next ||
              (kind === "map" &&
                new Set(next.map(([key]) => key)).size !== next.length)
            ) {
              change(raw);
              return;
            }
            change(
              kind === "headers"
                ? next.map(([name, item]) => ({ name, value: item }))
                : Object.fromEntries(next),
            );
          }}
        />
      ) : (
        <div className={kind === "password" ? "input-action-row" : undefined}>
          <Input
            id={id}
            aria-describedby={
              describesDefault ? defaultDescriptionId : undefined
            }
            disabled={disabled}
            type={
              kind === "password" && !reveal
                ? "password"
                : kind === "number"
                  ? "text"
                  : "text"
            }
            min={spec.min}
            max={spec.max}
            inputMode={kind === "number" ? "numeric" : undefined}
            step={kind === "number" ? 1 : undefined}
            autoComplete={kind === "password" ? "new-password" : "off"}
            spellCheck={false}
            value={text}
            placeholder={spec.placeholder}
            onChange={(event) => {
              const raw = event.target.value;
              setInputDraft(raw);
              change(
                raw === ""
                  ? undefined
                  : kind === "number" && /^-?\d+$/.test(raw)
                    ? Number(raw)
                    : raw,
              );
            }}
            onBlur={() => setInputDraft(null)}
          />
          {kind === "password" && (
            <Button
              disabled={disabled}
              variant="ghost"
              size="icon"
              aria-label={
                reveal
                  ? t(`隐藏${label}`, `Hide ${label}`)
                  : t(`显示${label}`, `Show ${label}`)
              }
              onClick={() => setReveal((shown) => !shown)}
            >
              {reveal ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
          )}
        </div>
      )}
      <DefaultState
        official={official}
        explicit={current !== undefined}
        disabled={disabled}
        descriptionId={defaultDescriptionId}
        onReset={() => {
          setInputDraft(null);
          setRawText(controlText(official.value, kind));
          change(undefined);
        }}
      />
    </Field>
  );
}

function Fields({ specs, ...props }: Props & { specs: Spec[] }) {
  const visible = specs.filter(
    (spec) =>
      isConfigCapabilitySupported(props.version, spec.path, props.scope) &&
      (!spec.path.startsWith("plugin.") ||
        isConfigCapabilitySupported(
          props.version,
          `plugin.type.${String(advancedValue(props.value, "plugin.type") ?? "")}`,
          "tunnel",
        )),
  );
  if (!visible.length) return null;
  return (
    <div className="advanced-field-grid">
      {visible.map((spec) => (
        <AdvancedField key={spec.path} spec={spec} {...props} />
      ))}
    </div>
  );
}
function Group({
  title,
  hint,
  children,
  configured = false,
  initialOpen = false,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  configured?: boolean;
  initialOpen?: boolean;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(initialOpen || configured);
  return (
    <details
      className="advanced-group"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        <span>{title}</span>
        {configured && (
          <span className="advanced-configured">
            {t("已配置", "Configured")}
          </span>
        )}
        <ChevronDown size={16} aria-hidden="true" />
      </summary>
      <fieldset className="advanced-fieldset">
        <legend className="sr-only">{title}</legend>
        {hint && <p className="field-hint">{hint}</p>}
        {children}
      </fieldset>
    </details>
  );
}
const spec = (
  path: string,
  zh: string,
  en: string,
  kind: Kind = "text",
  extra: Partial<Spec> = {},
): Spec => ({ path, label: [zh, en], kind, ...extra });

export function ProfileAuthenticationFields(props: Props) {
  const { t } = useI18n();
  const baseline = getConfigCapability(props.version, "serverAddr", "profile");
  const auth = advancedRecord(props.value.auth);
  const methodDefault = getConfigDefault(
    props.version,
    "auth.method",
    "profile",
    props.context,
  );
  const scopesDefault = getConfigDefault(
    props.version,
    "auth.additionalScopes",
    "profile",
    props.context,
  );
  const method = String(
    auth.method === undefined ? (methodDefault.value ?? "token") : auth.method,
  );
  const fileSource =
    method === "token"
      ? Boolean(auth.tokenSource)
      : Boolean(advancedRecord(auth.oidc).tokenSource);
  const setSource = (file: boolean) => {
    let value = props.value;
    if (method === "oidc")
      value = updateAdvanced(
        value,
        "auth.oidc",
        file
          ? { tokenSource: { type: "file", file: { path: "" } } }
          : undefined,
      );
    else
      value = updateAdvanced(
        value,
        "auth.tokenSource",
        file ? { type: "file", file: { path: "" } } : undefined,
      );
    props.onChange(value);
  };
  const scopes = Array.isArray(auth.additionalScopes)
    ? (auth.additionalScopes as string[])
    : [];
  if (!baseline.supported) return null;
  const methodSupported = isConfigCapabilitySupported(
    props.version,
    `auth.method.${method}`,
    "profile",
  );
  const sourceSupported =
    methodSupported &&
    isConfigCapabilitySupported(
      props.version,
      method === "oidc" ? "auth.oidc.tokenSource" : "auth.tokenSource",
      "profile",
    );
  return (
    <div className="authentication-fields">
      <div className="advanced-field-grid">
        <Field
          label={t("认证方式", "Authentication method")}
          htmlFor={`${props.prefix}-auth-method`}
        >
          <Select
            id={`${props.prefix}-auth-method`}
            aria-describedby={`${props.prefix}-auth-method-default`}
            disabled={props.disabled}
            value={methodSupported ? method : ""}
            placeholder={t(
              "请选择当前版本支持的认证方式",
              "Select an authentication method supported by this version",
            )}
            onValueChange={(next) => {
              let value = updateAdvanced(props.value, "auth.method", next);
              value = updateAdvanced(
                value,
                next === "oidc" ? "auth.tokenSource" : "auth.oidc",
                undefined,
              );
              props.onChange(value);
            }}
            options={[
              { value: "token", label: "Token" },
              { value: "oidc", label: "OIDC" },
            ].filter((option) =>
              isConfigCapabilitySupported(
                props.version,
                `auth.method.${option.value}`,
                "profile",
              ),
            )}
          />
          <DefaultState
            official={methodDefault}
            explicit={auth.method !== undefined}
            disabled={props.disabled}
            descriptionId={`${props.prefix}-auth-method-default`}
            onReset={() => {
              let value = updateAdvanced(props.value, "auth.method", undefined);
              value = updateAdvanced(
                value,
                methodDefault.value === "oidc"
                  ? "auth.tokenSource"
                  : "auth.oidc",
                undefined,
              );
              props.onChange(value);
            }}
          />
        </Field>
        {sourceSupported && (
          <Field
            label={t(
              method === "oidc" ? "OIDC Token 来源" : "Token 来源",
              method === "oidc" ? "OIDC token source" : "Token source",
            )}
            htmlFor={`${props.prefix}-auth-source`}
          >
            <Select
              id={`${props.prefix}-auth-source`}
              disabled={props.disabled}
              value={fileSource ? "file" : "inline"}
              onValueChange={(next) => setSource(next === "file")}
              options={[
                {
                  value: "inline",
                  label: t(
                    method === "oidc" ? "从 OIDC 端点获取" : "直接填写 Token",
                    method === "oidc"
                      ? "Fetch from OIDC endpoint"
                      : "Enter a token",
                  ),
                },
                {
                  value: "file",
                  label: t("读取本机文件", "Read a local file"),
                },
              ]}
            />
          </Field>
        )}
      </div>
      {methodSupported && sourceSupported && fileSource && (
        <Fields
          {...props}
          specs={[
            spec(
              method === "oidc"
                ? "auth.oidc.tokenSource.file.path"
                : "auth.tokenSource.file.path",
              "Token 文件路径",
              "Token file path",
              "text",
              {
                hint: [
                  "填写 Windows 盘符根路径或 UNC 路径，frpc 启动时读取文件内容。",
                  "Enter an absolute Windows drive or UNC path; frpc reads the file at startup.",
                ],
              },
            ),
          ]}
        />
      )}
      {methodSupported && method === "oidc" && !fileSource && (
        <Fields
          {...props}
          specs={[
            spec("auth.oidc.clientID", "OIDC 客户端 ID", "OIDC client ID"),
            spec(
              "auth.oidc.clientSecret",
              "OIDC 客户端密钥",
              "OIDC client secret",
              "password",
            ),
            spec(
              "auth.oidc.tokenEndpointURL",
              "Token 端点 URL",
              "Token endpoint URL",
            ),
            spec("auth.oidc.audience", "OIDC 受众", "OIDC audience"),
            spec("auth.oidc.scope", "OIDC Scope", "OIDC scope"),
            spec(
              "auth.oidc.trustedCaFile",
              "OIDC 信任 CA 文件",
              "OIDC trusted CA file",
            ),
            spec(
              "auth.oidc.proxyURL",
              "OIDC 端点代理 URL",
              "OIDC endpoint proxy URL",
              "password",
            ),
            spec(
              "auth.oidc.insecureSkipVerify",
              "跳过 OIDC TLS 证书验证",
              "Skip OIDC TLS certificate verification",
              "boolean",
              {
                hint: [
                  "仅在明确需要时启用；会取消端点证书校验。",
                  "Enable only when required; endpoint certificates will not be verified.",
                ],
              },
            ),
            spec(
              "auth.oidc.additionalEndpointParams",
              "端点附加参数",
              "Additional endpoint parameters",
              "map",
              {
                hint: [
                  "每行 key=value；scope 使用专用字段，audience 不能重复设置。",
                  "One key=value per line. Use the dedicated scope field and specify audience only once.",
                ],
              },
            ),
          ]}
        />
      )}
      {isConfigCapabilitySupported(
        props.version,
        "auth.additionalScopes",
        "profile",
      ) && (
        <fieldset
          className="advanced-scopes"
          aria-describedby={`${props.prefix}-auth-scopes-default`}
        >
          <legend>
            {t("附加认证范围", "Additional authentication scopes")}
          </legend>
          {["HeartBeats", "NewWorkConns"].map((scope) => (
            <Checkbox
              key={scope}
              disabled={props.disabled}
              checked={scopes.includes(scope)}
              label={
                scope === "HeartBeats"
                  ? t("心跳 HeartBeats", "HeartBeats")
                  : t("新工作连接 NewWorkConns", "NewWorkConns")
              }
              onCheckedChange={(checked) => {
                const next = checked
                  ? [...new Set([...scopes, scope])]
                  : scopes.filter((item) => item !== scope);
                props.onChange(
                  updateAdvanced(
                    props.value,
                    "auth.additionalScopes",
                    next.length ? next : undefined,
                  ),
                );
              }}
            />
          ))}
        </fieldset>
      )}
      {isConfigCapabilitySupported(
        props.version,
        "auth.additionalScopes",
        "profile",
      ) && (
        <DefaultState
          official={scopesDefault}
          explicit={auth.additionalScopes !== undefined}
          disabled={props.disabled}
          descriptionId={`${props.prefix}-auth-scopes-default`}
          onReset={() =>
            props.onChange(
              updateAdvanced(props.value, "auth.additionalScopes", undefined),
            )
          }
        />
      )}
    </div>
  );
}

export function ProfileAdvancedFields(
  props: Props & { transport: string; tls: boolean; webPort: number },
) {
  const { t } = useI18n();
  const baseline = getConfigCapability(props.version, "serverAddr", "profile");
  if (!baseline.supported) return null;
  return (
    <div className="advanced-editor">
      <h3 className="section-caption">
        {t("连接高级配置", "Advanced connection configuration")}
      </h3>
      <p className="field-hint">
        {t(
          "未自定义的字段显示该版本默认值，只有修改后的字段写入配置。保存不会重启正在运行的客户端。",
          "Unmodified fields display this version’s defaults; only edits add configuration overrides. Saving does not restart a running client.",
        )}
      </p>
      <Group
        title={t("网络与连接维护", "Network & connection maintenance")}
        configured={Boolean(props.value.transport)}
      >
        <Fields
          {...props}
          specs={[
            spec(
              "transport.wireProtocol",
              "frp 内部协议",
              "frp wire protocol",
              "select",
              { options: ["v1", "v2"] },
            ),
            spec(
              "transport.dialServerTimeout",
              "拨号超时（秒）",
              "Dial timeout (seconds)",
              "number",
              { min: 0 },
            ),
            spec(
              "transport.dialServerKeepalive",
              "TCP 保活（秒）",
              "TCP keepalive (seconds)",
              "number",
              {
                min: -2147483648,
                hint: [
                  "负值禁用 TCP 保活；留空使用版本默认。",
                  "A negative value disables TCP keepalive; unset uses the version default.",
                ],
              },
            ),
            spec(
              "transport.poolCount",
              "连接池数量",
              "Connection pool count",
              "number",
              { min: 0 },
            ),
            spec(
              "transport.tcpMux",
              "TCP 多路复用",
              "TCP multiplexing",
              "boolean",
            ),
            spec(
              "transport.tcpMuxKeepaliveInterval",
              "多路复用保活（秒）",
              "Multiplexing keepalive (seconds)",
              "number",
              { min: 0 },
            ),
            spec(
              "transport.heartbeatInterval",
              "心跳间隔（秒）",
              "Heartbeat interval (seconds)",
              "number",
              {
                min: -2147483648,
                hint: [
                  "负值禁用心跳；留空使用版本默认。",
                  "A negative value disables heartbeats; unset uses the version default.",
                ],
              },
            ),
            spec(
              "transport.heartbeatTimeout",
              "心跳超时（秒）",
              "Heartbeat timeout (seconds)",
              "number",
              { min: -2147483648 },
            ),
            ...(["tcp", "websocket", "wss"].includes(props.transport) ||
            advancedValue(props.value, "transport.connectServerLocalIP")
              ? [
                  spec(
                    "transport.connectServerLocalIP",
                    "连接源 IP",
                    "Connection source IP",
                  ),
                ]
              : []),
            ...(["tcp", "websocket", "wss"].includes(props.transport) ||
            advancedValue(props.value, "transport.proxyURL")
              ? [
                  spec(
                    "transport.proxyURL",
                    "服务器连接代理 URL",
                    "Server connection proxy URL",
                    "password",
                  ),
                ]
              : []),
          ]}
        />
      </Group>
      {(props.tls || Boolean(advancedValue(props.value, "transport.tls"))) && (
        <Group
          title={t("传输 TLS 证书", "Transport TLS certificates")}
          configured={Boolean(advancedValue(props.value, "transport.tls"))}
        >
          <Fields
            {...props}
            specs={[
              spec(
                "transport.tls.certFile",
                "客户端证书文件",
                "Client certificate file",
                "text",
                {
                  hint: [
                    "证书和私钥需同时填写或同时留空。",
                    "Set both certificate and key paths, or leave both empty.",
                  ],
                },
              ),
              spec(
                "transport.tls.keyFile",
                "客户端私钥文件",
                "Client private-key file",
              ),
              spec(
                "transport.tls.trustedCaFile",
                "信任 CA 文件",
                "Trusted CA file",
              ),
              spec(
                "transport.tls.serverName",
                "服务器名称 / SNI",
                "Server name / SNI",
              ),
              spec(
                "transport.tls.disableCustomTLSFirstByte",
                "禁用自定义 TLS 首字节",
                "Disable custom TLS first byte",
                "boolean",
              ),
            ]}
          />
        </Group>
      )}
      {isConfigCapabilitySupported(
        props.version,
        "transport.quic.keepalivePeriod",
        "profile",
      ) &&
        (props.transport === "quic" ||
          Boolean(advancedValue(props.value, "transport.quic"))) && (
          <Group
            title={t("QUIC 传输参数", "QUIC transport parameters")}
            configured={Boolean(advancedValue(props.value, "transport.quic"))}
          >
            <Fields
              {...props}
              specs={[
                spec(
                  "transport.quic.keepalivePeriod",
                  "QUIC 保活（秒）",
                  "QUIC keepalive (seconds)",
                  "number",
                  { min: 0 },
                ),
                spec(
                  "transport.quic.maxIdleTimeout",
                  "QUIC 空闲超时（秒）",
                  "QUIC idle timeout (seconds)",
                  "number",
                  { min: 0 },
                ),
                spec(
                  "transport.quic.maxIncomingStreams",
                  "QUIC 最大入站流",
                  "QUIC maximum incoming streams",
                  "number",
                  { min: 0 },
                ),
              ]}
            />
          </Group>
        )}
      {(props.webPort > 0 || Boolean(props.value.webServer)) && (
        <Group
          title={t(
            "本机管理鉴权与 HTTPS",
            "Local management authentication & HTTPS",
          )}
          configured={Boolean(props.value.webServer)}
          hint={t(
            "管理服务仅监听本机。端口与启用状态在基础配置中设置。",
            "Management listens locally. Its port and enabled state are set in basic configuration.",
          )}
        >
          <Fields
            {...props}
            specs={[
              spec("webServer.user", "管理用户名", "Management username"),
              spec(
                "webServer.password",
                "管理密码",
                "Management password",
                "password",
              ),
              spec(
                "webServer.assetsDir",
                "管理页面资源目录",
                "Management page assets directory",
              ),
              spec(
                "webServer.pprofEnable",
                "启用 pprof",
                "Enable pprof",
                "boolean",
              ),
              spec(
                "webServer.tls.certFile",
                "管理 HTTPS 证书",
                "Management HTTPS certificate",
              ),
              spec(
                "webServer.tls.keyFile",
                "管理 HTTPS 私钥",
                "Management HTTPS private key",
              ),
              spec(
                "webServer.tls.trustedCaFile",
                "管理 HTTPS 信任 CA",
                "Management HTTPS trusted CA",
              ),
              spec(
                "webServer.tls.serverName",
                "管理 HTTPS 服务器名称",
                "Management HTTPS server name",
              ),
            ]}
          />
        </Group>
      )}
      <Group
        title={t("实例、DNS 与元数据", "Instance, DNS & metadata")}
        configured={[
          "clientID",
          "natHoleStunServer",
          "dnsServer",
          "udpPacketSize",
          "metadatas",
        ].some((key) => props.value[key] !== undefined)}
      >
        <Fields
          {...props}
          specs={[
            spec("clientID", "frpc 实例 ID", "frpc instance ID"),
            spec("natHoleStunServer", "STUN 服务器", "STUN server", "text", {
              placeholder: "stun.example.test:3478",
            }),
            spec("dnsServer", "DNS 服务器", "DNS server"),
            spec(
              "udpPacketSize",
              "UDP 包长度（字节）",
              "UDP packet size (bytes)",
              "number",
              { min: 0, max: 65535 },
            ),
            spec("metadatas", "客户端元数据", "Client metadata", "map"),
          ]}
        />
      </Group>
    </div>
  );
}

const pluginTypes = [
  "http2https",
  "http_proxy",
  "https2http",
  "https2https",
  "http2http",
  "socks5",
  "static_file",
  "unix_domain_socket",
  "tls2raw",
];
function pluginSpecs(type: string): Spec[] {
  const fields: Spec[] = [];
  if (
    [
      "http2http",
      "http2https",
      "https2http",
      "https2https",
      "tls2raw",
    ].includes(type)
  )
    fields.push(
      spec(
        "plugin.localAddr",
        "插件后端地址",
        "Plugin backend address",
        "text",
        { placeholder: "127.0.0.1:8080" },
      ),
    );
  if (["https2http", "https2https", "tls2raw"].includes(type))
    fields.push(
      spec(
        "plugin.crtPath",
        "插件证书路径",
        "Plugin certificate path",
        "text",
        {
          hint: [
            "证书和私钥需同时填写或同时留空。",
            "Set both certificate and key paths, or leave both empty.",
          ],
        },
      ),
      spec("plugin.keyPath", "插件私钥路径", "Plugin private-key path"),
    );
  if (["http2http", "http2https", "https2http", "https2https"].includes(type))
    fields.push(
      spec("plugin.hostHeaderRewrite", "插件 Host 改写", "Plugin Host rewrite"),
      spec(
        "plugin.requestHeaders.set",
        "插件请求头",
        "Plugin request headers",
        "map",
      ),
    );
  if (["https2http", "https2https"].includes(type))
    fields.push(
      spec("plugin.enableHTTP2", "插件 HTTP/2", "Plugin HTTP/2", "boolean"),
    );
  if (["http_proxy", "static_file"].includes(type))
    fields.push(
      spec("plugin.httpUser", "插件 HTTP 用户名", "Plugin HTTP username"),
      spec(
        "plugin.httpPassword",
        "插件 HTTP 密码",
        "Plugin HTTP password",
        "password",
      ),
    );
  if (type === "socks5")
    fields.push(
      spec("plugin.username", "SOCKS5 用户名", "SOCKS5 username"),
      spec("plugin.password", "SOCKS5 密码", "SOCKS5 password", "password"),
    );
  if (type === "static_file")
    fields.push(
      spec("plugin.localPath", "静态文件目录", "Static-file directory"),
      spec("plugin.stripPrefix", "移除路径前缀", "Strip path prefix"),
    );
  if (type === "unix_domain_socket")
    fields.push(
      spec("plugin.unixPath", "Unix 套接字路径", "Unix socket path", "text", {
        hint: [
          "使用 Windows 盘符根路径或 UNC 路径，运行兼容性由所选 frpc 验证。",
          "Use an absolute Windows drive or UNC path; the selected frpc verifies runtime compatibility.",
        ],
      }),
    );
  return fields;
}

export function TunnelAdvancedFields(
  props: Props & { type: TunnelType; role: "provider" | "visitor" },
) {
  const { t } = useI18n();
  const baseline = getConfigCapability(props.version, "name", "tunnel");
  if (!baseline.supported) return null;
  const visitor =
    props.role === "visitor" && ["stcp", "sudp", "xtcp"].includes(props.type);
  const domainProtocol = ["http", "https", "tcpmux"].includes(props.type);
  const httpProtocol = props.type === "http" || props.type === "tcpmux";
  const plugin = String(advancedValue(props.value, "plugin.type") ?? "");
  const pluginDefault = getConfigDefault(
    props.version,
    "plugin.type",
    "tunnel",
    props.context,
  );
  const healthDefault = getConfigDefault(
    props.version,
    "healthCheck.type",
    "tunnel",
    props.context,
  );
  const healthCurrent = advancedValue(props.value, "healthCheck.type");
  const healthType = String(
    healthCurrent === undefined ? (healthDefault.value ?? "") : healthCurrent,
  );
  const pluginSupported =
    !plugin ||
    isConfigCapabilitySupported(
      props.version,
      `plugin.type.${plugin}`,
      "tunnel",
    );
  return (
    <div className="advanced-editor">
      <h3 className="section-caption">
        {t("隧道高级配置", "Advanced tunnel configuration")}
      </h3>
      <p className="field-hint">
        {t(
          "只显示当前协议和角色适用的配置。未自定义的字段显示该版本默认值。",
          "Only configuration applicable to the current protocol and role is shown. Unmodified fields display this version’s defaults.",
        )}
      </p>
      {visitor ? (
        <Group
          title={t("访客访问与监听", "Visitor access & listening")}
          configured={Boolean(props.value.serverUser || props.value.bindPort)}
          initialOpen
        >
          <Fields
            {...props}
            specs={[
              spec("serverUser", "提供者所属用户", "Provider user", "text", {
                hint: [
                  "留空使用当前连接的用户前缀。",
                  "Leave empty to use this connection’s user prefix.",
                ],
              }),
            ]}
          />
          {["stcp", "xtcp"].includes(props.type) &&
            isConfigCapabilitySupported(
              props.version,
              "bindPort",
              "tunnel",
            ) && (
              <Field
                label={t("本机监听方式", "Local listening mode")}
                htmlFor={`${props.prefix}-bind-mode`}
              >
                <Select
                  id={`${props.prefix}-bind-mode`}
                  disabled={props.disabled}
                  value={props.value.bindPort === -1 ? "none" : "port"}
                  onValueChange={(value) =>
                    props.onChange(
                      updateAdvanced(
                        props.value,
                        "bindPort",
                        value === "none" ? -1 : undefined,
                      ),
                    )
                  }
                  options={[
                    {
                      value: "port",
                      label: t(
                        "监听基础配置中的本机端口",
                        "Listen on the configured local port",
                      ),
                    },
                    {
                      value: "none",
                      label: t(
                        "不监听，仅接受其它访客回退（-1）",
                        "No listener; accept visitor fallback only (-1)",
                      ),
                    },
                  ]}
                />
              </Field>
            )}
        </Group>
      ) : (
        <>
          {domainProtocol && (
            <Group
              title={t("域名与 HTTP 路由", "Domains & HTTP routing")}
              configured={[
                "customDomains",
                "subdomain",
                "locations",
                "httpUser",
                "httpPassword",
                "requestHeaders",
                "responseHeaders",
              ].some((key) => props.value[key] !== undefined)}
            >
              <Fields
                {...props}
                specs={[
                  spec(
                    "customDomains",
                    "完整访问域名列表",
                    "Complete public domain list",
                    "list",
                    {
                      hint: [
                        "每行一个域名，首项同步到基础域名；仅使用子域名时可留空。",
                        "One domain per line; the first updates the basic domain. Leave empty when using only a subdomain.",
                      ],
                    },
                  ),
                  spec("subdomain", "子域名", "Subdomain"),
                  ...(httpProtocol
                    ? [
                        spec(
                          "httpUser",
                          "HTTP 访问用户名",
                          "HTTP access username",
                        ),
                        spec(
                          "httpPassword",
                          "HTTP 访问密码",
                          "HTTP access password",
                          "password",
                        ),
                        spec(
                          "routeByHTTPUser",
                          "按 HTTP 用户路由",
                          "Route by HTTP user",
                        ),
                      ]
                    : []),
                  ...(props.type === "http"
                    ? [
                        spec(
                          "locations",
                          "路径路由列表",
                          "Route path list",
                          "list",
                          { placeholder: "/api\n/static" },
                        ),
                        spec(
                          "hostHeaderRewrite",
                          "Host 请求头改写",
                          "Host header rewrite",
                        ),
                        spec(
                          "requestHeaders.set",
                          "附加请求头",
                          "Additional request headers",
                          "map",
                        ),
                        spec(
                          "responseHeaders.set",
                          "附加响应头",
                          "Additional response headers",
                          "map",
                        ),
                      ]
                    : []),
                  ...(props.type === "tcpmux"
                    ? [
                        spec(
                          "multiplexer",
                          "TCPMUX 复用器",
                          "TCPMUX multiplexer",
                          "select",
                          { options: ["httpconnect"] },
                        ),
                      ]
                    : []),
                ]}
              />
            </Group>
          )}
          {["stcp", "sudp", "xtcp"].includes(props.type) && (
            <Group
              title={t("私有服务访问用户", "Private-service access users")}
              configured={Boolean(props.value.allowUsers)}
            >
              <Fields
                {...props}
                specs={[
                  spec(
                    "allowUsers",
                    "允许访问的用户",
                    "Allowed users",
                    "list",
                    {
                      hint: [
                        "每行一个用户；* 表示所有用户。留空采用 frpc 默认策略。",
                        "One user per line; * allows all users. Unset uses the frpc default policy.",
                      ],
                    },
                  ),
                ]}
              />
            </Group>
          )}
          <Group
            title={t("带宽与代理协议", "Bandwidth & proxy protocol")}
            configured={Boolean(props.value.transport)}
          >
            <Fields
              {...props}
              specs={[
                spec(
                  "transport.bandwidthLimit",
                  "带宽限制",
                  "Bandwidth limit",
                  "text",
                  {
                    placeholder: "1MB",
                    hint: [
                      "例如 1MB 或 100KB；留空不限制。",
                      "For example 1MB or 100KB; leave empty for no limit.",
                    ],
                  },
                ),
                spec(
                  "transport.bandwidthLimitMode",
                  "限流位置",
                  "Bandwidth limiting side",
                  "select",
                  { options: ["client", "server"] },
                ),
                ...((props.type !== "udp" && props.type !== "sudp") ||
                advancedValue(props.value, "transport.proxyProtocolVersion")
                  ? [
                      spec(
                        "transport.proxyProtocolVersion",
                        "Proxy Protocol 版本",
                        "Proxy Protocol version",
                        "select",
                        {
                          options: ["v1", "v2"],
                          hint: [
                            "后端服务必须支持所选 Proxy Protocol。",
                            "The backend service must support the selected Proxy Protocol.",
                          ],
                        },
                      ),
                    ]
                  : []),
              ]}
            />
          </Group>
          {["tcp", "http", "https", "tcpmux"].includes(props.type) && (
            <Group
              title={t("负载均衡", "Load balancing")}
              configured={Boolean(props.value.loadBalancer)}
            >
              <Fields
                {...props}
                specs={[
                  spec(
                    "loadBalancer.group",
                    "负载均衡组",
                    "Load-balancing group",
                  ),
                  spec(
                    "loadBalancer.groupKey",
                    "组密钥",
                    "Group key",
                    "password",
                  ),
                ]}
              />
            </Group>
          )}
          <Group
            title={t("健康检查", "Health check")}
            configured={Boolean(props.value.healthCheck)}
          >
            <Field
              label={t("检查方式", "Check method")}
              htmlFor={`${props.prefix}-health-type`}
            >
              <Select
                id={`${props.prefix}-health-type`}
                aria-describedby={`${props.prefix}-health-default`}
                disabled={props.disabled}
                value={healthType}
                onValueChange={(type) => {
                  let value = updateAdvanced(
                    props.value,
                    "healthCheck",
                    type
                      ? { ...advancedRecord(props.value.healthCheck), type }
                      : undefined,
                  );
                  if (type === "tcp") {
                    value = updateAdvanced(
                      value,
                      "healthCheck.path",
                      undefined,
                    );
                    value = updateAdvanced(
                      value,
                      "healthCheck.httpHeaders",
                      undefined,
                    );
                  }
                  props.onChange(value);
                }}
                options={[
                  { value: "", label: t("不启用检查", "No health check") },
                  { value: "tcp", label: "TCP" },
                  { value: "http", label: "HTTP" },
                ]}
              />
              <DefaultState
                official={healthDefault}
                explicit={props.value.healthCheck !== undefined}
                disabled={props.disabled}
                descriptionId={`${props.prefix}-health-default`}
                onReset={() =>
                  props.onChange(
                    updateAdvanced(props.value, "healthCheck", undefined),
                  )
                }
              />
            </Field>
            {Boolean(healthType) && (
              <Fields
                {...props}
                specs={[
                  spec(
                    "healthCheck.timeoutSeconds",
                    "检查超时（秒）",
                    "Check timeout (seconds)",
                    "number",
                    { min: 0 },
                  ),
                  spec(
                    "healthCheck.maxFailed",
                    "最大连续失败数",
                    "Maximum consecutive failures",
                    "number",
                    { min: 0 },
                  ),
                  spec(
                    "healthCheck.intervalSeconds",
                    "检查间隔（秒）",
                    "Check interval (seconds)",
                    "number",
                    { min: 0 },
                  ),
                  ...(healthType === "http"
                    ? [
                        spec(
                          "healthCheck.path",
                          "HTTP 检查路径",
                          "HTTP check path",
                          "text",
                          { placeholder: "/health" },
                        ),
                        spec(
                          "healthCheck.httpHeaders",
                          "HTTP 检查请求头",
                          "HTTP check headers",
                          "headers",
                        ),
                      ]
                    : []),
                ]}
              />
            )}
          </Group>
          {!["udp", "sudp"].includes(props.type) && (
            <Group
              title={t("客户端插件", "Client plugin")}
              configured={Boolean(props.value.plugin)}
              hint={t(
                "选择插件后，本机目标由插件参数维护；普通本机 IP 和端口不写入运行配置。",
                "A plugin owns its backend target; ordinary local IP and port are omitted from runtime configuration.",
              )}
            >
              <Field
                label={t("插件类型", "Plugin type")}
                htmlFor={`${props.prefix}-plugin-type`}
              >
                <Select
                  id={`${props.prefix}-plugin-type`}
                  aria-describedby={`${props.prefix}-plugin-default`}
                  disabled={props.disabled}
                  value={pluginSupported ? plugin : ""}
                  onValueChange={(type) =>
                    props.onChange(
                      updateAdvanced(
                        props.value,
                        "plugin",
                        type ? { type } : undefined,
                      ),
                    )
                  }
                  options={[
                    {
                      value: "",
                      label: pluginSupported
                        ? t("不使用插件", "No plugin")
                        : t(
                            "原插件不兼容，请选择可用插件",
                            "Existing plugin unsupported; choose another",
                          ),
                    },
                    ...pluginTypes
                      .filter((type) =>
                        isConfigCapabilitySupported(
                          props.version,
                          `plugin.type.${type}`,
                          "tunnel",
                        ),
                      )
                      .map((type) => ({
                        value: type,
                        label: type,
                      })),
                  ]}
                />
                <DefaultState
                  official={pluginDefault}
                  explicit={props.value.plugin !== undefined}
                  disabled={props.disabled}
                  descriptionId={`${props.prefix}-plugin-default`}
                  onReset={() =>
                    props.onChange(
                      updateAdvanced(props.value, "plugin", undefined),
                    )
                  }
                />
              </Field>
              {plugin && pluginSupported && (
                <Fields {...props} specs={pluginSpecs(plugin)} />
              )}
            </Group>
          )}
          <Group
            title={t("注释与元数据", "Annotations & metadata")}
            configured={Boolean(
              props.value.annotations || props.value.metadatas,
            )}
          >
            <Fields
              {...props}
              specs={[
                spec(
                  "annotations",
                  "Dashboard 注释",
                  "Dashboard annotations",
                  "map",
                ),
                spec("metadatas", "隧道元数据", "Tunnel metadata", "map"),
              ]}
            />
          </Group>
        </>
      )}
      {props.type === "xtcp" &&
        (visitor ||
          isConfigCapabilitySupported(
            props.version,
            "natTraversal",
            "tunnel",
          )) && (
          <Group
            title={t(
              visitor ? "XTCP 保持、重试与回退" : "XTCP NAT 穿透",
              visitor
                ? "XTCP persistence, retry & fallback"
                : "XTCP NAT traversal",
            )}
            configured={[
              "protocol",
              "keepTunnelOpen",
              "fallbackTo",
              "natTraversal",
            ].some((key) => props.value[key] !== undefined)}
          >
            <Fields
              {...props}
              specs={[
                ...(visitor
                  ? [
                      spec(
                        "protocol",
                        "P2P 传输协议",
                        "P2P transport protocol",
                        "select",
                        { options: ["quic", "kcp"] },
                      ),
                      spec(
                        "keepTunnelOpen",
                        "保持隧道打开",
                        "Keep tunnel open",
                        "boolean",
                      ),
                      spec(
                        "maxRetriesAnHour",
                        "每小时最大重试数",
                        "Maximum retries per hour",
                        "number",
                        { min: 0 },
                      ),
                      spec(
                        "minRetryInterval",
                        "最小重试间隔（秒）",
                        "Minimum retry interval (seconds)",
                        "number",
                        { min: 0 },
                      ),
                      spec(
                        "fallbackTo",
                        "回退访客名称",
                        "Fallback visitor name",
                      ),
                      spec(
                        "fallbackTimeoutMs",
                        "回退等待（毫秒）",
                        "Fallback timeout (milliseconds)",
                        "number",
                        { min: 0 },
                      ),
                    ]
                  : []),
                spec(
                  "natTraversal.disableAssistedAddrs",
                  "禁用 NAT 辅助地址",
                  "Disable assisted NAT addresses",
                  "boolean",
                ),
              ]}
            />
          </Group>
        )}
    </div>
  );
}
