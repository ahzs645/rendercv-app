import { useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
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
  const variantsInputRef = useRef<HTMLInputElement>(null);
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
  const variantOptions = Object.keys(selectedFile?.variants ?? {});
  const variant =
    active === 'cv' && variantOptions.length > 0
      ? {
          label: 'Variant',
          options: variantOptions,
          renderLabel: variantLabel,
          value: selectedFile?.selectedVariant ?? variantOptions[0],
          onChange: (value: string) => {
            if (selectedFile) {
              fileStore.setSelectedVariant(selectedFile.id, value);
            }
          }
        }
      : active === 'design'
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
  const showVariantControls = Boolean(
    (variant && variant.options.length > 0) ||
      (active === 'design' && onImportDesignTheme) ||
      (active === 'cv' && onImportVariants)
  );

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

        {showVariantControls ? (
          <div className="ml-auto flex items-center gap-0.5" data-testid="variant-selector">
            {active === 'design' && onImportDesignTheme ? (
              <>
                <input
                  ref={themeInputRef}
                  accept=".zip,application/zip"
                  className="hidden"
                  type="file"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) {
                      return;
                    }

                    setIsImportingTheme(true);
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
                        setIsImportingTheme(false);
                        if (themeInputRef.current) {
                          themeInputRef.current.value = '';
                        }
                      });
                  }}
                />
                <button
                  aria-label="Import theme zip"
                  className="inline-flex h-6 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                  disabled={isImportingTheme || themeImportDisabled}
                  onClick={() => themeInputRef.current?.click()}
                  type="button"
                >
                  <Upload className="size-3.5" />
                  {isImportingTheme ? 'Importing…' : 'Import zip'}
                </button>
                <ThemeLibraryDialog
                  disabled={themeImportDisabled}
                  sections={viewerSections}
                  selectedFile={selectedFile}
                  themeKeys={themeOptions}
                  viewer={viewer}
                />
              </>
            ) : null}
            {active === 'cv' && onImportVariants ? (
              <>
                <input
                  ref={variantsInputRef}
                  accept=".yaml,.yml,.json,text/yaml,application/json,text/plain"
                  className="hidden"
                  type="file"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) {
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
                      .finally(() => {
                        setIsImportingVariants(false);
                        if (variantsInputRef.current) {
                          variantsInputRef.current.value = '';
                        }
                      });
                  }}
                />
                <button
                  aria-label="Import variants YAML"
                  className="inline-flex h-6 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                  disabled={isImportingVariants}
                  onClick={() => variantsInputRef.current?.click()}
                  type="button"
                >
                  <Upload className="size-3.5" />
                  {isImportingVariants ? 'Importing…' : 'Import variants'}
                </button>
              </>
            ) : null}
            {variant && variant.options.length > 0 ? (
              <>
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
              </>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="pb-2" />
    </div>
  );
}
