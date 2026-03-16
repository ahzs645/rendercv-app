import { hasAtLeast, type Tier } from './polar-config';

export type GatedFeature = 'cloud-storage' | 'public-sharing' | 'github-sync' | 'ai-models';

export const FEATURE_GATES: Record<GatedFeature, { tier: Tier; label: string }> = {
  'cloud-storage': { tier: 'free', label: 'Cloud Storage' },
  'public-sharing': { tier: 'plus', label: 'Public Sharing' },
  'github-sync': { tier: 'plus', label: 'GitHub Sync' },
  'ai-models': { tier: 'plus', label: 'AI Model Selection' }
};

/** Whether the given tier qualifies for cloud file storage. */
export function canUseCloudStorage(tier: Tier): boolean {
  return hasAtLeast(tier, FEATURE_GATES['cloud-storage'].tier);
}
