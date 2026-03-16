import type { ApiErrorResponse } from '@rendercv/contracts';
import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export function jsonError(
  context: Context,
  code: string,
  message: string,
  status: ContentfulStatusCode = 400
) {
  return context.json<ApiErrorResponse>(
    {
      error: { code, message }
    },
    status
  );
}
