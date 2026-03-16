import { useEffect, useState } from 'react';
import type { CvFile } from '@rendercv/contracts';
import { createPreviewChannel, resolveFileSections } from '@rendercv/core';
import { PreviewPane } from '../ui/preview-pane';

export function PreviewPage() {
  const [files, setFiles] = useState<CvFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | undefined>(undefined);

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
      <header className="border-b border-border px-6 py-4">
        <h1 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Preview</h1>
      </header>
      <div className="flex-1">
        <PreviewPane
          fileName={selectedFile?.name ?? 'RenderCV'}
          sections={selectedFile ? resolveFileSections(selectedFile) : undefined}
        />
      </div>
    </div>
  );
}
