import { FONT_VARIANTS, DEFAULT_FONT_FAMILIES, getFontUrls, getDefaultFontUrls } from './fonts';
import { type CvFileSections, type SectionKey } from '$lib/features/cv-files/types';
import { MAX_ZOOM, MIN_ZOOM, ZOOM_STEP } from './zoom-config';
import * as Sentry from '@sentry/sveltekit';
import { createLogger } from '$lib/logger';
import { capture } from '$lib/analytics/posthog-client';
import { EVENTS } from '$lib/analytics/events';

const log = createLogger('viewer');

export interface RenderError {
  message: string;
  schema_location: string[] | null;
  input: string;
  yaml_source: SectionKey;
  yaml_location: [[number, number], [number, number]] | null;
}

const YAML_SOURCE_TO_SECTION: Record<string, SectionKey> = {
  main_yaml_file: 'cv',
  design_yaml_file: 'design',
  locale_yaml_file: 'locale',
  settings_yaml_file: 'settings'
};

export interface RenderResult {
  content: string | null;
  errors: RenderError[] | null;
}

interface WorkerErrorPayload {
  message: string;
  name: string;
  stack?: string;
}

interface WorkerRequest<T = unknown> {
  resolve: (val: T) => void;
  reject: (err: Error) => void;
}

/** Reconstruct an Error from the structured worker error payload. */
function errorFromWorker(payload: WorkerErrorPayload | string): Error {
  if (typeof payload === 'string') return new Error(payload);
  const err = new Error(payload.message);
  err.name = payload.name;
  if (payload.stack) err.stack = payload.stack;
  return err;
}

class ViewerState {
  // Public reactive state
  zoomFactor = $state(1);
  gestureZoomFactor = $state<number | null>(null);
  renderErrors = $state<RenderError[]>([]);
  isInitializing = $state(true);
  initError = $state<string | undefined>();
  svgPages = $state<string[]>([]);

  #initialized = false;

