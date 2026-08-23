import * as Dialog from '@radix-ui/react-dialog';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, FolderDown, KeyRound, Sparkles, Trash2, TriangleAlert } from 'lucide-react';
import { fileStore, preferencesStore, resolveFileSections } from '@rendercv/core';
import type { AiApiKeys, AiProviderId } from '@rendercv/contracts';
import { toast } from 'sonner';
import { useStore } from '../lib/use-store';
import { DialogOverlay, DialogShell } from './dialog-shell';
import { LOCAL_STORAGE_KEYS, PYODIDE_CACHE_DB_NAME } from '../lib/storage-keys';
import { downloadBlob } from '../features/viewer/download';
import type { ZipFile } from '../features/files/zip.worker';
import { UI_LANGUAGES, type UiLanguage } from '../lib/i18n/messages';
import { useTranslation } from '../lib/i18n/use-translation';

export type SettingsTab = 'ai' | 'appearance' | 'data';

const TABS: ReadonlyArray<{ id: SettingsTab; label: string }> = [
  { id: 'ai', label: 'AI providers' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'data', label: 'Data' }
];

const PROVIDERS: ReadonlyArray<{
  id: AiProviderId;
  label: string;
  description: string;
  keyField?: keyof AiApiKeys;
  keyLabel?: string;
  keyHint?: string;
}> = [
  {
    id: 'managed',
    label: 'Managed (default)',
    description: 'Use the built-in assistant. Counts against the workspace quota.'
  },
  {
    id: 'openai',
    label: 'OpenAI',
    description: 'Use your own OpenAI key. No usage is counted server-side.',
    keyField: 'openai',
    keyLabel: 'OpenAI API key',
    keyHint: 'Starts with sk-…'
  },
  {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    description: 'Use your own Anthropic key. No usage is counted server-side.',
    keyField: 'anthropic',
    keyLabel: 'Anthropic API key',
    keyHint: 'Starts with sk-ant-…'
  }
];

const CLEAR_CONFIRMATION = 'DELETE';

