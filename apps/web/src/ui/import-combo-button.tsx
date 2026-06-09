import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Link2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { importCvFromUrl } from './cv-url-import';
import { useYamlImport, type YamlImportOptions } from './yaml-import-button';

/**
 * Split button for importing a CV: the primary action picks a local YAML file,
 * while the chevron menu offers alternative sources (currently "Import from
 * URL"). Mirrors the download/share combo buttons in the workspace toolbar.
 */
export function ImportComboButton({
  mode = 'full',
  prepareYamlImport,
  validateYamlImport
}: YamlImportOptions & {
  mode?: 'full' | 'compact' | 'mini';
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { importFile, pending } = useYamlImport({ prepareYamlImport, validateYamlImport });

  const [menuOpen, setMenuOpen] = useState(false);
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);

  const isMini = mode === 'mini';
  const busy = pending || urlLoading;

  useEffect(() => {
    if (!menuOpen) return;

    function onClickOutside(event: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(event.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [menuOpen]);

  function pickFile() {
    setMenuOpen(false);
    inputRef.current?.click();
  }

  function openUrlDialog() {
    setMenuOpen(false);
    setUrlDialogOpen(true);
  }

  async function handleUrlConfirm() {
    setUrlLoading(true);
    try {
      await importCvFromUrl(url, importFile);
      setUrlDialogOpen(false);
      setUrl('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load resume from URL.');
    } finally {
      setUrlLoading(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        accept=".yaml,.yml,text/yaml,application/x-yaml,text/plain"
        className="hidden"
        type="file"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void importFile(file).finally(() => {
              if (inputRef.current) {
                inputRef.current.value = '';
              }
            });
          }
        }}
      />

      <div className="relative">
        {isMini ? (
          <button
            ref={triggerRef}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="inline-flex h-10 w-full items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            disabled={busy}
            onClick={() => setMenuOpen((value) => !value)}
            title="Import YAML"
            type="button"
          >
            <Upload className="size-4 shrink-0" />
            <span className="sr-only">{busy ? 'Importing…' : 'Import YAML'}</span>
          </button>
        ) : (
          <div className="flex w-full items-center rounded-md transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <button
              className="inline-flex h-10 flex-1 items-center justify-start gap-2 rounded-l-md px-3 text-sm font-medium disabled:pointer-events-none disabled:opacity-50"
              disabled={busy}
              onClick={pickFile}
              title="Import YAML"
              type="button"
            >
              <Upload className="size-4 shrink-0" />
              <span>{busy ? 'Importing YAML…' : 'Import YAML'}</span>
            </button>
            <button
              ref={triggerRef}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="More import options"
              className="inline-flex h-10 w-9 items-center justify-center rounded-r-md border-l border-sidebar-border text-sidebar-foreground/70 transition-colors hover:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50"
              disabled={busy}
              onClick={() => setMenuOpen((value) => !value)}
              type="button"
            >
              <ChevronDown className="size-3.5" />
            </button>
          </div>
        )}

        {menuOpen ? (
          <div
            ref={menuRef}
            className="absolute left-0 right-0 top-full z-50 mt-1 min-w-48 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
            role="menu"
          >
            <button
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs text-popover-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={pickFile}
              role="menuitem"
              type="button"
            >
              <Upload className="size-4" />
              <span>Import YAML file</span>
            </button>
            <button
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs text-popover-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={openUrlDialog}
              role="menuitem"
              type="button"
            >
              <Link2 className="size-4" />
              <span>Import from URL</span>
            </button>
          </div>
        ) : null}
      </div>

      <Dialog.Root open={urlDialogOpen} onOpenChange={setUrlDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay-anim fixed inset-0 z-40 bg-background/60 backdrop-blur-[2px]" />
          <Dialog.Content className="dialog-content-pop fixed left-1/2 top-1/2 z-50 w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-background shadow-2xl outline-none">
            <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
              <div>
                <Dialog.Title className="text-lg font-semibold text-foreground">
                  Import from URL
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                  Paste a link to a hosted RenderCV YAML file. The host must allow
                  cross-origin requests (CORS).
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button
                  aria-label="Close import from URL dialog"
                  className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  type="button"
                >
                  <X className="size-4" />
                </button>
              </Dialog.Close>
            </div>

            <div className="space-y-4 px-6 py-5">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-foreground">Resume URL</span>
                <input
                  autoFocus
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                  onChange={(event) => setUrl(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && url.trim() && !busy) {
                      event.preventDefault();
                      void handleUrlConfirm();
                    }
                  }}
                  placeholder="https://www.julianstokes.ca/CV.yaml"
                  type="url"
                  value={url}
                />
              </label>

              <div className="flex items-center justify-end gap-2">
                <button
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setUrlDialogOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-40"
                  disabled={!url.trim() || busy}
                  onClick={() => void handleUrlConfirm()}
                  type="button"
                >
                  {busy ? 'Importing…' : 'Import'}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
