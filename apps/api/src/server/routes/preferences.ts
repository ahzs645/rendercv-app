import { Hono } from 'hono';
import { z } from 'zod';
import type { PreferencesResponse } from '@rendercv/contracts';
import { persistState, serverState } from '../persistence';

export const preferencesRouter = new Hono()
  .get('/', (context) => context.json<PreferencesResponse>({ preferences: serverState.preferences }))
  .patch('/', async (context) => {
    const body = z.object({ preferences: z.record(z.string(), z.any()) }).parse(await context.req.json());
    serverState.preferences = { ...serverState.preferences, ...body.preferences };
    persistState();
    return context.json<PreferencesResponse>({ preferences: serverState.preferences });
  });
