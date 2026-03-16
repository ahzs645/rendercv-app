import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import YAML from 'yaml';
import { fileStore } from '@rendercv/core';
import type { CvFileSections } from '@rendercv/contracts';
import type { RenderError } from '../features/viewer/use-viewer-renderer';

const MAX_YAML_SIZE = 1024 * 1024;

type ImportedYamlSections = Partial<CvFileSections> & {
  selectedTheme?: string;
  selectedLocale?: string;
};

const BUILT_IN_THEMES = new Set([
  'classic',
  'engineeringclassic',
  'engineeringresumes',
  'moderncv',
  'sb2nov'
]);

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
  validateYamlImport
}: {
  mode?: 'full' | 'compact' | 'mini';
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
            const firstError = errors[0]?.message?.trim();
            toast.error(
              firstError
                ? `This file is not valid RenderCV YAML. ${firstError}`
                : 'This file is not valid RenderCV YAML.'
            );
            return;
          }
        }
      }

      const name = file.name.replace(/\.ya?ml$/i, '') || 'Imported CV';
      fileStore.createFile(name, {
        cv: importedSections.cv,
        settings: importedSections.settings,
        designs:
          importedSections.design && importedSections.selectedTheme
            ? { [importedSections.selectedTheme]: importedSections.design }
            : undefined,
        locales:
          importedSections.locale && importedSections.selectedLocale
            ? { [importedSections.selectedLocale]: importedSections.locale }
            : undefined,
        selectedTheme: importedSections.selectedTheme,
        selectedLocale: importedSections.selectedLocale
      });
      if (isCompatibilityYaml) {
        const themeNote =
          importedSections.selectedTheme && !BUILT_IN_THEMES.has(importedSections.selectedTheme)
            ? ` Import the ${importedSections.selectedTheme} theme zip if the preview reports a missing custom theme.`
            : '';
        toast.success(`YAML imported with compatibility mode.${themeNote}`);
      } else {
        toast.success('YAML imported into a new CV.');
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
