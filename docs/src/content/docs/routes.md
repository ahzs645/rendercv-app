---
title: Routes
description: User-facing routes in the RenderCV web app.
---

## Workspace and Documents

- `/`: main workspace.
- `/preview`: separate preview window.
- `/:sharedCvId`: public CV viewer backed by the API.

## Sharing and Review

- `/share`: encoded share or legacy review link viewer.
- `/share?dl=pdf`: encoded share link that auto-generates and downloads a PDF.
- `/review-import`: imports encoded review proposal links.
- `/review/:sessionId`: local review session UI.

## Account, Migration, and Legal

- `/migrate`: migration helper route for old link shapes.
- `/portal`: billing portal redirect.
- `/privacy-policy`: privacy policy.
- `/terms-of-service`: terms of service.
- `/pricing`: redirects to `/`.

## Developer and Diagnostics

- `/prototype-renderers`: renderer prototype route.
- `/sentry-test`: error-test route. The route exists, but Sentry initialization was not found in the inspected app code.
