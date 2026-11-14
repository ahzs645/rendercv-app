import type { CvFile, CvFileSections, CvVariantDefinition } from '@rendercv/contracts';
import {
  filterDisabledSectionsFromCvYaml,
  filterFlagHiddenEntriesFromCvYaml,
  filterHiddenEntriesFromCvYaml,
  CV_YAML_STRINGIFY_OPTIONS,
  resolveFileSections,
  stringifyCvYaml
} from '@rendercv/core';
import { compileRenderCvSections } from '@rendercv/primitives';
import YAML, { isMap } from 'yaml';

const LEGACY_DESIGN_KEY_PATTERN =
  /^\s*(font_size|page_size|keep_sections_together|keep_entries_together|prevent_orphaned_headers|section_heading_size)\s*:/m;

function looksLikeLegacyDesignSchema(design: string) {
  return LEGACY_DESIGN_KEY_PATTERN.test(design);
}

export function normalizeLegacyDesignYaml(designContent: string | undefined) {
  if (!designContent?.trim() || !looksLikeLegacyDesignSchema(designContent)) {
    return designContent;
  }

  try {
    // Edit the YAML as a document so comments and the rest of the formatting
    // survive; re-serialising the parsed value dropped every comment.
    const document = YAML.parseDocument(designContent);
    if (document.errors.length > 0 || !isMap(document.get('design', true))) {
      return designContent;
    }

    // Move a legacy flat key to its nested place, replacing anything in the
    // way that is not a mapping (the old code did the same with plain objects).
    const move = (from: string, to: [string, string, ...string[]]) => {
      const value = document.getIn(['design', from]);
      if (typeof value !== 'string') return false;
      for (let depth = 2; depth < to.length; depth += 1) {
        const path = ['design', ...to.slice(0, depth - 1)];
        const node = document.getIn(path, true);
        if (node !== undefined && !isMap(node)) document.deleteIn(path);
      }
      document.setIn(['design', ...to], value);
      document.deleteIn(['design', from]);
      return true;
    };

    const changedFontSize = move('font_size', ['typography', 'font_size', 'body']);
    const changedPageSize = move('page_size', ['page', 'size']);
    if (!changedFontSize && !changedPageSize) {
      return designContent;
    }

    return document.toString(CV_YAML_STRINGIFY_OPTIONS);
  } catch {
    return designContent;
  }
}

/**
 * Whether a rewrite of the user's YAML changes what it says, not just how it is
 * written. Rewriting through a YAML parser drops comments and reformats blanks,
 * so an automatic repair must not save a text that only differs that way.
 */
export function changesYamlData(before: string, after: string) {
  if (before === after) {
    return false;
  }
  try {
    return JSON.stringify(YAML.parse(before)) !== JSON.stringify(YAML.parse(after));
  } catch {
    return true;
  }
}

/**
 * The result of an automatic rewrite of the user's YAML, as text to save: the
 * original text when the rewrite didn't change the data (so comments and line
 * breaks survive), otherwise the new data written without folding long lines.
 */
export function keepTextUnlessChanged(before: string, after: string) {
  if (!changesYamlData(before, after)) {
    return before;
  }
  try {
    return stringifyCvYaml(YAML.parse(after));
  } catch {
    return after;
  }
}

export function resolveViewerSections(file: CvFile): CvFileSections {
  const sections = resolveFileSections(file);
  const variant =
    file.selectedVariant && file.variants?.[file.selectedVariant]
      ? file.variants[file.selectedVariant]
      : undefined;

  // Drop disabled sections and hidden entries before the CV reaches the
  // renderer. The editor keeps the full CV (resolveFileSections).
  // Variant-authored per-entry exclusions (`exclude_entries`) are applied here
  // too, so the PDF matches what the form reflects for the active variant.
  const visibleSections: CvFileSections = {
    ...sections,
    cv: filterHiddenEntriesFromCvYaml(
      filterHiddenEntriesFromCvYaml(
        filterDisabledSectionsFromCvYaml(sections.cv, file.disabledSections),
        file.hiddenEntries
      ),
      variant?.exclude_entries
    )
  };

  return prepareViewerSections(visibleSections, variant);
}

export function prepareViewerSections(
  sections: CvFileSections,
  variant?: CvVariantDefinition | null
): CvFileSections {
  const design = normalizeLegacyDesignYaml(sections.design) ?? sections.design;
  // Entries the author marked `show: false` stay in the YAML but never render
  // or export.
  const cv = filterFlagHiddenEntriesFromCvYaml(sections.cv);
  try {
    return compileRenderCvSections({
      sections: { ...sections, cv, design },
      variant: variant ?? undefined
    }).sections;
  } catch {
    // The compiler throws on YAML it can't shape (e.g. a `cv:` that is not a
    // mapping while it is being retyped). This runs during render, so letting
    // it escape took the whole app down, and because the text is already
    // saved, every reload crashed again. Hand the sections on unchanged: the
    // renderer reports them as a normal, fixable validation error.
    return { ...sections, cv, design };
  }
}

function sectionEntries(cvYaml: string | undefined, sectionKey: string): unknown[] | undefined {
  if (!cvYaml) return undefined;
  try {
    const parsed = YAML.parse(cvYaml) as { cv?: { sections?: Record<string, unknown> } } | null;
    const entries = parsed?.cv?.sections?.[sectionKey];
    return Array.isArray(entries) ? entries : undefined;
  } catch {
    return undefined;
  }
}

function comparableEntry(entry: unknown) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return JSON.stringify(entry);
  }
  const { show: _show, showing: _showing, ...rest } = entry as Record<string, unknown>;
  return JSON.stringify(rest);
}

/**
 * Translate the index of an entry in the rendered CV to its index in the
 * editor's full CV. Hidden entries (`show: false`, hidden fingerprints,
 * variant exclusions) are removed before rendering, so a click on the preview
 * reports a position in the shorter list. Entries are matched in order; when
 * they can't be matched the index is returned unchanged.
 */
export function mapRenderedEntryIndexToSource(
  sourceCv: string | undefined,
  renderedCv: string | undefined,
  sectionKey: string,
  renderedIndex: number
) {
  if (renderedIndex < 0) return renderedIndex;
  const source = sectionEntries(sourceCv, sectionKey);
  const rendered = sectionEntries(renderedCv, sectionKey);
  if (!source || !rendered || source.length === rendered.length) return renderedIndex;

  let next = 0;
  for (let index = 0; index < source.length && next < rendered.length; index += 1) {
    if (comparableEntry(source[index]) !== comparableEntry(rendered[next])) continue;
    if (next === renderedIndex) return index;
    next += 1;
  }
  return renderedIndex;
}
