import { ArrowDown, ArrowUp } from 'lucide-react';

/**
 * Touch-friendly reorder arrows, shown in the left gutter on mobile in place of
 * the drag handle (dragging a row is unreliable inside a scrolling form on a
 * phone). Hidden from `sm` up, where the grip handle takes over.
 */
export function MobileReorderControls({
  canMoveUp,
  canMoveDown,
  onMove,
  label,
  align = 'top'
}: {
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (direction: -1 | 1) => void;
  label: string;
  /** `center` for single-line rows (section titles), `top` for multi-row entries. */
  align?: 'top' | 'center';
}) {
  return (
    <div
      className={`absolute left-0 flex w-6 flex-col items-center sm:hidden ${
        align === 'center' ? 'top-1/2 -translate-y-1/2' : 'top-0'
      }`}
    >
      <button
        type="button"
        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/70 active:bg-muted disabled:pointer-events-none disabled:opacity-25"
        disabled={!canMoveUp}
        aria-label={`Move ${label} up`}
        onClick={() => onMove(-1)}
      >
        <ArrowUp className="size-3.5" />
      </button>
      <button
        type="button"
        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/70 active:bg-muted disabled:pointer-events-none disabled:opacity-25"
        disabled={!canMoveDown}
        aria-label={`Move ${label} down`}
        onClick={() => onMove(1)}
      >
        <ArrowDown className="size-3.5" />
      </button>
    </div>
  );
}

export function TextRow({
  label,
  value,
  onChange,
  placeholder
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-center sm:gap-0 sm:py-1.5">
      {label ? (
        <span
          className="w-full shrink-0 text-xs text-muted-foreground sm:w-[var(--label-width,8rem)]"
          style={{ transition: 'color 190ms cubic-bezier(0.215, 0.61, 0.355, 1)' }}
        >
          {label}
        </span>
      ) : null}
      <textarea
        rows={1}
        // `wrap-anywhere` keeps long unbreakable values (URLs) from forcing the
        // row — and with it the whole form — wider than the pane on mobile.
        className="field-sizing-content min-w-0 flex-1 resize-none bg-transparent py-0 text-sm wrap-anywhere outline-none select-text placeholder:text-muted-foreground/50"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export function Divider() {
  return <div className="h-px bg-border/40" />;
}
