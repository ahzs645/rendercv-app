---
title: Local Development
description: Install dependencies, run the app and docs, and verify changes locally.
---

Use pnpm from the repository root.

## Install

```sh
git submodule update --init --recursive
pnpm install
```

The recursive checkout pins both the shared `rendercv-toolkit` compiler and the theme repository. Update either submodule deliberately and commit the resulting gitlink.

The repository declares the pnpm version in the root `package.json`.

## Environment

Common environment variables:

- `PORT`: API server port, default `8787`.
- `DATABASE_URL`: enables a Drizzle client, though current API routes use JSON persistence.
- `VITE_API_TARGET`: Vite dev proxy target for `/api`.
- `VITE_API_BASE_URL`: absolute API base URL for deployed web builds.
- `VITE_DISABLE_API=true`: disables the API client.
- `VITE_ENABLE_CLOUD_SYNC=true`: enables file/preference API sync when API is available.
- `VITE_POSTHOG_KEY` and `VITE_POSTHOG_HOST`: enable PostHog analytics.

Maintenance note: checked-in placeholder env names use `PUBLIC_*`, while the inspected Vite client code reads `VITE_*`.

## Run the Web App

Run both API and web app:

```sh
pnpm dev
```

Run only the web app:

```sh
pnpm dev:web
```

Run only the API:

```sh
pnpm dev:api
```

## Run the Docs

```sh
pnpm dev:docs
```

The docs package is an Astro Starlight site configured with `base: '/docs'`.

## Build

Build all workspace packages:

```sh
pnpm build
```

Build only the web app:

```sh
pnpm build:web
```

Build only docs:

```sh
pnpm build:docs
```

## Typecheck

```sh
pnpm typecheck
```

This runs each workspace package typecheck script.

## Tests

```sh
pnpm test
```

The docs package runs `astro check` as its test command.

## Vendor Assets

Pyodide and related browser runtime assets are managed by scripts under `scripts/vendor`.

Check vendored Pyodide assets with:

```sh
pnpm vendor:pyodide:check
```

Regenerate them with:

```sh
pnpm vendor:pyodide
```

Theme archives are regenerated automatically before web dev/build by `apps/web/scripts/sync-bundled-themes.mjs`.

## Generated Files

Generated build metadata and benchmark timing JSON should not be committed. The root `.gitignore` excludes:

- `*.tsbuildinfo`
- `preview-timing*.json`
- `dist`
- `test-results`
- `playwright-report`

## Verification Checklist

Before opening a PR:

1. Run `pnpm typecheck`.
2. Run `pnpm test`.
3. Run the relevant package build.
4. For UI changes, open the app in a browser and verify the changed workflow.
5. For docs changes, run `pnpm build:docs`.

The GitHub Pages deployment builds `pnpm build:web` and uploads `apps/web/dist`. The web app assumes base path `/rendercv-app/`.
