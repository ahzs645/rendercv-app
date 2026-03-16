import type { CvFile } from './types';
import { createLogger } from '$lib/logger';
import { generateId } from '$lib/utils/uuid';
import { fileState, resolveFileSections, DEFAULT_FILE_IDS } from './file-state.svelte';
import { capture } from '$lib/analytics/posthog-client';
import { EVENTS } from '$lib/analytics/events';

const log = createLogger('perf:client');
const saveLog = createLogger('file-sync');
import { loadUserFiles } from './cv-files.remote';
import {
  saveFileContent,
  createFileRemote,
  deleteFileRemote,
  updateFileMeta,
  migrateGuestFiles
} from './cv-files';
import { toast } from 'svelte-sonner';
import { preferences, type ColorMode } from '$lib/features/preferences/pref-state.svelte';
import { savePreferences } from '$lib/features/preferences/preferences.remote';
import { userPrefersMode } from 'mode-watcher';
import { githubSyncState } from '$lib/features/github-sync/github-sync-state.svelte';
import { syncToGithub } from '$lib/features/github-sync/github-sync';
import { setPersonProperties } from '$lib/analytics/posthog-client';

const STORAGE_KEY = 'rendercv_guest_files';
const CLOUD_CACHE_KEY = 'rendercv_cloud_cache';
const DEBOUNCE_MS = 1000;
const MAX_FLUSH_RETRIES = 3;

