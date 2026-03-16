<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import { onDestroy, tick } from 'svelte';
  import SendIcon from '@lucide/svelte/icons/send';
  import CheckIcon from '@lucide/svelte/icons/check';
  import XIcon from '@lucide/svelte/icons/x';
  import ImageIcon from '@lucide/svelte/icons/image';
  import * as Popover from '$lib/ui/components/popover/index.js';
  import * as Sidebar from '$lib/ui/components/sidebar/index.js';
  import { Button } from '$lib/ui/components/button/index.js';
  import { Input } from '$lib/ui/components/input/index.js';
  import { Textarea } from '$lib/ui/components/textarea/index.js';
  import LoadingSpinner from '$lib/features/primitives/LoadingSpinner.svelte';
  import { fade } from 'svelte/transition';
  import { submitFeedback } from './feedback.remote';
  import { ACCEPTED_IMAGE_TYPES } from './schema';
  import { IsMobile } from '$lib/ui/hooks/is-mobile.svelte';
  import { authState } from '$lib/features/auth/auth-state.svelte';
  import { capture } from '$lib/analytics/posthog-client';
  import { EVENTS } from '$lib/analytics/events';
  import { generateId } from '$lib/utils/uuid';

  let {
    pagePath
  }: {
    pagePath?: string;
  } = $props();

  const isMobile = new IsMobile();

  let feedbackOpen = $state(false);
  let feedbackSuccess = $state(false);

  const MIN_MESSAGE_HEIGHT = 96;
  const MIN_POPOVER_WIDTH = 320;
  const VIEWPORT_MARGIN = 16;
  const SIDE_OFFSET = 8;
  let messageHeight = $state(MIN_MESSAGE_HEIGHT);
  let popoverWidth = $state(MIN_POPOVER_WIDTH);
  let isResizing = $state(false);
  let popoverContentRef = $state<HTMLDivElement | null>(null);

  type AnchorPoint = { x: number; y: number };
  type VirtualAnchor = { getBoundingClientRect: () => DOMRect };
  let clickAnchorPoint = $state<AnchorPoint | null>(null);
  let initialAnchorPoint: AnchorPoint | null = null;
  let skipNextObserverAdjust = false;
  const clickAnchor = $derived<VirtualAnchor | null>(
    (() => {
      const anchor = clickAnchorPoint;
      if (!anchor) return null;
      return {
        getBoundingClientRect: () => new DOMRect(anchor.x, anchor.y, 1, 1)
      };
    })()
  );
  const popoverAnchor = $derived(isMobile.current ? null : clickAnchor);

  type ResizeSession = {
    pointerId: number;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    maxWidth: number;
    maxHeight: number;
    anchorX: number;
    popoverChrome: number;
    fixedBottom: number;
  };

  let resizeSession = $state<ResizeSession | null>(null);
  const resolvedPagePath = $derived(pagePath ?? `${page.url.pathname}${page.url.search}`);

  // --- Image state ---
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
  const MAX_IMAGES = 5;

  type ImagePreview = { id: string; file: File; previewUrl: string; loaded: boolean };

  let images = $state<ImagePreview[]>([]);
  let hasLoadingImages = $derived(images.some((img) => !img.loaded));
  let isDraggingImage = $state(false);
  let imageDragCounter = 0;
  let imageInputRefs = $state<HTMLInputElement[]>([]);

  let imageError = $state<string | null>(null);
  let imageErrorTimer: ReturnType<typeof setTimeout> | undefined;

  function showImageError(message: string) {
    clearTimeout(imageErrorTimer);
    imageError = message;
    imageErrorTimer = setTimeout(() => {
      imageError = null;
    }, 4000);
  }

  async function syncFileInputs() {
    await tick();
    for (let i = 0; i < images.length; i++) {
      if (imageInputRefs[i]) {
        const dt = new DataTransfer();
        dt.items.add(images[i].file);
        imageInputRefs[i].files = dt.files;
      }
    }
  }

  function addImage(file: File) {
    if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      showImageError('Unsupported image type');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      showImageError('Image must be 5 MB or smaller');
      return;
    }
    if (images.length >= MAX_IMAGES) {
      showImageError(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    imageError = null;
    clearTimeout(imageErrorTimer);

    images.push({
      id: generateId(),
      file,
      previewUrl: URL.createObjectURL(file),
      loaded: false
    });
    syncFileInputs();
  }

  function removeImage(id: string) {
    const idx = images.findIndex((img) => img.id === id);
    if (idx !== -1) {
      URL.revokeObjectURL(images[idx].previewUrl);
      images.splice(idx, 1);
    }
    syncFileInputs();
  }

  function clearAllImages() {
    for (const img of images) {
      URL.revokeObjectURL(img.previewUrl);
    }
    images = [];
    imageInputRefs = [];
  }

  function handleImageDragEnter(e: DragEvent) {
    e.preventDefault();
    imageDragCounter++;
    if (e.dataTransfer?.types.includes('Files')) {
      isDraggingImage = true;
    }
  }

  function handleImageDragLeave(e: DragEvent) {
    e.preventDefault();
    imageDragCounter--;
    if (imageDragCounter === 0) {
      isDraggingImage = false;
    }
  }

  function handleImageDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }

  function handleImageDrop(e: DragEvent) {
    e.preventDefault();
    imageDragCounter = 0;
    isDraggingImage = false;

    const files = Array.from(e.dataTransfer?.files ?? []);
    for (const file of files) {
      addImage(file);
    }
  }

  function handlePaste(e: ClipboardEvent) {
    const items = Array.from(e.clipboardData?.items ?? []);
    for (const item of items) {
      if (item.kind === 'file' && (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(item.type)) {
        const file = item.getAsFile();
        if (file) {
          addImage(file);
        }
      }
    }
  }

  function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  function endResizeSession() {
    isResizing = false;
    resizeSession = null;
    if (!browser) return;
    window.removeEventListener('blur', handleWindowBlur);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }

  function handleWindowBlur() {
    endResizeSession();
  }

  function handleTriggerPointerDown(event: PointerEvent) {
    if (!browser || event.button !== 0 || feedbackOpen) return;
    if (isMobile.current) return;
    clickAnchorPoint = { x: event.clientX + SIDE_OFFSET, y: event.clientY };
    initialAnchorPoint = { x: event.clientX + SIDE_OFFSET, y: event.clientY };
  }

  function handleTriggerKeydown() {
    clickAnchorPoint = null;
  }

  function handleResizeReset(event: MouseEvent) {
    if (!browser) return;
    event.preventDefault();
    event.stopPropagation();
    endResizeSession();

    skipNextObserverAdjust = true;
    popoverWidth = MIN_POPOVER_WIDTH;
    messageHeight = MIN_MESSAGE_HEIGHT;
    clickAnchorPoint = initialAnchorPoint ? { ...initialAnchorPoint } : null;
  }

  function handleResizeMove(event: PointerEvent) {
    const session = resizeSession;
    if (!session) return;
    if (event.pointerId !== session.pointerId) return;

    event.preventDefault();

    const nextWidth = clamp(
      session.startWidth + (event.clientX - session.startX),
      MIN_POPOVER_WIDTH,
      session.maxWidth
    );
    const nextHeight = clamp(
      session.startHeight - (event.clientY - session.startY),
      MIN_MESSAGE_HEIGHT,
      session.maxHeight
    );

    popoverWidth = nextWidth;
    messageHeight = nextHeight;
    clickAnchorPoint = {
      x: session.anchorX,
      y: session.fixedBottom - (session.popoverChrome + nextHeight)
    };
  }

  function handleResizeEnd(event: PointerEvent) {
    if (!resizeSession) return;
    if (event.pointerId !== resizeSession.pointerId) return;
    endResizeSession();
  }

  function handleResizeStart(event: PointerEvent) {
    if (!browser) return;
    if (isMobile.current) return;
    if (event.button !== 0 || !popoverContentRef) return;
    event.preventDefault();
    event.stopPropagation();
    endResizeSession();

    const popoverRect = popoverContentRef.getBoundingClientRect();
    const popoverChrome = Math.max(0, popoverRect.height - messageHeight);
    const fixedBottom = popoverRect.top + popoverRect.height;
    const maxWidth = Math.max(
      MIN_POPOVER_WIDTH,
      window.innerWidth - VIEWPORT_MARGIN - popoverRect.left
    );
    const maxHeight = Math.max(MIN_MESSAGE_HEIGHT, fixedBottom - popoverChrome - VIEWPORT_MARGIN);
    const anchorX = clickAnchorPoint?.x ?? popoverRect.left - SIDE_OFFSET;
    const anchorY = clickAnchorPoint?.y ?? popoverRect.top;
    clickAnchorPoint = { x: anchorX, y: anchorY };

    const currentTarget = event.currentTarget;
    if (!(currentTarget instanceof HTMLElement)) return;
    currentTarget.setPointerCapture(event.pointerId);

    resizeSession = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: popoverWidth,
      startHeight: messageHeight,
      maxWidth,
      maxHeight,
      anchorX,
      popoverChrome,
      fixedBottom
    };

    window.addEventListener('blur', handleWindowBlur);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'nesw-resize';
    isResizing = true;
  }

  // Keep popover bottom-anchored when content height changes (e.g. images added)
  $effect(() => {
    if (!popoverContentRef || !feedbackOpen || !browser) return;

    let lastHeight = popoverContentRef.offsetHeight;

    const observer = new ResizeObserver(() => {
      const newHeight = popoverContentRef!.offsetHeight;
      const delta = newHeight - lastHeight;
      if (skipNextObserverAdjust) {
        skipNextObserverAdjust = false;
      } else if (delta !== 0 && clickAnchorPoint && !isResizing) {
        clickAnchorPoint = {
          x: clickAnchorPoint.x,
          y: clickAnchorPoint.y - delta
        };
      }
      lastHeight = newHeight;
    });

    observer.observe(popoverContentRef);
    return () => observer.disconnect();
  });

  onDestroy(() => {
    endResizeSession();
    clearAllImages();
    clearTimeout(imageErrorTimer);
  });
