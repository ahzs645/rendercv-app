import type { EntryTemplate } from './types.js';

// ── 8 entry type templates ───────────────────────────────────────────

export const experienceTemplate: EntryTemplate = {
  name: 'experience',
  label: 'Experience Entry',
  fields: [
    {
      path: ['company'],
      label: 'Company',
      type: 'string',
      required: true,
      defaultValue: '',
      preserveEmpty: true
    },
    {
      path: ['position'],
      label: 'Position',
      type: 'string',
      required: true,
      defaultValue: '',
      preserveEmpty: true
    },
    { path: ['date'], label: 'Date', type: 'string', placeholder: '2020-09, Fall 2023, etc.' },
    {
      path: ['start_date'],
      label: 'Start Date',
      type: 'string',
      placeholder: '2020-09, 2020, etc.',
      defaultValue: ''
    },
    {
      path: ['end_date'],
      label: 'End Date',
      type: 'string',
      placeholder: '2024-05, 2024, present, etc.',
      defaultValue: ''
    },
    { path: ['location'], label: 'Location', type: 'string', defaultValue: '' },
    { path: ['summary'], label: 'Summary', type: 'string' },
    {
      path: ['highlights'],
      label: 'Highlights',
      type: 'string_list',
      placeholder: 'Add a highlight'
    }
  ]
};

export const educationTemplate: EntryTemplate = {
  name: 'education',
  label: 'Education Entry',
  fields: [
    {
      path: ['institution'],
      label: 'Institution',
      type: 'string',
      required: true,
      defaultValue: '',
      preserveEmpty: true
    },
    {
      path: ['area'],
      label: 'Area',
      type: 'string',
      required: true,
      defaultValue: '',
      preserveEmpty: true
    },
    { path: ['degree'], label: 'Degree', type: 'string', defaultValue: '' },
    { path: ['date'], label: 'Date', type: 'string', placeholder: '2020-09, Fall 2023, etc.' },
    {
      path: ['start_date'],
      label: 'Start Date',
      type: 'string',
      placeholder: '2020-09, 2020, etc.',
      defaultValue: ''
    },
    {
      path: ['end_date'],
      label: 'End Date',
      type: 'string',
      placeholder: '2024-05, 2024, present, etc.',
      defaultValue: ''
    },
    { path: ['location'], label: 'Location', type: 'string' },
    { path: ['summary'], label: 'Summary', type: 'string' },
    {
      path: ['highlights'],
      label: 'Highlights',
      type: 'string_list',
      placeholder: 'Add a highlight'
    }
  ]
};

export const publicationTemplate: EntryTemplate = {
  name: 'publication',
  label: 'Publication Entry',
  fields: [
    {
      path: ['title'],
      label: 'Title',
      type: 'string',
      required: true,
      defaultValue: '',
      preserveEmpty: true
    },
    {
      path: ['authors'],
      label: 'Authors',
      type: 'string_list',
      required: true,
      placeholder: 'Add an author',
      defaultValue: ['']
    },
    { path: ['journal'], label: 'Journal', type: 'string', defaultValue: '' },
    {
      path: ['date'],
      label: 'Date',
      type: 'string',
      placeholder: '2020-09, Fall 2023, etc.',
      defaultValue: ''
    },
    { path: ['doi'], label: 'DOI', type: 'string', placeholder: '10.1234/...' },
    { path: ['url'], label: 'URL', type: 'string', placeholder: 'https://' },
    { path: ['summary'], label: 'Summary', type: 'string' }
  ]
};

export const normalTemplate: EntryTemplate = {
  name: 'normal',
  label: 'Normal Entry',
  fields: [
    {
      path: ['name'],
      label: 'Name',
      type: 'string',
      required: true,
      defaultValue: '',
      preserveEmpty: true
    },
    { path: ['date'], label: 'Date', type: 'string', placeholder: '2020-09, Fall 2023, etc.' },
    { path: ['start_date'], label: 'Start Date', type: 'string', placeholder: '2020-09 or 2020' },
    {
      path: ['end_date'],
      label: 'End Date',
      type: 'string',
      placeholder: '2024-05, 2024, or present'
    },
    { path: ['location'], label: 'Location', type: 'string' },
    { path: ['summary'], label: 'Summary', type: 'string' },
    {
      path: ['highlights'],
      label: 'Highlights',
      type: 'string_list',
      placeholder: 'Add a highlight'
    }
  ]
};

