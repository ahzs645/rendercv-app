<script lang="ts">
  import type { UIMessage } from '@ai-sdk/svelte';
  import {
    aiChat,
    MIN_OVERLAY_HEIGHT,
    COLLAPSE_THRESHOLD,
    BORDER_VISIBILITY_THRESHOLD
  } from './chat-state.svelte';
  import { onDestroy, tick } from 'svelte';
  import {
    MAX_FILES,
    createAttachment,
    revokeAttachment,
    type ChatAttachment
  } from './chat-file-utils';
  import {
    SELECTION_MARKER,
    parseSelectionChips,
    type SelectionChipMeta
  } from './selection-attachment.svelte';
  import { capture } from '$lib/analytics/posthog-client';
  import { fileState } from '$lib/features/cv-files/file-state.svelte';
  import { EVENTS } from '$lib/analytics/events';
  import UploadIcon from '@lucide/svelte/icons/upload';
  import ChatMessagesPanel from './ChatMessagesPanel.svelte';
  import ChatInputBar from './ChatInputBar.svelte';

  // Input state
  let input = $state('');
  let textareaEl = $state<HTMLTextAreaElement>(undefined!);
  let attachments = $state<ChatAttachment[]>([]);

  // Edit state
  let editingMessageId = $state<string | null>(null);
  let savedInput = $state('');

  // Drag state
  let isDraggingFile = $state(false);
  let fileDragCounter = 0;

  // Layout state
  let containerHeight = $state(0);
  let inputBarHeight = $state(0);
  let maxOverlayHeight = $derived(Math.max(0, containerHeight - 32 - inputBarHeight));

  // Clamp overlay height when input bar grows
  $effect(() => {
    if (aiChat.isOverlayOpen && !aiChat.isDragging && aiChat.overlayHeight > maxOverlayHeight) {
      aiChat.overlayHeight = maxOverlayHeight;
    }
  });

  // Edit handling
  function startEdit(message: UIMessage) {
    if (aiChat.isStreaming) {
      aiChat.stopStreaming();
    }

    savedInput = input;

    const rawText = aiChat.getMessageText(message);
    const { displayText } = parseSelectionChips(rawText);
    input = displayText;
    editingMessageId = message.id;

    tick().then(() => {
      if (textareaEl) {
        textareaEl.style.height = 'auto';
        textareaEl.style.height = `${textareaEl.scrollHeight}px`;
        textareaEl.focus();
      }
    });
  }

  function cancelEdit() {
    input = savedInput;
    savedInput = '';
    editingMessageId = null;

    tick().then(() => {
      if (textareaEl) {
        textareaEl.style.height = 'auto';
        textareaEl.style.height = `${textareaEl.scrollHeight}px`;
      }
    });
  }

  // Submit handling
  async function handleSubmit(e: SubmitEvent | KeyboardEvent) {
    e.preventDefault();
    const text = input.trim();
    const hasSelections = aiChat.selections.length > 0;
    if ((!text && attachments.length === 0 && !hasSelections) || aiChat.isStreaming) return;

    const isEditing = editingMessageId !== null;
    const editMsgId = editingMessageId;

    capture(EVENTS.AI_CHAT_MESSAGE_SENT, {
      has_attachments: attachments.length > 0,
      has_selections: hasSelections,
      cv_id: fileState.selectedFileId
    });

    // Build message with selection context prepended
    let messageText = text;
    if (hasSelections) {
      const selectionBlocks = aiChat.selections.map((sel) => {
        const sourceLabel = sel.source === 'yaml' ? 'YAML editor' : 'form editor';
        const header = sel.context
          ? `[Selection from ${sourceLabel} (${sel.context}):]`
          : `[Selection from ${sourceLabel}:]`;
        return `${header}\n"""\n${sel.text}\n"""`;
      });

      // Embed chip metadata for UI rendering (hidden from display, visible to LLM)
      const chipMetas: SelectionChipMeta[] = aiChat.selections.map((sel) => ({
        source: sel.source,
        lines: sel.text.split('\n').length,
        context: sel.context
      }));
      messageText = `${SELECTION_MARKER}${JSON.stringify(chipMetas)}${SELECTION_MARKER}\n[The user has selected the following content for reference:]\n\n${selectionBlocks.join('\n\n')}\n\n${text}`;
    }

    input = '';
    editingMessageId = null;
    savedInput = '';
    if (textareaEl) {
      textareaEl.style.height = 'auto';
    }
    const fileParts = attachments.map((a) => a.uiPart);
    clearAttachments();
    aiChat.clearSelections();
    aiChat.isOverlayOpen = true;

    if (isEditing && editMsgId) {
      await aiChat.sendMessage(
        messageText,
        fileParts.length > 0 ? fileParts : undefined,
        editMsgId
      );
    } else {
      await aiChat.sendMessage(messageText, fileParts.length > 0 ? fileParts : undefined);
    }
  }

  // Stop streaming
  function handleStop() {
    aiChat.stopStreaming();
  }

  // File handling
  async function handleFiles(files: FileList | File[]) {
    for (const file of files) {
      if (attachments.length >= MAX_FILES) break;
      const attachment = await createAttachment(file);
      if (attachment) {
        attachments.push(attachment);
        attachments = attachments;
      }
    }
  }

  function removeAttachment(id: string) {
    const idx = attachments.findIndex((a) => a.id === id);
    if (idx !== -1) {
      revokeAttachment(attachments[idx]);
      attachments.splice(idx, 1);
      attachments = attachments;
    }
  }

  function clearAttachments() {
    for (const a of attachments) revokeAttachment(a);
    attachments = [];
  }

  // Drag handlers
  function handleFileDragEnter(e: DragEvent) {
    e.preventDefault();
    fileDragCounter++;
    if (e.dataTransfer?.types.includes('Files')) isDraggingFile = true;
  }

  function handleFileDragLeave(e: DragEvent) {
    e.preventDefault();
    fileDragCounter--;
    if (fileDragCounter === 0) isDraggingFile = false;
  }

  function handleFileDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  }

  function handleFileDrop(e: DragEvent) {
    e.preventDefault();
    fileDragCounter = 0;
    isDraggingFile = false;
    if (e.dataTransfer?.files.length) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }

  // Resize handling
  function startResize(e: PointerEvent) {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = aiChat.overlayHeight;
    aiChat.isDragging = true;

    function onMove(ev: PointerEvent) {
      const delta = startY - ev.clientY;
      aiChat.overlayHeight = Math.min(maxOverlayHeight, Math.max(0, startHeight + delta));
    }

    function onUp() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      aiChat.isDragging = false;

      if (aiChat.overlayHeight < COLLAPSE_THRESHOLD) {
        aiChat.overlayHeight = startHeight;
        aiChat.isOverlayOpen = false;
        textareaEl?.blur();
      } else if (aiChat.overlayHeight < MIN_OVERLAY_HEIGHT) {
        aiChat.overlayHeight = Math.min(MIN_OVERLAY_HEIGHT, maxOverlayHeight);
      }
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  onDestroy(() => clearAttachments());
</script>

<div
  bind:clientHeight={containerHeight}
  role="region"
  aria-label="AI chat"
  class="pointer-events-none absolute inset-0 z-10 flex flex-col justify-end p-4"
  ondragenter={handleFileDragEnter}
  ondragleave={handleFileDragLeave}
  ondragover={handleFileDragOver}
  ondrop={handleFileDrop}
>
  <div
    class="pointer-events-auto relative flex flex-col overflow-hidden rounded-xl bg-sidebar/89 shadow-xl backdrop-blur-sm"
  >
    {#if isDraggingFile}
      <div
        class="absolute inset-0 z-50 flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-primary bg-primary/10 backdrop-blur-xs"
      >
        <UploadIcon class="size-6 text-primary" />
        <span class="text-xs font-medium text-primary">Drop images or PDFs here</span>
      </div>
    {/if}

    {#if aiChat.isOverlayOpen && aiChat.hasMessages}
      <ChatMessagesPanel
        onStartResize={startResize}
        onRefresh={() => {
          aiChat.resetChat();
          input = '';
          editingMessageId = null;
          savedInput = '';
          clearAttachments();
        }}
        onEditMessage={startEdit}
      />
    {/if}

    <div bind:clientHeight={inputBarHeight}>
      <ChatInputBar
        bind:input
        bind:textareaEl
        {attachments}
        selections={aiChat.selections}
        isStreaming={aiChat.isStreaming}
        hasMessages={aiChat.hasMessages}
        isEditing={editingMessageId !== null}
        showBorderTop={aiChat.isOverlayOpen &&
          aiChat.hasMessages &&
          aiChat.overlayHeight >= BORDER_VISIBILITY_THRESHOLD}
        onSubmit={handleSubmit}
        onStop={handleStop}
        onFiles={handleFiles}
        onRemoveAttachment={removeAttachment}
        onRemoveSelection={(id) => aiChat.removeSelection(id)}
        onCancelEdit={cancelEdit}
      />
    </div>
  </div>
</div>
