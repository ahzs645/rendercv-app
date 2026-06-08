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

export interface CvVariantDefinition {
  description?: string;
  exclude_sections?: string[];
  tags?: string[];
  flavors?: string[];
}

export type CvVariants = Record<string, CvVariantDefinition>;

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
  variants?: CvVariants;
  selectedVariant?: string;
  isLocked: boolean;
  isArchived: boolean;
  isTrashed: boolean;
  isPublic: boolean;
  chatMessages: unknown[];
  editCount: number;
  lastEdited: number;
  /** Snapshot of the original sections when this file was imported from a share link. */
  sharedOrigin?: CvFileSections;
  /**
   * Entries hidden from rendering/export without deleting them from the CV.
   * Keyed by CV section key; values are stable fingerprints of the hidden
   * entries (see `entryFingerprint`). The editor always shows the full CV.
   */
  hiddenEntries?: Record<string, string[]>;
  readonly isReadOnly: boolean;
}