export const oneLineTemplate: EntryTemplate = {
  name: 'one_line',
  label: 'One-Line Entry',
  compact: true,
  fields: [
    {
      path: ['label'],
      label: 'Label',
      type: 'string',
      required: true,
      defaultValue: '',
      preserveEmpty: true
    },
    {
      path: ['details'],
      label: 'Details',
      type: 'string',
      required: true,
      defaultValue: '',
      preserveEmpty: true
    }
  ]
};

export const bulletTemplate: EntryTemplate = {
  name: 'bullet',
  label: 'Bullet Entry',
  compact: true,
  fields: [
    {
      path: ['bullet'],
      label: 'Bullet',
      type: 'string',
      required: true,
      defaultValue: '',
      preserveEmpty: true
    }
  ]
};

export const numberedTemplate: EntryTemplate = {
  name: 'numbered',
  label: 'Numbered Entry',
  compact: true,
  fields: [
    {
      path: ['number'],
      label: 'Number',
      type: 'string',
      required: true,
      defaultValue: '',
      preserveEmpty: true
    }
  ]
};

export const reversedNumberedTemplate: EntryTemplate = {
  name: 'reversed_numbered',
  label: 'Reversed Numbered Entry',
  compact: true,
  fields: [
    {
      path: ['reversed_number'],
      label: 'Reversed Number',
      type: 'string',
      required: true,
      defaultValue: '',
      preserveEmpty: true
    }
  ]
};

// ── Detection ────────────────────────────────────────────────────────

const allTemplates = [
  experienceTemplate,
  educationTemplate,
  publicationTemplate,
  oneLineTemplate,
  bulletTemplate,
  numberedTemplate,
  reversedNumberedTemplate,
  normalTemplate
];

/**
 * Detect the entry type from the first entry in a section array.
 * Returns the matching EntryTemplate, or `'text'` for plain string entries.
 */
export function detectEntryType(firstEntry: unknown): EntryTemplate | 'text' {
  if (typeof firstEntry === 'string') return 'text';
  if (!firstEntry || typeof firstEntry !== 'object') return 'text';

  const entry = firstEntry as Record<string, unknown>;

  if ('company' in entry) return experienceTemplate;
  if ('institution' in entry) return educationTemplate;
  if ('title' in entry && 'authors' in entry) return publicationTemplate;
  if ('label' in entry && 'details' in entry) return oneLineTemplate;
  if ('bullet' in entry) return bulletTemplate;
  if ('number' in entry) return numberedTemplate;
  if ('reversed_number' in entry) return reversedNumberedTemplate;
  if ('name' in entry) return normalTemplate;

  return 'text';
}

/** Options for the entry type picker (Add Section dialog, Change Type submenu) */
export const entryTypeOptions: { value: string; label: string }[] = [
  { value: 'text', label: 'Text' },
  ...allTemplates.map((t) => ({ value: t.name, label: t.label }))
];

/** Find a template by its internal name */
export function findTemplateByName(name: string): EntryTemplate | undefined {
  return allTemplates.find((t) => t.name === name);
}

/**
 * Create a new entry from a template's field-level defaults.
 * Fields with an explicit `defaultValue` (including '' or []) are written to the entry.
 * Fields without `defaultValue` are omitted — they stay absent from YAML.
 */
export function createDefaultEntry(template: EntryTemplate): Record<string, unknown> {
  const entry: Record<string, unknown> = {};
  for (const field of template.fields) {
    if (field.defaultValue !== undefined) {
      entry[field.path[0]] =
        field.defaultValue === '' && !field.preserveEmpty ? null : field.defaultValue;
    }
  }
  return entry;
}

export { allTemplates };
