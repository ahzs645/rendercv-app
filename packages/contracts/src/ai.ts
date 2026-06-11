import type { CvFileSections } from './cv';
import type { AiProviderId } from './preferences';

export interface AiUsage {
  used: number;
  limit: number;
}

export interface ChatRequest {
  fileId?: string;
  chatSessionId?: string;
  model?: string;
  fileContext?: Partial<CvFileSections>;
  messages?: Array<{
    role: 'system' | 'user' | 'assistant';
    parts: Array<{ type: 'text'; text: string } | Record<string, unknown>>;
  }>;
  /** Legacy/simple prompt shape accepted by API clients that do not use AI SDK messages. */
  message?: string;
  /** When provider !== 'managed', the request is BYOK and `apiKey` should be present. */
  provider?: AiProviderId;
  apiKey?: string;
}

export type ChatStreamEvent =
  | { type: 'message'; message: string }
  | { type: 'usage'; usage: AiUsage }
  | { type: 'done' }
  | { type: 'error'; message: string };
