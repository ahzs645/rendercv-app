/**
 * Bidirectional conversion between YAML section keys and display titles.
 *
 * Mirrors the Python `dictionary_key_to_proper_section_title` from RenderCV
 * and provides its inverse for the form editor.
 */

const LOWERCASE_WORDS = new Set([
  'a',
  'and',
  'as',
  'at',
  'but',
  'by',
  'for',
  'from',
  'if',
  'in',
  'into',
  'like',
  'near',
  'nor',
  'of',
  'off',
  'on',
  'onto',
  'or',
  'over',
  'so',
  'than',
  'that',
  'to',
  'upon',
  'when',
  'with',
  'yet'
]);

/** Convert a YAML section key to a proper display title (matches Python exactly). */
export function dictionaryKeyToProperSectionTitle(key: string): string {
  if (/[A-Z]/.test(key) || key.includes(' ')) return key;

  return key
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) =>
      LOWERCASE_WORDS.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(' ');
}

/** Convert a display title to a YAML section key (inverse of the forward function). */
export function properSectionTitleToDictionaryKey(title: string): string {
  const candidate = title.toLowerCase().replace(/\s+/g, '_');
  if (dictionaryKeyToProperSectionTitle(candidate) === title) return candidate;
  return title;
}
