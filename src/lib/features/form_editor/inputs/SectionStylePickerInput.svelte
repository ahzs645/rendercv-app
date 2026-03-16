<script lang="ts">
  import { cn } from '$lib/ui/utils.js';
  import FieldMessage from './FieldMessage.svelte';

  interface Props {
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
    error?: string;
    onchange?: (value: string) => void;
  }

  let {
    value = $bindable('with_full_line'),
    label,
    description,
    disabled,
    error,
    onchange
  }: Props = $props();

  const styles = [
    { value: 'with_full_line', label: 'Full Line' },
    { value: 'with_partial_line', label: 'Partial Line' },
    { value: 'without_line', label: 'No Line' },
    { value: 'moderncv', label: 'ModernCV' }
  ];
</script>

<div class="flex items-center py-1.5">
  <span
    class="shrink-0 text-xs {error ? 'text-destructive' : 'text-muted-foreground'}"
    style:width="var(--label-width, 8rem)"
  >
    {label}
  </span>
  <div class="flex flex-wrap gap-1">
    {#each styles as opt (opt.value)}
      <button
        type="button"
        class={cn(
          'flex h-7 items-center gap-0.5 rounded border px-2 transition-colors',
          value === opt.value
            ? 'border-primary/30 bg-primary/10 text-primary'
            : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
        {disabled}
        onclick={() => {
          value = opt.value;
          onchange?.(value);
        }}
        title={opt.label}
      >
        {#if opt.value === 'with_full_line'}
          <span class="flex w-5 flex-col items-start gap-[2px]">
            <span class="text-[9px] leading-none font-semibold">T</span>
            <span class="h-px w-full bg-current"></span>
          </span>
        {:else if opt.value === 'with_partial_line'}
          <span class="flex w-5 items-end gap-[3px]">
            <span class="text-[9px] leading-none font-semibold">T</span>
            <span class="mb-[1px] h-px flex-1 bg-current"></span>
          </span>
        {:else if opt.value === 'without_line'}
          <span class="text-[9px] leading-none font-semibold">T</span>
        {:else if opt.value === 'moderncv'}
          <span class="flex items-center gap-[3px]">
            <span class="h-[1px] w-2.5 rounded-[0.5px] bg-current"></span>
            <span class="text-[9px] leading-none font-semibold">T</span>
          </span>
        {/if}
      </button>
    {/each}
  </div>
</div>
<FieldMessage {error} {description} />
