import { describe, expect, it } from 'vitest';
import { assetUrl } from './url';

describe('assetUrl', () => {
  it('joins relative paths under the provided base path', () => {
    expect(assetUrl('cdn/pyodide/v0.29.3/full/pyodide.js', '/rendercv-app/')).toBe(
      '/rendercv-app/cdn/pyodide/v0.29.3/full/pyodide.js'
    );
  });

  it('normalizes leading slashes on the asset path', () => {
    expect(assetUrl('/favicon.ico', '/rendercv-app/')).toBe('/rendercv-app/favicon.ico');
  });
});
