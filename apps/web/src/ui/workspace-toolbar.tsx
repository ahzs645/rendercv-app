import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import type { RefObject, ReactNode } from 'react';
import {
  AppWindow,
  Bold,
  ChevronsDownUp,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileCode2,
  FileDown,
  FileUp,
  GitCompareArrows,
  Italic,
  Link as LinkIcon,
  Minus,
  Moon,
  PanelLeft,
  Plus,
  Redo2,
  Share2,
  SlidersHorizontal,
  Sun,
  Undo2,
  X
} from 'lucide-react';
import type { CvFile, CvFileSections } from '@rendercv/contracts';
import { fileStore, preferencesStore, readThemeName, readLocaleName } from '@rendercv/core';
import { toast } from 'sonner';
import { downloadBlob } from '../features/viewer/download';
import { buildEncodedShareUrl, buildEncodedSharePdfUrl } from '../features/share/encoded-share';
import { exportShareFile, importShareFile } from '../features/share/file-share';
import { ChangesDialog } from '../features/share/changes-dialog';
import { useStore } from '../lib/use-store';
import type { MonacoEditorHandle } from './monaco-editor';
import type { ViewerRenderer } from './preview-pane';
import { StyledTooltip } from './styled-tooltip';
import { WorkspaceAiEditor } from './workspace-ai-editor';

