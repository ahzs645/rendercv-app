import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { CvFileSections } from '@rendercv/contracts';
import { DiffViewer } from './diff-viewer';

export function ChangesDialog({
  open,
  onOpenChange,
  origin,
  modified
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  origin: CvFileSections;
  modified: CvFileSections;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-4 z-50 flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl outline-none sm:inset-8 lg:inset-12">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <Dialog.Title className="text-sm font-semibold text-foreground">
              Changes from original
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1">
            <DiffViewer origin={origin} modified={modified} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
