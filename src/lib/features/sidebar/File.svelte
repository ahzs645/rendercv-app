<script lang="ts">
  import * as Sidebar from '$lib/ui/components/sidebar/index.js';
  import * as DropdownMenu from '$lib/ui/components/dropdown-menu/index.js';
  import { Button } from '$lib/ui/components/button/index.js';
  import LockIcon from '@lucide/svelte/icons/lock';
  import LockOpenIcon from '@lucide/svelte/icons/lock-open';
  import MoreVerticalIcon from '@lucide/svelte/icons/more-vertical';
  import CheckIcon from '@lucide/svelte/icons/check';
  import LinkIcon from '@lucide/svelte/icons/link';
  import UnlinkIcon from '@lucide/svelte/icons/unlink';

  import type { CvFile } from '$lib/features/cv-files/types';
  import { fileState, resolveFileSections } from '$lib/features/cv-files/file-state.svelte';
  import DownloadIcon from '@lucide/svelte/icons/download';
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import TrashIcon from '@lucide/svelte/icons/trash';
  import CopyIcon from '@lucide/svelte/icons/copy';
  import ArchiveIcon from '@lucide/svelte/icons/archive';
  import ArchiveRestoreIcon from '@lucide/svelte/icons/archive-restore';
  import MonitorIcon from '@lucide/svelte/icons/monitor';
  import { downloadPdf } from '$lib/features/viewer/download-cv';
  import { confirmState } from '$lib/features/primitives/confirm-state.svelte';
  import { copyPublicLink, flashCopied } from '$lib/features/cv-files/public-link';
  import { authState } from '$lib/features/auth/auth-state.svelte';
  import { upgradePromptState } from '$lib/features/auth/upgrade-prompt-state.svelte';
  import { useSidebar } from '$lib/ui/components/sidebar/context.svelte.js';
  import * as Tooltip from '$lib/ui/components/tooltip';
  import FlashTooltip from '$lib/features/primitives/FlashTooltip.svelte';
  import * as Kbd from '$lib/ui/components/kbd/index.js';
  import { capture } from '$lib/analytics/posthog-client';
  import { EVENTS } from '$lib/analytics/events';

  let { file }: { file: CvFile } = $props();
  let sidebar = useSidebar();

  const modKey =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform)
      ? '⌘'
      : 'Ctrl';

  let isSelected = $derived(fileState.selectedFile?.id === file.id);

  let tooltipText = $derived(
    file.isLocked
      ? 'Unlock to rename'
      : file.isArchived
        ? 'Restore from archive to rename'
        : file.isTrashed
          ? 'Restore from trash to rename'
          : ''
  );

  let tooltipOpen = $state(false);
  let linkCopied = $state(false);

  let isRenaming = $state(false);
  let editValue = $state('');

  function startRename() {
    editValue = file.name;
    isRenaming = true;
  }

  function saveRename() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== file.name) {
      fileState.renameFile(file.id, trimmed);
      capture(EVENTS.CV_RENAMED, { cv_id: file.id });
    }
    isRenaming = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveRename();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      isRenaming = false;
    }
  }
</script>

