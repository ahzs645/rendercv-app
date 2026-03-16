import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { api } from '../lib/api';
import { OverlayPage } from '../ui/overlay-page';

export function PortalPage() {
  const [message, setMessage] = useState('Fetching billing portal…');

  useEffect(() => {
    api.getPortal()
      .then((result) => {
        if (result.url) {
          window.location.href = result.url;
          return;
        }

        setMessage('No billing portal is configured yet.');
      })
      .catch((error) => {
        setMessage(error instanceof Error ? error.message : 'Failed to load portal.');
      });
  }, []);

  return (
    <OverlayPage title="Portal" description="Manage billing, subscription details, and invoices.">
      <Helmet>
        <title>Portal | RenderCV</title>
      </Helmet>
      <p className="text-sm text-muted-foreground">{message}</p>
    </OverlayPage>
  );
}
