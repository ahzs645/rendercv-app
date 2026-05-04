import { useEffect, useMemo, useRef, useState } from 'react';
import { useChat, type UIMessage } from '@ai-sdk/react';
import type { CvFileSections, SectionKey } from '@rendercv/contracts';
import { EVENTS, fileStore } from '@rendercv/core';
import {
  Check,
  FileText,
  Paperclip,
  Pencil,
  SendHorizontal,
  Sparkles,
  Trash2,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { capture } from '../lib/analytics/posthog-client';
import { api } from '../lib/api';
import {
  applyEditProposalToSection,
  extractEditProposals,
  type AiEditProposal
} from '../features/ai-chat-parity/proposals';

const MAX_ATTACHMENTS = 4;
const MAX_SELECTIONS = 4;

type ChatFilePart = {
  type: 'file';
  mediaType: string;
  filename?: string;
  url: string;
};

type ChatAttachment = {
  id: string;
  fileName: string;
  mediaType: string;
  previewUrl?: string;
  uiPart: ChatFilePart;
};

type SelectionAttachment = {
  id: string;
  section: SectionKey;
  label: string;
  text: string;
};

const MODEL_OPTIONS = [
  { id: 'gpt-5-mini', label: 'GPT-5 Mini', gated: false },
  { id: 'gpt-5', label: 'GPT-5', gated: true }
];

function getMessageText(message: UIMessage) {
  return message.parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('');
}

function getToolParts(message: UIMessage) {
  return message.parts.filter((part) => {
    if (!part || typeof part !== 'object' || !('type' in part)) return false;
    return part.type === 'dynamic-tool' || (typeof part.type === 'string' && part.type.startsWith('tool-'));
  });
}

function getToolLabel(part: unknown) {
  if (!part || typeof part !== 'object') return 'Tool';
  const record = part as Record<string, unknown>;
  if (record.type === 'dynamic-tool' && typeof record.toolName === 'string') return record.toolName;
  if (typeof record.type === 'string' && record.type.startsWith('tool-')) return record.type.slice('tool-'.length);
  return 'Tool';
}

function getToolState(part: unknown) {
  if (!part || typeof part !== 'object') return 'pending';
  const state = (part as Record<string, unknown>).state;
  return typeof state === 'string' ? state.replace(/-/g, ' ') : 'pending';
}

async function fileToAttachment(file: File): Promise<ChatAttachment> {
  const url = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });

  return {
    id: crypto.randomUUID(),
    fileName: file.name,
    mediaType: file.type || 'application/octet-stream',
    previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    uiPart: {
      type: 'file',
      mediaType: file.type || 'application/octet-stream',
      filename: file.name,
      url
    }
  };
}

function buildSelectionPrompt(selections: SelectionAttachment[], text: string) {
  if (selections.length === 0) return text;

  const selectionText = selections
    .map((selection) => {
      return `[${selection.label}]\n${selection.text}`;
    })
    .join('\n\n');

  return `[The user selected this CV content for reference:]\n\n${selectionText}\n\n${text}`;
}

