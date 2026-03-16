<script lang="ts">
  import type { Component } from 'svelte';
  import { cn } from '$lib/ui/utils.js';
  import FieldMessage from './FieldMessage.svelte';

  interface ToggleOption {
    value: string;
    label: string;
    icon?: Component<{ class?: string }>;
    extra?: string;
  }

  interface Props {
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
    options: ToggleOption[];
    square?: boolean;
    error?: string;
    onchange?: (value: string) => void;
  }

  let {
    value = $bindable(''),
    label,
    description,
    disabled,
    options,
    square = false,
    error,
    onchange
  }: Props = $props();
</script>

<div class="flex items-center py-1.5">
  <span
    class="shrink-0 text-xs {error ? 'text-destructive' : 'text-muted-foreground'}"
    style:width="var(--label-width, 8rem)"
  >
    {label}
  </span>
  <div class="flex flex-wrap gap-0.5">
    {#each options as opt (opt.value)}
      <button
        type="button"
        class={cn(
          'flex h-6 items-center rounded transition-colors',
          square
            ? 'w-6 justify-center text-xs'
            : opt.icon
              ? 'gap-1 px-1.5 text-[10px]'
              : 'px-2 text-[11px]',
          value === opt.value
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
        {disabled}
        onclick={() => {
          value = opt.value;
          onchange?.(value);
        }}
        title={opt.icon ? opt.label : undefined}
      >
        {#if opt.icon}
          <opt.icon class="size-3.5" />
          {#if opt.extra}
            <span class="text-[9px] leading-none">{opt.extra}</span>
          {/if}
        {:else}
          {opt.label}
        {/if}
      </button>
    {/each}
  </div>
</div>
<FieldMessage {error} {description} />
