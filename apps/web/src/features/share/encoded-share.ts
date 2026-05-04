import createWebShareEngine from '@firstform/json-url/web-share';
import type { CvFileSections } from '@rendercv/contracts';

export interface EncodedSharePayload {
  version: 1;
  fileName: string;
  sections: CvFileSections;
  origin?: CvFileSections;
}

export type DecodedSharePayload = EncodedSharePayload;

const SHARE_LINK_MAX_LENGTH = 24000;

const shareEngine = createWebShareEngine<EncodedSharePayload>({
  maxLength: SHARE_LINK_MAX_LENGTH
});

export async function encodeSharePayload(payload: EncodedSharePayload) {
  return await shareEngine.compress(payload);
}

export async function decodeSharePayload(token: string): Promise<DecodedSharePayload> {
  return validateSharePayload(await shareEngine.decompress(token, { deURI: true }));
}

export interface BuildShareUrlResult {
  url: string;
}

export async function buildEncodedShareUrl(payload: EncodedSharePayload): Promise<BuildShareUrlResult> {
  const token = await encodeSharePayload(payload);
  const url = new URL(`${import.meta.env.BASE_URL}share`, window.location.origin);
  url.hash = token;
  const full = url.toString();

  if (full.length > SHARE_LINK_MAX_LENGTH) {
    throw new Error('Resume is too large to fit in a clean share link.');
  }

  return { url: full };
}

export async function buildEncodedSharePdfUrl(payload: EncodedSharePayload) {
  const token = await encodeSharePayload(payload);
  const url = new URL(`${import.meta.env.BASE_URL}share`, window.location.origin);
  url.searchParams.set('dl', 'pdf');
  url.hash = token;
  return url.toString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSections(value: unknown): value is CvFileSections {
  return (
    isRecord(value) &&
    typeof value.cv === 'string' &&
    typeof value.design === 'string' &&
    typeof value.locale === 'string' &&
    typeof value.settings === 'string'
  );
}

export function validateSharePayload(value: unknown): DecodedSharePayload {
  if (!isRecord(value)) {
    throw new Error('Invalid share payload.');
  }

  if (value.version !== 1 || typeof value.fileName !== 'string' || !isSections(value.sections)) {
    throw new Error('Invalid share payload.');
  }

  if (value.origin !== undefined && !isSections(value.origin)) {
    throw new Error('Invalid share payload.');
  }

  return {
    version: 1,
    fileName: value.fileName,
    sections: value.sections,
    ...(value.origin ? { origin: value.origin } : {})
  };
}
