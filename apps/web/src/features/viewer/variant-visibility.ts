import type { CvVariantDefinition } from '@rendercv/contracts';
import { entryFingerprint, TOP_LEVEL_ENTRY_LISTS, topLevelEntryListKey } from '@rendercv/core';

/**
 * Variant-driven visibility, shared between the renderer and the form editor.
 *
 * The renderer (normalize-compat-cv) uses {@link matchesEntryVariant} to decide
 * which entries reach the PDF. The form editor uses {@link computeVariantVisibility}
 * to mirror those same decisions in the interface, so the user can see what the
 * selected variant is hiding without rendering the PDF. Keeping the predicate in
 * one place guarantees the form and the PDF never disagree.
 */

export const ARCHIVED_TAG = 'archived';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Whether a single entry survives the active variant's tag rules.
 *
 * - `archived`-tagged entries are dropped unless the variant explicitly selects
 *   the `archived` tag (this applies even when no variant is active).
 * - When a variant is active, `itags` (inverse tags) drop an entry if the variant
 *   selects any of them, and `tags` require the variant to select at least one.
 */
export function matchesEntryVariant(
  entry: UnknownRecord,
  selectedTags: string[],
  variantActive: boolean
): boolean {
  const requiredTags = normalizeStringList(entry.tags);
  if (requiredTags.includes(ARCHIVED_TAG) && !selectedTags.includes(ARCHIVED_TAG)) {
    return false;
  }

  if (!variantActive) {
    return true;
  }

  const inverseTags = normalizeStringList(entry.itags);
  if (inverseTags.length > 0 && inverseTags.some((tag) => selectedTags.includes(tag))) {
    return false;
  }

  if (requiredTags.length > 0 && !requiredTags.some((tag) => selectedTags.includes(tag))) {
    return false;
  }

  return true;
}

function isArchivedEntry(entry: UnknownRecord, selectedTags: string[]): boolean {
  return (
    normalizeStringList(entry.tags).includes(ARCHIVED_TAG) && !selectedTags.includes(ARCHIVED_TAG)
  );
}

export interface VariantVisibility {
  /** Section keys the variant removes entirely (`exclude_sections`). */
  excludedSections: Set<string>;
  /** Per-section entry fingerprints the variant drops from the PDF (tags/itags/archived). */
  hiddenEntries: Record<string, Set<string>>;
  /** Subset of hiddenEntries that are dropped specifically because they are `archived`. */
  archivedEntries: Record<string, Set<string>>;
}

/**
 * Compute which sections/entries the selected variant hides from the PDF, keyed
 * the same way the form identifies them (section key + entry fingerprint).
 *
 * `cvRoot` is the parsed `cv:` mapping (the form's rootValue). When `variant` is
 * null/undefined, only the always-on `archived` rule applies.
 */
export function computeVariantVisibility(
  cvRoot: unknown,
  variant: CvVariantDefinition | null | undefined
): VariantVisibility {
  const variantActive = Boolean(variant);
  const selectedTags = normalizeStringList(variant?.tags);
  const excludedSections = new Set(
    variantActive ? normalizeStringList(variant?.exclude_sections) : []
  );
  // App-authored per-entry exclusions for this variant, keyed by section.
  const excludeEntries = variant?.exclude_entries ?? {};
  const hiddenEntries: Record<string, Set<string>> = {};
  const archivedEntries: Record<string, Set<string>> = {};

  function collect(key: string, entries: unknown) {
    if (!Array.isArray(entries)) {
      return;
    }

    const listExcluded = new Set(excludeEntries[key] ?? []);
    for (const entry of entries) {
      const fingerprint = entryFingerprint(entry);
      // Text entries are plain strings: they carry no tags, so only the
      // app-authored per-entry exclusions can hide them. They still need to be
      // reflected here, otherwise the editor shows them as visible while the
      // PDF (which filters by fingerprint) drops them.
      if (!isRecord(entry)) {
        if (listExcluded.has(fingerprint)) {
          (hiddenEntries[key] ??= new Set()).add(fingerprint);
        }
        continue;
      }

      const droppedByTags = !matchesEntryVariant(entry, selectedTags, variantActive);
      const droppedByApp = listExcluded.has(fingerprint);
      if (!droppedByTags && !droppedByApp) {
        continue;
      }

      (hiddenEntries[key] ??= new Set()).add(fingerprint);
      if (isArchivedEntry(entry, selectedTags)) {
        (archivedEntries[key] ??= new Set()).add(fingerprint);
      }
    }
  }

  const sections = isRecord(cvRoot) ? cvRoot.sections : undefined;
  if (isRecord(sections)) {
    for (const [sectionKey, entries] of Object.entries(sections)) {
      if (excludedSections.has(sectionKey)) {
        continue;
      }

      collect(sectionKey, entries);
    }
  }

  // Social networks and custom connections sit on the CV root rather than in
  // `sections`, but a variant hides them exactly the same way.
  if (isRecord(cvRoot)) {
    for (const list of TOP_LEVEL_ENTRY_LISTS) {
      collect(topLevelEntryListKey(list), cvRoot[list]);
    }
  }

  return { excludedSections, hiddenEntries, archivedEntries };
}
