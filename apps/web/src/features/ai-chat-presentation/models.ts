export interface AiModel {
  id: string;
  label: string;
  provider: 'openai' | 'google' | 'anthropic';
  minTier: 'free' | 'plus' | 'pro';
  cost: 1 | 2 | 3 | 4;
}

export const AI_MODELS: AiModel[] = [
  {
    id: 'gpt-5-mini',
    label: 'GPT-5 Mini',
    provider: 'openai',
    minTier: 'free',
    cost: 1
  },
  {
    id: 'gpt-5',
    label: 'GPT-5',
    provider: 'openai',
    minTier: 'plus',
    cost: 3
  }
];

export const DEFAULT_MODEL_ID = 'gpt-5-mini';

