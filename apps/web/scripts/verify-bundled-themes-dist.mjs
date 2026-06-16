import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Post-build guard: every theme declared in bundled-themes.generated.ts must
// have its archive present in the build output. A themeless build otherwise
// ships silently and fails at runtime with
// "The custom theme folder ... does not exist".

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../..');
const distDir = path.join(projectRoot, 'apps/web/dist');
const generatedModulePath = path.join(
  projectRoot,
  'apps/web/src/features/viewer/bundled-themes.generated.ts'
);

const source = await readFile(generatedModulePath, 'utf8');
const archivePaths = [...source.matchAll(/"archivePath":\s*"([^"]+)"/g)].map((match) => match[1]);

if (archivePaths.length === 0) {
  throw new Error(
    '[verify-bundled-themes] No bundled theme archives are declared in ' +
      'bundled-themes.generated.ts. The prebuild theme sync did not run.'
  );
}

const missing = [];
for (const archivePath of archivePaths) {
  try {
    await access(path.join(distDir, archivePath));
  } catch {
    missing.push(archivePath);
  }
}

if (missing.length > 0) {
  throw new Error(
    `[verify-bundled-themes] ${missing.length} bundled theme archive(s) missing from the ` +
      'build output:\n' +
      missing.map((archivePath) => `  - dist/${archivePath}`).join('\n') +
      '\nThe deployed app would fail at runtime with "The custom theme folder ... does not ' +
      "exist\". Ensure the 'themes/resume' submodule is checked out and the prebuild theme " +
      'sync ran before building.'
  );
}

console.log(`[verify-bundled-themes] OK — ${archivePaths.length} theme archive(s) present in dist/.`);
