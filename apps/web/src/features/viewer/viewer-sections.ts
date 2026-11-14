import type { CvFile, CvFileSections, CvVariantDefinition } from '@rendercv/contracts';
import {
  filterDisabledSectionsFromCvYaml,
  filterFlagHiddenEntriesFromCvYaml,
  filterHiddenEntriesFromCvYaml,
  resolveFileSections
} from '@rendercv/core';
import { compileRenderCvSections } from '@rendercv/primitives';
import YAML from 'yaml';

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
    const parsed = YAML.parse(designContent);
    if (!parsed || typeof parsed !== 'object' || !('design' in parsed)) {
      return designContent;
    }

    const root = parsed as Record<string, unknown> & { design?: Record<string, unknown> };
    if (!root.design || typeof root.design !== 'object') {
      return designContent;
    }

    const design = { ...root.design };
    let changed = false;

    if (typeof design.font_size === 'string') {
      const typography =
        design.typography && typeof design.typography === 'object'
          ? { ...(design.typography as Record<string, unknown>) }
          : {};
      const fontSize =
        typography.font_size && typeof typography.font_size === 'object'
          ? { ...(typography.font_size as Record<string, unknown>) }
          : {};

      if (fontSize.body !== design.font_size) {
        fontSize.body = design.font_size;
      }

      typography.font_size = fontSize;
      design.typography = typography;
      delete design.font_size;
      changed = true;
    }

    if (typeof design.page_size === 'string') {
      const page =
        design.page && typeof design.page === 'object'
          ? { ...(design.page as Record<string, unknown>) }
          : {};

      if (page.size !== design.page_size) {
        page.size = design.page_size;
      }

      design.page = page;
      delete design.page_size;
      changed = true;
    }

    if (!changed) {
      return designContent;
    }

    return YAML.stringify({
      ...root,
      design
    });
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
