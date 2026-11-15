import { useState } from 'react';
import type { ReviewComment, ReviewCommentResolution } from '@rendercv/contracts';
import { Check, PenLine, Reply, RotateCcw, Trash2 } from 'lucide-react';
import { COMMENT_KIND_LABELS, RESOLUTION_LABELS, type CommentLocation } from './review-comments';

const KIND_TONES: Record<ReviewComment['kind'], string> = {
  comment: 'bg-muted text-foreground',
  suggestion: 'bg-primary/10 text-primary',
  confirm: 'bg-amber-500/15 text-amber-800 dark:text-amber-200',
  missing: 'bg-sky-500/15 text-sky-800 dark:text-sky-200',
  structure: 'bg-violet-500/15 text-violet-800 dark:text-violet-200',
  layout: 'bg-slate-500/15 text-slate-800 dark:text-slate-200'
};

const LOCATION_NOTES: Partial<Record<CommentLocation['status'], string>> = {
  moved: 'Moved since this comment was made',
  changed: 'Reworded since this comment was made',
  missing: 'No longer in the CV — shown as it was'
};

function formatWhen(timestamp: number) {
  return new Date(timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function Highlighted({ text, quote }: { text: string; quote?: string }) {
  const index = quote ? text.indexOf(quote) : -1;
  if (!quote || index < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-sm bg-amber-300/40 px-0.5 text-foreground dark:bg-amber-400/25">{quote}</mark>
      {text.slice(index + quote.length)}
    </>
  );
}

/**
 * One review comment: what it is about, the wording there now, the question
 * or suggestion, replies, and the actions the viewer may take on it.
 */
export function CommentCard({
  comment,
  id,
  location,
  onDelete,
  onEdit,
  onReopen,
  onReply,
  onResolve
}: {
  comment: ReviewComment;
  id?: string;
  location: CommentLocation;
  onDelete?: () => void;
  onEdit?: () => void;
  onReopen?: () => void;
  onReply?: (body: string) => void;
  onResolve?: (resolution: ReviewCommentResolution) => void;
}) {
  const [replying, setReplying] = useState(false);
  const [reply, setReply] = useState('');
  const [resolving, setResolving] = useState(false);
  const isOpen = comment.status === 'open';
  const action =
    'inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground';

  return (
    <article
      className={`rounded-2xl border px-4 py-3 ${isOpen ? 'border-border bg-card' : 'border-border/60 bg-muted/30'}`}
      data-comment-status={comment.status}
      data-testid="review-comment"
      id={id}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${KIND_TONES[comment.kind]}`}>
          {COMMENT_KIND_LABELS[comment.kind]}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
            isOpen
              ? 'bg-amber-500/15 text-amber-800 dark:text-amber-200'
              : 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
          }`}
        >
          {isOpen ? 'Open' : `Resolved${comment.resolution ? ` · ${RESOLUTION_LABELS[comment.resolution]}` : ''}`}
        </span>
        <span className="ml-auto text-[11px] text-muted-foreground">
          {comment.author || 'You'} · {formatWhen(comment.createdAt)}
        </span>
      </div>
      <p className="mt-2 text-xs font-medium text-foreground">{location.label}</p>
      {LOCATION_NOTES[location.status] ? (
        <p className="text-[11px] text-muted-foreground">{LOCATION_NOTES[location.status]}</p>
      ) : null}
      {location.currentText ? (
        <blockquote className="mt-2 line-clamp-4 border-l-2 border-border pl-3 text-xs leading-5 whitespace-pre-wrap text-muted-foreground">
          <Highlighted quote={comment.anchor.quote} text={location.currentText} />
        </blockquote>
      ) : comment.anchor.quote ? (
        <p className="mt-2 text-xs text-muted-foreground">About “{comment.anchor.quote}”</p>
      ) : null}
      <p className="mt-2 text-sm leading-5 whitespace-pre-wrap text-foreground">{comment.body}</p>
      {comment.suggestion ? (
        <div className="mt-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Suggested wording</p>
          <p className="mt-1 text-sm whitespace-pre-wrap text-foreground">{comment.suggestion}</p>
        </div>
      ) : null}
      {comment.replies.length > 0 ? (
        <ul className="mt-3 space-y-2 border-l-2 border-primary/20 pl-3">
          {comment.replies.map((entry) => (
            <li className="text-xs leading-5" key={entry.id}>
              <span className="font-medium text-foreground">{entry.author || 'Someone'}</span>{' '}
              <span className="text-muted-foreground">{formatWhen(entry.createdAt)}</span>
              <p className="whitespace-pre-wrap text-foreground">{entry.body}</p>
            </li>
          ))}
        </ul>
      ) : null}
      {replying && onReply ? (
        <div className="mt-3 space-y-2">
          <textarea
            autoFocus
            aria-label="Reply"
            className="min-h-16 w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            maxLength={4000}
            onChange={(event) => setReply(event.target.value)}
            placeholder="Answer, correct or add the detail asked for"
            value={reply}
          />
          <div className="flex justify-end gap-2">
            <button className={action} onClick={() => setReplying(false)} type="button">
              Cancel
            </button>
            <button
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
              disabled={!reply.trim()}
              onClick={() => {
                onReply(reply.trim());
                setReply('');
                setReplying(false);
              }}
              type="button"
            >
              Reply
            </button>
          </div>
        </div>
      ) : null}
      {resolving && onResolve ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2">
          <span className="text-xs text-muted-foreground">Resolve as</span>
          {(Object.keys(RESOLUTION_LABELS) as ReviewCommentResolution[]).map((resolution) => (
            <button
              className={action}
              key={resolution}
              onClick={() => {
                onResolve(resolution);
                setResolving(false);
              }}
              type="button"
            >
              {RESOLUTION_LABELS[resolution]}
            </button>
          ))}
          <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setResolving(false)} type="button">
            Cancel
          </button>
        </div>
      ) : null}
      {!replying && !resolving ? (
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          {onDelete ? (
            <button aria-label="Delete comment" className={`${action} mr-auto`} onClick={onDelete} type="button">
              <Trash2 className="size-3.5" />
            </button>
          ) : null}
          {onEdit && isOpen ? (
            <button className={action} onClick={onEdit} type="button">
              <PenLine className="size-3.5" />
              Edit
            </button>
          ) : null}
          {onReply ? (
            <button className={action} onClick={() => setReplying(true)} type="button">
              <Reply className="size-3.5" />
              Reply
            </button>
          ) : null}
          {isOpen && onResolve ? (
            <button className={action} onClick={() => setResolving(true)} type="button">
              <Check className="size-3.5" />
              Resolve
            </button>
          ) : null}
          {!isOpen && onReopen ? (
            <button className={action} onClick={onReopen} type="button">
              <RotateCcw className="size-3.5" />
              Reopen
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
