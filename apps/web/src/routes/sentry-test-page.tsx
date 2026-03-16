import { Helmet } from 'react-helmet-async';
import { OverlayPage } from '../ui/overlay-page';

export function SentryTestPage() {
  return (
    <OverlayPage title="Sentry test" description="Basic client-side error triggers for the new React runtime.">
      <Helmet>
        <title>Sentry Test | RenderCV</title>
      </Helmet>
      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-xl border border-border px-4 py-2"
          onClick={() => {
            throw new Error('RenderCV React Sentry test');
          }}
        >
          Throw client error
        </button>
        <button
          className="rounded-xl border border-border px-4 py-2"
          onClick={() => {
            Promise.reject(new Error('RenderCV React rejected promise'));
          }}
        >
          Reject promise
        </button>
      </div>
    </OverlayPage>
  );
}
