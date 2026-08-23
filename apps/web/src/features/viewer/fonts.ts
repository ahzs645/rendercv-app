function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
}

function encodeStaticFontFolder(fontFamily: string) {
  // The font directories in /static are already percent-encoded on disk.
  return encodeURIComponent(encodeURIComponent(fontFamily));
}

const STANDARD = ['Regular', 'Bold', 'Italic', 'BoldItalic'];

export const FONT_VARIANTS: Record<string, string[]> = {
  Carlito: STANDARD,
  'Open Sans': STANDARD,
  'Gentium Book Plus': STANDARD,
  Lato: [
    'Hairline',
    'HairlineItalic',
    'Light',
    'LightItalic',
    ...STANDARD,
    'Black',
    'BlackItalic'
  ],
  'Source Sans 3': STANDARD,
  'EB Garamond': STANDARD,
  'Open Sauce Sans': STANDARD,
  Roboto: STANDARD,
  Ubuntu: STANDARD,
  Poppins: STANDARD,
  Raleway: STANDARD,
  XCharter: STANDARD,
  Mukta: ['Regular', 'Bold'],
  Fontin: ['Regular', 'Bold', 'Italic'],
  'Noto Sans': STANDARD,
  'Noto Sans KR': ['Regular', 'Bold'],
  'Font Awesome 7': ['Free-Regular-400', 'Free-Solid-900', 'Brands-Regular-400']
};

const FONT_EXTENSIONS: Record<string, string> = {
  'Font Awesome 7': '.otf',
  Fontin: '.otf',
  XCharter: '.otf',
  'Noto Sans KR': '.otf'
};

/**
 * Family Typst falls back to for CJK text.
 *
 * None of the Latin families the themes ship carry Hangul, Han or Kana, so
 * without a fallback those characters render as blanks. Noto Sans KR's subset
 * covers all three, which is enough for a Korean CV that also prints a hanja
 * name.
 */
export const CJK_FALLBACK_FONT_FAMILY = 'Noto Sans KR';

const CJK_PATTERN =
  /[ᄀ-ᇿ⺀-⿟぀-ヿ㄰-㆏ㇰ-ㇿ㐀-䶿一-鿿ꥠ-꥿가-퟿豈-﫿]/u;

export function containsCjkText(text: string) {
  return CJK_PATTERN.test(text);
}

/**
 * Families a rendered Typst document asks for.
 *
 * A font value is either a single family or a Typst array of fallbacks, e.g.
 * `font: ("Source Sans 3", "Noto Sans KR")`. When the document contains CJK
 * text the CJK family is always included: Typst falls back to any loaded font
 * for glyphs the selected families lack, so it has to be in the compiler even
 * if no theme names it.
 */
export function parseRequestedFontFamilies(typstContent: string) {
  const requested = new Set<string>();

  // Parameter names are hyphenated, e.g. `typography-font-family-section-titles`.
  for (const [, value] of typstContent.matchAll(
    /(?:font-family-[\w-]+|font)\s*:\s*(\([^()]*\)|"[^"]*")/g
  )) {
    for (const [, family] of value.matchAll(/"([^"]+)"/g)) {
      requested.add(family);
    }
  }

  if (containsCjkText(typstContent)) {
    requested.add(CJK_FALLBACK_FONT_FAMILY);
  }

  return requested;
}

export const DEFAULT_FONT_FAMILIES = [
  'Fontin',
  'Font Awesome 7',
  'Source Sans 3',
  'XCharter',
  'Raleway'
];

export function getFontUrl(fontFamily: string, variant: string, baseUrl = '/'): string {
  const folder = encodeStaticFontFolder(fontFamily);
  const extension = FONT_EXTENSIONS[fontFamily] || '.ttf';
  const fontBaseUrl = `${normalizeBaseUrl(baseUrl)}cdn/fonts/`;

  if (fontFamily === 'Font Awesome 7') {
    const fileName = encodeURIComponent(`Font Awesome 7 ${variant}${extension}`);
    return `${fontBaseUrl}${folder}/${fileName}`;
  }

  const fileBase = fontFamily.replace(/\s+/g, '');
  return `${fontBaseUrl}${folder}/${fileBase}-${variant}${extension}`;
}

export function getFontUrls(fontFamily: string, baseUrl = '/'): string[] {
  const variants = FONT_VARIANTS[fontFamily];
  if (!variants) return [];
  return variants.map((variant) => getFontUrl(fontFamily, variant, baseUrl));
}

export function getDefaultFontUrls(baseUrl = '/'): string[] {
  return DEFAULT_FONT_FAMILIES.flatMap((family) => getFontUrls(family, baseUrl));
}
