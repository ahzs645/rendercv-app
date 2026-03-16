# React Migration Parity Checklist

## Route Coverage

- `/`
- `/pricing`
- `/privacy-policy`
- `/terms-of-service`
- `/migrate`
- `/portal`
- `/preview`
- `/prototype-renderers`
- `/sentry-test`
- `/:sharedCvId`

## Core Flows

- Workspace loads with persistent sidebar, editor, and preview panes.
- Guest files persist in `localStorage`.
- Cloud-backed file sync uses typed API contracts.
- Unsaved workspace state survives overlay-route navigation.
- Preview popup syncs over `BroadcastChannel`.
- Public link flow can publish and resolve a shared CV.
- YAML editing updates the active file sections.
- Preferences persist and restore active section, editor mode, and theme.
- Auth, billing, AI chat, PDF import, GitHub sync, and migration hit explicit API routes.

## Analytics And Telemetry

- Preserve existing PostHog event names from `@rendercv/core/analytics/events`.
- Preserve Sentry initialization and named spans for app boot and rendering flows.

## Baseline Media

- Capture baseline screenshots for home workspace, preview popup, pricing, legal overlays, and shared CV.
- Capture a short baseline screen recording for file editing, overlay navigation, and public-link flow.

## Acceptance

- `pnpm build` succeeds for all workspace packages.
- `pnpm test` succeeds.
- The web app serves correctly from `/rendercv-app`.
- Deleting the Svelte implementation becomes a mechanical cleanup step after parity verification.
