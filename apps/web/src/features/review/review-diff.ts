import type { CvFileSections, SectionKey } from '@rendercv/contracts';
import { SECTION_KEYS, SECTION_LABELS } from '@rendercv/contracts';
import YAML from 'yaml';
import { customConnectionTemplate, cvPersonalInfoGroup, socialNetworkTemplate } from '../form/schema/cv-schema';
import { getDesignSchema } from '../form/schema/design-schema';
import { detectEntryType } from '../form/schema/entry-templates';
import { localeSchema } from '../form/schema/locale-schema';
import { settingsSchema } from '../form/schema/settings-schema';
import type { EntryTemplate, SectionSchema } from '../form/schema/types';
import { dictionaryKeyToTitle, resolveEntrySummary } from '../form/utils';

export type ReviewChangeKind = 'add' | 'remove' | 'set';

export interface ReviewChange {
  id: string;
  section: SectionKey;
  path: Array<string | number>;
  label: string;
  detail?: string;
  entryLabel?: string;
  kind: ReviewChangeKind;
  baselineValue: unknown;
  proposedValue: unknown;
}

export interface ReviewSectionChanges {
  key: SectionKey;
  label: string;
  changes: ReviewChange[];
}

const ENTRY_SIGNATURE_KEYS = [
  'title',
  'company',
  'institution',
  'name',
  'degree',
  'label',
  'network',
  'bullet',
  'number',
  'reversed_number',
  'position',
  'area'
] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function deepEqual(left: unknown, right: unknown): boolean {
  if (left === right) {
    return true;
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) {
      return false;
    }

    return left.every((value, index) => deepEqual(value, right[index]));
  }

  if (isPlainObject(left) && isPlainObject(right)) {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length) {
      return false;
    }

    return leftKeys.every((key) => deepEqual(left[key], right[key]));
  }

  return false;
}

function cloneValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cloneValue(item)) as T;
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [key, cloneValue(entryValue)])
    ) as T;
  }

  return value;
}

function parseSectionRoot(section: SectionKey, yamlSource: string) {
  try {
    const parsed = YAML.parse(yamlSource || `${section}:\n`);
    if (parsed && typeof parsed === 'object' && section in parsed) {
      return (parsed as Record<string, unknown>)[section];
    }
  } catch {
    // ignore invalid YAML and fall back to empty objects
  }

  return {};
}

function stringifySectionRoot(section: SectionKey, root: unknown) {
  return YAML.stringify({ [section]: root ?? {} });
}

function serializePath(path: Array<string | number>) {
  return path.map((segment) => String(segment)).join('.');
}

function getIn(root: unknown, path: Array<string | number>) {
  let current = root;

  for (const segment of path) {
    if (Array.isArray(current)) {
      current = current[Number(segment)];
      continue;
    }

    if (isPlainObject(current)) {
      current = current[String(segment)];
      continue;
    }

    return undefined;
  }

  return current;
}

function setIn(root: unknown, path: Array<string | number>, value: unknown): unknown {
  if (path.length === 0) {
    return cloneValue(value);
  }

  if (Array.isArray(root)) {
    const [segment, ...rest] = path;
    const index = Number(segment);
    const next = [...root];
    if (rest.length === 0) {
      next[index] = cloneValue(value);
      return next;
    }

    const currentChild = next[index] ?? (typeof rest[0] === 'number' ? [] : {});
    next[index] = setIn(currentChild, rest, value);
    return next;
  }

  const objectRoot = isPlainObject(root) ? root : {};
  const [segment, ...rest] = path;
  const key = String(segment);
  const next = { ...objectRoot };
  if (rest.length === 0) {
    next[key] = cloneValue(value);
    return next;
  }

  const currentChild = next[key] ?? (typeof rest[0] === 'number' ? [] : {});
  next[key] = setIn(currentChild, rest, value);
  return next;
}

function removeIn(root: unknown, path: Array<string | number>): unknown {
  if (path.length === 0) {
    return root;
  }

  if (Array.isArray(root)) {
    const [segment, ...rest] = path;
    const index = Number(segment);
    const next = [...root];

    if (rest.length === 0) {
      next.splice(index, 1);
      return next;
    }

    next[index] = removeIn(next[index], rest);
    return next;
  }

  if (!isPlainObject(root)) {
    return root;
  }

  const [segment, ...rest] = path;
  const key = String(segment);
  const next = { ...root };
  if (rest.length === 0) {
    delete next[key];
    return next;
  }

  next[key] = removeIn(next[key], rest);
  return next;
}

