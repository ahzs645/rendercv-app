import type { SectionKey } from './cv';

export type ColorMode = 'light' | 'dark' | 'system';

export interface UserPreferences {
  yamlEditor: boolean;
  aiEditorOpen: boolean;
  linksCollapsed: boolean;
  themeLibrary: Record<string, string>;
  selectedFileId?: string;
  colorMode: ColorMode;
  showArchive: boolean;
  showTrash: boolean;
  activeSection: SectionKey;
  wordWrap: boolean;
  entriesExpanded: boolean;
  selectedModel: string;
}
