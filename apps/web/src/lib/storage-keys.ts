/**
 * Every browser storage key the workspace owns. Settings → Data clears this
 * list wholesale, so anything persisted client-side belongs here.
 */
export const FILE_STORAGE_KEY = 'rendercv_guest_files';
export const PREFERENCE_STORAGE_KEY = 'rendercv_preferences';
export const REVIEW_STORAGE_KEY = 'rendercv_review_sessions';
export const ENHANCED_AI_CHAT_OPEN_STORAGE_KEY = 'rendercv.aiEditorOpenByFile.v1';

/** Holds the pyodide package cache plus imported custom themes. */
export const PYODIDE_CACHE_DB_NAME = 'pyodide-pkg-cache';

export const LOCAL_STORAGE_KEYS = [
  FILE_STORAGE_KEY,
  PREFERENCE_STORAGE_KEY,
  REVIEW_STORAGE_KEY,
  ENHANCED_AI_CHAT_OPEN_STORAGE_KEY,
  // Legacy font caches from older builds.
  'loadedFonts',
  'loadedFontFamilies'
] as const;
