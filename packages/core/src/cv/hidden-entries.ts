import YAML from 'yaml';
import {
  entryFingerprint,
  topLevelEntryListFromKey
} from '@rendercv/primitives';

export {
  entryFingerprint,
  TOP_LEVEL_ENTRY_LISTS,
  topLevelEntryListFromKey,
  topLevelEntryListKey,
  type TopLevelEntryList
} from '@rendercv/primitives';

/**
 * Non-destructive entry hiding.
 *
 * The editor always works with the full CV. To hide an entry from the rendered
 * PDF/export without deleting it, we record a stable *fingerprint* of the entry
 * (keyed by section) and filter those entries out only when building the
 * sections handed to the renderer.
 *
 * Fingerprints are derived from entry content, so they survive section/entry
 * reordering. Editing an entry changes its fingerprint, which simply makes it
 * visible again — a safe default (we never silently hide edited content).
 */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Entry lists that live directly under `cv:` instead of inside `cv.sections`.
 * They are hidden the same way section entries are, but their keys carry a
 * `cv:` prefix so they can never collide with a user section that happens to be
 * called "social_networks".
 */
function hasHidden(hidden: Record<string, string[]> | undefined): hidden is Record<string, string[]> {
  return Boolean(hidden && Object.values(hidden).some((list) => list.length > 0));
}

/**
 * Remove hidden entries from a CV YAML string. Returns the input unchanged when
 * there is nothing to hide or the YAML can't be parsed.
 */
export function filterHiddenEntriesFromCvYaml(
  cvYaml: string,
  hidden: Record<string, string[]> | undefined
): string {
  if (!cvYaml || !hasHidden(hidden)) {
    return cvYaml;
  }

  let parsed: unknown;
  try {
    parsed = YAML.parse(cvYaml);
  } catch {
    return cvYaml;
  }

  if (!isPlainObject(parsed) || !isPlainObject(parsed.cv)) {
    return cvYaml;
  }

  const cv = parsed.cv as Record<string, unknown>;
  const sections = isPlainObject(cv.sections) ? (cv.sections as Record<string, unknown>) : null;
  let changed = false;

  for (const [key, fingerprints] of Object.entries(hidden)) {
    if (fingerprints.length === 0) continue;

    // `cv:social_networks` addresses a list on the CV root; anything else is a
    // section key.
    const topLevelList = topLevelEntryListFromKey(key);
    const container = topLevelList ? cv : sections;
    const containerKey = topLevelList ?? key;
    if (!container) continue;

    const entries = container[containerKey];
    if (!Array.isArray(entries)) continue;

    const hiddenSet = new Set(fingerprints);
    const kept = entries.filter((entry) => !hiddenSet.has(entryFingerprint(entry)));
    if (kept.length !== entries.length) {
      // When hiding empties the list, drop the key entirely so the renderer
      // doesn't emit a bare section header with no content beneath it.
      if (kept.length === 0) {
        delete container[containerKey];
      } else {
        container[containerKey] = kept;
      }
      changed = true;
    }
  }

  if (!changed) {
    return cvYaml;
  }

  return YAML.stringify(parsed);
}

/**
 * Remove sections that have no entries from a CV YAML string, so the renderer
 * never emits a bare section header with nothing under it (e.g. after fitting
 * hides every entry, or for sections the author left empty). Returns the input
 * unchanged when there is nothing empty or the YAML can't be parsed.
 */
export function stripEmptySectionsFromCvYaml(cvYaml: string): string {
  if (!cvYaml) {
    return cvYaml;
  }

  let parsed: unknown;
  try {
    parsed = YAML.parse(cvYaml);
  } catch {
    return cvYaml;
  }

  if (!isPlainObject(parsed) || !isPlainObject(parsed.cv) || !isPlainObject(parsed.cv.sections)) {
    return cvYaml;
  }

  const sections = parsed.cv.sections as Record<string, unknown>;
  let changed = false;

  for (const [sectionKey, entries] of Object.entries(sections)) {
    if (Array.isArray(entries) && entries.length === 0) {
      delete sections[sectionKey];
      changed = true;
    }
  }

  if (!changed) {
    return cvYaml;
  }

  return YAML.stringify(parsed);
}

/**
 * Remove whole disabled sections from a CV YAML string. Returns the input
 * unchanged when there is nothing disabled or the YAML can't be parsed.
 *
 * Unlike `filterHiddenEntriesFromCvYaml`, this drops sections by key (not by
 * entry fingerprint), so a disabled section stays disabled while its entries
 * are edited.
 */
