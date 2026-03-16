import createWebShareEngine from '@firstform/json-url/web-share';
import type { CvFileSections } from '@rendercv/contracts';

export interface EncodedSharePayload {
  version: 1;
  fileName: string;
  sections: CvFileSections;
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

export async function buildEncodedShareUrl(payload: EncodedSharePayload) {
  const token = await encodeSharePayload(payload);
  const url = new URL(`${import.meta.env.BASE_URL}share`, window.location.origin);
  url.hash = token;
  return url.toString();
}
