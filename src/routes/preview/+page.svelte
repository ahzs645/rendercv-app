<script lang="ts">
  import TypstViewer from '$lib/features/viewer/TypstViewer.svelte';
  import PdfControls from '$lib/features/viewer/PdfControls.svelte';
  import * as Tooltip from '$lib/ui/components/tooltip';
  import { fileState } from '$lib/features/cv-files/file-state.svelte';
  import { onMount } from 'svelte';

  onMount(() => {
    const channel = new BroadcastChannel('rendercv-preview');
    channel.onmessage = (e) => {
      if (e.data.type === 'filestate') {
        fileState.files = e.data.files;
        fileState.selectedFileId = e.data.selectedFileId;
      }
      if (e.data.type === 'ping') {
        channel.postMessage({ type: 'ready' });
      }
    };
    channel.postMessage({ type: 'ready' });

    const onBeforeUnload = () => channel.postMessage({ type: 'closed' });
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      onBeforeUnload();
      window.removeEventListener('beforeunload', onBeforeUnload);
      channel.close();
    };
  });
</script>

<svelte:head>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="flex h-screen flex-col">
  <header class="flex h-12 shrink-0 items-center gap-2 px-4">
    <Tooltip.Provider delayDuration={500}>
      <PdfControls />
    </Tooltip.Provider>
  </header>
  <div class="min-h-0 flex-1">
    <TypstViewer sections={fileState.sections} />
  </div>
</div>
