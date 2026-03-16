import { getGithubConnection, disconnectGithub } from './github-sync';
import { capture } from '$lib/analytics/posthog-client';
import { EVENTS } from '$lib/analytics/events';

type ConnectionInfo = {
  repoName: string;
  repoFullName: string;
  repoUrl: string;
  isPrivate: boolean;
  lastSyncedAt: string | null;
};

class GithubSyncState {
  open = $state(false);
  connection = $state<ConnectionInfo | null>(null);
  loading = $state(false);

  show() {
    this.open = true;
  }

  /** Initialize from SSR data — avoids a separate client-side fetch. */
  initFromSSR(
    data: {
      connection: ConnectionInfo | null;
    } | null
  ) {
    if (!data) return;
    this.connection = data.connection;
  }

  async loadConnection() {
    this.loading = true;
    try {
      const data = await getGithubConnection();
      this.connection = data.connection;
    } catch {
      // Silently fail — connection stays null
    } finally {
      this.loading = false;
    }
  }

  async disconnect() {
    try {
      await disconnectGithub();
      capture(EVENTS.GITHUB_SYNC_DISCONNECTED);
    } catch {
      // Silently fail
    }
    this.connection = null;
  }
}

export const githubSyncState = new GithubSyncState();
