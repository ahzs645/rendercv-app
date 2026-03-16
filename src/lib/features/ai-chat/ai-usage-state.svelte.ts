import { loadAiUsage } from './ai-usage.remote';

class AiUsageState {
  data = $state<{ used: number; limit: number } | null>(null);

  async refresh() {
    try {
      this.data = await loadAiUsage();
    } catch {
      // Non-critical — meter just won't show
    }
  }
}

export const aiUsageState = new AiUsageState();
