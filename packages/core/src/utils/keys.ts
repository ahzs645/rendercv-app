/**
 * Turn a human-entered label into a YAML-style key.
 *
 * Letters and digits in any script are kept, so a Korean section or variant
 * name survives. An ASCII-only rule would strip every Hangul, Han or Kana
 * character and leave nothing behind, which callers then read as "no name
 * given" — renaming a section to 자기소개서 silently did nothing.
 *
 * Latin input is unaffected: `Work Experience` still becomes `work_experience`.
 */
export function toKeySlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Strip a label down to its letters and digits for loose matching, in any
 * script. Used to line rendered text up with the CV it came from.
 */
export function compactKeyText(value: string) {
  return value.replace(/[^\p{L}\p{N}]+/gu, '');
}
