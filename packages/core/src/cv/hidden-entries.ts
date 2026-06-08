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

  if (!isPlainObject(parsed) || !isPlainObject(parsed.cv) || !isPlainObject(parsed.cv.sections)) {
    return cvYaml;
  }

  const sections = parsed.cv.sections as Record<string, unknown>;
  let changed = false;

  for (const [sectionKey, fingerprints] of Object.entries(hidden)) {
    if (fingerprints.length === 0) continue;
    const entries = sections[sectionKey];
    if (!Array.isArray(entries)) continue;

    const hiddenSet = new Set(fingerprints);
    const kept = entries.filter((entry) => !hiddenSet.has(entryFingerprint(entry)));
    if (kept.length !== entries.length) {
      sections[sectionKey] = kept;
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
