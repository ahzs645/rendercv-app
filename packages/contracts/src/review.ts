import type { CvFileSections } from './cv';

export interface ReviewProposalPackage {
  version: 1;
  proposalId: string;
  parentProposalId?: string;
  threadId: string;
  rootFingerprint: string;
  fileName: string;
  rootBaselineSections: CvFileSections;
  proposedSections: CvFileSections;
  reviewerName: string;
  createdAt: number;
}
