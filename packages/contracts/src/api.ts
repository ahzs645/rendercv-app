import type { BillingInterval, SubscriptionTier } from './auth';
import type { AiUsage } from './ai';
import type { CvFile, CvFileSections } from './cv';
import type { FeedbackSubmission } from './feedback';
import type { GitHubConnection } from './github';
import type { UserPreferences } from './preferences';
import type { PublicCvPayload } from './public-cv';

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface FilesListResponse {
  files: Omit<CvFile, 'isReadOnly'>[];
}

export interface FileContentPatch {
  id: string;
  sections: Partial<CvFileSections>;
  lastEdited: number;
}

export interface FileMetaPatch {
  id: string;
  name?: string;
  designs?: Record<string, string>;
  selectedTheme?: string;
  selectedLocale?: string;
  isLocked?: boolean;
  isArchived?: boolean;
  isTrashed?: boolean;
  isPublic?: boolean;
}

export interface BillingSubscriptionResponse {
  tier: SubscriptionTier;
  interval: BillingInterval;
}

export interface CheckoutResponse {
  url: string | null;
  productId?: string;
}

export interface PortalResponse {
  url: string | null;
}

export interface GitHubConnectionResponse {
  connection: GitHubConnection | null;
}

export interface GitHubSyncResponse {
  ok: boolean;
}

export interface PreferencesResponse {
  preferences: Partial<UserPreferences>;
}

export interface FeedbackResponse {
  ok: boolean;
  submission: FeedbackSubmission;
}

export interface PublicCvResponse {
  cv: PublicCvPayload | null;
}

export interface AiUsageResponse {
  usage: AiUsage;
}
