<script lang="ts">
  import { getContext, tick } from 'svelte';
  import { slide } from 'svelte/transition';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import Undo2Icon from '@lucide/svelte/icons/undo-2';
  import CheckIcon from '@lucide/svelte/icons/check';
  import ListFieldRow from './ListFieldRow.svelte';
  import type { EntryTemplate, FieldDef } from './schema/types.js';
  import type { YamlSync } from './yaml-sync.svelte.js';
  import type { FormErrors } from './form-errors.js';
  import type { FormReviewContext } from './yaml-diff.js';
  import { createDefaultEntry } from './schema/entry-templates.js';
  import { computeLabelWidth } from './measure-labels.js';
  import ReorderableList from './ReorderableList.svelte';
  import type { ReorderableListHandle } from './ReorderableList.svelte';
  import FieldRenderer from './FieldRenderer.svelte';
  import StringInput from './inputs/StringInput.svelte';
  import DiffField from './DiffField.svelte';
  import { formEditorCollapse } from './form-editor-collapse.svelte.js';

  interface Props {
    title: string;
    template: EntryTemplate;
    arrayPath: string[];
    sync: YamlSync;
    disabled?: boolean;
    showHeader?: boolean;
    inline?: boolean;
    outerLabelWidth?: string;
    textMode?: boolean;
    autofocusOnAdd?: boolean;
    autoAddFirst?: boolean;
    oninitdone?: () => void;
    errors?: FormErrors;
    /** When true, skip all diff rendering — parent handles the diff wrapper. */
    suppressDiff?: boolean;
  }

  let {
    title,
    template,
    arrayPath,
    sync,
    disabled,
    showHeader = true,
    inline = false,
    outerLabelWidth,
    textMode = false,
    autofocusOnAdd = false,
    autoAddFirst = false,
    oninitdone,
    errors,
    suppressDiff = false
  }: Props = $props();

  // ── Expand / collapse ──
  let defaultExpanded = $state(true);
  let expandedOverrides = $state(new Map<number, boolean>());

  $effect(() => {
    const _v = formEditorCollapse.version;
    defaultExpanded = formEditorCollapse.allExpanded;
    expandedOverrides = new Map();
  });

  function isExpanded(id: number) {
    return expandedOverrides.get(id) ?? defaultExpanded;
  }

  function toggleExpanded(id: number) {
    const next = new Map(expandedOverrides);
    next.set(id, !isExpanded(id));
    expandedOverrides = next;
  }

  // ── Entry summary ──

  function getSummaryFrom(readSync: YamlSync, index: number): string {
    const requiredField = template.fields.find((f) => f.required);
    if (!requiredField) {
      const firstField = template.fields[0];
      if (!firstField) return `${template.singularLabel ?? template.label} ${index + 1}`;
      const val = readSync.get([...arrayPath, String(index), ...firstField.path]);
      return (val as string) || `${template.singularLabel ?? template.label} ${index + 1}`;
    }
    const val = readSync.get([...arrayPath, String(index), ...requiredField.path]);
    return (val as string) || `${template.singularLabel ?? template.label} ${index + 1}`;
  }

  // ── Actions ──

  let listHandle = $state<ReorderableListHandle>();

  let autoAddDone = false;
  $effect(() => {
    if (autoAddFirst && !autoAddDone && listHandle) {
      autoAddDone = true;
      addEntry();
      oninitdone?.();
    }
  });

  async function addEntry() {
    const prepend = template.name === 'reversed_numbered' ? 0 : undefined;
    sync.seqAdd(arrayPath, textMode ? '' : createDefaultEntry(template), prepend);
    const newItem = listHandle!.add(prepend);
    if (!defaultExpanded) {
      const next = new Map(expandedOverrides);
      next.set(newItem.id, true);
      expandedOverrides = next;
    }
    if (autofocusOnAdd) {
      await tick();
      const items = containerEl?.querySelectorAll(
        ':scope .item-wrapper:not(.item-wrapper .item-wrapper)'
      );
      if (items?.length) {
        const target = items[prepend === 0 ? 0 : items.length - 1];
        target?.querySelector<HTMLElement>('textarea, input')?.focus();
      }
    }
  }

  function removeEntry(index: number, id: number) {
    const next = new Map(expandedOverrides);
    next.delete(id);
    expandedOverrides = next;
    sync.seqRemove(arrayPath, index);
  }

  function getDynamicLabel(templateName: string, index: number, total: number): string | undefined {
    switch (templateName) {
      case 'numbered':
        return `${index + 1}.`;
      case 'reversed_numbered':
        return `${total - index}.`;
      case 'bullet':
        return '\u2022';
      default:
        return undefined;
    }
  }

  let containerEl: HTMLElement;
  let entryCount = $derived(sync.seqLength(arrayPath));
  let labelWidth = $derived(
    getDynamicLabel(template.name, 0, 0) !== undefined
      ? '1.5rem'
      : computeLabelWidth(template.fields)
  );

  const reviewCtx = getContext<FormReviewContext | undefined>('form-review');
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  bind:this={containerEl}
  style:--label-width={inline ? (outerLabelWidth ?? labelWidth) : labelWidth}
