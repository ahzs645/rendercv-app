import { mkdtemp, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import {
  assertRuntimeThemeArchiveEntries,
  hashRuntimeThemeFiles,
  isRuntimeThemeArchivePath,
  THEME_PACKAGE_DIRS
} from './bundled-theme-runtime.mjs';

const minimalRuntimeEntries = THEME_PACKAGE_DIRS.flatMap((theme) => [
  `${theme}/__init__.py`,
  `${theme}/Preamble.j2.typ`
]);

describe('bundled RenderCV theme runtime allowlist', () => {
  test('allows runtime theme packages and shared font files', () => {
    const entries = [
      ...minimalRuntimeEntries,
      'ahmadstyle/entries/ExperienceEntry.j2.typ',
      'ahmadstyle/fonts/EBGaramond-Regular.ttf',
      'fonts/Raleway-Regular.otf'
    ];

    expect(() => assertRuntimeThemeArchiveEntries(entries)).not.toThrow();
    expect(entries.every(isRuntimeThemeArchivePath)).toBe(true);
  });

  test.each([
    'CV.yaml',
    'resume-variants.yaml',
    'fixtures/phd-jakes.yaml',
    'resume_builder/build_clean.py',
    'resume_builder/tests/fixtures/Ahmad_Jalil_CV.html',
    '.github/workflows/render-from-caller.yml',
    'ahmadstyle/README.md',
    'ahmadstyle/tests/theme.test.py',
    '../outside.ttf'
  ])('rejects non-runtime or sensitive archive path %s', (archivePath) => {
    expect(isRuntimeThemeArchivePath(archivePath)).toBe(false);
    expect(() => assertRuntimeThemeArchiveEntries([...minimalRuntimeEntries, archivePath])).toThrow(
      /Unsafe theme archive/
    );
  });

  test('requires every declared theme package to remain renderable', () => {
    expect(() => assertRuntimeThemeArchiveEntries(minimalRuntimeEntries.slice(2))).toThrow(
      /missing required files/
    );
  });
});

describe('bundled RenderCV theme archive name', () => {
  async function withThemeFiles(files, run) {
    const directory = await mkdtemp(path.join(tmpdir(), 'bundled-theme-hash-'));
    try {
      for (const [name, contents] of Object.entries(files)) {
        await writeFile(path.join(directory, name), contents);
      }
      return await run(directory);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }

  test('ignores modification times and listing order', async () => {
    await withThemeFiles({ 'a.py': 'one', 'b.py': 'two' }, async (directory) => {
      const before = await hashRuntimeThemeFiles(directory, ['a.py', 'b.py']);
      await utimes(path.join(directory, 'a.py'), new Date(0), new Date(0));
      expect(await hashRuntimeThemeFiles(directory, ['b.py', 'a.py'])).toBe(before);
    });
  });

  test('changes when a file is edited or renamed', async () => {
    const original = await withThemeFiles({ 'a.py': 'one' }, (d) => hashRuntimeThemeFiles(d, ['a.py']));
    const edited = await withThemeFiles({ 'a.py': 'uno' }, (d) => hashRuntimeThemeFiles(d, ['a.py']));
    const renamed = await withThemeFiles({ 'b.py': 'one' }, (d) => hashRuntimeThemeFiles(d, ['b.py']));
    expect(new Set([original, edited, renamed]).size).toBe(3);
  });
});
