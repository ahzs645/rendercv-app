import type { CvFileSections } from './cv';
import type { AiProviderId } from './preferences';

export interface AiUsage {
  used: number;
  limit: number;
}

export interface ChatRequest {
  fileId?: string;
  chatSessionId?: string;
  model: string;
  fileContext: CvFileSections;
  message: string;
  /** When provider !== 'managed', the request is BYOK and `apiKey` should be present. */
  provider?: AiProviderId;
  apiKey?: string;
}

export type ChatStreamEvent =
  | { type: 'message'; message: string }
  | { type: 'usage'; usage: AiUsage }
  | { type: 'done' }
  | { type: 'error'; message: string };
