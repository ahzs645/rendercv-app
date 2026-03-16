<script lang="ts">
  import { onMount, setContext, untrack } from 'svelte';
  import { parseDocument, isSeq, isMap, type Document } from 'yaml';
  import type { SectionKey } from '$lib/features/cv-files/types';
  import type { RenderError } from '$lib/features/viewer/viewer-state.svelte';
  import { fileState } from '$lib/features/cv-files/file-state.svelte';
  import { reviewState } from '$lib/features/editor/review-state.svelte';
  import { defaultDesigns } from 'virtual:rendercv-variants';
  import { getSyncCached } from './sync-cache.svelte.js';
  import { createFormErrors } from './form-errors.js';
  import type { SectionSchema } from './schema/types.js';
  import {
    cvPersonalInfoGroup,
    socialNetworkTemplate,
    customConnectionTemplate
  } from './schema/cv-schema.js';
  import { designSchema } from './schema/design-schema.js';
  import { localeSchema } from './schema/locale-schema.js';
  import { settingsSchema } from './schema/settings-schema.js';
  import { computeLabelWidth } from './measure-labels.js';
  import GroupRenderer from './GroupRenderer.svelte';
  import EntryListRenderer from './EntryListRenderer.svelte';
  import SectionListEditor from './SectionListEditor.svelte';
  import ReviewBar from '$lib/features/editor/ReviewBar.svelte';
  import {
    yamlContentEquals,
    countDiffs,
    diffAt,
    seqItemDiffs,
    seqDiff,
    mapKeysDiff,
    nodeToJS,
    type FormReviewContext
  } from './yaml-diff.js';
  import { keepPath, undoPath } from './review-actions.js';
  import { formEditorUndo } from './form-editor-undo.svelte.js';
  import { formEditorCollapse } from './form-editor-collapse.svelte.js';
  import type { YamlSync } from './yaml-sync.svelte.js';

  interface Props {
    activeSection: SectionKey;
    errors?: RenderError[];
    onReviewUndoAll?: () => void;
    onReviewKeepAll?: () => void;
    onReviewUndo?: () => void;
  }

  let {
    activeSection,
    errors = [],
    onReviewUndoAll,
    onReviewKeepAll,
    onReviewUndo
  }: Props = $props();

  const staticSchemas: Partial<Record<SectionKey, SectionSchema>> = {
    design: designSchema,
    locale: localeSchema,
    settings: settingsSchema
  };

  // ── Review mode ──────────────────────────────────────────────────────

  // Cached parsed documents for diff queries. Re-parsed only when YAML strings change.
  let cachedOrigYaml = '';
  let cachedPropYaml = '';
  let origDoc: Document | null = null;
  let propDoc: Document | null = null;

  function ensureDocs(section: SectionKey): { orig: Document; prop: Document } | null {
    const origYaml = fileState.sections[section] ?? '';
    const propYaml = reviewState.getProposed(section);
    if (propYaml === undefined) return null;

    if (origYaml !== cachedOrigYaml) {
      cachedOrigYaml = origYaml;
      origDoc = parseDocument(origYaml || '{}');
    }
    if (propYaml !== cachedPropYaml) {
      cachedPropYaml = propYaml;
      propDoc = parseDocument(propYaml || '{}');
    }
    return { orig: origDoc!, prop: propDoc! };
  }

  let isReviewMode = $derived.by(() => {
    const section = activeSection;
    const proposed = reviewState.getProposed(section);
    const current = fileState.sections[section] ?? '';
    if (proposed === undefined) return false;
    return !yamlContentEquals(current, proposed);
  });

  // Clean up cosmetic-only diffs (side effect must not live in $derived).
  $effect(() => {
    const section = activeSection;
    const proposed = reviewState.getProposed(section);
    if (proposed === undefined) return;
    const current = fileState.sections[section] ?? '';
    if (yamlContentEquals(current, proposed)) {
      reviewState.proposed.delete(section);
    }
  });

  let changeCount = $derived.by(() => {
    const docs = ensureDocs(activeSection);
    if (!docs) return 0;
    return countDiffs(docs.orig.contents, docs.prop.contents);
  });

  // Get (or reuse cached) YamlSync for the active section.
  let sync = $derived.by(() => {
    const section = activeSection;
    const fileId = fileState.selectedFileId;
    const theme = section === 'design' ? fileState.selectedFile?.selectedTheme : undefined;
    const locale = section === 'locale' ? fileState.selectedFile?.selectedLocale : undefined;
    void isReviewMode;
    return untrack(() => getSyncCached(section, fileId, theme, locale));
  });

  // During review, use a read-only sync that reads from proposed document.
  let effectiveSync = $derived(isReviewMode ? createReviewSync(activeSection) : sync);

  /** Creates a minimal read-only YamlSync for proposed content. */
  function createReviewSync(section: SectionKey): YamlSync {
    const docs = ensureDocs(section);
    const prefix = [section];

    function getFromProp(path: string[]): unknown {
      if (!docs) return undefined;
      const fullPath = [...prefix, ...path];
      const val = docs.prop.getIn(fullPath);
      if (isSeq(val) || isMap(val)) return (val as { toJSON(): unknown }).toJSON();
      return val;
    }

    return {
      get: getFromProp,
      seqLength: (path) => {
        if (!docs) return 0;
        const node = docs.prop.getIn([...prefix, ...path], true);
        return isSeq(node) ? node.items.length : 0;
      },
      mapKeys: (path) => {
        if (!docs) return [];
        const node = docs.prop.getIn([...prefix, ...path], true);
        return isMap(node) ? node.items.map((p) => String(p.key)) : [];
      },
      seqFirst: (path) => {
        if (!docs) return undefined;
        const node = docs.prop.getIn([...prefix, ...path], true);
        if (!isSeq(node) || node.items.length === 0) return undefined;
        const first = node.items[0];
        if (first != null && typeof first === 'object' && 'toJSON' in first)
          return (first as { toJSON(): unknown }).toJSON();
        return first;
      },
      set: () => {},
      remove: () => {},
      seqAdd: () => {},
      seqRemove: () => {},
      seqMove: () => {},
      seqSwap: () => {},
      mapRename: () => {},
      mapMove: () => {},
      reload: () => {},
      undo: () => false,
      redo: () => false,
      get canUndo() {
        return false;
      },
      get canRedo() {
        return false;
      },
      commitPending: () => {},
      get lastFlushedYaml() {
        return '';
      },
      remapOutputPath: (p) => p
    };
  }

  let defaultsDoc = $derived.by(() => {
    const theme = fileState.selectedFile?.selectedTheme;
    const yaml = theme ? defaultDesigns[theme] : undefined;
    return yaml ? parseDocument(yaml) : null;
  });

  function getDefault(path: string[]): unknown {
    return defaultsDoc?.getIn(['design', ...path]) ?? undefined;
  }

  let disabled = $derived(fileState.selectedFileReadOnly ?? false);
  let effectiveDisabled = $derived(disabled || isReviewMode);
  let formErrors = $derived(createFormErrors(errors, activeSection, sync.remapOutputPath));

  // Provide review API via context. Children call ctx.diffAt(), ctx.keep(), ctx.undo(), etc.
  setContext<FormReviewContext | undefined>('form-review', {
    get active() {
      return isReviewMode;
    },
    get originalSync() {
      return isReviewMode ? sync : undefined;
    },
    diffAt: (path) => {
      const docs = ensureDocs(activeSection);
      return diffAt(docs?.orig ?? null, docs?.prop ?? null, [activeSection, ...path]);
    },
    seqItemDiffs: (path) => {
      const docs = ensureDocs(activeSection);
      return seqItemDiffs(docs?.orig ?? null, docs?.prop ?? null, [activeSection, ...path]);
    },
    seqDiff: (path) => {
      const docs = ensureDocs(activeSection);
      return seqDiff(docs?.orig ?? null, docs?.prop ?? null, [activeSection, ...path]);
    },
    mapKeysDiff: (path) => {
      const docs = ensureDocs(activeSection);
      return mapKeysDiff(docs?.orig ?? null, docs?.prop ?? null, [activeSection, ...path]);
    },
    keep: (path) => keepPath(activeSection, path),
    undo: (path) => undoPath(activeSection, path),
    get changeCount() {
      return changeCount;
    }
  });

  let cvLabelWidth = $derived(
    computeLabelWidth([
      ...cvPersonalInfoGroup.fields,
      { label: socialNetworkTemplate.label },
      { label: customConnectionTemplate.label }
    ])
  );

  let scrollContainer: HTMLDivElement;

  $effect(() => {
    const s = sync;
    formEditorUndo.register(s);
    return () => formEditorUndo.unregister();
  });

  $effect(() => {
    formEditorCollapse.registerScrollContainer(scrollContainer);
    return () => formEditorCollapse.registerScrollContainer(null);
  });

  $effect(() => {
    fileState.selectedFileId;
    scrollContainer?.scrollTo(0, 0);
  });

  $effect(() => {
    activeSection;
    fileState.selectedFileId;

    const id = requestAnimationFrame(() => {
      if (!scrollContainer) return;
      for (const anim of scrollContainer.getAnimations({ subtree: true })) {
        anim.finish();
      }
    });
    return () => cancelAnimationFrame(id);
  });

  function handleUndoRedo(e: KeyboardEvent) {
    const isMod = e.metaKey || e.ctrlKey;
    if (!isMod) return;
    const el = document.activeElement;
    if (el instanceof HTMLElement && el.closest('[role="dialog"],[role="menu"],[role="listbox"]'))
      return;
    const key = e.key.toLowerCase();
    if (key === 'z' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      if (isReviewMode) {
        onReviewUndo?.();
      } else {
        sync.undo();
      }
    } else if ((key === 'z' && e.shiftKey) || (key === 'y' && e.ctrlKey)) {
      e.preventDefault();
      e.stopPropagation();
      if (!isReviewMode) {
        sync.redo();
      }
    }
  }
  onMount(() => {
    window.addEventListener('keydown', handleUndoRedo, true);
    return () => window.removeEventListener('keydown', handleUndoRedo, true);
  });
