import * as Dialog from '@radix-ui/react-dialog';
import { Check, LayoutGrid, LoaderCircle, Sparkles, X } from 'lucide-react';
import { defaultDesigns, fileStore, preferencesStore, themeLabel } from '@rendercv/core';
import type { CvFile, CvFileSections } from '@rendercv/contracts';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../lib/use-store';
import type { ViewerRenderer } from './preview-pane';

type ThumbnailState =
  | { status: 'loading' }
  | { status: 'ready'; url: string }
  | { status: 'error'; message: string };

function resolveThemeDesign(themeKey: string, selectedFile: CvFile, themeLibrary: Record<string, string>) {
  return (
    selectedFile.designs[themeKey] ??
    themeLibrary[themeKey] ??
    defaultDesigns[themeKey as keyof typeof defaultDesigns] ??
    `design:\n  theme: ${themeKey}\n`
  );
}

function sortThemeKeys(themeKeys: string[], selectedTheme: string | undefined) {
  return [...themeKeys].sort((left, right) => {
    if (left === selectedTheme) {
      return -1;
    }

    if (right === selectedTheme) {
      return 1;
    }

    const leftBuiltIn = left in defaultDesigns;
    const rightBuiltIn = right in defaultDesigns;

    if (leftBuiltIn !== rightBuiltIn) {
      return leftBuiltIn ? -1 : 1;
    }

    return themeLabel(left).localeCompare(themeLabel(right));
  });
}

export function ThemeLibraryDialog({
  disabled = false,
  selectedFile,
  sections,
  themeKeys,
  viewer
}: {
  disabled?: boolean;
  selectedFile?: CvFile;
  sections?: CvFileSections;
  themeKeys: string[];
  viewer: ViewerRenderer;
}) {
  const preferences = useStore(preferencesStore);
  const [open, setOpen] = useState(false);
  const [thumbnails, setThumbnails] = useState<Record<string, ThumbnailState>>({});
  const activeUrlsRef = useRef<string[]>([]);
  const sortedThemeKeys = useMemo(
    () => sortThemeKeys(themeKeys, selectedFile?.selectedTheme),
    [selectedFile?.selectedTheme, themeKeys]
  );

  const revokeAllUrls = useCallback(() => {
    for (const url of activeUrlsRef.current) {
      URL.revokeObjectURL(url);
    }

    activeUrlsRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      revokeAllUrls();
    };
  }, [revokeAllUrls]);

  useEffect(() => {
    if (!open) {
      revokeAllUrls();
      setThumbnails({});
      return;
    }

    if (!selectedFile || !sections || viewer.isInitializing || viewer.initError) {
      return;
    }

    let cancelled = false;
    revokeAllUrls();
    setThumbnails(
      Object.fromEntries(sortedThemeKeys.map((themeKey) => [themeKey, { status: 'loading' }]))
    );

    void (async () => {
      for (const themeKey of sortedThemeKeys) {
        if (cancelled) {
          return;
        }

        try {
          const svgPages = await viewer.renderToSvg({
            ...sections,
            design: resolveThemeDesign(themeKey, selectedFile, preferences.themeLibrary)
          });

          if (cancelled) {
            return;
          }

          const firstPage = svgPages?.[0];
          if (!firstPage) {
            throw new Error('No preview generated for this theme.');
          }

          const url = URL.createObjectURL(new Blob([firstPage], { type: 'image/svg+xml' }));
          activeUrlsRef.current.push(url);

          setThumbnails((current) => ({
            ...current,
            [themeKey]: { status: 'ready', url }
          }));
        } catch (error) {
          if (cancelled) {
            return;
          }

          setThumbnails((current) => ({
            ...current,
            [themeKey]: {
              status: 'error',
              message: error instanceof Error ? error.message : 'Failed to render preview.'
            }
          }));
        }
      }
    })();

    return () => {
      cancelled = true;
      revokeAllUrls();
    };
  }, [
    open,
    preferences.themeLibrary,
    revokeAllUrls,
    sections,
    selectedFile,
    sortedThemeKeys,
    viewer
  ]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          aria-label="Open theme library"
          className="inline-flex h-6 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
          disabled={disabled || !selectedFile || !sections || themeKeys.length === 0}
          type="button"
        >
          <LayoutGrid className="size-3.5" />
          Library
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-background/60 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed inset-x-4 top-1/2 z-50 max-h-[85vh] -translate-y-1/2 overflow-hidden rounded-3xl border border-border bg-background shadow-2xl outline-none md:left-1/2 md:w-[min(1100px,calc(100vw-3rem))] md:-translate-x-1/2">
          <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
            <div className="min-w-0">
              <Dialog.Title className="text-lg font-semibold text-foreground">
                Theme Library
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Preview every available theme against {selectedFile?.name ?? 'this resume'} and
                apply one directly.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                aria-label="Close theme library"
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                type="button"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="max-h-[calc(85vh-5.5rem)] overflow-auto px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {sortedThemeKeys.map((themeKey) => {
                const thumbnail = thumbnails[themeKey];
                const selected = selectedFile?.selectedTheme === themeKey;
                const isBuiltIn = themeKey in defaultDesigns;

                return (
                  <button
                    key={themeKey}
                    className={`group overflow-hidden rounded-2xl border bg-card text-left transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                      selected
                        ? 'border-primary/40 shadow-[0_0_0_1px_rgba(59,130,246,0.25)]'
                        : 'border-border'
                    }`}
                    onClick={() => {
                      if (!selectedFile) {
                        return;
                      }

                      fileStore.setTheme(selectedFile.id, themeKey);
                      setOpen(false);
                    }}
                    type="button"
                  >
                    <div className="border-b border-border bg-muted/30 p-3">
                      <div className="aspect-[8.5/11] overflow-hidden rounded-xl border border-border bg-sidebar">
                        {thumbnail?.status === 'ready' ? (
                          <img
                            alt={`${themeLabel(themeKey)} preview`}
                            className="h-full w-full bg-white object-contain"
                            src={thumbnail.url}
                          />
                        ) : thumbnail?.status === 'error' ? (
                          <div className="flex h-full items-center justify-center bg-amber-50 p-4 text-center text-xs text-amber-900">
                            {thumbnail.message}
                          </div>
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center gap-2 bg-muted/40 text-muted-foreground">
                            <LoaderCircle className="size-5 animate-spin" />
                            <p className="text-xs">Rendering preview…</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {themeLabel(themeKey)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {isBuiltIn ? 'Built-in theme' : 'Imported theme'}
                          </p>
                        </div>
                        {selected ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
                            <Check className="size-3" />
                            Current
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1">
                          <Sparkles className="size-3" />
                          {isBuiltIn ? 'Built-in' : 'Library'}
                        </span>
                        {selectedFile?.designs[themeKey] ? (
                          <span className="rounded-full border border-border px-2 py-1">
                            Resume override
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
