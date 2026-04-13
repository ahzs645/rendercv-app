import { describe, expect, it } from 'vitest';
import { prepareViewerSections } from './viewer-sections';

describe('prepareViewerSections', () => {
  it('hides archived-tagged entries by default', () => {
    const sections = prepareViewerSections({
      cv: `cv:
  sections:
    experience:
      - company: Active Company
        position: Active Role
      - company: Archived Company
        position: Archived Role
        tags: [archived]
`,
      design: `design:
  theme: classic
`,
      locale: '',
      settings: ''
    });

    expect(sections.cv).toContain('company: Active Company');
    expect(sections.cv).not.toContain('company: Archived Company');
    expect(sections.cv).not.toContain('tags:');
  });

  it('shows archived-tagged entries when archived is explicitly selected', () => {
    const sections = prepareViewerSections(
      {
        cv: `cv:
  sections:
    experience:
      - company: Active Company
        position: Active Role
      - company: Archived Company
        position: Archived Role
        tags: [archived]
`,
        design: `design:
  theme: classic
`,
        locale: '',
        settings: ''
      },
      { tags: ['archived'] }
    );

    expect(sections.cv).toContain('company: Active Company');
    expect(sections.cv).toContain('company: Archived Company');
    expect(sections.cv).not.toContain('tags:');
  });

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
    expect(sections.cv).toContain('position: Research Assistant');
    expect(sections.cv).toContain('position: Student Research Assistant');
    expect(sections.cv).not.toContain('Research Assistant | September 2022 – Present');
    expect(sections.cv).not.toContain('Student Research Assistant | November 2020 – September 2022');
  });

  it('repairs leaked inline position dates for non-ahmad themes', () => {
    const sections = prepareViewerSections({
      cv: `cv:
  sections:
    experience:
      - company: Northern Analytical Laboratory Services
        position: Research Assistant | September 2022 – Present
        start_date: 2020-11
        end_date: present
      - company: ""
        position: Student Research Assistant | November 2020 – September 2022
        start_date: 2020-11
        end_date: 2022-09
`,
      design: `design:
  theme: classic
`,
      locale: '',
      settings: ''
    });

    expect(sections.cv).toContain('position: Research Assistant');
    expect(sections.cv).not.toContain('position: Research Assistant | September 2022 – Present');
    expect(sections.cv).toContain('start_date: 2022-09');
    expect(sections.cv).toContain('end_date: present');
    expect(sections.cv).toContain('position: Student Research Assistant');
    expect(sections.cv).not.toContain('position: Student Research Assistant | November 2020 – September 2022');
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

  it('normalizes common top-level aliases like linkedin and address', () => {
    const sections = prepareViewerSections({
      cv: `cv:
  name: Amir Etminanrad
  location: Prince George, BC
  linkedin: linkedin.com/in/amiretminanrad
  address: 3333 University Way, Prince George, BC
`,
      design: `design:
  theme: classic
`,
      locale: '',
      settings: ''
    });

    expect(sections.cv).not.toContain('linkedin:');
    expect(sections.cv).not.toContain('address:');
    expect(sections.cv).toContain('social_networks:');
    expect(sections.cv).toContain('network: LinkedIn');
    expect(sections.cv).toContain('username: amiretminanrad');
    expect(sections.cv).toContain('custom_connections:');
    expect(sections.cv).toContain('fontawesome_icon: location-dot');
    expect(sections.cv).toContain('placeholder: 3333 University Way, Prince George, BC');
  });
});
