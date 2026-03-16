<script lang="ts">
  import type { UIMessage } from '@ai-sdk/svelte';
  import type { Segment } from '../segmentize';
  import ActivityBlock from './ActivityBlock.svelte';
  import ChatMessageActions from '../ChatMessageActions.svelte';
  import { Streamdown } from 'svelte-streamdown';
  import Code from 'svelte-streamdown/code';
  import { mode } from 'mode-watcher';
  import githubLightDefault from '@shikijs/themes/github-light-default';
  import githubDarkDefault from '@shikijs/themes/github-dark-default';

  interface Props {
    segments: Segment[];
    displayedText: string;
    fullText: string;
    isStreaming: boolean;
    isRevealing: boolean;
    message: UIMessage;
  }

  let { segments, displayedText, fullText, isStreaming, isRevealing, message }: Props = $props();

  let shikiTheme = $derived(
    mode.current === 'dark' ? 'github-dark-default' : 'github-light-default'
  );

  let hideActions = $derived(isStreaming || isRevealing);
  let hasText = $derived(fullText.length > 0);

  // Find the index of the last text segment
  let lastTextSegmentIndex = $derived.by(() => {
    for (let i = segments.length - 1; i >= 0; i--) {
      if (segments[i].type === 'text') return i;
    }
    return -1;
  });
</script>

{#if isStreaming && segments.length === 0}
  <span class="activity-shimmer text-[11px] text-muted-foreground/60">Thinking</span>
{/if}

{#each segments as segment, idx}
  {#if segment.type === 'text'}
    {@const isLastText = idx === lastTextSegmentIndex}
    {@const content = isLastText ? displayedText : segment.text}
    {#if content}
      <Streamdown
        {content}
        class="prose-xs [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
        {shikiTheme}
        baseTheme="shadcn"
        components={{ code: Code }}
        shikiThemes={{
          'github-light-default': githubLightDefault,
          'github-dark-default': githubDarkDefault
        }}
      />
    {/if}
  {:else if segment.type === 'activity'}
    <ActivityBlock {segment} {isStreaming} />
  {/if}
{/each}

{#if !hideActions && hasText}
  <div class="absolute -bottom-3 left-0">
    <ChatMessageActions {message} />
  </div>
{/if}

<style>
  .activity-shimmer {
    background: linear-gradient(
      90deg,
      currentColor 0%,
      currentColor 40%,
      color-mix(in srgb, currentColor 40%, transparent) 50%,
      currentColor 60%,
      currentColor 100%
    );
    background-size: 200% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 1.5s ease-in-out infinite;
  }

  @keyframes shimmer {
    0% {
      background-position: 200% center;
    }
    100% {
      background-position: -200% center;
    }
  }
</style>
