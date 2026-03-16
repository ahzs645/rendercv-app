<script lang="ts">
  import * as Sidebar from '$lib/ui/components/sidebar/index.js';
  import * as Collapsible from '$lib/ui/components/collapsible/index.js';
  import { Button } from '$lib/ui/components/button/index.js';
  import FeedbackButton from '$lib/features/feedback/FeedbackButton.svelte';
  import LoadingSpinner from '$lib/features/primitives/LoadingSpinner.svelte';
  import StarIcon from '@lucide/svelte/icons/star';
  import DollarSignIcon from '@lucide/svelte/icons/dollar-sign';
  import HandshakeIcon from '@lucide/svelte/icons/handshake';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import FolderDownIcon from '@lucide/svelte/icons/folder-down';
  import { getStarCount } from '$lib/features/primitives/query-stars.remote';
  import { fileState, resolveFileSections } from '$lib/features/cv-files/file-state.svelte';
  import { viewer } from '$lib/features/viewer/viewer-state.svelte';
  import { downloadBlob } from '$lib/utils/download';
  import type { ZipFile } from '$lib/features/cv-files/zip.worker';
  import { authState } from '$lib/features/auth/auth-state.svelte';
  import { loginDialogState } from '$lib/features/auth/login-dialog-state.svelte';
  import { upgradePromptState } from '$lib/features/auth/upgrade-prompt-state.svelte';
  import { githubSyncState } from '$lib/features/github-sync/github-sync-state.svelte';
  import { redirectToGithubAuth } from '$lib/features/github-sync/github-sync';
  import GitHubSyncDialog from '$lib/features/github-sync/GitHubSyncDialog.svelte';
  import { preferences } from '$lib/features/preferences/pref-state.svelte';
  import { capture } from '$lib/analytics/posthog-client';
  import { EVENTS } from '$lib/analytics/events';
  import { tick, type Component } from 'svelte';

  const starCount = getStarCount();
  const pricingHref = $derived(
    authState.interval === 'year' ? '/pricing?billing=yearly' : '/pricing'
  );

  let isDownloadingAll = $state(false);
  let githubSyncDialogOpen = $state(false);

  async function downloadAllCvs() {
    if (isDownloadingAll) return;
    await tick();
    isDownloadingAll = true;

    try {
      const groups: { files: typeof fileState.activeFiles; group?: string }[] = [
        { files: fileState.activeFiles },
        { files: fileState.archivedFiles, group: 'Archive' },
        { files: fileState.trashedFiles, group: 'Trash' }
      ];

      const zipFiles: ZipFile[] = [];
      for (const { files: groupFiles, group } of groups) {
        for (const file of groupFiles) {
          const sections = resolveFileSections($state.snapshot(file));
          const typst = await viewer.renderToTypst(sections);
          const pdf = await viewer.renderToPdf(sections);
          if (typst && pdf) zipFiles.push({ name: file.name, sections, typst, pdf, group });
        }
      }
      if (zipFiles.length === 0) throw new Error('No files to download');

      const blob = await new Promise<Blob>((resolve, reject) => {
        import('$lib/features/cv-files/zip.worker.ts?worker')
          .then((ZipWorker) => {
            const worker = new ZipWorker.default();
            worker.postMessage({ files: zipFiles });
            worker.onmessage = (event: MessageEvent) => {
              if (event.data.type === 'SUCCESS') {
                resolve(event.data.blob);
              } else {
                reject(new Error('Failed to create zip'));
              }
              worker.terminate();
            };
            worker.onerror = () => {
              reject(new Error('Worker error'));
              worker.terminate();
            };
          })
          .catch(reject);
      });

      await downloadBlob(blob, 'CVs.zip');
      capture(EVENTS.CV_DOWNLOADED, { format: 'zip', source: 'download_all', cv_id: null, edit_count: null });
    } finally {
      isDownloadingAll = false;
    }
  }
</script>

