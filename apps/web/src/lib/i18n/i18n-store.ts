import { createStore } from '@rendercv/core';
import { UI_LANGUAGE_STORAGE_KEY } from '../storage-keys';
import { isUiLanguage, UI_LANGUAGES, type MessageKey, type UiLanguage } from './messages';

/**
 * Which language the app's own chrome is shown in.
 *
 * Kept separate from the CV's `locale:` section: that one decides how the
 * rendered document reads, this one only decides what the surrounding buttons
 * say. Someone may well write an English CV while preferring a Korean
 * interface, or the reverse.
 *
 * Persisted per device in local storage rather than in `UserPreferences`,
 * since it describes the browser rather than the account.
 */
function detectLanguage(): UiLanguage {
  try {
    const stored = localStorage.getItem(UI_LANGUAGE_STORAGE_KEY);
    if (isUiLanguage(stored)) {
      return stored;
    }
  } catch {
    // Local storage may be unavailable in embedded/private contexts.
  }

  const preferred = typeof navigator === 'undefined' ? [] : (navigator.languages ?? []);
  for (const tag of preferred) {
    const base = tag.split('-')[0]?.toLowerCase();
    if (isUiLanguage(base)) {
      return base;
    }
  }

  return 'en';
}

const store = createStore<UiLanguage>(detectLanguage());

export const i18nStore = {
  getSnapshot: store.getSnapshot,
  subscribe: store.subscribe,
  set(language: UiLanguage) {
    store.setSnapshot(language);
    try {
      localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Preference is in-memory only when storage is unavailable.
    }
    if (typeof document !== 'undefined') {
      // Screen readers and hyphenation both key off this.
      document.documentElement.lang = language;
    }
  }
};

export function translate(language: UiLanguage, key: MessageKey) {
  return UI_LANGUAGES[language].messages[key] ?? UI_LANGUAGES.en.messages[key];
}
