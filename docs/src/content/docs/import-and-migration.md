---
title: Import and Migration
description: Bring existing RenderCV files, URLs, PDF sources, and legacy data into the app.
---

The app supports multiple import paths depending on what you already have.

## YAML Import

Use YAML import for existing RenderCV files.

Supported inputs can include:

- A single CV YAML file.
- Separate `cv`, `design`, `locale`, and `settings` sections.
- Share packages exported by the app.

YAML imports must be `.yaml` or `.yml`, must be 1 MB or smaller, and must include a top-level `cv:` key.

After import, validate the preview and check the active theme and locale.

## Source URL Import

When opening a CV from a supported source URL, the app can preserve the source origin. If you share the file without changing it, the app may copy the original source link instead of generating a longer encoded snapshot link.

Once you edit the file locally, sharing falls back to a snapshot link.

Remote URL imports require HTTP(S), a reachable YAML file, CORS access, and the same 1 MB content limit.

## Encoded Share Import

Encoded share links contain a compressed snapshot of the CV sections. Opening one creates or displays the shared CV in the browser.

Large CVs may exceed practical URL limits. Use share files or review packages for larger content.

Share backup files use the `.rendercv.json` format and imports are limited to 2 MB.

## Review Import

Review imports open proposal packages from collaborators. These are handled as review sessions, with proposals that can be compared and merged.

Use review links when you want someone to suggest edits without directly editing your active CV file.

## PDF Import

PDF import is feature-flagged. When enabled, it attempts to extract useful CV content from a PDF.

Treat PDF import as a starting point, not a guaranteed exact reconstruction. Always review:

- Contact details.
- Dates.
- Section grouping.
- Bullet order.
- Formatting-sensitive characters.

PDF imports must be 5 MB or smaller. The API parses readable text, guesses name, headline, location, email, phone, website, social links, and creates an `imported_highlights` section.

## Migration Page

The migration route exists for users moving from previous data formats or app versions. Use it when instructed by release notes or when old local data does not open correctly.

The current `/migrate?firebase_uid=...` flow preserves the old migration link shape and validates the Firebase UID. The current API route confirms the UID but does not yet import legacy CV data.

## Best Practices

- Keep a copy of the original source file.
- Import into a new CV instead of overwriting an important active file.
- Preview before exporting.
- Use archive instead of deleting older versions immediately.
