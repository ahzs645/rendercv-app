---
title: Themes and Locales
description: Change visual themes, fonts, locale strings, and compatibility settings.
---

Themes and locales are controlled by the `design` and `locale` sections.

## Built-In Themes

The app ships bundled themes and theme previews. Built-in themes can be selected without installing anything else.

Default examples include Classic, Ember, Engineering Classic, Engineering Resumes, Harvard, Ink, Moderncv, Opal, and Sb2nov.

Theme selection is stored in `design`. If a shared CV references a theme that is not built in, the app may register the supplied design or fall back to a compatibility theme when possible.

## Theme Library

Use the theme library to browse available themes and apply one to the active CV.

Changing themes updates visual presentation, not the underlying `cv` content.

The theme library renders first-page thumbnails for available themes using the current CV content. Bundled custom importable themes include `ahmadstyle`, `tylerstyle`, `phdjakes`, `phddeedy`, and `phdresearch`.

## Design YAML

Design YAML controls:

- Theme name.
- Page size.
- Font settings.
- Spacing.
- Section heading style.
- Entry layout.
- Theme-specific options.

Some imported older RenderCV design files use legacy keys. The app attempts compatibility normalization for known legacy shapes.

## Fonts

The renderer uses bundled font assets for predictable browser output. Font availability depends on the theme and the static assets included with the app.

If a font appears wrong:

1. Check the active theme.
2. Confirm the design YAML references a bundled font.
3. Re-render after a reload to rule out a worker asset load issue.

## Locale YAML

Locale YAML controls translated strings and labels. Use it to localize:

- Month and date formatting labels.
- Section or field labels.
- Document language-specific text.

Create separate CV files for materially different languages if the content itself changes, not only the labels.

The shared core data currently includes default locale YAML for 20 locales.

## Compatibility Imports

When importing existing RenderCV files, the app may normalize older CV or design structures. Compatibility helpers try to preserve intent while matching the current in-app renderer expectations.

Always preview and export after importing a legacy CV.
