import '@fontsource-variable/dm-sans';
import 'monaco-editor/min/vs/editor/editor.main.css';
import './app.css';
import './workspace.css';
import { HelmetProvider } from 'react-helmet-async';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { WorkspaceBootstrap } from './lib/bootstrap';
import { router } from './router';

export function App() {
  return (
    <HelmetProvider>
      <WorkspaceBootstrap />
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </HelmetProvider>
  );
}
