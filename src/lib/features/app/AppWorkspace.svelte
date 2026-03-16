<script lang="ts">
  import AppSidebar from '$lib/features/sidebar/AppSidebar.svelte';
  import ModeToggle from '$lib/features/primitives/ModeToggle.svelte';
  import MonacoEditor from '$lib/features/editor/MonacoEditor.svelte';
  import LoadingSpinner from '$lib/features/primitives/LoadingSpinner.svelte';
  import TypstViewer from '$lib/features/viewer/TypstViewer.svelte';
  import * as Resizable from '$lib/ui/components/resizable/index.js';
  import PdfControls from '$lib/features/viewer/PdfControls.svelte';
  import * as Sidebar from '$lib/ui/components/sidebar/index.js';
  import { Button } from '$lib/ui/components/button/index.js';
  import { fileState } from '$lib/features/cv-files/file-state.svelte';
  import { viewer } from '$lib/features/viewer/viewer-state.svelte';
  import { editor } from '$lib/features/editor/editor-state.svelte';
  import BoldIcon from '@lucide/svelte/icons/bold';
  import * as Tooltip from '$lib/ui/components/tooltip/index.js';
  import ItalicIcon from '@lucide/svelte/icons/italic';
  import LinkIcon from '@lucide/svelte/icons/link';
  import Undo2Icon from '@lucide/svelte/icons/undo-2';
  import ChevronsDownUpIcon from '@lucide/svelte/icons/chevrons-down-up';
  import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
  import Redo2Icon from '@lucide/svelte/icons/redo-2';
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import * as ButtonGroup from '$lib/ui/components/button-group/index.js';
  import * as Tabs from '$lib/ui/components/tabs/index.js';
  import { confirmState } from '$lib/features/primitives/confirm-state.svelte';
  import { fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { SECTION_KEYS, SECTION_LABELS, type SectionKey } from '$lib/features/cv-files/types';
  import { Switch } from '$lib/ui/components/switch/index.js';
  import { Label } from '$lib/ui/components/label/index.js';
  import VariantSelector from './VariantSelector.svelte';
  import InlineChatOverlay from '$lib/features/ai-chat/Chat.svelte';
  import { aiChat } from '$lib/features/ai-chat/chat-state.svelte';
  import type { SelectionAttachment } from '$lib/features/ai-chat/selection-attachment.svelte';
  import { reviewState, type LineChange } from '$lib/features/editor/review-state.svelte';
  import { preferences } from '$lib/features/preferences/pref-state.svelte';
  import FormEditor from '$lib/features/form_editor/FormEditor.svelte';
  import { formEditorUndo } from '$lib/features/form_editor/form-editor-undo.svelte.js';
  import { formEditorCollapse } from '$lib/features/form_editor/form-editor-collapse.svelte.js';
  import { insertTextInTextarea, isUrl } from '$lib/features/form_editor/textarea-format.js';
  import { undoAll, keepAll, undoLast } from '$lib/features/form_editor/review-actions.js';
  import { onMount } from 'svelte';
  import { capture } from '$lib/analytics/posthog-client';
  import { EVENTS } from '$lib/analytics/events';
  import { generateId } from '$lib/utils/uuid';

  let { active = true }: { active?: boolean } = $props();

  // Track cv_content_edited once per file per session
  const editedFileIds = new Set<string>();

  function horizontalSlide(node: HTMLElement, { duration = 200, easing = cubicOut } = {}) {
    const w = node.offsetWidth;
    return {
      duration,
      easing,
      css: (t: number) =>
        `flex: 0 0 ${t * w}px; min-width: 0; overflow: hidden; white-space: nowrap;`
    };
  }

  function isInteractiveElementFocused(): boolean {
    if (editor.editor?.hasTextFocus()) return true;
    const el = document.activeElement;
    if (!(el instanceof HTMLElement)) return false;
    return (
      el instanceof HTMLInputElement ||
      el instanceof HTMLTextAreaElement ||
      el.isContentEditable ||
      el.closest('[role="menu"],[role="listbox"],[role="dialog"]') !== null
    );
  }

  function handleUndoKeydown(e: KeyboardEvent) {
    if (!e.key || e.key.toLowerCase() !== 'z' || !(e.metaKey || e.ctrlKey) || e.shiftKey) return;
    if (isInteractiveElementFocused()) return;

    e.preventDefault();
    fileState.undo();
  }

  function handleRedoKeydown(e: KeyboardEvent) {
    if (!e.key) return;
    const isRedoShortcut =
      (e.key.toLowerCase() === 'z' && (e.metaKey || e.ctrlKey) && e.shiftKey) ||
      (e.key.toLowerCase() === 'y' && e.ctrlKey && !e.metaKey);
    if (!isRedoShortcut) return;
    if (isInteractiveElementFocused()) return;

    e.preventDefault();
    fileState.redo();
  }

  function visibleFiles() {
    return [
      ...fileState.activeFiles,
      ...(preferences.showArchive ? fileState.archivedFiles : []),
      ...(preferences.showTrash ? fileState.trashedFiles : [])
    ];
  }

  function selectPrev() {
    const files = visibleFiles();
    const index = files.findIndex((f) => f.id === fileState.selectedFileId);
    if (index > 0) fileState.selectFile(files[index - 1].id);
  }

  function selectNext() {
    const files = visibleFiles();
    const index = files.findIndex((f) => f.id === fileState.selectedFileId);
    if (index !== -1 && index < files.length - 1) fileState.selectFile(files[index + 1].id);
  }

  let currentFileIndex = $derived(
    visibleFiles().findIndex((f) => f.id === fileState.selectedFileId)
  );
  let totalFiles = $derived(visibleFiles().length);

  function handleArrowUpKeydown(e: KeyboardEvent) {
    if (e.key !== 'ArrowUp') return;
    if (isInteractiveElementFocused()) return;
    if (currentFileIndex > 0) {
      e.preventDefault();
      selectPrev();
    }
  }

  function handleArrowDownKeydown(e: KeyboardEvent) {
    if (e.key !== 'ArrowDown') return;
    if (isInteractiveElementFocused()) return;
    if (currentFileIndex !== -1 && currentFileIndex < totalFiles - 1) {
      e.preventDefault();
      selectNext();
    }
  }

  function handleTrashKeydown(e: KeyboardEvent) {
    if (e.key !== 'Backspace' || !(e.metaKey || e.ctrlKey)) return;
    if (isInteractiveElementFocused()) return;

    const file = fileState.selectedFile;
    if (!file) return;

    e.preventDefault();

    if (file.isTrashed) {
      confirmState.confirm(
        `Delete "${file.name}" permanently?`,
        'This action cannot be undone. The file will be permanently removed.',
        () => fileState.deleteFile(file.id)
      );
    } else {
      fileState.trashFile(file.id);
    }
  }

  function handleDuplicateKeydown(e: KeyboardEvent) {
    if (e.key.toLowerCase() !== 'd' || !(e.metaKey || e.ctrlKey)) return;
    if (isInteractiveElementFocused()) return;

    const file = fileState.selectedFile;
    if (!file) return;

    e.preventDefault();
    fileState.duplicateFile(file.id);
  }

  function handleLockKeydown(e: KeyboardEvent) {
    if (e.key.toLowerCase() !== 'k' || !(e.metaKey || e.ctrlKey)) return;
    e.preventDefault();
    if (isInteractiveElementFocused()) return;

    const file = fileState.selectedFile;
    if (!file) return;

    if (file.isLocked) {
      fileState.unlockFile(file.id);
    } else {
      fileState.lockFile(file.id);
    }
  }

  function formatText(prefix: string, suffix: string) {
    if (preferences.yamlEditor) {
      editor.insertText(prefix, suffix);
    } else {
      const el = document.activeElement;
      if (el instanceof HTMLTextAreaElement) {
        insertTextInTextarea(el, prefix, suffix);
      }
    }
  }

  async function formatLink() {
    let url = 'url';
    try {
      const clip = await navigator.clipboard.readText();
      if (clip && isUrl(clip.trim())) url = clip.trim();
    } catch {}
    formatText('[', `](${url})`);
  }

  function handleSelectionAttach(e: KeyboardEvent) {
    if (!active) return;
    if (e.key.toLowerCase() !== 'l' || !(e.metaKey || e.ctrlKey)) return;
    e.preventDefault();
    e.stopPropagation();

    let text = '';
    let source: SelectionAttachment['source'] = 'yaml';
    let context: string | undefined;

    // Try Monaco editor first
    if (preferences.yamlEditor && editor.editor) {
      const sel = editor.editor.getSelection();
      if (sel && !sel.isEmpty()) {
        const model = editor.editor.getModel();
        if (model) {
          text = model.getValueInRange(sel);
          source = 'yaml';
          const section = preferences.activeSection;
          if (sel.startLineNumber === sel.endLineNumber) {
            context = `${section} (${sel.startLineNumber})`;
          } else {
            context = `${section} (${sel.startLineNumber}-${sel.endLineNumber})`;
          }
        }
      }
    }

    // Fallback to window.getSelection() (form editor)
    if (!text) {
      const winSel = window.getSelection();
      if (winSel && winSel.toString().trim()) {
        text = winSel.toString().trim();
        const anchor = winSel.anchorNode;
        if (anchor instanceof Node) {
          const el = anchor instanceof Element ? anchor : anchor.parentElement;
          if (el?.closest('[data-form-editor]')) {
            source = 'form';
          } else {
            source = 'yaml';
          }
        }
      }
    }

    if (!text) return;

    aiChat.addSelection({
      id: generateId(),
      source,
      text,
      context
    });
    aiChat.isOverlayOpen = true;
  }

  function handleKeydown(e: KeyboardEvent) {
    handleUndoKeydown(e);
    handleRedoKeydown(e);
    handleTrashKeydown(e);
    handleArrowUpKeydown(e);
    handleArrowDownKeydown(e);
    handleDuplicateKeydown(e);
    handleLockKeydown(e);
  }

  type PaneGroupApi = ReturnType<(typeof import('paneforge'))['PaneGroup']>;
  let paneGroup = $state<PaneGroupApi | undefined>(undefined);

  let leftPanelSize = $state(50);
  let activeTab = $state<'edit' | 'preview'>('preview');
  // Route AI edit proposals to review state
  let lastProposalCount = 0;

  // Initialize AI chat + capture-phase Cmd+L (must fire before Monaco's "Select Line")
  onMount(() => {
    aiChat.initialize(() => fileState.sections, fileState);
    lastProposalCount = aiChat.editProposals.length;

    window.addEventListener('keydown', handleSelectionAttach, true);
    return () => {
      window.removeEventListener('keydown', handleSelectionAttach, true);
      aiChat.dispose();
    };
  });

  // React to file selection changes — swap active Chat instance
  $effect(() => {
    const fileId = fileState.selectedFileId;
    aiChat.switchToFile(fileId);
  });

  // Clean up chat instances when files are deleted
  let prevFileIds = new Set<string>();
  $effect(() => {
    const currentIds = new Set(fileState.files.map((f) => f.id));
    for (const id of prevFileIds) {
      if (!currentIds.has(id)) aiChat.removeFile(id);
    }
    prevFileIds = currentIds;
  });

  /** Build the onAction callback for per-hunk undo/keep in the diff editor. */
  function makeReviewAction() {
    return (change: LineChange, action: 'undo' | 'keep') => {
      const section = preferences.activeSection;
      const currentFile = fileState.sections[section] ?? '';
      const currentProposed = reviewState.getProposed(section) ?? '';

      // Snapshot before action so Cmd+Z can restore
      reviewState.pushSnapshot(section, currentFile, currentProposed);

      if (action === 'undo') {
        reviewState.undoChange(section, change, () => fileState.sections[section] ?? '');
      } else {
        reviewState.keepChange(
          section,
          change,
          () => fileState.sections[section] ?? '',
          (content) => {
            fileState.setSectionContent(section, content);
            editor.applyContentAsEdit(section, content);
          }
        );
      }
      // No imperative editor calls — the reactive effect handles display
    };
  }

  /** Undo the last review action (keep or undo). */
  function undoLastReviewAction() {
    undoLast();
  }

  // Process new AI edit proposals
  $effect(() => {
    const total = aiChat.editProposals.length;
    if (total > lastProposalCount) {
      for (let i = lastProposalCount; i < total; i++) {
        const p = aiChat.editProposals[i];
        const base = reviewState.getProposed(p.file) ?? fileState.sections[p.file] ?? '';
        const proposed = base.replace(p.oldText, p.newText);
        reviewState.setProposed(p.file, proposed);
      }
      // Switch to the last edited section
      preferences.activeSection = aiChat.editProposals[total - 1].file;
    }
    lastProposalCount = total;
  });

  // Single reactive effect: derive diff editor state from review state.
  // Only runs when YAML editor is active — form editor handles its own review display.
  // Depends on editor.isLoading so it re-runs after Monaco's async initialization completes.
  $effect(() => {
    if (!preferences.yamlEditor) {
      editor.disposeReview();
      return;
    }
    // Wait for Monaco to finish async initialization before calling ensureReview
    if (editor.isLoading) return;

    const section = preferences.activeSection;
    const proposed = reviewState.getProposed(section);
    const current = fileState.sections[section] ?? '';

    if (proposed !== undefined && proposed !== current) {
      editor.onReviewUndo = undoLastReviewAction;
      editor.ensureReview(current, proposed, makeReviewAction());
    } else {
      editor.disposeReview();
    }
  });

  // Track section tab changes (skip initial value)
  let prevSection: string | undefined;
  $effect(() => {
    const section = preferences.activeSection;
    if (prevSection !== undefined && section !== prevSection) {
      capture(EVENTS.SECTION_TAB_CHANGED, { section, cv_id: fileState.selectedFileId });
    }
    prevSection = section;
  });

  let transitioning = $state(false);

  function animateLayout(sizes: number[]) {
    transitioning = true;
    leftPanelSize = sizes[0];
    paneGroup?.setLayout(sizes);
    setTimeout(() => (transitioning = false), 300);
  }

  function resetLayout() {
    animateLayout([50, 50]);
  }

  let showPdfControls = $state(true);
  $effect(() => {
    const shouldShow = leftPanelSize <= 95 && !popupActive;
    if (shouldShow) {
      showPdfControls = true;
    } else {
      const timeout = setTimeout(() => (showPdfControls = false), 90);
      return () => clearTimeout(timeout);
    }
  });

  // --- Popup preview ---
  let popupActive = $state(false);
  let popupWindow: Window | null = null;
  let popupChannel: BroadcastChannel | null = null;

  // Keep BroadcastChannel alive — handles main page refresh reconnection
  $effect(() => {
    popupChannel = new BroadcastChannel('rendercv-preview');
    popupChannel.onmessage = (e: MessageEvent) => {
      if (e.data.type === 'ready') {
        popupActive = true;
        activeTab = 'edit';
        popupChannel?.postMessage({
          type: 'filestate',
          files: $state.snapshot(fileState.files),
          selectedFileId: fileState.selectedFileId
        });
        animateLayout([100, 0]);
      }
      if (e.data.type === 'closed') {
        popupActive = false;
        popupWindow = null;
        animateLayout([50, 50]);
      }
    };
    // Ping to reconnect with an already-open popup after refresh
    popupChannel.postMessage({ type: 'ping' });
    return () => {
      popupChannel?.close();
      popupChannel = null;
    };
  });

  function openPopup() {
    if (popupActive) {
      popupWindow?.focus();
      return;
    }
    capture(EVENTS.PREVIEW_POPUP_OPENED);
    popupWindow = window.open('/preview', 'rendercv-preview', 'width=800,height=1000');
  }

  // Broadcast full fileState to popup on any change (debounced)
  $effect(() => {
    if (!popupActive) return;
    const files = fileState.files;
    const selectedFileId = fileState.selectedFileId;
    // Touch current sections so Svelte tracks content changes through the proxy
    void [
      fileState.sections.cv,
      fileState.sections.design,
      fileState.sections.locale,
      fileState.sections.settings
    ];

    const timeout = setTimeout(() => {
      popupChannel?.postMessage({
        type: 'filestate',
        files: $state.snapshot(files),
        selectedFileId
      });
    }, 40);
    return () => clearTimeout(timeout);
  });
</script>

<svelte:window onkeydown={active ? handleKeydown : undefined} />

<Sidebar.Provider>
  <AppSidebar />
  <Sidebar.Inset class="overflow-hidden">
    <header class="relative flex h-12 shrink-0 items-center">
      <div
        class="flex min-w-max items-center gap-2 pr-4 pl-4 max-md:w-auto! {transitioning
          ? 'transition-[width] duration-300 ease-out'
          : ''}"
        style="width: {leftPanelSize}%"
      >
        <Sidebar.Trigger class="-ml-1" />
        <div
          class="contents max-md:absolute max-md:left-1/2 max-md:flex max-md:-translate-x-1/2 max-md:items-center max-md:gap-2 {activeTab ===
          'preview'
            ? 'max-md:hidden'
            : ''}"
        >
          {#if !fileState.selectedFileReadOnly}
            <div transition:fade={{ duration: 200 }}>
              <ButtonGroup.Root>
                <Tooltip.Root>
                  <Tooltip.Trigger>
                    {#snippet child({ props })}
                      <Button
                        {...props}
                        variant="ghost"
                        size="icon"
                        class="size-8 border"
                        disabled={preferences.yamlEditor
                          ? !editor.canUndo
                          : !formEditorUndo.canUndo}
                        onmousedown={(e: MouseEvent) => e.preventDefault()}
                        onclick={() =>
                          preferences.yamlEditor ? editor.undo() : formEditorUndo.undo()}
                        aria-label="Undo"
                        data-ph-capture-attribute-action="undo"
                        data-ph-capture-attribute-section="editor-toolbar"
                      >
                        <Undo2Icon class="size-4" />
                      </Button>
                    {/snippet}
                  </Tooltip.Trigger>
                  <Tooltip.Content>Undo</Tooltip.Content>
                </Tooltip.Root>
                <Tooltip.Root>
                  <Tooltip.Trigger>
                    {#snippet child({ props })}
                      <Button
                        {...props}
                        variant="ghost"
                        size="icon"
                        class="size-8 border"
                        disabled={preferences.yamlEditor
                          ? !editor.canRedo
                          : !formEditorUndo.canRedo}
                        onmousedown={(e: MouseEvent) => e.preventDefault()}
                        onclick={() =>
                          preferences.yamlEditor ? editor.redo() : formEditorUndo.redo()}
                        aria-label="Redo"
                        data-ph-capture-attribute-action="redo"
                        data-ph-capture-attribute-section="editor-toolbar"
                      >
                        <Redo2Icon class="size-4" />
                      </Button>
                    {/snippet}
                  </Tooltip.Trigger>
                  <Tooltip.Content>Redo</Tooltip.Content>
                </Tooltip.Root>
              </ButtonGroup.Root>
            </div>
          {/if}
          {#if !fileState.selectedFileReadOnly && !preferences.yamlEditor && preferences.activeSection === 'cv'}
            <div transition:fade={{ duration: 200 }}>
              <Tooltip.Root>
                <Tooltip.Trigger>
                  {#snippet child({ props })}
                    <Button
                      {...props}
                      variant="ghost"
                      size="icon"
                      class="size-8 border"
                      onmousedown={(e: MouseEvent) => e.preventDefault()}
                      onclick={() => formEditorCollapse.toggle()}
                      aria-label={formEditorCollapse.allExpanded ? 'Collapse all' : 'Expand all'}
                      data-ph-capture-attribute-action="toggle-collapse-all"
                      data-ph-capture-attribute-section="editor-toolbar"
                    >
                      {#if formEditorCollapse.allExpanded}
                        <ChevronsDownUpIcon class="size-4" />
                      {:else}
                        <ChevronsUpDownIcon class="size-4" />
                      {/if}
                    </Button>
                  {/snippet}
                </Tooltip.Trigger>
                <Tooltip.Content
                  >{formEditorCollapse.allExpanded ? 'Collapse all' : 'Expand all'}</Tooltip.Content
                >
              </Tooltip.Root>
            </div>
          {/if}
          {#if !fileState.selectedFileReadOnly && preferences.activeSection === 'cv'}
            <div transition:fade={{ duration: 200 }}>
              <ButtonGroup.Root>
                <Tooltip.Root>
                  <Tooltip.Trigger>
                    {#snippet child({ props })}
                      <Button
                        {...props}
                        variant="ghost"
                        size="icon"
                        class="size-8 border"
                        onmousedown={(e: MouseEvent) => e.preventDefault()}
                        onclick={() => formatText('**', '**')}
                        aria-label="Bold"
                        data-ph-capture-attribute-action="format-bold"
                        data-ph-capture-attribute-section="editor-toolbar"
                      >
                        <BoldIcon class="size-4" />
                      </Button>
                    {/snippet}
                  </Tooltip.Trigger>
                  <Tooltip.Content>Bold</Tooltip.Content>
                </Tooltip.Root>

                <Tooltip.Root>
                  <Tooltip.Trigger>
                    {#snippet child({ props })}
                      <Button
                        {...props}
                        variant="ghost"
                        size="icon"
                        class="size-8 border"
                        onmousedown={(e: MouseEvent) => e.preventDefault()}
                        onclick={() => formatText('*', '*')}
                        aria-label="Italic"
                        data-ph-capture-attribute-action="format-italic"
                        data-ph-capture-attribute-section="editor-toolbar"
                      >
                        <ItalicIcon class="size-4" />
                      </Button>
                    {/snippet}
                  </Tooltip.Trigger>
                  <Tooltip.Content>Italic</Tooltip.Content>
                </Tooltip.Root>
                <Tooltip.Root>
                  <Tooltip.Trigger>
                    {#snippet child({ props })}
                      <Button
                        {...props}
                        variant="ghost"
                        size="icon"
                        class="size-8 border"
                        onmousedown={(e: MouseEvent) => e.preventDefault()}
                        onclick={formatLink}
                        aria-label="Insert link"
                        data-ph-capture-attribute-action="format-link"
                        data-ph-capture-attribute-section="editor-toolbar"
                      >
                        <LinkIcon class="size-4" />
                      </Button>
                    {/snippet}
                  </Tooltip.Trigger>
                  <Tooltip.Content>Insert link</Tooltip.Content>
                </Tooltip.Root>
              </ButtonGroup.Root>
            </div>
          {/if}
          <div class="ml-auto flex items-center gap-2 max-md:ml-0">
            <Switch
              id="yaml-editor"
              checked={preferences.yamlEditor}
              onCheckedChange={(v) => {
                preferences.yamlEditor = v;
                capture(EVENTS.EDITOR_MODE_SWITCHED, { yaml: v, cv_id: fileState.selectedFileId });
              }}
              class="cursor-pointer"
              data-ph-capture-attribute-action="toggle-yaml-editor"
              data-ph-capture-attribute-section="editor-toolbar"
            />
            <Label for="yaml-editor" class="cursor-pointer text-xs">YAML</Label>
          </div>
        </div>
      </div>
      {#if showPdfControls}
        <div
          class="flex items-center gap-2 max-md:absolute max-md:left-1/2 max-md:-translate-x-1/2 {activeTab ===
          'edit'
            ? 'max-md:hidden'
            : ''}"
          transition:horizontalSlide={{ duration: 200 }}
        >
          <PdfControls onPopup={openPopup} />
        </div>
      {/if}
      <div class="ml-auto flex items-center gap-2 pr-4">
        <ModeToggle />
      </div>
    </header>
    <div class="shrink-0 px-4 pb-2 md:hidden {popupActive ? 'hidden' : ''}">
      <Tabs.Root bind:value={activeTab}>
        <Tabs.List class="w-full bg-background">
          <Tabs.Trigger value="edit" class="flex-1" data-ph-capture-attribute-action="mobile-tab-edit" data-ph-capture-attribute-section="editor-toolbar">Edit</Tabs.Trigger>
          <Tabs.Trigger value="preview" class="flex-1 bg-background" data-ph-capture-attribute-action="mobile-tab-preview" data-ph-capture-attribute-section="editor-toolbar">Preview</Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>
    </div>
    <div
      class="relative flex min-h-0 flex-1 flex-col pt-0"
      style:--mobile-bar-h={totalFiles > 1 ? '3rem' : '0px'}
    >
      <Resizable.PaneGroup
        bind:paneGroup
        direction="horizontal"
        class="min-h-0 flex-1 md:rounded-b-xl"
        onLayoutChange={(sizes) => {
          leftPanelSize = sizes[0];
        }}
      >
        <Resizable.Pane
          defaultSize={50}
          minSize={10}
          class="{transitioning
            ? 'transition-[flex-grow] duration-300 ease-out'
            : ''} {popupActive || activeTab === 'edit'
            ? 'max-md:flex-[1_1_100%]!'
            : 'max-md:hidden!'}"
        >
          <div class="relative h-full min-h-0 w-full">
            <div class="flex h-full min-h-0 w-full flex-col" class:invisible={fileState.loading}>
              <div class="shrink-0 border-b px-2 pt-1">
                <div class="flex items-center gap-2 overflow-x-auto">
                  <Tabs.Root bind:value={preferences.activeSection}>
                    <Tabs.List class="bg-transparent">
                      {#each SECTION_KEYS as key (key)}
                        <Tabs.Trigger value={key} data-testid="tab-{key}" data-ph-capture-attribute-action="switch-tab-{key}" data-ph-capture-attribute-section="editor-toolbar" class="relative">
                          {SECTION_LABELS[key]}
                          {#if viewer.errorsBySection[key].length > 0}
                            <span
                              class="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-destructive"
                            ></span>
                          {/if}
                        </Tabs.Trigger>
                      {/each}
                    </Tabs.List>
                  </Tabs.Root>
                  {#if preferences.activeSection === 'design' || preferences.activeSection === 'locale'}
                    <VariantSelector activeSection={preferences.activeSection} />
                  {/if}
                </div>
              </div>
              <div class="relative flex min-h-0 flex-1 flex-col">
                <div class="min-h-0 flex-1">
                  {#if preferences.yamlEditor}
                    <MonacoEditor
                      sections={fileState.sections}
                      selectedFileId={fileState.selectedFileId}
                      syncKey={`${fileState.selectedFile?.selectedTheme}-${fileState.selectedFile?.selectedLocale}`}
                      activeSection={preferences.activeSection}
                      readOnly={fileState.selectedFileReadOnly ?? false}
                      errorsBySection={viewer.errorsBySection}
                      onSectionChange={(section, content) => {
                        if (!fileState.selectedFile) {
                          fileState.createFile();
                          fileState.setSectionContent(section, content);
                          return;
                        }
                        fileState.setSectionContent(section, content);
                        const fid = fileState.selectedFileId;
                        if (fid && !editedFileIds.has(fid)) {
                          editedFileIds.add(fid);
                          capture(EVENTS.CV_CONTENT_EDITED, { section, editor: 'yaml', cv_id: fid, edit_count: fileState.selectedFile?.editCount });
                        }
                      }}
                      onReviewUndoAll={undoAll}
                      onReviewKeepAll={keepAll}
                    />
                  {:else}
                    <FormEditor
                      activeSection={preferences.activeSection}
                      errors={viewer.errorsBySection[preferences.activeSection]}
                      onReviewUndoAll={undoAll}
                      onReviewKeepAll={keepAll}
                      onReviewUndo={undoLastReviewAction}
                    />
                  {/if}
                </div>
                <InlineChatOverlay />
              </div>
            </div>
            {#if fileState.loading}
              <div class="absolute inset-0 grid place-items-center">
                <LoadingSpinner />
              </div>
            {/if}
          </div>
        </Resizable.Pane>

        <Resizable.Handle
          ondblclick={resetLayout}
          withHandle={true}
          class="w-1 cursor-col-resize max-md:hidden! {popupActive
            ? 'pointer-events-none opacity-0'
            : ''}"
        />

        <Resizable.Pane
          defaultSize={50}
          minSize={0}
          collapsible={true}
          class="{transitioning
            ? 'transition-[flex-grow] duration-300 ease-out'
            : ''} {popupActive || activeTab === 'edit'
            ? 'max-md:hidden!'
            : 'max-md:flex-[1_1_100%]!'}"
        >
          <div class="h-full min-h-0 w-full bg-sidebar dark:bg-zinc-900">
            <TypstViewer sections={fileState.sections} />
          </div>
        </Resizable.Pane>
      </Resizable.PaneGroup>
      {#if totalFiles > 1}
        <div
          class="absolute right-0 bottom-0 left-0 flex items-center justify-between border-t bg-background/70 px-4 py-2 backdrop-blur-sm md:hidden {activeTab ===
          'edit'
            ? 'hidden'
            : ''}"
        >
          <Button
            variant="ghost"
            size="icon"
            onclick={selectPrev}
            disabled={currentFileIndex <= 0}
            aria-label="Previous CV"
            data-ph-capture-attribute-action="prev-cv"
            data-ph-capture-attribute-section="editor-toolbar"
          >
            <ChevronLeftIcon class="size-5" />
          </Button>
          <span class="text-sm text-muted-foreground">
            {fileState.selectedFile?.name ?? ''}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onclick={selectNext}
            disabled={currentFileIndex >= totalFiles - 1}
            aria-label="Next CV"
            data-ph-capture-attribute-action="next-cv"
            data-ph-capture-attribute-section="editor-toolbar"
          >
            <ChevronRightIcon class="size-5" />
          </Button>
        </div>
      {/if}
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>
