import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { ZodError } from 'zod';
import type { ApiErrorResponse } from '@rendercv/contracts';
import { filesRouter } from './routes/files';
import { preferencesRouter } from './routes/preferences';
import { billingRouter } from './routes/billing';
import { chatRouter } from './routes/chat';
import { aiRouter } from './routes/ai';
import { importPdfRouter } from './routes/import-pdf';
import { githubRouter } from './routes/github';
import { migrateRouter } from './routes/migrate';
import { feedbackRouter } from './routes/feedback';
import { metaRouter } from './routes/meta';
import { publicCvRouter } from './routes/public-cv';

export const app = new Hono();

const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  '/api/*',
  cors({
    origin: (origin) => {
      if (!origin) return origin;
      if (allowedOrigins.length === 0) return origin;
      return allowedOrigins.includes(origin) ? origin : null;
    },
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type']
  })
);

app.route('/api/files', filesRouter);
app.route('/api/preferences', preferencesRouter);
app.route('/api/billing', billingRouter);
app.route('/api/chat', chatRouter);
app.route('/api/ai', aiRouter);
app.route('/api/import-pdf', importPdfRouter);
app.route('/api/github', githubRouter);
app.route('/api/migrate', migrateRouter);
app.route('/api/feedback', feedbackRouter);
app.route('/api/meta', metaRouter);
app.route('/api/public-cv', publicCvRouter);

app.notFound((context) =>
  context.json<ApiErrorResponse>(
    {
      error: {
        code: 'not_found',
        message: `Not found: ${context.req.path}`
      }
    },
    404
  )
);

app.onError((error, context) => {
  if (error instanceof ZodError) {
    return context.json<ApiErrorResponse>(
      {
        error: {
          code: 'invalid_payload',
          message: 'Invalid request payload.',
          details: error.issues
        }
      },
      400
    );
  }

  if (error instanceof SyntaxError) {
    return context.json<ApiErrorResponse>(
      {
        error: {
          code: 'invalid_json',
          message: 'Invalid JSON request body.'
        }
      },
      400
    );
  }

  console.error(error);
  return context.json<ApiErrorResponse>(
    {
      error: {
        code: 'internal_error',
        message: 'Internal server error.'
      }
    },
    500
  );
});
