import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export function StyledTooltip({
  children,
  label,
  side = 'top'
}: {
  children: ReactNode;
  label: string;
  side?: 'top' | 'bottom';
}) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [visible, setVisible] = useState(false);
  const bubbleRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!visible || !triggerRef.current) {
      setPos(null);
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const top = side === 'bottom' ? rect.bottom + 8 : rect.top - 8;

    setPos({ top, left: centerX });
  }, [visible, side]);

  // Clamp horizontal position so tooltip stays within viewport
  useEffect(() => {
    if (!pos || !bubbleRef.current) return;
    const bubble = bubbleRef.current;
    const bRect = bubble.getBoundingClientRect();
    const pad = 8;

    if (bRect.left < pad) {
      bubble.style.transform = `translateX(${pad - bRect.left}px)`;
    } else if (bRect.right > window.innerWidth - pad) {
      bubble.style.transform = `translateX(${window.innerWidth - pad - bRect.right}px)`;
    } else {
      bubble.style.transform = '';
    }
  }, [pos]);

  return (
    <span
      ref={triggerRef}
      className="group/tooltip relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && pos ? (
        <span
          ref={bubbleRef}
          aria-hidden="true"
          className="pointer-events-none fixed z-50 hidden sm:flex flex-col items-center"
          style={{
            top: side === 'bottom' ? pos.top : undefined,
            bottom: side === 'top' ? `${window.innerHeight - pos.top}px` : undefined,
            left: pos.left,
            translate: '-50% 0'
          }}
        >
          {side === 'bottom' ? (
            <>
              <span className="-mb-1 size-2 rotate-45 border-l border-t border-border/80 bg-foreground" />
              <span className="whitespace-nowrap rounded-md border border-border/80 bg-foreground px-2 py-1 text-[11px] font-medium text-background shadow-lg">
                {label}
              </span>
            </>
          ) : (
            <>
              <span className="whitespace-nowrap rounded-md border border-border/80 bg-foreground px-2 py-1 text-[11px] font-medium text-background shadow-lg">
                {label}
              </span>
              <span className="-mt-1 size-2 rotate-45 border-b border-r border-border/80 bg-foreground" />
            </>
          )}
        </span>
      ) : null}
    </span>
  );
}
