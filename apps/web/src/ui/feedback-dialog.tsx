import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { DialogOverlay, DialogShell } from './dialog-shell';

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
        <DialogOverlay />
        <DialogShell
          bodyClassName="space-y-4"
          closeLabel="Close feedback dialog"
          description="Found a bug or missing something? Tell us — it goes straight to the maintainer."
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
                disabled={!message.trim() || sending}
                onClick={() => void submit()}
                type="button"
              >
                {sending ? 'Sending…' : 'Send feedback'}
              </button>
            </>
          }
          title="Send feedback"
        >
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
        </DialogShell>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
