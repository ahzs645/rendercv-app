<script lang="ts">
  import type { Snippet } from 'svelte';
  import * as Tooltip from '$lib/ui/components/tooltip/index.js';

  let {
    message,
    open = $bindable(false),
    flashOnClick = false,
    children
  }: {
    message: string;
    open?: boolean;
    flashOnClick?: boolean;
    children: Snippet;
  } = $props();

  $effect(() => {
    if (!open) return;
    const timeout = setTimeout(() => {
      open = false;
    }, 2000);
    return () => clearTimeout(timeout);
  });
</script>

{#if message}
  <Tooltip.Root
    bind:open={
      () => open,
      (v) => {
        if (!v) open = false;
      }
    }
  >
    <Tooltip.Trigger>
      {#snippet child({ props })}
        <div
          {...props}
          onpointerdown={flashOnClick
            ? () => {
                open = true;
              }
            : undefined}
        >
          {@render children()}
        </div>
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content>
      <p>{message}</p>
    </Tooltip.Content>
  </Tooltip.Root>
{:else}
  {@render children()}
{/if}
