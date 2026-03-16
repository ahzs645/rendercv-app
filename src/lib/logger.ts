import * as Sentry from '@sentry/sveltekit';

type LogData = Record<string, unknown>;

export interface Logger {
  debug(msg: string, data?: LogData): void;
  info(msg: string, data?: LogData): void;
  warn(msg: string, data?: LogData): void;
  error(msg: string, err?: unknown, data?: LogData): void;
}

function addBreadcrumb(
  category: string,
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error',
  data?: LogData
) {
  try {
    Sentry.addBreadcrumb({ category, message, level, data });
  } catch {
    // Sentry may not be initialized yet (e.g. during SSR bootstrap)
  }
}

/** Flatten LogData to only string/number/boolean values for Sentry Logs attributes. */
function flattenAttrs(data?: LogData): Record<string, string | number | boolean> | undefined {
  if (!data) return undefined;
  const attrs: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(data)) {
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      attrs[k] = v;
    } else if (v !== null && v !== undefined) {
      attrs[k] = String(v);
    }
  }
  return Object.keys(attrs).length > 0 ? attrs : undefined;
}

function sendSentryLog(
  level: 'debug' | 'info' | 'warn' | 'error',
  namespace: string,
  msg: string,
  data?: LogData
) {
  try {
    const logFn = Sentry.logger[level];
    if (!logFn) return;
    const attrs = flattenAttrs(data);
    logFn(Sentry.logger.fmt`[${namespace}] ${msg}`, attrs);
  } catch {
    // Sentry not initialized
  }
}

export function createLogger(namespace: string): Logger {
  const prefix = `[${namespace}]`;

  return {
    debug(msg, data) {
      console.debug(prefix, msg, ...(data ? [data] : []));
      addBreadcrumb(namespace, msg, 'debug', data);
      sendSentryLog('debug', namespace, msg, data);
    },

    info(msg, data) {
      console.log(prefix, msg, ...(data ? [data] : []));
      addBreadcrumb(namespace, msg, 'info', data);
      sendSentryLog('info', namespace, msg, data);
    },

    warn(msg, data) {
      console.warn(prefix, msg, ...(data ? [data] : []));
      addBreadcrumb(namespace, msg, 'warning', data);
      sendSentryLog('warn', namespace, msg, data);
    },

    error(msg, err?, data?) {
      console.error(prefix, msg, ...(err ? [err] : []), ...(data ? [data] : []));
      addBreadcrumb(namespace, msg, 'error', data);
      sendSentryLog('error', namespace, msg, data);
      try {
        if (err instanceof Error) {
          Sentry.captureException(err, {
            tags: { namespace },
            extra: { message: msg, ...data }
          });
        } else {
          Sentry.captureMessage(`${prefix} ${msg}`, {
            level: 'error',
            tags: { namespace },
            extra: { error: err, ...data }
          });
        }
      } catch {
        // Sentry not initialized
      }
    }
  };
}
