import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { koreanResume } from '@rendercv/core';
import { prepareViewerSections } from './viewer-sections';

const EXAMPLES = path.resolve(__dirname, '../../../../../examples/korean');

function compile(file: string) {
  const doc = YAML.parse(fs.readFileSync(path.join(EXAMPLES, file), 'utf8')) as Record<string, unknown>;
  expect(Object.keys(doc).sort()).toEqual(['cv', 'design', 'locale', 'settings']);
  const sections = prepareViewerSections({
    cv: YAML.stringify({ cv: doc.cv }),
    design: YAML.stringify({ design: doc.design }),
    locale: YAML.stringify({ locale: doc.locale }),
    settings: YAML.stringify({ settings: doc.settings })
  });
  return { doc, cv: YAML.parse(sections.cv).cv as Record<string, unknown> };
}

describe('the shipped Korean examples', () => {
  it('keeps korean-resume.yaml identical to the bundled default file', () => {
    // The two would otherwise drift, and the file people download would stop
    // matching the example they see in the app.
    const onDisk = fs.readFileSync(path.join(EXAMPLES, 'korean-resume.yaml'), 'utf8');
    const bundled =
      [koreanResume.cv, koreanResume.design, koreanResume.locale, koreanResume.settings]
        .map((part) => part.trimEnd())
        .join('\n\n') + '\n';
    expect(onDisk).toBe(bundled);
  });

  it('compiles the filled example', () => {
    const { doc, cv } = compile('korean-resume.yaml');
    expect((doc.locale as { language: string }).language).toBe('korean');
    expect(cv.name).toBe('김윤서');
    expect(cv.headline).toBe('金允誓 · Yunseo Kim');
  });

  it('compiles the blank template', () => {
    const { doc, cv } = compile('korean-resume-template.yaml');
    expect((doc.locale as { language: string }).language).toBe('korean');
    expect(cv.headline).toBe('洪吉童 · Gildong Hong');
    expect(Object.keys(cv.sections as object)).toContain('자기소개서');
  });
});
