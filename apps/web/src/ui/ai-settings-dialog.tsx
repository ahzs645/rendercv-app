import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useState } from 'react';
import { Eye, EyeOff, KeyRound, X } from 'lucide-react';
import { preferencesStore } from '@rendercv/core';
import type { AiApiKeys, AiProviderId } from '@rendercv/contracts';
import { toast } from 'sonner';
import { useStore } from '../lib/use-store';

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

export function AiSettingsDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
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

  function handleSave() {
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
    onOpenChange(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay-anim fixed inset-0 z-40 bg-background/60 backdrop-blur-[2px]" />
        <Dialog.Content className="dialog-content-fade fixed inset-x-4 top-1/2 z-50 max-h-[85vh] -translate-y-1/2 overflow-hidden rounded-3xl border border-border bg-background shadow-2xl outline-none md:left-1/2 md:w-[min(560px,calc(100vw-3rem))] md:-translate-x-1/2">
          <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
            <div className="min-w-0">
              <Dialog.Title className="text-lg font-semibold text-foreground">AI providers</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Choose which model powers the AI editor. Bring your own API key to bypass the workspace
                quota — keys are stored only in this browser.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                aria-label="Close AI settings"
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                type="button"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="max-h-[calc(85vh-9rem)] space-y-4 overflow-auto px-6 py-5">
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
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border bg-card/40 px-6 py-3">
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
              onClick={handleSave}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Save
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
