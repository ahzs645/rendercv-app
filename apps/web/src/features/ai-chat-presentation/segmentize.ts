import type { UIMessage } from '@ai-sdk/react';

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

export interface DataSegment {
  type: 'data';
  partType: string;
  partId: string;
  data: unknown;
}

export type Segment = TextSegment | ActivitySegment | DataSegment;

const TITLE_MAX = 80;
const TITLE_END_RE = /[.!?\n]/;
const MARKDOWN_RE = /(\*{1,2}|_{1,2}|~{2}|`)/g;

function stripMarkdown(text: string): string {
  return text.replace(MARKDOWN_RE, '');
}

function parseReasoningTitle(text: string): { title: string; content: string } {
  const match = TITLE_END_RE.exec(text);
  if (match && match.index > 0 && match.index <= TITLE_MAX) {
    return {
      title: stripMarkdown(text.slice(0, match.index).trim()),
      content: text.slice(match.index + 1).trim()
    };
  }

  if (text.length <= TITLE_MAX) {
    return { title: stripMarkdown(text.trim()), content: '' };
  }

  const truncated = text.slice(0, TITLE_MAX);
  const lastSpace = truncated.lastIndexOf(' ');
  const cutoff = lastSpace > 20 ? lastSpace : TITLE_MAX;
  return {
    title: stripMarkdown(text.slice(0, cutoff).trim()),
    content: text.slice(cutoff).trim()
  };
}

function isToolPart(part: unknown): boolean {
  if (!part || typeof part !== 'object' || !('type' in part)) return false;
  const type = String((part as { type: unknown }).type);
  return type === 'dynamic-tool' || type.startsWith('tool-');
}

function getToolName(part: unknown): string {
  const record = part as Record<string, unknown>;
  if (typeof record.toolName === 'string') return record.toolName;
  if (typeof record.type === 'string' && record.type.startsWith('tool-')) {
    return record.type.slice('tool-'.length);
  }
  return 'tool';
}

function getToolStatus(part: unknown): ToolEntry['status'] {
  const state = (part as { state?: string }).state;
  if (state === 'output-available') return 'done';
  if (state === 'output-error') return 'error';
  return 'running';
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}...`;
}

function getToolDetail(part: unknown): string | undefined {
  const input = (part as { input?: Record<string, unknown> }).input;
  if (!input || typeof input !== 'object') return undefined;

  if (typeof input.query === 'string') {
    const hasLocation = typeof input.location === 'string' && input.location.length > 0;
    const queryMax = hasLocation ? 28 : 40;
    let detail = truncate(input.query, queryMax);
    if (hasLocation) detail += ` · ${truncate(input.location as string, 20)}`;
    return detail;
  }

  if (typeof input.file === 'string') return input.file;
  if (typeof input.url === 'string') return input.url;
  if (typeof input.filename === 'string') return input.filename;
  if (typeof input.path === 'string') return input.path;
  return undefined;
}

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
      flushActivity();
      currentText = currentText === null ? text : currentText + text;
    } else if (part.type === 'reasoning') {
      const text = (part as { text: string }).text;
      if (!text || text.trim() === '') continue;
      flushText();
      const entry: ReasoningEntry = { kind: 'reasoning', ...parseReasoningTitle(text) };
      currentActivity = currentActivity ? [...currentActivity, entry] : [entry];
    } else if (isToolPart(part)) {
      flushText();
      const entry: ToolEntry = {
        kind: 'tool',
        toolName: getToolName(part),
        status: getToolStatus(part),
        detail: getToolDetail(part)
      };
      currentActivity = currentActivity ? [...currentActivity, entry] : [entry];
    } else if (
      'type' in part &&
      typeof (part as { type: string }).type === 'string' &&
      (part as { type: string }).type.startsWith('data-') &&
      (part as { type: string }).type !== 'data-usage'
    ) {
      flushText();
      flushActivity();
      const typedPart = part as { type: string; id?: string; data: unknown };
      segments.push({
        type: 'data',
        partType: typedPart.type,
        partId: typedPart.id ?? '',
        data: typedPart.data
      });
    }
  }

  flushText();
  flushActivity();
  return segments;
}

