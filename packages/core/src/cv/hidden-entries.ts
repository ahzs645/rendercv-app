import YAML from 'yaml';

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

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value ?? null);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
}

/** Stable, short content hash for a single CV entry (string or object). */
export function entryFingerprint(entry: unknown): string {
  const serialized = stableStringify(entry);
  // FNV-1a 32-bit — fast, deterministic, good enough for de-duplicating entries.
  let hash = 0x811c9dc5;
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Entry lists that live directly under `cv:` instead of inside `cv.sections`.
 * They are hidden the same way section entries are, but their keys carry a
 * `cv:` prefix so they can never collide with a user section that happens to be
 * called "social_networks".
 */
export const TOP_LEVEL_ENTRY_LISTS = ['social_networks', 'custom_connections'] as const;

export type TopLevelEntryList = (typeof TOP_LEVEL_ENTRY_LISTS)[number];

const TOP_LEVEL_PREFIX = 'cv:';

/** Hidden-entry key for one of the top-level `cv:` lists. */
export function topLevelEntryListKey(list: TopLevelEntryList): string {
  return `${TOP_LEVEL_PREFIX}${list}`;
}

/** The top-level list a hidden-entry key addresses, or null for a section key. */
export function topLevelEntryListFromKey(key: string): TopLevelEntryList | null {
  if (!key.startsWith(TOP_LEVEL_PREFIX)) {
    return null;
  }

  const list = key.slice(TOP_LEVEL_PREFIX.length) as TopLevelEntryList;
  return TOP_LEVEL_ENTRY_LISTS.includes(list) ? list : null;
}

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
