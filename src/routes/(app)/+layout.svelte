<script lang="ts">
  import { page } from '$app/state';
  import { base } from '$app/paths';
  import AppWorkspace from '$lib/features/app/AppWorkspace.svelte';
  import ConfirmDialog from '$lib/features/primitives/ConfirmDialog.svelte';
  import { fade } from 'svelte/transition';
  import { onMount } from 'svelte';
  import { FileSyncManager } from '$lib/features/cv-files/file-sync.svelte';
  import { fileState } from '$lib/features/cv-files/file-state.svelte';
  import { preferences } from '$lib/features/preferences/pref-state.svelte';
  import { initAuth, authState } from '$lib/features/auth/auth-state.svelte';
  import { FEATURE_GATES } from '$lib/features/auth/feature-gates';
  import { githubSyncState } from '$lib/features/github-sync/github-sync-state.svelte';
  import { Toaster } from '$lib/ui/components/sonner/index.js';
  import { toast } from 'svelte-sonner';
  import { initPostHog, capture, identify } from '$lib/analytics/posthog-client';
  import { EVENTS } from '$lib/analytics/events';
  import { PUBLIC_POSTHOG_KEY, PUBLIC_POSTHOG_HOST } from '$env/static/public';

  let { children, data } = $props();

  // One-shot init — auth changes via page refresh (OAuth) or signOut(),
  // so we intentionally only read the initial server data here.
  // svelte-ignore state_referenced_locally
  initAuth(data.user);
  // svelte-ignore state_referenced_locally
  preferences.init(data.preferences);

  initPostHog(PUBLIC_POSTHOG_KEY, PUBLIC_POSTHOG_HOST);

  // Reset fileState per SSR request — the module singleton persists across requests
  // on the server (Cloudflare Workers / Vite SSR), so a previous user's files would
  // leak into the next request's rendered HTML without this.
  // Show spinner until onMount resolves files (guest/free) or SSR files are loaded (Plus).
  // svelte-ignore state_referenced_locally
  fileState.files = [];
  // svelte-ignore state_referenced_locally
  fileState.loading = true;

  // SSR provides files for Plus+ users — load them immediately to skip the loading spinner.
  // Free logged-in users use localStorage (same as guests).
  // svelte-ignore state_referenced_locally
  const canUseCloud = authState.isLoggedIn && authState.can(FEATURE_GATES['cloud-storage'].tier);
  // svelte-ignore state_referenced_locally
  const ssrFiles = data.files;
  // svelte-ignore state_referenced_locally
  if (canUseCloud && ssrFiles && ssrFiles.length > 0) {
    fileState.loadFiles(ssrFiles);
  }

  // Initialize GitHub sync state from SSR data
  // svelte-ignore state_referenced_locally
  if (authState.isLoggedIn) githubSyncState.initFromSSR(data.githubConnection);

  // Always show workspace on the root route.
  // SvelteKit may or may not strip the base path from page.url.pathname,
  // so we check all variants.
  const showWorkspace = $derived((() => {
    const p = page.url.pathname.replace(/\/$/, '') || '/';
    const b = (base || '').replace(/\/$/, '') || '/';
    return p === '/' || p === b;
  })());
  let mounted = $state(false);
  const shouldMountWorkspace = $derived(showWorkspace || mounted);

  let syncManager: FileSyncManager | undefined;

  onMount(() => {
    mounted = true;
    if (authState.isLoggedIn && authState.user) {
      identify(authState.user.id, {
        name: authState.user.name,
        email: authState.user.email,
        tier: authState.tier,
        interval: authState.interval,
        plan: authState.tier,
        email_domain: authState.user.email?.split('@')[1],
        locale: navigator.language,
        is_anonymous: false,
        total_edits: authState.user.totalEdits
      });
    }
    const appUrl = new URL(window.location.href);
    capture(EVENTS.APP_OPENED, {
      entry_page: window.location.pathname,
      referrer: document.referrer || null,
      utm_source: appUrl.searchParams.get('utm_source') || null,
      utm_medium: appUrl.searchParams.get('utm_medium') || null
    });
    if (authState.isLoggedIn && authState.user) {
      // Background sync: catch webhook misses (e.g. plan change via Polar portal)
      if (authState.tier !== 'free') {
        authState.refreshTier();
      }
    }
    const savedFileId = preferences.selectedFileId;

    syncManager = new FileSyncManager();
    syncManager.init(authState.isLoggedIn, ssrFiles, canUseCloud).then(() => {
      // After files are loaded, restore the last selected CV
      if (savedFileId && fileState.files.some((f) => f.id === savedFileId)) {
        fileState.selectFile(savedFileId);
      }
      // Enable auto-save AFTER file restoration is complete — no race conditions
      if (authState.isLoggedIn) syncManager!.enablePrefSave();
    });

    return () => syncManager?.dispose();
  });

  // Clean up sync when a logged-in user signs out (optimistic sign-out doesn't reload page).
  // Guard: only dispose if the manager was initialized for an auth session.
  // Without this guard, guests would be disposed immediately since !isLoggedIn is always true.
  $effect(() => {
    if (!authState.isLoggedIn && syncManager?.initializedLoggedIn) {
      syncManager.dispose();
      // Re-create for guest mode so edits continue to persist to localStorage
      const guestManager = new FileSyncManager();
      guestManager.init(false);
      syncManager = guestManager;
    }
  });

  // Handle GitHub sync callback query params
  $effect(() => {
    const url = page.url;
    const githubSync = url.searchParams.get('github_sync');
    const githubSyncError = url.searchParams.get('github_sync_error');

    if (githubSync === 'connected') {
      capture(EVENTS.GITHUB_SYNC_CONNECTED);
      toast.success('GitHub repository connected! Your CVs will sync on every save.');
      // SSR data may be stale (e.g. Hyperdrive cache) — refresh from server
      githubSyncState.loadConnection();
      history.replaceState(null, '', url.pathname);
    } else if (githubSyncError) {
      const messages: Record<string, string> = {
        missing_params: 'GitHub authorization failed: missing parameters.',
        invalid_state: 'GitHub authorization failed: invalid state.',
        user_mismatch: 'GitHub authorization failed: user mismatch.',
        auth_failed: 'GitHub authorization failed. Please try again.'
      };
      toast.error(messages[githubSyncError] ?? 'GitHub sync failed. Please try again.');
      history.replaceState(null, '', url.pathname);
    }
  });
</script>

<Toaster />

{#if shouldMountWorkspace}
  <div style:display={showWorkspace ? 'contents' : 'none'} aria-hidden={!showWorkspace}>
    <AppWorkspace active={showWorkspace} />
  </div>
{/if}

<ConfirmDialog />

{#if !showWorkspace}
  {#key page.url.pathname}
    <div
      class="fixed inset-0 z-50 overflow-y-auto bg-sidebar"
      in:fade|global={{ duration: mounted ? 100 : 0 }}
      out:fade|global={{ duration: 100 }}
    >
      {@render children?.()}
    </div>
  {/key}
{:else}
  {@render children?.()}
{/if}
