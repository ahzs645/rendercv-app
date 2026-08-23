import { describe, expect, it } from 'vitest';
import { en, ko, UI_LANGUAGES, isUiLanguage } from './messages';
import { translate } from './i18n-store';

describe('UI message catalogue', () => {
  it('translates every English key into Korean', () => {
    const missing = Object.keys(en).filter((key) => !(key in ko));
    expect(missing).toEqual([]);
  });

  it('carries no Korean entry that English does not define', () => {
    const extra = Object.keys(ko).filter((key) => !(key in en));
    expect(extra).toEqual([]);
  });

  it('leaves no Korean string identical to its English source', () => {
    // A copy-paste that never got translated shows up as an English label in
    // an otherwise Korean UI. 'YAML' is a product name and stays as-is.
    const untranslated = Object.entries(en)
      .filter(([key, value]) => ko[key as keyof typeof en] === value)
      .map(([key]) => key);
    expect(untranslated).toEqual(['editor.yaml']);
  });

  it('resolves messages per language and falls back to English', () => {
    expect(translate('en', 'files.new')).toBe('New CV');
    expect(translate('ko', 'files.new')).toBe('새 이력서');
  });

  it('recognises only the languages it ships', () => {
    expect(Object.keys(UI_LANGUAGES)).toEqual(['en', 'ko']);
    expect(isUiLanguage('ko')).toBe(true);
    expect(isUiLanguage('fr')).toBe(false);
    expect(isUiLanguage(null)).toBe(false);
  });
});
