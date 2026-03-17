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
    <div className="flex items-center py-1.5">
      {label ? (
        <span
          className="shrink-0 text-xs text-muted-foreground"
          style={{ width: 'var(--label-width, 8rem)', transition: 'color 190ms cubic-bezier(0.215, 0.61, 0.355, 1)' }}
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
