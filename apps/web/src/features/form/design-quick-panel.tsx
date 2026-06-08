import { Fragment, useState } from 'react';
import type { CSSProperties } from 'react';
import { Loader2, Sparkles, WandSparkles } from 'lucide-react';
import type { FieldDef } from './schema/types';
import { FieldControl } from './field-controls';
import { Divider } from './primitives';
import { getNestedValue } from './utils';

export interface DesignQuickFieldUpdate {
  path: string[];
  value: unknown;
}

/**
 * A curated, direct-manipulation styling panel that sits on top of the full
 * design schema. Each control writes the same design YAML the form editor
 * does — it just groups the most common knobs (one accent colour instead of
 * five, one font instead of five, one margin instead of four) so non-technical
 * users can restyle a resume without scrolling the entire design section.
 */

// Colour fields that share a single "accent" in practice.
const ACCENT_PATHS: string[][] = [
  ['colors', 'name'],
  ['colors', 'headline'],
  ['colors', 'connections'],
  ['colors', 'section_titles'],
  ['colors', 'links']
];

const FONT_FAMILY_PATHS: string[][] = [
  ['typography', 'font_family', 'body'],
  ['typography', 'font_family', 'name'],
  ['typography', 'font_family', 'headline'],
  ['typography', 'font_family', 'connections'],
  ['typography', 'font_family', 'section_titles']
];

const MARGIN_PATHS: string[][] = [
  ['page', 'top_margin'],
  ['page', 'bottom_margin'],
  ['page', 'left_margin'],
  ['page', 'right_margin']
];

const accentField: FieldDef = { path: ['colors', 'name'], label: 'Accent color', type: 'color' };
const textField: FieldDef = { path: ['colors', 'body'], label: 'Text color', type: 'color' };
const fontField: FieldDef = { path: ['typography', 'font_family', 'body'], label: 'Font', type: 'font' };
const fontSizeField: FieldDef = {
  path: ['typography', 'font_size', 'body'],
  label: 'Font size',
  type: 'dimension'
};
const lineSpacingField: FieldDef = {
  path: ['typography', 'line_spacing'],
  label: 'Line spacing',
  type: 'dimension'
};
const marginField: FieldDef = { path: ['page', 'top_margin'], label: 'Page margin', type: 'dimension' };

export function DesignQuickPanel({
  design,
  onUpdateFields,
  onAutoFit,
  autoFitRunning = false
}: {
  design: Record<string, unknown>;
  onUpdateFields: (updates: DesignQuickFieldUpdate[]) => void;
  onAutoFit?: () => void;
  autoFitRunning?: boolean;
}) {
  const [expanded, setExpanded] = useState(true);

  function writeGroup(paths: string[][], value: unknown) {
    onUpdateFields(paths.map((path) => ({ path, value })));
  }

  function writeSingle(path: string[], value: unknown) {
    onUpdateFields([{ path, value }]);
  }

  return (
    <section className="mt-6 rounded-xl border border-border/70 bg-muted/30 p-4">
      <button
        type="button"
        className="flex w-full items-center gap-2 text-left"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
      >
        <Sparkles className="size-3.5 text-primary" />
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Quick styling
        </span>
        <span className="ml-auto text-[11px] text-muted-foreground/60">
          {expanded ? 'Hide' : 'Show'}
        </span>
      </button>

      {expanded ? (
        <div className="mt-2" style={{ '--label-width': '7rem' } as CSSProperties}>
          {(
            [
              { field: accentField, onChange: (value: unknown) => writeGroup(ACCENT_PATHS, value) },
              { field: textField, onChange: (value: unknown) => writeSingle(textField.path, value) },
              { field: fontField, onChange: (value: unknown) => writeGroup(FONT_FAMILY_PATHS, value) },
              {
                field: fontSizeField,
                onChange: (value: unknown) => writeSingle(fontSizeField.path, value)
              },
              {
                field: lineSpacingField,
                onChange: (value: unknown) => writeSingle(lineSpacingField.path, value)
              },
              { field: marginField, onChange: (value: unknown) => writeGroup(MARGIN_PATHS, value) }
            ] as const
          ).map(({ field, onChange }, index, list) => (
            <Fragment key={field.label}>
              <FieldControl
                field={field}
                value={getNestedValue(design, field.path)}
                onChange={onChange}
              />
              {index < list.length - 1 ? <Divider /> : null}
            </Fragment>
          ))}

          {onAutoFit ? (
            <button
              type="button"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-60"
              onClick={onAutoFit}
              disabled={autoFitRunning}
            >
              {autoFitRunning ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <WandSparkles className="size-3.5" />
              )}
              {autoFitRunning ? 'Fitting…' : 'Fit to one page'}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
