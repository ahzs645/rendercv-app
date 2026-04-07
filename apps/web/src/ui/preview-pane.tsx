import type { MouseEvent, ReactNode } from 'react';
import { AppWindow, Download, FileCode2, Minus, Plus } from 'lucide-react';
import type { CvFile, CvFileSections } from '@rendercv/contracts';
import { downloadBlob } from '../features/viewer/download';
import { useViewerRenderer } from '../features/viewer/use-viewer-renderer';

export type ViewerRenderer = ReturnType<typeof useViewerRenderer>;

export function PreviewPane({
  fileName,
  sections,
  onOpenPopup,
  showHeader = true,
  controls
}: {
  fileName: string;
  sections?: CvFileSections;
  onOpenPopup?: () => void;
  showHeader?: boolean;
  controls?: PreviewPaneControls;
}) {
  const viewer = useViewerRenderer(sections);

  return (
    <PreviewPaneView
      controls={controls}
      fileName={fileName}
      sections={sections}
      viewer={viewer}
      onOpenPopup={onOpenPopup}
      showHeader={showHeader}
    />
  );
}

export interface SectionWeight {
  key: string;
  weight: number;
}

export function PreviewPaneView({
  controls,
  fileName,
  sections,
  viewer,
  onOpenPopup,
  onSectionClick,
  sectionWeights,
  showHeader = true
}: {
  controls?: PreviewPaneControls;
  fileName: string;
  sections?: CvFileSections;
  viewer: ViewerRenderer;
  onOpenPopup?: () => void;
  onSectionClick?: (sectionKey: string, entryIndex: number) => void;
  sectionWeights?: SectionWeight[];
  showHeader?: boolean;
}) {
  return (
    <div className={`flex h-full flex-col ${showHeader ? 'gap-3 p-4 sm:gap-4 sm:p-6' : ''}`}>
      {showHeader ? (
        <PreviewPaneHeader
          controls={controls}
          fileName={fileName}
          onOpenPopup={onOpenPopup}
          sections={sections}
          viewer={viewer}
        />
      ) : null}
      <PreviewCanvas fileName={fileName} viewer={viewer} workspaceInset={!showHeader} onSectionClick={onSectionClick} sectionWeights={sectionWeights} />
    </div>
  );
}

export interface PreviewPaneControls {
  downloadPdf?: boolean;
  downloadTypst?: boolean;
  popup?: boolean;
}

interface SectionHit {
  sectionKey: string;
  entryIndex: number; // -1 = section heading / header area
}

/**
 * Map a click Y-position on a PDF page to a CV section and entry.
 *
 * Each section is assigned a vertical zone proportional to its entry count
 * (weight). The header gets a fixed share at the top, and each section heading
 * adds a small fixed overhead so single-entry sections still get a visible zone.
 * Within a section zone, the heading gets a small prefix and entries divide the
 * rest equally.
 */
function detectClickedSection(
  event: MouseEvent<HTMLDivElement>,
  sectionWeights: SectionWeight[],
  pageIndex: number,
  totalPages: number
): SectionHit | null {
  const rect = event.currentTarget.getBoundingClientRect();
  const yRatio = (event.clientY - rect.top) / rect.height;

  const HEADER_RATIO = 0.08;
  const HEADING_OVERHEAD = 0.6;

  const totalWeight = sectionWeights.reduce(
    (sum, s) => sum + s.weight + HEADING_OVERHEAD,
    0
  );

  const absoluteY = pageIndex + yRatio;

  if (absoluteY < HEADER_RATIO) {
    return { sectionKey: '__header__', entryIndex: -1 };
  }

  const contentStart = HEADER_RATIO;
  const contentLength = totalPages - HEADER_RATIO;

  let cursor = contentStart;
  for (const section of sectionWeights) {
    const sectionShare =
      ((section.weight + HEADING_OVERHEAD) / totalWeight) * contentLength;
    if (absoluteY < cursor + sectionShare) {
      // Within this section — determine which entry
      const posInSection = absoluteY - cursor;
      const headingShare = (HEADING_OVERHEAD / (section.weight + HEADING_OVERHEAD)) * sectionShare;
      if (posInSection < headingShare) {
        return { sectionKey: section.key, entryIndex: -1 };
      }
      const entryZone = sectionShare - headingShare;
      const entryIndex = Math.min(
        Math.floor(((posInSection - headingShare) / entryZone) * section.weight),
        section.weight - 1
      );
      return { sectionKey: section.key, entryIndex };
    }
    cursor += sectionShare;
  }

  const last = sectionWeights[sectionWeights.length - 1];
  return last ? { sectionKey: last.key, entryIndex: last.weight - 1 } : null;
}

function PreviewCanvas({
  fileName,
  viewer,
  workspaceInset,
  onSectionClick,
  sectionWeights
}: {
  fileName: string;
  viewer: ViewerRenderer;
  workspaceInset: boolean;
  onSectionClick?: (sectionKey: string, entryIndex: number) => void;
  sectionWeights?: SectionWeight[];
}) {
  const shellClassName = workspaceInset
    ? 'min-h-0 flex-1 p-4 pt-3 sm:p-6 sm:pt-4'
    : 'min-h-0 flex-1';

  const totalPages = viewer.svgPages.length;
  const hasClickHandler = onSectionClick && sectionWeights && sectionWeights.length > 0;

  return (
    <div className={shellClassName}>
      <div className="h-full overflow-auto rounded-2xl border border-border bg-sidebar p-3 sm:p-6">
        {viewer.initError ? (
          <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{viewer.initError}</div>
        ) : viewer.renderErrors.length > 0 ? (
          <div className="space-y-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
            {viewer.renderErrors.map((error, index) => (
              <p key={`${error.message}-${index}`}>{error.message}</p>
            ))}
          </div>
        ) : viewer.svgPages.length > 0 ? (
          <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:gap-6" style={{ width: `${viewer.zoomFactor * 100}%` }}>
            {viewer.svgPages.map((page, pageIndex) => (
              <div
                key={pageIndex}
                className={`overflow-hidden rounded-sm bg-white shadow-2xl${hasClickHandler ? ' cursor-pointer' : ''}`}
                onClick={
                  hasClickHandler
                    ? (event: MouseEvent<HTMLDivElement>) => {
                        const hit = detectClickedSection(event, sectionWeights, pageIndex, totalPages);
                        if (hit) onSectionClick(hit.sectionKey, hit.entryIndex);
                      }
                    : undefined
                }
              >
                <img
                  src={page}
                  alt={`${fileName} page ${pageIndex + 1}`}
                  draggable={false}
                  className="pointer-events-none block h-auto w-full"
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
  controls,
  fileName,
  sections,
  viewer,
  onOpenPopup
}: {
  controls?: PreviewPaneControls;
  fileName: string;
  sections?: CvFileSections;
  viewer: ViewerRenderer;
  onOpenPopup?: () => void;
}) {
  const resolvedControls = {
    downloadPdf: controls?.downloadPdf ?? true,
    downloadTypst: controls?.downloadTypst ?? true,
    popup: controls?.popup ?? Boolean(onOpenPopup)
  };

  return (
    <header className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
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
        {resolvedControls.downloadPdf ? (
          <PreviewButton
            label="Download PDF"
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
          </PreviewButton>
        ) : null}
        {resolvedControls.downloadTypst ? (
          <PreviewButton
            label="Download Typst"
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
          </PreviewButton>
        ) : null}
        {resolvedControls.popup && onOpenPopup ? (
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
