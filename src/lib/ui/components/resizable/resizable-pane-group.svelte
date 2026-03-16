<script lang="ts">
  import * as ResizablePrimitive from 'paneforge';
  import { cn } from '$lib/ui/utils';

  let {
    ref = $bindable(null),
    paneGroup = $bindable<ResizablePrimitive.PaneGroup | undefined>(),
    class: className,
    ...restProps
  }: ResizablePrimitive.PaneGroupProps & {
    paneGroup?: ResizablePrimitive.PaneGroup;
  } = $props();
</script>

<ResizablePrimitive.PaneGroup
  bind:this={paneGroup}
  data-slot="resizable-pane-group"
  class={cn('flex h-full w-full data-[direction=vertical]:flex-col', className)}
  {...restProps}
/>
