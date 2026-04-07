import { Helmet } from 'react-helmet-async';
import { Outlet } from 'react-router-dom';
import { WorkspaceBootstrap } from '../lib/bootstrap';

export function AppDocument() {
  return (
    <>
      <WorkspaceBootstrap />
      <Helmet>
        <title>RenderCV: Resume Builder for Academics and Engineers</title>
        <meta
          name="description"
          content="RenderCV is a free and open-source resume builder with LaTeX-quality typesetting and AI agents."
        />
      </Helmet>
      <Outlet />
    </>
  );
}
