import { describe, expect, it } from 'vitest';
import { isCurrentThemeCache } from './theme-cache';

describe('bundled theme cache upgrades', () => {
  it('discards old bundles even when restored through a different theme in the shared archive', () => {
    expect(isCurrentThemeCache('bundled-old.zip:theme-normalization-v2', ['bundled-new.zip'], 'theme-normalization-v2')).toBe(false);
    expect(isCurrentThemeCache('bundled-new.zip:theme-normalization-v2', ['bundled-new.zip'], 'theme-normalization-v2')).toBe(true);
    expect(isCurrentThemeCache('bundled-new.zip:theme-normalization-v1', ['bundled-new.zip'], 'theme-normalization-v2')).toBe(false);
  });
  it('preserves user uploaded archives', () => {
    expect(isCurrentThemeCache('my-theme.zip', ['bundled-new.zip'], 'theme-normalization-v2')).toBe(true);
  });
});
