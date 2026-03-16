<script lang="ts">
  import type { UIMessage } from '@ai-sdk/svelte';
  import ChatAttachmentCard from './ChatAttachmentCard.svelte';
  import ChatMessageActions from './ChatMessageActions.svelte';
  import { parseSelectionChips, type SelectionChipMeta } from './selection-attachment.svelte';

  interface Props {
    message: UIMessage;
    onEdit?: () => void;
  }

  let { message, onEdit }: Props = $props();

  let fileParts = $derived(message.parts.filter((p) => p.type === 'file'));
  let textParts = $derived(message.parts.filter((p) => p.type === 'text' && p.text));

  let parsed = $derived.by(() => {
    const raw = textParts.map((p) => (p.type === 'text' ? p.text : '')).join('');
    return parseSelectionChips(raw);
  });

  let hasContent = $derived(parsed.displayText.length > 0 || parsed.chips.length > 0);

  const SOURCE_COLORS: Record<string, string> = {
    yaml: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
    form: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25'
  };

  function chipLabel(chip: SelectionChipMeta): string {
    if (chip.context) return chip.context;
    const lineStr = chip.lines === 1 ? '1 line' : `${chip.lines} lines`;
    return lineStr;
  }
</script>

<div class="group flex justify-end pb-3">
  <div class="relative flex max-w-[85%] flex-col items-end gap-1.5">
    {#each fileParts as part, i (i)}
      {#if part.type === 'file'}
        <ChatAttachmentCard
          type={part.mediaType.startsWith('image/') ? 'image' : 'pdf'}
          src={part.url}
          filename={part.filename ?? 'Attachment'}
        />
      {/if}
    {/each}

    {#if hasContent}
      <div class="flex flex-col items-end gap-1.5">
        {#if parsed.chips.length > 0}
          <div class="flex flex-wrap justify-end gap-1">
            {#each parsed.chips as chip, i (i)}
              <span
                class="inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-medium {SOURCE_COLORS[
                  chip.source
                ] ?? 'border-border bg-muted text-muted-foreground'}"
              >
                {chipLabel(chip)}
              </span>
            {/each}
          </div>
        {/if}
        {#if parsed.displayText}
          <div class="rounded-2xl bg-background p-3 text-sm text-foreground">
            <p class="whitespace-pre-wrap">{parsed.displayText}</p>
          </div>
        {/if}
      </div>
    {/if}

    <div class="absolute right-0 -bottom-6 opacity-0 transition-opacity group-hover:opacity-100">
      <ChatMessageActions {message} {onEdit} />
    </div>
  </div>
</div>
