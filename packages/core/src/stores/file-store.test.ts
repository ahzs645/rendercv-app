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

  it('captures a source baseline when imported from a URL', () => {
    const file = fileStore.createFile('From URL', {
      cv: 'cv:\n  name: Julian',
      sourceUrl: 'https://www.julianstokes.ca/CV.yaml'
    });

    expect(file.sourceUrl).toBe('https://www.julianstokes.ca/CV.yaml');
    // The baseline mirrors the resolved sections so an unmodified file can be
    // detected later by the share action.
    expect(file.sourceBaseline).toEqual(resolveFileSections(file));
  });

  it('leaves sourceBaseline undefined without a sourceUrl', () => {
    const file = fileStore.createFile('No Source', { cv: 'cv:\n  name: Local' });

    expect(file.sourceUrl).toBeUndefined();
    expect(file.sourceBaseline).toBeUndefined();
  });

  it('duplicateFile preserves the source URL and baseline', () => {
    const original = fileStore.createFile('From URL', {
      cv: 'cv:\n  name: Julian',
      sourceUrl: 'https://www.julianstokes.ca/CV.yaml'
    });
    const duplicate = fileStore.duplicateFile(original.id);

    expect(duplicate!.sourceUrl).toBe('https://www.julianstokes.ca/CV.yaml');
    expect(duplicate!.sourceBaseline).toEqual(original.sourceBaseline);
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

  it('ignores invalid selected file ids', () => {
    const before = fileStore.getSnapshot().selectedFileId;

    fileStore.selectFile('missing-file-id');

    expect(fileStore.getSnapshot().selectedFileId).toBe(before);
  });

  it('does not mutate archived files through ordinary edit operations', () => {
    const file = fileStore.createFile('Archived Edit Guard');

    fileStore.archiveFile(file.id);
    fileStore.setTheme(file.id, 'moderncv');

    const archived = fileStore.getSnapshot().files.find((entry) => entry.id === file.id)!;
    expect(archived.selectedTheme).toBe(file.selectedTheme);
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

describe('fileStore variant authoring', () => {
  function findFile(id: string) {
    return fileStore.getSnapshot().files.find((entry) => entry.id === id);
  }

  it('creates, selects, renames and deletes variants', () => {
    const file = fileStore.createFile('Variants CV');
    const key = fileStore.createVariant(file.id, 'Tech Focus');
    expect(key).toBe('tech_focus');
    expect(findFile(file.id)?.selectedVariant).toBe('tech_focus');

    fileStore.renameVariant(file.id, 'tech_focus', 'Academic');
    const afterRename = findFile(file.id);
    expect(afterRename?.variants?.academic).toBeDefined();
    expect(afterRename?.variants?.tech_focus).toBeUndefined();
    expect(afterRename?.selectedVariant).toBe('academic');

    fileStore.deleteVariant(file.id, 'academic');
    expect(findFile(file.id)?.variants?.academic).toBeUndefined();
    fileStore.deleteFile(file.id);
  });

  it('starts a created variant with an empty definition', () => {
    const file = fileStore.createFile('Empty Variant CV');
    const key = fileStore.createVariant(file.id, 'Tech Focus')!;
    expect(findFile(file.id)?.variants?.[key]).toEqual({});
    fileStore.deleteFile(file.id);
  });

  it('renameVariant returns the new key and reports collisions', () => {
    const file = fileStore.createFile('Rename Variant CV');
    fileStore.createVariant(file.id, 'Tech Focus');
    fileStore.createVariant(file.id, 'Academic');

    // No-op rename (same slug) still succeeds and returns the key.
    expect(fileStore.renameVariant(file.id, 'tech_focus', 'Tech Focus')).toBe('tech_focus');
    // Collision with an existing variant fails and leaves keys untouched.
    expect(fileStore.renameVariant(file.id, 'tech_focus', 'Academic')).toBeUndefined();
    expect(findFile(file.id)?.variants?.tech_focus).toBeDefined();
    // A genuine rename returns the new key.
    expect(fileStore.renameVariant(file.id, 'tech_focus', 'Industry')).toBe('industry');
    expect(findFile(file.id)?.variants?.industry).toBeDefined();
    fileStore.deleteFile(file.id);
  });

  it('updates a variant description, tags and flavors', () => {
    const file = fileStore.createFile('Update Variant CV');
    const key = fileStore.createVariant(file.id, 'Academic')!;

    fileStore.updateVariant(file.id, key, {
      description: 'For research roles',
      tags: ['research'],
      flavors: ['long']
    });
    expect(findFile(file.id)?.variants?.[key]).toMatchObject({
      description: 'For research roles',
      tags: ['research'],
      flavors: ['long']
    });

    // Patches merge: updating tags leaves the description intact.
    fileStore.updateVariant(file.id, key, { tags: ['research', 'teaching'] });
    const updated = findFile(file.id)?.variants?.[key];
    expect(updated?.description).toBe('For research roles');
    expect(updated?.tags).toEqual(['research', 'teaching']);

    // Unknown variant keys are ignored.
    fileStore.updateVariant(file.id, 'missing', { description: 'nope' });
    expect(findFile(file.id)?.variants?.missing).toBeUndefined();
    fileStore.deleteFile(file.id);
  });

  it('toggles a section exclusion on the active variant', () => {
    const file = fileStore.createFile('Section Variant CV');
    const key = fileStore.createVariant(file.id, 'minimal')!;

    fileStore.toggleVariantSectionExcluded(file.id, key, 'projects');
    expect(findFile(file.id)?.variants?.[key]?.exclude_sections).toEqual(['projects']);

    fileStore.toggleVariantSectionExcluded(file.id, key, 'projects');
    expect(findFile(file.id)?.variants?.[key]?.exclude_sections).toEqual([]);
    fileStore.deleteFile(file.id);
  });

  it('toggles an entry exclusion without touching CV content', () => {
    const file = fileStore.createFile('Entry Variant CV');
    const key = fileStore.createVariant(file.id, 'short')!;
    const originalCv = findFile(file.id)?.cv;

    fileStore.toggleEntryHiddenInVariant(file.id, key, 'experience', 'abc123');
    const after = findFile(file.id);
    expect(after?.variants?.[key]?.exclude_entries).toEqual({ experience: ['abc123'] });
    // CV content is untouched — exclusions live on the variant metadata.
    expect(after?.cv).toBe(originalCv);

    fileStore.toggleEntryHiddenInVariant(file.id, key, 'experience', 'abc123');
    expect(findFile(file.id)?.variants?.[key]?.exclude_entries).toEqual({});
    fileStore.deleteFile(file.id);
  });
});
