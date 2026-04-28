import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CvFile, FeedbackSubmission, GitHubConnection, UserPreferences } from '@rendercv/contracts';
import { fileStore } from '@rendercv/core';

type PersistedState = {
  files: Array<Omit<CvFile, 'isReadOnly'>>;
  preferences: Partial<UserPreferences>;
  aiUsage: { used: number; limit: number };
  githubConnection: GitHubConnection | null;
  feedback: FeedbackSubmission[];
  billing: {
    tier: 'free' | 'plus' | 'pro';
    interval: 'month' | 'year' | null;
  };
};

export const API_DATA_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../data');
const DATA_PATH = resolve(API_DATA_DIR, 'state.json');

function stripReadOnly(files: ReturnType<typeof fileStore.getSnapshot>['files']) {
  return files.map(({ isReadOnly: _isReadOnly, ...file }) => file);
}

function createDefaultState(): PersistedState {
  const seededFiles = stripReadOnly(fileStore.getSnapshot().files);
  if (seededFiles[0]) {
    seededFiles[0].isPublic = true;
  }

  return {
    files: seededFiles,
    preferences: {},
    aiUsage: { used: 0, limit: 25 },
    githubConnection: null,
    feedback: [],
    billing: {
      tier: 'free',
      interval: null
    }
  };
}

function loadState(): PersistedState {
  if (!existsSync(DATA_PATH)) {
    return createDefaultState();
  }

  try {
    return JSON.parse(readFileSync(DATA_PATH, 'utf8')) as PersistedState;
  } catch {
    return createDefaultState();
  }
}

export const serverState = loadState();

export function persistState() {
  mkdirSync(dirname(DATA_PATH), { recursive: true });
  writeFileSync(DATA_PATH, JSON.stringify(serverState, null, 2));
}

persistState();
