import assert from "node:assert/strict";
import { test } from "node:test";
import { parse } from "smol-toml";
import {
  ConfigError,
  createShareUri,
  exportProfileToml,
  parseConfigImport,
  validateProfileAdvanced,
  validateTunnelAdvanced,
  hasConfigurationCredentials,
  getConfigurationFileReferences,
} from "./config.ts";
import { makeProfile, makeTunnel } from "./model.ts";
import { configurationFields, getConfigCapability, getConfigurationVersionState, getUnsupportedAdvancedPaths, isConfigCapabilitySupported } from "./configCapabilities.ts";
import { getConfigDefault } from "./configDefaults.ts";

const profile = makeProfile({
  name: "本机测试",
  serverAddr: "127.0.0.1",
  version: "0.71.0",
  authToken: "test-private-token",
});

test("new connection defaults disable management and use automatic remote-port allocation", () => {
  const connection = makeProfile({ version: "0.71.0" });
  const tunnel = makeTunnel({ profileId: connection.id });
  const document = parse(exportProfileToml(connection, [tunnel], true));
  assert.equal(document.serverAddr, "0.0.0.0");
  assert.equal(document.serverPort, 7000);
  assert.equal(document.transport.protocol, "tcp");
  assert.equal(document.transport.tls.enable, true);
  assert.equal(document.webServer, undefined);
  assert.equal(document.proxies[0].localIP, "127.0.0.1");
  assert.equal(document.proxies[0].localPort, 8080);
  assert.equal(document.proxies[0].remotePort, 0);
  assert.equal(document.proxies[0].transport.useEncryption, false);
  assert.equal(document.proxies[0].transport.useCompression, false);
  assert.deepEqual(connection.advanced, {});
  assert.deepEqual(tunnel.advanced, {});
});

test("existing model overrides keep their saved ports, switches and advanced values", () => {
  const advanced = { transport: { heartbeatInterval: 0, tcpMux: false } };
  const connection = makeProfile({
    name: "Saved connection", version: "0.71.0", serverAddr: "::1",
    serverPort: 7443, webPort: 7400, tls: false, advanced,
  });
  const tunnel = makeTunnel({
    profileId: connection.id, localPort: 3000, remotePort: 18080,
    encryption: true, compression: true,
  });
  const original = structuredClone({ connection, tunnel });
  const document = parse(exportProfileToml(connection, [tunnel], true));
  assert.equal(document.serverAddr, "::1");
  assert.equal(document.serverPort, 7443);
  assert.equal(document.webServer.port, 7400);
  assert.equal(document.transport.tls.enable, false);
  assert.equal(document.transport.heartbeatInterval, 0);
  assert.equal(document.transport.tcpMux, false);
  assert.equal(document.proxies[0].localPort, 3000);
  assert.equal(document.proxies[0].remotePort, 18080);
  assert.equal(document.proxies[0].transport.useEncryption, true);
  assert.equal(document.proxies[0].transport.useCompression, true);
  assert.deepEqual({ connection, tunnel }, original);
});

test("displaying version and context defaults leaves advanced JSON and generated TOML unset", () => {
  const connection = makeProfile({ version: "0.71.0", user: "namespace" });
  const provider = makeTunnel({ profileId: connection.id, name: "provider" });
  const visitor = makeTunnel({
    profileId: connection.id, name: "visitor", type: "xtcp", role: "visitor",
    serverName: "target",
  });
  const tunnels = [provider, visitor];
  const original = structuredClone({ connection, tunnels });
  const before = exportProfileToml(connection, tunnels, true);
  for (const version of ["0.52.0", "0.52.1", "0.58.0", "0.58.1", "0.71.0"]) {
    for (const tcpMux of [false, true]) {
      const context = { protocol: "tcp", tcpMux, user: connection.user, serverAddr: connection.serverAddr };
      for (const key of ["transport.tcpMux", "transport.heartbeatInterval", "transport.heartbeatTimeout", "transport.tcpMuxKeepaliveInterval", "transport.tls.serverName", "natHoleStunServer", "transport.proxyURL"])
        getConfigDefault(version, key, "profile", context);
      for (const key of ["healthCheck.type", "healthCheck.timeoutSeconds", "healthCheck.maxFailed", "healthCheck.intervalSeconds", "plugin.type", "transport.bandwidthLimitMode"])
        getConfigDefault(version, key, "tunnel", { protocol: "tcp", role: "provider" });
      for (const key of ["serverUser", "protocol", "keepTunnelOpen", "maxRetriesAnHour", "minRetryInterval", "fallbackTo", "fallbackTimeoutMs"])
        getConfigDefault(version, key, "tunnel", { protocol: "xtcp", role: "visitor", user: connection.user });
    }
  }
  assert.deepEqual({ connection, tunnels }, original);
  assert.equal(exportProfileToml(connection, tunnels, true), before);
  const document = parse(before);
  assert.deepEqual({ ...document.transport, tls: { ...document.transport.tls } }, { protocol: "tcp", tls: { enable: true } });
  assert.equal(document.proxies[0].healthCheck, undefined);
  assert.equal(document.proxies[0].plugin, undefined);
  assert.equal(document.proxies[0].loadBalancer, undefined);
  assert.equal(document.visitors[0].protocol, undefined);
  assert.equal(document.visitors[0].serverUser, undefined);
  assert.equal(document.visitors[0].keepTunnelOpen, undefined);
  assert.equal(document.visitors[0].fallbackTimeoutMs, undefined);
  const shared = parseConfigImport(createShareUri(connection, tunnels, true), connection.version, "Shared");
  assert.deepEqual(shared.profile.advanced, {});
  assert.deepEqual(shared.tunnels.map((item) => item.advanced), [{}, {}]);
});

