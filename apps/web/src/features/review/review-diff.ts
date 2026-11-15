import type { CvFileSections, SectionKey } from '@rendercv/contracts';
import { SECTION_KEYS, SECTION_LABELS } from '@rendercv/contracts';
import YAML from 'yaml';
import { stringifyCvYaml } from '@rendercv/core';
import { customConnectionTemplate, cvPersonalInfoGroup, socialNetworkTemplate } from '../form/schema/cv-schema';
import { getDesignSchema } from '../form/schema/design-schema';
import { detectEntryType } from '../form/schema/entry-templates';
import { localeSchema } from '../form/schema/locale-schema';
import { settingsSchema } from '../form/schema/settings-schema';
import type { EntryTemplate, SectionSchema } from '../form/schema/types';
import { dictionaryKeyToTitle, resolveEntrySummary } from '../form/utils';

/**
 * `set`, `add` and `remove` change a value. `rename` renames a CV section
 * (baselineValue is the old key, proposedValue the new one); the edits inside
 * the section are separate changes, addressed by the old key. `reorder` puts
 * the entries of a list, or the CV's sections, in a new order (both values are
 * the identities of the items, in order).
 */
export type ReviewChangeKind = 'add' | 'remove' | 'set' | 'rename' | 'reorder';

/**
 * Changes that only make sense together: a bullet moved (removed here, added
 * there), two bullets combined into one, or one split in two. Accepting half of
 * one would lose or duplicate text, so they are decided as a unit.
 */
export interface ReviewChangeGroup {
  id: string;
  kind: 'move' | 'combine' | 'split';
  summary: string;
}

/** A list item (a skill, say) that this change takes out of one place and another change adds elsewhere. */
export interface ReviewRelatedMove {
  item: string;
  /** `to`: this change removes the item and `changeId` adds it; `from`: the reverse. */
  direction: 'to' | 'from';
  changeId: string;
  where: string;
}

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
  /** How to show the two sides when the raw values are identities rather than content. */
  displayBefore?: string;
  displayAfter?: string;
  group?: ReviewChangeGroup;
  related?: ReviewRelatedMove[];
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

export function parseSectionRoot(section: SectionKey, yamlSource: string) {
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
  return stringifyCvYaml({ [section]: root ?? {} });
}

function serializePath(path: Array<string | number>) {
  return path.map((segment) => String(segment)).join('.');
}