export function AiChatParityPanel({
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
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [selections, setSelections] = useState<SelectionAttachment[]>([]);
  const [proposalStates, setProposalStates] = useState<Record<string, AiEditProposal['status']>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentsRef = useRef<ChatAttachment[]>([]);
  const { messages, sendMessage, status, error } = useChat({
    id: `cv-parity-${fileId}`,
    messages: initialMessages
  });

  const isStreaming = status === 'streaming' || status === 'submitted';
  const proposals = useMemo(
    () =>
      extractEditProposals(messages).map((proposal) => ({
        ...proposal,
        status: proposalStates[proposal.id] ?? proposal.status
      })),
    [messages, proposalStates]
  );

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

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(() => {
    return () => {
      for (const attachment of attachmentsRef.current) {
        if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
      }
    };
  }, []);

  function addSelection(section: SectionKey) {
    if (selections.length >= MAX_SELECTIONS) {
      toast.error(`Only ${MAX_SELECTIONS} selections can be attached.`);
      return;
    }

    const text = sections[section].trim();
    if (!text) return;

    const nextSelection: SelectionAttachment = {
      id: crypto.randomUUID(),
      section,
      label: section.toUpperCase(),
      text: text.slice(0, 2500)
    };
    setSelections((current) => [...current, nextSelection]);
  }

  async function addFiles(files: FileList | null) {
    if (!files) return;

    const remaining = MAX_ATTACHMENTS - attachments.length;
    const nextFiles = [...files].slice(0, remaining);
    const nextAttachments = await Promise.all(nextFiles.map(fileToAttachment));
    setAttachments((current) => [...current, ...nextAttachments]);
  }

  function removeAttachment(id: string) {
    setAttachments((current) => {
      const removed = current.find((attachment) => attachment.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((attachment) => attachment.id !== id);
    });
  }

  function applyProposal(proposal: AiEditProposal) {
    const nextContent = applyEditProposalToSection(sections[proposal.file], proposal);
    fileStore.updateSection(proposal.file, nextContent);
    setProposalStates((current) => ({ ...current, [proposal.id]: 'accepted' }));
    capture(EVENTS.AI_CHAT_PROPOSAL_ACCEPTED, { section: proposal.file, scope: 'tool', cv_id: fileId });
  }

  function rejectProposal(proposal: AiEditProposal) {
    setProposalStates((current) => ({ ...current, [proposal.id]: 'rejected' }));
    capture(EVENTS.AI_CHAT_PROPOSAL_REJECTED, { section: proposal.file, scope: 'tool', cv_id: fileId });
  }

  async function submit() {
    const text = input.trim();
    if ((!text && attachments.length === 0 && selections.length === 0) || isStreaming) return;

    setInput('');
    const messageText = buildSelectionPrompt(selections, text || 'Use the attached context to suggest improvements.');
    const fileParts = attachments.map((attachment) => attachment.uiPart);
    setSelections([]);
    setAttachments((current) => {
      for (const attachment of current) {
        if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
      }
      return [];
    });

    await sendMessage(
      { text: messageText, files: fileParts },
      {
        body: {
          fileId,
          model,
          fileContext: sections,
          chatSessionId: `cv-${fileId}`
        }
      }
    );
  }

  return (
    <section
      className={['flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card', className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              AI Editor
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Attachments, selections, and YAML edit proposals.</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="text-right text-xs text-muted-foreground">
              <p>{usageLabel}</p>
              <select
                className="mt-1 rounded-lg border border-border bg-background px-2 py-1 text-foreground"
                value={model}
                onChange={(event) => onModelChange?.(event.target.value)}
              >
                {MODEL_OPTIONS.map((option) => (
                  <option key={option.id} disabled={option.gated} value={option.id}>
                    {option.label}{option.gated ? ' (locked)' : ''}
                  </option>
                ))}
              </select>
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
            Attach a job description, select CV context, or ask for an edit.
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
              {getToolParts(message).length > 0 ? (
                <div className="mt-3 space-y-1">
                  {getToolParts(message).map((part, index) => (
                    <div key={index} className="flex items-center gap-2 rounded-lg bg-background/70 px-2 py-1 text-xs">
                      <Pencil className="size-3.5" />
                      <span className="font-medium">{getToolLabel(part)}</span>
                      <span className="text-muted-foreground">{getToolState(part)}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          ))
        )}

        {proposals.length > 0 ? (
          <div className="space-y-2 rounded-xl border border-border bg-background p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Edit proposals</p>
            {proposals.map((proposal) => (
              <div key={proposal.id} className="space-y-2 rounded-lg border border-border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{proposal.file.toUpperCase()}</span>
                  <span className="text-xs text-muted-foreground">{proposal.status}</span>
                </div>
                <div className="grid gap-2 text-xs md:grid-cols-2">
                  <pre className="max-h-32 overflow-auto whitespace-pre-wrap rounded bg-muted p-2">{proposal.oldText}</pre>
                  <pre className="max-h-32 overflow-auto whitespace-pre-wrap rounded bg-muted p-2">{proposal.newText}</pre>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs disabled:opacity-50"
                    disabled={proposal.status !== 'pending'}
                    onClick={() => rejectProposal(proposal)}
                    type="button"
                  >
                    <X className="size-3.5" />
                    Reject
                  </button>
                  <button
                    className="inline-flex items-center gap-1 rounded-lg bg-primary px-2 py-1 text-xs text-primary-foreground disabled:opacity-50"
                    disabled={proposal.status !== 'pending'}
                    onClick={() => applyProposal(proposal)}
                    type="button"
                  >
                    <Check className="size-3.5" />
                    Apply
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <form
        className="border-t border-border px-4 py-3"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        {attachments.length > 0 || selections.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <button
                key={attachment.id}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs"
                onClick={() => removeAttachment(attachment.id)}
                type="button"
              >
                <FileText className="size-3.5" />
                {attachment.fileName}
                <X className="size-3.5" />
              </button>
            ))}
            {selections.map((selection) => (
              <button
                key={selection.id}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs"
                onClick={() => setSelections((current) => current.filter((entry) => entry.id !== selection.id))}
                type="button"
              >
                <Sparkles className="size-3.5" />
                {selection.label}
                <X className="size-3.5" />
              </button>
            ))}
          </div>
        ) : null}
        <div className="flex items-end gap-3">
          <textarea
            className="min-h-24 flex-1 rounded-2xl border border-border bg-background px-3 py-2 text-sm"
            placeholder="Ask the assistant to improve wording, identify weak spots, or propose YAML edits."
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              className="hidden"
              type="file"
              multiple
              accept="application/pdf,image/*,.txt,.md"
              onChange={(event) => {
                void addFiles(event.currentTarget.files);
                event.currentTarget.value = '';
              }}
            />
            <button
              className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-3 text-sm"
              disabled={attachments.length >= MAX_ATTACHMENTS}
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <Paperclip className="size-4" />
            </button>
            <button
              className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-3 text-sm"
              onClick={() => addSelection('cv')}
              type="button"
            >
              <Sparkles className="size-4" />
            </button>
            <button
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
              disabled={isStreaming}
              type="submit"
            >
              <SendHorizontal className="size-4" />
              Send
            </button>
          </div>
        </div>
        {error ? <p className="mt-2 text-sm text-destructive">{error.message}</p> : null}
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>{attachments.length}/{MAX_ATTACHMENTS} files</span>
          <button
            className="inline-flex items-center gap-1 hover:text-foreground"
            type="button"
            onClick={() => {
              setAttachments((current) => {
                for (const attachment of current) {
                  if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
                }
                return [];
              });
              setSelections([]);
            }}
          >
            <Trash2 className="size-3.5" />
            Clear context
          </button>
        </div>
      </form>
    </section>
  );
}