  // Derived state
  readonly effectiveZoomFactor = $derived(this.gestureZoomFactor ?? this.zoomFactor);
  readonly zoomPercent = $derived(Math.round(this.effectiveZoomFactor * 100));
  readonly errorsBySection = $derived(this.#groupErrorsBySection(this.renderErrors));

  // Private state — Pyodide worker (YAML → Typst)
  #pyodideWorker: Worker | null = null;
  #pyodidePending = new Map<number, WorkerRequest<RenderResult>>();
  #pyodideNextId = 0;

  // Private state — Typst worker (Typst → SVG/PDF)
  #typstWorker: Worker | null = null;
  #typstPending = new Map<number, WorkerRequest>();
  #typstNextId = 0;

  #currentRenderRequest = 0;
  #currentPageUrls: string[] = [];
  #loadedFonts: string[] = [];
  #loadedFontFamilies = new Set<string>();

  // --- Zoom ---

  setZoom(value: number) {
    this.zoomFactor = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
    this.gestureZoomFactor = null;
  }

  zoomIn() {
    this.setZoom(this.effectiveZoomFactor + ZOOM_STEP);
  }

  zoomOut() {
    this.setZoom(this.effectiveZoomFactor - ZOOM_STEP);
  }

  zoomReset() {
    this.setZoom(1);
  }

  beginGestureZoom() {
    if (this.gestureZoomFactor !== null) return;
    this.gestureZoomFactor = this.zoomFactor;
  }

  setGestureZoom(value: number) {
    this.beginGestureZoom();
    this.gestureZoomFactor = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
  }

  commitGestureZoom() {
    if (this.gestureZoomFactor === null) return;
    this.zoomFactor = this.gestureZoomFactor;
    this.gestureZoomFactor = null;
  }

  cancelGestureZoom() {
    this.gestureZoomFactor = null;
  }

  // --- Lifecycle ---

  async init() {
    if (this.#initialized) return;
    this.#initialized = true;
    this.#initFontCache();

    try {
      await Sentry.startSpan({ name: 'viewer.init', op: 'ui.render' }, async () => {
        await Promise.all([
          Sentry.startSpan(
            { name: 'viewer.init.typst', op: 'ui.render' },
            () => this.#initTypstWorker()
          ),
          Sentry.startSpan(
            { name: 'viewer.init.pyodide', op: 'ui.render' },
            () => this.#initPyodideWorker()
          )
        ]);
      });
      this.isInitializing = false;
    } catch (e) {
      this.initError = e instanceof Error ? e.message : String(e);
      this.isInitializing = false;
      log.error('Init failed', e);
    }
  }

  destroy() {
    for (const url of this.#currentPageUrls) {
      URL.revokeObjectURL(url);
    }
    this.#currentPageUrls = [];
    this.#pyodideWorker?.terminate();
    this.#pyodideWorker = null;
    this.#typstWorker?.terminate();
    this.#typstWorker = null;
  }

  // --- Rendering ---

  async renderYaml(sections: CvFileSections) {
    if (!this.#pyodideWorker || !this.#typstWorker) return;
    if (!sections.cv.trim()) {
      this.#setSvgPages([]);
      this.renderErrors = [];
      return;
    }

    const requestId = ++this.#currentRenderRequest;

    try {
      await Sentry.startSpan({ name: 'viewer.render', op: 'ui.render' }, async () => {
        const result = await Sentry.startSpan(
          { name: 'viewer.render.pyodide', op: 'ui.render' },
          () => this.#postMessageToPyodide('RENDER', sections)
        );
        if (requestId !== this.#currentRenderRequest) return;

        if (result.errors) {
          this.renderErrors = result.errors.map((error) => ({
            message: error.message || '',
            schema_location: error.schema_location || [],
            input: error.input || '',
            yaml_source: YAML_SOURCE_TO_SECTION[error.yaml_source],
            yaml_location: error.yaml_location || null
          }));
          capture(EVENTS.RENDER_FAILED, {
            error: result.errors[0]?.message,
            source: 'validation',
            errorCount: result.errors.length
          });
          return;
        }

        if (result.content) {
          const fontsChanged = this.#checkAndLoadFonts(result.content);
          if (fontsChanged) {
            await Sentry.startSpan(
              { name: 'viewer.render.fonts', op: 'ui.render' },
              () =>
                this.#postMessageToTypst('REINIT', {
                  fontUrls: this.#loadedFonts
                })
            );
          }
          if (requestId !== this.#currentRenderRequest) return;

          const svg = await Sentry.startSpan(
            { name: 'viewer.render.typst', op: 'ui.render' },
            () =>
              this.#postMessageToTypst('SVG', {
                content: result.content
              })
          );
          if (requestId !== this.#currentRenderRequest) return;
          this.renderErrors = [];
          this.#setSvgPages(svg as string[]);
        }
      });
    } catch (e) {
      if (requestId !== this.#currentRenderRequest) return;
      const message = e instanceof Error ? e.message : String(e);
      this.renderErrors = [
        {
          message,
          schema_location: [],
          input: '',
          yaml_source: 'cv',
          yaml_location: null
        }
      ];
      log.error('Render failed', e);
      capture(EVENTS.RENDER_FAILED, { error: message, source: 'renderYaml' });
    }
  }

  // --- Generation ---

  async renderToTypst(sections: CvFileSections): Promise<string | null> {
    if (!this.#pyodideWorker || !this.#typstWorker) return null;
    return Sentry.startSpan(
      { name: 'viewer.renderToTypst', op: 'ui.render' },
      async () => {
        const result = await this.#postMessageToPyodide('RENDER', { ...sections });
        if (!result.content) return null;
        const fontsChanged = this.#checkAndLoadFonts(result.content);
        if (fontsChanged) {
          await this.#postMessageToTypst('REINIT', { fontUrls: this.#loadedFonts });
        }
        return result.content;
      }
    );
  }

  async renderToPdf(sections: CvFileSections): Promise<Uint8Array | null> {
    return Sentry.startSpan(
      { name: 'viewer.renderToPdf', op: 'ui.render' },
      async () => {
        const typst = await Sentry.startSpan(
          { name: 'viewer.pdf.pyodide', op: 'ui.render' },
          () => this.renderToTypst(sections)
        );
        if (!this.#typstWorker || !typst) return null;
        return (await Sentry.startSpan(
          { name: 'viewer.pdf.typst', op: 'ui.render' },
          () => this.#postMessageToTypst('PDF', { content: typst })
        )) as Uint8Array;
      }
    );
  }

  // --- Private: Worker Communication ---

  #postMessageToPyodide(type: string, payload?: unknown): Promise<RenderResult> {
    if (!this.#pyodideWorker) return Promise.reject(new Error('Pyodide worker not initialized'));
    return new Promise((resolve, reject) => {
      const id = ++this.#pyodideNextId;
      this.#pyodidePending.set(id, { resolve, reject });
      this.#pyodideWorker!.postMessage({ id, type, payload });
    });
  }

  #postMessageToTypst(type: string, payload?: unknown): Promise<unknown> {
    if (!this.#typstWorker) return Promise.reject(new Error('Typst worker not initialized'));
    return new Promise((resolve, reject) => {
      const id = ++this.#typstNextId;
      this.#typstPending.set(id, { resolve, reject });
      this.#typstWorker!.postMessage({ id, type, payload });
    });
  }

  // --- Private: SVG Page Blob URLs ---

  #setSvgPages(pages: string[]) {
    for (const url of this.#currentPageUrls) {
      URL.revokeObjectURL(url);
    }
    this.#currentPageUrls = pages.map((svg) => {
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      return URL.createObjectURL(blob);
    });
    this.svgPages = [...this.#currentPageUrls];
  }

  // --- Private: Error Attribution ---

  #groupErrorsBySection(errors: RenderError[]): Record<SectionKey, RenderError[]> {
    const result: Record<SectionKey, RenderError[]> = {
      cv: [],
      design: [],
      locale: [],
      settings: []
    };
    for (const error of errors) {
      const key = error.yaml_source in result ? error.yaml_source : 'cv';
      result[key].push(error);
    }
    return result;
  }

  // --- Private: Initialization ---

  async #initTypstWorker() {
    const TypstWorker = await import('$lib/features/viewer/typst.worker.ts?worker');
    this.#typstWorker = new TypstWorker.default();

    this.#typstWorker.onmessage = (event) => {
      const { id, type, payload } = event.data;
      const request = this.#typstPending.get(id);
      if (request) {
        if (type === 'ERROR') {
          request.reject(errorFromWorker(payload));
        } else {
          request.resolve(payload);
        }
        this.#typstPending.delete(id);
      } else {
        log.warn('Orphaned Typst worker message', { id, type });
      }
    };

    await this.#postMessageToTypst('INIT', { fontUrls: this.#loadedFonts });
  }

