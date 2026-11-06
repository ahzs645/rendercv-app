import { useEffect } from 'react';
import { useRouteError } from 'react-router-dom';
import { useTranslation } from '../lib/i18n/use-translation';

/** Replaces React Router's developer error screen when a page fails to render. */
export function RouteErrorPage() {
  const error = useRouteError();
  const { t } = useTranslation();

  useEffect(() => {
    console.error('A page failed to render.', error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background p-6 text-center text-foreground">
      <h1 className="text-xl font-semibold">{t('error.title')}</h1>
      <p className="max-w-md text-sm text-muted-foreground">{t('error.body')}</p>
      <button
        type="button"
        className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        onClick={() => window.location.reload()}
      >
        {t('error.reload')}
      </button>
    </main>
  );
}
