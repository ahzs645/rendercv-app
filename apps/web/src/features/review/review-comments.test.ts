import { describe, expect, it } from 'vitest';
import YAML from 'yaml';
import type { CvFileSections, ReviewComment } from '@rendercv/contracts';
import { buildCommentsMarkdown, createCommentAnchor, locateComment } from './review-comments';
import { validateReviewComments } from './package-utils';

function sections(cv: unknown): CvFileSections {
  return {
    cv: YAML.stringify({ cv }),
    design: YAML.stringify({ design: { theme: 'classic' } }),
    locale: YAML.stringify({ locale: { language: 'english' } }),
    settings: YAML.stringify({ settings: {} })
  };
}

const highlights = [
  'Clean, standardize and validate research datasets in Python',
  'Analyze regional research activity and prepare charts',
  'Develop and maintain the project website'
];
const original = sections({
  name: 'Amir',
  sections: { experience: [{ company: 'NHHR', position: 'Data Specialist', highlights }] }
});

function comment(anchor: ReviewComment['anchor'], extra: Partial<ReviewComment> = {}): ReviewComment {
  return {
    id: 'c1',
    kind: 'missing',
    anchor,
    body: 'Which records, and roughly how many?',
    author: 'Ahmad',
    createdAt: Date.UTC(2026, 10, 14),
    status: 'open',
    replies: [],
    ...extra
  };
}

describe('comment anchors', () => {
  const path = ['sections', 'experience', 0, 'highlights', 0];

  it('describes where the comment points', () => {
    const anchor = createCommentAnchor(original, 'cv', path, 'research datasets');
    expect(anchor).toMatchObject({
      quote: 'research datasets',
      text: highlights[0],
      label: 'Experience › NHHR › Highlights › item 1'
    });
    expect(locateComment(original, anchor).status).toBe('here');
  });

  it('follows its bullet when bullets are reordered', () => {
    const anchor = createCommentAnchor(original, 'cv', path, 'research datasets');
    const reordered = sections({
      name: 'Amir',
      sections: { experience: [{ company: 'NHHR', position: 'Data Specialist', highlights: [highlights[2], highlights[1], highlights[0]] }] }
    });
    expect(locateComment(reordered, anchor)).toMatchObject({
      status: 'moved',
      path: ['sections', 'experience', 0, 'highlights', 2],
      currentText: highlights[0]
    });
  });

  it('follows its text into a renamed section', () => {
    const anchor = createCommentAnchor(original, 'cv', path);
    const renamed = sections({
      name: 'Amir',
      sections: { work: [{ company: 'NHHR', position: 'Data Specialist', highlights }] }
    });
    expect(locateComment(renamed, anchor)).toMatchObject({ status: 'moved', path: ['sections', 'work', 0, 'highlights', 0] });
  });

  it('says when the text is gone', () => {
    const anchor = createCommentAnchor(original, 'cv', path);
    const removed = sections({ name: 'Amir', sections: { experience: [{ company: 'NHHR', position: 'Data Specialist', highlights: ['Something else entirely'] }] } });
    expect(locateComment(removed, anchor)).toMatchObject({ status: 'missing', currentText: highlights[0] });
  });
});

describe('comment export', () => {
  it('lists open comments by section with the current wording and the question', () => {
    const anchor = createCommentAnchor(original, 'cv', ['sections', 'experience', 0, 'highlights', 0], 'research datasets');
    const markdown = buildCommentsMarkdown({
      title: 'Amir CV — review comments',
      comments: [comment(anchor), comment(anchor, { id: 'c2', status: 'resolved', resolution: 'confirmed' })],
      sections: original
    });
    expect(markdown).toContain('## Experience');
    expect(markdown).toContain('### C01 · Missing detail — Experience › NHHR › Highlights › item 1');
    expect(markdown).toContain(`> ${highlights[0]}`);
    expect(markdown).toContain('**About:** “research datasets”');
    expect(markdown).toContain('Which records, and roughly how many?');
    expect(markdown).toContain('1 open comment of 2');
    expect(markdown).not.toContain('C02');
  });
});

describe('comment validation', () => {
  it('keeps well-formed comments and drops the rest', () => {
    const valid = comment({ section: 'cv', path: ['name'] });
    const result = validateReviewComments([
      valid,
      { ...valid, id: 'bad', anchor: { section: 'nope', path: [] } },
      { ...valid, id: 'weird', kind: 'unknown', extra: 'dropped' },
      'not a comment'
    ]);
    expect(result.map((entry) => entry.id)).toEqual(['c1', 'weird']);
    expect(result[1]).toMatchObject({ kind: 'comment' });
    expect(result[1]).not.toHaveProperty('extra');
  });
});
