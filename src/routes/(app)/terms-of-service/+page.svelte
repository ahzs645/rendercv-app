<script lang="ts">
  import AppBackPage from '$lib/content/AppBackPage.svelte';
  import MarkdownContent from '$lib/content/MarkdownContent.svelte';
  import termsHtml from '$lib/content/terms-of-service.md';
  import iconRaw from '$lib/assets/icon.svg?raw';
</script>

<svelte:head>
  <title>Terms of Service - RenderCV</title>
  <meta
    name="description"
    content="RenderCV terms of service. Read the terms that govern your use of RenderCV."
  />
  <meta property="og:title" content="Terms of Service - RenderCV" />
  <meta property="og:url" content="https://rendercv.com/terms-of-service" />
  <link rel="canonical" href="https://rendercv.com/terms-of-service" />
</svelte:head>

<AppBackPage>
  <MarkdownContent html={termsHtml} />
</AppBackPage>
