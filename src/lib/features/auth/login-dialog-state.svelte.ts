class LoginDialogState {
  open = $state(false);
  /** When set, only show this provider in the dialog. */
  onlyProvider = $state<'google' | 'github' | null>(null);
  title = $state<string | null>(null);
  description = $state<string | null>(null);

  show(options?: { onlyProvider?: 'google' | 'github'; title?: string; description?: string }) {
    this.onlyProvider = options?.onlyProvider ?? null;
    this.title = options?.title ?? null;
    this.description = options?.description ?? null;
    this.open = true;
  }
}

export const loginDialogState = new LoginDialogState();