export function getIn(root: unknown, path: Array<string | number>) {
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

function insertIn(root: unknown, path: Array<string | number>, value: unknown): unknown {
  if (path.length === 0) {
    return cloneValue(value);
  }

  if (path.length === 1 && typeof path[0] === 'number' && Array.isArray(root)) {
    const next = [...root];
    next.splice(path[0], 0, cloneValue(value));
    return next;
  }

  if (Array.isArray(root)) {
    const [segment, ...rest] = path;
    const index = Number(segment);
    const next = [...root];
    const currentChild = next[index] ?? (typeof rest[0] === 'number' ? [] : {});
    next[index] = insertIn(currentChild, rest, value);
    return next;
  }

  const objectRoot = isPlainObject(root) ? root : {};
  const [segment, ...rest] = path;
  const key = String(segment);
  const next = { ...objectRoot };
  const currentChild = next[key] ?? (typeof rest[0] === 'number' ? [] : {});
  next[key] = insertIn(currentChild, rest, value);
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

/** Everything one diff of a section needs, passed down instead of five loose arguments. */
interface DiffRun {
  section: SectionKey;
  baselineRoot: unknown;
  /**
   * The proposed root with renamed sections put back under their original key,
   * so every change inside a renamed section is addressed by the key the
   * baseline (and the author's CV) still has.
   */
  proposedRoot: unknown;
  /** Section key in the baseline -> its new key in the proposal. */
  renames: Map<string, string>;
  changes: ReviewChange[];
}

function describeChange(run: DiffRun, path: Array<string | number>) {
  const { section, baselineRoot, proposedRoot } = run;
  const knownLabel = getKnownFieldLabel(section, path, baselineRoot, proposedRoot);
  const dotted = serializePath(path);

  if (section !== 'cv' || String(path[0]) !== 'sections' || path.length < 3) {
    return {
      label: knownLabel ?? (dotted || SECTION_LABELS[section])
    };
  }

  const sectionKey = String(path[1]);
  const sectionTitle = dictionaryKeyToTitle(run.renames.get(sectionKey) ?? sectionKey);
  const entries =
    (getIn(proposedRoot, ['sections', sectionKey]) as unknown[] | undefined) ??
    (getIn(baselineRoot, ['sections', sectionKey]) as unknown[] | undefined) ??
    [];
  const index = Number(path[2]);
  const entry = Array.isArray(entries) ? (entries[index] ?? entries[0]) : undefined;
  const template = detectEntryType(entry);
  const entryLabel =
    entry !== undefined ? resolveEntrySummary(entry, template, Number.isFinite(index) ? index : 0) : undefined;

  return {
    label: knownLabel ?? (dotted || sectionTitle),
    detail: sectionTitle,
    entryLabel
  };
}

/**
 * Where a path points, in words: "Experience › Acme › Highlights › item 2".
 * Used to label comments; works on a parsed section root.
 */
export function describeReviewPath(section: SectionKey, path: Array<string | number>, root: unknown) {
  const run: DiffRun = { section, baselineRoot: root, proposedRoot: root, renames: new Map(), changes: [] };
  const parts: string[] = [];
  if (section !== 'cv') {
    parts.push(SECTION_LABELS[section]);
  }
  if (section === 'cv' && String(path[0]) === 'sections' && path.length >= 2) {
    parts.push(dictionaryKeyToTitle(String(path[1])));
    if (path.length >= 3) {
      const { entryLabel } = describeChange(run, path.slice(0, 3));
      if (entryLabel) parts.push(entryLabel);
    }
    if (path.length >= 4) {
      const label = getKnownFieldLabel(section, path.slice(0, 4), root, root);
      parts.push(label ?? dictionaryKeyToTitle(String(path[3])));
    }
    if (path.length >= 5 && typeof path[4] === 'number') {
      parts.push(`item ${path[4] + 1}`);
    }
    return parts.join(' › ');
  }
  const label = getKnownFieldLabel(section, path, root, root);
  if (label) {
    parts.push(label);
  } else if (path.length) {
    parts.push(
      path.map((segment) => (typeof segment === 'number' ? `item ${segment + 1}` : dictionaryKeyToTitle(segment))).join(' › ')
    );
  }
  return parts.join(' › ') || SECTION_LABELS[section];
}

function pushChange(
  run: DiffRun,
  path: Array<string | number>,
  kind: ReviewChangeKind,
  baselineValue: unknown,
  proposedValue: unknown,
  extra: Partial<Pick<ReviewChange, 'label' | 'entryLabel' | 'detail' | 'displayBefore' | 'displayAfter'>> = {}
) {
  const description = describeChange(run, path);
  const change: ReviewChange = {
    id: `${run.section}:${kind}:${serializePath(path)}`,
    section: run.section,
    path,
    label: description.label,
    detail: description.detail,
    entryLabel: description.entryLabel,
    kind,
    baselineValue: cloneValue(baselineValue),
    proposedValue: cloneValue(proposedValue),
    ...extra
  };
  run.changes.push(change);
  return change;
}

// ---------------------------------------------------------------------------
// Similarity: used to pair rewritten items, and to recognise moves, merges,
// splits and renamed sections instead of lining things up by position.
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  'a', 'an', 'and', 'the', 'of', 'to', 'in', 'on', 'for', 'with', 'by', 'at', 'as', 'or', 'from',
  'into', 'that', 'this', 'their', 'its', 'is', 'are', 'was', 'were', 'be', 'it'
]);

function plainText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(plainText).join(' ');
  if (isPlainObject(value)) return Object.values(value).map(plainText).join(' ');
  return '';
}

export function reviewWordSet(value: unknown): Set<string> {
  const words = plainText(value).toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}+#]*/gu) ?? [];
  return new Set(words.filter((word) => !STOPWORDS.has(word)));
}

/** Dice coefficient of two word sets: 1 for the same words, 0 for none shared. */
export function wordSetSimilarity(left: Set<string>, right: Set<string>) {
  if (left.size === 0 && right.size === 0) return 1;
  let shared = 0;
  for (const word of left) if (right.has(word)) shared += 1;
  return (2 * shared) / (left.size + right.size);
}

/** Share of `part`'s words that also appear in `whole`. */
function wordSetContainment(part: Set<string>, whole: Set<string>) {
  if (part.size === 0) return 0;
  let shared = 0;
  for (const word of part) if (whole.has(word)) shared += 1;
  return shared / part.size;
}

/** Two items this alike are the same item, rewritten. */
const PAIR_THRESHOLD = 0.25;
/** A removed and an added item this alike are one item that moved. */
const MOVE_THRESHOLD = 0.8;
/** This much of an item's words found in another item means it was merged into it (or split from it). */
const CONTAINMENT_THRESHOLD = 0.5;

/**
 * Pair the items of one gap (between two unchanged items) by similarity,
 * keeping their order, so a rewritten bullet is compared with the bullet it
 * rewrites and not with whatever happens to sit at the same position. Returns
 * pairs of [baseline offset, proposed offset].
 */
