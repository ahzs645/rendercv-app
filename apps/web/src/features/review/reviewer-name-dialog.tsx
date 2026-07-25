import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useState } from 'react';
import { DialogOverlay, DialogShell } from '../../ui/dialog-shell';

export function ReviewerNameDialog({
  confirmLabel = 'Continue',
  description,
  initialName,
  onConfirm,
  onOpenChange,
  open,
  showNoteField = true,
  title
}: {
  confirmLabel?: string;
  description: string;
  initialName?: string;
  onConfirm: (name: string, note?: string) => void | Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  showNoteField?: boolean;
  title: string;
}) {
  const [value, setValue] = useState(initialName ?? '');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      setValue(initialName ?? '');
      setNote('');
    }
  }, [initialName, open]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <DialogOverlay />
        <DialogShell
          bodyClassName="space-y-4"
          closeLabel="Close reviewer name dialog"
          description={description}
          footer={
            <>
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
                onClick={() => void onConfirm(value.trim(), note.trim() || undefined)}
                type="button"
              >
                {confirmLabel}
              </button>
            </>
          }
          title={title}
        >
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

            {showNoteField ? (
              <label className="block space-y-2">
                <span className="text-sm font-medium text-foreground">
                  Note to the author <span className="font-normal text-muted-foreground">(optional)</span>
                </span>
                <textarea
                  className="min-h-20 w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  maxLength={2000}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Why these changes? Anything the author should look at first?"
                  value={note}
                />
              </label>
            ) : null}
        </DialogShell>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
