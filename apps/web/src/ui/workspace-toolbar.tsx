import type { RefObject, ReactNode } from 'react';
import {
  AppWindow,
  Bold,
  ChevronsDownUp,
  Copy,
  Download,
  FileCode2,
  Italic,
  Link as LinkIcon,
  Minus,
  Moon,
  PanelLeft,
  Plus,
  Redo2,
  Share2,
  Sun,
  Undo2
} from 'lucide-react';
import type { CvFile, CvFileSections } from '@rendercv/contracts';
import { fileStore, localeLabel, preferencesStore, themeLabel } from '@rendercv/core';
import { downloadBlob } from '../features/viewer/download';
import { useStore } from '../lib/use-store';
import type { MonacoEditorHandle } from './monaco-editor';
import type { ViewerRenderer } from './preview-pane';
import { WorkspaceAiEditor } from './workspace-ai-editor';

export function WorkspaceToolbar({
  editorRef,
  onOpenPopup,
  onToggleSidebar,
  sections,
  selectedFile,
  sidebarCollapsed,
  viewer
}: {
  editorRef: RefObject<MonacoEditorHandle | null>;
  onOpenPopup?: () => void;
  onToggleSidebar: () => void;
  sections?: CvFileSections;
  selectedFile?: CvFile;
  sidebarCollapsed: boolean;
  viewer: ViewerRenderer;
}) {
  const preferences = useStore(preferencesStore);
  const fileSnapshot = useStore(fileStore);
  const prefersDark =
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark =
    preferences.colorMode === 'dark' || (preferences.colorMode === 'system' && prefersDark);

  const canFormat = preferences.yamlEditor;
  const canPreviewActions = Boolean(sections);

  async function copyPublicLink() {
    if (!selectedFile) {
      return;
    }

    if (!selectedFile.isPublic) {
      fileStore.makePublic(selectedFile.id);
    }

    const url = new URL(`${import.meta.env.BASE_URL}${selectedFile.id}`, window.location.origin).toString();
    await navigator.clipboard.writeText(url);
  }

  async function sharePdf() {
    if (!sections) {
      return;
    }

    const bytes = await viewer.renderToPdf(sections);
    if (!bytes) {
      return;
    }

    const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
    const file = new File([blob], `${selectedFile?.name ?? 'RenderCV'}.pdf`, { type: 'application/pdf' });

    try {
      if (navigator.canShare?.({ files: [file] }) && typeof navigator.share === 'function') {
        await navigator.share({ title: selectedFile?.name ?? 'RenderCV', files: [file] });
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
    }

    await downloadBlob(blob, `${selectedFile?.name ?? 'RenderCV'}.pdf`);
  }

  return (
    <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <ToolbarIconButton
          active={!sidebarCollapsed}
          ariaLabel={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
          onClick={onToggleSidebar}
        >
          <PanelLeft className="size-4" />
        </ToolbarIconButton>
        <div className="mr-2 hidden min-w-0 lg:block">
          <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {selectedFile?.name ?? 'RenderCV'}
          </p>
        </div>
        <ToolbarIconButton
          ariaLabel="Undo"
          disabled={!fileSnapshot.canUndo}
          onClick={() => {
            fileStore.undo();
          }}
        >
          <Undo2 className="size-4" />
        </ToolbarIconButton>
        <ToolbarIconButton
          ariaLabel="Redo"
          disabled={!fileSnapshot.canRedo}
          onClick={() => {
            fileStore.redo();
          }}
        >
          <Redo2 className="size-4" />
        </ToolbarIconButton>
        <ToolbarIconButton
          ariaLabel={preferences.entriesExpanded ? 'Collapse all entries' : 'Expand all entries'}
          disabled={preferences.yamlEditor}
          onClick={() => preferencesStore.patch({ entriesExpanded: !preferences.entriesExpanded })}
        >
          <ChevronsDownUp className="size-4" />
        </ToolbarIconButton>
        <ToolbarIconButton
          ariaLabel="Bold"
          disabled={!canFormat}
          onClick={() => editorRef.current?.surroundSelection('**', '**', 'bold text')}
        >
          <Bold className="size-4" />
        </ToolbarIconButton>
        <ToolbarIconButton
          ariaLabel="Italic"
          disabled={!canFormat}
          onClick={() => editorRef.current?.surroundSelection('_', '_', 'italic text')}
        >
          <Italic className="size-4" />
        </ToolbarIconButton>
        <ToolbarIconButton
          ariaLabel="Insert link"
          disabled={!canFormat}
          onClick={() => editorRef.current?.insertMarkdownLink()}
        >
          <LinkIcon className="size-4" />
        </ToolbarIconButton>
        <div className="ml-1 flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5">
          <button
            type="button"
            role="switch"
            aria-checked={preferences.yamlEditor}
            aria-label="Toggle YAML editor"
            className={`inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent transition-all ${
              preferences.yamlEditor ? 'bg-primary' : 'bg-input'
            }`}
            onClick={() => preferencesStore.patch({ yamlEditor: !preferences.yamlEditor })}
          >
            <span
              className={`block size-4 rounded-full bg-background transition-transform ${
                preferences.yamlEditor ? 'translate-x-[calc(100%-2px)]' : 'translate-x-0'
              }`}
            />
          </button>
          <span className="text-xs font-medium text-foreground">YAML</span>
        </div>
        {selectedFile ? (
          <>
            <ToolbarSelect
              label="Theme"
              onChange={(value) => fileStore.setTheme(selectedFile.id, value)}
              options={Object.keys(selectedFile.designs)}
              renderLabel={themeLabel}
              value={selectedFile.selectedTheme}
            />
            <ToolbarSelect
              label="Locale"
              onChange={(value) => fileStore.setLocale(selectedFile.id, value)}
              options={Object.keys(selectedFile.locales)}
              renderLabel={localeLabel}
              value={selectedFile.selectedLocale}
            />
          </>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <WorkspaceAiEditor fileId={selectedFile?.id} sections={sections} />
        <div className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1">
          <ToolbarIconButton
            ariaLabel="Zoom out"
            disabled={!canPreviewActions}
            onClick={viewer.zoomOut}
            variant="ghost"
          >
            <Minus className="size-4" />
          </ToolbarIconButton>
          <button
            type="button"
            className="min-w-12 rounded-md px-2 py-1 text-sm text-foreground"
            disabled={!canPreviewActions}
            onClick={viewer.zoomReset}
          >
            {viewer.zoomPercent}%
          </button>
          <ToolbarIconButton
            ariaLabel="Zoom in"
            disabled={!canPreviewActions}
            onClick={viewer.zoomIn}
            variant="ghost"
          >
            <Plus className="size-4" />
          </ToolbarIconButton>
        </div>
        <ToolbarIconButton
          ariaLabel="Popup preview"
          disabled={!canPreviewActions || !onOpenPopup}
          onClick={() => onOpenPopup?.()}
        >
          <AppWindow className="size-4" />
        </ToolbarIconButton>
        <ToolbarIconButton
          ariaLabel="Download PDF"
          disabled={!canPreviewActions}
          onClick={async () => {
            if (!sections) return;
            const bytes = await viewer.renderToPdf(sections);
            if (!bytes) return;
            await downloadBlob(
              new Blob([bytes as BlobPart], { type: 'application/pdf' }),
              `${selectedFile?.name ?? 'RenderCV'}.pdf`
            );
          }}
        >
          <Download className="size-4" />
        </ToolbarIconButton>
        <ToolbarIconButton
          ariaLabel="Download Typst"
          disabled={!canPreviewActions}
          onClick={async () => {
            if (!sections) return;
            const typst = await viewer.renderToTypst(sections);
            if (!typst) return;
            await downloadBlob(
              new Blob([typst], { type: 'application/octet-stream' }),
              `${selectedFile?.name ?? 'RenderCV'}.typ`
            );
          }}
        >
          <FileCode2 className="size-4" />
        </ToolbarIconButton>
        <ToolbarIconButton
          ariaLabel="Share PDF"
          disabled={!canPreviewActions}
          onClick={sharePdf}
        >
          <Share2 className="size-4" />
        </ToolbarIconButton>
        <ToolbarIconButton
          ariaLabel="Copy public link"
          disabled={!selectedFile}
          onClick={() => void copyPublicLink()}
        >
          <Copy className="size-4" />
        </ToolbarIconButton>
        <ToolbarIconButton
          ariaLabel="Toggle color mode"
          onClick={() => preferencesStore.patch({ colorMode: isDark ? 'light' : 'dark' })}
        >
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </ToolbarIconButton>
      </div>
    </div>
  );
}

function ToolbarSelect({
  label,
  onChange,
  options,
  renderLabel,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  renderLabel: (value: string) => string;
  value: string;
}) {
  return (
    <label className="hidden items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground sm:flex">
      <span>{label}</span>
      <select
        className="bg-transparent text-foreground outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {renderLabel(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToolbarIconButton({
  active = false,
  ariaLabel,
  children,
  disabled = false,
  onClick,
  variant = 'default'
}: {
  active?: boolean;
  ariaLabel: string;
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void | Promise<void>;
  variant?: 'default' | 'ghost';
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={ariaLabel}
      disabled={disabled}
      onClick={() => void onClick()}
      className={`inline-flex size-8 items-center justify-center rounded-md text-sm transition-colors ${
        variant === 'ghost'
          ? 'hover:bg-accent hover:text-accent-foreground'
          : active
            ? 'border border-primary/30 bg-primary/10 text-primary'
            : 'border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground'
      } disabled:pointer-events-none disabled:opacity-40`}
    >
      {children}
    </button>
  );
}
