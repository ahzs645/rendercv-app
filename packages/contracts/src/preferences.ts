import type { SectionKey } from './cv';

export type ColorMode = 'light' | 'dark' | 'system';

export type AiProviderId = 'managed' | 'openai' | 'anthropic';

export interface AiApiKeys {
  openai?: string;
  anthropic?: string;
}

export interface UserPreferences {
  yamlEditor: boolean;
  aiEditorOpen: boolean;
  linksCollapsed: boolean;
  themeLibrary: Record<string, string>;
  selectedFileId?: string;
  reviewDisplayName?: string;
  colorMode: ColorMode;
  previewDarkMode: boolean;
  showArchive: boolean;
  showTrash: boolean;
  activeSection: SectionKey;
  wordWrap: boolean;
  entriesExpanded: boolean;
  /** Hide `archived`-tagged entries from the form editor (they are always excluded from the PDF). */
  hideArchivedEntries: boolean;
  selectedModel: string;
  onboardingCompletedAt?: string | null;
  aiProvider: AiProviderId;
  aiApiKeys: AiApiKeys;
}
