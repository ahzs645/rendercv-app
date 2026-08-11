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
  // 36x28 per arrow. Two of them have to stack inside a row that is itself only
  // ~40px tall, so a full 44px square is not reachable without giving the pair
  // its own 120px-wide gutter — which on a 390px screen costs more than it
  // buys. The `-mx-1` bleed widens the tap area past the visual column, and the
  // separating rule keeps the pair from reading as part of the text beside it.
  const arrowClassName =
    'flex h-7 w-9 items-center justify-center rounded text-muted-foreground/70 active:bg-muted disabled:pointer-events-none disabled:opacity-25';

  return (
    <div
      className={`absolute left-0 flex w-9 flex-col items-center border-r border-border/40 sm:hidden ${
        align === 'center' ? 'top-1/2 -translate-y-1/2' : 'top-0.5'
      }`}
    >
      <button
        type="button"
        className={arrowClassName}
        disabled={!canMoveUp}
        aria-label={`Move ${label} up`}
        onClick={() => onMove(-1)}
      >
        <ArrowUp className="size-4" />
      </button>
      <button
        type="button"
        className={arrowClassName}
        disabled={!canMoveDown}
        aria-label={`Move ${label} down`}
        onClick={() => onMove(1)}
      >
        <ArrowDown className="size-4" />
      </button>
    </div>
  );
}

export function TextRow({
  label,
  ariaLabel,
  value,
  onChange,
  placeholder
}: {
  label?: string;
  /**
   * Accessible name for rows whose label is not rendered beside them — list
   * items, for instance, where the heading sits above the whole list. Falls
   * back to the visible label.
   */
  ariaLabel?: string;
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
        aria-label={ariaLabel ?? label}
        // `wrap-anywhere` keeps long unbreakable values (URLs) from forcing the
        // row — and with it the whole form — wider than the pane on mobile.
        className="field-sizing-content min-h-11 min-w-0 flex-1 resize-none bg-transparent py-2 text-sm wrap-anywhere outline-none select-text placeholder:text-muted-foreground/50 sm:min-h-0 sm:py-0"
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
