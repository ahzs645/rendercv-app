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

  it('normalizes legacy social entries into supported social networks and custom connections', () => {
    const sections = prepareViewerSections({
      cv: `cv:
  name: Ahmad Jalil
  social:
    - network: LinkedIn
      username: ahmad-jalil-b00669197
      url: https://www.linkedin.com/in/ahmad-jalil-b00669197/
    - network: GitHub
      username: ahzs645
      url: https://github.com/ahzs645
    - network: Facebook
      username: ahzs645
      url: https://www.facebook.com/ahzs645
`,
      design: `design:
  theme: classic
`,
      locale: '',
      settings: ''
    });

    expect(sections.cv).not.toContain('social:');
    expect(sections.cv).toContain('social_networks:');
    expect(sections.cv).toContain('network: LinkedIn');
    expect(sections.cv).toContain('network: GitHub');
    expect(sections.cv).toContain('custom_connections:');
    expect(sections.cv).toContain('fontawesome_icon: facebook-f');
    expect(sections.cv).toContain('placeholder: ahzs645');
    expect(sections.cv).toContain('url: https://www.facebook.com/ahzs645');
  });

  it('coerces custom academic sections into RenderCV-safe generic entries', () => {
    const sections = prepareViewerSections({
      cv: `cv:
  sections:
    teaching:
      - course: "Digital ENAC: Putting Coding into Context"
        position: Co-teacher
        course_level: Bachelor
        organization: School of Architecture, Civil and Environmental Engineering, EPFL
        start_date: 2023
    grants:
      - name: "SAURON: Standoff Aerosol measUrement Remote Optical Network"
        role: Co-PI
        funder: Intelligence Advanced Research Projects Activity
        amount: "USD 376,932"
        start_date: 2024-01
        end_date: 2027-06
        highlights:
          - With Greg Rieker
`,
      design: `design:
  theme: classic
`,
      locale: '',
      settings: ''
    });

    expect(sections.cv).toContain('teaching:');
    expect(sections.cv).toContain('company: "Digital ENAC: Putting Coding into Context"');
    expect(sections.cv).toContain('position: Co-teacher');
    expect(sections.cv).toContain('School of Architecture, Civil and Environmental Engineering, EPFL');
    expect(sections.cv).toContain('Level: Bachelor');
    expect(sections.cv).toContain('start_date: "2023"');
    expect(sections.cv).toContain('grants:');
    expect(sections.cv).toContain('name: "SAURON: Standoff Aerosol measUrement Remote Optical Network"');
    expect(sections.cv).toContain('role: Co-PI');
    expect(sections.cv).toContain('funder: Intelligence Advanced Research Projects Activity');
    expect(sections.cv).toContain('highlights:');
  });

  it('normalizes Takahama-style nested positions and numeric publication fields for ahmadstyle', () => {
    const sections = prepareViewerSections({
      cv: `cv:
  sections:
    experience:
      - company: École Polytechnique Fédérale de Lausanne
        position: Senior Scientist
        location: Lausanne, Switzerland
        positions:
          - title: Senior Scientist
            start_date: 2020-03
            end_date: present
          - title: Assistant Professor and Head of Laboratory
            start_date: 2012-03
            end_date: 2020-02
    publications:
      - title: Unraveling ice multiplication
        authors:
          - Takahama, S.
        journal: npj Climate and Atmospheric Science
        volume: 7
        pages: "1-13"
        date: 2024
        doi: 10.1038/s41612-024-00671-9
`,
      design: `design:
  theme: ahmadstyle
`,
      locale: '',
      settings: ''
    });

    expect(sections.cv).toContain('position: RCVSPACINGSAME:Senior Scientist | March 2020 – Present');
    expect(sections.cv).toContain('company: ""');
    expect(sections.cv).toContain('position: Assistant Professor and Head of Laboratory | March 2012 – February 2020');
    expect(sections.cv).not.toContain('name: Assistant Professor and Head of Laboratory');
    expect(sections.cv).not.toContain('positions:');
    expect(sections.cv).toContain('research_publications:');
    expect(sections.cv).not.toContain('    publications:');
    expect(sections.cv).toContain('summary: "npj Climate and Atmospheric Science, 7');
    expect(sections.cv).toContain('DOI: 10.1038/s41612-024-00671-9');
    expect(sections.cv).toContain('date: "2024"');
  });
});
