class ConfirmState {
  open = $state(false);
  title = $state('');
  description = $state('');
  action = $state<(() => void) | null>(null);
  confirmText = $state('Confirm');
  variant = $state<'default' | 'destructive'>('default');

  confirm(
    title: string,
    description: string,
    action: () => void,
    confirmText = 'Confirm',
    variant: 'default' | 'destructive' = 'default'
  ) {
    this.open = true;
    this.title = title;
    this.description = description;
    this.action = action;
    this.confirmText = confirmText;
    this.variant = variant;
  }
}

export const confirmState = new ConfirmState();
