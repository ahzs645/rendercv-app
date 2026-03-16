<script lang="ts">
  import '@fontsource-variable/dm-sans';
  import '../app.css';
  import { ModeWatcher } from 'mode-watcher';
  let { children } = $props();

  const SITE_DESCRIPTION =
    'RenderCV is a free and open-source resume builder with LaTeX-quality typesetting and AI agents.';
</script>

<svelte:head>
  <!-- Default meta — pages override title & description via their own <svelte:head> -->
  <meta name="description" content={SITE_DESCRIPTION} />

  <!-- Open Graph defaults -->
  <meta property="og:site_name" content="RenderCV" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="https://rendercv.com/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

  <!-- Twitter/X Card defaults -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="https://rendercv.com/og-image.png" />
  <meta name="twitter:site" content="@rendercvdev" />
  <meta name="twitter:creator" content="@rendercvdev" />

  <!-- Structured data -->
  {@html `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'RenderCV',
    url: 'https://rendercv.com',
    description: SITE_DESCRIPTION,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    }
  })}</script>`}
  {@html `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'RenderCV',
    url: 'https://rendercv.com',
    logo: 'https://rendercv.com/icon-512x512.png',
    sameAs: ['https://x.com/rendercvdev', 'https://github.com/rendercv']
  })}</script>`}
</svelte:head>

<ModeWatcher themeColors={{ light: '#ffffff', dark: '#0f172b' }} />

{@render children?.()}
