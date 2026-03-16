import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import type { PublicCvPayload } from '@rendercv/contracts';
import { normalizeCompatibilityCvYaml } from '../features/viewer/normalize-compat-cv';
import { normalizeLegacyDesignYaml } from '../features/viewer/viewer-sections';
import { api } from '../lib/api';
import { PreviewPane } from '../ui/preview-pane';

export function SharedCvPage() {
  const { sharedCvId = '' } = useParams();
  const [payload, setPayload] = useState<PublicCvPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getPublicCv(sharedCvId)
      .then((response) => {
        setPayload(response.cv);
      })
      .catch((cause) => {
        setError(cause instanceof Error ? cause.message : 'Failed to load shared CV.');
      });
  }, [sharedCvId]);

  const sections = useMemo(() => {
    if (!payload) {
      return undefined;
    }

    const variant =
      payload.selectedVariant && payload.variants?.[payload.selectedVariant]
        ? payload.variants[payload.selectedVariant]
        : undefined;

    return {
      ...payload.sections,
      cv: normalizeCompatibilityCvYaml(payload.sections.cv, { variant }),
      design: normalizeLegacyDesignYaml(payload.sections.design) ?? payload.sections.design
    };
  }, [payload]);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{payload?.cvName ? `${payload.cvName} | RenderCV` : 'Shared CV | RenderCV'}</title>
      </Helmet>
      {error ? (
        <div className="mx-auto max-w-3xl px-6 py-12 text-destructive">{error}</div>
      ) : (
        <PreviewPane fileName={payload?.cvName ?? 'Shared CV'} sections={sections} />
      )}
    </div>
  );
}
