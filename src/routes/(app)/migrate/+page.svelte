<script lang="ts">
  import { page } from '$app/state';
  import { Button } from '$lib/ui/components/button/index.js';
  import * as Dialog from '$lib/ui/components/dialog/index.js';
  import LoadingSpinner from '$lib/features/primitives/LoadingSpinner.svelte';
  import { authState } from '$lib/features/auth/auth-state.svelte';
  import { FileSyncManager } from '$lib/features/cv-files/file-sync.svelte';
  import AppBackPage from '$lib/content/AppBackPage.svelte';
  import { capture } from '$lib/analytics/posthog-client';
  import { EVENTS } from '$lib/analytics/events';

  type MigrateState = 'sign-in' | 'ready' | 'importing' | 'success' | 'error';

  let migrateState: MigrateState = $state(authState.isLoggedIn ? 'ready' : 'sign-in');
  let errorMessage = $state('');
  let guestDialogOpen = $state(false);
  let loadingProvider = $state<'google' | 'github' | null>(null);
  let wantsEmailUpdates = $state(false);

  const firebaseUid = $derived(page.url.searchParams.get('firebase_uid') ?? '');
  const callbackURL = $derived(`/migrate?firebase_uid=${encodeURIComponent(firebaseUid)}`);

  // Auto-start migration when user is logged in
  $effect(() => {
    if (authState.isLoggedIn && (migrateState === 'sign-in' || migrateState === 'ready')) {
      startMigration();
    }
  });

  async function startMigration() {
    if (!firebaseUid) {
      errorMessage = 'Missing Firebase UID. Please use the migration link from the old app.';
      migrateState = 'error';
      return;
    }

    migrateState = 'importing';
    capture(EVENTS.MIGRATION_STARTED, { firebase_uid: firebaseUid });

    try {
      const res = await fetch('/api/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebase_uid: firebaseUid })
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({ message: '' }))) as { message?: string };
        const msg = data.message || `Migration failed (${res.status})`;

        if (msg === 'email_mismatch') {
          errorMessage =
            'The email on your old account does not match your current account. Please sign in with the same email you used in the old app.';
        } else {
          errorMessage = msg;
        }
        migrateState = 'error';
        return;
      }

      migrateState = 'success';
      // Full page redirect so the file list reloads fresh
      window.location.href = '/';
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      migrateState = 'error';
    }
  }
</script>

<svelte:head>
  <title>Import CVs - RenderCV</title>
</svelte:head>

<AppBackPage showClose={false} class="flex min-h-screen max-w-lg items-center justify-center">
  <div class="flex w-full flex-col items-center gap-6 p-6">
    {#if migrateState === 'sign-in'}
      <div class="flex flex-col items-center gap-2 text-center">
        <h1 class="text-2xl font-semibold">Import your CVs from the old app</h1>
        <p class="text-muted-foreground text-sm">
          Sign in to migrate your CVs. <strong>Use the same account</strong> as your old account.
        </p>
      </div>

      <div class="flex w-full max-w-xs flex-col gap-3">
        <Button
          variant="outline"
          class="w-full justify-center gap-2"
          disabled={loadingProvider !== null}
          onclick={() => {
            loadingProvider = 'google';
            FileSyncManager.saveGuestFiles();
            authState.signInWithGoogle(wantsEmailUpdates, callbackURL);
          }}
        >
          {#if loadingProvider === 'google'}
            <LoadingSpinner />
          {:else}
            <span class="icon-[mdi--google] size-5"></span>
          {/if}
          Continue with Google
        </Button>

        <Button
          variant="outline"
          class="w-full justify-center gap-2"
          disabled={loadingProvider !== null}
          onclick={() => {
            loadingProvider = 'github';
            FileSyncManager.saveGuestFiles();
            authState.signInWithGithub(wantsEmailUpdates, callbackURL);
          }}
        >
          {#if loadingProvider === 'github'}
            <LoadingSpinner />
          {:else}
            <span class="icon-[mdi--github] size-5"></span>
          {/if}
          Continue with GitHub
        </Button>
      </div>

      <Button
        variant="ghost"
        class="text-muted-foreground text-sm"
        onclick={() => (guestDialogOpen = true)}
      >
        Continue as guest
      </Button>

      <Dialog.Root bind:open={guestDialogOpen}>
        <Dialog.Content
          class="flex w-md flex-col gap-5"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Dialog.Header>
            <Dialog.Title>Continue without signing in?</Dialog.Title>
            <Dialog.Description>
              You can only access your imported data if you sign in. Are you sure you want to
              continue as a guest?
            </Dialog.Description>
          </Dialog.Header>
          <Dialog.Footer class="flex justify-end gap-2">
            <Button variant="outline" onclick={() => (guestDialogOpen = false)}>Go back</Button>
            <Button onclick={() => (window.location.href = '/')}>Continue as guest</Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>

    {:else if migrateState === 'ready' || migrateState === 'importing'}
      <div class="flex flex-col items-center gap-4 text-center">
        <LoadingSpinner class="size-8" />
        <h1 class="text-2xl font-semibold">Importing your CVs...</h1>
        <p class="text-muted-foreground text-sm">
          This may take a minute. We're converting each CV to the new format.
        </p>
      </div>

    {:else if migrateState === 'success'}
      <div class="flex flex-col items-center gap-4 text-center">
        <LoadingSpinner class="size-8" />
        <h1 class="text-2xl font-semibold">Redirecting...</h1>
      </div>

    {:else if migrateState === 'error'}
      <div class="flex flex-col items-center gap-2 text-center">
        <h1 class="text-2xl font-semibold">Import failed</h1>
        <p class="text-destructive text-sm">{errorMessage}</p>
      </div>

      <Button class="w-full max-w-xs" onclick={startMigration}>Try again</Button>
    {/if}
  </div>
</AppBackPage>
