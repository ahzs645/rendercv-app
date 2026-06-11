---
title: Editing CVs
description: Use form editing, YAML editing, validation, and section tabs effectively.
---

RenderCV App stores every CV as a set of YAML sections. The form editor and YAML editor are two views over the same data.

## Form Editor

Use the form editor when you want guided controls for common CV content.

The form editor is best for:

- Updating personal information.
- Adding and reordering section entries.
- Editing highlights and bullet lists.
- Hiding entries.
- Working without memorizing YAML syntax.
- Seeing highlighted changed fields in review copies.

Form sections map back to rendered preview sections where possible.

The CV form includes personal information, social networks, custom connections, and section editing. Sections can be reordered, renamed, deleted, or created from presets. Empty sections ask for an entry type before the first entry is added.

## YAML Editor

Use YAML mode when you need exact RenderCV control.

YAML mode is best for:

- Advanced RenderCV fields.
- Bulk edits.
- Copying content from an existing RenderCV project.
- Debugging validation errors.
- Editing `design`, `locale`, and `settings` directly.

The YAML editor uses Monaco Editor and supports text search, reveal-on-preview-click, and formatting actions.

YAML mode is the default preference. Monaco uses YAML syntax highlighting, word wrap, automatic layout, and a theme that follows the app color mode.

## Section Tabs

Each CV file contains separate source sections.

### `cv`

Main resume content: identity, contact details, links, education, experience, projects, publications, skills, custom sections, and entries.

### `design`

Theme selection and visual options. This controls layout, fonts, spacing, page size, and theme-specific settings.

### `locale`

Labels and localized strings. Use this for non-English documents or to change text like month names and section labels.

### `settings`

Renderer behavior and document-level options. Use this only when you need advanced output control.

## Validation

The renderer validates YAML before compiling the preview. Validation errors usually include:

- A message.
- The source YAML section.
- The field path when available.
- The input value that failed.

Fix the earliest structural error first. Later errors are often caused by the first malformed field.

If form mode cannot parse the active YAML, the app shows a parse warning and asks you to switch back to YAML mode to fix the source.

## Undo and Redo

Undo and redo operate on app-level file changes. The app avoids intercepting editor-native undo when an input, text area, menu, dialog, or Monaco editor is focused.

## Working Safely

For large changes:

1. Duplicate the CV.
2. Make edits on the copy.
3. Preview and export.
4. Archive the older version once the copy is confirmed.

This is especially useful for role-specific CV variants.

## Read-Only States

Locked, archived, trashed, public-review, and some shared files can be read-only. In read-only state, the editor is dimmed and form controls, buttons, and selectors are disabled.
