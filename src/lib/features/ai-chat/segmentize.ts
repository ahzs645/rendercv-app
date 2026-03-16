import { isToolUIPart, getToolName } from 'ai';
import type { UIMessage } from '@ai-sdk/svelte';

// ─── Types ───────────────────────────────────────────────

export interface ReasoningEntry {
  kind: 'reasoning';
  title: string;
  content: string;
}

export interface ToolEntry {
  kind: 'tool';
  toolName: string;
  status: 'running' | 'done' | 'error';
  detail?: string;
}

export type Entry = ReasoningEntry | ToolEntry;

export interface TextSegment {
  type: 'text';
  text: string;
}

export interface ActivitySegment {
  type: 'activity';
  entries: Entry[];
}

export type Segment = TextSegment | ActivitySegment;

// ─── Helpers ─────────────────────────────────────────────

const TITLE_MAX = 80;
const TITLE_END_RE = /[.!?\n]/;
const MARKDOWN_RE = /(\*{1,2}|_{1,2}|~{2}|`)/g;

/** Strip inline markdown markers (bold, italic, strikethrough, code) from text. */
function stripMarkdown(text: string): string {
  return text.replace(MARKDOWN_RE, '');
}

function parseReasoningTitle(text: string): { title: string; content: string } {
  const match = TITLE_END_RE.exec(text);
  if (match && match.index > 0 && match.index <= TITLE_MAX) {
    const title = stripMarkdown(text.slice(0, match.index).trim());
    const content = text.slice(match.index + 1).trim();
    return { title, content };
  }
  if (text.length <= TITLE_MAX) {
    return { title: stripMarkdown(text.trim()), content: '' };
  }
  // Truncate at word boundary
  const truncated = text.slice(0, TITLE_MAX);
  const lastSpace = truncated.lastIndexOf(' ');
  const cutoff = lastSpace > 20 ? lastSpace : TITLE_MAX;
  return { title: stripMarkdown(text.slice(0, cutoff).trim()), content: text.slice(cutoff).trim() };
}

function getToolStatus(part: unknown): 'running' | 'done' | 'error' {
  const state = (part as { state?: string }).state;
  if (state === 'output-available') return 'done';
  if (state === 'output-error') return 'error';
  return 'running';
}

function getToolDetail(part: unknown): string | undefined {
  const input = (part as { input?: Record<string, unknown> }).input;
  if (!input || typeof input !== 'object') return undefined;

  // Common detail extraction patterns
  if (typeof input.file === 'string') return input.file;
  if (typeof input.url === 'string') return input.url;
  if (typeof input.filename === 'string') return input.filename;
  if (typeof input.path === 'string') return input.path;
  return undefined;
}

// ─── Main function ───────────────────────────────────────

export function segmentize(parts: UIMessage['parts']): Segment[] {
  const segments: Segment[] = [];
  let currentText: string | null = null;
  let currentActivity: Entry[] | null = null;

  function flushText() {
    if (currentText !== null) {
      segments.push({ type: 'text', text: currentText });
      currentText = null;
    }
  }

  function flushActivity() {
    if (currentActivity !== null) {
      segments.push({ type: 'activity', entries: currentActivity });
      currentActivity = null;
    }
  }

  for (const part of parts) {
    if (part.type === 'text') {
      const text = (part as { text: string }).text;
      if (!text || text.trim() === '') continue;

      // Flush any pending activity before starting text
      flushActivity();

      if (currentText !== null) {
        currentText += text;
      } else {
        currentText = text;
      }
    } else if (part.type === 'reasoning') {
      const text = (part as { text: string }).text;
      if (!text || text.trim() === '') continue;

      // Flush any pending text before starting activity
      flushText();

      const { title, content } = parseReasoningTitle(text);
      const entry: ReasoningEntry = { kind: 'reasoning', title, content };

      if (currentActivity !== null) {
        currentActivity.push(entry);
      } else {
        currentActivity = [entry];
      }
    } else if (isToolUIPart(part)) {
      // Flush any pending text before starting activity
      flushText();

      const entry: ToolEntry = {
        kind: 'tool',
        toolName: getToolName(part),
        status: getToolStatus(part),
        detail: getToolDetail(part)
      };

      if (currentActivity !== null) {
        currentActivity.push(entry);
      } else {
        currentActivity = [entry];
      }
    }
    // Skip other part types (file, data, etc.)
  }

  // Flush remaining
  flushText();
  flushActivity();

  return segments;
}
