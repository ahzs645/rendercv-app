import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import YAML from 'yaml';
import { defaultDesigns, fileStore } from '@rendercv/core';
import type { CvFileSections } from '@rendercv/contracts';
import type { RenderError } from '../features/viewer/use-viewer-renderer';
import { summarizeRenderErrors } from '../features/viewer/render-error-format';

const MAX_YAML_SIZE = 1024 * 1024;

type ImportedYamlSections = Partial<CvFileSections> & {
  selectedTheme?: string;
  selectedLocale?: string;
};

export type PreparedYamlImport = {
  sections: ImportedYamlSections;
  additionalDesigns?: Record<string, string>;
  message?: string;
};

const BUILT_IN_THEMES = new Set(Object.keys(defaultDesigns));

function stringifySection<T>(key: keyof CvFileSections, value: T | undefined) {
  if (value === undefined) {
    return undefined;
  }

  return YAML.stringify({ [key]: value });
}

function parseImportedYaml(content: string): ImportedYamlSections {
  const parsed = YAML.parse(content);
  if (!parsed || typeof parsed !== 'object' || !('cv' in parsed)) {
    throw new Error('Expected a RenderCV YAML file with a top-level cv: key.');
  }

  const document = parsed as {
    cv: unknown;
    design?: { theme?: string };
    locale?: { language?: string };
    settings?: unknown;
  };

  const theme =
    document.design && typeof document.design === 'object' && typeof document.design.theme === 'string'
      ? document.design.theme
      : undefined;
  const locale =
    document.locale && typeof document.locale === 'object' && typeof document.locale.language === 'string'
      ? document.locale.language
      : undefined;

  return {
    cv: stringifySection('cv', document.cv),
    design: stringifySection('design', document.design),
    locale: stringifySection('locale', document.locale),
    settings: stringifySection('settings', document.settings),
    selectedTheme: theme,
    selectedLocale: locale
  };
}

function looksLikeCompatibilityYaml(content: string, importedSections: ImportedYamlSections) {
  if (importedSections.selectedTheme && !BUILT_IN_THEMES.has(importedSections.selectedTheme)) {
    return true;
  }

  return (
    /^\s*social\s*:/m.test(content) ||
    /^\s*positions\s*:/m.test(content) ||
    /^\s*flavors\s*:/m.test(content) ||
    /^\s*itags\s*:/m.test(content) ||
    /^\s*tags\s*:/m.test(content)
  );
}

export function YamlImportButton({
  mode = 'full',
  prepareYamlImport,
  validateYamlImport
}: {
  mode?: 'full' | 'compact' | 'mini';
  prepareYamlImport?: (sections: ImportedYamlSections) => Promise<PreparedYamlImport>;
  validateYamlImport?: (sections: ImportedYamlSections) => Promise<RenderError[]>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const mini = mode === 'mini';

  async function importFile(file: File) {
    const isYamlFile = /\.ya?ml$/i.test(file.name);
    if (!isYamlFile) {
      toast.error('Choose a YAML file.');
      return;
    }

    if (file.size > MAX_YAML_SIZE) {
      toast.error('YAML must be 1 MB or smaller.');
      return;
    }

    setPending(true);
    try {
      const content = await file.text();
      if (!content.trim()) {
        toast.error('YAML file is empty.');
        return;
      }

      const importedSections = parseImportedYaml(content);

      const isCompatibilityYaml = looksLikeCompatibilityYaml(content, importedSections);

      if (validateYamlImport) {
        const errors = await validateYamlImport(importedSections);
        if (errors.length > 0) {
          if (!isCompatibilityYaml) {
            toast.error(summarizeRenderErrors(errors));
            return;
          }
        }
      }

      const preparedImport = prepareYamlImport
        ? await prepareYamlImport(importedSections)
        : { sections: importedSections };
      const nextSections = preparedImport.sections;
      const nextDesigns = {
        ...(preparedImport.additionalDesigns ?? {}),
        ...(nextSections.design && nextSections.selectedTheme
          ? { [nextSections.selectedTheme]: nextSections.design }
          : {})
      };

      const name = file.name.replace(/\.ya?ml$/i, '') || 'Imported CV';
      fileStore.createFile(name, {
        cv: nextSections.cv,
        settings: nextSections.settings,
        designs: Object.keys(nextDesigns).length > 0 ? nextDesigns : undefined,
        locales:
          nextSections.locale && nextSections.selectedLocale
            ? { [nextSections.selectedLocale]: nextSections.locale }
            : undefined,
        selectedTheme: nextSections.selectedTheme,
        selectedLocale: nextSections.selectedLocale
      });
      if (isCompatibilityYaml) {
        const themeNote =
          nextSections.selectedTheme && !BUILT_IN_THEMES.has(nextSections.selectedTheme)
            ? ` Import the ${nextSections.selectedTheme} theme zip if the preview reports a missing custom theme.`
            : '';
        toast.success(
          preparedImport.message ?? `YAML imported with compatibility mode.${themeNote}`
        );
      } else {
        toast.success(preparedImport.message ?? 'YAML imported into a new CV.');
      }

      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to import YAML.');
    } finally {
      setPending(false);
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
            void importFile(file);
          }
        }}
      />
      <button
        className={`inline-flex w-full items-center rounded-md text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
          mini ? 'h-10 justify-center px-0' : 'h-10 justify-start gap-2 px-3'
        }`}
        disabled={pending}
        onClick={() => inputRef.current?.click()}
        title="Import YAML"
        type="button"
      >
        <Upload className="size-4 shrink-0" />
        {mini ? (
          <span className="sr-only">{pending ? 'Importing YAML' : 'Import YAML'}</span>
        ) : (
          <span>{pending ? 'Importing YAML…' : 'Import YAML'}</span>
        )}
      </button>
    </>
  );
}
