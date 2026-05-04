import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Archive,
  Copy,
  EllipsisVertical,
  FilePlus2,
  FileText,
  GitCompareArrows,
  HelpCircle,
  Link as LinkIcon,
  Lock,
  Monitor,
  Pencil,
  Shield,
  Trash2
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import type { CvFile } from '@rendercv/contracts';
import { fileStore, reviewStore } from '@rendercv/core';
import { ENABLE_PDF_IMPORT } from '../lib/feature-flags';
import { useStore } from '../lib/use-store';
import { onboardingTour } from '../features/onboarding/tour-state';
import { PdfImportButton } from './pdf-import-button';
import { YamlImportButton } from './yaml-import-button';
import type { PreparedYamlImport } from './yaml-import-button';
import type { RenderError } from '../features/viewer/use-viewer-renderer';

type SidebarMode = 'full' | 'compact' | 'mini';

export const SIDEBAR_COMPACT_WIDTH = 300;
export const SIDEBAR_MINI_WIDTH = 220;

export function Sidebar({
  prepareYamlImport,
  validateYamlImport
}: {
  prepareYamlImport?: (sections: {
    cv?: string;
    design?: string;
    locale?: string;
    settings?: string;
    selectedTheme?: string;
    selectedLocale?: string;
  }) => Promise<PreparedYamlImport>;
  validateYamlImport?: (sections: {
    cv?: string;
    design?: string;
    locale?: string;
    settings?: string;
    selectedTheme?: string;
    selectedLocale?: string;
  }) => Promise<RenderError[]>;
}) {
  const asideRef = useRef<HTMLElement>(null);
  const snapshot = useStore(fileStore);
  const reviewSnapshot = useStore(reviewStore);
  const location = useLocation();
  const [mode, setMode] = useState<SidebarMode>('full');
  const activeFiles = useMemo(
    () =>
      snapshot.files
        .filter((file) => !file.isArchived && !file.isTrashed)
        .sort((left, right) => right.lastEdited - left.lastEdited),
    [snapshot.files]
  );
  const isCompact = mode !== 'full';
  const isMini = mode === 'mini';
  const reviewSessions = useMemo(
    () =>
      reviewSnapshot.sessions
        .filter((session) => session.status !== 'resolved')
        .sort((left, right) => {
          const leftProposalTime = left.proposals[0]?.createdAt ?? 0;
          const rightProposalTime = right.proposals[0]?.createdAt ?? 0;
          return rightProposalTime - leftProposalTime;
        }),
    [reviewSnapshot.sessions]
  );
  const archivedReviewSessions = useMemo(
    () => reviewSnapshot.sessions.filter((session) => session.status === 'resolved'),
    [reviewSnapshot.sessions]
  );

  useEffect(() => {
    const element = asideRef.current;
    if (!element || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const updateMode = (width: number) => {
      const nextMode: SidebarMode =
        width < SIDEBAR_MINI_WIDTH ? 'mini' : width < SIDEBAR_COMPACT_WIDTH ? 'compact' : 'full';
      setMode((current) => (current === nextMode ? current : nextMode));
    };

    updateMode(element.getBoundingClientRect().width);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      updateMode(entry.contentRect.width);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <aside
      ref={asideRef}
      className="flex h-full min-w-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
      data-sidebar-mode={mode}
    >
      <SidebarBrand compact={isCompact} mini={isMini} />
      <div
        className={`space-y-2 border-b border-sidebar-border px-2 pb-3 ${isMini ? 'pt-0' : 'pt-1'}`}
        data-onboarding="create-import"
      >
        <button
          className={`inline-flex w-full items-center rounded-md text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
            isMini ? 'h-10 justify-center px-0' : 'h-10 justify-start gap-2 px-3'
          }`}
          onClick={() => fileStore.createFile()}
          title="Create new CV"
          type="button"
        >
          <FilePlus2 className="size-4 shrink-0" />
          {isMini ? <span className="sr-only">Create new CV</span> : <span>Create new CV</span>}
        </button>
        <YamlImportButton
          mode={mode}
          prepareYamlImport={prepareYamlImport}
          validateYamlImport={validateYamlImport}
        />
        {ENABLE_PDF_IMPORT ? <PdfImportButton mode={mode} /> : null}
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-2 py-2">
        {!isMini ? (
          <div className="mb-2 flex items-center justify-between px-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-sidebar-foreground/60">
              CVs
            </p>
            <span className="text-[11px] text-sidebar-foreground/45">{activeFiles.length}</span>
          </div>
        ) : null}
        <ul className="space-y-1">
          {activeFiles.map((file) => (
            <li key={file.id}>
              <SidebarFileRow
                compact={isCompact}
                file={file}
                mini={isMini}
                selected={snapshot.selectedFileId === file.id}
              />
            </li>
          ))}
        </ul>
        {(reviewSessions.length > 0 || archivedReviewSessions.length > 0) && !isMini ? (
          <div className="mt-6 space-y-4">
            {reviewSessions.length > 0 ? (
              <div>
                <div className="mb-2 flex items-center justify-between px-2">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-sidebar-foreground/60">
                    Resumes in Review
                  </p>
                  <span className="text-[11px] text-sidebar-foreground/45">{reviewSessions.length}</span>
                </div>
                <ul className="space-y-1">
                  {reviewSessions.map((session) => {
                    const activeProposal = session.proposals.find(
                      (proposal) => proposal.proposalId === session.activeProposalId
                    );
                    const selected = location.pathname === `/review/${session.sessionId}`;
                    return (
                      <li key={session.sessionId}>
                        <Link
                          className={`flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors ${
                            selected
                              ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                          }`}
                          to={`/review/${session.sessionId}`}
                        >
                          <GitCompareArrows className="mt-0.5 size-4 shrink-0" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate">{session.baseFileName}</span>
                            <span className="block truncate text-xs text-sidebar-foreground/60">
                              {activeProposal
                                ? `${activeProposal.reviewerName} proposal`
                                : 'Ready to send changes back'}
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
            {archivedReviewSessions.length > 0 ? (
              <div>
                <div className="mb-2 flex items-center justify-between px-2">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-sidebar-foreground/60">
                    Review Archive
                  </p>
                  <span className="text-[11px] text-sidebar-foreground/45">{archivedReviewSessions.length}</span>
                </div>
                <ul className="space-y-1">
                  {archivedReviewSessions.map((session) => (
                    <li key={session.sessionId}>
                      <Link
                        className={`flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors ${
                          location.pathname === `/review/${session.sessionId}`
                            ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                        }`}
                        to={`/review/${session.sessionId}`}
                      >
                        <Archive className="mt-0.5 size-4 shrink-0" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{session.baseFileName}</span>
                          <span className="block truncate text-xs text-sidebar-foreground/60">
                            {session.archivedHistory[0]?.outcome === 'applied' ? 'Applied' : 'Rejected'}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
        {!activeFiles.length && !isMini ? (
          <div className="mt-3 rounded-lg border border-dashed border-sidebar-border px-3 py-4 text-sm text-sidebar-foreground/60">
            Create a CV, import YAML, or start from another source.
          </div>
        ) : null}
      </div>

      <footer className="border-t border-sidebar-border px-2 py-2">
        {!isMini ? (
          <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-[0.18em] text-sidebar-foreground/60">
            Links
          </p>
        ) : null}
        <nav className={`grid gap-1 ${isMini ? 'grid-cols-2' : ''}`}>
          <button
            className={`flex items-center rounded-md text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
              isMini ? 'justify-center px-0 py-2' : isCompact ? 'justify-center px-2 py-2' : 'gap-2 px-2 py-2 text-left'
            }`}
            onClick={() => onboardingTour.start()}
            title="Start product tour"
            type="button"
          >
            <HelpCircle className="size-4 shrink-0" />
            {isCompact ? <span className="sr-only">Product Tour</span> : <span>Product Tour</span>}
          </button>
          <SidebarLinkButton compact={isCompact} icon={<Shield className="size-4" />} mini={isMini} to="/privacy-policy">
            Privacy Policy
          </SidebarLinkButton>
          <SidebarLinkButton compact={isCompact} icon={<FileText className="size-4" />} mini={isMini} to="/terms-of-service">
            Terms of Service
          </SidebarLinkButton>
        </nav>
      </footer>
    </aside>
  );
}

function SidebarBrand({ compact, mini }: { compact: boolean; mini: boolean }) {
  return (
    <div className={`px-4 ${mini ? 'py-3 text-center' : compact ? 'py-3' : 'py-4'}`}>
      <div className="min-w-0">
        <h1
          className={`truncate leading-tight font-normal text-sidebar-foreground ${
            mini ? 'text-sm uppercase tracking-[0.18em]' : 'text-lg'
          }`}
        >
          RenderCV
        </h1>
        {!compact && !mini ? (
          <p className="text-xs text-sidebar-foreground/60">
            Resume workspace
          </p>
        ) : null}
      </div>
    </div>
  );
}

function SidebarFileRow({
  compact,
  file,
  mini,
  selected
}: {
  compact: boolean;
  file: CvFile;
  mini: boolean;
  selected: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState(file.name);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') closeMenu();
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen, closeMenu]);

  useEffect(() => {
    if (isRenaming && renameRef.current) {
      renameRef.current.focus();
      renameRef.current.select();
    }
  }, [isRenaming]);

  function commitRename() {
    const trimmed = renameDraft.trim();
    if (trimmed && trimmed !== file.name) {
      fileStore.renameFile(file.id, trimmed);
    }
    setIsRenaming(false);
  }

  return (
    <div className="group/menu-item relative">
      {isRenaming ? (
        <div className="flex h-8 items-center px-2">
          <input
            ref={renameRef}
            className="h-6 w-full rounded border border-sidebar-border bg-sidebar px-1.5 text-sm text-sidebar-foreground outline-none focus:border-sidebar-ring"
            value={renameDraft}
            onChange={(event) => setRenameDraft(event.target.value)}
            onBlur={commitRename}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commitRename();
              if (event.key === 'Escape') setIsRenaming(false);
            }}
          />
        </div>
      ) : (
        <button
          className={`flex h-8 w-full items-center gap-2 overflow-hidden rounded-md px-2 text-left text-sm transition-colors ${
            selected
              ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
              : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
          } ${mini ? 'justify-center' : ''}`}
          onClick={() => fileStore.selectFile(file.id)}
          title={mini ? file.name : undefined}
          type="button"
        >
          {mini ? (
            <>
              {file.isLocked ? <Lock className="size-4 shrink-0 text-muted-foreground" /> : <Monitor className="size-4 shrink-0" />}
              <span className="sr-only">{file.name}</span>
            </>
          ) : (
            <>
              {file.isLocked ? <Lock className="size-4 shrink-0 text-muted-foreground" /> : null}
              <span className="truncate">{file.name}</span>
            </>
          )}
        </button>
      )}
      {!mini && !isRenaming ? (
        <>
          <button
            ref={triggerRef}
            className={`absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground transition-opacity hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
              menuOpen
                ? 'opacity-100'
                : 'opacity-0 group-hover/menu-item:opacity-100 focus-visible:opacity-100'
            }`}
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            <EllipsisVertical className="size-4" />
            <span className="sr-only">More</span>
          </button>
          {menuOpen ? (
            <div
              ref={menuRef}
              className="absolute right-0 top-full z-50 mt-1 min-w-[15rem] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
              role="menu"
            >
              <FileMenuItem
                icon={<Lock className="size-4" />}
                label={file.isLocked ? 'Unlock' : 'Lock'}
                shortcut="⌘K"
                onClick={() => {
                  if (file.isLocked) fileStore.unlockFile(file.id);
                  else fileStore.lockFile(file.id);
                  closeMenu();
                }}
              />
              <FileMenuItem
                icon={<LinkIcon className="size-4" />}
                label="Make public and copy link"
                onClick={async () => {
                  fileStore.makePublic(file.id);
                  await navigator.clipboard.writeText(
                    new URL(`${import.meta.env.BASE_URL}${file.id}`, window.location.origin).toString()
                  );
                  closeMenu();
                }}
              />
              <FileMenuItem
                icon={<Copy className="size-4" />}
                label="Duplicate"
                shortcut="⌘D"
                onClick={() => {
                  fileStore.duplicateFile(file.id);
                  closeMenu();
                }}
              />
              <FileMenuItem
                icon={<Pencil className="size-4" />}
                label="Rename"
                onClick={() => {
                  setRenameDraft(file.name);
                  setIsRenaming(true);
                  closeMenu();
                }}
              />
              <div className="-mx-1 my-1 h-px bg-border" role="separator" />
              <FileMenuItem
                icon={<Archive className="size-4" />}
                label="Move to archive"
                onClick={() => {
                  fileStore.archiveFile(file.id);
                  closeMenu();
                }}
              />
              <FileMenuItem
                destructive
                icon={<Trash2 className="size-4" />}
                label="Move to trash"
                shortcut="⌘⌫"
                onClick={() => {
                  fileStore.trashFile(file.id);
                  closeMenu();
                }}
              />
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function FileMenuItem({
  destructive,
  icon,
  label,
  shortcut,
  onClick
}: {
  destructive?: boolean;
  icon: ReactNode;
  label: string;
  shortcut?: string;
  onClick: () => void | Promise<void>;
}) {
  return (
    <button
      className={`relative flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none ${
        destructive
          ? 'text-destructive hover:bg-destructive/10'
          : 'hover:bg-accent hover:text-accent-foreground'
      } [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 ${
        destructive ? '[&_svg]:text-destructive' : '[&_svg:not([class*="text-"])]:text-muted-foreground'
      }`}
      role="menuitem"
      type="button"
      onClick={() => {
        void onClick();
      }}
    >
      {icon}
      {label}
      {shortcut ? (
        <span className="ml-auto inline-flex items-center gap-1">
          {shortcut.split('').filter((c) => c !== ' ').map((key, index) => (
            <kbd
              key={index}
              className="pointer-events-none inline-flex h-5 min-w-5 items-center justify-center rounded-sm bg-muted px-1 font-sans text-xs font-medium text-muted-foreground select-none"
            >
              {key}
            </kbd>
          ))}
        </span>
      ) : null}
    </button>
  );
}


function SidebarLinkButton({
  children,
  compact,
  icon,
  mini,
  to
}: {
  children: string;
  compact: boolean;
  icon: ReactNode;
  mini: boolean;
  to: string;
}) {
  return (
    <Link
      className={`inline-flex items-center rounded-md text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
        mini ? 'h-10 justify-center px-0' : compact ? 'gap-2 px-2.5 py-2 text-sm' : 'gap-2 px-2.5 py-2 text-sm'
      }`}
      title={mini ? children : undefined}
      to={to}
    >
      {icon}
      {mini ? <span className="sr-only">{children}</span> : <span className="truncate">{children}</span>}
    </Link>
  );
}
