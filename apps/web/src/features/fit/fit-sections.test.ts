import { describe, expect, it } from 'vitest';
import {
  buildDisabledHidden,
  buildFitEntries,
  defaultFitWeights,
  listFitSections,
  mergeHidden
} from './fit-sections';
import { entryFingerprint } from '@rendercv/core';

const CV = `cv:
  name: Jane Doe
  sections:
    experience:
      - company: Acme
        position: Engineer
      - company: Globex
        position: Intern
    hobbies:
      - Chess
`;

describe('listFitSections', () => {
  it('lists sections with titles and entry counts', () => {
    expect(listFitSections(CV)).toEqual([
      { sectionKey: 'experience', title: 'Experience', entryCount: 2 },
      { sectionKey: 'hobbies', title: 'Hobbies', entryCount: 1 }
    ]);
  });

  it('returns [] for unparseable or section-less CVs', () => {
    expect(listFitSections('cv: [oops')).toEqual([]);
    expect(listFitSections('cv:\n  name: Jane\n')).toEqual([]);
  });
});

describe('defaultFitWeights', () => {
  it('defaults main sections to high and the rest to normal', () => {
    const weights = defaultFitWeights(listFitSections(CV));
    expect(weights).toEqual({ experience: 'high', hobbies: 'normal' });
  });
});

describe('buildFitEntries', () => {
  it('produces one weighted entry per section entry', () => {
    const entries = buildFitEntries(CV, { experience: 'high', hobbies: 'low' });
    expect(entries).toHaveLength(3);

    const experience = entries.filter((entry) => entry.sectionKey === 'experience');
    expect(experience.map((entry) => entry.position)).toEqual([0, 1]);
    expect(experience.every((entry) => entry.weight === 3 && !entry.pinned)).toBe(true);

    const hobbies = entries.find((entry) => entry.sectionKey === 'hobbies');
    expect(hobbies?.weight).toBe(1);
  });

  it('marks pinned sections', () => {
    const entries = buildFitEntries(CV, { experience: 'pin', hobbies: 'normal' });
    const experience = entries.filter((entry) => entry.sectionKey === 'experience');
    expect(experience.every((entry) => entry.pinned)).toBe(true);
  });

  it('excludes "off" sections from the fit candidates', () => {
    const entries = buildFitEntries(CV, { experience: 'high', hobbies: 'off' });
    expect(entries.some((entry) => entry.sectionKey === 'hobbies')).toBe(false);
    expect(entries).toHaveLength(2);
  });
});

describe('buildDisabledHidden', () => {
  it('hides every entry of sections set to "off"', () => {
    const hidden = buildDisabledHidden(CV, { experience: 'high', hobbies: 'off' });
    expect(hidden).toEqual({ hobbies: [entryFingerprint('Chess')] });
  });

  it('ignores sections that are not "off"', () => {
    expect(buildDisabledHidden(CV, { experience: 'high', hobbies: 'low' })).toEqual({});
  });
});

describe('mergeHidden', () => {
  it('merges and de-duplicates fingerprints per section', () => {
    const merged = mergeHidden({ a: ['1', '2'] }, { a: ['2', '3'], b: ['9'] });
    expect(new Set(merged.a)).toEqual(new Set(['1', '2', '3']));
    expect(merged.b).toEqual(['9']);
  });
});
