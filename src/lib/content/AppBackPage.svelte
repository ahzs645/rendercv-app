<script lang="ts">
  import type { Snippet } from 'svelte';
  import ContentPage from '$lib/content/ContentPage.svelte';
  import { Button } from '$lib/ui/components/button/index.js';
  import XIcon from '@lucide/svelte/icons/x';

  let {
    children,
    class: className,
    showClose = true
  }: { children: Snippet; class?: string; showClose?: boolean } = $props();
</script>

<div class="relative">
  {#if showClose}
    <Button variant="ghost" size="icon" href="/" class="fixed top-4 right-4 z-50">
      <XIcon class="size-4" />
      <span class="sr-only">Back to app</span>
    </Button>
  {/if}
  <ContentPage class={className}>
    {@render children()}
  </ContentPage>
</div>
