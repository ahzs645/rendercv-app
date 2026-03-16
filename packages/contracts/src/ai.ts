import type { CvFileSections } from './cv';

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
}

export type ChatStreamEvent =
  | { type: 'message'; message: string }
  | { type: 'usage'; usage: AiUsage }
  | { type: 'done' }
  | { type: 'error'; message: string };
