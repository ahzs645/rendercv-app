import yamlToTypstPy from './yaml_to_typst';

interface WorkerErrorPayload {
  message: string;
  name: string;
  stack?: string;
}

interface StoredCustomTheme {
  archiveName: string;
  bytes: Uint8Array;
  themeName: string;
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
const CUSTOM_THEMES_KEY = 'custom-themes';
const CUSTOM_THEME_MISSING_PATTERN = /The custom theme folder .* does not exist\./;
const YAML_TO_TYPST_RENDER_RESULT = `${yamlToTypstPy}
import json
json.dumps({
  "content": result.get("content") if isinstance(result, dict) else None,
  "errors": result.get("errors") if isinstance(result, dict) else None,
  "normalized_cv": result.get("normalized_cv") if isinstance(result, dict) else globals().get("normalized_yaml_input_cv", None),
})
`;
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
    tar.extractall(sp, filter='data')
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

async function registerCustomThemeArchive(
  instance: PyodideLike,
  archiveName: string,
  archiveBytes: Uint8Array
): Promise<{ themeName: string }> {
  instance.globals.set('_custom_theme_bytes', ensureUint8Array(archiveBytes));
  instance.globals.set('_custom_theme_archive_name', archiveName);

  const result = (await instance.runPythonAsync(`
import importlib.util, io, pathlib, re, shutil, sys, zipfile

COMPATIBILITY_REPLACEMENTS = {
    "design-entries-vertical-space-between-entries": "design_entries_vertical_space_between_entries",
}

MULTILINE_COMPATIBILITY_REPLACEMENTS = {
    '#text(\\n  size: 26pt,\\n  weight: "bold",\\n  "{{ cv.name }}"\\n)': '#text(size: 26pt, weight: "bold")[{{ cv.name }}]',
    '''        heading(
          level: 1,
          outlined: true,
          bookmarked: true,
          text(
            size: {{ design.section_heading_size }},
            weight: "bold",
            upper(title)
          )
        )''': '''        heading(
          level: 1,
          outlined: true,
          bookmarked: true,
        )[ #text(size: {{ design.section_heading_size }}, weight: "bold")[#upper(title)] ]''',
    '''    heading(
      level: 1,
      outlined: true,
      bookmarked: true,
      text(
        size: {{ design.section_heading_size }},
        weight: "bold",
        upper(title)
      )
    )''': '''    heading(
      level: 1,
      outlined: true,
      bookmarked: true,
    )[ #text(size: {{ design.section_heading_size }}, weight: "bold")[#upper(title)] ]''',
}

TEXT_WITH_TEMPLATE_ARGUMENT_PATTERN = re.compile(
    r'(?P<prefix>\\b#?text)\\((?P<args>.+?),\\s*"(?P<expr>\\{\\{.*\\}\\})"\\)'
)
TEXT_WITH_ONLY_TEMPLATE_ARGUMENT_PATTERN = re.compile(
    r'(?P<prefix>\\b#?text)\\(\\s*"(?P<expr>\\{\\{.*\\}\\})"\\s*\\)'
)

def normalize_typst_template(text):
    original_had_trailing_newline = text.endswith("\\n")

    for source_text, target_text in COMPATIBILITY_REPLACEMENTS.items():
        text = text.replace(source_text, target_text)

    for source_text, target_text in MULTILINE_COMPATIBILITY_REPLACEMENTS.items():
        text = text.replace(source_text, target_text)

    normalized_lines = []
    for line in text.splitlines():
        if "{{" in line and "text(" in line and "{{ cv." not in line:
            line = TEXT_WITH_TEMPLATE_ARGUMENT_PATTERN.sub(
                r'\\g<prefix>(\\g<args>)[\\g<expr>]',
                line,
            )
            line = TEXT_WITH_ONLY_TEMPLATE_ARGUMENT_PATTERN.sub(
                r'[\\g<expr>]',
                line,
            )
        normalized_lines.append(line)

    text = "\\n".join(normalized_lines)
    if original_had_trailing_newline:
        return text + "\\n"

    return text


archive_name = _custom_theme_archive_name
archive_bytes = bytes(_custom_theme_bytes.to_py())
pyodide_root = pathlib.Path("/home/pyodide")
legacy_base_dir = pyodide_root / "custom_themes"
legacy_base_dir.mkdir(parents=True, exist_ok=True)

with zipfile.ZipFile(io.BytesIO(archive_bytes)) as archive:
    package_dir = None
    theme_name = None

    for name in archive.namelist():
        if not name.endswith("__init__.py"):
            continue

        text = archive.read(name).decode("utf-8", errors="ignore")
        match = re.search(r'Literal\\["([^"]+)"\\]', text)
        if match:
            package_dir = name.rsplit("/", 1)[0]
            theme_name = match.group(1)
            break

    if package_dir is None or theme_name is None:
        raise RuntimeError(
            "Could not find a RenderCV theme package in the uploaded archive. "
            "Expected a package with __init__.py declaring theme: Literal[\\\"...\\\"]."
        )

    custom_theme_folder = pyodide_root / theme_name
    legacy_theme_folder = legacy_base_dir / theme_name
    if custom_theme_folder.exists():
        shutil.rmtree(custom_theme_folder)
    if legacy_theme_folder.exists():
        shutil.rmtree(legacy_theme_folder)

    custom_theme_folder.mkdir(parents=True, exist_ok=True)
    package_path = pathlib.PurePosixPath(package_dir)

    for info in archive.infolist():
        archive_path = pathlib.PurePosixPath(info.filename)
        try:
            relative_path = archive_path.relative_to(package_path)
        except ValueError:
            continue

        if not relative_path.parts:
            continue

        destination = custom_theme_folder.joinpath(*relative_path.parts)
        if info.is_dir():
            destination.mkdir(parents=True, exist_ok=True)
            continue

        destination.parent.mkdir(parents=True, exist_ok=True)
        file_bytes = archive.read(info)
        if destination.suffix == ".typ":
            try:
                file_text = file_bytes.decode("utf-8")
            except UnicodeDecodeError:
                pass
            else:
                file_text = normalize_typst_template(file_text)
                file_bytes = file_text.encode("utf-8")

        with open(destination, "wb") as target:
            target.write(file_bytes)

    pyodide_root_str = str(pyodide_root)
    if pyodide_root_str not in sys.path:
        sys.path.insert(0, pyodide_root_str)

    init_file = custom_theme_folder / "__init__.py"
    spec = importlib.util.spec_from_file_location(theme_name, init_file)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Failed to load custom theme from {init_file}")

    theme_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(theme_module)
    result = {"themeName": theme_name}

del _custom_theme_archive_name
del _custom_theme_bytes
result
  `)).toJs() as { themeName: string };

  return result;
}

async function restoreCustomThemes(instance: PyodideLike) {
  try {
    const db = await openIDB();
    const themes = (await idbGet<StoredCustomTheme[]>(db, CUSTOM_THEMES_KEY)) ?? [];
    db.close();

    for (const theme of themes) {
      await registerCustomThemeArchive(instance, theme.archiveName, ensureUint8Array(theme.bytes));
    }
  } catch {
    // Ignore theme restore failures and let render-time validation surface issues.
  }
}

async function persistCustomTheme(theme: StoredCustomTheme) {
  const db = await openIDB();
  const existing = (await idbGet<StoredCustomTheme[]>(db, CUSTOM_THEMES_KEY)) ?? [];
  const next = existing.filter((entry) => entry.themeName !== theme.themeName);
  next.push({ ...theme, bytes: ensureUint8Array(theme.bytes) });
  await idbPut(db, CUSTOM_THEMES_KEY, next);
  db.close();
}

function ensureUint8Array(value: Uint8Array | ArrayBuffer | { buffer?: ArrayBufferLike } | number[]) {
  if (value instanceof Uint8Array) {
    return value;
  }

  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }

  if (Array.isArray(value)) {
    return new Uint8Array(value);
  }

  if (value && typeof value === 'object' && 'buffer' in value && value.buffer instanceof ArrayBuffer) {
    return new Uint8Array(value.buffer);
  }

  return new Uint8Array();
}

function toJsValue<T>(value: T | { toJs: () => T }) {
  if (value && typeof value === 'object' && 'toJs' in value && typeof value.toJs === 'function') {
    return value.toJs();
  }

  return value as T;
}

function setYamlInputGlobals(sections: {
  cv: string;
  design: string;
  locale: string;
  settings: string;
}) {
  for (const key of ['cv', 'design', 'locale', 'settings'] as const) {
    pyodide.globals.set(`yaml_input_${key}`, sections[key]);
  }
}

async function renderSectionsWithFallback(sections: {
  cv: string;
  design: string;
  locale: string;
  settings: string;
}) {
  setYamlInputGlobals(sections);

  const firstResult = JSON.parse(toJsValue(await pyodide.runPythonAsync(YAML_TO_TYPST_RENDER_RESULT)) as string) as {
    content: string | null;
    errors: Array<{ message?: string; yaml_source?: string }> | null;
    normalized_cv?: string | null;
  };
  if (import.meta.env.DEV) {
    console.log('[RenderCV worker] first render result', {
      keys: Object.keys(firstResult ?? {}),
      hasNormalizedCvInResult: typeof firstResult.normalized_cv === 'string',
      normalizedCvFromResultLength: firstResult.normalized_cv?.length ?? null,
      normalizedCvFromGlobalsLength: null,
      errorCount: firstResult.errors?.length ?? 0
    });
  }

  const hasMissingCustomThemeError = firstResult.errors?.some(
    (error) =>
      error?.yaml_source === 'design_yaml_file' &&
      typeof error.message === 'string' &&
      CUSTOM_THEME_MISSING_PATTERN.test(error.message)
  );

  if (!hasMissingCustomThemeError) {
    return {
      ...firstResult,
      normalizedCv: firstResult.normalized_cv ?? null,
      effectiveDesign: sections.design,
      usedFallbackTheme: false
    };
  }

  const fallbackDesign = sections.design.replace(
    /^(\s*theme\s*:\s*).+$/m,
    '$1classic'
  );

  if (fallbackDesign === sections.design) {
    return {
      ...firstResult,
      normalizedCv: firstResult.normalized_cv ?? null,
      effectiveDesign: sections.design,
      usedFallbackTheme: false
    };
  }

  pyodide.globals.set('yaml_input_design', fallbackDesign);
  const fallbackResult = JSON.parse(toJsValue(await pyodide.runPythonAsync(YAML_TO_TYPST_RENDER_RESULT)) as string) as {
    content: string | null;
    errors: Array<{ message?: string; yaml_source?: string }> | null;
    normalized_cv?: string | null;
  };
  if (import.meta.env.DEV) {
    console.log('[RenderCV worker] fallback render result', {
      keys: Object.keys(fallbackResult ?? {}),
      hasNormalizedCvInResult: typeof fallbackResult.normalized_cv === 'string',
      normalizedCvFromResultLength: fallbackResult.normalized_cv?.length ?? null,
      normalizedCvFromGlobalsLength: null,
      errorCount: fallbackResult.errors?.length ?? 0
    });
  }
  return {
    ...fallbackResult,
    normalizedCv: fallbackResult.normalized_cv ?? firstResult.normalized_cv ?? null,
    effectiveDesign: fallbackDesign,
    usedFallbackTheme: true
  };
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

  await restoreCustomThemes(pyodide);
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
        self.postMessage({
          id,
          type: 'RENDER_SUCCESS',
          payload: await renderSectionsWithFallback(sections)
        });
        break;
      }
      case 'IMPORT_THEME_ARCHIVE': {
        const themePayload = payload as { archiveName: string; bytes: Uint8Array | ArrayBuffer };
        const result = await registerCustomThemeArchive(
          pyodide,
          themePayload.archiveName,
          ensureUint8Array(themePayload.bytes)
        );
        await persistCustomTheme({
          archiveName: themePayload.archiveName,
          bytes: ensureUint8Array(themePayload.bytes),
          themeName: result.themeName
        });
        self.postMessage({
          id,
          type: 'IMPORT_THEME_ARCHIVE_SUCCESS',
          payload: result
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