function alignGap(baselineItems: unknown[], proposedItems: unknown[]): Array<[number, number]> {
  const rows = baselineItems.length;
  const cols = proposedItems.length;
  const baselineWords = baselineItems.map(reviewWordSet);
  const proposedWords = proposedItems.map(reviewWordSet);
  const similarity = baselineWords.map((left) => proposedWords.map((right) => wordSetSimilarity(left, right)));
  const score: number[][] = Array.from({ length: rows + 1 }, () => new Array<number>(cols + 1).fill(0));
  for (let i = rows - 1; i >= 0; i -= 1) {
    for (let j = cols - 1; j >= 0; j -= 1) {
      const pair = similarity[i]![j]! >= PAIR_THRESHOLD ? similarity[i]![j]! + score[i + 1]![j + 1]! : -1;
      score[i]![j] = Math.max(score[i + 1]![j]!, score[i]![j + 1]!, pair);
    }
  }

  const pairs: Array<[number, number]> = [];
  let i = 0;
  let j = 0;
  while (i < rows && j < cols) {
    const sim = similarity[i]![j]!;
    if (sim >= PAIR_THRESHOLD && score[i]![j] === sim + score[i + 1]![j + 1]!) {
      pairs.push([i, j]);
      i += 1;
      j += 1;
    } else if (score[i + 1]![j]! >= score[i]![j + 1]!) {
      i += 1;
    } else {
      j += 1;
    }
  }

  // A lone item replaced by a lone item is an edit, however much it changed.
  const result: Array<[number, number]> = [];
  let lastBaseline = -1;
  let lastProposed = -1;
  for (const pair of [...pairs, [rows, cols] as [number, number]]) {
    if (pair[0] - lastBaseline - 1 === 1 && pair[1] - lastProposed - 1 === 1) {
      result.push([lastBaseline + 1, lastProposed + 1]);
    }
    if (pair[0] < rows) result.push(pair);
    lastBaseline = pair[0];
    lastProposed = pair[1];
  }
  return result;
}

/**
 * Diff two lists by their longest common subsequence instead of position by
 * position. Comparing by index turned one bullet inserted at the top into a
 * change to every bullet after it, and accepting just that insert overwrote an
 * existing bullet. Items left between two matches are paired by similarity;
 * the rest are removals (at their baseline index) or additions (at their
 * proposed index), which is what applying changes expects. Removals and
 * additions that belong together (a moved bullet, two bullets combined into
 * one, one split in two) are then grouped so they are decided together.
 */
function diffSequence(run: DiffRun, path: Array<string | number>, baselineValue: unknown[], proposedValue: unknown[]) {
  const rows = baselineValue.length;
  const cols = proposedValue.length;
  const table: number[][] = Array.from({ length: rows + 1 }, () => new Array<number>(cols + 1).fill(0));
  for (let i = rows - 1; i >= 0; i -= 1) {
    for (let j = cols - 1; j >= 0; j -= 1) {
      table[i]![j] = deepEqual(baselineValue[i], proposedValue[j])
        ? table[i + 1]![j + 1]! + 1
        : Math.max(table[i + 1]![j]!, table[i]![j + 1]!);
    }
  }

  type Gap = { baselineStart: number; baselineEnd: number; proposedStart: number; proposedEnd: number };
  const gaps: Gap[] = [];
  let i = 0;
  let j = 0;
  let gap: Gap | null = null;
  const closeGap = () => {
    if (gap && (gap.baselineEnd > gap.baselineStart || gap.proposedEnd > gap.proposedStart)) gaps.push(gap);
    gap = null;
  };
  while (i < rows || j < cols) {
    if (i < rows && j < cols && deepEqual(baselineValue[i], proposedValue[j])) {
      closeGap();
      i += 1;
      j += 1;
      continue;
    }
    gap ??= { baselineStart: i, baselineEnd: i, proposedStart: j, proposedEnd: j };
    if (j < cols && (i >= rows || table[i]![j + 1]! >= table[i + 1]![j]!)) {
      j += 1;
      gap.proposedEnd = j;
    } else {
      i += 1;
      gap.baselineEnd = i;
    }
  }
  closeGap();

  type Edit = { change: ReviewChange; baselineIndex: number; proposedIndex: number };
  type Lone = { change: ReviewChange; index: number; value: unknown };
  const edits: Edit[] = [];
  const removals: Lone[] = [];
  const additions: Lone[] = [];

  for (const entry of gaps) {
    const baselineItems = baselineValue.slice(entry.baselineStart, entry.baselineEnd);
    const proposedItems = proposedValue.slice(entry.proposedStart, entry.proposedEnd);
    const pairs = alignGap(baselineItems, proposedItems);
    const pairedBaseline = new Set(pairs.map(([left]) => left));
    const pairedProposed = new Set(pairs.map(([, right]) => right));

    for (const [left, right] of pairs) {
      const baselineIndex = entry.baselineStart + left;
      const proposedIndex = entry.proposedStart + right;
      // An edited item is one whole-item change: these lists have no stable
      // key per item, so a field-level path would be fragile.
      const change = pushChange(run, [...path, baselineIndex], 'set', baselineValue[baselineIndex], proposedValue[proposedIndex]);
      edits.push({ change, baselineIndex, proposedIndex });
    }
    baselineItems.forEach((value, offset) => {
      if (pairedBaseline.has(offset)) return;
      const index = entry.baselineStart + offset;
      removals.push({ change: pushChange(run, [...path, index], 'remove', value, undefined), index, value });
    });
    proposedItems.forEach((value, offset) => {
      if (pairedProposed.has(offset)) return;
      const index = entry.proposedStart + offset;
      additions.push({ change: pushChange(run, [...path, index], 'add', undefined, value), index, value });
    });
  }

  groupRelatedListChanges(path, edits, removals, additions);
}

