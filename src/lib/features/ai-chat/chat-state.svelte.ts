import { Chat, type UIMessage } from '@ai-sdk/svelte';
import { DefaultChatTransport } from 'ai';
import type { FileUIPart } from 'ai';
import type { CvFileSections, SectionKey } from '$lib/features/cv-files/types';
import { MAX_SELECTIONS, type SelectionAttachment } from './selection-attachment.svelte';
import { authState } from '$lib/features/auth/auth-state.svelte';
import { loginDialogState } from '$lib/features/auth/login-dialog-state.svelte';
import { aiUsageState } from './ai-usage-state.svelte';
import { preferences } from '$lib/features/preferences/pref-state.svelte';
import { capture } from '$lib/analytics/posthog-client';
import { EVENTS } from '$lib/analytics/events';
import type { FileState } from '$lib/features/cv-files/file-state.svelte';

export const MIN_OVERLAY_HEIGHT = 180;
export const COLLAPSE_THRESHOLD = 100;
export const BORDER_VISIBILITY_THRESHOLD = 80;

export interface EditProposal {
  file: SectionKey;
  oldText: string;
  newText: string;
}

export type RendererType = 'compact-stack';

export class AiChatState {
  chat: Chat | null = $state(null);
  editProposals = $state<EditProposal[]>([]);
  isOverlayOpen = $state(false);
  overlayHeight = $state(MIN_OVERLAY_HEIGHT);
  isDragging = $state(false);
  quotaExceeded = $state(false);
  error = $state<string | null>(null);
  selections = $state<SelectionAttachment[]>([]);
  renderer = $state<RendererType>('compact-stack');

  #chatInstances = new Map<string, Chat>();
  #overlayOpenPerFile = new Map<string, boolean>();
  #sessionIds = new Map<string, string>();
  #currentFileId: string | undefined;
  #getFileContext: (() => CvFileSections) | null = null;
  #fileState: FileState | null = null;

  get messages() {
    return this.chat?.messages ?? [];
  }

  get status() {
    return this.chat?.status ?? 'ready';
  }

  get isStreaming() {
    return this.status === 'streaming' || this.status === 'submitted';
  }

  get hasMessages() {
    return this.messages.length > 0;
  }

