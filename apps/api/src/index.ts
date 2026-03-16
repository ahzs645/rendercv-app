import { serve } from '@hono/node-server';
import { app } from './server/app';

const port = Number(process.env.PORT ?? 8787);

serve(
  {
    fetch: app.fetch,
    port
  },
  (info) => {
    console.log(`RenderCV API listening on http://localhost:${info.port}`);
  }
);
