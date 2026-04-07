/**
 * Parse generated Typst source to extract section/entry structure.
 *
 * The Typst source uses known markers:
 * - `#section_heading("Title")` for section headings
 * - `#entry_content({` for entry blocks (brace-balanced)
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

export function parseTypstSectionMap(typstContent: string): SectionMapEntry[] {
  const lines = typstContent.split('\n');
  const sections: SectionMapEntry[] = [];

  let current: SectionMapEntry | null = null;
  let entryLines = 0;
  let inEntry = false;
  let braceDepth = 0;
  let headerLineCount = 0; // lines before first section_heading

  for (const line of lines) {
    // Detect section heading
    const headingMatch = line.match(/#section_heading\("([^"]+)"\)/);
    if (headingMatch) {
      // Flush previous entry
      if (inEntry && current) {
        current.entries.push({ lines: entryLines });
        inEntry = false;
      }
      // Flush previous section
      if (current) {
        sections.push(current);
      }
      current = {
        key: titleToKey(headingMatch[1]!),
        title: headingMatch[1]!,
        totalLines: 0,
        headingLines: 0,
        entries: []
      };
      entryLines = 0;
      braceDepth = 0;
      continue;
    }

    // Detect entry_content start
    if (line.includes('#entry_content(')) {
      // Flush previous entry within same section
      if (inEntry && current) {
        current.entries.push({ lines: entryLines });
      }
      inEntry = true;
      entryLines = 0;
      // Count opening braces on this line
      braceDepth = 0;
      for (const ch of line) {
        if (ch === '{') braceDepth++;
        if (ch === '}') braceDepth--;
      }
      entryLines++;
      if (current) current.totalLines++;
      continue;
    }

    // Track brace depth inside entry_content
    if (inEntry) {
      for (const ch of line) {
        if (ch === '{') braceDepth++;
        if (ch === '}') braceDepth--;
      }
      entryLines++;
      if (current) current.totalLines++;
      if (braceDepth <= 0) {
        // Entry block closed
        if (current) {
          current.entries.push({ lines: entryLines });
        }
        inEntry = false;
        entryLines = 0;
      }
      continue;
    }

    // Regular line
    if (current) {
      current.totalLines++;
      if (current.entries.length === 0) {
        current.headingLines++;
      }
    } else {
      headerLineCount++;
    }
  }

  // Flush last entry / section
  if (inEntry && current) {
    current.entries.push({ lines: entryLines });
  }
  if (current) {
    sections.push(current);
  }

  return sections;
}

/**
 * Total source lines across all sections (used to scale proportionally).
 */
export function totalSectionLines(map: SectionMapEntry[]): number {
  return map.reduce((sum, s) => sum + s.totalLines, 0);
}
