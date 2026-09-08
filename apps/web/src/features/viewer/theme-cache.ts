/** Uploaded archives have no normalization suffix; bundled caches must match this build. */
export function isCurrentThemeCache(
  archiveName: string,
  currentArchives: readonly string[],
  normalizationVersion: string
): boolean {
  if (!archiveName.includes(':theme-normalization-')) return true;
  return currentArchives.some((name) => archiveName === `${name}:${normalizationVersion}`);
}
