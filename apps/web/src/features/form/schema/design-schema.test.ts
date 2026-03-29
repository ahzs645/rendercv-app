import { describe, expect, it } from 'vitest';
import { getDesignSchema } from './design-schema';

function listFieldPaths(themeName?: string) {
  return getDesignSchema(themeName).groups.flatMap((group) =>
    group.fields.map((field) => field.path.join('.'))
  );
}

describe('getDesignSchema', () => {
  it('returns the shared design schema for built-in themes', () => {
    const fieldPaths = listFieldPaths('moderncv');

    expect(fieldPaths).toContain('page.size');
    expect(fieldPaths).not.toContain('keep_sections_together');
    expect(fieldPaths).not.toContain('website_link_color');
    expect(fieldPaths).not.toContain('custom_entries.show_time_span');
  });

  it('adds Ahmad Style-specific fields when the active theme is ahmadstyle', () => {
    const fieldPaths = listFieldPaths('ahmadstyle');

    expect(fieldPaths).toContain('keep_sections_together');
    expect(fieldPaths).toContain('keep_entries_together');
    expect(fieldPaths).toContain('prevent_orphaned_headers');
    expect(fieldPaths).toContain('section_heading_size');
    expect(fieldPaths).toContain('website_link_color');
    expect(fieldPaths).toContain('custom_entries.show_time_span');
  });
});
