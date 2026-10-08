---
version: 1
slug: "apps-desktop-src-app-tsx"
primary_target: "apps/desktop/src/App.tsx"
related_targets: ["apps/desktop/src/index.css"]
---

## Direction contract

THESIS
The user selected 对象索引册, authorized autonomous implementation, then pinned colors and components to scoopUI and requested a workspace containing only server connection cards. Keep independent compact cards and a separate indexed tunnel register, using scoopUI's dark navy/run-green component system. Stable columns and explicit ownership support high-density maintenance.

OWN-WORLD
The observed scoopUI palette is authoritative: background #0B1220, elevated #111827, foreground #F5F7FA, run-green #22C55E, borders #374151. Light mode uses #FAFBFC / #FFFFFF / #0F172A / #16A34A. Buttons and inputs inherit scoopUI's 8px rounded scale, Radix behavior, semantic states and green focus rings. Typography uses its system-fallback sans and technical monospace. No charts with invented telemetry, oversized metric cards or decorative animation.

STORY
Operators review server cards for address, client version, transport, process/login status and pending changes. Connections and Tunnels provide selection and batch maintenance. Partial failures remain individually retryable. Forms disclose fields by selected frpc version, protocol, role, authentication method and plugin; unsupported saved values remain visible as a path-only summary with explicit clearing. Known defaults appear as real input/selection values and follow the precise patch version and current context; rendering them creates no persisted override. Explicit edits show a reset action. Environment values and required targets are not guessed. Versions explain ownership and expose searchable per-release checklists with defaults and source notes.

FIRST VIEWPORT
72px identity and utility bar; indexed navigation; workspace title and concise description; server connection cards only. The primary action adds a connection. Pending changes and errors appear on each card with aligned bottom actions. Tunnel filters, selection and records live on the Tunnels page. Cards use four/two/one columns by available width; tables scroll horizontally inside their own container.

FORM
Code-first React desktop interface, promoted from the accepted prototype. Tauri mode uses authoritative Rust snapshots; browser mode is explicitly labeled as a demonstration. The user selected the indexed direction, then superseded its colors/components with scoopUI and its workspace composition with server cards. Preserve indexed navigation, compact alignment and the separate register. Product density and accessibility constrain scale and decoration. The user requested autonomous completion.

FINISH
unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance


IMPLEMENTATION UPDATE (2026-10-08)
The accepted visual direction is unchanged. Production behavior now persists configuration through Rust, supervises official frpc processes, installs verified versions and previews legacy imports. Apply actions explicitly say restart-and-apply; changes to an active connection version require stopping first. Native GUI verification is tracked separately from browser UI verification in docs/development/verification.md.

UI REFINEMENT (2026-10-08)
All production selection controls now use a shared controlled Radix Select. Preserve visible field labels and errors, disabled versions for active processes, clearable connection choices, keyboard navigation and portal layering above editors. Menus enter in 170ms, exit in 110ms and rotate their arrow in 160ms; reduced-motion disables those transitions. Long selected values truncate with full titles, while menu labels wrap.

Scrollbars inherit dark/light tokens across the page, tables, navigation, logs, configuration text, dialogs and menu viewports. Keep horizontal table scrolling local and stable gutters in vertical content. Connection grids retain boundaries for any row count and align metadata/actions across unequal names. Configuration exchange respects the fieldset wrapper when applying margins; narrow layouts stack form grids at 560px. Settings, migration previews, notices and long technical text retain clear paragraph spacing and safe wrapping. This refinement changes shared components and layout, while preserving the accepted scoopUI palette and high-density composition.
