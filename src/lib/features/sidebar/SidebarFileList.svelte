<script lang="ts">
  import * as Sidebar from '$lib/ui/components/sidebar/index.js';
  import * as DropdownMenu from '$lib/ui/components/dropdown-menu/index.js';
  import { Button } from '$lib/ui/components/button/index.js';
  import File from './File.svelte';
  import { fileState } from '$lib/features/cv-files/file-state.svelte';
  import { preferences } from '$lib/features/preferences/pref-state.svelte';
  import TrashIcon from '@lucide/svelte/icons/trash';
  import ArchiveIcon from '@lucide/svelte/icons/archive';
  import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
  import XIcon from '@lucide/svelte/icons/x';
  import LoadingSpinner from '$lib/features/primitives/LoadingSpinner.svelte';
  import { flip } from 'svelte/animate';
  import { slide } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

  let scrollEl: HTMLElement | null = $state(null);
  let canScrollUp = $state(false);
  let canScrollDown = $state(false);

  function checkScroll() {
    if (!scrollEl) return;
    canScrollUp = scrollEl.scrollTop > 0;
    canScrollDown = scrollEl.scrollTop + scrollEl.clientHeight < scrollEl.scrollHeight - 1;
  }

  // Set up scroll listener and resize observer
  $effect(() => {
    if (!scrollEl) return;
    checkScroll();
    scrollEl.addEventListener('scroll', checkScroll, { passive: true });
    const observer = new ResizeObserver(checkScroll);
    observer.observe(scrollEl);
    return () => {
      scrollEl!.removeEventListener('scroll', checkScroll);
      observer.disconnect();
    };
  });

  // Re-check when content changes
  $effect(() => {
    void fileState.generation;
    void fileState.loading;
    void preferences.showArchive;
    void preferences.showTrash;
    checkScroll();
    // Re-check after slide transitions complete
    const timer = setTimeout(checkScroll, 250);
    return () => clearTimeout(timer);
  });
</script>

{#snippet fileList(files: typeof fileState.activeFiles)}
  {#key fileState.generation}
    {#each files as file (file.id)}
      <li
        animate:flip={{ duration: 200, easing: cubicOut }}
        out:slide={{ duration: 200, easing: cubicOut }}
        class="group/menu-item relative"
        data-slot="sidebar-menu-item"
        data-sidebar="menu-item"
        data-testid="cv-file"
      >
        <File {file} />
      </li>
    {/each}
  {/key}
{/snippet}

<div class="relative flex min-h-0 flex-1 flex-col">
  <Sidebar.Content bind:ref={scrollEl} class="px-2 pt-2 lg:px-0 lg:pb-0">
    <Sidebar.Group class="p-0">
      <Sidebar.GroupLabel class="group/cvs">
        <div class="flex w-full flex-row items-center justify-between">
          <span>CVs</span>
          {#if fileState.archivedFiles.length > 0 || fileState.trashedFiles.length > 0}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                {#snippet child({ props })}
                  <Button
                    {...props}
                    variant="ghost"
                    size="icon"
                    data-testid="cvs-group-menu"
                    data-ph-capture-attribute-action="cvs-group-menu"
                    data-ph-capture-attribute-section="sidebar"
                    class="size-5 opacity-0 transition-opacity group-hover/cvs:opacity-100 data-[state=open]:opacity-100"
                  >
                    <EllipsisIcon class="size-4" />
                  </Button>
                {/snippet}
              </DropdownMenu.Trigger>
              <DropdownMenu.Content side="right" align="start">
                {#if fileState.archivedFiles.length > 0}
                  <DropdownMenu.Item
                    data-testid="toggle-archive"
                    data-ph-capture-attribute-action="toggle-archive"
                    data-ph-capture-attribute-section="sidebar"
                    onclick={() => {
                      preferences.showArchive = !preferences.showArchive;
                      fileState.ensureValidSelection();
                    }}
                  >
                    <ArchiveIcon />
                    {preferences.showArchive ? 'Hide Archive' : 'Show Archive'}
                  </DropdownMenu.Item>
                {/if}
                {#if fileState.trashedFiles.length > 0}
                  <DropdownMenu.Item
                    data-testid="toggle-trash"
                    data-ph-capture-attribute-action="toggle-trash"
                    data-ph-capture-attribute-section="sidebar"
                    onclick={() => {
                      preferences.showTrash = !preferences.showTrash;
                      fileState.ensureValidSelection();
                    }}
                  >
                    <TrashIcon />
                    {preferences.showTrash ? 'Hide Trash' : 'Show Trash'}
                  </DropdownMenu.Item>
                {/if}
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          {/if}
        </div>
      </Sidebar.GroupLabel>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          {#if fileState.loading}
            <Sidebar.MenuItem>
              <div class="flex items-center justify-center py-4">
                <LoadingSpinner />
              </div>
            </Sidebar.MenuItem>
          {:else if fileState.activeFiles.length === 0}
            <Sidebar.MenuItem>
              <div class="px-2 py-1.5 text-sm text-muted-foreground">No files yet</div>
            </Sidebar.MenuItem>
          {:else}
            {@render fileList(fileState.activeFiles)}
          {/if}
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>

    {#if preferences.showArchive && fileState.archivedFiles.length > 0}
      <div transition:slide={{ duration: 200, easing: cubicOut }}>
        <Sidebar.Group class="p-0">
          <Sidebar.GroupLabel class="group/archive">
            <div class="flex w-full flex-row items-center justify-between">
              <span data-testid="archive-label">Archive</span>
              <Button
                variant="ghost"
                size="icon"
                class="size-5 opacity-0 transition-opacity group-hover/archive:opacity-100"
                data-ph-capture-attribute-action="close-archive"
                data-ph-capture-attribute-section="sidebar"
                onclick={() => {
                  preferences.showArchive = false;
                  fileState.ensureValidSelection();
                }}
              >
                <XIcon class="size-4" />
              </Button>
            </div>
          </Sidebar.GroupLabel>
          <Sidebar.GroupContent>
            <Sidebar.Menu>
              {@render fileList(fileState.archivedFiles)}
            </Sidebar.Menu>
          </Sidebar.GroupContent>
        </Sidebar.Group>
      </div>
    {/if}

    {#if preferences.showTrash && fileState.trashedFiles.length > 0}
      <div transition:slide={{ duration: 200, easing: cubicOut }}>
        <Sidebar.Group class="p-0">
          <Sidebar.GroupLabel class="group/trash">
            <div class="flex w-full flex-row items-center justify-between">
              <span data-testid="trash-label">Trash</span>
              <Button
                variant="ghost"
                size="icon"
                class="size-5 opacity-0 transition-opacity group-hover/trash:opacity-100"
                data-ph-capture-attribute-action="close-trash"
                data-ph-capture-attribute-section="sidebar"
                onclick={() => {
                  preferences.showTrash = false;
                  fileState.ensureValidSelection();
                }}
              >
                <XIcon class="size-4" />
              </Button>
            </div>
          </Sidebar.GroupLabel>
          <Sidebar.GroupContent>
            <Sidebar.Menu>
              {@render fileList(fileState.trashedFiles)}
            </Sidebar.Menu>
          </Sidebar.GroupContent>
        </Sidebar.Group>
      </div>
    {/if}
  </Sidebar.Content>

  <!-- Top scroll fade -->
  <div
    class="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-sidebar to-transparent transition-opacity duration-150"
    class:opacity-0={!canScrollUp}
  ></div>

  <!-- Bottom scroll fade -->
  <div
    class="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-sidebar to-transparent transition-opacity duration-150"
    class:opacity-0={!canScrollDown}
  ></div>
</div>
