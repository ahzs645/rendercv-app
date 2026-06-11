---
title: Privacy and Data
description: How local CV data, share links, analytics, and exports should be treated.
---

CVs contain sensitive personal information. Treat app data and exports accordingly.

## Local Browser Data

The workspace stores CV files locally in the browser. This makes the app fast and lets you work without a server round-trip for ordinary edits.

Local storage is tied to the browser profile and origin. It may be lost if you clear site data, switch browsers, use private browsing, or reset the device.

The main local storage keys are `rendercv_guest_files`, `rendercv_preferences`, and `rendercv_review_sessions`.

## Backups

Use **Download all data** before:

- Clearing browser data.
- Switching machines.
- Testing migration flows.
- Deleting old files.
- Making major edits.

## Share Links

Share links can contain compressed CV data. Anyone with the link may be able to open the shared CV snapshot.

Do not put private details in a share link unless the recipient is allowed to see them.

Public CV links are different from encoded share links: they are backed by the API and only work for files marked public.

## Review Links and Proposal Packages

Review links and proposal packages may include origin content and proposed edits. Treat them like documents containing the full CV.

## Analytics and Error Reporting

The app includes analytics and error-reporting integrations in the web codebase. Exact behavior depends on deployment configuration and enabled environment variables.

If you operate a deployment, document which analytics tools are enabled and what data they receive.

PostHog initializes only when `VITE_POSTHOG_KEY` is set. Events are buffered until first user interaction, and session recording starts only after click, keydown, or touchstart. Password inputs are masked. A Sentry test route exists, but no Sentry initialization is currently wired in the inspected app code.

## Optional Cloud Sync

Cloud sync is enabled only when the API client is enabled and `VITE_ENABLE_CLOUD_SYNC=true`. In that mode, files and preferences are read and written through `/api/files` and `/api/preferences`. The current API persistence is a local JSON file at `apps/api/data/state.json`.

## Public CV Routes

Public/shared CV routes are designed for viewing shared content. Do not publish a public link for a CV that contains private contact information unless that is intentional.

## Security Checklist

- Review exported PDFs before sending.
- Avoid sharing links in public channels.
- Prefer file backups for private archival.
- Remove private data before using screenshots in issues.
- Rotate or delete public links if exposed accidentally.