>
  <!--
    ── Diff-aware field rendering snippet ──
    Renders a single field with diff awareness using DiffField.
  -->
  {#snippet renderFieldDiff(
    field: FieldDef,
    fieldPath: string[],
    readSync: YamlSync,
    fieldDisabled: boolean,
    enableFieldDiff: boolean
  )}
    {#if !enableFieldDiff}
      <FieldRenderer {field} value={readSync.get(fieldPath)} onchange={() => {}} disabled={true} />
    {:else}
      {@const status = reviewCtx?.diffAt(fieldPath) ?? 'unchanged'}
      {#if status !== 'unchanged' && reviewCtx?.active}
        {#if status === 'modified' && field.type === 'string_list'}
          <!-- Per-item diff for string lists -->
          {@const itemDiffs = reviewCtx.seqItemDiffs(fieldPath)}
          {@const origArr = (reviewCtx.originalSync?.get(fieldPath) as string[] | null) ?? []}
          {@const propArr = (readSync.get(fieldPath) as string[] | null) ?? []}
          <div class="py-1.5">
            <div class="flex items-center">
              <span
                class="shrink-0 text-xs text-muted-foreground"
                style:width="var(--label-width, auto)">{field.label}</span
              >
            </div>
          </div>
          <div class="pl-4">
            {#each itemDiffs as itemStatus, i}
              {#if itemStatus === 'modified'}
                <div class="diff-removed border-b border-border/25">
                  <StringInput value={origArr[i] ?? ''} onchange={() => {}} disabled={true} bare />
                </div>
                <div class="diff-added border-b border-border/25 last:border-b-0">
                  <StringInput value={propArr[i] ?? ''} onchange={() => {}} disabled={true} bare />
                </div>
              {:else if itemStatus === 'added'}
                <div class="diff-added border-b border-border/25 last:border-b-0">
                  <StringInput value={propArr[i] ?? ''} onchange={() => {}} disabled={true} bare />
                </div>
              {:else if itemStatus === 'removed'}
                <div class="diff-removed border-b border-border/25 last:border-b-0">
                  <StringInput value={origArr[i] ?? ''} onchange={() => {}} disabled={true} bare />
                </div>
              {:else}
                <div class="border-b border-border/25 last:border-b-0">
                  <StringInput value={propArr[i] ?? ''} onchange={() => {}} disabled={true} bare />
                </div>
              {/if}
            {/each}
          </div>
          <div class="diff-actions">
            <button class="diff-btn diff-btn-undo" onclick={() => reviewCtx.undo(fieldPath)}>
              <Undo2Icon class="size-2.5" />Undo
            </button>
            <button class="diff-btn diff-btn-keep" onclick={() => reviewCtx.keep(fieldPath)}>
              <CheckIcon class="size-2.5" />Keep
            </button>
          </div>
        {:else}
          <DiffField
            {status}
            onKeep={() => reviewCtx.keep(fieldPath)}
            onUndo={() => reviewCtx.undo(fieldPath)}
          >
            {#snippet original()}
              <FieldRenderer
                {field}
                value={reviewCtx.originalSync?.get(fieldPath)}
                onchange={() => {}}
                disabled={true}
              />
            {/snippet}
            <FieldRenderer
              {field}
              value={readSync.get(fieldPath)}
              onchange={() => {}}
              disabled={true}
            />
          </DiffField>
        {/if}
      {:else}
        <FieldRenderer
          {field}
          value={readSync.get(fieldPath)}
          onchange={(v) => readSync.set(fieldPath, v)}
          disabled={fieldDisabled}
          error={errors?.forField(fieldPath)}
        />
      {/if}
    {/if}
  {/snippet}

  <!--
    ── Text item diff snippet ──
  -->
  {#snippet renderTextDiff(
    textPath: string[],
    readSync: YamlSync,
    textDisabled: boolean,
    enableFieldDiff: boolean
  )}
    {#if !enableFieldDiff}
      <StringInput
        value={String(readSync.get(textPath) ?? '')}
        disabled={true}
        placeholder="Enter text..."
      />
    {:else}
      {@const status = reviewCtx?.diffAt(textPath) ?? 'unchanged'}
      {#if status !== 'unchanged' && reviewCtx?.active}
        <DiffField
          {status}
          onKeep={() => reviewCtx.keep(textPath)}
          onUndo={() => reviewCtx.undo(textPath)}
        >
          {#snippet original()}
            <StringInput
              value={String(reviewCtx.originalSync?.get(textPath) ?? '')}
              disabled={true}
              placeholder="Enter text..."
            />
          {/snippet}
          <StringInput
            value={String(readSync.get(textPath) ?? '')}
            disabled={true}
            placeholder="Enter text..."
          />
        </DiffField>
      {:else}
        <StringInput
          value={String(readSync.get(textPath) ?? '')}
          disabled={textDisabled}
          placeholder="Enter text..."
          onchange={(v) => readSync.set(textPath, v === '' ? null : v)}
        />
      {/if}
    {/if}
  {/snippet}

  <!--
    ── Entry rendering snippet ──
  -->
  {#snippet renderEntry(
    index: number,
    id: number,
    readSync: YamlSync,
    entryDisabled: boolean,
    total: number,
    enableFieldDiff: boolean
  )}
    {#if textMode}
      {@const textPath = [...arrayPath, String(index)]}
      {@render renderTextDiff(textPath, readSync, entryDisabled, enableFieldDiff)}
    {:else if template.compact}
      {@const dynamicLabel = getDynamicLabel(template.name, index, total)}
      {#if dynamicLabel && template.fields.length === 1}
        {@const field = template.fields[0]}
        {@const fieldPath = [...arrayPath, String(index), ...field.path]}
        {#if !enableFieldDiff}
          <StringInput
            value={String(readSync.get(fieldPath) ?? '')}
            label={dynamicLabel}
            disabled={true}
          />
        {:else}
          {@const status = reviewCtx?.diffAt(fieldPath) ?? 'unchanged'}
          {#if status !== 'unchanged' && reviewCtx?.active}
            <DiffField
              {status}
              onKeep={() => reviewCtx.keep(fieldPath)}
              onUndo={() => reviewCtx.undo(fieldPath)}
            >
              {#snippet original()}
                <StringInput
                  value={String(reviewCtx.originalSync?.get(fieldPath) ?? '')}
                  label={dynamicLabel}
                  disabled={true}
                />
              {/snippet}
              <StringInput
                value={String(readSync.get(fieldPath) ?? '')}
                label={dynamicLabel}
                disabled={true}
              />
            </DiffField>
          {:else}
            <StringInput
              value={String(readSync.get(fieldPath) ?? '')}
              label={dynamicLabel}
              disabled={entryDisabled}
              error={errors?.forField(fieldPath)}
              onchange={(v) => readSync.set(fieldPath, v === '' && !field.preserveEmpty ? null : v)}
            />
          {/if}
        {/if}
      {:else}
        {#each template.fields as field (field.path.join('.'))}
          {@const fieldPath = [...arrayPath, String(index), ...field.path]}
          {@render renderFieldDiff(field, fieldPath, readSync, entryDisabled, enableFieldDiff)}
        {/each}
      {/if}
      {#if !inline}
        <div class="mt-2" class:invisible={index === total - 1}></div>
      {/if}
    {:else}
      <!-- Full: collapsible entry -->
      {@const firstField = template.fields[0]}
      {@const restFields = template.fields.slice(1)}
      <div class="-ml-0.5 grid grid-cols-[auto_1fr] items-start gap-x-1">
        <button type="button" class="row-start-1" onclick={() => toggleExpanded(id)}>
          <ChevronRightIcon
            class="mt-[9px] size-3.5 text-muted-foreground/60 transition-transform {isExpanded(id)
              ? 'rotate-90'
              : ''}"
          />
        </button>
        <div class="col-start-2 row-start-1">
          <svelte:boundary>
            {@const firstPath = [...arrayPath, String(index), ...firstField.path]}
            {@render renderFieldDiff(
              firstField,
              firstPath,
              readSync,
              entryDisabled,
              enableFieldDiff
            )}
          </svelte:boundary>
          {#if isExpanded(id)}
            <div class="pb-2" transition:slide={{ duration: 150 }}>
              {#each restFields as field (field.path.join('.'))}
                {@const fieldPath = [...arrayPath, String(index), ...field.path]}
                {@render renderFieldDiff(
                  field,
                  fieldPath,
                  readSync,
                  entryDisabled,
                  enableFieldDiff
                )}
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {/if}
  {/snippet}

  {#snippet listContent()}
    <ReorderableList
      count={entryCount}
      {disabled}
      bind:handle={listHandle}
      itemClass=""
      style={inline ? `--label-width: ${labelWidth}` : undefined}
      onreorder={(from, to) => sync.seqMove(arrayPath, from, to)}
      onswap={(a, b) => sync.seqSwap(arrayPath, a, b)}
      onremove={(i, id) => removeEntry(i, id)}
    >
      {#snippet item({ index, id })}
        {@const ctx = suppressDiff ? null : reviewCtx}
        {@const seqInfo = ctx?.active ? ctx.seqDiff(arrayPath) : null}
        {@const isAddedEntry = !!(seqInfo && index >= seqInfo.originalLen)}
        {#if isAddedEntry && ctx}
          <div class="diff-added-entry">
            {@render renderEntry(index, id, sync, disabled ?? false, entryCount, false)}
            <div class="diff-entry-actions">
              <button
                class="diff-btn diff-btn-undo"
                onclick={() => ctx.undo([...arrayPath, String(index)])}
              >
                <Undo2Icon class="size-2.5" />Undo
              </button>
              <button
                class="diff-btn diff-btn-keep"
                onclick={() => ctx.keep([...arrayPath, String(index)])}
              >
                <CheckIcon class="size-2.5" />Keep
              </button>
            </div>
          </div>
        {:else}
          {@render renderEntry(index, id, sync, disabled ?? false, entryCount, !suppressDiff)}
        {/if}
      {/snippet}
    </ReorderableList>

    <!-- Removed entries (exist in original but not proposed) -->
    {#if !suppressDiff && reviewCtx?.active && reviewCtx.originalSync}
      {@const diff = reviewCtx.seqDiff(arrayPath)}
      {#if diff.originalLen > diff.proposedLen}
        {@const ghostIndices = Array.from(
          { length: diff.originalLen - diff.proposedLen },
          (_, i) => diff.proposedLen + i
        )}
        {#each ghostIndices as removedIndex (removedIndex)}
          <div class="diff-removed-entry">
            {@render renderEntry(
              removedIndex,
              -(removedIndex + 1),
              reviewCtx.originalSync,
              true,
              diff.originalLen,
              false
            )}
            <div class="diff-entry-actions">
              <button
                class="diff-btn diff-btn-undo"
                onclick={() => reviewCtx.undo([...arrayPath, String(removedIndex)])}
              >
                <Undo2Icon class="size-2.5" />Undo
              </button>
              <button
                class="diff-btn diff-btn-keep"
                onclick={() => reviewCtx.keep([...arrayPath, String(removedIndex)])}
              >
                <CheckIcon class="size-2.5" />Keep
              </button>
            </div>
          </div>
        {/each}
      {/if}
    {/if}

    {#if !inline}
      <button
        type="button"
        onclick={addEntry}
        {disabled}
        class="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground/50 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        <PlusIcon class="size-3" />
        Add {(template.singularLabel ?? template.label).toLowerCase()}
      </button>
    {/if}
  {/snippet}

  {#if inline && showHeader}
    <ListFieldRow label={title} {disabled} onadd={addEntry}>
      {@render listContent()}
    </ListFieldRow>
  {:else}
    {#if showHeader}
      <div class="mt-6 mb-1 flex items-center">
        <h3 class="flex-1 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
          {title}
        </h3>
        <button
          type="button"
          class="flex items-center gap-0.5 text-[11px] text-muted-foreground/70 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          {disabled}
          onclick={addEntry}
        >
          <PlusIcon class="size-3" />
          Add {template.singularLabel ?? template.label}
        </button>
      </div>
    {/if}
    <div class="pl-4">
      {@render listContent()}
    </div>
  {/if}
</div>

<style>
  @reference "../../../app.css";

  .diff-removed-entry {
    @apply mt-1 rounded border-l-2 border-red-500/50 bg-red-500/[0.06] px-2 py-1;
  }

  .diff-added-entry {
    @apply mt-1 rounded border-l-2 border-green-500/50 bg-green-500/[0.06] px-2 py-1;
  }

  .diff-entry-actions {
    @apply flex justify-end gap-0.5 py-0.5;
  }
</style>
