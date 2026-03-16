<script lang="ts">
  import * as Sidebar from '$lib/ui/components/sidebar/index.js';
  import * as DropdownMenu from '$lib/ui/components/dropdown-menu/index.js';
  import * as Tooltip from '$lib/ui/components/tooltip/index.js';
  import { Button } from '$lib/ui/components/button/index.js';
  import { useSidebar } from '$lib/ui/components/sidebar/context.svelte.js';
  import { authState } from '$lib/features/auth/auth-state.svelte';
  import { loginDialogState } from '$lib/features/auth/login-dialog-state.svelte';
  import { confirmState } from '$lib/features/primitives/confirm-state.svelte';
  import { checkSubscriptionCancelled } from '$lib/features/auth/check-subscription-cancelled.remote';
  import { toggleEmailUpdates } from '$lib/features/auth/toggle-email-updates.remote';
  import LoadingSpinner from '$lib/features/primitives/LoadingSpinner.svelte';
  import MoreVerticalIcon from '@lucide/svelte/icons/more-vertical';
  import CircleUserIcon from '@lucide/svelte/icons/circle-user';
  import CreditCardIcon from '@lucide/svelte/icons/credit-card';
  import LogOutIcon from '@lucide/svelte/icons/log-out';
  import BellIcon from '@lucide/svelte/icons/bell';
  import BellOffIcon from '@lucide/svelte/icons/bell-off';
  import TrashIcon from '@lucide/svelte/icons/trash';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import { Badge } from '$lib/ui/components/badge/index.js';
  import { fade, slide } from 'svelte/transition';

  let { loginDialogOpen = $bindable(false) }: { loginDialogOpen: boolean } = $props();

  const sidebar = useSidebar();

  let bellShaking = $state(false);
  let showDeleteButton = $state(false);
  let deleteChecking = $state(false);
</script>

