import { useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { api } from '../lib/api';
import { OverlayPage } from '../ui/overlay-page';

export function MigratePage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'idle' | 'working' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const firebaseUid = searchParams.get('firebase_uid') ?? '';

  async function startMigration() {
    if (!firebaseUid) {
      setStatus('error');
      setMessage('Missing Firebase UID. Please use the migration link from the old app.');
      return;
    }

    setStatus('working');
    setMessage('');
    try {
      await api.migrate(firebaseUid);
      setStatus('done');
      setMessage('Migration completed. Refresh the workspace to see imported CVs.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Migration failed.');
    }
  }

  return (
    <OverlayPage title="Import your CVs" description="Bring over files from the previous RenderCV app.">
      <Helmet>
        <title>Import CVs | RenderCV</title>
      </Helmet>
      <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Use the same account identity you used in the old app. The migration endpoint stays compatible with the old `firebase_uid` link flow.
        </p>
        <button className="rounded-xl bg-primary px-4 py-2 text-primary-foreground" onClick={startMigration}>
          {status === 'working' ? 'Importing…' : 'Start migration'}
        </button>
        {message ? <p className={status === 'error' ? 'text-destructive' : 'text-muted-foreground'}>{message}</p> : null}
      </div>
    </OverlayPage>
  );
}
