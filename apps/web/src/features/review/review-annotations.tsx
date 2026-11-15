import * as Dialog from '@radix-ui/react-dialog';
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { FocusEvent, MouseEvent as ReactMouseEvent, ReactNode, SyntheticEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  CircleHelp,
  Copy,
  Download,
  GitCompareArrows,
  LayoutTemplate,
  ListPlus,
  MessageSquare,
  MessageSquarePlus,
  MoveRight,
  PenLine
} from 'lucide-react';
import { toast } from 'sonner';
import type { CvFileSections, ReviewComment, ReviewCommentKind, SectionKey } from '@rendercv/contracts';
import { preferencesStore, reviewStore, type ReviewSession, sessionRole } from '@rendercv/core';
import { DialogOverlay, DialogShell } from '../../ui/dialog-shell';
import { useStore } from '../../lib/use-store';
import { useFieldScope } from '../form/diff-context';
import { downloadBlob } from '../viewer/download';
import { getIn, parseSectionRoot } from './review-diff';
import {
  buildCommentsMarkdown,
  COMMENT_KIND_HINTS,
  COMMENT_KIND_LABELS,
  createCommentAnchor,
  locateComment,
  type CommentLocation
} from './review-comments';
import { CommentCard } from './comment-card';
import { diffWords } from './word-diff';

type Path = Array<string | number>;

interface ComposerInit {
  section: SectionKey;
  path: Path;
  quote?: string;
  kind?: ReviewCommentKind;
  suggestion?: string;
  editing?: ReviewComment;
}

interface ReviewAnnotationsValue {
  enabled: boolean;
  /** Comments located at `path` or inside it. */
  countAt: (section: SectionKey, path: Path) => { open: number; total: number };
  /** Comments on one item of a delimited list ("PHP" in "PHP; WordPress"). */
  countQuoted: (section: SectionKey, path: Path, quote: string) => { open: number; total: number };
  openComposer: (init: ComposerInit) => void;
  openCompare: (section: SectionKey, path: Path) => void;
  openPanel: (focus?: { section: SectionKey; path: Path }) => void;
}

const NONE = { open: 0, total: 0 };

const ReviewAnnotationsContext = createContext<ReviewAnnotationsValue>({
  enabled: false,
  countAt: () => NONE,
  countQuoted: () => NONE,
  openComposer: () => undefined,
  openCompare: () => undefined,
  openPanel: () => undefined
});

export function useReviewAnnotations() {
  return useContext(ReviewAnnotationsContext);
}

export const OPEN_REVIEW_COMMENTS_EVENT = 'rendercv:open-review-comments';

function pathKey(section: SectionKey, path: Path) {
  return `${section}|${path.map(String).join('/')}`;
}

function startsWith(path: Path, prefix: Path) {
  return prefix.every((segment, index) => String(path[index]) === String(segment));
}

export function downloadCommentsMarkdown(markdown: string, fileName: string) {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  return downloadBlob(blob, `${fileName.replace(/[\\/:*?"<>|]+/g, '-')} - review comments.md`);
}

/**
 * Comments on a review copy: lets the reviewer attach questions and
 * suggestions to individual fields, bullets and phrases while editing. Only
 * active on a reviewer's copy; everywhere else the form behaves as before.
 */
