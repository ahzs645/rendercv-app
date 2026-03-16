import { Hono } from 'hono';
import { z } from 'zod';
import type { FeedbackResponse } from '@rendercv/contracts';
import { persistState, serverState } from '../persistence';

export const feedbackRouter = new Hono().post('/', async (context) => {
  const submission = z.object({
    type: z.string(),
    message: z.string(),
    email: z.string().optional(),
    page: z.string().optional()
  }).parse(await context.req.json());

  serverState.feedback.push(submission);
  persistState();
  return context.json<FeedbackResponse>({
    ok: true,
    submission
  });
});
