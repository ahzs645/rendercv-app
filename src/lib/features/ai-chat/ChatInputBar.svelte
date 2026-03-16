<script lang="ts">
  import { aiChat } from './chat-state.svelte';
  import { ACCEPTED_INPUT, type ChatAttachment } from './chat-file-utils';
  import type { SelectionAttachment } from './selection-attachment.svelte';
  import { Button } from '$lib/ui/components/button/index.js';
  import ImageIcon from '@lucide/svelte/icons/image';
  import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
  import SquareIcon from '@lucide/svelte/icons/square';
  import XIcon from '@lucide/svelte/icons/x';
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import ChatAttachmentCard from './ChatAttachmentCard.svelte';
  import ModelSelector from './ModelSelector.svelte';

  interface Props {
    input: string;
    textareaEl: HTMLTextAreaElement;
    attachments: ChatAttachment[];
    selections: SelectionAttachment[];
    isStreaming: boolean;
    hasMessages: boolean;
    showBorderTop: boolean;
    isEditing: boolean;
    onSubmit: (e: SubmitEvent | KeyboardEvent) => void;
    onStop: () => void;
    onFiles: (files: FileList | File[]) => void;
    onRemoveAttachment: (id: string) => void;
    onRemoveSelection: (id: string) => void;
    onCancelEdit: () => void;
  }

  let {
    input = $bindable(),
    textareaEl = $bindable(),
    attachments,
    selections,
    isStreaming,
    hasMessages,
    showBorderTop,
    isEditing,
    onSubmit,
    onStop,
    onFiles,
    onRemoveAttachment,
    onRemoveSelection,
    onCancelEdit
  }: Props = $props();

  const SOURCE_COLORS: Record<SelectionAttachment['source'], string> = {
    yaml: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
    form: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25'
  };

  function chipLabel(sel: SelectionAttachment): string {
    if (sel.context) return sel.context;
    const lines = sel.text.split('\n').length;
    return lines === 1 ? '1 line' : `${lines} lines`;
  }

  let fileInputEl: HTMLInputElement;

  function autoResize() {
    if (!textareaEl) return;
    textareaEl.style.height = 'auto';
    textareaEl.style.height = `${textareaEl.scrollHeight}px`;
  }
</script>

<div class={showBorderTop ? 'border-t' : ''}>
  {#if isEditing}
    <div class="flex items-center gap-1.5 px-4 pt-2 text-xs text-muted-foreground">
      <PencilIcon class="size-3" />
      <span class="font-medium">Edit</span>
      <div class="flex-1"></div>
      <button
        type="button"
        class="rounded p-0.5 transition-colors hover:text-foreground"
        onclick={onCancelEdit}
      >
        <XIcon class="size-3.5" />
      </button>
    </div>
  {/if}

  {#if attachments.length > 0}
    <div class="flex flex-wrap items-center gap-1.5 px-4 pt-2">
      {#each attachments as attachment (attachment.id)}
        <ChatAttachmentCard
          type={attachment.file.type.startsWith('image/') ? 'image' : 'pdf'}
          src={attachment.previewUrl}
          filename={attachment.file.name}
          compact
          onRemove={() => onRemoveAttachment(attachment.id)}
        />
      {/each}
    </div>
  {/if}

  <form onsubmit={onSubmit}>
    <input
      bind:this={fileInputEl}
      type="file"
      accept={ACCEPTED_INPUT}
      multiple
      class="hidden"
      onchange={() => {
        if (fileInputEl?.files?.length) {
          onFiles(fileInputEl.files);
          fileInputEl.value = '';
        }
      }}
    />

    <!-- Top row: selection chips + textarea -->
    <div class="flex min-h-13 flex-wrap items-center gap-1 px-4">
      {#each selections as sel (sel.id)}
        <span
          class="inline-flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-xs font-medium {SOURCE_COLORS[
            sel.source
          ]}"
        >
          <span>{chipLabel(sel)}</span>
          <button
            type="button"
            class="shrink-0 rounded p-0.5 opacity-50 transition-opacity hover:opacity-100"
            onclick={() => onRemoveSelection(sel.id)}
          >
            <XIcon class="size-3" />
          </button>
        </span>
      {/each}
      <textarea
        bind:this={textareaEl}
        bind:value={input}
        rows={1}
        placeholder={aiChat.quotaExceeded ? 'AI usage limit reached' : 'Ask anything...'}
        disabled={aiChat.quotaExceeded}
        oninput={autoResize}
        onfocus={() => {
          if (hasMessages) aiChat.isOverlayOpen = true;
        }}
        onpaste={(e: ClipboardEvent) => {
          const files = Array.from(e.clipboardData?.files ?? []);
          if (files.length > 0) {
            e.preventDefault();
            onFiles(files);
          }
        }}
        onkeydown={(e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            if (isEditing) {
              onCancelEdit();
            } else {
              aiChat.isOverlayOpen = false;
              textareaEl?.blur();
            }
          } else if (e.key === 'Enter' && !e.shiftKey) {
            onSubmit(e);
          }
        }}
        class="max-h-[150px] min-w-0 flex-1 resize-none overflow-y-auto bg-transparent py-0 text-sm leading-7 outline-none placeholder:text-muted-foreground disabled:opacity-50"
      ></textarea>
    </div>

    <!-- Bottom row: model selector (left) + attach & send (right) -->
    <div class="flex items-center justify-between px-2.5 pb-2">
      <ModelSelector />
      <div class="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          class="size-7 shrink-0 rounded-full text-muted-foreground"
          data-ph-capture-attribute-action="attach-file"
          data-ph-capture-attribute-section="chat"
          disabled={isStreaming || aiChat.quotaExceeded}
          onclick={() => fileInputEl?.click()}
        >
          <ImageIcon class="size-4" />
        </Button>
        {#if isStreaming}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            class="size-7 shrink-0 rounded-full"
            data-ph-capture-attribute-action="stop-streaming"
            data-ph-capture-attribute-section="chat"
            onclick={onStop}
          >
            <SquareIcon class="size-3.5 fill-current" />
          </Button>
        {:else}
          <Button
            type="submit"
            size="icon"
            class="size-7 shrink-0 rounded-full bg-foreground text-background hover:bg-foreground/80"
            data-ph-capture-attribute-action="send-message"
            data-ph-capture-attribute-section="chat"
          >
            <ArrowUpIcon class="size-4.5" />
          </Button>
        {/if}
      </div>
    </div>
  </form>
</div>
