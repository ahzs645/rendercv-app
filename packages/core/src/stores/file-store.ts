import type { CvFile, CvFileSections, SectionKey } from '@rendercv/contracts';
import YAML from 'yaml';
import { preferencesStore } from './preferences-store';
import { createStore } from './store';
import { generateId } from '../utils/uuid';
import {
  classicTheme,
  engineeringClassicTheme,
  engineeringResumesTheme,
  moderncvTheme,
  sb2novTheme
} from '../data/rendercv-examples';
import { defaultDesigns, defaultLocales } from '../data/rendercv-variants';

const designDefaults = defaultDesigns as Record<string, string>;
const localeDefaults = defaultLocales as Record<string, string>;

type FileStateSnapshot = {
  files: CvFile[];
  selectedFileId?: string;
  loading: boolean;
  canUndo: boolean;
  canRedo: boolean;
};

type CreateFileOptions = Partial<
  Pick<CvFile, 'cv' | 'settings' | 'designs' | 'locales' | 'selectedTheme' | 'selectedLocale'>
>;

type UndoEntry = {
  fileId: string;
  previous: Record<string, unknown>;
  next: Record<string, unknown>;
  kind: 'content' | 'meta';
  groupKey?: string;
  selectedFileId?: string;
  timestamp: number;
};

type FilePersistence = {
  onCreateFile?: (file: CvFile) => void;
  onDeleteFile?: (id: string) => void;
  onUpdateMeta?: (id: string, patch: Record<string, unknown>) => void;
  onContentChange?: (id: string) => void;
};

const MAX_UNDO_STACK = 50;

const DEFAULT_EXAMPLES = [
  { id: 'default-classic', name: 'CV (Classic)', theme: 'classic', sections: classicTheme },
  {
    id: 'default-engineering-classic',
    name: 'CV (Engineering Classic)',
    theme: 'engineeringclassic',
    sections: engineeringClassicTheme
  },
  {
    id: 'default-engineering-resumes',
    name: 'CV (Engineering Resumes)',
    theme: 'engineeringresumes',
    sections: engineeringResumesTheme
  },
  { id: 'default-moderncv', name: 'CV (Moderncv)', theme: 'moderncv', sections: moderncvTheme },
  { id: 'default-sb2nov', name: 'CV (Sb2nov)', theme: 'sb2nov', sections: sb2novTheme }
] as const;

export const DEFAULT_FILE_IDS = new Set(DEFAULT_EXAMPLES.map((example) => example.id));

function stringifySection<T>(key: keyof CvFileSections, value: T | undefined) {
  if (value === undefined) {
    return undefined;
  }

  return YAML.stringify({ [key]: value });
}

function resolveEmbeddedSections(cvContent: string) {
  if (!cvContent.trim()) {
    return undefined;
  }

  try {
    const parsed = YAML.parse(cvContent);
    if (!parsed || typeof parsed !== 'object' || !('cv' in parsed)) {
      return undefined;
    }

    const document = parsed as {
      cv: unknown;
      design?: unknown;
      locale?: unknown;
      settings?: unknown;
    };

    if (document.design === undefined && document.locale === undefined && document.settings === undefined) {
      return undefined;
    }

    return {
      cv: stringifySection('cv', document.cv),
      design: stringifySection('design', document.design),
      locale: stringifySection('locale', document.locale),
      settings: stringifySection('settings', document.settings)
    };
  } catch {
    return undefined;
  }
}