function groupRelatedListChanges(
  path: Array<string | number>,
  edits: Array<{ change: ReviewChange; baselineIndex: number; proposedIndex: number }>,
  removals: Array<{ change: ReviewChange; index: number; value: unknown }>,
  additions: Array<{ change: ReviewChange; index: number; value: unknown }>
) {
  if (removals.length === 0 && additions.length === 0) return;
  const groupBase = serializePath(path);
  let groupCount = 0;
  const nextGroupId = () => `group:${groupBase}:${(groupCount += 1)}`;
  const usedAdditions = new Set<ReviewChange>();
  const usedRemovals = new Set<ReviewChange>();
  const item = (index: number) => `item ${index + 1}`;

  // Moves: an item taken out in one place and put back (perhaps reworded) in another.
  for (const removal of removals) {
    const removedWords = reviewWordSet(removal.value);
    let best: { addition: (typeof additions)[number]; score: number } | undefined;
    for (const addition of additions) {
      if (usedAdditions.has(addition.change)) continue;
      const score = deepEqual(removal.value, addition.value)
        ? 1
        : wordSetSimilarity(removedWords, reviewWordSet(addition.value));
      if (score >= MOVE_THRESHOLD && (!best || score > best.score)) best = { addition, score };
    }
    if (!best) continue;
    usedAdditions.add(best.addition.change);
    usedRemovals.add(removal.change);
    const reworded = !deepEqual(removal.value, best.addition.value);
    const group = {
      id: nextGroupId(),
      kind: 'move' as const,
      summary: `Moved from ${item(removal.index)} to ${item(best.addition.index)}${reworded ? ', with edits' : ''}`
    };
    removal.change.group = group;
    best.addition.change.group = group;
  }

  // Combined: what an item said now lives inside another item's new wording.
  const combined = new Map<string, Set<number>>();
  for (const removal of removals) {
    if (usedRemovals.has(removal.change)) continue;
    const removedWords = reviewWordSet(removal.value);
    const host = edits.find(
      (edit) => wordSetContainment(removedWords, reviewWordSet(edit.change.proposedValue)) >= CONTAINMENT_THRESHOLD
    );
    if (!host) continue;
    usedRemovals.add(removal.change);
    const group = host.change.group ?? { id: nextGroupId(), kind: 'combine' as const, summary: '' };
    const merged = combined.get(group.id) ?? new Set([host.baselineIndex]);
    merged.add(removal.index);
    combined.set(group.id, merged);
    const indexes = [...merged].sort((left, right) => left - right);
    group.summary = `Combined items ${indexes.map((index) => index + 1).join(' and ')} into ${item(host.proposedIndex)}`;
    host.change.group = group;
    removal.change.group = group;
  }

  // Split: a new item made out of part of an existing one.
  for (const addition of additions) {
    if (usedAdditions.has(addition.change)) continue;
    const addedWords = reviewWordSet(addition.value);
    const source = edits.find(
      (edit) =>
        (!edit.change.group || edit.change.group.kind === 'split') &&
        wordSetContainment(addedWords, reviewWordSet(edit.change.baselineValue)) >= CONTAINMENT_THRESHOLD
    );
    if (!source) continue;
    usedAdditions.add(addition.change);
    const group = source.change.group ?? { id: nextGroupId(), kind: 'split' as const, summary: '' };
    group.summary = `Split ${item(source.baselineIndex)} into more than one item`;
    source.change.group = group;
    addition.change.group = group;
  }
}

function entryLabelFor(entry: unknown, index: number) {
  const template = detectEntryType(entry);
  return resolveEntrySummary(entry, template, index);
}

function diffArrayValues(run: DiffRun, path: Array<string | number>, baselineValue: unknown[], proposedValue: unknown[]) {
  if (
    baselineValue.every(isPlainObject) &&
    proposedValue.every(isPlainObject) &&
    canMatchBySignature(baselineValue, proposedValue)
  ) {
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
        pushChange(run, [...path, proposedMatch!.index], 'add', undefined, proposedMatch!.entry);
        continue;
      }

      if (!proposedMatch) {
        pushChange(run, [...path, baselineMatch.index], 'remove', baselineMatch.entry, undefined);
        continue;
      }

      diffValues(run, [...path, baselineMatch.index], baselineMatch.entry, proposedMatch.entry);
    }

    // Entries that are in both but in a different order. Matching by
    // signature used to drop this silently: the review showed nothing, and
    // accepting everything kept the old order.
    const baselineOrder = [...baselineBySignature.keys()].filter((signature) => proposedBySignature.has(signature));
    const proposedOrder = [...proposedBySignature.keys()].filter((signature) => baselineBySignature.has(signature));
    if (baselineOrder.length > 1 && !deepEqual(baselineOrder, proposedOrder)) {
      const labelFor = (signature: string) => {
        const match = baselineBySignature.get(signature)!;
        return entryLabelFor(match.entry, match.index);
      };
      const listTitle =
        run.section === 'cv' && String(path[0]) === 'sections' && path.length === 2
          ? dictionaryKeyToTitle(run.renames.get(String(path[1])) ?? String(path[1]))
          : undefined;
      pushChange(run, path, 'reorder', baselineOrder, proposedOrder, {
        label: 'Order of entries',
        entryLabel: listTitle,
        detail: listTitle,
        displayBefore: baselineOrder.map((signature, index) => `${index + 1}. ${labelFor(signature)}`).join('\n'),
        displayAfter: proposedOrder.map((signature, index) => `${index + 1}. ${labelFor(signature)}`).join('\n')
      });
    }
    return;
  }

  diffSequence(run, path, baselineValue, proposedValue);
}

