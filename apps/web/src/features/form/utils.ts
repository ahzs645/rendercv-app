import type { EntryTemplate, FieldDef } from './schema/types';

export const DIMENSION_UNITS = ['cm', 'mm', 'in', 'pt', 'em', 'ex'] as const;

export function getNestedValue(root: Record<string, unknown>, path: string[]) {
  let current: unknown = root;
  for (const key of path) {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

export function updateEntryField(
  entry: Record<string, unknown>,
  path: string[],
  value: unknown
): Record<string, unknown> {
  return updateObjectField(entry, path, normalizeFieldValue(value));
}

export function updateObjectField<T extends Record<string, unknown>>(
  entry: T,
  path: string[],
  value: unknown
): T {
  return updateNestedContainer(entry, path, value) as T;
}

export function setNestedValue(root: Record<string, unknown>, path: string[], value: unknown) {
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

export function normalizeFieldValue(value: unknown) {
  if (Array.isArray(value)) {
    return value;
  }
  return value ?? '';
}

export function stringValue(value: unknown) {
  if (value == null) {
    return '';
  }
  return String(value);
}

function isNumericKey(value: string) {
  return /^\d+$/.test(value);
}

function isContainer(value: unknown): value is Record<string, unknown> | unknown[] {
  return value != null && typeof value === 'object';
}

function updateNestedContainer(
  container: Record<string, unknown> | unknown[],
  path: string[],
  value: unknown
): Record<string, unknown> | unknown[] {
  const [currentKey, ...restPath] = path;
  if (!currentKey) {
    return container;
  }

  if (Array.isArray(container)) {
    const index = Number(currentKey);
    const nextArray = [...container];

    if (restPath.length === 0) {
      nextArray[index] = value;
      return nextArray;
    }

    const nextValue = container[index];
    const fallbackContainer = isNumericKey(restPath[0]!) ? [] : {};
    nextArray[index] = updateNestedContainer(
      isContainer(nextValue) ? nextValue : fallbackContainer,
      restPath,
      value
    );
    return nextArray;
  }

  const nextObject = { ...container };
  if (restPath.length === 0) {
    nextObject[currentKey] = value;
    return nextObject;
  }

  const nextValue = container[currentKey];
  const fallbackContainer = isNumericKey(restPath[0]!) ? [] : {};
  nextObject[currentKey] = updateNestedContainer(
    isContainer(nextValue) ? nextValue : fallbackContainer,
    restPath,
    value
  );
  return nextObject;
}

export function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function resolveEntrySummary(entry: unknown, template: EntryTemplate | 'text', index: number) {
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

export function dynamicEntryMarker(templateName: string, index: number, total: number) {
  switch (templateName) {
    case 'bullet':
      return '\u2022';
    case 'numbered':
      return `${index + 1}.`;
    case 'reversed_numbered':
      return `${total - index}.`;
    default:
      return undefined;
  }
}

export function parseDimensionValue(value: string) {
  const match = value.trim().match(/^(-?\d*\.?\d+|-?\d*\.?\d*)\s*(cm|mm|in|pt|em|ex)$/);
  if (match) {
    return {
      num: match[1] || '0',
      unit: match[2] as (typeof DIMENSION_UNITS)[number]
    };
  }

  return {
    num: value.trim() || '0',
    unit: 'cm' as (typeof DIMENSION_UNITS)[number]
  };
}

export function asHexColor(value: string) {
  if (/^#[0-9a-f]{6}$/i.test(value.trim())) {
    return value.trim();
  }

  if (/^#[0-9a-f]{3}$/i.test(value.trim())) {
    const short = value.trim().slice(1);
    return `#${short[0]}${short[0]}${short[1]}${short[1]}${short[2]}${short[2]}`;
  }

  return '#000000';
}

export function labelWidthForFields(fields: FieldDef[]) {
  const maxLength = Math.max(...fields.map((field) => field.label.length), 10);
  return `${Math.max(70, Math.round(maxLength * 7.4 + 24))}px`;
}

export function labelWidthForTemplate(template: EntryTemplate | 'text') {
  if (template === 'text') {
    return '8rem';
  }

  if (template.name === 'bullet' || template.name === 'numbered' || template.name === 'reversed_numbered') {
    return '1.5rem';
  }

  return labelWidthForFields(template.fields);
}

export function entryAddLabel(template: EntryTemplate | 'text') {
  if (template === 'text') {
    return 'text';
  }

  return `${template.name.replace(/_/g, ' ')} entry`;
}

export function dictionaryKeyToTitle(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((segment) => segment[0]!.toUpperCase() + segment.slice(1))
    .join(' ');
}

export function properSectionTitleToKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function createUniqueSectionKey(sections: Record<string, unknown>, base: string) {
  if (!Object.hasOwn(sections, base)) {
    return base;
  }

  let index = 2;
  while (Object.hasOwn(sections, `${base}_${index}`)) {
    index += 1;
  }

  return `${base}_${index}`;
}

export function renameRecordKey(
  record: Record<string, unknown>,
  oldKey: string,
  nextKey: string
): Record<string, unknown> {
  const entries = Object.entries(record).map(([key, value]) =>
    key === oldKey ? [nextKey, value] : [key, value]
  );
  return Object.fromEntries(entries);
}

export function removeRecordKey(record: Record<string, unknown>, keyToRemove: string) {
  return Object.fromEntries(
    Object.entries(record).filter(([key]) => key !== keyToRemove)
  );
}

export function moveRecordEntry(record: Record<string, unknown>, fromIndex: number, toIndex: number) {
  const entries = Object.entries(record);
  const [entry] = entries.splice(fromIndex, 1);
  entries.splice(toIndex, 0, entry);
  return Object.fromEntries(entries);
}
