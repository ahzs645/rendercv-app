import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CSSProperties, ReactNode, RefObject } from 'react';

/** Gap between the anchor and the menu, matching the `mt-1` these menus used to carry. */
const ANCHOR_GAP = 4;
/** Keep the menu this far from the viewport edges. */
const VIEWPORT_PADDING = 8;
/** Never shrink the menu below this, even in a cramped viewport — it can scroll instead. */
const MIN_HEIGHT = 120;

type Align = 'start' | 'end';

/**
 * A dropdown that positions itself against an anchor element but renders into
 * `document.body`.
 *
 * The absolutely-positioned menus this replaces were clipped by any scrolling or
 * hidden-overflow ancestor: the workspace toolbar sets `overflow-x-auto`, and per
 * the CSS overflow spec an axis set to anything other than `visible` forces the
 * other axis to compute to `auto` as well — so the toolbar clipped its own
 * dropdowns vertically and `z-index` could not help. Portalling out of the
 * ancestor chain sidesteps the whole class of bug, the same way `StyledTooltip`
 * already does for toolbar tooltips.
 */
export function PositionedMenu({
  align = 'end',
  anchorRef,
  children,
  className = '',
  matchAnchorWidth = false,
  maxHeight,
  onClose,
  open,
  role = 'menu',
  triggerRef
}: {
  /** Which anchor edge the menu lines up with. */
  align?: Align;
  /** Element the menu is positioned against. */
  anchorRef: RefObject<HTMLElement | null>;
  children: ReactNode;
  /** Appearance only — positioning and overflow are owned by this component. */
  className?: string;
  /** Stretch the menu to the anchor's width (for full-width combo buttons). */
  matchAnchorWidth?: boolean;
  /** Optional cap, in px, on top of the space actually available. */
  maxHeight?: number;
  onClose: () => void;
  open: boolean;
  /** `none` for popovers that are not menus, such as the date picker. */
  role?: 'menu' | 'dialog' | 'none';
  /**
   * Element whose clicks toggle the menu, exempted from close-on-outside-click so
   * the toggle doesn't immediately reopen. Defaults to `anchorRef`; pass it
   * separately when the anchor is a wrapper wider than the trigger itself.
   */
  triggerRef?: RefObject<HTMLElement | null>;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties | null>(null);

  // Keep the effects below from re-subscribing on every parent render just
  // because the caller passed an inline arrow.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const place = useCallback(() => {
    const anchor = anchorRef.current;
    const menu = menuRef.current;
    if (!anchor || !menu) {
      return;
    }

    const rect = anchor.getBoundingClientRect();
    // A hidden anchor (a responsive `lg:hidden` wrapper, say) measures as zero.
    // Positioning against that would fling the menu into the corner, so leave it
    // hidden until the anchor is laid out again.
    if (rect.width === 0 && rect.height === 0) {
      setStyle(null);
      return;
    }

    // scrollHeight, not offsetHeight: once a previous pass caps the height this
    // still reports the content's natural size, so the flip decision is stable.
    const naturalHeight = menu.scrollHeight;
    const spaceBelow = window.innerHeight - rect.bottom - ANCHOR_GAP - VIEWPORT_PADDING;
    const spaceAbove = rect.top - ANCHOR_GAP - VIEWPORT_PADDING;
    const dropUp = naturalHeight > spaceBelow && spaceAbove > spaceBelow;

    const available = Math.max(MIN_HEIGHT, dropUp ? spaceAbove : spaceBelow);
    const width = matchAnchorWidth ? rect.width : menu.offsetWidth;

    const left = Math.max(
      VIEWPORT_PADDING,
      Math.min(
        align === 'start' ? rect.left : rect.right - width,
        window.innerWidth - VIEWPORT_PADDING - width
      )
    );

    const next: CSSProperties = {
      position: 'fixed',
      left,
      maxHeight: maxHeight ? Math.min(available, maxHeight) : available
    };

    if (dropUp) {
      next.bottom = window.innerHeight - rect.top + ANCHOR_GAP;
    } else {
      next.top = rect.bottom + ANCHOR_GAP;
    }

    if (matchAnchorWidth) {
      next.width = rect.width;
    }

    setStyle((current) => {
      if (
        current &&
        current.left === next.left &&
        current.top === next.top &&
        current.bottom === next.bottom &&
        current.width === next.width &&
        current.maxHeight === next.maxHeight
      ) {
        return current;
      }

      return next;
    });
  }, [align, anchorRef, matchAnchorWidth, maxHeight]);

  // useLayoutEffect so the first placement lands before paint, avoiding a frame
  // of the menu sitting at the top-left of the document.
  useLayoutEffect(() => {
    if (!open) {
      setStyle(null);
      return;
    }

    place();

    window.addEventListener('resize', place);
    // Capture phase: any scrolling ancestor should reposition the menu, not just
    // the window.
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) {
        return;
      }

      if ((triggerRef ?? anchorRef).current?.contains(target)) {
        return;
      }

      onCloseRef.current();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCloseRef.current();
      }
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [anchorRef, open, triggerRef]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      ref={menuRef}
      // overflow-x is pinned explicitly: leaving it `visible` next to an `auto`
      // y-axis would make the browser compute it to `auto` and add a stray
      // horizontal scrollbar.
      className={`scroll-fade z-50 overflow-y-auto overflow-x-hidden ${className}`}
      role={role === 'none' ? undefined : role}
      style={
        style ?? {
          // Laid out (so it can be measured) but not yet placed.
          position: 'fixed',
          top: 0,
          left: 0,
          visibility: 'hidden'
        }
      }
    >
      {children}
    </div>,
    document.body
  );
}
