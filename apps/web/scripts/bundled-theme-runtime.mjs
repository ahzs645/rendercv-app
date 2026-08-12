import { execFileSync } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

export const THEME_PACKAGE_DIRS = [
  'ahmadstyle',
  'phdjakes',
  'phddeedy',
  'phdresearch',
  'tylerstyle'
];

export const SHARED_FONTS_DIR = 'fonts';

const REQUIRED_THEME_FILES = THEME_PACKAGE_DIRS.flatMap((packageDir) => [
  `${packageDir}/__init__.py`,
  `${packageDir}/Preamble.j2.typ`
]);

const FORBIDDEN_ARCHIVE_PATH =
  /(^|\/)(?:\.git(?:hub)?|\.venv|fixtures|resume_builder|tests?)(?:\/|$)|(^|\/)(?:CV|resume-variants)\.ya?ml$/i;
const THEME_RUNTIME_FILE = /\.(?:j2\.typ|py|ttf|otf)$/i;
const SHARED_FONT_FILE = /\.(?:ttf|otf)$/i;

function normalizedArchivePath(value) {
  return value.replaceAll('\\', '/').replace(/^\.\//, '');
}

export function isRuntimeThemeArchivePath(value) {
  const archivePath = normalizedArchivePath(value);
  if (
    !archivePath ||
    archivePath.startsWith('/') ||
    archivePath.endsWith('/') ||
    archivePath.split('/').includes('..') ||
    FORBIDDEN_ARCHIVE_PATH.test(archivePath)
  ) {
    return false;
  }

  const [root, ...rest] = archivePath.split('/');
  if (rest.length === 0) {
    return false;
  }

  if (THEME_PACKAGE_DIRS.includes(root)) {
    return THEME_RUNTIME_FILE.test(archivePath);
  }

  return root === SHARED_FONTS_DIR && rest.length === 1 && SHARED_FONT_FILE.test(archivePath);
}

export function assertRuntimeThemeArchiveEntries(entries, archiveLabel = 'theme archive') {
  const normalized = entries.map(normalizedArchivePath).filter(Boolean);
  const duplicates = normalized.filter((entry, index) => normalized.indexOf(entry) !== index);
  const forbidden = normalized.filter((entry) => FORBIDDEN_ARCHIVE_PATH.test(entry));
  const unexpected = normalized.filter((entry) => !isRuntimeThemeArchivePath(entry));
  const missing = REQUIRED_THEME_FILES.filter((entry) => !normalized.includes(entry));

  const failures = [];
  if (duplicates.length > 0) failures.push(`duplicate entries: ${[...new Set(duplicates)].join(', ')}`);
  if (forbidden.length > 0) failures.push(`forbidden paths: ${forbidden.join(', ')}`);
  if (unexpected.length > 0) failures.push(`non-runtime paths: ${unexpected.join(', ')}`);
  if (missing.length > 0) failures.push(`missing required files: ${missing.join(', ')}`);
  if (normalized.length === 0) failures.push('archive is empty');

  if (failures.length > 0) {
    throw new Error(`[bundled-themes] Unsafe ${archiveLabel}: ${failures.join('; ')}`);
  }
}

async function collectFiles(root, directory, output) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`[bundled-themes] Theme runtime may not contain symlinks: ${absolutePath}`);
    }
    if (entry.isDirectory()) {
      await collectFiles(root, absolutePath, output);
      continue;
    }
    if (!entry.isFile()) {
      continue;
    }

    const relativePath = path.relative(root, absolutePath).split(path.sep).join('/');
    if (isRuntimeThemeArchivePath(relativePath)) {
      output.push(relativePath);
    }
  }
}

export async function collectRuntimeThemeSourceFiles(submodulePath) {
  const files = [];
  for (const root of [...THEME_PACKAGE_DIRS, SHARED_FONTS_DIR]) {
    await collectFiles(submodulePath, path.join(submodulePath, root), files);
  }
  files.sort();
  assertRuntimeThemeArchiveEntries(files, 'theme source selection');
  return files;
}

export function readZipArchiveEntries(archivePath) {
  return execFileSync('unzip', ['-Z1', archivePath], {
    encoding: 'utf8',
    maxBuffer: 2 * 1024 * 1024
  })
    .split(/\r?\n/)
    .filter(Boolean);
}