export function filterDisabledSectionsFromCvYaml(
  cvYaml: string,
  disabledSections: string[] | undefined
): string {
  if (!cvYaml || !disabledSections || disabledSections.length === 0) {
    return cvYaml;
  }

  let parsed: unknown;
  try {
    parsed = YAML.parse(cvYaml);
  } catch {
    return cvYaml;
  }

  if (!isPlainObject(parsed) || !isPlainObject(parsed.cv) || !isPlainObject(parsed.cv.sections)) {
    return cvYaml;
  }

  const sections = parsed.cv.sections as Record<string, unknown>;
  let changed = false;

  for (const sectionKey of disabledSections) {
    if (sectionKey in sections) {
      delete sections[sectionKey];
      changed = true;
    }
  }

  if (!changed) {
    return cvYaml;
  }

  return YAML.stringify(parsed);
}

/** Count how many entries the given hidden map actually hides. */
export function countHiddenEntries(hidden: Record<string, string[]> | undefined): number {
  if (!hidden) return 0;
  return Object.values(hidden).reduce((sum, list) => sum + list.length, 0);
}

/**
 * Keys an author can put on an entry (or a nested position) to keep it in the
 * YAML but out of the rendered CV. `show: false` is the documented form;
 * `showing: false` is accepted because hand-written CVs use it too.
 */
export const ENTRY_VISIBILITY_KEYS = ['show', 'showing'] as const;

const FALSE_LIKE = new Set(['false', 'no', 'off', '0']);

function isFalseLike(value: unknown) {
  if (value === false || value === 0) return true;
  return typeof value === 'string' && FALSE_LIKE.has(value.trim().toLowerCase());
}

/** True when an entry opts out of rendering with `show: false`. */
export function isEntryHiddenByFlag(entry: unknown): boolean {
  if (!isPlainObject(entry)) return false;
  return ENTRY_VISIBILITY_KEYS.some((key) => key in entry && isFalseLike(entry[key]));
}

function withoutVisibilityKeys(entry: Record<string, unknown>) {
  const next = { ...entry };
  for (const key of ENTRY_VISIBILITY_KEYS) delete next[key];
  return next;
}

/**
 * Remove entries marked `show: false` (and nested `positions` marked so) from a
 * CV YAML string, and drop the visibility keys from the entries that remain so
 * the renderer never sees them. A section left empty is removed. Returns the
 * input unchanged when nothing uses the flag or the YAML can't be parsed.
 */
export function filterFlagHiddenEntriesFromCvYaml(cvYaml: string): string {
  if (!cvYaml || !/^\s*(?:-\s+)?(?:show|showing)\s*:/m.test(cvYaml)) {
    return cvYaml;
  }

  let parsed: unknown;
  try {
    parsed = YAML.parse(cvYaml);
  } catch {
    return cvYaml;
  }

  if (!isPlainObject(parsed) || !isPlainObject(parsed.cv) || !isPlainObject(parsed.cv.sections)) {
    return cvYaml;
  }

  const sections = parsed.cv.sections as Record<string, unknown>;
  let changed = false;

  const usesFlag = (entry: Record<string, unknown>) => ENTRY_VISIBILITY_KEYS.some((key) => key in entry);

  for (const [sectionKey, entries] of Object.entries(sections)) {
    if (!Array.isArray(entries)) continue;

    const kept: unknown[] = [];
    for (const entry of entries) {
      if (!isPlainObject(entry)) {
        kept.push(entry);
        continue;
      }
      if (isEntryHiddenByFlag(entry)) {
        changed = true;
        continue;
      }

      let next = entry;
      if (usesFlag(next)) {
        next = withoutVisibilityKeys(next);
        changed = true;
      }
      if (Array.isArray(next.positions)) {
        const positions = next.positions.filter((position) => !isEntryHiddenByFlag(position));
        const cleaned = positions.map((position) =>
          isPlainObject(position) && usesFlag(position) ? withoutVisibilityKeys(position) : position
        );
        if (positions.length !== next.positions.length || cleaned.some((p, i) => p !== positions[i])) {
          changed = true;
          if (positions.length === 0) continue; // every position hidden: hide the employer too
          next = { ...next, positions: cleaned };
        }
      }
      kept.push(next);
    }

    if (kept.length !== entries.length || kept.some((entry, index) => entry !== entries[index])) {
      changed = true;
      if (kept.length === 0) {
        delete sections[sectionKey];
      } else {
        sections[sectionKey] = kept;
      }
    }
  }

  return changed ? YAML.stringify(parsed) : cvYaml;
}
