import { describe, expect, it } from 'vitest';
import YAML from 'yaml';
import { normalizeCompatibilityCvYaml } from './normalize-compat-cv';

function normalizeSections(sections: Record<string, unknown[]>) {
  const yamlText = YAML.stringify({ cv: { name: 'Test Person', sections } });
  const parsed = YAML.parse(normalizeCompatibilityCvYaml(yamlText)) as {
    cv: { sections: Record<string, unknown[]> };
  };
  return parsed.cv.sections;
}

describe('normalizeCompatibilityCvYaml entry shapes', () => {
  it('keeps one-line entries as label/details instead of flattening them', () => {
    const sections = normalizeSections({
      certifications_skills: [
        { label: 'Certifications', details: 'OFA Level 1; TCPS 2' },
        { label: 'Skills', details: 'Power BI; GIS' }
      ]
    });

    expect(sections.certifications_skills).toEqual([
      { label: 'Certifications', details: 'OFA Level 1; TCPS 2' },
      { label: 'Skills', details: 'Power BI; GIS' }
    ]);
  });

  it('keeps experience, publication, bullet and numbered shapes in custom sections', () => {
    const sections = normalizeSections({
      side_work: [{ company: 'Acme', position: 'Advisor', start_date: '2021-01' }],
      selected_papers: [{ title: 'A Paper', authors: ['Jane Doe'], journal: 'Nature' }],
      strengths: [{ bullet: 'Excellent communicator' }],
      ranked: [{ number: 'First item' }, { reversed_number: 'Last item' }]
    });

    expect(sections.side_work).toEqual([
      { company: 'Acme', position: 'Advisor', start_date: '2021-01' }
    ]);
    expect(sections.selected_papers).toEqual([
      { title: 'A Paper', authors: ['Jane Doe'], journal: 'Nature' }
    ]);
    expect(sections.strengths).toEqual([{ bullet: 'Excellent communicator' }]);
    expect(sections.ranked).toEqual([{ number: 'First item' }, { reversed_number: 'Last item' }]);
  });

  it('folds stray scalar fields into the matched shape rather than rewriting it', () => {
    const sections = normalizeSections({
      languages: [{ label: 'Languages', details: 'English, Arabic', proficiency: 'Native' }],
      side_work: [{ company: 'Acme', position: 'Advisor', course_level: 'Graduate' }]
    });

    expect(sections.languages).toEqual([
      { label: 'Languages', details: 'English, Arabic · proficiency: Native' }
    ]);
    expect(sections.side_work).toEqual([
      { company: 'Acme', position: 'Advisor', summary: 'course level: Graduate' }
    ]);
  });

  it('still coerces entries that match no RenderCV shape into a normal entry', () => {
    const sections = normalizeSections({
      committees: [{ committee: 'Ethics Board', term: '2021-2023' }]
    });

    expect(sections.committees).toEqual([
      { name: 'Ethics Board', summary: 'term: 2021-2023' }
    ]);
  });

  it('leaves nested and list values intact when folding stray fields', () => {
    const sections = normalizeSections({
      projects: [
        {
          name: 'Campus Hub',
          highlights: ['Next.js', 'React'],
          repository: 'github.com/example/campus-hub'
        }
      ]
    });

    expect(sections.projects).toEqual([
      {
        name: 'Campus Hub',
        highlights: ['Next.js', 'React'],
        summary: 'repository: github.com/example/campus-hub'
      }
    ]);
  });
});
