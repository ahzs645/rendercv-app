import { describe, expect, it } from 'vitest';
import { fileStore, resolveFileSections, readThemeName, readLocaleName } from './file-store';
import type { CvFileSections } from '@rendercv/contracts';

describe('fileStore', () => {
  it('creates a new file and selects it', () => {
    const file = fileStore.createFile('Test CV');
    const snapshot = fileStore.getSnapshot();

    expect(snapshot.selectedFileId).toBe(file.id);
    expect(snapshot.files.some((entry) => entry.id === file.id)).toBe(true);
  });

  it('creates a file with sharedOrigin', () => {
    const origin: CvFileSections = {
      cv: 'cv:\n  name: Original',
      design: 'design:\n  theme: classic',
      locale: 'locale:\n  language: english',
      settings: ''
    };

    const file = fileStore.createFile('Shared CV', { sharedOrigin: origin });

    expect(file.sharedOrigin).toEqual(origin);
  });

  it('creates a file without sharedOrigin by default', () => {
    const file = fileStore.createFile('Plain CV');

    expect(file.sharedOrigin).toBeUndefined();
  });

  it('duplicateFile preserves sharedOrigin', () => {
    const origin: CvFileSections = {
      cv: 'cv:\n  name: Shared',
      design: 'design:\n  theme: classic',
      locale: 'locale:\n  language: english',
      settings: ''
    };

    const original = fileStore.createFile('To Duplicate', { sharedOrigin: origin });
    const duplicate = fileStore.duplicateFile(original.id);

    expect(duplicate).toBeDefined();
    expect(duplicate!.sharedOrigin).toEqual(origin);
    expect(duplicate!.id).not.toBe(original.id);
  });

  it('duplicateFile without sharedOrigin keeps it undefined', () => {
    const original = fileStore.createFile('No Origin');
    const duplicate = fileStore.duplicateFile(original.id);

    expect(duplicate).toBeDefined();
    expect(duplicate!.sharedOrigin).toBeUndefined();
  });
});

describe('readThemeName', () => {
  it('extracts theme from valid design YAML', () => {
    expect(readThemeName('design:\n  theme: ember')).toBe('ember');
  });

  it('returns undefined for empty content', () => {
    expect(readThemeName('')).toBeUndefined();
    expect(readThemeName(undefined)).toBeUndefined();
  });

  it('returns undefined for invalid YAML', () => {
    expect(readThemeName('not: valid: yaml: {{')).toBeUndefined();
  });

  it('returns undefined when theme key is missing', () => {
    expect(readThemeName('design:\n  color: red')).toBeUndefined();
  });
});

describe('readLocaleName', () => {
  it('extracts language from valid locale YAML', () => {
    expect(readLocaleName('locale:\n  language: french')).toBe('french');
  });

  it('returns undefined for empty content', () => {
    expect(readLocaleName('')).toBeUndefined();
    expect(readLocaleName(undefined)).toBeUndefined();
  });

  it('returns undefined for invalid YAML', () => {
    expect(readLocaleName('not: valid: yaml: {{')).toBeUndefined();
  });

  it('returns undefined when language key is missing', () => {
    expect(readLocaleName('locale:\n  date_style: full')).toBeUndefined();
  });
});

describe('fileStore.uniqueName', () => {
  it('returns the name as-is when no collision', () => {
    expect(fileStore.uniqueName('Totally Unique Name')).toBe('Totally Unique Name');
  });

  it('appends a suffix when the name already exists', () => {
    const file = fileStore.createFile('Collision Test');
    const unique = fileStore.uniqueName('Collision Test');
    expect(unique).toBe('Collision Test 2');
    fileStore.deleteFile(file.id);
  });

  it('increments suffix when multiple collisions exist', () => {
    const f1 = fileStore.createFile('Multi Collision');
    const f2 = fileStore.createFile('Multi Collision 2');
    const unique = fileStore.uniqueName('Multi Collision');
    expect(unique).toBe('Multi Collision 3');
    fileStore.deleteFile(f1.id);
    fileStore.deleteFile(f2.id);
  });
});
