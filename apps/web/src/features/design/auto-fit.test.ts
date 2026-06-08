import { describe, expect, it, vi } from 'vitest';
import YAML from 'yaml';
import type { CvFileSections } from '@rendercv/contracts';
import { autoFitDesignToPages } from './auto-fit';

function makeSections(overrides?: Partial<CvFileSections>): CvFileSections {
  return {
    cv: 'cv:\n  name: Jane Doe\n',
    design: YAML.stringify({
      design: {
        theme: 'classic',
        page: { top_margin: '0.7in', bottom_margin: '0.7in', left_margin: '0.7in', right_margin: '0.7in' },
        typography: {
          line_spacing: '0.6em',
          font_size: { body: '10pt', name: '30pt' }
        },
        sections: { space_between_regular_entries: '1.2em' }
      }
    }),
    locale: 'locale:\n',
    settings: 'settings:\n',
    ...overrides
  };
}

/** Build a render fn that returns the given page counts on successive calls. */
function rendererReturning(pageCounts: number[]) {
  let call = 0;
  return vi.fn(async () => {
    const count = pageCounts[Math.min(call, pageCounts.length - 1)] ?? 1;
    call += 1;
    return Array.from({ length: count }, () => '<svg/>');
  });
}

describe('autoFitDesignToPages', () => {
  it('returns applied:false when the resume already fits', async () => {
    const render = rendererReturning([1]);
    const result = await autoFitDesignToPages({ sections: makeSections(), targetPages: 1, render });

    expect(result).toEqual({ applied: false, fit: true, pages: 1, design: expect.any(String) });
    // Only the initial measurement render, no compaction attempts.
    expect(render).toHaveBeenCalledTimes(1);
  });

  it('compacts the design until it fits and shrinks spacing', async () => {
    // current=2, step1=2, step2=1 -> fits on the second compaction step.
    const render = rendererReturning([2, 2, 1]);
    const result = await autoFitDesignToPages({ sections: makeSections(), targetPages: 1, render });

    expect(result?.applied).toBe(true);
    expect(result?.fit).toBe(true);
    expect(result?.pages).toBe(1);

    const design = YAML.parse(result!.design).design;
    // Line spacing was reduced from the original 0.6em.
    expect(parseFloat(design.typography.line_spacing)).toBeLessThan(0.6);
    expect(parseFloat(design.page.top_margin)).toBeLessThan(0.7);
  });

  it('returns the most compact candidate when the target cannot be reached', async () => {
    // current=4, then every candidate stays at 3 (still > target but < current).
    const render = rendererReturning([4, 3, 3, 3, 3, 3, 3]);
    const result = await autoFitDesignToPages({ sections: makeSections(), targetPages: 1, render });

    expect(result?.applied).toBe(true);
    expect(result?.fit).toBe(false);
    expect(result?.pages).toBe(3);
  });

  it('returns null when the document cannot be rendered', async () => {
    const render = vi.fn(async () => null);
    const result = await autoFitDesignToPages({ sections: makeSections(), targetPages: 1, render });

    expect(result).toBeNull();
  });

  it('returns null when the design section has no design object', async () => {
    const render = rendererReturning([3]);
    const result = await autoFitDesignToPages({
      sections: makeSections({ design: 'design:\n' }),
      targetPages: 1,
      render
    });

    expect(result).toBeNull();
    expect(render).not.toHaveBeenCalled();
  });
});
