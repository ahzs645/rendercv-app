<script lang="ts">
  import XIcon from '@lucide/svelte/icons/x';
  import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
  import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
  import { onMount } from 'svelte';

  interface Props {
    sectionName: string;
    displayTitle: string;
    index: number;
    totalSections: number;
    disabled?: boolean;
    initiallyEditing?: boolean;
    onrename?: (newName: string) => void;
    ondelete?: () => void;
    onmoveup?: () => void;
    onmovedown?: () => void;
  }

  let {
    sectionName,
    displayTitle,
    index,
    totalSections,
    disabled = false,
    initiallyEditing = false,
    onrename,
    ondelete,
    onmoveup,
    onmovedown
  }: Props = $props();

  onMount(() => {
    if (initiallyEditing) startEditing();
  });

  let isEditing = $state(false);
  let editValue = $state('');
  let originalDisplayTitle = '';
  let inputEl = $state<HTMLInputElement>();

  // Keep edit input in sync when undo changes the section name during editing
  $effect(() => {
    if (isEditing) editValue = displayTitle;
  });

  function startEditing() {
    if (disabled) return;
    editValue = displayTitle;
    originalDisplayTitle = displayTitle;
    isEditing = true;
    requestAnimationFrame(() => {
      inputEl?.focus();
      inputEl?.select();
    });
  }

  function handleInput() {
    const trimmed = editValue.trim();
    if (trimmed) onrename?.(trimmed);
  }

  function exitEdit() {
    isEditing = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      exitEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onrename?.(originalDisplayTitle);
      isEditing = false;
    }
  }
</script>

<div class="group/section relative -mx-7 mt-3 mb-1 flex items-center px-7">
  <div
    class="absolute top-1/2 left-1 flex -translate-y-1/2 flex-col opacity-100 transition-opacity md:opacity-0 md:group-hover/section:opacity-100"
  >
    <button
      type="button"
      class="flex size-4 items-center justify-center text-muted-foreground/50 hover:text-foreground {index ===
      0
        ? 'invisible'
        : ''}"
      onclick={onmoveup}
      aria-label="Move section up"
    >
      <ArrowUpIcon class="size-3" />
    </button>
    <button
      type="button"
      class="flex size-4 items-center justify-center text-muted-foreground/50 hover:text-foreground {index ===
      totalSections - 1
        ? 'invisible'
        : ''}"
      onclick={onmovedown}
      aria-label="Move section down"
    >
      <ArrowDownIcon class="size-3" />
    </button>
  </div>

  {#if isEditing}
    <input
      bind:this={inputEl}
      bind:value={editValue}
      type="text"
      class="flex-1 border-b border-primary bg-transparent font-semibold text-foreground outline-none"
      oninput={handleInput}
      onblur={exitEdit}
      onkeydown={handleKeydown}
    />
  {:else}
    <button
      type="button"
      class="flex-1 cursor-text border-b border-muted-foreground/40 text-left font-semibold text-foreground/80"
      onclick={startEditing}
    >
      {displayTitle}
    </button>
  {/if}

  <button
    type="button"
    class="absolute top-1/2 right-1 flex size-5 -translate-y-1/2 items-center justify-center text-muted-foreground/50 opacity-100 transition-opacity hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50 md:opacity-0 md:group-hover/section:opacity-100"
    {disabled}
    onclick={ondelete}
    aria-label="Delete section"
  >
    <XIcon class="size-3" />
  </button>
</div>
