<script lang="ts">
  import PlusIcon from '@lucide/svelte/icons/plus';
  import type { Snippet } from 'svelte';
  import FieldMessage from './inputs/FieldMessage.svelte';

  interface Props {
    label: string;
    error?: string;
    description?: string;
    disabled?: boolean;
    onadd: () => void;
    children: Snippet;
  }

  let { label, error, description, disabled, onadd, children }: Props = $props();
</script>

<div class="py-1.5">
  <div class="flex items-center">
    <span
      class="shrink-0 text-xs {error ? 'text-destructive' : 'text-muted-foreground'}"
      style:width="var(--label-width, auto)"
    >
      {label}
    </span>
    <div class="flex flex-1 items-center justify-end">
      <button
        type="button"
        class="flex items-center gap-0.5 text-[11px] text-muted-foreground/70 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        {disabled}
        onclick={onadd}
      >
        <PlusIcon class="size-3" />
        Add
      </button>
    </div>
  </div>
</div>

<div class="pl-4">
  {@render children()}
</div>

<FieldMessage {error} {description} noPadding />
