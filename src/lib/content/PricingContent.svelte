<script lang="ts">
  import type { Component } from 'svelte';
  import * as Card from '$lib/ui/components/card/index.js';
  import { Button } from '$lib/ui/components/button/index.js';
  import { Switch } from '$lib/ui/components/switch/index.js';
  import { Label } from '$lib/ui/components/label/index.js';

  import DownloadIcon from '@lucide/svelte/icons/download';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import BotIcon from '@lucide/svelte/icons/bot';

  import CloudIcon from '@lucide/svelte/icons/cloud';
  import SmartphoneIcon from '@lucide/svelte/icons/smartphone';

  import LinkIcon from '@lucide/svelte/icons/link';
  import { slide, fade } from 'svelte/transition';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { untrack } from 'svelte';
  import { authState } from '$lib/features/auth/auth-state.svelte';
  import { capture } from '$lib/analytics/posthog-client';
  import { EVENTS } from '$lib/analytics/events';
  import LoginDialog from '$lib/features/auth/LoginDialog.svelte';
  import LoadingSpinner from '$lib/features/primitives/LoadingSpinner.svelte';
  import { hasAtLeast, type Tier } from '$lib/features/auth/polar-config';

  let {
    title: featureTitle,
    highlightTier = null,
    highlightLabel = null
  }: {
    title?: string | null;
    highlightTier?: Tier | null;
    highlightLabel?: string | null;
  } = $props();

  interface Feature {
    icon?: Component;
    iconClass?: string;
    text: string;
  }

  interface PricingTier {
    name: string;
    tier: Tier;
    monthlyPrice: number;
    yearlyPrice: number;
    description: string;
    includesFrom?: string;
    features: Feature[];
    cta: string;
    ctaHref?: string;
    monthlySlug?: string;
    yearlySlug?: string;
    ctaVariant: 'default' | 'outline' | 'secondary';
    highlighted: boolean;
  }

  const tiers: PricingTier[] = [
    {
      name: 'Free',
      tier: 'free',
      monthlyPrice: 0,
      yearlyPrice: 0,
      description: 'A CV generator for everyone.',
      features: [
        { icon: SparklesIcon, text: 'Full RenderCV features' },
        { icon: DownloadIcon, text: 'Unlimited downloads (PDF, Typst, YAML)' },
        { icon: CloudIcon, text: 'Store CVs in the cloud & access anywhere' },
        { icon: SmartphoneIcon, text: 'Mobile friendly' },
        { icon: SparklesIcon, text: 'Basic AI usage' },
        { icon: BotIcon, text: 'Only Gemini 3.1 Flash-Lite' }
      ],
      cta: 'Get Started',
      ctaHref: '/',
      ctaVariant: 'outline',
      highlighted: false
    },
    {
      name: 'Plus',
      tier: 'plus',
      monthlyPrice: 9,
      yearlyPrice: 6,
      description: 'For those who need the full toolkit.',
      includesFrom: 'Free',
      features: [
        { icon: LinkIcon, text: 'Share CVs as public PDF links' },
        { iconClass: 'icon-[mdi--github]', text: 'Sync all CVs to GitHub' },
        { icon: SparklesIcon, text: 'Maximum AI usage' },
        { icon: BotIcon, text: 'Gemini 3 Flash & 3.1 Pro, Claude Sonnet & Opus' }
      ],
      cta: 'Upgrade to Plus',
      monthlySlug: 'plus-monthly',
      yearlySlug: 'plus-yearly',
      ctaVariant: 'secondary',
      highlighted: true
    }
  ];

  let yearly = $state(page.url.searchParams.get('billing') === 'yearly');
  let loginDialogOpen = $state(false);
  let loadingSlug = $state<string | null>(null);
  let pendingCheckoutSlug = $state<string | null>(null);

  let loginCallbackURL = $derived.by(() => {
    if (!pendingCheckoutSlug) return undefined;
    const url = new URL(page.url);
    url.searchParams.set('pending_checkout', pendingCheckoutSlug);
    return url.pathname + url.search;
  });

  $effect(() => {
    const isYearly = yearly;
    untrack(() => {
      const url = new URL(page.url);
      const currentIsYearly = url.searchParams.get('billing') === 'yearly';
      if (isYearly !== currentIsYearly) {
        if (isYearly) {
          url.searchParams.set('billing', 'yearly');
        } else {
          url.searchParams.delete('billing');
        }
        goto(url, { replaceState: true, noScroll: true, keepFocus: true });
      }
    });
  });

  function handleUpgrade(tier: PricingTier) {
    const sourceFeature = page.url.searchParams.get('feature');
    if (!authState.isLoggedIn) {
      pendingCheckoutSlug = yearly ? tier.yearlySlug! : tier.monthlySlug!;
      loginDialogOpen = true;
      return;
    }
    const slug = yearly ? tier.yearlySlug! : tier.monthlySlug!;
    loadingSlug = slug;
    authState.checkout(slug, sourceFeature);
  }

  $effect(() => {
    const slug = page.url.searchParams.get('pending_checkout');
    const isLoggedIn = authState.isLoggedIn;
    if (slug && isLoggedIn) {
      untrack(() => {
        const sourceFeature = page.url.searchParams.get('feature');
        loadingSlug = slug;
        authState.checkout(slug, sourceFeature);
        const url = new URL(page.url);
        url.searchParams.delete('pending_checkout');
        goto(url, { replaceState: true, noScroll: true, keepFocus: true });
      });
    }
  });
