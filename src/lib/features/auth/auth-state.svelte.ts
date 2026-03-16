import { createAuthClient } from 'better-auth/svelte';
import { adminClient } from 'better-auth/client/plugins';
import { polarClient } from '@polar-sh/better-auth/client';
import { hasAtLeast, type Tier, type BillingInterval } from './polar-config';
import { refreshTier } from './refresh-tier.remote';
import { createCheckout } from './create-checkout.remote';
import { capture, reset as posthogReset, setPersonProperties } from '$lib/analytics/posthog-client';
import { EVENTS } from '$lib/analytics/events';

function isPreviewEnv(): boolean {
  return typeof window !== 'undefined' && window.location.hostname.endsWith('--preview.rendercv.com');
}

function redirectToProductionAuth(provider: 'github' | 'google') {
  const origin = encodeURIComponent(window.location.origin);
  window.location.href = `https://rendercv.com/api/auth/preview-login?origin=${origin}&provider=${provider}`;
}

const authClient = createAuthClient({
  plugins: [adminClient(), polarClient()]
});

type User = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string | null;
  wantsEmailUpdates: boolean;
  subscriptionTier: string;
  subscriptionInterval: string | null;
  totalEdits: number;
};

let _user = $state<User | undefined>(undefined);

export function initAuth(serverUser: User | null | undefined) {
  _user = serverUser ?? undefined;
}

export const authState = {
  get user() {
    return _user;
  },
  get isLoggedIn() {
    return !!_user;
  },
  get tier(): Tier {
    const t = _user?.subscriptionTier;
    if (t === 'plus' || t === 'pro') return t;
    return 'free';
  },
  get interval(): BillingInterval | null {
    const i = _user?.subscriptionInterval;
    if (i === 'month' || i === 'year') return i;
    return null;
  },

  can(required: Tier) {
    return hasAtLeast(this.tier, required);
  },

  async checkout(slug: string, sourceFeature?: string | null) {
    const data = await createCheckout({ slug, sourceFeature: sourceFeature ?? undefined });
    if (!data?.url) return;
    capture(EVENTS.CHECKOUT_STARTED, {
      slug,
      product_id: data.productId,
      source_feature: sourceFeature ?? undefined
    });
    window.location.href = data.url;
  },

  portalHref: '/portal',

  async refreshTier() {
    const data = await refreshTier();
    if (_user) {
      _user.subscriptionTier = data.tier;
      _user.subscriptionInterval = data.interval;
      setPersonProperties({ tier: data.tier, interval: data.interval, plan: data.tier });
    }
  },

  signInWithGoogle(wantsEmailUpdates: boolean, callbackURL?: string) {
    capture(EVENTS.SIGNUP_ATTEMPTED, { auth_provider: 'google' });

    if (isPreviewEnv()) {
      redirectToProductionAuth('google');
      return;
    }

    authClient.signIn.social({
      provider: 'google',
      callbackURL,
      additionalData: { wantsEmailUpdates }
    });
  },

  signInWithGithub(wantsEmailUpdates: boolean, callbackURL?: string) {
    capture(EVENTS.SIGNUP_ATTEMPTED, { auth_provider: 'github' });

    if (isPreviewEnv()) {
      redirectToProductionAuth('github');
      return;
    }

    authClient.signIn.social({
      provider: 'github',
      callbackURL,
      additionalData: { wantsEmailUpdates }
    });
  },

  setWantsEmailUpdates(value: boolean) {
    if (_user) {
      _user.wantsEmailUpdates = value;
    }
  },

  async deleteAccount() {
    posthogReset();
    await authClient.deleteUser();
    _user = undefined;
    window.location.href = '/';
  },

  async signOut() {
    posthogReset();
    _user = undefined;
    await authClient.signOut();
  }
};
