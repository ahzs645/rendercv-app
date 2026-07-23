import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useRef, useState } from 'react';
import type { RefObject, ReactNode } from 'react';
import {
  AppWindow,
  Bold,
  ChevronDown,
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
  Send,
  Share2,
  SlidersHorizontal,
  Sun,
  Undo2,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { CvFile, CvFileSections } from '@rendercv/contracts';
import {
  fileStore,
  preferencesStore,
  readThemeName,
  readLocaleName,
  resolveFileSections,
  reviewStore
} from '@rendercv/core';
import { toast } from 'sonner';
import { downloadBlob } from '../features/viewer/download';
import { cvYamlToJson, cvYamlToMarkdown } from '../features/viewer/format-exports';
import { buildEncodedShareUrl, buildEncodedSharePdfUrl } from '../features/share/encoded-share';
import { buildSourceShareUrl, sectionsMatch } from './cv-url-import';
import { exportShareFile, importShareFile } from '../features/share/file-share';
import { ChangesDialog } from '../features/share/changes-dialog';
import {
  buildReviewProposalUrl,
  exportReviewProposalPackage,
  importReviewProposalPackage,
  ReviewProposalTooLargeError
} from '../features/review/package-utils';
import { ReviewerNameDialog } from '../features/review/reviewer-name-dialog';
import {
  buildProposalPackageFromSession,
  importReviewProposalIntoSession
} from '../features/review/session-utils';
import { useStore } from '../lib/use-store';
import { copyTextToClipboard } from '../lib/clipboard';
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
  const navigate = useNavigate();
  const preferences = useStore(preferencesStore);
  const fileSnapshot = useStore(fileStore);
  const reviewSnapshot = useStore(reviewStore);
  const prefersDark =
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark =
    preferences.colorMode === 'dark' || (preferences.colorMode === 'system' && prefersDark);

  const isReadOnly = Boolean(selectedFile?.isReadOnly);
  // The full file contents (no variant filtering, no viewer-only normalization).
  // Review round-trips and backups must operate on these so a returned proposal
  // still fingerprints back to this file and no hidden content is lost.
  const fileSections = selectedFile ? resolveFileSections(selectedFile) : undefined;
  const canFormat = preferences.yamlEditor && !isReadOnly;
  const canPreviewActions = Boolean(sections);
  const canLinkActions = Boolean(selectedFile && sections);
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
  const [changesOpen, setChangesOpen] = useState(false);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [reviewerDialogOpen, setReviewerDialogOpen] = useState(false);
  const showMobileEditorControls = mobilePane === 'editor';
  const hasSharedOrigin = Boolean(selectedFile?.sharedOrigin);
  const selectedReviewSession = selectedFile
    ? reviewSnapshot.sessions.find(
        (session) =>
          session.linkedFileId === selectedFile.id ||
          session.mergeDraft?.draftFileId === selectedFile.id
      )
    : undefined;
  const activeReviewProposal = selectedReviewSession?.activeProposalId
    ? selectedReviewSession.proposals.find(
        (proposal) => proposal.proposalId === selectedReviewSession.activeProposalId
      )
    : undefined;
  const canSendProposal = Boolean(
    selectedFile &&
      sections &&
      selectedReviewSession &&
      selectedReviewSession.mergeDraft?.draftFileId !== selectedFile.id
  );

  async function copyShareLink() {
    if (!selectedFile || !sections) {
      return;
    }

    try {
      // If this CV was opened from a public URL and hasn't been edited since,
      // share that source link directly — it's shorter and always reflects the
      // latest version. Any local edit falls back to the encoded snapshot link.
      if (
        selectedFile.sourceUrl &&
        selectedFile.sourceBaseline &&
        fileSections &&
        sectionsMatch(fileSections, selectedFile.sourceBaseline)
      ) {
        await navigator.clipboard.writeText(
          buildSourceShareUrl(selectedFile.sourceUrl, selectedFile.variantsSourceUrl)
        );
        toast.success('Source link copied.');
        return;
      }

      const result = await buildEncodedShareUrl({
        version: 1,
        fileName: selectedFile.name,
        sections
      });
      await navigator.clipboard.writeText(result.url);
      toast.success('Share link copied.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create share link.');
    }
  }

  async function copyReviewLink() {
    if (!selectedFile || !fileSections) {
      return;
    }

    try {
      // Review copies carry the full file (not the variant-filtered view): the
      // returned proposal is fingerprinted against this file's full sections,
      // and merging must never silently drop variant-hidden content.
      const result = await buildEncodedShareUrl({
        version: 1,
        fileName: selectedFile.name,
        sections: fileSections,
        origin: fileSections
      });
      await navigator.clipboard.writeText(result.url);
      toast.success('Review link copied.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create review link.');
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

  async function downloadCvJson() {
    if (!sections) {
      return;
    }

    try {
      const json = cvYamlToJson(sections.cv);
      await downloadBlob(
        new Blob([json], { type: 'application/json' }),
        `${selectedFile?.name ?? 'RenderCV'}.json`
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to export JSON.');
    }
  }

  async function copyCvMarkdown() {
    if (!sections) {
      return;
    }

    try {
      const markdown = cvYamlToMarkdown(sections.cv);
      await navigator.clipboard.writeText(markdown);
      toast.success('Markdown copied to clipboard.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to copy Markdown.');
    }
  }

  // Copy the full YAML source currently shown in the editor. Selecting all and
  // copying by hand is awkward on mobile, so this gives a one-tap "copy the
  // entire thing" that works on both desktop and mobile.
  async function copyYamlSource() {
    const source = editorRef.current?.getValue() || sections?.[preferences.activeSection] || '';
    if (!source) {
      toast.error('Nothing to copy yet.');
      return;
    }

    try {
      await copyTextToClipboard(source);
      toast.success('YAML copied to clipboard.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to copy YAML.');
    }
  }

  async function downloadCvMarkdown() {
    if (!sections) {
      return;
    }

    try {
      const markdown = cvYamlToMarkdown(sections.cv);
      await downloadBlob(
        new Blob([markdown], { type: 'text/markdown' }),
        `${selectedFile?.name ?? 'RenderCV'}.md`
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to export Markdown.');
    }
  }

  async function exportJson() {
    if (!selectedFile || !fileSections) return;

    try {
      await exportShareFile({
        version: 1,
        fileName: selectedFile.name,
        sections: fileSections
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
        payload.fileName
      );

      const file = fileStore.createFile(fileName, {
        cv: payload.sections.cv,
        settings: payload.sections.settings,
        designs: { [designKey]: payload.sections.design },
        locales: { [localeKey]: payload.sections.locale },
        selectedTheme: designKey,
        selectedLocale: localeKey
      });

      reviewStore.ensureSession({
        linkedFileId: file.id,
        baseFileName: fileName,
        rootBaselineSections: payload.sections
      });

      toast.success(`Imported "${fileName}" as a review copy. Edit it, then send a proposal back.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to import file.');
    }
  }

  async function importReviewPackage() {
    try {
      const payload = await importReviewProposalPackage();
      if (!payload) {
        return;
      }

      const session = importReviewProposalIntoSession(payload);
      setDownloadDialogOpen(false);
      toast.success(`Imported review proposal from ${payload.reviewerName}.`);
      navigate(`/review/${session.sessionId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to import review proposal.');
    }
  }

  async function handleReviewerConfirm(reviewerName: string, note?: string) {
    if (!selectedFile || !fileSections || !canSendProposal || !selectedReviewSession) {
      return;
    }

    preferencesStore.patch({ reviewDisplayName: reviewerName });
    const proposalPackage = reviewStore.createProposalPackage({
      sessionId: selectedReviewSession.sessionId,
      linkedFileId: selectedFile.id,
      fileName: selectedFile.name,
      proposedSections: fileSections,
      reviewerName,
      note
    });

    try {
      const url = await buildReviewProposalUrl(proposalPackage);
      await navigator.clipboard.writeText(url);
      toast.success(activeReviewProposal ? 'Updated proposal link copied.' : 'Review proposal link copied.');
    } catch (error) {
      if (error instanceof ReviewProposalTooLargeError) {
        await exportReviewProposalPackage(proposalPackage);
        toast.warning('Proposal was too large for a link, so a review package file was downloaded instead.');
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to create review proposal.');
      }
    } finally {
      setReviewerDialogOpen(false);
    }
  }

  async function exportReviewPackage() {
    if (!selectedReviewSession || !activeReviewProposal) {
      toast.error('There is no active review proposal to export.');
      return;
    }

    const proposalPackage = buildProposalPackageFromSession(
      selectedReviewSession.sessionId,
      activeReviewProposal.proposalId
    );
    if (!proposalPackage) {
      toast.error('Active review proposal is no longer available.');
      return;
    }

    await exportReviewProposalPackage(proposalPackage);
    toast.success('Review proposal package downloaded.');
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
          {!isReadOnly ? (
            <>
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
            </>
          ) : null}
          <Dialog.Root open={mobileActionsOpen} onOpenChange={setMobileActionsOpen}>
            <Dialog.Trigger asChild>
              <ToolbarIconButton
                ariaLabel="More actions"
                dataOnboarding="share-controls"
                onClick={() => setMobileActionsOpen(true)}
              >
                <SlidersHorizontal className="size-4" />
              </ToolbarIconButton>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="dialog-overlay-anim fixed inset-0 z-40 bg-background/50 backdrop-blur-[2px]" />
              <Dialog.Content className="dialog-content-sheet fixed inset-x-3 bottom-3 z-50 max-h-[80dvh] overflow-auto rounded-[2rem] border border-border bg-background p-5 shadow-2xl outline-none">
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
                      {!isReadOnly ? (
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
                      ) : null}
                      {preferences.yamlEditor ? (
                        <MobileSheetButton
                          className="w-full"
                          label="Copy YAML"
                          onClick={() => {
                            setMobileActionsOpen(false);
                            void copyYamlSource();
                          }}
                        >
                          <Copy className="size-4" />
                        </MobileSheetButton>
                      ) : null}
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
            <div className="ml-auto flex items-center gap-2">
              {preferences.yamlEditor ? (
                <ToolbarIconButton ariaLabel="Copy YAML source" onClick={() => void copyYamlSource()}>
                  <Copy className="size-4" />
                </ToolbarIconButton>
              ) : null}
              <YamlToggle
                checked={preferences.yamlEditor}
                className="h-11 px-3"
                label="YAML"
                onChange={() => preferencesStore.patch({ yamlEditor: !preferences.yamlEditor })}
              />
            </div>
          ) : (
            <div className="ml-auto flex h-11 items-center gap-1 rounded-xl border border-border bg-card px-1.5">
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
          )}
        </div>
        <DownloadShareDialog
          canLinkActions={canLinkActions}
          canPreviewActions={canPreviewActions}
          canReviewActions={canSendProposal}
          fileName={selectedFile?.name}
          onCopyMarkdown={() => void copyCvMarkdown()}
          onCopyPdfLink={() => void copyPdfLink()}
          onCopyReviewLink={() => void copyReviewLink()}
          onCopyShareLink={() => void copyShareLink()}
          onDownloadJson={() => void downloadCvJson()}
          onDownloadMarkdown={() => void downloadCvMarkdown()}
          onDownloadPdf={() => void downloadPdf()}
          onDownloadTypst={() => void downloadTypst()}
          onExportJson={() => void exportJson()}
          onExportReviewPackage={() => void exportReviewPackage()}
          onImportJson={() => void importJson()}
          onImportReviewPackage={() => void importReviewPackage()}
          onOpenChange={setDownloadDialogOpen}
          onSendProposal={() => {
            setDownloadDialogOpen(false);
            setReviewerDialogOpen(true);
          }}
          onSharePdf={() => void sharePdf()}
          sendProposalLabel={activeReviewProposal ? 'Send updated proposal' : 'Send proposal'}
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
    <div className="flex min-h-12 flex-nowrap items-center justify-between gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex shrink-0 flex-nowrap items-center gap-1.5">
        <ToolbarIconButton
          active={!sidebarCollapsed}
          ariaLabel={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
          onClick={onToggleSidebar}
        >
          <PanelLeft className="size-4" />
        </ToolbarIconButton>
        <div className="mr-1 hidden max-w-32 min-w-0 xl:block">
          <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {selectedFile?.name ?? 'RenderCV'}
          </p>
        </div>
        {!isReadOnly ? (
          <>
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
          </>
        ) : null}
        <YamlToggle
          checked={preferences.yamlEditor}
          label="YAML"
          onChange={() => preferencesStore.patch({ yamlEditor: !preferences.yamlEditor })}
        />
        {preferences.yamlEditor ? (
          <ToolbarIconButton ariaLabel="Copy YAML source" onClick={() => void copyYamlSource()}>
            <Copy className="size-4" />
          </ToolbarIconButton>
        ) : null}
        {!isReadOnly ? <WorkspaceAiEditor fileId={selectedFile?.id} sections={sections} /> : null}
      </div>
      <div className="flex shrink-0 flex-nowrap items-center gap-1.5">
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
        </ToolbarControlGroup>
        <ShareComboButton
          dataOnboarding="share-controls"
          disabled={!canLinkActions}
          menuOpen={shareMenuOpen}
          onCopyPdfLink={() => void copyPdfLink()}
          onCopyReviewLink={() => void copyReviewLink()}
          onCopyShareLink={() => void copyShareLink()}
          onMenuOpenChange={setShareMenuOpen}
          onOpenShareDialog={() => setDownloadDialogOpen(true)}
          onSharePdf={() => void sharePdf()}
        />
        <DownloadComboButton
          dataOnboarding="data-export"
          disabled={!canPreviewActions}
          menuOpen={downloadMenuOpen}
          onCopyMarkdown={() => void copyCvMarkdown()}
          onDownloadJson={() => void downloadCvJson()}
          onDownloadMarkdown={() => void downloadCvMarkdown()}
          onDownloadPdf={() => void downloadPdf()}
          onDownloadTypst={() => void downloadTypst()}
          onMenuOpenChange={setDownloadMenuOpen}
          onOpenExportDialog={() => setDownloadDialogOpen(true)}
        />
        {hasSharedOrigin && sections ? (
          <ToolbarControlGroup>
            <ToolbarIconButton
              ariaLabel="View changes from original"
              active={changesOpen}
              onClick={() => setChangesOpen(true)}
              variant="ghost"
            >
              <GitCompareArrows className="size-4" />
            </ToolbarIconButton>
          </ToolbarControlGroup>
        ) : null}
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
        canReviewActions={canSendProposal}
        fileName={selectedFile?.name}
        onCopyMarkdown={() => void copyCvMarkdown()}
        onCopyPdfLink={() => void copyPdfLink()}
        onCopyReviewLink={() => void copyReviewLink()}
        onCopyShareLink={() => void copyShareLink()}
        onDownloadJson={() => void downloadCvJson()}
        onDownloadMarkdown={() => void downloadCvMarkdown()}
        onDownloadPdf={() => void downloadPdf()}
        onDownloadTypst={() => void downloadTypst()}
        onExportJson={() => void exportJson()}
        onExportReviewPackage={() => void exportReviewPackage()}
        onImportJson={() => void importJson()}
        onImportReviewPackage={() => void importReviewPackage()}
        onOpenChange={setDownloadDialogOpen}
        onSendProposal={() => {
          setDownloadDialogOpen(false);
          setReviewerDialogOpen(true);
        }}
        onSharePdf={() => void sharePdf()}
        sendProposalLabel={activeReviewProposal ? 'Send updated proposal' : 'Send proposal'}
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
      <ReviewerNameDialog
        confirmLabel={activeReviewProposal ? 'Forward proposal' : 'Send proposal'}
        description="Add the name that should appear on the review proposal package."
        initialName={preferences.reviewDisplayName}
        onConfirm={(name, note) => void handleReviewerConfirm(name, note)}
        onOpenChange={setReviewerDialogOpen}
        open={reviewerDialogOpen}
        title="Reviewer name"
      />
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
    <div className="inline-flex h-11 min-w-0 flex-1 items-center rounded-xl border border-border bg-background p-1">
      <button
        type="button"
        className={`flex h-full flex-1 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors ${
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
        className={`flex h-full flex-1 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors ${
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
  className = 'ml-1 px-2.5 py-1.5',
  label,
  onChange
}: {
  checked: boolean;
  className?: string;
  label: string;
  onChange: () => void;
}) {
  return (
    <div className={`flex items-center gap-2 rounded-md border border-border bg-background ${className}`}>
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

function ShareComboButton({
  dataOnboarding,
  disabled = false,
  menuOpen,
  onCopyPdfLink,
  onCopyReviewLink,
  onCopyShareLink,
  onMenuOpenChange,
  onOpenShareDialog,
  onSharePdf
}: {
  dataOnboarding?: string;
  disabled?: boolean;
  menuOpen: boolean;
  onCopyPdfLink: () => void | Promise<void>;
  onCopyReviewLink: () => void | Promise<void>;
  onCopyShareLink: () => void | Promise<void>;
  onMenuOpenChange: (open: boolean) => void;
  onOpenShareDialog: () => void;
  onSharePdf: () => void | Promise<void>;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function onClickOutside(event: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(event.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(event.target as Node)
      ) {
        onMenuOpenChange(false);
      }
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onMenuOpenChange(false);
      }
    }

    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [menuOpen, onMenuOpenChange]);

  return (
    <div
      className="relative flex items-center rounded-xl border border-border bg-background p-1 shadow-sm"
      data-onboarding={dataOnboarding}
    >
      <button
        type="button"
        aria-label="Share PDF"
        disabled={disabled}
        onClick={() => void onSharePdf()}
        className="inline-flex h-8 items-center gap-2 rounded-l-md px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        <Share2 className="size-4" />
        <span className="whitespace-nowrap">Share</span>
      </button>
      <button
        ref={triggerRef}
        type="button"
        aria-label="More share options"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        disabled={disabled}
        onClick={() => onMenuOpenChange(!menuOpen)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-r-md border-l border-border text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronDown className="size-3.5" />
      </button>
      {menuOpen ? (
        <div
          ref={menuRef}
          className="absolute right-0 top-full z-50 mt-1 min-w-52 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
          role="menu"
        >
          <ToolbarMenuItem
            icon={<Share2 className="size-4" />}
            label="Share PDF"
            onClick={() => {
              onMenuOpenChange(false);
              void onSharePdf();
            }}
          />
          <ToolbarMenuItem
            icon={<Copy className="size-4" />}
            label="Copy share link"
            onClick={() => {
              onMenuOpenChange(false);
              void onCopyShareLink();
            }}
          />
          <ToolbarMenuItem
            icon={<GitCompareArrows className="size-4" />}
            label="Copy review link"
            onClick={() => {
              onMenuOpenChange(false);
              void onCopyReviewLink();
            }}
          />
          <ToolbarMenuItem
            icon={<FileDown className="size-4" />}
            label="Copy PDF download link"
            onClick={() => {
              onMenuOpenChange(false);
              void onCopyPdfLink();
            }}
          />
          <div className="my-1 h-px bg-border/60" />
          <ToolbarMenuItem
            icon={<Share2 className="size-4" />}
            label="More share options"
            onClick={() => {
              onMenuOpenChange(false);
              onOpenShareDialog();
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function DownloadComboButton({
  dataOnboarding,
  disabled = false,
  menuOpen,
  onCopyMarkdown,
  onDownloadJson,
  onDownloadMarkdown,
  onDownloadPdf,
  onDownloadTypst,
  onMenuOpenChange,
  onOpenExportDialog
}: {
  dataOnboarding?: string;
  disabled?: boolean;
  menuOpen: boolean;
  onCopyMarkdown: () => void | Promise<void>;
  onDownloadJson: () => void | Promise<void>;
  onDownloadMarkdown: () => void | Promise<void>;
  onDownloadPdf: () => void | Promise<void>;
  onDownloadTypst: () => void | Promise<void>;
  onMenuOpenChange: (open: boolean) => void;
  onOpenExportDialog: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function onClickOutside(event: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(event.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(event.target as Node)
      ) {
        onMenuOpenChange(false);
      }
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onMenuOpenChange(false);
      }
    }

    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [menuOpen, onMenuOpenChange]);

  return (
    <div
      className="relative flex items-center rounded-xl border border-border bg-background p-1 shadow-sm"
      data-onboarding={dataOnboarding}
    >
      <button
        type="button"
        aria-label="Download PDF"
        disabled={disabled}
        onClick={() => void onDownloadPdf()}
        className="inline-flex h-8 items-center gap-2 rounded-l-md px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        <Download className="size-4" />
        <span className="whitespace-nowrap">Download</span>
      </button>
      <button
        ref={triggerRef}
        type="button"
        aria-label="More download options"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        disabled={disabled}
        onClick={() => onMenuOpenChange(!menuOpen)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-r-md border-l border-border text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronDown className="size-3.5" />
      </button>
      {menuOpen ? (
        <div
          ref={menuRef}
          className="absolute right-0 top-full z-50 mt-1 min-w-48 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
          role="menu"
        >
          <ToolbarMenuItem
            icon={<Download className="size-4" />}
            label="Download PDF"
            onClick={() => {
              onMenuOpenChange(false);
              void onDownloadPdf();
            }}
          />
          <ToolbarMenuItem
            icon={<FileCode2 className="size-4" />}
            label="Download source (.typ)"
            onClick={() => {
              onMenuOpenChange(false);
              void onDownloadTypst();
            }}
          />
          <ToolbarMenuItem
            icon={<FileDown className="size-4" />}
            label="Download JSON"
            onClick={() => {
              onMenuOpenChange(false);
              void onDownloadJson();
            }}
          />
          <ToolbarMenuItem
            icon={<FileDown className="size-4" />}
            label="Download Markdown"
            onClick={() => {
              onMenuOpenChange(false);
              void onDownloadMarkdown();
            }}
          />
          <ToolbarMenuItem
            icon={<Copy className="size-4" />}
            label="Copy as Markdown"
            onClick={() => {
              onMenuOpenChange(false);
              void onCopyMarkdown();
            }}
          />
          <div className="my-1 h-px bg-border/60" />
          <ToolbarMenuItem
            icon={<FileDown className="size-4" />}
            label="More export options"
            onClick={() => {
              onMenuOpenChange(false);
              onOpenExportDialog();
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function ToolbarMenuItem({
  icon,
  label,
  onClick
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs text-popover-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function DownloadShareDialog({
  canLinkActions,
  canPreviewActions,
  canReviewActions,
  fileName,
  onCopyMarkdown,
  onCopyPdfLink,
  onCopyReviewLink,
  onCopyShareLink,
  onDownloadJson,
  onDownloadMarkdown,
  onDownloadPdf,
  onDownloadTypst,
  onExportJson,
  onExportReviewPackage,
  onImportJson,
  onImportReviewPackage,
  onOpenChange,
  onSendProposal,
  onSharePdf,
  sendProposalLabel,
  open
}: {
  canLinkActions: boolean;
  canPreviewActions: boolean;
  canReviewActions: boolean;
  fileName?: string;
  onCopyMarkdown: () => void | Promise<void>;
  onCopyPdfLink: () => void | Promise<void>;
  onCopyReviewLink: () => void | Promise<void>;
  onCopyShareLink: () => void | Promise<void>;
  onDownloadJson: () => void | Promise<void>;
  onDownloadMarkdown: () => void | Promise<void>;
  onDownloadPdf: () => void | Promise<void>;
  onDownloadTypst: () => void | Promise<void>;
  onExportJson: () => void | Promise<void>;
  onExportReviewPackage: () => void | Promise<void>;
  onImportJson: () => void | Promise<void>;
  onImportReviewPackage: () => void | Promise<void>;
  onOpenChange: (open: boolean) => void;
  onSendProposal: () => void | Promise<void>;
  onSharePdf: () => void | Promise<void>;
  sendProposalLabel: string;
  open: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay-anim fixed inset-0 z-40 bg-background/60 backdrop-blur-[2px]" />
        <Dialog.Content className="dialog-content-fade fixed inset-x-4 top-1/2 z-50 max-h-[85vh] -translate-y-1/2 overflow-hidden rounded-3xl border border-border bg-background shadow-2xl outline-none md:left-1/2 md:w-[min(860px,calc(100vw-3rem))] md:-translate-x-1/2">
          <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
            <div className="min-w-0">
              <Dialog.Title className="text-lg font-semibold text-foreground">
                Share and export
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Export {fileName ?? 'this resume'}, copy links, or exchange review packages.
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
            <div className="grid gap-4 lg:grid-cols-2">
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
                <DialogActionButton
                  description="Save the CV data as JSON for programmatic use."
                  disabled={!canPreviewActions}
                  icon={<FileDown className="size-4" />}
                  onClick={onDownloadJson}
                  title="Export JSON"
                />
                <DialogActionButton
                  description="Save a plain-text Markdown version of the CV."
                  disabled={!canPreviewActions}
                  icon={<FileDown className="size-4" />}
                  onClick={onDownloadMarkdown}
                  title="Export Markdown"
                />
                <DialogActionButton
                  description="Copy the CV as Markdown to paste into emails or docs."
                  disabled={!canPreviewActions}
                  icon={<Copy className="size-4" />}
                  onClick={onCopyMarkdown}
                  title="Copy as Markdown"
                />
              </DialogActionSection>

              <DialogActionSection
                description="Links for viewing, editing a review copy, or downloading a PDF."
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
                  description="Copy an editable copy. The recipient can make changes and send a proposal back."
                  disabled={!canLinkActions}
                  icon={<GitCompareArrows className="size-4" />}
                  onClick={onCopyReviewLink}
                  title="Copy review-copy link"
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
                description="Move a resume between browsers or keep a local backup for later edits."
                title="Backup files"
              >
                <DialogActionButton
                  description="Download a backup file with the current resume contents."
                  disabled={!canLinkActions}
                  icon={<FileDown className="size-4" />}
                  onClick={onExportJson}
                  title="Backup file"
                />
                <DialogActionButton
                  description="Import a backup or review-copy file into this workspace."
                  icon={<FileUp className="size-4" />}
                  onClick={onImportJson}
                  title="Import backup or review copy"
                />
              </DialogActionSection>
              <DialogActionSection
                description="Use these after a review copy has been edited or when someone sends a proposal back."
                title="Review proposals"
              >
                <DialogActionButton
                  description="Package the current edits as a proposal and copy a link when it fits."
                  disabled={!canReviewActions}
                  icon={<Send className="size-4" />}
                  onClick={onSendProposal}
                  title={sendProposalLabel}
                />
                <DialogActionButton
                  description="Download the active proposal as a file when a link is too large or files are preferred."
                  disabled={!canReviewActions}
                  icon={<FileDown className="size-4" />}
                  onClick={onExportReviewPackage}
                  title="Export review package"
                />
                <DialogActionButton
                  description="Import a returned review proposal into the local review inbox."
                  icon={<FileUp className="size-4" />}
                  onClick={onImportReviewPackage}
                  title="Import review package"
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
  dataOnboarding,
  disabled = false,
  onClick,
  variant = 'default'
}: {
  active?: boolean;
  ariaLabel: string;
  children: ReactNode;
  dataOnboarding?: string;
  disabled?: boolean;
  onClick: () => void | Promise<void>;
  variant?: 'default' | 'ghost';
}) {
  return (
    <StyledTooltip label={ariaLabel} side="bottom">
      <button
        type="button"
        aria-label={ariaLabel}
        data-onboarding={dataOnboarding}
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
