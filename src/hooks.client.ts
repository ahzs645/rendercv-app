import * as Sentry from '@sentry/sveltekit';
import { PUBLIC_SENTRY_DSN } from '$env/static/public';

if (PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: PUBLIC_SENTRY_DSN,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.2,
    environment: import.meta.env.MODE,
    _experiments: { enableLogs: true },

    allowUrls: [/https?:\/\/(www\.)?rendercv\.com/],

    ignoreErrors: [
      // User-cancelled fetch requests (AbortController)
      'Canceled',
      /^Canceled$/,
      // Network errors — not actionable (except "Failed to fetch" which is
      // selectively filtered in beforeSend to allow render-pipeline errors through)
      'NetworkError',
      'Network request failed',
      'Load failed',
      // Stale JS chunks after deployment
      /Failed to fetch dynamically imported module/,
      /error loading dynamically imported module/i,
      // Service worker failures
      /ServiceWorker/,
      // Browser extension interference
      /Object Not Found Matching Id/,
      // Monaco editor internal errors (not actionable)
      /InstantiationService has been disposed/,
      // bits-ui tooltip scroll handler bug (third-party, tracked: bits-ui#2.15.6)
      /\.contains is not a function/,
      // Generic rejections
      /^Rejected$/,
      /^unreachable$/
    ],

    denyUrls: [
      // Browser extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      /^moz-extension:\/\//i,
      /^safari-extension:\/\//i
    ],

    beforeSend(event) {
      const message = event.message ?? event.exception?.values?.[0]?.value ?? '';

      // "Failed to fetch" — keep if it originates from our render/viewer code,
      // drop if it comes from extensions or unrelated third-party scripts.
      if (/Failed to fetch/.test(message)) {
        const frames = event.exception?.values?.[0]?.stacktrace?.frames;
        const isFromViewer = frames?.some(
          (f) => f.filename && /viewer|typst|pyodide|rendercv/.test(f.filename)
        );
        if (!isFromViewer) return null;
      }

      // Filter out 404s for well-known files (bots/crawlers)
      if (/Not found: \/\.well-known\//.test(message)) return null;
      if (/Not found: \/_astro\//.test(message)) return null;

      // Group similar issues together via fingerprinting
      if (/Not found:/.test(message)) {
        event.fingerprint = ['not-found-route'];
      } else if (/Failed to fetch dynamically imported module/.test(message)) {
        event.fingerprint = ['stale-chunk-after-deploy'];
      } else if (/crypto\.randomUUID/.test(message)) {
        event.fingerprint = ['crypto-randomuuid-unavailable'];
      } else if (/Monaco|InstantiationService|Illegal value for lineNumber/.test(message)) {
        event.fingerprint = ['monaco-editor-internal'];
      } else if (/InvalidPDFException|incomplete file data/.test(message)) {
        event.fingerprint = ['pdf-import-invalid-input'];
      }

      return event;
    }
  });
}

export const handleError = Sentry.handleErrorWithSentry();
