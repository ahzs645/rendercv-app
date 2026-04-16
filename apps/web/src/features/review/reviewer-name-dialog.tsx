import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export function ReviewerNameDialog({
  confirmLabel = 'Continue',
  description,
  initialName,
  onConfirm,
  onOpenChange,
  open,
  title
}: {
  confirmLabel?: string;
  description: string;
  initialName?: string;
  onConfirm: (name: string) => void | Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
}) {
  const [value, setValue] = useState(initialName ?? '');

  useEffect(() => {
    if (open) {
      setValue(initialName ?? '');
    }
  }, [initialName, open]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-background/60 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-background shadow-2xl outline-none">
          <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
            <div>
              <Dialog.Title className="text-lg font-semibold text-foreground">
                {title}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                {description}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                aria-label="Close reviewer name dialog"
                className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                type="button"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-4 px-6 py-5">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">Reviewer name</span>
              <input
                autoFocus
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                onChange={(event) => setValue(event.target.value)}
                placeholder="Jane Reviewer"
                value={value}
              />
            </label>

            <div className="flex items-center justify-end gap-2">
              <button
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => onOpenChange(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-40"
                disabled={!value.trim()}
                onClick={() => void onConfirm(value.trim())}
                type="button"
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
