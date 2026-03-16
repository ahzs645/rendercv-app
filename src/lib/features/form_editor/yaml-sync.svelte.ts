import { parseDocument, isMap, isSeq, isScalar, type Document } from 'yaml';

/**
 * Creates a reactive sync layer between YAML strings and form fields.
 *
 * YAML string is the source of truth. The Document is a structured view for
 * reading and writing specific paths. All structural mutations (seq/map reorder,
 * add, remove) operate directly on YAML AST nodes — never via a JS round-trip —
 * so comments, formatting, and unknown fields are always preserved.
 *
 * A Svelte $state version counter is incremented on every write so template
 * expressions that call get/mapKeys/seqLength/seqFirst re-evaluate automatically.
 *
 * Undo/redo operates on YAML string snapshots. Scalar edits (set) are debounced
 * so typing bursts become a single undo step. Structural ops (seq/map add, remove,
 * move, swap, rename) create immediate undo entries.
 *
 * Output sanitization (applied to clone only, never the internal doc):
 * - Zero-key map nodes are removed (provably form-editor artifacts)
 * - Sequence entries where every scalar value is null/empty are removed
 *   (e.g. a social network row added but never filled in)
 */

const UNDO_IDLE_MS = 500;
const UNDO_MAX_BURST_MS = 3000;
const MAX_UNDO_STACK = 100;
const FLUSH_DEBOUNCE_MS = 150;

function isNullValue(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (isScalar(v)) {
    const s = v.value;
    return s === null || s === undefined;
  }
  return false;
}

function isEmptyValue(v: unknown): boolean {
  if (isNullValue(v)) return true;
  if (isScalar(v)) return v.value === '';
  return false;
}

/**
 * Remove sequence entries that are maps with all-empty scalar values, and zero-key maps.
 * Also builds an index map (outputIndex → internalIndex) so validation-error paths can be
 * translated back to internal-doc indices when entries are stripped.
 */
function sanitizeOutput(node: unknown, path: string[], maps: Map<string, number[]>): void {
  if (isSeq(node)) {
    for (let i = 0; i < node.items.length; i++) {
      sanitizeOutput(node.items[i], [...path, String(i)], maps);
    }
    const origLen = node.items.length;
    const keep: number[] = [];
    for (let i = 0; i < origLen; i++) {
      const item = node.items[i];
      if (isScalar(item) && isEmptyValue(item)) continue;
      if (isMap(item) && (item.items.length === 0 || item.items.every((p) => isNullValue(p.value))))
        continue;
      keep.push(i);
    }
    if (keep.length < origLen) {
      maps.set(path.join('\0'), keep);
      for (let i = origLen - 1; i >= 0; i--) {
        if (!keep.includes(i)) node.items.splice(i, 1);
      }
    }
  } else if (isMap(node)) {
    for (const pair of node.items) {
      sanitizeOutput(pair.value, [...path, String(pair.key)], maps);
    }
  }
}

