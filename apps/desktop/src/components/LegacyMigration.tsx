import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { FileUp, LoaderCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { errorMessage, type LegacyPreview } from "../desktop";
import { useI18n } from "../i18n";
import { useAppStore } from "../store";
import { Button, Field, Input, Select } from "./ui";

export function LegacyMigration() {
  const { t } = useI18n();
  const { busy, versions, previewLegacy, importLegacy } = useAppStore();
  const [path, setPath] = useState("");
  const [version, setVersion] = useState("");
  const [working, setWorking] = useState(false);
  const [preview, setPreview] = useState<LegacyPreview | null>(null);
  const [error, setError] = useState("");
  const installed = versions.filter((item) => item.installed);
  const selectedVersion = version || installed[0]?.version || "";
  const validVersion = installed.some(
    (item) => item.version === selectedVersion,
  );
  const disabled = busy || working;

  async function chooseDirectory() {
    if (disabled) return;
    setWorking(true);
    try {
      const nextPath = await open({
        title: t(
          "选择旧客户端 userData 或 db 目录",
          "Select the old client userData or db directory",
        ),
        directory: true,
        multiple: false,
      });
      if (typeof nextPath !== "string") return;
      setPath(nextPath);
      setPreview(null);
      setError("");
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setWorking(false);
    }
  }

  async function readPreview() {
    if (disabled || !path || !validVersion) return;
    setVersion(selectedVersion);
    setWorking(true);
    setPreview(null);
    setError("");
    try {
      setPreview(await previewLegacy(path, selectedVersion));
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setWorking(false);
    }
  }

  async function confirmImport() {
    if (disabled || !preview?.canImport || !path || !validVersion) return;
    setWorking(true);
    setError("");
    try {
      await importLegacy(path, selectedVersion, preview.sourceFingerprint);
      setPreview(null);
      setPath("");
      toast.success(
        t(
          "旧配置已作为新连接导入，尚未启动。",
          "Legacy configuration imported as new connections; processes remain stopped.",
        ),
      );
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setWorking(false);
    }
  }

  return (
    <section className="settings-section" aria-labelledby="legacy-heading">
      <h2 id="legacy-heading">
        {t("导入旧客户端数据", "Import legacy client data")}
      </h2>
      <p className="muted">
        {t(
          "选择旧客户端的 userData 或 db 目录，先检查预览，再新增连接。保留原目录和旧启动偏好，不导入旧二进制，也不会自动连接。",
          "Select the old client userData or db directory. Review the preview before adding connections. The source directory and startup preferences remain intact; binaries are not imported and connections do not start automatically.",
        )}
      </p>
      <div className="field-grid">
        <Field
          label={t("旧数据目录", "Legacy data directory")}
          htmlFor="legacy-directory"
        >
          <Input
            id="legacy-directory"
            readOnly
            value={path}
            placeholder={t("尚未选择目录", "No directory selected")}
          />
        </Field>
        <Field
          label={t("迁移后使用版本", "Version after import")}
          htmlFor="legacy-version"
          hint={
            !validVersion
              ? t(
                  "请先在版本库安装或导入 frpc。",
                  "Install or import frpc in Versions first.",
                )
              : undefined
          }
        >
          <Select
            id="legacy-version"
            value={selectedVersion}
            disabled={disabled || installed.length === 0}
            onValueChange={(value) => {
              setVersion(value);
              setPreview(null);
              setError("");
            }}
            placeholder={t("没有已安装版本", "No installed versions")}
            options={installed.map((item) => ({
              value: item.version,
              label: `frpc ${item.version}`,
            }))}
          />
        </Field>
      </div>
      <div className="button-group">
        <Button disabled={disabled} onClick={() => void chooseDirectory()}>
          <FileUp size={16} />
          {t("选择旧数据目录", "Select legacy directory")}
        </Button>
        <Button
          disabled={disabled || !path || !validVersion}
          onClick={() => void readPreview()}
        >
          {working ? (
            <LoaderCircle size={16} className="spin" />
          ) : (
            <Search size={16} />
          )}
          {t("读取迁移预览", "Preview migration")}
        </Button>
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      {preview && (
        <div className="legacy-preview">
          <h3>{t("迁移预览", "Migration preview")}</h3>
          {preview.profiles.map((profile) => (
            <p key={profile.id}>
              <strong>{profile.name}</strong> ·{" "}
              <span className="mono">
                {profile.serverAddr}:{profile.serverPort}
              </span>{" "}
              ·{" "}
              {t(
                `${preview.tunnels.filter((tunnel) => tunnel.profileId === profile.id).length} 条隧道`,
                `${preview.tunnels.filter((tunnel) => tunnel.profileId === profile.id).length} tunnels`,
              )}
            </p>
          ))}
          {preview.warnings.length > 0 && (
            <ul className="muted">
              {preview.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          )}
          {preview.issues.length > 0 && (
            <ul className="field-error" role="alert">
              {preview.issues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          )}
          <Button
            variant="primary"
            disabled={disabled || !preview.canImport}
            onClick={() => void confirmImport()}
          >
            {t("确认导入为新连接", "Import as new connections")}
          </Button>
        </div>
      )}
    </section>
  );
}
