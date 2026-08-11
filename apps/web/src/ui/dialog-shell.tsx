import * as Dialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

/**
 * Shared chrome for the app's dialogs: a bottom sheet on phones (matching the
 * workspace actions sheet) and a centered dialog from `md` up. Only the desktop
 * width varies per dialog — the sheet geometry is identical everywhere so the
 * popups stop each having their own height and inset on mobile.
 */
const DIALOG_WIDTHS = {
  sm: 'md:w-[min(32rem,calc(100vw-3rem))]',
  md: 'md:w-[min(35rem,calc(100vw-3rem))]',
  lg: 'md:w-[min(54rem,calc(100vw-3rem))]',
  xl: 'md:w-[min(69rem,calc(100vw-3rem))]'
} as const;

export type DialogWidth = keyof typeof DIALOG_WIDTHS;

export const DIALOG_OVERLAY_CLASS =
  'dialog-overlay-anim fixed inset-0 z-40 bg-background/60 backdrop-blur-[2px]';

export function DialogOverlay() {
  return <Dialog.Overlay className={DIALOG_OVERLAY_CLASS} />;
}

export function DialogShell({
  bodyClassName,
  children,
  closeLabel,
  description,
  footer,
  subheader,
  title,
  width = 'sm'
}: {
  /** Extra classes for the scrollable body; padding is applied by default. */
  bodyClassName?: string;
  children: ReactNode;
  /** Accessible name for the close button. Defaults to "Close dialog". */
  closeLabel?: string;
  description?: ReactNode;
  /** Pinned below the body, e.g. Cancel/Save. */
  footer?: ReactNode;
  /** Pinned between the header and the body, e.g. a tab row. */
  subheader?: ReactNode;
  title: ReactNode;
  width?: DialogWidth;
}) {
  return (
    <Dialog.Content
      className={`dialog-shell fixed inset-x-3 bottom-3 z-50 flex max-h-[80dvh] flex-col overflow-hidden rounded-[2rem] border border-border bg-background shadow-2xl outline-none md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:max-h-[85vh] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl ${DIALOG_WIDTHS[width]}`}
    >
      <div className="shrink-0 pt-3 md:hidden">
        <div className="mx-auto h-1.5 w-12 rounded-full bg-border" />
      </div>
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-6 py-4 md:py-5">
        <div className="min-w-0">
          <Dialog.Title className="text-base font-semibold text-foreground md:text-lg">
            {title}
          </Dialog.Title>
          {description ? (
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">
              {description}
            </Dialog.Description>
          ) : null}
        </div>
        <Dialog.Close asChild>
          <button
            aria-label={closeLabel ?? 'Close dialog'}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            type="button"
          >
            <X className="size-4" />
          </button>
        </Dialog.Close>
      </div>
      {subheader}
      <div className={`scroll-fade min-h-0 flex-1 overflow-auto px-6 py-5 ${bodyClassName ?? ''}`}>{children}</div>
      {footer ? (
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-card/40 px-6 py-3">
          {footer}
        </div>
      ) : null}
    </Dialog.Content>
  );
}
