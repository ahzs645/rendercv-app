import * as Dialog from '@radix-ui/react-dialog';
import type { UIMessage } from '@ai-sdk/react';
import { fileStore, preferencesStore } from '@rendercv/core';
import type { CvFileSections } from '@rendercv/contracts';
import { useEffect, useState } from 'react';
import { ENABLE_AI_CHAT_PARITY, ENABLE_AI_EDITOR } from '../lib/feature-flags';
import { useStore } from '../lib/use-store';
import { AiChatPanel } from './ai-chat-panel';
import { AiChatParityPanel } from './ai-chat-parity-panel';

const AI_PARITY_OPEN_STORAGE_KEY = 'rendercv.aiEditorOpenByFile.v1';

function readParityOpenState() {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(AI_PARITY_OPEN_STORAGE_KEY) ?? '{}');
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function writeParityOpenState(value: Record<string, boolean>) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(AI_PARITY_OPEN_STORAGE_KEY, JSON.stringify(value));
}

export function WorkspaceAiEditor({
  fileId,
  sections
}: {
  fileId?: string;
  sections?: CvFileSections;
}) {
  if (!ENABLE_AI_EDITOR) {
    return null;
  }

  const preferences = useStore(preferencesStore);
  const fileSnapshot = useStore(fileStore);
  const [parityOpenByFile, setParityOpenByFile] = useState<Record<string, boolean>>({});
  const selectedFile = fileSnapshot.files.find((file) => file.id === fileId);
  const initialMessages = (selectedFile?.chatMessages as UIMessage[] | undefined) ?? [];
  const disabled = !fileId || !sections;
  const open = !disabled && (
    ENABLE_AI_CHAT_PARITY && fileId ? Boolean(parityOpenByFile[fileId]) : preferences.aiEditorOpen
  );

  useEffect(() => {
    if (ENABLE_AI_CHAT_PARITY) {
      setParityOpenByFile(readParityOpenState());
    }
  }, []);

  useEffect(() => {
    if (!disabled) {
      return;
    }

    if (ENABLE_AI_CHAT_PARITY && fileId && parityOpenByFile[fileId]) {
      setParityOpenByFile((current) => {
        const next = { ...current, [fileId]: false };
        writeParityOpenState(next);
        return next;
      });
      return;
    }

    if (preferences.aiEditorOpen) {
      preferencesStore.patch({ aiEditorOpen: false });
    }
  }, [disabled, fileId, parityOpenByFile, preferences.aiEditorOpen]);

  function setOpen(open: boolean) {
    if (ENABLE_AI_CHAT_PARITY && fileId) {
      setParityOpenByFile((current) => {
        const next = { ...current, [fileId]: open };
        writeParityOpenState(next);
        return next;
      });
      return;
    }

    preferencesStore.patch({ aiEditorOpen: open });
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={setOpen}
    >
      <Dialog.Trigger asChild>
        <button
          className={`rounded-xl px-3 py-2 ${
            preferences.aiEditorOpen
              ? 'bg-primary text-primary-foreground'
              : 'border border-border bg-card text-foreground'
          } disabled:cursor-not-allowed disabled:opacity-50`}
          disabled={disabled}
          data-onboarding="ai-chat"
          type="button"
        >
          AI Editor
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-background/45 backdrop-blur-[2px]" />
        <Dialog.Content
          className="fixed inset-y-4 left-4 right-4 z-50 outline-none md:left-auto md:w-[28rem]"
          data-onboarding="ai-chat"
        >
          <Dialog.Title className="sr-only">AI Editor</Dialog.Title>
          <Dialog.Description className="sr-only">
            Ask for rewrites, bullet tightening, or section-level guidance.
          </Dialog.Description>
          {fileId && sections ? (
            ENABLE_AI_CHAT_PARITY ? (
              <AiChatParityPanel
                className="shadow-2xl"
                fileId={fileId}
                initialMessages={initialMessages}
                model={preferences.selectedModel}
                onClose={() => setOpen(false)}
                onModelChange={(model) => preferencesStore.patch({ selectedModel: model })}
                sections={sections}
              />
            ) : (
              <AiChatPanel
                className="shadow-2xl"
                fileId={fileId}
                initialMessages={initialMessages}
                model={preferences.selectedModel}
                onClose={() => setOpen(false)}
                onModelChange={(model) => preferencesStore.patch({ selectedModel: model })}
                sections={sections}
              />
            )
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