function readThemeName(designContent: string | undefined) {
  if (!designContent?.trim()) {
    return undefined;
  }

  try {
    const parsed = YAML.parse(designContent);
    if (
      parsed &&
      typeof parsed === 'object' &&
      'design' in parsed &&
      parsed.design &&
      typeof parsed.design === 'object' &&
      'theme' in parsed.design &&
      typeof parsed.design.theme === 'string'
    ) {
      return parsed.design.theme;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function readLocaleName(localeContent: string | undefined) {
  if (!localeContent?.trim()) {
    return undefined;
  }

  try {
    const parsed = YAML.parse(localeContent);
    if (
      parsed &&
      typeof parsed === 'object' &&
      'locale' in parsed &&
      parsed.locale &&
      typeof parsed.locale === 'object' &&
      'language' in parsed.locale &&
      typeof parsed.locale.language === 'string'
    ) {
      return parsed.locale.language;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function normalizeHydratedFile(file: Omit<CvFile, 'isReadOnly'>): Omit<CvFile, 'isReadOnly'> {
  const embeddedSections = resolveEmbeddedSections(file.cv ?? '');
  if (!embeddedSections) {
    return file;
  }

  const embeddedTheme = readThemeName(embeddedSections.design);
  const embeddedLocale = readLocaleName(embeddedSections.locale);

  return {
    ...file,
    cv: embeddedSections.cv ?? file.cv,
    settings: embeddedSections.settings ?? file.settings,
    designs:
      embeddedTheme && embeddedSections.design
        ? { ...file.designs, [embeddedTheme]: embeddedSections.design }
        : file.designs,
    locales:
      embeddedLocale && embeddedSections.locale
        ? { ...file.locales, [embeddedLocale]: embeddedSections.locale }
        : file.locales,
    selectedTheme:
      file.selectedTheme in file.designs
        ? file.selectedTheme
        : embeddedTheme ?? file.selectedTheme,
    selectedLocale:
      file.selectedLocale in file.locales
        ? file.selectedLocale
        : embeddedLocale ?? file.selectedLocale
  };
}

function withReadOnly(file: Omit<CvFile, 'isReadOnly'>): CvFile {
  Object.defineProperty(file, 'isReadOnly', {
    get() {
      return this.isLocked || this.isArchived || this.isTrashed;
    },
    enumerable: true,
    configurable: true
  });

  return file as CvFile;
}

function createDefaultFiles(): CvFile[] {
  const timestamp = Date.now();
  return DEFAULT_EXAMPLES.map((example) =>
    withReadOnly({
      id: generateId(),
      name: example.name,
      cv: example.sections.cv,
      settings: example.sections.settings,
      designs: { [example.theme]: example.sections.design },
      locales: { english: example.sections.locale },
      selectedTheme: example.theme,
      selectedLocale: 'english',
      isLocked: false,
      isArchived: false,
      isTrashed: false,
      isPublic: false,
      chatMessages: [],
      editCount: 0,
      lastEdited: timestamp
    })
  );
}

export function resolveFileSections(file: CvFile): CvFileSections {
  const embeddedSections = resolveEmbeddedSections(file.cv ?? '');

  return {
    cv: embeddedSections?.cv ?? file.cv ?? '',
    design:
      embeddedSections?.design ??
      file.designs[file.selectedTheme] ??
      designDefaults[file.selectedTheme] ??
      `design:\n  theme: ${file.selectedTheme}`,
    locale:
      embeddedSections?.locale ??
      file.locales[file.selectedLocale] ??
      localeDefaults[file.selectedLocale] ??
      `locale:\n  language: ${file.selectedLocale}`,
    settings: embeddedSections?.settings ?? file.settings ?? ''
  };
}

export class FileStore {
  readonly #store = createStore<FileStateSnapshot>({
    files: createDefaultFiles(),
    selectedFileId: undefined,
    loading: false,
    canUndo: false,
    canRedo: false
  });
  #undoStack: UndoEntry[] = [];
  #redoStack: UndoEntry[] = [];
  persistence: FilePersistence | undefined;

  constructor() {
    const firstFile = this.activeFiles[0];
    if (firstFile) {
      this.#store.update((current) => ({ ...current, selectedFileId: firstFile.id }));
    }
  }

  getSnapshot() {
    return this.#store.getSnapshot();
  }

  subscribe(listener: () => void) {
    return this.#store.subscribe(listener);
  }

  get files() {
    return this.#store.getSnapshot().files;
  }

  get selectedFileId() {
    return this.#store.getSnapshot().selectedFileId;
  }

  get selectedFile() {
    return this.files.find((file) => file.id === this.selectedFileId);
  }

  get sections() {
    return this.selectedFile ? resolveFileSections(this.selectedFile) : emptySections();
  }

  get activeFiles() {
    return this.files
      .filter((file) => !file.isArchived && !file.isTrashed)
      .sort((left, right) => right.lastEdited - left.lastEdited);
  }

  get archivedFiles() {
    return this.files
      .filter((file) => file.isArchived && !file.isTrashed)
      .sort((left, right) => right.lastEdited - left.lastEdited);
  }

  get trashedFiles() {
    return this.files
      .filter((file) => file.isTrashed)
      .sort((left, right) => right.lastEdited - left.lastEdited);
  }

  hydrate(files: Omit<CvFile, 'isReadOnly'>[]) {
    this.#undoStack = [];
    this.#redoStack = [];
    const nextFiles = files.map((file) =>
      withReadOnly({
        ...normalizeHydratedFile(file),
        chatMessages: file.chatMessages ?? [],
        editCount: file.editCount ?? 0
      })
    );
    const preferredSelectedFileId = preferencesStore.getSnapshot().selectedFileId;
    const currentSelectedFileId = this.#store.getSnapshot().selectedFileId;
    const selectedFileId =
      nextFiles.find((file) => file.id === preferredSelectedFileId)?.id ??
      nextFiles.find((file) => file.id === currentSelectedFileId)?.id ??
      nextFiles.find((file) => !file.isArchived && !file.isTrashed)?.id ??
      nextFiles[0]?.id;
    this.#store.setSnapshot({
      files: nextFiles,
      selectedFileId,
      loading: false,
      canUndo: false,
      canRedo: false
    });
    preferencesStore.patch({ selectedFileId });
  }

  loadDefaults() {
    const files = createDefaultFiles();
    const selectedFileId = files[0]?.id;
    this.#store.setSnapshot({
      files,
      selectedFileId,
      loading: false,
      canUndo: false,
      canRedo: false
    });
    preferencesStore.patch({ selectedFileId });
  }

  createFile(name?: string, options?: CreateFileOptions) {
    const file = withReadOnly({
      id: generateId(),
      name: name ?? `CV ${this.activeFiles.length + 1}`,
      cv: options?.cv ?? classicTheme.cv,
      settings: options?.settings ?? classicTheme.settings,
      designs:
        options?.designs && Object.keys(options.designs).length > 0
          ? { ...options.designs }
          : { classic: classicTheme.design },
      locales:
        options?.locales && Object.keys(options.locales).length > 0
          ? { ...options.locales }
          : { english: classicTheme.locale },
      selectedTheme: options?.selectedTheme ?? 'classic',
      selectedLocale: options?.selectedLocale ?? 'english',
      isLocked: false,
      isArchived: false,
      isTrashed: false,
      isPublic: false,
      chatMessages: [],
      editCount: 0,
      lastEdited: Date.now()
    });

    this.#store.update((current) => ({
      ...current,
      files: [...current.files, file],
      selectedFileId: file.id
    }));
    preferencesStore.patch({ selectedFileId: file.id });
    this.persistence?.onCreateFile?.(file);
    return file;
  }

  selectFile(id: string) {
    this.#store.update((current) => ({ ...current, selectedFileId: id }));
    preferencesStore.patch({ selectedFileId: id });
  }

  updateSection(section: SectionKey, content: string) {
    const selectedFile = this.selectedFile;
    if (!selectedFile || selectedFile.isReadOnly) {
      return;
    }

    const previous: Record<string, unknown> = { lastEdited: selectedFile.lastEdited };
    const next: Record<string, unknown> = { lastEdited: Date.now() };

    switch (section) {
      case 'cv':
        if ((selectedFile.cv ?? '') === content) {
          return;
        }
        previous.cv = selectedFile.cv ?? '';
        next.cv = content;
        break;
      case 'design': {
        const currentDesign = selectedFile.designs[selectedFile.selectedTheme] ?? '';
        if (currentDesign === content) {
          return;
        }
        previous.designs = selectedFile.designs;
        next.designs = { ...selectedFile.designs, [selectedFile.selectedTheme]: content };
        break;
      }
      case 'locale': {
        const currentLocale = selectedFile.locales[selectedFile.selectedLocale] ?? '';
        if (currentLocale === content) {
          return;
        }
        previous.locales = selectedFile.locales;
        next.locales = { ...selectedFile.locales, [selectedFile.selectedLocale]: content };
        break;
      }
      case 'settings':
        if ((selectedFile.settings ?? '') === content) {
          return;
        }
        previous.settings = selectedFile.settings ?? '';
        next.settings = content;
        break;
    }

    this.#pushUndoEntry({
      fileId: selectedFile.id,
      previous,
      next,
      kind: 'content',
      groupKey: `content:${selectedFile.id}:${section}`,
      selectedFileId: this.selectedFileId,
      timestamp: Date.now()
    });
    this.#applyPatch(selectedFile.id, next, 'content', this.selectedFileId);
  }

  renameFile(id: string, name: string) {
    this.#updateMeta(id, { name });
  }

  setTheme(id: string, selectedTheme: string) {
    this.#updateMeta(id, { selectedTheme });
  }

  addDesignVariant(id: string, themeKey: string, design: string) {
    const file = this.files.find((current) => current.id === id);
    if (!file) {
      return;
    }

    this.#updateMeta(id, {
      designs: { ...file.designs, [themeKey]: design },
      selectedTheme: themeKey
    });
  }

  setLocale(id: string, selectedLocale: string) {
    this.#updateMeta(id, { selectedLocale });
  }

  archiveFile(id: string) {
    this.#updateMeta(id, { isArchived: true });
  }

  restoreFromArchive(id: string) {
    this.#updateMeta(id, { isArchived: false });
  }

  trashFile(id: string) {
    this.#updateMeta(id, { isTrashed: true });
  }

  restoreFile(id: string) {
    this.#updateMeta(id, { isTrashed: false });
  }

  lockFile(id: string) {
    this.#updateMeta(id, { isLocked: true });
  }

  unlockFile(id: string) {
    this.#updateMeta(id, { isLocked: false });
  }

  makePublic(id: string) {
    this.#updateMeta(id, { isPublic: true });
  }

  makePrivate(id: string) {
    this.#updateMeta(id, { isPublic: false });
  }

  deleteFile(id: string) {
    this.#store.update((current) => {
      const files = current.files.filter((file) => file.id !== id);
      const selectedFileId =
        current.selectedFileId === id ? files.find((file) => !file.isArchived && !file.isTrashed)?.id : current.selectedFileId;
      preferencesStore.patch({ selectedFileId });
      return { ...current, files, selectedFileId };
    });
    this.persistence?.onDeleteFile?.(id);
  }

  duplicateFile(id: string) {
    const file = this.files.find((current) => current.id === id);
    if (!file) {
      return undefined;
    }

    const sections = resolveFileSections(file);
    const baseName = file.name.replace(/ \d+$/, '');
    let suffix = 2;
    while (this.activeFiles.some((current) => current.name === `${baseName} ${suffix}`)) {
      suffix += 1;
    }

    return this.createFile(`${baseName} ${suffix}`, {
      cv: sections.cv,
      settings: sections.settings,
      designs: { ...file.designs },
      locales: { ...file.locales },
      selectedTheme: file.selectedTheme,
      selectedLocale: file.selectedLocale
    });
  }

  setChatMessages(id: string, chatMessages: unknown[]) {
    this.#store.update((current) => ({
      ...current,
      files: current.files.map((file) =>
        file.id === id ? withReadOnly({ ...(file as Omit<CvFile, 'isReadOnly'>), chatMessages }) : file
      )
    }));
    this.persistence?.onContentChange?.(id);
  }

  undo() {
    const entry = this.#undoStack.pop();
    if (!entry) {
      return false;
    }

    this.#redoStack.push(entry);
    this.#applyPatch(entry.fileId, entry.previous, entry.kind, entry.selectedFileId);
    this.#syncHistoryState();
    return true;
  }

  redo() {
    const entry = this.#redoStack.pop();
    if (!entry) {
      return false;
    }

    this.#undoStack.push(entry);
    this.#applyPatch(entry.fileId, entry.next, entry.kind, entry.selectedFileId);
    this.#syncHistoryState();
    return true;
  }

  #updateMeta(id: string, patch: Record<string, unknown>) {
    const file = this.files.find((current) => current.id === id);
    if (!file) {
      return;
    }

    const previous = Object.fromEntries(
      Object.keys(patch).map((key) => [key, (file as unknown as Record<string, unknown>)[key]])
    );
    this.#pushUndoEntry({
      fileId: id,
      previous,
      next: patch,
      kind: 'meta',
      selectedFileId: this.selectedFileId,
      timestamp: Date.now()
    });
    this.#applyPatch(id, patch, 'meta', this.selectedFileId);
  }

  #pushUndoEntry(entry: UndoEntry) {
    const previousEntry = this.#undoStack.at(-1);
    const shouldCoalesce =
      entry.kind === 'content' &&
      previousEntry?.kind === 'content' &&
      previousEntry.fileId === entry.fileId &&
      previousEntry.groupKey === entry.groupKey &&
      entry.timestamp - previousEntry.timestamp < 850;

    if (shouldCoalesce && previousEntry) {
      previousEntry.next = entry.next;
      previousEntry.timestamp = entry.timestamp;
      previousEntry.selectedFileId = entry.selectedFileId;
    } else {
      this.#undoStack.push(entry);
      if (this.#undoStack.length > MAX_UNDO_STACK) {
        this.#undoStack.splice(0, this.#undoStack.length - MAX_UNDO_STACK);
      }
    }

    this.#redoStack = [];
    this.#syncHistoryState();
  }

  #syncHistoryState() {
    this.#store.update((current) => ({
      ...current,
      canUndo: this.#undoStack.length > 0,
      canRedo: this.#redoStack.length > 0
    }));
  }

  #applyPatch(
    id: string,
    patch: Record<string, unknown>,
    kind: 'content' | 'meta',
    selectedFileId?: string
  ) {
    this.#store.update((current) => ({
      ...current,
      selectedFileId: selectedFileId ?? current.selectedFileId,
      files: current.files.map((file) => {
        if (file.id !== id) {
          return file;
        }

        return withReadOnly({ ...(file as Omit<CvFile, 'isReadOnly'>), ...patch });
      })
    }));
    if (selectedFileId) {
      preferencesStore.patch({ selectedFileId });
    }

    if (kind === 'content') {
      this.persistence?.onContentChange?.(id);
    } else {
      this.persistence?.onUpdateMeta?.(id, patch);
    }
  }
}

function emptySections(): CvFileSections {
  return {
    cv: '',
    design: '',
    locale: '',
    settings: ''
  };
}

export const fileStore = new FileStore();
