<script lang="ts">
  import * as Dialog from '$lib/ui/components/dialog/index.js';
  import { Button } from '$lib/ui/components/button/index.js';
  import { Checkbox } from '$lib/ui/components/checkbox/index.js';
  import { Label } from '$lib/ui/components/label/index.js';
  import LoadingSpinner from '$lib/features/primitives/LoadingSpinner.svelte';
  import { authState } from './auth-state.svelte';
  import { FileSyncManager } from '$lib/features/cv-files/file-sync.svelte';
  import { loginDialogState } from './login-dialog-state.svelte';

  let { open = $bindable(false), callbackURL }: { open: boolean; callbackURL?: string } = $props();

  let loadingProvider = $state<'google' | 'github' | null>(null);
  let wantsEmailUpdates = $state(false);

  // Snapshot display values when dialog opens so they stay stable during close animation
  let title = $state('Join or sign in');
  let description = $state('Save your CVs and access your account');
  let onlyProvider = $state<'google' | 'github' | null>(null);

  $effect(() => {
    if (open) {
      title = loginDialogState.title ?? 'Join or sign in';
      description = loginDialogState.description ?? 'Save your CVs and access your account';
      onlyProvider = loginDialogState.onlyProvider;
    }
  });
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="flex w-md flex-col gap-5" onOpenAutoFocus={(e) => e.preventDefault()}>
    <Dialog.Header>
      <Dialog.Title class="w-full text-center">{title}</Dialog.Title>
      <Dialog.Description class="w-full text-center">{description}</Dialog.Description>
    </Dialog.Header>
    <div class="flex flex-col gap-3">
      {#if onlyProvider !== 'github'}
        <Button
          variant="outline"
          class="w-full justify-center gap-2"
          data-ph-capture-attribute-action="sign-in-google"
          data-ph-capture-attribute-section="auth"
          disabled={loadingProvider !== null}
          onclick={() => {
            loadingProvider = 'google';
            FileSyncManager.saveGuestFiles();
            authState.signInWithGoogle(wantsEmailUpdates, callbackURL);
          }}
        >
          {#if loadingProvider === 'google'}
            <LoadingSpinner />
          {:else}
            <span class="icon-[mdi--google] size-5"></span>
          {/if}
          Continue with Google
        </Button>
      {/if}
      {#if onlyProvider !== 'google'}
        <Button
          variant="outline"
          class="w-full justify-center gap-2"
          data-ph-capture-attribute-action="sign-in-github"
          data-ph-capture-attribute-section="auth"
          disabled={loadingProvider !== null}
          onclick={() => {
            loadingProvider = 'github';
            FileSyncManager.saveGuestFiles();
            authState.signInWithGithub(wantsEmailUpdates, callbackURL);
          }}
        >
          {#if loadingProvider === 'github'}
            <LoadingSpinner />
          {:else}
            <span class="icon-[mdi--github] size-5"></span>
          {/if}
          Continue with GitHub
        </Button>
      {/if}
    </div>
    <div class="flex flex-col justify-center gap-4">
      <Dialog.Description class="flex items-center justify-center gap-2 text-xs">
        <Checkbox
          id="email-updates"
          class="mb-px size-3 cursor-pointer"
          bind:checked={wantsEmailUpdates}
        />
        <Label for="email-updates" class="cursor-pointer text-xs font-normal"
          >Receive feature updates and improvements</Label
        >
      </Dialog.Description>
      <Dialog.Description class="w-full text-center text-xs"
        >By continuing, you agree to our <a href="/terms-of-service" class="underline"
          >Terms of Service</a
        >
        and <a href="/privacy-policy" class="underline">Privacy Policy</a>.</Dialog.Description
      >
    </div>
  </Dialog.Content>
</Dialog.Root>
