import { Hono } from 'hono';
import { z } from 'zod';
import type { CvFile, FilesListResponse } from '@rendercv/contracts';
import { persistState, serverState } from '../persistence';
import { jsonError } from '../errors';

export const filesRouter = new Hono()
  .get('/', (context) => context.json<FilesListResponse>({ files: serverState.files }))
  .post(async (context) => {
    const body = (await context.req.json().catch(() => null)) as Omit<CvFile, 'isReadOnly'> | null;
    if (!body || typeof body !== 'object') {
      return jsonError(context, 'invalid_payload', 'Expected a file payload.', 400);
    }

    serverState.files.unshift(body as (typeof serverState.files)[number]);
    persistState();
    return context.json<FilesListResponse>({ files: serverState.files });
  })
  .post('/migrate', async (context) => {
    const body = z.object({ files: z.array(z.record(z.string(), z.any())).default([]) }).parse(await context.req.json().catch(() => ({ files: [] })));
    serverState.files.unshift(...(body.files as typeof serverState.files));
    persistState();
    return context.json<FilesListResponse>({ files: serverState.files });
  })
  .patch('/:id/content', async (context) => {
    const body = z.object({
      id: z.string(),
      sections: z.object({
        cv: z.string().optional(),
        design: z.string().optional(),
        locale: z.string().optional(),
        settings: z.string().optional()
      }),
      lastEdited: z.number()
    }).parse(await context.req.json());

    const file = serverState.files.find((entry) => entry.id === context.req.param('id'));
    if (!file) {
      return jsonError(context, 'file_not_found', 'File not found.', 404);
    }

    if (body.sections.cv !== undefined) file.cv = body.sections.cv;
    if (body.sections.settings !== undefined) file.settings = body.sections.settings;
    if (body.sections.design !== undefined) file.designs[file.selectedTheme] = body.sections.design;
    if (body.sections.locale !== undefined) file.locales[file.selectedLocale] = body.sections.locale;
    file.lastEdited = body.lastEdited;
    file.editCount += 1;
    persistState();

    return context.json<FilesListResponse>({ files: serverState.files });
  })
  .patch('/:id/meta', async (context) => {
    const body = z.object({
      id: z.string(),
      name: z.string().optional(),
      designs: z.record(z.string(), z.string()).optional(),
      selectedTheme: z.string().optional(),
      selectedLocale: z.string().optional(),
      isLocked: z.boolean().optional(),
      isArchived: z.boolean().optional(),
      isTrashed: z.boolean().optional(),
      isPublic: z.boolean().optional()
    }).parse(await context.req.json());

    const file = serverState.files.find((entry) => entry.id === context.req.param('id'));
    if (!file) {
      return jsonError(context, 'file_not_found', 'File not found.', 404);
    }

    Object.assign(file, body);
    persistState();
    return context.json<FilesListResponse>({ files: serverState.files });
  })
  .delete('/:id', (context) => {
    const id = context.req.param('id');
    serverState.files = serverState.files.filter((file) => file.id !== id);
    persistState();
    return context.json<FilesListResponse>({ files: serverState.files });
  });
