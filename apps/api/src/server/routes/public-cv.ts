import { Hono } from 'hono';
import type { PublicCvResponse } from '@rendercv/contracts';
import { resolveFileSections } from '@rendercv/core';
import { serverState } from '../persistence';

export const publicCvRouter = new Hono().get('/:id', (context) => {
  const file = serverState.files.find((entry) => entry.id === context.req.param('id') && entry.isPublic);
  if (!file) {
    return context.json<PublicCvResponse>({ cv: null }, 404);
  }

  return context.json<PublicCvResponse>({
    cv: {
      fileId: file.id,
      cvName: file.name,
      sections: resolveFileSections(file as Parameters<typeof resolveFileSections>[0])
    }
  });
});
