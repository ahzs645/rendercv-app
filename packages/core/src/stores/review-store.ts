import type { CvFileSections, ReviewProposalPackage } from '@rendercv/contracts';
import { createStore } from './store';
import { generateId } from '../utils/uuid';

export type ProposalDecision = 'accepted' | 'rejected';
export type ReviewSessionStatus = 'draft' | 'pending' | 'resolved';
export type ReviewArchiveOutcome = 'applied' | 'rejected';

export interface ReviewProposal
  extends Omit<ReviewProposalPackage, 'rootBaselineSections'> {
  decisionStates: Record<string, ProposalDecision>;
}

export interface ReviewArchiveEntry {
  archiveId: string;
  proposalId: string;
  reviewerName: string;
  resolvedAt: number;
  outcome: ReviewArchiveOutcome;
  finalSections: CvFileSections;
}

export interface MergeDraftState {
  draftFileId: string;
  basedOnProposalId?: string;
  createdAt: number;
  reviewerName?: string;
}

export interface ReviewSession {
  sessionId: string;
  threadId: string;
  linkedFileId?: string;
  baseFileName: string;
  rootBaselineSections: CvFileSections;
  rootFingerprint: string;
  status: ReviewSessionStatus;
  activeProposalId?: string;
  proposals: ReviewProposal[];
  archivedHistory: ReviewArchiveEntry[];
  mergeDraft?: MergeDraftState;
}

type ReviewStateSnapshot = {
  sessions: ReviewSession[];
};

type EnsureReviewSessionOptions = {
  linkedFileId?: string;
  baseFileName: string;
  rootBaselineSections: CvFileSections;
  threadId?: string;
};

type ImportReviewProposalOptions = {
  linkedFileId?: string;
};

type LegacyReviewCopy = {
  fileId: string;
  fileName: string;
  createdAt: number;
  rootBaselineSections: CvFileSections;
  proposedSections: CvFileSections;
};

function normalizeProposal(
  proposal: Omit<ReviewProposal, 'decisionStates'> & { decisionStates?: Record<string, ProposalDecision> }
): ReviewProposal {
  return {
    ...proposal,
    decisionStates: { ...(proposal.decisionStates ?? {}) }
  };
}

function normalizeSession(
  session: Omit<ReviewSession, 'proposals' | 'archivedHistory'> & {
    proposals?: ReviewProposal[];
    archivedHistory?: ReviewArchiveEntry[];
  }
): ReviewSession {
  return {
    ...session,
    proposals: (session.proposals ?? []).map(normalizeProposal),
    archivedHistory: [...(session.archivedHistory ?? [])]
  };
}

function stableSectionKey(sections: CvFileSections) {
  return [sections.cv, sections.design, sections.locale, sections.settings].join('\n---\n');
}

export function createReviewRootFingerprint(sections: CvFileSections) {
  const input = stableSectionKey(sections);
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `rvw_${Math.abs(hash >>> 0).toString(36)}`;
}

function isProposalDuplicate(proposals: ReviewProposal[], proposalId: string) {
  return proposals.some((proposal) => proposal.proposalId === proposalId);
}

export class ReviewStore {
  readonly #store = createStore<ReviewStateSnapshot>({ sessions: [] });

  getSnapshot() {
    return this.#store.getSnapshot();
  }

  subscribe(listener: () => void) {
    return this.#store.subscribe(listener);
  }

