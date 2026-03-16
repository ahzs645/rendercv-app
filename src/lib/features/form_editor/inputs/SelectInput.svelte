<script lang="ts">
  import { tick } from 'svelte';
  import { cn } from '$lib/ui/utils.js';
  import FieldMessage from './FieldMessage.svelte';

  interface Props {
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
    options: { value: string; label: string }[];
    placeholder?: string;
    error?: string;
    onchange?: (value: string) => void;
  }

  let {
    value = $bindable(''),
    label,
    description,
    disabled,
    options,
    placeholder = 'Select...',
    error,
    onchange
  }: Props = $props();

  let editing = $state(false);
  let collapsing = $state(false);
  let expanding = $state(false);
  let hasSelection = $derived(options.some((o) => o.value === value));
  let expanded = $derived(!hasSelection || editing || collapsing || expanding);

  const DURATION = 100;

  let gridEl: HTMLElement;

  async function selectOption(optValue: string) {
    value = optValue;
    onchange?.(value);

    const selectedBtn = gridEl?.querySelector(`[data-value="${optValue}"]`) as HTMLElement | null;
    if (!selectedBtn || !gridEl) {
      editing = false;
      return;
    }

    const selectedRect = selectedBtn.getBoundingClientRect();
    const gridRect = gridEl.getBoundingClientRect();
    const targetHeight = selectedBtn.offsetHeight;

    // Start collapsing — triggers CSS fade + morph
    collapsing = true;

    const animations: Animation[] = [];

    // Move selected button to top-left of grid
    const dx = gridRect.left - selectedRect.left;
    const dy = gridRect.top - selectedRect.top;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      animations.push(
        selectedBtn.animate([{ transform: 'none' }, { transform: `translate(${dx}px, ${dy}px)` }], {
          duration: DURATION,
          easing: 'ease-out',
          fill: 'forwards'
        })
      );
    }

    // Shrink grid height
    animations.push(
      gridEl.animate(
        [
          { height: `${gridRect.height}px`, overflow: 'hidden' },
          { height: `${targetHeight}px`, overflow: 'hidden' }
        ],
        { duration: DURATION, easing: 'ease-out', fill: 'forwards' }
      )
    );

    await Promise.all(animations.map((a) => a.finished));

    // Cancel animations — selected is now naturally at grid top-left (only flex child)
    animations.forEach((a) => a.cancel());
    collapsing = false;
    editing = false;
  }

  async function expandOptions() {
    const selectedBtn = gridEl?.querySelector(`[data-value="${value}"]`) as HTMLElement | null;
    if (!selectedBtn || !gridEl) {
      editing = true;
      return;
    }

    // Capture collapsed positions
    const oldRect = selectedBtn.getBoundingClientRect();
    const oldHeight = gridEl.offsetHeight;

    // Render all buttons in text/hidden state
    expanding = true;
    editing = true;
    await tick();

    // Measure expanded positions
    const newRect = selectedBtn.getBoundingClientRect();
    const newHeight = gridEl.offsetHeight;

    const animations: Animation[] = [];

    // FLIP: translate selected from old position to new
    const dx = oldRect.left - newRect.left;
    const dy = oldRect.top - newRect.top;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      animations.push(
        selectedBtn.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
          duration: DURATION,
          easing: 'ease-out'
        })
      );
    }

    // Grow grid height
    animations.push(
      gridEl.animate(
        [
          { height: `${oldHeight}px`, overflow: 'hidden' },
          { height: `${newHeight}px`, overflow: 'hidden' }
        ],
        { duration: DURATION, easing: 'ease-out' }
      )
    );

    // Trigger CSS transitions: fade in non-selected + morph selected to pill
    expanding = false;

    await Promise.all(animations.map((a) => a.finished));
  }
</script>

<div class="flex items-center py-1.5">
  <span
    class="shrink-0 text-xs {error ? 'text-destructive' : 'text-muted-foreground'}"
    style:width="var(--label-width, 8rem)"
  >
    {label}
  </span>
  <div class="min-w-0 flex-1">
    <div class="flex flex-wrap gap-1" bind:this={gridEl}>
      {#each options as opt (opt.value)}
        {#if expanded || collapsing || expanding || opt.value === value}
          <button
            type="button"
            data-value={opt.value}
            class={cn(
              'flex h-6 items-center whitespace-nowrap',
              'transition-[color,background-color,opacity,border-radius,font-size,padding] duration-[100ms]',
              !expanded && !(collapsing || expanding) && opt.value === value
                ? 'cursor-pointer rounded-none bg-transparent px-0 text-sm text-foreground hover:text-primary'
                : (collapsing || expanding) && opt.value === value
                  ? 'rounded-none bg-transparent px-0 text-sm text-foreground'
                  : opt.value === value
                    ? 'rounded bg-primary/10 px-2 text-[11px] text-primary'
                    : 'rounded px-2 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
            style:opacity={(collapsing || expanding) && opt.value !== value ? 0 : 1}
            disabled={disabled || collapsing || expanding}
            onclick={() => {
              if (!expanded) {
                expandOptions();
              } else if (opt.value === value) {
                editing = false;
              } else {
                selectOption(opt.value);
              }
            }}
          >
            {opt.label}
          </button>
        {/if}
      {/each}
    </div>
  </div>
</div>
<FieldMessage {error} {description} />
