import { fileStore } from '@rendercv/core';
import { createPreviewChannel } from '@rendercv/core';
import { defaultDesigns } from '@rendercv/core';
import { preferencesStore } from '@rendercv/core';
import { resolveFileSections } from '@rendercv/core';
import { reviewStore } from '@rendercv/core';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { api, API_ENABLED, ApiUnavailableError } from './api';
import { initPostHog } from './analytics/posthog-client';
import { BUNDLED_THEMES } from '../features/viewer/bundled-themes.generated';

const FILE_STORAGE_KEY = 'rendercv_guest_files';
const PREFERENCE_STORAGE_KEY = 'rendercv_preferences';
const REVIEW_STORAGE_KEY = 'rendercv_review_sessions';
const BUILT_IN_THEME_KEYS = new Set(Object.keys(defaultDesigns));
const RETRY_DELAYS = [2_000, 10_000] as const;
const CLOUD_SYNC_ENABLED = API_ENABLED && import.meta.env.VITE_ENABLE_CLOUD_SYNC === 'true';

const reportedApiFailures = new Set<string>();

function stripReadOnly(files: ReturnType<typeof fileStore.getSnapshot>['files']) {
  return files.map(({ isReadOnly: _isReadOnly, ...file }) => file);
}

function syncThemeLibraryFromFiles(files: Array<ReturnType<typeof stripReadOnly>[number]>) {
  const currentLibrary = preferencesStore.getSnapshot().themeLibrary;
  const nextLibrary = { ...currentLibrary };
  let changed = false;

  for (const file of files) {
    for (const [themeKey, design] of Object.entries(file.designs ?? {})) {
      if (BUILT_IN_THEME_KEYS.has(themeKey) || !design) {
        continue;
      }

      if (nextLibrary[themeKey] !== design) {
        nextLibrary[themeKey] = design;
        changed = true;
      }
    }
  }

  if (changed) {
    preferencesStore.patch({ themeLibrary: nextLibrary });
  }
}

function ensureBundledThemeLibraryEntries() {
  const currentLibrary = preferencesStore.getSnapshot().themeLibrary;
  let nextLibrary: Record<string, string> | undefined;

  for (const theme of BUNDLED_THEMES) {
    if (currentLibrary[theme.themeKey]) {
      continue;
    }

    if (!nextLibrary) {
      nextLibrary = { ...currentLibrary };
    }

    nextLibrary[theme.themeKey] = theme.design;
  }

  if (nextLibrary) {
    preferencesStore.patch({ themeLibrary: nextLibrary });
  }
}

function reportApiFailure(label: string, error: unknown) {
  if (error instanceof ApiUnavailableError || !CLOUD_SYNC_ENABLED) {
    return;
  }

  console.warn(`[RenderCV] ${label} failed`, error);
  if (reportedApiFailures.has(label)) {
    return;
  }

  reportedApiFailures.add(label);
  toast.warning(`${label} failed. Your local browser copy is still saved.`);
}

function persistWithRetry(label: string, operation: () => Promise<unknown>, attempt = 0) {
  if (!CLOUD_SYNC_ENABLED) {
    return;
  }

  operation().catch((error: unknown) => {
    reportApiFailure(label, error);
    const delay = RETRY_DELAYS[attempt];
    if (delay === undefined) {
      return;
    }

    window.setTimeout(() => {
      persistWithRetry(label, operation, attempt + 1);
    }, delay);
  });
}

