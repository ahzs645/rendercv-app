<script lang="ts">
  import type { UIMessage } from '@ai-sdk/svelte';
  import { aiChat, MIN_OVERLAY_HEIGHT } from './chat-state.svelte';
  import { tick } from 'svelte';
  import { slide } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
  import * as Tooltip from '$lib/ui/components/tooltip';
  import XIcon from '@lucide/svelte/icons/x';
  import ChatUserMessage from './ChatUserMessage.svelte';
  import ChatAssistantMessage from './ChatAssistantMessage.svelte';
  import { upgradePromptState } from '$lib/features/auth/upgrade-prompt-state.svelte';
  import { authState } from '$lib/features/auth/auth-state.svelte';
  import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';

  const RECENT_MESSAGE_COUNT = 6;
  const TOP_BAR_FADE_START = 20;
  const TOP_BAR_FADE_RANGE = 60;
  const TOP_BAR_HEIGHT = 35;

  interface Props {
    onStartResize: (e: PointerEvent) => void;
    onRefresh: () => void;
    onEditMessage: (message: UIMessage) => void;
  }

  let { onStartResize, onRefresh, onEditMessage }: Props = $props();

  let recentMessages = $derived(aiChat.messages.slice(-RECENT_MESSAGE_COUNT));
  let showThinking = $derived.by(() => {
    if (!aiChat.isStreaming) return false;
    const lastMsg = aiChat.messages[aiChat.messages.length - 1];
    return !lastMsg || lastMsg.role !== 'assistant';
  });
  let topBarOpacity = $derived(
    Math.min(1, Math.max(0, (aiChat.overlayHeight - TOP_BAR_FADE_START) / TOP_BAR_FADE_RANGE))
  );

  // --- Two-region split: history + active ---
  // Split messages at the last user message. The active region (last user msg + responses)
  // has min-height: overlayHeight, which structurally guarantees no scroll into empty space.
  let lastUserIdx = $derived.by(() => {
    for (let i = recentMessages.length - 1; i >= 0; i--) {
      if (recentMessages[i].role === 'user') return i;
    }
    return -1;
  });

  let historyMessages = $derived(lastUserIdx > 0 ? recentMessages.slice(0, lastUserIdx) : []);
  let lastUserMessage = $derived(lastUserIdx >= 0 ? recentMessages[lastUserIdx] : null);
  let responseMessages = $derived(
    lastUserIdx >= 0 ? recentMessages.slice(lastUserIdx + 1) : recentMessages
  );

  let scrollContainerEl = $state<HTMLDivElement | null>(null);
  let activeRegionEl = $state<HTMLDivElement | null>(null);
  let lastScrolledMessageId = $state<string | null>(null);
  let canScrollDown = $state(false);

  function checkScroll() {
    if (!scrollContainerEl) return;
    canScrollDown =
      scrollContainerEl.scrollTop + scrollContainerEl.clientHeight <
      scrollContainerEl.scrollHeight - 1;
  }

  // Scroll fade detection
  $effect(() => {
    if (!scrollContainerEl) return;
    checkScroll();
    scrollContainerEl.addEventListener('scroll', checkScroll, { passive: true });
    const observer = new ResizeObserver(checkScroll);
    observer.observe(scrollContainerEl);
    return () => {
      scrollContainerEl!.removeEventListener('scroll', checkScroll);
      observer.disconnect();
    };
  });

  // Re-check when content or container size changes
  $effect(() => {
    void aiChat.messages.length;
    void aiChat.isStreaming;
    void aiChat.overlayHeight;
    checkScroll();
    const timer = setTimeout(checkScroll, 250);
    return () => clearTimeout(timer);
  });

  function scrollToActiveRegion(behavior: ScrollBehavior) {
    if (!activeRegionEl || !scrollContainerEl) return;
    const top = Math.max(0, activeRegionEl.offsetTop - TOP_BAR_HEIGHT);
    scrollContainerEl.scrollTo({ top, behavior });
  }

  // Scroll once when user sends a new message — never on mount, reopen, or streaming
  $effect(() => {
    const messages = aiChat.messages;
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== 'user') return;
    if (lastMsg.id === lastScrolledMessageId) return;

    lastScrolledMessageId = lastMsg.id;
    tick().then(() => scrollToActiveRegion('smooth'));
  });
</script>

