---
title: Quick Start
description: Create your first CV, edit it, preview it, and export a PDF.
---

This guide walks through the shortest path from opening the app to exporting a CV.

## 1. Create a CV

Use **Create new CV** in the sidebar. The app creates a local CV from the bundled default template.

Each CV is stored in your browser. You can create several files for different roles, clients, languages, or variants.

## 2. Choose an Editing Mode

The app has two editing modes:

- **Form editor** for structured editing of common CV fields.
- **YAML editor** for direct access to RenderCV-compatible source files.

Use the editor toggle in the workspace controls to switch between them. Changes update the same underlying CV file.

## 3. Edit Content

Start with the `cv` section. Update the name, location, contact details, and entries. The preview updates after the renderer validates and compiles the content.

Use the section tabs to move between:

- CV content.
- Design.
- Locale.
- Settings.

## 4. Preview

The preview pane renders the current CV. Click content in the preview to jump back to the related editor section when possible.

If the preview shows validation errors, fix the referenced YAML field or form section. See [Troubleshooting](/troubleshooting/) for common error patterns.

## 5. Fit to Page

Open the fit-to-page tool when a CV is slightly too long. It can hide entries temporarily until the rendered page count fits your target.

Hidden entries remain in the source data and can be restored later.

## 6. Export or Share

Use the download menu to export:

- PDF for applications.
- Typst for local editing or inspection.
- JSON or Markdown for downstream tools.
- YAML/share packages for moving work between browsers or collaborators.

Use the share menu to copy:

- A share link.
- A PDF download link.
- A review link.

## Important Limitations

The app runs much of the rendering workflow in the browser. Very large CVs, large imported files, or slow devices can take longer to render. If rendering appears stuck, reload the page and try a smaller change first.
