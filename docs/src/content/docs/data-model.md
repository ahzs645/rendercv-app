---
title: Data Model
description: Understand files, sections, variants, hidden entries, review sessions, and local persistence.
---

The app data model is intentionally close to RenderCV source files.

## CV File

A CV file contains:

- File identity and name.
- Last edited timestamp.
- Current selected section.
- RenderCV source sections.
- Optional selected theme and locale.
- Optional variants.
- Hidden-entry state.
- Share or review origin metadata.
- Lifecycle flags such as archived, trashed, or locked.
- Chat messages when AI features are enabled.
- Public-link state.

## Sections

The canonical source sections are:

- `cv`
- `design`
- `locale`
- `settings`

These can be imported, edited, exported, and rendered together.

## Variants

Variants allow alternate CV content or filtering strategies from the same broad source. Use variants for role-specific or audience-specific versions when the core CV remains related.

For completely different languages or career tracks, separate files may be easier to manage.

## Hidden Entries

Hidden entries are stored separately from the original CV content. This lets the app render a shorter version without deleting source entries.

Hidden-entry state is most commonly produced by fit-to-page workflows.

Hidden entries are tracked by stable entry fingerprints. Rendering filters those fingerprints from the effective CV while leaving the source YAML intact.

## Preferences

Preferences include UI and workspace state such as:

- Active source section.
- Form vs YAML editor mode.
- Color mode.
- Archive/trash visibility.
- Onboarding state.
- Selected AI model and provider.
- Bring-your-own-key provider keys.
- Preview dark-mode adaptation.

Default preferences enable YAML editor mode, system color mode, preview dark adaptation, word wrap, expanded entries, selected model `gpt-5-mini`, and the managed AI provider.

## Review Sessions

Review sessions connect an origin CV with one or more proposals.

They track:

- Session ID.
- Linked file.
- Proposal IDs.
- Active proposal.
- Merge draft.
- Status.

## Persistence

The app stores browser-local data through client-side stores. Clearing browser storage can remove local CV data unless you exported a backup.

Local storage keys include `rendercv_guest_files`, `rendercv_preferences`, `rendercv_review_sessions`, and `rendercv.aiEditorOpenByFile.v1` for enhanced AI panel state.
