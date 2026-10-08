import assert from "node:assert/strict";
import { test } from "node:test";
import { formatConfigDefault, getConfigDefault } from "./configDefaults.ts";
import { reviewedFrpcReleases } from "./reviewedFrpcReleases.ts";

const early = ["0.52.0", "0.52.1", "0.52.2", "0.52.3", "0.53.0", "0.53.2", "0.54.0", "0.55.0", "0.55.1", "0.56.0", "0.57.0"];
const later = ["0.58.1", "0.59.0", "0.60.0", "0.61.0", "0.61.1", "0.61.2", "0.62.0", "0.62.1", "0.63.0", "0.64.0", "0.65.0", "0.66.0", "0.67.0", "0.68.0", "0.68.1", "0.69.0", "0.69.1", "0.70.0", "0.70.1", "0.71.0"];
const p = (version, key, context) => getConfigDefault(version, key, "profile", context);
const t = (version, key, context) => getConfigDefault(version, key, "tunnel", context);

test("all 32 fixed tags retain the audited patch-specific transport and STUN defaults", () => {
  assert.deepEqual([...early, "0.58.0", ...later].sort(), [...reviewedFrpcReleases].sort(), "new releases need a default audit fixture");
  for (const version of reviewedFrpcReleases) {
    assert.equal(p(version, "serverAddr").value, "0.0.0.0");
    assert.equal(p(version, "serverPort").value, 7000);
    assert.equal(p(version, "webServer.port").value, 0);
    assert.equal(p(version, "transport.tls.enable").value, true);
    assert.equal(p(version, "transport.protocol").value, "tcp");
    assert.equal(p(version, "natHoleStunServer").value, version === "0.52.0" ? "" : "stun.easyvoip.com:3478");
    assert.equal(p(version, "transport.tcpMuxKeepaliveInterval").value, later.includes(version) ? 30 : 60);
    assert.equal(p(version, "transport.heartbeatInterval").value, early.includes(version) ? 30 : -1);
    assert.equal(p(version, "transport.heartbeatTimeout").value, early.includes(version) ? 90 : -1);
    assert.equal(p(version, "transport.heartbeatInterval", { tcpMux: false }).value, 30);
    assert.equal(p(version, "transport.heartbeatTimeout", { tcpMux: false }).value, 90);
    assert.equal(p(version, "transport.poolCount").value, 1);
    assert.equal(p(version, "transport.dialServerTimeout").value, 10);
    assert.equal(p(version, "transport.dialServerKeepalive").value, 7200);
    assert.equal(p(version, "transport.quic.maxIncomingStreams", { protocol: "quic" }).value, 100000);
    assert.equal(p(version, "natHoleStunServer").audited, true);
  }
});

test("unset health, visitor and plugin settings expose values without enabling parent features", () => {
  for (const version of reviewedFrpcReleases) {
    assert.equal(t(version, "healthCheck.type").value, "");
    assert.equal(t(version, "healthCheck.timeoutSeconds").value, 3);
    assert.equal(t(version, "healthCheck.maxFailed").value, 1);
    assert.equal(t(version, "healthCheck.intervalSeconds").value, 10);
    assert.equal(t(version, "plugin.type").value, "");
    const visitor = { protocol: "xtcp", role: "visitor" };
    assert.equal(t(version, "protocol", visitor).value, "quic");
    assert.equal(t(version, "keepTunnelOpen", visitor).value, false);
    assert.equal(t(version, "maxRetriesAnHour", visitor).value, 8);
    assert.equal(t(version, "minRetryInterval", visitor).value, 90);
    assert.equal(t(version, "fallbackTimeoutMs", visitor).value, 1000);
    assert.equal(t(version, "fallbackTo", visitor).value, "");
    assert.deepEqual(t(version, "allowUsers", { protocol: "stcp", role: "provider" }).value, []);
    assert.equal(t(version, "serverUser", { protocol: "stcp", role: "visitor", user: "namespace" }).value, "");
  }
});

test("zero, false and empty collections remain real defaults, while required fields have none", () => {
  assert.equal(t("0.71.0", "remotePort").hasDefault, true);
  assert.equal(t("0.71.0", "remotePort").value, 0);
  assert.equal(t("0.71.0", "transport.useEncryption").hasDefault, true);
  assert.equal(t("0.71.0", "transport.useEncryption").value, false);
  assert.equal(p("0.71.0", "auth.additionalScopes").hasDefault, true);
  assert.deepEqual(p("0.71.0", "auth.additionalScopes").value, []);
  assert.deepEqual(t("0.71.0", "requestHeaders.set").value, {});
  for (const field of ["localPort", "bindPort", "name", "serverName", "healthCheck.path", "plugin.localAddr", "plugin.localPath", "plugin.unixPath"])
    assert.equal(t("0.71.0", field).hasDefault, false, `${field} must not invent a usable default`);
  for (const field of ["auth.oidc.clientID", "auth.oidc.tokenEndpointURL", "auth.tokenSource.file.path"])
    assert.equal(p("0.71.0", field).hasDefault, false);
});

