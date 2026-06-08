/**
 * Content-aware "Fit to page".
 *
 * Instead of changing formatting, this selects *which entries to keep* so the
 * resume fits a target page count. Each entry carries a section weight; lower
 * weighted entries (and, within a section, the bottom-most ones) are dropped
 * first. "Pinned" entries are never dropped.
 *
 * Fitting is non-destructive: the result is a set of entry fingerprints to hide
 * from the render (see `filterHiddenEntriesFromCvYaml`), never a CV edit.
 *
 * RenderCV renders a real typeset PDF, so we verify each candidate with an
 * actual render rather than estimating. A monotonic binary search over the
 * "drop list" keeps that to ~log2(n) renders.
 */

export interface FitEntry {
  sectionKey: string;
  fingerprint: string;
  /** Index within its section (0 = top). */
  position: number;
  /** Higher = more important / kept longer. */
  weight: number;
  /** Pinned entries are never dropped. */
  pinned: boolean;
}

export interface FitContentResult {
  /** Whether a non-empty hidden set was produced (false when already fitting). */
  applied: boolean;
  /** Whether the target page count was reached. */
  fit: boolean;
  /** Resulting page count. */
  pages: number;
  /** Fingerprints to hide, keyed by section. */
  hidden: Record<string, string[]>;
  /** Number of entries hidden. */
  hiddenCount: number;
}

export interface FitContentOptions {
  entries: FitEntry[];
  targetPages: number;
  /** Returns the page count for a hidden map, or null when the render fails. */
  measure: (hidden: Record<string, string[]>) => Promise<number | null>;
  /** Reports each probe so the UI can show progress. */
  onProgress?: (rendersDone: number, pages: number) => void;
}

function groupBySection(entries: FitEntry[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  for (const entry of entries) {
    (grouped[entry.sectionKey] ??= []).push(entry.fingerprint);
  }
  return grouped;
}

/**
 * Order in which entries are dropped: lowest weight first, then bottom-most
 * within a section, then section key for determinism. Pinned entries excluded.
 */
function buildDropOrder(entries: FitEntry[]): FitEntry[] {
  return entries
    .filter((entry) => !entry.pinned)
    .sort(
      (a, b) =>
        a.weight - b.weight ||
        b.position - a.position ||
        (a.sectionKey < b.sectionKey ? -1 : a.sectionKey > b.sectionKey ? 1 : 0)
    );
}

export async function fitContentToPages({
  entries,
  targetPages,
  measure,
  onProgress
}: FitContentOptions): Promise<FitContentResult | null> {
  const target = Math.max(1, Math.floor(targetPages));
  const dropOrder = buildDropOrder(entries);

  const cache = new Map<number, number>();
  let renders = 0;

  // Measure the page count after hiding the first `k` entries of the drop order.
  async function pagesForPrefix(k: number): Promise<number | null> {
    const cached = cache.get(k);
    if (cached !== undefined) return cached;

    const hidden = groupBySection(dropOrder.slice(0, k));
    const pages = await measure(hidden);
    if (pages === null) return null;

    cache.set(k, pages);
    renders += 1;
    onProgress?.(renders, pages);
    return pages;
  }

  const currentPages = await pagesForPrefix(0);
  if (currentPages === null) {
    return null;
  }

  if (currentPages <= target) {
    return { applied: false, fit: true, pages: currentPages, hidden: {}, hiddenCount: 0 };
  }

  if (dropOrder.length === 0) {
    // Everything is pinned — nothing we can drop.
    return { applied: false, fit: false, pages: currentPages, hidden: {}, hiddenCount: 0 };
  }

  // Smallest prefix length whose render fits the target. Page count is monotonic
  // non-increasing in k (hiding entries never adds pages), so we can bisect.
  let lo = 1;
  let hi = dropOrder.length;
  let best: { k: number; pages: number } | null = null;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const pages = await pagesForPrefix(mid);
    if (pages === null) {
      return null;
    }

    if (pages <= target) {
      best = { k: mid, pages };
      hi = mid - 1;
    } else {
      lo = mid + 1;
    }
  }

  if (best) {
    return {
      applied: true,
      fit: true,
      pages: best.pages,
      hidden: groupBySection(dropOrder.slice(0, best.k)),
      hiddenCount: best.k
    };
  }

  // Target unreachable — hide everything droppable as a best effort.
  const maxPages = await pagesForPrefix(dropOrder.length);
  if (maxPages === null) {
    return null;
  }

  if (maxPages < currentPages) {
    return {
      applied: true,
      fit: false,
      pages: maxPages,
      hidden: groupBySection(dropOrder),
      hiddenCount: dropOrder.length
    };
  }

  return { applied: false, fit: false, pages: currentPages, hidden: {}, hiddenCount: 0 };
}
