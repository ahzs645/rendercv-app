import { describe, expect, it } from 'vitest';
import { visibleThemeKeys } from './variants';

describe('shared theme choices', () => {
  const keys = ['classic', 'phdjakes', 'carolynstyle', 'classicserif'];
  it('offers the shared layout without duplicate aliases', () => {
    expect(visibleThemeKeys(keys)).toEqual(['classic', 'classicserif']);
  });
  it('keeps the selected legacy theme visible and leaves custom libraries alone', () => {
    expect(visibleThemeKeys(keys, 'phdjakes')).toEqual(['classic', 'phdjakes', 'classicserif']);
    expect(visibleThemeKeys(['phdjakes'])).toEqual(['phdjakes']);
  });
});
