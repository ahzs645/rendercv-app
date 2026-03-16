import type { UserPreferences } from '@rendercv/contracts';
import { createStore } from './store';

export const DEFAULT_MODEL_ID = 'gpt-5-mini';

export const DEFAULT_PREFERENCES: UserPreferences = {
  yamlEditor: true,
  aiEditorOpen: false,
  linksCollapsed: false,
  selectedFileId: undefined,
  colorMode: 'system',
  showArchive: false,
  showTrash: false,
  activeSection: 'cv',
  wordWrap: true,
  entriesExpanded: true,
  selectedModel: DEFAULT_MODEL_ID
};

export class PreferencesStore {
  readonly #store = createStore<UserPreferences>(DEFAULT_PREFERENCES);

  getSnapshot() {
    return this.#store.getSnapshot();
  }

  subscribe(listener: () => void) {
    return this.#store.subscribe(listener);
  }

  hydrate(preferences: Partial<UserPreferences> | null | undefined) {
    this.#store.setSnapshot({ ...DEFAULT_PREFERENCES, ...(preferences ?? {}) });
  }

  patch(patch: Partial<UserPreferences>) {
    this.#store.update((current) => ({ ...current, ...patch }));
  }
}

export const preferencesStore = new PreferencesStore();
