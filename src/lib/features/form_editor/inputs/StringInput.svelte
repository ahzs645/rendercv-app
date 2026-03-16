<script lang="ts">
  import { isUrl } from '$lib/features/form_editor/textarea-format.js';
  import FieldMessage from './FieldMessage.svelte';

  interface Props {
    value: string;
    label?: string;
    description?: string;
    disabled?: boolean;
    placeholder?: string;
    error?: string;
    bare?: boolean;
    onchange?: (value: string) => void;
  }

  let {
    value = $bindable(''),
    label,
    description,
    disabled,
    placeholder,
    error,
    bare,
    onchange
  }: Props = $props();

  const ANIM_DUR = 190;
</script>

<div class="flex items-center py-1.5">
  {#if label}
    <span
      class="shrink-0 text-xs {error ? 'text-destructive' : 'text-muted-foreground'}"
      style:width="var(--label-width, 8rem)"
      style:transition="color {ANIM_DUR}ms cubic-bezier(0.215, 0.61, 0.355, 1)"
    >
      {label}
    </span>
  {/if}
  <textarea
    rows="1"
    bind:value
    oninput={() => onchange?.(value)}
    onpaste={(e) => {
      const el = e.currentTarget;
      const url = e.clipboardData?.getData('text/plain')?.trim();
      if (!url || !isUrl(url) || el.selectionStart === el.selectionEnd) return;
      e.preventDefault();
      const selected = el.value.substring(el.selectionStart, el.selectionEnd);
      const link = `[${selected}](${url})`;
      el.setRangeText(link, el.selectionStart, el.selectionEnd, 'end');
      el.dispatchEvent(new InputEvent('input', { bubbles: true }));
    }}
    {disabled}
    {placeholder}
    class="field-sizing-content min-w-0 flex-1 resize-none bg-transparent py-0 text-sm outline-none select-text placeholder:text-muted-foreground/50 disabled:cursor-not-allowed disabled:opacity-50"
  ></textarea>
</div>
{#if !bare}
  <FieldMessage {error} {description} />
{/if}
