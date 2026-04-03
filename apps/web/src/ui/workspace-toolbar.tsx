import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import type { RefObject, ReactNode } from 'react';
import {
  AppWindow,
  Bold,
  ChevronsDownUp,
  Copy,
  Download,
  FileCode2,
  FileDown,
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
  Undo2
} from 'lucide-react';
import type { CvFile, CvFileSections } from '@rendercv/contracts';
import { fileStore, preferencesStore } from '@rendercv/core';
import { toast } from 'sonner';
import { downloadBlob } from '../features/viewer/download';
import { buildEncodedShareUrl, buildEncodedSharePdfUrl } from '../features/share/encoded-share';
import { useStore } from '../lib/use-store';
import type { MonacoEditorHandle } from './monaco-editor';
import type { ViewerRenderer } from './preview-pane';
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
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);

  async function copyShareLink() {
    if (!selectedFile || !sections) {
      return;
    }

    try {
      const url = await buildEncodedShareUrl({
        version: 1,
        fileName: selectedFile.name,
        sections
      });
      await navigator.clipboard.writeText(url);
      toast.success('Share link copied.');
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
                          className="min-w-12 rounded-md px-2 py-1 text-sm text-foreground disabled:pointer-events-none disabled:opacity-40"
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
                        disabled={!canPreviewActions}
                        label="Download PDF"
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
                      </MobileSheetButton>
                      <MobileSheetButton
                        disabled={!canPreviewActions}
                        label="Download Typst"
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
                      </MobileSheetButton>
                      <MobileSheetButton
                        disabled={!canPreviewActions}
                        label="Share PDF"
                        onClick={sharePdf}
                      >
                        <Share2 className="size-4" />
                      </MobileSheetButton>
                      <MobileSheetButton
                        disabled={!selectedFile || !sections}
                        label="Copy share link"
                        onClick={() => void copyShareLink()}
                      >
                        <Copy className="size-4" />
                      </MobileSheetButton>
                      <MobileSheetButton
                        disabled={!selectedFile || !sections}
                        label="Copy PDF link"
                        onClick={() => void copyPdfLink()}
                      >
                        <FileDown className="size-4" />
                      </MobileSheetButton>
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
                    </div>
                  </section>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>

        <div className="flex items-center gap-2">
          <MobilePaneSwitch activePane={mobilePane} onChange={onMobilePaneChange} />
          <div className="ml-auto">
            <YamlToggle
              checked={preferences.yamlEditor}
              label="YAML"
              onChange={() => preferencesStore.patch({ yamlEditor: !preferences.yamlEditor })}
            />
          </div>
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
                className="min-w-12 rounded-md px-2 py-1 text-sm text-foreground disabled:pointer-events-none disabled:opacity-40"
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
            className="min-w-12 rounded-md px-2 py-1 text-sm text-foreground disabled:pointer-events-none disabled:opacity-40"
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
          ariaLabel="Copy share link"
          disabled={!selectedFile || !sections}
          onClick={() => void copyShareLink()}
        >
          <Copy className="size-4" />
        </ToolbarIconButton>
        <ToolbarIconButton
          ariaLabel="Copy PDF download link"
          disabled={!selectedFile || !sections}
          onClick={() => void copyPdfLink()}
        >
          <FileDown className="size-4" />
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
  disabled = false,
  label,
  onClick
}: {
  children: ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void | Promise<void>;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => void onClick()}
      className="inline-flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card px-3 py-4 text-center text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
      <span>{label}</span>
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
