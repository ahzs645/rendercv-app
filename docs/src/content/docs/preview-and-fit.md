---
title: Preview and Fit
description: Render documents, inspect output, zoom, and fit CVs to a target page count.
---

The preview pane compiles the active CV in the browser and displays SVG pages.

## Rendering Pipeline

The app prepares the active YAML sections, validates them with RenderCV logic running in Pyodide, then compiles Typst output through a browser worker.

The main user-facing outputs are:

- SVG pages for live preview.
- PDF bytes for downloads and PDF sharing.
- Typst source for export.

Validation requests are cached and in-flight requests are deduplicated. Identical Typst content can reuse previous SVG output. Rendered preview pages are loaded as blob URLs, decoded before display, and then cleaned up when replaced.

## Preview Updates

Preview updates after content changes. Rendering may pause briefly while workers initialize, load fonts, validate YAML, or compile Typst.

The first render of a session is usually slower because browser workers and runtime assets must load.

The preview shows initialization, updating, validation-error, compatibility-warning, and rendered-page states.

## Click to Edit

When the app can map a preview element back to the source, clicking that part of the preview moves the editor to the matching section or entry.

In YAML mode, the editor reveals matching text. In form mode, the corresponding section or entry is scrolled into view.

## Zoom

Use zoom controls to inspect details or fit the document to the available preview area.

Zoom changes do not affect the exported PDF. Export size is controlled by the design and settings YAML.

Preview zoom supports buttons, reset, and trackpad/mouse gestures. Dark UI can either preserve original CV colors or adapt the preview for dark mode.

## Fit to Page

The fit-to-page tool helps reduce page count without deleting content.

It works by testing hidden-entry combinations and checking the rendered page count. Applied hidden entries are stored separately from the original source content.

You can target 1-10 pages and choose per-section priorities: Keep all, High, Normal, Low, or Off. Sections marked Off are hidden immediately. Other entries are tested lowest-priority first, then lower entries first within a section.

Use it when:

- A CV is slightly over the target page count.
- You want role-specific trimming.
- You need to hide lower-priority bullets while keeping them available later.

## Restoring Hidden Entries

Hidden entries can be restored from the workspace controls. Restoring returns all hidden content to the rendered CV.

Possible outcomes include already fits, no droppable entries, render failure, hidden entries applied, or best effort still over target.

## Runtime Workers

The Pyodide worker loads vendored Pyodide, RenderCV 2.8, and Python dependencies from `static`. It caches Python packages in IndexedDB and can import custom theme archives.

The Typst worker loads the vendored Typst runtime and WASM compiler/renderer assets, then compiles SVG and PDF output. If the CV references additional font families, the renderer can reinitialize with the required font URLs.

## When Preview Fails

Preview failures normally come from one of these categories:

- Invalid YAML syntax.
- Valid YAML that does not match the RenderCV schema.
- A theme name that is not available.
- A missing or invalid locale/design setting.
- Browser runtime loading failure.

See [Troubleshooting](/troubleshooting/) for fixes.
