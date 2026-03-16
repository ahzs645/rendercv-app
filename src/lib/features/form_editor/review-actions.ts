/**
 * Centralized review mutations. All keep/undo actions for the form editor
 * go through here. Monaco line-level undo/keep stays in review-state.svelte.ts.
 */
import { parseDocument, isMap } from 'yaml';
import type { Document } from 'yaml';
import type { SectionKey } from '$lib/features/cv-files/types';
import { reviewState } from '$lib/features/editor/review-state.svelte';
import { fileState } from '$lib/features/cv-files/file-state.svelte';
import { editor } from '$lib/features/editor/editor-state.svelte';
import { getPlainValue, yamlContentEquals } from './yaml-diff.js';
import { capture } from '$lib/analytics/posthog-client';
import { EVENTS } from '$lib/analytics/events';

// ── Internal helpers ──────────────────────────────────────────────────

/**
 * After setIn appends a new map key, reorder it to match the source
 * document's key order so the YAML output stays consistent.
 */
function reorderToMatch(targetDoc: Document, sourceDoc: Document, fullPath: string[]): void {
  if (fullPath.length < 2) return;
  const parentPath = fullPath.slice(0, -1);
  const key = fullPath[fullPath.length - 1];

  const targetMap = targetDoc.getIn(parentPath, true);
  const sourceMap = sourceDoc.getIn(parentPath, true);
  if (!isMap(targetMap) || !isMap(sourceMap)) return;

  const sourceKeys = sourceMap.items.map((p) => String(p.key));
  const targetIdx = sourceKeys.indexOf(key);
  if (targetIdx < 0) return;

  const targetKeys = targetMap.items.map((p) => String(p.key));
  const currentIdx = targetKeys.indexOf(key);
  if (currentIdx < 0) return;

  let insertBefore = targetMap.items.length;
  for (let i = targetIdx + 1; i < sourceKeys.length; i++) {
    const pos = targetKeys.indexOf(sourceKeys[i]);
    if (pos >= 0 && pos !== currentIdx) {
      insertBefore = pos;
      break;
    }
  }

  if (currentIdx !== insertBefore && currentIdx !== insertBefore - 1) {
    const [pair] = targetMap.items.splice(currentIdx, 1);
    const adjustedPos = currentIdx < insertBefore ? insertBefore - 1 : insertBefore;
    targetMap.items.splice(adjustedPos, 0, pair);
  }
}

/**
 * Apply a value from source doc to target doc at a path.
 * Returns the modified target doc as a YAML string.
 */
function applyValue(targetYaml: string, sourceYaml: string, fullPath: string[]): string {
  const targetDoc = parseDocument(targetYaml || '{}');
  const sourceDoc = parseDocument(sourceYaml || '{}');
  const value = getPlainValue(sourceDoc, fullPath);

  if (value === undefined || value === null) {
    targetDoc.deleteIn(fullPath);
  } else {
    targetDoc.setIn(fullPath, targetDoc.createNode(value));
    reorderToMatch(targetDoc, sourceDoc, fullPath);
  }

  return targetDoc.toString({ nullStr: '' });
}

/** Check if review is resolved and clean up if so. */
function checkResolved(section: SectionKey, content: string, proposed: string): void {
  if (yamlContentEquals(content, proposed)) {
    reviewState.proposed.delete(section);
  }
}

// ── Public actions ──────────────────────────────────────────────────

/** Keep: copy proposed value at path into fileState. */
export function keepPath(section: SectionKey, path: string[]): void {
  const currentFile = fileState.sections[section] ?? '';
  const currentProposed = reviewState.getProposed(section);
  if (currentProposed === undefined) return;

  reviewState.pushSnapshot(section, currentFile, currentProposed);

  const fullPath = [section, ...path];
  const newFile = applyValue(currentFile, currentProposed, fullPath);

  fileState.setSectionContent(section, newFile);
  editor.applyContentAsEdit(section, newFile);
  checkResolved(section, newFile, currentProposed);
  capture(EVENTS.AI_CHAT_PROPOSAL_ACCEPTED, { section, scope: 'path', cv_id: fileState.selectedFileId });
}

/** Undo: copy original value at path back into proposed. */
export function undoPath(section: SectionKey, path: string[]): void {
  const currentFile = fileState.sections[section] ?? '';
  const currentProposed = reviewState.getProposed(section);
  if (currentProposed === undefined) return;

  reviewState.pushSnapshot(section, currentFile, currentProposed);

  const fullPath = [section, ...path];
  const newProposed = applyValue(currentProposed, currentFile, fullPath);

  reviewState.setProposed(section, newProposed);
  checkResolved(section, currentFile, newProposed);
  capture(EVENTS.AI_CHAT_PROPOSAL_REJECTED, { section, scope: 'path', cv_id: fileState.selectedFileId });
}

/** Keep entire entry at index in a sequence. */
export function keepEntry(section: SectionKey, arrayPath: string[], index: number): void {
  keepPath(section, [...arrayPath, String(index)]);
}

/** Undo entire entry at index in a sequence. */
export function undoEntry(section: SectionKey, arrayPath: string[], index: number): void {
  undoPath(section, [...arrayPath, String(index)]);
}

/** Undo the last review action (keep or undo). */
export function undoLast(): void {
  const snap = reviewState.popSnapshot();
  if (!snap) return;

  const currentFile = fileState.sections[snap.section] ?? '';
  if (currentFile !== snap.fileContent) {
    fileState.setSectionContent(snap.section, snap.fileContent);
    editor.applyContentAsEdit(snap.section, snap.fileContent);
  }

  reviewState.setProposed(snap.section, snap.proposedContent);
}

/** Undo all: discard all proposals. */
export function undoAll(): void {
  if (reviewState.proposed.size > 0) {
    capture(EVENTS.AI_CHAT_PROPOSAL_REJECTED, { scope: 'all', cv_id: fileState.selectedFileId });
  }
  reviewState.clear();
}

/** Keep all: apply all proposed content to fileState, then clear. */
export function keepAll(): void {
  if (reviewState.proposed.size > 0) {
    capture(EVENTS.AI_CHAT_PROPOSAL_ACCEPTED, { scope: 'all', cv_id: fileState.selectedFileId });
  }
  for (const [section, content] of reviewState.proposed) {
    fileState.setSectionContent(section, content);
    editor.applyContentAsEdit(section, content);
  }
  reviewState.clear();
}
