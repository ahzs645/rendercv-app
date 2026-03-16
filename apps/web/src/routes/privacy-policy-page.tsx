import { Helmet } from 'react-helmet-async';
import privacyPolicy from '../content/privacy-policy.md?raw';
import { MarkdownPage } from '../lib/markdown-page';
import { OverlayPage } from '../ui/overlay-page';

export function PrivacyPolicyPage() {
  return (
    <OverlayPage title="Privacy policy" description="How RenderCV handles account, analytics, and application data.">
      <Helmet>
        <title>Privacy Policy | RenderCV</title>
      </Helmet>
      <MarkdownPage title="Privacy Policy" body={privacyPolicy} />
    </OverlayPage>
  );
}