test("looking up display defaults preserves explicit zero and false overrides through exchanges", () => {
  const connection = makeProfile({
    version: "0.71.0",
    advanced: { udpPacketSize: 0, transport: { tcpMux: false, heartbeatInterval: 0, heartbeatTimeout: 0, poolCount: 0, tls: { disableCustomTLSFirstByte: false } } },
  });
  const tunnel = makeTunnel({
    profileId: connection.id,
    advanced: { healthCheck: { type: "tcp", timeoutSeconds: 0, maxFailed: 0, intervalSeconds: 0 } },
  });
  const original = structuredClone({ connection, tunnel });
  assert.equal(getConfigDefault(connection.version, "transport.tcpMux", "profile").value, true);
  assert.equal(getConfigDefault(connection.version, "udpPacketSize", "profile").value, 1500);
  assert.equal(getConfigDefault(connection.version, "healthCheck.timeoutSeconds", "tunnel", { protocol: "tcp", role: "provider" }).value, 3);
  const document = parse(exportProfileToml(connection, [tunnel], true));
  assert.equal(document.udpPacketSize, 0);
  assert.equal(document.transport.tcpMux, false);
  assert.equal(document.transport.heartbeatInterval, 0);
  assert.equal(document.transport.heartbeatTimeout, 0);
  assert.equal(document.transport.poolCount, 0);
  assert.equal(document.transport.tls.disableCustomTLSFirstByte, false);
  assert.deepEqual({ ...document.proxies[0].healthCheck }, { type: "tcp", timeoutSeconds: 0, maxFailed: 0, intervalSeconds: 0 });
  const shared = parseConfigImport(createShareUri(connection, [tunnel], true), connection.version, "Shared");
  assert.deepEqual(shared.profile.advanced, connection.advanced);
  assert.deepEqual(shared.tunnels[0].advanced, tunnel.advanced);
  assert.deepEqual({ connection, tunnel }, original);
});

test("unknown TOML options are rejected without silently losing configuration", () => {
  assert.throws(
    () =>
      parseConfigImport(
        'serverAddr = "127.0.0.1"\nserverPort = 7000\nunknownOption = "kept?"',
        "0.71.0",
        "Imported",
      ),
    (error) =>
      error instanceof ConfigError && error.en.includes("unknownOption"),
  );
});

test("TCP ranges export as independent proxies and disabled tunnels stay out of runtime configuration", () => {
  const range = makeTunnel({
    name: "range",
    profileId: profile.id,
    localPort: 8000,
    localPortEnd: 8002,
    remotePort: 18000,
    remotePortEnd: 18002,
  });
  const disabled = makeTunnel({
    name: "disabled",
    profileId: profile.id,
    enabled: false,
  });
  const document = parse(exportProfileToml(profile, [range, disabled]));
  assert.equal(document.proxies.length, 3);
  assert.deepEqual(
    document.proxies.map((proxy) => proxy.localPort),
    [8000, 8001, 8002],
  );
  assert.deepEqual(
    document.proxies.map((proxy) => proxy.remotePort),
    [18000, 18001, 18002],
  );
  assert.equal(document.auth?.token, undefined);
});

test("HTTPS-to-HTTP configuration preserves certificate, key and IPv6 address during import", () => {
  const tunnel = makeTunnel({
    name: "secure",
    profileId: profile.id,
    type: "https",
    remotePort: 0,
    domain: "example.test",
    https2http: true,
    localIP: "::1",
    localPort: 8080,
    certPath: "C:/cert.pem",
    keyPath: "C:/key.pem",
  });
  const toml = exportProfileToml(profile, [tunnel], true);
  const imported = parseConfigImport(toml, "0.71.0", "Imported");
  assert.equal(imported.profile.authToken, profile.authToken);
  assert.equal(imported.tunnels[0].localIP, "::1");
  assert.equal(imported.tunnels[0].localPort, 8080);
  assert.equal(imported.tunnels[0].certPath, "C:/cert.pem");
  assert.equal(imported.tunnels[0].keyPath, "C:/key.pem");
});

