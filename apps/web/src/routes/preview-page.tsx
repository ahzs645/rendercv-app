import { useEffect, useState } from 'react';
import { Download, Eye, EyeOff, FileCode2, Minus, Moon, Plus, Sun } from 'lucide-react';
import type { CvFile } from '@rendercv/contracts';
import { createPreviewChannel, preferencesStore } from '@rendercv/core';
import { downloadBlob } from '../features/viewer/download';
import { useViewerRenderer } from '../features/viewer/use-viewer-renderer';
import { resolveViewerSections } from '../features/viewer/viewer-sections';
import { useStore } from '../lib/use-store';
import { PreviewPaneView } from '../ui/preview-pane';
import { StyledTooltip } from '../ui/styled-tooltip';

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
  const sections = selectedFile ? resolveViewerSections(selectedFile) : undefined;
  const fileName = selectedFile?.name ?? 'RenderCV';
  const viewer = useViewerRenderer(sections);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-4 py-2 sm:px-6 sm:py-3">
        <h1 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Preview</h1>
        <div className="flex flex-wrap items-center gap-2">
          <ToolbarButton label="Zoom out" onClick={viewer.zoomOut}>
            <Minus className="size-4" />
          </ToolbarButton>
          <button
            className="rounded-xl border border-border px-3 py-2 text-sm"
            onClick={viewer.zoomReset}
            type="button"
          >
            {viewer.zoomPercent}%
          </button>
          <ToolbarButton label="Zoom in" onClick={viewer.zoomIn}>
            <Plus className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Download PDF"
            onClick={async () => {
              if (!sections) return;
              const bytes = await viewer.renderToPdf(sections);
              if (!bytes) return;
              await downloadBlob(
                new Blob([bytes as BlobPart], { type: 'application/pdf' }),
                `${fileName}.pdf`
              );
            }}
          >
            <Download className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Export source (.typ)"
            onClick={async () => {
              if (!sections) return;
              const typst = await viewer.renderToTypst(sections);
              if (!typst) return;
              await downloadBlob(
                new Blob([typst], { type: 'application/octet-stream' }),
                `${fileName}.typ`
              );
            }}
          >
            <FileCode2 className="size-4" />
          </ToolbarButton>
          {isDark ? (
            <ToolbarButton
              label={preferences.previewDarkMode ? 'Show original colors' : 'Adapt preview to dark mode'}
              onClick={() => preferencesStore.patch({ previewDarkMode: !preferences.previewDarkMode })}
            >
              {preferences.previewDarkMode ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </ToolbarButton>
          ) : null}
          <ToolbarButton
            label={isDark ? 'Light mode' : 'Dark mode'}
            onClick={() => preferencesStore.patch({ colorMode: isDark ? 'light' : 'dark' })}
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </ToolbarButton>
        </div>
      </header>
      <div className="flex-1">
        <PreviewPaneView
          fileName={fileName}
          sections={sections}
          viewer={viewer}
          showHeader={false}
        />
      </div>
    </div>
  );
}

function ToolbarButton({
  children,
  label,
  onClick
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void | Promise<void>;
}) {
  return (
    <StyledTooltip label={label} side="bottom">
      <button
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
        onClick={() => void onClick()}
        aria-label={label}
        type="button"
      >
        {children}
      </button>
    </StyledTooltip>
  );
}
