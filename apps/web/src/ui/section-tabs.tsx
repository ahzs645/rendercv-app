import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { CvFile, SectionKey } from '@rendercv/contracts';
import { SECTION_LABELS } from '@rendercv/contracts';
import { fileStore, localeLabel, themeLabel } from '@rendercv/core';

const TAB_ORDER = Object.keys(SECTION_LABELS) as SectionKey[];

export function SectionTabs({
  active,
  onSelect,
  selectedFile
}: {
  active: SectionKey;
  onSelect: (section: SectionKey) => void;
  selectedFile?: CvFile;
}) {
  const variant =
    active === 'design'
      ? {
          label: 'Theme',
          options: Object.keys(selectedFile?.designs ?? {}),
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

  return (
    <div className="shrink-0 border-b border-border px-2 pt-1">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
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
    </div>
  );
}
