<script lang="ts">
  import * as Sentry from '@sentry/sveltekit';
  import { createLogger } from '$lib/logger';
  import { enhance } from '$app/forms';

  const log = createLogger('sentry-test:client');

  let { form }: { form: { result?: string } | null } = $props();

  function triggerClientError() {
    log.warn('About to throw a client-side error');
    throw new Error('Test client error from sentry-test page');
  }

  function triggerCapturedError() {
    const err = new Error('Manually captured client error');
    log.error('Captured error test', err, { component: 'sentry-test' });
  }

  function sendBreadcrumbs() {
    log.debug('Breadcrumb 1: debug level');
    log.info('Breadcrumb 2: info level');
    log.warn('Breadcrumb 3: warning level');
    log.info('All breadcrumbs sent — trigger an error to see them in Sentry');
  }

  function testTransaction() {
    const span = Sentry.startInactiveSpan({ name: 'test-transaction', op: 'test' });
    log.info('Started test transaction');
    setTimeout(() => {
      span?.end();
      log.info('Ended test transaction');
    }, 500);
  }

  function sendClientSentryLogs() {
    Sentry.logger.info(Sentry.logger.fmt`Client Sentry log test — info`, {
      source: 'sentry-test:client'
    });
    Sentry.logger.warn(Sentry.logger.fmt`Client Sentry log test — warn`, {
      source: 'sentry-test:client'
    });
    Sentry.logger.debug(Sentry.logger.fmt`Client Sentry log test — debug`, {
      source: 'sentry-test:client'
    });
    log.info('Client-side Sentry Logs sent');
  }
</script>

<div style="max-width: 600px; margin: 2rem auto; font-family: sans-serif;">
  <h1>Sentry Integration Test</h1>

  {#if form?.result}
    <div
      style="padding: 0.75rem 1rem; margin-bottom: 1rem; background: #e8f5e9; border-radius: 6px; font-size: 0.9rem;"
    >
      {form.result}
    </div>
  {/if}

  <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1.5rem;">
    <h2>Client-side tests</h2>
    <button onclick={triggerClientError}>Throw unhandled client error</button>
    <button onclick={triggerCapturedError}>Capture error manually</button>
    <button onclick={sendBreadcrumbs}>Send breadcrumbs (then trigger error)</button>
    <button onclick={testTransaction}>Test performance transaction</button>
    <button onclick={sendClientSentryLogs}>Send client Sentry Logs</button>

    <h2 style="margin-top: 1rem;">Server-side tests</h2>
    <form method="POST" action="?/server-log" use:enhance>
      <button type="submit">Trigger server logs (breadcrumbs + Sentry Logs)</button>
    </form>
    <form method="POST" action="?/server-log-sentry" use:enhance>
      <button type="submit">Send direct Sentry Logs</button>
    </form>
    <form method="POST" action="?/server-trace" use:enhance>
      <button type="submit">Test server trace (3 child spans)</button>
    </form>
    <form method="POST" action="?/server-error" use:enhance>
      <button type="submit">Trigger server error (500)</button>
    </form>
  </div>

  <p style="margin-top: 2rem; color: #888; font-size: 0.85rem;">
    After triggering tests, check your Sentry dashboard to verify they appear. Remove this page
    after testing.
  </p>
</div>
