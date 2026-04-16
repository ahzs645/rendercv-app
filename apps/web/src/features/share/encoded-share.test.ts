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
});