export function createYamlSync(getYaml: () => string, setYaml: (yaml: string) => void) {
  let doc: Document = parseDocument(getYaml() || '{}');
  let version = $state(0);

  // ── Undo/redo state ──────────────────────────────────────────────────────
  let lastFlushedYaml = getYaml() || '{}';
  let undoStack: string[] = [];
  let redoStack: string[] = [];
  let pendingCheckpoint: string | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let burstTimer: ReturnType<typeof setTimeout> | null = null;
  let flushTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Index remapping (output → internal) ────────────────────────────────
  // Populated by sanitizeOutput during flush(). Key = path segments joined
  // by '\0', value = keepIndices where keepIndices[outputIndex] = internalIndex.
  let seqIndexMaps = new Map<string, number[]>();

  /** Clone doc, sanitize output-only, serialize to YAML string. Internal doc is never mutated. */
  function flush() {
    if (flushTimer !== null) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    const out = doc.clone();
    const maps = new Map<string, number[]>();
    sanitizeOutput(out.contents, [], maps);
    seqIndexMaps = maps;
    const yaml = out.toString({ nullStr: '' });
    setYaml(yaml);
    lastFlushedYaml = yaml;
    version++;
  }

  /** Schedule a debounced flush for scalar edits (avoids clone+serialize on every keystroke). */
  function scheduleFlush() {
    if (flushTimer !== null) clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, FLUSH_DEBOUNCE_MS);
    // Bump version immediately so reactive reads see the updated AST
    version++;
  }

  /** Force any pending debounced flush to run now (call before undo/structural ops). */
  function flushNow() {
    if (flushTimer !== null) {
      clearTimeout(flushTimer);
      flushTimer = null;
      flush();
    }
  }

  // ── Undo/redo helpers ────────────────────────────────────────────────────

  /** Flush any pending debounced typing burst to the undo stack. */
  function commitPending() {
    flushNow();
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    if (burstTimer !== null) {
      clearTimeout(burstTimer);
      burstTimer = null;
    }
    if (pendingCheckpoint !== null && pendingCheckpoint !== lastFlushedYaml) {
      undoStack.push(pendingCheckpoint);
      if (undoStack.length > MAX_UNDO_STACK) undoStack.splice(0, undoStack.length - MAX_UNDO_STACK);
    }
    pendingCheckpoint = null;
  }

  /** Called before set() — debounced undo capture for typing bursts. */
  function beforeScalar() {
    redoStack.length = 0;
    if (pendingCheckpoint === null) {
      pendingCheckpoint = lastFlushedYaml;
      burstTimer = setTimeout(commitPending, UNDO_MAX_BURST_MS);
    }
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(commitPending, UNDO_IDLE_MS);
  }

  /** Called before structural ops — immediate undo capture. */
  function beforeStructural() {
    commitPending();
    redoStack.length = 0;
    if (undoStack[undoStack.length - 1] !== lastFlushedYaml) {
      undoStack.push(lastFlushedYaml);
      if (undoStack.length > MAX_UNDO_STACK) undoStack.splice(0, undoStack.length - MAX_UNDO_STACK);
    }
  }

  /** Apply a YAML snapshot (re-parse AST, update external state, trigger reactivity). */
  function restore(yaml: string) {
    doc = parseDocument(yaml);
    setYaml(yaml);
    lastFlushedYaml = yaml;
    version++;
  }

  /** Undo the last change. Returns true if something was undone. */
  function undo(): boolean {
    flushNow();
    if (pendingCheckpoint !== null) {
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      if (burstTimer !== null) {
        clearTimeout(burstTimer);
        burstTimer = null;
      }
      const checkpoint = pendingCheckpoint;
      pendingCheckpoint = null;
      if (checkpoint !== lastFlushedYaml) {
        redoStack.push(lastFlushedYaml);
        restore(checkpoint);
        return true;
      }
    }
    if (undoStack.length === 0) return false;
    const snapshot = undoStack.pop()!;
    redoStack.push(lastFlushedYaml);
    restore(snapshot);
    return true;
  }

  /** Redo the last undone change. Returns true if something was redone. */
  function redo(): boolean {
    if (redoStack.length === 0) return false;
    commitPending();
    const snapshot = redoStack.pop()!;
    undoStack.push(lastFlushedYaml);
    if (undoStack.length > MAX_UNDO_STACK) undoStack.splice(0, undoStack.length - MAX_UNDO_STACK);
    restore(snapshot);
    return true;
  }

  /** Re-parse from the current YAML string (call after switching from raw YAML editor). */
  function reload() {
    doc = parseDocument(getYaml() || '{}');
    undoStack.length = 0;
    redoStack.length = 0;
    pendingCheckpoint = null;
    if (flushTimer !== null) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    if (burstTimer !== null) {
      clearTimeout(burstTimer);
      burstTimer = null;
    }
    lastFlushedYaml = getYaml() || '{}';
    version++;
  }

  // ── Reads ─────────────────────────────────────────────────────────────────

  /** Get any value at path as a plain JS value. */
  function get(path: string[]): unknown {
    void version;
    const val = doc.getIn(path);
    if (isSeq(val) || isMap(val)) return (val as { toJSON(): unknown }).toJSON();
    return val;
  }

  /** Get the ordered keys of a map node at path. */
  function mapKeys(path: string[]): string[] {
    void version;
    const node = doc.getIn(path, true);
    if (isMap(node)) return node.items.map((p) => String(p.key));
    return [];
  }

  /** Get the item count of a sequence node at path. */
  function seqLength(path: string[]): number {
    void version;
    const node = doc.getIn(path, true);
    return isSeq(node) ? node.items.length : 0;
  }

  /** Get the first item of a sequence node at path (for entry-type detection). */
  function seqFirst(path: string[]): unknown {
    void version;
    const node = doc.getIn(path, true);
    if (!isSeq(node) || node.items.length === 0) return undefined;
    const first = node.items[0];
    if (first != null && typeof first === 'object' && 'toJSON' in first) {
      return (first as { toJSON(): unknown }).toJSON();
    }
    return first;
  }

  // ── Scalar writes ─────────────────────────────────────────────────────────

  /** Set any value at path and sync back to YAML. */
  function set(path: string[], value: unknown) {
    beforeScalar();
    doc.setIn(path, doc.createNode(value));
    scheduleFlush();
  }

  /** Delete the key/index at path and sync back to YAML. */
  function remove(path: string[]) {
    beforeStructural();
    doc.deleteIn(path);
    flush();
  }

  // ── Sequence structural ops (direct AST — no JS round-trip) ──────────────

  /** Add item to the sequence at path (creates the sequence if absent). */
  function seqAdd(path: string[], item: unknown = {}, atIndex?: number) {
    beforeStructural();
    const node = doc.getIn(path, true);
    if (isSeq(node)) {
      if (atIndex !== undefined && atIndex >= 0 && atIndex <= node.items.length) {
        node.items.splice(atIndex, 0, doc.createNode(item));
      } else {
        node.items.push(doc.createNode(item));
      }
    } else {
      doc.setIn(path, doc.createNode([item]));
    }
    flush();
  }

  /** Remove the item at index from the sequence at path. */
  function seqRemove(path: string[], index: number) {
    beforeStructural();
    const node = doc.getIn(path, true);
    if (isSeq(node) && index >= 0 && index < node.items.length) {
      node.items.splice(index, 1);
    }
    flush();
  }

  /** Move an item from fromIndex to toIndex within the sequence at path. */
  function seqMove(path: string[], from: number, to: number) {
    beforeStructural();
    const node = doc.getIn(path, true);
    if (!isSeq(node)) return;
    const { items } = node;
    if (from < 0 || to < 0 || from >= items.length || to >= items.length) return;
    const [item] = items.splice(from, 1);
    items.splice(to, 0, item);
    flush();
  }

  /** Swap two items in the sequence at path (O(1), no shifting). */
  function seqSwap(path: string[], a: number, b: number) {
    beforeStructural();
    const node = doc.getIn(path, true);
    if (!isSeq(node)) return;
    const { items } = node;
    if (a < 0 || b < 0 || a >= items.length || b >= items.length) return;
    [items[a], items[b]] = [items[b], items[a]];
    flush();
  }

  // ── Map structural ops (direct AST — no JS round-trip) ───────────────────

  /** Rename a map key at mapPath while preserving its position and value. */
  function mapRename(mapPath: string[], oldKey: string, newKey: string) {
    beforeStructural();
    const node = doc.getIn(mapPath, true);
    if (!isMap(node)) return;
    const pair = node.items.find((p) => String(p.key) === oldKey);
    if (!pair) return;
    pair.key = doc.createNode(newKey);
    flush();
  }

  /** Move a map key from fromIndex to toIndex within the map at mapPath. */
  function mapMove(mapPath: string[], from: number, to: number) {
    beforeStructural();
    const node = doc.getIn(mapPath, true);
    if (!isMap(node)) return;
    const { items } = node;
    if (from < 0 || to < 0 || from >= items.length || to >= items.length) return;
    const [pair] = items.splice(from, 1);
    items.splice(to, 0, pair);
    flush();
  }

  return {
    get,
    set,
    remove,
    mapKeys,
    seqLength,
    seqFirst,
    seqAdd,
    seqRemove,
    seqMove,
    seqSwap,
    mapRename,
    mapMove,
    reload,
    undo,
    redo,
    get canUndo() {
      void version;
      return pendingCheckpoint !== null || undoStack.length > 0;
    },
    get canRedo() {
      void version;
      return redoStack.length > 0;
    },
    commitPending,
    get lastFlushedYaml() {
      return lastFlushedYaml;
    },
    /** Translate a path with sanitized-output indices back to internal-doc indices. */
    remapOutputPath(path: string[]): string[] {
      const result = [...path];
      for (let i = 0; i < result.length; i++) {
        const idx = parseInt(result[i], 10);
        if (isNaN(idx)) continue;
        const key = result.slice(0, i).join('\0');
        const mapping = seqIndexMaps.get(key);
        if (mapping && idx >= 0 && idx < mapping.length) {
          result[i] = String(mapping[idx]);
        }
      }
      return result;
    }
  };
}

