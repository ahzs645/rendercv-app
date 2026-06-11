---
title: Troubleshooting
description: Fix validation errors, rendering failures, import issues, and sharing problems.
---

Use this page when the app does not render or export as expected.

## YAML Syntax Error

Symptoms:

- Preview fails immediately.
- Error mentions parsing, indentation, or unexpected characters.

Fix:

1. Check indentation.
2. Confirm lists use `-`.
3. Quote strings that contain special YAML characters.
4. Undo the last edit and reapply it in smaller steps.

## Schema Validation Error

Symptoms:

- YAML parses, but RenderCV rejects a field.
- Error includes a field path or source section.

Fix:

1. Open the section named in the error.
2. Check the referenced field.
3. Compare the shape to a working default CV.
4. Fix the earliest error first.

## Theme Not Found

Symptoms:

- Error references a missing custom theme.
- Preview falls back or fails after import.

Fix:

1. Open `design`.
2. Check the `theme` value.
3. Select a bundled theme.
4. Re-import a share package if it was supposed to include theme data.

## Preview Is Slow

Likely causes:

- First render of the session.
- Runtime assets loading.
- Large CV content.
- Many fit-to-page render attempts.

Fix:

1. Wait for the first render to complete.
2. Reload the page.
3. Reduce rapid edits.
4. Test with a smaller CV.

## Export Fails

Fix:

1. Confirm preview renders.
2. Try PDF again after a reload.
3. Export Typst to inspect generated source.
4. Check browser console logs in development builds.

## Share Link Is Too Large

Encoded links can exceed browser or messaging limits.

Fix:

- Export a share file instead.
- Use a review proposal package for collaborator edits.
- Remove unnecessary embedded data.

## Imported PDF Looks Wrong

PDF import is lossy. Check names, dates, bullets, and section grouping manually.

Fix:

1. Import into a new file.
2. Correct the extracted content.
3. Preview and export.
4. Keep the original PDF for reference.

## Local Data Missing

Likely causes:

- Browser data was cleared.
- You changed browser profiles.
- You opened a different deployment origin.
- Private browsing discarded state.

Fix:

- Import a previous share file or zip backup.
- Reopen a share link if one exists.
