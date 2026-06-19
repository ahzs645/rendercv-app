import { describe, expect, it } from 'vitest';
import type { CvVariants } from '@rendercv/contracts';
import { parseCvVariantsYaml, serializeCvVariantsYaml } from './cv-variants';

describe('cv-variants serialization', () => {
  it('round-trips authored variants, including exclude_entries', () => {
    const variants: CvVariants = {
      academic: {
        description: 'Research roles',
        tags: ['research'],
        flavors: ['long'],
        exclude_sections: ['projects'],
        exclude_entries: { experience: ['fp1', 'fp2'] }
      },
      industry: {
        tags: ['industry']
      }
    };

    const parsed = parseCvVariantsYaml(serializeCvVariantsYaml(variants));

    expect(parsed.academic).toEqual({
      description: 'Research roles',
      tags: ['research'],
      flavors: ['long'],
      exclude_sections: ['projects'],
      exclude_entries: { experience: ['fp1', 'fp2'] }
    });
    expect(parsed.industry).toEqual({ tags: ['industry'] });
  });

  it('omits empty fields and serializes under a top-level variants key', () => {
    const yaml = serializeCvVariantsYaml({
      minimal: { description: '', tags: [], exclude_entries: { experience: [] } }
    });

    expect(yaml).toContain('variants:');
    expect(yaml).toContain('minimal:');
    // Empty arrays / blank strings are not written out.
    expect(yaml).not.toContain('tags:');
    expect(yaml).not.toContain('exclude_entries:');
    expect(yaml).not.toContain('description:');
  });

  it('parses exclude_entries from an imported variants file', () => {
    const yaml = [
      'variants:',
      '  academic:',
      '    tags: [research]',
      '    exclude_entries:',
      '      experience:',
      '        - abc123'
    ].join('\n');

    const parsed = parseCvVariantsYaml(yaml);
    expect(parsed.academic?.exclude_entries).toEqual({ experience: ['abc123'] });
  });
});
