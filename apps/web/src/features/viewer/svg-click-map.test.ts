import { describe, expect, it } from 'vitest';
import {
  buildSvgDocumentCandidates,
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
});
