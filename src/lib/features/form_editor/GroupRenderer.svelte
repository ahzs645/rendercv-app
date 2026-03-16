<script lang="ts">
  import { getContext } from 'svelte';
  import Undo2Icon from '@lucide/svelte/icons/undo-2';
  import CheckIcon from '@lucide/svelte/icons/check';
  import type { FieldGroup } from './schema/types.js';
  import type { YamlSync } from './yaml-sync.svelte.js';
  import type { FormErrors } from './form-errors.js';
  import type { FormReviewContext } from './yaml-diff.js';
  import { computeLabelWidth } from './measure-labels.js';
  import FieldRenderer from './FieldRenderer.svelte';
  import StringInput from './inputs/StringInput.svelte';
  import DiffField from './DiffField.svelte';

  interface Props {
    group: FieldGroup;
    sync: YamlSync;
    disabled?: boolean;
    errors?: FormErrors;
    labelWidth?: string;
    getDefault?: (path: string[]) => unknown;
  }

  let {
    group,
    sync,
    disabled,
    errors,
    labelWidth: labelWidthOverride,
    getDefault
  }: Props = $props();

  let labelWidth = $derived(labelWidthOverride ?? computeLabelWidth(group.fields));

  const reviewCtx = getContext<FormReviewContext | undefined>('form-review');
</script>

<h3 class="mt-6 mb-1 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
  {group.title}
</h3>
<div style:--label-width={labelWidth}>
  {#each group.fields as field (field.path.join('.'))}
    {@const status = reviewCtx?.diffAt(field.path) ?? 'unchanged'}
    {#if status !== 'unchanged' && reviewCtx?.active}
      {#if status === 'modified' && field.type === 'string_list'}
        <!-- Per-item diff for string lists -->
        {@const itemDiffs = reviewCtx.seqItemDiffs(field.path)}
        {@const origArr = (reviewCtx.originalSync?.get(field.path) as string[] | null) ?? []}
        {@const propArr = (sync.get(field.path) as string[] | null) ?? []}
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
          <button class="diff-btn diff-btn-undo" onclick={() => reviewCtx.undo(field.path)}>
            <Undo2Icon class="size-2.5" />Undo
          </button>
          <button class="diff-btn diff-btn-keep" onclick={() => reviewCtx.keep(field.path)}>
            <CheckIcon class="size-2.5" />Keep
          </button>
        </div>
      {:else}
        <DiffField
          {status}
          onKeep={() => reviewCtx.keep(field.path)}
          onUndo={() => reviewCtx.undo(field.path)}
        >
          {#snippet original()}
            <FieldRenderer
              {field}
              value={reviewCtx.originalSync?.get(field.path)}
              defaultValue={getDefault?.(field.path)}
              onchange={() => {}}
              disabled={true}
            />
          {/snippet}
          <FieldRenderer
            {field}
            value={sync.get(field.path)}
            defaultValue={getDefault?.(field.path)}
            onchange={() => {}}
            disabled={true}
          />
        </DiffField>
      {/if}
    {:else}
      <FieldRenderer
        {field}
        value={sync.get(field.path)}
        defaultValue={getDefault?.(field.path)}
        onchange={(v) => sync.set(field.path, v)}
        {disabled}
        error={errors?.forField(field.path)}
      />
    {/if}
  {/each}
</div>
