import { describe, expect, it } from 'vitest';
import {
  buildSvgSectionCandidates,
  buildYamlEntrySearchTerms,
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
});
