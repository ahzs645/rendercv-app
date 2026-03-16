<script lang="ts">
  import { page } from '$app/state';
</script>

<svelte:head>
  <title>{page.status} - RenderCV</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div
  class="flex min-h-screen flex-col items-center justify-center gap-4 bg-sidebar p-8 text-center"
>
  <span class="text-6xl font-bold text-muted-foreground">{page.status}</span>
  <p class="text-lg text-muted-foreground">{page.error?.message ?? 'Something went wrong'}</p>
  <a
    href="/"
    class="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
  >
    Back to RenderCV
  </a>
</div>
