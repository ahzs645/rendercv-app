import { describe, expect, it } from 'vitest';
import { app } from './app';

describe('RenderCV API', () => {
  it('lists files', async () => {
    const response = await app.request('/api/files');
    const body = (await response.json()) as { files: unknown[] };

    expect(response.status).toBe(200);
    expect(Array.isArray(body.files)).toBe(true);
  });

  it('returns 400 for malformed file content patches', async () => {
    const response = await app.request('/api/files/file-1/content', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'file-1', sections: { cv: 123 }, lastEdited: Date.now() })
    });
    const body = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('invalid_payload');
  });

  it('rejects file content patches with mismatched ids', async () => {
    const filesResponse = await app.request('/api/files');
    const filesBody = (await filesResponse.json()) as { files: Array<{ id: string }> };
    const id = filesBody.files[0]?.id;
    expect(id).toBeTruthy();

    const response = await app.request(`/api/files/${id}/content`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'different-id',
        sections: { cv: 'cv:\n  name: Jane Doe' },
        lastEdited: Date.now()
      })
    });
    const body = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('file_id_mismatch');
  });

  it('rejects file metadata patches with mismatched ids', async () => {
    const filesResponse = await app.request('/api/files');
    const filesBody = (await filesResponse.json()) as { files: Array<{ id: string }> };
    const id = filesBody.files[0]?.id;
    expect(id).toBeTruthy();

    const response = await app.request(`/api/files/${id}/meta`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'different-id', name: 'Should Not Apply' })
    });
    const body = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('file_id_mismatch');
  });

  it('rejects migrate requests without a firebase uid', async () => {
    const response = await app.request('/api/migrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const body = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('missing_firebase_uid');
  });

  it('streams chat guidance for the current CV context', async () => {
    const response = await app.request('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            id: 'message-1',
            role: 'user',
            parts: [{ type: 'text', text: 'rewrite my headline' }]
          }
        ],
        model: 'gpt-5-mini',
        fileContext: {
          cv: 'cv:\n  name: Jane Doe\n  headline: Platform Engineer\n  sections:\n    experience:\n      - Built platform tooling\n',
          design: '',
          locale: '',
          settings: ''
        }
      })
    });

    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    expect(body).toContain('Recommended headline directions');
  });

  it('stores and reports a GitHub sync connection', async () => {
    const syncResponse = await app.request('/api/github/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoName: 'rendercv-test', isPrivate: true })
    });
    const connectionResponse = await app.request('/api/github/connection');
    const connectionBody = (await connectionResponse.json()) as {
      connection: { repoName: string; isPrivate: boolean; lastSyncedAt: string | null } | null;
    };

    expect(syncResponse.status).toBe(200);
    expect(connectionResponse.status).toBe(200);
    expect(connectionBody.connection?.repoName).toBe('rendercv-test');
    expect(connectionBody.connection?.isPrivate).toBe(true);
    expect(connectionBody.connection?.lastSyncedAt).not.toBeNull();
  });

  it('rejects PDF import without an uploaded file', async () => {
    const response = await app.request('/api/import-pdf', {
      method: 'POST',
      body: new FormData()
    });
    const body = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('invalid_pdf');
  });
});
