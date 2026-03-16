<script lang="ts">
  import * as DropdownMenu from '$lib/ui/components/dropdown-menu/index.js';
  import { Button } from '$lib/ui/components/button/index.js';
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import CheckIcon from '@lucide/svelte/icons/check';
  import FlashTooltip from '$lib/features/primitives/FlashTooltip.svelte';
  import { fileState } from '$lib/features/cv-files/file-state.svelte';
  import { themes, locales } from 'virtual:rendercv-variants';
  import { themeLabel, localeLabel } from '$lib/features/cv-files/variant-labels';
  import { capture } from '$lib/analytics/posthog-client';
  import { EVENTS } from '$lib/analytics/events';

  let { activeSection }: { activeSection: 'design' | 'locale' } = $props();

  let file = $derived(fileState.selectedFile);
  let disabled = $derived(fileState.selectedFileReadOnly ?? false);
  let disabledMessage = $derived(
    file?.isLocked
      ? 'Unlock to change'
      : file?.isArchived
        ? 'Restore from archive to change'
        : file?.isTrashed
          ? 'Restore from trash to change'
          : ''
  );
  let options = $derived(activeSection === 'design' ? themes : locales);
  let selected = $derived(
    activeSection === 'design' ? (file?.selectedTheme ?? '') : (file?.selectedLocale ?? '')
  );
  let labelFn = $derived(activeSection === 'design' ? themeLabel : localeLabel);

  function onSelect(value: string) {
    if (!file) return;
    if (activeSection === 'design') {
      fileState.setTheme(file.id, value);
      capture(EVENTS.CV_THEME_CHANGED, { theme: value, cv_id: file.id });
    } else {
      fileState.setLocale(file.id, value);
      capture(EVENTS.CV_LOCALE_CHANGED, { locale: value, cv_id: file.id });
    }
  }

  let idx = $derived(options.indexOf(selected));

  let displayedSelected = $state('');
  let initial = true;
  $effect(() => {
    void selected;
    if (initial) {
      initial = false;
      displayedSelected = selected;
      return;
    }
    const timeout = setTimeout(() => (displayedSelected = selected), 100);
    return () => clearTimeout(timeout);
  });

  let tooltipOpen = $state(false);

  function prev() {
    onSelect(options[(idx - 1 + options.length) % options.length]);
  }

  function next() {
    onSelect(options[(idx + 1) % options.length]);
  }
</script>

{#if file}
  <FlashTooltip message={disabledMessage} bind:open={tooltipOpen} flashOnClick={disabled}>
    <div class="flex items-center gap-0.5" data-testid="variant-selector">
      <Button
        variant="ghost"
        size="icon"
        class="size-6"
        onclick={prev}
        {disabled}
        aria-label="Previous"
        data-ph-capture-attribute-action="prev-variant"
        data-ph-capture-attribute-section="editor-toolbar"
      >
        <ChevronLeftIcon class="size-3.5" />
      </Button>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger {disabled}>
          {#snippet child({ props })}
            <Button
              {...props}
              variant="ghost"
              size="sm"
              class="h-6 justify-between gap-1 px-2 text-xs font-medium"
              data-ph-capture-attribute-action="variant-dropdown"
              data-ph-capture-attribute-section="editor-toolbar"
            >
              <span class="inline-grid text-left">
                {#each options as key (key)}
                  <span class="col-start-1 row-start-1 {key !== selected ? 'invisible' : ''}"
                    >{labelFn(key)}</span
                  >
                {/each}
              </span>
              <ChevronDownIcon class="size-3 shrink-0" />
            </Button>
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="start">
          {#each options as key (key)}
            <DropdownMenu.Item onclick={() => onSelect(key)} class="text-xs" data-ph-capture-attribute-action="select-variant" data-ph-capture-attribute-section="editor-toolbar">
              {#if key === displayedSelected}<CheckIcon class="size-3" />{/if}
              {labelFn(key)}
            </DropdownMenu.Item>
          {/each}
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      <Button
        variant="ghost"
        size="icon"
        class="size-6"
        onclick={next}
        {disabled}
        aria-label="Next"
        data-ph-capture-attribute-action="next-variant"
        data-ph-capture-attribute-section="editor-toolbar"
      >
        <ChevronRightIcon class="size-3.5" />
      </Button>
    </div>
  </FlashTooltip>
{/if}
