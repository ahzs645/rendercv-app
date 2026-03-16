import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import type { EncodedSharePayload } from '../features/share/encoded-share';
import { decodeSharePayload } from '../features/share/encoded-share';
import { PreviewPane } from '../ui/preview-pane';

export function EncodedSharePage() {
  const location = useLocation();
  const [payload, setPayload] = useState<EncodedSharePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

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
