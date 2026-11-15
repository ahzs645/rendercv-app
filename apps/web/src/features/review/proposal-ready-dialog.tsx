import * as Dialog from '@radix-ui/react-dialog';
import { useMemo, useState } from 'react';
import { Check, Copy, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import type { ReviewProposalPackage } from '@rendercv/contracts';
import { openComments } from '@rendercv/core';
import { DialogOverlay, DialogShell } from '../../ui/dialog-shell';
import { buildReviewProposalUrl, exportReviewProposalPackage, ReviewProposalTooLargeError } from './package-utils';
import { computeReviewSectionChanges } from './review-diff';
import { buildCommentsMarkdown } from './review-comments';
import { downloadCommentsMarkdown } from './review-annotations';

export interface ProposalReadyState {
  proposal: ReviewProposalPackage;
  /** Undefined when the proposal is too large for a link. */
  url?: string;
  linkCopied: boolean;
  /** True for a proposal just created, false when reopening an earlier one. */
  created: boolean;
}

/**
 * What creating a proposal produced, and the ways to pass it on. Nothing is
 * delivered by the app: the reviewer sends the link or file themselves, so
 * the wording says "created" and "copied", never "sent".
 */
export async function prepareProposalReadyState(
  proposal: ReviewProposalPackage,
  created: boolean
): Promise<ProposalReadyState> {
  let url: string | undefined;
  try {
    url = await buildReviewProposalUrl(proposal);
  } catch (error) {
    if (!(error instanceof ReviewProposalTooLargeError)) throw error;
  }
  let linkCopied = false;
  if (url && created) {
    try {
      await navigator.clipboard.writeText(url);
      linkCopied = true;
    } catch {
      // The dialog offers Copy link again; a denied clipboard is not an error.
    }
  }
  return { proposal, url, linkCopied, created };
}

export function ProposalReadyDialog({
  onOpenChange,
  state
}: {
  onOpenChange: (open: boolean) => void;
  state: ProposalReadyState | null;
}) {
  const [copied, setCopied] = useState(false);
  const proposal = state?.proposal;
  const changeCount = useMemo(
    () =>
      proposal
        ? computeReviewSectionChanges(proposal.rootBaselineSections, proposal.proposedSections).reduce(
            (sum, section) => sum + section.changes.length,
            0
          )
        : 0,
    [proposal]
  );
  const comments = proposal?.comments ?? [];
  const open = openComments(comments).length;
  const linkCopied = copied || Boolean(state?.linkCopied);

  async function copyLink() {
    if (!state?.url) return;
    await navigator.clipboard.writeText(state.url);
    setCopied(true);
    toast.success('Proposal link copied.');
  }

  async function exportComments() {
    if (!proposal) return;
    const markdown = buildCommentsMarkdown({
      title: `${proposal.fileName} — review comments`,
      comments,
      sections: proposal.proposedSections,
      context: [
        `Reviewer: ${proposal.reviewerName}`,
        `Proposal created ${new Date(proposal.createdAt).toLocaleString()}`,
        ''
      ]
    });
    await downloadCommentsMarkdown(markdown, proposal.fileName);
  }

  const summary = [
    `${changeCount} change${changeCount === 1 ? '' : 's'}`,
    proposal?.note ? 'reviewer note included' : 'no note',
    comments.length ? `${comments.length} comment${comments.length === 1 ? '' : 's'} (${open} open)` : 'no comments'
  ].join(' · ');

  return (
    <Dialog.Root
      open={Boolean(state)}
      onOpenChange={(next) => {
        if (!next) setCopied(false);
        onOpenChange(next);
      }}
    >
      <Dialog.Portal>
        <DialogOverlay />
        <DialogShell
          bodyClassName="space-y-4"
          closeLabel="Close proposal"
          description={
            state?.created
              ? 'Your edits, note and comments are packaged. Nothing has been sent: pass the link or the file to the author yourself.'
              : 'Your latest proposal. Nothing is sent from here: pass the link or the file to the author yourself.'
          }
          footer={
            <button
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              onClick={() => onOpenChange(false)}
              type="button"
            >
              Done
            </button>
          }
          title={state?.created ? 'Proposal ready' : 'Latest proposal'}
        >
          <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3" data-testid="proposal-ready-summary">
            <p className="text-sm font-medium text-foreground">{proposal?.fileName}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{summary}</p>
            {proposal ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                By {proposal.reviewerName}, {new Date(proposal.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            {state?.url
              ? linkCopied
                ? 'Link copied to your clipboard.'
                : 'Copy the link to share it.'
              : 'This proposal is too large for a link. Export the package file and send that instead.'}
          </p>
          <div className="flex flex-wrap gap-2">
            {state?.url ? (
              <button
                className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => void copyLink()}
                type="button"
              >
                {linkCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {linkCopied ? 'Copy link again' : 'Copy link'}
              </button>
            ) : null}
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => (proposal ? void exportReviewProposalPackage(proposal) : undefined)}
              type="button"
            >
              <Download className="size-4" />
              Export package
            </button>
            {open > 0 ? (
              <button
                className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => void exportComments()}
                type="button"
              >
                <FileText className="size-4" />
                Export open comments
              </button>
            ) : null}
          </div>
        </DialogShell>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