test("sharing retains disabled tunnels but excludes secrets by default and accepts prior prototype format", () => {
  const tunnel = makeTunnel({
    name: "private",
    profileId: profile.id,
    type: "stcp",
    remotePort: 0,
    secretKey: "test-private-key",
    enabled: false,
  });
  const link = createShareUri(profile, [tunnel]);
  const imported = parseConfigImport(link, "0.71.0", "Imported");
  assert.equal(imported.profile.authToken, "");
  assert.equal(imported.tunnels[0].secretKey, "");
  assert.equal(imported.tunnels[0].enabled, false);
  const payload = JSON.parse(
    Buffer.from(link.slice(6), "base64url").toString("utf8"),
  );
  assert.equal(payload.format, "frpc-ui");
  assert.equal(payload.profile.name, "本机测试");
  payload.format = "frpc-ui-prototype";
  const previous = `frp://${Buffer.from(JSON.stringify(payload)).toString("base64url")}`;
  assert.equal(
    parseConfigImport(previous, "0.71.0", "Imported").tunnels.length,
    1,
  );
});

test("exported supervised login and logging policy round trips and incompatible policies are rejected", () => {
  const output = exportProfileToml(profile, [], true);
  const document = parse(output);
  assert.equal(document.loginFailExit, false);
  assert.deepEqual({ ...document.log }, {
    to: "console", level: "info", disablePrintColor: true,
  });
  assert.equal(parseConfigImport(output, "0.71.0", "Imported").profile.authToken, profile.authToken);
  const base = 'serverAddr = "127.0.0.1"\n';
  for (const incompatible of [
    'loginFailExit = true',
    'loginFailExit = "false"',
    '[log]\nto = "frpc.log"\nlevel = "info"\ndisablePrintColor = true',
    '[log]\nto = "console"\nlevel = "debug"\ndisablePrintColor = true',
    '[log]\nto = "console"\nlevel = "info"\ndisablePrintColor = false',
    '[log]\nto = "console"\nlevel = "info"\ndisablePrintColor = true\nmaxDays = 3',
  ]) {
    assert.throws(() => parseConfigImport(base + incompatible, "0.71.0", "Imported"), ConfigError);
  }
  assert.throws(
    () => parseConfigImport(base + '[auth]\nadditionalScopes = ["UnknownScope"]', "0.71.0", "Imported"),
    (error) => error instanceof ConfigError && error.en.includes("additionalScopes"),
  );
});

test("an empty management table and an explicit zero port preserve disabled management", () => {
  for (const suffix of ['[webServer]\naddr = "127.0.0.1"', '[webServer]\nport = 0']) {
    const imported = parseConfigImport('serverAddr = "127.0.0.1"\n' + suffix, "0.71.0", "Imported");
    assert.equal(imported.profile.webPort, 0);
    assert.equal(parse(exportProfileToml(imported.profile, [])).webServer, undefined);
  }
});

test("bracketed IPv6 hosts normalize to raw addresses and IP custom domains are rejected", () => {
  const source = 'serverAddr = "[::1]"\n[[proxies]]\nname = "tcp"\ntype = "tcp"\nlocalIP = "[2001:db8::1]"\nlocalPort = 8080\nremotePort = 18080';
  const imported = parseConfigImport(source, "0.71.0", "Imported");
  assert.equal(imported.profile.serverAddr, "::1");
  assert.equal(imported.tunnels[0].localIP, "2001:db8::1");
  const bracketedProfile = { ...imported.profile, serverAddr: "[::1]" };
  const bracketedTunnels = [{ ...imported.tunnels[0], localIP: "[2001:db8::1]" }];
  const document = parse(exportProfileToml(bracketedProfile, bracketedTunnels));
  assert.equal(document.serverAddr, "::1");
  assert.equal(document.proxies[0].localIP, "2001:db8::1");
  const shared = parseConfigImport(createShareUri(bracketedProfile, bracketedTunnels), "0.71.0", "Imported");
  assert.equal(shared.profile.serverAddr, "::1");
  assert.equal(shared.tunnels[0].localIP, "2001:db8::1");
  for (const domain of ["127.0.0.1", "*.127.0.0.1"]) {
    assert.throws(
      () => parseConfigImport(`serverAddr = "127.0.0.1"\n[[proxies]]\nname = "http"\ntype = "http"\nlocalPort = 80\ncustomDomains = ["${domain}"]`, "0.71.0", "Imported"),
      ConfigError,
    );
  }
});

test("host parsing rejects URL-normalized DNS inputs while accepting literal IP and ASCII DNS hosts", () => {
  for (const host of [
    "foo_bar.example.test",
    "example.test.",
    "foo\\bar.example.test",
    "测试.example.test",
    "[::1]:7000",
    "example.test:7000",
    "a..example.test",
    `${"a".repeat(64)}.example.test`,
    Array(5).fill("a".repeat(51)).join("."),
  ]) {
    const source = `serverAddr = ${JSON.stringify(host)}\n`;
    assert.throws(
      () => parseConfigImport(source, "0.71.0", "Imported"),
      ConfigError,
      host,
    );
  }
  for (const host of ["127.0.0.1", "localhost", "frp-1.example.test", "::1", "[2001:db8::1]"]) {
    const source = `serverAddr = ${JSON.stringify(host)}\n`;
    const imported = parseConfigImport(source, "0.71.0", "Imported");
    assert.equal(imported.profile.serverAddr, host.replace(/^\[|\]$/g, ""), host);
  }
});

