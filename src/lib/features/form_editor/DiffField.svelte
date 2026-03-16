<script lang="ts">
  import Undo2Icon from '@lucide/svelte/icons/undo-2';
  import CheckIcon from '@lucide/svelte/icons/check';
  import type { FieldDiffStatus } from './yaml-diff.js';
  import type { Snippet } from 'svelte';

  interface Props {
    status: FieldDiffStatus;
    onKeep: () => void;
    onUndo: () => void;
    showActions?: boolean;
    children: Snippet;
    original?: Snippet;
  }

  let { status, onKeep, onUndo, showActions = true, children, original }: Props = $props();
</script>

{#if status === 'modified' && original}
  <div class="diff-removed">
    {@render original()}
  </div>
  <div class="diff-added">
    {@render children()}
  </div>
{:else if status === 'added'}
  <div class="diff-added">
    {@render children()}
  </div>
{:else if status === 'removed' && original}
  <div class="diff-removed">
    {@render original()}
  </div>
{/if}

{#if showActions}
  <div class="diff-actions">
    <button class="diff-btn diff-btn-undo" onclick={onUndo}>
      <Undo2Icon class="size-2.5" />Undo
    </button>
    <button class="diff-btn diff-btn-keep" onclick={onKeep}>
      <CheckIcon class="size-2.5" />Keep
    </button>
  </div>
{/if}
