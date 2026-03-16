<script lang="ts">
  import { getContext, tick } from 'svelte';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import Undo2Icon from '@lucide/svelte/icons/undo-2';
  import CheckIcon from '@lucide/svelte/icons/check';
  import type { YamlSync } from './yaml-sync.svelte.js';
  import type { FormErrors } from './form-errors.js';
  import type { FormReviewContext } from './yaml-diff.js';
  import {
    detectEntryType,
    findTemplateByName,
    entryTypeOptions
  } from './schema/entry-templates.js';
  import {
    dictionaryKeyToProperSectionTitle,
    properSectionTitleToDictionaryKey
  } from './section-title.js';
  import SectionHeader from './SectionHeader.svelte';
  import EntryListRenderer from './EntryListRenderer.svelte';
  import type { EntryTemplate } from './schema/types.js';

  const textTemplate: EntryTemplate = { name: 'text', label: 'Text', fields: [] };

  type MergedSection =
    | { name: string; removed: false; proposedIndex: number }
    | { name: string; removed: true };

  interface Props {
    title?: string;
    sync: YamlSync;
    disabled?: boolean;
    errors?: FormErrors;
  }

  let { title, sync, disabled = false, errors }: Props = $props();

  const reviewCtx = getContext<FormReviewContext | undefined>('form-review');

  const MOVE_DURATION = 400;

  let newlyAddedKey = $state<string | null>(null);
  const sectionElsByKey: Record<string, HTMLElement | undefined> = {};
  let pendingTemplates = $state<Record<string, { template: EntryTemplate; textMode: boolean }>>({});

  function getScrollParent(el: HTMLElement): HTMLElement | null {
    let parent = el.parentElement;
    while (parent) {
      const { overflowY } = getComputedStyle(parent);
      if (overflowY === 'auto' || overflowY === 'scroll') return parent;
      parent = parent.parentElement;
    }
    return null;
  }

  function resolveScrollContainer(anchorEl: HTMLElement): HTMLElement | null {
    return (
      getScrollParent(anchorEl) ??
      anchorEl.closest<HTMLElement>('[data-form-editor]') ??
      null ??
      (document.scrollingElement instanceof HTMLElement ? document.scrollingElement : null)
    );
  }

  function prepareMove(anchorKey: string, anchorTop: number) {
    const oldRects: Record<string, DOMRect | undefined> = {};
    for (const key of stableKeys) {
      const el = sectionElsByKey[key];
      if (el?.isConnected) oldRects[key] = el.getBoundingClientRect();
    }

    return async () => {
      await tick();

      const anchorEl = sectionElsByKey[anchorKey];
      if (anchorEl?.isConnected) {
        const container = resolveScrollContainer(anchorEl);
        if (container) {
          const newTop = anchorEl.getBoundingClientRect().top;
          container.scrollTop += newTop - anchorTop;
        }
      }

      for (const key of stableKeys) {
        const el = sectionElsByKey[key];
        if (!el?.isConnected) continue;
        const oldRect = oldRects[key];
        if (!oldRect) continue;
        const newRect = el.getBoundingClientRect();
        const deltaY = oldRect.top - newRect.top;
        if (Math.abs(deltaY) < 1) continue;
        el.animate([{ transform: `translateY(${deltaY}px)` }, { transform: 'none' }], {
          duration: MOVE_DURATION,
          easing: 'cubic-bezier(0.33, 1, 0.68, 1)'
        });
      }
    };
  }

  let sectionNames = $derived(sync.mapKeys(['sections']));

  // ── Merged section list (interleaves removed sections at original positions) ──

  let mergedSections = $derived.by((): MergedSection[] => {
    if (!reviewCtx?.active || !reviewCtx.originalSync) {
      return sectionNames.map((name, i) => ({ name, removed: false as const, proposedIndex: i }));
    }

    const diff = reviewCtx.mapKeysDiff(['sections']);
    const proposedSet = new Set(diff.proposedKeys);

    const result: MergedSection[] = diff.proposedKeys.map((key, i) => ({
      name: key,
      removed: false as const,
      proposedIndex: i
    }));

    for (const removedKey of diff.removed) {
      const origIdx = diff.originalKeys.indexOf(removedKey);
      let commonBefore = 0;
      for (let i = 0; i < origIdx; i++) {
        if (proposedSet.has(diff.originalKeys[i])) commonBefore++;
      }
      let insertPos = 0;
      let commonSeen = 0;
      for (let i = 0; i < result.length; i++) {
        if (!result[i].removed) commonSeen++;
        if (commonSeen > commonBefore) {
          insertPos = i;
          break;
        }
        insertPos = i + 1;
      }
      result.splice(insertPos, 0, { name: removedKey, removed: true });
    }

    return result;
  });

  // ── Stable keys for {#each} ──

  function createStableKeys() {
    let nameToId: Record<string, string | undefined> = {};
    let nextId = 0;

    return function reconcile(names: string[]): string[] {
      const newMap: Record<string, string | undefined> = {};

      for (const name of names) {
        if (Object.hasOwn(nameToId, name)) newMap[name] = nameToId[name];
      }

      const removed = Object.keys(nameToId).filter((n) => !Object.hasOwn(newMap, n));
      const added = names.filter((n) => !Object.hasOwn(newMap, n));

      if (removed.length === 1 && added.length === 1) {
        newMap[added[0]] = nameToId[removed[0]];
      } else {
        for (const name of added) newMap[name] = String(nextId++);
      }

      nameToId = newMap;
      return names.map((n) => nameToId[n]!);
    };
  }

  const reconcileKeys = createStableKeys();
  let stableKeys = $derived(reconcileKeys(sectionNames));

  function trackSectionEl(key: string) {
    return (el: HTMLElement) => {
      sectionElsByKey[key] = el;
      return () => {
        delete sectionElsByKey[key];
      };
    };
  }

  function mergedKey(item: MergedSection): string {
    if (item.removed) return `removed:${item.name}`;
    return stableKeys[item.proposedIndex] ?? item.name;
  }

  // ── Section operations ──

  function generateUniqueSectionKey(): string {
    const base = 'new_section';
    if (!sectionNames.includes(base)) return base;
    let i = 2;
    while (sectionNames.includes(`${base}_${i}`)) i++;
    return `${base}_${i}`;
  }

  function addSection() {
    const key = generateUniqueSectionKey();
    sync.set(['sections', key], []);
    newlyAddedKey = key;
  }

  function deleteSection(name: string) {
    sync.remove(['sections', name]);
  }

  function chooseEntryType(sectionName: string, entryType: string) {
    if (entryType === 'text') {
      pendingTemplates[sectionName] = { template: textTemplate, textMode: true };
    } else {
      const template = findTemplateByName(entryType);
      if (template) {
        pendingTemplates[sectionName] = { template, textMode: false };
      }
    }
  }

  function renameSection(oldKey: string, newTitle: string) {
    const newKey = properSectionTitleToDictionaryKey(newTitle);
    if (oldKey === newKey || !newKey.trim()) return;
    if (sectionNames.includes(newKey)) return;
    sync.mapRename(['sections'], oldKey, newKey);
  }

  async function moveSectionUp(index: number) {
    if (index <= 0) return;
    const anchorKey = stableKeys[index];
    if (!anchorKey) return;
    const anchorEl = sectionElsByKey[anchorKey];
    if (!anchorEl) return;
    for (const key of stableKeys) {
      const el = sectionElsByKey[key];
      if (!el) continue;
      el.getAnimations().forEach((a) => a.cancel());
    }
    const animate = prepareMove(anchorKey, anchorEl.getBoundingClientRect().top);
    sync.mapMove(['sections'], index, index - 1);
    await animate();
  }

  async function moveSectionDown(index: number) {
    if (index >= sectionNames.length - 1) return;
    const anchorKey = stableKeys[index];
    if (!anchorKey) return;
    const anchorEl = sectionElsByKey[anchorKey];
    if (!anchorEl) return;
    for (const key of stableKeys) {
      const el = sectionElsByKey[key];
      if (!el) continue;
      el.getAnimations().forEach((a) => a.cancel());
    }
    const animate = prepareMove(anchorKey, anchorEl.getBoundingClientRect().top);
    sync.mapMove(['sections'], index, index + 1);
    await animate();
  }
