import { Helmet } from 'react-helmet-async';
import termsOfService from '../content/terms-of-service.md?raw';
import { MarkdownPage } from '../lib/markdown-page';
import { OverlayPage } from '../ui/overlay-page';

export function TermsOfServicePage() {
  return (
    <OverlayPage title="Terms of service" description="The legal terms governing the RenderCV app and services.">
      <Helmet>
        <title>Terms of Service | RenderCV</title>
      </Helmet>
      <MarkdownPage title="Terms of Service" body={termsOfService} />
    </OverlayPage>
  );
}
