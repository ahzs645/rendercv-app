<script lang="ts">
  import * as Sidebar from '$lib/ui/components/sidebar/index.js';
  import { useSidebar } from '$lib/ui/components/sidebar/context.svelte.js';
  import { fileState } from '$lib/features/cv-files/file-state.svelte';
  import type { ComponentProps } from 'svelte';
  import { Button } from '$lib/ui/components/button/index.js';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import UploadIcon from '@lucide/svelte/icons/upload';
  import iconRaw from '$lib/assets/icon.svg?raw';
  import LoginDialog from '$lib/features/auth/LoginDialog.svelte';
  import { loginDialogState } from '$lib/features/auth/login-dialog-state.svelte';
  import { toast } from 'svelte-sonner';
  import { afterNavigate, beforeNavigate } from '$app/navigation';
  import PdfImportButton from './PdfImportButton.svelte';
  import SidebarFileList from './SidebarFileList.svelte';
  import SidebarFooter from './SidebarFooter.svelte';
  import SidebarUserMenu from './SidebarUserMenu.svelte';
  import { capture } from '$lib/analytics/posthog-client';
  import { EVENTS } from '$lib/analytics/events';

  let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();

  const sidebar = useSidebar();

  let loginDialogOpen = $state(false);
  let savedLoginDialogOpen = false;

  // Sync global login dialog state → local
  $effect(() => {
    if (loginDialogState.open) {
      loginDialogOpen = true;
      loginDialogState.open = false;
    }
  });
  let pdfImport: PdfImportButton | undefined = $state(undefined);
  let isDraggingPdf = $state(false);
  let dragCounter = 0;

  beforeNavigate(() => {
    if (loginDialogOpen) savedLoginDialogOpen = true;
    loginDialogOpen = false;
  });

  afterNavigate((nav) => {
    sidebar.setOpenMobile(false);
    if (nav.to?.url.pathname === '/') {
      if (savedLoginDialogOpen) loginDialogOpen = true;
      savedLoginDialogOpen = false;
    }
  });

  function handleDragEnter(e: DragEvent) {
    e.preventDefault();
    dragCounter++;
    if (e.dataTransfer?.types.includes('Files')) isDraggingPdf = true;
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) isDraggingPdf = false;
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragCounter = 0;
    isDraggingPdf = false;

    const file = e.dataTransfer?.files[0];
    if (!file || file.type !== 'application/pdf') {
      toast.error('Please drop a PDF file.');
      return;
    }
    pdfImport?.triggerFromFile(file);
  }
</script>

<Sidebar.Root
  bind:ref
  variant="inset"
  {...restProps}
  class="py-3"
  ondragenter={handleDragEnter}
  ondragleave={handleDragLeave}
  ondragover={handleDragOver}
  ondrop={handleDrop}
>
  {#if isDraggingPdf}
    <div
      class="absolute inset-0 z-50 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary bg-primary/10 backdrop-blur-xs"
    >
      <UploadIcon class="size-8 text-primary" />
      <span class="text-sm font-medium text-primary">Drop PDF here</span>
    </div>
  {/if}

  <Sidebar.Header class="justify-left mb-2 flex flex-row items-center gap-4 p-4 lg:px-2 lg:py-1">
    <div class="size-8">
      {@html iconRaw}
    </div>
    <h1 class="m-0 truncate text-left text-xl leading-tight font-normal">RenderCV</h1>
  </Sidebar.Header>
  <Sidebar.Menu>
    <Sidebar.MenuItem>
      <Button
        variant="ghost"
        class="w-full justify-start"
        data-testid="create-file-button"
        data-ph-capture-attribute-action="create-file"
        data-ph-capture-attribute-section="sidebar"
        onclick={() => {
          const newFile = fileState.createFile();
          capture(EVENTS.CV_CREATED, { cv_id: newFile.id, create_method: 'blank' });
          sidebar.setOpenMobile(false);
        }}
      >
        <PlusIcon />
        Create new CV
      </Button>
    </Sidebar.MenuItem>
    <Sidebar.MenuItem>
      <PdfImportButton bind:this={pdfImport} />
    </Sidebar.MenuItem>
  </Sidebar.Menu>

  <SidebarFileList />

  <Sidebar.Footer class="px-2 lg:p-0">
    <Sidebar.Menu>
      <SidebarFooter />
      <SidebarUserMenu bind:loginDialogOpen />
    </Sidebar.Menu>
  </Sidebar.Footer>
</Sidebar.Root>

<LoginDialog bind:open={loginDialogOpen} />