export function SettingsDialog({
  open,
  initialTab = 'ai',
  onOpenChange
}: {
  open: boolean;
  initialTab?: SettingsTab;
  onOpenChange: (open: boolean) => void;
}) {
  const [tab, setTab] = useState<SettingsTab>(initialTab);

  useEffect(() => {
    if (open) {
      setTab(initialTab);
    }
  }, [open, initialTab]);

  const aiForm = useAiProviderForm(open, () => onOpenChange(false));

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <DialogOverlay />
        <DialogShell
          bodyClassName="space-y-4"
          closeLabel="Close settings"
          description={
            tab === 'ai'
              ? 'Choose which model powers the AI editor. Bring your own API key to bypass the workspace quota — keys are stored only in this browser.'
              : tab === 'appearance'
                ? 'How the app itself is presented. These settings live in this browser only.'
                : 'Export or erase everything this browser has stored for RenderCV.'
          }
          footer={
            tab === 'ai' ? (
              <>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="button"
                  onClick={aiForm.save}
                  className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  Save
                </button>
              </>
            ) : null
          }
          subheader={
            <div className="shrink-0 border-b border-border px-4 pt-3">
              <div className="flex gap-1" role="tablist">
                {TABS.map((option) => (
                  <button
                    key={option.id}
                    aria-selected={tab === option.id}
                    className={`rounded-t-md border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                      tab === option.id
                        ? 'border-primary text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setTab(option.id)}
                    role="tab"
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          }
          title="Settings"
          width="md"
        >
          {tab === 'ai' ? (
            <AiProvidersPanel form={aiForm} />
          ) : tab === 'appearance' ? (
            <AppearancePanel />
          ) : (
            <DataPanel />
          )}
        </DialogShell>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

type AiProviderForm = ReturnType<typeof useAiProviderForm>;

function useAiProviderForm(open: boolean, onSaved: () => void) {
  const preferences = useStore(preferencesStore);
  const [provider, setProvider] = useState<AiProviderId>(preferences.aiProvider);
  const [keys, setKeys] = useState<AiApiKeys>(preferences.aiApiKeys);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open) {
      setProvider(preferences.aiProvider);
      setKeys(preferences.aiApiKeys);
      setRevealed({});
    }
  }, [open, preferences.aiProvider, preferences.aiApiKeys]);

  function save() {
    const trimmedKeys: AiApiKeys = {};
    for (const [field, value] of Object.entries(keys) as Array<[keyof AiApiKeys, string | undefined]>) {
      const trimmed = value?.trim();
      if (trimmed) trimmedKeys[field] = trimmed;
    }

    const selectedProvider = PROVIDERS.find((p) => p.id === provider);
    if (selectedProvider?.keyField && !trimmedKeys[selectedProvider.keyField]) {
      toast.error(`Enter a key for ${selectedProvider.label} or choose a different provider.`);
      return;
    }

    preferencesStore.patch({
      aiProvider: provider,
      aiApiKeys: trimmedKeys
    });
    toast.success('AI provider settings saved.');
    onSaved();
  }

  return { keys, provider, revealed, save, setKeys, setProvider, setRevealed };
}

function AiProvidersPanel({ form }: { form: AiProviderForm }) {
  const { keys, provider, revealed, setKeys, setProvider, setRevealed } = form;

  return (
    <>
        {PROVIDERS.map((option) => {
          const isSelected = provider === option.id;
          const fieldName = option.keyField;
          const currentValue = fieldName ? keys[fieldName] ?? '' : '';
          const showKey = fieldName ? revealed[fieldName] : false;

          return (
            <label
              key={option.id}
              className={`block rounded-2xl border p-4 transition-colors ${
                isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-border'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="ai-provider"
                  checked={isSelected}
                  onChange={() => setProvider(option.id)}
                  className="mt-1"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{option.label}</p>
                  <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{option.description}</p>

                  {fieldName ? (
                    <div className="mt-3">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {option.keyLabel}
                      </label>
                      <div className="mt-1 flex items-stretch gap-2">
                        <div className="flex flex-1 items-center rounded-md border border-border bg-background pl-2">
                          <KeyRound className="size-3.5 text-muted-foreground" />
                          <input
                            type={showKey ? 'text' : 'password'}
                            autoComplete="off"
                            spellCheck={false}
                            value={currentValue}
                            placeholder={option.keyHint}
                            onChange={(event) =>
                              setKeys((current) => ({
                                ...current,
                                [fieldName]: event.target.value
                              }))
                            }
                            className="flex-1 bg-transparent px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
                          />
                          <button
                            type="button"
                            aria-label={showKey ? 'Hide key' : 'Reveal key'}
                            onClick={() =>
                              setRevealed((current) => ({ ...current, [fieldName]: !current[fieldName] }))
                            }
                            className="mr-1 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                          >
                            {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </label>
          );
        })}
    </>
  );
}

/**
 * Interface language only. The CV's own `locale:` section decides how the
 * rendered document reads and is edited on the Locale tab, so the two are kept
 * deliberately apart.
 */
function AppearancePanel() {
  const { t, language, setLanguage } = useTranslation();

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label
          className="text-sm font-medium text-foreground"
          htmlFor="settings-ui-language"
        >
          {t('settings.language')}
        </label>
        <select
          id="settings-ui-language"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          value={language}
          onChange={(event) => setLanguage(event.target.value as UiLanguage)}
        >
          {Object.entries(UI_LANGUAGES).map(([value, option]) => (
            <option key={value} value={value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">{t('settings.language.help')}</p>
      </div>
    </div>
  );
}

function DataPanel() {
  const { t } = useTranslation();
  const snapshot = useStore(fileStore);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearDraft, setClearDraft] = useState('');
  const [confirmingClear, setConfirmingClear] = useState(false);

  const trashedFiles = useMemo(() => snapshot.files.filter((file) => file.isTrashed), [snapshot.files]);
  const activeCount = snapshot.files.filter((file) => !file.isArchived && !file.isTrashed).length;
  const archivedCount = snapshot.files.filter((file) => file.isArchived && !file.isTrashed).length;

  const downloadAllData = useCallback(async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const files: ZipFile[] = snapshot.files.map((file) => ({
        name: file.name,
        sections: resolveFileSections(file),
        group: file.isTrashed ? 'Trash' : file.isArchived ? 'Archive' : undefined
      }));

      if (files.length === 0) {
        toast.error('No CVs available to export.');
        return;
      }

      const blob = await new Promise<Blob>((resolve, reject) => {
        import('../features/files/zip.worker?worker')
          .then((ZipWorker) => {
            const worker = new ZipWorker.default();
            worker.postMessage({ files });
            worker.onmessage = (
              event: MessageEvent<{ type: 'SUCCESS'; blob: Blob } | { type: 'ERROR'; message: string }>
            ) => {
              worker.terminate();
              if (event.data.type === 'SUCCESS') {
                resolve(event.data.blob);
              } else {
                reject(new Error(event.data.message));
              }
            };
            worker.onerror = () => {
              worker.terminate();
              reject(new Error('Failed to create data export.'));
            };
          })
          .catch(reject);
      });

      await downloadBlob(blob, 'CVs.zip');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to download all data.');
    } finally {
      setIsDownloading(false);
    }
  }, [isDownloading, snapshot.files]);

  function emptyTrash() {
    if (trashedFiles.length === 0) return;
    const label = trashedFiles.length === 1 ? '1 CV' : `${trashedFiles.length} CVs`;
    if (!window.confirm(`Permanently delete ${label} in the trash? This cannot be undone.`)) {
      return;
    }

    for (const file of trashedFiles) {
      fileStore.deleteFile(file.id);
    }
    toast.success(`Deleted ${label} from the trash.`);
  }

  async function clearAllData() {
    if (isClearing) return;
    setIsClearing(true);

    try {
      // Delete through the store so cloud-synced copies are removed too, then
      // wipe local storage and reload into a fresh workspace.
      for (const file of snapshot.files) {
        fileStore.deleteFile(file.id);
      }

      for (const key of LOCAL_STORAGE_KEYS) {
        localStorage.removeItem(key);
      }

      await clearDatabase(PYODIDE_CACHE_DB_NAME);
      window.location.reload();
    } catch (error) {
      setIsClearing(false);
      toast.error(error instanceof Error ? error.message : 'Failed to clear data.');
    }
  }

  return (
    <>
      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <FolderDown className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{t('settings.downloadAll')}</p>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              A zip of every CV — {activeCount} active, {archivedCount} archived, {trashedFiles.length} in
              trash — with archived and trashed CVs in their own folders.
            </p>
            <button
              className="mt-3 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isDownloading}
              onClick={() => void downloadAllData()}
              type="button"
            >
              {isDownloading ? 'Downloading…' : 'Download zip'}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <Trash2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{t('settings.emptyTrash')}</p>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              {trashedFiles.length === 0
                ? 'Trash is empty.'
                : `Permanently delete ${trashedFiles.length === 1 ? '1 CV' : `${trashedFiles.length} CVs`} currently in the trash.`}
            </p>
            <button
              className="mt-3 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-60"
              disabled={trashedFiles.length === 0}
              onClick={emptyTrash}
              type="button"
            >
              Empty trash
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4">
        <div className="flex items-start gap-3">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{t('settings.clearAll')}</p>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              Deletes every CV, review session, custom theme, and preference — including saved AI API keys —
              from this browser. Download a backup first; this cannot be undone.
            </p>
            {confirmingClear ? (
              <div className="mt-3 space-y-2">
                <label className="block text-xs text-muted-foreground" htmlFor="clear-all-confirm">
                  Type <span className="font-semibold text-foreground">{CLEAR_CONFIRMATION}</span> to confirm.
                </label>
                <input
                  id="clear-all-confirm"
                  autoComplete="off"
                  autoFocus
                  className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-destructive"
                  onChange={(event) => setClearDraft(event.target.value)}
                  spellCheck={false}
                  value={clearDraft}
                />
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={clearDraft.trim() !== CLEAR_CONFIRMATION || isClearing}
                    onClick={() => void clearAllData()}
                    type="button"
                  >
                    {isClearing ? 'Clearing…' : 'Delete everything'}
                  </button>
                  <button
                    className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
                    onClick={() => {
                      setConfirmingClear(false);
                      setClearDraft('');
                    }}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="mt-3 rounded-md border border-destructive/50 bg-background px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10"
                onClick={() => setConfirmingClear(true)}
                type="button"
              >
                Clear all data
              </button>
            )}
          </div>
        </div>
      </section>

      <p className="flex items-start gap-2 px-1 text-xs leading-5 text-muted-foreground">
        <Sparkles className="mt-0.5 size-3.5 shrink-0" />
        Everything above is stored in this browser only. Clearing site data in your browser settings has the
        same effect as "Clear all data".
      </p>
    </>
  );
}

/**
 * Empties every store in `name` instead of dropping the database: the render
 * worker keeps a connection open, which would block a `deleteDatabase` until
 * the reload tears the page down — leaving the data behind.
 *
 * Failures resolve rather than reject; local storage is already gone by this
 * point and the reload must still happen.
 */
function clearDatabase(name: string) {
  return new Promise<void>((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve();
      return;
    }

    const request = indexedDB.open(name);
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
    request.onsuccess = () => {
      const db = request.result;
      const stores = Array.from(db.objectStoreNames);
      if (stores.length === 0) {
        db.close();
        resolve();
        return;
      }

      const transaction = db.transaction(stores, 'readwrite');
      for (const store of stores) {
        transaction.objectStore(store).clear();
      }
      const finish = () => {
        db.close();
        resolve();
      };
      transaction.oncomplete = finish;
      transaction.onerror = finish;
      transaction.onabort = finish;
    };
  });
}
