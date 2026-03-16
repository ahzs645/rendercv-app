import type { BillingInterval, SubscriptionTier } from './auth';

export interface BillingState {
  tier: SubscriptionTier;
  interval: BillingInterval;
  portalUrl: string | null;
  checkoutUrl: string | null;
}
