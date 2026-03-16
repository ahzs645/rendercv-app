<script lang="ts">
  import { slide } from 'svelte/transition';
  import ReorderableList from '../ReorderableList.svelte';
  import type { ReorderableListHandle } from '../ReorderableList.svelte';
  import ListFieldRow from '../ListFieldRow.svelte';
  import StringInput from './StringInput.svelte';
  import XIcon from '@lucide/svelte/icons/x';

  interface Props {
    value: string[];
    label: string;
    description?: string;
    disabled?: boolean;
    placeholder?: string;
    error?: string;
    ordered?: boolean;
    onchange?: (value: string[]) => void;
  }

  let {
    value = $bindable([]),
    label,
    description,
    disabled,
    placeholder = 'Enter text...',
    error,
    ordered = true,
    onchange
  }: Props = $props();

  let listHandle = $state<ReorderableListHandle>();

  function emit(newValue: string[]) {
    value = newValue;
    onchange?.(newValue);
  }

  function addItem() {
    listHandle?.add();
    emit([...value, '']);
  }

  function removeItem(index: number) {
    emit(value.filter((_, i) => i !== index));
  }

  function updateItem(index: number, newText: string) {
    const next = [...value];
    next[index] = newText;
    emit(next);
  }
</script>

<ListFieldRow {label} {error} {description} {disabled} onadd={addItem}>
  {#if ordered}
    <ReorderableList
      count={value.length}
      {disabled}
      bind:handle={listHandle}
      itemClass="border-b border-border/25 last:border-b-0"
      dragShadow="0 4px 12px rgba(0,0,0,0.1)"
      onreorder={(from, to) => {
        const arr = [...value];
        const [moved] = arr.splice(from, 1);
        arr.splice(to, 0, moved);
        emit(arr);
      }}
      onswap={(a, b) => {
        const arr = [...value];
        [arr[a], arr[b]] = [arr[b], arr[a]];
        emit(arr);
      }}
      onremove={(i) => removeItem(i)}
    >
      {#snippet item({ index })}
        <StringInput
          value={value[index] ?? ''}
          onchange={(v) => updateItem(index, v)}
          {placeholder}
          {disabled}
          bare
        />
      {/snippet}
    </ReorderableList>
  {:else}
    {#each value as _, index (index)}
      <div
        class="simple-item relative border-b border-border/25 last:border-b-0"
        out:slide={{ duration: 150 }}
      >
        <button
          type="button"
          class="simple-item-control absolute top-1/2 right-3 flex size-5 -translate-y-1/2 items-center justify-center text-muted-foreground/50 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
          {disabled}
          onclick={() => removeItem(index)}
          aria-label="Remove"
        >
          <XIcon class="size-3" />
        </button>
        <div class="pr-5">
          <StringInput
            value={value[index] ?? ''}
            onchange={(v) => updateItem(index, v)}
            {placeholder}
            {disabled}
            bare
          />
        </div>
      </div>
    {/each}
  {/if}
</ListFieldRow>

<style>
  .simple-item-control {
    opacity: 1;
    transition-property: opacity;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
  }

  @media (min-width: 768px) {
    .simple-item-control {
      opacity: 0;
    }
    .simple-item:hover > .simple-item-control {
      opacity: 1;
    }
  }
</style>