{#if isRenaming}
  <div
    class="flex h-8 w-full items-center gap-2 overflow-hidden rounded-md p-2 text-sm {isSelected
      ? 'bg-sidebar-accent'
      : ''}"
  >
    {#if file.isReadOnly}
      <LockIcon class="size-4 text-muted-foreground" />
    {/if}
    <input
      bind:value={editValue}
      onblur={saveRename}
      onkeydown={handleKeydown}
      class="min-w-0 flex-1 rounded"
      {@attach (node) => {
        node.focus();
        node.select();
      }}
    />
    <Button onclick={saveRename} variant="ghost" size="icon-sm" class="size-6">
      <CheckIcon />
    </Button>
  </div>
{:else}
  {#snippet fileButton()}
    <Sidebar.MenuButton
      isActive={isSelected}
      class="cursor-pointer {isSelected ? '' : 'hover:bg-sidebar-accent/50'}"
      onclick={() => {
        fileState.selectFile(file.id);
        sidebar.setOpenMobile(false);
      }}
      ondblclick={() => {
        if (file.isReadOnly) {
          tooltipOpen = true;
        } else {
          startRename();
        }
      }}
    >
      {#snippet child({ props })}
        <span {...props}>
          {#if file.isPublic}
            <Tooltip.Root>
              <Tooltip.Trigger>
                {#snippet child({ props: tipProps })}
                  <button
                    {...tipProps}
                    class="shrink-0 text-muted-foreground hover:text-foreground"
                    onclick={(e) => {
                      e.stopPropagation();
                      copyPublicLink(file.id);
                      flashCopied((v) => (linkCopied = v));
                    }}
                  >
                    {#if linkCopied}
                      <CheckIcon class="size-4" />
                    {:else}
                      <LinkIcon class="size-4" />
                    {/if}
                  </button>
                {/snippet}
              </Tooltip.Trigger>
              <Tooltip.Content>Public CV — click to copy link</Tooltip.Content>
            </Tooltip.Root>
          {/if}
          {#if file.isReadOnly}
            <LockIcon class="text-muted-foreground" />
          {/if}
          {#if !file.isPublic && !authState.isLoggedIn}
            <Tooltip.Root>
              <Tooltip.Trigger>
                {#snippet child({ props: tipProps })}
                  <span {...tipProps} class="shrink-0 text-muted-foreground">
                    <MonitorIcon class="size-4" />
                  </span>
                {/snippet}
              </Tooltip.Trigger>
              <Tooltip.Content>Saved locally — sign in for cloud sync</Tooltip.Content>
            </Tooltip.Root>
          {/if}
          <span class="truncate">{file.name}</span>
        </span>
      {/snippet}
    </Sidebar.MenuButton>
  {/snippet}

  <FlashTooltip message={tooltipText} bind:open={tooltipOpen}>
    {@render fileButton()}
  </FlashTooltip>

  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        <Sidebar.MenuAction
          {...props}
          showOnHover
          data-testid="file-context-menu"
          data-ph-capture-attribute-action="file-context-menu"
          data-ph-capture-attribute-section="file-menu"
          class="opacity-0 transition-opacity group-hover/file:opacity-100 data-[state=open]:opacity-100"
        >
          <MoreVerticalIcon />
          <span class="sr-only">More</span>
        </Sidebar.MenuAction>
      {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content
      class="w-60"
      side={sidebar.isMobile ? 'bottom' : 'right'}
      align={sidebar.isMobile ? 'end' : 'start'}
    >
      {#if file.isTrashed}
        <DropdownMenu.Item
          data-testid="action-restore"
          data-ph-capture-attribute-action="restore-file"
          data-ph-capture-attribute-section="file-menu"
          onclick={() => {
            fileState.restoreFile(file.id);
            capture(EVENTS.CV_RESTORED, { cv_id: file.id });
          }}
        >
          <ArchiveRestoreIcon />
          Restore
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item
          data-testid="action-delete-forever"
          data-ph-capture-attribute-action="delete-file-forever"
          data-ph-capture-attribute-section="file-menu"
          variant="destructive"
          onclick={() =>
            confirmState.confirm(
              `Delete "${file.name}" permanently?`,
              'This action cannot be undone. The file will be permanently removed.',
              () => {
                fileState.deleteFile(file.id);
                capture(EVENTS.CV_DELETED_PERMANENTLY, { cv_id: file.id });
              }
            )}
        >
          <TrashIcon class="size-4 text-destructive" />
          Delete forever
          {#if !sidebar.isMobile}
            <Kbd.Group class="ml-auto">
              <Kbd.Root>{modKey}</Kbd.Root>
              <Kbd.Root>⌫</Kbd.Root>
            </Kbd.Group>
          {/if}
        </DropdownMenu.Item>
      {:else if file.isArchived}
        <DropdownMenu.Item
          data-testid="action-restore"
          data-ph-capture-attribute-action="restore-file"
          data-ph-capture-attribute-section="file-menu"
          onclick={() => {
            fileState.restoreFromArchive(file.id);
            capture(EVENTS.CV_RESTORED, { cv_id: file.id });
          }}
        >
          <ArchiveRestoreIcon />
          Restore
        </DropdownMenu.Item>
        <DropdownMenu.Item
          data-ph-capture-attribute-action="download-archived-file"
          data-ph-capture-attribute-section="file-menu"
          onclick={async () => {
            await downloadPdf(resolveFileSections(file), `${file.name}.pdf`);
            capture(EVENTS.CV_DOWNLOADED, { format: 'pdf', source: 'archive', cv_id: file.id, edit_count: file.editCount ?? 0, theme: file.selectedTheme });
          }}
        >
          <DownloadIcon />
          Download
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item
          data-testid="action-move-to-trash"
          data-ph-capture-attribute-action="trash-file"
          data-ph-capture-attribute-section="file-menu"
          variant="destructive"
          onclick={() => {
            fileState.trashFile(file.id);
            capture(EVENTS.CV_TRASHED, { cv_id: file.id });
          }}
        >
          <TrashIcon class="size-4 text-destructive" />
          Move to trash
          {#if !sidebar.isMobile}
            <Kbd.Group class="ml-auto">
              <Kbd.Root>{modKey}</Kbd.Root>
              <Kbd.Root>⌫</Kbd.Root>
            </Kbd.Group>
          {/if}
        </DropdownMenu.Item>
      {:else}
        {#if file.isLocked}
          <DropdownMenu.Item
            data-testid="action-unlock"
            data-ph-capture-attribute-action="unlock-file"
            data-ph-capture-attribute-section="file-menu"
            onclick={() => {
              fileState.unlockFile(file.id);
              capture(EVENTS.CV_UNLOCKED, { cv_id: file.id });
            }}
          >
            <LockOpenIcon />
            Unlock
            {#if !sidebar.isMobile}
              <Kbd.Group class="ml-auto">
                <Kbd.Root>{modKey}</Kbd.Root>
                <Kbd.Root>K</Kbd.Root>
              </Kbd.Group>
            {/if}
          </DropdownMenu.Item>
        {:else}
          <DropdownMenu.Item
            data-testid="action-lock"
            data-ph-capture-attribute-action="lock-file"
            data-ph-capture-attribute-section="file-menu"
            onclick={() => {
              fileState.lockFile(file.id);
              capture(EVENTS.CV_LOCKED, { cv_id: file.id });
            }}
          >
            <LockIcon />
            Lock
            {#if !sidebar.isMobile}
              <Kbd.Group class="ml-auto">
                <Kbd.Root>{modKey}</Kbd.Root>
                <Kbd.Root>K</Kbd.Root>
              </Kbd.Group>
            {/if}
          </DropdownMenu.Item>
        {/if}
        {#if authState.can('plus')}
          {#if file.isPublic}
            <DropdownMenu.Item data-ph-capture-attribute-action="make-private" data-ph-capture-attribute-section="file-menu" onclick={() => fileState.makePrivate(file.id)}>
              <UnlinkIcon />
              Make private
            </DropdownMenu.Item>
          {:else}
            <DropdownMenu.Item
              data-ph-capture-attribute-action="make-public"
              data-ph-capture-attribute-section="file-menu"
              onclick={() => {
                fileState.makePublic(file.id);
                capture(EVENTS.CV_MADE_PUBLIC, { cv_id: file.id });
                copyPublicLink(file.id);
              }}
            >
              <LinkIcon />
              Make public and copy link
            </DropdownMenu.Item>
          {/if}
        {:else if authState.isLoggedIn}
          <DropdownMenu.Item data-ph-capture-attribute-action="make-public-upgrade" data-ph-capture-attribute-section="file-menu" onclick={() => upgradePromptState.show('public-sharing')}>
            <LinkIcon />
            Make public and copy link
            <span class="ml-auto text-xs text-muted-foreground">Plus</span>
          </DropdownMenu.Item>
        {/if}
        <DropdownMenu.Item
          data-testid="action-duplicate"
          data-ph-capture-attribute-action="duplicate-file"
          data-ph-capture-attribute-section="file-menu"
          onclick={() => {
            const newFile = fileState.duplicateFile(file.id);
            capture(EVENTS.CV_DUPLICATED, { cv_id: newFile?.id, source_cv_id: file.id });
            if (newFile) capture(EVENTS.CV_CREATED, { cv_id: newFile.id, create_method: 'duplicate' });
          }}
        >
          <CopyIcon />
          Duplicate
          {#if !sidebar.isMobile}
            <Kbd.Group class="ml-auto">
              <Kbd.Root>{modKey}</Kbd.Root>
              <Kbd.Root>D</Kbd.Root>
            </Kbd.Group>
          {/if}
        </DropdownMenu.Item>
        {#if !file.isLocked}
          <DropdownMenu.Item data-ph-capture-attribute-action="rename-file" data-ph-capture-attribute-section="file-menu" onclick={startRename}>
            <PencilIcon />
            Rename
          </DropdownMenu.Item>
        {/if}
        <DropdownMenu.Separator />
        <DropdownMenu.Item
          data-testid="action-move-to-archive"
          data-ph-capture-attribute-action="archive-file"
          data-ph-capture-attribute-section="file-menu"
          onclick={() => {
            fileState.archiveFile(file.id);
            capture(EVENTS.CV_ARCHIVED, { cv_id: file.id });
          }}
        >
          <ArchiveIcon />
          Move to archive
        </DropdownMenu.Item>
        <DropdownMenu.Item
          data-testid="action-move-to-trash"
          data-ph-capture-attribute-action="trash-file"
          data-ph-capture-attribute-section="file-menu"
          variant="destructive"
          onclick={() => {
            fileState.trashFile(file.id);
            capture(EVENTS.CV_TRASHED, { cv_id: file.id });
          }}
        >
          <TrashIcon class="size-4 text-destructive" />
          Move to trash
          {#if !sidebar.isMobile}
            <Kbd.Group class="ml-auto">
              <Kbd.Root>{modKey}</Kbd.Root>
              <Kbd.Root>⌫</Kbd.Root>
            </Kbd.Group>
          {/if}
        </DropdownMenu.Item>
      {/if}
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{/if}