test("the TOML tunnel limit counts providers and visitors together", () => {
  const providers = Array.from({ length: 250 }, (_, index) => `[[proxies]]\nname = "tcp-${index}"\ntype = "tcp"\nlocalPort = 8080\nremotePort = ${18000 + index}\n`).join("\n");
  const visitors = Array.from({ length: 251 }, (_, index) => `[[visitors]]\nname = "visitor-${index}"\ntype = "stcp"\nserverName = "provider"\nbindPort = ${19000 + index}\n`);
  const base = 'serverAddr = "127.0.0.1"\n' + providers;
  assert.equal(parseConfigImport(base + visitors.slice(0, 250).join("\n"), "0.71.0", "Imported").tunnels.length, 500);
  assert.throws(
    () => parseConfigImport(base + visitors.join("\n"), "0.71.0", "Imported"),
    (error) => error instanceof ConfigError && error.en.includes("at most 500"),
  );
});

test("sharing rejects excess tunnels before producing a link its own reader cannot import", () => {
  const tunnels = Array.from({ length: 501 }, (_, index) => makeTunnel({
    name: `tcp-${index}`, profileId: profile.id,
  }));
  const link = createShareUri(profile, tunnels.slice(0, 500));
  assert.equal(parseConfigImport(link, "0.71.0", "Imported").tunnels.length, 500);
  assert.throws(
    () => createShareUri(profile, tunnels),
    (error) => error instanceof ConfigError && error.en.includes("at most 500"),
  );
});

test("TOML export checks expanded range count while excluded tunnels do not consume the limit", () => {
  const ranges = Array.from({ length: 4 }, (_, index) => makeTunnel({
    name: `range-${index}`, profileId: profile.id,
    localPort: 8000, localPortEnd: 8124,
    remotePort: 18000, remotePortEnd: 18124,
  }));
  const additional = makeTunnel({ name: "additional", profileId: profile.id });
  const output = exportProfileToml(profile, [...ranges, { ...additional, enabled: false }]);
  assert.equal(parseConfigImport(output, "0.71.0", "Imported").tunnels.length, 500);
  assert.throws(
    () => exportProfileToml(profile, [...ranges, additional]),
    (error) => error instanceof ConfigError && error.en.includes("expanded port ranges"),
  );
});

test("import and generated exchanges use the same 1 MiB UTF-8 size limit", () => {
  const limit = 1024 * 1024;
  const base = 'serverAddr = "127.0.0.1"\n#';
  const exactLimit = base + "x".repeat(limit - Buffer.byteLength(base));
  assert.equal(parseConfigImport(exactLimit, "0.71.0", "Imported").tunnels.length, 0);
  for (const input of [exactLimit + "x", base + "中".repeat(350_000)]) {
    assert.throws(() => parseConfigImport(input, "0.71.0", "Imported"), ConfigError);
  }
  const oversized = { ...profile, authToken: "x".repeat(limit) };
  assert.throws(() => exportProfileToml(oversized, [], true), ConfigError);
  assert.throws(() => createShareUri(oversized, [], true), ConfigError);
});

const plain = (value) => JSON.parse(JSON.stringify(value));
const modernProfile = () => makeProfile({ ...profile, version: "0.71.0", webPort: 0 });

test("advanced connection transport, TLS, scopes and management fields survive TOML and schema2 sharing", () => {
  const connection = modernProfile();
  connection.advanced = {
    clientID: "client-a", natHoleStunServer: "stun.example.test:3478", dnsServer: "8.8.8.8", udpPacketSize: 1400,
    metadatas: { label: "local-test" },
    auth: { method: "token", additionalScopes: ["HeartBeats", "NewWorkConns"] },
    transport: {
      wireProtocol: "v2", dialServerTimeout: 8, dialServerKeepalive: -1, connectServerLocalIP: "127.0.0.1",
      proxyURL: "http://proxy.example.test:8080", poolCount: 2, tcpMux: false, tcpMuxKeepaliveInterval: 30,
      heartbeatInterval: -1, heartbeatTimeout: 90,
      tls: { certFile: "C:/client.crt", keyFile: "C:/client.key", trustedCaFile: "C:/ca.crt", serverName: "frp.example.test", disableCustomTLSFirstByte: false },
    },
    webServer: { user: "admin", password: "test-password", assetsDir: "C:/assets", pprofEnable: false,
      tls: { certFile: "C:/web.crt", keyFile: "C:/web.key" } },
  };
  const toml = exportProfileToml(connection, [], true);
  const document = parse(toml);
  assert.equal(document.webServer.port, 0);
  assert.equal(document.transport.tls.enable, true);
  assert.deepEqual(plain(parseConfigImport(toml, "0.71.0", "Imported").profile.advanced), connection.advanced);
  const link = createShareUri(connection, [], true);
  assert.equal(JSON.parse(Buffer.from(link.slice(6), "base64url").toString()).schema, 2);
  assert.deepEqual(plain(parseConfigImport(link, "0.71.0", "Imported").profile.advanced), connection.advanced);
});

