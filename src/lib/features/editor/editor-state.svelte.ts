import type * as Monaco from 'monaco-editor';
import type { JSONSchema, MonacoYaml } from 'monaco-yaml';
import { PUBLIC_RENDERCV_VERSION } from '$env/static/public';
import { defineThemes, applyTheme } from './theme';
import { isUrl } from '$lib/features/form_editor/textarea-format.js';
import { SECTION_KEYS, type SectionKey, type CvFileSections } from '$lib/features/cv-files/types';
import { preferences } from '$lib/features/preferences/pref-state.svelte';
import type { LineChange } from './review-state.svelte';

// Suppress Monaco Editor's harmless "Canceled" promise rejections.
// Monaco's internal Delayer class rejects pending debounced operations
// (validation, completion, hover) with CancellationError when disposed.
// Since those promises are internal to Monaco, we cannot catch them.
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    if (event.reason?.name === 'Canceled') {
      event.preventDefault();
    }
  });
}

export interface MarkerError {
  message: string;
  yaml_location: [[number, number], [number, number]] | null;
}

const RENDERCV_SCHEMA_URI = `https://raw.githubusercontent.com/rendercv/rendercv/refs/tags/v${PUBLIC_RENDERCV_VERSION}/schema.json`;

function sectionUri(section: SectionKey): string {
  return `file:///rendercv/${section}.yaml`;
}

function cleanDescription(value: string): string {
  const withoutTableRows = value
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      if (/^Source:\s*/i.test(trimmed)) return false;
      const pipeCount = (trimmed.match(/\|/g) || []).length;
      if (pipeCount >= 2) return false;
      if (/^\|/.test(trimmed)) return false;
      if (/^\|?[\s:-]+\|[\s|:-]*\|?$/.test(trimmed)) return false;
      return true;
    })
    .join(' ');

  return withoutTableRows.replace(/\s+/g, ' ').trim();
}

