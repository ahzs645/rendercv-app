import type { CvFileSections, SectionKey } from '@rendercv/contracts';
import { SECTION_KEYS, SECTION_LABELS } from '@rendercv/contracts';

export interface SectionDiff {
  key: SectionKey;
  label: string;
  changed: boolean;
  addedLines: number;
  removedLines: number;
}

/**
 * Compare two CvFileSections and produce a per-section summary of changes.
 */
export function computeSectionDiffs(
  origin: CvFileSections,
  modified: CvFileSections
): SectionDiff[] {
  return SECTION_KEYS.map((key) => {
    const originLines = (origin[key] ?? '').split('\n');
    const modifiedLines = (modified[key] ?? '').split('\n');

    if (origin[key] === modified[key]) {
      return { key, label: SECTION_LABELS[key], changed: false, addedLines: 0, removedLines: 0 };
    }

    const originSet = new Set(originLines);
    const modifiedSet = new Set(modifiedLines);

    let addedLines = 0;
    let removedLines = 0;

    for (const line of modifiedLines) {
      if (!originSet.has(line)) {
        addedLines++;
      }
    }

    for (const line of originLines) {
      if (!modifiedSet.has(line)) {
        removedLines++;
      }
    }

    return { key, label: SECTION_LABELS[key], changed: true, addedLines, removedLines };
  });
}

/**
 * Check whether any section has changed between origin and modified.
 */
export function hasChanges(origin: CvFileSections, modified: CvFileSections): boolean {
  return SECTION_KEYS.some((key) => origin[key] !== modified[key]);
}
