import { preferences } from '$lib/features/preferences/pref-state.svelte.js';

let collapseVersion = $state(0);
let scrollRef: HTMLElement | null = null;

function anchoredToggle(action: () => void) {
  if (!scrollRef) {
    action();
    return;
  }

  // Find first child element whose bottom is below the scroll container's top edge
  const containerRect = scrollRef.getBoundingClientRect();
  const children = scrollRef.querySelectorAll(':scope > div > *');
  let anchor: Element | null = null;
  let anchorTop = 0;
  for (const child of children) {
    const r = child.getBoundingClientRect();
    if (r.bottom > containerRect.top) {
      anchor = child;
      anchorTop = r.top;
      break;
    }
  }

  action();

  // After DOM update, finish animations and compensate scroll
  requestAnimationFrame(() => {
    if (!scrollRef || !anchor) return;
    for (const anim of scrollRef.getAnimations({ subtree: true })) {
      anim.finish();
    }
    const newTop = anchor.getBoundingClientRect().top;
    scrollRef.scrollTop += newTop - anchorTop;
  });
}

export const formEditorCollapse = {
  get version() {
    return collapseVersion;
  },
  get allExpanded() {
    return preferences.entriesExpanded;
  },
  registerScrollContainer(el: HTMLElement | null) {
    scrollRef = el;
  },
  collapseAll() {
    anchoredToggle(() => {
      preferences.entriesExpanded = false;
      collapseVersion++;
    });
  },
  expandAll() {
    anchoredToggle(() => {
      preferences.entriesExpanded = true;
      collapseVersion++;
    });
  },
  toggle() {
    if (preferences.entriesExpanded) {
      this.collapseAll();
    } else {
      this.expandAll();
    }
  }
};
