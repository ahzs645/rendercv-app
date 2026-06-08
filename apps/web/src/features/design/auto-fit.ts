import YAML from 'yaml';
import type { CvFileSections } from '@rendercv/contracts';

/**
 * Heuristic "fit to N pages" helper.
 *
 * RenderCV renders to a real typeset PDF via Typst, so we can measure the exact
 * page count of any candidate design. This walks a sequence of progressively
 * tighter design tweaks — reducing inter-entry spacing, line spacing, margins,
 * and finally font size — re-rendering each candidate until the document fits in
 * the requested number of pages (or we run out of room to compact).
 */

const DIMENSION_RE = /^(-?\d*\.?\d+)\s*(cm|mm|in|pt|em|ex)$/;

/** Spacing/margin/font multipliers applied to the *original* design per step. */
interface CompactionStep {
  spacing: number;
  margin: number;
  font: number;
}

const COMPACTION_STEPS: CompactionStep[] = [
  { spacing: 0.85, margin: 0.92, font: 1 },
  { spacing: 0.7, margin: 0.85, font: 1 },
  { spacing: 0.55, margin: 0.78, font: 0.98 },
  { spacing: 0.45, margin: 0.7, font: 0.95 },
  { spacing: 0.38, margin: 0.62, font: 0.92 },
  { spacing: 0.3, margin: 0.55, font: 0.88 }
];

// Spacing-like dimensions to shrink. Each entry is a path into the design object.
const SPACING_PATHS: string[][] = [
  ['typography', 'line_spacing'],
  ['sections', 'space_between_regular_entries'],
  ['sections', 'space_between_text_based_entries'],
  ['section_titles', 'space_above'],
  ['section_titles', 'space_below'],
  ['entries', 'highlights', 'space_above'],
  ['entries', 'highlights', 'space_between_items'],
  ['header', 'space_below_name'],
  ['header', 'space_below_headline'],
  ['header', 'space_below_connections']
];

const MARGIN_PATHS: string[][] = [
  ['page', 'top_margin'],
  ['page', 'bottom_margin'],
  ['page', 'left_margin'],
  ['page', 'right_margin']
];

const FONT_SIZE_PATHS: string[][] = [
  ['typography', 'font_size', 'body'],
  ['typography', 'font_size', 'name'],
  ['typography', 'font_size', 'headline'],
  ['typography', 'font_size', 'connections'],
  ['typography', 'font_size', 'section_titles']
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepClone<T>(value: T): T {
  return structuredClone(value);
}

function getAt(root: Record<string, unknown>, path: string[]): unknown {
  let current: unknown = root;
  for (const key of path) {
    if (!isPlainObject(current)) return undefined;
    current = current[key];
  }
  return current;
}

/** Scale a dimension string ("0.6em" -> "0.45em") in place if it exists. */
function scaleDimensionAt(root: Record<string, unknown>, path: string[], factor: number) {
  if (factor === 1) return;
  const value = getAt(root, path);
  if (typeof value !== 'string') return;
  const match = value.trim().match(DIMENSION_RE);
  if (!match) return;

  const scaled = Number(match[1]) * factor;
  // Trim to a sensible precision and drop trailing zeros.
  const formatted = Number(scaled.toFixed(3)).toString();

  let parent: Record<string, unknown> = root;
  for (let i = 0; i < path.length - 1; i += 1) {
    const next = parent[path[i]!];
    if (!isPlainObject(next)) return;
    parent = next;
  }
  parent[path[path.length - 1]!] = `${formatted}${match[2]}`;
}

function applyStep(design: Record<string, unknown>, step: CompactionStep): Record<string, unknown> {
  const next = deepClone(design);
  for (const path of SPACING_PATHS) scaleDimensionAt(next, path, step.spacing);
  for (const path of MARGIN_PATHS) scaleDimensionAt(next, path, step.margin);
  for (const path of FONT_SIZE_PATHS) scaleDimensionAt(next, path, step.font);
  return next;
}

export interface AutoFitResult {
  /** Whether a new design was produced (false when the resume already fit). */
  applied: boolean;
  /** Whether the target page count was actually reached. */
  fit: boolean;
  /** Page count of the chosen candidate. */
  pages: number;
  /** Serialized design YAML to write back (only when `applied`). */
  design: string;
}

export interface AutoFitOptions {
  sections: CvFileSections;
  targetPages: number;
  /** Renders sections to per-page SVG strings; length === page count. */
  render: (sections: CvFileSections) => Promise<string[] | null>;
  /** Called after each candidate render so the UI can show progress. */
  onProgress?: (step: number, totalSteps: number, pages: number) => void;
}

/**
 * Compact the design until the document fits in `targetPages`.
 *
 * Returns `applied: false` when the resume already fits (no change needed) or
 * when the design section can't be parsed. When the target can't be reached,
 * returns the most compact candidate so the resume is at least shorter.
 */
export async function autoFitDesignToPages({
  sections,
  targetPages,
  render,
  onProgress
}: AutoFitOptions): Promise<AutoFitResult | null> {
  let parsed: unknown;
  try {
    parsed = YAML.parse(sections.design || 'design:\n');
  } catch {
    return null;
  }

  const designRoot =
    isPlainObject(parsed) && isPlainObject(parsed.design) ? parsed.design : undefined;
  if (!designRoot) {
    return null;
  }

  // Measure the current document first — it may already fit.
  const currentPages = (await render(sections))?.length ?? 0;
  if (currentPages === 0) {
    // Render failed (e.g. validation errors); nothing safe to do.
    return null;
  }
  if (currentPages <= targetPages) {
    return { applied: false, fit: true, pages: currentPages, design: sections.design };
  }

  let best: { design: Record<string, unknown>; pages: number } | null = null;

  for (let i = 0; i < COMPACTION_STEPS.length; i += 1) {
    const candidateDesign = applyStep(designRoot, COMPACTION_STEPS[i]!);
    const candidateSections: CvFileSections = {
      ...sections,
      design: YAML.stringify({ design: candidateDesign })
    };

    const pages = (await render(candidateSections))?.length ?? Number.POSITIVE_INFINITY;
    onProgress?.(i + 1, COMPACTION_STEPS.length, pages);

    if (Number.isFinite(pages) && (!best || pages <= best.pages)) {
      best = { design: candidateDesign, pages };
    }

    if (pages <= targetPages) {
      return {
        applied: true,
        fit: true,
        pages,
        design: YAML.stringify({ design: candidateDesign })
      };
    }
  }

  if (best && best.pages < currentPages) {
    return {
      applied: true,
      fit: false,
      pages: best.pages,
      design: YAML.stringify({ design: best.design })
    };
  }

  return { applied: false, fit: false, pages: currentPages, design: sections.design };
}
