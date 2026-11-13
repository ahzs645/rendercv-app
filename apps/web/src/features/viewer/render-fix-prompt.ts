import type { CvFileSections, SectionKey } from '@rendercv/contracts';
import type { RenderError } from './use-viewer-renderer';
import { formatRenderErrorMessage } from './render-error-format';

export type RenderDiagnostics = {
  errors: RenderError[];
  warnings: string[];
  /** True while the preview shows an older render because the newest one failed. */
  stale: boolean;
};

const EMPTY_DIAGNOSTICS: RenderDiagnostics = { errors: [], warnings: [], stale: false };
const MAX_SECTION_CHARS = 6000;
const CONTEXT_LINES = 6;

let latestDiagnostics: RenderDiagnostics = EMPTY_DIAGNOSTICS;

/**
 * The preview publishes its latest render result here so tools outside the
 * React tree (the WebMCP agent tools) can tell an agent why a CV won't render.
 */
export function setRenderDiagnostics(diagnostics: RenderDiagnostics) {
  latestDiagnostics = diagnostics;
}

export function getRenderDiagnostics(): RenderDiagnostics {
  return latestDiagnostics;
}

function sectionForError(error: RenderError): SectionKey {
  if (error.yaml_source && error.yaml_source !== 'cv') {
    return error.yaml_source;
  }
  return error.schema_location?.[0] === 'design' ? 'design' : 'cv';
}

function excerpt(text: string, line: number | undefined) {
  if (line === undefined || text.length <= MAX_SECTION_CHARS) {
    return text.length <= MAX_SECTION_CHARS ? text : `${text.slice(0, MAX_SECTION_CHARS)}\n# … truncated`;
  }

  const lines = text.split('\n');
  const start = Math.max(0, line - 1 - CONTEXT_LINES);
  const end = Math.min(lines.length, line + CONTEXT_LINES);
  return lines
    .slice(start, end)
    .map((value, index) => `${String(start + index + 1).padStart(4)} | ${value}`)
    .join('\n');
}

/**
 * A self-contained prompt the user can hand to an AI assistant (or that an
 * agent receives through WebMCP) describing why the preview failed and the
 * YAML involved, so the fix can be made by asking rather than by hand.
 */
export function buildRenderFixPrompt({
  errors,
  warnings = [],
  sections
}: {
  errors: RenderError[];
  warnings?: string[];
  sections?: Partial<CvFileSections>;
}) {
  const lines: string[] = [
    'My RenderCV résumé will not render. Fix the YAML so it renders, changing as little as possible.',
    'Keep every fact, date and wording in the CV unless an error requires a change, and do not invent content.',
    'Return only the corrected YAML for each section you change, and explain each change in one line.',
    '',
    'Errors:'
  ];

  errors.forEach((error, index) => {
    lines.push(`${index + 1}. [${sectionForError(error)}] ${formatRenderErrorMessage(error)}`);
    if (error.input) {
      lines.push(`   Offending value: ${String(error.input).slice(0, 200)}`);
    }
  });

  if (warnings.length > 0) {
    lines.push('', 'Warnings (rendered, but worth fixing):');
    for (const warning of warnings) {
      lines.push(`- ${warning}`);
    }
  }

  const involved = new Map<SectionKey, number | undefined>();
  for (const error of errors) {
    const section = sectionForError(error);
    const line = error.yaml_location?.[0]?.[0];
    if (!involved.has(section) || involved.get(section) === undefined) {
      involved.set(section, line);
    }
  }
  // An error with no location (for example one raised while typesetting)
  // usually comes from a design value the theme passes to Typst.
  if (errors.some((error) => !error.yaml_location) && !involved.has('design')) {
    involved.set('design', undefined);
  }

  for (const [section, line] of involved) {
    const text = sections?.[section]?.trim();
    if (!text) continue;
    lines.push('', `Current ${section} YAML${line ? ` (around line ${line})` : ''}:`, '```yaml', excerpt(text, line), '```');
  }

  return lines.join('\n');
}
