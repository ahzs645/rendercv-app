<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { viewer } from '$lib/features/viewer/viewer-state.svelte';
  import LoadingSpinner from '$lib/features/primitives/LoadingSpinner.svelte';

  let { data } = $props();

  let pdfUrl = $state<string | null>(null);
  let error = $state<string | null>(null);

  onMount(async () => {
    try {
      await viewer.init();
      const pdfBytes = await viewer.renderToPdf(data.sections);
      if (pdfBytes) {
        const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
        pdfUrl = URL.createObjectURL(blob);
      } else {
        error = 'Failed to render PDF';
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to render PDF';
    }
  });

  onDestroy(() => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
  });
</script>

<svelte:head>
  <title>{data.cvName} | RenderCV</title>
  <meta name="robots" content="noindex" />
  <meta property="og:title" content="{data.cvName} | RenderCV" />
  <meta property="og:description" content={data.cvName} />
</svelte:head>

{#if error}
  <div class="flex h-screen items-center justify-center">
    <p class="text-destructive">{error}</p>
  </div>
{:else if pdfUrl}
  <iframe src={pdfUrl} class="h-screen w-full" title={data.cvName}></iframe>
{:else}
  <div class="flex h-screen items-center justify-center">
    <LoadingSpinner />
  </div>
{/if}
