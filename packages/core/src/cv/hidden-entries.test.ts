import { describe, expect, it } from 'vitest';
import YAML from 'yaml';
import {
  countHiddenEntries,
  entryFingerprint,
  filterHiddenEntriesFromCvYaml
} from './hidden-entries';

const CV = `cv:
  name: Jane Doe
  sections:
    experience:
      - company: Acme
        position: Engineer
      - company: Globex
        position: Intern
    skills:
      - Python
      - Rust
`;

describe('entryFingerprint', () => {
  it('is stable for identical content', () => {
    expect(entryFingerprint({ a: 1, b: 2 })).toBe(entryFingerprint({ a: 1, b: 2 }));
  });

  it('ignores object key order', () => {
    expect(entryFingerprint({ a: 1, b: 2 })).toBe(entryFingerprint({ b: 2, a: 1 }));
  });

  it('differs for different content', () => {
    expect(entryFingerprint('Python')).not.toBe(entryFingerprint('Rust'));
  });
});

describe('filterHiddenEntriesFromCvYaml', () => {
  it('returns the input unchanged when nothing is hidden', () => {
    expect(filterHiddenEntriesFromCvYaml(CV, undefined)).toBe(CV);
    expect(filterHiddenEntriesFromCvYaml(CV, {})).toBe(CV);
    expect(filterHiddenEntriesFromCvYaml(CV, { experience: [] })).toBe(CV);
  });

  it('removes a hidden object entry but keeps the rest', () => {
    const intern = { company: 'Globex', position: 'Intern' };
    const result = filterHiddenEntriesFromCvYaml(CV, {
      experience: [entryFingerprint(intern)]
    });
    const parsed = YAML.parse(result);
    expect(parsed.cv.sections.experience).toEqual([{ company: 'Acme', position: 'Engineer' }]);
    expect(parsed.cv.sections.skills).toEqual(['Python', 'Rust']);
  });

  it('removes a hidden string entry', () => {
    const result = filterHiddenEntriesFromCvYaml(CV, { skills: [entryFingerprint('Rust')] });
    expect(YAML.parse(result).cv.sections.skills).toEqual(['Python']);
  });

  it('is stable across reordering (fingerprint follows content, not index)', () => {
    const intern = { company: 'Globex', position: 'Intern' };
    const hidden = { experience: [entryFingerprint(intern)] };

    // Reorder the experience entries; the intern entry must still be the one hidden.
    const reordered = `cv:
  name: Jane Doe
  sections:
    experience:
      - company: Globex
        position: Intern
      - company: Acme
        position: Engineer
`;
    const result = filterHiddenEntriesFromCvYaml(reordered, hidden);
    expect(YAML.parse(result).cv.sections.experience).toEqual([
      { company: 'Acme', position: 'Engineer' }
    ]);
  });

  it('returns the input unchanged on unparseable YAML', () => {
    const broken = 'cv: [oops';
    expect(filterHiddenEntriesFromCvYaml(broken, { skills: ['abc'] })).toBe(broken);
  });
});

describe('countHiddenEntries', () => {
  it('counts across sections', () => {
    expect(countHiddenEntries(undefined)).toBe(0);
    expect(countHiddenEntries({ a: ['x', 'y'], b: ['z'] })).toBe(3);
  });
});
