<script lang="ts">
  import MoonIcon from '@lucide/svelte/icons/moon';
  import SunIcon from '@lucide/svelte/icons/sun';
  import { toggleMode } from 'mode-watcher';

  import { Button } from '$lib/ui/components/button/index.js';
</script>

<Button
  onclick={toggleMode}
  variant="ghost"
  size="icon"
  class="size-8"
  type="button"
  aria-label="Toggle theme"
  data-ph-capture-attribute-action="toggle-theme"
  data-ph-capture-attribute-section="editor-toolbar"
>
  <SunIcon class="scale-100 rotate-0 transition-all! dark:scale-0 dark:-rotate-90" />
  <MoonIcon class="absolute scale-0 rotate-90 transition-all! dark:scale-100 dark:rotate-0" />
  <span class="sr-only">Toggle theme</span>
</Button>
