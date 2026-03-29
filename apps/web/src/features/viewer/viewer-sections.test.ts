import { describe, expect, it } from 'vitest';
import { prepareViewerSections } from './viewer-sections';

describe('prepareViewerSections', () => {
  it('strips position spacing markers for non-ahmad themes', () => {
    const sections = prepareViewerSections({
      cv: `cv:
  sections:
    experience:
      - company: Northern Analytical Laboratory Services
        position: RCVSPACINGSAME:Research Assistant | September 2022 – Present
      - company: ""
        position: RCVSPACINGDIFF:Student Research Assistant | November 2020 – September 2022
`,
      design: `design:
  theme: classic
`,
      locale: '',
      settings: ''
    });

    expect(sections.cv).not.toContain('RCVSPACINGSAME:');
    expect(sections.cv).not.toContain('RCVSPACINGDIFF:');
    expect(sections.cv).toContain('Research Assistant | September 2022 – Present');
    expect(sections.cv).toContain('Student Research Assistant | November 2020 – September 2022');
  });

  it('keeps same-company spacing markers for ahmadstyle groups', () => {
    const sections = prepareViewerSections({
      cv: `cv:
  sections:
    experience:
      - company: Northern Analytical Laboratory Services
        position: RCVSPACINGSAME:Research Assistant | September 2022 – Present
      - company: ""
        position: RCVSPACINGDIFF:Student Research Assistant | November 2020 – September 2022
`,
      design: `design:
  theme: ahmadstyle
`,
      locale: '',
      settings: ''
    });

    expect(sections.cv).toContain('RCVSPACINGSAME:Research Assistant | September 2022 – Present');
    expect(sections.cv).toContain('position: Student Research Assistant | November 2020 – September 2022');
    expect(sections.cv).not.toContain('RCVSPACINGDIFF:Student Research Assistant');
  });

  it('reapplies same-company spacing markers for ahmadstyle when stored yaml is marker-free', () => {
    const sections = prepareViewerSections({
      cv: `cv:
  sections:
    experience:
      - company: Northern Analytical Laboratory Services
        position: Research Assistant | September 2022 – Present
      - company: ""
        position: Student Research Assistant | November 2020 – September 2022
`,
      design: `design:
  theme: ahmadstyle
`,
      locale: '',
      settings: ''
    });

    expect(sections.cv).toContain('RCVSPACINGSAME:Research Assistant | September 2022 – Present');
    expect(sections.cv).toContain('position: Student Research Assistant | November 2020 – September 2022');
    expect(sections.cv).not.toContain('RCVSPACINGDIFF:Student Research Assistant');
  });
});