export function ReviewAnnotationsProvider({
  children,
  fileName,
  sections,
  session
}: {
  children: ReactNode;
  fileName?: string;
  sections?: CvFileSections;
  session?: ReviewSession;
}) {
  const enabled = Boolean(session && sections && sessionRole(session) === 'reviewer');
  const comments = useMemo(() => session?.comments ?? [], [session?.comments]);
  const [composer, setComposer] = useState<ComposerInit | null>(null);
  const [compare, setCompare] = useState<{ section: SectionKey; path: Path } | null>(null);
  const [panel, setPanel] = useState<{ open: boolean; focus?: { section: SectionKey; path: Path } }>({ open: false });

  const located = useMemo(
    () =>
      sections
        ? comments.map((comment) => ({ comment, location: locateComment(sections, comment.anchor) }))
        : [],
    [comments, sections]
  );

  const countAt = useCallback(
    (section: SectionKey, path: Path) => {
      let open = 0;
      let total = 0;
      for (const { comment, location } of located) {
        if (comment.anchor.section !== section || location.status === 'missing') continue;
        if (!startsWith(location.path, path)) continue;
        total += 1;
        if (comment.status === 'open') open += 1;
      }
      return { open, total };
    },
    [located]
  );

  const countQuoted = useCallback(
    (section: SectionKey, path: Path, quote: string) => {
      let open = 0;
      let total = 0;
      const key = pathKey(section, path);
      const wanted = quote.trim().toLowerCase();
      for (const { comment, location } of located) {
        if (pathKey(comment.anchor.section, location.path) !== key) continue;
        if (comment.anchor.quote?.trim().toLowerCase() !== wanted) continue;
        total += 1;
        if (comment.status === 'open') open += 1;
      }
      return { open, total };
    },
    [located]
  );

  useEffect(() => {
    if (!enabled) return;
    const open = () => setPanel({ open: true });
    window.addEventListener(OPEN_REVIEW_COMMENTS_EVENT, open);
    return () => window.removeEventListener(OPEN_REVIEW_COMMENTS_EVENT, open);
  }, [enabled]);

  const value = useMemo<ReviewAnnotationsValue>(
    () => ({
      enabled,
      countAt,
      countQuoted,
      openComposer: (init) => setComposer(init),
      openCompare: (section, path) => setCompare({ section, path }),
      openPanel: (focus) => setPanel({ open: true, focus })
    }),
    [countAt, countQuoted, enabled]
  );

  return (
    <ReviewAnnotationsContext.Provider value={value}>
      {children}
      {enabled && session && sections ? (
        <>
          <CommentComposerDialog
            init={composer}
            onClose={() => setComposer(null)}
            sections={sections}
            sessionId={session.sessionId}
          />
          <CompareDialog
            baseline={session.rootBaselineSections}
            current={sections}
            onClose={() => setCompare(null)}
            target={compare}
          />
          <CommentsPanelDialog
            fileName={fileName ?? session.baseFileName}
            focus={panel.focus}
            located={located}
            onEdit={(comment) => {
              setComposer({
                section: comment.anchor.section,
                path: comment.anchor.path,
                quote: comment.anchor.quote,
                editing: comment
              });
            }}
            onOpenChange={(open) => setPanel((current) => ({ open, focus: open ? current.focus : undefined }))}
            open={panel.open}
            sections={sections}
            session={session}
          />
        </>
      ) : null}
    </ReviewAnnotationsContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Attaching comments to fields
// ---------------------------------------------------------------------------

interface ReviewListContextValue {
  section: SectionKey;
  /** Absolute path of the list field. */
  path: Path;
  mode: 'list' | 'delimited';
}

const ReviewListContext = createContext<ReviewListContextValue | null>(null);

type MenuState = { x: number; y: number; path: Path; quote?: string; itemText?: string };
type ToolbarState = { rect: DOMRect; path: Path; quote: string };

function readSelection(target: EventTarget | null) {
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? 0;
    return end > start ? target.value.slice(start, end) : '';
  }
  return window.getSelection()?.toString() ?? '';
}

function itemOf(target: EventTarget | null, container: HTMLElement) {
  const element = target instanceof Element ? target.closest<HTMLElement>('[data-review-item-index]') : null;
  if (!element || !container.contains(element)) return undefined;
  const index = Number(element.dataset.reviewItemIndex);
  const input = element.querySelector<HTMLTextAreaElement | HTMLInputElement>('textarea, input');
  return Number.isFinite(index) ? { index, text: input?.value ?? '' } : undefined;
}

/**
 * Wraps a form field so a reviewer can comment on it: right-click (or the
 * keyboard context-menu key) for the comment menu, select words for the
 * comment toolbar, or use the marker button. Shift + right-click keeps the
 * browser's own menu. Renders its children untouched outside a review copy.
 */
export function CommentTarget({
  children,
  mode = 'field',
  path = []
}: {
  children: ReactNode;
  /** `list`: each item is its own path. `delimited`: items share the field's path and are told apart by their text. */
  mode?: 'field' | 'list' | 'delimited';
  /** Relative to the enclosing field scope. */
  path?: Path;
}) {
  const annotations = useReviewAnnotations();
  const scope = useFieldScope();
  const containerRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [toolbar, setToolbar] = useState<ToolbarState | null>(null);
  const absolutePath = useMemo(() => [...scope.path, ...path], [scope.path, path]);
  const listValue = useMemo(
    () => (scope.section && mode !== 'field' ? { section: scope.section, path: absolutePath, mode } : null),
    [absolutePath, mode, scope.section]
  );

  if (!annotations.enabled || !scope.section) {
    return <>{children}</>;
  }
  const section = scope.section;

  function targetFor(event: SyntheticEvent) {
    const item = containerRef.current ? itemOf(event.target, containerRef.current) : undefined;
    const quote = readSelection(event.target).trim();
    if (mode === 'list' && item) {
      return { path: [...absolutePath, item.index], quote, itemText: item.text };
    }
    if (mode === 'delimited' && item) {
      return { path: absolutePath, quote: quote || item.text.trim(), itemText: item.text };
    }
    return { path: absolutePath, quote };
  }

  function handleContextMenu(event: ReactMouseEvent<HTMLDivElement>) {
    if (event.shiftKey) return;
    event.preventDefault();
    event.stopPropagation();
    const target = targetFor(event);
    let { clientX: x, clientY: y } = event;
    if (x === 0 && y === 0 && event.target instanceof Element) {
      // Opened from the keyboard: place it under the focused field.
      const rect = event.target.getBoundingClientRect();
      x = rect.left + 12;
      y = rect.bottom;
    }
    setToolbar(null);
    setMenu({ x, y, ...target });
  }

  function handleSelect(event: SyntheticEvent<HTMLDivElement>) {
    const element = event.target;
    if (!(element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement)) return;
    const quote = readSelection(element).trim();
    if (!quote) {
      setToolbar(null);
      return;
    }
    const target = targetFor(event);
    setToolbar({ rect: element.getBoundingClientRect(), path: target.path, quote });
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
    window.setTimeout(() => setToolbar(null), 120);
  }

  const counts = mode === 'field' ? annotations.countAt(section, absolutePath) : NONE;

  return (
    <ReviewListContext.Provider value={listValue}>
      <div
        className="group/review-target relative"
        data-review-path={absolutePath.join('.')}
        onBlur={handleBlur}
        onContextMenu={handleContextMenu}
        onSelect={handleSelect}
        ref={containerRef}
      >
        {children}
        {mode === 'field' ? (
          <CommentMarker
            className="absolute top-1/2 right-0 -translate-y-1/2"
            counts={counts}
            label="this field"
            onAdd={() => annotations.openComposer({ section, path: absolutePath })}
            onShow={() => annotations.openPanel({ section, path: absolutePath })}
          />
        ) : null}
      </div>
      {menu ? (
        <CommentContextMenu
          onClose={() => setMenu(null)}
          onPick={(kind) => {
            setMenu(null);
            annotations.openComposer({
              section,
              path: menu.path,
              quote: menu.quote || undefined,
              kind,
              suggestion: kind === 'suggestion' ? menu.quote || menu.itemText : undefined
            });
          }}
          onCompare={() => {
            setMenu(null);
            annotations.openCompare(section, menu.path);
          }}
          onShowComments={() => {
            setMenu(null);
            annotations.openPanel({ section, path: menu.path });
          }}
          quote={menu.quote}
          x={menu.x}
          y={menu.y}
        />
      ) : null}
      {toolbar && !menu ? (
        <SelectionToolbar
          onPick={(kind) => {
            setToolbar(null);
            annotations.openComposer({
              section,
              path: toolbar.path,
              quote: toolbar.quote,
              kind,
              suggestion: kind === 'suggestion' ? toolbar.quote : undefined
            });
          }}
          rect={toolbar.rect}
        />
      ) : null}
    </ReviewListContext.Provider>
  );
}

/**
 * Comment marker for one item of a list field, rendered by the list row.
 * Returns null outside a review copy.
 */
export function ReviewItemMarker({ index, text }: { index: number; text: string }) {
  const annotations = useReviewAnnotations();
  const list = useContext(ReviewListContext);
  if (!annotations.enabled || !list) return null;
  const path = list.mode === 'list' ? [...list.path, index] : list.path;
  const counts =
    list.mode === 'list' ? annotations.countAt(list.section, path) : annotations.countQuoted(list.section, path, text);
  return (
    <CommentMarker
      className="absolute top-0 right-9 sm:top-1/2 sm:right-9 sm:-translate-y-1/2"
      counts={counts}
      label={`item ${index + 1}`}
      onAdd={() =>
        annotations.openComposer({
          section: list.section,
          path,
          quote: list.mode === 'delimited' ? text.trim() || undefined : undefined
        })
      }
      onShow={() => annotations.openPanel({ section: list.section, path })}
    />
  );
}

/** Whether list rows should leave room for a comment marker. */
export function useReviewMarkersEnabled() {
  const annotations = useReviewAnnotations();
  const list = useContext(ReviewListContext);
  return annotations.enabled && Boolean(list);
}

function CommentMarker({
  className,
  counts,
  label,
  onAdd,
  onShow
}: {
  className: string;
  counts: { open: number; total: number };
  label: string;
  onAdd: () => void;
  onShow: () => void;
}) {
  if (counts.total > 0) {
    return (
      <button
        aria-label={`${counts.total} comment${counts.total === 1 ? '' : 's'} on ${label}${counts.open ? `, ${counts.open} open` : ''}`}
        className={`${className} z-[1] inline-flex h-6 items-center gap-1 rounded-full px-1.5 text-[10px] font-semibold ${
          counts.open
            ? 'bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:text-amber-300'
            : 'bg-muted text-muted-foreground hover:bg-accent'
        }`}
        onClick={onShow}
        title="Show comments"
        type="button"
      >
        <MessageSquare className="size-3" />
        {counts.total}
      </button>
    );
  }
  return (
    <button
      aria-label={`Comment on ${label}`}
      className={`${className} z-[1] inline-flex size-6 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-focus-within/review-target:opacity-100 group-hover/review-target:opacity-100 [@media(hover:none)]:opacity-60`}
      onClick={onAdd}
      title="Add a comment (or right-click the text)"
      type="button"
    >
      <MessageSquarePlus className="size-3.5" />
    </button>
  );
}

const MENU_ITEMS: Array<{ kind: ReviewCommentKind; label: string; icon: ReactNode }> = [
  { kind: 'comment', label: 'Add comment', icon: <MessageSquarePlus className="size-4" /> },
  { kind: 'suggestion', label: 'Suggest replacement…', icon: <PenLine className="size-4" /> },
  { kind: 'confirm', label: 'Ask author to confirm…', icon: <CircleHelp className="size-4" /> },
  { kind: 'missing', label: 'Request an example, number or date…', icon: <ListPlus className="size-4" /> },
  { kind: 'structure', label: 'Suggest moving or restructuring…', icon: <MoveRight className="size-4" /> },
  { kind: 'layout', label: 'Flag a layout issue…', icon: <LayoutTemplate className="size-4" /> }
];

function useMenuPosition(x: number, y: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: x, top: y });
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const { width, height } = element.getBoundingClientRect();
    setPosition({
      left: Math.max(8, Math.min(x, window.innerWidth - width - 8)),
      top: Math.max(8, y + height > window.innerHeight - 8 ? y - height : y)
    });
  }, [x, y]);
  return { ref, position };
}

