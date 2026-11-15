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

    // The edit is narrowed to the field; the swapped order is its own change
    // (matching by signature used to drop it silently).
    expect(cvChanges.changes).toHaveLength(2);
    expect(cvChanges.changes[0]).toMatchObject({
      id: 'cv:set:sections.experience.0.position',
      label: 'Position',
      kind: 'set',
      baselineValue: 'Engineer',
      proposedValue: 'Staff Engineer'
    });
    expect(cvChanges.changes[1]).toMatchObject({ kind: 'reorder', label: 'Order of entries' });
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

describe('rebase conflicts', () => {
  const baseline = makeSections({ cv: experience(['Acme', 'Globex']) });
  const proposed = makeSections({
    cv: YAML.stringify({
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
    })
  });
  const changes = computeReviewSectionChanges(baseline, proposed);
  const positionChange = changes.flatMap((section) => section.changes)[0]!;

  function currentWithFirstPosition(position: string, extra: string[] = []) {
    return makeSections({
      cv: YAML.stringify({
        cv: {
          name: 'John Doe',
          phone: '+1 250 555 0100',
          sections: {
            experience: [
              ...extra.map((company) => ({ company, position: 'New' })),
              { company: 'Acme', position },
              { company: 'Globex', position: 'Engineer' }
            ]
          }
        }
      })
    });
  }

  it('reports what the author has now and lets a field edit be overwritten on request', () => {
    const current = currentWithFirstPosition('Staff Engineer');
    const plain = rebaseAcceptedReviewChanges(baseline, current, changes, acceptAll(changes));

    expect(plain.conflicts[0]).toMatchObject({ currentValue: 'Staff Engineer', forceable: true });

    const forced = rebaseAcceptedReviewChanges(baseline, current, changes, acceptAll(changes), {
      force: new Set([positionChange.id])
    });
    expect(forced.conflicts).toHaveLength(0);
    expect(YAML.parse(forced.sections.cv).cv.sections.experience[0].position).toBe('Senior Engineer');
  });

  it('never overwrites by position once entries were added to the list', () => {
    // The author inserted an entry at the top: index 0 is now a different job.
    const current = currentWithFirstPosition('Engineer', ['Initech']);
    const result = rebaseAcceptedReviewChanges(baseline, current, changes, acceptAll(changes), {
      force: new Set([positionChange.id])
    });

    expect(result.conflicts[0]?.forceable).toBe(false);
    const experience = YAML.parse(result.sections.cv).cv.sections.experience;
    expect(experience.map((entry: { position: string }) => entry.position)).toEqual([
      'New',
      'Engineer',
      'Engineer'
    ]);
  });
});

describe('list changes', () => {
  const bullets = (items: string[]) =>
    makeSections({
      cv: yamlSection('cv', {
        name: 'John Doe',
        sections: { experience: [{ company: 'Acme', position: 'Engineer', highlights: items }] }
      })
    });
  const base = ['Built A', 'Built B', 'Built C', 'Built D'];

  it('reports one insertion, not a change to every later bullet', () => {
    const changes = computeReviewSectionChanges(bullets(base), bullets(['Presented X', ...base]))
      .flatMap((section) => section.changes);

    expect(changes).toEqual([expect.objectContaining({ kind: 'add', proposedValue: 'Presented X' })]);
  });

  it('reports a removal and an insertion in different places as exactly two changes', () => {
    const changes = computeReviewSectionChanges(bullets(base), bullets(['Built A', 'Built C', 'Built D', 'Built E']))
      .flatMap((section) => section.changes);

    expect(changes.map((change) => `${change.kind}:${String(change.baselineValue ?? change.proposedValue)}`).sort())
      .toEqual(['add:Built E', 'remove:Built B']);
  });

  it('accepting only the insertion keeps every existing bullet', () => {
    const baseline = bullets(base);
    const changes = computeReviewSectionChanges(baseline, bullets(['Presented X', 'Built A', 'Built C', 'Built D']));
    const insert = changes.flatMap((section) => section.changes).find((change) => change.kind === 'add')!;

    const merged = YAML.parse(applyAcceptedReviewChanges(baseline, changes, { [insert.id]: 'accepted' }).cv);
    expect(merged.cv.sections.experience[0].highlights).toEqual(['Presented X', ...base]);
  });

  it('pairs an edited bullet as one edit', () => {
    const changes = computeReviewSectionChanges(bullets(base), bullets(['Built A', 'Built B better', 'Built C', 'Built D']))
      .flatMap((section) => section.changes);

    expect(changes).toEqual([
      expect.objectContaining({ kind: 'set', baselineValue: 'Built B', proposedValue: 'Built B better' })
    ]);
  });
});

