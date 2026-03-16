import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Hono } from 'hono';
import type { GitHubConnectionResponse, GitHubSyncResponse } from '@rendercv/contracts';
import { resolveFileSections } from '@rendercv/core';
import { jsonError } from '../errors';
import { persistState, serverState } from '../persistence';

export const githubRouter = new Hono()
  .get('/connection', (context) =>
    context.json<GitHubConnectionResponse>({
      connection: serverState.githubConnection
    })
  )
  .get('/authorize', (context) => {
    const repoName = context.req.query('repo')?.trim();
    const isPrivate = context.req.query('private') === 'true';

    if (repoName) {
      connectAndSync(repoName, isPrivate);
    }

    return context.redirect('/');
  })
  .post('/sync', async (context) => {
    const body = (await context.req.json().catch(() => ({}))) as {
      repoName?: string;
      isPrivate?: boolean;
    };

    const repoName = body.repoName?.trim() || serverState.githubConnection?.repoName;
    const isPrivate = body.isPrivate ?? serverState.githubConnection?.isPrivate ?? false;

    if (!repoName) {
      return jsonError(context, 'missing_repo', 'Repository name is required to start GitHub sync.', 400);
    }

    connectAndSync(repoName, isPrivate);
    persistState();

    return context.json<GitHubSyncResponse>({
      ok: true
    });
  })
  .delete('/connection', (context) => {
    serverState.githubConnection = null;
    persistState();
    return context.json<GitHubSyncResponse>({ ok: true });
  });

function connectAndSync(repoName: string, isPrivate: boolean) {
  const repoFullName = `rendercv-local/${repoName}`;
  const exportRoot = resolve(process.cwd(), 'apps/api/data/github-sync', repoName);

  mkdirSync(exportRoot, { recursive: true });

  for (const file of serverState.files) {
    const sections = resolveFileSections(file as Parameters<typeof resolveFileSections>[0]);
    const output = [
      sections.cv,
      '',
      sections.design,
      '',
      sections.locale,
      '',
      sections.settings
    ]
      .join('\n')
      .trim();

    const safeFileName = file.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || file.id;
    writeFileSync(resolve(exportRoot, `${safeFileName}.yaml`), `${output}\n`);
  }

  writeFileSync(
    resolve(exportRoot, 'manifest.json'),
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        files: serverState.files.map((file) => ({
          id: file.id,
          name: file.name,
          public: file.isPublic,
          archived: file.isArchived,
          trashed: file.isTrashed
        }))
      },
      null,
      2
    )
  );

  serverState.githubConnection = {
    repoName,
    repoFullName,
    repoUrl: `https://github.com/${repoFullName}`,
    isPrivate,
    lastSyncedAt: new Date().toISOString()
  };
}