test("multi-domain HTTP, headers, health checks, load balancing and provider user policies round trip", () => {
  const connection = modernProfile();
  const http = makeTunnel({ profileId: connection.id, type: "http", name: "web", domain: "a.example.test", advanced: {
    customDomains: ["a.example.test", "b.example.test"], subdomain: "web",
    annotations: { owner: "operator" }, metadatas: { route: "dev" },
    locations: ["/api", "/static"], httpUser: "test-user", httpPassword: "test-password", hostHeaderRewrite: "localhost",
    requestHeaders: { set: { "X-Request": "test-value" } }, responseHeaders: { set: { "X-Response": "test-value" } }, routeByHTTPUser: "route-user",
    transport: { bandwidthLimit: "100KB", bandwidthLimitMode: "server", proxyProtocolVersion: "v2" },
    loadBalancer: { group: "web", groupKey: "test-group-key" },
    healthCheck: { type: "http", path: "/ready", timeoutSeconds: 3, maxFailed: 1, intervalSeconds: 10, httpHeaders: [{ name: "X-Health", value: "test-value" }] },
  } });
  const privateTunnel = makeTunnel({ profileId: connection.id, type: "stcp", name: "private", advanced: { allowUsers: ["user-a", "*"] } });
  const imported = parseConfigImport(exportProfileToml(connection, [http, privateTunnel], true), "0.71.0", "Imported");
  assert.deepEqual(plain(imported.tunnels[0].advanced), http.advanced);
  assert.equal(imported.tunnels[0].domain, "a.example.test");
  assert.deepEqual(plain(imported.tunnels[1].advanced), privateTunnel.advanced);
  const shared = parseConfigImport(createShareUri(connection, [http], true), "0.71.0", "Imported");
  assert.deepEqual(plain(shared.tunnels[0].advanced), http.advanced);
});

test("TCPMUX subdomain, automatic ports and negative visitor binding retain their distinct meanings", () => {
  const connection = modernProfile();
  const mux = makeTunnel({ profileId: connection.id, type: "tcpmux", name: "mux", domain: "", advanced: { subdomain: "mux", multiplexer: "httpconnect", httpUser: "route", httpPassword: "test-secret" } });
  const automatic = makeTunnel({ profileId: connection.id, name: "automatic", remotePort: 0 });
  const visitor = makeTunnel({ profileId: connection.id, name: "visitor", type: "xtcp", role: "visitor", serverName: "provider", advanced: {
    bindPort: -1, serverUser: "remote-user", protocol: "quic", keepTunnelOpen: true, maxRetriesAnHour: 8,
    minRetryInterval: 90, fallbackTo: "stcp-fallback", fallbackTimeoutMs: 500, natTraversal: { disableAssistedAddrs: true },
  } });
  const toml = exportProfileToml(connection, [mux, automatic, visitor], true);
  const document = parse(toml);
  assert.equal(document.proxies[0].type, "tcpmux");
  assert.equal(document.proxies[0].customDomains, undefined);
  assert.equal(document.proxies[1].remotePort, 0);
  assert.equal(document.visitors[0].bindPort, -1);
  const imported = parseConfigImport(toml, "0.71.0", "Imported");
  assert.deepEqual(plain(imported.tunnels[0].advanced), mux.advanced);
  assert.equal(imported.tunnels[1].remotePort, 0);
  assert.deepEqual(plain(imported.tunnels[2].advanced), visitor.advanced);
  assert.ok(imported.tunnels[2].localPort > 0);
  assert.throws(() => exportProfileToml(connection, [{ ...automatic, localPortEnd: 8081, remotePortEnd: 1 }]), ConfigError);
});

test("all supported stream plugins round trip without ordinary backend fields", () => {
  const connection = modernProfile();
  const plugins = [
    { type: "http2https", localAddr: "127.0.0.1:443", hostHeaderRewrite: "backend", requestHeaders: { set: { "X-Test": "ok" } } },
    { type: "http2http", localAddr: "127.0.0.1:80" },
    { type: "https2http", localAddr: "[::1]:8080", enableHTTP2: false },
    { type: "https2https", localAddr: "127.0.0.1:443", crtPath: "C:/site.crt", keyPath: "C:/site.key" },
    { type: "http_proxy", httpUser: "test-user", httpPassword: "test-secret" },
    { type: "socks5", username: "test-user", password: "test-secret" },
    { type: "static_file", localPath: "C:/public", stripPrefix: "/assets", httpUser: "test-user", httpPassword: "test-secret" },
    { type: "unix_domain_socket", unixPath: "C:/run/backend.sock" },
    { type: "tls2raw", localAddr: "127.0.0.1:8080" },
  ];
  const tunnels = plugins.map((plugin) => makeTunnel({ profileId: connection.id, name: plugin.type, advanced: { plugin } }));
  const toml = exportProfileToml(connection, tunnels, true);
  const document = parse(toml);
  assert.ok(document.proxies.every((proxy) => proxy.localIP === undefined && proxy.localPort === undefined));
  const imported = parseConfigImport(toml, "0.71.0", "Imported");
  assert.deepEqual(imported.tunnels.map((tunnel) => plain(tunnel.advanced.plugin)), plugins);
  assert.ok(imported.tunnels.every((tunnel) => !tunnel.https2http));
  assert.throws(() => validateTunnelAdvanced({ plugin: { type: "https2http", localAddr: "127.0.0.1:80", crtPath: "C:/one.crt" } }, "tcp", "provider"), ConfigError);
});

