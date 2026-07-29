import * as Dialog from '@radix-ui/react-dialog';
import type { UIMessage } from '@ai-sdk/react';
import { fileStore, preferencesStore } from '@rendercv/core';
import type { CvFileSections } from '@rendercv/contracts';
import { useEffect, useState } from 'react';
import { ENABLE_AI_EDITOR, ENABLE_ENHANCED_AI_CHAT } from '../lib/feature-flags';
import { ENHANCED_AI_CHAT_OPEN_STORAGE_KEY } from '../lib/storage-keys';
import { useStore } from '../lib/use-store';
import { AiChatPanel } from './ai-chat-panel';
import { EnhancedAiChatPanel } from './ai-chat-panel-enhanced';

function readEnhancedChatOpenState() {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(ENHANCED_AI_CHAT_OPEN_STORAGE_KEY) ?? '{}');
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function writeEnhancedChatOpenState(value: Record<string, boolean>) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(ENHANCED_AI_CHAT_OPEN_STORAGE_KEY, JSON.stringify(value));
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
  const [enhancedOpenByFile, setEnhancedOpenByFile] = useState<Record<string, boolean>>({});
  const selectedFile = fileSnapshot.files.find((file) => file.id === fileId);
  const initialMessages = (selectedFile?.chatMessages as UIMessage[] | undefined) ?? [];
  const disabled = !fileId || !sections;
  const open = !disabled && (
    ENABLE_ENHANCED_AI_CHAT && fileId ? Boolean(enhancedOpenByFile[fileId]) : preferences.aiEditorOpen
  );

  useEffect(() => {
    if (ENABLE_ENHANCED_AI_CHAT) {
      setEnhancedOpenByFile(readEnhancedChatOpenState());
    }
  }, []);

  useEffect(() => {
    if (!disabled) {
      return;
    }

    if (ENABLE_ENHANCED_AI_CHAT && fileId && enhancedOpenByFile[fileId]) {
      setEnhancedOpenByFile((current) => {
        const next = { ...current, [fileId]: false };
        writeEnhancedChatOpenState(next);
        return next;
      });
      return;
    }

    if (preferences.aiEditorOpen) {
      preferencesStore.patch({ aiEditorOpen: false });
    }
  }, [disabled, fileId, enhancedOpenByFile, preferences.aiEditorOpen]);

  function setOpen(open: boolean) {
    if (ENABLE_ENHANCED_AI_CHAT && fileId) {
      setEnhancedOpenByFile((current) => {
        const next = { ...current, [fileId]: open };
        writeEnhancedChatOpenState(next);
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
          // h-[42px] pins this to the shared toolbar control height rather than
          // letting it fall out of line-height + padding, which drifts with the
          // inherited font size.
          className={`h-[42px] rounded-xl px-3 ${
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
        <Dialog.Overlay className="dialog-overlay-anim fixed inset-0 z-40 bg-background/45 backdrop-blur-[2px]" />
        <Dialog.Content
          className="dialog-content-fade fixed inset-y-4 left-4 right-4 z-50 outline-none md:left-auto md:w-[28rem]"
          data-onboarding="ai-chat"
        >
          <Dialog.Title className="sr-only">AI Editor</Dialog.Title>
          <Dialog.Description className="sr-only">
            Ask for rewrites, bullet tightening, or section-level guidance.
          </Dialog.Description>
          {fileId && sections ? (
            ENABLE_ENHANCED_AI_CHAT ? (
              <EnhancedAiChatPanel
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
