<script lang="ts">
  import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
  import { cn } from '$lib/ui/utils';

  type LoadingSpinnerProps = {
    class?: string;
  };

  let { class: className }: LoadingSpinnerProps = $props();
</script>

<LoaderCircleIcon class={cn('size-4 animate-spin text-muted-foreground', className)} />
