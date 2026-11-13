import { describe, expect, it } from 'vitest';
import { applyRenderFixes, type RenderFix } from './render-fixes';

const design = [
  'design:',
  '  theme: ahmadstyle',
  "  website_link_color: blue      # 'blue' for hyperlink style",
  '  foo_bar: 7pt',
  '  keep_entries_together: true   # keep entries together',
  ''
].join('\n');

const setColor: RenderFix = {
  section: 'design',
  op: 'set',
  path: ['design', 'website_link_color'],
  value: '#0074d9',
  description: 'Set design.website_link_color to #0074d9'
};

const removeFoo: RenderFix = {
  section: 'design',
  op: 'remove',
  path: ['design', 'foo_bar'],
  description: 'Remove design.foo_bar'
};

describe('applyRenderFixes', () => {
  it('sets and removes keys while keeping the rest of the YAML and its comments', () => {
    const result = applyRenderFixes({ design }, [setColor, removeFoo]);

    expect(result.applied).toHaveLength(2);
    expect(result.skipped).toHaveLength(0);
    const next = result.sections.design!;
    expect(next).toContain('website_link_color: "#0074d9"');
    expect(next).not.toContain('foo_bar');
    expect(next).toContain('# keep entries together');
    expect(next).toContain('theme: ahmadstyle');
  });

  it('skips a fix whose target the user already changed or removed', () => {
    const result = applyRenderFixes({ design: 'design:\n  theme: ahmadstyle\n' }, [setColor, removeFoo]);

    expect(result.applied).toHaveLength(0);
    expect(result.skipped).toHaveLength(2);
    expect(result.sections.design).toBeUndefined();
  });

  it('refuses paths outside the fix section or through prototype keys', () => {
    const result = applyRenderFixes({ design }, [
      { ...setColor, path: ['cv', 'name'] },
      { ...setColor, path: ['design', '__proto__', 'polluted'] }
    ]);

    expect(result.applied).toHaveLength(0);
    expect(result.skipped).toHaveLength(2);
  });

  it('leaves unparseable YAML alone', () => {
    const result = applyRenderFixes({ design: 'design: [unclosed' }, [setColor]);
    expect(result.applied).toHaveLength(0);
  });
});
