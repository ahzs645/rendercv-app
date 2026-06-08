#!/usr/bin/env node
// Reproducibly re-vendor the Pyodide runtime + Python wheels from their pinned
// upstream sources (jsDelivr Pyodide CDN + PyPI), instead of committing ~30 MB
// of binaries to git.
//
// Every asset is downloaded, the offline patch is re-applied to pyodide.js, and
// the result is checked against the sha256 recorded in pyodide-assets.lock.json.
// A mismatch aborts the whole run — the working tree is only touched once every
// byte is verified.
//
//   node scripts/vendor/vendor-pyodide.mjs           # download + verify + write
//   node scripts/vendor/vendor-pyodide.mjs --check    # verify existing files only, no network
//
// No third-party dependencies (Node >= 18 for global fetch / webcrypto).

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyOfflinePatch } from './offline-patch.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const LOCK_PATH = resolve(HERE, 'pyodide-assets.lock.json');

const CHECK_ONLY = process.argv.includes('--check');

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

const patchPyodideJs = (buf) => Buffer.from(applyOfflinePatch(buf.toString('utf8')), 'utf8');

async function fetchBuffer(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  const lock = JSON.parse(await readFile(LOCK_PATH, 'utf8'));
  let failures = 0;

  for (const asset of lock.assets) {
    const destPath = resolve(REPO_ROOT, asset.dest);
    let buf;

    if (CHECK_ONLY) {
      try {
        buf = await readFile(destPath);
      } catch {
        console.error(`MISSING  ${asset.dest}`);
        failures++;
        continue;
      }
    } else {
      buf = await fetchBuffer(asset.url);
      if (asset.patch === 'offline') buf = patchPyodideJs(buf);
    }

    const got = sha256(buf);
    if (got !== asset.sha256) {
      console.error(`MISMATCH ${asset.dest}\n  expected ${asset.sha256}\n  got      ${got}`);
      failures++;
      continue;
    }

    if (!CHECK_ONLY) {
      await mkdir(dirname(destPath), { recursive: true });
      await writeFile(destPath, buf);
    }
    console.log(`${CHECK_ONLY ? 'ok' : 'wrote'}  ${asset.dest}`);
  }

  if (failures) {
    console.error(`\n${failures} asset(s) failed verification.`);
    process.exit(1);
  }
  console.log(`\nAll ${lock.assets.length} assets verified (Pyodide ${lock.pyodide_version}).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
