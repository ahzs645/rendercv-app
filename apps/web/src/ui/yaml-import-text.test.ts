import { describe, expect, it } from 'vitest';
import YAML from 'yaml';
import { stringifyCvYaml } from '@rendercv/core';
import { parseImportedYaml } from './yaml-import-button';
import { keepTextUnlessChanged, normalizeLegacyDesignYaml } from '../features/viewer/viewer-sections';

const longBullet =
  'Built an automated planning flow that converts weekly schedules into Google Calendar events with idempotent upsert and audit logging';

const file = `cv:
  name: Ada Lovelace
  sections:
    experience:
      - company: Analytical Engines
        position: Engineer
        highlights:
          - ${longBullet}

design:
  theme: ahmadstyle
  website_link_color: blue      # 'blue' for hyperlink style
  keep_entries_together: true   # Prevent page breaks within entries
`;

describe('YAML written back into a CV', () => {
  it('never folds a long line', () => {
    const text = stringifyCvYaml({ cv: { highlights: [longBullet] } });
    expect(text).toContain(`- ${longBullet}`);
    expect(text.split('\n').filter((line) => line.trim()).length).toBe(3);
  });

  it('imports each section as the file wrote it, keeping comments and long lines', () => {
    const sections = parseImportedYaml(file);
    expect(sections.cv).toContain(`          - ${longBullet}\n`);
    expect(sections.design).toContain("website_link_color: blue      # 'blue' for hyperlink style");
    expect(sections.design).toContain('# Prevent page breaks within entries');
    expect(YAML.parse(sections.cv!)).toEqual({ cv: YAML.parse(file).cv });
  });

  it('falls back to a clean, unfolded copy when the file cannot be sliced', () => {
    const flow = `{ cv: { name: Ada, sections: { experience: [ { company: X, position: Y, highlights: ["${longBullet}"] } ] } } }`;
    const sections = parseImportedYaml(flow);
    expect(YAML.parse(sections.cv!)).toEqual({ cv: YAML.parse(flow).cv });
    expect(sections.cv).toContain(longBullet);
  });

  it('keeps the text of an automatic rewrite that changed nothing', () => {
    const cv = parseImportedYaml(file).cv!;
    expect(keepTextUnlessChanged(cv, YAML.stringify(YAML.parse(cv)))).toBe(cv);
    const changed = keepTextUnlessChanged(cv, YAML.stringify({ cv: { name: 'Changed', note: longBullet } }));
    expect(changed).toContain(`note: ${longBullet}`);
  });
});

describe('legacy design keys', () => {
  const design = `design:
  theme: ahmadstyle
  font_size: 11pt
  page_size: us-letter
  website_link_color: blue      # 'blue' for hyperlink style
  keep_entries_together: true   # Prevent page breaks within entries
`;

  it('moves them to the current schema and keeps comments', () => {
    const next = normalizeLegacyDesignYaml(design)!;
    expect(YAML.parse(next)).toEqual({
      design: {
        theme: 'ahmadstyle',
        website_link_color: 'blue',
        keep_entries_together: true,
        typography: { font_size: { body: '11pt' } },
        page: { size: 'us-letter' }
      }
    });
    expect(next).toContain("# 'blue' for hyperlink style");
    expect(next).toContain('# Prevent page breaks within entries');
  });

  it('replaces a non-mapping value in the way, as before', () => {
    const next = normalizeLegacyDesignYaml('design:\n  theme: classic\n  typography: plain\n  font_size: 10pt\n')!;
    expect(YAML.parse(next).design.typography).toEqual({ font_size: { body: '10pt' } });
  });
});
