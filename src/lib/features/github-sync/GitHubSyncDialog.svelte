<script lang="ts">
  import * as Dialog from '$lib/ui/components/dialog/index.js';
  import { Button } from '$lib/ui/components/button/index.js';
  import { Input } from '$lib/ui/components/input/index.js';
  import { Switch } from '$lib/ui/components/switch/index.js';
  import { Label } from '$lib/ui/components/label/index.js';
  import LoadingSpinner from '$lib/features/primitives/LoadingSpinner.svelte';
  import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
  import { githubSyncState } from './github-sync-state.svelte';
  import { redirectToGithubAuth } from './github-sync';

  let { open = $bindable(false) }: { open: boolean } = $props();

  let repoName = $state('rendercv-output');
  let isPrivate = $state(false);
  let disconnecting = $state(false);

  $effect(() => {
    if (open) {
      githubSyncState.loadConnection();
    }
  });

  function handleAuth() {
    if (!repoName.trim()) return;
    redirectToGithubAuth(repoName.trim(), isPrivate);
  }

  async function handleDisconnect() {
    disconnecting = true;
    await githubSyncState.disconnect();
    disconnecting = false;
    open = false;
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="flex w-md flex-col gap-5" onOpenAutoFocus={(e) => e.preventDefault()}>
    <Dialog.Header>
      <Dialog.Title class="w-full text-center">Sync to GitHub</Dialog.Title>
      <Dialog.Description class="w-full text-center">
        Automatically push all your CVs to a GitHub repository on every save.
      </Dialog.Description>
    </Dialog.Header>

    {#if githubSyncState.loading}
      <div class="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    {:else if githubSyncState.connection}
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-2 rounded-md border p-3">
          <div class="flex items-center gap-2">
            <span class="icon-[mdi--github] size-5"></span>
            <a
              href={githubSyncState.connection.repoUrl}
              target="_blank"
              class="flex items-center gap-1 font-medium underline"
            >
              {githubSyncState.connection.repoFullName}
              <ExternalLinkIcon class="size-3.5" />
            </a>
          </div>
          <p class="text-sm text-muted-foreground">
            Your CVs are automatically synced on every save.
          </p>
        </div>
        <Button
          variant="destructive"
          class="w-full"
          data-ph-capture-attribute-action="github-disconnect"
          data-ph-capture-attribute-section="footer"
          disabled={disconnecting}
          onclick={handleDisconnect}
        >
          {#if disconnecting}
            <LoadingSpinner />
          {/if}
          Disconnect from GitHub
        </Button>
      </div>
    {:else}
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <Label for="repo-name">Repository name</Label>
          <Input id="repo-name" bind:value={repoName} placeholder="rendercv-output" />
        </div>
        <div class="flex items-center gap-2">
          <Switch id="private-repo" bind:checked={isPrivate} />
          <Label for="private-repo">Private repository</Label>
        </div>
        <div
          class="rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400"
        >
          This will force-push to the repository, replacing all existing content. Any previous data
          in the repo will be overwritten.
        </div>
        <Button class="w-full" onclick={handleAuth} data-ph-capture-attribute-action="github-auth" data-ph-capture-attribute-section="footer">
          <span class="icon-[mdi--github] size-5"></span>
          Authenticate with GitHub
        </Button>
      </div>
    {/if}
  </Dialog.Content>
</Dialog.Root>