{#snippet userCard(u: { name: string; email: string })}
  <CircleUserIcon class="size-5!" />
  <div class="grid flex-1 text-start text-sm leading-tight">
    <span class="flex min-w-0 items-center gap-1.5 font-medium">
      <span class="truncate">{u.name}</span>
      {#if authState.tier !== 'free'}
        {#if authState.tier === 'pro'}
          <Badge
            class="mb-[2px] border-transparent bg-linear-to-r from-zinc-500 to-violet-400 px-1.5 py-0 text-[10px] text-white uppercase"
          >
            {authState.tier}
          </Badge>
        {:else}
          <Badge
            variant="outline"
            class="mb-[2px] border-transparent bg-primary/10 px-1.5 py-0 text-[10px] text-primary uppercase"
          >
            {authState.tier}
          </Badge>
        {/if}
      {/if}
    </span>
    <span class="truncate text-xs text-muted-foreground">{u.email}</span>
  </div>
{/snippet}

<Sidebar.MenuItem class="-mt-1">
  {#if authState.user}
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <Sidebar.MenuButton
            {...props}
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            data-ph-capture-attribute-action="user-menu"
            data-ph-capture-attribute-section="user-menu"
          >
            {@render userCard(authState.user!)}
            <MoreVerticalIcon class="ms-auto size-4" />
          </Sidebar.MenuButton>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
        side={sidebar.isMobile ? 'bottom' : 'right'}
        align="end"
        sideOffset={4}
      >
        <DropdownMenu.Label class="p-0 font-normal">
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="flex items-center gap-2 px-1 py-1.5 text-start text-sm"
            onmouseenter={() => {
              showDeleteButton = true;
            }}
            onmouseleave={() => {
              showDeleteButton = false;
            }}
          >
            {@render userCard(authState.user!)}
            {#if showDeleteButton}
              <div transition:slide={{ duration: 150, axis: 'x' }}>
                <div transition:fade={{ duration: 150 }}>
                  <Tooltip.Root>
                    <Tooltip.Trigger>
                      {#snippet child({ props })}
                        <Button
                          {...props}
                          variant="ghost"
                          size="icon"
                          class="ml-auto size-7 shrink-0 text-destructive hover:bg-destructive/10! hover:text-destructive!"
                          aria-label="Delete account"
                          data-ph-capture-attribute-action="delete-account"
                          data-ph-capture-attribute-section="user-menu"
                          disabled={deleteChecking}
                          onclick={async () => {
                            if (authState.can('plus')) {
                              deleteChecking = true;
                              try {
                                const { cancelled } = await checkSubscriptionCancelled();
                                if (!cancelled) {
                                  confirmState.confirm(
                                    'Cancel your subscription first',
                                    'You need to cancel your subscription before deleting your account.',
                                    () => window.open(authState.portalHref, '_blank'),
                                    'Manage Subscription'
                                  );
                                  return;
                                }
                              } finally {
                                deleteChecking = false;
                              }
                            }
                            confirmState.confirm(
                              'Are you absolutely sure?',
                              'This will permanently delete your account and all your data. This action cannot be undone.',
                              () => authState.deleteAccount(),
                              'Delete Account',
                              'destructive'
                            );
                          }}
                        >
                          {#if deleteChecking}
                            <LoadingSpinner class="size-4" />
                          {:else}
                            <TrashIcon class="size-4" />
                          {/if}
                        </Button>
                      {/snippet}
                    </Tooltip.Trigger>
                    <Tooltip.Content class="bg-destructive text-white" arrowClasses="bg-destructive"
                      >Delete account</Tooltip.Content
                    >
                  </Tooltip.Root>
                </div>
              </div>
            {/if}
          </div>
        </DropdownMenu.Label>
        <DropdownMenu.Separator />
        <DropdownMenu.Group>
          {#if authState.tier === 'pro'}
            <a href={authState.portalHref} target="_blank">
              <DropdownMenu.Item data-ph-capture-attribute-action="manage-subscription" data-ph-capture-attribute-section="user-menu">
                <CreditCardIcon />
                Manage Subscription
              </DropdownMenu.Item>
            </a>
          {:else}
            <a href="/pricing">
              <DropdownMenu.Item data-ph-capture-attribute-action="upgrade" data-ph-capture-attribute-section="user-menu">
                <SparklesIcon />
                Upgrade
              </DropdownMenu.Item>
            </a>
          {/if}
          <DropdownMenu.Item
            data-ph-capture-attribute-action="toggle-email-updates"
            data-ph-capture-attribute-section="user-menu"
            onSelect={(e) => e.preventDefault()}
            onclick={async () => {
              bellShaking = true;
              setTimeout(() => (bellShaking = false), 500);

              const next = !(authState.user!.wantsEmailUpdates ?? false);
              authState.setWantsEmailUpdates(next);
              await toggleEmailUpdates(next);
            }}
          >
            <span class={bellShaking ? 'inline-flex animate-shake' : 'inline-flex'}>
              {#if authState.user?.wantsEmailUpdates}
                <BellIcon />
              {:else}
                <BellOffIcon />
              {/if}
            </span>
            Product Updates
          </DropdownMenu.Item>
        </DropdownMenu.Group>
        <DropdownMenu.Separator />
        <DropdownMenu.Item variant="destructive" data-ph-capture-attribute-action="log-out" data-ph-capture-attribute-section="user-menu" onclick={() => authState.signOut()}>
          <LogOutIcon />
          Log out
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  {:else}
    <Sidebar.MenuButton
      size="lg"
      data-ph-capture-attribute-action="sign-in-prompt"
      data-ph-capture-attribute-section="user-menu"
      onclick={() => {
        loginDialogState.show();
        sidebar.setOpenMobile(false);
      }}
    >
      <CircleUserIcon class="size-5!" />
      <div class="grid flex-1 text-start text-sm leading-tight">
        <span class="truncate font-medium">Guest</span>
        <span class="truncate text-xs text-muted-foreground">Sign in to store your CVs</span>
      </div>
    </Sidebar.MenuButton>
  {/if}
</Sidebar.MenuItem>
