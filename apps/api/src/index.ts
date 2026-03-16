import { createAdaptorServer } from '@hono/node-server';
import { app } from './server/app';

const port = Number(process.env.PORT ?? 8787);

const server = createAdaptorServer({
  fetch: app.fetch
});

server.once('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `RenderCV API could not start because port ${port} is already in use. Stop the existing process or run with PORT=<port>.`
    );
    process.exit(1);
  }

  console.error(error);
  process.exit(1);
});

server.listen(port, () => {
  console.log(`RenderCV API listening on http://localhost:${port}`);
});