</script>

{#if title}
  <h3 class="mt-6 mb-1 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
    {title}
  </h3>
{/if}

{#each mergedSections as item (mergedKey(item))}
  {#if item.removed}
    <!-- Removed section ghost: read from originalSync -->
    {@const firstEntry = reviewCtx?.originalSync?.seqFirst(['sections', item.name])}
    {@const entryType = detectEntryType(firstEntry)}
    {@const resolvedTemplate = entryType === 'text' ? textTemplate : entryType}
    {@const resolvedTextMode = entryType === 'text'}
    <div class="section-diff-removed">
      <SectionHeader
        sectionName={item.name}
        displayTitle={dictionaryKeyToProperSectionTitle(item.name)}
        index={0}
        totalSections={1}
        disabled={true}
      />
      {#if reviewCtx?.originalSync}
        <EntryListRenderer
          title={dictionaryKeyToProperSectionTitle(item.name)}
          template={resolvedTemplate}
          textMode={resolvedTextMode}
          arrayPath={['sections', item.name]}
          sync={reviewCtx.originalSync}
          disabled={true}
          showHeader={false}
          suppressDiff
        />
      {/if}
      {#if reviewCtx}
        <div class="diff-actions">
          <button
            class="diff-btn diff-btn-undo"
            onclick={() => reviewCtx.undo(['sections', item.name])}
          >
            <Undo2Icon class="size-2.5" />Undo
          </button>
          <button
            class="diff-btn diff-btn-keep"
            onclick={() => reviewCtx.keep(['sections', item.name])}
          >
            <CheckIcon class="size-2.5" />Keep
          </button>
        </div>
      {/if}
    </div>
  {:else}
    <!-- Normal (proposed) section -->
    {@const sectionName = item.name}
    {@const index = item.proposedIndex}
    {@const firstEntry = sync.seqFirst(['sections', sectionName])}
    {@const entryType = detectEntryType(firstEntry)}
    {@const isEmpty = sync.seqLength(['sections', sectionName]) === 0}
    {@const sectionDiff = reviewCtx?.active ? reviewCtx.mapKeysDiff(['sections']) : null}
    {@const isAddedSection = sectionDiff?.added.includes(sectionName) ?? false}
    <div
      {@attach trackSectionEl(stableKeys[index] ?? sectionName)}
      class:section-diff-added={isAddedSection}
    >
      <SectionHeader
        {sectionName}
        displayTitle={dictionaryKeyToProperSectionTitle(sectionName)}
        {index}
        totalSections={sectionNames.length}
        {disabled}
        initiallyEditing={sectionName === newlyAddedKey}
        onrename={(newName) => renameSection(sectionName, newName)}
        ondelete={() => deleteSection(sectionName)}
        onmoveup={() => moveSectionUp(index)}
        onmovedown={() => moveSectionDown(index)}
      />

      {#if isEmpty && !(sectionName in pendingTemplates)}
        <div class="flex flex-col gap-2 pt-1 pb-3 pl-4">
          <p class="text-[11px] tracking-wider text-muted-foreground/50 uppercase">Entry type</p>
          <div class="flex flex-wrap gap-1">
            {#each entryTypeOptions as opt (opt.value)}
              <button
                type="button"
                {disabled}
                onclick={() => chooseEntryType(sectionName, opt.value)}
                class="rounded border border-border/60 px-2 py-1 text-xs text-muted-foreground/70 transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                {opt.label}
              </button>
            {/each}
          </div>
        </div>
      {:else}
        {@const pending = pendingTemplates[sectionName]}
        {@const resolvedTemplate = pending
          ? pending.template
          : entryType === 'text'
            ? textTemplate
            : entryType}
        {@const resolvedTextMode = pending ? pending.textMode : entryType === 'text'}
        <EntryListRenderer
          title={dictionaryKeyToProperSectionTitle(sectionName)}
          template={resolvedTemplate}
          textMode={resolvedTextMode}
          arrayPath={['sections', sectionName]}
          {sync}
          {disabled}
          {errors}
          showHeader={false}
          autofocusOnAdd
          autoAddFirst={!!pending}
          oninitdone={() => delete pendingTemplates[sectionName]}
          suppressDiff={isAddedSection}
        />
      {/if}
      {#if isAddedSection && reviewCtx}
        <div class="diff-actions">
          <button
            class="diff-btn diff-btn-undo"
            onclick={() => reviewCtx.undo(['sections', sectionName])}
          >
            <Undo2Icon class="size-2.5" />Undo
          </button>
          <button
            class="diff-btn diff-btn-keep"
            onclick={() => reviewCtx.keep(['sections', sectionName])}
          >
            <CheckIcon class="size-2.5" />Keep
          </button>
        </div>
      {/if}
    </div>
  {/if}
{/each}

{#if sectionNames.length === 0 && mergedSections.length === 0}
  <div class="py-8 text-center">
    <p class="mb-3 text-sm text-muted-foreground/60">No sections yet.</p>
  </div>
{/if}

<button
  type="button"
  class="mt-4 flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border/60 py-2.5 text-xs text-muted-foreground/70 transition-colors hover:border-border hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
  {disabled}
  onclick={addSection}
>
  <PlusIcon class="size-3.5" />
  Add New Section
</button>

<style>
  @reference "../../../app.css";

  .section-diff-added {
    @apply -ml-1.5 rounded border-l-2 border-green-500/50 bg-green-500/[0.04] pl-1;
  }

  .section-diff-removed {
    @apply -ml-1.5 rounded border-l-2 border-red-500/50 bg-red-500/[0.04] pl-1;
  }
</style>
