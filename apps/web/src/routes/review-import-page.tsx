import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation, useNavigate } from 'react-router-dom';
import { decodeReviewProposalPackage } from '../features/review/package-utils';
import { importReviewProposalIntoSession } from '../features/review/session-utils';

export function ReviewImportPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash;
    if (!token) {
      setError('This review link is missing its encoded proposal data.');
      return;
    }

    let cancelled = false;

    void decodeReviewProposalPackage(token)
      .then((payload) => {
        if (cancelled) {
          return;
        }

        const session = importReviewProposalIntoSession(payload);
        navigate(`/review/${session.sessionId}`, { replace: true });
      })
      .catch((cause) => {
        if (cancelled) {
          return;
        }

        setError(cause instanceof Error ? cause.message : 'Failed to import review proposal.');
      });

    return () => {
      cancelled = true;
    };
  }, [location.hash, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar px-6">
      <Helmet>
        <title>Importing Review Proposal | RenderCV</title>
      </Helmet>
      <div className="w-full max-w-xl rounded-3xl border border-border bg-background p-8 shadow-2xl">
        <h1 className="text-xl font-semibold text-foreground">Importing review proposal</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error ?? 'Preparing the proposal and routing it into your local review inbox…'}
        </p>
      </div>
    </div>
  );
}
