<script lang="ts">
  import { Switch } from '$lib/ui/components/switch/index.js';
  import FieldMessage from './FieldMessage.svelte';

  interface Props {
    value: boolean;
    label: string;
    description?: string;
    disabled?: boolean;
    error?: string;
    onchange?: (value: boolean) => void;
  }

  let { value = $bindable(false), label, description, disabled, error, onchange }: Props = $props();
</script>

<div class="flex items-center py-1.5">
  <span
    class="shrink-0 text-xs {error ? 'text-destructive' : 'text-muted-foreground'}"
    style:width="var(--label-width, 8rem)">{label}</span
  >
  <Switch
    bind:checked={value}
    onCheckedChange={(v) => onchange?.(v)}
    {disabled}
    class="cursor-pointer"
  />
</div>
<FieldMessage {error} {description} />
