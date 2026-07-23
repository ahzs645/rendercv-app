import type { CvFileSections } from '@rendercv/contracts';

const MAX_REMOTE_YAML_SIZE = 1024 * 1024;

/**
 * Builds a share link that reopens a hosted CV through the `?url=` loader, e.g.
 * `https://app.example.com/?url=https%3A%2F%2Fhost%2FCV.yaml`. When the file's
 * variants also came from a URL, the link carries `&variants=` so the recipient
 * gets the identical experience.
 */
export function buildSourceShareUrl(sourceUrl: string, variantsSourceUrl?: string): string {
  const url = new URL(import.meta.env.BASE_URL, window.location.origin);
  url.searchParams.set('url', sourceUrl);
  if (variantsSourceUrl) {
    url.searchParams.set('variants', variantsSourceUrl);
  }
  return url.toString();
}

/** True when two section snapshots are byte-for-byte identical. */
export function sectionsMatch(a: CvFileSections, b: CvFileSections): boolean {
  return (
    a.cv === b.cv &&
    a.design === b.design &&
    a.locale === b.locale &&
    a.settings === b.settings
  );
}

/**
 * Derives a friendly file name from a remote YAML URL, e.g.
 * `https://www.julianstokes.ca/CV.yaml` -> `CV`.
 */
export function deriveName(url: string, fallback: string): string {
  try {
    const { pathname } = new URL(url);
    const base = pathname.split('/').pop() ?? '';
    const name = base.replace(/\.ya?ml$/i, '').trim();
    return name || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Normalizes a pasted link into a fetchable URL. Adds an https:// scheme when
 * the user omits it (e.g. `www.julianstokes.ca/CV.yaml`). Throws if the result
 * is still not a valid http(s) URL.
 */
export function normalizeCvUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('Enter a link to a YAML file.');
  }

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new Error('That does not look like a valid link.');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only http(s) links are supported.');
  }

  return url.toString();
}

export async function fetchYamlText(url: string, label: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(url, { headers: { Accept: 'text/yaml, text/plain, */*' } });
  } catch {
    // Network errors here are almost always CORS: the browser blocks the read
    // because the host did not return Access-Control-Allow-Origin.
    throw new Error(
      `Could not reach ${label}. The host may block cross-origin requests (CORS).`
    );
  }

  if (!response.ok) {
    throw new Error(`Failed to load ${label} (HTTP ${response.status}).`);
  }

  const size = Number(response.headers.get('content-length') ?? '0');
  if (size > MAX_REMOTE_YAML_SIZE) {
    throw new Error(`${label} is too large (max 1 MB).`);
  }

  const text = await response.text();
  if (!text.trim()) {
    throw new Error(`${label} is empty.`);
  }

  return text;
}

/**
 * Fetches a remote CV YAML and hands it to the existing file-import flow as a
 * File, so URL imports and file/drag imports share the same validation path.
 */
export async function importCvFromUrl(
  rawUrl: string,
  importYamlFile: (file: File, source?: { url: string }) => Promise<void>
): Promise<void> {
  const url = normalizeCvUrl(rawUrl);
  const cvText = await fetchYamlText(url, 'resume');
  const cvFile = new File([cvText], `${deriveName(url, 'CV')}.yaml`, { type: 'text/yaml' });
  await importYamlFile(cvFile, { url });
}
