import { describe, expect, it } from 'vitest';
import YAML from 'yaml';
import type { CvFileSections } from '@rendercv/contracts';
import { applyAcceptedReviewChanges, computeReviewSectionChanges } from './review-diff';

function yamlSection(key: keyof CvFileSections, value: unknown) {
  return YAML.stringify({ [key]: value });
}

function makeSections(overrides?: Partial<CvFileSections>): CvFileSections {
  return {
    cv: yamlSection('cv', {
      name: 'John Doe',
      label: 'Developer'
    }),
    design: yamlSection('design', {
      theme: 'classic'
    }),
    locale: yamlSection('locale', {
      language: 'english'
    }),
    settings: yamlSection('settings', {
      pdf_size: 'a4'
    }),
    ...overrides
  };
}

describe('computeReviewSectionChanges', () => {
  it('detects top-level scalar field changes with human-readable labels', () => {
    const baseline = makeSections();
    const proposed = makeSections({
      cv: yamlSection('cv', {
        name: 'Jane Doe',
        label: 'Developer'
      })
    });

    const cvChanges = computeReviewSectionChanges(baseline, proposed).find(
      (section) => section.key === 'cv'
    )!;
    const nameChange = cvChanges.changes.find((change) => change.id === 'cv:set:name');

    expect(nameChange).toMatchObject({
      label: 'Name',
      kind: 'set',
      baselineValue: 'John Doe',
      proposedValue: 'Jane Doe'
    });
  });

  it('matches object arrays by stable signature and narrows the change to the edited field', () => {
    const baseline = makeSections({
      cv: yamlSection('cv', {
        sections: {
          experience: [
            { company: 'OpenAI', position: 'Engineer' },
            { company: 'Anthropic', position: 'Researcher' }
          ]
        }
      })
    });
    const proposed = makeSections({
      cv: yamlSection('cv', {
        sections: {
          experience: [
            { company: 'Anthropic', position: 'Researcher' },
            { company: 'OpenAI', position: 'Staff Engineer' }
          ]
        }
      })
    });

    const cvChanges = computeReviewSectionChanges(baseline, proposed).find(
      (section) => section.key === 'cv'
    )!;

    expect(cvChanges.changes).toHaveLength(1);
    expect(cvChanges.changes[0]).toMatchObject({
      id: 'cv:set:sections.experience.0.position',
      label: 'Position',
      kind: 'set',
      baselineValue: 'Engineer',
      proposedValue: 'Staff Engineer'
    });
  });

  it('falls back to whole-entry changes when array entries have no stable signature', () => {
    const baseline = makeSections({
      design: yamlSection('design', {
        theme: 'classic',
        columns: [
          { width: 0.35, align: 'left' },
          { width: 0.65, align: 'right' }
        ]
      })
    });
    const proposed = makeSections({
      design: yamlSection('design', {
        theme: 'classic',
        columns: [
          { width: 0.35, align: 'left' },
          { width: 0.6, align: 'right' }
        ]
      })
    });

    const designChanges = computeReviewSectionChanges(baseline, proposed).find(
      (section) => section.key === 'design'
    )!;

    expect(designChanges.changes).toEqual([
      expect.objectContaining({
        id: 'design:set:columns.1',
        kind: 'set',
        baselineValue: { width: 0.65, align: 'right' },
        proposedValue: { width: 0.6, align: 'right' }
      })
    ]);
  });
});

describe('applyAcceptedReviewChanges', () => {
  it('applies accepted changes while leaving rejected or pending changes untouched', () => {
    const baseline = makeSections({
      cv: yamlSection('cv', {
        name: 'John Doe',
        label: 'Developer',
        location: 'Vancouver'
      })
    });
    const proposed = makeSections({
      cv: yamlSection('cv', {
        name: 'Jane Doe',
        label: 'Designer'
      })
    });

    const sectionChanges = computeReviewSectionChanges(baseline, proposed);
    const merged = applyAcceptedReviewChanges(baseline, sectionChanges, {
      'cv:set:name': 'accepted',
      'cv:remove:location': 'accepted',
      'cv:set:label': 'rejected'
    });
    const mergedCv = YAML.parse(merged.cv).cv;

    expect(mergedCv).toEqual({
      name: 'Jane Doe',
      label: 'Developer'
    });
  });

  it('keeps add and remove decisions independent when they share the same path', () => {
    const baseline = makeSections({
      cv: yamlSection('cv', {
        sections: {
          skills: [{ label: 'Tools', details: 'SQL, Python, Tableau' }]
        }
      })
    });
    const proposed = makeSections({
      cv: yamlSection('cv', {
        sections: {
          skills: [{ name: 'Tools', summary: 'details: SQL, Python, Tableau' }]
        }
      })
    });

    const cvChanges = computeReviewSectionChanges(baseline, proposed).find(
      (section) => section.key === 'cv'
    )!;
    const ids = cvChanges.changes.map((change) => change.id);

    expect(ids).toEqual(['cv:remove:sections.skills.0', 'cv:add:sections.skills.0']);
    expect(new Set(ids).size).toBe(ids.length);

    const merged = applyAcceptedReviewChanges(baseline, [{ ...cvChanges, changes: cvChanges.changes }], {
      'cv:remove:sections.skills.0': 'accepted',
      'cv:add:sections.skills.0': 'accepted'
    });

    expect(YAML.parse(merged.cv).cv.sections.skills).toEqual([
      { name: 'Tools', summary: 'details: SQL, Python, Tableau' }
    ]);
  });
});