test("OIDC and file token sources round trip while mutually exclusive credentials and executable sources fail", () => {
  const connection = makeProfile({ ...modernProfile(), authToken: "", advanced: { auth: { method: "oidc", additionalScopes: ["HeartBeats"], oidc: {
    clientID: "test-client", clientSecret: "test-oidc-secret", audience: "test-audience", scope: "openid", tokenEndpointURL: "https://identity.example.test/token",
    additionalEndpointParams: { resource: "local-test" }, trustedCaFile: "C:/ca.crt", insecureSkipVerify: false, proxyURL: "http://proxy.example.test:8080",
  } } } });
  const imported = parseConfigImport(exportProfileToml(connection, [], true), "0.71.0", "Imported");
  assert.deepEqual(plain(imported.profile.advanced), connection.advanced);
  const file = makeProfile({ ...modernProfile(), authToken: "", advanced: { auth: { method: "token", tokenSource: { type: "file", file: { path: "C:/tokens/client.token" } } } } });
  assert.deepEqual(plain(parseConfigImport(exportProfileToml(file, [], true), "0.71.0", "Imported").profile.advanced), file.advanced);
  assert.throws(() => exportProfileToml({ ...file, authToken: "duplicate" }, [], true), ConfigError);
  assert.throws(() => validateProfileAdvanced({ auth: { tokenSource: { type: "exec", exec: { command: "cmd" } } } }), ConfigError);
  assert.throws(() => validateProfileAdvanced({ auth: { tokenSource: { type: "file", file: { path: "relative.token" } } } }), ConfigError);
  assert.throws(() => validateProfileAdvanced({ auth: { method: "oidc", oidc: { clientID: "test", tokenEndpointURL: "https://identity.example.test/token", additionalEndpointParams: { scope: "duplicate" } } } }), ConfigError);
});

test("default exchanges remove new credentials and sensitive maps without mutating running configuration", () => {
  const connection = makeProfile({ ...modernProfile(), authToken: "", advanced: {
    auth: { method: "oidc", oidc: { clientID: "test-client", clientSecret: "private-oidc", tokenEndpointURL: "https://identity.example.test/token", additionalEndpointParams: { resource: "private-extra" }, proxyURL: "http://user:private-proxy@proxy.example.test:8080" } },
    metadatas: { secret: "private-metadata" }, webServer: { user: "private-admin", password: "private-admin-password" },
  } });
  const tunnel = makeTunnel({ profileId: connection.id, type: "http", domain: "example.test", advanced: {
    httpUser: "private-http-user", httpPassword: "private-http-password", requestHeaders: { set: { Authorization: "private-header" } },
    responseHeaders: { set: { "X-Secret": "private-response" } }, metadatas: { secret: "private-tunnel-meta" },
    loadBalancer: { group: "service", groupKey: "private-group-key" }, healthCheck: { type: "http", path: "/ready", httpHeaders: [{ name: "Authorization", value: "private-health" }] },
    plugin: { type: "http_proxy", httpUser: "private-plugin-user", httpPassword: "private-plugin-pass" },
  } });
  const before = JSON.stringify([connection, tunnel]);
  const toml = exportProfileToml(connection, [tunnel]);
  assert.equal(toml.includes("private-"), false);
  assert.equal(JSON.stringify(parseConfigImport(createShareUri(connection, [tunnel]), "0.71.0", "Imported")).includes("private-"), false);
  assert.equal(JSON.stringify([connection, tunnel]), before);
  assert.ok(exportProfileToml(connection, [tunnel], true).includes("private-oidc"));
  const sourceOnly = makeProfile({ ...connection, advanced: { auth: { method: "oidc", oidc: { tokenSource: { type: "file", file: { path: "C:/tokens/oidc.token" } } } } } });
  assert.throws(() => createShareUri(sourceOnly, []), ConfigError);
  assert.ok(createShareUri(sourceOnly, [], true).startsWith("frp://"));
});

