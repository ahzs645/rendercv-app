import YAML from 'yaml';

/**
 * Header photo support for the browser renderer.
 *
 * RenderCV resolves `cv.photo` to a file on disk and its Typst header emits
 * `image("<file name>")`. Neither half works in the browser as shipped: its
 * URL support downloads with `urllib`, which Pyodide cannot do, and the Typst
 * compiler is handed a bare source string with no file system behind it.
 *
 * So the worker resolves the photo itself — decoding a `data:` URI or fetching
 * a URL — writes the bytes where RenderCV's validation can see them, and hands
 * the same bytes to the Typst compiler as a shadow file.
 */

/** Stem for the file both RenderCV and Typst read the photo from. */
const PHOTO_FILE_STEM = 'rendercv-photo';

/** Photos are held in memory and copied between two workers. */
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg'
};

const SUPPORTED_EXTENSIONS = new Set(Object.values(EXTENSION_BY_MIME_TYPE));

export interface ResolvedPhoto {
  /** File name RenderCV reads, relative to the Pyodide working directory. */
  fileName: string;
  /** Absolute path the rewritten Typst source reads. */
  typstPath: string;
  bytes: Uint8Array;
}

function photoNames(extension: string) {
  const fileName = `${PHOTO_FILE_STEM}.${extension}`;
  return { fileName, typstPath: `/${fileName}` };
}

function extensionFromMimeType(mimeType: string | null | undefined) {
  if (!mimeType) {
    return undefined;
  }

  return EXTENSION_BY_MIME_TYPE[mimeType.split(';')[0].trim().toLowerCase()];
}

function extensionFromPath(path: string) {
  const extension = path.split('.').pop()?.toLowerCase();
  if (!extension) {
    return undefined;
  }

  const normalized = extension === 'jpeg' ? 'jpg' : extension;
  return SUPPORTED_EXTENSIONS.has(normalized) ? normalized : undefined;
}

export function isPhotoDataUri(source: string) {
  return /^data:/i.test(source.trim());
}

export function isPhotoUrl(source: string) {
  return /^https?:\/\//i.test(source.trim());
}

/** The photo value the renderer has to resolve, or null if there is nothing to do. */
export function readPhotoSource(cvYaml: string) {
  let parsed: unknown;
  try {
    parsed = YAML.parse(cvYaml);
  } catch {
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return null;
  }

  const cv = (parsed as { cv?: unknown }).cv;
  if (typeof cv !== 'object' || cv === null) {
    return null;
  }

  const photo = (cv as { photo?: unknown }).photo;
  if (typeof photo !== 'string') {
    return null;
  }

  const source = photo.trim();
  if (!source || !(isPhotoDataUri(source) || isPhotoUrl(source))) {
    // A plain path is left alone so RenderCV reports it as missing itself.
    return null;
  }

  return source;
}

export function decodePhotoDataUri(source: string): ResolvedPhoto {
  const match = /^data:([^;,]*)(;[^,]*)?,(.*)$/is.exec(source.trim());
  if (!match) {
    throw new Error('The photo data URI could not be parsed.');
  }

  const [, mimeType, parameters, data] = match;
  const extension = extensionFromMimeType(mimeType) ?? 'jpg';

  let bytes: Uint8Array;
  if (/;base64/i.test(parameters ?? '')) {
    const binary = atob(data.replace(/\s+/g, ''));
    bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } else {
    bytes = new TextEncoder().encode(decodeURIComponent(data));
  }

  if (bytes.byteLength > MAX_PHOTO_BYTES) {
    throw new Error(`The photo is larger than the ${MAX_PHOTO_BYTES / 1024 / 1024} MB limit.`);
  }

  return { ...photoNames(extension), bytes };
}

export async function fetchPhoto(source: string): Promise<ResolvedPhoto> {
  const response = await fetch(source);
  if (!response.ok) {
    throw new Error(`The photo could not be downloaded (HTTP ${response.status}).`);
  }

  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > MAX_PHOTO_BYTES) {
    throw new Error(`The photo is larger than the ${MAX_PHOTO_BYTES / 1024 / 1024} MB limit.`);
  }

  const extension =
    extensionFromMimeType(response.headers.get('content-type')) ??
    extensionFromPath(new URL(source).pathname) ??
    'jpg';

  return { ...photoNames(extension), bytes: new Uint8Array(buffer) };
}

/** Point `cv.photo` at the file the worker wrote, so RenderCV can validate it. */
export function withResolvedPhotoPath(cvYaml: string, fileName: string) {
  const parsed = YAML.parse(cvYaml) as { cv?: Record<string, unknown> };
  if (typeof parsed?.cv !== 'object' || parsed.cv === null) {
    return cvYaml;
  }

  parsed.cv.photo = fileName;
  return YAML.stringify(parsed);
}

/**
 * Make the header's `image()` call absolute.
 *
 * RenderCV emits the photo's bare file name, which Typst resolves relative to
 * whatever path the compiler happened to store the source under. Rewriting it
 * to an absolute path lets the shadow file be mapped at a known location.
 */
export function withAbsolutePhotoPath(typstContent: string, photo: ResolvedPhoto) {
  return typstContent.replaceAll(`image("${photo.fileName}"`, `image("${photo.typstPath}"`);
}
