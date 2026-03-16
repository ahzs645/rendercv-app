<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { cubicOut, cubicInOut, quintOut } from 'svelte/easing';
  import type { TransitionConfig } from 'svelte/transition';

  interface Props {
    error?: string;
    description?: string;
    noPadding?: boolean;
  }

  let { error, description, noPadding = false }: Props = $props();

  const ANIM_DUR = 190;

  // Horizontal clip-path wipe: grows from left on `in`, shrinks to right on `out`.
  function growLine(
    _node: Element,
    { duration = ANIM_DUR, delay = 0 }: { duration?: number; delay?: number } = {}
  ): TransitionConfig {
    return {
      duration,
      delay,
      easing: cubicOut,
      css: (_t, u) => `clip-path: inset(0 ${u * 100}% 0 0)`
    };
  }

  // CSS grid row expand/collapse — no JS height measurement, no snap-to-auto jump.
  function gridSlide(
    _node: Element,
    { duration = ANIM_DUR, delay = 0 }: { duration?: number; delay?: number } = {}
  ): TransitionConfig {
    return {
      duration,
      delay,
      easing: cubicInOut,
      css: (t) => `display: grid; grid-template-rows: ${t}fr; overflow: hidden;`
    };
  }
</script>

{#if error}
  <div transition:gridSlide>
    <div class="flex min-h-0 items-center gap-1.5">
      <span
        class="text-[12px] text-destructive/70"
        style:padding-left={noPadding ? undefined : 'var(--label-width, 8rem)'}
        in:fly={{
          x: -8,
          duration: Math.round(ANIM_DUR * 0.8),
          delay: Math.round(ANIM_DUR * 0.15),
          easing: quintOut
        }}
        out:fade={{ duration: Math.round(ANIM_DUR * 0.35) }}>{error}</span
      >
      <div
        class="h-px flex-1 bg-destructive/40"
        in:growLine={{ duration: ANIM_DUR, delay: Math.round(ANIM_DUR * 0.25) }}
        out:growLine={{ duration: Math.round(ANIM_DUR * 0.5) }}
      ></div>
    </div>
  </div>
{:else}
  <div class="h-px bg-border/40" in:growLine out:fade={{ duration: 0 }}></div>
  {#if description}
    <p
      class="py-0.5 text-[11px] text-muted-foreground/70 select-text"
      style:padding-left={noPadding ? undefined : 'var(--label-width, 8rem)'}
      in:fade={{ duration: Math.round(ANIM_DUR * 0.5), delay: Math.round(ANIM_DUR * 0.2) }}
      out:fade={{ duration: Math.round(ANIM_DUR * 0.3) }}
    >
      {description}
    </p>
  {/if}
{/if}