function getPrimitiveEntrySignature(entry: Record<string, unknown>) {
  for (const key of ENTRY_SIGNATURE_KEYS) {
    const value = entry[key];
    if (typeof value === 'string' && value.trim()) {
      return `${key}:${value.trim().toLowerCase()}`;
    }
    if (typeof value === 'number') {
      return `${key}:${value}`;
    }
  }

  return undefined;
}

function canMatchBySignature(
  baselineEntries: unknown[],
  proposedEntries: unknown[]
): boolean {
  if (
    !baselineEntries.every(isPlainObject) ||
    !proposedEntries.every(isPlainObject)
  ) {
    return false;
  }

  const baselineSignatures = baselineEntries.map(getPrimitiveEntrySignature);
  const proposedSignatures = proposedEntries.map(getPrimitiveEntrySignature);

  if (
    baselineSignatures.some((value) => !value) ||
    proposedSignatures.some((value) => !value)
  ) {
    return false;
  }

  const baselineSet = new Set(baselineSignatures as string[]);
  const proposedSet = new Set(proposedSignatures as string[]);

  return baselineSet.size === baselineEntries.length && proposedSet.size === proposedEntries.length;
}

function fieldLabelMapForSchema(schema: SectionSchema) {
  const map = new Map<string, string>();

  for (const group of schema.groups) {
    for (const field of group.fields) {
      map.set(field.path.join('.'), field.label);
    }
  }

  return map;
}

function readDesignTheme(root: unknown) {
  if (isPlainObject(root) && typeof root.theme === 'string') {
    return root.theme;
  }
  return undefined;
}

function getKnownFieldLabel(section: SectionKey, path: Array<string | number>, baselineRoot: unknown, proposedRoot: unknown) {
  if (section === 'locale') {
    return fieldLabelMapForSchema(localeSchema).get(path.map(String).join('.'));
  }

  if (section === 'settings') {
    return fieldLabelMapForSchema(settingsSchema).get(path.map(String).join('.'));
  }

  if (section === 'design') {
    const baselineTheme = readDesignTheme(baselineRoot);
    const proposedTheme = readDesignTheme(proposedRoot);
    return (
      fieldLabelMapForSchema(getDesignSchema(proposedTheme)).get(path.map(String).join('.')) ??
      fieldLabelMapForSchema(getDesignSchema(baselineTheme)).get(path.map(String).join('.'))
    );
  }

  if (section !== 'cv') {
    return undefined;
  }

  const directFieldMap = new Map<string, string>(
    cvPersonalInfoGroup.fields.map((field) => [field.path.join('.'), field.label])
  );

  const direct = directFieldMap.get(path.map(String).join('.'));
  if (direct) {
    return direct;
  }

  const head = String(path[0] ?? '');
  if (head === 'social_networks' || head === 'custom_connections') {
    const template = head === 'social_networks' ? socialNetworkTemplate : customConnectionTemplate;
    if (path.length <= 2) {
      return template.singularLabel ?? template.label;
    }

    return template.fields.find((field) => field.path[0] === String(path[2]))?.label;
  }

  if (head !== 'sections') {
    return undefined;
  }

  if (path.length <= 2) {
    return dictionaryKeyToTitle(String(path[1] ?? 'section'));
  }

  const sectionKey = String(path[1]);
  const baselineEntries = Array.isArray(getIn(baselineRoot, ['sections', sectionKey]))
    ? (getIn(baselineRoot, ['sections', sectionKey]) as unknown[])
    : [];
  const proposedEntries = Array.isArray(getIn(proposedRoot, ['sections', sectionKey]))
    ? (getIn(proposedRoot, ['sections', sectionKey]) as unknown[])
    : [];
  const index = Number(path[2]);
  const entry =
    proposedEntries[index] ??
    baselineEntries[index] ??
    proposedEntries[0] ??
    baselineEntries[0];
  const template = detectEntryType(entry);

  if (path.length === 3) {
    return template === 'text' ? 'Text Entry' : template.singularLabel ?? template.label;
  }

  if (template === 'text') {
    return 'Text Entry';
  }

  return template.fields.find((field) => field.path[0] === String(path[3]))?.label;
}

