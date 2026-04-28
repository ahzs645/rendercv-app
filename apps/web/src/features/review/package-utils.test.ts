import { describe, expect, it } from 'vitest';
import type { CvFileSections, ReviewProposalPackage } from '@rendercv/contracts';
import {
  buildReviewProposalUrl,
  decodeReviewProposalPackage,
  encodeReviewProposalPackage,
  ReviewProposalTooLargeError
} from './package-utils';

function makeSections(overrides?: Partial<CvFileSections>): CvFileSections {
  return {
    cv: 'cv:\n  name: John Doe\n  label: Developer',
    design: 'design:\n  theme: classic',
    locale: 'locale:\n  language: english',
    settings: 'settings:\n  pdf_size: a4',
    ...overrides
  };
}

function makeProposal(overrides?: Partial<ReviewProposalPackage>): ReviewProposalPackage {
  return {
    version: 1,
    proposalId: 'proposal-1',
    threadId: 'thread-1',
    rootFingerprint: 'rvw_123',
    fileName: 'Resume',
    rootBaselineSections: makeSections(),
    proposedSections: makeSections({
      cv: 'cv:\n  name: Jane Doe\n  label: Developer'
    }),
    reviewerName: 'Alex',
    createdAt: 1_700_000_000_000,
    ...overrides
  };
}

function makeLargeCvSection() {
  const body = Array.from({ length: 30000 }, (_, index) => {
    const left = (((index + 1) * 1_103_515_245) >>> 0).toString(36).padStart(7, '0');
    const right = (((index + 1) * 2_654_435_761) >>> 0).toString(36).padStart(7, '0');
    return `    ${left}${right}`;
  }).join('\n');

  return `cv:\n  summary: |\n${body}\n`;
}

describe('review proposal package utils', () => {
  it('round-trips encoded proposal packages', async () => {
    const payload = makeProposal();

    const token = await encodeReviewProposalPackage(payload);
    const decoded = await decodeReviewProposalPackage(token);

    expect(decoded).toEqual(payload);
  });

  it('builds review import links', async () => {
    const payload = makeProposal();

    const url = await buildReviewProposalUrl(payload);

    expect(url).toContain('/review-import#');
  });

  it('throws a typed error when the proposal is too large for a link', async () => {
    const payload = makeProposal({
      proposedSections: makeSections({
        cv: makeLargeCvSection()
      })
    });

    await expect(buildReviewProposalUrl(payload)).rejects.toBeInstanceOf(ReviewProposalTooLargeError);
  });

  it('rejects decoded proposal packages with invalid section shapes', async () => {
    const token = await encodeReviewProposalPackage({
      ...makeProposal(),
      proposedSections: { cv: 'cv:' } as never
    });

    await expect(decodeReviewProposalPackage(token)).rejects.toThrow('Invalid review proposal payload.');
  });
});