/** Content fields cached in the write-ahead log (matches SaveContentPayload). */
type CacheEntry = {
  id: string;
  cv: string | null;
  settings: string | null;
  designs: Record<string, string>;
  locales: Record<string, string>;
  chatMessages: unknown[];
  lastEdited: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function serializeFiles(): string {
  return JSON.stringify($state.snapshot(fileState.files));
}

function buildMigrationPayload(files: Omit<CvFile, 'isReadOnly'>[]) {
  return files.map((f) => {
    const { cv, settings } = resolveFileSections(f as CvFile);
    return {
      id: f.id,
      name: f.name,
      cv,
      settings,
      designs: f.designs as Record<string, string>,
      locales: f.locales as Record<string, string>,
      selectedTheme: f.selectedTheme,
      selectedLocale: f.selectedLocale,
      isLocked: f.isLocked,
      isArchived: f.isArchived,
      isTrashed: f.isTrashed,
      isPublic: f.isPublic,
      chatMessages: f.chatMessages ?? [],
      editCount: f.editCount ?? 0,
      lastEdited: f.lastEdited
    };
  });
}

function assignDbIds<T extends { id: string }>(
  files: T[]
): { files: T[]; idMap: Map<string, string> } {
  const idMap = new Map<string, string>();
  const mapped = files.map((f) => {
    if (DEFAULT_FILE_IDS.has(f.id)) {
      const newId = generateId();
      idMap.set(f.id, newId);
      return { ...f, id: newId };
    }
    return f;
  });
  return { files: mapped, idMap };
}

// ---------------------------------------------------------------------------
// Write-ahead cache — survives page unload for cloud save/load race
// ---------------------------------------------------------------------------

function writeCache(entries: CacheEntry[]): void {
  try {
    localStorage.setItem(CLOUD_CACHE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage unavailable or full — best effort
  }
}

function readCache(): CacheEntry[] {
  try {
    const json = localStorage.getItem(CLOUD_CACHE_KEY);
    if (!json) return [];
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function clearCache(): void {
  try {
    localStorage.removeItem(CLOUD_CACHE_KEY);
  } catch {
    // best effort
  }
}

// ---------------------------------------------------------------------------
// Storage backends
// ---------------------------------------------------------------------------

type FileStorage = {
  flush(dirtyFiles: CvFile[]): Promise<void>;
  onCreateFile(file: CvFile): void;
  onDeleteFile(id: string): void;
  onUpdateMeta(id: string, updates: Record<string, unknown>): void;
};

function makeLocalStorage(): FileStorage {
  const save = async () => {
    try {
      localStorage.setItem(STORAGE_KEY, serializeFiles());
    } catch {
      // localStorage unavailable or full
    }
  };
  return { flush: save, onCreateFile: save, onDeleteFile: save, onUpdateMeta: save };
}

function triggerGithubSync() {
  if (!githubSyncState.connection) {
    saveLog.debug('triggerGithubSync: no connection, skipping');
    return;
  }
  saveLog.info('triggerGithubSync: starting sync');
  syncToGithub()
    .then((res) => {
      saveLog.info('triggerGithubSync: completed', { ok: res?.ok });
    })
    .catch((err) => {
      // GitHub sync failure should never block the primary save
      saveLog.error('triggerGithubSync: sync failed', err);
    });
}

function makeRemoteStorage(): FileStorage {
  return {
    async flush(dirtyFiles) {
      const payload: CacheEntry[] = dirtyFiles.map((f) => {
        const snap = $state.snapshot(f);
        return {
          id: snap.id,
          cv: snap.cv,
          settings: snap.settings,
          designs: snap.designs as Record<string, string>,
          locales: snap.locales as Record<string, string>,
          chatMessages: snap.chatMessages as unknown[],
          lastEdited: snap.lastEdited
        };
      });
      if (payload.length === 0) return;

      // CRITICAL: synchronous localStorage write BEFORE async network call.
      // Survives beforeunload — protects against save/load race on fast refresh.
      writeCache(payload);

      const editCounts = await saveFileContent(payload);
      // Cloud save succeeded — cache no longer needed
      clearCache();

      // Sync editCounts from server back to client state
      if (editCounts.length > 0) {
        for (const { id, editCount } of editCounts) {
          const file = fileState.files.find((f) => f.id === id);
          if (file) file.editCount = editCount;
        }
        // Update total_edits person property
        const totalEdits = fileState.files.reduce((sum, f) => sum + (f.editCount ?? 0), 0);
        setPersonProperties({ total_edits: totalEdits });
      }

      triggerGithubSync();
    },
    onCreateFile(file) {
      createFileRemote({
        id: file.id,
        name: file.name,
        cv: file.cv,
        settings: file.settings,
        designs: { ...file.designs },
        locales: { ...file.locales },
        selectedTheme: file.selectedTheme,
        selectedLocale: file.selectedLocale
      }).catch(() => toast.error('Failed to save new file'));
    },
    onDeleteFile(id) {
      deleteFileRemote(id).catch(() => toast.error('Failed to delete file'));
    },
    onUpdateMeta(id, updates) {
      updateFileMeta({ id, ...updates } as Parameters<typeof updateFileMeta>[0]).catch(() =>
        toast.error('Failed to update file')
      );
    }
  };
}

// ---------------------------------------------------------------------------
// Sync manager
// ---------------------------------------------------------------------------

export class FileSyncManager {
  #storage: FileStorage | undefined;
  #dirtyFileIds = new Set<string>();
  #debounceTimer: ReturnType<typeof setTimeout> | undefined;
  #flushRetries = 0;
  #disposed = false;
  #onVisChange: () => void;
  #onUnload: () => void;
  /** Whether this manager was initialized for a logged-in user. */
  initializedLoggedIn = false;

  // Color mode sync (mode-watcher → preferences)
  #colorModeSyncCleanup: (() => void) | undefined;

  constructor() {
    this.#onVisChange = () => {
      if (document.hidden) {
        this.#flush();
      }
    };
    this.#onUnload = () => {
      this.#flush();
    };
  }

  /** Flush guest files to localStorage (call before auth redirect). */
  static saveGuestFiles() {
    try {
      localStorage.setItem(STORAGE_KEY, serializeFiles());
    } catch {
      // localStorage unavailable or full
    }
  }

  async init(isLoggedIn: boolean, ssrFiles?: Omit<CvFile, 'isReadOnly'>[], useCloud = isLoggedIn) {
    if (this.#disposed) return;
    this.initializedLoggedIn = isLoggedIn;

    if (!useCloud) {
      // Restore from localStorage if available; otherwise create defaults.
      let restored = false;
      try {
        const json = localStorage.getItem(STORAGE_KEY);
        if (json) {
          const files = JSON.parse(json);
          if (Array.isArray(files) && files.length > 0) {
            fileState.loadFiles(files);
            restored = true;
          }
        }
      } catch {
        // localStorage unavailable
      }
      if (!restored) fileState.loadDefaults();
      fileState.loading = false;
      this.#storage = makeLocalStorage();
    } else {
      // Use SSR files if provided, otherwise fall back to client fetch
      try {
        let serverFiles: Omit<CvFile, 'isReadOnly'>[];
        if (ssrFiles) {
          serverFiles = ssrFiles;
        } else {
          const t0 = performance.now();
          serverFiles = await loadUserFiles();
          log.info(
            `loadUserFiles=${(performance.now() - t0).toFixed(0)}ms (${serverFiles.length} files)`
          );
        }
        if (this.#disposed) return;

        const guestJson = localStorage.getItem(STORAGE_KEY);

        if (serverFiles.length === 0 && guestJson) {
          clearCache();
          try {
            const guestFiles = JSON.parse(guestJson) as Omit<CvFile, 'isReadOnly'>[];
            const { files: dbFiles, idMap } = assignDbIds(buildMigrationPayload(guestFiles));
            const tMig = performance.now();
            await migrateGuestFiles(dbFiles);
            log.info(`migrateGuestFiles=${(performance.now() - tMig).toFixed(0)}ms`);
            // Only remove localStorage AFTER successful migration
            localStorage.removeItem(STORAGE_KEY);
            fileState.loadFiles(guestFiles.map((f) => ({ ...f, id: idMap.get(f.id) ?? f.id })));
          } catch {
            // Migration failed — keep localStorage intact for retry on next login
            await this.#seedDefaults();
          }
        } else if (serverFiles.length === 0) {
          clearCache();
          localStorage.removeItem(STORAGE_KEY);
          fileState.loadDefaults();
          await this.#seedDefaults();
        } else {
          localStorage.removeItem(STORAGE_KEY);
          // Skip loadFiles if SSR already loaded the same files in the script init
          if (!ssrFiles) fileState.loadFiles(serverFiles);

          // Merge write-ahead cache: if the browser was refreshed while a cloud
          // save was in-flight, the cache may have entries newer than SSR/DB data.
          const cached = readCache();
          if (cached.length > 0) {
            const mergedIds: string[] = [];
            for (const entry of cached) {
              const file = fileState.files.find((f) => f.id === entry.id);
              if (file && entry.lastEdited > file.lastEdited) {
                file.cv = entry.cv;
                file.settings = entry.settings;
                file.designs = entry.designs;
                file.locales = entry.locales;
                file.chatMessages = entry.chatMessages;
                file.lastEdited = entry.lastEdited;
                mergedIds.push(entry.id);
              }
            }
            if (mergedIds.length > 0) {
              saveLog.info(`merged ${mergedIds.length} cached file(s) newer than SSR`, {
                mergedIds
              });
              for (const id of mergedIds) this.#dirtyFileIds.add(id);
            }
          }
        }
        this.#storage = makeRemoteStorage();
      } finally {
        fileState.loading = false;
      }
    }

    // Wire persistence — same for both backends
    fileState.persistence = {
      onCreateFile: (file) => this.#storage!.onCreateFile(file),
      onDeleteFile: (id) => this.#storage!.onDeleteFile(id),
      onUpdateMeta: (id, updates) => this.#storage!.onUpdateMeta(id, updates),
      onContentChange: (id) => {
        this.#dirtyFileIds.add(id);
        saveLog.debug(`content changed, scheduling save`, {
          fileId: id,
          dirtyCount: this.#dirtyFileIds.size
        });
        this.#scheduleSave();
      }
    };

    this.#attachListeners();

    // Re-save any files merged from the write-ahead cache
    if (this.#dirtyFileIds.size > 0) this.#scheduleSave();

    // Set up color mode sync for logged-in users
    if (isLoggedIn) {
      if (preferences.colorMode !== 'system') {
        userPrefersMode.current = preferences.colorMode;
      }
      this.#startColorModeSync();
    }
  }

  dispose() {
    this.#disposed = true;
    this.#flush();
    clearTimeout(this.#debounceTimer);
    preferences.disableAutoSave();
    this.#colorModeSyncCleanup?.();
    this.#colorModeSyncCleanup = undefined;
    this.#detachListeners();
    fileState.persistence = undefined;
    fileState.loadDefaults();
    this.#storage = undefined;
  }

  async #seedDefaults() {
    const snapshot = $state.snapshot(fileState.files);
    const { files: dbFiles, idMap } = assignDbIds(buildMigrationPayload(snapshot));
    try {
      await migrateGuestFiles(dbFiles);
      if (idMap.size > 0) {
        fileState.loadFiles(snapshot.map((f) => ({ ...f, id: idMap.get(f.id) ?? f.id })));
      }
    } catch {
      // Non-critical: defaults will be re-seeded on next login
    }
  }

  #attachListeners() {
    document.addEventListener('visibilitychange', this.#onVisChange);
    window.addEventListener('beforeunload', this.#onUnload);
  }

  #detachListeners() {
    document.removeEventListener('visibilitychange', this.#onVisChange);
    window.removeEventListener('beforeunload', this.#onUnload);
  }

  #scheduleSave() {
    clearTimeout(this.#debounceTimer);
    const delay =
      this.#flushRetries > 0
        ? Math.min(DEBOUNCE_MS * Math.pow(2, this.#flushRetries), 30_000)
        : DEBOUNCE_MS;
    saveLog.debug(`save scheduled in ${delay}ms`, { delay, retries: this.#flushRetries });
    this.#debounceTimer = setTimeout(() => this.#flush(), delay);
  }

  async #flush() {
    if (!this.#storage || this.#dirtyFileIds.size === 0) return;
    const ids = [...this.#dirtyFileIds];
    this.#dirtyFileIds.clear();
    const files = ids
      .map((id) => fileState.files.find((f) => f.id === id))
      .filter((f): f is CvFile => !!f);
    if (files.length === 0) return;

    saveLog.info(`saving ${files.length} file(s)`, { fileIds: ids });
    try {
      await this.#storage.flush(files);
      this.#flushRetries = 0;
      saveLog.info(`save complete`, { fileIds: ids });
      for (const file of files) {
        capture(EVENTS.CV_AUTO_SAVED, {
          cv_id: file.id,
          edit_count: file.editCount,
          save_result: 'success',
          save_trigger: 'debounce'
        });
      }
    } catch (err) {
      // Re-add failed IDs so the next flush retries them
      for (const id of ids) this.#dirtyFileIds.add(id);
      this.#flushRetries++;
      if (this.#flushRetries <= MAX_FLUSH_RETRIES) {
        saveLog.warn(`save failed, retrying (attempt ${this.#flushRetries})`, { fileIds: ids });
        this.#scheduleSave();
      } else {
        saveLog.error(`save failed after ${MAX_FLUSH_RETRIES} retries`, err, { fileIds: ids });
        toast.error('Failed to save changes. Your edits may not be saved.');
        this.#flushRetries = 0;
      }
    }
  }

  /** Enable preference auto-saving. Call AFTER file restoration is complete. */
  enablePrefSave() {
    preferences.enableAutoSave((prefs) => {
      savePreferences({ ...prefs }).catch(() => {});
    });
  }

  #startColorModeSync() {
    this.#colorModeSyncCleanup = $effect.root(() => {
      let initialized = false;
      $effect(() => {
        const mode = userPrefersMode.current as ColorMode;
        if (!initialized) {
          initialized = true;
          return;
        }
        if (mode && mode !== preferences.colorMode) preferences.colorMode = mode;
      });
    });
  }
}
