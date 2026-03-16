import { toast } from 'svelte-sonner';
import { capture } from '$lib/analytics/posthog-client';
import { EVENTS } from '$lib/analytics/events';
import { fileState } from '$lib/features/cv-files/file-state.svelte';

export function getPublicCvUrl(fileId: string): string {
  return `${window.location.origin}/${fileId}`;
}

export async function copyPublicLink(fileId: string): Promise<void> {
  const url = getPublicCvUrl(fileId);
  await navigator.clipboard.writeText(url);
  const file = fileState.files.find((f) => f.id === fileId);
  capture(EVENTS.CV_DOWNLOADED, { format: 'pdf', source: 'public_link', cv_id: fileId, edit_count: file?.editCount ?? 0, theme: file?.selectedTheme });
  capture(EVENTS.PUBLIC_LINK_COPIED, { cv_id: fileId });
  toast.success('Public link copied to clipboard');
}

/**
 * Temporarily set a reactive flag to true, then reset after a delay.
 * Useful for showing a brief "copied" checkmark.
 */
export function flashCopied(setter: (v: boolean) => void, ms = 1500) {
  setter(true);
  setTimeout(() => setter(false), ms);
}
