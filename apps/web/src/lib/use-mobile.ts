import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 768;

/**
 * A landscape phone reports a desktop-ish width (a 390x844 handset is 844px
 * wide on its side) but has nowhere near the height the split editor/preview
 * layout needs. Treat a short viewport as mobile too, bounded by a width that
 * can only be a handset or a small tablet — so a genuinely wide desktop window
 * that happens to be short keeps the desktop layout.
 */
const MOBILE_MAX_HEIGHT = 520;
const SHORT_VIEWPORT_MAX_WIDTH = 1024;

function mediaQueryFor(breakpoint: number) {
  const narrow = `(max-width: ${breakpoint - 1}px)`;
  if (breakpoint !== MOBILE_BREAKPOINT) {
    return narrow;
  }
  return `${narrow}, (max-height: ${MOBILE_MAX_HEIGHT}px) and (max-width: ${SHORT_VIEWPORT_MAX_WIDTH}px)`;
}

export function useIsMobile(breakpoint = MOBILE_BREAKPOINT) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(mediaQueryFor(breakpoint)).matches : false
  );

  useEffect(() => {
    const query = window.matchMedia(mediaQueryFor(breakpoint));
    const handler = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsMobile(e.matches);
    handler(query);
    query.addEventListener('change', handler);
    return () => query.removeEventListener('change', handler);
  }, [breakpoint]);

  return isMobile;
}
