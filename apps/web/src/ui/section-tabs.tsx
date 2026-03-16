import { useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import type { CvFile, SectionKey } from '@rendercv/contracts';
import { SECTION_LABELS } from '@rendercv/contracts';
import { defaultDesigns, fileStore, localeLabel, preferencesStore, themeLabel } from '@rendercv/core';
import { toast } from 'sonner';
import { useStore } from '../lib/use-store';

const TAB_ORDER = Object.keys(SECTION_LABELS) as SectionKey[];
const BUILT_IN_THEME_KEYS = Object.keys(defaultDesigns);

export function SectionTabs({
  active,
  onSelect,
  onImportDesignTheme,
  selectedFile,
  themeImportDisabled = false
}: {
  active: SectionKey;
  onSelect: (section: SectionKey) => void;
  onImportDesignTheme?: (file: File) => Promise<string | null>;
  selectedFile?: CvFile;
  themeImportDisabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const preferences = useStore(preferencesStore);
  const themeOptions = Array.from(
    new Set([
      ...BUILT_IN_THEME_KEYS,
      ...Object.keys(preferences.themeLibrary),
      ...Object.keys(selectedFile?.designs ?? {})
    ])
  );
  const variant =
    active === 'design'
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
  const designLibraryThemes =
    active === 'design'
      ? Array.from(new Set([...themeOptions]))
      : [];

  return (
    <div className="shrink-0 border-b border-border px-2 pt-1">
      <div className="flex items-center gap-2 overflow-x-auto">
        <div className="inline-flex h-9 w-fit items-center justify-center rounded-lg bg-transparent p-[3px] text-muted-foreground">
          {TAB_ORDER.map((section) => (
            <button
              key={section}
              className={`inline-flex h-[calc(100%-1px)] items-center justify-center rounded-md border px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none ${
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

        {variant && variant.options.length > 0 ? (
          <div className="ml-auto flex items-center gap-0.5" data-testid="variant-selector">
            {active === 'design' && onImportDesignTheme ? (
              <>
                <input
                  ref={inputRef}
                  accept=".zip,application/zip"
                  className="hidden"
                  type="file"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) {
                      return;
                    }

                    setIsImporting(true);
                    void onImportDesignTheme(file)
                      .then((themeName) => {
                        if (themeName) {
                          toast.success(`Imported theme "${themeName}".`);
                        }
                      })
                      .catch((error) => {
                        toast.error(error instanceof Error ? error.message : 'Failed to import theme.');
                      })
                      .finally(() => {
                        setIsImporting(false);
                        if (inputRef.current) {
                          inputRef.current.value = '';
                        }
                      });
                  }}
                />
                <button
                  aria-label="Import theme zip"
                  className="inline-flex h-6 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                  disabled={isImporting || themeImportDisabled}
                  onClick={() => inputRef.current?.click()}
                  type="button"
                >
                  <Upload className="size-3.5" />
                  {isImporting ? 'Importing…' : 'Import zip'}
                </button>
              </>
            ) : null}
            <button
              aria-label={`Previous ${variant.label.toLowerCase()}`}
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
              disabled={!canCycle}
              onClick={() => {
                if (!canCycle || currentIndex <= 0) {
                  return;
                }

                variant.onChange(variant.options[currentIndex - 1]!);
              }}
              type="button"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <div className="relative shrink-0">
              <select
                aria-label={variant.label}
                className="h-6 appearance-none rounded-md bg-transparent px-2 pr-6 text-xs font-medium text-foreground outline-none transition-colors hover:bg-accent focus-visible:bg-accent"
                value={variant.value}
                onChange={(event) => variant.onChange(event.target.value)}
              >
                {variant.options.map((option) => (
                  <option key={option} value={option}>
                    {variant.renderLabel(option)}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
            </div>
            <button
              aria-label={`Next ${variant.label.toLowerCase()}`}
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
              disabled={!canCycle}
              onClick={() => {
                if (!canCycle || currentIndex >= variant.options.length - 1) {
                  return;
                }

                variant.onChange(variant.options[currentIndex + 1]!);
              }}
              type="button"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        ) : null}
      </div>
      {active === 'design' && designLibraryThemes.length > 0 ? (
        <div className="flex items-center gap-2 overflow-x-auto py-2">
          <p className="shrink-0 text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
            Theme Library
          </p>
          <div className="flex items-center gap-1">
            {designLibraryThemes.map((themeKey) => {
              const selected = selectedFile?.selectedTheme === themeKey;
              return (
                <button
                  key={themeKey}
                  className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                    selected
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border/60 text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                  onClick={() => {
                    if (selectedFile) {
                      fileStore.setTheme(selectedFile.id, themeKey);
                    }
                  }}
                  type="button"
                >
                  {themeLabel(themeKey)}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="pb-2" />
      )}
    </div>
  );
}
