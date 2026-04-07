import { Helmet } from 'react-helmet-async';
import { Outlet, useLocation } from 'react-router-dom';
import { Workspace } from '../ui/workspace';

export function WorkspaceLayout() {
  const location = useLocation();
  const showWorkspace = location.pathname === '/';

  return (
    <>
      <Helmet>
        <meta property="og:image" content="https://rendercv.com/og-image.png" />
      </Helmet>
      <div style={{ display: showWorkspace ? 'block' : 'none' }}>
        <Workspace />
      </div>
      {!showWorkspace ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-sidebar">
          <Outlet />
        </div>
      ) : null}
    </>
  );
}
