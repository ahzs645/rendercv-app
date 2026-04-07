import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { CvFileSections, SectionKey } from '@rendercv/contracts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import YAML from 'yaml';
import { preferencesStore, themeLabel } from '@rendercv/core';
import {
  cvPersonalInfoGroup
} from './schema/cv-schema';
import { getDesignSchema } from './schema/design-schema';
import { localeSchema } from './schema/locale-schema';
import { settingsSchema } from './schema/settings-schema';
import type { SectionSchema } from './schema/types';
import { useStore } from '../../lib/use-store';
import { FieldControl, FieldDescription } from './field-controls';
import { Divider } from './primitives';
import { CvSectionEditor } from './cv-section-editor';
import { DiffProvider } from './diff-context';
import {
  getNestedValue,
  normalizeFieldValue,
  labelWidthForFields,
  updateObjectField
} from './utils';

export function FormEditor({
  section,
  value,
  onChange,
  sharedOrigin,
  themeOptions,
  currentTheme,
  onThemeChange
}: {
  section: SectionKey;
  value: string;
  onChange: (value: string) => void;
  sharedOrigin?: CvFileSections;
  themeOptions?: string[];
  currentTheme?: string;
  onThemeChange?: (theme: string) => void;
}) {
  const preferences = useStore(preferencesStore);

  const parsedDocument = useMemo(() => {
    try {
      const documentValue = (YAML.parse(value || `${section}:\n`) ?? {}) as Record<string, unknown>;
      return {
        documentValue,
        rootValue: (documentValue[section] as Record<string, unknown> | undefined) ?? {}
      };
    } catch {
      return null;
    }
  }, [section, value]);

  if (!parsedDocument) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 text-sm text-destructive">
        The current YAML cannot be parsed into a form. Switch back to YAML mode to fix it.
      </div>
    );
  }

  const { documentValue, rootValue: parsedRootValue } = parsedDocument;
  const schema = getSchema(section, documentValue);
  const [draftRootValue, setDraftRootValue] = useState(parsedRootValue);
  const [pendingCommitVersion, setPendingCommitVersion] = useState(0);
  const lastEmittedValueRef = useRef<string | null>(null);

  useEffect(() => {
    if (value === lastEmittedValueRef.current) {
      lastEmittedValueRef.current = null;
      setPendingCommitVersion(0);
      return;
    }

    setDraftRootValue(parsedRootValue);
    setPendingCommitVersion(0);
  }, [parsedRootValue, value]);

  useEffect(() => {
    if (pendingCommitVersion === 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const nextValue = YAML.stringify({ [section]: draftRootValue });
      if (nextValue === value) {
        return;
      }

      lastEmittedValueRef.current = nextValue;
      onChange(nextValue);
    }, 150);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [draftRootValue, onChange, pendingCommitVersion, section, value]);

  function updateField(path: string[], nextValue: unknown) {
    setDraftRootValue((currentValue) =>
      updateObjectField(currentValue, path, normalizeFieldValue(nextValue))
    );
    setPendingCommitVersion((currentVersion) => currentVersion + 1);
  }

  function updateRoot(nextRootValue: Record<string, unknown>) {
    setDraftRootValue(nextRootValue);
    setPendingCommitVersion((currentVersion) => currentVersion + 1);
  }

  return (
    <DiffProvider section={section} origin={sharedOrigin}>
      <div className="h-full overflow-y-auto px-4 pb-6 sm:px-6 lg:px-8 [overflow-anchor:none]" data-form-editor>
        {section === 'design' && themeOptions && themeOptions.length > 0 && onThemeChange ? (
          <ThemeRow
            options={themeOptions}
            value={currentTheme}
            onChange={onThemeChange}
          />
        ) : null}
        {schema ? (
          schema.groups.map((group, groupIndex) => (
            <section key={group.title || group.fields.map((field) => field.path.join('.')).join('|')} {...(section === 'cv' && groupIndex === 0 ? { 'data-section-key': '__header__' } : {})}>
              {group.title ? (
                <h3 className="mt-6 mb-1 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                  {group.title}
                </h3>
              ) : null}
              <div style={{ '--label-width': labelWidthForFields(group.fields) } as CSSProperties}>
                {group.fields.map((field) => {
                  const fieldValue = getNestedValue(draftRootValue, field.path);
                  return (
                    <Fragment key={field.path.join('.')}>
                      <FieldControl
                        field={field}
                        value={fieldValue}
                        onChange={(nextValue) => updateField(field.path, nextValue)}
                      />
                      <Divider />
                      {field.description ? <FieldDescription description={field.description} /> : null}
                    </Fragment>
                  );
                })}
              </div>
            </section>
          ))
        ) : null}
        {section === 'cv' ? (
          <CvSectionEditor
            entriesExpanded={preferences.entriesExpanded}
            rootValue={draftRootValue}
            onChange={updateRoot}
          />
        ) : null}
      </div>
    </DiffProvider>
  );
}

function getSchema(section: SectionKey, documentValue: Record<string, unknown>): SectionSchema | null {
  switch (section) {
    case 'design':
      return getDesignSchema(readDesignThemeName(documentValue.design));
    case 'locale':
      return localeSchema;
    case 'settings':
      return settingsSchema;
    case 'cv':
      return { groups: [cvPersonalInfoGroup] };
    default:
      return null;
  }
}

function readDesignThemeName(designSection: unknown) {
  if (!designSection || typeof designSection !== 'object' || Array.isArray(designSection)) {
    return undefined;
  }

  const theme = (designSection as Record<string, unknown>).theme;
  return typeof theme === 'string' ? theme : undefined;
}

function ThemeRow({
  options,
  value,
  onChange
}: {
  options: string[];
  value?: string;
  onChange: (theme: string) => void;
}) {
  const currentIndex = value ? options.indexOf(value) : -1;
  const canCycle = options.length > 1 && currentIndex >= 0;

  function goPrev() {
    if (canCycle && currentIndex > 0) {
      onChange(options[currentIndex - 1]!);
    }
  }

  function goNext() {
    if (canCycle && currentIndex < options.length - 1) {
      onChange(options[currentIndex + 1]!);
    }
  }

  return (
    <div className="mt-6">
      <div className="flex items-center py-1.5">
        <span className="shrink-0 text-xs text-muted-foreground" style={{ width: '5rem' }}>
          Theme
        </span>
        <div className="flex min-w-0 items-center gap-1">
          <button
            type="button"
            aria-label="Previous"
            className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
            disabled={!canCycle || currentIndex <= 0}
            onClick={goPrev}
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              className="inline-grid cursor-pointer text-sm text-foreground hover:text-primary"
              data-value={value}
              onClick={goNext}
            >
              {options.map((option) => (
                <span
                  key={option}
                  className={`col-start-1 row-start-1 flex h-6 items-center${option !== value ? ' invisible' : ''}`}
                >
                  {themeLabel(option)}
                </span>
              ))}
            </button>
          </div>
          <button
            type="button"
            aria-label="Next"
            className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
            disabled={!canCycle || currentIndex >= options.length - 1}
            onClick={goNext}
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>
      <div className="h-px bg-border/40" />
    </div>
  );
}
