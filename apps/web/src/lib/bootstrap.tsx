import { fileStore } from '@rendercv/core';
import { createPreviewChannel } from '@rendercv/core';
import { defaultDesigns } from '@rendercv/core';
import { preferencesStore } from '@rendercv/core';
import { resolveFileSections } from '@rendercv/core';
import { useEffect, useRef } from 'react';
import { api } from './api';

const FILE_STORAGE_KEY = 'rendercv_guest_files';
const PREFERENCE_STORAGE_KEY = 'rendercv_preferences';
const BUILT_IN_THEME_KEYS = new Set(Object.keys(defaultDesigns));

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

export function WorkspaceBootstrap() {
  const bootstrapped = useRef(false);
  const contentTimers = useRef(new Map<string, number>());

  useEffect(() => {
    if (bootstrapped.current) {
      return;
    }
    bootstrapped.current = true;

    try {
      const rawPreferences = localStorage.getItem(PREFERENCE_STORAGE_KEY);
      if (rawPreferences) {
        preferencesStore.hydrate(JSON.parse(rawPreferences));
      }
    } catch {
      preferencesStore.hydrate(undefined);
    }

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

    api.getPreferences().then((response) => {
      preferencesStore.patch(response.preferences);
      if (response.preferences.selectedFileId) {
        fileStore.selectFile(response.preferences.selectedFileId);
      }
    }).catch(() => {});

    api.getFiles().then((response) => {
      if (response.files.length > 0) {
        fileStore.hydrate(response.files);
        syncThemeLibraryFromFiles(response.files);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    return preferencesStore.subscribe(() => {
      const snapshot = preferencesStore.getSnapshot();
      localStorage.setItem(PREFERENCE_STORAGE_KEY, JSON.stringify(snapshot));
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = snapshot.colorMode === 'dark' || (snapshot.colorMode === 'system' && prefersDark);
      document.documentElement.classList.toggle('dark', isDark);
      api.patchPreferences(snapshot).catch(() => {});
    });
  }, []);

  useEffect(() => {
    fileStore.persistence = {
      onCreateFile(file) {
        const { isReadOnly: _isReadOnly, ...payload } = file;
        api.createFile(payload).catch(() => {});
      },
      onDeleteFile(id) {
        api.deleteFile(id).catch(() => {});
      },
      onUpdateMeta(id, patch) {
        api.patchFileMeta({ id, ...patch }).catch(() => {});
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
          api.patchFileContent({
            id,
            sections,
            lastEdited: file.lastEdited
          }).catch(() => {});
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

  return null;
}
