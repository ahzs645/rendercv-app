import { describe, expect, it } from 'vitest';
import YAML from 'yaml';
import { normalizeCompatibilityCvYamlKeepingVisibility } from './compat-normalize';

describe('normalizeCompatibilityCvYamlKeepingVisibility', () => {
  it('keeps show: false on experience entries instead of folding it into the summary', () => {
    const cv = YAML.stringify({
      cv: {
        name: 'Ada',
        sections: {
          experience: [
            { company: 'Visible', position: 'Engineer', start_date: '2020-01' },
            { company: 'Old job', position: 'Clerk', start_date: '2019-01', show: false },
            { company: 'Typo', position: 'Volunteer', start_date: '2018-01', showing: false }
          ]
        }
      }
    });

    const experience = YAML.parse(normalizeCompatibilityCvYamlKeepingVisibility(cv)).cv.sections.experience;

    expect(experience[1].show).toBe(false);
    expect(experience[2].showing).toBe(false);
    for (const entry of experience) {
      expect(String(entry.summary ?? '')).not.toMatch(/show/);
    }
  });
});
