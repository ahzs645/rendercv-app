---
title: Sharing and Review
description: Share CV snapshots, PDF links, review links, and collaborator proposals.
---

The app supports two main collaboration modes: sharing snapshots and collecting review proposals.

## Share Links

A share link contains or points to the current CV state. Use it when someone needs to view or open a copy of your CV.

If the CV came from a public source URL and has not changed locally, the app may copy that source URL. If the CV has changed, the app creates an encoded snapshot link.

Encoded share links use `/share#...` and include `version`, `fileName`, and the `cv`, `design`, `locale`, and `settings` sections. Clean share links are capped at 24,000 characters.

## PDF Links

A PDF link opens a downloadable PDF generated from the shared snapshot.

Use PDF links when the recipient only needs the final document.

PDF links use `/share?dl=pdf#...`. Opening one initializes the renderer, downloads `${fileName}.pdf`, and then shows a completion message.

## Review Links

Review links include an origin snapshot so changes can be compared against your starting point.

Use review links when:

- You want edits, not just comments.
- A reviewer should propose changes safely.
- You want to merge selected proposals later.

Review proposal links use `/review-import#...` and the same 24,000 character URL cap. If a proposal is too large, the app downloads `${fileName}.rendercv.review.json` instead.

## Review Sessions

Review sessions track imported proposals and their status.

You can:

- Open active review sessions from the sidebar.
- Compare proposed changes.
- Work on merge drafts.
- Send proposals back.
- Resolve sessions when finished.
- Accept or reject individual changes.
- Accept or reject all changes in a section.
- Edit further as a merge draft.
- Forward a proposal to another reviewer.
- Export the active proposal or full review history.

## Proposal Packages

Proposal packages are file-based review artifacts. They are useful when a URL is too large or when the reviewer is sending changes through another channel.

Review package imports are limited to 4 MB. Proposal packages contain the baseline sections, proposed sections, reviewer name, thread ID, root fingerprint, proposal ID, and timestamp.

## Practical Workflow

1. Finish a draft CV.
2. Copy a review link.
3. Send it to a reviewer.
4. Import their proposal.
5. Compare changes.
6. Merge accepted edits into a draft.
7. Export the final PDF.

## Link Size Limits

Encoded URLs are convenient but not unlimited. If sharing fails because the CV is too large, use share files or proposal packages.

## Public CV Links

The file menu can make a CV public and copy `/{fileId}`. Public CV pages are backed by `GET /api/public-cv/:id`, which only returns files marked `isPublic`. The public page renders the CV preview and sets the page title to the CV name.
