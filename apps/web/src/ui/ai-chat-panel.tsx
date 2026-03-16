import { useEffect, useState } from 'react';
import { useChat, type UIMessage } from '@ai-sdk/react';
import type { CvFileSections } from '@rendercv/contracts';
import { SendHorizontal, X } from 'lucide-react';
import { fileStore } from '@rendercv/core';
import { api } from '../lib/api';

function getMessageText(message: UIMessage) {
  return message.parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('');
}

export function AiChatPanel({
  fileId,
  sections,
  model,
  initialMessages,
  onClose,
  onModelChange,
  className
}: {
  fileId: string;
  sections: CvFileSections;
  model: string;
  initialMessages: UIMessage[];
  onClose?: () => void;
  onModelChange?: (model: string) => void;
  className?: string;
}) {
  const [input, setInput] = useState('');
  const [usageLabel, setUsageLabel] = useState<string>('Usage unavailable');
  const { messages, sendMessage, status, error } = useChat({
    id: `cv-${fileId}`,
    messages: initialMessages
  });

  useEffect(() => {
    fileStore.setChatMessages(fileId, messages);
  }, [fileId, messages]);

  useEffect(() => {
    api.getAiUsage()
      .then((result) => {
        setUsageLabel(`${result.usage.used}/${result.usage.limit} prompts used`);
      })
      .catch(() => {
        setUsageLabel('Usage unavailable');
      });
  }, [messages.length, status]);

  return (
    <section
      className={['flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card', className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              AI Editor
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ask for rewrites, bullet tightening, or section-level guidance.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="text-right text-xs text-muted-foreground">
              <p>{usageLabel}</p>
              {onModelChange ? (
                <select
                  className="mt-1 rounded-lg border border-border bg-background px-2 py-1 text-foreground"
                  value={model}
                  onChange={(event) => onModelChange(event.target.value)}
                >
                  <option value="gpt-5-mini">GPT-5 Mini</option>
                  <option value="gpt-5">GPT-5</option>
                </select>
              ) : (
                <p>{status === 'ready' ? model : 'Thinking…'}</p>
              )}
            </div>
            {onClose ? (
              <button
                type="button"
                aria-label="Close AI editor"
                className="rounded-lg border border-border bg-background p-2 text-muted-foreground transition-colors hover:text-foreground"
                onClick={onClose}
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-auto px-4 py-3">
        {messages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            Try “rewrite my headline for a machine learning role” or “make my experience bullets more metric-driven.”
          </div>
        ) : (
          messages.map((message) => (
            <article
              key={message.id}
              className={`rounded-2xl px-4 py-3 text-sm ${
                message.role === 'user'
                  ? 'ml-8 bg-primary text-primary-foreground'
                  : 'mr-8 bg-muted text-foreground'
              }`}
            >
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] opacity-70">
                {message.role === 'user' ? 'You' : 'Assistant'}
              </p>
              <p className="whitespace-pre-wrap leading-6">{getMessageText(message)}</p>
            </article>
          ))
        )}
      </div>
      <form
        className="border-t border-border px-4 py-3"
        onSubmit={async (event) => {
          event.preventDefault();
          const nextInput = input.trim();
          if (!nextInput) {
            return;
          }

          setInput('');
          await sendMessage(
            { text: nextInput },
            {
              body: {
                fileId,
                model,
                fileContext: sections
              }
            }
          );
        }}
      >
        <div className="flex items-end gap-3">
          <textarea
            className="min-h-24 flex-1 rounded-2xl border border-border bg-background px-3 py-2 text-sm"
            placeholder="Ask the assistant to improve wording, identify weak spots, or suggest edits."
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
          <button
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
            disabled={status !== 'ready'}
            type="submit"
          >
            <SendHorizontal className="size-4" />
            Send
          </button>
        </div>
        {error ? <p className="mt-2 text-sm text-destructive">{error.message}</p> : null}
      </form>
    </section>
  );
}
