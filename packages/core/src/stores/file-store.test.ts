import { describe, expect, it } from 'vitest';
import { fileStore } from './file-store';

describe('fileStore', () => {
  it('creates a new file and selects it', () => {
    const file = fileStore.createFile('Test CV');
    const snapshot = fileStore.getSnapshot();

    expect(snapshot.selectedFileId).toBe(file.id);
    expect(snapshot.files.some((entry) => entry.id === file.id)).toBe(true);
  });
});
