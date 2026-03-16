import type { SectionKey } from '$lib/features/cv-files/types';
import { DEFAULT_MODEL_ID } from '$lib/features/ai-chat/models';

export type ColorMode = 'light' | 'dark' | 'system';

export interface UserPreferences {
  yamlEditor: boolean;
  linksCollapsed: boolean;
  selectedFileId?: string;
  colorMode: ColorMode;
  showArchive: boolean;
  showTrash: boolean;
  activeSection: SectionKey;
  wordWrap: boolean;
  entriesExpanded: boolean;
  selectedModel: string;
}

const DEFAULTS: UserPreferences = {
  yamlEditor: false,
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

class PreferencesState {
  #saveFn: ((prefs: UserPreferences) => void) | undefined;
  #saveQueued = false;

  // Private reactive backing fields
  #yamlEditor = $state(DEFAULTS.yamlEditor);
  #linksCollapsed = $state(DEFAULTS.linksCollapsed);
  #selectedFileId = $state<string | undefined>(DEFAULTS.selectedFileId);
  #colorMode = $state<ColorMode>(DEFAULTS.colorMode);
  #showArchive = $state(DEFAULTS.showArchive);
  #showTrash = $state(DEFAULTS.showTrash);
  #activeSection = $state<SectionKey>(DEFAULTS.activeSection);
  #wordWrap = $state(DEFAULTS.wordWrap);
  #entriesExpanded = $state(DEFAULTS.entriesExpanded);
  #selectedModel = $state(DEFAULTS.selectedModel);

  // Public getter/setter pairs — setter triggers save
  get yamlEditor() {
    return this.#yamlEditor;
  }
  set yamlEditor(v) {
    this.#yamlEditor = v;
    this.#queueSave();
  }

  get linksCollapsed() {
    return this.#linksCollapsed;
  }
  set linksCollapsed(v) {
    this.#linksCollapsed = v;
    this.#queueSave();
  }

  get selectedFileId() {
    return this.#selectedFileId;
  }
  set selectedFileId(v) {
    this.#selectedFileId = v;
    this.#queueSave();
  }

  get colorMode() {
    return this.#colorMode;
  }
  set colorMode(v) {
    this.#colorMode = v;
    this.#queueSave();
  }

  get showArchive() {
    return this.#showArchive;
  }
  set showArchive(v) {
    this.#showArchive = v;
    this.#queueSave();
  }

  get showTrash() {
    return this.#showTrash;
  }
  set showTrash(v) {
    this.#showTrash = v;
    this.#queueSave();
  }

  get activeSection() {
    return this.#activeSection;
  }
  set activeSection(v) {
    this.#activeSection = v;
    this.#queueSave();
  }

  get wordWrap() {
    return this.#wordWrap;
  }
  set wordWrap(v) {
    this.#wordWrap = v;
    this.#queueSave();
  }

  get entriesExpanded() {
    return this.#entriesExpanded;
  }
  set entriesExpanded(v) {
    this.#entriesExpanded = v;
    this.#queueSave();
  }

  get selectedModel() {
    return this.#selectedModel;
  }
  set selectedModel(v) {
    this.#selectedModel = v;
    this.#queueSave();
  }

  /** Merge server data. Writes directly to backing fields — no saves triggered. */
  init(saved: Partial<UserPreferences> | null | undefined) {
    const s = { ...DEFAULTS, ...(saved ?? {}) };
    this.#yamlEditor = s.yamlEditor;
    this.#linksCollapsed = s.linksCollapsed;
    this.#selectedFileId = s.selectedFileId;
    this.#colorMode = s.colorMode;
    this.#showArchive = s.showArchive;
    this.#showTrash = s.showTrash;
    this.#activeSection = s.activeSection;
    this.#wordWrap = s.wordWrap;
    this.#entriesExpanded = s.entriesExpanded;
    this.#selectedModel = s.selectedModel;
  }

  /** Enable auto-saving. Called AFTER init is fully complete. */
  enableAutoSave(saveFn: (prefs: UserPreferences) => void) {
    this.#saveFn = saveFn;
    this.#queueSave(); // persist current state immediately
  }

  disableAutoSave() {
    this.#saveFn = undefined;
  }

  #queueSave() {
    if (!this.#saveFn || this.#saveQueued) return;
    this.#saveQueued = true;
    queueMicrotask(() => {
      this.#saveQueued = false;
      if (!this.#saveFn) return;
      this.#saveFn?.(this.snapshot());
    });
  }

  snapshot(): UserPreferences {
    return {
      yamlEditor: this.#yamlEditor,
      linksCollapsed: this.#linksCollapsed,
      selectedFileId: this.#selectedFileId,
      colorMode: this.#colorMode,
      showArchive: this.#showArchive,
      showTrash: this.#showTrash,
      activeSection: this.#activeSection,
      wordWrap: this.#wordWrap,
      entriesExpanded: this.#entriesExpanded,
      selectedModel: this.#selectedModel
    };
  }
}

export const preferences = new PreferencesState();