export function WorkspaceToolbar({
  editorRef,
  isMobile = false,
  mobilePane = 'editor',
  onOpenPopup,
  onMobilePaneChange,
  onToggleSidebar,
  sections,
  selectedFile,
  sidebarCollapsed,
  viewer
}: {
  editorRef: RefObject<MonacoEditorHandle | null>;
  isMobile?: boolean;
  mobilePane?: 'editor' | 'preview';
  onOpenPopup?: () => void;
  onMobilePaneChange?: (pane: 'editor' | 'preview') => void;
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
  const canLinkActions = Boolean(selectedFile && sections);
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
  const [changesOpen, setChangesOpen] = useState(false);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const showMobileEditorControls = mobilePane === 'editor';
  const hasSharedOrigin = Boolean(selectedFile?.sharedOrigin);

  async function copyShareLink() {
    if (!selectedFile || !sections) {
      return;
    }

    try {
      const result = await buildEncodedShareUrl({
        version: 1,
        fileName: selectedFile.name,
        sections,
        origin: selectedFile.sharedOrigin
      });
      await navigator.clipboard.writeText(result.url);

      if (result.originDropped) {
        toast.warning('Share link copied, but tracked changes were omitted because the resume is too large for a URL. Use "Backup file" to keep the full review history.', { duration: 6000 });
      } else if (selectedFile.sharedOrigin) {
        toast.success('Share link with changes copied.');
      } else {
        toast.success('Share link copied.');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create share link.');
    }
  }

  async function copyPdfLink() {
    if (!selectedFile || !sections) {
      return;
    }

    try {
      const url = await buildEncodedSharePdfUrl({
        version: 1,
        fileName: selectedFile.name,
        sections
      });
      await navigator.clipboard.writeText(url);
      toast.success('PDF download link copied.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create PDF link.');
    }
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

  async function downloadPdf() {
    if (!sections) {
      return;
    }

    const bytes = await viewer.renderToPdf(sections);
    if (!bytes) {
      return;
    }

    await downloadBlob(
      new Blob([bytes as BlobPart], { type: 'application/pdf' }),
      `${selectedFile?.name ?? 'RenderCV'}.pdf`
    );
  }

  async function downloadTypst() {
    if (!sections) {
      return;
    }

    const typst = await viewer.renderToTypst(sections);
    if (!typst) {
      return;
    }

    await downloadBlob(
      new Blob([typst], { type: 'application/octet-stream' }),
      `${selectedFile?.name ?? 'RenderCV'}.typ`
    );
  }

  async function exportJson() {
    if (!selectedFile || !sections) return;

    try {
      await exportShareFile({
        version: 1,
        fileName: selectedFile.name,
        sections,
        origin: selectedFile.sharedOrigin
      });
      toast.success('Backup file downloaded.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to export file.');
    }
  }

  async function importJson() {
    try {
      const payload = await importShareFile();
      if (!payload) return;

      const designKey = readThemeName(payload.sections.design) ?? 'classic';
      const localeKey = readLocaleName(payload.sections.locale) ?? 'english';
      const fileName = fileStore.uniqueName(
        payload.origin ? `${payload.fileName} (Review)` : payload.fileName
      );

      fileStore.createFile(fileName, {
        cv: payload.sections.cv,
        settings: payload.sections.settings,
        designs: { [designKey]: payload.sections.design },
        locales: { [localeKey]: payload.sections.locale },
        selectedTheme: designKey,
        selectedLocale: localeKey,
        sharedOrigin: payload.origin ?? payload.sections
      });

      toast.success(`Imported "${fileName}" as a review copy with tracked changes.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to import file.');
    }
  }

  if (isMobile) {
    return (
      <div className="flex flex-col gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <ToolbarIconButton
            active={!sidebarCollapsed}
            ariaLabel={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
            onClick={onToggleSidebar}
          >
            <PanelLeft className="size-4" />
          </ToolbarIconButton>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {selectedFile?.name ?? 'RenderCV'}
            </p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Resume workspace
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
          <Dialog.Root open={mobileActionsOpen} onOpenChange={setMobileActionsOpen}>
            <Dialog.Trigger asChild>
              <ToolbarIconButton ariaLabel="More actions" onClick={() => setMobileActionsOpen(true)}>
                <SlidersHorizontal className="size-4" />
              </ToolbarIconButton>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-40 bg-background/50 backdrop-blur-[2px]" />
              <Dialog.Content className="fixed inset-x-3 bottom-3 z-50 max-h-[80dvh] overflow-auto rounded-[2rem] border border-border bg-background p-5 shadow-2xl outline-none">
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border" />
                <Dialog.Title className="text-base font-semibold text-foreground">
                  Workspace actions
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                  Formatting, exports, sharing, and display controls.
                </Dialog.Description>
                <div className="mt-5 space-y-5">
                  {showMobileEditorControls ? (
                    <section className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Editor
                        </p>
                        <YamlToggle
                          checked={preferences.yamlEditor}
                          label="YAML"
                          onChange={() => preferencesStore.patch({ yamlEditor: !preferences.yamlEditor })}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <MobileSheetButton
                          disabled={preferences.yamlEditor}
                          label={preferences.entriesExpanded ? 'Collapse' : 'Expand'}
                          onClick={() => preferencesStore.patch({ entriesExpanded: !preferences.entriesExpanded })}
                        >
                          <ChevronsDownUp className="size-4" />
                        </MobileSheetButton>
                        <MobileSheetButton
                          disabled={!canFormat}
                          label="Bold"
                          onClick={() => editorRef.current?.surroundSelection('**', '**', 'bold text')}
                        >
                          <Bold className="size-4" />
                        </MobileSheetButton>
                        <MobileSheetButton
                          disabled={!canFormat}
                          label="Link"
                          onClick={() => editorRef.current?.insertMarkdownLink()}
                        >
                          <LinkIcon className="size-4" />
                        </MobileSheetButton>
                        <MobileSheetButton
                          disabled={!canFormat}
                          label="Italic"
                          onClick={() => editorRef.current?.surroundSelection('_', '_', 'italic text')}
                        >
                          <Italic className="size-4" />
                        </MobileSheetButton>
                      </div>
                    </section>
                  ) : null}

                  <section className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Preview
                    </p>
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-3 py-2.5">
                      <span className="text-sm font-medium text-foreground">Zoom</span>
                      <div className="flex items-center gap-1">
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
                          aria-label="Reset zoom"
                          className="min-w-12 rounded-md px-2 py-1 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40"
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
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <MobileSheetButton
                        disabled={!canPreviewActions || !onOpenPopup}
                        label="Popup preview"
                        onClick={() => onOpenPopup?.()}
                      >
                        <AppWindow className="size-4" />
                      </MobileSheetButton>
                      <MobileSheetButton
                        label="Download & share"
                        onClick={() => {
                          setMobileActionsOpen(false);
                          setDownloadDialogOpen(true);
                        }}
                      >
                        <Download className="size-4" />
                      </MobileSheetButton>
                      {hasSharedOrigin ? (
                        <MobileSheetButton
                          className="col-span-2"
                          label="View changes"
                          onClick={() => {
                            setMobileActionsOpen(false);
                            setChangesOpen(true);
                          }}
                        >
                          <GitCompareArrows className="size-4" />
                        </MobileSheetButton>
                      ) : null}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Appearance
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <MobileSheetButton
                        label={isDark ? 'Light mode' : 'Dark mode'}
                        onClick={() =>
                          preferencesStore.patch({ colorMode: isDark ? 'light' : 'dark' })
                        }
                      >
                        {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
                      </MobileSheetButton>
                      {isDark ? (
                        <MobileSheetButton
                          label={preferences.previewDarkMode ? 'Original preview' : 'Dark preview'}
                          onClick={() =>
                            preferencesStore.patch({ previewDarkMode: !preferences.previewDarkMode })
                          }
                        >
                          {preferences.previewDarkMode ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </MobileSheetButton>
                      ) : null}
                    </div>
                  </section>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>

        <div className="flex items-center gap-2">
          <MobilePaneSwitch activePane={mobilePane} onChange={onMobilePaneChange} />
          {showMobileEditorControls ? (
            <div className="ml-auto">
              <YamlToggle
                checked={preferences.yamlEditor}
                label="YAML"
                onChange={() => preferencesStore.patch({ yamlEditor: !preferences.yamlEditor })}
              />
            </div>
          ) : null}
        </div>

        {mobilePane === 'preview' ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Preview
            </p>
            <div className="flex items-center gap-1">
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
                aria-label="Reset zoom"
                className="min-w-12 rounded-md px-2 py-1 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40"
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
          </div>
        ) : null}
        <DownloadShareDialog
          canLinkActions={canLinkActions}
          canPreviewActions={canPreviewActions}
          fileName={selectedFile?.name}
          onCopyPdfLink={() => void copyPdfLink()}
          onCopyShareLink={() => void copyShareLink()}
          onDownloadPdf={() => void downloadPdf()}
          onDownloadTypst={() => void downloadTypst()}
          onExportJson={() => void exportJson()}
          onImportJson={() => void importJson()}
          onOpenChange={setDownloadDialogOpen}
          onSharePdf={() => void sharePdf()}
          open={downloadDialogOpen}
        />
        {hasSharedOrigin && sections && selectedFile?.sharedOrigin ? (
          <ChangesDialog
            open={changesOpen}
            onOpenChange={setChangesOpen}
            origin={selectedFile.sharedOrigin}
            modified={sections}
          />
        ) : null}
      </div>
    );
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
        <YamlToggle
          checked={preferences.yamlEditor}
          label="YAML"
          onChange={() => preferencesStore.patch({ yamlEditor: !preferences.yamlEditor })}
        />
        <WorkspaceAiEditor fileId={selectedFile?.id} sections={sections} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ToolbarControlGroup>
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
            aria-label="Reset zoom"
            className="min-w-12 rounded-md px-2 py-1 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40"
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
        </ToolbarControlGroup>
        <ToolbarControlGroup>
          <ToolbarIconButton
            ariaLabel="Popup preview"
            disabled={!canPreviewActions || !onOpenPopup}
            onClick={() => onOpenPopup?.()}
            variant="ghost"
          >
            <AppWindow className="size-4" />
          </ToolbarIconButton>
          <ToolbarActionButton
            ariaLabel="Open download and share actions"
            onClick={() => setDownloadDialogOpen(true)}
          >
            <Download className="size-4" />
            <span className="whitespace-nowrap">Download &amp; share</span>
          </ToolbarActionButton>
          {hasSharedOrigin && sections ? (
            <ToolbarIconButton
              ariaLabel="View changes from original"
              active={changesOpen}
              onClick={() => setChangesOpen(true)}
              variant="ghost"
            >
              <GitCompareArrows className="size-4" />
            </ToolbarIconButton>
          ) : null}
        </ToolbarControlGroup>
        <ToolbarControlGroup>
          {isDark ? (
            <ToolbarIconButton
              ariaLabel={preferences.previewDarkMode ? 'Show original preview colors' : 'Adapt preview to dark mode'}
              onClick={() => preferencesStore.patch({ previewDarkMode: !preferences.previewDarkMode })}
              variant="ghost"
            >
              {preferences.previewDarkMode ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </ToolbarIconButton>
          ) : null}
          <ToolbarIconButton
            ariaLabel="Toggle color mode"
            onClick={() => preferencesStore.patch({ colorMode: isDark ? 'light' : 'dark' })}
            variant="ghost"
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </ToolbarIconButton>
        </ToolbarControlGroup>
      </div>
      <DownloadShareDialog
        canLinkActions={canLinkActions}
        canPreviewActions={canPreviewActions}
        fileName={selectedFile?.name}
        onCopyPdfLink={() => void copyPdfLink()}
        onCopyShareLink={() => void copyShareLink()}
        onDownloadPdf={() => void downloadPdf()}
        onDownloadTypst={() => void downloadTypst()}
        onExportJson={() => void exportJson()}
        onImportJson={() => void importJson()}
        onOpenChange={setDownloadDialogOpen}
        onSharePdf={() => void sharePdf()}
        open={downloadDialogOpen}
      />
      {hasSharedOrigin && sections && selectedFile?.sharedOrigin ? (
        <ChangesDialog
          open={changesOpen}
          onOpenChange={setChangesOpen}
          origin={selectedFile.sharedOrigin}
          modified={sections}
        />
      ) : null}
    </div>
  );
}

function MobilePaneSwitch({
  activePane,
  onChange
}: {
  activePane: 'editor' | 'preview';
  onChange?: (pane: 'editor' | 'preview') => void;
}) {
  return (
    <div className="inline-flex min-w-0 flex-1 items-center rounded-xl border border-border bg-background p-1">
      <button
        type="button"
        className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          activePane === 'editor'
            ? 'bg-foreground text-background'
            : 'text-foreground hover:bg-accent hover:text-accent-foreground'
        }`}
        onClick={() => onChange?.('editor')}
      >
        Editor
      </button>
      <button
        type="button"
        className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          activePane === 'preview'
            ? 'bg-foreground text-background'
            : 'text-foreground hover:bg-accent hover:text-accent-foreground'
        }`}
        onClick={() => onChange?.('preview')}
      >
        Preview
      </button>
    </div>
  );
}

function YamlToggle({
  checked,
  label,
  onChange
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <div className="ml-1 flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={`Toggle ${label} editor`}
        className={`inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent transition-all ${
          checked ? 'bg-primary' : 'bg-input'
        }`}
        onClick={onChange}
      >
        <span
          className={`block size-4 rounded-full bg-background transition-transform ${
            checked ? 'translate-x-[calc(100%-2px)]' : 'translate-x-0'
          }`}
        />
      </button>
      <span className="text-xs font-medium text-foreground">{label}</span>
    </div>
  );
}

function MobileSheetButton({
  children,
  className = '',
  disabled = false,
  label,
  onClick
}: {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  label: string;
  onClick: () => void | Promise<void>;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => void onClick()}
      className={`inline-flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card px-3 py-4 text-center text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40 ${className}`}
    >
      {children}
      <span>{label}</span>
    </button>
  );
}

function ToolbarControlGroup({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-background p-1 shadow-sm">
      {children}
    </div>
  );
}

function ToolbarActionButton({
  ariaLabel,
  children,
  disabled = false,
  onClick
}: {
  ariaLabel: string;
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void | Promise<void>;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-haspopup="dialog"
      disabled={disabled}
      onClick={() => void onClick()}
      className="inline-flex h-8 items-center gap-2 rounded-md px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function DownloadShareDialog({
  canLinkActions,
  canPreviewActions,
  fileName,
  onCopyPdfLink,
  onCopyShareLink,
  onDownloadPdf,
  onDownloadTypst,
  onExportJson,
  onImportJson,
  onOpenChange,
  onSharePdf,
  open
}: {
  canLinkActions: boolean;
  canPreviewActions: boolean;
  fileName?: string;
  onCopyPdfLink: () => void | Promise<void>;
  onCopyShareLink: () => void | Promise<void>;
  onDownloadPdf: () => void | Promise<void>;
  onDownloadTypst: () => void | Promise<void>;
  onExportJson: () => void | Promise<void>;
  onImportJson: () => void | Promise<void>;
  onOpenChange: (open: boolean) => void;
  onSharePdf: () => void | Promise<void>;
  open: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-background/60 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed inset-x-4 top-1/2 z-50 max-h-[85vh] -translate-y-1/2 overflow-hidden rounded-3xl border border-border bg-background shadow-2xl outline-none md:left-1/2 md:w-[min(860px,calc(100vw-3rem))] md:-translate-x-1/2">
          <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
            <div className="min-w-0">
              <Dialog.Title className="text-lg font-semibold text-foreground">
                Share, export, and backup
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Export a finished file, copy a share link, or back up {fileName ?? 'this resume'}
                for review and transfer.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                aria-label="Close download and share dialog"
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                type="button"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="max-h-[calc(85vh-5.5rem)] overflow-auto px-6 py-5">
            <div className="grid gap-4 xl:grid-cols-3">
              <DialogActionSection
                description="Finished files you can send or keep outside the app."
                title="Export files"
              >
                <DialogActionButton
                  description="Save the current resume as a polished PDF."
                  disabled={!canPreviewActions}
                  icon={<Download className="size-4" />}
                  onClick={onDownloadPdf}
                  title="Export PDF"
                />
                <DialogActionButton
                  description="Save the underlying source file for advanced editing workflows."
                  disabled={!canPreviewActions}
                  icon={<FileCode2 className="size-4" />}
                  onClick={onDownloadTypst}
                  title="Export source (.typ)"
                />
              </DialogActionSection>

              <DialogActionSection
                description="Links and quick-send actions for collaborators or other devices."
                title="Share links"
              >
                <DialogActionButton
                  description="Open your device share sheet with the rendered PDF when available."
                  disabled={!canPreviewActions}
                  icon={<Share2 className="size-4" />}
                  onClick={onSharePdf}
                  title="Send PDF"
                />
                <DialogActionButton
                  description="Copy a link that opens this resume in RenderCV."
                  disabled={!canLinkActions}
                  icon={<Copy className="size-4" />}
                  onClick={onCopyShareLink}
                  title="Copy share link"
                />
                <DialogActionButton
                  description="Copy a direct link that downloads the PDF version."
                  disabled={!canLinkActions}
                  icon={<FileDown className="size-4" />}
                  onClick={onCopyPdfLink}
                  title="Copy PDF download link"
                />
              </DialogActionSection>

              <DialogActionSection
                description="Move a resume between workspaces or keep a review copy with tracked changes."
                title="Backup & review"
              >
                <DialogActionButton
                  description="Download a backup file that keeps the current resume data and review history."
                  disabled={!canLinkActions}
                  icon={<FileDown className="size-4" />}
                  onClick={onExportJson}
                  title="Backup file"
                />
                <DialogActionButton
                  description="Import a backup file into this workspace as a tracked review copy."
                  icon={<FileUp className="size-4" />}
                  onClick={onImportJson}
                  title="Import review copy"
                />
              </DialogActionSection>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DialogActionSection({
  children,
  description,
  title
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function DialogActionButton({
  description,
  disabled = false,
  icon,
  onClick,
  title
}: {
  description: string;
  disabled?: boolean;
  icon: ReactNode;
  onClick: () => void | Promise<void>;
  title: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => void onClick()}
      className="flex w-full items-start gap-3 rounded-2xl border border-border bg-background p-4 text-left transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40"
    >
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span>
      </span>
    </button>
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
    <StyledTooltip label={ariaLabel} side="bottom">
      <button
        type="button"
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => void onClick()}
        className={`inline-flex size-8 items-center justify-center rounded-md text-sm transition-colors ${
          active
            ? variant === 'ghost'
              ? 'bg-primary/10 text-primary hover:bg-primary/15'
              : 'border border-primary/30 bg-primary/10 text-primary'
            : variant === 'ghost'
              ? 'text-foreground hover:bg-accent hover:text-accent-foreground'
              : 'border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground'
        } disabled:pointer-events-none disabled:opacity-40`}
      >
        {children}
      </button>
    </StyledTooltip>
  );
}
