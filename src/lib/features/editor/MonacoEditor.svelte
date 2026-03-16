<script lang="ts">
  import { onMount, onDestroy, untrack } from 'svelte';
  import LoadingSpinner from '$lib/features/primitives/LoadingSpinner.svelte';
  import { editor, type MarkerError } from './editor-state.svelte';
  import ReviewBar from './ReviewBar.svelte';
  import type { CvFileSections, SectionKey } from '$lib/features/cv-files/types';

  interface Props {
    sections: CvFileSections;
    selectedFileId?: string;
    syncKey?: string;
    activeSection: SectionKey;
    readOnly: boolean;
    errorsBySection: Record<SectionKey, MarkerError[]>;
    onSectionChange: (section: SectionKey, content: string) => void;
    onReviewUndoAll?: () => void;
    onReviewKeepAll?: () => void;
  }

  let {
    sections,
    selectedFileId,
    syncKey,
    activeSection,
    readOnly,
    errorsBySection,
    onSectionChange,
    onReviewUndoAll,
    onReviewKeepAll
  }: Props = $props();

  let container: HTMLDivElement;

  onMount(() => editor.initialize(container, onSectionChange));
  onDestroy(() => editor.dispose());

  $effect(() => {
    if (editor.isLoading) return;
    selectedFileId;
    syncKey;
    const s = untrack(() => sections);
    untrack(() => editor.syncAllSections(s));
  });
  $effect(() => editor.switchSection(activeSection));
  $effect(() => editor.syncReadOnly(readOnly));
  $effect(() => editor.syncSectionMarkers(errorsBySection));
</script>

<div class="relative h-full min-h-0 w-full">
  <div class="h-full min-h-0 w-full" class:invisible={editor.isLoading} bind:this={container}></div>

  {#if editor.isLoading}
    <div class="absolute inset-0 grid place-items-center">
      <LoadingSpinner />
    </div>
  {/if}

  {#if editor.isReviewMode}
    <ReviewBar
      totalChanges={editor.reviewChangeCount}
      onUndoAll={() => onReviewUndoAll?.()}
      onKeepAll={() => onReviewKeepAll?.()}
      position="absolute"
    />
  {/if}
</div>

<style>
  :global(.monaco-hover) {
    max-width: min(480px, 90vw) !important;
  }

  /* Lift view-zones above view-lines in the diff editor so buttons are clickable.
     Safe because view zones only occupy blank space between lines. */
  :global(.monaco-diff-editor .view-zones) {
    z-index: 1;
  }

  :global(.review-zone-actions) {
    display: flex;
    gap: 4px;
    padding: 2px 12px;
    justify-content: flex-end;
    align-items: center;
    height: 100%;
  }

  :global(.review-zone-btn) {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 11px;
    padding: 1px 8px;
    border-radius: 4px;
    border: 1px solid;
    cursor: pointer;
    font-family: system-ui, sans-serif;
    line-height: 1.4;
  }

  :global(.review-zone-btn-undo) {
    border-color: rgba(220, 53, 69, 0.4);
    color: rgb(220, 53, 69);
    background: rgba(220, 53, 69, 0.08);
  }

  :global(.review-zone-btn-undo:hover) {
    background: rgba(220, 53, 69, 0.18);
  }

  :global(.review-zone-btn-keep) {
    border-color: rgba(40, 167, 69, 0.4);
    color: rgb(40, 167, 69);
    background: rgba(40, 167, 69, 0.08);
  }

  :global(.review-zone-btn-keep:hover) {
    background: rgba(40, 167, 69, 0.18);
  }
</style>