function CommentContextMenu({
  onClose,
  onCompare,
  onPick,
  onShowComments,
  quote,
  x,
  y
}: {
  onClose: () => void;
  onCompare: () => void;
  onPick: (kind: ReviewCommentKind) => void;
  onShowComments: () => void;
  quote?: string;
  x: number;
  y: number;
}) {
  const { ref, position } = useMenuPosition(x, y);

  useEffect(() => {
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') return;
      if (event.target instanceof Node && ref.current?.contains(event.target)) return;
      onClose();
    };
    document.addEventListener('pointerdown', close, true);
    document.addEventListener('keydown', close);
    window.addEventListener('resize', onClose);
    window.addEventListener('scroll', onClose, true);
    ref.current?.querySelector<HTMLButtonElement>('button')?.focus();
    return () => {
      document.removeEventListener('pointerdown', close, true);
      document.removeEventListener('keydown', close);
      window.removeEventListener('resize', onClose);
      window.removeEventListener('scroll', onClose, true);
    };
  }, [onClose, ref]);

  const item =
    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:outline-none';

  return createPortal(
    <div
      aria-label="Review actions"
      className="fixed z-[60] min-w-64 max-w-80 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg"
      data-testid="review-context-menu"
      onKeyDown={(event) => {
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        event.preventDefault();
        const buttons = [...(ref.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])];
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        const next = buttons[(index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length];
        next?.focus();
      }}
      ref={ref}
      role="menu"
      style={{ left: position.left, top: position.top }}
    >
      {quote ? (
        <p className="truncate px-3 pt-1.5 pb-1 text-[11px] text-muted-foreground">On “{quote}”</p>
      ) : null}
      {MENU_ITEMS.map((entry) => (
        <button className={item} key={entry.kind} onClick={() => onPick(entry.kind)} role="menuitem" type="button">
          {entry.icon}
          {entry.label}
        </button>
      ))}
      <div className="my-1 h-px bg-border" />
      <button className={item} onClick={onCompare} role="menuitem" type="button">
        <GitCompareArrows className="size-4" />
        Compare with original
      </button>
      <button className={item} onClick={onShowComments} role="menuitem" type="button">
        <MessageSquare className="size-4" />
        Show comments here
      </button>
      {quote ? (
        <button
          className={item}
          onClick={() => {
            void navigator.clipboard.writeText(quote).then(() => toast.success('Copied.'));
            onClose();
          }}
          role="menuitem"
          type="button"
        >
          <Copy className="size-4" />
          Copy
        </button>
      ) : null}
      <p className="px-3 pt-1 pb-1.5 text-[11px] text-muted-foreground">Shift + right-click for the browser menu</p>
    </div>,
    document.body
  );
}

