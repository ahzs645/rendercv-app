import type { Tier } from '$lib/features/auth/polar-config';

export interface AiModel {
  id: string;
  label: string;
  provider: 'google' | 'anthropic';
  /** Minimum subscription tier required to use this model */
  minTier: Tier;
  /** Number of dollar signs to show */
  cost: 1 | 2 | 3 | 4;
}

export const AI_MODELS: AiModel[] = [
  {
    id: 'gemini-3.1-flash-lite-preview',
    label: 'Gemini 3.1 Flash Lite',
    provider: 'google',
    minTier: 'free',
    cost: 1
  },
  {
    id: 'gemini-3-flash-preview',
    label: 'Gemini 3 Flash',
    provider: 'google',
    minTier: 'plus',
    cost: 2
  },
  {
    id: 'gemini-3.1-pro-preview',
    label: 'Gemini 3.1 Pro',
    provider: 'google',
    minTier: 'plus',
    cost: 3
  },
  {
    id: 'claude-sonnet-4-6',
    label: 'Claude Sonnet 4.6',
    provider: 'anthropic',
    minTier: 'plus',
    cost: 3
  },
  {
    id: 'claude-opus-4-6',
    label: 'Claude Opus 4.6',
    provider: 'anthropic',
    minTier: 'plus',
    cost: 4
  }
];

export const DEFAULT_MODEL_ID = 'gemini-3.1-flash-lite-preview';

export const ALLOWED_MODEL_IDS = new Set(AI_MODELS.map((m) => m.id));

export const MODEL_MIN_TIER: Record<string, Tier> = Object.fromEntries(
  AI_MODELS.map((m) => [m.id, m.minTier])
);