describe('structural changes', () => {
  const cvWith = (sections: Record<string, unknown>) =>
    makeSections({ cv: yamlSection('cv', { name: 'Amir', sections }) });
  const projects = [
    {
      name: 'LeagueFlow',
      summary: 'League registration system',
      highlights: ['Designed the SQL database tables', 'Developed a PHP WordPress plugin']
    }
  ];
  const cvChangesOf = (baseline: CvFileSections, proposed: CvFileSections) =>
    computeReviewSectionChanges(baseline, proposed).find((section) => section.key === 'cv')!.changes;

  it('shows a renamed section as one rename, with the edits inside it reviewed separately', () => {
    const baseline = cvWith({ experience: [{ company: 'Acme', position: 'Dev' }], projects });
    const proposed = cvWith({
      experience: [{ company: 'Acme', position: 'Dev' }],
      selected_projects: [{ ...projects[0], highlights: ['Designed the data schema', 'Developed a PHP WordPress plugin'] }]
    });

    const changes = cvChangesOf(baseline, proposed);
    expect(changes.map((change) => change.kind)).toEqual(['rename', 'set']);
    expect(changes[0]).toMatchObject({
      id: 'cv:rename:sections.projects',
      label: 'Section renamed',
      entryLabel: 'Projects → Selected Projects'
    });
    expect(changes[1]).toMatchObject({ detail: 'Selected Projects', proposedValue: 'Designed the data schema' });

    const all = Object.fromEntries(changes.map((change) => [change.id, 'accepted' as const]));
    expect(YAML.parse(applyAcceptedReviewChanges(baseline, computeReviewSectionChanges(baseline, proposed), all).cv))
      .toEqual(YAML.parse(proposed.cv));

    // Rejecting the rename keeps the old name but still takes the accepted edit.
    const editOnly = { [changes[1]!.id]: 'accepted' as const };
    const merged = YAML.parse(applyAcceptedReviewChanges(baseline, computeReviewSectionChanges(baseline, proposed), editOnly).cv);
    expect(Object.keys(merged.cv.sections)).toEqual(['experience', 'projects']);
    expect(merged.cv.sections.projects[0].highlights[0]).toBe('Designed the data schema');
  });

  it('keeps a renamed section in its place when applied on top of the current CV', () => {
    const baseline = cvWith({ projects, education: [{ institution: 'UNBC', area: 'CS' }] });
    const proposed = cvWith({ selected_projects: projects, education: [{ institution: 'UNBC', area: 'CS' }] });
    const changes = computeReviewSectionChanges(baseline, proposed);
    const rename = changes.flatMap((section) => section.changes).find((change) => change.kind === 'rename')!;
    const result = rebaseAcceptedReviewChanges(baseline, baseline, changes, { [rename.id]: 'accepted' });
    expect(Object.keys(YAML.parse(result.sections.cv).cv.sections)).toEqual(['selected_projects', 'education']);
  });

  it('reports moving a section as one reorder and applies it', () => {
    const baseline = cvWith({ experience: [{ company: 'Acme', position: 'Dev' }], education: [{ institution: 'UNBC', area: 'CS' }] });
    const proposed = cvWith({ education: [{ institution: 'UNBC', area: 'CS' }], experience: [{ company: 'Acme', position: 'Dev' }] });
    const changes = computeReviewSectionChanges(baseline, proposed);
    const cvChanges = changes.find((section) => section.key === 'cv')!.changes;
    expect(cvChanges).toEqual([expect.objectContaining({ kind: 'reorder', label: 'Order of sections' })]);
    const merged = YAML.parse(applyAcceptedReviewChanges(baseline, changes, { [cvChanges[0]!.id]: 'accepted' }).cv);
    expect(Object.keys(merged.cv.sections)).toEqual(['education', 'experience']);
  });

  it('pairs a rewritten bullet with the bullet it rewrites, not the one at the same position', () => {
    const before = [
      'Collect, clean and standardize health research data with Python in Jupyter notebooks',
      'Protect confidential faculty interview data and unpublished research',
      'Interview faculty and code the transcripts in NVivo to identify recurring themes',
      'Develop and maintain the project website and online atlas'
    ];
    const after = [
      'Clean, standardize and validate research datasets in Python before analysis',
      'Conduct faculty interviews and code transcripts in NVivo to identify recurring research themes',
      'Handle confidential interview material and unpublished research, sharing summarized themes',
      'Develop and maintain the project website and online atlas'
    ];
    const baseline = cvWith({ experience: [{ company: 'NHHR', position: 'Data Specialist', highlights: before }] });
    const proposed = cvWith({ experience: [{ company: 'NHHR', position: 'Data Specialist', highlights: after }] });
    const changes = cvChangesOf(baseline, proposed);

    // Each edit compares a bullet with its own rewrite; the swapped interview
    // and confidentiality bullets read as a move, not as cross-matched edits.
    const edits = changes.filter((change) => change.kind === 'set');
    expect(edits.some((change) => String(change.baselineValue).startsWith('Interview') && String(change.proposedValue).startsWith('Handle'))).toBe(false);
    expect(edits.some((change) => String(change.baselineValue).startsWith('Collect') && String(change.proposedValue).startsWith('Clean'))).toBe(true);

    const all = Object.fromEntries(changes.map((change) => [change.id, 'accepted' as const]));
    const merged = YAML.parse(applyAcceptedReviewChanges(baseline, computeReviewSectionChanges(baseline, proposed), all).cv);
    expect(merged.cv.sections.experience[0].highlights).toEqual(after);
  });

  it('groups a moved bullet so it is decided as one change', () => {
    const baseline = cvWith({ experience: [{ company: 'Acme', position: 'Dev', highlights: ['Alpha work done', 'Beta work done', 'Gamma work done'] }] });
    const proposed = cvWith({ experience: [{ company: 'Acme', position: 'Dev', highlights: ['Gamma work done', 'Alpha work done', 'Beta work done'] }] });
    const changes = cvChangesOf(baseline, proposed);
    expect(changes).toHaveLength(2);
    expect(changes[0]!.group).toMatchObject({ kind: 'move', summary: 'Moved from item 3 to item 1' });
    expect(changes[1]!.group?.id).toBe(changes[0]!.group?.id);
  });

  it('groups two bullets combined into one', () => {
    const baseline = cvWith({
      experience: [{
        company: 'Acme',
        position: 'Dev',
        highlights: [
          'Integrated the process with Google Calendar and added duplicate prevention',
          'Kept a change log of every calendar update for bulk edits',
          'Built a Power Apps dashboard'
        ]
      }]
    });
    const proposed = cvWith({
      experience: [{
        company: 'Acme',
        position: 'Dev',
        highlights: [
          'Integrated Google Calendar with duplicate prevention and a change log of every calendar update',
          'Built a Power Apps dashboard'
        ]
      }]
    });
    const changes = cvChangesOf(baseline, proposed);
    expect(changes.map((change) => change.kind).sort()).toEqual(['remove', 'set']);
    expect(changes[0]!.group).toMatchObject({ kind: 'combine', summary: 'Combined items 1 and 2 into item 1' });
    expect(changes[1]!.group?.id).toBe(changes[0]!.group?.id);
  });

  it('links a skill moved from one line to another', () => {
    const baseline = cvWith({
      skills: [
        { label: 'Data', details: 'Python; SQL; Excel' },
        { label: 'Development', details: 'PHP; WordPress; Next.js' }
      ]
    });
    const proposed = cvWith({
      skills: [
        { label: 'Data', details: 'Python; SQL' },
        { label: 'Development', details: 'WordPress; Next.js' },
        { label: 'Languages', details: 'PHP; Python' }
      ]
    });
    const changes = cvChangesOf(baseline, proposed);
    const development = changes.find((change) => change.path.join('.') === 'sections.skills.1.details')!;
    const languages = changes.find((change) => change.kind === 'add')!;
    expect(development.related).toEqual([
      { item: 'PHP', direction: 'to', changeId: languages.id, where: 'Languages' }
    ]);
    expect(languages.related).toEqual([
      expect.objectContaining({ item: 'PHP', direction: 'from', changeId: development.id })
    ]);
  });
});
