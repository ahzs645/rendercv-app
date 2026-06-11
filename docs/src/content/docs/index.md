---
title: RenderCV App Documentation
description: Learn how to use the RenderCV web app to write, preview, share, and export CVs.
template: splash
hero:
  tagline: A practical guide to building CVs in the browser with RenderCV, YAML, Typst, and live preview.
  actions:
    - text: Quick Start
      link: /quick-start/
      icon: right-arrow
    - text: Workspace Guide
      link: /workspace/
      variant: secondary
---

RenderCV App is a browser-based CV workspace. It lets you create and manage multiple CV files, edit them with either structured form controls or raw YAML, preview the generated document, and export files for sharing or publishing.

The app is designed around four YAML sections:

- `cv`: profile, sections, entries, links, education, work, publications, projects, and other content.
- `design`: visual theme settings.
- `locale`: translated labels and formatting strings.
- `settings`: renderer and document behavior.

## What You Can Do

- Create, duplicate, archive, trash, and restore multiple CV files.
- Import RenderCV YAML, share packages, and source URLs.
- Edit with forms for common fields or switch to the YAML editor for full control.
- Render a live preview in the browser.
- Export PDF, Typst, JSON, Markdown, YAML bundles, and share files.
- Generate share links, PDF links, review links, and review proposal packages.
- Hide selected entries to fit a CV to a target page count without deleting content.
- Switch themes, fonts, locales, and document settings.
- Manage review sessions, public CV links, backup files, and optional cloud/API sync.
- Use AI editing features when feature flags are enabled.

## Where to Start

New users should begin with [Quick Start](/quick-start/). If you already know RenderCV, jump to [Editing CVs](/editing/) and [Themes and Locales](/themes-and-locales/).

Developers working on the app should read [Architecture](/developers/architecture/), [API Reference](/developers/api-reference/), and [Maintenance Notes](/developers/maintenance-notes/).
