import { ZOOM_STEP } from './zoom-config';
import { almostEqual, clampZoom, normalizeWheelDelta } from './zoom-math';

const WHEEL_SENSITIVITY = 0.0025;
const WHEEL_COMMIT_DELAY_MS = 90;
const DOUBLE_CLICK_ZOOM = 2;

interface WebKitGestureEvent extends Event {
  scale: number;
  clientX?: number;
  clientY?: number;
}

interface ZoomGestureController {
  getZoom: () => number;
  setZoom: (zoom: number) => void;
}

function cursorOffset(container: HTMLElement, clientX: number, clientY: number) {
  const rect = container.getBoundingClientRect();
  return { x: clientX - rect.left, y: clientY - rect.top };
}

function centerOffset(container: HTMLElement) {
  return { x: container.clientWidth / 2, y: container.clientHeight / 2 };
}

function getTouchDistance(first: Touch, second: Touch): number {
  const dx = first.clientX - second.clientX;
  const dy = first.clientY - second.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getTouchMidpoint(first: Touch, second: Touch) {
  return {
    x: (first.clientX + second.clientX) / 2,
    y: (first.clientY + second.clientY) / 2
  };
}

function measureContentPosition(container: HTMLElement, contentFracX: number, contentFracY: number) {
  const content = container.querySelector<HTMLElement>('[data-zoom-content]');
  if (!content) return { x: 0, y: 0 };
  const contentRect = content.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  return {
    x: contentRect.left - containerRect.left + container.scrollLeft + contentFracX * contentRect.width,
    y: contentRect.top - containerRect.top + container.scrollTop + contentFracY * contentRect.height
  };
}

function contentFractionAtScreenPoint(container: HTMLElement, screenX: number, screenY: number) {
  const content = container.querySelector<HTMLElement>('[data-zoom-content]');
  if (!content) return { fracX: 0.5, fracY: 0 };
  const contentRect = content.getBoundingClientRect();
  return {
    fracX: (screenX - contentRect.left) / contentRect.width,
    fracY: (screenY - contentRect.top) / contentRect.height
  };
}

function scrollToContentFraction(
  container: HTMLElement,
  fracX: number,
  fracY: number,
  screenOffsetX: number,
  screenOffsetY: number
) {
  const position = measureContentPosition(container, fracX, fracY);
  container.scrollLeft = Math.max(
    0,
    Math.min(position.x - screenOffsetX, container.scrollWidth - container.clientWidth)
  );
  container.scrollTop = Math.max(
    0,
    Math.min(position.y - screenOffsetY, container.scrollHeight - container.clientHeight)
  );
}

function nextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

async function zoomToPoint(
  container: HTMLElement,
  controller: ZoomGestureController,
  anchorX: number,
  anchorY: number,
  newZoom: number
) {
  const clamped = clampZoom(newZoom);
  if (almostEqual(clamped, controller.getZoom())) return;

  const containerRect = container.getBoundingClientRect();
  const screenX = containerRect.left + anchorX;
  const screenY = containerRect.top + anchorY;
  const { fracX, fracY } = contentFractionAtScreenPoint(container, screenX, screenY);

  controller.setZoom(clamped);
  await nextFrame();

  scrollToContentFraction(container, fracX, fracY, anchorX, anchorY);
}

export function attachZoomGestures(container: HTMLElement, controller: ZoomGestureController) {
  let active = false;
  let committedZoom = 1;
  let scale = 1;
  let tx = 0;
  let ty = 0;
  let rafId = 0;
  let pendingScale = 1;
  let pendingFocalX = 0;
  let pendingFocalY = 0;
  let hasPending = false;
  let wheelTimer: ReturnType<typeof setTimeout> | null = null;
  let initialTouchDist = 0;
  let initialTouchZoom = 1;
  let webkitGestureActive = false;
  let initialGestureZoom = 1;
  let committedLayerWidth = 0;
  let committedLayerHeight = 0;
  let committedLayoutX = 0;
  let committedLayoutY = 0;
  let commitPromise: Promise<void> | null = null;

  function getLayer(): HTMLElement | null {
    return container.querySelector<HTMLElement>('[data-zoom-layer]');
  }

  function currentTarget(): number {
    return hasPending ? clampZoom(pendingScale * committedZoom) : controller.getZoom();
  }

  function beginSession() {
    if (active) return;
    active = true;
    committedZoom = controller.getZoom();
    scale = 1;
    tx = 0;
    ty = 0;
    const layer = getLayer();
    committedLayerWidth = layer ? layer.offsetWidth : container.clientWidth;
    committedLayerHeight = layer ? layer.offsetHeight : container.clientHeight;
    committedLayoutX = layer ? layer.offsetLeft : 0;
    committedLayoutY = layer ? layer.offsetTop : 0;
  }

  function applyFrame() {
    if (!hasPending) return;
    hasPending = false;

    const newScale = pendingScale;
    const focalX = pendingFocalX;
    const focalY = pendingFocalY;
    const layerX = (container.scrollLeft + focalX - tx) / scale;
    const layerY = (container.scrollTop + focalY - ty) / scale;

    tx = container.scrollLeft + focalX - newScale * layerX;
    ty = container.scrollTop + focalY - newScale * layerY;
    scale = newScale;

    const viewportWidth = container.clientWidth;
    const viewportHeight = container.clientHeight;
    const visualWidth = scale * committedLayerWidth;
    const visualHeight = scale * committedLayerHeight;
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;

    if (visualWidth <= viewportWidth) {
      tx = scrollLeft + (viewportWidth - visualWidth) / 2 - committedLayoutX;
    } else {
      const minTx = scrollLeft + viewportWidth - visualWidth - committedLayoutX;
      const maxTx = scrollLeft - committedLayoutX;
      tx = Math.max(minTx, Math.min(maxTx, tx));
    }

    if (visualHeight <= viewportHeight) {
      ty = scrollTop - committedLayoutY;
    } else {
      const minTy = scrollTop + viewportHeight - visualHeight - committedLayoutY;
      const maxTy = scrollTop - committedLayoutY;
      ty = Math.max(minTy, Math.min(maxTy, ty));
    }

    const layer = getLayer();
    if (layer) {
      layer.style.transformOrigin = '0 0';
      layer.style.willChange = 'transform';
      layer.style.transform = `matrix(${scale}, 0, 0, ${scale}, ${tx}, ${ty})`;
    }
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

    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    applyFrame();

    const gestureZoom = clampZoom(committedZoom * scale);
    if (almostEqual(gestureZoom, committedZoom)) {
      clearTransform();
      active = false;
      scale = 1;
      tx = 0;
      ty = 0;
      return;
    }

    const centerX = container.clientWidth / 2;
    const centerY = container.clientHeight / 2;
    const containerRect = container.getBoundingClientRect();
    const { fracX, fracY } = contentFractionAtScreenPoint(
      container,
      containerRect.left + centerX,
      containerRect.top + centerY
    );

    controller.setZoom(gestureZoom);
    clearTransform();
    await nextFrame();
    scrollToContentFraction(container, fracX, fracY, centerX, centerY);

    active = false;
    scale = 1;
    tx = 0;
    ty = 0;
  }

  function onWheel(event: WheelEvent) {
    if (webkitGestureActive) return;
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();

    const { x, y } = cursorOffset(container, event.clientX, event.clientY);
    const rawDelta = normalizeWheelDelta(event.deltaY, event.deltaMode);
    const isPinch = event.ctrlKey && event.deltaMode === 0 && Math.abs(rawDelta) < 30;
    const delta = isPinch ? rawDelta * 4 : rawDelta;
    const targetZoom = currentTarget() * Math.exp(-delta * WHEEL_SENSITIVITY);

    queueFrame(targetZoom, x, y);
    scheduleWheelCommit();
  }

  function onTouchStart(event: TouchEvent) {
    if (event.touches.length !== 2) return;
    initialTouchDist = getTouchDistance(event.touches[0]!, event.touches[1]!);
    initialTouchZoom = currentTarget();
    beginSession();
  }

  function onTouchMove(event: TouchEvent) {
    if (event.touches.length !== 2 || initialTouchDist === 0) return;
    event.preventDefault();
    const distance = getTouchDistance(event.touches[0]!, event.touches[1]!);
    if (!distance) return;
    const midpoint = getTouchMidpoint(event.touches[0]!, event.touches[1]!);
    const { x, y } = cursorOffset(container, midpoint.x, midpoint.y);
    queueFrame(initialTouchZoom * (distance / initialTouchDist), x, y);
  }

  function onTouchEnd(event: TouchEvent) {
    if (event.touches.length >= 2 || initialTouchDist === 0) return;
    initialTouchDist = 0;
    void commitSession();
  }

  function onGestureStart(event: Event) {
    const gestureEvent = event as WebKitGestureEvent;
    gestureEvent.preventDefault();
    webkitGestureActive = true;
    initialGestureZoom = currentTarget();
    const offset =
      typeof gestureEvent.clientX === 'number' && typeof gestureEvent.clientY === 'number'
        ? cursorOffset(container, gestureEvent.clientX, gestureEvent.clientY)
        : centerOffset(container);
    queueFrame(initialGestureZoom, offset.x, offset.y);
  }

  function onGestureChange(event: Event) {
    if (!webkitGestureActive) return;
    const gestureEvent = event as WebKitGestureEvent;
    gestureEvent.preventDefault();
    const offset =
      typeof gestureEvent.clientX === 'number' && typeof gestureEvent.clientY === 'number'
        ? cursorOffset(container, gestureEvent.clientX, gestureEvent.clientY)
        : centerOffset(container);
    const nextScale = Number.isFinite(gestureEvent.scale) ? gestureEvent.scale : 1;
    queueFrame(initialGestureZoom * nextScale, offset.x, offset.y);
  }

  function onGestureEnd(event: Event) {
    if (!webkitGestureActive) return;
    event.preventDefault();
    webkitGestureActive = false;
    void commitSession();
  }

  function onClick(event: MouseEvent) {
    if (event.detail < 2 || event.detail % 2 !== 0) return;
    const { x, y } = cursorOffset(container, event.clientX, event.clientY);
    const target = almostEqual(controller.getZoom(), 1) ? DOUBLE_CLICK_ZOOM : 1;
    void commitSession().then(() => zoomToPoint(container, controller, x, y, target));
  }

  function onKeydown(event: KeyboardEvent) {
    if (!event.metaKey && !event.ctrlKey) return;
    const center = centerOffset(container);
    if (event.key === '=' || event.key === '+') {
      event.preventDefault();
      void zoomToPoint(container, controller, center.x, center.y, controller.getZoom() + ZOOM_STEP);
    } else if (event.key === '-') {
      event.preventDefault();
      void zoomToPoint(container, controller, center.x, center.y, controller.getZoom() - ZOOM_STEP);
    } else if (event.key === '0') {
      event.preventDefault();
      void zoomToPoint(container, controller, center.x, center.y, 1);
    }
  }

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

  return () => {
    cancelWheelCommit();
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    hasPending = false;
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
  };
}
