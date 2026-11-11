// Bundles the API into dist/index.js for `node dist/index.js`.
//
// tsc's output could not run: the workspace resolves modules the bundler way,
// so its imports have no file extensions and Node's ESM loader rejects them.
// The workspace packages (@rendercv/*, resolved through tsconfig paths) and
// their own dependencies are bundled in; only the API's declared npm
// dependencies stay external and load from node_modules.
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';

const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const external = Object.entries(manifest.dependencies ?? {})
  .filter(([, version]) => !version.startsWith('workspace:'))
  .flatMap(([name]) => [name, `${name}/*`]);

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  sourcemap: true,
  external,
  // Bundled CommonJS dependencies call require() for Node built-ins.
  banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
  logLevel: 'warning'
});
