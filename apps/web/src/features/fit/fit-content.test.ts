import { describe, expect, it, vi } from 'vitest';
import { fitContentToPages } from './fit-content';
import type { FitEntry } from './fit-content';

function entry(
  sectionKey: string,
  position: number,
  weight: number,
  pinned = false
): FitEntry {
  return { sectionKey, fingerprint: `${sectionKey}-${position}`, position, weight, pinned };
}

describe('fitContentToPages', () => {
  it('does nothing when the document already fits', async () => {
    const measure = vi.fn(async () => 1);
    const result = await fitContentToPages({
      entries: [entry('experience', 0, 3)],
      targetPages: 1,
      measure
    });

    expect(result).toMatchObject({ applied: false, fit: true, pages: 1 });
    expect(measure).toHaveBeenCalledTimes(1); // only the initial measurement
  });

  it('hides the fewest, lowest-priority entries needed to fit', async () => {
    // 6 entries; the document fits once any 2 are hidden. Page count modeled as
    // ceil(remaining / 4) so: 6->2pp, 5->2pp, 4->1pp.
    const entries = [
      entry('experience', 0, 3),
      entry('experience', 1, 3),
      entry('skills', 0, 1),
      entry('skills', 1, 1),
      entry('hobbies', 0, 1),
      entry('hobbies', 1, 1)
    ];
    const total = entries.length;

    const measure = vi.fn(async (hidden: Record<string, string[]>) => {
      const hiddenCount = Object.values(hidden).reduce((sum, list) => sum + list.length, 0);
      return Math.ceil((total - hiddenCount) / 4);
    });

    const result = await fitContentToPages({ entries, targetPages: 1, measure });

    expect(result?.applied).toBe(true);
    expect(result?.fit).toBe(true);
    expect(result?.pages).toBe(1);
    expect(result?.hiddenCount).toBe(2);

    // The two hidden entries must come from the low-weight sections (skills/hobbies),
    // never from the high-weight experience section.
    expect(result?.hidden.experience).toBeUndefined();
    const hiddenSections = Object.keys(result!.hidden);
    expect(hiddenSections.every((key) => key === 'skills' || key === 'hobbies')).toBe(true);
  });

  it('never hides pinned sections', async () => {
    const entries = [
      entry('experience', 0, 3, true),
      entry('experience', 1, 3, true),
      entry('skills', 0, 1)
    ];
    // Even hiding the single droppable entry can't get below 2 pages.
    const measure = vi.fn(async (hidden: Record<string, string[]>) => {
      const hiddenCount = Object.values(hidden).reduce((sum, list) => sum + list.length, 0);
      return hiddenCount >= 1 ? 2 : 3;
    });

    const result = await fitContentToPages({ entries, targetPages: 1, measure });

    expect(result?.fit).toBe(false);
    // It still trims the one droppable entry as a best effort (3 -> 2 pages).
    expect(result?.hidden.experience).toBeUndefined();
    expect(result?.pages).toBe(2);
  });

  it('reports best effort when the target is unreachable', async () => {
    const entries = [entry('skills', 0, 1), entry('skills', 1, 1)];
    // Hiding everything still leaves 2 pages (e.g. a giant pinned header elsewhere).
    const measure = vi.fn(async () => 2);

    const result = await fitContentToPages({ entries, targetPages: 1, measure });

    expect(result).toMatchObject({ applied: false, fit: false, pages: 2 });
  });

  it('aborts and returns null when a render fails', async () => {
    const measure = vi.fn(async () => null);
    const result = await fitContentToPages({
      entries: [entry('skills', 0, 1)],
      targetPages: 1,
      measure
    });

    expect(result).toBeNull();
  });
});
