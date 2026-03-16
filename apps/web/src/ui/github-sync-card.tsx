import { useEffect, useState } from 'react';
import type { GitHubConnection } from '@rendercv/contracts';
import { Github } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api';

export function GitHubSyncCard() {
  const [connection, setConnection] = useState<GitHubConnection | null>(null);
  const [repoName, setRepoName] = useState('rendercv-output');
  const [isPrivate, setIsPrivate] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    api.getGitHubConnection()
      .then((result) => setConnection(result.connection))
      .catch(() => {});
  }, []);

  async function refreshConnection() {
    const result = await api.getGitHubConnection();
    setConnection(result.connection);
  }

  async function handleSync() {
    setPending(true);
    try {
      await api.syncGitHub({
        repoName: connection?.repoName ?? repoName,
        isPrivate: connection?.isPrivate ?? isPrivate
      });
      await refreshConnection();
      toast.success('CV files exported to the GitHub sync workspace.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'GitHub sync failed.');
    } finally {
      setPending(false);
    }
  }

  async function handleDisconnect() {
    setPending(true);
    try {
      await api.disconnectGitHub();
      setConnection(null);
      toast.success('GitHub sync disconnected.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to disconnect GitHub sync.');
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Github className="size-4" />
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          GitHub Sync
        </h3>
      </div>
      {connection ? (
        <>
          <p className="mt-3 text-sm">
            Synced repo: <span className="font-medium">{connection.repoFullName}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Last synced {connection.lastSyncedAt ? new Date(connection.lastSyncedAt).toLocaleString() : 'never'}
          </p>
          <div className="mt-4 flex gap-2">
            <button
              className="rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground"
              disabled={pending}
              onClick={() => {
                void handleSync();
              }}
              type="button"
            >
              {pending ? 'Syncing…' : 'Sync now'}
            </button>
            <button
              className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground"
              disabled={pending}
              onClick={() => {
                void handleDisconnect();
              }}
              type="button"
            >
              Disconnect
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-3 text-sm text-muted-foreground">
            Export all CV YAML files into the local GitHub sync workspace and keep a repo connection attached to this app state.
          </p>
          <div className="mt-4 space-y-3">
            <input
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              placeholder="rendercv-output"
              value={repoName}
              onChange={(event) => setRepoName(event.target.value)}
            />
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                checked={isPrivate}
                type="checkbox"
                onChange={(event) => setIsPrivate(event.target.checked)}
              />
              Private repository
            </label>
            <button
              className="rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground"
              disabled={pending}
              onClick={() => {
                void handleSync();
              }}
              type="button"
            >
              {pending ? 'Connecting…' : 'Connect and sync'}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
