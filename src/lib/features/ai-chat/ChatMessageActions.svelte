<script lang="ts">
  import type { UIMessage } from '@ai-sdk/svelte';
  import { aiChat } from './chat-state.svelte';
  import { Button } from '$lib/ui/components/button/index.js';
  import { cn } from '$lib/ui/utils';
  import CopyIcon from '@lucide/svelte/icons/copy';
  import CheckIcon from '@lucide/svelte/icons/check';
  import PencilIcon from '@lucide/svelte/icons/pencil';

  interface Props {
    message: UIMessage;
    onEdit?: () => void;
  }

  let { message, onEdit }: Props = $props();

  let text = $derived(aiChat.getMessageText(message));
  let copied = $derived(aiChat.isCopied(message.id));
</script>

<div class="flex gap-2">
  <Button
    variant="ghost"
    size="icon-sm"
    onclick={() => aiChat.copyToClipboard(text, message.id)}
    class="relative size-5"
  >
    <span
      class={cn(
        'transition-all duration-200',
        copied ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
      )}
    >
      <CopyIcon class="size-3.5" />
    </span>
    <span
      class={cn(
        'absolute inset-0 flex items-center justify-center transition-all duration-200',
        copied ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
      )}
    >
      <CheckIcon class="size-3.5" />
    </span>
  </Button>

  {#if onEdit}
    <Button variant="ghost" size="icon-sm" onclick={onEdit} class="size-5">
      <PencilIcon class="size-3.5" />
    </Button>
  {/if}
</div>
