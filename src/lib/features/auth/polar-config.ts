import {
  PUBLIC_POLAR_PRODUCT_ID_PLUS_MONTHLY,
  PUBLIC_POLAR_PRODUCT_ID_PLUS_YEARLY,
  PUBLIC_POLAR_PRODUCT_ID_PRO_MONTHLY,
  PUBLIC_POLAR_PRODUCT_ID_PRO_YEARLY
} from '$env/static/public';

export const POLAR_PRODUCT_IDS = {
  plusMonthly: PUBLIC_POLAR_PRODUCT_ID_PLUS_MONTHLY,
  plusYearly: PUBLIC_POLAR_PRODUCT_ID_PLUS_YEARLY,
  proMonthly: PUBLIC_POLAR_PRODUCT_ID_PRO_MONTHLY,
  proYearly: PUBLIC_POLAR_PRODUCT_ID_PRO_YEARLY
} as const;

export type Tier = 'free' | 'plus' | 'pro';
export type BillingInterval = 'month' | 'year';

export const PRODUCT_TO_TIER: Record<string, Tier> = {
  [POLAR_PRODUCT_IDS.plusMonthly]: 'plus',
  [POLAR_PRODUCT_IDS.plusYearly]: 'plus',
  [POLAR_PRODUCT_IDS.proMonthly]: 'pro',
  [POLAR_PRODUCT_IDS.proYearly]: 'pro'
};

export const PRODUCT_TO_INTERVAL: Record<string, BillingInterval> = {
  [POLAR_PRODUCT_IDS.plusMonthly]: 'month',
  [POLAR_PRODUCT_IDS.plusYearly]: 'year',
  [POLAR_PRODUCT_IDS.proMonthly]: 'month',
  [POLAR_PRODUCT_IDS.proYearly]: 'year'
};

const TIER_RANK: Record<Tier, number> = { free: 0, plus: 1, pro: 2 };

export const SLUG_TO_PRODUCT_ID: Record<string, string> = {
  'plus-monthly': POLAR_PRODUCT_IDS.plusMonthly,
  'plus-yearly': POLAR_PRODUCT_IDS.plusYearly,
  'pro-monthly': POLAR_PRODUCT_IDS.proMonthly,
  'pro-yearly': POLAR_PRODUCT_IDS.proYearly
};

export function hasAtLeast(userTier: Tier, required: Tier): boolean {
  return TIER_RANK[userTier] >= TIER_RANK[required];
}
