<script lang="ts">
  import type { FieldDef } from './schema/types.js';
  import { resolveField } from './schema/field-registry.js';

  interface Props {
    field: FieldDef;
    value: unknown;
    defaultValue?: unknown;
    onchange: (value: unknown) => void;
    disabled?: boolean;
    error?: string;
  }

  let { field, value, defaultValue, onchange, disabled, error }: Props = $props();
  let entry = $derived(resolveField(field));
  let Component = $derived(entry.component);
</script>

<Component
  value={value ?? entry.defaultValue}
  {defaultValue}
  label={field.label}
  description={field.description}
  {disabled}
  {error}
  onchange={(v) => onchange(v === '' && !field.preserveEmpty ? null : v)}
  {...entry.extraProps?.(field)}
/>