{#snippet footerLink(href: string, label: string, Icon: Component, action?: string)}
  <Sidebar.MenuItem>
    <Sidebar.MenuButton size="sm" class="h-5.5 py-0">
      {#snippet child({ props })}
        <a {href} {...props} data-ph-capture-attribute-action={action} data-ph-capture-attribute-section="footer">
          <Icon class="size-3.5!" />
          {label}
        </a>
      {/snippet}
    </Sidebar.MenuButton>
  </Sidebar.MenuItem>
{/snippet}

<Sidebar.MenuItem>
  <FeedbackButton />
</Sidebar.MenuItem>
<Sidebar.MenuItem>
  {#if !authState.isLoggedIn}
    <Sidebar.MenuButton
      size="sm"
      class="h-5.5 py-0"
      data-ph-capture-attribute-action="github-sync"
      data-ph-capture-attribute-section="footer"
      onclick={() =>
        loginDialogState.show({
          title: 'Sign in to sync to GitHub',
          description: 'Sign in to sync your CVs to a GitHub repository'
        })}
    >
      <span class="icon-[mdi--github] size-3.5!"></span>
      Sync all to GitHub
    </Sidebar.MenuButton>
  {:else if !authState.can('plus')}
    <Sidebar.MenuButton
      size="sm"
      class="h-5.5 py-0"
      data-ph-capture-attribute-action="github-sync"
      data-ph-capture-attribute-section="footer"
      onclick={() => upgradePromptState.show('github-sync')}
    >
      <span class="icon-[mdi--github] size-3.5!"></span>
      Sync all to GitHub
    </Sidebar.MenuButton>
  {:else if githubSyncState.connection}
    <Sidebar.MenuButton size="sm" class="h-5.5 py-0" data-ph-capture-attribute-action="github-sync" data-ph-capture-attribute-section="footer" onclick={() => (githubSyncDialogOpen = true)}>
      <span class="icon-[mdi--github] size-3.5!"></span>
      GitHub synced
    </Sidebar.MenuButton>
  {:else}
    <Sidebar.MenuButton size="sm" class="h-5.5 py-0" data-ph-capture-attribute-action="github-sync" data-ph-capture-attribute-section="footer" onclick={() => (githubSyncDialogOpen = true)}>
      <span class="icon-[mdi--github] size-3.5!"></span>
      Sync all to GitHub
    </Sidebar.MenuButton>
  {/if}
</Sidebar.MenuItem>
<GitHubSyncDialog bind:open={githubSyncDialogOpen} />
<Sidebar.MenuItem>
  <Sidebar.MenuButton
    size="sm"
    class="h-5.5 py-0"
    data-testid="download-all-data"
    data-ph-capture-attribute-action="download-all-data"
    data-ph-capture-attribute-section="footer"
    onclick={downloadAllCvs}
    disabled={isDownloadingAll}
  >
    {#if isDownloadingAll}
      <LoadingSpinner />
      Downloading...
    {:else}
      <FolderDownIcon class="size-3.5!" />
      Download all data
    {/if}
  </Sidebar.MenuButton>
</Sidebar.MenuItem>
<Collapsible.Root
  open={!preferences.linksCollapsed}
  onOpenChange={(v) => {
    preferences.linksCollapsed = !v;
  }}
  class="group/collapsible"
>
  <Sidebar.Group class="p-0">
    <Collapsible.Trigger class="group/trigger relative flex w-full cursor-pointer items-center">
      <div class="my-2 h-px w-full bg-sidebar-border"></div>
      <ChevronDownIcon
        class="absolute top-1/2 left-1/2 size-5 -translate-x-1/2 -translate-y-1/2 -rotate-180 rounded-full bg-sidebar px-0.5 text-sidebar-foreground/50 opacity-0 transition-all duration-200 group-hover/trigger:opacity-100 group-data-[state=open]/collapsible:rotate-0 max-lg:opacity-100"
      />
    </Collapsible.Trigger>
    <Collapsible.Content
      forceMount
      class="grid transition-[grid-template-rows] duration-200 ease-out data-[state=closed]:grid-rows-[0fr] data-[state=open]:grid-rows-[1fr]"
    >
      <div class="overflow-hidden">
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            <Sidebar.MenuItem>
              <Sidebar.MenuButton size="sm" class="h-5.5 py-0" data-ph-capture-attribute-action="open-source-link" data-ph-capture-attribute-section="footer">
                <span class="icon-[mdi--github] size-3.5!"></span>
                <a
                  href="https://github.com/rendercv/rendercv"
                  target="_blank"
                  class="flex flex-row items-center gap-1"
                >
                  <span>Open-source</span>
                  <StarIcon class="mb-px size-3" />
                  <span>{starCount.current}</span>
                </a>
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
            {@render footerLink(pricingHref, 'Pricing', DollarSignIcon, 'pricing-link')}
            {@render footerLink('/privacy-policy', 'Privacy policy', HandshakeIcon, 'privacy-policy-link')}
            {@render footerLink('/terms-of-service', 'Terms of service', FileTextIcon, 'terms-of-service-link')}
          </Sidebar.Menu>
        </Sidebar.GroupContent>
        <Sidebar.Separator class="my-2" />
      </div>
    </Collapsible.Content>
  </Sidebar.Group>
</Collapsible.Root>
