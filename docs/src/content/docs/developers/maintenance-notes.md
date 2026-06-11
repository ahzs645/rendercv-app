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

## CI and Deployment

CI runs frozen install, recursive typecheck, recursive tests, and recursive build on Node 22.

GitHub Pages deployment builds only the web app and uploads `apps/web/dist`. The web app assumes base path `/rendercv-app/`.