  hydrate(sessions: ReviewSession[] | null | undefined) {
    this.#store.setSnapshot({
      sessions: (sessions ?? []).map(normalizeSession)
    });
  }

  get sessions() {
    return this.#store.getSnapshot().sessions;
  }

  get pendingSessions() {
    return this.sessions.filter((session) => session.status !== 'resolved');
  }

  get archivedSessions() {
    return this.sessions.filter((session) => session.status === 'resolved');
  }

  getSession(sessionId: string) {
    return this.sessions.find((session) => session.sessionId === sessionId);
  }

  findByThreadId(threadId: string) {
    return this.sessions.find((session) => session.threadId === threadId);
  }

  findByLinkedFileId(linkedFileId: string) {
    return this.sessions.find((session) => session.linkedFileId === linkedFileId);
  }

  findByRootFingerprint(rootFingerprint: string) {
    return this.sessions.find((session) => session.rootFingerprint === rootFingerprint);
  }

  ensureSession(options: EnsureReviewSessionOptions) {
    const rootFingerprint = createReviewRootFingerprint(options.rootBaselineSections);
    const existing =
      (options.linkedFileId ? this.findByLinkedFileId(options.linkedFileId) : undefined) ??
      (options.threadId ? this.findByThreadId(options.threadId) : undefined) ??
      this.findByRootFingerprint(rootFingerprint);

    if (existing) {
      this.#store.update((current) => ({
        sessions: current.sessions.map((session) =>
          session.sessionId === existing.sessionId
            ? {
                ...session,
                linkedFileId: options.linkedFileId ?? session.linkedFileId,
                threadId: options.threadId ?? session.threadId,
                baseFileName: options.baseFileName || session.baseFileName
              }
            : session
        )
      }));
      return this.getSession(existing.sessionId)!;
    }

    const nextSession: ReviewSession = {
      sessionId: generateId(),
      threadId: options.threadId ?? generateId(),
      linkedFileId: options.linkedFileId,
      baseFileName: options.baseFileName,
      rootBaselineSections: options.rootBaselineSections,
      rootFingerprint,
      status: 'draft',
      proposals: [],
      archivedHistory: []
    };

    this.#store.update((current) => ({
      sessions: [nextSession, ...current.sessions]
    }));

    return nextSession;
  }

  importProposal(pkg: ReviewProposalPackage, options?: ImportReviewProposalOptions) {
    const session =
      this.findByThreadId(pkg.threadId) ??
      this.findByRootFingerprint(pkg.rootFingerprint) ??
      this.ensureSession({
        linkedFileId: options?.linkedFileId,
        baseFileName: pkg.fileName,
        rootBaselineSections: pkg.rootBaselineSections,
        threadId: pkg.threadId
      });

    const proposal = normalizeProposal({
      version: 1,
      proposalId: pkg.proposalId,
      parentProposalId: pkg.parentProposalId,
      threadId: pkg.threadId,
      rootFingerprint: pkg.rootFingerprint,
      fileName: pkg.fileName,
      proposedSections: pkg.proposedSections,
      reviewerName: pkg.reviewerName,
      createdAt: pkg.createdAt,
      decisionStates: {}
    });

    this.#store.update((current) => ({
      sessions: current.sessions.map((entry) => {
        if (entry.sessionId !== session.sessionId) {
          return entry;
        }

        const nextProposals = isProposalDuplicate(entry.proposals, proposal.proposalId)
          ? entry.proposals.map((currentProposal) =>
              currentProposal.proposalId === proposal.proposalId ? proposal : currentProposal
            )
          : [proposal, ...entry.proposals];

        return {
          ...entry,
          linkedFileId: options?.linkedFileId ?? entry.linkedFileId,
          baseFileName: pkg.fileName || entry.baseFileName,
          status: 'pending',
          activeProposalId: proposal.proposalId,
          proposals: nextProposals
        };
      })
    }));

    return this.findByThreadId(pkg.threadId)!;
  }

  createProposalPackage({
    fileName,
    proposedSections,
    reviewerName,
    linkedFileId,
    sessionId
  }: {
    fileName: string;
    proposedSections: CvFileSections;
    reviewerName: string;
    linkedFileId?: string;
    sessionId?: string;
  }) {
    const existingSession =
      (sessionId ? this.getSession(sessionId) : undefined) ??
      (linkedFileId ? this.findByLinkedFileId(linkedFileId) : undefined);

    const session =
      existingSession ??
      this.ensureSession({
        linkedFileId,
        baseFileName: fileName,
        rootBaselineSections: proposedSections
      });

    const proposalId = generateId();
    const createdAt = Date.now();

    const proposalPackage: ReviewProposalPackage = {
      version: 1,
      proposalId,
      parentProposalId: session.activeProposalId,
      threadId: session.threadId,
      rootFingerprint: session.rootFingerprint,
      fileName,
      rootBaselineSections: session.rootBaselineSections,
      proposedSections,
      reviewerName,
      createdAt
    };

    const proposal = normalizeProposal({
      ...proposalPackage,
      decisionStates: {}
    });

    this.#store.update((current) => ({
      sessions: current.sessions.map((entry) =>
        entry.sessionId === session.sessionId
          ? {
              ...entry,
              linkedFileId: linkedFileId ?? entry.linkedFileId,
              baseFileName: fileName || entry.baseFileName,
              status: 'pending',
              activeProposalId: proposalId,
              proposals: [proposal, ...entry.proposals]
            }
          : entry
      )
    }));

    return proposalPackage;
  }

  setActiveProposal(sessionId: string, proposalId: string) {
    this.#store.update((current) => ({
      sessions: current.sessions.map((session) =>
        session.sessionId === sessionId
          ? { ...session, activeProposalId: proposalId, status: 'pending' }
          : session
      )
    }));
  }

  setProposalDecision(
    sessionId: string,
    proposalId: string,
    changeId: string,
    decision: ProposalDecision
  ) {
    this.#store.update((current) => ({
      sessions: current.sessions.map((session) => {
        if (session.sessionId !== sessionId) {
          return session;
        }

        return {
          ...session,
          proposals: session.proposals.map((proposal) =>
            proposal.proposalId === proposalId
              ? {
                  ...proposal,
                  decisionStates: {
                    ...proposal.decisionStates,
                    [changeId]: decision
                  }
                }
              : proposal
          )
        };
      })
    }));
  }

  setSectionDecision(
    sessionId: string,
    proposalId: string,
    changeIds: string[],
    decision: ProposalDecision
  ) {
    this.#store.update((current) => ({
      sessions: current.sessions.map((session) => {
        if (session.sessionId !== sessionId) {
          return session;
        }

        return {
          ...session,
          proposals: session.proposals.map((proposal) => {
            if (proposal.proposalId !== proposalId) {
              return proposal;
            }

            const nextDecisionStates = { ...proposal.decisionStates };
            for (const changeId of changeIds) {
              nextDecisionStates[changeId] = decision;
            }

            return {
              ...proposal,
              decisionStates: nextDecisionStates
            };
          })
        };
      })
    }));
  }

  clearProposalDecisions(sessionId: string, proposalId: string) {
    this.#store.update((current) => ({
      sessions: current.sessions.map((session) =>
        session.sessionId === sessionId
          ? {
              ...session,
              proposals: session.proposals.map((proposal) =>
                proposal.proposalId === proposalId
                  ? { ...proposal, decisionStates: {} }
                  : proposal
              )
            }
          : session
      )
    }));
  }

  attachMergeDraft(
    sessionId: string,
    draftFileId: string,
    basedOnProposalId?: string,
    reviewerName?: string
  ) {
    this.#store.update((current) => ({
      sessions: current.sessions.map((session) =>
        session.sessionId === sessionId
          ? {
              ...session,
              mergeDraft: {
                draftFileId,
                basedOnProposalId,
                reviewerName,
                createdAt: Date.now()
              }
            }
          : session
      )
    }));
  }

  clearMergeDraft(sessionId: string) {
    this.#store.update((current) => ({
      sessions: current.sessions.map((session) =>
        session.sessionId === sessionId ? { ...session, mergeDraft: undefined } : session
      )
    }));
  }

  updateActiveProposalFromDraft(sessionId: string, proposedSections: CvFileSections, fileName: string) {
    this.#store.update((current) => ({
      sessions: current.sessions.map((session) => {
        if (session.sessionId !== sessionId || !session.activeProposalId) {
          return session;
        }

        return {
          ...session,
          baseFileName: fileName || session.baseFileName,
          proposals: session.proposals.map((proposal) =>
            proposal.proposalId === session.activeProposalId
              ? {
                  ...proposal,
                  fileName,
                  proposedSections,
                  decisionStates: {}
                }
              : proposal
          )
        };
      })
    }));
  }

  linkSessionToFile(sessionId: string, linkedFileId?: string) {
    this.#store.update((current) => ({
      sessions: current.sessions.map((session) =>
        session.sessionId === sessionId ? { ...session, linkedFileId } : session
      )
    }));
  }

  detachFile(fileId: string) {
    this.#store.update((current) => ({
      sessions: current.sessions.map((session) =>
        session.linkedFileId === fileId ? { ...session, linkedFileId: undefined } : session
      )
    }));
  }

  resolveSession(sessionId: string, finalSections: CvFileSections, outcome: ReviewArchiveOutcome) {
    this.#store.update((current) => ({
      sessions: current.sessions.map((session) => {
        if (session.sessionId !== sessionId) {
          return session;
        }

        const activeProposal = session.activeProposalId
          ? session.proposals.find((proposal) => proposal.proposalId === session.activeProposalId)
          : undefined;

        const archiveEntry: ReviewArchiveEntry | undefined = activeProposal
          ? {
              archiveId: generateId(),
              proposalId: activeProposal.proposalId,
              reviewerName: activeProposal.reviewerName,
              resolvedAt: Date.now(),
              outcome,
              finalSections
            }
          : undefined;

        return {
          ...session,
          status: 'resolved',
          activeProposalId: undefined,
          mergeDraft: undefined,
          archivedHistory: archiveEntry
            ? [archiveEntry, ...session.archivedHistory]
            : session.archivedHistory
        };
      })
    }));
  }

  reopenSession(sessionId: string, proposalId?: string) {
    this.#store.update((current) => ({
      sessions: current.sessions.map((session) =>
        session.sessionId === sessionId
          ? {
              ...session,
              status: 'pending',
              activeProposalId:
                proposalId ??
                session.activeProposalId ??
                session.proposals[0]?.proposalId
            }
          : session
      )
    }));
  }

  migrateLegacyReviewCopy(legacy: LegacyReviewCopy) {
    const existing = this.findByLinkedFileId(legacy.fileId);
    if (existing?.proposals.length) {
      return existing;
    }

    const session = this.ensureSession({
      linkedFileId: legacy.fileId,
      baseFileName: legacy.fileName,
      rootBaselineSections: legacy.rootBaselineSections
    });

    const proposalId = generateId();
    const proposal = normalizeProposal({
      version: 1,
      proposalId,
      threadId: session.threadId,
      rootFingerprint: session.rootFingerprint,
      fileName: legacy.fileName,
      proposedSections: legacy.proposedSections,
      reviewerName: 'Legacy review',
      createdAt: legacy.createdAt,
      decisionStates: {}
    });

    this.#store.update((current) => ({
      sessions: current.sessions.map((entry) =>
        entry.sessionId === session.sessionId
          ? {
              ...entry,
              status: 'pending',
              activeProposalId: proposalId,
              proposals: entry.proposals.length ? entry.proposals : [proposal]
            }
          : entry
      )
    }));

    return this.getSession(session.sessionId)!;
  }
}

export const reviewStore = new ReviewStore();
