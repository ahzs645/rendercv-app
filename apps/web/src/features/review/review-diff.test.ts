import { describe, expect, it } from 'vitest';
import YAML from 'yaml';
import type { CvFileSections } from '@rendercv/contracts';
import {
  applyAcceptedReviewChanges,
  computeReviewSectionChanges,
  rebaseAcceptedReviewChanges
} from './review-diff';

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

  it('inserts accepted array additions without overwriting existing entries', () => {
    const baseline = makeSections({
      cv: yamlSection('cv', {
        sections: {
          experience: [{ company: 'Existing Co', position: 'Engineer' }]
        }
      })
    });
    const proposed = makeSections({
      cv: yamlSection('cv', {
        sections: {
          experience: [
            { company: 'New Co', position: 'Staff Engineer' },
            { company: 'Existing Co', position: 'Engineer' }
          ]
        }
      })
    });

    const sectionChanges = computeReviewSectionChanges(baseline, proposed);
    const merged = applyAcceptedReviewChanges(baseline, sectionChanges, {
      'cv:add:sections.experience.0': 'accepted'
    });

    expect(YAML.parse(merged.cv).cv.sections.experience).toEqual([
      { company: 'New Co', position: 'Staff Engineer' },
      { company: 'Existing Co', position: 'Engineer' }
    ]);
  });
});

function acceptAll(changes: ReturnType<typeof computeReviewSectionChanges>) {
  return Object.fromEntries(
    changes.flatMap((section) => section.changes).map((change) => [change.id, 'accepted' as const])
  );
}

function experience(companies: string[], position = 'Engineer') {
  return yamlSection('cv', {
    name: 'John Doe',
    phone: '+1 250 555 0100',
    sections: { experience: companies.map((company) => ({ company, position })) }
  });
}

describe('accepted change ordering', () => {
  it('removes the right entries when indexes reach double digits', () => {
    const companies = Array.from({ length: 12 }, (_, index) => `C${index}`);
    const baseline = makeSections({ cv: experience(companies) });
    const proposed = makeSections({
      cv: experience(companies.filter((_, index) => index !== 9 && index !== 10))
    });
    const changes = computeReviewSectionChanges(baseline, proposed);

    const merged = YAML.parse(applyAcceptedReviewChanges(baseline, changes, acceptAll(changes)).cv);
    expect(merged.cv.sections.experience.map((entry: { company: string }) => entry.company)).toEqual(
      ['C0', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C11']
    );
  });
});

describe('rebaseAcceptedReviewChanges', () => {
  const baseline = makeSections({ cv: experience(['Acme', 'Globex']) });
  const proposedCv = YAML.stringify({
    cv: {
      name: 'John Doe',
      phone: '+1 250 555 0100',
      sections: {
        experience: [
          { company: 'Acme', position: 'Senior Engineer' },
          { company: 'Globex', position: 'Engineer' }
        ]
      }
    }
  });
  const proposed = makeSections({ cv: proposedCv });
  const changes = computeReviewSectionChanges(baseline, proposed);

  it('applies on top of edits the author made after sending the review', () => {
    const current = makeSections({
      cv: experience(['Acme', 'Globex']).replace('+1 250 555 0100', '+1 604 555 0199'),
      design: yamlSection('design', { theme: 'ahmadstyle' })
    });

    const result = rebaseAcceptedReviewChanges(baseline, current, changes, acceptAll(changes));
    const merged = YAML.parse(result.sections.cv);

    expect(result.diverged).toBe(true);
    expect(result.conflicts).toHaveLength(0);
    expect(merged.cv.sections.experience[0].position).toBe('Senior Engineer');
    expect(merged.cv.phone).toBe('+1 604 555 0199');
    // A section the review did not touch keeps the author's text exactly.
    expect(result.sections.design).toBe(current.design);
  });

  it('skips a change where the author edited the same field, instead of overwriting it', () => {
    const current = makeSections({
      cv: YAML.stringify({
        cv: {
          name: 'John Doe',
          phone: '+1 250 555 0100',
          sections: {
            experience: [
              { company: 'Acme', position: 'Staff Engineer' },
              { company: 'Globex', position: 'Engineer' }
            ]
          }
        }
      })
    });

    const result = rebaseAcceptedReviewChanges(baseline, current, changes, acceptAll(changes));

    expect(result.applied).toHaveLength(0);
    expect(result.conflicts).toHaveLength(1);
    expect(YAML.parse(result.sections.cv).cv.sections.experience[0].position).toBe('Staff Engineer');
  });

  it('matches applyAcceptedReviewChanges when the resume is unchanged', () => {
    const result = rebaseAcceptedReviewChanges(baseline, baseline, changes, acceptAll(changes));

    expect(result.diverged).toBe(false);
    expect(result.sections).toEqual(applyAcceptedReviewChanges(baseline, changes, acceptAll(changes)));
  });

  it('leaves the resume untouched when nothing is accepted', () => {
    const current = makeSections({ cv: experience(['Acme', 'Globex', 'Initech']) });
    const result = rebaseAcceptedReviewChanges(baseline, current, changes, {});

    expect(result.sections).toEqual(current);
    expect(result.applied).toHaveLength(0);
  });
});
