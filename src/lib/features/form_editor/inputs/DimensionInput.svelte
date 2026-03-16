<script lang="ts">
  import { tick } from 'svelte';
  import { cn } from '$lib/ui/utils.js';
  import FieldMessage from './FieldMessage.svelte';

  interface Props {
    value: string;
    label: string;
    description?: string;
    defaultValue?: string;
    disabled?: boolean;
    error?: string;
    onchange?: (value: string) => void;
  }

  const UNITS = ['cm', 'mm', 'in', 'pt', 'em', 'ex'] as const;

  let {
    value = $bindable('0cm'),
    label,
    description,
    defaultValue,
    disabled,
    error,
    onchange
  }: Props = $props();

  function parse(v: string): { num: string; unit: string } {
    const match = v.match(/^(-?\d*\.?\d*)\s*(cm|mm|in|pt|em|ex)$/);
    if (match) return { num: match[1], unit: match[2] };
    return { num: '0', unit: 'cm' };
  }

  const SCRUB_THRESHOLD = 3;
  const SCRUB_STEP = 0.01;

  let num = $state('0');
  let unit = $state('cm');
  let numFocused = $state(false);
  let scrubbing = $state(false);
  let pendingScrub = $state<{ pointerId: number; startX: number; startValue: number } | null>(null);
  let inputEl: HTMLInputElement;

  $effect(() => {
    const p = parse(value);
    if (!numFocused) num = p.num;
    unit = p.unit;
  });

  function commit() {
    value = `${num || '0'}${unit}`;
    onchange?.(value);
  }

  function handleNumPointerDown(e: PointerEvent) {
    if (e.button !== 0 || numFocused || disabled) return;
    e.preventDefault();
    pendingScrub = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startValue: parseFloat(num) || 0
    };
    inputEl.setPointerCapture(e.pointerId);
  }

  function handleNumPointerMove(e: PointerEvent) {
    if (!pendingScrub) return;
    if (e.pointerId !== pendingScrub.pointerId) return;

    const dx = e.clientX - pendingScrub.startX;

    if (!scrubbing) {
      if (Math.abs(dx) < SCRUB_THRESHOLD) return;
      scrubbing = true;
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'ew-resize';
    }

    const newValue = pendingScrub.startValue + dx * SCRUB_STEP;
    num = (Math.round(newValue * 100) / 100).toString();
    commit();
  }

  function handleNumPointerUp(e: PointerEvent) {
    if (!pendingScrub || e.pointerId !== pendingScrub.pointerId) return;
    const wasScrubbing = scrubbing;
    scrubbing = false;
    pendingScrub = null;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    if (!wasScrubbing) {
      inputEl.focus();
    }
  }

  function handleNumPointerCancel(e: PointerEvent) {
    if (pendingScrub && e.pointerId === pendingScrub.pointerId) {
      scrubbing = false;
      pendingScrub = null;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }
  }

  function handleDblClick() {
    if (!defaultValue || disabled) return;
    const p = parse(defaultValue);
    num = p.num;
    unit = p.unit;
    commit();
  }

  $effect(() => {
    return () => {
      if (scrubbing || pendingScrub) {
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      }
    };
  });

  let measuredWidth = $state(0);

  let editing = $state(false);
  let collapsing = $state(false);
  let expanding = $state(false);
  let expanded = $derived(editing || collapsing || expanding);

  const DURATION = 100;

  let unitGridEl: HTMLElement;

  async function selectUnit(newUnit: string) {
    unit = newUnit;
    commit();

    const selectedBtn = unitGridEl?.querySelector(
      `[data-value="${newUnit}"]`
    ) as HTMLElement | null;
    if (!selectedBtn || !unitGridEl) {
      editing = false;
      return;
    }

    const selectedRect = selectedBtn.getBoundingClientRect();
    const gridRect = unitGridEl.getBoundingClientRect();
    const targetHeight = selectedBtn.offsetHeight;

    collapsing = true;

    const animations: Animation[] = [];

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

    animations.push(
      unitGridEl.animate(
        [
          { height: `${gridRect.height}px`, overflow: 'hidden' },
          { height: `${targetHeight}px`, overflow: 'hidden' }
        ],
        { duration: DURATION, easing: 'ease-out', fill: 'forwards' }
      )
    );

    await Promise.all(animations.map((a) => a.finished));
    animations.forEach((a) => a.cancel());
    collapsing = false;
    editing = false;
  }

  async function expandUnits() {
    const selectedBtn = unitGridEl?.querySelector(`[data-value="${unit}"]`) as HTMLElement | null;
    if (!selectedBtn || !unitGridEl) {
      editing = true;
      return;
    }

    const oldRect = selectedBtn.getBoundingClientRect();
    const oldHeight = unitGridEl.offsetHeight;

    expanding = true;
    editing = true;
    await tick();

    const newRect = selectedBtn.getBoundingClientRect();
    const newHeight = unitGridEl.offsetHeight;

    const animations: Animation[] = [];

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

    animations.push(
      unitGridEl.animate(
        [
          { height: `${oldHeight}px`, overflow: 'hidden' },
          { height: `${newHeight}px`, overflow: 'hidden' }
        ],
        { duration: DURATION, easing: 'ease-out' }
      )
    );

    expanding = false;
    await Promise.all(animations.map((a) => a.finished));
  }