  async #initPyodideWorker() {
    const PyodideWorker = await import('$lib/features/viewer/pyodide.worker.ts?worker');
    this.#pyodideWorker = new PyodideWorker.default();

    this.#pyodideWorker.onmessage = (event) => {
      const { id, type, payload } = event.data;
      const request = this.#pyodidePending.get(id);
      if (request) {
        if (type === 'ERROR') {
          request.reject(errorFromWorker(payload));
        } else {
          request.resolve(payload);
        }
        this.#pyodidePending.delete(id);
      } else {
        log.warn('Orphaned Pyodide worker message', { id, type });
      }
    };

    await this.#postMessageToPyodide('INIT');
  }

  // --- Private: Font Management ---

  #initFontCache() {
    try {
      const storedFonts = localStorage.getItem('loadedFonts');
      this.#loadedFonts = storedFonts ? JSON.parse(storedFonts) : getDefaultFontUrls();
      const storedFamilies = localStorage.getItem('loadedFontFamilies');
      this.#loadedFontFamilies = storedFamilies
        ? new Set(JSON.parse(storedFamilies))
        : new Set(DEFAULT_FONT_FAMILIES);
    } catch {
      this.#loadedFonts = getDefaultFontUrls();
      this.#loadedFontFamilies = new Set(DEFAULT_FONT_FAMILIES);
    }
  }

  #checkAndLoadFonts(typstContent: string): boolean {
    let fontsAdded = false;
    const requestedFonts = new Set(
      Array.from(typstContent.matchAll(/font-family-\w+:\s*"([^"]+)"/g), (m) => m[1])
    );

    for (const fontFamily of Object.keys(FONT_VARIANTS)) {
      if (!this.#loadedFontFamilies.has(fontFamily) && requestedFonts.has(fontFamily)) {
        for (const url of getFontUrls(fontFamily)) {
          if (!this.#loadedFonts.includes(url)) {
            this.#loadedFonts.push(url);
            fontsAdded = true;
          }
        }
        this.#loadedFontFamilies.add(fontFamily);
      }
    }

    if (fontsAdded) {
      localStorage.setItem('loadedFonts', JSON.stringify(this.#loadedFonts));
      localStorage.setItem(
        'loadedFontFamilies',
        JSON.stringify(Array.from(this.#loadedFontFamilies))
      );
    }

    return fontsAdded;
  }
}

export const viewer = new ViewerState();
