type ConnectionInfo = {
  repoName: string;
  repoFullName: string;
  repoUrl: string;
  isPrivate: boolean;
  lastSyncedAt: string | null;
};

type GetConnectionResponse = {
  connection: ConnectionInfo | null;
};

type SyncResponse = {
  ok: boolean;
};

async function githubSyncAction<T>(action: string): Promise<T> {
  const res = await fetch('/api/github-sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action })
  });
  if (!res.ok) throw new Error(`GitHub sync action failed: ${action}`);
  return res.json();
}

export function getGithubConnection(): Promise<GetConnectionResponse> {
  return githubSyncAction('get-connection');
}

export function syncToGithub(): Promise<SyncResponse> {
  return githubSyncAction('sync');
}

export function disconnectGithub(): Promise<{ ok: boolean }> {
  return githubSyncAction('disconnect');
}

export function redirectToGithubAuth(repoName: string, isPrivate: boolean) {
  const params = new URLSearchParams({
    repo: repoName,
    private: String(isPrivate)
  });
  window.location.href = `/api/github-sync/authorize?${params}`;
}
