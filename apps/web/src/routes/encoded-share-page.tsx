import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation, useSearchParams } from 'react-router-dom';
import type { EncodedSharePayload } from '../features/share/encoded-share';
import { decodeSharePayload } from '../features/share/encoded-share';
import { downloadBlob } from '../features/viewer/download';
import { useViewerRenderer } from '../features/viewer/use-viewer-renderer';
import { PreviewPane } from '../ui/preview-pane';

export function EncodedSharePage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [payload, setPayload] = useState<EncodedSharePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isPdfDownload = searchParams.get('dl') === 'pdf';

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
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{payload?.fileName ? `${payload.fileName} | Shared Resume` : 'Shared Resume'}</title>
      </Helmet>
      {error ? (
        <div className="mx-auto max-w-3xl px-6 py-12 text-destructive">{error}</div>
      ) : (
        <PreviewPane
          controls={{ downloadPdf: true, downloadTypst: false, popup: false }}
          fileName={payload?.fileName ?? 'Shared Resume'}
          sections={payload?.sections}
        />
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
