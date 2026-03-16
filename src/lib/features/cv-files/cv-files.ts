import type { CvFile } from './types';

/**
 * Client-side wrappers for file CRUD operations.
 * Uses keepalive: true when body is small enough (browser enforces 64KB limit).
 */

const KEEPALIVE_LIMIT = 60_000; // stay safely under the 64KB browser limit

function fileAction(action: string, data: unknown): Promise<Record<string, unknown>> {
  const body = JSON.stringify({ action, data });
  return fetch('/api/files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: body.length < KEEPALIVE_LIMIT
  }).then((res) => {
    if (!res.ok) throw new Error(`File action failed: ${action}`);
    return res.json();
  });
}

type SaveContentPayload = Pick<
  CvFile,
  'id' | 'cv' | 'settings' | 'designs' | 'locales' | 'chatMessages' | 'lastEdited'
>;
type CreatePayload = Pick<CvFile, 'id' | 'name'> &
  Partial<
    Pick<CvFile, 'cv' | 'settings' | 'designs' | 'locales' | 'selectedTheme' | 'selectedLocale'>
  >;
type UpdateMetaPayload = Pick<CvFile, 'id'> &
  Partial<
    Pick<
      CvFile,
      | 'name'
      | 'isLocked'
      | 'isArchived'
      | 'isTrashed'
      | 'isPublic'
      | 'selectedTheme'
      | 'selectedLocale'
    >
  >;
type MigratePayload = Omit<CvFile, 'isReadOnly' | 'templateId'>;

export async function saveFileContent(
  files: SaveContentPayload[]
): Promise<{ id: string; editCount: number }[]> {
  const result = await fileAction('save-content', files);
  return (result.editCounts as { id: string; editCount: number }[]) ?? [];
}

export function createFileRemote(data: CreatePayload) {
  return fileAction('create', data);
}

export function deleteFileRemote(fileId: string) {
  return fileAction('delete', fileId);
}

export function updateFileMeta(data: UpdateMetaPayload) {
  return fileAction('update-meta', data);
}

export function migrateGuestFiles(files: MigratePayload[]) {
  return fileAction('migrate', files);
}
