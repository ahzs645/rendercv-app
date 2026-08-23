import { useCallback } from 'react';
import { useStore } from '../use-store';
import { i18nStore, translate } from './i18n-store';
import type { MessageKey } from './messages';

/**
 * `const { t } = useTranslation()` then `t('files.new')`.
 *
 * Keys are checked against the English catalogue at compile time, so a typo or
 * a removed message is a type error rather than a blank label.
 */
export function useTranslation() {
  const language = useStore(i18nStore);
  const t = useCallback((key: MessageKey) => translate(language, key), [language]);
  return { t, language, setLanguage: i18nStore.set };
}
