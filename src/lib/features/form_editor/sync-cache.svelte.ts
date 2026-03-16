import { createYamlSync, withPrefix } from './yaml-sync.svelte.js';
import type { YamlSync } from './yaml-sync.svelte.js';
import { fileState } from '$lib/features/cv-files/file-state.svelte';
import type { SectionKey } from '$lib/features/cv-files/types';
import { capture } from '$lib/analytics/posthog-client';
import { EVENTS } from '$lib/analytics/events';

const editedFileIds = new Set<string>();

const cache = new Map<string, YamlSync>();

function cacheKey(
  section: SectionKey,
  fileId: string | undefined,
  theme: string | undefined,
  locale: string | undefined
): string {
  const base = `${fileId ?? ''}:${section}`;
  if (section === 'design' && theme) return `${base}:${theme}`;
  if (section === 'locale' && locale) return `${base}:${locale}`;
  return base;
}

export function getSyncCached(
  section: SectionKey,
  fileId: string | undefined,
  theme: string | undefined,
  locale: string | undefined
): YamlSync {
  const key = cacheKey(section, fileId, theme, locale);
  const cached = cache.get(key);

  if (cached) {
    // Flush any pending debounced typing burst before resuming
    cached.commitPending();
    // Detect external YAML changes (e.g. Monaco edits while form was inactive)
    const currentYaml = fileState.sections[section];
    if (cached.lastFlushedYaml !== currentYaml) {
      cached.reload(); // External change detected — undo history invalidated
    }
    return cached;
  }

  // Create fresh sync and cache it
  const sync = withPrefix(
    createYamlSync(
      () => fileState.sections[section],
      (yaml) => {
        fileState.setSectionContent(section, yaml);
        const fid = fileState.selectedFileId;
        if (fid && !editedFileIds.has(fid)) {
          editedFileIds.add(fid);
          capture(EVENTS.CV_CONTENT_EDITED, { section, editor: 'form', cv_id: fid, edit_count: fileState.selectedFile?.editCount });
        }
      }
    ),
    [section]
  );
  cache.set(key, sync);
  return sync;
}

/** Clear all cached syncs for a specific file, or all if no fileId given. */
export function clearSyncCache(fileId?: string) {
  if (!fileId) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(`${fileId}:`)) cache.delete(key);
  }
}
