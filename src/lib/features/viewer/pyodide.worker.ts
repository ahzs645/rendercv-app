import { pyodideReady, getLoadPyodide, type PyodideInterface } from './pyodide-shim';
import yamlToTypstPy from './yaml_to_typst.js';

let pyodide!: PyodideInterface;

// Pre-import statement derived from yaml_to_typst.py — warms sys.modules during init
// so the first RENDER call pays no extra Python module-load cost.
const PREWARM_IMPORTS = `
from rendercv.schema.rendercv_model_builder import build_rendercv_dictionary_and_model, BuildRendercvModelArguments
from rendercv.renderer.templater.templater import render_full_template
from rendercv.exception import RenderCVUserValidationError
from dataclasses import asdict
`;

// Bump this string whenever any installed package version changes so the old
// IDB cache is detected and replaced with a fresh install.
const PKG_CACHE_VERSION = 'rendercv-2.7-pyodide-0.29.3-v1';
const IDB_DB_NAME = 'pyodide-pkg-cache';
const IDB_STORE = 'packages';

// ── IndexedDB helpers ────────────────────────────────────────────────────────

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
    };
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
  });
}

function idbGet<T>(db: IDBDatabase, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(key);
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
}

function idbPut(db: IDBDatabase, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(IDB_STORE, 'readwrite').objectStore(IDB_STORE).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ── Package cache restore / save ─────────────────────────────────────────────

// Tries to restore previously cached packages from IndexedDB into Pyodide's
// site-packages directory. Returns true if the cache was valid and applied.
async function tryRestorePackages(pyodide: PyodideInterface): Promise<boolean> {
  try {
    const db = await openIDB();
    const version = await idbGet<string>(db, 'version');
    if (version !== PKG_CACHE_VERSION) {
      db.close();
      return false;
    }
    const tarball = await idbGet<Uint8Array>(db, 'tarball');
    db.close();
    if (!tarball) return false;

    pyodide.globals.set('_cache_bytes', tarball);
    await pyodide.runPythonAsync(`
import tarfile, io, sysconfig
sp = sysconfig.get_path('purelib')
with tarfile.open(fileobj=io.BytesIO(bytes(_cache_bytes.to_py())), mode='r') as tar:
    tar.extractall(sp)
del _cache_bytes
`);
    return true;
  } catch (e) {
    console.warn('[pyodide] package cache restore failed:', e);
    return false;
  }
}

// Creates an uncompressed tar of the newly installed package entries in Python.
// MUST be awaited — uses Pyodide and cannot run concurrently with other runPythonAsync calls.
async function createPackageTar(
  pyodide: PyodideInterface,
  newEntries: string[]
): Promise<Uint8Array> {
  pyodide.globals.set('_new_entries', pyodide.toPy(newEntries));
  await pyodide.runPythonAsync(`
import tarfile, io, os, sysconfig
sp = sysconfig.get_path('purelib')
buf = io.BytesIO()
with tarfile.open(fileobj=buf, mode='w') as tar:  # uncompressed: fast write/read
    for name in _new_entries:
        path = f'{sp}/{name}'
        if os.path.exists(path):
            tar.add(path, arcname=name)
del _new_entries
_tarball_bytes = buf.getvalue()
`);
  const tarball = pyodide.globals.get('_tarball_bytes').toJs() as Uint8Array;
  pyodide.globals.delete('_tarball_bytes');
  return tarball;
}

// Writes the tarball to IndexedDB. Pure JS — safe to call fire-and-forget
// since it does not touch Pyodide.
async function writePackagesToIDB(tarball: Uint8Array): Promise<void> {
  try {
    const db = await openIDB();
    await idbPut(db, 'tarball', tarball);
    await idbPut(db, 'version', PKG_CACHE_VERSION);
    db.close();
  } catch (e) {
    console.warn('[pyodide] package cache save failed:', e);
  }
}

// ── Initialization ───────────────────────────────────────────────────────────

async function initialize() {
  await pyodideReady;
  const loadPyodide = getLoadPyodide();
  pyodide = await loadPyodide({
    indexURL: self.location.origin + '/rendercv-app/cdn/pyodide/v0.29.3/full/'
  });

  await pyodide.loadPackage(['micropip', 'typing-inspection']);
  const micropip = pyodide.pyimport('micropip');

  const restored = await tryRestorePackages(pyodide);

  if (!restored) {
    // Snapshot site-packages before install to identify which entries micropip adds.
    const beforeEntries = new Set<string>(
      pyodide
        .runPython("import os, sysconfig; list(os.listdir(sysconfig.get_path('purelib')))")
        .toJs() as string[]
    );

    // Pre-list all rendercv dependencies so micropip fetches their metadata and wheels
    // concurrently rather than discovering them one-by-one via serial resolution.
    // phonenumbers (2.52 MB) is the heaviest dep — listing it here starts its download
    // in parallel with rendercv instead of waiting for rendercv's metadata to resolve first.
    const base = `${self.location.origin}/rendercv-app`;
    await micropip.install([
      `${base}/cdn/pypi-wheels/dnspython-2.8.0-py3-none-any.whl`,
      `${base}/cdn/pypi-wheels/email_validator-2.3.0-py3-none-any.whl`,
      `${base}/rendercv-2.7-py3-none-any.whl`,
      `${base}/cdn/pypi-wheels/phonenumbers-9.0.26-py2.py3-none-any.whl`,
      `${base}/cdn/pypi-wheels/markdown-3.10.2-py3-none-any.whl`,
      `${base}/cdn/pypi-wheels/pydantic_extra_types-2.11.0-py3-none-any.whl`,
      `${base}/cdn/pypi-wheels/ruamel_yaml-0.19.1-py3-none-any.whl`,
    ]);

    const afterEntries = new Set<string>(
      pyodide
        .runPython("import os, sysconfig; list(os.listdir(sysconfig.get_path('purelib')))")
        .toJs() as string[]
    );
    const newEntries = [...afterEntries].filter((e) => !beforeEntries.has(e));

    // Create tar now (awaited — uses Pyodide, must complete before PREWARM_IMPORTS).
    // Then write to IDB fire-and-forget (pure JS, won't conflict with PREWARM).
    const tarball = await createPackageTar(pyodide, newEntries);
    writePackagesToIDB(tarball);
  }

  // Pre-warm Python imports so the first RENDER doesn't pay module-load overhead.
  await pyodide.runPythonAsync(PREWARM_IMPORTS);
}

self.onmessage = async (event: MessageEvent<{ id: number; type: string; payload?: unknown }>) => {
  const { id, type, payload } = event.data;

  try {
    switch (type) {
      case 'INIT':
        await initialize();
        self.postMessage({ id, type: 'INIT_SUCCESS' });
        break;
      case 'RENDER': {
        const sections = payload as {
          cv: string;
          design: string;
          locale: string;
          settings: string;
        };
        for (const key of ['cv', 'design', 'locale', 'settings'] as const) {
          pyodide.globals.set(`yaml_input_${key}`, sections[key]);
        }
        self.postMessage({
          id,
          type: 'RENDER_SUCCESS',
          payload: (await pyodide.runPythonAsync(yamlToTypstPy)).toJs()
        });
        break;
      }
    }
  } catch (error) {
    self.postMessage({
      id,
      type: 'ERROR',
      payload:
        error instanceof Error
          ? { message: error.message, name: error.name, stack: error.stack }
          : { message: String(error), name: 'Error', stack: undefined }
    });
  }
};