function describeChange(
  section: SectionKey,
  path: Array<string | number>,
  baselineRoot: unknown,
  proposedRoot: unknown
) {
  const knownLabel = getKnownFieldLabel(section, path, baselineRoot, proposedRoot);
  const dotted = serializePath(path);

  if (section !== 'cv' || String(path[0]) !== 'sections' || path.length < 3) {
    return {
      label: knownLabel ?? (dotted || SECTION_LABELS[section])
    };
  }

  const sectionKey = String(path[1]);
  const sectionTitle = dictionaryKeyToTitle(sectionKey);
  const entries =
    (getIn(proposedRoot, ['sections', sectionKey]) as unknown[] | undefined) ??
    (getIn(baselineRoot, ['sections', sectionKey]) as unknown[] | undefined) ??
    [];
  const index = Number(path[2]);
  const entry = entries[index] ?? entries[0];
  const template = detectEntryType(entry);
  const entryLabel =
    entry !== undefined ? resolveEntrySummary(entry, template, Number.isFinite(index) ? index : 0) : undefined;

  return {
    label: knownLabel ?? (dotted || sectionTitle),
    detail: sectionTitle,
    entryLabel
  };
}

function pushChange(
  changes: ReviewChange[],
  section: SectionKey,
  path: Array<string | number>,
  kind: ReviewChangeKind,
  baselineValue: unknown,
  proposedValue: unknown,
  baselineRoot: unknown,
  proposedRoot: unknown
) {
  const description = describeChange(section, path, baselineRoot, proposedRoot);
  changes.push({
    id: `${section}:${serializePath(path)}`,
    section,
    path,
    label: description.label,
    detail: description.detail,
    entryLabel: description.entryLabel,
    kind,
    baselineValue: cloneValue(baselineValue),
    proposedValue: cloneValue(proposedValue)
  });
}

function diffArrayValues(
  section: SectionKey,
  path: Array<string | number>,
  baselineValue: unknown[],
  proposedValue: unknown[],
  changes: ReviewChange[],
  baselineRoot: unknown,
  proposedRoot: unknown
) {
  if (baselineValue.every(isPlainObject) && proposedValue.every(isPlainObject)) {
    if (canMatchBySignature(baselineValue, proposedValue)) {
      const baselineBySignature = new Map(
        baselineValue.map((entry, index) => [getPrimitiveEntrySignature(entry)!, { entry, index }])
      );
      const proposedBySignature = new Map(
        proposedValue.map((entry, index) => [getPrimitiveEntrySignature(entry)!, { entry, index }])
      );
      const signatures = new Set([...baselineBySignature.keys(), ...proposedBySignature.keys()]);

      for (const signature of signatures) {
        const baselineMatch = baselineBySignature.get(signature);
        const proposedMatch = proposedBySignature.get(signature);

        if (!baselineMatch) {
          pushChange(
            changes,
            section,
            [...path, proposedMatch!.index],
            'add',
            undefined,
            proposedMatch!.entry,
            baselineRoot,
            proposedRoot
          );
          continue;
        }

        if (!proposedMatch) {
          pushChange(
            changes,
            section,
            [...path, baselineMatch.index],
            'remove',
            baselineMatch.entry,
            undefined,
            baselineRoot,
            proposedRoot
          );
          continue;
        }

        diffValues(
          section,
          [...path, baselineMatch.index],
          baselineMatch.entry,
          proposedMatch.entry,
          changes,
          baselineRoot,
          proposedRoot
        );
      }

      return;
    }

    const maxLength = Math.max(baselineValue.length, proposedValue.length);
    for (let index = 0; index < maxLength; index += 1) {
      if (index >= baselineValue.length) {
        pushChange(
          changes,
          section,
          [...path, index],
          'add',
          undefined,
          proposedValue[index],
          baselineRoot,
          proposedRoot
        );
        continue;
      }

      if (index >= proposedValue.length) {
        pushChange(
          changes,
          section,
          [...path, index],
          'remove',
          baselineValue[index],
          undefined,
          baselineRoot,
          proposedRoot
        );
        continue;
      }

      if (!deepEqual(baselineValue[index], proposedValue[index])) {
        pushChange(
          changes,
          section,
          [...path, index],
          'set',
          baselineValue[index],
          proposedValue[index],
          baselineRoot,
          proposedRoot
        );
      }
    }

    return;
  }

  const maxLength = Math.max(baselineValue.length, proposedValue.length);
  for (let index = 0; index < maxLength; index += 1) {
    if (index >= baselineValue.length) {
      pushChange(
        changes,
        section,
        [...path, index],
        'add',
        undefined,
        proposedValue[index],
        baselineRoot,
        proposedRoot
      );
      continue;
    }

    if (index >= proposedValue.length) {
      pushChange(
        changes,
        section,
        [...path, index],
        'remove',
        baselineValue[index],
        undefined,
        baselineRoot,
        proposedRoot
      );
      continue;
    }

    if (!deepEqual(baselineValue[index], proposedValue[index])) {
      pushChange(
        changes,
        section,
        [...path, index],
        'set',
        baselineValue[index],
        proposedValue[index],
        baselineRoot,
        proposedRoot
      );
    }
  }
}

