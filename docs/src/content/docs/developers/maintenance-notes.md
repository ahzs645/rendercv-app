---
title: Maintenance Notes
description: Known implementation status, generated assets, vendored runtimes, and cleanup rules.
---

This page captures important implementation caveats for maintainers.

## Current Mock or Local Implementations

- API persistence is file-based and process-local despite Drizzle schema scaffolding.
- Billing checkout, billing portal, and Polar webhook behavior are placeholders.
- GitHub OAuth/sync writes local YAML exports rather than connecting to GitHub.
- GitHub stars return `0`.
- Migration validates `firebase_uid` but does not import legacy CV data.
- Managed AI returns deterministic local guidance rather than calling a hosted model.
- `@sentry/react` and `/sentry-test` exist, but Sentry initialization was not found in the inspected app code.

## Security and Secrets

Bring-your-own OpenAI and Anthropic keys are stored in browser preferences and sent in request payloads. There is no server-side secret store for BYOK.

Align deployed environment variable names with code. The inspected Vite client reads `VITE_*` variables for API and PostHog.

## Vendored Runtime Assets

Vendored browser-rendering assets are source-of-record files:

- Pyodide `0.29.3` under `static/cdn/pyodide/v0.29.3/full/`.
- RenderCV wheel `static/rendercv-2.8-py3-none-any.whl`.
- Pure Python wheels under `static/cdn/pypi-wheels/`.
- Typst JS/WASM and renderer assets under `static/cdn`.
- Fonts and theme previews under `static/cdn`.

Verify Pyodide assets with:

```sh
pnpm vendor:pyodide:check
```

Updating Pyodide or RenderCV requires updating worker URLs, vendored files, and lock hashes together.

## Generated and Local Artifacts

Do not treat these as source of record:

- `apps/web/dist`
- `packages/*/dist`
- `docs/dist`
- `node_modules`
- `.astro`
- `test-results`
- `apps/api/data/state.json`
- `*.tsbuildinfo`
- `preview-timing*.json`

## Variant Per-Entry Hiding (`exclude_entries`) — Revisit

Per-entry variant hiding is stored as content fingerprints on the variant
definition (`CvVariantDefinition.exclude_entries`, keyed by section), **not** as
`itags` inside the CV. This was a deliberate deviation from the original plan.

### Why we did not use `itags`

The portable RenderCV way to hide an entry from a variant is an inverse tag
(`itags: [<variant>]`) on the entry, with the variant selecting that tag. We
tried this first and hit a hard blocker:

- `apps/web/src/ui/workspace.tsx` has a "compatibility file" effect that treats
  any CV containing `itags:`/`tags:`/`flavors:`/`social:`/`positions:` as a
  legacy import and runs `normalizeCompatibilityCvYaml(rawSections.cv)`, writing
  the normalized result back via `updateSection('cv', …)`.
- That normalization **strips** `itags`/`tags`/`flavors` from the stored CV, so
  every `itags` write the form made was immediately cleaned away (confirmed by
  tracing the sequence: form commit with `itags` → compatibility effect →
  `updateSection('cv')` overwrite without `itags`).
- The form is also the single writer of CV content (it holds `draftRootValue`
  and re-emits it), so writing CV from the store concurrently races with it.

Making `itags` survive would mean changing what the compatibility pipeline
considers strippable and untangling the dual-writer problem — destabilizing the
render/normalization path for a relatively small feature.

### Current design

- Storage: `exclude_entries: Record<sectionKey, fingerprint[]>` on the variant
  (metadata). CV content stays pristine; no race; no compatibility-normalization
  conflict. See `fileStore.toggleEntryHiddenInVariant`.
- Reflection: `computeVariantVisibility`
  (`apps/web/src/features/viewer/variant-visibility.ts`) combines
  tag/`itags`/archived rules **and** `exclude_entries`.
- Render: `resolveViewerSections` filters `exclude_entries` fingerprints out of
  the CV before it reaches the renderer, so the PDF matches the form.

### Trade-off / follow-up

`exclude_entries` is an app-specific extension. A plain `rendercv` CLI run on the
exported YAML will **not** understand it, so entries hidden per-variant in the
app would reappear in a CLI render. If CLI portability becomes a requirement,
add an export-time translation that converts `exclude_entries` into the standard
`itags` form (entry gets `itags: [<variant>]`, variant selects its own key as a
tag) only in the exported artifact, leaving the in-app storage untouched.

Related: the same compatibility effect strips `flavors`, which the field-level
"+ Flavor" feature relies on — worth confirming flavors persist as expected when
revisiting this area.

## CI and Deployment

CI runs frozen install, recursive typecheck, recursive tests, and recursive build on Node 22.

GitHub Pages deployment builds only the web app and uploads `apps/web/dist`. The web app assumes base path `/rendercv-app/`.