function SelectionToolbar({ onPick, rect }: { onPick: (kind: ReviewCommentKind) => void; rect: DOMRect }) {
  const top = rect.top > 56 ? rect.top - 44 : rect.bottom + 8;
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - 340));
  const button =
    'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground';
  return createPortal(
    <div
      aria-label="Comment on selected text"
      className="fixed z-[60] flex items-center gap-0.5 rounded-xl border border-border bg-popover p-1 shadow-lg"
      data-testid="review-selection-toolbar"
      // Keep the text selected while a button is pressed.
      onMouseDown={(event) => event.preventDefault()}
      role="toolbar"
      style={{ left, top }}
    >
      <button className={button} onClick={() => onPick('comment')} type="button">
        <MessageSquarePlus className="size-3.5" />
        Comment
      </button>
      <button className={button} onClick={() => onPick('confirm')} type="button">
        <CircleHelp className="size-3.5" />
        Confirm?
      </button>
      <button className={button} onClick={() => onPick('missing')} type="button">
        <ListPlus className="size-3.5" />
        Ask for detail
      </button>
      <button className={button} onClick={() => onPick('suggestion')} type="button">
        <PenLine className="size-3.5" />
        Suggest
      </button>
    </div>,
    document.body
  );
}

// ---------------------------------------------------------------------------
// Dialogs
// ---------------------------------------------------------------------------

