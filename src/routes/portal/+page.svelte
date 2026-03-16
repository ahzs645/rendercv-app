<script lang="ts">
  import { onMount } from 'svelte';
  import { getPortalUrl } from '$lib/features/auth/get-portal-url.remote';
  import LoadingSpinner from '$lib/features/primitives/LoadingSpinner.svelte';

  onMount(async () => {
    const { url } = await getPortalUrl();
    if (url) window.location.href = url;
  });
</script>

<svelte:head>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="flex h-screen items-center justify-center bg-sidebar">
  <LoadingSpinner />
</div>
