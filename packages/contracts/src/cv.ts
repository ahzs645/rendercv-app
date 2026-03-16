export const SECTION_KEYS = ['cv', 'design', 'locale', 'settings'] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export const SECTION_LABELS: Record<SectionKey, string> = {
  cv: 'CV',
  design: 'Design',
  locale: 'Locale',
  settings: 'Settings'
};

export interface CvFileSections {
  cv: string;
  design: string;
  locale: string;
  settings: string;
}

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
