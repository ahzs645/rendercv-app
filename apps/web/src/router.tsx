import { lazy, Suspense, type ComponentType } from 'react';
import { Navigate, createBrowserRouter } from 'react-router-dom';
import { AppDocument } from './routes/app-document';
import { WorkspaceLayout } from './routes/workspace-layout';
import { HomeRoute } from './routes/home-route';
import { RouteErrorPage } from './routes/route-error-page';

/** Pages most visits never open stay out of the main bundle. */
function page(load: () => Promise<{ default: ComponentType }>) {
  const Page = lazy(load);
  return (
    <Suspense fallback={null}>
      <Page />
    </Suspense>
  );
}

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppDocument />,
      errorElement: <RouteErrorPage />,
      children: [
        {
          element: <WorkspaceLayout />,
          children: [
            { index: true, element: <HomeRoute /> },
            { path: 'privacy-policy', element: page(() => import('./routes/privacy-policy-page').then((module) => ({ default: module.PrivacyPolicyPage }))) },
            { path: 'terms-of-service', element: page(() => import('./routes/terms-of-service-page').then((module) => ({ default: module.TermsOfServicePage }))) },
            { path: 'migrate', element: page(() => import('./routes/migrate-page').then((module) => ({ default: module.MigratePage }))) },
            { path: 'portal', element: page(() => import('./routes/portal-page').then((module) => ({ default: module.PortalPage }))) }
          ]
        },
        { path: 'pricing', element: <Navigate to="/" replace /> },
        { path: 'preview', element: page(() => import('./routes/preview-page').then((module) => ({ default: module.PreviewPage }))) },
        { path: 'share', element: page(() => import('./routes/encoded-share-page').then((module) => ({ default: module.EncodedSharePage }))) },
        { path: 'review-import', element: page(() => import('./routes/review-import-page').then((module) => ({ default: module.ReviewImportPage }))) },
        { path: 'review/:sessionId', element: page(() => import('./routes/review-session-page').then((module) => ({ default: module.ReviewSessionPage }))) },
        { path: 'prototype-renderers', element: page(() => import('./routes/prototype-renderers-page').then((module) => ({ default: module.PrototypeRenderersPage }))) },
        { path: ':sharedCvId', element: page(() => import('./routes/shared-cv-page').then((module) => ({ default: module.SharedCvPage }))) }
      ]
    }
  ],
  { basename: import.meta.env.BASE_URL }
);
