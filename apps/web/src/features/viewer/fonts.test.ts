import { describe, expect, it } from 'vitest';
import {
  CJK_FALLBACK_FONT_FAMILY,
  containsCjkText,
  FONT_VARIANTS,
  getFontUrls,
  parseRequestedFontFamilies
} from './fonts';

describe('font requests in rendered Typst', () => {
  it('reads a single family and every family in a fallback array', () => {
    const families = parseRequestedFontFamilies(
      [
        '  typography-font-family-body: "Source Sans 3",',
        '  typography-font-family-name: ("Raleway", "Noto Sans KR"),',
        '  #set text(font: "XCharter")'
      ].join('\n')
    );

    expect(families).toEqual(new Set(['Source Sans 3', 'Raleway', 'Noto Sans KR', 'XCharter']));
  });

  it('requests the CJK family for CJK text even when no theme names it', () => {
    const latin = parseRequestedFontFamilies('typography-font-family-body: "Raleway",\n= John Doe');
    expect(latin.has(CJK_FALLBACK_FONT_FAMILY)).toBe(false);

    const korean = parseRequestedFontFamilies('typography-font-family-body: "Raleway",\n= 김윤서');
    expect(korean.has(CJK_FALLBACK_FONT_FAMILY)).toBe(true);
  });

  it('detects Hangul, Han and Kana but not Latin', () => {
    expect(containsCjkText('김윤서')).toBe(true);
    expect(containsCjkText('金允誓')).toBe(true);
    expect(containsCjkText('あア')).toBe(true);
    expect(containsCjkText('Yunseo Kim')).toBe(false);
  });

  it('resolves the CJK family to the files that ship with the app', () => {
    expect(FONT_VARIANTS[CJK_FALLBACK_FONT_FAMILY]).toEqual(['Regular', 'Bold']);
    expect(getFontUrls(CJK_FALLBACK_FONT_FAMILY, '/')).toEqual([
      '/cdn/fonts/Noto%2520Sans%2520KR/NotoSansKR-Regular.otf',
      '/cdn/fonts/Noto%2520Sans%2520KR/NotoSansKR-Bold.otf'
    ]);
  });
});
