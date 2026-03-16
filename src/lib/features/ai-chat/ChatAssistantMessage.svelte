<script lang="ts">
  import type { UIMessage } from '@ai-sdk/svelte';
  import { aiChat } from './chat-state.svelte';
  import { segmentize } from './segmentize';
  import { Typewriter } from './typewriter.svelte';
  import CompactStackRenderer from './renderers/CompactStackRenderer.svelte';

  interface Props {
    message: UIMessage;
  }

  let { message }: Props = $props();

  const typewriter = new Typewriter();

  let segments = $derived(segmentize(message.parts));

  // Full text = all text segments combined
  let fullText = $derived(
    segments
      .filter((s): s is { type: 'text'; text: string } => s.type === 'text')
      .map((s) => s.text)
      .join('')
  );

  let hasText = $derived(fullText.length > 0);

  // The text of the last text segment (what the typewriter targets)
  let lastTextSegmentText = $derived.by(() => {
    for (let i = segments.length - 1; i >= 0; i--) {
      if (segments[i].type === 'text') return (segments[i] as { type: 'text'; text: string }).text;
    }
    return '';
  });

  let isLastMessage = $derived(aiChat.messages[aiChat.messages.length - 1]?.id === message.id);
  let isStillStreaming = $derived(aiChat.isStreaming && isLastMessage);

  let hasVisibleContent = $derived(hasText || segments.length > 0 || isStillStreaming);

  // Feed last text segment to typewriter during streaming; flush instantly when done
  $effect(() => {
    if (isStillStreaming) {
      typewriter.source = lastTextSegmentText;
    } else {
      typewriter.flush();
    }
  });

  let displayedText = $derived(
    isStillStreaming || typewriter.isRevealing ? typewriter.displayed : lastTextSegmentText
  );
</script>

{#if hasVisibleContent}
  <div class="relative min-w-0 pb-3 text-xs">
    <CompactStackRenderer
      {segments}
      {displayedText}
      {fullText}
      isStreaming={isStillStreaming}
      isRevealing={typewriter.isRevealing}
      {message}
    />
  </div>
{/if}
