import { Hono } from 'hono';

export const metaRouter = new Hono().get('/github-stars', (context) =>
  context.json({ stars: 0 })
);
