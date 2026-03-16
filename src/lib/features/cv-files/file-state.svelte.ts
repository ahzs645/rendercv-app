import type { CvFile, CvFileSections, SectionKey } from './types';
import { preferences } from '$lib/features/preferences/pref-state.svelte';
import { defaultDesigns, defaultLocales } from 'virtual:rendercv-variants';
import { generateId } from '$lib/utils/uuid';
import {
  classicTheme,
  engineeringClassicTheme,
  engineeringResumesTheme,
  moderncvTheme,
  sb2novTheme
} from 'virtual:rendercv-examples';

/** Resolve a CvFile's active theme/locale into the flat render format. */
export function resolveFileSections(file: CvFile): CvFileSections {
  const defaults = DEFAULT_CONTENT_BY_ID[file.templateId ?? ''];
  return {
    cv: file.cv ?? defaults?.cv ?? '',
    design:
      file.designs[file.selectedTheme] ??
      defaultDesigns[file.selectedTheme] ??
      `design:\n  theme: ${file.selectedTheme}`,
    locale:
      file.locales[file.selectedLocale] ??
      defaultLocales[file.selectedLocale] ??
      `locale:\n  language: ${file.selectedLocale}`,
    settings: file.settings ?? defaults?.settings ?? ''
  };
}

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
];

/** Set of deterministic default file IDs — used to detect defaults at DB boundary. */
export const DEFAULT_FILE_IDS = new Set(DEFAULT_EXAMPLES.map((ex) => ex.id));

/** Map of default file IDs to their build-time example content. */
export const DEFAULT_CONTENT_BY_ID = Object.fromEntries(
  DEFAULT_EXAMPLES.map((ex) => [ex.id, { cv: ex.sections.cv, settings: ex.sections.settings }])
) as Record<string, { cv: string; settings: string }>;

