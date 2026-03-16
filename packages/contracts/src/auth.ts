export type SubscriptionTier = 'free' | 'plus' | 'pro';
export type BillingInterval = 'month' | 'year' | null;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string | null;
  wantsEmailUpdates: boolean;
  subscriptionTier: SubscriptionTier;
  subscriptionInterval: BillingInterval;
  totalEdits: number;
}
