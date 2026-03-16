<script lang="ts">
  import { Button } from '$lib/ui/components/button';
  import * as Tooltip from '$lib/ui/components/tooltip';
  import Plus from '@lucide/svelte/icons/plus';
  import Minus from '@lucide/svelte/icons/minus';
  import AppWindow from '@lucide/svelte/icons/app-window';
  import Download from '@lucide/svelte/icons/download';
  import * as ButtonGroup from '$lib/ui/components/button-group/index.js';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import * as Menubar from '$lib/ui/components/menubar/index.js';
  import Share from '@lucide/svelte/icons/share';
  import Link from '@lucide/svelte/icons/link';
  import LoadingSpinner from '$lib/features/primitives/LoadingSpinner.svelte';
  import { viewer } from './viewer-state.svelte';
  import { fileState, resolveFileSections } from '$lib/features/cv-files/file-state.svelte';
  import { downloadPdf, downloadTypst } from './download-cv';
  import { confirmState } from '$lib/features/primitives/confirm-state.svelte';
  import { copyPublicLink, flashCopied } from '$lib/features/cv-files/public-link';
  import CheckIcon from '@lucide/svelte/icons/check';
  import { authState } from '$lib/features/auth/auth-state.svelte';
  import { loginDialogState } from '$lib/features/auth/login-dialog-state.svelte';
  import { upgradePromptState } from '$lib/features/auth/upgrade-prompt-state.svelte';
  import type { CvFileSections } from '$lib/features/cv-files/types';
  import { capture } from '$lib/analytics/posthog-client';
  import { EVENTS } from '$lib/analytics/events';
  import { createLogger } from '$lib/logger';

  const log = createLogger('pdfControls');

  interface Props {
    onPopup?: () => void;
    /** When provided, controls operate on these sections instead of fileState. */
    sections?: CvFileSections;
    /** File name used for downloads when in standalone mode. */
    cvName?: string;
  }

  let { onPopup, sections, cvName }: Props = $props();

  /** Whether we're in standalone mode (shared page) vs app mode (fileState). */
  const standalone = $derived(!!sections);

  function getCvAnalytics() {
    if (standalone) return { cv_id: null, edit_count: null, theme: null };
    const f = fileState.selectedFile;
    return { cv_id: f?.id ?? null, edit_count: f?.editCount ?? 0, theme: f?.selectedTheme ?? null };
  }

  let isDownloadingPdf = $state(false);
  let isDownloadingTypst = $state(false);
  let isSharing = $state(false);
  let linkCopied = $state(false);

  function getSections(): CvFileSections | undefined {
    if (sections) return sections;
    const file = fileState.selectedFile;
    return file ? resolveFileSections(file) : undefined;
  }

  function getFileName(ext: string): string {
    if (cvName) return `${cvName}.${ext}`;
    const file = fileState.selectedFile;
    return file ? `${file.name}.${ext}` : `cv.${ext}`;
  }

  async function handleDownloadPdf() {
    if (isDownloadingPdf) return;
    const s = getSections();
    if (!s) return;
    isDownloadingPdf = true;
    try {
      await downloadPdf(s, getFileName('pdf'));
      capture(EVENTS.CV_DOWNLOADED, { format: 'pdf', source: 'download', ...getCvAnalytics() });
    } catch (e) {
      log.error('PDF download failed', e);
    } finally {
      isDownloadingPdf = false;
    }
  }

  async function handleDownloadTypst() {
    if (isDownloadingTypst) return;
    const s = getSections();
    if (!s) return;
    isDownloadingTypst = true;
    try {
      await downloadTypst(s, getFileName('typ'));
      capture(EVENTS.CV_DOWNLOADED, { format: 'typst', source: 'download', ...getCvAnalytics() });
    } finally {
      isDownloadingTypst = false;
    }
  }

  function handlePublicLink() {
    if (!authState.isLoggedIn) {
      loginDialogState.show({
        title: 'Sign in to share your CV',
        description: 'Create a free account to get a public link to your CV'
      });
      return;
    }
    if (!authState.can('plus')) {
      upgradePromptState.show('public-sharing');
      return;
    }
    const file = fileState.selectedFile;
    if (!file) return;
    if (file.isPublic) {
      copyPublicLink(file.id);
      flashCopied((v) => (linkCopied = v));
    } else {
      confirmState.confirm(
        'Make this CV public?',
        'Anyone with the link will be able to view this CV. You can make it private again at any time.',
        () => {
          fileState.makePublic(file.id);
          capture(EVENTS.CV_MADE_PUBLIC, { cv_id: file.id });
          copyPublicLink(file.id);
          flashCopied((v) => (linkCopied = v));
        },
        'Yes and copy link'
      );
    }
  }

  async function handleShare() {
    if (isSharing) return;
    const s = getSections();
    if (!s) return;
    isSharing = true;
    try {
      const pdfBytes = await viewer.renderToPdf(s);
      if (!pdfBytes) return;
      const name = getFileName('pdf');
      const pdfFile = new File(
        [new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' })],
        name,
        { type: 'application/pdf' }
      );
      await navigator.share({ files: [pdfFile], title: cvName ?? fileState.selectedFile?.name });
      capture(EVENTS.CV_DOWNLOADED, { format: 'pdf', source: 'share' });
      capture(EVENTS.CV_SHARED_NATIVE);
    } catch {
      // user cancelled or share unsupported
    } finally {
      isSharing = false;
    }
  }
</script>

<ButtonGroup.Root class="ph-no-capture max-[360px]:hidden">
  <Tooltip.Root>
    <Tooltip.Trigger>
      {#snippet child({ props })}
        <Button
          {...props}
          variant="ghost"
          class="size-8 border"
          size="icon"
          onclick={() => viewer.zoomOut()}
          aria-label="Zoom out"
        >
          <Minus class="size-4" />
        </Button>
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content>Zoom out</Tooltip.Content>
  </Tooltip.Root>
  <Button
    variant="ghost"
    class="size-8 w-14 border font-normal"
    size="icon"
    onclick={() => viewer.zoomReset()}
    aria-label="Zoom level"
  >
    {viewer.zoomPercent}%
  </Button>

  <Tooltip.Root>
    <Tooltip.Trigger>
      {#snippet child({ props })}
        <Button
          {...props}
          variant="ghost"
          class="size-8 border"
          size="icon"
          onclick={() => viewer.zoomIn()}
          aria-label="Zoom in"
        >
          <Plus class="size-4" />
        </Button>
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content>Zoom in</Tooltip.Content>
  </Tooltip.Root>
</ButtonGroup.Root>

{#if onPopup}
  <Tooltip.Root>
    <Tooltip.Trigger>
      {#snippet child({ props })}
        <Button
          {...props}
          variant="ghost"
          class="size-8 border max-md:hidden"
          size="icon"
          onclick={onPopup}
          aria-label="Show preview in popup"
          data-ph-capture-attribute-action="open-popup-preview"
          data-ph-capture-attribute-section="viewer"
        >
          <AppWindow class="size-4" />
        </Button>
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content>Show preview in popup</Tooltip.Content>
  </Tooltip.Root>
{/if}

<ButtonGroup.Root>
  <Tooltip.Root>
    <Tooltip.Trigger>
      {#snippet child({ props })}
        <Button
          {...props}
          variant="ghost"
          class="size-8 border"
          size="icon"
          data-testid="download-pdf"
          data-ph-capture-attribute-action="download-pdf"
          data-ph-capture-attribute-section="viewer"
          disabled={isDownloadingPdf || isDownloadingTypst}
          onclick={handleDownloadPdf}
          aria-label="Download PDF"
        >
          {#if isDownloadingPdf || isDownloadingTypst}
            <LoadingSpinner />
          {:else}
            <Download class="size-4" />
          {/if}
        </Button>
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content>Download PDF</Tooltip.Content>
  </Tooltip.Root>

  <Menubar.Root class="h-auto border-none bg-transparent p-0 shadow-none">
    <Menubar.Menu>
      <Menubar.Trigger>
        {#snippet child({ props })}
          <Button
            {...props}
            variant="ghost"
            class="size-8 w-5 rounded-s-none border border-s-0 data-[state=open]:bg-accent"
            size="icon"
            data-testid="more-download-options"
            data-ph-capture-attribute-action="download-options"
            data-ph-capture-attribute-section="viewer"
            aria-label="More download options"
          >
            <ChevronDown class="size-3" />
          </Button>
        {/snippet}
      </Menubar.Trigger>
      <Menubar.Content>
        <Menubar.Item
          class="cursor-pointer"
          data-ph-capture-attribute-action="download-pdf"
          data-ph-capture-attribute-section="viewer"
          disabled={isDownloadingPdf}
          onSelect={handleDownloadPdf}>Download PDF</Menubar.Item
        >
        <Menubar.Item
          class="cursor-pointer"
          data-testid="download-typst"
          data-ph-capture-attribute-action="download-typst"
          data-ph-capture-attribute-section="viewer"
          disabled={isDownloadingTypst}
          onSelect={handleDownloadTypst}>Download Typst</Menubar.Item>
        >
      </Menubar.Content>
    </Menubar.Menu>
  </Menubar.Root>
</ButtonGroup.Root>

<Tooltip.Root>
  <Tooltip.Trigger>
    {#snippet child({ props })}
      <Button
        {...props}
        variant="ghost"
        class="size-8 border"
        size="icon"
        disabled={isSharing}
        onclick={handleShare}
        aria-label="Share PDF"
        data-ph-capture-attribute-action="share-pdf"
        data-ph-capture-attribute-section="viewer"
      >
        {#if isSharing}
          <LoadingSpinner />
        {:else}
          <Share class="size-4" />
        {/if}
      </Button>
    {/snippet}
  </Tooltip.Trigger>
  <Tooltip.Content>Share PDF</Tooltip.Content>
</Tooltip.Root>

{#if !standalone}
  <Tooltip.Root>
    <Tooltip.Trigger>
      {#snippet child({ props })}
        <Button
          {...props}
          variant="ghost"
          class="size-8 border"
          size="icon"
          onclick={handlePublicLink}
          aria-label="Get Public PDF Link"
          data-ph-capture-attribute-action="public-link"
          data-ph-capture-attribute-section="viewer"
        >
          {#if linkCopied}
            <CheckIcon class="size-4" />
          {:else}
            <Link class="size-4" />
          {/if}
        </Button>
      {/snippet}
    </Tooltip.Trigger>
    <Tooltip.Content>{linkCopied ? 'Link copied!' : 'Get Public PDF Link'}</Tooltip.Content>
  </Tooltip.Root>
{/if}
