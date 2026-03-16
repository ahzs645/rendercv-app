import * as Dialog from '@radix-ui/react-dialog';
import type { UIMessage } from '@ai-sdk/react';
import { fileStore, preferencesStore } from '@rendercv/core';
import type { CvFileSections } from '@rendercv/contracts';
import { useEffect } from 'react';
import { useStore } from '../lib/use-store';
import { AiChatPanel } from './ai-chat-panel';

export function WorkspaceAiEditor({
  fileId,
  sections
}: {
  fileId?: string;
  sections?: CvFileSections;
}) {
  const preferences = useStore(preferencesStore);
  const fileSnapshot = useStore(fileStore);
  const selectedFile = fileSnapshot.files.find((file) => file.id === fileId);
  const initialMessages = (selectedFile?.chatMessages as UIMessage[] | undefined) ?? [];
  const disabled = !fileId || !sections;

  useEffect(() => {
    if (disabled && preferences.aiEditorOpen) {
      preferencesStore.patch({ aiEditorOpen: false });
    }
  }, [disabled, preferences.aiEditorOpen]);

  return (
    <Dialog.Root
      open={!disabled && preferences.aiEditorOpen}
      onOpenChange={(open) => preferencesStore.patch({ aiEditorOpen: open })}
    >
      <Dialog.Trigger asChild>
        <button
          className={`rounded-xl px-3 py-2 ${
            preferences.aiEditorOpen
              ? 'bg-primary text-primary-foreground'
              : 'border border-border bg-card text-foreground'
          } disabled:cursor-not-allowed disabled:opacity-50`}
          disabled={disabled}
          type="button"
        >
          AI Editor
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-background/45 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed inset-y-4 left-4 right-4 z-50 outline-none md:left-auto md:w-[28rem]">
          <Dialog.Title className="sr-only">AI Editor</Dialog.Title>
          <Dialog.Description className="sr-only">
            Ask for rewrites, bullet tightening, or section-level guidance.
          </Dialog.Description>
          {fileId && sections ? (
            <AiChatPanel
              className="shadow-2xl"
              fileId={fileId}
              initialMessages={initialMessages}
              model={preferences.selectedModel}
              onClose={() => preferencesStore.patch({ aiEditorOpen: false })}
              onModelChange={(model) => preferencesStore.patch({ selectedModel: model })}
              sections={sections}
            />
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
