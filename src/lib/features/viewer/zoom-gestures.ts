import type { Action } from 'svelte/action';
import { tick } from 'svelte';
import { viewer } from './viewer-state.svelte';
import { almostEqual, clampZoom, normalizeWheelDelta } from './zoom-math';
import { ZOOM_STEP } from './zoom-config';

const WHEEL_SENSITIVITY = 0.0025;
const WHEEL_COMMIT_DELAY_MS = 90;
const DOUBLE_CLICK_ZOOM = 2;

interface WebKitGestureEvent extends Event {
  scale: number;
  clientX?: number;
  clientY?: number;
}

function cursorOffset(container: HTMLElement, clientX: number, clientY: number) {
  const rect = container.getBoundingClientRect();
  return { x: clientX - rect.left, y: clientY - rect.top };
}

function centerOffset(container: HTMLElement) {
  return { x: container.clientWidth / 2, y: container.clientHeight / 2 };
}

function getTouchDistance(t0: Touch, t1: Touch): number {
  const dx = t0.clientX - t1.clientX;
  const dy = t0.clientY - t1.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getTouchMidpoint(t0: Touch, t1: Touch) {
  return {
    x: (t0.clientX + t1.clientX) / 2,
    y: (t0.clientY + t1.clientY) / 2
  };
}

/**
 * Measure where a content coordinate sits in the scroll area after a layout change.
 * `contentFracX/Y` is the fractional position within [data-zoom-content].
 * Returns the absolute pixel position in the scroll coordinate system.
 */
function measureContentPosition(
  container: HTMLElement,
  contentFracX: number,
  contentFracY: number
): { x: number; y: number } {
  const content = container.querySelector<HTMLElement>('[data-zoom-content]');
  if (!content) return { x: 0, y: 0 };
  const contentRect = content.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  return {
    x:
      contentRect.left -
      containerRect.left +
      container.scrollLeft +
      contentFracX * contentRect.width,
    y: contentRect.top - containerRect.top + container.scrollTop + contentFracY * contentRect.height
  };
}

/**
 * Find the fractional content coordinate under a screen point,
 * accounting for the current CSS transform on the zoom layer.
 */
function contentFractionAtScreenPoint(
  container: HTMLElement,
  screenX: number,
  screenY: number
): { fracX: number; fracY: number } {
  const content = container.querySelector<HTMLElement>('[data-zoom-content]');
  if (!content) return { fracX: 0.5, fracY: 0 };
  const contentRect = content.getBoundingClientRect();
  // contentRect already reflects the CSS transform, so positions are visual
  return {
    fracX: (screenX - contentRect.left) / contentRect.width,
    fracY: (screenY - contentRect.top) / contentRect.height
  };
}

/**
 * Set scroll so that a content fraction appears at the given screen offset.
 */
function scrollToContentFraction(
  container: HTMLElement,
  fracX: number,
  fracY: number,
  screenOffsetX: number,
  screenOffsetY: number
) {
  const pos = measureContentPosition(container, fracX, fracY);
  container.scrollLeft = Math.max(
    0,
    Math.min(pos.x - screenOffsetX, container.scrollWidth - container.clientWidth)
  );
  container.scrollTop = Math.max(
    0,
    Math.min(pos.y - screenOffsetY, container.scrollHeight - container.clientHeight)
  );
}

/**
 * Zoom to a specific level anchored at a screen point, without gestures.
 * Used for double-click and zoom buttons.
 */
async function zoomToPoint(
  container: HTMLElement,
  anchorX: number,
  anchorY: number,
  newZoom: number
) {
  const clamped = clampZoom(newZoom);
  if (almostEqual(clamped, viewer.zoomFactor)) return;

  const containerRect = container.getBoundingClientRect();
  const screenX = containerRect.left + anchorX;
  const screenY = containerRect.top + anchorY;

  // Find what content fraction is under the anchor point (no transform active, scale=1, tx/ty=0)
  const { fracX, fracY } = contentFractionAtScreenPoint(container, screenX, screenY);

  viewer.setZoom(clamped);
  await tick();

  scrollToContentFraction(container, fracX, fracY, anchorX, anchorY);
}

export const zoomGestures: Action<HTMLElement> = (container) => {
  // --- Gesture session state ---
  let active = false;
  let committedZoom = 1;
  let scale = 1; // CSS transform scale (gestureZoom / committedZoom)
  let tx = 0; // CSS transform translateX
  let ty = 0; // CSS transform translateY

  // --- RAF / pending frame ---
  let rafId = 0;
  let pendingScale = 1;
  let pendingFocalX = 0;
  let pendingFocalY = 0;
  let hasPending = false;

  // --- Wheel commit timer ---
  let wheelTimer: ReturnType<typeof setTimeout> | null = null;

  // --- Touch state ---
  let initialTouchDist = 0;
  let initialTouchZoom = 1;

  // --- Safari gesture state ---
  let webkitGestureActive = false;
  let initialGestureZoom = 1;

  // --- Committed layer geometry (captured at gesture start) ---
  let committedLayerWidth = 0;
  let committedLayerHeight = 0;
  let committedLayoutX = 0;
  let committedLayoutY = 0;

  // --- Commit lock ---
  let commitPromise: Promise<void> | null = null;

  function getLayer(): HTMLElement | null {
    return container.querySelector<HTMLElement>('[data-zoom-layer]');
  }

  function currentTarget(): number {
    return hasPending ? clampZoom(pendingScale * committedZoom) : viewer.effectiveZoomFactor;
  }

  // --- Session lifecycle ---

  function beginSession() {
    if (active) return;
    active = true;
    committedZoom = viewer.zoomFactor;
    scale = 1;
    tx = 0;
    ty = 0;
    const layer = getLayer();
    committedLayerWidth = layer ? layer.offsetWidth : container.clientWidth;
    committedLayerHeight = layer ? layer.offsetHeight : container.clientHeight;
    committedLayoutX = layer ? layer.offsetLeft : 0;
    committedLayoutY = layer ? layer.offsetTop : 0;
    viewer.beginGestureZoom();
  }

  function applyFrame() {
    if (!hasPending) return;
    hasPending = false;

    const newScale = pendingScale;
    const fx = pendingFocalX;
    const fy = pendingFocalY;

    // Layer pixel under the cursor in current transformed space
    const lx = (container.scrollLeft + fx - tx) / scale;
    const ly = (container.scrollTop + fy - ty) / scale;

    // Translate so that layer pixel stays at the same screen position
    tx = container.scrollLeft + fx - newScale * lx;
    ty = container.scrollTop + fy - newScale * ly;
    scale = newScale;

    // Clamp transform to match committed-layout constraints exactly.
    // Visual left on screen = committedLayoutX + tx - scrollLeft
    // Visual top on screen  = committedLayoutY + ty - scrollTop
    const vw = container.clientWidth;
    const vh = container.clientHeight;
    const visualW = scale * committedLayerWidth;
    const visualH = scale * committedLayerHeight;
    const sl = container.scrollLeft;
    const st = container.scrollTop;

    if (visualW <= vw) {
      // Fits: force centering (matches mx-auto in committed layout)
      tx = sl + (vw - visualW) / 2 - committedLayoutX;
    } else {
      // Overflows: clamp so edges cover viewport (matches scroll bounds)
      const minTx = sl + vw - visualW - committedLayoutX;
      const maxTx = sl - committedLayoutX;
      tx = Math.max(minTx, Math.min(maxTx, tx));
    }

    if (visualH <= vh) {
      // Fits: pin to top (matches min-h-full top-alignment)
      ty = st - committedLayoutY;
    } else {
      // Overflows: clamp so edges cover viewport (matches scroll bounds)
      const minTy = st + vh - visualH - committedLayoutY;
      const maxTy = st - committedLayoutY;
      ty = Math.max(minTy, Math.min(maxTy, ty));
    }

    const layer = getLayer();
    if (layer) {
      layer.style.transformOrigin = '0 0';
      layer.style.willChange = 'transform';
      layer.style.transform = `matrix(${scale}, 0, 0, ${scale}, ${tx}, ${ty})`;
    }

    viewer.setGestureZoom(clampZoom(committedZoom * scale));
  }

  function queueFrame(targetZoom: number, focalX: number, focalY: number) {
    beginSession();
    pendingScale = clampZoom(targetZoom) / committedZoom;
    pendingFocalX = focalX;
    pendingFocalY = focalY;
    hasPending = true;
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      applyFrame();
    });
  }

  function clearTransform() {
    const layer = getLayer();
    if (layer) {
      layer.style.transform = '';
      layer.style.willChange = '';
    }
  }

  function cancelWheelCommit() {
    if (wheelTimer) {
      clearTimeout(wheelTimer);
      wheelTimer = null;
    }
  }

  function scheduleWheelCommit() {
    cancelWheelCommit();
    wheelTimer = setTimeout(() => void commitSession(), WHEEL_COMMIT_DELAY_MS);
  }

  function commitSession(): Promise<void> {
    if (commitPromise) return commitPromise;
    commitPromise = doCommit().finally(() => {
      commitPromise = null;
    });
    return commitPromise;
  }

  async function doCommit() {
    cancelWheelCommit();
    if (!active) return;

    // Flush any pending frame
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    applyFrame();

    const gestureZoom = clampZoom(committedZoom * scale);
    if (almostEqual(gestureZoom, committedZoom)) {
      viewer.cancelGestureZoom();
      clearTransform();
      active = false;
      scale = 1;
      tx = 0;
      ty = 0;
      return;
    }

    // Find the content fraction at the viewport center using the current visual state
    const cx = container.clientWidth / 2;
    const cy = container.clientHeight / 2;
    const containerRect = container.getBoundingClientRect();
    const { fracX, fracY } = contentFractionAtScreenPoint(
      container,
      containerRect.left + cx,
      containerRect.top + cy
    );

    // Commit: remove transform, apply new zoom to DOM
    viewer.commitGestureZoom();
    clearTransform();
    await tick();

    // Scroll so the same content fraction is at viewport center
    scrollToContentFraction(container, fracX, fracY, cx, cy);

    active = false;
    scale = 1;
    tx = 0;
    ty = 0;
  }

  // --- Event handlers ---

  function onWheel(e: WheelEvent) {
    if (webkitGestureActive) return;
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();

    const { x, y } = cursorOffset(container, e.clientX, e.clientY);
    const rawDelta = normalizeWheelDelta(e.deltaY, e.deltaMode);
    // Chrome/Firefox synthesize small-delta wheel events for trackpad pinch
    const isPinch = e.ctrlKey && e.deltaMode === 0 && Math.abs(rawDelta) < 30;
    const delta = isPinch ? rawDelta * 4 : rawDelta;
    const targetZoom = currentTarget() * Math.exp(-delta * WHEEL_SENSITIVITY);

    queueFrame(targetZoom, x, y);
    scheduleWheelCommit();
  }

  function onTouchStart(e: TouchEvent) {
    if (e.touches.length !== 2) return;
    initialTouchDist = getTouchDistance(e.touches[0], e.touches[1]);
    initialTouchZoom = currentTarget();
    beginSession();
  }

  function onTouchMove(e: TouchEvent) {
    if (e.touches.length !== 2 || initialTouchDist === 0) return;
    e.preventDefault();
    const dist = getTouchDistance(e.touches[0], e.touches[1]);
    if (!dist) return;
    const mid = getTouchMidpoint(e.touches[0], e.touches[1]);
    const { x, y } = cursorOffset(container, mid.x, mid.y);
    queueFrame(initialTouchZoom * (dist / initialTouchDist), x, y);
  }

  function onTouchEnd(e: TouchEvent) {
    if (e.touches.length >= 2 || initialTouchDist === 0) return;
    initialTouchDist = 0;
    void commitSession();
  }

  function onGestureStart(event: Event) {
    const e = event as WebKitGestureEvent;
    e.preventDefault();
    webkitGestureActive = true;
    initialGestureZoom = currentTarget();
    const offset =
      typeof e.clientX === 'number' && typeof e.clientY === 'number'
        ? cursorOffset(container, e.clientX, e.clientY)
        : centerOffset(container);
    queueFrame(initialGestureZoom, offset.x, offset.y);
  }

  function onGestureChange(event: Event) {
    if (!webkitGestureActive) return;
    const e = event as WebKitGestureEvent;
    e.preventDefault();
    const offset =
      typeof e.clientX === 'number' && typeof e.clientY === 'number'
        ? cursorOffset(container, e.clientX, e.clientY)
        : centerOffset(container);
    const s = Number.isFinite(e.scale) ? e.scale : 1;
    queueFrame(initialGestureZoom * s, offset.x, offset.y);
  }

  function onGestureEnd(event: Event) {
    if (!webkitGestureActive) return;
    event.preventDefault();
    webkitGestureActive = false;
    void commitSession();
  }

  function onClick(e: MouseEvent) {
    // Use click with detail check instead of dblclick. Browsers increment
    // the click count (3, 4, 5…) for rapid clicks without mouse movement,
    // so dblclick only fires once. Every even detail (2, 4, 6…) is a
    // double-click intent.
    if (e.detail < 2 || e.detail % 2 !== 0) return;
    const { x, y } = cursorOffset(container, e.clientX, e.clientY);
    const target = almostEqual(viewer.effectiveZoomFactor, 1) ? DOUBLE_CLICK_ZOOM : 1;
    void commitSession().then(() => zoomToPoint(container, x, y, target));
  }

  function onKeydown(e: KeyboardEvent) {
    if (!e.metaKey && !e.ctrlKey) return;
    const center = centerOffset(container);
    if (e.key === '=' || e.key === '+') {
      e.preventDefault();
      void zoomToPoint(container, center.x, center.y, viewer.effectiveZoomFactor + ZOOM_STEP);
    } else if (e.key === '-') {
      e.preventDefault();
      void zoomToPoint(container, center.x, center.y, viewer.effectiveZoomFactor - ZOOM_STEP);
    } else if (e.key === '0') {
      e.preventDefault();
      void zoomToPoint(container, center.x, center.y, 1);
    }
  }

  // --- Attach listeners ---

  // Make container focusable so it receives keyboard events
  if (!container.hasAttribute('tabindex')) {
    container.setAttribute('tabindex', '-1');
  }

  container.addEventListener('wheel', onWheel, { passive: false });
  container.addEventListener('touchstart', onTouchStart, { passive: true });
  container.addEventListener('touchmove', onTouchMove, { passive: false });
  container.addEventListener('touchend', onTouchEnd, { passive: true });
  container.addEventListener('touchcancel', onTouchEnd, { passive: true });
  container.addEventListener('gesturestart', onGestureStart, { passive: false });
  container.addEventListener('gesturechange', onGestureChange, { passive: false });
  container.addEventListener('gestureend', onGestureEnd, { passive: false });
  container.addEventListener('click', onClick);
  container.addEventListener('keydown', onKeydown);

  return {
    destroy() {
      cancelWheelCommit();
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      hasPending = false;
      viewer.cancelGestureZoom();
      clearTransform();
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', onTouchEnd);
      container.removeEventListener('gesturestart', onGestureStart);
      container.removeEventListener('gesturechange', onGestureChange);
      container.removeEventListener('gestureend', onGestureEnd);
      container.removeEventListener('click', onClick);
      container.removeEventListener('keydown', onKeydown);
    }
  };
};
