import type { ReactNode } from 'react';
import { AppWindow, Download, FileCode2, Minus, Plus } from 'lucide-react';
import type { CvFile, CvFileSections } from '@rendercv/contracts';
import { downloadBlob } from '../features/viewer/download';
import { useViewerRenderer } from '../features/viewer/use-viewer-renderer';

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
  viewer,
  onOpenPopup,
  showHeader = true
}: {
  fileName: string;
  sections?: CvFileSections;
  viewer: ViewerRenderer;
  onOpenPopup?: () => void;
  showHeader?: boolean;
}) {
  return (
    <div className={`flex h-full flex-col ${showHeader ? 'gap-4 p-6' : ''}`}>
      {showHeader ? (
        <PreviewPaneHeader fileName={fileName} onOpenPopup={onOpenPopup} sections={sections} viewer={viewer} />
      ) : null}
      <PreviewCanvas fileName={fileName} viewer={viewer} workspaceInset={!showHeader} />
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