function diffValues(run: DiffRun, path: Array<string | number>, baselineValue: unknown, proposedValue: unknown) {
  if (deepEqual(baselineValue, proposedValue)) {
    return;
  }

  if (Array.isArray(baselineValue) && Array.isArray(proposedValue)) {
    diffArrayValues(run, path, baselineValue, proposedValue);
    return;
  }

  if (isPlainObject(baselineValue) && isPlainObject(proposedValue)) {
    const keys = new Set([...Object.keys(baselineValue), ...Object.keys(proposedValue)]);
    for (const key of keys) {
      if (!(key in baselineValue)) {
        pushChange(run, [...path, key], 'add', undefined, proposedValue[key]);
        continue;
      }

      if (!(key in proposedValue)) {
        pushChange(run, [...path, key], 'remove', baselineValue[key], undefined);
        continue;
      }

      diffValues(run, [...path, key], baselineValue[key], proposedValue[key]);
    }
    return;
  }

  pushChange(
    run,
    path,
    baselineValue === undefined ? 'add' : proposedValue === undefined ? 'remove' : 'set',
    baselineValue,
    proposedValue
  );
}

/** The order of the CV's sections is what the reader sees first; report a reordering as one change. */
function diffSectionOrder(run: DiffRun, path: Array<string | number>, baselineValue: unknown, proposedValue: unknown) {
  if (!isPlainObject(baselineValue) || !isPlainObject(proposedValue)) return;
  const baselineOrder = Object.keys(baselineValue).filter((key) => key in proposedValue);
  const proposedOrder = Object.keys(proposedValue).filter((key) => key in baselineValue);
  if (baselineOrder.length < 2 || deepEqual(baselineOrder, proposedOrder)) return;
  const title = (key: string) => dictionaryKeyToTitle(run.renames.get(key) ?? key);
  pushChange(run, path, 'reorder', baselineOrder, proposedOrder, {
    label: 'Order of sections',
    detail: undefined,
    entryLabel: undefined,
    displayBefore: baselineOrder.map((key, index) => `${index + 1}. ${title(key)}`).join('\n'),
    displayAfter: proposedOrder.map((key, index) => `${index + 1}. ${title(key)}`).join('\n')
  });
}

/**
 * Find sections the proposal renamed. A section key that disappears while a
 * new one with largely the same content appears is a rename, not a deletion
 * plus an unrelated new section: reviewing it that way hid every edit inside
 * the section behind one all-or-nothing replacement.
 */
function detectSectionRenames(baselineRoot: unknown, proposedRoot: unknown) {
  const renames = new Map<string, string>();
  const baselineSections = getIn(baselineRoot, ['sections']);
  const proposedSections = getIn(proposedRoot, ['sections']);
  if (!isPlainObject(baselineSections) || !isPlainObject(proposedSections)) return renames;

  const removed = Object.keys(baselineSections).filter((key) => !(key in proposedSections));
  const added = Object.keys(proposedSections).filter((key) => !(key in baselineSections));
  if (removed.length === 0 || added.length === 0) return renames;

  const firstEntryType = (value: unknown) => {
    const first = Array.isArray(value) ? value[0] : undefined;
    if (first === undefined) return undefined;
    const template = detectEntryType(first);
    return template === 'text' ? 'text' : template.label;
  };

  const candidates: Array<{ from: string; to: string; score: number }> = [];
  for (const from of removed) {
    for (const to of added) {
      const score = wordSetSimilarity(reviewWordSet(baselineSections[from]), reviewWordSet(proposedSections[to]));
      const sameType = firstEntryType(baselineSections[from]) === firstEntryType(proposedSections[to]);
      if (score >= 0.3 || (sameType && score >= 0.1) || (removed.length === 1 && added.length === 1 && sameType)) {
        candidates.push({ from, to, score });
      }
    }
  }
  candidates.sort((left, right) => right.score - left.score);
  const usedTargets = new Set<string>();
  for (const candidate of candidates) {
    if (renames.has(candidate.from) || usedTargets.has(candidate.to)) continue;
    renames.set(candidate.from, candidate.to);
    usedTargets.add(candidate.to);
  }
  return renames;
}

