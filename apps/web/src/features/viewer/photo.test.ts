import { describe, expect, it } from 'vitest';
import YAML from 'yaml';
import {
  decodePhotoDataUri,
  isPhotoDataUri,
  isPhotoUrl,
  readPhotoSource,
  withAbsolutePhotoPath,
  withResolvedPhotoPath
} from './photo';

// 1x1 transparent GIF.
const GIF_BASE64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const GIF_DATA_URI = `data:image/gif;base64,${GIF_BASE64}`;

function cvYaml(photo?: string) {
  return YAML.stringify({ cv: { name: '김윤서', ...(photo === undefined ? {} : { photo }) } });
}

describe('reading the photo source', () => {
  it('picks up data URIs and http(s) URLs', () => {
    expect(readPhotoSource(cvYaml(GIF_DATA_URI))).toBe(GIF_DATA_URI);
    expect(readPhotoSource(cvYaml('https://example.com/me.png'))).toBe('https://example.com/me.png');
  });

  it('leaves a plain path alone so RenderCV reports it itself', () => {
    expect(readPhotoSource(cvYaml('photo.jpg'))).toBeNull();
    expect(readPhotoSource(cvYaml(''))).toBeNull();
    expect(readPhotoSource(cvYaml())).toBeNull();
  });

  it('survives a CV that is not parseable or has no cv mapping', () => {
    expect(readPhotoSource('cv: [oops')).toBeNull();
    expect(readPhotoSource('design:\n  theme: classic\n')).toBeNull();
  });

  it('classifies sources', () => {
    expect(isPhotoDataUri(GIF_DATA_URI)).toBe(true);
    expect(isPhotoDataUri('https://example.com/me.png')).toBe(false);
    expect(isPhotoUrl('https://example.com/me.png')).toBe(true);
    expect(isPhotoUrl('photo.jpg')).toBe(false);
  });
});

describe('decoding a data URI', () => {
  it('decodes base64 and names the file from the media type', () => {
    const photo = decodePhotoDataUri(GIF_DATA_URI);

    expect(photo.fileName).toBe('rendercv-photo.gif');
    expect(photo.typstPath).toBe('/rendercv-photo.gif');
    // GIF89a
    expect(Array.from(photo.bytes.slice(0, 6))).toEqual([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
  });

  it('falls back to jpg for an unrecognised media type', () => {
    expect(decodePhotoDataUri('data:application/octet-stream;base64,AAAA').fileName).toBe(
      'rendercv-photo.jpg'
    );
  });

  it('rejects something that is not a data URI', () => {
    expect(() => decodePhotoDataUri('https://example.com/me.png')).toThrow('could not be parsed');
  });
});

describe('handing the photo to RenderCV and Typst', () => {
  it('replaces the photo value with the file the worker wrote', () => {
    const rewritten = withResolvedPhotoPath(cvYaml(GIF_DATA_URI), 'rendercv-photo.gif');

    expect(YAML.parse(rewritten).cv.photo).toBe('rendercv-photo.gif');
    expect(YAML.parse(rewritten).cv.name).toBe('김윤서');
  });

  it('makes the header image path absolute so it matches the shadow file', () => {
    const photo = decodePhotoDataUri(GIF_DATA_URI);
    const typst = '#pad(left: 0.4cm, image("rendercv-photo.gif", width: 3.5cm))';

    expect(withAbsolutePhotoPath(typst, photo)).toBe(
      '#pad(left: 0.4cm, image("/rendercv-photo.gif", width: 3.5cm))'
    );
  });
});
