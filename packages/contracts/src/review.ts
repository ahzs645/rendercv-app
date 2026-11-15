import type { CvFileSections } from './cv';

/**
 * What a review comment asks of the author. Only `suggestion` proposes
 * wording; the others ask a question or flag something without changing the
 * CV, so accepting an edit never answers them by accident.
 */
export type ReviewCommentKind =
  | 'comment'
  | 'suggestion'
  | 'confirm'
  | 'missing'
  | 'structure'
  | 'layout';

/** Where a comment points: a field, a bullet, or a phrase inside one. */
export interface ReviewCommentAnchor {
  section: 'cv' | 'design' | 'locale' | 'settings';
  /** Path inside the section, e.g. ['sections', 'experience', 0, 'highlights', 1]. */
  path: Array<string | number>;
  /** The words the comment is about, when it is about part of the text. */
  quote?: string;
  /**
   * The whole field's text when the comment was made. Lets the comment follow
   * its bullet when bullets are moved or reworded.
   */
  text?: string;
  /** Readable location when the comment was made ("Experience › NHHR › Highlights › item 1"). */
  label?: string;
}

export interface ReviewCommentReply {
  id: string;
  author: string;
  body: string;
  createdAt: number;
}

export type ReviewCommentResolution = 'confirmed' | 'corrected' | 'not_applicable';

export interface ReviewComment {
  id: string;
  kind: ReviewCommentKind;
  anchor: ReviewCommentAnchor;
  body: string;
  /** Proposed wording, for `suggestion` comments. */
  suggestion?: string;
  author: string;
  createdAt: number;
  status: 'open' | 'resolved';
  resolution?: ReviewCommentResolution;
  replies: ReviewCommentReply[];
}

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
  /** Optional free-text note from the reviewer explaining the proposal. */
  note?: string;
  /** Comments and questions attached to particular fields. */
  comments?: ReviewComment[];
  createdAt: number;
}
