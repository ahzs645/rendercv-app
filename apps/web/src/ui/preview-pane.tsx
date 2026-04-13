import { useEffect, useRef, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { AppWindow, Download, Eye, EyeOff, FileCode2, Minus, Plus } from 'lucide-react';
import type { CvFile, CvFileSections } from '@rendercv/contracts';
import { preferencesStore } from '@rendercv/core';
import { downloadBlob } from '../features/viewer/download';
import { useViewerRenderer } from '../features/viewer/use-viewer-renderer';
import { useStore } from '../lib/use-store';
import { StyledTooltip } from './styled-tooltip';
import {
  buildSvgDocumentCandidates,
  buildSvgPageHitZones,
  buildSvgSectionCandidates,
  detectSvgSectionSegment,
  detectSvgSectionHit,
  measureSvgTextBoxesFromUrl
} from '../features/viewer/svg-click-map';
import type { SectionMapEntry, SectionMapResult } from '../features/viewer/typst-section-map';

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

export function PreviewPaneView({
  controls,
  fileName,
  sections,
  viewer,
  onOpenPopup,
  onSectionClick,
  showHeader = true
}: {
  controls?: PreviewPaneControls;
  fileName: string;
  sections?: CvFileSections;
  viewer: ViewerRenderer;
  onOpenPopup?: () => void;
  onSectionClick?: (sectionKey: string, entryIndex: number) => void;
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
      <PreviewCanvas
        fileName={fileName}
        sections={sections}
        viewer={viewer}
        workspaceInset={!showHeader}
        onSectionClick={onSectionClick}
      />
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

const PREVIEW_HITBOX_DEBUG_PARAM = 'debugPreviewHits';
const PREVIEW_HITBOX_DEBUG_STORAGE_KEY = 'rendercv_debug_preview_hits';

function previewHitboxDebugEnabled() {
  if (typeof window === 'undefined') {
    return false;
  }

  const flag = new URLSearchParams(window.location.search).get(PREVIEW_HITBOX_DEBUG_PARAM);
  if (flag !== null) {
    return ['1', 'true', 'yes', 'on'].includes(flag.toLowerCase());
  }

  try {
    return localStorage.getItem(PREVIEW_HITBOX_DEBUG_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function hitZoneColor(sectionKey: string) {
  let hash = 0;
  for (let index = 0; index < sectionKey.length; index += 1) {
    hash = (hash * 31 + sectionKey.charCodeAt(index)) | 0;
  }

  const hue = Math.abs(hash) % 360;
  return {
    background: `hsla(${hue}, 78%, 52%, 0.18)`,
    border: `hsla(${hue}, 78%, 38%, 0.55)`,
    label: `hsla(${hue}, 78%, 28%, 0.95)`
  };
}

function PreviewHitboxOverlay({
  zones
}: {
  zones: Array<{ sectionKey: string; entryIndex: number; startRatio: number; endRatio: number }>;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {zones.map((zone, index) => {
        const color = hitZoneColor(zone.sectionKey);
        const label = zone.entryIndex >= 0 ? `${zone.sectionKey}[${zone.entryIndex}]` : zone.sectionKey;
        const showLabel = zone.endRatio - zone.startRatio >= 0.045 || zone.entryIndex < 0;

        return (
          <div
            key={`${zone.sectionKey}-${zone.entryIndex}-${index}`}
            className="absolute inset-x-0 border-y"
            style={{
              top: `${zone.startRatio * 100}%`,
              height: `${Math.max((zone.endRatio - zone.startRatio) * 100, 0.1)}%`,
              backgroundColor: color.background,
              borderColor: color.border
            }}
          >
            {showLabel ? (
              <span
                className="absolute left-2 top-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm"
                style={{ backgroundColor: color.label }}
              >
                {label}
              </span>
            ) : null}
          </div>
        );
      })}
      <div className="absolute right-2 top-2 rounded bg-black/75 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-white">
        Hitbox Debug
      </div>
    </div>
  );
}

/**
 * Map a click Y-position on a PDF page to a CV section and entry.
 *
 * Uses line-count weights parsed from the actual Typst source. The preamble
 * (imports, variable definitions) produces zero visual output, so we discount
 * it to estimate the real content extent across pages.
 */
function detectClickedSection(
  event: MouseEvent<HTMLDivElement>,
  sectionMap: SectionMapResult,
  pageIndex: number,
  totalPages: number
): SectionHit | null {
  const { sections, preambleLines } = sectionMap;
  const rect = event.currentTarget.getBoundingClientRect();
  const yRatio = (event.clientY - rect.top) / rect.height;

  // Header (name, contact info) occupies the first ~8 % of page 0.
  const HEADER_RATIO = 0.08;

  const totalSectionLines = sections.reduce((sum, s) => sum + s.totalLines, 0);
  if (totalSectionLines === 0) return null;

  // absoluteY: 0..totalPages  (page 0 → [0,1), page 1 → [1,2), …)
  const absoluteY = pageIndex + yRatio;

  if (absoluteY < HEADER_RATIO) {
    return { sectionKey: '__header__', entryIndex: -1 };
  }

  // The preamble (imports, #let, #set, …) renders to zero visual space.
  // Discount it to estimate where content actually ends on the pages.
  const totalSourceLines = preambleLines + totalSectionLines;
  const contentPages =
    totalSourceLines > 0
      ? (totalSectionLines / totalSourceLines) * totalPages
      : totalPages;
  const contentLength = Math.max(contentPages - HEADER_RATIO, 0.1);

  let cursor = HEADER_RATIO;
  for (const section of sections) {
    const sectionShare = (section.totalLines / totalSectionLines) * contentLength;
    if (absoluteY < cursor + sectionShare) {
      // Within this section — determine which entry
      const posInSection = absoluteY - cursor;
      const headingShare =
        section.entries.length > 0
          ? (section.headingLines / section.totalLines) * sectionShare
          : sectionShare;

      if (posInSection < headingShare || section.entries.length === 0) {
        return { sectionKey: section.key, entryIndex: -1 };
      }

      const entryZone = sectionShare - headingShare;
      const entryTotalLines = section.entries.reduce((s, e) => s + e.lines, 0);
      if (entryTotalLines === 0) {
        return { sectionKey: section.key, entryIndex: 0 };
      }

      let entryCursor = 0;
      for (let i = 0; i < section.entries.length; i++) {
        const entryShare = (section.entries[i]!.lines / entryTotalLines) * entryZone;
        if (posInSection - headingShare < entryCursor + entryShare) {
          return { sectionKey: section.key, entryIndex: i };
        }
        entryCursor += entryShare;
      }

      return { sectionKey: section.key, entryIndex: section.entries.length - 1 };
    }
    cursor += sectionShare;
  }

  // Click is past the content area (blank space at bottom of last page)
  const last = sections[sections.length - 1];
  return last
    ? { sectionKey: last.key, entryIndex: Math.max(last.entries.length - 1, 0) }
    : null;
}

async function refineClickedSectionFromSvg({
  clickYRatio,
  cvYaml,
  fallbackHit,
  pageUrl,
  pageBoxesPromiseCache,
  documentCandidateCache,
  sectionCandidateCache
}: {
  clickYRatio: number;
  cvYaml: string | undefined;
  fallbackHit: SectionHit;
  pageUrl: string;
  pageBoxesPromiseCache: Map<string, Promise<Awaited<ReturnType<typeof measureSvgTextBoxesFromUrl>>>>;
  documentCandidateCache: { current: ReturnType<typeof buildSvgDocumentCandidates> | null | undefined };
  sectionCandidateCache: Map<string, ReturnType<typeof buildSvgSectionCandidates>>;
}): Promise<SectionHit | null> {
  if (!cvYaml || fallbackHit.sectionKey === '__header__') {
    return null;
  }

  let documentCandidates = documentCandidateCache.current;
  if (documentCandidates === undefined) {
    documentCandidates = buildSvgDocumentCandidates(cvYaml);
    documentCandidateCache.current = documentCandidates;
  }

  if (!documentCandidates) {
    return null;
  }

  let pageBoxesPromise = pageBoxesPromiseCache.get(pageUrl);
  if (!pageBoxesPromise) {
    pageBoxesPromise = measureSvgTextBoxesFromUrl(pageUrl);
    pageBoxesPromiseCache.set(pageUrl, pageBoxesPromise);
  }

  const pageBoxes = await pageBoxesPromise;
  const sectionSegment = detectSvgSectionSegment(pageBoxes, documentCandidates, clickYRatio);
  const sectionKey = sectionSegment?.sectionKey ?? fallbackHit.sectionKey;

  let candidates = sectionCandidateCache.get(sectionKey);
  if (candidates === undefined) {
    candidates = documentCandidates.sections.find((section) => section.sectionKey === sectionKey) ?? null;
    sectionCandidateCache.set(sectionKey, candidates);
  }

  if (!candidates) {
    return null;
  }

  const svgHit = detectSvgSectionHit(pageBoxes, candidates, clickYRatio, {
    segmentStartRatio: sectionSegment?.sectionKey === sectionKey ? sectionSegment.startRatio : undefined,
    segmentEndRatio: sectionSegment?.sectionKey === sectionKey ? sectionSegment.endRatio : undefined
  });
  return svgHit
    ? {
        sectionKey,
        entryIndex: svgHit.entryIndex
      }
    : null;
}

function PreviewCanvas({
  fileName,
  sections,
  viewer,
  workspaceInset,
  onSectionClick
}: {
  fileName: string;
  sections?: CvFileSections;
  viewer: ViewerRenderer;
  workspaceInset: boolean;
  onSectionClick?: (sectionKey: string, entryIndex: number) => void;
}) {
  const shellClassName = workspaceInset
    ? 'min-h-0 flex-1 p-4 pt-3 sm:p-6 sm:pt-4'
    : 'min-h-0 flex-1';

  const { sectionMap } = viewer;
  const totalPages = viewer.svgPages.length;
  const hasClickHandler = onSectionClick && sectionMap.sections.length > 0;
  const showHitboxDebug = previewHitboxDebugEnabled();
  const pageBoxesPromiseCache = useRef(new Map<string, Promise<Awaited<ReturnType<typeof measureSvgTextBoxesFromUrl>>>>());
  const documentCandidateCache = useRef<ReturnType<typeof buildSvgDocumentCandidates> | null | undefined>(undefined);
  const sectionCandidateCache = useRef(new Map<string, ReturnType<typeof buildSvgSectionCandidates>>());
  const [debugZonesByPage, setDebugZonesByPage] = useState<
    Record<string, ReturnType<typeof buildSvgPageHitZones>>
  >({});

  useEffect(() => {
    pageBoxesPromiseCache.current.clear();
  }, [viewer.svgPages]);

  useEffect(() => {
    sectionCandidateCache.current.clear();
    documentCandidateCache.current = undefined;
  }, [sections?.cv]);

  useEffect(() => {
    const cvYaml = sections?.cv;
    if (!showHitboxDebug || !cvYaml || viewer.svgPages.length === 0) {
      setDebugZonesByPage({});
      return;
    }
    const resolvedCvYaml: string = cvYaml;

    let cancelled = false;

    async function loadDebugZones() {
      let documentCandidates = documentCandidateCache.current;
      if (documentCandidates === undefined) {
        documentCandidates = buildSvgDocumentCandidates(resolvedCvYaml);
        documentCandidateCache.current = documentCandidates;
      }

      if (!documentCandidates) {
        if (!cancelled) {
          setDebugZonesByPage({});
        }
        return;
      }

      const nextEntries = await Promise.all(
        viewer.svgPages.map(async (pageUrl) => {
          let pageBoxesPromise = pageBoxesPromiseCache.current.get(pageUrl);
          if (!pageBoxesPromise) {
            pageBoxesPromise = measureSvgTextBoxesFromUrl(pageUrl);
            pageBoxesPromiseCache.current.set(pageUrl, pageBoxesPromise);
          }

          const pageBoxes = await pageBoxesPromise;
          return [pageUrl, buildSvgPageHitZones(pageBoxes, documentCandidates)] as const;
        })
      );

      if (!cancelled) {
        setDebugZonesByPage(Object.fromEntries(nextEntries));
      }
    }

    void loadDebugZones();

    return () => {
      cancelled = true;
    };
  }, [showHitboxDebug, sections?.cv, viewer.svgPages]);


  const preferences = useStore(preferencesStore);
  const prefersDark =
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark =
    preferences.colorMode === 'dark' || (preferences.colorMode === 'system' && prefersDark);
  const invertPreview = isDark && preferences.previewDarkMode;

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
                className={`relative overflow-hidden rounded-sm shadow-2xl ${invertPreview ? 'bg-background' : 'bg-white'}`}
                onClick={
                  hasClickHandler
                    ? (event: MouseEvent<HTMLDivElement>) => {
                        // Don't navigate if the user was selecting text
                        const sel = window.getSelection();
                        if (sel && sel.toString().length > 0) return;
                        const clickYRatio =
                          (event.clientY - event.currentTarget.getBoundingClientRect().top) /
                          event.currentTarget.getBoundingClientRect().height;
                        const fallbackHit = detectClickedSection(event, sectionMap, pageIndex, totalPages);
                        if (!fallbackHit) return;

                        void refineClickedSectionFromSvg({
                          clickYRatio,
                          cvYaml: sections?.cv,
                          fallbackHit,
                          pageUrl: page,
                          pageBoxesPromiseCache: pageBoxesPromiseCache.current,
                          documentCandidateCache,
                          sectionCandidateCache: sectionCandidateCache.current
                        }).then((refinedHit) => {
                          const hit = refinedHit ?? fallbackHit;
                          onSectionClick(hit.sectionKey, hit.entryIndex);
                        });
                      }
                    : undefined
                }
              >
                <img
                  src={page}
                  alt={`${fileName} page ${pageIndex + 1}`}
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  className="pointer-events-none block h-auto w-full select-none"
                  style={invertPreview ? { filter: 'invert(1) hue-rotate(180deg)' } : undefined}
                />
                {showHitboxDebug ? <PreviewHitboxOverlay zones={debugZonesByPage[page] ?? []} /> : null}
              </div>
            ))}
          </div>
        ) : (
          <PreviewLoadingSkeleton
            invertPreview={invertPreview}
            message={viewer.isInitializing ? 'Preparing preview engine…' : 'Updating preview…'}
          />
        )}
      </div>
    </div>
  );
}

