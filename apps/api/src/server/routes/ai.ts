import { Hono } from 'hono';
import type { AiUsageResponse } from '@rendercv/contracts';
import { serverState } from '../persistence';

export const aiRouter = new Hono().get('/usage', (context) =>
  context.json<AiUsageResponse>({
    usage: serverState.aiUsage
  })
);
