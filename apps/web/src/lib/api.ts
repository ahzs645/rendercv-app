import type {
  AiUsageResponse,
  ApiErrorResponse,
  BillingSubscriptionResponse,
  CheckoutResponse,
  FeedbackResponse,
  FileContentPatch,
  FileMetaPatch,
  FilesListResponse,
  GitHubConnectionResponse,
  GitHubSyncResponse,
  PortalResponse,
  PreferencesResponse,
  PublicCvResponse
} from '@rendercv/contracts';
import type { CvFile, FeedbackSubmission } from '@rendercv/contracts';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
export const API_ENABLED = import.meta.env.VITE_DISABLE_API === 'true'
  ? false
  : import.meta.env.DEV || API_BASE_URL.length > 0;

export class ApiUnavailableError extends Error {
  constructor() {
    super('API is unavailable in this static build.');
    this.name = 'ApiUnavailableError';
  }
}

function apiUrl(path: string) {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  if (!API_ENABLED) {
    throw new ApiUnavailableError();
  }

  const response = await fetch(input, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    ...init
  });

  return parseResponse<T>(response);
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as ApiErrorResponse | null;
    throw new Error(error?.error.message ?? `${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

export const api = {
  getFiles() {
    return request<FilesListResponse>(apiUrl('/api/files'));
  },
  createFile(file: Omit<CvFile, 'isReadOnly'>) {
    return request<FilesListResponse>(apiUrl('/api/files'), { method: 'POST', body: JSON.stringify(file) });
  },
  patchFileContent(payload: FileContentPatch) {
    return request<FilesListResponse>(apiUrl(`/api/files/${payload.id}/content`), {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },
  patchFileMeta(payload: FileMetaPatch) {
    return request<FilesListResponse>(apiUrl(`/api/files/${payload.id}/meta`), {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },
  deleteFile(id: string) {
    return request<FilesListResponse>(apiUrl(`/api/files/${id}`), { method: 'DELETE' });
  },
  getPreferences() {
    return request<PreferencesResponse>(apiUrl('/api/preferences'));
  },
  patchPreferences(preferences: PreferencesResponse['preferences']) {
    return request<PreferencesResponse>(apiUrl('/api/preferences'), {
      method: 'PATCH',
      body: JSON.stringify({ preferences })
    });
  },
  getBillingSubscription() {
    return request<BillingSubscriptionResponse>(apiUrl('/api/billing/subscription'));
  },
  checkout(slug: string) {
    return request<CheckoutResponse>(apiUrl('/api/billing/checkout'), {
      method: 'POST',
      body: JSON.stringify({ slug })
    });
  },
  getPortal() {
    return request<PortalResponse>(apiUrl('/api/billing/portal'));
  },
  getAiUsage() {
    return request<AiUsageResponse>(apiUrl('/api/ai/usage'));
  },
  getGitHubConnection() {
    return request<GitHubConnectionResponse>(apiUrl('/api/github/connection'));
  },
  syncGitHub(options?: { repoName?: string; isPrivate?: boolean }) {
    return request<GitHubSyncResponse>(apiUrl('/api/github/sync'), {
      method: 'POST',
      body: JSON.stringify(options ?? {})
    });
  },
  disconnectGitHub() {
    return request<GitHubSyncResponse>(apiUrl('/api/github/connection'), { method: 'DELETE' });
  },
  submitFeedback(submission: FeedbackSubmission) {
    return request<FeedbackResponse>(apiUrl('/api/feedback'), {
      method: 'POST',
      body: JSON.stringify(submission)
    });
  },
  getPublicCv(id: string) {
    return request<PublicCvResponse>(apiUrl(`/api/public-cv/${id}`));
  },
  migrate(firebaseUid: string) {
    return request<{ ok: boolean }>(apiUrl('/api/migrate'), {
      method: 'POST',
      body: JSON.stringify({ firebase_uid: firebaseUid })
    });
  },
  async importPdf(file: File) {
    if (!API_ENABLED) {
      throw new ApiUnavailableError();
    }

    const formData = new FormData();
    formData.set('pdf', file);

    const response = await fetch(apiUrl('/api/import-pdf'), {
      method: 'POST',
      body: formData
    });

    return parseResponse<{ cv: string }>(response);
  }
};
