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
    const nameChange = cvChanges.changes.find((change) => change.id === 'cv:name');

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
      id: 'cv:sections.experience.0.position',
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
        id: 'design:columns.1',
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
      'cv:name': 'accepted',
      'cv:location': 'accepted',
      'cv:label': 'rejected'
    });
    const mergedCv = YAML.parse(merged.cv).cv;

    expect(mergedCv).toEqual({
      name: 'Jane Doe',
      label: 'Developer'
    });
  });
});
