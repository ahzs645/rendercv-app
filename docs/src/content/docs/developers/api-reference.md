---
title: API Reference
description: Current Hono API routes, persistence behavior, and response contracts.
---

The API server mounts routes under `/api`. Current route implementations use process-local JSON persistence in `apps/api/data/state.json`.

## Error Shape

Validation errors return `invalid_payload`. Invalid JSON returns `invalid_json`. Missing routes return `not_found`. Unhandled errors return `internal_error`.

## Files

Base path: `/api/files`

- `GET /`: returns `{ files }`.
- `POST /`: validates and prepends a full `CvFile` payload.
- `POST /migrate`: bulk prepends `{ files }`.
- `PATCH /:id/content`: updates `cv`, selected design, selected locale, settings, `lastEdited`, and increments `editCount`.
- `PATCH /:id/meta`: updates metadata such as name, designs, selected theme/locale, variants, public/archive/trash/lock flags, and hidden entries.
- `DELETE /:id`: removes a file.

Content and meta patch routes reject missing files and route/body ID mismatches.

## Preferences

Base path: `/api/preferences`

- `GET /`: returns stored preferences.
- `PATCH /`: shallow-merges `{ preferences }` into server state.

## Billing

Base path: `/api/billing`

- `GET /subscription`: returns tier and interval from server state.
- `POST /checkout`: returns placeholder checkout URL `https://rendercv.example/checkout/{slug}`.
- `GET /portal`: returns placeholder portal URL.
- `POST /webhooks/polar`: returns `{ ok: true }`.

Billing is currently a mock/local implementation.

## Chat and AI

Base paths: `/api/chat`, `/api/ai`

- `POST /api/chat`: streams a Vercel AI SDK UI message response.
- `GET /api/ai/usage`: returns `{ used, limit }`.

Managed chat currently returns deterministic local guidance and increments server-side usage. BYOK supports OpenAI and Anthropic via request-supplied API keys.

## PDF Import

Base path: `/api/import-pdf`

- `POST /`: accepts multipart field `pdf`, max 5 MB, parses readable text with `pdf-parse`, and returns generated RenderCV `cv` YAML.

Invalid, empty, oversized, unreadable, or low-text PDFs return typed errors.

## GitHub

Base path: `/api/github`

- `GET /connection`: returns current connection state.
- `GET /authorize?repo=&private=true`: mock connect/sync and redirect to `/`.
- `POST /sync`: writes YAML exports and a manifest under `apps/api/data/github-sync/{repoName}`.
- `DELETE /connection`: clears connection state.

GitHub OAuth and remote repository operations are currently mock/local.

## Migration, Feedback, Meta, Public CV

- `POST /api/migrate`: requires `firebase_uid`, returns `{ ok, firebaseUid }`.
- `POST /api/feedback`: validates `type`, `message`, optional `email`, and optional `page`; persists submission.
- `GET /api/meta/github-stars`: currently returns `{ stars: 0 }`.
- `GET /api/public-cv/:id`: returns a public CV payload only when the file exists and `isPublic` is true; otherwise returns `{ cv: null }` with 404.
