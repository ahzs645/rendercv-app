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
    <div className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:gap-0 sm:py-1.5">
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
        className="field-sizing-content min-w-0 flex-1 resize-none bg-transparent py-0 text-sm outline-none select-text placeholder:text-muted-foreground/50"
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
