import { goto } from '$app/navigation';
import { FEATURE_GATES, type GatedFeature } from './feature-gates';
import type { Tier } from './polar-config';
import { capture } from '$lib/analytics/posthog-client';
import { EVENTS } from '$lib/analytics/events';

interface ShowOptions {
  title?: string;
  highlight?: Tier;
  badge?: string;
}

class UpgradePromptState {
  show(feature: string, options?: ShowOptions) {
    const gate = (FEATURE_GATES as Record<string, { tier: Tier; label: string }>)[feature];
    const title =
      options?.title ?? (gate ? `Upgrade to unlock ${gate.label}` : 'Upgrade your plan');
    const highlight = options?.highlight ?? gate?.tier ?? 'plus';

    const url = new URL('/pricing', window.location.origin);
    url.searchParams.set('feature', feature);
    url.searchParams.set('title', title);
    url.searchParams.set('highlight', highlight);
    const badge = options?.badge ?? 'Feature supported by';
    url.searchParams.set('badge', badge);
    capture(EVENTS.UPGRADE_PROMPT_SHOWN, { feature, highlight, title });
    goto(url.pathname + url.search);
  }
}

export const upgradePromptState = new UpgradePromptState();
