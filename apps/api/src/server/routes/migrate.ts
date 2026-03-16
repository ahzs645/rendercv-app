import { Hono } from 'hono';
import { z } from 'zod';
import { jsonError } from '../errors';

export const migrateRouter = new Hono().post('/', async (context) => {
  const body = z.object({ firebase_uid: z.string().min(1) }).safeParse(await context.req.json().catch(() => ({})));
  if (!body.success) {
    return jsonError(context, 'missing_firebase_uid', 'Missing Firebase UID.', 400);
  }

  return context.json({ ok: true, firebaseUid: body.data.firebase_uid });
});
