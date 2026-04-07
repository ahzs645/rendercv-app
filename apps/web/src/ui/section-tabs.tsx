import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
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
      : active === 'cv'
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
      (active === 'cv' && onImportVariants)
  );

  return (
    <div className="shrink-0 border-b border-border px-3 pt-2 sm:px-2 sm:pt-1">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-1 overflow-x-auto px-1 sm:mx-0 sm:flex-1 sm:px-0">
          <div className="inline-flex h-9 min-w-max items-center justify-center rounded-lg bg-transparent p-[3px] text-muted-foreground">
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
        </div>

        {showVariantControls ? (
          <div
            className="-mx-1 flex items-center gap-0.5 overflow-x-auto px-1 sm:ml-3 sm:shrink-0 sm:px-0"
            data-testid="variant-selector"
          >
            {null}
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
                <VariantDropdown
                  label={variant.label}
                  options={variant.options}
                  renderLabel={variant.renderLabel}
                  value={variant.value}
                  onChange={variant.onChange}
                />
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
    <div className="relative shrink-0">
      <button
        ref={triggerRef}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-6 items-center gap-1 rounded-md px-2 text-xs font-medium text-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        <span className="inline-grid text-left">
          {options.map((option) => (
            <span
              key={option}
              className={`col-start-1 row-start-1${option !== value ? ' invisible' : ''}`}
            >
              {renderLabel(option)}
            </span>
          ))}
        </span>
        <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
      </button>
      {open ? (
        <div
          ref={menuRef}
          className="absolute left-0 top-full z-50 mt-1 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
          role="menu"
        >
          {options.map((option) => (
            <button
              key={option}
              className="relative flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-xs outline-none select-none hover:bg-accent hover:text-accent-foreground"
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
