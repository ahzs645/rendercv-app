import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Download, GitCompareArrows, Pencil, Send, X } from 'lucide-react';
import YAML from 'yaml';
import {
  fileStore,
  preferencesStore,
  readLocaleName,
  readThemeName,
  reviewStore
} from '@rendercv/core';
import { toast } from 'sonner';
import type { CvFileSections } from '@rendercv/contracts';
import { applyAcceptedReviewChanges, computeReviewSectionChanges } from '../features/review/review-diff';
import { ReviewerNameDialog } from '../features/review/reviewer-name-dialog';
import {
  buildReviewProposalUrl,
  exportReviewHistoryFile,
  exportReviewProposalPackage,
  ReviewProposalTooLargeError
} from '../features/review/package-utils';
import { buildProposalPackageFromSession } from '../features/review/session-utils';
import { PreviewPane } from '../ui/preview-pane';
import { useStore } from '../lib/use-store';

export function ReviewSessionPage() {
  const { sessionId = '' } = useParams();
  const navigate = useNavigate();
  const reviewSnapshot = useStore(reviewStore);
  const preferences = useStore(preferencesStore);
  const fileSnapshot = useStore(fileStore);
  const session = reviewSnapshot.sessions.find((entry) => entry.sessionId === sessionId);
  const activeProposal = session?.proposals.find((entry) => entry.proposalId === session?.activeProposalId);
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [nameAction, setNameAction] = useState<'forward' | null>(null);

  const reviewChanges = useMemo(
    () =>
      session && activeProposal
        ? computeReviewSectionChanges(session.rootBaselineSections, activeProposal.proposedSections)
        : [],
    [activeProposal, session]
  );

  const mergedSections = useMemo(() => {
    if (!session || !activeProposal) {
      return undefined;
    }

    return applyAcceptedReviewChanges(
      session.rootBaselineSections,
      reviewChanges,
      activeProposal.decisionStates
    );
  }, [activeProposal, reviewChanges, session]);

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sidebar px-6">
        <div className="w-full max-w-xl rounded-3xl border border-border bg-background p-8 shadow-2xl">
          <h1 className="text-xl font-semibold text-foreground">Review not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The requested local review session is not available in this browser session.
          </p>
          <button
            className="mt-6 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={() => navigate('/')}
            type="button"
          >
            Back to workspace
          </button>
        </div>
      </div>
    );
  }

  const currentSession = session;

  const totalCount = reviewChanges.reduce((sum, section) => sum + section.changes.length, 0);
  const currentChangeIds = new Set(
    reviewChanges.flatMap((section) => section.changes.map((change) => change.id))
  );
  const currentDecisions = activeProposal
    ? Object.entries(activeProposal.decisionStates).filter(([changeId]) => currentChangeIds.has(changeId))
    : [];
  const acceptedCount = currentDecisions.filter(([, value]) => value === 'accepted').length;
  const rejectedCount = currentDecisions.filter(([, value]) => value === 'rejected').length;
  const pendingCount = totalCount - acceptedCount - rejectedCount;
  const resolveLabel =
    acceptedCount > 0
      ? `Apply ${acceptedCount} accepted change${acceptedCount === 1 ? '' : 's'}`
      : 'Reject proposal';
  const resolveHelpText =
    pendingCount > 0
      ? `${pendingCount} pending change${pendingCount === 1 ? '' : 's'} will stay unchanged.`
      : acceptedCount > 0
        ? 'All rejected changes will stay unchanged.'
        : 'No accepted changes will be applied.';

  function buildTargetSections() {
    return mergedSections ?? currentSession.rootBaselineSections;
  }

  function createFileFromSections(fileName: string, sections: CvFileSections) {
    const nextTheme = readThemeName(sections.design) ?? 'classic';
    const nextLocale = readLocaleName(sections.locale) ?? 'english';
    return fileStore.createFile(fileStore.uniqueName(fileName), {
      cv: sections.cv,
      settings: sections.settings,
      designs: { [nextTheme]: sections.design },
      locales: { [nextLocale]: sections.locale },
      selectedTheme: nextTheme,
      selectedLocale: nextLocale
    });
  }

  function handleResolveReview() {
    if (
      acceptedCount === 0 &&
      !window.confirm('Reject this proposal? None of the proposed changes will be applied to your resume.')
    ) {
      return;
    }

    const finalSections = buildTargetSections();
    const outcome = acceptedCount > 0 ? 'applied' : 'rejected';
    const linkedFile = currentSession.linkedFileId
      ? fileSnapshot.files.find((file) => file.id === currentSession.linkedFileId)
      : undefined;

    let targetFileId = linkedFile?.id;
    if (linkedFile) {
      fileStore.replaceFileSections(linkedFile.id, finalSections);
    } else {
      const nextFile = createFileFromSections(currentSession.baseFileName, finalSections);
      targetFileId = nextFile.id;
      reviewStore.linkSessionToFile(currentSession.sessionId, nextFile.id);
    }

    reviewStore.resolveSession(currentSession.sessionId, finalSections, outcome);

    if (targetFileId) {
      fileStore.selectFile(targetFileId);
    }

    toast.success(outcome === 'applied' ? 'Review applied to resume.' : 'Review marked as rejected.');
    navigate('/');
  }

  function handleEditFurther() {
    if (!activeProposal || !mergedSections) {
      return;
    }

    const existingDraft =
      currentSession.mergeDraft?.draftFileId
        ? fileSnapshot.files.find((file) => file.id === currentSession.mergeDraft?.draftFileId)
        : undefined;

    if (existingDraft) {
      fileStore.selectFile(existingDraft.id);
      navigate('/');
      return;
    }

    const draftFile = createFileFromSections(`${currentSession.baseFileName} (Merge Draft)`, mergedSections);
    reviewStore.attachMergeDraft(
      currentSession.sessionId,
      draftFile.id,
      activeProposal.proposalId,
      activeProposal.reviewerName
    );
    fileStore.selectFile(draftFile.id);
    navigate('/');
  }

  async function handleForwardProposal(reviewerName: string) {
    if (!activeProposal) {
      return;
    }

    preferencesStore.patch({ reviewDisplayName: reviewerName });
    const proposalPackage = reviewStore.createProposalPackage({
      sessionId: currentSession.sessionId,
      linkedFileId: currentSession.linkedFileId,
      fileName: activeProposal.fileName,
      proposedSections: activeProposal.proposedSections,
      reviewerName
    });

    try {
      const url = await buildReviewProposalUrl(proposalPackage);
      await navigator.clipboard.writeText(url);
      toast.success('Review proposal link copied.');
    } catch (error) {
      if (error instanceof ReviewProposalTooLargeError) {
        await exportReviewProposalPackage(proposalPackage);
        toast.warning('Proposal was too large for a link, so a review package file was downloaded instead.');
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to create review proposal.');
      }
    } finally {
      setNameDialogOpen(false);
      setNameAction(null);
    }
  }

  async function handleExportActiveProposal() {
    if (!activeProposal) {
      return;
    }

    const proposalPackage = buildProposalPackageFromSession(currentSession.sessionId, activeProposal.proposalId);
    if (!proposalPackage) {
      toast.error('Active proposal is no longer available.');
      return;
    }

    await exportReviewProposalPackage(proposalPackage);
    toast.success('Review proposal package downloaded.');
  }

  async function handleExportHistory() {
    await exportReviewHistoryFile(
        {
          session: currentSession
        },
      `${currentSession.baseFileName}-review-history`
    );
    toast.success('Review history downloaded.');
  }

  return (
    <div className="min-h-screen bg-sidebar">
      <Helmet>
        <title>{currentSession.baseFileName} Review | RenderCV</title>
      </Helmet>
      <div className="border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-4 sm:px-6">
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={() => navigate('/')}
            type="button"
          >
            <ArrowLeft className="size-4" />
            Workspace
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold text-foreground">{currentSession.baseFileName}</h1>
            <p className="text-sm text-muted-foreground">
              {activeProposal
                ? `${activeProposal.reviewerName} proposed ${totalCount} change${totalCount === 1 ? '' : 's'}.`
                : 'This review session is resolved locally.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill label="Accepted" value={acceptedCount} tone="success" />
            <StatusPill label="Rejected" value={rejectedCount} tone="danger" />
            <StatusPill label="Pending" value={pendingCount} tone="default" />
            {activeProposal ? (
              <>
                <button
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  onClick={handleExportActiveProposal}
                  type="button"
                >
                  <Download className="size-4" />
                  Export proposal
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  onClick={() => {
                    setNameAction('forward');
                    setNameDialogOpen(true);
                  }}
                  type="button"
                >
                  <Send className="size-4" />
                  Forward proposal
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  onClick={handleEditFurther}
                  type="button"
                >
                  <Pencil className="size-4" />
                  Edit further
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  onClick={handleResolveReview}
                  type="button"
                >
                  <Check className="size-4" />
                  {resolveLabel}
                </button>
              </>
            ) : null}
            {currentSession.archivedHistory.length > 0 ? (
              <button
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={handleExportHistory}
                type="button"
              >
                <Download className="size-4" />
                Export history
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1600px] min-h-[calc(100vh-84px)] flex-col gap-4 px-4 py-4 sm:px-6 lg:grid lg:grid-cols-[26rem_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-border bg-background">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <GitCompareArrows className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Change review</h2>
          </div>
          {activeProposal && currentSession.proposals.length > 1 ? (
            <div className="border-b border-border px-5 py-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Proposals in this review
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {currentSession.proposals.map((proposal) => {
                  const isActive = proposal.proposalId === activeProposal.proposalId;
                  return (
                    <button
                      key={proposal.proposalId}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        isActive
                          ? 'border-primary/40 bg-primary/10 text-primary'
                          : 'border-border text-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                      onClick={() =>
                        reviewStore.setActiveProposal(currentSession.sessionId, proposal.proposalId)
                      }
                      type="button"
                    >
                      {proposal.reviewerName}
                      <span className={`ml-1.5 ${isActive ? 'text-primary/70' : 'text-muted-foreground'}`}>
                        {new Date(proposal.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          {activeProposal ? (
            <div className="px-5 py-4 lg:max-h-[calc(100vh-10rem)] lg:overflow-auto">
              <div className="mb-4 rounded-2xl border border-border bg-muted/30 px-4 py-3 text-xs leading-5 text-muted-foreground">
                Accept the changes you want to apply. Rejected and pending changes keep the original resume values when you finish.
                <span className="mt-1 block font-medium text-foreground">{resolveHelpText}</span>
              </div>
              {totalCount === 0 ? (
                <div className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                  This proposal matches your original resume — there is nothing to accept or reject.
                </div>
              ) : null}
              <div className="space-y-5">
                {reviewChanges.filter((section) => section.changes.length > 0).map((section) => (
                  <section key={section.key} className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{section.label}</h3>
                        <p className="text-xs text-muted-foreground">
                          {section.changes.length} change{section.changes.length === 1 ? '' : 's'}
                        </p>
                      </div>
                      {section.changes.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <button
                            className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                            onClick={() =>
                              reviewStore.setSectionDecision(
                                currentSession.sessionId,
                                activeProposal.proposalId,
                                section.changes.map((change) => change.id),
                                'accepted'
                              )
                            }
                            type="button"
                          >
                            Accept all
                          </button>
                          <button
                            className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                            onClick={() =>
                              reviewStore.setSectionDecision(
                                currentSession.sessionId,
                                activeProposal.proposalId,
                                section.changes.map((change) => change.id),
                                'rejected'
                              )
                            }
                            type="button"
                          >
                            Reject all
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <div className="space-y-3">
                      {section.changes.length ? (
                        section.changes.map((change) => {
                          const decision = activeProposal.decisionStates[change.id];
                          return (
                            <article
                              key={change.id}
                              className="rounded-2xl border border-border bg-card px-4 py-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-foreground">{change.label}</p>
                                  {change.entryLabel ? (
                                    <p className="truncate text-xs text-muted-foreground">{change.entryLabel}</p>
                                  ) : change.detail ? (
                                    <p className="truncate text-xs text-muted-foreground">{change.detail}</p>
                                  ) : null}
                                </div>
                                <DecisionBadge decision={decision} />
                              </div>
                              <div className="mt-3 grid gap-3 md:grid-cols-2">
                                <ValueCard
                                  title="Original"
                                  tone="base"
                                  value={change.baselineValue}
                                />
                                <ValueCard
                                  title="Proposed"
                                  tone="proposal"
                                  value={change.proposedValue}
                                />
                              </div>
                              <div className="mt-3 flex items-center justify-end gap-2">
                                <button
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                                  onClick={() =>
                                    reviewStore.setProposalDecision(
                                      currentSession.sessionId,
                                      activeProposal.proposalId,
                                      change.id,
                                      'rejected'
                                    )
                                  }
                                  type="button"
                                >
                                  <X className="size-3.5" />
                                  Reject
                                </button>
                                <button
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                                  onClick={() =>
                                    reviewStore.setProposalDecision(
                                      currentSession.sessionId,
                                      activeProposal.proposalId,
                                      change.id,
                                      'accepted'
                                    )
                                  }
                                  type="button"
                                >
                                  <Check className="size-3.5" />
                                  Accept
                                </button>
                              </div>
                            </article>
                          );
                        })
                      ) : (
                        <div className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                          No changes in this section.
                        </div>
                      )}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          ) : (
            <div className="px-5 py-6">
              <p className="text-sm text-muted-foreground">
                This review has been resolved. The proposal history remains available locally in this
                browser session.
              </p>
              {currentSession.proposals.length > 0 ? (
                <button
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  onClick={() => reviewStore.reopenSession(currentSession.sessionId)}
                  type="button"
                >
                  <GitCompareArrows className="size-4" />
                  Reopen review
                </button>
              ) : null}
            </div>
          )}
        </aside>

        <div className="grid min-h-0 gap-4 xl:grid-cols-2">
          <div className="min-h-[28rem] rounded-3xl border border-border bg-background p-4">
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-foreground">Original resume</h2>
              <p className="text-xs text-muted-foreground">
                The unchanged baseline used for every accept or reject decision.
              </p>
            </div>
            <div className="h-[calc(100%-3rem)]">
              <PreviewPane
                fileName={`${currentSession.baseFileName} (Base)`}
                sections={currentSession.rootBaselineSections}
                showHeader={false}
                controls={{ downloadPdf: false, downloadTypst: false, popup: false }}
              />
            </div>
          </div>
          <div className="min-h-[28rem] rounded-3xl border border-border bg-background p-4">
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-foreground">Proposed resume</h2>
              <p className="text-xs text-muted-foreground">
                The resume with the active reviewer proposal applied.
              </p>
            </div>
            <div className="h-[calc(100%-3rem)]">
              <PreviewPane
                fileName={activeProposal?.fileName ?? `${currentSession.baseFileName} (Proposal)`}
                sections={activeProposal?.proposedSections ?? currentSession.rootBaselineSections}
                showHeader={false}
                controls={{ downloadPdf: false, downloadTypst: false, popup: false }}
              />
            </div>
          </div>
        </div>
      </div>

      <ReviewerNameDialog
        confirmLabel={nameAction === 'forward' ? 'Forward proposal' : 'Continue'}
        description="Add the name that should appear on the forwarded review proposal."
        initialName={preferences.reviewDisplayName}
        onConfirm={(name) => void handleForwardProposal(name)}
        onOpenChange={(open) => {
          setNameDialogOpen(open);
          if (!open) {
            setNameAction(null);
          }
        }}
        open={nameDialogOpen}
        title="Reviewer name"
      />
    </div>
  );
}

function StatusPill({
  label,
  tone,
  value
}: {
  label: string;
  tone: 'default' | 'success' | 'danger';
  value: number;
}) {
  const classes =
    tone === 'success'
      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
      : tone === 'danger'
        ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
        : 'bg-muted text-muted-foreground';

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${classes}`}>
      <span>{label}</span>
      <span>{value}</span>
    </span>
  );
}

function DecisionBadge({ decision }: { decision?: 'accepted' | 'rejected' }) {
  if (decision === 'accepted') {
    return (
      <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
        Accepted
      </span>
    );
  }

  if (decision === 'rejected') {
    return (
      <span className="rounded-full bg-rose-500/10 px-2.5 py-1 text-[11px] font-medium text-rose-700 dark:text-rose-300">
        Rejected
      </span>
    );
  }

  return (
    <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
      Pending
    </span>
  );
}

function formatReviewValue(value: unknown) {
  if (value === undefined) {
    return 'Not present';
  }

  if (value === null) {
    return 'null';
  }

  if (typeof value === 'string') {
    return value || '(empty string)';
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return YAML.stringify(value).trim();
}

function ValueCard({
  title,
  tone,
  value
}: {
  title: string;
  tone: 'base' | 'proposal';
  value: unknown;
}) {
  return (
    <div
      className={`rounded-xl border px-3 py-2 ${
        tone === 'base'
          ? 'border-border bg-background'
          : 'border-primary/20 bg-primary/5'
      }`}
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </p>
      <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words text-xs text-foreground">
        {formatReviewValue(value)}
      </pre>
    </div>
  );
}
