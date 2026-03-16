export function assetUrl(path: string, base = '/'): string {
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return new URL(normalizedPath, `https://rendercv.local${normalizedBase}`).pathname;
}