function diffValues(
  section: SectionKey,
  path: Array<string | number>,
  baselineValue: unknown,
  proposedValue: unknown,
  changes: ReviewChange[],
  baselineRoot: unknown,
  proposedRoot: unknown
) {
  if (deepEqual(baselineValue, proposedValue)) {
    return;
  }

  if (Array.isArray(baselineValue) && Array.isArray(proposedValue)) {
    diffArrayValues(section, path, baselineValue, proposedValue, changes, baselineRoot, proposedRoot);
    return;
  }

  if (isPlainObject(baselineValue) && isPlainObject(proposedValue)) {
    const keys = new Set([...Object.keys(baselineValue), ...Object.keys(proposedValue)]);
    for (const key of keys) {
      if (!(key in baselineValue)) {
        pushChange(
          changes,
          section,
          [...path, key],
          'add',
          undefined,
          proposedValue[key],
          baselineRoot,
          proposedRoot
        );
        continue;
      }

      if (!(key in proposedValue)) {
        pushChange(
          changes,
          section,
          [...path, key],
          'remove',
          baselineValue[key],
          undefined,
          baselineRoot,
          proposedRoot
        );
        continue;
      }

      diffValues(
        section,
        [...path, key],
        baselineValue[key],
        proposedValue[key],
        changes,
        baselineRoot,
        proposedRoot
      );
    }
    return;
  }

  pushChange(
    changes,
    section,
    path,
    baselineValue === undefined ? 'add' : proposedValue === undefined ? 'remove' : 'set',
    baselineValue,
    proposedValue,
    baselineRoot,
    proposedRoot
  );
}

function sortAcceptedChanges(changes: ReviewChange[]) {
  return [...changes].sort((left, right) => {
    const leftDepth = left.path.length;
    const rightDepth = right.path.length;

    if (left.kind === right.kind) {
      if (left.kind === 'remove') {
        return rightDepth - leftDepth || serializePath(right.path).localeCompare(serializePath(left.path));
      }
      return leftDepth - rightDepth || serializePath(left.path).localeCompare(serializePath(right.path));
    }

    const order: Record<ReviewChangeKind, number> = {
      set: 0,
      remove: 1,
      add: 2
    };

    return order[left.kind] - order[right.kind];
  });
}

export function computeReviewSectionChanges(
  baselineSections: CvFileSections,
  proposedSections: CvFileSections
): ReviewSectionChanges[] {
  return SECTION_KEYS.map((section) => {
    const baselineRoot = parseSectionRoot(section, baselineSections[section]);
    const proposedRoot = parseSectionRoot(section, proposedSections[section]);
    const changes: ReviewChange[] = [];

    diffValues(section, [], baselineRoot, proposedRoot, changes, baselineRoot, proposedRoot);

    return {
      key: section,
      label: SECTION_LABELS[section],
      changes
    };
  });
}

export function applyAcceptedReviewChanges(
  baselineSections: CvFileSections,
  sectionChanges: ReviewSectionChanges[],
  decisions: Record<string, 'accepted' | 'rejected'>
): CvFileSections {
  const nextSections = { ...baselineSections };

  for (const section of sectionChanges) {
    let nextRoot = cloneValue(parseSectionRoot(section.key, baselineSections[section.key]));
    const accepted = sortAcceptedChanges(
      section.changes.filter((change) => decisions[change.id] === 'accepted')
    );

    for (const change of accepted) {
      if (change.path.length === 0) {
        nextRoot = cloneValue(change.proposedValue);
        continue;
      }

      if (change.kind === 'remove') {
        nextRoot = removeIn(nextRoot, change.path);
        continue;
      }

      nextRoot = setIn(nextRoot, change.path, change.proposedValue);
    }

    nextSections[section.key] = stringifySectionRoot(section.key, nextRoot);
  }

  return nextSections;
}
