import { SvelteMap } from 'svelte/reactivity';
import type { SectionKey } from '$lib/features/cv-files/types';

/** Line change shape matching Monaco's ILineChange */
export interface LineChange {
  originalStartLineNumber: number;
  originalEndLineNumber: number;
  modifiedStartLineNumber: number;
  modifiedEndLineNumber: number;
}

interface ReviewSnapshot {
  section: SectionKey;
  fileContent: string;
  proposedContent: string;
}

export class ReviewState {
  /** AI-proposed content per section (fileState stays untouched until user accepts) */
  proposed = $state<Map<SectionKey, string>>(new SvelteMap());

  /** Undo stack for per-action undo during review */
  private history: ReviewSnapshot[] = [];

  get hasReview(): boolean {
    return this.proposed.size > 0;
  }

  get canUndoReview(): boolean {
    return this.history.length > 0;
  }

  /** Store proposed content for a section. Overwrites if already set (stacking edits). */
  setProposed(section: SectionKey, content: string): void {
    this.proposed.set(section, content);
  }

  /** Get proposed content for a section. */
  getProposed(section: SectionKey): string | undefined {
    return this.proposed.get(section);
  }

  /** Snapshot current state before an action so it can be undone. */
  pushSnapshot(section: SectionKey, fileContent: string, proposedContent: string): void {
    this.history.push({ section, fileContent, proposedContent });
  }

  /** Pop and return the last snapshot, or undefined if stack is empty. */
  popSnapshot(): ReviewSnapshot | undefined {
    return this.history.pop();
  }

  /**
   * Undo a single change: revert those lines in proposed content back to the original (fileState).
   * Only mutates proposed — fileState stays untouched.
   */
  undoChange(section: SectionKey, change: LineChange, getOriginalContent: () => string): void {
    const proposedContent = this.proposed.get(section);
    if (proposedContent === undefined) return;

    const proposedLines = proposedContent.split('\n');
    const originalLines = getOriginalContent().split('\n');

    // Extract the original lines for this change
    const origSlice =
      change.originalEndLineNumber === 0
        ? [] // pure insertion (no original lines)
        : originalLines.slice(change.originalStartLineNumber - 1, change.originalEndLineNumber);

    // Replace modified lines in proposed with original lines
    const modStart =
      change.modifiedEndLineNumber === 0
        ? change.modifiedStartLineNumber // pure deletion: startLine is already the anchor
        : change.modifiedStartLineNumber - 1; // normal: convert 1-based to 0-based
    const modCount =
      change.modifiedEndLineNumber === 0
        ? 0 // pure deletion (no modified lines to remove)
        : change.modifiedEndLineNumber - change.modifiedStartLineNumber + 1;

    proposedLines.splice(modStart, modCount, ...origSlice);
    this.proposed.set(section, proposedLines.join('\n'));
  }

  /**
   * Keep a single change: apply those lines from proposed into the original (fileState).
   * Calls setContent to persist the accepted lines.
   */
  keepChange(
    section: SectionKey,
    change: LineChange,
    getOriginalContent: () => string,
    setContent: (content: string) => void
  ): void {
    const proposedContent = this.proposed.get(section);
    if (proposedContent === undefined) return;

    const proposedLines = proposedContent.split('\n');
    const originalLines = getOriginalContent().split('\n');

    // Extract the modified (proposed) lines for this change
    const modSlice =
      change.modifiedEndLineNumber === 0
        ? [] // pure deletion (no modified lines)
        : proposedLines.slice(change.modifiedStartLineNumber - 1, change.modifiedEndLineNumber);

    // Replace original lines with the proposed lines
    const origStart =
      change.originalEndLineNumber === 0
        ? change.originalStartLineNumber // pure insertion: startLine is already the anchor
        : change.originalStartLineNumber - 1; // normal: convert 1-based to 0-based
    const origCount =
      change.originalEndLineNumber === 0
        ? 0 // pure insertion (no original lines to remove)
        : change.originalEndLineNumber - change.originalStartLineNumber + 1;

    originalLines.splice(origStart, origCount, ...modSlice);
    setContent(originalLines.join('\n'));
  }

  /** Undo all: discard all proposals. fileState was never modified. */
  undoAll(): void {
    this.clear();
  }

  /** Keep all: apply all proposed content to fileState via callback, then clear. */
  keepAll(setContent: (section: SectionKey, content: string) => void): void {
    for (const [section, content] of this.proposed) {
      setContent(section, content);
    }
    this.clear();
  }

  /** Clear all review state including history. */
  clear(): void {
    this.proposed = new SvelteMap();
    this.history = [];
  }
}

export const reviewState = new ReviewState();
