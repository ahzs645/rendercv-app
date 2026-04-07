import { describe, expect, it } from 'vitest';
import {
  buildSvgDocumentCandidates,
  buildSvgPageHitZones,
  buildSvgSectionCandidates,
  buildYamlEntrySearchTerms,
  detectSvgSectionKey,
  detectSvgSectionSegment,
  detectSvgSectionHit,
  type SvgTextBox
} from './svg-click-map';

describe('svg-click-map', () => {
  it('uses rendered SVG anchor positions to keep nested experience entries distinct', () => {
    const cvYaml = `cv:
  sections:
    experience:
      - company: Northern Analytical Laboratory Services
        position: Research Assistant
      - company: ""
        position: Student Research Assistant
      - company: Relentless Pursuit Ventures
        position: Health Technology Research Analyst (Intern)
`;

    const candidates = buildSvgSectionCandidates(cvYaml, 'experience');
    expect(candidates).not.toBeNull();

    const boxes: SvgTextBox[] = [
      { text: 'Experience', topRatio: 0.077 },
      { text: 'Northern Analytical Laboratory Services', topRatio: 0.116 },
      { text: 'Research Assistant', topRatio: 0.116 },
      { text: 'Student Research Assistant', topRatio: 0.354 },
      { text: 'Relentless Pursuit Ventures', topRatio: 0.531 }
    ];

    expect(detectSvgSectionHit(boxes, candidates!, 0.09)).toEqual({ entryIndex: -1 });
    expect(detectSvgSectionHit(boxes, candidates!, 0.22)).toEqual({ entryIndex: 0 });
    expect(detectSvgSectionHit(boxes, candidates!, 0.38)).toEqual({ entryIndex: 1 });
    expect(detectSvgSectionHit(boxes, candidates!, 0.6)).toEqual({ entryIndex: 2 });
  });

  it('falls back to position text when a nested entry has no company', () => {
    const cvYaml = `cv:
  sections:
    experience:
      - company: ""
        position: Student Research Assistant
`;

    const candidates = buildSvgSectionCandidates(cvYaml, 'experience');
    expect(candidates?.entries[0]?.texts).toContain('Student Research Assistant');
    expect(buildYamlEntrySearchTerms(cvYaml, 'experience', 0)).toContain(
      'position: Student Research Assistant'
    );
  });

  it('uses visible section headings to override a wrong fallback section on later pages', () => {
    const cvYaml = `cv:
  sections:
    professional_development:
      - name: Workshop A
    awards:
      - name: Canada Graduate Scholarships
      - name: British Columbia Graduate Scholarship
`;

    const documentCandidates = buildSvgDocumentCandidates(cvYaml);
    expect(documentCandidates).not.toBeNull();

    const boxes: SvgTextBox[] = [
      { text: 'Professional Development', topRatio: 0.08 },
      { text: 'Workshop A', topRatio: 0.14 },
      { text: 'Awards', topRatio: 0.52 },
      { text: 'Canada Graduate Scholarships', topRatio: 0.58 },
      { text: 'British Columbia Graduate Scholarship', topRatio: 0.7 }
    ];

    expect(detectSvgSectionKey(boxes, documentCandidates!, 0.6)).toBe('awards');
    const awardCandidates = documentCandidates!.sections.find((section) => section.sectionKey === 'awards');
    expect(detectSvgSectionHit(boxes, awardCandidates!, 0.72)).toEqual({ entryIndex: 1 });
  });

  it('treats content above the first visible heading as a continuation of the previous section', () => {
    const cvYaml = `cv:
  sections:
    awards:
      - name: Canada Graduate Scholarships
    presentations:
      - name: AAAR 43rd Annual Conference
`;

    const documentCandidates = buildSvgDocumentCandidates(cvYaml);
    expect(documentCandidates).not.toBeNull();

    const boxes: SvgTextBox[] = [
      { text: 'Canada Graduate Scholarships', topRatio: 0.12 },
      { text: 'Presentations', topRatio: 0.45 },
      { text: 'AAAR 43rd Annual Conference', topRatio: 0.53 }
    ];

    expect(detectSvgSectionKey(boxes, documentCandidates!, 0.2)).toBe('awards');
  });

  it('does not mistake entry text containing a section title for the section heading', () => {
    const cvYaml = `cv:
  sections:
    volunteer:
      - company: Sparklab
        position: Technical Analyst
      - company: University of Northern British Columbia
        position: Research Ambassador
      - company: Northern Health
        position: Activity Volunteer
      - company: YouTube
        position: Volunteer
`;

    const candidates = buildSvgSectionCandidates(cvYaml, 'volunteer');
    expect(candidates).not.toBeNull();

    const boxes: SvgTextBox[] = [
      { text: 'Sparklab', topRatio: 0.058 },
      { text: 'Technical Analyst', topRatio: 0.058 },
      { text: 'University of Northern British Columbia', topRatio: 0.158 },
      { text: 'Research Ambassador', topRatio: 0.158 },
      { text: 'Northern Health', topRatio: 0.258 },
      { text: 'Activity Volunteer', topRatio: 0.258 },
      { text: 'YouTube', topRatio: 0.529 },
      { text: 'Volunteer', topRatio: 0.529 }
    ];

    expect(detectSvgSectionHit(boxes, candidates!, 0.088)).toEqual({ entryIndex: 0 });
    expect(detectSvgSectionHit(boxes, candidates!, 0.188)).toEqual({ entryIndex: 1 });
    expect(detectSvgSectionHit(boxes, candidates!, 0.439)).toEqual({ entryIndex: 2 });
  });

  it('includes details-style fields for sections that use label + details entries', () => {
    const cvYaml = `cv:
  sections:
    supervisory_activities:
      - label: Employees
        details: "2"
`;

    const candidates = buildSvgSectionCandidates(cvYaml, 'supervisory_activities');
    expect(candidates?.entries[0]?.texts).toContain('Employees');
    expect(candidates?.entries[0]?.texts).toContain('2');
    expect(buildYamlEntrySearchTerms(cvYaml, 'supervisory_activities', 0)).toContain('details: 2');
  });

  it('normalizes typographic punctuation when matching rendered text', () => {
    const cvYaml = `cv:
  sections:
    awards:
      - name: Lieutenant-Governor's Medal for Inclusion, Democracy and Reconciliation
`;

    const candidates = buildSvgSectionCandidates(cvYaml, 'awards');
    expect(candidates).not.toBeNull();

    const boxes: SvgTextBox[] = [
      { text: 'Awards', topRatio: 0.1 },
      { text: 'Lieutenant-Governor’s Medal for Inclusion, Democracy and Reconciliation', topRatio: 0.2 }
    ];

    expect(detectSvgSectionHit(boxes, candidates!, 0.25)).toEqual({ entryIndex: 0 });
  });

  it('infers section segments from entry anchors when a continuation page has no visible headings', () => {
    const cvYaml = `cv:
  sections:
    volunteer:
      - company: Northern Undergraduate Student Society
        position: Director at Large
      - company: YouTube
        position: Diabetes Education Video Creator and Manager
    projects:
      - name: Whisperdesk
      - name: Aethalometer Analysis
`;

    const documentCandidates = buildSvgDocumentCandidates(cvYaml);
    expect(documentCandidates).not.toBeNull();

    const boxes: SvgTextBox[] = [
      { text: 'Northern Undergraduate Student Society', topRatio: 0.41 },
      { text: 'Director at Large', topRatio: 0.41 },
      { text: 'YouTube', topRatio: 0.53 },
      { text: 'Diabetes Education Video Creator and Manager', topRatio: 0.53 },
      { text: 'Whisperdesk', topRatio: 0.76 },
      { text: 'Aethalometer Analysis', topRatio: 0.88 }
    ];

    expect(detectSvgSectionSegment(boxes, documentCandidates!, 0.44)).toEqual({
      sectionKey: 'volunteer',
      startRatio: 0,
      endRatio: 1.001
    });
    expect(detectSvgSectionSegment(boxes, documentCandidates!, 0.8)).toEqual({
      sectionKey: 'projects',
      startRatio: 0,
      endRatio: 1.001
    });
  });

  it('builds visible page hit zones from heading and entry anchors', () => {
    const cvYaml = `cv:
  sections:
    awards:
      - name: Canada Graduate Scholarships
      - name: British Columbia Graduate Scholarship
`;

    const documentCandidates = buildSvgDocumentCandidates(cvYaml);
    expect(documentCandidates).not.toBeNull();

    const boxes: SvgTextBox[] = [
      { text: 'Awards', topRatio: 0.12, bottomRatio: 0.155 },
      { text: 'Canada Graduate Scholarships', topRatio: 0.2, bottomRatio: 0.245 },
      { text: 'British Columbia Graduate Scholarship', topRatio: 0.35, bottomRatio: 0.395 }
    ];

    expect(buildSvgPageHitZones(boxes, documentCandidates!)).toEqual([
      { sectionKey: 'awards', entryIndex: -1, startRatio: 0.12, endRatio: 0.2 },
      { sectionKey: 'awards', entryIndex: 0, startRatio: 0.2, endRatio: 0.35 },
      { sectionKey: 'awards', entryIndex: 1, startRatio: 0.35, endRatio: 0.395 }
    ]);
  });

  it('builds continuation-page hit zones without a visible heading', () => {
    const cvYaml = `cv:
  sections:
    volunteer:
      - company: Northern Undergraduate Student Society
        position: Director at Large
      - company: YouTube
        position: Diabetes Education Video Creator and Manager
`;

    const documentCandidates = buildSvgDocumentCandidates(cvYaml);
    expect(documentCandidates).not.toBeNull();

    const boxes: SvgTextBox[] = [
      { text: 'Northern Undergraduate Student Society', topRatio: 0.41, bottomRatio: 0.448 },
      { text: 'Director at Large', topRatio: 0.41, bottomRatio: 0.448 },
      { text: 'YouTube', topRatio: 0.53, bottomRatio: 0.565 },
      { text: 'Diabetes Education Video Creator and Manager', topRatio: 0.53, bottomRatio: 0.565 }
    ];

    expect(buildSvgPageHitZones(boxes, documentCandidates!)).toEqual([
      { sectionKey: 'volunteer', entryIndex: -1, startRatio: 0, endRatio: 0.41 },
      { sectionKey: 'volunteer', entryIndex: 0, startRatio: 0.41, endRatio: 0.53 },
      { sectionKey: 'volunteer', entryIndex: 1, startRatio: 0.53, endRatio: 0.565 }
    ]);
  });

  it('does not return a section hit below the measured end of the section', () => {
    const cvYaml = `cv:
  sections:
    awards:
      - name: Canada Graduate Scholarships
`;

    const candidates = buildSvgSectionCandidates(cvYaml, 'awards');
    expect(candidates).not.toBeNull();

    const boxes: SvgTextBox[] = [
      { text: 'Awards', topRatio: 0.12, bottomRatio: 0.15 },
      { text: 'Canada Graduate Scholarships', topRatio: 0.2, bottomRatio: 0.24 }
    ];

    expect(
      detectSvgSectionHit(boxes, candidates!, 0.23, {
        segmentStartRatio: 0.12,
        segmentEndRatio: 1.001
      })
    ).toEqual({ entryIndex: 0 });
    expect(
      detectSvgSectionHit(boxes, candidates!, 0.3, {
        segmentStartRatio: 0.12,
        segmentEndRatio: 1.001
      })
    ).toBeNull();
  });

  it('anchors wrapped long titles from their first rendered line instead of a later summary line', () => {
    const cvYaml = `cv:
  sections:
    presentations:
      - name: "Black Carbon (BC) Measurements in Addis Ababa: Reconciling Aethalometer BC with Filter Based BC and FTIR-EC Measurements"
        summary: "AAAR 43rd Annual Conference"
      - name: "Assessing the health impacts of particulate bound metals in downtown Prince George"
        summary: "Cascadia Symposium on Environmental, Occupational, and Population Health 2024"
`;

    const documentCandidates = buildSvgDocumentCandidates(cvYaml);
    expect(documentCandidates).not.toBeNull();

    const boxes: SvgTextBox[] = [
      { text: 'Presentations', topRatio: 0.47, bottomRatio: 0.49 },
      {
        text: 'Black Carbon (BC) Measurements in Addis Ababa: Reconciling Aethalometer BC with',
        topRatio: 0.494,
        bottomRatio: 0.511
      },
      { text: 'Filter Based BC and FTIR-EC Measurements', topRatio: 0.511, bottomRatio: 0.529 },
      { text: 'AAAR 43rd Annual Conference', topRatio: 0.529, bottomRatio: 0.545 },
      {
        text: 'Assessing the health impacts of particulate bound metals in downtown Prince George',
        topRatio: 0.582,
        bottomRatio: 0.61
      }
    ];

    expect(buildSvgPageHitZones(boxes, documentCandidates!)).toEqual([
      { sectionKey: 'presentations', entryIndex: -1, startRatio: 0.47, endRatio: 0.494 },
      { sectionKey: 'presentations', entryIndex: 0, startRatio: 0.494, endRatio: 0.582 },
      { sectionKey: 'presentations', entryIndex: 1, startRatio: 0.582, endRatio: 0.61 }
    ]);
  });

  it('matches ahmadstyle uppercase headings and distorted svg text on continuation pages', () => {
    const cvYaml = `cv:
  sections:
    volunteer:
      - company: Northern Health
        position: Activity Volunteer
      - company: Northern Undergraduate Student Society
        position: Director at Large
      - company: YouTube
        position: Diabetes Education Video Creator and Manager
      - company: BC 4H
        position: Public Speaking Competition Judge
      - company: UNBC MS Student Support Club
        position: Volunteer
      - company: University of Northern British Columbia
        position: Orientation Volunteer
      - company: Northern Analytical Laboratory Services
        position: Research Assistant Volunteer
    projects:
      - name: Whisperdesk
      - name: Aethalometer Analysis
`;

    const documentCandidates = buildSvgDocumentCandidates(cvYaml);
    expect(documentCandidates).not.toBeNull();

    const boxes: SvgTextBox[] = [
      { text: 'Northern Health', topRatio: 0.04049451423413826, bottomRatio: 0.054383248993844696 },
      { text: 'April 2023 – Pre ent', topRatio: 0.04049451423413826, bottomRatio: 0.054383248993844696 },
      { text: 'Activity Volunteer', topRatio: 0.05861317027698864, bottomRatio: 0.07250213623046875 },
      { text: 'Prince George, BC', topRatio: 0.05861317027698864, bottomRatio: 0.07250213623046875 },
      {
        text: 'Northern Undergraduate Student Society',
        topRatio: 0.19246419270833334,
        bottomRatio: 0.20635315866181345
      },
      { text: 'May 2021 – May 2022', topRatio: 0.19246419270833334, bottomRatio: 0.20635315866181345 },
      { text: 'Director at Large', topRatio: 0.21058284875118372, bottomRatio: 0.22447181470466382 },
      { text: 'Prince George, BC', topRatio: 0.21058284875118372, bottomRatio: 0.22447181470466382 },
      { text: 'YouTube', topRatio: 0.3138025457208807, bottomRatio: 0.3276915116743608 },
      { text: 'April 2016 – Pre ent', topRatio: 0.3138025457208807, bottomRatio: 0.3276915116743608 },
      {
        text: 'Diabete Education Video Creator and Manager',
        topRatio: 0.3319212017637311,
        bottomRatio: 0.3458101677172112
      },
      { text: 'Remote', topRatio: 0.3319212017637311, bottomRatio: 0.3458101677172112 },
      { text: 'BC 4H', topRatio: 0.3807849306048769, bottomRatio: 0.3946736653645833 },
      { text: 'April 2022 – June 2023', topRatio: 0.3807849306048769, bottomRatio: 0.3946736653645833 },
      {
        text: 'Public Speaking Competition Judge',
        topRatio: 0.3989035866477273,
        bottomRatio: 0.4127925526012074
      },
      { text: 'Prince George, BC', topRatio: 0.3989035866477273, bottomRatio: 0.4127925526012074 },
      {
        text: 'UNBC MS Student Support Club',
        topRatio: 0.4477673154888731,
        bottomRatio: 0.46165605024857953
      },
      { text: 'March 2022 – April 2023', topRatio: 0.4477673154888731, bottomRatio: 0.46165605024857953 },
      { text: 'Volunteer', topRatio: 0.4658859715317235, bottomRatio: 0.47977470629142993 },
      { text: 'Prince George, BC', topRatio: 0.4658859715317235, bottomRatio: 0.47977470629142993 },
      {
        text: 'Univer ity of Northern Briti h Columbia',
        topRatio: 0.5147494691790957,
        bottomRatio: 0.5286384351325758
      },
      {
        text: 'September 2019 – September 2020',
        topRatio: 0.5147494691790957,
        bottomRatio: 0.5286384351325758
      },
      { text: 'Orientation Volunteer', topRatio: 0.532868125221946, bottomRatio: 0.5467570911754261 },
      { text: 'Prince George, BC', topRatio: 0.532868125221946, bottomRatio: 0.5467570911754261 },
      {
        text: 'Northern Analytical Laboratory Service',
        topRatio: 0.5998505101059423,
        bottomRatio: 0.6137394760594224
      },
      { text: 'October 2020 – May 2021', topRatio: 0.5998505101059423, bottomRatio: 0.6137394760594224 },
      {
        text: 'Re earch A i tant Volunteer',
        topRatio: 0.6179691661487926,
        bottomRatio: 0.6318581321022727
      },
      { text: 'Prince George, BC', topRatio: 0.6179691661487926, bottomRatio: 0.6318581321022727 },
      { text: 'PROJECTS', topRatio: 0.6900019790187026, bottomRatio: 0.7038909449721827 },
      { text: 'Whi perde k', topRatio: 0.7172116366299716, bottomRatio: 0.7311006025834517 },
      { text: '2024', topRatio: 0.7172116366299716, bottomRatio: 0.7311006025834517 },
      {
        text: 'Aethalometer Analy i',
        topRatio: 0.7953935102982954,
        bottomRatio: 0.8092824762517755
      },
      { text: '2024', topRatio: 0.7953935102982954, bottomRatio: 0.8092824762517755 },
      {
        text: 'Technologie - Python, Data Proce ing, Environmental Analy i',
        topRatio: 0.83415615197384,
        bottomRatio: 0.8480448867335464
      }
    ];

    expect(buildSvgPageHitZones(boxes, documentCandidates!)).toEqual([
      { sectionKey: 'volunteer', entryIndex: -1, startRatio: 0, endRatio: 0.04049451423413826 },
      {
        sectionKey: 'volunteer',
        entryIndex: 0,
        startRatio: 0.04049451423413826,
        endRatio: 0.19246419270833334
      },
      {
        sectionKey: 'volunteer',
        entryIndex: 1,
        startRatio: 0.19246419270833334,
        endRatio: 0.3138025457208807
      },
      {
        sectionKey: 'volunteer',
        entryIndex: 2,
        startRatio: 0.3138025457208807,
        endRatio: 0.3807849306048769
      },
      {
        sectionKey: 'volunteer',
        entryIndex: 3,
        startRatio: 0.3807849306048769,
        endRatio: 0.4477673154888731
      },
      {
        sectionKey: 'volunteer',
        entryIndex: 4,
        startRatio: 0.4477673154888731,
        endRatio: 0.5147494691790957
      },
      {
        sectionKey: 'volunteer',
        entryIndex: 5,
        startRatio: 0.5147494691790957,
        endRatio: 0.5998505101059423
      },
      {
        sectionKey: 'volunteer',
        entryIndex: 6,
        startRatio: 0.5998505101059423,
        endRatio: 0.6318581321022727
      },
      {
        sectionKey: 'projects',
        entryIndex: -1,
        startRatio: 0.6900019790187026,
        endRatio: 0.7172116366299716
      },
      {
        sectionKey: 'projects',
        entryIndex: 0,
        startRatio: 0.7172116366299716,
        endRatio: 0.7953935102982954
      },
      {
        sectionKey: 'projects',
        entryIndex: 1,
        startRatio: 0.7953935102982954,
        endRatio: 0.8480448867335464
      }
    ]);
  });
});