function withSectionKeysRestored(proposedRoot: unknown, renames: Map<string, string>) {
  if (renames.size === 0) return proposedRoot;
  const sections = getIn(proposedRoot, ['sections']);
  if (!isPlainObject(sections)) return proposedRoot;
  const restore = new Map([...renames].map(([from, to]) => [to, from]));
  return setIn(
    proposedRoot,
    ['sections'],
    Object.fromEntries(Object.entries(sections).map(([key, value]) => [restore.get(key) ?? key, value]))
  );
}

/**
 * Items of a list kept in one string ("Python; SQL; Excel"), the way skills are
 * written. Plain sentences do not count: their commas are not list separators.
 */
function listItemsOf(value: unknown, key?: string): Map<string, string> {
  const items = new Map<string, string>();
  if (typeof value !== 'string') return items;
  const parts = value.split(/[;,]/).map((part) => part.trim()).filter(Boolean);
  const looksLikeList = key === 'details' || (value.includes(';') && parts.length >= 3);
  if (!looksLikeList || parts.some((part) => part.length > 60)) return items;
  for (const part of parts) items.set(part.toLowerCase(), part);
  return items;
}

function collectListItems(value: unknown, into: Map<string, string>, key?: string) {
  if (typeof value === 'string') {
    for (const [normalized, display] of listItemsOf(value, key)) into.set(normalized, display);
  } else if (Array.isArray(value)) {
    for (const item of value) collectListItems(item, into);
  } else if (isPlainObject(value)) {
    for (const [childKey, child] of Object.entries(value)) collectListItems(child, into, childKey);
  }
}

/**
 * Notice list items that leave one place and arrive in another ("PHP" taken
 * out of Development and added to a new Languages line) and say so on both
 * changes, so the reviewer's intent reads as one move rather than two
 * unrelated edits.
 */
function linkMovedListItems(changes: ReviewChange[]) {
  const lastKey = (change: ReviewChange) => {
    const last = change.path[change.path.length - 1];
    return typeof last === 'string' ? last : undefined;
  };
  const removedBy = new Map<ReviewChange, Map<string, string>>();
  const addedBy = new Map<ReviewChange, Map<string, string>>();
  for (const change of changes) {
    const before = new Map<string, string>();
    const after = new Map<string, string>();
    collectListItems(change.baselineValue, before, lastKey(change));
    collectListItems(change.proposedValue, after, lastKey(change));
    removedBy.set(change, new Map([...before].filter(([key]) => !after.has(key))));
    addedBy.set(change, new Map([...after].filter(([key]) => !before.has(key))));
  }

  const where = (change: ReviewChange) => change.entryLabel ?? change.detail ?? change.label;
  for (const [source, removed] of removedBy) {
    for (const [normalized, display] of removed) {
      for (const [target, added] of addedBy) {
        if (target === source || !added.has(normalized)) continue;
        (source.related ??= []).push({ item: display, direction: 'to', changeId: target.id, where: where(target) });
        (target.related ??= []).push({ item: display, direction: 'from', changeId: source.id, where: where(source) });
      }
    }
  }
}

function diffSection(section: SectionKey, baselineRoot: unknown, proposedRoot: unknown) {
  const renames = section === 'cv' ? detectSectionRenames(baselineRoot, proposedRoot) : new Map<string, string>();
  const run: DiffRun = {
    section,
    baselineRoot,
    proposedRoot: withSectionKeysRestored(proposedRoot, renames),
    renames,
    changes: []
  };

  for (const [from, to] of renames) {
    pushChange(run, ['sections', from], 'rename', from, to, {
      label: 'Section renamed',
      entryLabel: `${dictionaryKeyToTitle(from)} → ${dictionaryKeyToTitle(to)}`,
      detail: undefined,
      displayBefore: dictionaryKeyToTitle(from),
      displayAfter: dictionaryKeyToTitle(to)
    });
  }

  diffValues(run, [], baselineRoot, run.proposedRoot);
  if (section === 'cv') {
    // Key order is invisible to the value comparison above, so check it here.
    diffSectionOrder(run, ['sections'], getIn(baselineRoot, ['sections']), getIn(run.proposedRoot, ['sections']));
    linkMovedListItems(run.changes);
  }
  return run.changes;
}

/**
 * Order paths segment by segment, comparing array indexes as numbers. Joining
 * them into strings sorted index 10 before 9, so accepting the removal of two
 * entries in a list of ten or more deleted the wrong one.
 */
function comparePaths(left: Array<string | number>, right: Array<string | number>) {
  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const a = left[index];
    const b = right[index];
    if (a === b) continue;
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b));
  }
  return left.length - right.length;
}

// Edits, then removals, then insertions, all addressed by position; then
// reorders, which find their items by identity; renames last, because every
// other change inside a renamed section is addressed by its original key.
const APPLY_ORDER: Record<ReviewChangeKind, number> = {
  set: 0,
  remove: 1,
  add: 2,
  reorder: 3,
  rename: 4
};

