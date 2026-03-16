import { useEffect, useState } from 'react';
import type { SectionKey } from '@rendercv/contracts';
import YAML from 'yaml';
import { localeLabel, themeLabel } from '@rendercv/core';
import {
  customConnectionTemplate,
  cvPersonalInfoGroup,
  socialNetworkTemplate
} from './schema/cv-schema';
import { designSchema } from './schema/design-schema';
import { localeSchema } from './schema/locale-schema';
import { settingsSchema } from './schema/settings-schema';
import {
  createDefaultEntry,
  detectEntryType,
  entryTypeOptions,
  findTemplateByName
} from './schema/entry-templates';
import type { EntryTemplate, FieldDef, SectionSchema, SelectOption } from './schema/types';

const FONT_OPTIONS = [
  'DejaVu Sans Mono',
  'EB Garamond',
  'Fontin',
  'Gentium Book Plus',
  'Lato',
  'Libertinus Serif',
  'Mukta',
  'New Computer Modern',
  'Noto Sans',
  'Open Sans',
  'Open Sauce Sans',
  'Poppins',
  'Raleway',
  'Roboto',
  'Source Sans 3',
  'Ubuntu',
  'XCharter'
];

export function FormEditor({
  section,
  value,
  onChange
}: {
  section: SectionKey;
  value: string;
  onChange: (value: string) => void;
}) {
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
    <div className="space-y-5 overflow-auto rounded-2xl border border-border bg-card p-5" data-form-editor>
      {schema ? (
        schema.groups.map((group) => (
          <section key={group.title || group.fields.map((field) => field.path.join('.')).join('|')}>
            {group.title ? (
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {group.title}
              </h3>
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
              {group.fields.map((field) => {
                const fieldValue = getNestedValue(rootValue, field.path);
                return (
                  <FieldControl
                    key={field.path.join('.')}
                    field={field}
                    value={fieldValue}
                    onChange={(nextValue) => updateField(field.path, nextValue)}
                  />
                );
              })}
            </div>
          </section>
        ))
      ) : null}
      {section === 'cv' ? (
        <CvSectionEditor rootValue={rootValue} onChange={updateRoot} />
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

function CvSectionEditor({
  rootValue,
  onChange
}: {
  rootValue: Record<string, unknown>;
  onChange: (nextRoot: Record<string, unknown>) => void;
}) {
  const socialNetworks = asArray(rootValue.social_networks);
  const customConnections = asArray(rootValue.custom_connections);
  const sections = asRecord(rootValue.sections);

  function updateCvField(key: string, value: unknown) {
    onChange({ ...rootValue, [key]: value });
  }

  function updateSections(nextSections: Record<string, unknown>) {
    onChange({ ...rootValue, sections: nextSections });
  }

  return (
    <>
      <EntryArrayEditor
        title="Social Networks"
        description="LinkedIn, GitHub, Google Scholar, and other quick profile links."
        entries={socialNetworks}
        template={socialNetworkTemplate}
        onChange={(nextEntries) => updateCvField('social_networks', nextEntries)}
      />
      <EntryArrayEditor
        title="Custom Connections"
        description="Extra callouts like booking links or custom buttons."
        entries={customConnections}
        template={customConnectionTemplate}
        onChange={(nextEntries) => updateCvField('custom_connections', nextEntries)}
      />
      <SectionMapEditor sections={sections} onChange={updateSections} />
    </>
  );
}

function EntryArrayEditor({
  title,
  description,
  entries,
  template,
  onChange,
  onTemplateChange
}: {
  title: string;
  description?: string;
  entries: unknown[];
  template: EntryTemplate | 'text';
  onChange: (entries: unknown[]) => void;
  onTemplateChange?: (templateName: string) => void;
}) {
  const templateName = template === 'text' ? 'text' : template.name;

  function addEntry() {
    onChange([
      ...entries,
      template === 'text' ? '' : createDefaultEntry(template)
    ]);
  }

  function updateEntry(index: number, value: unknown) {
    const nextEntries = [...entries];
    nextEntries[index] = value;
    onChange(nextEntries);
  }

  function removeEntry(index: number) {
    onChange(entries.filter((_, currentIndex) => currentIndex !== index));
  }

  function moveEntry(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= entries.length) {
      return;
    }

    const nextEntries = [...entries];
    const [entry] = nextEntries.splice(index, 1);
    nextEntries.splice(nextIndex, 0, entry);
    onChange(nextEntries);
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border/80 bg-background/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {title}
          </h3>
          {description ? <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onTemplateChange ? (
            <select
              className="rounded-xl border border-border bg-card px-3 py-2 text-sm"
              value={templateName}
              onChange={(event) => onTemplateChange(event.target.value)}
            >
              {entryTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : null}
          <button
            className="rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground"
            onClick={addEntry}
            type="button"
          >
            Add entry
          </button>
        </div>
      </div>
      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          No entries yet.
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry, index) => (
            <article key={`${templateName}-${index}`} className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{resolveEntrySummary(entry, template, index)}</p>
                  <p className="text-xs text-muted-foreground">Entry {index + 1}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <MiniButton disabled={index === 0} onClick={() => moveEntry(index, -1)}>
                    Up
                  </MiniButton>
                  <MiniButton
                    disabled={index === entries.length - 1}
                    onClick={() => moveEntry(index, 1)}
                  >
                    Down
                  </MiniButton>
                  <MiniButton variant="danger" onClick={() => removeEntry(index)}>
                    Remove
                  </MiniButton>
                </div>
              </div>
              {template === 'text' ? (
                <textarea
                  className="min-h-28 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  value={typeof entry === 'string' ? entry : ''}
                  onChange={(event) => updateEntry(index, event.target.value)}
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {template.fields.map((field) => (
                    <FieldControl
                      key={`${index}-${field.path.join('.')}`}
                      field={field}
                      value={getNestedValue(asRecord(entry), field.path)}
                      onChange={(nextValue) =>
                        updateEntry(index, updateEntryField(asRecord(entry), field.path, nextValue))
                      }
                    />
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function SectionMapEditor({
  sections,
  onChange
}: {
  sections: Record<string, unknown>;
  onChange: (sections: Record<string, unknown>) => void;
}) {
  const sectionEntries = Object.entries(sections);

  function addSection() {
    const key = createUniqueSectionKey(sections, 'new_section');
    onChange({
      ...sections,
      [key]: ['']
    });
  }

  function renameSection(oldKey: string, nextTitle: string) {
    const nextKey = properSectionTitleToKey(nextTitle);
    if (!nextKey || nextKey === oldKey || Object.hasOwn(sections, nextKey)) {
      return;
    }
    onChange(renameRecordKey(sections, oldKey, nextKey));
  }

  function deleteSection(sectionKey: string) {
    onChange(removeRecordKey(sections, sectionKey));
  }

  function moveSection(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= sectionEntries.length) {
      return;
    }
    onChange(moveRecordEntry(sections, index, nextIndex));
  }

  function updateSectionEntries(sectionKey: string, nextEntries: unknown[]) {
    onChange({
      ...sections,
      [sectionKey]: nextEntries
    });
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border/80 bg-background/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            CV Sections
          </h3>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Build arbitrary sections like experience, education, projects, awards, or custom callouts.
          </p>
        </div>
        <button
          className="rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground"
          onClick={addSection}
          type="button"
        >
          Add section
        </button>
      </div>
      {sectionEntries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          No custom sections yet.
        </div>
      ) : (
        <div className="space-y-4">
          {sectionEntries.map(([sectionKey, sectionValue], index) => (
            <SectionEditor
              key={sectionKey}
              index={index}
              total={sectionEntries.length}
              sectionKey={sectionKey}
              entries={asArray(sectionValue)}
              onDelete={() => deleteSection(sectionKey)}
              onMove={(direction) => moveSection(index, direction)}
              onRename={renameSection}
              onChangeEntries={(nextEntries) => updateSectionEntries(sectionKey, nextEntries)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function SectionEditor({
  sectionKey,
  entries,
  index,
  total,
  onRename,
  onDelete,
  onMove,
  onChangeEntries
}: {
  sectionKey: string;
  entries: unknown[];
  index: number;
  total: number;
  onRename: (oldKey: string, nextTitle: string) => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
  onChangeEntries: (entries: unknown[]) => void;
}) {
  const [title, setTitle] = useState(dictionaryKeyToTitle(sectionKey));
  const detectedTemplate = detectEntryType(entries[0]);

  useEffect(() => {
    setTitle(dictionaryKeyToTitle(sectionKey));
  }, [sectionKey]);

  function changeTemplate(nextTemplateName: string) {
    const currentTemplateName = detectedTemplate === 'text' ? 'text' : detectedTemplate.name;
    if (nextTemplateName === currentTemplateName) {
      return;
    }

    if (
      entries.length > 0 &&
      !window.confirm('Changing the section type will reset the existing entries in this section.')
    ) {
      return;
    }

    if (nextTemplateName === 'text') {
      onChangeEntries(['']);
      return;
    }

    const nextTemplate = findTemplateByName(nextTemplateName);
    if (!nextTemplate) {
      return;
    }

    onChangeEntries([createDefaultEntry(nextTemplate)]);
  }

  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={() => onRename(sectionKey, title)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onRename(sectionKey, title);
            }
          }}
        />
        <div className="flex flex-wrap gap-2">
          <MiniButton disabled={index === 0} onClick={() => onMove(-1)}>
            Up
          </MiniButton>
          <MiniButton disabled={index === total - 1} onClick={() => onMove(1)}>
            Down
          </MiniButton>
          <MiniButton variant="danger" onClick={onDelete}>
            Delete
          </MiniButton>
        </div>
      </div>
      <EntryArrayEditor
        title={dictionaryKeyToTitle(sectionKey)}
        entries={entries}
        template={detectedTemplate}
        onChange={onChangeEntries}
        onTemplateChange={changeTemplate}
      />
    </article>
  );
}

function FieldControl({
  field,
  value,
  onChange
}: {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const label = (
    <div className="mb-2 flex items-center justify-between gap-3">
      <label className="text-sm font-medium">{field.label}</label>
      {field.description ? <span className="text-xs text-muted-foreground">{field.description}</span> : null}
    </div>
  );

  switch (field.type) {
    case 'boolean':
      return (
        <div className="rounded-xl border border-border p-4">
          {label}
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(event) => onChange(event.target.checked)}
            />
            Enabled
          </label>
        </div>
      );
    case 'string_list':
      return (
        <div className="rounded-xl border border-border p-4 md:col-span-2">
          {label}
          <textarea
            className="min-h-28 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            value={Array.isArray(value) ? value.join('\n') : ''}
            placeholder={field.placeholder}
            onChange={(event) =>
              onChange(
                event.target.value
                  .split('\n')
                  .map((item) => item.trim())
                  .filter(Boolean)
              )
            }
          />
        </div>
      );
    case 'select':
    case 'toggle':
    case 'alignment':
    case 'font':
    case 'bullet':
    case 'section_style':
      return (
        <div className="rounded-xl border border-border p-4">
          {label}
          <select
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            value={stringValue(value)}
            onChange={(event) => onChange(event.target.value)}
          >
            {resolveOptions(field).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      );
    default:
      if (field.label === 'Summary') {
        return (
          <div className="rounded-xl border border-border p-4 md:col-span-2">
            {label}
            <textarea
              className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              value={stringValue(value)}
              placeholder={field.placeholder}
              onChange={(event) => onChange(event.target.value)}
            />
          </div>
        );
      }

      return (
        <div className="rounded-xl border border-border p-4">
          {label}
          <input
            type={field.type === 'color' ? 'color' : 'text'}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            value={stringValue(value)}
            placeholder={field.placeholder}
            onChange={(event) => onChange(event.target.value)}
          />
        </div>
      );
  }
}

function resolveOptions(field: FieldDef): SelectOption[] {
  if (Array.isArray(field.options)) {
    return field.options;
  }

  if (field.type === 'font') {
    return (field.fonts ?? FONT_OPTIONS).map((font) => ({ value: font, label: font }));
  }

  if (field.type === 'bullet') {
    return (field.bullets ?? ['●', '•', '◦', '-', '◆', '★', '■', '—', '○']).map((value) => ({
      value,
      label: value
    }));
  }

  if (field.type === 'alignment') {
    if (field.options === 'position') {
      return ['left', 'center', 'right'].map((value) => ({ value, label: value[0]!.toUpperCase() + value.slice(1) }));
    }
    return [
      { value: 'left', label: 'Left' },
      { value: 'justified', label: 'Justified' },
      { value: 'justified-with-no-hyphenation', label: 'No hyphenation' }
    ];
  }

  if (field.type === 'section_style') {
    return [
      { value: 'with_partial_line', label: 'Partial line' },
      { value: 'with_full_line', label: 'Full line' },
      { value: 'without_line', label: 'No line' },
      { value: 'moderncv', label: 'ModernCV' }
    ];
  }

  return [
    { value: 'classic', label: themeLabel('classic') },
    { value: 'english', label: localeLabel('english') }
  ];
}

function getNestedValue(root: Record<string, unknown>, path: string[]) {
  let current: unknown = root;
  for (const key of path) {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function updateEntryField(
  entry: Record<string, unknown>,
  path: string[],
  value: unknown
): Record<string, unknown> {
  const draft = structuredClone(entry);
  setNestedValue(draft, path, normalizeFieldValue(value));
  return draft;
}

function setNestedValue(root: Record<string, unknown>, path: string[], value: unknown) {
  let current: Record<string, unknown> | unknown[] = root;
  for (let index = 0; index < path.length - 1; index += 1) {
    const key = path[index]!;
    const nextKey = path[index + 1]!;
    const nextContainer = isNumericKey(nextKey) ? [] : {};

    if (Array.isArray(current)) {
      const numericKey = Number(key);
      if (current[numericKey] == null || typeof current[numericKey] !== 'object') {
        current[numericKey] = nextContainer;
      }
      current = current[numericKey] as Record<string, unknown> | unknown[];
      continue;
    }

    if (current[key] == null || typeof current[key] !== 'object') {
      current[key] = nextContainer;
    }
    current = current[key] as Record<string, unknown> | unknown[];
  }

  const lastKey = path[path.length - 1]!;
  if (Array.isArray(current)) {
    current[Number(lastKey)] = value;
  } else {
    current[lastKey] = value;
  }
}

function normalizeFieldValue(value: unknown) {
  if (Array.isArray(value)) {
    return value;
  }
  return value ?? '';
}

function stringValue(value: unknown) {
  if (value == null) {
    return '';
  }
  return String(value);
}

function isNumericKey(value: string) {
  return /^\d+$/.test(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function resolveEntrySummary(entry: unknown, template: EntryTemplate | 'text', index: number) {
  if (template === 'text') {
    const text = typeof entry === 'string' ? entry.trim() : '';
    return text ? text.slice(0, 72) : `Text entry ${index + 1}`;
  }

  const summaryField = template.fields.find((field) => field.required) ?? template.fields[0];
  if (!summaryField) {
    return `${template.label} ${index + 1}`;
  }

  const summaryValue = getNestedValue(asRecord(entry), summaryField.path);
  const text = stringValue(summaryValue).trim();
  return text || `${template.label} ${index + 1}`;
}

function dictionaryKeyToTitle(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((segment) => segment[0]!.toUpperCase() + segment.slice(1))
    .join(' ');
}

function properSectionTitleToKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function createUniqueSectionKey(sections: Record<string, unknown>, base: string) {
  if (!Object.hasOwn(sections, base)) {
    return base;
  }

  let index = 2;
  while (Object.hasOwn(sections, `${base}_${index}`)) {
    index += 1;
  }

  return `${base}_${index}`;
}

function renameRecordKey(
  record: Record<string, unknown>,
  oldKey: string,
  nextKey: string
): Record<string, unknown> {
  const entries = Object.entries(record).map(([key, value]) =>
    key === oldKey ? [nextKey, value] : [key, value]
  );
  return Object.fromEntries(entries);
}

function removeRecordKey(record: Record<string, unknown>, keyToRemove: string) {
  return Object.fromEntries(
    Object.entries(record).filter(([key]) => key !== keyToRemove)
  );
}

function moveRecordEntry(record: Record<string, unknown>, fromIndex: number, toIndex: number) {
  const entries = Object.entries(record);
  const [entry] = entries.splice(fromIndex, 1);
  entries.splice(toIndex, 0, entry);
  return Object.fromEntries(entries);
}

function MiniButton({
  children,
  onClick,
  disabled,
  variant
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'danger';
}) {
  return (
    <button
      className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
        variant === 'danger'
          ? 'bg-destructive/10 text-destructive'
          : 'bg-muted text-muted-foreground'
      }`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