function prepareSchema(schema: JSONSchema): JSONSchema {
  const cloned = structuredClone(schema) as JSONSchema;
  const stack: unknown[] = [cloned];

  while (stack.length > 0) {
    const node = stack.pop();
    if (!node || typeof node !== 'object') continue;

    const record = node as Record<string, unknown>;
    delete record.markdownDescription;
    delete record.markdownEnumDescriptions;
    delete record.enumDescriptions;

    if (typeof record.description === 'string') {
      const description = cleanDescription(record.description);
      if (description && !description.includes('|')) {
        record.description = description;
      } else {
        delete record.description;
      }
    }
    if (typeof record.title === 'string') {
      const title = record.title
        .replace(/\s*\|\|\s*/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (!title.includes('|')) {
        record.title = title;
      } else {
        delete record.title;
      }
    }

    for (const value of Object.values(record)) {
      if (value && typeof value === 'object') {
        stack.push(value);
      }
    }
  }

  return cloned;
}

function sanitizeHoverMarkdown(value: string): string {
  const lines = value.split('\n');
  const out: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (/^(\|\|\s*)+$/.test(line)) continue;
    if (/^(\|\s*)+$/.test(line)) continue;

    if (!rawLine.includes('||')) {
      out.push(rawLine);
      continue;
    }

    const parts = rawLine
      .split('||')
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length === 0) continue;

    const unique: string[] = [];
    for (const part of parts) {
      if (!unique.includes(part)) unique.push(part);
    }
    const indent = rawLine.match(/^\s*/)?.[0] ?? '';
    out.push(indent + unique.join(' | '));
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

// Use Object.defineProperty to avoid "Attempted to assign to readonly property"
// in Safari, which strictly enforces that inherited non-writable properties
// (from ES module namespaces) cannot be set via `=` on child objects.
function withSanitizedYamlHover(monaco: typeof Monaco): typeof Monaco {
  const wrapped = Object.create(monaco) as typeof Monaco;
  const wrappedLanguages = Object.create(monaco.languages) as typeof monaco.languages;

  Object.defineProperty(wrappedLanguages, 'registerHoverProvider', {
    value: ((languageSelector, provider) => {
      if (languageSelector !== 'yaml') {
        return monaco.languages.registerHoverProvider(languageSelector, provider);
      }

      const wrappedProvider: Monaco.languages.HoverProvider = {
        ...provider,
        provideHover: async (model, position, token) => {
          const hover = await provider.provideHover?.(model, position, token);
          if (!hover) return hover;
          return {
            ...hover,
            contents: hover.contents.map((c) => ({
              ...c,
              value: sanitizeHoverMarkdown(c.value)
            }))
          };
        }
      };
      return monaco.languages.registerHoverProvider(languageSelector, wrappedProvider);
    }) as typeof monaco.languages.registerHoverProvider,
    writable: true,
    configurable: true
  });

  Object.defineProperty(wrapped, 'languages', {
    value: wrappedLanguages,
    writable: true,
    configurable: true
  });

  return wrapped;
}

export class EditorState {
  isLoading = $state(true);
  canUndo = $state(false);
  canRedo = $state(false);

  private monaco: typeof Monaco | null = null;
  private yaml: MonacoYaml | null = null;
  editor: Monaco.editor.IStandaloneCodeEditor | null = null;
  private disposables: Monaco.IDisposable[] = [];
  private themeObserver: MutationObserver | null = null;

  private models = new Map<SectionKey, Monaco.editor.ITextModel>();
  private viewStates = new Map<SectionKey, Monaco.editor.ICodeEditorViewState | null>();
  private syncing = false;
  private disposed = false;
  private currentSection: SectionKey = 'cv';

  private pasteNode: HTMLElement | null = null;
  private pasteHandler: ((e: ClipboardEvent) => void) | null = null;

  // Native inline diff editor for AI review
  private diffEditor: Monaco.editor.IDiffEditor | null = null;
  private diffOriginalModel: Monaco.editor.ITextModel | null = null;
  private diffModifiedModel: Monaco.editor.ITextModel | null = null;
  private diffActionZoneIds: string[] = [];
  private diffUpdateListener: Monaco.IDisposable | null = null;
  private diffUndoHandler: ((e: KeyboardEvent) => void) | null = null;
  isReviewMode = $state(false);
  reviewChangeCount = $state(0);
  onReviewUndo: (() => void) | null = null;

  async initialize(
    container: HTMLDivElement,
    onSectionChange: (section: SectionKey, content: string) => void
  ): Promise<void> {
    this.disposed = false;
    this.currentSection = 'cv';
    this.viewStates.clear();

    const [m, monacoYaml, , , EditorWorker, YamlWorker, { schema }] = await Promise.all([
      import('monaco-editor'),
      import('monaco-yaml'),
      import('monaco-editor/esm/vs/editor/editor.all.js'),
      import('monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution.js'),
      import('monaco-editor/esm/vs/editor/editor.worker?worker'),
      import('./yaml.worker.ts?worker'),
      import('virtual:rendercv-schema'),
      import('monaco-editor/min/vs/editor/editor.main.css')
    ]);

    if (this.disposed) return;

    const { configureMonacoYaml } = monacoYaml;
    const monacoSchema = prepareSchema(schema as JSONSchema);
    const monacoForYaml = withSanitizedYamlHover(m);

    this.monaco = m;

    (self as unknown as { MonacoEnvironment?: unknown }).MonacoEnvironment = {
      getWorker(_moduleId: string, label: string) {
        if (label === 'yaml') {
          return new YamlWorker.default();
        }
        return new EditorWorker.default();
      }
    };
    this.yaml?.dispose();
    this.yaml = configureMonacoYaml(monacoForYaml, {
      enableSchemaRequest: false,
      validate: false,
      completion: true,
      hover: true,
      schemas: [
        {
          uri: RENDERCV_SCHEMA_URI,
          fileMatch: ['file:///rendercv/*.yaml', ...SECTION_KEYS.map((key) => sectionUri(key))],
          schema: monacoSchema
        }
      ]
    });

    for (const key of SECTION_KEYS) {
      const uri = m.Uri.parse(sectionUri(key));
      m.editor.getModel(uri)?.dispose();
      const model = m.editor.createModel('', 'yaml', uri);
      this.models.set(key, model);

      const section = key;
      this.disposables.push(
        model.onDidChangeContent(() => {
          if (this.syncing) return;
          onSectionChange(section, model.getValue());
          this.updateUndoRedo();
        })
      );
    }

    this.editor = m.editor.create(container, {
      model: this.models.get('cv')!,
      automaticLayout: true,
      lineNumbersMinChars: 4,
      glyphMargin: false,
      lineDecorationsWidth: 6,
      padding: { top: 8, bottom: 8 },
      minimap: { enabled: false },
      scrollBeyondLastLine: true,
      tabSize: 2,
      insertSpaces: true,
      wordWrap: preferences.wordWrap ? 'on' : 'off'
    });

    this.setupKeybindings();
    this.setupPasteLink();
    this.setupTheme();

    this.isLoading = false;
  }

  switchSection(section: SectionKey): void {
    if (this.isLoading || !this.editor || section === this.currentSection) return;

    this.viewStates.set(this.currentSection, this.editor.saveViewState());
    this.currentSection = section;
    this.editor.setModel(this.models.get(section)!);

    const viewState = this.viewStates.get(section);
    if (viewState) this.editor.restoreViewState(viewState);

    this.editor.focus();
    this.updateUndoRedo();
  }

  syncAllSections(sections: CvFileSections): void {
    if (this.isLoading) return;
    this.syncing = true;
    for (const key of SECTION_KEYS) {
      const model = this.models.get(key);
      if (!model) continue;
      const value = sections[key];
      if (model.getValue() !== value) {
        model.setValue(value);
      }
    }
    this.syncing = false;
  }

  /** Apply content to a section as an undoable edit (preserves undo stack). */
  applyContentAsEdit(section: SectionKey, newContent: string): void {
    const model = this.models.get(section);
    if (!model || model.getValue() === newContent) return;
    const fullRange = model.getFullModelRange();
    this.syncing = true;
    model.pushEditOperations([], [{ range: fullRange, text: newContent }], () => null);
    this.syncing = false;
    this.updateUndoRedo();
  }

  syncSectionMarkers(errorsBySection: Record<SectionKey, MarkerError[]>): void {
    if (this.isLoading || !this.monaco) return;
    for (const key of SECTION_KEYS) {
      const model = this.models.get(key)!;

      const data: Monaco.editor.IMarkerData[] = (errorsBySection[key] || [])
        .filter((e) => e.yaml_location !== null)
        .map((e) => ({
          severity: this.monaco!.MarkerSeverity.Error,
          message: e.message,
          startLineNumber: e.yaml_location![0][0],
          startColumn: e.yaml_location![0][1],
          endLineNumber: e.yaml_location![1][0],
          endColumn: e.yaml_location![1][1]
        }));

      this.monaco.editor.setModelMarkers(model, 'rendercv', data);
    }
  }

  syncReadOnly(readOnly: boolean): void {
    if (this.isLoading) return;
    this.editor?.updateOptions({
      readOnly,
      readOnlyMessage: { value: 'Unlock to edit', isTrusted: false }
    });
  }

  insertText(prefix: string, suffix: string): void {
    const selection = this.editor?.getSelection();
    const model = this.editor?.getModel();
    if (!this.editor || !selection || !model) return;

    const text = model.getValueInRange(selection) || '';

    // Case 1: Selected text is already wrapped → unwrap
    if (
      text.length >= prefix.length + suffix.length &&
      text.startsWith(prefix) &&
      text.endsWith(suffix)
    ) {
      const unwrapped = text.slice(prefix.length, -suffix.length);
      this.editor.executeEdits('toolbar', [
        { range: selection, text: unwrapped, forceMoveMarkers: true }
      ]);
      this.editor.setSelection({
        startLineNumber: selection.startLineNumber,
        startColumn: selection.startColumn,
        endLineNumber: selection.endLineNumber,
        endColumn: selection.startColumn + unwrapped.length
      });
      this.editor.focus();
      return;
    }

    // Case 2: Selection is surrounded by wrapping characters → remove them
    const startPos = selection.getStartPosition();
    const endPos = selection.getEndPosition();

    const preRange = {
      startLineNumber: startPos.lineNumber,
      startColumn: Math.max(1, startPos.column - prefix.length),
      endLineNumber: startPos.lineNumber,
      endColumn: startPos.column
    };
    const postRange = {
      startLineNumber: endPos.lineNumber,
      startColumn: endPos.column,
      endLineNumber: endPos.lineNumber,
      endColumn: Math.min(model.getLineMaxColumn(endPos.lineNumber), endPos.column + suffix.length)
    };

    const preText = model.getValueInRange(preRange);
    const postText = model.getValueInRange(postRange);

    if (preText === prefix && postText === suffix) {
      const fullRange = {
        startLineNumber: preRange.startLineNumber,
        startColumn: preRange.startColumn,
        endLineNumber: postRange.endLineNumber,
        endColumn: postRange.endColumn
      };
      this.editor.executeEdits('toolbar', [{ range: fullRange, text, forceMoveMarkers: true }]);
      this.editor.setSelection({
        startLineNumber: selection.startLineNumber,
        startColumn: selection.startColumn - prefix.length,
        endLineNumber: selection.endLineNumber,
        endColumn: selection.endColumn - prefix.length
      });
      this.editor.focus();
      return;
    }

    // Case 3: Wrap the text
    const newText = prefix + text + suffix;
    this.editor.executeEdits('toolbar', [
      { range: selection, text: newText, forceMoveMarkers: true }
    ]);

    if (text.length > 0) {
      this.editor.setSelection({
        startLineNumber: selection.startLineNumber,
        startColumn: selection.startColumn + prefix.length,
        endLineNumber: selection.endLineNumber,
        endColumn:
          selection.endColumn +
          (selection.startLineNumber === selection.endLineNumber ? prefix.length : 0)
      });
    } else {
      const p = this.editor.getPosition();
      if (p) {
        this.editor.setPosition({
          lineNumber: p.lineNumber,
          column: p.column - suffix.length
        });
      }
    }
    this.editor.focus();
  }

  /** Show native inline diff editor. Hides the main editor. */
  showReview(
    originalContent: string,
    modifiedContent: string,
    onAction: (change: LineChange, action: 'undo' | 'keep') => void
  ): void {
    if (!this.editor || !this.monaco) return;
    const m = this.monaco;
    const container = this.editor.getContainerDomNode().parentElement;
    if (!container) return;

    // Hide main editor
    this.editor.getContainerDomNode().style.display = 'none';

    // Create diff models
    this.diffOriginalModel?.dispose();
    this.diffModifiedModel?.dispose();
    this.diffOriginalModel = m.editor.createModel(originalContent, 'yaml');
    this.diffModifiedModel = m.editor.createModel(modifiedContent, 'yaml');

    // Create inline diff editor
    this.diffEditor?.dispose();
    this.diffEditor = m.editor.createDiffEditor(container, {
      renderSideBySide: false,
      enableSplitViewResizing: false,
      readOnly: true,
      originalEditable: false,
      automaticLayout: true,
      minimap: { enabled: false },
      glyphMargin: false,
      lineDecorationsWidth: 6,
      renderIndicators: true,
      padding: { top: 8, bottom: 8 },
      scrollBeyondLastLine: true
    });

    this.diffEditor.setModel({
      original: this.diffOriginalModel,
      modified: this.diffModifiedModel
    });

    // Intercept Cmd+Z in diff editor for review-level undo
    const diffContainer = this.diffEditor.getContainerDomNode();
    this.diffUndoHandler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        this.onReviewUndo?.();
      }
    };
    diffContainer.addEventListener('keydown', this.diffUndoHandler, true);

    // Listen for diff computation to place action buttons
    this.diffUpdateListener?.dispose();
    this.diffUpdateListener = this.diffEditor.onDidUpdateDiff(() => {
      this.placeActionButtons(onAction);
    });

    this.isReviewMode = true;
  }

  private placeActionButtons(
    onAction: (change: LineChange, action: 'undo' | 'keep') => void
  ): void {
    if (!this.diffEditor) return;

    const changes = this.diffEditor.getLineChanges();
    this.reviewChangeCount = changes?.length ?? 0;

    if (!changes || changes.length === 0) {
      return;
    }

    const modEditor = this.diffEditor.getModifiedEditor();

    // Remove old action zones immediately
    if (this.diffActionZoneIds.length > 0) {
      const oldIds = this.diffActionZoneIds;
      modEditor.changeViewZones((accessor) => {
        for (const id of oldIds) accessor.removeZone(id);
      });
      this.diffActionZoneIds = [];
    }

    // Add action button zones below each change.
    // ordinal: 10001 ensures our zones sort AFTER Monaco's internal diff zones
    // (which get ordinal 10000 via _getZoneOrdinal fallback).
    modEditor.changeViewZones((accessor) => {
      for (const change of changes) {
        const actions = document.createElement('div');
        actions.className = 'review-zone-actions';
        actions.style.cssText = 'pointer-events: auto; position: relative; z-index: 5;';

        const svgAttrs =
          'xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

        const undoBtn = document.createElement('button');
        undoBtn.className = 'review-zone-btn review-zone-btn-undo';
        undoBtn.innerHTML = `<svg ${svgAttrs}><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"/></svg> Undo`;
        undoBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          onAction(change as LineChange, 'undo');
        });

        const keepBtn = document.createElement('button');
        keepBtn.className = 'review-zone-btn review-zone-btn-keep';
        keepBtn.innerHTML = `<svg ${svgAttrs}><path d="M20 6 9 17l-5-5"/></svg> Keep`;
        keepBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          onAction(change as LineChange, 'keep');
        });

        actions.appendChild(undoBtn);
        actions.appendChild(keepBtn);

        // Place after the last modified line of this change
        const afterLine =
          change.modifiedEndLineNumber === 0
            ? change.modifiedStartLineNumber
            : change.modifiedEndLineNumber;

        const zoneId = accessor.addZone({
          afterLineNumber: afterLine,
          heightInPx: 28,
          domNode: actions,
          suppressMouseDown: false,
          ordinal: 10001
        });

        this.diffActionZoneIds.push(zoneId);
      }
    });
  }

  /** Update diff models after an undo/keep action. */
  updateReviewContent(
    originalContent: string,
    modifiedContent: string,
    onAction: (change: LineChange, action: 'undo' | 'keep') => void
  ): void {
    if (!this.diffOriginalModel || !this.diffModifiedModel) return;

    // Save scroll position — setValue resets cursor to 1:1 which may trigger scroll
    const scrollTop = this.diffEditor?.getModifiedEditor().getScrollTop() ?? 0;

    this.diffOriginalModel.setValue(originalContent);
    this.diffModifiedModel.setValue(modifiedContent);

    // Restore scroll after model update
    requestAnimationFrame(() => {
      this.diffEditor?.getModifiedEditor().setScrollTop(scrollTop);
    });

    // onDidUpdateDiff will fire and call placeActionButtons, but we need to
    // rebind onAction since the changes array shifts after each action
    this.diffUpdateListener?.dispose();
    this.diffUpdateListener =
      this.diffEditor?.onDidUpdateDiff(() => {
        this.placeActionButtons(onAction);
      }) ?? null;
  }

  /** Idempotent: create diff editor if needed, otherwise update content. */
  ensureReview(
    originalContent: string,
    modifiedContent: string,
    onAction: (change: LineChange, action: 'undo' | 'keep') => void
  ): void {
    // Check diffEditor (non-reactive) instead of isReviewMode ($state)
    // to avoid creating a reactive dependency when called from $effect.
    if (this.diffEditor) {
      this.updateReviewContent(originalContent, modifiedContent, onAction);
    } else {
      this.showReview(originalContent, modifiedContent, onAction);
    }
  }

  /** Dispose diff editor and show main editor again. */
  disposeReview(): void {
    this.diffUpdateListener?.dispose();
    this.diffUpdateListener = null;

    if (this.diffEditor) {
      if (this.diffUndoHandler) {
        this.diffEditor
          .getContainerDomNode()
          .removeEventListener('keydown', this.diffUndoHandler, true);
        this.diffUndoHandler = null;
      }
      // Dispose the diff editor first — this also cleans up view zones internally.
      // Do NOT call changeViewZones before dispose, as it schedules async rendering
      // that races with disposal and causes "Cannot read 'length'" crashes.
      this.diffActionZoneIds = [];
      this.diffEditor.dispose();
      this.diffEditor = null;
    }

    this.diffOriginalModel?.dispose();
    this.diffOriginalModel = null;
    this.diffModifiedModel?.dispose();
    this.diffModifiedModel = null;

    // Show main editor again. Defer layout to next microtask so Monaco
    // finishes any pending cleanup from the diff editor disposal.
    if (this.editor) {
      this.editor.getContainerDomNode().style.display = '';
      queueMicrotask(() => this.editor?.layout());
    }

    this.isReviewMode = false;
    this.onReviewUndo = null;
    this.reviewChangeCount = 0;
  }

  undo(): void {
    this.editor?.trigger('toolbar', 'undo', null);
    this.updateUndoRedo();
  }

  redo(): void {
    this.editor?.trigger('toolbar', 'redo', null);
    this.updateUndoRedo();
  }

  private updateUndoRedo(): void {
    const model = this.editor?.getModel();
    if (!model) {
      this.canUndo = false;
      this.canRedo = false;
      return;
    }
    this.canUndo = (model as any).canUndo();
    this.canRedo = (model as any).canRedo();
  }

  dispose(): void {
    this.disposed = true;
    this.isLoading = true;
    this.canUndo = false;
    this.canRedo = false;
    this.disposeReview();
    this.themeObserver?.disconnect();
    if (this.pasteNode && this.pasteHandler) {
      this.pasteNode.removeEventListener('paste', this.pasteHandler as EventListener, true);
      this.pasteNode = null;
      this.pasteHandler = null;
    }
    this.yaml?.dispose();
    this.yaml = null;
    for (const d of this.disposables) d.dispose();
    this.editor?.dispose();
    for (const model of this.models.values()) model.dispose();
    this.models.clear();
    this.viewStates.clear();
  }

  private setupPasteLink(): void {
    if (!this.editor) return;
    this.pasteNode = this.editor.getContainerDomNode();
    this.pasteHandler = (e: ClipboardEvent) => {
      const url = e.clipboardData?.getData('text/plain')?.trim();
      if (!url || !isUrl(url)) return;

      const selection = this.editor!.getSelection();
      const model = this.editor!.getModel();
      if (!selection || !model || selection.isEmpty()) return;

      e.preventDefault();
      e.stopPropagation();

      const selected = model.getValueInRange(selection);
      const link = `[${selected}](${url})`;
      this.editor!.executeEdits('paste-link', [
        { range: selection, text: link, forceMoveMarkers: true }
      ]);
    };
    this.pasteNode.addEventListener('paste', this.pasteHandler as EventListener, { capture: true });
  }

  private setupKeybindings(): void {
    if (!this.editor || !this.monaco) return;
    const m = this.monaco;

    this.editor.addAction({
      id: 'prevent-browser-save',
      label: 'Save (no-op)',
      keybindings: [m.KeyMod.CtrlCmd | m.KeyCode.KeyS],
      run: () => {}
    });
  }

  private setupTheme(): void {
    defineThemes(this.monaco!);
    applyTheme(this.monaco!);

    this.themeObserver = new MutationObserver(() => applyTheme(this.monaco!));
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
  }
}

export const editor = new EditorState();
