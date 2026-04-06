import createWebShareEngine from '@firstform/json-url/web-share';
import type { CvFileSections } from '@rendercv/contracts';

export interface EncodedSharePayload {
  version: 1;
  fileName: string;
  sections: CvFileSections;
  /** Original sections before the recipient edited — present when sharing back changes. */
  origin?: CvFileSections;
}

const SHARE_LINK_MAX_LENGTH = 24000;

const shareEngine = createWebShareEngine<EncodedSharePayload>({
  maxLength: SHARE_LINK_MAX_LENGTH
});

export async function encodeSharePayload(payload: EncodedSharePayload) {
  return await shareEngine.compress(payload);
}

export async function decodeSharePayload(token: string) {
  return await shareEngine.decompress(token, { deURI: true });
}

export interface BuildShareUrlResult {
  url: string;
  /** True when the origin was dropped to fit within the URL size limit. */
  originDropped: boolean;
}

export async function buildEncodedShareUrl(payload: EncodedSharePayload): Promise<BuildShareUrlResult> {
  // Try with full payload (including origin)
  try {
    const token = await encodeSharePayload(payload);
    const url = new URL(`${import.meta.env.BASE_URL}share`, window.location.origin);
    url.hash = token;
    const full = url.toString();

    if (full.length <= SHARE_LINK_MAX_LENGTH) {
      return { url: full, originDropped: false };
    }
  } catch {
    // compression failed with origin, fall through to retry without
  }

  // Retry without origin if it was present
  if (payload.origin) {
    const { origin: _, ...withoutOrigin } = payload;
    const token = await encodeSharePayload(withoutOrigin as EncodedSharePayload);
    const url = new URL(`${import.meta.env.BASE_URL}share`, window.location.origin);
    url.hash = token;
    return { url: url.toString(), originDropped: true };
  }

  // No origin to drop — build normally
  const token = await encodeSharePayload(payload);
  const url = new URL(`${import.meta.env.BASE_URL}share`, window.location.origin);
  url.hash = token;
  return { url: url.toString(), originDropped: false };
}

export async function buildEncodedSharePdfUrl(payload: EncodedSharePayload) {
  const { origin: _, ...withoutOrigin } = payload;
  const token = await encodeSharePayload(withoutOrigin as EncodedSharePayload);
  const url = new URL(`${import.meta.env.BASE_URL}share`, window.location.origin);
  url.searchParams.set('dl', 'pdf');
  url.hash = token;
  return url.toString();
}
