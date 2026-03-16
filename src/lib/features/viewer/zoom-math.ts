import { MAX_ZOOM, MIN_ZOOM } from './zoom-config';

const LINE_DELTA_PX = 16;
const PAGE_DELTA_PX = 800;
const ZOOM_EPSILON = 1e-4;
const DOM_DELTA_LINE = 1;
const DOM_DELTA_PAGE = 2;

export function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

export function almostEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < ZOOM_EPSILON;
}

export function normalizeWheelDelta(deltaY: number, deltaMode: number): number {
  if (deltaMode === DOM_DELTA_LINE) return deltaY * LINE_DELTA_PX;
  if (deltaMode === DOM_DELTA_PAGE) return deltaY * PAGE_DELTA_PX;
  return deltaY;
}
