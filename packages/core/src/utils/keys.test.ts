import { describe, expect, it } from 'vitest';
import { compactKeyText, toKeySlug } from './keys';

describe('toKeySlug', () => {
  it('keeps Latin behaviour exactly as before', () => {
    expect(toKeySlug('Work Experience')).toBe('work_experience');
    expect(toKeySlug('  Skills & Tools  ')).toBe('skills_tools');
    expect(toKeySlug('Projects 2024')).toBe('projects_2024');
    expect(toKeySlug('---')).toBe('');
  });

  it('keeps Korean, Han and Kana instead of erasing them', () => {
    // An ASCII-only rule returned '' here, so renaming a section to a Korean
    // title was silently discarded by every caller.
    expect(toKeySlug('자기소개서')).toBe('자기소개서');
    expect(toKeySlug('경력 사항')).toBe('경력_사항');
    expect(toKeySlug('金允誓')).toBe('金允誓');
    expect(toKeySlug('職務経歴')).toBe('職務経歴');
  });

  it('keeps accented Latin', () => {
    expect(toKeySlug('Éducation')).toBe('éducation');
  });
});

describe('compactKeyText', () => {
  it('strips separators in any script', () => {
    expect(compactKeyText('Work Experience')).toBe('WorkExperience');
    expect(compactKeyText('경력 사항 · 2024')).toBe('경력사항2024');
  });
});
