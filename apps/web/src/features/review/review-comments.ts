import type {
  CvFileSections,
  ReviewComment,
  ReviewCommentAnchor,
  ReviewCommentKind,
  ReviewCommentResolution
} from '@rendercv/contracts';
import { SECTION_LABELS } from '@rendercv/contracts';
import { dictionaryKeyToTitle } from '../form/utils';
import { describeReviewPath, getIn, parseSectionRoot, reviewWordSet, wordSetSimilarity } from './review-diff';

export const COMMENT_KIND_LABELS: Record<ReviewCommentKind, string> = {
  comment: 'Comment',
  suggestion: 'Wording suggestion',
  confirm: 'Fact to confirm',
  missing: 'Missing detail',
  structure: 'Structural suggestion',
  layout: 'Layout issue'
};

export const COMMENT_KIND_HINTS: Record<ReviewCommentKind, string> = {
  comment: 'An observation about this text.',
  suggestion: 'Proposed wording, kept beside the original until the author decides.',
  confirm: 'A question about whether this is accurate. It changes nothing in the CV.',
  missing: 'Ask for an example, number, date or other detail that would support this.',
  structure: 'Suggest moving, merging, splitting or removing this.',
  layout: 'Something about how this renders on the page.'
};

export const RESOLUTION_LABELS: Record<ReviewCommentResolution, string> = {
  confirmed: 'Confirmed',
  corrected: 'Corrected',
  not_applicable: 'Not applicable'
};

export type CommentLocationStatus =
  /** The text is where the comment was made. */
  | 'here'
  /** The same text now sits somewhere else (a bullet was moved, a section renamed). */
  | 'moved'
  /** The field is still there but its text was reworded. */
  | 'changed'
  /** Nothing in the CV matches any more. */
  | 'missing';

export interface CommentLocation {
  status: CommentLocationStatus;
  path: Array<string | number>;
  /** The field's text now (or the comment's saved text when it is missing). */
  currentText?: string;
  label: string;
}

function textOf(value: unknown) {
  return typeof value === 'string' ? value : typeof value === 'number' ? String(value) : undefined;
}

function* stringLeaves(value: unknown, path: Array<string | number> = []): Generator<[Array<string | number>, string]> {
  if (typeof value === 'string') {
    yield [path, value];
  } else if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) yield* stringLeaves(value[index], [...path, index]);
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) yield* stringLeaves(child, [...path, key]);
  }
}

/**
 * Find a comment's text in the CV as it is now, so a comment follows its
 * bullet when bullets are reordered, a section is renamed, or the text is
 * lightly reworded.
 */
export function locateComment(sections: CvFileSections, anchor: ReviewCommentAnchor): CommentLocation {
  const root = parseSectionRoot(anchor.section, sections[anchor.section]);
  const atPath = getIn(root, anchor.path);
  const atPathText = textOf(atPath);
  const label = (path: Array<string | number>) => describeReviewPath(anchor.section, path, root);
  const quote = anchor.quote?.trim();

  const unchangedHere =
    atPath !== undefined &&
    (atPathText === undefined || // a whole entry or list: it is still there
      !anchor.text ||
      atPathText === anchor.text ||
      (quote ? atPathText.includes(quote) : false));
  if (unchangedHere) {
    return { status: 'here', path: anchor.path, currentText: atPathText, label: label(anchor.path) };
  }

  if (anchor.text) {
    const savedWords = reviewWordSet(anchor.text);
    let best: { path: Array<string | number>; text: string; score: number } | undefined;
    for (const [path, text] of stringLeaves(root)) {
      const score =
        text === anchor.text ? 2 : quote && text.includes(quote) ? 1.5 : wordSetSimilarity(savedWords, reviewWordSet(text));
      if (!best || score > best.score) best = { path, text, score };
    }
    const hereScore = atPathText ? wordSetSimilarity(savedWords, reviewWordSet(atPathText)) : 0;
    if (best && best.score >= 0.6 && best.score > hereScore) {
      return { status: 'moved', path: best.path, currentText: best.text, label: label(best.path) };
    }
    if (atPathText !== undefined && hereScore >= 0.3) {
      return { status: 'changed', path: anchor.path, currentText: atPathText, label: label(anchor.path) };
    }
  }

  return {
    status: 'missing',
    path: anchor.path,
    currentText: anchor.text,
    label: anchor.label ?? label(anchor.path)
  };
}

/** Builds the anchor for a field (or one item of a list field) as it is now. */
export function createCommentAnchor(
  sections: CvFileSections,
  section: ReviewCommentAnchor['section'],
  path: Array<string | number>,
  quote?: string
): ReviewCommentAnchor {
  const root = parseSectionRoot(section, sections[section]);
  const text = textOf(getIn(root, path));
  const trimmedQuote = quote?.trim();
  return {
    section,
    path,
    ...(trimmedQuote ? { quote: trimmedQuote.slice(0, 500) } : {}),
    ...(text ? { text } : {}),
    label: describeReviewPath(section, path, root)
  };
}

