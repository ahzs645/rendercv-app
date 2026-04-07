import { useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { FieldDef, SelectOption } from './schema/types';
import { StringListRow } from './string-list-row';
import { TextRow } from './primitives';
import {
  stringValue,
  parseDimensionValue,
  asHexColor,
  DIMENSION_UNITS
} from './utils';
import { useFieldDiff } from './diff-context';

type ChoiceOption = SelectOption & {
  icon?: ComponentType<{ className?: string }>;
};

const FONT_OPTIONS = [
  'DejaVu Sans Mono',
  'EB Garamond',
  'Fontin',
  'Gentium Book Plus',
  'Lato',
  'Libertinus Serif',
  'Mukta',
  'New Computer Modern',
  'Noto Sans',
  'Open Sans',
  'Open Sauce Sans',
  'Poppins',
  'Raleway',
  'Roboto',
  'Source Sans 3',
  'Ubuntu',
  'XCharter'
];

export function FieldControl({
  field,
  value,
  onChange
}: {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const diff = useFieldDiff(field.path, value);

  const control = (() => {
    switch (field.type) {
      case 'boolean':
        return <BooleanRow label={field.label} checked={Boolean(value)} onChange={onChange} />;
      case 'string_list':
        return <StringListRow field={field} value={value} onChange={onChange} />;
      case 'dimension':
        return <DimensionRow label={field.label} value={stringValue(value)} onChange={onChange} />;
      case 'color':
        return <ColorRow label={field.label} value={stringValue(value) || '#000000'} onChange={onChange} />;
      case 'select':
        return (
          <CollapsibleChoiceRow
            label={field.label}
            value={stringValue(value)}
            options={resolveOptions(field)}
            onChange={onChange}
          />
        );
      case 'toggle':
        return (
          <ToggleButtonsRow
            label={field.label}
            value={stringValue(value)}
            options={resolveOptions(field)}
            onChange={onChange}
          />
        );
      case 'alignment':
      case 'bullet':
        return (
          <ToggleButtonsRow
            label={field.label}
            value={stringValue(value)}
            options={resolveOptions(field)}
            onChange={onChange}
            square={field.type === 'bullet'}
          />
        );
      case 'font':
        return (
          <CollapsibleChoiceRow
            label={field.label}
            value={stringValue(value)}
            options={resolveOptions(field)}
            onChange={onChange}
          />
        );
      case 'section_style':
        return (
          <SectionStyleRow
            label={field.label}
            value={stringValue(value)}
            onChange={onChange}
          />
        );
      case 'date':
        return <DateRow field={field} value={stringValue(value)} onChange={onChange} />;
      default:
        return (
          <TextRow
            label={field.label}
            placeholder={field.placeholder}
            value={stringValue(value)}
            onChange={(nextValue) => onChange(nextValue)}
          />
        );
    }
  })();

  if (!diff.changed) return control;

  const originalDisplay =
    diff.originalValue === undefined || diff.originalValue === null || diff.originalValue === ''
      ? '(empty)'
      : String(diff.originalValue);

  return (
    <div className="relative border-l-2 border-l-amber-500 bg-amber-500/5 pl-2">
      {control}
      <span
        className="absolute right-1 top-1/2 -translate-y-1/2 max-w-[40%] truncate rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-600"
        title={`was: ${originalDisplay}`}
      >
        was: {originalDisplay}
      </span>
    </div>
  );
}

export function FieldDescription({ description }: { description: string }) {
  return (
    <p
      className="py-0.5 text-[11px] text-muted-foreground/70 select-text"
      style={{ paddingLeft: 'var(--label-width, 8rem)' }}
    >
      {description}
    </p>
  );
}

function resolveOptions(field: FieldDef): ChoiceOption[] {
  if (Array.isArray(field.options)) {
    return field.options as ChoiceOption[];
  }

  if (field.type === 'font') {
    return (field.fonts ?? FONT_OPTIONS).map((font) => ({ value: font, label: font }));
  }

  if (field.type === 'bullet') {
    return (field.bullets ?? ['●', '•', '◦', '-', '◆', '★', '■', '—', '○']).map((value) => ({
      value,
      label: value
    }));
  }

  if (field.type === 'alignment') {
    if (field.options === 'position') {
      return [
        { value: 'left', label: 'Left', icon: AlignLeft },
        { value: 'center', label: 'Center', icon: AlignCenter },
        { value: 'right', label: 'Right', icon: AlignRight }
      ];
    }
    return [
      { value: 'left', label: 'Left', icon: AlignLeft },
      { value: 'justified', label: 'Justified', icon: AlignJustify },
      {
        value: 'justified-with-no-hyphenation',
        label: 'No hyphenation',
        icon: AlignJustify,
        extra: 'no-hyphenation'
      }
    ];
  }

  return [];
}

function ToggleButtonsRow({
  label,
  value,
  options,
  onChange,
  square = false
}: {
  label: string;
  value: string;
  options: ChoiceOption[];
  onChange: (value: string) => void;
  square?: boolean;
}) {
  return (
    <div className="flex items-center py-1.5">
      <span className="shrink-0 text-xs text-muted-foreground" style={{ width: 'var(--label-width, 8rem)' }}>
        {label}
      </span>
      <div className="flex flex-wrap gap-0.5">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              type="button"
              className={`flex h-6 items-center rounded transition-colors ${
                square
                  ? 'w-6 justify-center text-xs'
                  : Icon
                    ? 'gap-1 px-1.5 text-[10px]'
                    : 'px-2 text-[11px]'
              } ${
                value === option.value
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              onClick={() => onChange(option.value)}
              title={Icon ? option.label : undefined}
            >
              {Icon ? <Icon className="size-3.5" /> : option.label}
              {Icon && option.extra ? <span className="text-[9px] leading-none">{option.extra}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CollapsibleChoiceRow({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: ChoiceOption[];
  onChange: (value: string) => void;
}) {
  const [expanded, setExpanded] = useState(!value);

  useEffect(() => {
    setExpanded(!value);
  }, [value]);

  return (
    <div className="flex items-center py-1.5">
      <span className="shrink-0 text-xs text-muted-foreground" style={{ width: 'var(--label-width, 8rem)' }}>
        {label}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap gap-1">
          {options
            .filter((option) => expanded || !value || option.value === value)
            .map((option) => (
              <button
                key={option.value}
                type="button"
                data-value={option.value}
                className={`flex h-6 items-center whitespace-nowrap transition-[color,background-color,opacity,border-radius,font-size,padding] duration-[100ms] ${
                  !expanded && value === option.value && value
                    ? 'cursor-pointer rounded-none bg-transparent px-0 text-sm text-foreground hover:text-primary'
                    : value === option.value
                      ? 'rounded bg-primary/10 px-2 text-[11px] text-primary'
                      : 'rounded px-2 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                onClick={() => {
                  if (!expanded) {
                    setExpanded(true);
                    return;
                  }

                  if (option.value === value) {
                    setExpanded(false);
                    return;
                  }

                  onChange(option.value);
                  setExpanded(false);
                }}
              >
                {option.label}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}

function DimensionRow({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [num, setNum] = useState('0');
  const [unit, setUnit] = useState<(typeof DIMENSION_UNITS)[number]>('cm');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const parsed = parseDimensionValue(value);
    setNum(parsed.num);
    setUnit(parsed.unit);
  }, [value]);

  function commit(nextNum: string, nextUnit: (typeof DIMENSION_UNITS)[number]) {
    onChange(`${nextNum || '0'}${nextUnit}`);
  }

  return (
    <div className="flex items-center gap-1 py-1.5">
      <span className="shrink-0 text-xs text-muted-foreground" style={{ width: 'var(--label-width, 8rem)' }}>
        {label}
      </span>
      <div className="relative flex">
        <span className="invisible absolute text-sm whitespace-pre" aria-hidden="true">
          {num || '0'}
        </span>
        <input
          type="number"
          step="0.01"
          className="[appearance:textfield] bg-transparent text-sm outline-none select-text placeholder:text-muted-foreground/50 disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none cursor-ew-resize"
          style={{ width: `${Math.max((num || '0').length * 0.62 + 0.5, 0.75)}rem` }}
          value={num}
          onChange={(event) => {
            const nextNum = event.target.value;
            setNum(nextNum);
            commit(nextNum, unit);
          }}
          onBlur={() => {
            if (!num) {
              setNum('0');
              commit('0', unit);
            }
          }}
        />
      </div>
      <div className="flex flex-wrap gap-1">
        {(expanded ? DIMENSION_UNITS : [unit]).map((optionUnit) => (
          <button
            key={optionUnit}
            type="button"
            data-value={optionUnit}
            className={`flex py-0 whitespace-nowrap transition-[color,background-color,opacity,border-radius,font-size,padding] duration-[100ms] ${
              !expanded && optionUnit === unit
                ? 'cursor-pointer rounded-none bg-transparent px-0 text-sm text-foreground hover:text-primary'
                : optionUnit === unit
                  ? 'rounded bg-primary/10 px-2 text-[11px] text-primary'
                  : 'rounded px-2 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            onClick={() => {
              if (!expanded) {
                setExpanded(true);
                return;
              }

              if (optionUnit === unit) {
                setExpanded(false);
                return;
              }

              setUnit(optionUnit);
              commit(num, optionUnit);
              setExpanded(false);
            }}
          >
            {optionUnit}
          </button>
        ))}
      </div>
    </div>
  );
}

function BooleanRow({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center py-1.5">
      <span className="shrink-0 text-xs text-muted-foreground" style={{ width: 'var(--label-width, 8rem)' }}>
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent transition-all outline-none ${
          checked ? 'bg-primary' : 'bg-input'
        }`}
        onClick={() => onChange(!checked)}
      >
        <span
          className={`block size-4 rounded-full bg-background transition-transform ${
            checked ? 'translate-x-[calc(100%-2px)]' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

function ColorRow({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const swatchValue = asHexColor(value);

  return (
    <div className="flex items-center py-1.5">
      <span className="shrink-0 text-xs text-muted-foreground" style={{ width: 'var(--label-width, 8rem)' }}>
        {label}
      </span>
      <button
        type="button"
        className="size-5 shrink-0 cursor-pointer rounded-full border border-border/60"
        aria-label="Pick color"
        style={{ backgroundColor: swatchValue }}
        onClick={() => inputRef.current?.click()}
      />
      <input
        ref={inputRef}
        type="color"
        className="sr-only"
        value={swatchValue}
        onChange={(event) => onChange(event.target.value)}
      />
      <input
        type="text"
        placeholder="#000000"
        className="ml-2 min-w-0 flex-1 bg-transparent py-0.5 font-mono text-sm outline-none select-text placeholder:text-muted-foreground/50"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];

function DateRow({
  field,
  value,
  onChange
}: {
  field: FieldDef;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isEndDate = field.path[field.path.length - 1] === 'end_date';
  const isPresent = value.toLowerCase() === 'present';

  const [calYear, setCalYear] = useState(() => {
    const match = value.match(/(\d{4})/);
    return match ? parseInt(match[1]) : new Date().getFullYear();
  });

  useEffect(() => {
    const match = value.match(/(\d{4})/);
    if (match) setCalYear(parseInt(match[1]));
  }, [value]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const selectedMonth = (() => {
    const match = value.match(/^(\d{4})-(\d{2})$/);
    if (match && parseInt(match[1]) === calYear) return parseInt(match[2]) - 1;
    return -1;
  })();

  const selectedYearOnly = /^\d{4}$/.test(value) && parseInt(value) === calYear;

  const selectedSeason = (() => {
    for (const season of SEASONS) {
      const match = value.match(new RegExp(`^${season}\\s+(\\d{4})$`, 'i'));
      if (match && parseInt(match[1]) === calYear) return season;
    }
    return null;
  })();

  function pick(val: string) {
    onChange(val);
    setOpen(false);
  }

  return (
    <div className="relative flex items-center py-1.5" ref={containerRef}>
      <span
        className="shrink-0 text-xs text-muted-foreground"
        style={{ width: 'var(--label-width, 8rem)' }}
      >
        {field.label}
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-1">
        {isEndDate && (
          <button
            type="button"
            className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] transition-colors ${
              isPresent
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            onClick={() => onChange(isPresent ? '' : 'present')}
          >
            Present
          </button>
        )}
        <textarea
          rows={1}
          className="field-sizing-content min-w-0 flex-1 resize-none bg-transparent py-0 text-sm outline-none select-text placeholder:text-muted-foreground/50"
          value={value}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className={`shrink-0 rounded p-0.5 transition-colors ${
            open
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          onClick={() => setOpen(!open)}
        >
          <Calendar className="size-3.5" />
        </button>
      </div>

      {open && (
        <div className="absolute top-full right-0 z-50 mt-1 w-56 rounded-lg border border-border bg-popover p-3 shadow-lg">
          {/* Year navigation */}
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={() => setCalYear((y) => y - 1)}
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              type="button"
              className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                selectedYearOnly
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground hover:bg-muted'
              }`}
              onClick={() => pick(String(calYear))}
              title="Select year only"
            >
              {calYear}
            </button>
            <button
              type="button"
              className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={() => setCalYear((y) => y + 1)}
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-4 gap-0.5">
            {MONTHS.map((month, i) => (
              <button
                key={month}
                type="button"
                className={`rounded py-1 text-[11px] transition-colors ${
                  selectedMonth === i
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                onClick={() => pick(`${calYear}-${String(i + 1).padStart(2, '0')}`)}
              >
                {month}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="my-2 h-px bg-border/40" />

          {/* Seasons / Semesters */}
          <div className="mb-1 text-[10px] text-muted-foreground/70">Semester / Season</div>
          <div className="grid grid-cols-2 gap-0.5">
            {SEASONS.map((season) => (
              <button
                key={season}
                type="button"
                className={`rounded py-1 text-[11px] transition-colors ${
                  selectedSeason === season
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                onClick={() => pick(`${season} ${calYear}`)}
              >
                {season} {calYear}
              </button>
            ))}
          </div>

          {/* Present option for end_date */}
          {isEndDate && (
            <>
              <div className="my-2 h-px bg-border/40" />
              <button
                type="button"
                className={`w-full rounded py-1 text-[11px] transition-colors ${
                  isPresent
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                onClick={() => pick('present')}
              >
                Present
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SectionStyleRow({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const options = [
    { value: 'with_full_line', label: 'Full Line' },
    { value: 'with_partial_line', label: 'Partial Line' },
    { value: 'without_line', label: 'No Line' },
    { value: 'moderncv', label: 'ModernCV' }
  ] as const;

  return (
    <div className="flex items-center py-1.5">
      <span className="shrink-0 text-xs text-muted-foreground" style={{ width: 'var(--label-width, 8rem)' }}>
        {label}
      </span>
      <div className="flex flex-wrap gap-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`flex h-7 items-center gap-0.5 rounded border px-2 transition-colors ${
              value === option.value
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            onClick={() => onChange(option.value)}
            title={option.label}
          >
            {option.value === 'with_full_line' ? (
              <span className="flex w-5 flex-col items-start gap-[2px]">
                <span className="text-[9px] leading-none font-semibold">T</span>
                <span className="h-px w-full bg-current" />
              </span>
            ) : null}
            {option.value === 'with_partial_line' ? (
              <span className="flex w-5 items-end gap-[3px]">
                <span className="text-[9px] leading-none font-semibold">T</span>
                <span className="mb-[1px] h-px flex-1 bg-current" />
              </span>
            ) : null}
            {option.value === 'without_line' ? (
              <span className="text-[9px] leading-none font-semibold">T</span>
            ) : null}
            {option.value === 'moderncv' ? (
              <span className="flex items-center gap-[3px]">
                <span className="h-[1px] w-2.5 rounded-[0.5px] bg-current" />
                <span className="text-[9px] leading-none font-semibold">T</span>
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
