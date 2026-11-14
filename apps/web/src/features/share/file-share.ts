import type { CvFileSections } from '@rendercv/contracts';
import { downloadBlob } from '../viewer/download';
import { validateSharePayload, type EncodedSharePayload } from './encoded-share';
import {
  isWorkspaceBackup,
  parseWorkspaceBackup,
  WORKSPACE_BACKUP_EXTENSION,
  type WorkspaceBackup
} from '../files/workspace-backup';

const RENDERCV_FILE_EXTENSION = '.rendercv.json';
const MAX_IMPORT_SIZE = 2 * 1024 * 1024; // 2 MB

/**
 * Back up the current resume as a `.rendercv.json` file.
 */
export async function exportShareFile(payload: EncodedSharePayload) {
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  await downloadBlob(blob, `${payload.fileName}${RENDERCV_FILE_EXTENSION}`);
}

export type ImportedBackupFile =
  | { kind: 'cv'; payload: EncodedSharePayload }
  | { kind: 'workspace'; backup: WorkspaceBackup };

/**
 * Prompt for a backup file and parse it. Accepts a single-CV `.rendercv.json`
 * (a plain backup, or a review copy that also carries the original and its
 * review thread) or a full workspace backup.
 */
export function importShareFile(): Promise<ImportedBackupFile | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = `.rendercv.json,${WORKSPACE_BACKUP_EXTENSION},.json`;

    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string) as Record<string, unknown>;
          if (isWorkspaceBackup(data)) {
            resolve({ kind: 'workspace', backup: parseWorkspaceBackup(data) });
            return;
          }
          if (file.size > MAX_IMPORT_SIZE) {
            reject(new Error(`File too large (max ${MAX_IMPORT_SIZE / 1024 / 1024} MB).`));
            return;
          }
          if (!data.sections || typeof data.sections !== 'object') {
            reject(new Error('Invalid .rendercv.json — missing sections.'));
            return;
          }
          // Keep the original and the review thread a review-copy file carries.
          const payload = validateSharePayload({
            version: 1,
            ...data,
            fileName:
              typeof data.fileName === 'string'
                ? data.fileName
                : file.name.replace(/\.rendercv\.json$/i, '').replace(/\.json$/i, '')
          });
          resolve({ kind: 'cv', payload });
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Failed to parse .rendercv.json file.'));
        }
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file.'));
      };
      reader.readAsText(file);
    });

    input.click();
  });
}
