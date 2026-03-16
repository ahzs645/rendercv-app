function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
}

const STANDARD = ['Regular', 'Bold', 'Italic', 'BoldItalic'];

export const FONT_VARIANTS: Record<string, string[]> = {
  'Open Sans': STANDARD,
  'Gentium Book Plus': STANDARD,
  Lato: STANDARD,
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
  'Noto Sans': [
    'Regular',
    'Bold',
    'Italic',
    'BoldItalic',
    'JP-Regular',
    'JP-Bold',
    'KR-Regular',
    'KR-Bold'
  ],
  'Font Awesome 7': ['Free-Regular-400', 'Free-Solid-900', 'Brands-Regular-400']
};

const FONT_EXTENSIONS: Record<string, string> = {
  'Font Awesome 7': '.otf',
  Fontin: '.otf',
  XCharter: '.otf'
};

export const DEFAULT_FONT_FAMILIES = [
  'Fontin',
  'Font Awesome 7',
  'Source Sans 3',
  'XCharter',
  'Raleway'
];

export function getFontUrl(fontFamily: string, variant: string, baseUrl = '/'): string {
  const folder = encodeURIComponent(fontFamily);
  const extension = FONT_EXTENSIONS[fontFamily] || '.ttf';
  const fontBaseUrl = `${normalizeBaseUrl(baseUrl)}cdn/fonts/`;

  if (fontFamily === 'Font Awesome 7') {
    return `${fontBaseUrl}${folder}/Font Awesome 7 ${variant}${extension}`;
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
