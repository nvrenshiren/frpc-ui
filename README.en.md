# frpc-ui

[简体中文](README.md)

A multi-connection frpc desktop workspace built with **Tauri 2, Rust and React**. Its visual system follows COHESION, the 逐科 design system; it uses the React stack validated by scoopUI and focuses on dense tunnel lists and batch maintenance.

The real desktop implementation lives in `apps/desktop`; `prototypes/frpc-ui` is retained only as a historical design prototype. The app manages official frpc binaries rather than implementing the frp protocol. Windows x64 builds, verified scope and remaining checks are documented in the [verification record](docs/development/verification.md).

## Run the desktop app

Download Windows x64 builds from [GitHub Releases](https://github.com/nvrenshiren/frpc-ui/releases): executable, NSIS installer and SHA-256 checksums. Every push to `main` builds and publishes a separate prerelease; `vX.Y.Z` tags publish stable versions. Publication waits for tests and actual packaged startup checks. See [release documentation](docs/development/releases.md) and [Actions](https://github.com/nvrenshiren/frpc-ui/actions/workflows/ci.yml). Builds are currently unsigned; in-app updates are not implemented.

Development uses Node.js 24, npm, the Rust MSVC toolchain (MSRV 1.90), Microsoft C++ Build Tools and WebView2. See the [official Tauri prerequisites](https://v2.tauri.app/start/prerequisites/#windows).

```powershell
cd apps/desktop
npm ci
npm run desktop:dev
```

Tauri starts Vite and opens a native desktop window. To compile an executable without an installer:

```powershell
npm run desktop:build:exe
npm run test:desktop:smoke
```

The default output is `target/release/frpc-ui-desktop.exe` at the repository root. `npm run desktop:build` builds the configured Windows NSIS installer. CI also installs into a temporary directory and checks the installed executable; upgrade and signing checks remain separate.

`npm run build` checks strict TypeScript and builds the frontend. `npm run dev` serves **browser demo mode** at `http://127.0.0.1:5188/`: process, network and system actions are simulated. This is not the desktop runtime.

## First use

1. A fresh desktop installation starts with no connections or installed binaries; it does not create demo configuration.
2. In Versions, refresh official releases and install one, or import a local frpc executable. The version library recognizes modern TOML releases from 0.52.0 onward, but configuration is enabled only for reviewed releases. Unreviewed minor/major releases are not assumed compatible; see the [per-release configuration checklist](docs/frpc-version-configuration.md). Local imports run `frpc -v` to identify the binary.
3. Create a connection with its frps address, port, token and an installed frpc version, then add tunnels.
4. Start the connection. Process state, confirmed server login and tunnel registration are reported separately. Batch operations return individual results and retry the original failed action.
5. Editing, enabling, disabling or deleting tunnels marks configuration pending. Restart and apply runs official `frpc verify`, then restarts that connection's process; traffic is briefly interrupted. A stopped connection is only verified. Stop a connection before changing its frpc version.
6. Closing the window keeps the tray by default. The tray can show the window, stop all connections or quit. Quit stops managed frpc processes. Sign-in launch, hidden sign-in launch and per-connection auto-connect are separate preferences.

TOML import and legacy migration add stopped connections without overwriting existing ones or starting processes. Legacy migration explicitly selects the old `userData` or `db` directory and previews it. Confirmation rereads the source and compares its fingerprint; changed files require a new preview.

## Implemented features and stack

- Multiple connections and eight protocols including TCPMUX. Workspace shows server cards; tunnel maintenance stays in Tunnels.
- Advanced authentication/OIDC/file tokens, networking/TLS/QUIC, HTTP domains and routing, XTCP fallback, bandwidth limits, load balancing, health checks and nine provider plugins.
- Configuration checklists for 32 reviewed official stable tags from 0.52 to 0.71; version and protocol conditions drive editor availability. Unreviewed releases are not assumed compatible.
- Controls display audited defaults for the precise release and current context. Explicit edits create advanced overrides; reset removes them. Checklists include defaults and provenance, with patch changes reviewed separately.
- Batch start/stop, controlled apply, real frpc validation and supervised processes, partial failures and retries.
- Official GitHub releases, SHA-256 verified downloads, safe extraction, atomic installation, local import, integrity checks before each launch and assigned-version removal protection.
- Bounded logs, filters, pause snapshots, copy/download, TOML import/export and sharing, read-only NeDB migration previews.
- Chinese/English and light/dark/system themes; tray, single instance and operating-system autostart.

| Layer | Implemented stack |
| --- | --- |
| Frontend | React 19, strict TypeScript, Vite 8, npm / package-lock.json |
| Components and styling | Tailwind CSS 4, Radix UI, shadcn-style source primitives, semantic tokens |
| State and feedback | Zustand 5, Sonner, Lucide |
| Desktop and domain | Tauri 2, independent Rust core/versions crates, Tokio |
| Configuration and storage | smol-toml in the frontend, toml in Rust, atomic schemaVersion JSON |
| Tunneling | Official frpc executable selected per connection |

## Data and current limits

Settings shows the actual `dataDir`. `state.json` stores connections, tunnels and preferences; `versions/` holds binaries and SHA-256 metadata; `runtime/` holds temporary runtime TOML. Configuration survives app restarts, while process flags reset to stopped/unconfirmed. Auto-connect connections start again when the app launches. Logs are held in memory; disk log history is not implemented.

**Tokens and tunnel secrets are currently stored as plaintext in local configuration and required runtime TOML.** An OS credential vault or encrypted storage is not implemented. Logs redact credentials. Exports omit secrets by default, while share URIs are encoded, not encrypted. Desktop secrets are not written to localStorage; browser demo configuration stays in memory.

The [configuration coverage inventory](docs/frp-configuration-coverage.md) lists implemented fields and protocol conditions. [Per-release checklists](docs/frpc-version-configuration.md) cover 32 official stable releases from 0.52 to 0.71. Editors show options supported by the selected version; downgrading retains incompatible values and explains how to resolve them. Supported advanced legacy values are preserved. Unknown, incompatible and inapplicable fields are rejected. Executable TokenSource, external includes, official Store, VirtualNet, global start lists and custom logging policies are not enabled. Files and certificates remain path references. Share schema2 preserves advanced fields and reads schema1; credentials are omitted by default. Legacy-client share formats are not guaranteed compatible.

Official 0.71.0 basic/advanced configuration checks and real TCP/file-token lifecycle tests passed. Every protocol, plugin and historical binary has not yet received real traffic end-to-end coverage. macOS/Linux, installer upgrades and signed releases remain unverified. See the [verification record](docs/development/verification.md).

## Tests and documentation

```powershell
# apps/desktop
npm test
npm run build

# repository root
cargo test --workspace
```

Network downloads and official frpc/frps integration tests are opt-in ignored tests. Default tests do not access the public network. The [verification record](docs/development/verification.md) lists the latest reproducible checks and the scope of completed official-binary verification. Before publishing a Windows release, run the packaged executable's WebView startup/IPC/shutdown smoke; debug survival or MockRuntime cannot replace release validation. The first executable's stack overflow and fix are documented in the [Windows startup notes](docs/development/windows-startup.md).

[Architecture](docs/development/architecture.md) · [IPC contract](docs/development/ipc-contract.md) · [Verification](docs/development/verification.md) · [Product scope](PRODUCT.md) · [Design system](DESIGN.md) · [Rewrite assessment](docs/rust-rewrite-assessment.md) · [Project memory](docs/memory/MEMORY.md)

The prototype is retained for design history and is not the source of production behavior or current visual specifications. A license has not yet been selected for this new project.