</script>

{#snippet portalButton(
  label: string,
  variant: 'default' | 'outline' | 'secondary' | 'destructive' = 'outline'
)}
  <Button {variant} class="w-full" size="lg" href={authState.portalHref} target="_blank">
    {label}
  </Button>
{/snippet}

{#snippet featureItem(feature: Feature)}
  <li class="flex items-center gap-2">
    {#if feature.iconClass}
      <span class="{feature.iconClass} size-4 shrink-0 text-muted-foreground"></span>
    {:else if feature.icon}
      <feature.icon class="size-4 shrink-0 text-muted-foreground" />
    {/if}
    <span class="text-sm">{feature.text}</span>
  </li>
{/snippet}

<div class="mx-auto">
  <div class="mb-10 text-center">
    {#if featureTitle}
      <h1 class="mb-2 text-3xl font-bold">{featureTitle}</h1>
      <p class="text-muted-foreground">Choose the plan that works for you.</p>
    {:else}
      <h1 class="mb-2 text-3xl font-bold">Pricing</h1>
      <p class="text-muted-foreground">Choose the plan that works for you.</p>
    {/if}
  </div>

  <div class="mb-8 flex items-center justify-center gap-3">
    <Label class="cursor-pointer text-sm {!yearly ? 'font-medium' : 'text-muted-foreground'}"
      >Monthly</Label
    >
    <Switch
      checked={yearly}
      onCheckedChange={(checked) => {
        yearly = checked;
        capture(EVENTS.BILLING_INTERVAL_TOGGLED, { interval: checked ? 'yearly' : 'monthly' });
      }}
    />
    <Label class="cursor-pointer text-sm {yearly ? 'font-medium' : 'text-muted-foreground'}"
      >Yearly <span class="text-xs text-muted-foreground">(save 33%)</span></Label
    >
  </div>

  <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
    {#each tiers as tier (tier.name)}
      {@const price = tier.monthlyPrice === 0 ? 0 : yearly ? tier.yearlyPrice : tier.monthlyPrice}
      {@const totalYearly = tier.yearlyPrice * 12}
      {@const savingsPercent =
        tier.monthlyPrice > 0 ? Math.round((1 - tier.yearlyPrice / tier.monthlyPrice) * 100) : 0}
      {@const userTier = authState.tier}
      {@const userInterval = authState.interval}
      {@const cardTier = tier.tier}
      {@const toggleInterval = yearly ? 'year' : 'month'}
      {@const isCurrent =
        userTier !== 'free' && userTier === cardTier && userInterval === toggleInterval}
      {@const isCustomHighlight = highlightTier != null && cardTier === highlightTier && !isCurrent}
      {@const isDefaultHighlight =
        highlightTier == null &&
        (!authState.isLoggedIn || userTier === 'free') && tier.highlighted}
      {@const defaultHighlightLabel = 'Recommended'}
      {@const isHighlighted = isCurrent || isCustomHighlight || isDefaultHighlight}
      <Card.Root class={isHighlighted ? 'relative border-primary shadow-md' : ''}>
        {#if isCurrent}
          <div
            class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground"
          >
            Current Plan
          </div>
        {:else if isCustomHighlight}
          <div
            class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground"
          >
            {highlightLabel ?? 'Recommended'}
          </div>
        {:else if isDefaultHighlight}
          <div
            class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground"
          >
            {defaultHighlightLabel}
          </div>
        {/if}
        <Card.Header>
          <Card.Title class="text-lg">{tier.name}</Card.Title>
          <Card.Description>{tier.description}</Card.Description>
        </Card.Header>
        <Card.Content class="flex-1">
          <div class="mb-2">
            <div class="flex items-baseline gap-1">
              {#if yearly && tier.monthlyPrice > 0}
                <span
                  transition:slide={{ axis: 'x', duration: 200 }}
                  class="text-2xl font-bold text-muted-foreground line-through"
                  >${tier.monthlyPrice}</span
                >
              {/if}
              <span class="text-4xl font-bold">${price}</span>
              {#if tier.monthlyPrice === 0}
                <span class="text-sm text-muted-foreground">forever</span>
              {:else}
                <span class="text-sm text-muted-foreground">/month</span>
              {/if}
            </div>
            <p class="mt-1 h-5 text-sm text-muted-foreground">
              {#if yearly && tier.monthlyPrice > 0}
                <span transition:fade={{ duration: 200 }}
                  >${totalYearly}/year (save {savingsPercent}%)</span
                >
              {/if}
            </p>
          </div>
          {#if tier.includesFrom}
            <p class="mb-3 text-sm">
              All features in {tier.includesFrom}, plus:
            </p>
          {/if}
          <ul class="flex flex-col gap-3">
            {#each tier.features as feature (feature.text)}
              {@render featureItem(feature)}
            {/each}
          </ul>
        </Card.Content>
        {@const hlVariant = isCustomHighlight || isDefaultHighlight ? 'default' : undefined}
        <Card.Footer>
          {#if isCurrent || (cardTier === 'free' && (!authState.isLoggedIn || userTier === 'free'))}
            <!-- Exact current plan (or free/guest viewing Free card) → "Continue" / "Get Started" -->
            <Button variant={hlVariant ?? 'outline'} class="w-full" size="lg" href="/">
              {cardTier === 'free' ? 'Get Started' : `Continue with ${tier.name}`}
            </Button>
          {:else if userTier !== 'free' && authState.isLoggedIn && cardTier !== 'free'}
            <!-- Paid user viewing any paid tier (upgrade, downgrade, or interval switch) → portal -->
            {@render portalButton(
              hasAtLeast(userTier, cardTier) ? 'Manage Subscription' : `Upgrade to ${tier.name}`,
              hlVariant ?? (hasAtLeast(userTier, cardTier) ? 'outline' : 'default')
            )}
          {:else}
            <!-- Free/guest → checkout -->
            {@const slug = yearly ? tier.yearlySlug! : tier.monthlySlug!}
            <Button
              variant={hlVariant ?? tier.ctaVariant}
              class="w-full"
              size="lg"
              disabled={loadingSlug !== null}
              onclick={() => handleUpgrade(tier)}
            >
              {#if loadingSlug === slug}
                <LoadingSpinner />
              {/if}
              Upgrade to {tier.name}
            </Button>
          {/if}
        </Card.Footer>
      </Card.Root>
    {/each}
  </div>
</div>

<LoginDialog bind:open={loginDialogOpen} callbackURL={loginCallbackURL} />
