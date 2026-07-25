---
title: Workspace
description: Understand the main workspace layout, sidebar, editor, toolbar, and preview pane.
---

The workspace has three main areas: the sidebar, the editor, and the preview.

## Sidebar

The sidebar manages local files and app-level actions.

You can:

- Create a new CV.
- Import YAML or supported share files.
- Open PDF import when the feature flag is enabled.
- Select active CVs.
- View archive and trash sections.
- Restore archived or trashed files.
- Download all local CV data as a zip.
- Open AI settings when AI features are configured.
- Restart the onboarding tour.
- Open privacy and terms pages.

The sidebar adapts to narrow widths. In compact modes, labels are reduced and actions rely more on icons and tooltips.

Active CVs are sorted by most recently edited. Archive and Trash groups are collapsible and appear when populated or manually enabled. Active review threads appear under **Resumes in Review**, and resolved sessions appear under **Review Archive**.

## Editor

The editor works on one active section at a time:

- `cv`
- `design`
- `locale`
- `settings`

In form mode, the app presents structured controls for supported fields. In YAML mode, Monaco Editor exposes the raw YAML.

If a shared or review file is locked, editing controls are disabled for that file until you create or open an editable copy.

## Toolbar

The toolbar exposes document actions:

- Toggle sidebar.
- Switch mobile editor/preview panes.
- Undo and redo local changes.
- Toggle form/YAML editing.
- Format YAML in YAML mode.
- Toggle light, dark, or system color mode.
- Open AI editing controls.
- Copy share, review, or PDF links.
- Export PDF, Typst, JSON, Markdown, and share packages.
- Send review proposals from review sessions.

Some actions only appear when a CV is selected and the renderer has enough valid data to produce an output.

On mobile, toolbar actions move into a bottom sheet. The workspace switches between a single editor pane and a single preview pane.

## Preview

The preview pane renders the current CV to SVG pages and can produce PDF or Typst output.

Preview interactions include:

- Zoom controls.
- Mobile editor/preview switching.
- Click-to-editor navigation for mapped CV sections.
- Error surfaces for validation or rendering failures.

## Local File Lifecycle

Files can be active, archived, or trashed.

- **Archive** hides a file from the main working list without deleting it.
- **Trash** marks a file for removal.
- **Restore** moves a file back to the active list.
- **Settings → Data → Download zip** exports active, archived, and trashed CVs.
- **Settings → Data → Empty trash** permanently deletes everything in the trash at once.
- **Settings → Data → Clear all data** erases every CV, review session, custom theme, and preference stored in the browser.
- **Lock** makes a file read-only.
- **Duplicate** copies sections, theme, locale, variants, share origins, source baselines, and hidden entries.
- **Make public and copy link** marks a file public and copies `/{fileId}`.

Use archive for old versions you may need again. Use trash for files you intend to delete.

## Product Tour

The product tour starts automatically for a first selected file after a short delay if onboarding has not been completed. It can also be restarted from the sidebar footer.

Tour steps cover Create & Import, Editor, Section Tabs, Design Tab, AI Assistant when enabled, Live Preview, Share, and Backup & Export. On mobile, the tour opens and closes the sidebar and switches between editor and preview panes when needed.