test("advanced validation rejects base overrides, unknown nesting and options for the wrong protocol", () => {
  for (const advanced of [{ serverAddr: "override" }, { auth: { token: "override" } }, { transport: { protocol: "quic" } }, { transport: { tls: { enable: false } } }, { webServer: { port: 8080 } }, { includes: ["external.toml"] }]) {
    assert.throws(() => validateProfileAdvanced(advanced), ConfigError);
  }
  for (const [advanced, type, role] of [
    [{ remotePort: 1234 }, "tcp", "provider"], [{ customDomains: ["example.test"] }, "tcp", "provider"],
    [{ locations: ["/api"] }, "https", "provider"], [{ httpPassword: "secret" }, "https", "provider"],
    [{ allowUsers: ["user"] }, "tcp", "provider"], [{ serverUser: "user" }, "stcp", "provider"],
    [{ bindPort: -1 }, "sudp", "visitor"], [{ protocol: "quic" }, "stcp", "visitor"],
    [{ plugin: { type: "socks5" } }, "udp", "provider"], [{ plugin: { type: "socks5" } }, "stcp", "visitor"],
    [{ plugin: { type: "virtual_net" } }, "tcp", "provider"], [{ healthCheck: { type: "tcp", unknown: true } }, "tcp", "provider"],
  ]) assert.throws(() => validateTunnelAdvanced(advanced, type, role), ConfigError);
  const connection = modernProfile();
  const tunnel = makeTunnel({ profileId: connection.id, type: "http", domain: "ignored.example.test", advanced: { customDomains: [] } });
  assert.throws(() => exportProfileToml(connection, [tunnel]), ConfigError);
});

test("version gates reject new fields only below their verified minimum release", () => {
  const profileCases = [
    [{ clientID: "client" }, 67], [{ transport: { wireProtocol: "v2" } }, 69],
    [{ auth: { method: "token", tokenSource: { type: "file", file: { path: "C:/token" } } } }, 64],
    [{ auth: { method: "oidc", oidc: { clientID: "id", tokenEndpointURL: "https://identity.example.test/token", trustedCaFile: "C:/ca.crt" } } }, 65],
    [{ auth: { method: "oidc", oidc: { tokenSource: { type: "file", file: { path: "C:/token" } } } } }, 66],
  ];
  for (const [advanced, minimum] of profileCases) {
    const connection = makeProfile({ ...modernProfile(), authToken: "", advanced, version: `0.${minimum - 1}.0` });
    assert.throws(() => exportProfileToml(connection, [], true), ConfigError);
    assert.ok(exportProfileToml({ ...connection, version: `0.${minimum}.0` }, [], true));
  }
  const tunnelCases = [
    [{ annotations: { owner: "test" } }, "tcp", 55],
    [{ healthCheck: { type: "tcp", httpHeaders: [{ name: "X-Test", value: "test" }] } }, "tcp", 56],
    [{ responseHeaders: { set: { "X-Test": "test" } } }, "http", 58],
    [{ plugin: { type: "https2http", localAddr: "127.0.0.1:80", enableHTTP2: false } }, "tcp", 59],
    [{ plugin: { type: "http2http", localAddr: "127.0.0.1:80" } }, "tcp", 59],
    [{ plugin: { type: "tls2raw", localAddr: "127.0.0.1:80" } }, "tcp", 60],
    [{ natTraversal: { disableAssistedAddrs: true } }, "xtcp", 65],
  ];
  for (const [advanced, type, minimum] of tunnelCases) {
    const connection = makeProfile({ ...modernProfile(), version: `0.${minimum - 1}.0` });
    const tunnel = makeTunnel({ profileId: connection.id, type, domain: "example.test", advanced });
    assert.throws(() => exportProfileToml(connection, [tunnel], true), ConfigError);
    assert.ok(exportProfileToml({ ...connection, version: `0.${minimum}.0` }, [tunnel], true));
  }
});

test("capability inventory distinguishes audited minors, inherited patches and unreviewed versions", () => {
  assert.ok(configurationFields.length > 100);
  assert.equal(getConfigurationVersionState("0.52.0").kind, "audited");
  assert.equal(getConfigurationVersionState("0.65.3").kind, "patch-inherited");
  assert.equal(isConfigCapabilitySupported("0.65.3", "auth.oidc.trustedCaFile"), true);
  assert.equal(isConfigCapabilitySupported("0.68.9", "transport.wireProtocol"), false);
  assert.equal(getConfigCapability("0.68.9", "transport.wireProtocol").minVersion, "0.69.0");
  assert.equal(isConfigCapabilitySupported("0.58.1", "plugin.type.http2http", "tunnel"), false);
  assert.equal(isConfigCapabilitySupported("0.59.0", "plugin.type.http2http", "tunnel"), true);
  assert.equal(isConfigCapabilitySupported("0.59.0", "plugin.type.tls2raw", "tunnel"), false);
  assert.deepEqual(getUnsupportedAdvancedPaths({ plugin: { type: "tls2raw", localAddr: "127.0.0.1:80" } }, "0.59.0", "tunnel").map((entry) => entry.path), ["plugin.type"]);
  assert.deepEqual(getUnsupportedAdvancedPaths({ auth: { tokenSource: { type: "file", file: { path: "C:/token" } } } }, "0.63.0", "profile").map((entry) => entry.path), ["auth.tokenSource"]);
  for (const version of ["0.51.0", "0.72.0", "1.0.0", "v0.71.0", "0.71", "0.71.0-local", "local", "0.71.99999999999999999999"]) {
    assert.equal(isConfigCapabilitySupported(version, "serverAddr"), false, version);
    assert.throws(() => exportProfileToml({ ...modernProfile(), version }, []), ConfigError, version);
  }
  assert.equal(isConfigCapabilitySupported("0.71.0", "unknown.field"), false);
});

