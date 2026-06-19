import { useCallback, useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Check, ChevronDown, ChevronLeft, ChevronRight, Layers, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';
import type { CvFile, CvFileSections, SectionKey } from '@rendercv/contracts';
import { SECTION_LABELS } from '@rendercv/contracts';
import {
  defaultDesigns,
  fileStore,
  localeLabel,
  preferencesStore,
  themeLabel,
  variantLabel
} from '@rendercv/core';
import { toast } from 'sonner';
import { useStore } from '../lib/use-store';
import type { ViewerRenderer } from './preview-pane';
import { ThemeLibraryDialog } from './theme-library-dialog';

const TAB_ORDER = Object.keys(SECTION_LABELS) as SectionKey[];
const BUILT_IN_THEME_KEYS = Object.keys(defaultDesigns);

export function SectionTabs({
  active,
  onSelect,
  onImportDesignTheme,
  onImportVariants,
  selectedFile,
  themeImportDisabled = false,
  viewer,
  viewerSections
}: {
  active: SectionKey;
  onSelect: (section: SectionKey) => void;
  onImportDesignTheme?: (file: File) => Promise<string | null>;
  onImportVariants?: (file: File) => Promise<string | null>;
  selectedFile?: CvFile;
  themeImportDisabled?: boolean;
  viewer: ViewerRenderer;
  viewerSections?: CvFileSections;
}) {
  const themeInputRef = useRef<HTMLInputElement>(null);
  const [isImportingTheme, setIsImportingTheme] = useState(false);
  const [isImportingVariants, setIsImportingVariants] = useState(false);
  const preferences = useStore(preferencesStore);
  const themeOptions = Array.from(
    new Set([
      ...BUILT_IN_THEME_KEYS,
      ...Object.keys(preferences.themeLibrary),
      ...Object.keys(selectedFile?.designs ?? {})
    ])
  );
  const variant =
    active === 'cv'
      ? {
            label: 'Theme',
            options: themeOptions,
            renderLabel: themeLabel,
            value: selectedFile?.selectedTheme,
            onChange: (value: string) => {
              if (selectedFile) {
                fileStore.setTheme(selectedFile.id, value);
              }
            }
          }
      : active === 'locale'
        ? {
            label: 'Locale',
            options: Object.keys(selectedFile?.locales ?? {}),
            renderLabel: localeLabel,
            value: selectedFile?.selectedLocale,
            onChange: (value: string) => {
              if (selectedFile) {
                fileStore.setLocale(selectedFile.id, value);
              }
            }
          }
        : undefined;

  const currentIndex = variant?.value ? variant.options.indexOf(variant.value) : -1;
  const canCycle = Boolean(variant && variant.options.length > 1 && currentIndex >= 0);
  const showVariantControls = Boolean(variant && variant.options.length > 0);

  return (
    <div className="shrink-0 border-b border-border px-3 pt-2 sm:px-2 sm:pt-1" data-onboarding="section-tabs">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-1 overflow-x-auto px-1 sm:mx-0 sm:flex-1 sm:px-0">
          <div className="inline-flex min-h-11 min-w-max items-center justify-center rounded-lg bg-transparent p-[3px] text-muted-foreground sm:h-9 sm:min-h-0">
          {TAB_ORDER.map((section) => (
            <button
              key={section}
              className={`inline-flex min-h-10 items-center justify-center rounded-md border px-3 py-2 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none sm:h-[calc(100%-1px)] sm:min-h-0 sm:px-2 sm:py-1 ${
                active === section
                  ? 'border-border/60 bg-background text-foreground shadow-sm'
                  : 'border-transparent text-foreground hover:bg-muted hover:text-foreground'
              }`}
              data-testid={`tab-${section}`}
              onClick={() => onSelect(section)}
              type="button"
            >
              {SECTION_LABELS[section]}
            </button>
          ))}
          </div>
        </div>

        {showVariantControls || (active === 'cv' && selectedFile) ? (
          <div
            className="-mx-1 flex flex-nowrap items-center gap-1 overflow-visible px-1 sm:ml-3 sm:shrink-0 sm:gap-0.5 sm:px-0"
            data-testid="variant-selector"
          >
            {active === 'cv' && selectedFile ? (
              <VariantManager
                selectedFile={selectedFile}
                onImportVariants={onImportVariants}
                isImporting={isImportingVariants}
                onImport={(file) => {
                  if (!onImportVariants) {
                    return;
                  }
                  setIsImportingVariants(true);
                  void onImportVariants(file)
                    .then((selectedVariant) => {
                      const suffix = selectedVariant
                        ? ` Selected ${variantLabel(selectedVariant)}.`
                        : '';
                      toast.success(`Imported variants.${suffix}`);
                    })
                    .catch((error) => {
                      toast.error(
                        error instanceof Error ? error.message : 'Failed to import variants.'
                      );
                    })
                    .finally(() => setIsImportingVariants(false));
                }}
              />
            ) : null}
            {variant && variant.options.length > 0 ? (
              <>
                <button
                  aria-label={`Previous ${variant.label.toLowerCase()}`}
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 sm:size-6"
                  disabled={!canCycle}
                  onClick={() => {
                    if (!canCycle || currentIndex <= 0) {
                      return;
                    }

                    variant.onChange(variant.options[currentIndex - 1]!);
                  }}
                  type="button"
                >
                  <ChevronLeft className="size-4 sm:size-3.5" />
                </button>
                <VariantDropdown
                  label={variant.label}
                  options={variant.options}
                  renderLabel={variant.renderLabel}
                  value={variant.value}
                  onChange={variant.onChange}
                />
                <button
                  aria-label={`Next ${variant.label.toLowerCase()}`}
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 sm:size-6"
                  disabled={!canCycle}
                  onClick={() => {
                    if (!canCycle || currentIndex >= variant.options.length - 1) {
                      return;
                    }

                    variant.onChange(variant.options[currentIndex + 1]!);
                  }}
                  type="button"
                >
                  <ChevronRight className="size-4 sm:size-3.5" />
                </button>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="pb-2" />
    </div>
  );
}

function VariantManager({
  selectedFile,
  onImportVariants,
  onImport,
  isImporting
}: {
  selectedFile: CvFile;
  onImportVariants?: (file: File) => Promise<string | null>;
  onImport: (file: File) => void;
  isImporting: boolean;
}) {
  const preferences = useStore(preferencesStore);
  const [open, setOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const close = useCallback(() => setOpen(false), []);

  const variants = selectedFile.variants ?? {};
  const variantKeys = Object.keys(variants);
  const selectedKey = selectedFile.selectedVariant ?? null;
  const readOnly = Boolean(selectedFile.isReadOnly);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        close();
      }
    }
    function onEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') close();
    }
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open, close]);

  function handleNewVariant() {
    const name = window.prompt('New variant name', '');
    if (name === null) return;
    const key = fileStore.createVariant(selectedFile.id, name);
    if (key) {
      toast.success(`Created variant "${variantLabel(key)}". Toggle sections/entries to shape it.`);
    }
    close();
  }

  function handleEdit(key: string) {
    setEditingKey(key);
    close();
  }

  function handleDelete(key: string) {
    if (!window.confirm(`Delete the "${variantLabel(key)}" variant? This won't delete any CV content.`)) {
      return;
    }
    fileStore.deleteVariant(selectedFile.id, key);
    toast.success(`Deleted variant "${variantLabel(key)}".`);
  }

  const triggerLabel = selectedKey ? variantLabel(selectedKey) : 'No variant';

  return (
    <div ref={containerRef} className="relative min-w-0">
      <input
        ref={fileInputRef}
        accept=".yaml,.yml,.json,text/yaml,application/json,text/plain"
        className="hidden"
        type="file"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onImport(file);
          }
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }}
      />
      <button
        aria-label="Variants"
        aria-haspopup="menu"
        aria-expanded={open}
        data-testid="variant-manager-trigger"
        className="inline-flex min-h-10 min-w-0 max-w-full items-center gap-1.5 rounded-md px-3 text-sm font-medium text-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground sm:h-6 sm:min-h-0 sm:gap-1 sm:px-2 sm:text-xs"
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        <Layers className="size-4 shrink-0 sm:size-3.5" />
        <span className="truncate">{triggerLabel}</span>
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground sm:size-3" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 min-w-[14rem] max-h-[min(360px,60vh)] overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {variantKeys.length > 0 ? (
            <>
              <p className="px-2 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Variants
              </p>
              {variantKeys.map((key) => (
                <div
                  key={key}
                  className={`group/variant flex items-center gap-1 rounded-sm pl-2 pr-1 ${
                    key === selectedKey ? 'bg-accent/60' : 'hover:bg-accent'
                  }`}
                >
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={key === selectedKey}
                    className="flex flex-1 items-center gap-2 py-1.5 text-left text-xs outline-none"
                    onClick={() => {
                      fileStore.setSelectedVariant(selectedFile.id, key);
                      close();
                    }}
                  >
                    {key === selectedKey ? <Check className="size-3 shrink-0" /> : <span className="size-3 shrink-0" />}
                    <span className="truncate">{variantLabel(key)}</span>
                  </button>
                  {!readOnly ? (
                    <>
                      <button
                        type="button"
                        aria-label={`Edit ${variantLabel(key)}`}
                        className="flex size-6 items-center justify-center rounded text-muted-foreground/70 hover:bg-muted hover:text-foreground"
                        onClick={() => handleEdit(key)}
                      >
                        <Pencil className="size-3" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${variantLabel(key)}`}
                        className="flex size-6 items-center justify-center rounded text-muted-foreground/70 hover:bg-muted hover:text-destructive"
                        onClick={() => handleDelete(key)}
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </>
                  ) : null}
                </div>
              ))}
              <div className="my-1 h-px bg-border/60" />
            </>
          ) : (
            <p className="px-2 pt-1 pb-2 text-[11px] leading-4 text-muted-foreground">
              No variants yet. Create one, then toggle sections/entries off to tailor what it shows.
            </p>
          )}
          {!readOnly ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs hover:bg-accent hover:text-accent-foreground"
              onClick={handleNewVariant}
            >
              <Plus className="size-3.5 shrink-0" />
              New variant
            </button>
          ) : null}
          {onImportVariants ? (
            <button
              type="button"
              role="menuitem"
              disabled={isImporting}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-3.5 shrink-0" />
              {isImporting ? 'Importing…' : 'Import variants…'}
            </button>
          ) : null}
          <div className="my-1 h-px bg-border/60" />
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={preferences.hideArchivedEntries}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs hover:bg-accent hover:text-accent-foreground"
            onClick={() =>
              preferencesStore.patch({ hideArchivedEntries: !preferences.hideArchivedEntries })
            }
          >
            {preferences.hideArchivedEntries ? <Check className="size-3.5 shrink-0" /> : <span className="size-3.5 shrink-0" />}
            Hide archived entries
          </button>
        </div>
      ) : null}
      <VariantEditDialog
        selectedFile={selectedFile}
        variantKey={editingKey}
        onClose={() => setEditingKey(null)}
      />
    </div>
  );
}

function VariantEditDialog({
  selectedFile,
  variantKey,
  onClose
}: {
  selectedFile: CvFile;
  variantKey: string | null;
  onClose: () => void;
}) {
  const variant = variantKey ? selectedFile.variants?.[variantKey] : undefined;
  const open = Boolean(variantKey && variant);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [flavors, setFlavors] = useState<string[]>([]);

  // Seed the form from the variant whenever a different variant is opened.
  useEffect(() => {
    if (!variantKey || !variant) {
      return;
    }
    setName(variantLabel(variantKey));
    setDescription(variant.description ?? '');
    setTags(variant.tags ?? []);
    setFlavors(variant.flavors ?? []);
    // Only re-seed when the edited variant changes, not on every keystroke that
    // mutates the underlying variant object.
  }, [variantKey]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSave() {
    if (!variantKey) {
      return;
    }

    let targetKey = variantKey;
    const trimmedName = name.trim();
    if (trimmedName && trimmedName !== variantLabel(variantKey)) {
      const renamed = fileStore.renameVariant(selectedFile.id, variantKey, trimmedName);
      if (!renamed) {
        toast.error('That name is empty or already used by another variant.');
        return;
      }
      targetKey = renamed;
    }

    fileStore.updateVariant(selectedFile.id, targetKey, {
      description: description.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      flavors: flavors.length > 0 ? flavors : undefined
    });
    toast.success(`Saved “${variantLabel(targetKey)}”.`);
    onClose();
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay-anim fixed inset-0 z-40 bg-background/60 backdrop-blur-[2px]" />
        <Dialog.Content className="dialog-content-fade fixed inset-x-4 top-1/2 z-50 max-h-[85vh] -translate-y-1/2 overflow-y-auto rounded-3xl border border-border bg-background shadow-2xl outline-none md:left-1/2 md:w-[min(480px,calc(100vw-3rem))] md:-translate-x-1/2">
          <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
            <div className="min-w-0">
              <Dialog.Title className="text-lg font-semibold text-foreground">Edit variant</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Name this variant and choose which tagged content and field flavors it includes.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          <form
            className="space-y-5 px-6 py-5"
            onSubmit={(event) => {
              event.preventDefault();
              handleSave();
            }}
          >
            <div>
              <label
                htmlFor="variant-name"
                className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Name
              </label>
              <input
                id="variant-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Academic"
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 placeholder:text-muted-foreground/60"
              />
            </div>

            <div>
              <label
                htmlFor="variant-description"
                className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Description
              </label>
              <textarea
                id="variant-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={2}
                placeholder="Optional note about when to use this variant"
                className="mt-1 w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 placeholder:text-muted-foreground/60"
              />
            </div>

            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tags
              </span>
              <TokenInput tokens={tags} onChange={setTags} placeholder="Add a tag and press Enter" />
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Entries tagged with any of these show in the variant; entries with a matching inverse
                tag (<code className="rounded bg-muted px-1 py-0.5 text-[11px]">itags</code>) are hidden.
              </p>
            </div>

            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Flavors
              </span>
              <TokenInput tokens={flavors} onChange={setFlavors} placeholder="Add a flavor and press Enter" />
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                When a field defines flavors, the first one listed here that matches is used.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Save
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function TokenInput({
  tokens,
  onChange,
  placeholder
}: {
  tokens: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState('');

  function commit(raw: string) {
    const parts = raw
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length === 0) {
      setDraft('');
      return;
    }
    const next = [...tokens];
    for (const part of parts) {
      if (!next.includes(part)) {
        next.push(part);
      }
    }
    onChange(next);
    setDraft('');
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1.5 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
      {tokens.map((token) => (
        <span
          key={token}
          className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs text-foreground"
        >
          {token}
          <button
            type="button"
            aria-label={`Remove ${token}`}
            className="text-muted-foreground/70 hover:text-foreground"
            onClick={() => onChange(tokens.filter((value) => value !== token))}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            commit(draft);
          } else if (event.key === 'Backspace' && draft === '' && tokens.length > 0) {
            onChange(tokens.slice(0, -1));
          }
        }}
        onBlur={() => commit(draft)}
        placeholder={tokens.length === 0 ? placeholder : ''}
        className="min-w-[8rem] flex-1 bg-transparent py-0.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
      />
    </div>
  );
}

function VariantDropdown({
  label,
  options,
  renderLabel,
  value,
  onChange
}: {
  label: string;
  options: string[];
  renderLabel: (key: string) => string;
  value?: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(event: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(event.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(event.target as Node)
      ) {
        close();
      }
    }
    function onEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') close();
    }
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open, close]);

  return (
    <div className="relative min-w-0">
      <button
        ref={triggerRef}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex min-h-10 min-w-0 max-w-full items-center gap-1.5 rounded-md px-3 text-sm font-medium text-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground sm:h-6 sm:min-h-0 sm:gap-1 sm:px-2 sm:text-xs"
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        <span className="inline-grid min-w-0 text-left">
          {options.map((option) => (
            <span
              key={option}
              className={`col-start-1 row-start-1 truncate${option !== value ? ' invisible' : ''}`}
            >
              {renderLabel(option)}
            </span>
          ))}
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground sm:size-3" />
      </button>
      {open ? (
        <div
          ref={menuRef}
          className="absolute right-0 top-full z-50 mt-1 min-w-[8rem] max-h-[min(300px,50vh)] overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
          role="menu"
        >
          {options.map((option) => (
            <button
              key={option}
              className="relative flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2.5 text-sm whitespace-nowrap text-left outline-none select-none hover:bg-accent hover:text-accent-foreground sm:rounded-sm sm:px-2 sm:py-1.5 sm:text-xs"
              role="menuitem"
              type="button"
              onClick={() => {
                onChange(option);
                close();
              }}
            >
              {option === value ? (
                <Check className="size-3" />
              ) : (
                <span className="size-3" />
              )}
              {renderLabel(option)}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