export function WorkspaceBootstrap() {
  const bootstrapped = useRef(false);
  const contentTimers = useRef(new Map<string, number>());

  function migrateLegacyReviewCopies() {
    const files = fileStore.getSnapshot().files;
    for (const file of files) {
      if (!file.sharedOrigin) {
        continue;
      }

      reviewStore.migrateLegacyReviewCopy({
        fileId: file.id,
        fileName: file.name,
        createdAt: file.lastEdited,
        rootBaselineSections: file.sharedOrigin,
        proposedSections: resolveFileSections(file)
      });
    }
  }

  useEffect(() => {
    if (bootstrapped.current) {
      return;
    }
    bootstrapped.current = true;
    initPostHog(import.meta.env.VITE_POSTHOG_KEY, import.meta.env.VITE_POSTHOG_HOST);

    try {
      const rawPreferences = localStorage.getItem(PREFERENCE_STORAGE_KEY);
      if (rawPreferences) {
        preferencesStore.hydrate(JSON.parse(rawPreferences));
      }
    } catch {
      preferencesStore.hydrate(undefined);
    }
    ensureBundledThemeLibraryEntries();

    try {
      const rawFiles = localStorage.getItem(FILE_STORAGE_KEY);
      if (rawFiles) {
        const files = JSON.parse(rawFiles);
        fileStore.hydrate(files);
        syncThemeLibraryFromFiles(files);
      } else {
        fileStore.loadDefaults();
      }
    } catch {
      fileStore.loadDefaults();
    }
    ensureBundledThemeLibraryEntries();

    try {
      const rawReviews = localStorage.getItem(REVIEW_STORAGE_KEY);
      if (rawReviews) {
        const parsedReviews = JSON.parse(rawReviews);
        reviewStore.hydrate(parsedReviews.sessions ?? parsedReviews);
      }
    } catch {
      reviewStore.hydrate(undefined);
    }
    migrateLegacyReviewCopies();

    if (CLOUD_SYNC_ENABLED) {
      api.getPreferences().then((response) => {
        preferencesStore.patch(response.preferences);
        ensureBundledThemeLibraryEntries();
        if (response.preferences.selectedFileId) {
          fileStore.selectFile(response.preferences.selectedFileId);
        }
      }).catch((error: unknown) => {
        reportApiFailure('Loading cloud preferences', error);
      });

      api.getFiles().then((response) => {
        if (response.files.length > 0) {
          fileStore.hydrate(response.files);
          syncThemeLibraryFromFiles(response.files);
          ensureBundledThemeLibraryEntries();
          migrateLegacyReviewCopies();
        }
      }).catch((error: unknown) => {
        reportApiFailure('Loading cloud files', error);
      });
    }
  }, []);

  useEffect(() => {
    return preferencesStore.subscribe(() => {
      const snapshot = preferencesStore.getSnapshot();
      localStorage.setItem(PREFERENCE_STORAGE_KEY, JSON.stringify(snapshot));
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = snapshot.colorMode === 'dark' || (snapshot.colorMode === 'system' && prefersDark);
      document.documentElement.classList.toggle('dark', isDark);
      persistWithRetry('Saving cloud preferences', () => api.patchPreferences(snapshot));
    });
  }, []);

  useEffect(() => {
    fileStore.persistence = {
      onCreateFile(file) {
        const { isReadOnly: _isReadOnly, ...payload } = file;
        persistWithRetry('Creating cloud file', () => api.createFile(payload));
      },
      onDeleteFile(id) {
        persistWithRetry('Deleting cloud file', () => api.deleteFile(id));
      },
      onUpdateMeta(id, patch) {
        persistWithRetry('Saving cloud file metadata', () => api.patchFileMeta({ id, ...patch }));
      },
      onContentChange(id) {
        const existingTimer = contentTimers.current.get(id);
        if (existingTimer) {
          window.clearTimeout(existingTimer);
        }

        const timer = window.setTimeout(() => {
          const file = fileStore.getSnapshot().files.find((entry) => entry.id === id);
          if (!file) {
            return;
          }

          const sections = resolveFileSections(file);
          persistWithRetry('Saving cloud file content', () =>
            api.patchFileContent({
              id,
              sections,
              lastEdited: file.lastEdited
            })
          );
          contentTimers.current.delete(id);
        }, 350);

        contentTimers.current.set(id, timer);
      }
    };

    const channel = createPreviewChannel();
    const unsubscribe = fileStore.subscribe(() => {
      const snapshot = fileStore.getSnapshot();
      localStorage.setItem(FILE_STORAGE_KEY, JSON.stringify(stripReadOnly(snapshot.files)));
      syncThemeLibraryFromFiles(stripReadOnly(snapshot.files));
      channel.postMessage({
        type: 'filestate',
        files: snapshot.files,
        selectedFileId: snapshot.selectedFileId
      });
    });

    return () => {
      unsubscribe();
      fileStore.persistence = undefined;
      for (const timer of contentTimers.current.values()) {
        window.clearTimeout(timer);
      }
      contentTimers.current.clear();
      channel.close();
    };
  }, []);

  useEffect(() => {
    return reviewStore.subscribe(() => {
      localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(reviewStore.getSnapshot()));
    });
  }, []);

  return null;
}
