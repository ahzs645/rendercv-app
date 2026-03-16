<script module lang="ts">
  import type { StableItem } from './use-stable-ids.svelte.js';

  export interface ReorderableItemContext {
    /** Current index in the list */
    index: number;
    /** Stable ID for this item (useful for expand tracking etc.) */
    id: number;
    /** Whether this specific item is currently being dragged */
    isDragging: boolean;
  }

  export interface ReorderableListHandle {
    /** Add a new item. Pass atIndex to insert at a specific position. */
    add: (atIndex?: number) => StableItem;
    /** Remove item at index. Parent must also remove its own data at this index. */
    removeAt: (index: number) => void;
  }
</script>

<script lang="ts">
  import { slide } from 'svelte/transition';
  import type { Snippet } from 'svelte';
  import GripVerticalIcon from '@lucide/svelte/icons/grip-vertical';
  import XIcon from '@lucide/svelte/icons/x';
  import { useStableIds } from './use-stable-ids.svelte.js';
  import { useDragReorder } from './use-drag-reorder.svelte.js';

  interface Props {
    /** Number of items. Drives $effect reconcile for external changes. */
    count: number;
    disabled?: boolean;
    /** CSS class for the wrapper div */
    class?: string;
    /** CSS class for each item's wrapper div (must include gutter padding, e.g. "-mx-7 px-7") */
    itemClass?: string;
    /** Box-shadow on the dragged item */
    dragShadow?: string;
    /** Optional inline style for the wrapper div */
    style?: string;
    /** Called when drag-drop finishes. Parent must reorder its data. */
    onreorder: (fromIndex: number, toIndex: number) => void;
    /** Called when a swap is triggered. Parent must swap its data. */
    onswap: (indexA: number, indexB: number) => void;
    /** Called when delete button is clicked. Stable ID removal is handled internally. */
    onremove?: (index: number, id: number) => void;
    /** Imperative handle. Bind to get add/removeAt. */
    handle: ReorderableListHandle | undefined;
    /** Snippet for rendering each item's content */
    item: Snippet<[ReorderableItemContext]>;
  }

  let {
    count,
    disabled = false,
    class: className = '',
    itemClass = '',
    dragShadow = '0 8px 25px rgba(0,0,0,0.15)',
    style,
    onreorder,
    onswap,
    onremove,
    handle = $bindable(),
    item
  }: Props = $props();

  // ── Internal state ──────────────────────────────────────────────────

  const stableIds = useStableIds();

  $effect(() => {
    stableIds.reconcile(count);
  });

  let listEl: HTMLElement;

  const drag = useDragReorder({
    getItems: () => stableIds.items,
    getListEl: () => listEl,
    isDisabled: () => disabled,
    onReorder: (from, to) => {
      stableIds.reorder(from, to);
      onreorder(from, to);
    },
    onSwap: (a, b) => {
      stableIds.swap(a, b);
      onswap(a, b);
    }
  });

  function handleRemove(index: number, id: number) {
    stableIds.removeAt(index);
    onremove!(index, id);
  }

  // ── Expose handle to parent ─────────────────────────────────────────

  handle = {
    add: (atIndex?: number) => stableIds.add(atIndex),
    removeAt: (index: number) => stableIds.removeAt(index)
  };
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div bind:this={listEl} class={className} {style}>
  {#each stableIds.items as entry, index (entry.id)}
    {@const isDragging = drag.dragState?.entryId === entry.id}
    <div
      class="item-wrapper relative -mx-7 px-7 {itemClass}"
      style:transform={drag.getDragTransform(entry.id, index)}
      style:transition={drag.dragState ? (isDragging ? 'none' : 'transform 200ms ease') : undefined}
      style:z-index={isDragging ? 50 : undefined}
      style:box-shadow={isDragging ? dragShadow : undefined}
      style:position={isDragging ? 'relative' : undefined}
      role="listitem"
      out:slide={{ duration: 150 }}
    >
      <!-- Grip handle -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="item-control absolute top-1/2 left-1 -translate-y-1/2 cursor-grab touch-none"
        class:cursor-grabbing={isDragging}
        onpointerdown={(e) => drag.handleGripPointerDown(index, e)}
      >
        <GripVerticalIcon class="size-3.5 text-muted-foreground/40" />
      </div>

      <!-- Delete button -->
      {#if onremove}
        <button
          type="button"
          class="item-control absolute top-1/2 right-3 flex size-5 -translate-y-1/2 items-center justify-center text-muted-foreground/50 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
          {disabled}
          onclick={() => handleRemove(index, entry.id)}
          aria-label="Remove"
        >
          <XIcon class="size-3" />
        </button>
      {/if}

      <div class="pr-5">
        {@render item({
          index,
          id: entry.id,
          isDragging: isDragging ?? false
        })}
      </div>
    </div>
  {/each}
</div>

<style>
  .item-control {
    opacity: 1;
    transition-property: opacity;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
  }

  @media (min-width: 768px) {
    .item-control {
      opacity: 0;
    }
    .item-wrapper:hover > .item-control {
      opacity: 1;
    }
  }
</style>
