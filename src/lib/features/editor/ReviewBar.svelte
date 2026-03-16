<script lang="ts">
  import Undo2Icon from '@lucide/svelte/icons/undo-2';
  import CheckIcon from '@lucide/svelte/icons/check';

  interface Props {
    totalChanges: number;
    onUndoAll: () => void;
    onKeepAll: () => void;
    position?: 'sticky' | 'absolute';
  }

  let { totalChanges, onUndoAll, onKeepAll, position = 'sticky' }: Props = $props();
</script>

<div
  class="z-10 flex items-center justify-between border-b bg-background/90 px-3 py-1.5 backdrop-blur-sm"
  class:sticky={position === 'sticky'}
  class:top-0={true}
  class:absolute={position === 'absolute'}
  class:right-0={position === 'absolute'}
  class:left-0={position === 'absolute'}
  class:py-1={position === 'absolute'}
>
  <span class="text-xs font-medium text-muted-foreground">
    {totalChanges}
    {totalChanges === 1 ? 'change' : 'changes'}
  </span>
  <div class="flex gap-1">
    <button class="review-zone-btn review-zone-btn-undo" onclick={onUndoAll}>
      <Undo2Icon class="size-3" />
      Undo all
    </button>
    <button class="review-zone-btn review-zone-btn-keep" onclick={onKeepAll}>
      <CheckIcon class="size-3" />
      Keep all
    </button>
  </div>
</div>
