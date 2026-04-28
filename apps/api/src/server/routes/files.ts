import { Hono } from 'hono';
import { z } from 'zod';
import type { CvFile, FilesListResponse } from '@rendercv/contracts';
import { persistState, serverState } from '../persistence';
import { jsonError } from '../errors';

const cvFileSchema = z.object({
  id: z.string().min(1),
  templateId: z.string().optional(),
  name: z.string().min(1),
  cv: z.string().nullable(),
  settings: z.string().nullable(),
  designs: z.record(z.string(), z.string()),
  locales: z.record(z.string(), z.string()),
  selectedTheme: z.string().min(1),
  selectedLocale: z.string().min(1),
  variants: z.record(z.string(), z.object({
    description: z.string().optional(),
    exclude_sections: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    flavors: z.array(z.string()).optional()
  })).optional(),
  selectedVariant: z.string().optional(),
  isLocked: z.boolean(),
  isArchived: z.boolean(),
  isTrashed: z.boolean(),
  isPublic: z.boolean(),
  chatMessages: z.array(z.unknown()),
  editCount: z.number(),
  lastEdited: z.number(),
  sharedOrigin: z.object({
    cv: z.string(),
    design: z.string(),
    locale: z.string(),
    settings: z.string()
  }).optional()
}) satisfies z.ZodType<Omit<CvFile, 'isReadOnly'>>;

const variantDefinitionSchema = z.object({
  description: z.string().optional(),
  exclude_sections: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  flavors: z.array(z.string()).optional()
});

const cvFileSectionsSchema = z.object({
  cv: z.string(),
  design: z.string(),
  locale: z.string(),
  settings: z.string()
});

export const filesRouter = new Hono()
  .get('/', (context) => context.json<FilesListResponse>({ files: serverState.files }))
  .post(async (context) => {
    const body = cvFileSchema.parse(await context.req.json());

    serverState.files.unshift(body);
    persistState();
    return context.json<FilesListResponse>({ files: serverState.files });
  })
  .post('/migrate', async (context) => {
    const body = z
      .object({ files: z.array(cvFileSchema).default([]) })
      .parse(await context.req.json().catch(() => ({ files: [] })));
    serverState.files.unshift(...body.files);
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

    if (body.id !== context.req.param('id')) {
      return jsonError(context, 'file_id_mismatch', 'File ID in payload must match the route.', 400);
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
      variants: z.record(z.string(), variantDefinitionSchema).optional(),
      selectedVariant: z.string().optional(),
      sharedOrigin: cvFileSectionsSchema.optional(),
      isLocked: z.boolean().optional(),
      isArchived: z.boolean().optional(),
      isTrashed: z.boolean().optional(),
      isPublic: z.boolean().optional()
    }).parse(await context.req.json());

    const file = serverState.files.find((entry) => entry.id === context.req.param('id'));
    if (!file) {
      return jsonError(context, 'file_not_found', 'File not found.', 404);
    }

    const { id: bodyId, ...patch } = body;
    if (bodyId !== context.req.param('id')) {
      return jsonError(context, 'file_id_mismatch', 'File ID in payload must match the route.', 400);
    }

    Object.assign(file, patch);
    persistState();
    return context.json<FilesListResponse>({ files: serverState.files });
  })
  .delete('/:id', (context) => {
    const id = context.req.param('id');
    serverState.files = serverState.files.filter((file) => file.id !== id);
    persistState();
    return context.json<FilesListResponse>({ files: serverState.files });
  });
