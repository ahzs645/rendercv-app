<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { Skeleton } from '$lib/ui/components/skeleton/index.js';
  import { AspectRatio } from '$lib/ui/components/aspect-ratio/index.js';
  import { viewer } from './viewer-state.svelte';
  import { zoomGestures } from './zoom-gestures';
  import type { CvFileSections } from '$lib/features/cv-files/types';
  import { fileState } from '$lib/features/cv-files/file-state.svelte';

  let { sections }: { sections: CvFileSections } = $props();

  onMount(() => {
    viewer.init();
  });

  // Debounced render when any section changes
  $effect(() => {
    const { cv, design, locale, settings } = sections;
    if (!browser || viewer.isInitializing || viewer.initError || fileState.loading) return;

    const timeout = setTimeout(() => viewer.renderYaml({ cv, design, locale, settings }), 40);
    return () => clearTimeout(timeout);
  });
</script>

<div
  use:zoomGestures
  class="relative h-full w-full overflow-auto bg-sidebar select-none dark:bg-zinc-900"
  style="contain: layout style;"
>
  <div data-zoom-layer class="mx-auto min-h-full" style="width: {viewer.zoomFactor * 100}%;">
    {#if viewer.initError}
      <div class="flex h-full items-center justify-center p-6">
        <div class="rounded-lg bg-red-50 p-4 text-center select-text dark:bg-red-900/20">
          <p class="text-sm font-medium text-destructive">Failed to initialize PDF viewer</p>
          <p class="mt-1 text-xs text-destructive">{viewer.initError}</p>
        </div>
      </div>
    {:else}
      <div
        class="min-h-full px-[5%] [&_img]:dark:hue-rotate-180 [&_img]:dark:invert"
        style="padding-top: {viewer.zoomFactor * 2}rem; padding-bottom: {viewer.zoomFactor * 2}rem;"
      >
        <div data-zoom-content class="flex flex-col" style="gap: {viewer.zoomFactor * 1.5}rem;">
          {#if viewer.svgPages.length > 0}
            {#each viewer.svgPages as page, index (index)}
              <div class="bg-background shadow-2xl">
                <img
                  src={page}
                  alt="CV page {index + 1}"
                  draggable="false"
                  class="block h-auto w-full"
                />
              </div>
            {/each}
          {:else if viewer.renderErrors.some((e) => !e.yaml_location)}
            <div class="flex h-full flex-col items-center justify-center gap-4 p-6">
              <div class="max-w-md rounded-lg bg-amber-50 p-4 select-text dark:bg-amber-900/20">
                <p class="text-sm font-medium text-amber-800 dark:text-amber-200">Render Error</p>
                <ul class="mt-2 space-y-1">
                  {#each viewer.renderErrors.filter((e) => !e.yaml_location) as error, i (i)}
                    <li class="text-xs text-amber-600 dark:text-amber-400">
                      {error.message}
                      {#if error.schema_location && error.schema_location.length > 0}
                        <span class="ml-1 text-amber-500 dark:text-amber-500">
                          at {error.schema_location.join(' → ')}
                        </span>
                      {/if}
                    </li>
                  {/each}
                </ul>
              </div>
            </div>
          {:else}
            <div class="bg-background shadow-2xl">
              <AspectRatio ratio={8.5 / 11}>
                <div
                  class="absolute inset-0 h-full w-full overflow-hidden bg-white p-[6.5%] dark:bg-zinc-950"
                >
                  <Skeleton class="mx-auto mb-[2%] h-[4%] w-[40%] max-w-full" />
                  <Skeleton class="mx-auto mb-[5%] h-[2.5%] w-[60%] max-w-full" />

                  <div class="mb-[6%] flex flex-wrap justify-center gap-[4%]">
                    <Skeleton class="h-[2%] w-[20%]" />
                    <Skeleton class="h-[2%] w-[25%]" />
                    <Skeleton class="h-[2%] w-[22%]" />
                  </div>

                  <Skeleton class="section-title w-[25%]" />
                  <Skeleton class="line" />
                  <Skeleton class="line" />
                  <Skeleton class="line" />
                  <Skeleton class="line" />

                  <Skeleton class="section-title mt-[4%] w-[33%]" />
                  <Skeleton class="line" />
                  <Skeleton class="line" />
                  <Skeleton class="line" />
                  <Skeleton class="line" />

                  <Skeleton class="section-title mt-[4%] w-[23%]" />
                  <Skeleton class="line" />
                  <Skeleton class="line" />
                  <Skeleton class="line" />
                  <Skeleton class="line" />

                  <Skeleton class="section-title mt-[4%] w-[29%]" />
                  <Skeleton class="line" />
                  <Skeleton class="line" />
                  <Skeleton class="line" />
                  <Skeleton class="line" />
                </div>
              </AspectRatio>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
  <div class="shrink-0 md:hidden" style="height: var(--mobile-bar-h, 0px);"></div>
</div>

<style>
  div :global(.line) {
    @apply mb-[2%] h-[2%] w-full;
  }

  div :global(.section-title) {
    @apply mb-[2%] h-[3%];
  }
</style>
