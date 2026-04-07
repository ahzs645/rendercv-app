/**
 * Parse generated Typst source to extract section/entry structure.
 *
 * Supports two rendering formats:
 *
 * 1. **ahmadstyle** (Jinja2 direct):
 *    - Sections: `#section_heading("Title")`
 *    - Entries:  `#entry_content({...})`
 *
 * 2. **rendercv package** (classic, sb2nov, moderncv, engineeringresumes):
 *    - Sections: `== Title` (Typst level-2 heading)
 *    - Entries:  `#regular-entry(...)`, `#education-entry(...)`,
 *               `#one-line-entry(...)`, `#reversed-numbered-entries(...)`,
 *               or plain bullet/text lines between sections
 *
 * We measure each section's and entry's share of the document by counting
 * source lines, which correlates well with rendered height.
 */

export interface EntryWeight {
  /** Number of Typst source lines in this entry (proxy for rendered height). */
  lines: number;
}

export interface SectionMapEntry {
  /** Section key derived from heading title, e.g. "experience". */
  key: string;
  /** Display title as it appears in the heading, e.g. "Experience". */
  title: string;
  /** Total source lines for the whole section (heading + entries + spacing). */
  totalLines: number;
  /** Lines attributed to the heading area (before first entry). */
  headingLines: number;
  /** Per-entry line counts. */
  entries: EntryWeight[];
}

/** Convert a display title (e.g. "Experience") to a YAML-style key. */
function titleToKey(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/&/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// Patterns that start a new entry in the rendercv-package format.
const RENDERCV_ENTRY_START =
  /^#(?:regular-entry|education-entry|one-line-entry|reversed-numbered-entries)\s*\(/;

// Section heading: either `#section_heading("Title")` or `== Title`
const SECTION_HEADING =
  /(?:#section_heading\("([^"]+)"\)|^==\s+(.+)$)/;

export interface SectionMapResult {
  sections: SectionMapEntry[];
  /** Lines before the first section heading (imports, variables — no visual output). */
  preambleLines: number;
}

export function parseTypstSectionMap(typstContent: string): SectionMapResult {
  const lines = typstContent.split('\n');
  const sections: SectionMapEntry[] = [];

  let current: SectionMapEntry | null = null;
  let preambleLineCount = 0;
  let entryLines = 0;
  let inEntry = false;
  let parenDepth = 0; // for rendercv-package entries which use parens
  let braceDepth = 0; // for ahmadstyle entry_content which uses braces
  let entryStyle: 'brace' | 'paren' | null = null;

  function flushEntry() {
    if (inEntry && current && entryLines > 0) {
      current.entries.push({ lines: entryLines });
    }
    inEntry = false;
    entryLines = 0;
    parenDepth = 0;
    braceDepth = 0;
    entryStyle = null;
  }

  function flushSection() {
    flushEntry();
    if (current) {
      sections.push(current);
    }
  }

  for (const line of lines) {
    const trimmed = line.trimStart();

    // ── Detect section heading ──────────────────────────────────────
    const headingMatch = SECTION_HEADING.exec(trimmed);
    if (headingMatch) {
      const title = (headingMatch[1] ?? headingMatch[2] ?? '').trim();
      if (title) {
        flushSection();
        current = {
          key: titleToKey(title),
          title,
          totalLines: 0,
          headingLines: 0,
          entries: []
        };
        continue;
      }
    }

    // ── ahmadstyle: entry_content({ ... }) ──────────────────────────
    if (trimmed.includes('#entry_content(')) {
      flushEntry();
      inEntry = true;
      entryStyle = 'brace';
      braceDepth = 0;
      for (const ch of line) {
        if (ch === '{') braceDepth++;
        if (ch === '}') braceDepth--;
      }
      entryLines = 1;
      if (current) current.totalLines++;
      continue;
    }

    // ── rendercv-package: #regular-entry(...), #education-entry(...) etc.
    if (RENDERCV_ENTRY_START.test(trimmed)) {
      flushEntry();
      inEntry = true;
      entryStyle = 'paren';
      parenDepth = 0;
      for (const ch of line) {
        if (ch === '(') parenDepth++;
        if (ch === ')') parenDepth--;
      }
      entryLines = 1;
      if (current) current.totalLines++;
      if (parenDepth <= 0) flushEntry(); // single-line entry
      continue;
    }

    // ── Inside a tracked entry ──────────────────────────────────────
    if (inEntry) {
      entryLines++;
      if (current) current.totalLines++;

      if (entryStyle === 'brace') {
        for (const ch of line) {
          if (ch === '{') braceDepth++;
          if (ch === '}') braceDepth--;
        }
        if (braceDepth <= 0) flushEntry();
      } else if (entryStyle === 'paren') {
        for (const ch of line) {
          if (ch === '(') parenDepth++;
          if (ch === ')') parenDepth--;
        }
        if (parenDepth <= 0) flushEntry();
      }
      continue;
    }

    // ── Regular line (not in an entry) ──────────────────────────────
    if (current) {
      current.totalLines++;
      if (current.entries.length === 0) {
        current.headingLines++;
      }
    } else {
      preambleLineCount++;
    }
  }

  flushSection();
  return { sections, preambleLines: preambleLineCount };
}

/**
 * Total source lines across all sections (used to scale proportionally).
 */
export function totalSectionLines(sections: SectionMapEntry[]): number {
  return sections.reduce((sum, s) => sum + s.totalLines, 0);
}