/** Whether a comment's location falls inside (or contains) a change's path. */
export function commentTouchesPath(
  comment: ReviewComment,
  section: ReviewCommentAnchor['section'],
  path: Array<string | number>
) {
  if (comment.anchor.section !== section) return false;
  const anchorPath = comment.anchor.path;
  const shorter = Math.min(anchorPath.length, path.length);
  for (let index = 0; index < shorter; index += 1) {
    if (String(anchorPath[index]) !== String(path[index])) return false;
  }
  return true;
}

/** The heading a comment is filed under in the export: the CV section it is in. */
export function commentGroupTitle(anchor: ReviewCommentAnchor, path = anchor.path) {
  if (anchor.section !== 'cv') return SECTION_LABELS[anchor.section];
  if (path[0] === 'sections' && path[1] !== undefined) return dictionaryKeyToTitle(String(path[1]));
  return 'Personal details';
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
}

function blockquote(text: string) {
  return text
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n');
}

export interface CommentExportOptions {
  title: string;
  comments: ReviewComment[];
  /** The CV the comments are read against (the review copy, or the proposal). */
  sections: CvFileSections;
  /** Include resolved comments too. */
  includeResolved?: boolean;
  context?: string[];
}

/**
 * A readable Markdown list of review comments, grouped by CV section: where
 * each one points, the wording there now, the question, any suggested
 * wording, replies and status. Made to be sent to, or filled in by, the author.
 */
export function buildCommentsMarkdown({ title, comments, sections, includeResolved = false, context = [] }: CommentExportOptions) {
  const selected = comments.filter((comment) => includeResolved || comment.status === 'open');
  const lines: string[] = [`# ${title}`, ''];
  for (const line of context) lines.push(line);
  lines.push(
    `Exported ${formatDate(Date.now())}. ${selected.length} ${includeResolved ? '' : 'open '}comment${selected.length === 1 ? '' : 's'}` +
      (includeResolved ? '' : ` of ${comments.length}`) +
      '.',
    '',
    'Accepting a wording change does not answer the question attached to it: each comment stays open until someone answers or resolves it.',
    ''
  );

  if (selected.length === 0) {
    lines.push('_No open comments._', '');
    return lines.join('\n');
  }

  const located = selected.map((comment, index) => ({
    comment,
    number: `C${String(index + 1).padStart(2, '0')}`,
    location: locateComment(sections, comment.anchor)
  }));
  const groups = new Map<string, typeof located>();
  for (const entry of located) {
    const group = commentGroupTitle(entry.comment.anchor, entry.location.path);
    groups.set(group, [...(groups.get(group) ?? []), entry]);
  }

  for (const [group, entries] of groups) {
    lines.push(`## ${group}`, '');
    for (const { comment, number, location } of entries) {
      lines.push(`### ${number} · ${COMMENT_KIND_LABELS[comment.kind]} — ${location.label}`, '');
      const status =
        comment.status === 'open'
          ? 'Open'
          : `Resolved${comment.resolution ? ` (${RESOLUTION_LABELS[comment.resolution].toLowerCase()})` : ''}`;
      lines.push(`- Status: ${status}`);
      lines.push(`- From: ${comment.author || 'Reviewer'}, ${formatDate(comment.createdAt)}`);
      if (location.status === 'moved') lines.push('- The text has moved since the comment was made; shown where it is now.');
      if (location.status === 'changed') lines.push('- The text has been reworded since the comment was made.');
      if (location.status === 'missing') lines.push('- The text this comment was on is no longer in the CV; shown as it was.');
      lines.push('');
      if (location.currentText) {
        lines.push(location.status === 'missing' ? '**Wording when commented**' : '**Current wording**', '', blockquote(location.currentText), '');
      }
      if (comment.anchor.quote && comment.anchor.quote !== location.currentText) {
        lines.push(`**About:** “${comment.anchor.quote}”`, '');
      }
      lines.push(comment.kind === 'confirm' || comment.kind === 'missing' ? '**Question**' : '**Comment**', '', comment.body.trim(), '');
      if (comment.suggestion?.trim()) {
        lines.push('**Suggested wording**', '', blockquote(comment.suggestion.trim()), '');
      }
      if (comment.replies.length > 0) {
        lines.push('**Replies**', '');
        for (const reply of comment.replies) {
          lines.push(`- ${reply.author || 'Someone'} (${formatDate(reply.createdAt)}): ${reply.body.trim().replace(/\n+/g, ' ')}`);
        }
        lines.push('');
      }
      if (comment.status === 'open') {
        lines.push('**Answer:** ', '');
      }
    }
  }

  return lines.join('\n');
}
