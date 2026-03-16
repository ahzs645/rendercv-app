import yamlToTypstPy from './yaml_to_typst';

interface WorkerErrorPayload {
  message: string;
  name: string;
  stack?: string;
}

type LoadPyodide = (options: { indexURL: string }) => Promise<PyodideLike>;

type PyodideLike = {
  globals: {
    set: (name: string, value: unknown) => void;
    get: (name: string) => { toJs: () => Uint8Array };
    delete: (name: string) => void;
  };
  loadPackage: (packages: string[]) => Promise<void>;
  pyimport: (name: string) => { install: (packages: string[]) => Promise<void> };
  runPython: (code: string) => { toJs: () => string[] };
  runPythonAsync: (code: string) => Promise<{ toJs: () => unknown }>;
  toPy: (value: unknown) => unknown;
};

let pyodide!: PyodideLike;
let loadPyodideFn: LoadPyodide | null = null;

const PREWARM_IMPORTS = `
from rendercv.schema.rendercv_model_builder import build_rendercv_dictionary_and_model, BuildRendercvModelArguments
from rendercv.renderer.templater.templater import render_full_template
from rendercv.exception import RenderCVUserValidationError
from dataclasses import asdict
`;

const PKG_CACHE_VERSION = 'rendercv-2.7-pyodide-0.29.3-v2';
const IDB_DB_NAME = 'pyodide-pkg-cache';
const IDB_STORE = 'packages';
const BASE_URL = import.meta.env.BASE_URL;

function assetUrl(path: string) {
  return new URL(`${BASE_URL}${path}`, self.location.origin).toString();
}

async function getLoadPyodide(): Promise<LoadPyodide> {
  if (loadPyodideFn) return loadPyodideFn;
  const response = await fetch(assetUrl('cdn/pyodide/v0.29.3/full/pyodide.js'));
  const text = await response.text();
  (0, eval)(text);
  loadPyodideFn = (globalThis as { loadPyodide?: LoadPyodide }).loadPyodide ?? null;
  if (!loadPyodideFn) {
    throw new Error('loadPyodide was not registered on the worker global scope.');
  }
  return loadPyodideFn;
}

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
    };
    request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
    request.onerror = () => reject(request.error);
  });
}

function idbGet<T>(db: IDBDatabase, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const request = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(key);
    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(request.error);
  });
}

function idbPut(db: IDBDatabase, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = db.transaction(IDB_STORE, 'readwrite').objectStore(IDB_STORE).put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function tryRestorePackages(instance: PyodideLike): Promise<boolean> {
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

    instance.globals.set('_cache_bytes', tarball);
    await instance.runPythonAsync(`
import tarfile, io, sysconfig
sp = sysconfig.get_path('purelib')
with tarfile.open(fileobj=io.BytesIO(bytes(_cache_bytes.to_py())), mode='r') as tar:
    tar.extractall(sp)
del _cache_bytes
`);
    return true;
  } catch {
    return false;
  }
}

async function createPackageTar(instance: PyodideLike, newEntries: string[]): Promise<Uint8Array> {
  instance.globals.set('_new_entries', instance.toPy(newEntries));
  await instance.runPythonAsync(`
import tarfile, io, os, sysconfig
sp = sysconfig.get_path('purelib')
buf = io.BytesIO()
with tarfile.open(fileobj=buf, mode='w') as tar:
    for name in _new_entries:
        path = f'{sp}/{name}'
        if os.path.exists(path):
            tar.add(path, arcname=name)
del _new_entries
_tarball_bytes = buf.getvalue()
`);
  const tarball = instance.globals.get('_tarball_bytes').toJs();
  instance.globals.delete('_tarball_bytes');
  return tarball;
}

async function writePackagesToIDB(tarball: Uint8Array) {
  const db = await openIDB();
  await idbPut(db, 'tarball', tarball);
  await idbPut(db, 'version', PKG_CACHE_VERSION);
  db.close();
}

async function initialize() {
  const loadPyodide = await getLoadPyodide();
  pyodide = await loadPyodide({
    indexURL: assetUrl('cdn/pyodide/v0.29.3/full/')
  });

  await pyodide.loadPackage(['micropip', 'typing-inspection']);
  const micropip = pyodide.pyimport('micropip');
  const restored = await tryRestorePackages(pyodide);

  if (!restored) {
    const beforeEntries = new Set<string>(
      pyodide
        .runPython("import os, sysconfig; list(os.listdir(sysconfig.get_path('purelib')))")
        .toJs()
    );

    await micropip.install([
      assetUrl('cdn/pypi-wheels/dnspython-2.8.0-py3-none-any.whl'),
      assetUrl('cdn/pypi-wheels/email_validator-2.3.0-py3-none-any.whl'),
      assetUrl('rendercv-2.7-py3-none-any.whl'),
      assetUrl('cdn/pypi-wheels/phonenumbers-9.0.26-py2.py3-none-any.whl'),
      assetUrl('cdn/pypi-wheels/markdown-3.10.2-py3-none-any.whl'),
      assetUrl('cdn/pypi-wheels/pydantic_extra_types-2.11.0-py3-none-any.whl'),
      assetUrl('cdn/pypi-wheels/ruamel_yaml-0.19.1-py3-none-any.whl')
    ]);

    const afterEntries = new Set<string>(
      pyodide
        .runPython("import os, sysconfig; list(os.listdir(sysconfig.get_path('purelib')))")
        .toJs()
    );
    const newEntries = [...afterEntries].filter((entry) => !beforeEntries.has(entry));
    const tarball = await createPackageTar(pyodide, newEntries);
    void writePackagesToIDB(tarball);
  }

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
    const payload =
      error instanceof Error
        ? { message: error.message, name: error.name, stack: error.stack }
        : ({ message: String(error), name: 'Error', stack: undefined } satisfies WorkerErrorPayload);

    self.postMessage({
      id,
      type: 'ERROR',
      payload
    });
  }
};
