<script lang="ts">
  import type { ActivitySegment } from '../segmentize';
  import { getToolIcon, getToolLabel } from '../tool-registry';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
  import CheckIcon from '@lucide/svelte/icons/check';
  import XIcon from '@lucide/svelte/icons/x';
  import BrainIcon from '@lucide/svelte/icons/brain';

  interface Props {
    segment: ActivitySegment;
    isStreaming: boolean;
  }

  let { segment, isStreaming }: Props = $props();

  let expanded = $state(false);

  // Filter out editYaml error entries (validation retries are internal)
  let filteredEntries = $derived(
    segment.entries.filter(
      (e) => !(e.kind === 'tool' && e.toolName === 'editYaml' && e.status === 'error')
    )
  );

  let lastEntry = $derived(filteredEntries[filteredEntries.length - 1]);

  // The block is "in progress" if streaming and the last entry hasn't resolved yet
  let isInProgress = $derived(
    isStreaming && lastEntry?.kind === 'tool' && lastEntry.status === 'running'
  );
</script>

<div class="my-1">
  <button
    onclick={() => (expanded = !expanded)}
    class="group flex w-full items-start gap-1.5 py-0.5 text-left opacity-75 transition-opacity hover:opacity-90"
  >
    <ChevronRightIcon
      class="mt-[3px] size-2.5 shrink-0 text-muted-foreground/50 transition-transform {expanded
        ? 'rotate-90'
        : ''}"
    />
    <div class="min-w-0 flex-1">
      {#if expanded}
        <!-- Expanded: scrollable full entry list with status icons -->
        <div class="max-h-48 space-y-0.5 overflow-y-auto">
          {#each filteredEntries as entry}
            {#if entry.kind === 'tool'}
              {@const Icon = getToolIcon(entry.toolName)}
              <div class="flex items-center gap-1.5">
                <Icon class="size-3 shrink-0 text-muted-foreground/60" />
                <span class="truncate text-[11px] text-muted-foreground">
                  {getToolLabel(entry.toolName)}
                </span>
                {#if entry.detail}
                  <span class="truncate text-[11px] text-muted-foreground/50">{entry.detail}</span>
                {/if}
                {#if entry.status === 'error'}
                  <XIcon class="size-2.5 text-red-400" />
                {:else if entry.status === 'done'}
                  <CheckIcon class="size-2.5 text-emerald-500/60" />
                {:else}
                  <LoaderCircleIcon class="size-2.5 animate-spin text-blue-500" />
                {/if}
              </div>
            {:else}
              <div class="flex items-center gap-1.5">
                <BrainIcon class="size-3 shrink-0 text-muted-foreground/60" />
                <span class="truncate text-[11px] text-muted-foreground">{entry.title}</span>
              </div>
              {#if entry.content}
                <div
                  class="pt-0.5 pb-1 pl-[18px] text-[11px] leading-relaxed text-muted-foreground/70"
                >
                  {entry.content}
                </div>
              {/if}
            {/if}
          {/each}
        </div>
      {:else}
        <!-- Collapsed: latest entry label with shimmer when in progress -->
        {#if lastEntry}
          <div class="flex items-center gap-1.5">
            {#if lastEntry.kind === 'tool'}
              {@const Icon = getToolIcon(lastEntry.toolName)}
              <Icon class="size-3 shrink-0 text-muted-foreground/50" />
              <span
                class="truncate text-[11px] text-muted-foreground/70 {isInProgress
                  ? 'activity-shimmer'
                  : ''}"
              >
                {getToolLabel(lastEntry.toolName)}
              </span>
            {:else}
              <BrainIcon class="size-3 shrink-0 text-muted-foreground/50" />
              <span
                class="truncate text-[11px] text-muted-foreground/70 {isInProgress
                  ? 'activity-shimmer'
                  : ''}"
              >
                {lastEntry.title}
              </span>
            {/if}
          </div>
        {/if}
      {/if}
    </div>
  </button>
</div>

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