<div transition:slide={{ duration: 250, easing: cubicOut }} class="relative">
  <!-- Top bar with fade gradient -->
  <div
    style="opacity: {topBarOpacity}; transition: opacity 100ms"
    class="pointer-events-none absolute top-0 right-0 left-0 z-10 bg-linear-to-b from-sidebar via-sidebar/70 to-sidebar/0"
  >
    <!-- Resize drag zone -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      onpointerdown={onStartResize}
      ondblclick={() => {
        aiChat.overlayHeight = MIN_OVERLAY_HEIGHT;
      }}
      class="pointer-events-auto flex h-2 cursor-ns-resize items-center justify-center"
    >
      <div
        class="h-1 w-8 rounded-full bg-muted-foreground/40 transition-colors hover:bg-muted-foreground/70"
      ></div>
    </div>

    <!-- Collapse + refresh buttons -->
    <div class="pointer-events-auto flex items-center px-2 pb-2">
      <button
        onclick={() => {
          aiChat.isOverlayOpen = false;
        }}
        class="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Collapse chat"
        data-ph-capture-attribute-action="collapse-chat"
        data-ph-capture-attribute-section="chat"
      >
        <ChevronDownIcon class="size-4" />
      </button>
      <div class="flex-1"></div>
      <Tooltip.Root>
        <Tooltip.Trigger>
          {#snippet child({ props })}
            <button
              {...props}
              onclick={onRefresh}
              class="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Clear conversation"
              data-ph-capture-attribute-action="clear-conversation"
              data-ph-capture-attribute-section="chat"
            >
              <RefreshCwIcon class="size-3.5" />
            </button>
          {/snippet}
        </Tooltip.Trigger>
        <Tooltip.Content>Clear conversation</Tooltip.Content>
      </Tooltip.Root>
    </div>
  </div>

  <!-- Messages area -->
  <div
    class="relative flex flex-col overflow-hidden"
    style="height: {aiChat.overlayHeight}px;{aiChat.isDragging
      ? ''
      : ' transition: height 250ms cubic-bezier(0.33, 1, 0.68, 1);'}"
    role="log"
  >
    <div
      bind:this={scrollContainerEl}
      class="flex-1 overflow-y-auto px-4 pt-10"
      style="overflow-anchor: none"
    >
      <!-- History region: messages before last user message -->
      {#if historyMessages.length > 0}
        <div class="space-y-3 pb-3">
          {#each historyMessages as message, i (message.id)}
            {#if message.role === 'user'}
              <ChatUserMessage {message} onEdit={() => onEditMessage(message)} />
            {:else}
              <ChatAssistantMessage {message} />
            {/if}
          {/each}
        </div>
      {/if}

      <!-- Active region: last user message + responses -->
      <!-- min-height = overlayHeight guarantees no scroll into empty space -->
      <div
        bind:this={activeRegionEl}
        class="flex flex-col"
        style="min-height: calc({aiChat.overlayHeight}px - {TOP_BAR_HEIGHT}px)"
      >
        <div class="space-y-3 pb-6">
          {#if lastUserMessage}
            <ChatUserMessage
              message={lastUserMessage}
              onEdit={() => onEditMessage(lastUserMessage)}
            />
          {/if}

          {#each responseMessages as message (message.id)}
            <ChatAssistantMessage {message} />
          {/each}

          {#if showThinking}
            <div class="flex items-center gap-1 text-xs text-muted-foreground/60">
              <LoaderCircleIcon class="size-3 animate-spin" />
              Thinking
            </div>
          {/if}

          {#if aiChat.quotaExceeded}
            <div class="rounded border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs">
              <span class="font-medium text-amber-700 dark:text-amber-300"
                >AI usage limit reached.</span
              >
              <button
                type="button"
                class="ml-1 text-amber-600 underline dark:text-amber-400"
                onclick={() =>
                  upgradePromptState.show('ai-chat', {
                    title: 'Upgrade for more AI usage',
                    highlight: authState.tier === 'free' ? 'plus' : 'pro',
                    badge: 'More AI'
                  })}>Upgrade</button
              >
            </div>
          {/if}

          {#if aiChat.error}
            <div
              class="flex items-center justify-between rounded border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs"
            >
              <span class="font-medium text-red-700 dark:text-red-300">{aiChat.error}</span>
              <button
                type="button"
                class="ml-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                onclick={() => (aiChat.error = null)}
              >
                <XIcon class="size-3" />
              </button>
            </div>
          {/if}
        </div>

        <!-- CSS spacer: flex-1 fills remaining space, shrinks to 0 as content grows -->
        <div class="min-h-0 flex-1" aria-hidden="true"></div>
      </div>
    </div>

    <!-- Bottom scroll fade -->
    <div
      class="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-sidebar to-transparent transition-opacity duration-150"
      class:opacity-0={!canScrollDown}
    ></div>
  </div>
</div>
