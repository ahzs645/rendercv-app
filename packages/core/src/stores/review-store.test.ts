import { describe, expect, it } from 'vitest';
import type { CvFileSections, ReviewProposalPackage } from '@rendercv/contracts';
import { createReviewRootFingerprint, ReviewStore } from './review-store';

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

  it('imports a second reviewer proposal that matches by fingerprint but carries a new threadId', () => {
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
      proposalId: 'proposal-2',
      threadId: 'thread-2',
      rootFingerprint: session.rootFingerprint,
      fileName: 'Resume',
      rootBaselineSections: baseline,
      proposedSections: makeSections({ cv: 'cv:\n  name: Sam Doe\n  label: Developer' }),
      reviewerName: 'Sam',
      createdAt: 1_700_000_000_000
    };

    const importedSession = store.importProposal(proposal);

    expect(importedSession).toBeDefined();
    expect(importedSession.sessionId).toBe(session.sessionId);
    expect(importedSession.activeProposalId).toBe('proposal-2');
    expect(importedSession.proposals).toHaveLength(1);
    expect(store.sessions).toHaveLength(1);
  });

  it('keeps a proposal made from a different version of the CV in the thread, with its own baseline', () => {
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
      rootBaselineSections: makeSections({ cv: 'cv:\n  name: Different Baseline' }),
      proposedSections: makeSections({ cv: 'cv:\n  name: Morgan Doe\n  label: Developer' }),
      reviewerName: 'Morgan',
      createdAt: 1_700_000_000_000
    };

    const imported = store.importProposal(proposal);

    expect(imported.sessionId).toBe(session.sessionId);
    expect(imported.rootBaselineSections).toEqual(baseline);
    expect(imported.proposals[0]?.rootBaselineSections).toEqual(proposal.rootBaselineSections);
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

describe('ReviewStore multiple reviewers', () => {
  function pkg(overrides: Partial<ReviewProposalPackage>, baseline = makeSections()): ReviewProposalPackage {
    return {
      version: 1,
      proposalId: 'p',
      threadId: 'thread-1',
      rootFingerprint: createReviewRootFingerprint(baseline),
      fileName: 'Resume',
      rootBaselineSections: baseline,
      proposedSections: makeSections({ cv: 'cv:\n  name: Changed' }),
      reviewerName: 'Someone',
      createdAt: 1,
      ...overrides
    };
  }

  it('files every reviewer of a thread under the author\'s CV and keeps the others open after one is applied', () => {
    const store = new ReviewStore();
    const author = store.ensureSession({
      linkedFileId: 'file-1',
      baseFileName: 'Resume',
      rootBaselineSections: makeSections(),
      threadId: 'thread-1',
      role: 'author'
    });

    store.importProposal(pkg({ proposalId: 'jane', reviewerName: 'Jane', createdAt: 1 }));
    const both = store.importProposal(pkg({ proposalId: 'bob', reviewerName: 'Bob', createdAt: 2 }));
    expect(both.sessionId).toBe(author.sessionId);
    expect(both.linkedFileId).toBe('file-1');
    expect(both.proposals.map((proposal) => proposal.reviewerName)).toEqual(['Bob', 'Jane']);

    store.setActiveProposal(author.sessionId, 'jane');
    store.resolveSession(author.sessionId, makeSections(), 'applied');
    const afterJane = store.getSession(author.sessionId)!;
    expect(afterJane.status).toBe('pending');
    expect(afterJane.activeProposalId).toBe('bob');
    expect(afterJane.proposals.find((proposal) => proposal.proposalId === 'jane')?.outcome).toBe('applied');

    store.resolveSession(author.sessionId, makeSections(), 'rejected');
    expect(store.getSession(author.sessionId)?.status).toBe('resolved');
  });

  it('does not reset or reopen a proposal when its link is opened again', () => {
    const store = new ReviewStore();
    const session = store.importProposal(pkg({ proposalId: 'jane' }));
    store.setProposalDecision(session.sessionId, 'jane', 'change-1', 'accepted');
    store.resolveSession(session.sessionId, makeSections(), 'applied');

    const again = store.importProposal(pkg({ proposalId: 'jane' }));
    const proposal = again.proposals.find((entry) => entry.proposalId === 'jane')!;
    expect(again.status).toBe('resolved');
    expect(proposal.outcome).toBe('applied');
    expect(proposal.decisionStates).toEqual({ 'change-1': 'accepted' });
  });

  it('never merges a reviewer\'s copy into the author\'s session for the same thread', () => {
    const store = new ReviewStore();
    const author = store.ensureSession({
      linkedFileId: 'own-cv',
      baseFileName: 'Resume',
      rootBaselineSections: makeSections(),
      threadId: 'thread-1',
      role: 'author'
    });
    const reviewer = store.ensureSession({
      linkedFileId: 'review-copy',
      baseFileName: 'Resume',
      rootBaselineSections: makeSections(),
      threadId: 'thread-1',
      role: 'reviewer'
    });

    expect(reviewer.sessionId).not.toBe(author.sessionId);
    expect(store.getSession(author.sessionId)?.linkedFileId).toBe('own-cv');
  });
});

describe('ReviewStore.restoreSessions', () => {
  it('adds missing sessions and proposals without overwriting what is already here', () => {
    const backup = new ReviewStore();
    const session = backup.importProposal({
      version: 1,
      proposalId: 'jane',
      threadId: 'thread-1',
      rootFingerprint: createReviewRootFingerprint(makeSections()),
      fileName: 'Resume',
      rootBaselineSections: makeSections(),
      proposedSections: makeSections({ cv: 'cv:\n  name: Jane edit' }),
      reviewerName: 'Jane',
      note: 'Looks good',
      createdAt: 1
    });
    const snapshot = structuredClone(backup.sessions);

    const fresh = new ReviewStore();
    expect(fresh.restoreSessions(snapshot)).toEqual({ addedSessions: 1, addedProposals: 1 });
    expect(fresh.getSession(session.sessionId)?.proposals[0]?.note).toBe('Looks good');

    // Restoring again changes nothing, and a local decision survives it.
    fresh.setProposalDecision(session.sessionId, 'jane', 'change-1', 'rejected');
    expect(fresh.restoreSessions(snapshot)).toEqual({ addedSessions: 0, addedProposals: 0 });
    expect(fresh.getSession(session.sessionId)?.proposals[0]?.decisionStates).toEqual({ 'change-1': 'rejected' });
  });
});