function sortAcceptedChanges(changes: ReviewChange[]) {
  return [...changes].sort((left, right) => {
    const leftDepth = left.path.length;
    const rightDepth = right.path.length;

    if (left.kind === right.kind) {
      if (left.kind === 'remove') {
        // Deepest first, then highest index first, so earlier removals never
        // shift the position of a later one.
        return rightDepth - leftDepth || comparePaths(right.path, left.path);
      }
      if (left.kind === 'reorder') {
        // Inner lists before the section order around them.
        return rightDepth - leftDepth || comparePaths(left.path, right.path);
      }
      return leftDepth - rightDepth || comparePaths(left.path, right.path);
    }

    return APPLY_ORDER[left.kind] - APPLY_ORDER[right.kind];
  });
}

/**
 * Put the items named in `order` into that order, using only the slots those
 * items already occupy: anything else (an entry the author added since, or
 * one whose removal was accepted) stays where it is.
 */
function reorderBy<T>(items: T[], identify: (item: T) => string | undefined, order: string[]) {
  const rank = new Map(order.map((key, index) => [key, index]));
  const slots: number[] = [];
  const moving: T[] = [];
  items.forEach((item, index) => {
    const key = identify(item);
    if (key !== undefined && rank.has(key)) {
      slots.push(index);
      moving.push(item);
    }
  });
  moving.sort((left, right) => rank.get(identify(left)!)! - rank.get(identify(right)!)!);
  const next = [...items];
  slots.forEach((slot, index) => {
    next[slot] = moving[index]!;
  });
  return next;
}

function reorderContainer(container: unknown, order: unknown) {
  if (!Array.isArray(order)) return container;
  const keys = order.map(String);
  if (Array.isArray(container)) {
    return reorderBy(container, (entry) => (isPlainObject(entry) ? getPrimitiveEntrySignature(entry) : undefined), keys);
  }
  if (isPlainObject(container)) {
    const entries = reorderBy(Object.entries(container), ([key]) => key, keys);
    return Object.fromEntries(entries);
  }
  return container;
}

function renameKey(container: unknown, from: string, to: string) {
  if (!isPlainObject(container) || !(from in container) || to in container) return container;
  return Object.fromEntries(Object.entries(container).map(([key, value]) => [key === from ? to : key, value]));
}

function applyChange(root: unknown, change: ReviewChange): unknown {
  if (change.path.length === 0) {
    return change.kind === 'reorder' ? reorderContainer(root, change.proposedValue) : cloneValue(change.proposedValue);
  }
  switch (change.kind) {
    case 'remove':
      return removeIn(root, change.path);
    case 'add':
      return insertIn(root, change.path, change.proposedValue);
    case 'reorder':
      return setIn(root, change.path, reorderContainer(getIn(root, change.path), change.proposedValue));
    case 'rename': {
      const parentPath = change.path.slice(0, -1);
      return setIn(root, parentPath, renameKey(getIn(root, parentPath), String(change.baselineValue), String(change.proposedValue)));
    }
    default:
      return setIn(root, change.path, change.proposedValue);
  }
}

