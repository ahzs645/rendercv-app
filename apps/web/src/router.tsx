import { createBrowserRouter } from 'react-router-dom';
import { AppDocument } from './routes/app-document';
import { WorkspaceLayout } from './routes/workspace-layout';
import { HomeRoute } from './routes/home-route';
import { PricingPage } from './routes/pricing-page';
import { PrivacyPolicyPage } from './routes/privacy-policy-page';
import { TermsOfServicePage } from './routes/terms-of-service-page';
import { MigratePage } from './routes/migrate-page';
import { PortalPage } from './routes/portal-page';
import { PreviewPage } from './routes/preview-page';
import { PrototypeRenderersPage } from './routes/prototype-renderers-page';
import { SentryTestPage } from './routes/sentry-test-page';
import { EncodedSharePage } from './routes/encoded-share-page';
import { SharedCvPage } from './routes/shared-cv-page';

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppDocument />,
      children: [
        {
          element: <WorkspaceLayout />,
          children: [
            { index: true, element: <HomeRoute /> },
            { path: 'pricing', element: <PricingPage /> },
            { path: 'privacy-policy', element: <PrivacyPolicyPage /> },
            { path: 'terms-of-service', element: <TermsOfServicePage /> },
            { path: 'migrate', element: <MigratePage /> },
            { path: 'portal', element: <PortalPage /> }
          ]
        },
        { path: 'preview', element: <PreviewPage /> },
        { path: 'share', element: <EncodedSharePage /> },
        { path: 'prototype-renderers', element: <PrototypeRenderersPage /> },
        { path: 'sentry-test', element: <SentryTestPage /> },
        { path: ':sharedCvId', element: <SharedCvPage /> }
      ]
    }
  ],
  { basename: import.meta.env.BASE_URL }
);
