import { describe, expect, it } from 'vitest';
import { applyResumePatch } from './resume-tools';

describe('applyResumePatch', () => {
  it('applies targeted profile and nested entry edits without mutating the source', () => {
    const source = {
      cv: {
        name: 'Ada Lovelace',
        sections: {
          skills: [{ label: 'Languages', details: 'Python' }]
        }
      }
    };

    const result = applyResumePatch(source, [
      { op: 'replace', path: '/cv/name', value: 'Grace Hopper' },
      { op: 'replace', path: '/cv/sections/skills/0/details', value: 'COBOL' },
      { op: 'add', path: '/cv/headline', value: 'Computer scientist' }
    ]);

    expect(result.cv?.name).toBe('Grace Hopper');
    expect(result.cv?.headline).toBe('Computer scientist');
    expect((result.cv?.sections as { skills: Array<{ details: string }> }).skills[0]?.details).toBe('COBOL');
    expect(source.cv.name).toBe('Ada Lovelace');
  });

  it('supports array append and removal', () => {
    const result = applyResumePatch(
      { cv: { sections: { highlights: ['one', 'two'] } } },
      [
        { op: 'add', path: '/cv/sections/highlights/-', value: 'three' },
        { op: 'remove', path: '/cv/sections/highlights/0' }
      ]
    );

    expect((result.cv?.sections as { highlights: string[] }).highlights).toEqual(['two', 'three']);
  });

  it('rejects edits outside the cv object and prototype-polluting paths', () => {
    expect(() =>
      applyResumePatch({ cv: {} }, [{ op: 'add', path: '/design/theme', value: 'classic' }])
    ).toThrow('within the /cv object');
    expect(() =>
      applyResumePatch({ cv: {} }, [{ op: 'add', path: '/cv/__proto__/polluted', value: true }])
    ).toThrow('forbidden segment');
  });

  it('rejects malformed write operations', () => {
    expect(() =>
      applyResumePatch({ cv: { name: 'Ada' } }, [
        { op: 'replace', path: '/cv/name' }
      ])
    ).toThrow('require a value');
  });
});
