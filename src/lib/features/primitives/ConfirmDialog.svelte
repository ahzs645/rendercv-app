<script lang="ts">
  import * as AlertDialog from '$lib/ui/components/alert-dialog/index.js';
  import { buttonVariants } from '$lib/ui/components/button/index.js';
  import { confirmState } from './confirm-state.svelte';

  let actionRef = $state<HTMLButtonElement | null>(null);
</script>

<AlertDialog.Root bind:open={confirmState.open}>
  <AlertDialog.Content
    onOpenAutoFocus={(e) => {
      e.preventDefault();
      actionRef?.focus();
    }}
  >
    <AlertDialog.Header>
      <AlertDialog.Title>{confirmState.title}</AlertDialog.Title>
      <AlertDialog.Description>{confirmState.description}</AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action
        bind:ref={actionRef}
        data-testid="confirm-action"
        class={confirmState.variant === 'destructive'
          ? buttonVariants({ variant: 'destructive' })
          : undefined}
        onclick={() => {
          confirmState.action?.();
          confirmState.open = false;
        }}>{confirmState.confirmText}</AlertDialog.Action
      >
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