function PreviewLoadingSkeleton({
  invertPreview,
  message
}: {
  invertPreview: boolean;
  message: string;
}) {
  return (
    <div
      className={`mx-auto flex aspect-[8.5/11] max-w-3xl flex-col rounded-sm shadow-2xl ${
        invertPreview ? 'bg-background' : 'bg-white'
      }`}
      aria-live="polite"
    >
      <div className="flex flex-1 flex-col gap-8 p-6 sm:p-10">
        <div className="space-y-3 animate-pulse">
          <div className="h-8 w-2/5 rounded-full bg-muted/70" />
          <div className="h-3 w-3/5 rounded-full bg-muted/50" />
          <div className="h-3 w-1/2 rounded-full bg-muted/40" />
        </div>
        <div className="space-y-6 animate-pulse">
          {[0, 1, 2].map((section) => (
            <div key={section} className="space-y-3">
              <div className="h-4 w-1/3 rounded-full bg-muted/60" />
              <div className="space-y-2">
                {[0, 1, 2].map((row) => (
                  <div key={row} className="h-3 rounded-full bg-muted/35" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border/40 px-6 py-4 sm:px-10">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-2.5 rounded-full bg-primary animate-pulse" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
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
            label="Export source (.typ)"
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
        <PreviewDarkModeToggle />
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
    <StyledTooltip label={label} side="bottom">
      <button
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
        onClick={() => void onClick()}
        aria-label={label}
        type="button"
      >
        {children}
      </button>
    </StyledTooltip>
  );
}

function PreviewDarkModeToggle() {
  const preferences = useStore(preferencesStore);
  const prefersDark =
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark =
    preferences.colorMode === 'dark' || (preferences.colorMode === 'system' && prefersDark);

  if (!isDark) return null;

  const active = preferences.previewDarkMode;

  return (
    <StyledTooltip label={active ? 'Show original colors' : 'Adapt preview to dark mode'} side="bottom">
      <button
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
        onClick={() => preferencesStore.patch({ previewDarkMode: !active })}
        aria-label={active ? 'Show original colors' : 'Adapt preview to dark mode'}
        type="button"
      >
        {active ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </StyledTooltip>
  );
}
