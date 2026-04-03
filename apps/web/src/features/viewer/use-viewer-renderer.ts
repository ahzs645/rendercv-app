import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CvFileSections, SectionKey } from '@rendercv/contracts';
import { MAX_ZOOM, MIN_ZOOM, ZOOM_STEP } from './zoom-config';
import { DEFAULT_FONT_FAMILIES, FONT_VARIANTS, getDefaultFontUrls, getFontUrls } from './fonts';

export interface RenderError {
  message: string;
  schema_location: string[] | null;
  input: string;
  yaml_source: SectionKey;
  yaml_location: [[number, number], [number, number]] | null;
}

export interface ViewerValidationResult {
  content: string | null;
  errors: Array<{
    message: string;
    schema_location: string[] | null;
    input: string;
    yaml_source: string;
    yaml_location: [[number, number], [number, number]] | null;
  }> | null;
  normalizedCv?: string | null;
  effectiveDesign?: string | null;
  usedFallbackTheme?: boolean;
}

interface WorkerErrorPayload {
  message: string;
  name: string;
  stack?: string;
}

interface ImportedThemePayload {
  themeName: string;
}

type PendingRequest<T = unknown> = {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
};

type ValidationSource = 'cache' | 'inflight' | 'worker';

const MAX_VALIDATION_CACHE_ENTRIES = 24;

const YAML_SOURCE_TO_SECTION: Record<string, SectionKey> = {
  main_yaml_file: 'cv',
  design_yaml_file: 'design',
  locale_yaml_file: 'locale',
  settings_yaml_file: 'settings'
};

function logViewerDebug(label: string, details: Record<string, unknown>) {
  if (!import.meta.env.DEV) {
    return;
  }

  console.groupCollapsed(`[RenderCV] ${label}`);
  for (const [key, value] of Object.entries(details)) {
    if (typeof value === 'string') {
      console.log(key, value);
      continue;
    }

    try {
      console.log(key, JSON.stringify(value, null, 2));
    } catch {
      console.log(key, value);
    }
  }
  console.groupEnd();
}

function errorFromWorker(payload: WorkerErrorPayload | string) {
  if (typeof payload === 'string') return new Error(payload);
  const error = new Error(payload.message);
  error.name = payload.name;
  if (payload.stack) {
    error.stack = payload.stack;
  }
  return error;
}

function mergeStoredFontFamilies(storedFamilies: string[] | null | undefined) {
  return new Set([...(storedFamilies ?? []), ...DEFAULT_FONT_FAMILIES]);
}

function buildFontUrls(fontFamilies: Iterable<string>, baseUrl: string) {
  return Array.from(
    new Set(Array.from(fontFamilies).flatMap((fontFamily) => getFontUrls(fontFamily, baseUrl)))
  );
}

function buildValidationCacheKey(renderSections: CvFileSections, renderVersion: number) {
  return JSON.stringify([
    renderVersion,
    renderSections.cv,
    renderSections.design,
    renderSections.locale,
    renderSections.settings
  ]);
}

function storeValidationResult(
  cache: Map<string, ViewerValidationResult>,
  key: string,
  result: ViewerValidationResult
) {
  if (cache.has(key)) {
    cache.delete(key);
  }

  cache.set(key, result);

  if (cache.size > MAX_VALIDATION_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) {
      cache.delete(oldestKey);
    }
  }
}

