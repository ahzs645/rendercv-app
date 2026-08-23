import { describe, expect, it } from 'vitest';
import YAML from 'yaml';
import { koreanResume } from '@rendercv/core';
import { prepareViewerSections } from './viewer-sections';
import { containsCjkText } from './fonts';
import { decodePhotoDataUri, readPhotoSource } from './photo';

describe('the bundled Korean résumé', () => {
  const compiled = prepareViewerSections({
    cv: koreanResume.cv,
    design: koreanResume.design,
    locale: koreanResume.locale,
    settings: koreanResume.settings
  });
  const cv = (YAML.parse(compiled.cv) as { cv: Record<string, unknown> }).cv;
  const sections = cv.sections as Record<string, unknown[]>;

  it('selects the Korean locale', () => {
    expect(YAML.parse(koreanResume.locale).locale.language).toBe('korean');
  });

  it('keeps its Korean text, which needs the CJK font', () => {
    expect(cv.name).toBe('김윤서');
    expect(containsCjkText(compiled.cv)).toBe(true);
  });

  it('renders the hanja and Latin names in the headline', () => {
    expect(cv.headline).toBe('金允誓 · Yunseo Kim');
  });

  it('turns the date of birth into a header connection', () => {
    expect(cv.custom_connections).toContainEqual({
      fontawesome_icon: 'cake-candles',
      placeholder: '2000-03-15',
      url: null
    });
  });

  it('turns the self-introduction prompts into entries of one type', () => {
    expect(sections.자기소개서).toContainEqual({
      name: '본인을 나타내는 단어 3가지',
      summary: '성실함, 열정, 적응력'
    });
    expect(sections.자기소개서).toContainEqual(
      expect.objectContaining({ name: '지원 동기', summary: expect.stringContaining('미디어') })
    );

    // RenderCV validates a whole section against the first entry's type.
    const shapes = new Set(sections.자기소개서.map((entry) => Object.keys(entry as object).sort().join(',')));
    expect(shapes).toEqual(new Set(['name,summary']));
  });

  it('folds employment type into the experience summary RenderCV accepts', () => {
    expect(sections.경력사항[0]).toEqual({
      company: 'FR 미디어',
      position: '영상편집자',
      start_date: '2023-11',
      end_date: '2023-12',
      highlights: ['교육용 영상 편집 및 자막 제작'],
      summary: '고용구분: 단기계약'
    });
  });

  it('carries a photo the renderer can decode without a network round trip', () => {
    const source = readPhotoSource(compiled.cv);
    expect(source).toMatch(/^data:image\/svg\+xml;base64,/);

    const photo = decodePhotoDataUri(source as string);
    expect(photo.fileName).toBe('rendercv-photo.svg');
    expect(new TextDecoder().decode(photo.bytes)).toContain('<svg');
  });
});
