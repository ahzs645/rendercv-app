import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import YAML from 'yaml';
import { defaultDesigns, fileStore, stringifyCvYaml } from '@rendercv/core';
import type { CvFileSections } from '@rendercv/contracts';
import { BUNDLED_THEMES } from '../features/viewer/bundled-themes.generated';
import type { RenderError } from '../features/viewer/use-viewer-renderer';
import { summarizeRenderErrors } from '../features/viewer/render-error-format';
import { startReviewForFile } from '../features/review/session-utils';

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
const KNOWN_THEMES = new Set([
  ...BUILT_IN_THEMES,
  ...BUNDLED_THEMES.map((theme) => theme.themeKey)
]);

const TOP_LEVEL_KEY = /^([A-Za-z_][\w-]*)\s*:/;

/**
 * The text of one top-level section exactly as the file wrote it, comments and
 * line breaks included. Re-serialising the parsed value folded long bullets at
 * 80 columns and dropped every comment. The slice is used only if it parses to
 * exactly the same data as the whole file says that section holds.
 */
function originalSectionText(content: string, key: keyof CvFileSections, value: unknown) {
  const lines = content.split(/\r?\n/);
  const start = lines.findIndex((line) => TOP_LEVEL_KEY.exec(line)?.[1] === key);
  if (start < 0) return undefined;
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (TOP_LEVEL_KEY.test(lines[index]!) || lines[index] === '---' || lines[index] === '...') {
      end = index;
      break;
    }
  }
  while (end > start + 1 && !lines[end - 1]!.trim()) end -= 1;
  const text = `${lines.slice(start, end).join('\n')}\n`;
  try {
    return JSON.stringify(YAML.parse(text)) === JSON.stringify({ [key]: value }) ? text : undefined;
  } catch {
    return undefined;
  }
}

function stringifySection<T>(key: keyof CvFileSections, value: T | undefined, content: string) {
  if (value === undefined) {
    return undefined;
  }

  return originalSectionText(content, key, value) ?? stringifyCvYaml({ [key]: value });
}

export function parseImportedYaml(content: string): ImportedYamlSections {
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
    cv: stringifySection('cv', document.cv, content),
    design: stringifySection('design', document.design, content),
    locale: stringifySection('locale', document.locale, content),
    settings: stringifySection('settings', document.settings, content),
    selectedTheme: theme,
    selectedLocale: locale
  };
}

function looksLikeCompatibilityYaml(content: string, importedSections: ImportedYamlSections) {
  if (importedSections.selectedTheme && !KNOWN_THEMES.has(importedSections.selectedTheme)) {
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

export type YamlImportOptions = {
  prepareYamlImport?: (sections: ImportedYamlSections) => Promise<PreparedYamlImport>;
  validateYamlImport?: (sections: ImportedYamlSections) => Promise<RenderError[]>;
};

export function useYamlImport({ prepareYamlImport, validateYamlImport }: YamlImportOptions = {}) {
  const [pending, setPending] = useState(false);

  async function importFile(file: File, source?: { url: string }) {
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

      // Validation problems no longer block the import: a file that is
      // rejected can't be fixed in the editor or by asking an assistant. Import
      // it and let the preview list the errors with a copyable fix prompt.
      let importErrors: RenderError[] = [];
      if (validateYamlImport) {
        importErrors = await validateYamlImport(importedSections);
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
      const createdFile = fileStore.createFile(name, {
        cv: nextSections.cv,
        settings: nextSections.settings,
        designs: Object.keys(nextDesigns).length > 0 ? nextDesigns : undefined,
        locales:
          nextSections.locale && nextSections.selectedLocale
            ? { [nextSections.selectedLocale]: nextSections.locale }
            : undefined,
        selectedTheme: nextSections.selectedTheme,
        selectedLocale: nextSections.selectedLocale,
        sourceUrl: source?.url
      });
      // Someone may have sent this file to be reviewed. Offer to start a review
      // so edits can be sent back as a proposal. The baseline is taken when the
      // action is clicked, after the workspace's automatic normalization.
      const reviewAction = {
        label: 'Review it',
        onClick: () => {
          if (startReviewForFile(createdFile.id)) {
            toast.success(`Reviewing "${createdFile.name}".`, {
              description: 'Edit the CV, then use Share › Export, backup and review… › Send proposal.'
            });
          }
        }
      };
      if (importErrors.length > 0 && !isCompatibilityYaml) {
        toast.warning('YAML imported, but it does not render yet.', {
          description: `${summarizeRenderErrors(importErrors)} Fix it in the editor, or use “Copy fix prompt” in the preview to ask an AI assistant.`,
          duration: 10_000,
          action: reviewAction
        });
      } else if (isCompatibilityYaml) {
        const themeNote =
          nextSections.selectedTheme && !KNOWN_THEMES.has(nextSections.selectedTheme)
            ? ` Import the ${nextSections.selectedTheme} theme zip if the preview reports a missing custom theme.`
            : '';
        toast.success(
          preparedImport.message ?? `YAML imported with compatibility mode.${themeNote}`,
          { action: reviewAction, duration: 8_000 }
        );
      } else {
        toast.success(preparedImport.message ?? 'YAML imported into a new CV.', {
          action: reviewAction,
          duration: 8_000
        });
      }

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to import YAML.');
    } finally {
      setPending(false);
    }
  }

  return { importFile, pending };
}

export function YamlImportButton({
  mode = 'full',
  prepareYamlImport,
  validateYamlImport
}: YamlImportOptions & {
  mode?: 'full' | 'compact' | 'mini';
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { importFile, pending } = useYamlImport({ prepareYamlImport, validateYamlImport });
  const mini = mode === 'mini';

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
