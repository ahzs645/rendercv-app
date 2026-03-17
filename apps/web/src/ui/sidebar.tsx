import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Copy,
  EllipsisVertical,
  FilePlus2,
  FileText,
  Files,
  FolderArchive,
  Lock,
  LockOpen,
  Monitor,
  Shield,
  Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CvFile } from '@rendercv/contracts';
import { fileStore, localeLabel, themeLabel } from '@rendercv/core';
import { ENABLE_PDF_IMPORT } from '../lib/feature-flags';
import { useStore } from '../lib/use-store';
import { GitHubSyncCard } from './github-sync-card';
import { PdfImportButton } from './pdf-import-button';
import { YamlImportButton } from './yaml-import-button';
import type { PreparedYamlImport } from './yaml-import-button';
import type { RenderError } from '../features/viewer/use-viewer-renderer';

type SidebarMode = 'full' | 'compact' | 'mini';

const COMPACT_WIDTH = 300;
const MINI_WIDTH = 220;

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

  useEffect(() => {
    const element = asideRef.current;
    if (!element || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const updateMode = (width: number) => {
      const nextMode: SidebarMode =
        width < MINI_WIDTH ? 'mini' : width < COMPACT_WIDTH ? 'compact' : 'full';
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
      <div className={`space-y-2 border-b border-sidebar-border px-2 pb-3 ${isMini ? 'pt-0' : 'pt-1'}`}>
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
        {!activeFiles.length && !isMini ? (
          <div className="mt-3 rounded-lg border border-dashed border-sidebar-border px-3 py-4 text-sm text-sidebar-foreground/60">
            Create a CV, import YAML, or start from another source.
          </div>
        ) : null}
        {mode !== 'mini' ? (
          <div className="mt-4">
            <GitHubSyncCard mode={mode === 'full' ? 'full' : 'compact'} />
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
    <div className={`flex items-center gap-3 px-4 ${mini ? 'justify-center py-3' : compact ? 'py-3' : 'py-4'}`}>
      <img
        alt=""
        aria-hidden="true"
        className="size-8 shrink-0"
        src={`${import.meta.env.BASE_URL}favicon.svg`}
      />
      {mini ? null : (
        <div className="min-w-0">
          <h1 className="truncate text-lg leading-tight font-normal text-sidebar-foreground">RenderCV</h1>
          {!compact ? (
            <p className="text-xs text-sidebar-foreground/60">
              Resume workspace
            </p>
          ) : null}
        </div>
      )}
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
  const [actionsOpen, setActionsOpen] = useState(false);

  return (
    <div className="group">
      <div
        className={`flex items-center rounded-md transition-colors ${
          selected
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground'
        }`}
      >
        <button
          className={`min-w-0 flex-1 text-left ${mini ? 'flex h-10 items-center justify-center px-0' : 'flex items-center gap-2 px-2 py-2'}`}
          onClick={() => fileStore.selectFile(file.id)}
          title={mini ? file.name : undefined}
          type="button"
        >
          {file.isLocked ? (
            <Lock className={`shrink-0 text-sidebar-foreground/70 ${mini ? 'size-4' : 'size-4'}`} />
          ) : (
            <Monitor className={`shrink-0 text-sidebar-foreground/70 ${mini ? 'size-4' : 'size-4'}`} />
          )}
          {mini ? <span className="sr-only">{file.name}</span> : null}
          {mini ? null : (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{file.name}</span>
              {!compact ? (
                <span className="block truncate text-xs text-sidebar-foreground/60">
                  {themeLabel(file.selectedTheme)} · {localeLabel(file.selectedLocale)}
                </span>
              ) : (
                <span className="block truncate text-[11px] text-sidebar-foreground/55">
                  {themeLabel(file.selectedTheme)}
                </span>
              )}
            </span>
          )}
        </button>
        {mini ? null : (
          <button
            className={`mr-1 flex size-7 shrink-0 items-center justify-center rounded-md transition-opacity hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
              actionsOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
            }`}
            onClick={() => setActionsOpen((open) => !open)}
            title="File actions"
            type="button"
          >
            <EllipsisVertical className="size-4" />
            <span className="sr-only">File actions</span>
          </button>
        )}
      </div>
      {actionsOpen && !mini ? (
        <div className={`ml-8 mt-1 flex flex-wrap gap-1 ${compact ? '' : 'pr-2'}`}>
          <SidebarActionChip
            icon={<Files className="size-3.5" />}
            label="Duplicate"
            onClick={() => {
              fileStore.duplicateFile(file.id);
            }}
          />
          <SidebarActionChip icon={<FolderArchive className="size-3.5" />} label="Archive" onClick={() => fileStore.archiveFile(file.id)} />
          <SidebarActionChip icon={<Trash2 className="size-3.5" />} label="Trash" onClick={() => fileStore.trashFile(file.id)} />
          {file.isLocked ? (
            <SidebarActionChip icon={<LockOpen className="size-3.5" />} label="Unlock" onClick={() => fileStore.unlockFile(file.id)} />
          ) : (
            <SidebarActionChip icon={<Lock className="size-3.5" />} label="Lock" onClick={() => fileStore.lockFile(file.id)} />
          )}
          <SidebarActionChip
            icon={<Copy className="size-3.5" />}
            label="Public link"
            onClick={async () => {
              fileStore.makePublic(file.id);
              await navigator.clipboard.writeText(
                new URL(`${import.meta.env.BASE_URL}${file.id}`, window.location.origin).toString()
              );
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function SidebarActionChip({
  icon,
  label,
  onClick
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void | Promise<void>;
}) {
  return (
    <button
      className="inline-flex items-center gap-1 rounded-md border border-sidebar-border bg-sidebar px-2 py-1 text-xs text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      onClick={() => {
        void onClick();
      }}
      type="button"
    >
      {icon}
      {label}
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
