/**
 * Pure YAML diff functions. Zero state, zero side effects.
 * All functions take YAML Document/Node objects and return plain data.
 */
import { parseDocument, isMap, isSeq, isScalar, type Document } from 'yaml';

import type { YamlSync } from './yaml-sync.svelte.js';

export type FieldDiffStatus = 'unchanged' | 'modified' | 'added' | 'removed';

/** Context provided by FormEditor to all review-aware children. */
export interface FormReviewContext {
  active: boolean;
  originalSync: YamlSync | undefined;
  diffAt: (path: string[]) => FieldDiffStatus;
  seqItemDiffs: (path: string[]) => FieldDiffStatus[];
  seqDiff: (path: string[]) => { originalLen: number; proposedLen: number };
  mapKeysDiff: (path: string[]) => {
    added: string[];
    removed: string[];
    common: string[];
    originalKeys: string[];
    proposedKeys: string[];
  };
  keep: (path: string[]) => void;
  undo: (path: string[]) => void;
  changeCount: number;
}

// ── Internal helpers ──────────────────────────────────────────────────

function nodeToComparable(node: unknown): string {
  if (node === undefined || node === null) return 'null';
  if (isScalar(node)) return JSON.stringify(node.value);
  if (isSeq(node) || isMap(node)) return JSON.stringify((node as { toJSON(): unknown }).toJSON());
  return JSON.stringify(node);
}

/** Convert a YAML AST node to a plain JS value. */
export function nodeToJS(node: unknown): unknown {
  if (node === undefined || node === null) return undefined;
  if (isScalar(node)) return node.value;
  if (isSeq(node) || isMap(node)) return (node as { toJSON(): unknown }).toJSON();
  return node;
}

/** Get a plain JS value at a path (safe for passing to createNode). */
export function getPlainValue(doc: Document, path: string[]): unknown {
  return nodeToJS(doc.getIn(path, true));
}

// ── Diff queries ──────────────────────────────────────────────────────

/** Field-level diff at a YAML path. */
export function diffAt(
  origDoc: Document | null,
  propDoc: Document | null,
  path: string[]
): FieldDiffStatus {
  if (!origDoc || !propDoc) return 'unchanged';

  const origNode = origDoc.getIn(path, true);
  const propNode = propDoc.getIn(path, true);
  const origExists = origNode !== undefined;
  const propExists = propNode !== undefined;

  if (!origExists && !propExists) return 'unchanged';
  if (!origExists && propExists) return 'added';
  if (origExists && !propExists) return 'removed';

  return nodeToComparable(origNode) === nodeToComparable(propNode) ? 'unchanged' : 'modified';
}

/** Per-item diff statuses for a sequence (e.g. string_list highlights). */
export function seqItemDiffs(
  origDoc: Document | null,
  propDoc: Document | null,
  path: string[]
): FieldDiffStatus[] {
  if (!origDoc || !propDoc) return [];

  const origNode = origDoc.getIn(path, true);
  const propNode = propDoc.getIn(path, true);
  const origItems = isSeq(origNode) ? origNode.items : [];
  const propItems = isSeq(propNode) ? propNode.items : [];
  const maxLen = Math.max(origItems.length, propItems.length);
  const result: FieldDiffStatus[] = [];

  for (let i = 0; i < maxLen; i++) {
    if (i >= origItems.length) {
      result.push('added');
    } else if (i >= propItems.length) {
      result.push('removed');
    } else {
      result.push(
        nodeToComparable(origItems[i]) === nodeToComparable(propItems[i]) ? 'unchanged' : 'modified'
      );
    }
  }
  return result;
}

/** Sequence structural diff — compare lengths. */
export function seqDiff(
  origDoc: Document | null,
  propDoc: Document | null,
  path: string[]
): { originalLen: number; proposedLen: number } {
  if (!origDoc || !propDoc) return { originalLen: 0, proposedLen: 0 };

  const origNode = origDoc.getIn(path, true);
  const propNode = propDoc.getIn(path, true);
  return {
    originalLen: isSeq(origNode) ? origNode.items.length : 0,
    proposedLen: isSeq(propNode) ? propNode.items.length : 0
  };
}

/** Map structural diff — compare key sets. */
export function mapKeysDiff(
  origDoc: Document | null,
  propDoc: Document | null,
  path: string[]
): {
  added: string[];
  removed: string[];
  common: string[];
  originalKeys: string[];
  proposedKeys: string[];
} {
  if (!origDoc || !propDoc)
    return { added: [], removed: [], common: [], originalKeys: [], proposedKeys: [] };

  const origNode = origDoc.getIn(path, true);
  const propNode = propDoc.getIn(path, true);
  const origKeys = isMap(origNode) ? origNode.items.map((p) => String(p.key)) : [];
  const propKeys = isMap(propNode) ? propNode.items.map((p) => String(p.key)) : [];
  const origSet = new Set(origKeys);
  const propSet = new Set(propKeys);

  return {
    added: propKeys.filter((k) => !origSet.has(k)),
    removed: origKeys.filter((k) => !propSet.has(k)),
    common: origKeys.filter((k) => propSet.has(k)),
    originalKeys: origKeys,
    proposedKeys: propKeys
  };
}

/** Recursively count leaf-level differences between two YAML AST nodes. */
export function countDiffs(orig: unknown, prop: unknown): number {
  if (isMap(orig) && isMap(prop)) {
    let count = 0;
    const origKeys = new Map(orig.items.map((p) => [String(p.key), p.value]));
    const propKeys = new Map(prop.items.map((p) => [String(p.key), p.value]));

    for (const [key, origVal] of origKeys) {
      if (!propKeys.has(key)) count++;
      else count += countDiffs(origVal, propKeys.get(key));
    }
    for (const key of propKeys.keys()) {
      if (!origKeys.has(key)) count++;
    }
    return count;
  }

  if (isSeq(orig) && isSeq(prop)) {
    let count = 0;
    const maxLen = Math.max(orig.items.length, prop.items.length);
    for (let i = 0; i < maxLen; i++) {
      if (i >= orig.items.length || i >= prop.items.length) count++;
      else count += countDiffs(orig.items[i], prop.items[i]);
    }
    return count;
  }

  return nodeToComparable(orig) === nodeToComparable(prop) ? 0 : 1;
}

/** Check if two YAML strings are semantically identical. */
export function yamlContentEquals(a: string, b: string): boolean {
  const docA = parseDocument(a || '{}');
  const docB = parseDocument(b || '{}');
  return countDiffs(docA.contents, docB.contents) === 0;
}
