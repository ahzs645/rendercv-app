<script lang="ts">
  import type { Snippet } from 'svelte';
  import { goto } from '$app/navigation';
  import { cn } from '$lib/ui/utils';

  let { children, class: className }: { children: Snippet; class?: string } = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') goto('/');
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class={cn('mx-auto max-w-2xl px-6 py-12', className)}>
  {@render children()}
</div>
