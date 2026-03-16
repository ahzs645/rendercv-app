<script lang="ts">
  import iconRaw from '$lib/assets/icon.svg?raw';
  let { html }: { html: string } = $props();
</script>

<div class="mb-18 flex items-center gap-4">
  <div class="size-10">{@html iconRaw}</div>
  <span class="text-2xl font-semibold">RenderCV</span>
</div>
<div class="markdown-content prose prose-sm max-w-none dark:prose-invert">
  {@html html}
</div>

<style>
  /* Remove default list markers, use ::before instead for left-anchored labels */
  .markdown-content :global(ol) {
    counter-reset: item;
    list-style: none;
    padding-left: 1em;
  }

  .markdown-content :global(ol > li) {
    counter-increment: item;
    position: relative;
  }

  .markdown-content :global(ol > li::before) {
    content: counter(item) '. ';
    position: absolute;
    left: -1em;
    font-weight: 600;
  }

  .markdown-content :global(ol ol) {
    counter-reset: subitem;
    padding-left: 1.7em;
  }

  .markdown-content :global(ol ol > li) {
    counter-increment: subitem;
  }

  .markdown-content :global(ol ol > li::before) {
    content: counter(item) '.' counter(subitem) ' ';
    left: -1.7em;
  }

  .markdown-content :global(ol ol ol) {
    counter-reset: subsubitem;
    padding-left: 2.5em;
  }

  .markdown-content :global(ol ol ol > li) {
    counter-increment: subsubitem;
  }

  .markdown-content :global(ol ol ol > li::before) {
    content: counter(item) '.' counter(subitem) '.' counter(subsubitem, lower-alpha) ' ';
    left: -2.5em;
  }
</style>
