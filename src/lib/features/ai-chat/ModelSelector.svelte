<script lang="ts">
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import LockIcon from '@lucide/svelte/icons/lock';
  import CheckIcon from '@lucide/svelte/icons/check';
  import * as Popover from '$lib/ui/components/popover/index.js';
  import { AI_MODELS, type AiModel } from './models';
  import { preferences } from '$lib/features/preferences/pref-state.svelte';
  import { authState } from '$lib/features/auth/auth-state.svelte';
  import { upgradePromptState } from '$lib/features/auth/upgrade-prompt-state.svelte';
  import { aiChat } from './chat-state.svelte';

  let open = $state(false);

  const currentModel = $derived(
    AI_MODELS.find((m) => m.id === preferences.selectedModel) ?? AI_MODELS[0]
  );

  function canUseModel(model: AiModel): boolean {
    return authState.can(model.minTier);
  }

  function selectModel(model: AiModel) {
    if (!canUseModel(model)) {
      open = false;
      upgradePromptState.show('ai-models', { highlight: model.minTier });
      return;
    }
    if (model.id !== preferences.selectedModel) {
      preferences.selectedModel = model.id;
      aiChat.resetChat();
    }
    open = false;
  }
</script>

<Popover.Root bind:open>
  <Popover.Trigger>
    {#snippet child({ props })}
      <button
        {...props}
        type="button"
        class="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        data-ph-capture-attribute-action="model-selector"
        data-ph-capture-attribute-section="chat"
      >
        <span class="truncate">{currentModel.label}</span>
        <ChevronDownIcon class="size-3 shrink-0" />
      </button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content
    side="top"
    align="start"
    sideOffset={8}
    class="w-56 p-1.5"
    onOpenAutoFocus={(e) => e.preventDefault()}
  >
    <div class="flex flex-col">
      {#each AI_MODELS as model (model.id)}
        {@const isSelected = model.id === preferences.selectedModel}
        {@const isLocked = !canUseModel(model)}
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs transition-colors
            {isLocked
            ? 'cursor-pointer text-muted-foreground/60 hover:bg-accent/50'
            : isSelected
              ? 'bg-accent text-foreground'
              : 'text-foreground hover:bg-accent'}"
          onclick={() => selectModel(model)}
        >
          <span class="flex-1 truncate">{model.label}</span>
          <span
            class="shrink-0 text-[10px] tracking-tight {isLocked
              ? 'text-muted-foreground/40'
              : 'text-muted-foreground/70'}"
          >
            {'$'.repeat(model.cost)}
          </span>
          {#if isLocked}
            <LockIcon class="size-3 shrink-0 text-muted-foreground/50" />
          {:else if isSelected}
            <CheckIcon class="size-3 shrink-0" />
          {/if}
        </button>
      {/each}
    </div>
  </Popover.Content>
</Popover.Root>