const KIND_ORDER: ReviewCommentKind[] = ['comment', 'suggestion', 'confirm', 'missing', 'structure', 'layout'];

const BODY_PLACEHOLDERS: Record<ReviewCommentKind, string> = {
  comment: 'What should the author know about this?',
  suggestion: 'Why this wording? (optional)',
  confirm: 'What needs confirming? e.g. “Do API consumers have to authenticate?”',
  missing: 'What detail would support this? e.g. “Which records, and roughly how many?”',
  structure: 'e.g. “Move PHP into Languages.”',
  layout: 'e.g. “Languages is the only content on page three.”'
};

function currentTextAt(sections: CvFileSections, section: SectionKey, path: Path) {
  const value = getIn(parseSectionRoot(section, sections[section]), path);
  return typeof value === 'string' ? value : undefined;
}

function CommentComposerDialog({
  init,
  onClose,
  sections,
  sessionId
}: {
  init: ComposerInit | null;
  onClose: () => void;
  sections: CvFileSections;
  sessionId: string;
}) {
  const preferences = useStore(preferencesStore);
  const [kind, setKind] = useState<ReviewCommentKind>('comment');
  const [body, setBody] = useState('');
  const [suggestion, setSuggestion] = useState('');

  useEffect(() => {
    if (!init) return;
    setKind(init.editing?.kind ?? init.kind ?? 'comment');
    setBody(init.editing?.body ?? '');
    setSuggestion(init.editing?.suggestion ?? init.suggestion ?? '');
  }, [init]);

  const anchor = useMemo(
    () => (init ? createCommentAnchor(sections, init.section, init.path, init.quote) : undefined),
    [init, sections]
  );
  const showSuggestion = kind === 'suggestion' || suggestion.trim().length > 0;
  const canSave = kind === 'suggestion' ? suggestion.trim().length > 0 : body.trim().length > 0;

  function save() {
    if (!init || !anchor || !canSave) return;
    const trimmedSuggestion = suggestion.trim();
    if (init.editing) {
      reviewStore.updateComment({ sessionId }, init.editing.id, {
        kind,
        body: body.trim() || 'Suggested wording',
        suggestion: trimmedSuggestion || undefined
      });
    } else {
      reviewStore.addComment(
        { sessionId },
        {
          kind,
          anchor,
          body: body.trim() || 'Suggested wording',
          ...(trimmedSuggestion ? { suggestion: trimmedSuggestion } : {}),
          author: preferences.reviewDisplayName ?? ''
        }
      );
      toast.success(`${COMMENT_KIND_LABELS[kind]} added.`, {
        description: 'It goes to the author with your next proposal.'
      });
    }
    onClose();
  }

  const currentText = init ? currentTextAt(sections, init.section, init.path) : undefined;

  return (
    <Dialog.Root open={Boolean(init)} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <Dialog.Portal>
        <DialogOverlay />
        <DialogShell
          bodyClassName="space-y-4"
          closeLabel="Close comment"
          description={anchor?.label}
          footer={
            <>
              <button
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={onClose}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-40"
                data-testid="save-review-comment"
                disabled={!canSave}
                onClick={save}
                type="button"
              >
                {init?.editing ? 'Save comment' : 'Add comment'}
              </button>
            </>
          }
          title={init?.editing ? 'Edit comment' : 'Add comment'}
        >
          {currentText || anchor?.quote ? (
            <div className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs leading-5 text-muted-foreground">
              {anchor?.quote && anchor.quote !== currentText ? (
                <p>
                  About <span className="font-medium text-foreground">“{anchor.quote}”</span>
                  {currentText ? ' in:' : ''}
                </p>
              ) : null}
              {currentText ? <p className="mt-0.5 line-clamp-4 whitespace-pre-wrap text-foreground">{currentText}</p> : null}
            </div>
          ) : null}
          <fieldset>
            <legend className="text-sm font-medium text-foreground">Type</legend>
            <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup">
              {KIND_ORDER.map((option) => (
                <button
                  aria-checked={kind === option}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    kind === option
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                  key={option}
                  onClick={() => setKind(option)}
                  role="radio"
                  type="button"
                >
                  {COMMENT_KIND_LABELS[option]}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{COMMENT_KIND_HINTS[kind]}</p>
          </fieldset>
          {showSuggestion ? (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">Suggested wording</span>
              <textarea
                className="min-h-20 w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                maxLength={4000}
                onChange={(event) => setSuggestion(event.target.value)}
                value={suggestion}
              />
            </label>
          ) : null}
          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">
              {kind === 'confirm' || kind === 'missing' ? 'Question' : 'Comment'}
              {kind === 'suggestion' ? <span className="font-normal text-muted-foreground"> (optional)</span> : null}
            </span>
            <textarea
              autoFocus={kind !== 'suggestion'}
              className="min-h-24 w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
              data-testid="review-comment-body"
              maxLength={4000}
              onChange={(event) => setBody(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) save();
              }}
              placeholder={BODY_PLACEHOLDERS[kind]}
              value={body}
            />
          </label>
        </DialogShell>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function CompareDialog({
  baseline,
  current,
  onClose,
  target
}: {
  baseline: CvFileSections;
  current: CvFileSections;
  onClose: () => void;
  target: { section: SectionKey; path: Path } | null;
}) {
  const original = target ? currentTextAt(baseline, target.section, target.path) : undefined;
  const now = target ? currentTextAt(current, target.section, target.path) : undefined;
  const tokens = original !== undefined && now !== undefined ? diffWords(original, now) : null;
  const label = target ? createCommentAnchor(current, target.section, target.path).label : '';

  return (
    <Dialog.Root open={Boolean(target)} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <Dialog.Portal>
        <DialogOverlay />
        <DialogShell bodyClassName="space-y-3" closeLabel="Close comparison" description={label} title="Compare with original" width="md">
          {original === undefined ? (
            <p className="text-sm text-muted-foreground">This was not in the original CV you were sent.</p>
          ) : original === now ? (
            <p className="text-sm text-muted-foreground">Unchanged from the original.</p>
          ) : null}
          {original !== undefined ? (
            <div className="rounded-xl border border-border px-3 py-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Original</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                {tokens
                  ? tokens
                      .filter((token) => token.type !== 'added')
                      .map((token, index) =>
                        token.type === 'removed' ? (
                          <mark className="rounded-sm bg-rose-500/15 px-0.5 text-rose-700 dark:text-rose-200" key={index}>
                            {token.text}
                          </mark>
                        ) : (
                          <span key={index}>{token.text}</span>
                        )
                      )
                  : original}
              </p>
            </div>
          ) : null}
          {now !== undefined && original !== now ? (
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Now</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                {tokens
                  ? tokens
                      .filter((token) => token.type !== 'removed')
                      .map((token, index) =>
                        token.type === 'added' ? (
                          <mark className="rounded-sm bg-emerald-500/15 px-0.5 text-emerald-700 dark:text-emerald-200" key={index}>
                            {token.text}
                          </mark>
                        ) : (
                          <span key={index}>{token.text}</span>
                        )
                      )
                  : now}
              </p>
            </div>
          ) : null}
        </DialogShell>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function CommentsPanelDialog({
  fileName,
  focus,
  located,
  onEdit,
  onOpenChange,
  open,
  sections,
  session
}: {
  fileName: string;
  focus?: { section: SectionKey; path: Path };
  located: Array<{ comment: ReviewComment; location: CommentLocation }>;
  onEdit: (comment: ReviewComment) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  sections: CvFileSections;
  session: ReviewSession;
}) {
  const [filter, setFilter] = useState<'open' | 'resolved' | 'all'>('open');
  const preferences = useStore(preferencesStore);
  const target = { sessionId: session.sessionId };
  const focused = focus
    ? located.filter(
        ({ comment, location }) => comment.anchor.section === focus.section && startsWith(location.path, focus.path)
      )
    : located;
  const visible = focused.filter(({ comment }) =>
    filter === 'all' ? true : filter === 'open' ? comment.status === 'open' : comment.status === 'resolved'
  );
  const openCount = located.filter(({ comment }) => comment.status === 'open').length;

  async function exportOpen() {
    const markdown = buildCommentsMarkdown({
      title: `${session.baseFileName} — review comments`,
      comments: located.map(({ comment }) => comment),
      sections,
      context: [`Review copy: ${fileName}`, `Reviewer: ${preferences.reviewDisplayName || 'not named yet'}`, '']
    });
    await downloadCommentsMarkdown(markdown, session.baseFileName);
    toast.success('Open comments downloaded.');
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <DialogOverlay />
        <DialogShell
          bodyClassName="space-y-3"
          closeLabel="Close comments"
          description={
            focus
              ? `Comments on ${createCommentAnchor(sections, focus.section, focus.path).label}.`
              : 'Questions and suggestions for the author. They go with your next proposal and stay open until the author answers them.'
          }
          footer={
            <>
              {focus ? (
                <button
                  className="mr-auto rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  onClick={() => onOpenChange(false)}
                  type="button"
                >
                  Close
                </button>
              ) : null}
              <button
                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40"
                disabled={openCount === 0}
                onClick={() => void exportOpen()}
                type="button"
              >
                <Download className="size-4" />
                Export open comments
              </button>
            </>
          }
          subheader={
            <div className="flex items-center gap-1 border-b border-border px-6 py-2" role="tablist">
              {(['open', 'resolved', 'all'] as const).map((option) => (
                <button
                  aria-selected={filter === option}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                    filter === option ? 'bg-foreground text-background' : 'text-foreground hover:bg-accent'
                  }`}
                  key={option}
                  onClick={() => setFilter(option)}
                  role="tab"
                  type="button"
                >
                  {option === 'open' ? `Open (${openCount})` : option === 'resolved' ? 'Resolved' : 'All'}
                </button>
              ))}
            </div>
          }
          title={focus ? 'Comments here' : `Review comments (${located.length})`}
          width="lg"
        >
          {visible.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
              {located.length === 0
                ? 'No comments yet. Right-click any field or bullet, or select some words, to attach a question or suggestion.'
                : 'Nothing here with this filter.'}
            </p>
          ) : (
            visible.map(({ comment, location }) => (
              <CommentCard
                comment={comment}
                key={comment.id}
                location={location}
                onDelete={() => {
                  if (window.confirm('Delete this comment?')) reviewStore.removeComment(target, comment.id);
                }}
                onEdit={() => onEdit(comment)}
                onReopen={() => reviewStore.updateComment(target, comment.id, { status: 'open' })}
                onResolve={(resolution) =>
                  reviewStore.updateComment(target, comment.id, { status: 'resolved', resolution })
                }
              />
            ))
          )}
        </DialogShell>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
