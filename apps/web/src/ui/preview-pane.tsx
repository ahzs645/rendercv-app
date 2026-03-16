import type { ReactNode } from 'react';
import { AppWindow, Copy, Download, FileCode2, Minus, Moon, Plus, Share2, Sun } from 'lucide-react';
import type { CvFile, CvFileSections } from '@rendercv/contracts';
import { fileStore, preferencesStore } from '@rendercv/core';
import { downloadBlob } from '../features/viewer/download';
import { useViewerRenderer } from '../features/viewer/use-viewer-renderer';
import { useStore } from '../lib/use-store';

export type ViewerRenderer = ReturnType<typeof useViewerRenderer>;

export function PreviewPane({
  fileName,
  sections,
  onOpenPopup,
  showHeader = true
}: {
  fileName: string;
  sections?: CvFileSections;
  onOpenPopup?: () => void;
  showHeader?: boolean;
}) {
  const viewer = useViewerRenderer(sections);

  return (
    <PreviewPaneView
      fileName={fileName}
      sections={sections}
      viewer={viewer}
      onOpenPopup={onOpenPopup}
      showHeader={showHeader}
    />
  );
}

export function PreviewPaneView({
  fileName,
  sections,
  selectedFile,
  viewer,
  onOpenPopup,
  showHeader = true
}: {
  fileName: string;
  sections?: CvFileSections;
  selectedFile?: CvFile;
  viewer: ViewerRenderer;
  onOpenPopup?: () => void;
  showHeader?: boolean;
}) {
  const isWorkspacePreview = !showHeader;

  return (
    <div className={`flex h-full flex-col ${showHeader ? 'gap-4 p-6' : ''}`}>
      {showHeader ? (
        <PreviewPaneHeader fileName={fileName} onOpenPopup={onOpenPopup} sections={sections} viewer={viewer} />
      ) : null}
      {isWorkspacePreview ? (
        <PreviewPaneToolbar
          fileName={fileName}
          onOpenPopup={onOpenPopup}
          sections={sections}
          selectedFile={selectedFile}
          viewer={viewer}
        />
      ) : null}
      <PreviewCanvas fileName={fileName} viewer={viewer} workspaceInset={isWorkspacePreview} />
    </div>
  );
}

