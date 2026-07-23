import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api';

const FEEDBACK_TYPES = [
  ['bug', 'Bug report'],
  ['idea', 'Feature idea'],
  ['question', 'Question'],
  ['other', 'Other']
] as const;

export function FeedbackDialog({
  onOpenChange,
  open
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const [type, setType] = useState<string>('bug');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  async function submit() {
    setSending(true);
    try {
      await api.submitFeedback({
        type,
        message: message.trim(),
        ...(email.trim() ? { email: email.trim() } : {}),
        page: window.location.pathname
      });
      toast.success('Thanks — your feedback was sent.');
      setMessage('');
      setEmail('');
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send feedback.');
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay-anim fixed inset-0 z-40 bg-background/60 backdrop-blur-[2px]" />
        <Dialog.Content className="dialog-content-pop fixed left-1/2 top-1/2 z-50 w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-background shadow-2xl outline-none">
          <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
            <div>
              <Dialog.Title className="text-lg font-semibold text-foreground">Send feedback</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Found a bug or missing something? Tell us — it goes straight to the maintainer.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                aria-label="Close feedback dialog"
                className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                type="button"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-4 px-6 py-5">
            <div className="flex flex-wrap gap-2">
              {FEEDBACK_TYPES.map(([key, label]) => (
                <button
                  key={key}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    type === key
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border text-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                  onClick={() => setType(key)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">What happened?</span>
              <textarea
                autoFocus
                className="min-h-28 w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                maxLength={4000}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="The more detail the better — what you did, what you expected, what you got."
                value={message}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">
                Email <span className="font-normal text-muted-foreground">(optional, for follow-up)</span>
              </span>
              <input
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                type="email"
                value={email}
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
                disabled={!message.trim() || sending}
                onClick={() => void submit()}
                type="button"
              >
                {sending ? 'Sending…' : 'Send feedback'}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
