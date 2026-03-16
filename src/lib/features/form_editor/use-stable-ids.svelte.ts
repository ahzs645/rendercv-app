/**
 * Manages stable numeric IDs for keyed {#each} blocks.
 *
 * IDs are for DOM keying only — data lives elsewhere (props, YAML sync, etc.).
 * Shared by StringListInput (string[] arrays) and EntryListRenderer (YAML
 * sequence entries) so animation and drag-reorder logic stays DRY.
 *
 * Compatible with useDragReorder's DragItem interface ({ id: number }).
 */

export interface StableItem {
  id: number;
}

export function useStableIds() {
  let nextId = 0;
  let items = $state<StableItem[]>([]);

  /** Reconcile to match a new count. Preserves existing IDs; adds/truncates at the end. */
  function reconcile(newCount: number) {
    if (newCount === items.length) return;
    if (newCount > items.length) {
      const next = [...items];
      for (let i = items.length; i < newCount; i++) next.push({ id: nextId++ });
      items = next;
    } else {
      items = items.slice(0, newCount);
    }
  }

  /** Add one item. Returns the new StableItem. */
  function add(atIndex?: number): StableItem {
    const entry = { id: nextId++ };
    if (atIndex !== undefined && atIndex >= 0 && atIndex <= items.length) {
      items = [...items.slice(0, atIndex), entry, ...items.slice(atIndex)];
    } else {
      items = [...items, entry];
    }
    return entry;
  }

  /** Remove item at index. */
  function removeAt(index: number) {
    items = items.filter((_, i) => i !== index);
  }

  /** Reorder: move item from `from` to `to`. */
  function reorder(from: number, to: number) {
    const arr = [...items];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    items = arr;
  }

  /** Swap two items by index. */
  function swap(a: number, b: number) {
    const arr = [...items];
    [arr[a], arr[b]] = [arr[b], arr[a]];
    items = arr;
  }

  return {
    get items() {
      return items;
    },
    get length() {
      return items.length;
    },
    reconcile,
    add,
    removeAt,
    reorder,
    swap
  };
}
