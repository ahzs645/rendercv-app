import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Download, Eye, EyeOff, GitCompareArrows, Minus, Pencil, Plus, Upload } from 'lucide-react';
import { fileStore, preferencesStore, readThemeName, readLocaleName } from '@rendercv/core';
import { toast } from 'sonner';
import type { EncodedSharePayload } from '../features/share/encoded-share';
import { decodeSharePayload } from '../features/share/encoded-share';
import { exportShareFile, importShareFile } from '../features/share/file-share';
import { hasChanges } from '../features/share/diff-utils';
import { DiffViewer } from '../features/share/diff-viewer';
import { downloadBlob } from '../features/viewer/download';
import { useViewerRenderer } from '../features/viewer/use-viewer-renderer';
import { useStore } from '../lib/use-store';
import { PreviewPaneView } from '../ui/preview-pane';
import { StyledTooltip } from '../ui/styled-tooltip';

type ViewMode = 'preview' | 'diff';

export function EncodedSharePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [payload, setPayload] = useState<EncodedSharePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const isPdfDownload = searchParams.get('dl') === 'pdf';

  const preferences = useStore(preferencesStore);
  const prefersDark =
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark =
    preferences.colorMode === 'dark' || (preferences.colorMode === 'system' && prefersDark);

  const viewer = useViewerRenderer(payload?.sections);
  const fileName = payload?.fileName ?? 'Shared Resume';

  const showDiffToggle =
    payload?.origin != null &&
    payload.sections != null &&
    hasChanges(payload.origin, payload.sections);

  useEffect(() => {
    const token = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash;

    if (!token) {
      setPayload(null);
      setError('This share link is missing its encoded resume data.');
      return;
    }

    let cancelled = false;

    void decodeSharePayload(token)
      .then((decoded) => {
        if (cancelled) {
          return;
        }

        setPayload(decoded);
        setError(null);

        // Auto-switch to diff view when origin is present and has changes
        if (
          decoded.origin &&
          decoded.sections &&
          hasChanges(decoded.origin, decoded.sections)
        ) {
          setViewMode('diff');
        }
      })
      .catch((cause) => {
        if (cancelled) {
          return;
        }

        setPayload(null);
        setError(cause instanceof Error ? cause.message : 'Failed to decode shared resume.');
      });

    return () => {
      cancelled = true;
    };
  }, [location.hash]);

  function editInWorkspace() {
    if (!payload) return;

    const designKey = readThemeName(payload.sections.design) ?? 'classic';
    const localeKey = readLocaleName(payload.sections.locale) ?? 'english';
    const fileName = fileStore.uniqueName(`${payload.fileName} (Review)`);

    fileStore.createFile(fileName, {
      cv: payload.sections.cv,
      settings: payload.sections.settings,
      designs: { [designKey]: payload.sections.design },
      locales: { [localeKey]: payload.sections.locale },
      selectedTheme: designKey,
      selectedLocale: localeKey,
      sharedOrigin: payload.origin ?? payload.sections
    });

    toast.success(`Imported as "${fileName}" — your edits will be tracked.`);
    navigate('/');
  }

  if (isPdfDownload) {
    return (
      <>
        <Helmet>
          <title>{payload?.fileName ? `Downloading ${payload.fileName}.pdf` : 'Downloading PDF…'}</title>
        </Helmet>
        {error ? (
          <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="mx-auto max-w-3xl px-6 py-12 text-destructive">{error}</div>
          </div>
        ) : (
          <PdfAutoDownload payload={payload} />
        )}
      </>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Helmet>
        <title>{payload?.fileName ? `${payload.fileName} | Shared Resume` : 'Shared Resume'}</title>
      </Helmet>

      {error ? (
        <div className="mx-auto max-w-3xl px-6 py-12 text-destructive">{error}</div>
      ) : (
        <>
          {/* Action bar */}
          <div className="flex items-center justify-between border-b border-border px-4 py-2 sm:px-6 sm:py-3">
            <div className="flex items-center gap-3">
              {showDiffToggle ? (
                <div className="inline-flex items-center rounded-xl border border-border bg-background p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode('preview')}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      viewMode === 'preview'
                        ? 'bg-foreground text-background'
                        : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('diff')}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      viewMode === 'diff'
                        ? 'bg-foreground text-background'
                        : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <GitCompareArrows className="size-3.5" />
                    Changes
                  </button>
                </div>
              ) : null}
              {viewMode === 'preview' ? (
                <div className="flex items-center gap-2">
                  <ShareToolbarButton label="Zoom out" onClick={viewer.zoomOut}>
                    <Minus className="size-4" />
                  </ShareToolbarButton>
                  <button
                    className="rounded-xl border border-border px-3 py-2 text-sm"
                    onClick={viewer.zoomReset}
                    type="button"
                  >
                    {viewer.zoomPercent}%
                  </button>
                  <ShareToolbarButton label="Zoom in" onClick={viewer.zoomIn}>
                    <Plus className="size-4" />
                  </ShareToolbarButton>
                  <ShareToolbarButton
                    label="Download PDF"
                    onClick={async () => {
                      if (!payload?.sections) return;
                      const bytes = await viewer.renderToPdf(payload.sections);
                      if (!bytes) return;
                      await downloadBlob(
                        new Blob([bytes as BlobPart], { type: 'application/pdf' }),
                        `${fileName}.pdf`
                      );
                    }}
                  >
                    <Download className="size-4" />
                  </ShareToolbarButton>
                  {isDark ? (
                    <ShareToolbarButton
                      label={preferences.previewDarkMode ? 'Show original colors' : 'Adapt preview to dark mode'}
                      onClick={() => preferencesStore.patch({ previewDarkMode: !preferences.previewDarkMode })}
                    >
                      {preferences.previewDarkMode ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </ShareToolbarButton>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!payload) return;
                  void exportShareFile(payload).then(() => toast.success('Exported .rendercv.json file.'));
                }}
                disabled={!payload}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40"
                title="Download as .rendercv.json"
              >
                <Download className="size-3.5" />
                Export
              </button>
              <button
                type="button"
                onClick={editInWorkspace}
                disabled={!payload}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-40"
              >
                <Pencil className="size-3.5" />
                Edit in Workspace
              </button>
            </div>
          </div>

          {/* Content area */}
          {viewMode === 'diff' && payload?.origin ? (
            <div className="min-h-0 flex-1" style={{ height: 'calc(100vh - 57px)' }}>
              <DiffViewer origin={payload.origin} modified={payload.sections} />
            </div>
          ) : (
            <PreviewPaneView
              fileName={fileName}
              sections={payload?.sections}
              viewer={viewer}
              showHeader={false}
            />
          )}
        </>
      )}
    </div>
  );
}

function PdfAutoDownload({ payload }: { payload: EncodedSharePayload | null }) {
  const viewer = useViewerRenderer(payload?.sections);
  const [status, setStatus] = useState<'loading' | 'generating' | 'done' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const triggered = useRef(false);

  useEffect(() => {
    if (!payload || viewer.isInitializing || viewer.initError || triggered.current) {
      if (viewer.initError) {
        setStatus('error');
        setErrorMessage(viewer.initError);
      }
      return;
    }

    triggered.current = true;
    setStatus('generating');

    void (async () => {
      try {
        const bytes = await viewer.renderToPdf(payload.sections);
        if (!bytes) {
          setStatus('error');
          setErrorMessage('Failed to generate PDF.');
          return;
        }

        await downloadBlob(
          new Blob([bytes as BlobPart], { type: 'application/pdf' }),
          `${payload.fileName}.pdf`
        );
        setStatus('done');
      } catch (err) {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Failed to generate PDF.');
      }
    })();
  }, [payload, viewer.isInitializing, viewer.initError, viewer.renderToPdf]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        {status === 'loading' || status === 'generating' ? (
          <>
            <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            <p className="text-sm text-muted-foreground">
              {status === 'loading' ? 'Initializing…' : 'Generating PDF…'}
            </p>
          </>
        ) : status === 'done' ? (
          <p className="text-sm text-muted-foreground">
            Your PDF has been downloaded. You can close this tab.
          </p>
        ) : (
          <p className="text-sm text-destructive">{errorMessage}</p>
        )}
      </div>
    </div>
  );
}

function ShareToolbarButton({
  children,
  label,
  onClick
}: {
  children: React.ReactNode;
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
