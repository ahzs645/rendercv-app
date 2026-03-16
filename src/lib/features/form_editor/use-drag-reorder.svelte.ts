import { tick } from 'svelte';

/**
 * Reusable pointer-based drag-and-drop with FLIP animations.
 *
 * Extracted from EntryListRenderer so the same smooth drag behaviour
 * can be shared by entry lists, section text entries, and string-list
 * fields (highlights, authors, …).
 */

export interface DragItem {
  id: number;
}

interface DragState {
  entryId: number;
  originalIndex: number;
  targetIndex: number;
  pointerId: number;
  startY: number;
  currentY: number;
  itemHeight: number;
  itemRects: { top: number; height: number; midY: number }[];
  initialScrollTop: number;
  scrollContainerEl: HTMLElement | null;
}

interface PendingDrag {
  index: number;
  pointerId: number;
  startX: number;
  startY: number;
}

export interface UseDragReorderOptions {
  /** Reactive getter for the current items array (must have stable `id` fields) */
  getItems: () => DragItem[];
  /** Reactive getter for the list container DOM element */
  getListEl: () => HTMLElement | undefined;
  /** Reactive getter for disabled state */
  isDisabled?: () => boolean;
  /**
   * Called when a drag-drop finishes. The parent MUST synchronously
   * reorder its items array and sync any backend (YAML, etc.).
   */
  onReorder: (fromIndex: number, toIndex: number) => void;
  /**
   * Called when move-up/move-down buttons trigger an animated swap.
   * The parent MUST synchronously swap the two items and sync backend.
   */
  onSwap: (indexA: number, indexB: number) => void;
}

const DRAG_THRESHOLD = 3;

