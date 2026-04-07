import type { ReactNode } from 'react';

export function StyledTooltip({
  children,
  label
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <span className="group/tooltip relative inline-flex">
      {children}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 z-50 hidden -translate-x-1/2 -translate-y-[calc(100%+0.55rem)] flex-col items-center opacity-0 transition duration-150 group-focus-within/tooltip:opacity-100 group-hover/tooltip:opacity-100 sm:flex"
      >
        <span className="whitespace-nowrap rounded-md border border-border/80 bg-foreground px-2 py-1 text-[11px] font-medium text-background shadow-lg">
          {label}
        </span>
        <span className="-mt-1 size-2 rotate-45 border-b border-r border-border/80 bg-foreground" />
      </span>
    </span>
  );
}
