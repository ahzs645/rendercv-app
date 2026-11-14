import type { CvFileSections, ReviewProposalPackage } from '@rendercv/contracts';
import { SECTION_KEYS } from '@rendercv/contracts';
import { createStore } from './store';
import { generateId } from '../utils/uuid';

export type ProposalDecision = 'accepted' | 'rejected';
export type ReviewSessionStatus = 'draft' | 'pending' | 'resolved';
export type ReviewArchiveOutcome = 'applied' | 'rejected';

export interface ReviewProposal
  extends Omit<ReviewProposalPackage, 'rootBaselineSections'> {
  decisionStates: Record<string, ProposalDecision>;
  /**
   * The version of the CV this reviewer worked from, when it differs from the
   * session's baseline (the author shared an updated version later).
   */
  rootBaselineSections?: CvFileSections;
  /** Set once the proposal has been applied or rejected; it is then read-only. */
  outcome?: ReviewArchiveOutcome;
  resolvedAt?: number;
  /** The author edited this proposal in a merge draft before applying it. */
  editedLocally?: boolean;
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

/**
 * `author`: your own CV that others review; proposals come back into it.
 * `reviewer`: a review copy of someone else's CV; you send proposals out.
 * Sessions from before roles existed have none and are treated as `author`.
 */
export type ReviewSessionRole = 'author' | 'reviewer';

export interface ReviewSession {
  sessionId: string;
  role?: ReviewSessionRole;
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
  role?: ReviewSessionRole;
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

function sectionsEqual(left: CvFileSections, right: CvFileSections) {
  return SECTION_KEYS.every((key) => left[key] === right[key]);
}

export function sessionRole(session: Pick<ReviewSession, 'role'>): ReviewSessionRole {
  return session.role ?? 'author';
}

/** The baseline a proposal's changes were computed against. */
export function proposalBaseline(session: ReviewSession, proposal: ReviewProposal) {
  return proposal.rootBaselineSections ?? session.rootBaselineSections;
}

export function pendingProposals(session: ReviewSession) {
  return session.proposals.filter((proposal) => !proposal.outcome);
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
    const role = options.role ?? 'author';
    // Only match sessions of the same role: the author's review of a CV and a
    // reviewer's copy of it share a thread id (and, in one browser, can share a
    // fingerprint), and must never be merged into one session.
    const sameRole = (session: ReviewSession) => sessionRole(session) === role;
    const existing =
      (options.linkedFileId ? this.findByLinkedFileId(options.linkedFileId) : undefined) ??
      (options.threadId
        ? this.sessions.find((session) => session.threadId === options.threadId && sameRole(session))
        : undefined) ??
      this.sessions.find(
        (session) => session.rootFingerprint === rootFingerprint && sameRole(session)
      );

    if (existing) {
      this.#store.update((current) => ({
        sessions: current.sessions.map((session) =>
          session.sessionId === existing.sessionId
            ? {
                ...session,
                role: session.role ?? options.role,
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
      role,
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
    // Proposals come back to the author: match the author's session for this
    // thread (the review link carries its id), then fall back to the CV's
    // fingerprint for links made before thread ids were shared.
    const authorSessions = this.sessions.filter((session) => sessionRole(session) === 'author');
    const matchedSession =
      authorSessions.find((session) => session.threadId === pkg.threadId) ??
      authorSessions.find((session) => session.rootFingerprint === pkg.rootFingerprint) ??
      (options?.linkedFileId
        ? authorSessions.find((session) => session.linkedFileId === options.linkedFileId)
        : undefined);

    const session =
      matchedSession ??
      this.ensureSession({
        linkedFileId: options?.linkedFileId,
        baseFileName: pkg.fileName,
        rootBaselineSections: pkg.rootBaselineSections,
        threadId: pkg.threadId,
        role: 'author'
      });

    const existing = session.proposals.find((proposal) => proposal.proposalId === pkg.proposalId);
    if (existing) {
      // Opening the same link again must not reset decisions or turn an
      // applied proposal back into new work: just show it.
      this.#store.update((current) => ({
        sessions: current.sessions.map((entry) =>
          entry.sessionId === session.sessionId
            ? {
                ...entry,
                activeProposalId: existing.proposalId,
                status: existing.outcome ? entry.status : 'pending'
              }
            : entry
        )
      }));
      return this.getSession(session.sessionId)!;
    }

    const proposal = normalizeProposal({
      version: 1,
      proposalId: pkg.proposalId,
      parentProposalId: pkg.parentProposalId,
      threadId: pkg.threadId,
      rootFingerprint: pkg.rootFingerprint,
      fileName: pkg.fileName,
      proposedSections: pkg.proposedSections,
      reviewerName: pkg.reviewerName,
      note: pkg.note,
      createdAt: pkg.createdAt,
      decisionStates: {},
      // Reviewers may have been sent different versions of the CV.
      ...(sectionsEqual(session.rootBaselineSections, pkg.rootBaselineSections)
        ? {}
        : { rootBaselineSections: pkg.rootBaselineSections })
    });

    this.#store.update((current) => ({
      sessions: current.sessions.map((entry) => {
        if (entry.sessionId !== session.sessionId) {
          return entry;
        }

        return {
          ...entry,
          linkedFileId: entry.linkedFileId ?? options?.linkedFileId,
          status: 'pending',
          activeProposalId: proposal.proposalId,
          proposals: [proposal, ...entry.proposals]
        };
      })
    }));

    // Look the session up by its own id: a proposal from a second reviewer
    // matches an existing session by root fingerprint while carrying a
    // different threadId, so a threadId lookup would come back empty.
    return this.getSession(session.sessionId)!;
  }

  createProposalPackage({
    fileName,
    proposedSections,
    reviewerName,
    note,
    linkedFileId,
    sessionId
  }: {
    fileName: string;
    proposedSections: CvFileSections;
    reviewerName: string;
    note?: string;
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
        rootBaselineSections: proposedSections,
        role: 'reviewer'
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
      ...(note?.trim() ? { note: note.trim() } : {}),
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
      sessions: current.sessions.map((session) => {
        if (session.sessionId !== sessionId) {
          return session;
        }
        // Viewing an applied or rejected proposal is reading history; only an
        // open proposal makes the review pending again.
        const proposal = session.proposals.find((entry) => entry.proposalId === proposalId);
        return {
          ...session,
          activeProposalId: proposalId,
          status: proposal && !proposal.outcome ? 'pending' : session.status
        };
      })
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

        // The draft is named "… (Merge Draft)"; keep the review's and the
        // proposal's names, and keep the reviewer's name on it, marking that
        // the author edited it.
        void fileName;
        return {
          ...session,
          proposals: session.proposals.map((proposal) =>
            proposal.proposalId === session.activeProposalId
              ? {
                  ...proposal,
                  proposedSections,
                  decisionStates: {},
                  editedLocally: true
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
        const resolvedAt = Date.now();

        const archiveEntry: ReviewArchiveEntry | undefined = activeProposal
          ? {
              archiveId: generateId(),
              proposalId: activeProposal.proposalId,
              reviewerName: activeProposal.reviewerName,
              resolvedAt,
              outcome,
              finalSections
            }
          : undefined;

        const proposals = session.proposals.map((proposal) =>
          proposal.proposalId === activeProposal?.proposalId
            ? { ...proposal, outcome, resolvedAt }
            : proposal
        );
        // Other reviewers' proposals stay open: resolving one review must not
        // hide the next one.
        const nextPending = proposals
          .filter((proposal) => !proposal.outcome)
          .sort((left, right) => right.createdAt - left.createdAt)[0];

        return {
          ...session,
          proposals,
          status: nextPending ? 'pending' : 'resolved',
          activeProposalId: nextPending?.proposalId,
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

  /**
   * Merge review sessions from a workspace backup: new sessions are added, and
   * for sessions already here only the proposals and archive entries they lack
   * are added. Nothing here is overwritten. Returns how many sessions and
   * proposals were added.
   */
  restoreSessions(sessions: ReviewSession[]) {
    let addedSessions = 0;
    let addedProposals = 0;

    this.#store.update((current) => {
      const next = [...current.sessions];
      for (const incoming of sessions) {
        if (!incoming || typeof incoming.sessionId !== 'string') continue;
        const normalized = normalizeSession(incoming);
        const index = next.findIndex((session) => session.sessionId === normalized.sessionId);
        if (index < 0) {
          next.push(normalized);
          addedSessions += 1;
          addedProposals += normalized.proposals.length;
          continue;
        }

        const existing = next[index]!;
        const knownProposals = new Set(existing.proposals.map((proposal) => proposal.proposalId));
        const knownArchive = new Set(existing.archivedHistory.map((entry) => entry.archiveId));
        const missingProposals = normalized.proposals.filter(
          (proposal) => !knownProposals.has(proposal.proposalId)
        );
        const missingArchive = normalized.archivedHistory.filter((entry) => !knownArchive.has(entry.archiveId));
        if (missingProposals.length === 0 && missingArchive.length === 0) continue;

        addedProposals += missingProposals.length;
        next[index] = {
          ...existing,
          proposals: [...existing.proposals, ...missingProposals],
          archivedHistory: [...existing.archivedHistory, ...missingArchive],
          status: missingProposals.some((proposal) => !proposal.outcome) ? 'pending' : existing.status
        };
      }
      return { sessions: next };
    });

    return { addedSessions, addedProposals };
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