</script>

<Popover.Root
  bind:open={feedbackOpen}
  onOpenChange={(isOpen) => {
    if (!isOpen && isResizing) {
      endResizeSession();
    }
  }}
  onOpenChangeComplete={(isOpen) => {
    if (!isOpen) {
      clickAnchorPoint = null;
      initialAnchorPoint = null;
      popoverWidth = MIN_POPOVER_WIDTH;
      messageHeight = MIN_MESSAGE_HEIGHT;
      imageError = null;
      clearTimeout(imageErrorTimer);
    }
  }}
>
  <Popover.Trigger onpointerdown={handleTriggerPointerDown} onkeydown={handleTriggerKeydown}>
    {#snippet child({ props })}
      <Sidebar.MenuButton {...props} size="sm" class="h-5.5 py-0" data-testid="feedback-button" data-ph-capture-attribute-action="open-feedback" data-ph-capture-attribute-section="feedback">
        {#if feedbackSuccess}
          <CheckIcon class="size-3.5! text-chart-2" />
          <span class="text-chart-2" data-testid="feedback-success">Thanks!</span>
        {:else}
          <SendIcon class="size-3.5!" />
          Feedback
        {/if}
      </Sidebar.MenuButton>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content
    side={isMobile.current ? 'top' : 'right'}
    align={isMobile.current ? 'center' : 'start'}
    sideOffset={SIDE_OFFSET}
    customAnchor={popoverAnchor}
    bind:ref={popoverContentRef}
    collisionPadding={VIEWPORT_MARGIN}
    class="max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)] space-y-3 overflow-y-auto {isMobile.current
      ? ''
      : 'min-w-80'}"
    style={isMobile.current
      ? `width: calc(100vw - ${VIEWPORT_MARGIN * 2}px)`
      : `width: ${popoverWidth}px`}
    onOpenAutoFocus={(event) => {
      event.preventDefault();
      const textarea = popoverContentRef?.querySelector('textarea');
      if (textarea instanceof HTMLTextAreaElement) {
        textarea.focus({ preventScroll: true });
      }
    }}
  >
    <form
      data-testid="feedback-form"
      {...submitFeedback.enhance(async ({ form, submit }) => {
        feedbackOpen = false;
        feedbackSuccess = true;
        capture(EVENTS.FEEDBACK_SUBMITTED);
        setTimeout(() => {
          feedbackSuccess = false;
        }, 2000);
        form.reset();
        clearAllImages();

        await submit();
      })}
      enctype="multipart/form-data"
      class="relative space-y-3"
      oninput={() => {
        if (submitFeedback.fields.allIssues?.()?.length) submitFeedback.validate();
      }}
      onkeydown={(event: KeyboardEvent) => {
        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && !hasLoadingImages) {
          event.preventDefault();
          (event.currentTarget as HTMLFormElement).requestSubmit();
        }
      }}
      ondragenter={handleImageDragEnter}
      ondragleave={handleImageDragLeave}
      ondragover={handleImageDragOver}
      ondrop={handleImageDrop}
    >
      {#if isDraggingImage}
        <div
          class="absolute inset-0 z-50 flex items-center justify-center rounded-lg border-2 border-dashed border-primary bg-primary/10 backdrop-blur-xs"
        >
          <div class="flex flex-col items-center gap-1">
            <ImageIcon class="size-6 text-primary" />
            <span class="text-sm font-medium text-primary">Drop image here</span>
          </div>
        </div>
      {/if}

      {#if authState.user}
        <input type="hidden" name="userId" value={authState.user.id} />
        <input type="hidden" name="email" value={authState.user.email} />
      {:else}
        <input type="hidden" name="userId" value="guest" />
      {/if}

      {#if imageError}
        <p role="alert" class="text-xs text-destructive" transition:fade={{ duration: 150 }}>
          {imageError}
        </p>
      {/if}

      {#if images.length > 0}
        <div class="flex flex-wrap gap-2">
          {#each images as img, i (img.id)}
            <input
              {...submitFeedback.fields.images[i].as('file')}
              bind:this={imageInputRefs[i]}
              class="hidden"
            />
            <div
              class="group relative size-16 overflow-hidden rounded-md border border-border bg-muted"
            >
              <img
                src={img.previewUrl}
                alt="Attachment"
                class="size-full object-cover"
                onload={() => (img.loaded = true)}
              />
              {#if !img.loaded}
                <div class="absolute inset-0 flex items-center justify-center bg-black/40">
                  <LoadingSpinner class="size-5! text-white!" />
                </div>
              {/if}
              <button
                type="button"
                class="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-black/40 text-white"
                onclick={() => removeImage(img.id)}
              >
                <XIcon class="size-3" />
              </button>
            </div>
          {/each}
        </div>
      {/if}

      <div class="relative space-y-1">
        {#if !isMobile.current}
          <button
            type="button"
            aria-label="Resize feedback box"
            title="Drag to resize"
            class="absolute top-px right-px z-10 grid size-5 cursor-nesw-resize touch-none place-items-start overflow-hidden rounded-tr-md text-muted-foreground/70 hover:text-muted-foreground"
            onpointerdown={handleResizeStart}
            onpointermove={handleResizeMove}
            onpointerup={handleResizeEnd}
            onpointercancel={handleResizeEnd}
            ondblclick={handleResizeReset}
            onlostpointercapture={() => {
              if (isResizing) endResizeSession();
            }}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 10 10"
              class="pointer-events-none ml-auto size-3.5 -rotate-90"
              fill="none"
              stroke="currentColor"
              stroke-width="1"
            >
              <line x1="10.5" y1="1.5" x2="1.5" y2="10.5" />
              <line x1="10.5" y1="5" x2="5" y2="10.5" />
              <line x1="10.5" y1="8.5" x2="8.5" y2="10.5" />
            </svg>
            <span class="sr-only">Resize</span>
          </button>
        {/if}
        <Textarea
          {...submitFeedback.fields.message.as('text')}
          data-testid="feedback-message"
          class="min-h-24 resize-none pt-3 {isMobile.current ? '' : 'pr-9'}"
          style={`height: ${messageHeight}px`}
          placeholder={isMobile.current
            ? 'How can we improve RenderCV? (paste screenshots)'
            : 'How can we improve RenderCV? (paste or drop screenshots)'}
          onpaste={handlePaste}
        />
        {#each submitFeedback.fields.message.issues() as issue, i (i)}
          <p class="text-xs text-destructive">{issue.message}</p>
        {/each}
      </div>

      {#if !authState.isLoggedIn}
        <div class="space-y-1">
          <Input
            {...submitFeedback.fields.email.as('email')}
            data-testid="feedback-email"
            class="h-8"
            placeholder="Email (optional)"
          />
          {#each submitFeedback.fields.email.issues() as issue, i (i)}
            <p class="text-xs text-destructive">{issue.message}</p>
          {/each}
        </div>
      {/if}

      <div class="flex justify-end">
        <Button type="submit" size="sm" data-testid="feedback-send" data-ph-capture-attribute-action="send-feedback" data-ph-capture-attribute-section="feedback" disabled={hasLoadingImages}
          >Send</Button
        >
      </div>
    </form>
  </Popover.Content>
</Popover.Root>
