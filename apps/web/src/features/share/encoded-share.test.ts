import { describe, expect, it } from 'vitest';
import type { CvFileSections } from '@rendercv/contracts';
import {
  buildEncodedShareUrl,
  decodeSharePayload,
  encodeSharePayload
} from './encoded-share';

function makeSections(overrides?: Partial<CvFileSections>): CvFileSections {
  return {
    cv: 'cv:\n  name: John Doe\n  label: Developer',
    design: 'design:\n  theme: classic',
    locale: 'locale:\n  language: english',
    settings: 'settings:\n  pdf_size: a4',
    ...overrides
  };
}

describe('encoded share links', () => {
  it('round-trip clean share payloads without review metadata', async () => {
    const payload = {
      version: 1 as const,
      fileName: 'Resume',
      sections: makeSections()
    };

    const token = await encodeSharePayload(payload);
    const decoded = await decodeSharePayload(token);

    expect(decoded).toEqual(payload);
    expect(Object.prototype.hasOwnProperty.call(decoded, 'origin')).toBe(false);
  });

  it('builds clean share links under the share route', async () => {
    const result = await buildEncodedShareUrl({
      version: 1,
      fileName: 'Resume',
      sections: makeSections()
    });

    expect(result.url).toContain('/share#');
  });

  it('round-trips review share payloads with origin sections', async () => {
    const origin = makeSections();
    const payload = {
      version: 1 as const,
      fileName: 'Resume',
      sections: makeSections({ cv: 'cv:\n  name: Reviewer Draft' }),
      origin
    };

    const token = await encodeSharePayload(payload);
    const decoded = await decodeSharePayload(token);

    expect(decoded).toEqual(payload);
  });

  it('rejects decoded payloads with invalid section shapes', async () => {
    const token = await encodeSharePayload({
      version: 1,
      fileName: 'Resume',
      sections: makeSections()
    });

    const decoded = JSON.parse(JSON.stringify(await decodeSharePayload(token))) as Record<string, unknown>;
    decoded.sections = { cv: 'cv:' };

    await expect(decodeSharePayload(await encodeSharePayload(decoded as never))).rejects.toThrow(
      'Invalid share payload.'
    );
  });
});
