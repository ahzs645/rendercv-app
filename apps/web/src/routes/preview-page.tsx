import { useEffect, useState } from 'react';
import { Eye, EyeOff, Moon, Sun } from 'lucide-react';
import type { CvFile } from '@rendercv/contracts';
import { createPreviewChannel, preferencesStore } from '@rendercv/core';
import { resolveViewerSections } from '../features/viewer/viewer-sections';
import { useStore } from '../lib/use-store';
import { PreviewPane } from '../ui/preview-pane';

export function PreviewPage() {
  const [files, setFiles] = useState<CvFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | undefined>(undefined);
  const preferences = useStore(preferencesStore);
  const isDark = preferences.colorMode === 'dark' ||
    (preferences.colorMode === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    const channel = createPreviewChannel();
    channel.onmessage = (event) => {
      const message = event.data;
      if (message.type === 'filestate') {
        setFiles(message.files);
        setSelectedFileId(message.selectedFileId);
      }
    };
    channel.postMessage({ type: 'ping' });

    return () => {
      channel.postMessage({ type: 'closed' });
      channel.close();
    };
  }, []);

  const selectedFile = files.find((file) => file.id === selectedFileId) ?? files[0];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <h1 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Preview</h1>
        <div className="flex items-center gap-2">
          {isDark ? (
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => preferencesStore.patch({ previewDarkMode: !preferences.previewDarkMode })}
              aria-label={preferences.previewDarkMode ? 'Show original colors' : 'Adapt preview to dark mode'}
              type="button"
            >
              {preferences.previewDarkMode ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          ) : null}
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={() => preferencesStore.patch({ colorMode: isDark ? 'light' : 'dark' })}
            aria-label={isDark ? 'Light mode' : 'Dark mode'}
            type="button"
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
      </header>
      <div className="flex-1">
        <PreviewPane
          fileName={selectedFile?.name ?? 'RenderCV'}
          sections={selectedFile ? resolveViewerSections(selectedFile) : undefined}
        />
      </div>
    </div>
  );
}
