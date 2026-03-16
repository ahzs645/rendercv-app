/**
 * Central registry of all PostHog event names.
 * `object_action` naming convention.
 */
export const EVENTS = {
  // --- Tier 1: North Star + Activation + Revenue ---
  APP_OPENED: 'app_opened',
  CV_DOWNLOADED: 'cv_downloaded',
  CV_MADE_PUBLIC: 'cv_made_public',
  CHECKOUT_COMPLETED: 'checkout_completed',
  SIGNUP_ATTEMPTED: 'signup_attempted',
  USER_AUTHENTICATED: 'user_authenticated',
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  SUBSCRIPTION_REVOKED: 'subscription_revoked',
  SUBSCRIPTION_REACTIVATED: 'subscription_reactivated',

  // --- Tier 2: Funnel Steps + Feature Adoption ---
  CV_CREATED: 'cv_created',
  CV_CONTENT_EDITED: 'cv_content_edited',
  AI_CHAT_MESSAGE_SENT: 'ai_chat_message_sent',
  AI_CHAT_PROPOSAL_ACCEPTED: 'ai_chat_proposal_accepted',
  AI_CHAT_PROPOSAL_REJECTED: 'ai_chat_proposal_rejected',
  PDF_IMPORT_COMPLETED: 'pdf_import_completed',
  PDF_IMPORT_FAILED: 'pdf_import_failed',
  UPGRADE_PROMPT_SHOWN: 'upgrade_prompt_shown',
  PRICING_PAGE_VIEWED: 'pricing_page_viewed',
  CHECKOUT_STARTED: 'checkout_started',
  PUBLIC_CV_VIEWED: 'public_cv_viewed',
  GITHUB_SYNC_CONNECTED: 'github_sync_connected',
  GITHUB_SYNC_DISCONNECTED: 'github_sync_disconnected',

  // --- Tier 3: Engagement Depth ---
  EDITOR_MODE_SWITCHED: 'editor_mode_switched',
  SECTION_TAB_CHANGED: 'section_tab_changed',
  CV_THEME_CHANGED: 'cv_theme_changed',
  CV_LOCALE_CHANGED: 'cv_locale_changed',
  CV_RENAMED: 'cv_renamed',
  CV_DUPLICATED: 'cv_duplicated',
  CV_LOCKED: 'cv_locked',
  CV_UNLOCKED: 'cv_unlocked',
  CV_ARCHIVED: 'cv_archived',
  CV_TRASHED: 'cv_trashed',
  CV_RESTORED: 'cv_restored',
  CV_DELETED_PERMANENTLY: 'cv_deleted_permanently',
  PREVIEW_POPUP_OPENED: 'preview_popup_opened',
  FEEDBACK_SUBMITTED: 'feedback_submitted',
  PUBLIC_LINK_COPIED: 'public_link_copied',
  CV_SHARED_NATIVE: 'cv_shared_native',
  CV_AUTO_SAVED: 'cv_auto_saved',
  AI_CHAT_QUOTA_EXCEEDED: 'ai_chat_quota_exceeded',
  PDF_IMPORT_QUOTA_EXCEEDED: 'pdf_import_quota_exceeded',
  BILLING_INTERVAL_TOGGLED: 'billing_interval_toggled',
  RENDER_FAILED: 'render_failed',

  // --- Migration ---
  MIGRATION_STARTED: 'migration_started',
  MIGRATION_COMPLETED: 'migration_completed',
  MIGRATION_FAILED: 'migration_failed'
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];
