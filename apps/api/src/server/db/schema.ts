import { boolean, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const userPreferences = pgTable('user_preferences', {
  userId: text('user_id').primaryKey(),
  preferences: jsonb('preferences').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const cvFiles = pgTable('cv_files', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  name: text('name').notNull(),
  cv: text('cv'),
  settings: text('settings'),
  designs: jsonb('designs').notNull(),
  locales: jsonb('locales').notNull(),
  selectedTheme: text('selected_theme').notNull(),
  selectedLocale: text('selected_locale').notNull(),
  isLocked: boolean('is_locked').notNull().default(false),
  isArchived: boolean('is_archived').notNull().default(false),
  isTrashed: boolean('is_trashed').notNull().default(false),
  isPublic: boolean('is_public').notNull().default(false),
  chatMessages: jsonb('chat_messages').notNull().default([]),
  editCount: integer('edit_count').notNull().default(0),
  lastEdited: integer('last_edited').notNull()
});

export const aiUsage = pgTable('ai_usage', {
  userId: text('user_id').primaryKey(),
  used: integer('used').notNull().default(0),
  limit: integer('limit').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const githubConnections = pgTable('github_connections', {
  userId: text('user_id').primaryKey(),
  repoName: text('repo_name').notNull(),
  repoFullName: text('repo_full_name').notNull(),
  repoUrl: text('repo_url').notNull(),
  isPrivate: boolean('is_private').notNull().default(false),
  accessTokenEncrypted: text('access_token_encrypted'),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true })
});

export const migrationRecords = pgTable('migration_records', {
  firebaseUid: text('firebase_uid').primaryKey(),
  targetUserId: text('target_user_id'),
  status: text('status').notNull(),
  lastError: text('last_error'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const feedbackSubmissions = pgTable('feedback_submissions', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  email: text('email'),
  page: text('page'),
  message: text('message').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const subscriptionState = pgTable('subscription_state', {
  userId: text('user_id').primaryKey(),
  tier: text('tier').notNull(),
  interval: text('interval'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});
