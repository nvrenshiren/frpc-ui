# Application icon provenance

All PNG, ICO, ICNS and platform icon derivatives in this directory come from the repository-owned vector source `apps/desktop/app-icon.svg`. The source uses the application's navy and green tokens and a three-node network motif.

Generated with the installed official Tauri CLI:

```powershell
# apps/desktop
npx tauri icon app-icon.svg
```

The SVG is the editable source. Regenerate derivatives when changing it; do not edit individual raster sizes. Browser QA screenshots are verification artifacts and are not application assets.
