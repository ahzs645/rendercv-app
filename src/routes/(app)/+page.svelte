<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { authState } from '$lib/features/auth/auth-state.svelte';
  import { toast } from 'svelte-sonner';
  import { onMount } from 'svelte';
  import { capture } from '$lib/analytics/posthog-client';
  import { EVENTS } from '$lib/analytics/events';

  onMount(async () => {
    const checkoutId = page.url.searchParams.get('checkout_id');
    if (checkoutId && authState.isLoggedIn) {
      await authState.refreshTier();
      if (authState.tier !== 'free') {
        const slug = `${authState.tier}-${authState.interval === 'year' ? 'yearly' : 'monthly'}`;
        capture(EVENTS.CHECKOUT_COMPLETED, {
          tier: authState.tier,
          interval: authState.interval,
          slug,
          checkout_id: checkoutId,
          source_feature: page.url.searchParams.get('source_feature') ?? undefined
        });
        toast.success(`Welcome to RenderCV ${authState.tier === 'pro' ? 'Pro' : 'Plus'}!`);
      }
      const url = new URL(page.url);
      url.searchParams.delete('checkout_id');
      url.searchParams.delete('source_feature');
      goto(url, { replaceState: true, noScroll: true, keepFocus: true });
    }
  });
</script>

<svelte:head>
  <title>RenderCV: Resume Builder for Academics and Engineers</title>
  <meta property="og:title" content="RenderCV: Resume Builder for Academics and Engineers" />
  <meta property="og:url" content="https://rendercv.com/" />
  <link rel="canonical" href="https://rendercv.com/" />
</svelte:head>
