const FONT_BASE_URL = '/rendercv-app/cdn/fonts/';

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

export function getFontUrl(fontFamily: string, variant: string): string {
  const folder = encodeURIComponent(fontFamily);
  const extension = FONT_EXTENSIONS[fontFamily] || '.ttf';

  if (fontFamily === 'Font Awesome 7') {
    return `${FONT_BASE_URL}${folder}/Font Awesome 7 ${variant}${extension}`;
  }

  const fileBase = fontFamily.replace(/\s+/g, '');
  return `${FONT_BASE_URL}${folder}/${fileBase}-${variant}${extension}`;
}

export function getFontUrls(fontFamily: string): string[] {
  const variants = FONT_VARIANTS[fontFamily];
  if (!variants) return [];
  return variants.map((variant) => getFontUrl(fontFamily, variant));
}

export function getDefaultFontUrls(): string[] {
  return DEFAULT_FONT_FAMILIES.flatMap((family) => getFontUrls(family));
}