function makeDefaultFiles(): CvFile[] {
  const now = Date.now();
  return DEFAULT_EXAMPLES.map((ex) =>
    withReadOnly({
      id: generateId(),
      name: ex.name,
      cv: ex.sections.cv,
      settings: ex.sections.settings,
      designs: { [ex.theme]: ex.sections.design },
      locales: { english: ex.sections.locale },
      selectedTheme: ex.theme,
      selectedLocale: 'english',
      isLocked: false,
      isArchived: false,
      isTrashed: false,
      isPublic: false,
      chatMessages: [],
      editCount: 0,
      lastEdited: now
    })
  );
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

const MAX_UNDO_STACK = 50;

type CreateFileOpts = Partial<
  Pick<CvFile, 'cv' | 'settings' | 'designs' | 'locales' | 'selectedTheme' | 'selectedLocale'>
>;

type UndoEntry = {
  fileId: string;
  prev: Record<string, unknown>;
  next: Record<string, unknown>;
  selectedFileId?: string;
};

type RedoEntry = UndoEntry & {
  redoSelectedFileId?: string;
};

export class FileState {
  files = $state<CvFile[]>([]);
  #selectedFileId = $state<string | undefined>();
  generation = $state(0);

  get selectedFileId() {
    return this.#selectedFileId;
  }
  set selectedFileId(v: string | undefined) {
    this.#selectedFileId = v;
    preferences.selectedFileId = v; // auto-sync → triggers save if enabled
  }
  loading = $state(true);
  persistence:
    | {
        onCreateFile?: (file: CvFile) => void;
        onDeleteFile?: (id: string) => void;
        onUpdateMeta?: (id: string, updates: Record<string, unknown>) => void;
        onContentChange?: (id: string) => void;
      }
    | undefined;

  #undoStack: UndoEntry[] = [];
  #redoStack: RedoEntry[] = [];
  #lastEditedTimer: ReturnType<typeof setTimeout> | undefined;

  readonly selectedFile = $derived(this.files.find((f) => f.id === this.selectedFileId));
  readonly selectedFileReadOnly = $derived(this.selectedFile?.isReadOnly);
  readonly sections = $derived(
    this.selectedFile
      ? resolveFileSections(this.selectedFile)
      : { cv: '', design: '', locale: '', settings: '' }
  );
  readonly activeFiles = $derived(
    this.files
      .filter((f) => !f.isTrashed && !f.isArchived)
      .sort((a, b) => b.lastEdited - a.lastEdited)
  );
  readonly archivedFiles = $derived(
    this.files
      .filter((f) => f.isArchived && !f.isTrashed)
      .sort((a, b) => b.lastEdited - a.lastEdited)
  );
  readonly trashedFiles = $derived(
    this.files.filter((f) => f.isTrashed).sort((a, b) => b.lastEdited - a.lastEdited)
  );

  loadDefaults() {
    this.persistence = undefined;
    this.#undoStack = [];
    this.#redoStack = [];
    this.files = makeDefaultFiles();
    this.selectedFileId = this.files[0]?.id;
    this.generation++;
  }

  loadFiles(files: Omit<CvFile, 'isReadOnly'>[]) {
    this.#undoStack = [];
    this.#redoStack = [];
    this.files = files.map((f) =>
      withReadOnly({ ...f, chatMessages: f.chatMessages ?? [], editCount: f.editCount ?? 0 })
    );
    this.selectedFileId = this.activeFiles[0]?.id;
    this.generation++;
  }

  createFile(name?: string, opts?: CreateFileOpts) {
    const file = withReadOnly({
      id: generateId(),
      name: name ?? `CV ${this.activeFiles.length + 1}`,
      cv: opts?.cv ?? classicTheme.cv,
      settings: opts?.settings ?? classicTheme.settings,
      designs:
        Object.keys(opts?.designs ?? {}).length > 0
          ? { ...opts?.designs }
          : { classic: classicTheme.design },
      locales:
        Object.keys(opts?.locales ?? {}).length > 0
          ? { ...opts?.locales }
          : { english: classicTheme.locale },
      selectedTheme: opts?.selectedTheme ?? 'classic',
      selectedLocale: opts?.selectedLocale ?? 'english',
      isLocked: false,
      isArchived: false,
      isTrashed: false,
      isPublic: false,
      chatMessages: [],
      editCount: 0,
      lastEdited: Date.now()
    });
    this.files = [...this.files, file];
    this.selectedFileId = file.id;
    this.persistence?.onCreateFile?.(file);
    return file;
  }

  selectFile(id: string) {
    this.selectedFileId = id;
    this.ensureValidSelection();
  }

  setSectionContent(section: SectionKey, content: string) {
    if (!this.selectedFile || this.selectedFileReadOnly) return;
    const file = this.selectedFile;

    switch (section) {
      case 'cv':
        file.cv = content;
        break;
      case 'settings':
        file.settings = content;
        break;
      case 'design':
        file.designs[file.selectedTheme] = content;
        break;
      case 'locale':
        file.locales[file.selectedLocale] = content;
        break;
    }

    // Move to top immediately on first edit; file already at top won't re-trigger FLIP
    if (this.activeFiles[0]?.id !== file.id) {
      file.lastEdited = Date.now();
    }
    // Keep lastEdited accurate after a pause (file is already at top so no re-animation)
    clearTimeout(this.#lastEditedTimer);
    this.#lastEditedTimer = setTimeout(() => {
      file.lastEdited = Date.now();
    }, 500);

    this.persistence?.onContentChange?.(file.id);
  }

  setTheme(id: string, theme: string) {
    this.#doUndoable(id, { selectedTheme: theme });
  }

  setLocale(id: string, locale: string) {
    this.#doUndoable(id, { selectedLocale: locale });
  }

  renameFile(id: string, name: string) {
    this.#doUndoable(id, { name });
  }

  deleteFile(id: string) {
    const file = this.files.find((f) => f.id === id);
    const list = file?.isTrashed
      ? this.trashedFiles
      : file?.isArchived
        ? this.archivedFiles
        : this.activeFiles;
    const neighbor =
      this.selectedFileId === id ? this.#findPositionalNeighbor(id, list) : undefined;
    this.#pruneHistoryForDeletedFile(id);
    this.files = this.files.filter((f) => f.id !== id);
    if (this.selectedFileId === id) this.selectedFileId = neighbor;
    this.ensureValidSelection();
    this.persistence?.onDeleteFile?.(id);
  }

  trashFile(id: string) {
    const neighbor =
      this.selectedFileId === id ? this.#findPositionalNeighbor(id, this.activeFiles) : undefined;
    this.#doUndoable(id, { isTrashed: true });
    if (this.selectedFileId === id) this.selectedFileId = neighbor;
    this.ensureValidSelection();
  }

  restoreFile(id: string) {
    this.#doUndoable(id, { isTrashed: false });
  }

  archiveFile(id: string) {
    const neighbor =
      this.selectedFileId === id ? this.#findPositionalNeighbor(id, this.activeFiles) : undefined;
    this.#doUndoable(id, { isArchived: true });
    if (this.selectedFileId === id) this.selectedFileId = neighbor;
    this.ensureValidSelection();
  }

  restoreFromArchive(id: string) {
    this.#doUndoable(id, { isArchived: false });
  }

  undo(): boolean {
    while (this.#undoStack.length > 0) {
      const entry = this.#undoStack.pop();
      if (!entry || !this.#updateFile(entry.fileId, entry.prev)) continue;

      const currentSelectedFileId = this.selectedFileId;
      this.selectedFileId = this.#isExistingFileId(entry.selectedFileId)
        ? entry.selectedFileId
        : currentSelectedFileId;
      this.#redoStack.push({ ...entry, redoSelectedFileId: currentSelectedFileId });
      this.ensureValidSelection();
      return true;
    }

    this.ensureValidSelection();
    return false;
  }

  redo(): boolean {
    while (this.#redoStack.length > 0) {
      const entry = this.#redoStack.pop();
      if (!entry || !this.#updateFile(entry.fileId, entry.next)) continue;

      this.#undoStack.push({
        fileId: entry.fileId,
        prev: entry.prev,
        next: entry.next,
        selectedFileId: this.#isExistingFileId(entry.selectedFileId)
          ? entry.selectedFileId
          : undefined
      });
      this.selectedFileId = this.#isExistingFileId(entry.redoSelectedFileId)
        ? entry.redoSelectedFileId
        : this.selectedFileId;
      this.ensureValidSelection();
      return true;
    }

    this.ensureValidSelection();
    return false;
  }

  lockFile(id: string) {
    this.#doUndoable(id, { isLocked: true });
  }

  unlockFile(id: string) {
    this.#doUndoable(id, { isLocked: false });
  }

  makePublic(id: string) {
    this.#doUndoable(id, { isPublic: true });
  }

  makePrivate(id: string) {
    this.#doUndoable(id, { isPublic: false });
  }

  duplicateFile(id: string): CvFile | undefined {
    const file = this.files.find((f) => f.id === id);
    if (!file) return undefined;

    const resolved = resolveFileSections(file);
    const existingNames = this.activeFiles.map((f) => f.name);
    // Strip trailing " N" suffix to get the base name (e.g. "CV (Classic) 2" → "CV (Classic)")
    const baseName = file.name.replace(/ \d+$/, '');
    let counter = 2;
    while (existingNames.includes(`${baseName} ${counter}`)) counter++;
    return this.createFile(`${baseName} ${counter}`, {
      cv: resolved.cv,
      settings: resolved.settings,
      designs: { ...file.designs },
      locales: { ...file.locales },
      selectedTheme: file.selectedTheme,
      selectedLocale: file.selectedLocale
    });
  }

  #doUndoable(id: string, updates: Record<string, unknown>) {
    this.ensureValidSelection();
    const file = this.files.find((f) => f.id === id);
    if (!file) return;
    const prev: Record<string, unknown> = {};
    for (const key of Object.keys(updates))
      prev[key] = (file as unknown as Record<string, unknown>)[key];
    this.#undoStack.push({ fileId: id, prev, next: updates, selectedFileId: this.selectedFileId });
    if (this.#undoStack.length > MAX_UNDO_STACK) {
      this.#undoStack.splice(0, this.#undoStack.length - MAX_UNDO_STACK);
    }
    this.#redoStack = [];
    Object.assign(file, updates);
    this.persistence?.onUpdateMeta?.(id, updates);
  }

  #updateFile(id: string, updates: Record<string, unknown>) {
    const file = this.files.find((f) => f.id === id);
    if (!file) return false;
    Object.assign(file, updates);
    this.persistence?.onUpdateMeta?.(id, updates);
    return true;
  }

  #isExistingFileId(id: string | undefined): id is string {
    if (!id) return false;
    return this.files.some((f) => f.id === id);
  }

  /** Ensure the selected file exists and is visible given current archive/trash visibility. */
  ensureValidSelection() {
    const file = this.selectedFile;
    const isVisible = file
      ? (!file.isTrashed && !file.isArchived) ||
        (file.isArchived && !file.isTrashed && preferences.showArchive) ||
        (file.isTrashed && preferences.showTrash)
      : false;

    if (!isVisible) {
      this.selectedFileId =
        this.activeFiles[0]?.id ??
        (preferences.showArchive ? this.archivedFiles[0]?.id : undefined) ??
        (preferences.showTrash ? this.trashedFiles[0]?.id : undefined);
    }
  }

  #findPositionalNeighbor(id: string, files: CvFile[]): string | undefined {
    const index = files.findIndex((f) => f.id === id);
    if (index === -1) return undefined;
    return files[index + 1]?.id ?? files[index - 1]?.id;
  }

  #pruneHistoryForDeletedFile(deletedId: string) {
    this.#undoStack = this.#undoStack
      .filter((entry) => entry.fileId !== deletedId)
      .map((entry) => ({
        ...entry,
        selectedFileId: entry.selectedFileId === deletedId ? undefined : entry.selectedFileId
      }));

    this.#redoStack = this.#redoStack
      .filter((entry) => entry.fileId !== deletedId)
      .map((entry) => ({
        ...entry,
        selectedFileId: entry.selectedFileId === deletedId ? undefined : entry.selectedFileId,
        redoSelectedFileId:
          entry.redoSelectedFileId === deletedId ? undefined : entry.redoSelectedFileId
      }));
  }
}

export const fileState = new FileState();