</script>

<div
  data-form-editor
  class="h-full overflow-y-auto [overflow-anchor:none]"
  bind:this={scrollContainer}
>
  {#if isReviewMode}
    <ReviewBar
      totalChanges={changeCount}
      onUndoAll={() => onReviewUndoAll?.()}
      onKeepAll={() => onReviewKeepAll?.()}
    />
  {/if}
  <div class="px-8">
    {#if formErrors.unmatched.length > 0}
      <div class="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
        {#each formErrors.unmatched as err}
          <p class="text-xs text-destructive">{err.message}</p>
        {/each}
      </div>
    {/if}

    {#if activeSection === 'cv'}
      <GroupRenderer
        group={cvPersonalInfoGroup}
        sync={effectiveSync}
        disabled={effectiveDisabled}
        errors={formErrors}
        labelWidth={cvLabelWidth}
      />

      <EntryListRenderer
        title={socialNetworkTemplate.label}
        template={socialNetworkTemplate}
        arrayPath={['social_networks']}
        sync={effectiveSync}
        disabled={effectiveDisabled}
        errors={formErrors}
        inline
        outerLabelWidth={cvLabelWidth}
      />

      <EntryListRenderer
        title={customConnectionTemplate.label}
        template={customConnectionTemplate}
        arrayPath={['custom_connections']}
        sync={effectiveSync}
        disabled={effectiveDisabled}
        errors={formErrors}
        inline
        outerLabelWidth={cvLabelWidth}
      />

      <SectionListEditor sync={effectiveSync} disabled={effectiveDisabled} errors={formErrors} />
    {:else}
      {@const schema = staticSchemas[activeSection]}
      {#if schema}
        {#each schema.groups as group, idx (group.title + idx)}
          <GroupRenderer
            {group}
            sync={effectiveSync}
            disabled={effectiveDisabled}
            errors={formErrors}
            getDefault={activeSection === 'design' ? getDefault : undefined}
          />
        {/each}
      {:else}
        <p class="py-8 text-center text-sm text-muted-foreground">
          No form schema available for the "{activeSection}" section yet.
        </p>
      {/if}
    {/if}

    <div class="h-[80vh]"></div>
  </div>
</div>
