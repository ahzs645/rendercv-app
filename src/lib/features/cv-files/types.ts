export const SECTION_KEYS = ['cv', 'design', 'locale', 'settings'] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export const SECTION_LABELS: Record<SectionKey, string> = {
  cv: 'CV',
  design: 'Design',
  locale: 'Locale',
  settings: 'Settings'
};

/** Flat 4-string format used by editor, viewer, and pyodide worker. */
export interface CvFileSections {
  cv: string;
  design: string;
  locale: string;
  settings: string;
}

/** Storage format: sparse per-theme designs and per-locale locales. */
export interface CvFile {
  id: string;
  templateId?: string;
  name: string;
  cv: string | null;
  settings: string | null;
  designs: Record<string, string>;
  locales: Record<string, string>;
  selectedTheme: string;
  selectedLocale: string;
  isLocked: boolean;
  isArchived: boolean;
  isTrashed: boolean;
  isPublic: boolean;
  chatMessages: unknown[];
  editCount: number;
  lastEdited: number;
  readonly isReadOnly: boolean;
}
