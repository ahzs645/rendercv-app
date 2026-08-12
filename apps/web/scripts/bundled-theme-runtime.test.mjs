import { describe, expect, test } from 'vitest';
import {
  assertRuntimeThemeArchiveEntries,
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