export function computeReviewSectionChanges(
  baselineSections: CvFileSections,
  proposedSections: CvFileSections
): ReviewSectionChanges[] {
  return SECTION_KEYS.map((section) => {
    const baselineRoot = parseSectionRoot(section, baselineSections[section]);
    const proposedRoot = parseSectionRoot(section, proposedSections[section]);

    return {
      key: section,
      label: SECTION_LABELS[section],
      changes: diffSection(section, baselineRoot, proposedRoot)
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
      nextRoot = applyChange(nextRoot, change);
    }

    nextSections[section.key] = stringifySectionRoot(section.key, nextRoot);
  }

  return nextSections;
}

export interface ReviewConflict extends ReviewChange {
  /** The value at the change's path in the current resume (undefined when absent). */
  currentValue: unknown;
  /**
   * Whether the author may overwrite their edit with the proposed value. Only
   * field edits qualify, and only while every list on the path has the same
   * length as when the review started, so the path still points at the same
   * entry.
   */
  forceable: boolean;
}

function pathStillAddressesSameEntries(
  baselineRoot: unknown,
  currentRoot: unknown,
  path: Array<string | number>
) {
  for (let index = 0; index < path.length; index += 1) {
    if (typeof path[index] !== 'number') continue;
    const baselineList = getIn(baselineRoot, path.slice(0, index));
    const currentList = getIn(currentRoot, path.slice(0, index));
    if (!Array.isArray(baselineList) || !Array.isArray(currentList)) return false;
    if (baselineList.length !== currentList.length) return false;
  }
  return true;
}

export interface RebasedReviewResult {
  sections: CvFileSections;
  /** Accepted changes that were applied to the current resume. */
  applied: ReviewChange[];
  /**
   * Accepted changes skipped because the resume changed at the same place since
   * the review started, with what the resume holds there now.
   */
  conflicts: ReviewConflict[];
  /**
   * Accepted changes the current resume already contains (applied earlier, or
   * the same edit came from another reviewer). Nothing to do for these.
   */
  alreadyApplied: ReviewChange[];
  /** True when the current resume no longer matches the review's baseline. */
  diverged: boolean;
}

function renameState(root: unknown, change: ReviewChange) {
  const parent = getIn(root, change.path.slice(0, -1));
  if (!isPlainObject(parent)) return 'missing';
  const hasFrom = String(change.baselineValue) in parent;
  const hasTo = String(change.proposedValue) in parent;
  if (hasFrom && !hasTo) return 'pending';
  if (!hasFrom && hasTo) return 'done';
  return 'missing';
}

function alreadyInResume(currentRoot: unknown, change: ReviewChange) {
  if (change.path.length === 0) return false;
  if (change.kind === 'rename') return renameState(currentRoot, change) === 'done';
  if (change.kind === 'reorder') {
    const current = getIn(currentRoot, change.path);
    return deepEqualOrdered(current, reorderContainer(current, change.proposedValue));
  }
  const current = getIn(currentRoot, change.path);
  if (change.kind === 'remove') {
    // Only a removed key can be checked; a removed list item leaves its index
    // occupied by the next one.
    return typeof change.path[change.path.length - 1] === 'string' && current === undefined;
  }
  if (change.kind === 'add' && typeof change.path[change.path.length - 1] === 'number') {
    return false;
  }
  return deepEqual(current, change.proposedValue);
}

/** deepEqual that also requires object keys in the same order. */
function deepEqualOrdered(left: unknown, right: unknown) {
  if (isPlainObject(left) && isPlainObject(right) && !deepEqual(Object.keys(left), Object.keys(right))) {
    return false;
  }
  return deepEqual(left, right);
}

function appliesCleanlyTo(baselineRoot: unknown, currentRoot: unknown, change: ReviewChange) {
  if (change.path.length === 0) return false;
  switch (change.kind) {
    case 'add':
      return deepEqual(getIn(currentRoot, change.path.slice(0, -1)), getIn(baselineRoot, change.path.slice(0, -1)));
    case 'rename':
      return renameState(currentRoot, change) === 'pending';
    case 'reorder': {
      // Reordering finds items by identity, so it survives other edits.
      const current = getIn(currentRoot, change.path);
      return Array.isArray(current) || isPlainObject(current);
    }
    default:
      return deepEqual(getIn(currentRoot, change.path), change.baselineValue);
  }
}

/**
 * Apply accepted changes on top of the author's current resume rather than on
 * the snapshot the review started from, so edits the author made since then
 * are kept. A change is applied only where the current value still equals the
 * baseline value it was computed against; anything else is a conflict and is
 * reported instead of being silently overwritten.
 */
export function rebaseAcceptedReviewChanges(
  baselineSections: CvFileSections,
  currentSections: CvFileSections,
  sectionChanges: ReviewSectionChanges[],
  decisions: Record<string, 'accepted' | 'rejected'>,
  options: {
    /**
     * Conflicting field edits the author chose to overwrite with the proposed
     * value. Only `set` changes can be forced: forcing an insert or removal
     * into a list that has since changed could hit the wrong entry.
     */
    force?: ReadonlySet<string>;
  } = {}
): RebasedReviewResult {
  const nextSections = { ...currentSections };
  const applied: ReviewChange[] = [];
  const conflicts: ReviewConflict[] = [];
  const alreadyApplied: ReviewChange[] = [];
  let diverged = false;

  for (const key of SECTION_KEYS) {
    const baselineRoot = parseSectionRoot(key, baselineSections[key]);
    const currentRoot = parseSectionRoot(key, currentSections[key]);
    if (!deepEqual(baselineRoot, currentRoot)) {
      diverged = true;
    }
  }

  for (const section of sectionChanges) {
    const accepted = sortAcceptedChanges(
      section.changes.filter((change) => decisions[change.id] === 'accepted')
    );
    if (accepted.length === 0) {
      continue;
    }

    const baselineRoot = parseSectionRoot(section.key, baselineSections[section.key]);
    const currentRoot = parseSectionRoot(section.key, currentSections[section.key]);
    const unchangedSinceBaseline = deepEqualOrdered(baselineRoot, currentRoot) &&
      deepEqualOrdered(getIn(baselineRoot, ['sections']), getIn(currentRoot, ['sections']));
    let nextRoot = cloneValue(currentRoot);
    let sectionChanged = false;

    for (const change of accepted) {
      const appliesCleanly = unchangedSinceBaseline || appliesCleanlyTo(baselineRoot, currentRoot, change);

      const forceable =
        !appliesCleanly &&
        change.kind === 'set' &&
        change.path.length > 0 &&
        pathStillAddressesSameEntries(baselineRoot, currentRoot, change.path);
      const forced = forceable && Boolean(options.force?.has(change.id));

      if (!appliesCleanly && !forced && alreadyInResume(currentRoot, change)) {
        alreadyApplied.push(change);
        continue;
      }

      if (!appliesCleanly && !forced) {
        conflicts.push({ ...change, currentValue: getIn(currentRoot, change.path), forceable });
        continue;
      }

      nextRoot = applyChange(nextRoot, change);
      applied.push(change);
      sectionChanged = true;
    }

    if (sectionChanged) {
      nextSections[section.key] = stringifySectionRoot(section.key, nextRoot);
    }
  }

  return { sections: nextSections, applied, conflicts, alreadyApplied, diverged };
}