export function useDragReorder(opts: UseDragReorderOptions) {
  let _dragState = $state<DragState | null>(null);
  let _pendingDrag = $state<PendingDrag | null>(null);
  let scrollRAF: number | null = null;

  // ── Helpers ──────────────────────────────────────────────────────────

  function findScrollContainer(el: HTMLElement): HTMLElement | null {
    let current = el.parentElement;
    while (current) {
      const style = getComputedStyle(current);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  function calculateTargetIndex(): number {
    if (!_dragState) return 0;
    const { itemRects, originalIndex, startY, currentY } = _dragState;

    // Dragged item's current edges (scroll cancels out — both sides shift equally)
    const pointerDelta = currentY - startY;
    const draggedTop = itemRects[originalIndex].top + pointerDelta;
    const draggedBottom = draggedTop + itemRects[originalIndex].height;

    let target = originalIndex;

    // Scan forward: bottom edge of dragged item crosses neighbor's midpoint
    for (let i = originalIndex + 1; i < itemRects.length; i++) {
      if (draggedBottom > itemRects[i].midY) target = i;
      else break;
    }

    // Scan backward: top edge of dragged item crosses neighbor's midpoint
    if (target === originalIndex) {
      for (let i = originalIndex - 1; i >= 0; i--) {
        if (draggedTop < itemRects[i].midY) target = i;
        else break;
      }
    }

    return target;
  }

  // ── Auto-scroll near container edges ─────────────────────────────────

  function autoScroll(clientY: number) {
    if (!_dragState?.scrollContainerEl) return;
    const container = _dragState.scrollContainerEl;
    const rect = container.getBoundingClientRect();
    const edgeSize = 40;
    const maxSpeed = 8;

    let speed = 0;
    if (clientY < rect.top + edgeSize) {
      speed = -maxSpeed * ((rect.top + edgeSize - clientY) / edgeSize);
    } else if (clientY > rect.bottom - edgeSize) {
      speed = maxSpeed * ((clientY - (rect.bottom - edgeSize)) / edgeSize);
    }

    if (scrollRAF) cancelAnimationFrame(scrollRAF);
    if (speed !== 0) {
      function scrollStep() {
        if (!_dragState?.scrollContainerEl) return;
        _dragState.scrollContainerEl.scrollTop += speed;
        scrollRAF = requestAnimationFrame(scrollStep);
      }
      scrollRAF = requestAnimationFrame(scrollStep);
    }
  }

  // ── Window-level pointer handlers ────────────────────────────────────

  function addWindowListeners() {
    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointercancel', handleWindowPointerUp);
  }

  function removeWindowListeners() {
    window.removeEventListener('pointermove', handleWindowPointerMove);
    window.removeEventListener('pointerup', handleWindowPointerUp);
    window.removeEventListener('pointercancel', handleWindowPointerUp);
  }

  function handleWindowPointerMove(e: PointerEvent) {
    if (_pendingDrag && !_dragState) {
      if (e.pointerId !== _pendingDrag.pointerId) return;
      const dx = e.clientX - _pendingDrag.startX;
      const dy = e.clientY - _pendingDrag.startY;
      if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
      activateDrag(_pendingDrag.index, e);
      _pendingDrag = null;
      return;
    }
    if (!_dragState || e.pointerId !== _dragState.pointerId) return;
    _dragState.currentY = e.clientY;
    _dragState.targetIndex = calculateTargetIndex();
    autoScroll(e.clientY);
  }

  function handleWindowPointerUp(e: PointerEvent) {
    if (_pendingDrag && e.pointerId === _pendingDrag.pointerId) {
      _pendingDrag = null;
      removeWindowListeners();
      return;
    }
    if (!_dragState || e.pointerId !== _dragState.pointerId) return;
    finishDrag();
  }

  // ── Drag activation ──────────────────────────────────────────────────

  function activateDrag(index: number, e: PointerEvent) {
    const listEl = opts.getListEl();
    if (!listEl) return;

    document.body.style.userSelect = 'none';
    const domItems = listEl.querySelectorAll(':scope > [role="listitem"]');
    const rects: { top: number; height: number; midY: number }[] = [];
    domItems.forEach((el) => {
      const r = (el as HTMLElement).getBoundingClientRect();
      rects.push({ top: r.top, height: r.height, midY: r.top + r.height / 2 });
    });
    const items = opts.getItems();
    const scrollContainer = findScrollContainer(listEl);
    _dragState = {
      entryId: items[index].id,
      originalIndex: index,
      targetIndex: index,
      pointerId: e.pointerId,
      startY: e.clientY,
      currentY: e.clientY,
      itemHeight: rects[index]?.height ?? 0,
      itemRects: rects,
      initialScrollTop: scrollContainer?.scrollTop ?? 0,
      scrollContainerEl: scrollContainer
    };
  }

  // ── Finish drag: FLIP animate then commit ────────────────────────────

  async function finishDrag() {
    if (!_dragState) return;
    const { originalIndex, targetIndex, entryId } = _dragState;

    if (scrollRAF) {
      cancelAnimationFrame(scrollRAF);
      scrollRAF = null;
    }
    document.body.style.userSelect = '';
    removeWindowListeners();

    // 1. Capture current visual positions (with drag transforms applied)
    const listEl = opts.getListEl();
    if (!listEl) {
      _dragState = null;
      return;
    }

    const items = opts.getItems();
    const domItems = listEl.querySelectorAll(':scope > [role="listitem"]');
    const oldRects = new Map<number, DOMRect>();
    items.forEach((item, i) => {
      const el = domItems[i];
      if (el) oldRects.set(item.id, el.getBoundingClientRect());
    });

    // 2. Clear drag state + commit reorder (parent updates items + backend)
    _dragState = null;
    if (targetIndex !== originalIndex) {
      opts.onReorder(originalIndex, targetIndex);
    }

    // 3. Wait for Svelte re-render
    await tick();

    // 4. FLIP animate all items
    const newItems = opts.getItems();
    const newDomItems = listEl.querySelectorAll(':scope > [role="listitem"]');
    newItems.forEach((item, i) => {
      const el = newDomItems[i] as HTMLElement;
      if (!el) return;
      const oldRect = oldRects.get(item.id);
      if (!oldRect) return;
      const newRect = el.getBoundingClientRect();
      const deltaY = oldRect.top - newRect.top;
      if (Math.abs(deltaY) < 1) return;

      const isDragged = item.id === entryId;
      el.animate(
        [
          {
            transform: `translateY(${deltaY}px)${isDragged ? ' scale(1.02)' : ''}`,
            ...(isDragged ? { boxShadow: '0 8px 25px rgba(0,0,0,0.15)' } : {})
          },
          {
            transform: 'none',
            ...(isDragged ? { boxShadow: 'none' } : {})
          }
        ],
        { duration: 200, easing: 'ease-out' }
      );
    });
  }

  // ── Animated swap (for move-up / move-down buttons) ──────────────────

  async function animatedSwap(indexA: number, indexB: number) {
    const listEl = opts.getListEl();
    if (!listEl) return;

    const items = opts.getItems();
    const domItems = listEl.querySelectorAll(':scope > [role="listitem"]');
    const oldRects = new Map<number, DOMRect>();
    items.forEach((item, i) => {
      const el = domItems[i];
      if (el) oldRects.set(item.id, el.getBoundingClientRect());
    });

    opts.onSwap(indexA, indexB);
    await tick();

    const newItems = opts.getItems();
    const newDomItems = listEl.querySelectorAll(':scope > [role="listitem"]');
    newItems.forEach((item, i) => {
      const el = newDomItems[i] as HTMLElement;
      if (!el) return;
      const oldRect = oldRects.get(item.id);
      if (!oldRect) return;
      const newRect = el.getBoundingClientRect();
      const deltaY = oldRect.top - newRect.top;
      if (Math.abs(deltaY) < 1) return;
      el.animate([{ transform: `translateY(${deltaY}px)` }, { transform: 'none' }], {
        duration: 200,
        easing: 'ease-out'
      });
    });
  }

  // ── Public API ───────────────────────────────────────────────────────

  function getDragTransform(itemId: number, index: number): string | undefined {
    if (!_dragState) return undefined;
    const {
      entryId: draggedId,
      originalIndex,
      targetIndex,
      startY,
      currentY,
      itemHeight
    } = _dragState;

    if (itemId === draggedId) {
      return `translateY(${currentY - startY}px) scale(1.02)`;
    }

    if (originalIndex < targetIndex) {
      if (index > originalIndex && index <= targetIndex) return `translateY(${-itemHeight}px)`;
    } else if (originalIndex > targetIndex) {
      if (index >= targetIndex && index < originalIndex) return `translateY(${itemHeight}px)`;
    }

    return undefined;
  }

  function handleGripPointerDown(index: number, e: PointerEvent) {
    if (opts.isDisabled?.() || e.button !== 0 || _dragState) return;
    e.preventDefault();
    _pendingDrag = {
      index,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY
    };
    addWindowListeners();
  }

  function moveUp(index: number) {
    if (index <= 0) return;
    animatedSwap(index, index - 1);
  }

  function moveDown(index: number) {
    const items = opts.getItems();
    if (index >= items.length - 1) return;
    animatedSwap(index, index + 1);
  }

  // ── Cleanup ──────────────────────────────────────────────────────────

  $effect(() => {
    return () => {
      if (scrollRAF) cancelAnimationFrame(scrollRAF);
      removeWindowListeners();
      document.body.style.userSelect = '';
    };
  });

  return {
    get dragState() {
      return _dragState;
    },
    getDragTransform,
    handleGripPointerDown,
    moveUp,
    moveDown
  };
}