export function useViewerRenderer(sections?: CvFileSections) {
  const [zoomFactor, setZoomFactor] = useState(1);
  const [svgPages, setSvgPages] = useState<string[]>([]);
  const [renderErrors, setRenderErrors] = useState<RenderError[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | undefined>();
  const [renderVersion, setRenderVersion] = useState(0);
  const hasSections = sections !== undefined;
  const cvContent = sections?.cv ?? '';
  const designContent = sections?.design ?? '';
  const localeContent = sections?.locale ?? '';
  const settingsContent = sections?.settings ?? '';

  const pyodideWorkerRef = useRef<Worker | null>(null);
  const typstWorkerRef = useRef<Worker | null>(null);
  const pyodidePending = useRef(new Map<number, PendingRequest>());
  const typstPending = useRef(new Map<number, PendingRequest>());
  const nextPyodideId = useRef(0);
  const nextTypstId = useRef(0);
  const pageUrls = useRef<string[]>([]);
  const currentRenderRequest = useRef(0);
  const loadedFonts = useRef<string[]>([]);
  const loadedFontFamilies = useRef(new Set<string>());
  const validationCache = useRef(new Map<string, ViewerValidationResult>());
  const validationInFlight = useRef(new Map<string, Promise<ViewerValidationResult>>());
  const pendingPreviewSections = useRef<CvFileSections | null>(null);
  const previewRenderLoopActive = useRef(false);
  const lastTypstContent = useRef<string | null>(null);
  const lastTypstSvgPages = useRef<string[] | null>(null);

  const effectiveZoom = zoomFactor;
  const zoomPercent = Math.round(effectiveZoom * 100);

  const postMessageToPyodide = useCallback(<T = unknown,>(type: string, payload?: unknown) => {
    if (!pyodideWorkerRef.current) {
      return Promise.reject(new Error('Pyodide worker not initialized'));
    }

    return new Promise<T>((resolve, reject) => {
      const id = ++nextPyodideId.current;
      pyodidePending.current.set(id, { resolve: resolve as (value: unknown) => void, reject });
      pyodideWorkerRef.current?.postMessage({ id, type, payload });
    });
  }, []);

  const postMessageToTypst = useCallback((type: string, payload?: unknown) => {
    if (!typstWorkerRef.current) {
      return Promise.reject(new Error('Typst worker not initialized'));
    }

    return new Promise<unknown>((resolve, reject) => {
      const id = ++nextTypstId.current;
      typstPending.current.set(id, { resolve, reject });
      typstWorkerRef.current?.postMessage({ id, type, payload });
    });
  }, []);

  const loadValidationResult = useCallback(
    async (renderSections: CvFileSections) => {
      const key = buildValidationCacheKey(renderSections, renderVersion);
      const cached = validationCache.current.get(key);
      if (cached) {
        return { result: cached, source: 'cache' as const };
      }

      const existingRequest = validationInFlight.current.get(key);
      if (existingRequest) {
        return { result: await existingRequest, source: 'inflight' as const };
      }

      const request = postMessageToPyodide<ViewerValidationResult>('RENDER', renderSections)
        .then((result) => {
          storeValidationResult(validationCache.current, key, result);
          return result;
        })
        .finally(() => {
          validationInFlight.current.delete(key);
        });

      validationInFlight.current.set(key, request);
      return { result: await request, source: 'worker' as const };
    },
    [postMessageToPyodide, renderVersion]
  );

  const checkAndLoadFonts = useCallback((typstContent: string) => {
    let fontsAdded = false;
    const requestedFonts = new Set(
      Array.from(
        typstContent.matchAll(/(?:font-family-\w+|font)\s*:\s*"([^"]+)"/g),
        (match) => match[1]
      )
    );

    for (const fontFamily of Object.keys(FONT_VARIANTS)) {
      if (!loadedFontFamilies.current.has(fontFamily) && requestedFonts.has(fontFamily)) {
        for (const url of getFontUrls(fontFamily, import.meta.env.BASE_URL)) {
          if (!loadedFonts.current.includes(url)) {
            loadedFonts.current.push(url);
            fontsAdded = true;
          }
        }
        loadedFontFamilies.current.add(fontFamily);
      }
    }

    if (fontsAdded) {
      localStorage.setItem('loadedFonts', JSON.stringify(loadedFonts.current));
      localStorage.setItem(
        'loadedFontFamilies',
        JSON.stringify(Array.from(loadedFontFamilies.current))
      );
    }

    return fontsAdded;
  }, []);

  const renderToTypst = useCallback(
    async (renderSections: CvFileSections) => {
      const startedAt = performance.now();
      const { result, source } = await loadValidationResult(renderSections);

      logViewerDebug('validation timings', {
        source: source satisfies ValidationSource,
        totalMs: Number((performance.now() - startedAt).toFixed(1))
      });

      if (!result.content) return null;
      const fontsChanged = checkAndLoadFonts(result.content);
      if (fontsChanged) {
        await postMessageToTypst('REINIT', { fontUrls: loadedFonts.current });
      }
      return result.content;
    },
    [checkAndLoadFonts, loadValidationResult, postMessageToTypst]
  );

  const renderToPdf = useCallback(
    async (renderSections: CvFileSections) => {
      const typst = await renderToTypst(renderSections);
      if (!typst) return null;
      return (await postMessageToTypst('PDF', { content: typst })) as Uint8Array;
    },
    [postMessageToTypst, renderToTypst]
  );

  const renderToSvg = useCallback(
    async (renderSections: CvFileSections) => {
      const typst = await renderToTypst(renderSections);
      if (!typst) return null;
      return (await postMessageToTypst('SVG', { content: typst })) as string[];
    },
    [postMessageToTypst, renderToTypst]
  );

  useEffect(() => {
    try {
      const storedFamilies = localStorage.getItem('loadedFontFamilies');
      loadedFontFamilies.current = mergeStoredFontFamilies(
        storedFamilies ? (JSON.parse(storedFamilies) as string[]) : null
      );
      loadedFonts.current = buildFontUrls(loadedFontFamilies.current, import.meta.env.BASE_URL);

      localStorage.setItem('loadedFonts', JSON.stringify(loadedFonts.current));
      localStorage.setItem(
        'loadedFontFamilies',
        JSON.stringify(Array.from(loadedFontFamilies.current))
      );
    } catch {
      loadedFonts.current = getDefaultFontUrls(import.meta.env.BASE_URL);
      loadedFontFamilies.current = new Set(DEFAULT_FONT_FAMILIES);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        const startedAt = performance.now();
        const TypstWorker = (await import('./typst.worker?worker')).default;
        const PyodideWorker = (await import('./pyodide.worker?worker')).default;

        const typstWorker = new TypstWorker();
        const pyodideWorker = new PyodideWorker();
        typstWorkerRef.current = typstWorker;
        pyodideWorkerRef.current = pyodideWorker;

        typstWorker.onmessage = (event: MessageEvent<{ id: number; type: string; payload?: unknown }>) => {
          const { id, type, payload } = event.data;
          const pending = typstPending.current.get(id);
          if (!pending) return;
          if (type === 'ERROR') {
            pending.reject(errorFromWorker(payload as WorkerErrorPayload));
          } else {
            pending.resolve(payload);
          }
          typstPending.current.delete(id);
        };

        pyodideWorker.onmessage = (event: MessageEvent<{ id: number; type: string; payload?: unknown }>) => {
          const { id, type, payload } = event.data;
          const pending = pyodidePending.current.get(id);
          if (!pending) return;
          if (type === 'ERROR') {
            pending.reject(errorFromWorker(payload as WorkerErrorPayload));
          } else {
            pending.resolve(payload as ViewerValidationResult);
          }
          pyodidePending.current.delete(id);
        };

        await Promise.all([
          postMessageToTypst('INIT', { fontUrls: loadedFonts.current }),
          postMessageToPyodide('INIT')
        ]);

        logViewerDebug('init timings', {
          totalMs: Number((performance.now() - startedAt).toFixed(1))
        });

        if (!cancelled) {
          setIsInitializing(false);
        }
      } catch (error) {
        if (!cancelled) {
          setInitError(error instanceof Error ? error.message : String(error));
          setIsInitializing(false);
        }
      }
    }

    void initialize();

    return () => {
      cancelled = true;
      for (const url of pageUrls.current) {
        URL.revokeObjectURL(url);
      }
      pageUrls.current = [];
      lastTypstContent.current = null;
      lastTypstSvgPages.current = null;
      typstWorkerRef.current?.terminate();
      pyodideWorkerRef.current?.terminate();
      typstWorkerRef.current = null;
      pyodideWorkerRef.current = null;
    };
  }, [postMessageToPyodide, postMessageToTypst]);

  useEffect(() => {
    validationCache.current.clear();
    validationInFlight.current.clear();
    lastTypstContent.current = null;
    lastTypstSvgPages.current = null;
  }, [renderVersion]);

  const renderLatestPreview = useCallback(async () => {
    if (previewRenderLoopActive.current) {
      return;
    }

    previewRenderLoopActive.current = true;

    try {
      while (pendingPreviewSections.current) {
        const renderSections = pendingPreviewSections.current;
        pendingPreviewSections.current = null;
        const requestId = ++currentRenderRequest.current;

        try {
          const renderStartedAt = performance.now();
          const { result, source } = await loadValidationResult(renderSections);
          const pyodideMs = performance.now() - renderStartedAt;

          if (requestId !== currentRenderRequest.current || pendingPreviewSections.current) {
            continue;
          }

          if (result.errors) {
            logViewerDebug('render validation errors', {
              validationSource: source,
              pyodideMs: Number(pyodideMs.toFixed(1)),
              errors: result.errors,
              usedFallbackTheme: result.usedFallbackTheme,
              effectiveDesign: result.effectiveDesign,
              normalizedCvPreview: result.normalizedCv?.slice(0, 2000),
              cvPreview: renderSections.cv.slice(0, 1200),
              designPreview: renderSections.design.slice(0, 600)
            });
            setRenderErrors(
              result.errors.map((error) => ({
                message: error.message || '',
                schema_location: error.schema_location || [],
                input: error.input || '',
                yaml_source: YAML_SOURCE_TO_SECTION[error.yaml_source] ?? 'cv',
                yaml_location: error.yaml_location || null
              }))
            );
            continue;
          }

          const typst = result.content;

          if (!typst) {
            setSvgPages([]);
            setRenderErrors([]);
            continue;
          }

          if (result.usedFallbackTheme) {
            logViewerDebug('render used fallback theme', {
              effectiveDesign: result.effectiveDesign,
              normalizedCvPreview: result.normalizedCv?.slice(0, 2000)
            });
          }

          // Skip Typst SVG render if the content is identical to last render
          if (typst === lastTypstContent.current && lastTypstSvgPages.current) {
            logViewerDebug('render timings', {
              validationSource: source,
              pyodideMs: Number(pyodideMs.toFixed(1)),
              svgMs: 0,
              totalMs: Number(pyodideMs.toFixed(1)),
              typstSvgCache: 'hit',
              pageCount: lastTypstSvgPages.current.length
            });
            // Reuse existing SVG blob URLs — no work needed
            setRenderErrors([]);
            continue;
          }

          const fontsChanged = checkAndLoadFonts(typst);
          if (fontsChanged) {
            await postMessageToTypst('REINIT', { fontUrls: loadedFonts.current });
          }
          if (requestId !== currentRenderRequest.current || pendingPreviewSections.current) {
            continue;
          }

          const svgStartedAt = performance.now();
          const svg = (await postMessageToTypst('SVG', {
            content: typst
          })) as string[];
          const svgMs = performance.now() - svgStartedAt;

          if (requestId !== currentRenderRequest.current || pendingPreviewSections.current) {
            continue;
          }

          logViewerDebug('render timings', {
            validationSource: source,
            pyodideMs: Number(pyodideMs.toFixed(1)),
            svgMs: Number(svgMs.toFixed(1)),
            totalMs: Number((performance.now() - renderStartedAt).toFixed(1)),
            typstSvgCache: 'miss',
            pageCount: svg.length
          });

          lastTypstContent.current = typst;
          lastTypstSvgPages.current = svg;

          for (const url of pageUrls.current) {
            URL.revokeObjectURL(url);
          }
          const urls = svg.map((page) => URL.createObjectURL(new Blob([page], { type: 'image/svg+xml' })));
          pageUrls.current = urls;
          setSvgPages(urls);
          setRenderErrors([]);
        } catch (error) {
          if (requestId !== currentRenderRequest.current || pendingPreviewSections.current) {
            continue;
          }

          logViewerDebug('render worker exception', {
            error
          });

          setRenderErrors([
            {
              message: error instanceof Error ? error.message : String(error),
              schema_location: [],
              input: '',
              yaml_source: 'cv',
              yaml_location: null
            }
          ]);
        }
      }
    } finally {
      previewRenderLoopActive.current = false;

      if (pendingPreviewSections.current) {
        void renderLatestPreview();
      }
    }
  }, [checkAndLoadFonts, loadValidationResult, postMessageToTypst, renderVersion]);

  useEffect(() => {
    if (!hasSections || isInitializing || initError || !cvContent.trim()) {
      return;
    }

    const renderSections: CvFileSections = {
      cv: cvContent,
      design: designContent,
      locale: localeContent,
      settings: settingsContent
    };
    const timer = window.setTimeout(async () => {
      pendingPreviewSections.current = renderSections;
      void renderLatestPreview();
    }, 50);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    hasSections,
    cvContent,
    designContent,
    localeContent,
    settingsContent,
    renderVersion,
    isInitializing,
    initError,
    renderLatestPreview
  ]);

  const importThemeArchive = useCallback(
    async (file: File) => {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const result = await postMessageToPyodide<ImportedThemePayload>('IMPORT_THEME_ARCHIVE', {
        archiveName: file.name,
        bytes
      });
      setRenderVersion((current) => current + 1);
      return result;
    },
    [postMessageToPyodide]
  );

  const validateSections = useCallback(
    async (renderSections: CvFileSections) => {
      const { result } = await loadValidationResult(renderSections);
      return result;
    },
    [loadValidationResult]
  );

  const zoomIn = useCallback(() => {
    setZoomFactor((current) => Math.min(MAX_ZOOM, current + ZOOM_STEP));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomFactor((current) => Math.max(MIN_ZOOM, current - ZOOM_STEP));
  }, []);

  const zoomReset = useCallback(() => {
    setZoomFactor(1);
  }, []);

  return useMemo(
    () => ({
      svgPages,
      renderErrors,
      isInitializing,
      initError,
      zoomFactor,
      effectiveZoom,
      zoomPercent,
      zoomIn,
      zoomOut,
      zoomReset,
      renderToPdf,
      renderToSvg,
      renderToTypst,
      importThemeArchive,
      validateSections
    }),
    [
      svgPages,
      renderErrors,
      isInitializing,
      initError,
      zoomFactor,
      effectiveZoom,
      zoomPercent,
      zoomIn,
      zoomOut,
      zoomReset,
      renderToPdf,
      renderToSvg,
      renderToTypst,
      importThemeArchive,
      validateSections
    ]
  );
}