  #getSessionId(fileId: string): string {
    let sid = this.#sessionIds.get(fileId);
    if (!sid) {
      sid = crypto.randomUUID();
      this.#sessionIds.set(fileId, sid);
    }
    return sid;
  }

  #createChatForFile(fileId: string): Chat {
    const instance = new Chat({
      transport: new DefaultChatTransport({ api: '/api/chat' }),
      onError: (error) => {
        if (this.#currentFileId !== fileId) return;
        if (error.message?.includes('quota_exceeded')) {
          this.quotaExceeded = true;
          capture(EVENTS.AI_CHAT_QUOTA_EXCEEDED, { cv_id: this.#currentFileId });
        } else if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
          loginDialogState.show({
            title: 'Sign in to use AI features',
            description: 'Create a free account to trial AI-powered CV editing'
          });
        } else {
          this.error = 'Something went wrong. Please try again.';
        }
      },
      onData: (dataPart) => {
        if (this.#currentFileId !== fileId) return;
        if (dataPart.type === 'data-ai-usage') {
          aiUsageState.data = dataPart.data as { used: number; limit: number };
        }
      },
      onFinish: () => {
        if (this.#currentFileId === fileId) {
          this.#processEditProposals();
        }
        this.#persistChatForFile(fileId);
      }
    });
    this.#chatInstances.set(fileId, instance);
    return instance;
  }

  initialize(getFileContext: () => CvFileSections, fileState: FileState) {
    this.#getFileContext = getFileContext;
    this.#fileState = fileState;
  }

  switchToFile(fileId: string | undefined) {
    if (!fileId || fileId === this.#currentFileId) return;

    // Save overlay state for the file we're leaving
    if (this.#currentFileId) {
      this.#overlayOpenPerFile.set(this.#currentFileId, this.isOverlayOpen);
    }

    this.#currentFileId = fileId;

    let instance = this.#chatInstances.get(fileId);
    if (!instance) {
      instance = this.#createChatForFile(fileId);
      const file = this.#fileState?.files.find((f) => f.id === fileId);
      if (file?.chatMessages?.length) {
        instance.messages = file.chatMessages as UIMessage[];
      }
    }

    this.chat = instance;
    this.isOverlayOpen = this.#overlayOpenPerFile.get(fileId) ?? false;
    this.editProposals = [];
    this.error = null;
  }

  #persistChatForFile(fileId: string) {
    const instance = this.#chatInstances.get(fileId);
    const file = this.#fileState?.files.find((f) => f.id === fileId);
    if (!instance || !file) return;

    const messages = $state.snapshot(instance.messages);
    file.chatMessages = messages;
    this.#fileState?.persistence?.onContentChange?.(fileId);
  }

  removeFile(fileId: string) {
    const instance = this.#chatInstances.get(fileId);
    if (instance) {
      instance.stop?.();
      this.#chatInstances.delete(fileId);
    }
    this.#overlayOpenPerFile.delete(fileId);
    this.#sessionIds.delete(fileId);
  }

  async sendMessage(content: string, files?: FileUIPart[], messageId?: string) {
    if (!authState.isLoggedIn) {
      loginDialogState.show({
        title: 'Sign in to use AI features',
        description: 'Create a free account to trial AI-powered CV editing'
      });
      return;
    }

    if (!this.chat || !this.#getFileContext) return;

    this.error = null;
    if (messageId) {
      this.editProposals = [];
    }
    const fileContext = this.#getFileContext();

    const message: { text: string; files?: FileUIPart[]; messageId?: string } = { text: content };
    if (files && files.length > 0) {
      message.files = files;
    }
    if (messageId) {
      message.messageId = messageId;
    }

    const chatSessionId = this.#currentFileId ? this.#getSessionId(this.#currentFileId) : undefined;
    this.chat.sendMessage(message, {
      body: {
        fileContext,
        model: preferences.selectedModel,
        fileId: this.#currentFileId,
        chatSessionId
      }
    });
  }

  #processEditProposals() {
    if (!this.chat) return;

    const messages = this.chat.messages;
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
    if (!lastAssistant) return;

    for (const part of lastAssistant.parts) {
      const isDynamicEdit =
        part.type === 'dynamic-tool' &&
        'toolName' in part &&
        (part as { toolName: string }).toolName === 'editYaml';
      const isTypedEdit = part.type === ('tool-editYaml' as string);

      if (
        (isDynamicEdit || isTypedEdit) &&
        'output' in part &&
        'state' in part &&
        part.state === 'output-available'
      ) {
        const output = (part as { output: unknown }).output as {
          success: boolean;
          file: SectionKey;
        };
        if (!output.success) continue;

        const input = (part as { input: unknown }).input as {
          file: SectionKey;
          oldText: string;
          newText: string;
        };

        if (input.oldText === input.newText) continue;

        const exists = this.editProposals.some(
          (p) => p.file === input.file && p.oldText === input.oldText && p.newText === input.newText
        );
        if (exists) continue;

        this.editProposals.push({
          file: input.file,
          oldText: input.oldText,
          newText: input.newText
        });
      }
    }
  }

  async resetChat() {
    if (this.isStreaming) await this.stopStreaming();
    if (this.chat) this.chat.messages = [];
    this.editProposals = [];
    this.error = null;
    this.quotaExceeded = false;
    // Reset session ID so PostHog starts a new AI session
    if (this.#currentFileId) {
      this.#sessionIds.delete(this.#currentFileId);
      this.#persistChatForFile(this.#currentFileId);
    }
  }

  // --- Copy to clipboard ---

  #copiedMessageId = $state<string | null>(null);

  getMessageText(message: UIMessage): string {
    return message.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('');
  }

  async copyToClipboard(text: string, messageId: string) {
    await navigator.clipboard.writeText(text);
    this.#copiedMessageId = messageId;
    setTimeout(() => {
      this.#copiedMessageId = null;
    }, 2000);
  }

  isCopied(id: string): boolean {
    return this.#copiedMessageId === id;
  }

  async stopStreaming() {
    await this.chat?.stop();
  }

  addSelection(sel: SelectionAttachment) {
    if (this.selections.length >= MAX_SELECTIONS) return;
    this.selections.push(sel);
    this.selections = this.selections;
  }

  removeSelection(id: string) {
    const idx = this.selections.findIndex((s) => s.id === id);
    if (idx !== -1) {
      this.selections.splice(idx, 1);
      this.selections = this.selections;
    }
  }

  clearSelections() {
    this.selections = [];
  }

  dispose() {
    for (const [fileId] of this.#chatInstances) {
      this.#persistChatForFile(fileId);
    }
    this.#chatInstances.clear();
    this.#overlayOpenPerFile.clear();
    this.#sessionIds.clear();
    this.chat = null;
    this.editProposals = [];
    this.selections = [];
    this.#getFileContext = null;
    this.#fileState = null;
    this.#currentFileId = undefined;
  }
}

export const aiChat = new AiChatState();