</script>

<div class="flex items-center gap-1 py-1.5">
  <span
    class="shrink-0 text-xs {error ? 'text-destructive' : 'text-muted-foreground'}"
    style:width="var(--label-width, 8rem)"
  >
    {label}
  </span>
  <div class="relative flex">
    <span
      bind:clientWidth={measuredWidth}
      class="invisible absolute text-sm whitespace-pre"
      aria-hidden="true">{num || '0'}</span
    >
    <input
      bind:this={inputEl}
      type="number"
      step="0.01"
      value={num}
      oninput={(e) => {
        num = e.currentTarget.value;
        commit();
      }}
      onfocus={() => {
        numFocused = true;
      }}
      onblur={() => {
        numFocused = false;
        if (!num) {
          num = '0';
          commit();
        }
      }}
      onpointerdown={handleNumPointerDown}
      onpointermove={handleNumPointerMove}
      onpointerup={handleNumPointerUp}
      onpointercancel={handleNumPointerCancel}
      ondblclick={handleDblClick}
      {disabled}
      style:width="{Math.max(measuredWidth + 2, 8)}px"
      class={cn(
        '[appearance:textfield] bg-transparent text-sm outline-none select-text placeholder:text-muted-foreground/50 disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
        !numFocused && !disabled && 'cursor-ew-resize'
      )}
    />
  </div>
  <div class="flex flex-wrap gap-1" bind:this={unitGridEl}>
    {#each UNITS as u (u)}
      {#if expanded || collapsing || expanding || u === unit}
        <button
          type="button"
          data-value={u}
          class={cn(
            'flex py-0 whitespace-nowrap',
            'transition-[color,background-color,opacity,border-radius,font-size,padding] duration-[100ms]',
            !expanded && !(collapsing || expanding) && u === unit
              ? 'cursor-pointer rounded-none bg-transparent px-0 text-sm text-foreground hover:text-primary'
              : (collapsing || expanding) && u === unit
                ? 'rounded-none bg-transparent px-0 text-sm text-foreground'
                : u === unit
                  ? 'rounded bg-primary/10 px-2 text-[11px] text-primary'
                  : 'rounded px-2 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
          style:opacity={(collapsing || expanding) && u !== unit ? 0 : 1}
          disabled={disabled || collapsing || expanding}
          onclick={() => {
            if (!expanded) {
              expandUnits();
            } else if (u === unit) {
              editing = false;
            } else {
              selectUnit(u);
            }
          }}
        >
          {u}
        </button>
      {/if}
    {/each}
  </div>
</div>
<FieldMessage {error} {description} />