test("environment and contextual fallbacks retain provenance and never fabricate credentials or addresses", () => {
  const env = p("0.71.0", "transport.proxyURL", { protocol: "tcp" });
  assert.equal(env.kind, "environment");
  assert.equal(env.hasDefault, false);
  assert.equal(env.value, undefined);
  assert.match(env.reasonEn, /http_proxy/);
  assert.equal(p("0.71.0", "transport.tls.serverName").hasDefault, false);
  assert.equal(p("0.71.0", "transport.tls.serverName", { serverAddr: "frps.example.test" }).value, "frps.example.test");
  assert.equal(p("0.71.0", "dnsServer").value, "");
  assert.equal(p("0.71.0", "auth.oidc.proxyURL").kind, "context");
  assert.match(p("0.71.0", "auth.oidc.proxyURL").reasonEn, /custom TLS.*disables proxies/);
  assert.equal(t("0.71.0", "plugin.crtPath", { pluginType: "https2http" }).value, "");
});

test("application-managed policies distinguish official defaults and invalid zero ports", () => {
  const login = p("0.71.0", "loginFailExit");
  assert.equal(login.kind, "managed");
  assert.equal(login.value, false);
  assert.equal(login.officialValue, true);
  assert.equal(p("0.71.0", "log.disablePrintColor").officialValue, false);
  assert.equal(p("0.71.0", "log.disablePrintColor").value, true);
  assert.equal(t("0.52.0", "multiplexer").value, "httpconnect");
  assert.equal(t("0.52.0", "multiplexer").kind, "managed");
  assert.equal(t("0.52.0", "multiplexer").officialValue, undefined);
  assert.equal(t("0.65.0", "enabled").officialValue, undefined);
  assert.equal(t("0.66.0", "enabled").officialValue, true);
});

test("capabilities and contexts block defaults for unsupported fields, choices and versions", () => {
  for (const version of ["", "custom", "0.51.0", "0.72.0", "1.0.0"])
    assert.equal(p(version, "transport.tcpMux").hasDefault, false);
  assert.equal(p("0.68.0", "transport.wireProtocol").hasDefault, false);
  assert.equal(p("0.69.0", "transport.wireProtocol").value, "v1");
  assert.equal(t("0.58.1", "plugin.enableHTTP2", { pluginType: "https2http" }).hasDefault, false);
  assert.equal(t("0.59.0", "plugin.enableHTTP2", { pluginType: "https2http" }).value, true);
  assert.equal(t("0.59.0", "plugin.crtPath", { pluginType: "tls2raw" }).hasDefault, false);
  assert.equal(t("0.60.0", "plugin.crtPath", { pluginType: "tls2raw" }).value, "");
  assert.equal(p("0.71.0", "transport.quic.keepalivePeriod", { protocol: "tcp" }).hasDefault, false);
  assert.equal(t("0.71.0", "protocol", { protocol: "stcp", role: "visitor" }).hasDefault, false);
  assert.equal(t("0.71.0", "type.tcp").hasDefault, false);
  assert.equal(p("0.71.0", "transport.protocol.tcp").hasDefault, false);
  assert.equal(t("0.71.0", "plugin.password", { pluginType: "http2http" }).hasDefault, false);
});

test("unlisted patches disclose inherited defaults and returned collections cannot mutate future lookups", () => {
  const inherited = p("0.58.99", "transport.tcpMuxKeepaliveInterval");
  assert.equal(inherited.value, 30);
  assert.equal(inherited.audited, false);
  assert.equal(inherited.sourceVersion, "0.58.1");
  assert.match(inherited.reasonEn, /has not been audited/);
  assert.equal(p("0.53.1", "transport.tcpMuxKeepaliveInterval").sourceVersion, "0.53.0");
  const collection = p("0.71.0", "metadatas");
  collection.value.secret = "caller mutation";
  assert.deepEqual(p("0.71.0", "metadatas").value, {});
  assert.equal(p("0.71.0", "advanced.transport.tcpMux").value, true);
  assert.equal(p("0.71.0", "webPort").value, 0);
  assert.equal(formatConfigDefault(t("0.71.0", "remotePort")), "0");
  assert.equal(formatConfigDefault(t("0.71.0", "transport.useEncryption")), "false");
  assert.equal(formatConfigDefault(p("0.71.0", "auth.token")), "空值");
});