export type YamlSync = ReturnType<typeof createYamlSync>;

/** Wrap a YamlSync with a path prefix so components use relative paths. */
export function withPrefix(sync: YamlSync, prefix: string[]): YamlSync {
  return {
    get: (path) => sync.get([...prefix, ...path]),
    set: (path, value) => sync.set([...prefix, ...path], value),
    remove: (path) => sync.remove([...prefix, ...path]),
    mapKeys: (path) => sync.mapKeys([...prefix, ...path]),
    seqLength: (path) => sync.seqLength([...prefix, ...path]),
    seqFirst: (path) => sync.seqFirst([...prefix, ...path]),
    seqAdd: (path, item, atIndex) => sync.seqAdd([...prefix, ...path], item, atIndex),
    seqRemove: (path, index) => sync.seqRemove([...prefix, ...path], index),
    seqMove: (path, from, to) => sync.seqMove([...prefix, ...path], from, to),
    seqSwap: (path, a, b) => sync.seqSwap([...prefix, ...path], a, b),
    mapRename: (path, oldKey, newKey) => sync.mapRename([...prefix, ...path], oldKey, newKey),
    mapMove: (path, from, to) => sync.mapMove([...prefix, ...path], from, to),
    reload: () => sync.reload(),
    undo: () => sync.undo(),
    redo: () => sync.redo(),
    get canUndo() {
      return sync.canUndo;
    },
    get canRedo() {
      return sync.canRedo;
    },
    commitPending: () => sync.commitPending(),
    get lastFlushedYaml() {
      return sync.lastFlushedYaml;
    },
    remapOutputPath: (path) => {
      const remapped = sync.remapOutputPath([...prefix, ...path]);
      return remapped.slice(prefix.length);
    }
  };
}
