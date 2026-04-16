import { describe, expect, it } from 'vitest';
import type { CvFileSections, ReviewProposalPackage } from '@rendercv/contracts';
import { ReviewStore } from './review-store';

function makeSections(overrides?: Partial<CvFileSections>): CvFileSections {
  return {
    cv: 'cv:\n  name: John Doe\n  label: Developer',
    design: 'design:\n  theme: classic',
    locale: 'locale:\n  language: english',
    settings: 'settings:\n  pdf_size: a4',
    ...overrides
  };
}

describe('ReviewStore', () => {
  it('reuses an existing session for the same root baseline fingerprint', () => {
    const store = new ReviewStore();
    const baseline = makeSections();

    const first = store.ensureSession({
      linkedFileId: 'file-1',
      baseFileName: 'Shared Resume',
      rootBaselineSections: baseline
    });
    const second = store.ensureSession({
      baseFileName: 'Shared Resume Copy',
      rootBaselineSections: baseline
    });

    expect(second.sessionId).toBe(first.sessionId);
    expect(second.baseFileName).toBe('Shared Resume Copy');
    expect(store.sessions).toHaveLength(1);
  });

  it('creates proposal packages chained to the active proposal and preserves the root baseline', () => {
    const store = new ReviewStore();
    const baseline = makeSections();
    const session = store.ensureSession({
      linkedFileId: 'file-1',
      baseFileName: 'Resume',
      rootBaselineSections: baseline
    });

    const firstProposal = store.createProposalPackage({
      sessionId: session.sessionId,
      linkedFileId: 'file-1',
      fileName: 'Resume',
      proposedSections: makeSections({ cv: 'cv:\n  name: Jane Doe\n  label: Developer' }),
      reviewerName: 'Alex'
    });
    const secondProposal = store.createProposalPackage({
      sessionId: session.sessionId,
      linkedFileId: 'file-1',
      fileName: 'Resume',
      proposedSections: makeSections({ cv: 'cv:\n  name: Jane Doe\n  label: Staff Engineer' }),
      reviewerName: 'Blair'
    });

    const updated = store.getSession(session.sessionId)!;

    expect(firstProposal.rootBaselineSections).toEqual(baseline);
    expect(firstProposal.parentProposalId).toBeUndefined();
    expect(secondProposal.parentProposalId).toBe(firstProposal.proposalId);
    expect(updated.activeProposalId).toBe(secondProposal.proposalId);
    expect(updated.proposals).toHaveLength(2);
  });

  it('imports a proposal into the existing thread and marks the session pending', () => {
    const store = new ReviewStore();
    const baseline = makeSections();
    const session = store.ensureSession({
      linkedFileId: 'file-1',
      baseFileName: 'Resume',
      rootBaselineSections: baseline,
      threadId: 'thread-1'
    });

    const proposal: ReviewProposalPackage = {
      version: 1,
      proposalId: 'proposal-1',
      threadId: 'thread-1',
      rootFingerprint: session.rootFingerprint,
      fileName: 'Resume',
      rootBaselineSections: baseline,
      proposedSections: makeSections({ cv: 'cv:\n  name: Morgan Doe\n  label: Developer' }),
      reviewerName: 'Morgan',
      createdAt: 1_700_000_000_000
    };

    const importedSession = store.importProposal(proposal);
    const updated = store.getSession(session.sessionId)!;

    expect(importedSession.sessionId).toBe(session.sessionId);
    expect(updated.status).toBe('pending');
    expect(updated.activeProposalId).toBe('proposal-1');
    expect(updated.proposals[0]?.reviewerName).toBe('Morgan');
  });

  it('migrates legacy review copies into a pending session without losing the original baseline', () => {
    const store = new ReviewStore();
    const baseline = makeSections();
    const proposed = makeSections({ cv: 'cv:\n  name: Jane Doe\n  label: Designer' });

    const session = store.migrateLegacyReviewCopy({
      fileId: 'file-legacy',
      fileName: 'Legacy Resume',
      createdAt: 1_700_000_000_000,
      rootBaselineSections: baseline,
      proposedSections: proposed
    });

    expect(session.linkedFileId).toBe('file-legacy');
    expect(session.rootBaselineSections).toEqual(baseline);
    expect(session.status).toBe('pending');
    expect(session.proposals[0]?.proposedSections).toEqual(proposed);
    expect(session.proposals[0]?.reviewerName).toBe('Legacy review');
  });

  it('archives the active proposal when a session is resolved', () => {
    const store = new ReviewStore();
    const baseline = makeSections();
    const session = store.ensureSession({
      linkedFileId: 'file-1',
      baseFileName: 'Resume',
      rootBaselineSections: baseline
    });

    const proposal = store.createProposalPackage({
      sessionId: session.sessionId,
      linkedFileId: 'file-1',
      fileName: 'Resume',
      proposedSections: makeSections({ cv: 'cv:\n  name: Jane Doe\n  label: Developer' }),
      reviewerName: 'Alex'
    });

    store.attachMergeDraft(session.sessionId, 'draft-1', proposal.proposalId, 'Alex');
    store.resolveSession(
      session.sessionId,
      makeSections({ cv: 'cv:\n  name: Jane Doe\n  label: Developer' }),
      'applied'
    );

    const resolved = store.getSession(session.sessionId)!;

    expect(resolved.status).toBe('resolved');
    expect(resolved.activeProposalId).toBeUndefined();
    expect(resolved.mergeDraft).toBeUndefined();
    expect(resolved.archivedHistory[0]).toMatchObject({
      proposalId: proposal.proposalId,
      reviewerName: 'Alex',
      outcome: 'applied'
    });
  });
});
