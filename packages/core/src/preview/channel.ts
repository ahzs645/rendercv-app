import type { CvFile } from '@rendercv/contracts';

export type PreviewChannelMessage =
  | { type: 'ready' }
  | { type: 'closed' }
  | { type: 'ping' }
  | { type: 'filestate'; files: CvFile[]; selectedFileId?: string };

export function createPreviewChannel(name = 'rendercv-preview') {
  return new BroadcastChannel(name);
}
