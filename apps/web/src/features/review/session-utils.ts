import type { ReviewProposalPackage } from '@rendercv/contracts';
import {
  createReviewRootFingerprint,
  fileStore,
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
    rootBaselineSections: session.rootBaselineSections,
    proposedSections: proposal.proposedSections,
    reviewerName: proposal.reviewerName,
    createdAt: proposal.createdAt
  };
}
