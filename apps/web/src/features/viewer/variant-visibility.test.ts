import { describe, expect, it } from 'vitest';
import YAML from 'yaml';
import { entryFingerprint } from '@rendercv/core';
import { computeVariantVisibility } from './variant-visibility';

function cvRoot(yamlBody: string) {
  return YAML.parse(yamlBody).cv as Record<string, unknown>;
}

const ROOT = cvRoot(`cv:
  sections:
    experience:
      - company: Active Co
        position: Engineer
      - company: Archived Co
        position: Intern
        tags: [archived]
    projects:
      - name: Side Project
    summary:
      - A short paragraph about me.
      - A second paragraph.
`);

describe('computeVariantVisibility', () => {
  it('drops archived entries even when no variant is active', () => {
    const { excludedSections, hiddenEntries, archivedEntries } = computeVariantVisibility(ROOT, null);
    expect(excludedSections.size).toBe(0);

    const archivedFp = entryFingerprint(
      (ROOT.sections as Record<string, unknown[]>).experience[1]
    );
    expect(hiddenEntries.experience?.has(archivedFp)).toBe(true);
    expect(archivedEntries.experience?.has(archivedFp)).toBe(true);
    // The non-archived entry stays visible.
    expect(hiddenEntries.experience?.size).toBe(1);
  });

  it('excludes whole sections listed in exclude_sections', () => {
    const { excludedSections } = computeVariantVisibility(ROOT, {
      exclude_sections: ['projects']
    });
    expect(excludedSections.has('projects')).toBe(true);
  });

  it('hides entries listed in the variant exclude_entries (app-authored)', () => {
    const activeFp = entryFingerprint(
      (ROOT.sections as Record<string, unknown[]>).experience[0]
    );
    const { hiddenEntries, archivedEntries } = computeVariantVisibility(ROOT, {
      exclude_entries: { experience: [activeFp] }
    });
    expect(hiddenEntries.experience?.has(activeFp)).toBe(true);
    // App-authored exclusion is not flagged as archived.
    expect(archivedEntries.experience?.has(activeFp) ?? false).toBe(false);
  });

  it('hides text (string) entries listed in exclude_entries', () => {
    const textFp = entryFingerprint('A second paragraph.');
    const { hiddenEntries, archivedEntries } = computeVariantVisibility(ROOT, {
      exclude_entries: { summary: [textFp] }
    });
    expect(hiddenEntries.summary?.has(textFp)).toBe(true);
    expect(hiddenEntries.summary?.size).toBe(1);
    expect(archivedEntries.summary).toBeUndefined();
  });

  it('leaves text entries visible when the variant does not exclude them', () => {
    const { hiddenEntries } = computeVariantVisibility(ROOT, { exclude_sections: ['projects'] });
    expect(hiddenEntries.summary).toBeUndefined();
  });

  it('does not report entries inside an excluded section', () => {
    const { hiddenEntries } = computeVariantVisibility(ROOT, {
      exclude_sections: ['experience']
    });
    expect(hiddenEntries.experience).toBeUndefined();
  });
});
