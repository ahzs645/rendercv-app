#!/usr/bin/env node
// Apply the offline patch to a freshly source-built pyodide.js in place.
// Used by build.sh; reuses the same patch rules as the vendoring path.
//
//   node patch-built.mjs <path/to/pyodide.js>

import { readFile, writeFile } from 'node:fs/promises';
import { applyOfflinePatch } from '../offline-patch.mjs';

const target = process.argv[2];
if (!target) {
  console.error('usage: node patch-built.mjs <path/to/pyodide.js>');
  process.exit(1);
}

const patched = applyOfflinePatch(await readFile(target, 'utf8'));
await writeFile(target, patched, 'utf8');
console.log(`patched ${target}`);
