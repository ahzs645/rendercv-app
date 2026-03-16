<script lang="ts">
  import { page } from '$app/state';
  import AppBackPage from '$lib/content/AppBackPage.svelte';
  import PricingContent from '$lib/content/PricingContent.svelte';
  import type { Tier } from '$lib/features/auth/polar-config';
  import { onMount } from 'svelte';
  import { capture } from '$lib/analytics/posthog-client';
  import { EVENTS } from '$lib/analytics/events';

  onMount(() => {
    capture(EVENTS.PRICING_PAGE_VIEWED, {
      source_feature: page.url.searchParams.get('feature'),
      highlight: page.url.searchParams.get('highlight')
    });
  });

  const title = $derived(page.url.searchParams.get('title'));

  const highlightTier = $derived.by(() => {
    const h = page.url.searchParams.get('highlight');
    if (h === 'free' || h === 'plus' || h === 'pro') return h as Tier;
    return null;
  });

  const highlightLabel = $derived(page.url.searchParams.get('badge'));

  const PRICING_DESCRIPTION =
    'Use RenderCV for free with LaTeX-quality output. Upgrade for AI agents, cloud sync, and more.';
</script>

<svelte:head>
  <title>Pricing - RenderCV</title>
  <meta name="description" content={PRICING_DESCRIPTION} />
  <meta property="og:title" content="Pricing - RenderCV" />
  <meta property="og:description" content={PRICING_DESCRIPTION} />
  <meta property="og:url" content="https://rendercv.com/pricing" />
  <link rel="canonical" href="https://rendercv.com/pricing" />
</svelte:head>

<AppBackPage class="flex min-h-screen max-w-6xl items-center justify-center">
  <PricingContent {title} {highlightTier} {highlightLabel} />
</AppBackPage>
