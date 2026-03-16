import { beforeEach, describe, expect, it } from 'vitest';
import { FileStore } from './file-store';

describe('fileStore', () => {
  let store: FileStore;

  beforeEach(() => {
    store = new FileStore();
  });

  it('creates a new file and selects it', () => {
    const file = store.createFile('Test CV');
    const snapshot = store.getSnapshot();

    expect(snapshot.selectedFileId).toBe(file.id);
    expect(snapshot.files.some((entry) => entry.id === file.id)).toBe(true);
  });

  it('shares custom themes across different CVs', () => {
    const source = store.createFile('Source CV', {
      selectedTheme: 'ahmadstyle',
      designs: {
        ahmadstyle: 'design:\n  theme: ahmadstyle\n  page:\n    size: a4\n'
      }
    });
    const target = store.createFile('Target CV');

    store.setTheme(target.id, 'ahmadstyle');

    const updatedTarget = store.files.find((file) => file.id === target.id);
    expect(store.availableThemes).toContain('ahmadstyle');
    expect(updatedTarget?.selectedTheme).toBe('ahmadstyle');
    expect(updatedTarget?.designs.ahmadstyle).toContain('theme: ahmadstyle');
    expect(source.designs.ahmadstyle).toContain('theme: ahmadstyle');
  });

  it('seeds newly created files from the shared theme library', () => {
    store.createFile('Library Source', {
      selectedTheme: 'portfolio',
      designs: {
        portfolio: 'design:\n  theme: portfolio\n  header:\n    name_font_size: 28 pt\n'
      }
    });

    const file = store.createFile('Library Consumer', {
      selectedTheme: 'portfolio'
    });

    expect(file.selectedTheme).toBe('portfolio');
    expect(file.designs.portfolio).toContain('theme: portfolio');
    expect(file.designs.portfolio).toContain('name_font_size: 28 pt');
  });
});
