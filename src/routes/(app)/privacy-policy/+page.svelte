<script lang="ts">
  import AppBackPage from '$lib/content/AppBackPage.svelte';
  import MarkdownContent from '$lib/content/MarkdownContent.svelte';
  import privacyHtml from '$lib/content/privacy-policy.md';
  import iconRaw from '$lib/assets/icon.svg?raw';
</script>

<svelte:head>
  <title>Privacy Policy - RenderCV</title>
  <meta name="description" content="RenderCV privacy policy. Learn how we handle your data." />
  <meta property="og:title" content="Privacy Policy - RenderCV" />
  <meta property="og:url" content="https://rendercv.com/privacy-policy" />
  <link rel="canonical" href="https://rendercv.com/privacy-policy" />
</svelte:head>

<AppBackPage>
  <MarkdownContent html={privacyHtml} />
</AppBackPage>
