import { Fragment } from 'react';
import type { CSSProperties } from 'react';
import type { SectionKey } from '@rendercv/contracts';
import YAML from 'yaml';
import { preferencesStore } from '@rendercv/core';
import {
  cvPersonalInfoGroup
} from './schema/cv-schema';
import { designSchema } from './schema/design-schema';
import { localeSchema } from './schema/locale-schema';
import { settingsSchema } from './schema/settings-schema';
import type { SectionSchema } from './schema/types';
import { useStore } from '../../lib/use-store';
import { FieldControl, FieldDescription } from './field-controls';
import { Divider } from './primitives';
import { CvSectionEditor } from './cv-section-editor';
import {
  getNestedValue,
  setNestedValue,
  normalizeFieldValue,
  labelWidthForFields
} from './utils';

export function FormEditor({
  section,
  value,
  onChange
}: {
  section: SectionKey;
  value: string;
  onChange: (value: string) => void;
}) {
  const preferences = useStore(preferencesStore);
  const schema = getSchema(section);

  let documentValue: Record<string, unknown>;
  try {
    documentValue = (YAML.parse(value || `${section}:\n`) ?? {}) as Record<string, unknown>;
  } catch {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 text-sm text-destructive">
        The current YAML cannot be parsed into a form. Switch back to YAML mode to fix it.
      </div>
    );
  }

  const rootValue = (documentValue[section] as Record<string, unknown> | undefined) ?? {};

  function updateField(path: string[], nextValue: unknown) {
    const draft = structuredClone(documentValue);
    const root = ((draft[section] as Record<string, unknown> | undefined) ??= {});
    setNestedValue(root, path, normalizeFieldValue(nextValue));
    onChange(YAML.stringify(draft));
  }

  function updateRoot(nextRootValue: Record<string, unknown>) {
    const draft = structuredClone(documentValue);
    draft[section] = nextRootValue;
    onChange(YAML.stringify(draft));
  }

  return (
    <div className="h-full overflow-y-auto px-8 [overflow-anchor:none]" data-form-editor>
      {schema ? (
        schema.groups.map((group) => (
          <section key={group.title || group.fields.map((field) => field.path.join('.')).join('|')}>
            {group.title ? (
              <h3 className="mt-6 mb-1 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                {group.title}
              </h3>
            ) : null}
            <div style={{ '--label-width': labelWidthForFields(group.fields) } as CSSProperties}>
              {group.fields.map((field) => {
                const fieldValue = getNestedValue(rootValue, field.path);
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
          rootValue={rootValue}
          onChange={updateRoot}
        />
      ) : null}
    </div>
  );
}

function getSchema(section: SectionKey): SectionSchema | null {
  switch (section) {
    case 'design':
      return designSchema;
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
