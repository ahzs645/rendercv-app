import type { CvFile } from '@rendercv/contracts';
import { fileStore, reviewStore, type ReviewSession } from '@rendercv/core';
import { downloadBlob } from '../viewer/download';

/**
 * A complete, restorable copy of this browser's workspace: every CV record
 * (including variants, hidden entries and archive/trash state) and every
 * review session with its proposals, decisions and history. The per-CV backup
 * and the "download all data" zip only hold each CV's YAML, so on their own
 * they lose every review.
 */
export interface WorkspaceBackup {
  kind: 'rendercv-workspace-backup';
  version: 1;
  exportedAt: number;
  files: Array<Omit<CvFile, 'isReadOnly'>>;
  reviewSessions: ReviewSession[];
}

export const WORKSPACE_BACKUP_EXTENSION = '.rendercv-backup.json';
const MAX_BACKUP_SIZE = 25 * 1024 * 1024;

export function buildWorkspaceBackup(): WorkspaceBackup {
  return {
    kind: 'rendercv-workspace-backup',
    version: 1,
    exportedAt: Date.now(),
    // Strip the computed flag; everything else is the stored record.
    files: fileStore.files.map(({ isReadOnly: _isReadOnly, ...file }) => file),
    reviewSessions: reviewStore.sessions
  };
}

export async function downloadWorkspaceBackup() {
  const backup = buildWorkspaceBackup();
  const stamp = new Date(backup.exportedAt).toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  await downloadBlob(blob, `rendercv-${stamp}${WORKSPACE_BACKUP_EXTENSION}`);
  return backup;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isWorkspaceBackup(value: unknown): value is WorkspaceBackup {
  return isRecord(value) && value.kind === 'rendercv-workspace-backup';
}

export function parseWorkspaceBackup(value: unknown): WorkspaceBackup {
  if (!isWorkspaceBackup(value) || value.version !== 1) {
    throw new Error('This is not a RenderCV workspace backup.');
  }
  if (!Array.isArray(value.files) || !Array.isArray(value.reviewSessions)) {
    throw new Error('The workspace backup is incomplete.');
  }
  const files = value.files.filter(
    (file): file is Omit<CvFile, 'isReadOnly'> =>
      isRecord(file) && typeof file.id === 'string' && typeof file.name === 'string' && isRecord(file.designs)
  );
  const reviewSessions = value.reviewSessions.filter(
    (session): session is ReviewSession =>
      isRecord(session) &&
      typeof session.sessionId === 'string' &&
      isRecord(session.rootBaselineSections) &&
      Array.isArray(session.proposals)
  );
  return { ...value, files, reviewSessions };
}

export interface RestoreSummary {
  addedFiles: number;
  skippedFiles: number;
  addedSessions: number;
  addedProposals: number;
}

/** Add everything from a backup that this browser doesn't already have. */
export function restoreWorkspaceBackup(backup: WorkspaceBackup): RestoreSummary {
  const addedIds = fileStore.restoreFiles(backup.files);
  const { addedSessions, addedProposals } = reviewStore.restoreSessions(backup.reviewSessions);
  return {
    addedFiles: addedIds.length,
    skippedFiles: backup.files.length - addedIds.length,
    addedSessions,
    addedProposals
  };
}

export function describeRestore(summary: RestoreSummary) {
  const parts = [
    `${summary.addedFiles} CV${summary.addedFiles === 1 ? '' : 's'}`,
    `${summary.addedSessions} review${summary.addedSessions === 1 ? '' : 's'}`
  ];
  if (summary.addedProposals > 0) {
    parts.push(`${summary.addedProposals} proposal${summary.addedProposals === 1 ? '' : 's'}`);
  }
  const skipped =
    summary.skippedFiles > 0
      ? ` ${summary.skippedFiles} CV${summary.skippedFiles === 1 ? ' was' : 's were'} already here and left unchanged.`
      : '';
  return `Restored ${parts.join(', ')}.${skipped}`;
}

/** Ask for a backup file and restore it. Resolves to undefined if cancelled. */
export function pickAndRestoreWorkspaceBackup(): Promise<RestoreSummary | undefined> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = `${WORKSPACE_BACKUP_EXTENSION},.json`;
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(undefined);
        return;
      }
      if (file.size > MAX_BACKUP_SIZE) {
        reject(new Error(`Backup too large (max ${MAX_BACKUP_SIZE / 1024 / 1024} MB).`));
        return;
      }
      file
        .text()
        .then((text) => resolve(restoreWorkspaceBackup(parseWorkspaceBackup(JSON.parse(text)))))
        .catch((error: unknown) =>
          reject(error instanceof Error ? error : new Error('Could not read the backup.'))
        );
    });
    input.click();
  });
}