function PreviewCanvas({
  fileName,
  viewer,
  workspaceInset
}: {
  fileName: string;
  viewer: ViewerRenderer;
  workspaceInset: boolean;
}) {
  const shellClassName = workspaceInset
    ? 'min-h-0 flex-1 p-6 pt-4'
    : 'min-h-0 flex-1';

  return (
    <div className={shellClassName}>
      <div className="h-full overflow-auto rounded-2xl border border-border bg-sidebar p-6">
        {viewer.initError ? (
          <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{viewer.initError}</div>
        ) : viewer.renderErrors.length > 0 ? (
          <div className="space-y-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
            {viewer.renderErrors.map((error, index) => (
              <p key={`${error.message}-${index}`}>{error.message}</p>
            ))}
          </div>
        ) : viewer.svgPages.length > 0 ? (
          <div className="mx-auto flex max-w-4xl flex-col gap-6" style={{ width: `${viewer.zoomFactor * 100}%` }}>
            {viewer.svgPages.map((page, index) => (
              <div key={page} className="overflow-hidden rounded-sm bg-white shadow-2xl">
                <img
                  src={page}
                  alt={`${fileName} page ${index + 1}`}
                  draggable={false}
                  className="block h-auto w-full"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="mx-auto flex aspect-[8.5/11] max-w-3xl items-center justify-center rounded-sm bg-white shadow-2xl">
            <p className="text-sm text-muted-foreground">
              {viewer.isInitializing ? 'Initializing render pipeline…' : 'Rendering preview…'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewPaneHeader({
  fileName,
  sections,
  viewer,
  onOpenPopup
}: {
  fileName: string;
  sections?: CvFileSections;
  viewer: ViewerRenderer;
  onOpenPopup?: () => void;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Preview</p>
        <h2 className="mt-2 text-2xl font-semibold">{fileName}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Rendered with the ported Pyodide and Typst workers.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <PreviewButton label="Zoom out" onClick={viewer.zoomOut}>
          <Minus className="size-4" />
        </PreviewButton>
        <button
          className="rounded-xl border border-border px-3 py-2 text-sm"
          onClick={viewer.zoomReset}
          type="button"
        >
          {viewer.zoomPercent}%
        </button>
        <PreviewButton label="Zoom in" onClick={viewer.zoomIn}>
          <Plus className="size-4" />
        </PreviewButton>
        <PreviewButton
          label="Download PDF"
          onClick={async () => {
            if (!sections) return;
            const bytes = await viewer.renderToPdf(sections);
            if (!bytes) return;
            await downloadBlob(new Blob([bytes as BlobPart], { type: 'application/pdf' }), `${fileName}.pdf`);
          }}
        >
          <Download className="size-4" />
        </PreviewButton>
        <PreviewButton
          label="Download Typst"
          onClick={async () => {
            if (!sections) return;
            const typst = await viewer.renderToTypst(sections);
            if (!typst) return;
            await downloadBlob(new Blob([typst], { type: 'application/octet-stream' }), `${fileName}.typ`);
          }}
        >
          <FileCode2 className="size-4" />
        </PreviewButton>
        {onOpenPopup ? (
          <PreviewButton label="Popup preview" onClick={onOpenPopup}>
            <AppWindow className="size-4" />
          </PreviewButton>
        ) : null}
      </div>
    </header>
  );
}

function PreviewPaneToolbar({
  fileName,
  sections,
  selectedFile,
  viewer,
  onOpenPopup
}: {
  fileName: string;
  sections?: CvFileSections;
  selectedFile?: CvFile;
  viewer: ViewerRenderer;
  onOpenPopup?: () => void;
}) {
  const preferences = useStore(preferencesStore);
  const prefersDark =
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark =
    preferences.colorMode === 'dark' || (preferences.colorMode === 'system' && prefersDark);
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
    const file = new File([blob], `${fileName}.pdf`, { type: 'application/pdf' });

    try {
      if (navigator.canShare?.({ files: [file] }) && typeof navigator.share === 'function') {
        await navigator.share({ title: fileName, files: [file] });
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
    }

    await downloadBlob(blob, `${fileName}.pdf`);
  }

  return (
    <div className="shrink-0 border-b border-border bg-background px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Preview</p>
          <p className="truncate text-sm text-foreground">{fileName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1">
            <PreviewBarButton
              label="Zoom out"
              disabled={!canPreviewActions}
              variant="ghost"
              onClick={viewer.zoomOut}
            >
              <Minus className="size-4" />
            </PreviewBarButton>
            <button
              type="button"
              className="min-w-12 rounded-md px-2 py-1 text-sm text-foreground disabled:pointer-events-none disabled:opacity-40"
              disabled={!canPreviewActions}
              onClick={viewer.zoomReset}
            >
              {viewer.zoomPercent}%
            </button>
            <PreviewBarButton
              label="Zoom in"
              disabled={!canPreviewActions}
              variant="ghost"
              onClick={viewer.zoomIn}
            >
              <Plus className="size-4" />
            </PreviewBarButton>
          </div>
          <PreviewBarButton
            label="Popup preview"
            disabled={!canPreviewActions || !onOpenPopup}
            onClick={() => onOpenPopup?.()}
          >
            <AppWindow className="size-4" />
          </PreviewBarButton>
          <PreviewBarButton
            label="Download PDF"
            disabled={!canPreviewActions}
            onClick={async () => {
              if (!sections) return;
              const bytes = await viewer.renderToPdf(sections);
              if (!bytes) return;
              await downloadBlob(
                new Blob([bytes as BlobPart], { type: 'application/pdf' }),
                `${fileName}.pdf`
              );
            }}
          >
            <Download className="size-4" />
          </PreviewBarButton>
          <PreviewBarButton
            label="Download Typst"
            disabled={!canPreviewActions}
            onClick={async () => {
              if (!sections) return;
              const typst = await viewer.renderToTypst(sections);
              if (!typst) return;
              await downloadBlob(
                new Blob([typst], { type: 'application/octet-stream' }),
                `${fileName}.typ`
              );
            }}
          >
            <FileCode2 className="size-4" />
          </PreviewBarButton>
          <PreviewBarButton
            label="Share PDF"
            disabled={!canPreviewActions}
            onClick={sharePdf}
          >
            <Share2 className="size-4" />
          </PreviewBarButton>
          <PreviewBarButton
            label="Copy public link"
            disabled={!selectedFile}
            onClick={() => void copyPublicLink()}
          >
            <Copy className="size-4" />
          </PreviewBarButton>
          <PreviewBarButton
            label="Toggle color mode"
            onClick={() => preferencesStore.patch({ colorMode: isDark ? 'light' : 'dark' })}
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </PreviewBarButton>
        </div>
      </div>
    </div>
  );
}

function PreviewButton({
  children,
  label,
  onClick
}: {
  children: ReactNode;
  label: string;
  onClick: () => void | Promise<void>;
}) {
  return (
    <button
      className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm"
      onClick={() => void onClick()}
      aria-label={label}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

function PreviewBarButton({
  children,
  disabled = false,
  label,
  onClick,
  variant = 'default'
}: {
  children: ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void | Promise<void>;
  variant?: 'default' | 'ghost';
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => void onClick()}
      className={`inline-flex size-8 items-center justify-center rounded-md text-sm transition-colors ${
        variant === 'ghost'
          ? 'hover:bg-accent hover:text-accent-foreground'
          : 'border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground'
      } disabled:pointer-events-none disabled:opacity-40`}
    >
      {children}
    </button>
  );
}
