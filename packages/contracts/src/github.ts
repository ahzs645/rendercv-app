export interface GitHubConnection {
  repoName: string;
  repoFullName: string;
  repoUrl: string;
  isPrivate: boolean;
  lastSyncedAt: string | null;
}
