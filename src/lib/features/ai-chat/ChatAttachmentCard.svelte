<script lang="ts">
  import XIcon from '@lucide/svelte/icons/x';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import { Button } from '$lib/ui/components/button/index.js';

  interface Props {
    type: 'image' | 'pdf';
    src?: string;
    filename: string;
    compact?: boolean;
    onRemove?: () => void;
  }

  let { type, src, filename, compact = false, onRemove }: Props = $props();
</script>

<div class="relative">
  {#if type === 'image'}
    {#if compact}
      <div class="h-24 w-24 overflow-hidden rounded-xl bg-muted">
        <img {src} alt={filename} class="size-full object-cover" />
      </div>
    {:else}
      <img {src} alt={filename} class="max-w-30 rounded-xl" />
    {/if}
  {:else}
    <div class="flex h-16 items-center gap-2.5 rounded-xl bg-muted px-2.5">
      <div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-red-500">
        <FileTextIcon class="size-5 text-white" />
      </div>
      <div class="min-w-0 {onRemove ? 'pr-6' : ''}">
        <p class="max-w-28 truncate text-xs font-medium">{filename}</p>
        <p class="text-[10px] text-muted-foreground">PDF</p>
      </div>
    </div>
  {/if}

  {#if onRemove}
    <Button
      type="button"
      variant="ghost"
      size="icon"
      class="absolute top-1 right-1 size-5 rounded-full bg-black/50 text-white hover:bg-black/70"
      onclick={onRemove}
    >
      <XIcon class="size-2.5" />
    </Button>
  {/if}
</div>