test("transport and tunnel semantic validation matches desktop protocol, URL, bandwidth and Windows path rules", () => {
  for (const protocol of ["tcp", "websocket", "wss"]) {
    assert.doesNotThrow(() => validateProfileAdvanced({ transport: { proxyURL: "socks5://proxy.example.test:1080", connectServerLocalIP: "127.0.0.1", heartbeatInterval: -15, heartbeatTimeout: -90, dialServerKeepalive: -30 } }, protocol));
  }
  for (const protocol of ["kcp", "quic"]) assert.throws(() => validateProfileAdvanced({ transport: { proxyURL: "http://proxy.example.test:8080" } }, protocol), ConfigError);
  assert.doesNotThrow(() => validateProfileAdvanced({ transport: { quic: { maxIncomingStreams: 100 } } }, "quic"));
  assert.throws(() => validateProfileAdvanced({ transport: { quic: { maxIncomingStreams: 100 } } }, "tcp"), ConfigError);
  assert.throws(() => validateProfileAdvanced({ transport: { proxyURL: "socks5h://proxy.example.test:1080" } }, "tcp"), ConfigError);
  assert.throws(() => validateProfileAdvanced({ transport: { heartbeatInterval: 30, heartbeatTimeout: 20 } }), ConfigError);
  for (const endpoint of ["https://user:password@identity.example.test/token", "https:identity.example.test/token"]) assert.throws(() => validateProfileAdvanced({ auth: { method: "oidc", oidc: { clientID: "id", tokenEndpointURL: endpoint } } }), ConfigError);
  for (const quantity of ["", "  ", "100KB", " 1.5MB ", "1e2KB"]) assert.doesNotThrow(() => validateTunnelAdvanced({ transport: { bandwidthLimit: quantity } }, "tcp", "provider"));
  for (const quantity of ["10", "1mb", "1 MB", "-1KB", "NaNMB"]) assert.throws(() => validateTunnelAdvanced({ transport: { bandwidthLimit: quantity } }, "tcp", "provider"), ConfigError);
  assert.throws(() => validateTunnelAdvanced({ locations: ["api"] }, "http", "provider"), ConfigError);
  assert.throws(() => validateTunnelAdvanced({ healthCheck: { type: "http", path: "ready" } }, "tcp", "provider"), ConfigError);
  assert.throws(() => validateTunnelAdvanced({ requestHeaders: { set: { "Bad Header": "value" } } }, "http", "provider"), ConfigError);
  assert.throws(() => validateTunnelAdvanced({ loadBalancer: { group: "service" } }, "stcp", "provider"), ConfigError);
  for (const path of ["/tmp/token", "C:relative.token"]) assert.throws(() => validateProfileAdvanced({ auth: { tokenSource: { type: "file", file: { path } } } }), ConfigError);
  for (const path of ["C:/tokens/client.token", "\\\\server\\share\\client.token"]) assert.doesNotThrow(() => validateProfileAdvanced({ auth: { tokenSource: { type: "file", file: { path } } } }));
});

test("credential and file-reference helpers identify advanced sources without inspecting files", () => {
  const connection = makeProfile({ ...modernProfile(), authToken: "", advanced: { auth: { tokenSource: { type: "file", file: { path: "C:/tokens/client.token" } } }, transport: { tls: { trustedCaFile: "C:/ca.crt" } } } });
  assert.equal(hasConfigurationCredentials(connection, []), true);
  const references = getConfigurationFileReferences(connection, []);
  assert.deepEqual(references.map((entry) => entry.field).sort(), ["auth.tokenSource.file.path", "transport.tls.trustedCaFile"]);
  assert.ok(references.every((entry) => entry.profileId === connection.id));
  assert.equal(hasConfigurationCredentials({ ...connection, advanced: {} }, []), false);
});

test("schema1 and prototype links stay readable while schema strings are rejected", () => {
  const connection = modernProfile();
  const payload = JSON.parse(Buffer.from(createShareUri(connection, []).slice(6), "base64url").toString());
  payload.schema = 1;
  payload.format = "frpc-ui-prototype";
  delete payload.profile.advanced;
  const encoded = () => "frp://" + Buffer.from(JSON.stringify(payload)).toString("base64url");
  assert.equal(parseConfigImport(encoded(), "0.71.0", "Imported").profile.serverAddr, connection.serverAddr);
  payload.schema = "1";
  assert.throws(() => parseConfigImport(encoded(), "0.71.0", "Imported"), ConfigError);
});
