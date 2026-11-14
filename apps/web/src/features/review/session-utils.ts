import type { ReviewProposalPackage } from '@rendercv/contracts';
import {
  createReviewRootFingerprint,
  fileStore,
  proposalBaseline,
  resolveFileSections,
  reviewStore
} from '@rendercv/core';

export function findLinkedReviewFileId(rootFingerprint: string) {
  return fileStore
    .getSnapshot()
    .files.find((file) => createReviewRootFingerprint(resolveFileSections(file)) === rootFingerprint)?.id;
}

export function importReviewProposalIntoSession(payload: ReviewProposalPackage) {
  const linkedFileId = findLinkedReviewFileId(payload.rootFingerprint);
  return reviewStore.importProposal(payload, { linkedFileId });
}

export function buildProposalPackageFromSession(
  sessionId: string,
  proposalId: string
): ReviewProposalPackage | null {
  const session = reviewStore.getSession(sessionId);
  const proposal = session?.proposals.find((entry) => entry.proposalId === proposalId);

  if (!session || !proposal) {
    return null;
  }

  return {
    version: 1,
    proposalId: proposal.proposalId,
    parentProposalId: proposal.parentProposalId,
    threadId: session.threadId,
    rootFingerprint: session.rootFingerprint,
    fileName: proposal.fileName,
    rootBaselineSections: proposalBaseline(session, proposal),
    proposedSections: proposal.proposedSections,
    reviewerName: proposal.reviewerName,
    note: proposal.note,
    createdAt: proposal.createdAt
  };
}

/**
 * Start a review of a CV someone sent you (for example as a YAML file): the CV
 * as it is now becomes the original, and later edits become the proposal.
 * Returns undefined when the file is missing or is already in a review.
 */
export function startReviewForFile(fileId: string) {
  const file = fileStore.getSnapshot().files.find((entry) => entry.id === fileId);
  if (!file || file.isReadOnly) {
    return undefined;
  }

  const existing = reviewStore.sessions.find(
    (session) => session.linkedFileId === fileId || session.mergeDraft?.draftFileId === fileId
  );
  if (existing) {
    return existing;
  }

  return reviewStore.ensureSession({
    linkedFileId: file.id,
    baseFileName: file.name,
    rootBaselineSections: resolveFileSections(file),
    role: 'reviewer'
  });
}
