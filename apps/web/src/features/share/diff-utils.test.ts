import { describe, expect, it } from 'vitest';
import { computeSectionDiffs, hasChanges } from './diff-utils';
import type { CvFileSections } from '@rendercv/contracts';

function makeSections(overrides?: Partial<CvFileSections>): CvFileSections {
  return {
    cv: 'cv:\n  name: John Doe\n  label: Developer',
    design: 'design:\n  theme: classic',
    locale: 'locale:\n  language: english',
    settings: 'settings:\n  pdf_size: a4',
    ...overrides
  };
}

describe('hasChanges', () => {
  it('returns false when sections are identical', () => {
    const a = makeSections();
    const b = makeSections();
    expect(hasChanges(a, b)).toBe(false);
  });

  it('returns true when any section differs', () => {
    const a = makeSections();
    const b = makeSections({ cv: 'cv:\n  name: Jane Doe\n  label: Designer' });
    expect(hasChanges(a, b)).toBe(true);
  });

  it('returns true when only design changes', () => {
    const a = makeSections();
    const b = makeSections({ design: 'design:\n  theme: ember' });
    expect(hasChanges(a, b)).toBe(true);
  });
});

describe('computeSectionDiffs', () => {
  it('marks all sections unchanged when identical', () => {
    const a = makeSections();
    const diffs = computeSectionDiffs(a, a);

    for (const diff of diffs) {
      expect(diff.changed).toBe(false);
      expect(diff.addedLines).toBe(0);
      expect(diff.removedLines).toBe(0);
    }
  });

  it('detects changed section with added and removed lines', () => {
    const origin = makeSections({ cv: 'cv:\n  name: John Doe' });
    const modified = makeSections({ cv: 'cv:\n  name: Jane Doe\n  label: Designer' });

    const diffs = computeSectionDiffs(origin, modified);
    const cvDiff = diffs.find((d) => d.key === 'cv')!;

    expect(cvDiff.changed).toBe(true);
    expect(cvDiff.addedLines).toBeGreaterThan(0);
    expect(cvDiff.removedLines).toBeGreaterThan(0);
    expect(cvDiff.label).toBe('CV');
  });

  it('leaves unchanged sections untouched', () => {
    const origin = makeSections();
    const modified = makeSections({ cv: 'cv:\n  name: Jane Doe' });

    const diffs = computeSectionDiffs(origin, modified);
    const designDiff = diffs.find((d) => d.key === 'design')!;

    expect(designDiff.changed).toBe(false);
  });

  it('covers all four sections', () => {
    const a = makeSections();
    const diffs = computeSectionDiffs(a, a);

    const keys = diffs.map((d) => d.key);
    expect(keys).toContain('cv');
    expect(keys).toContain('design');
    expect(keys).toContain('locale');
    expect(keys).toContain('settings');
    expect(diffs).toHaveLength(4);
  });
});
