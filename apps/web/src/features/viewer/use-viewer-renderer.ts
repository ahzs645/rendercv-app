import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CvFileSections, SectionKey } from '@rendercv/contracts';
import { MAX_ZOOM, MIN_ZOOM, ZOOM_STEP } from './zoom-config';
import { DEFAULT_FONT_FAMILIES, FONT_VARIANTS, getDefaultFontUrls, getFontUrls } from './fonts';
import { parseTypstSectionMap } from './typst-section-map';
import type { SectionMapResult } from './typst-section-map';

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

type RendererWorkerService = {
  pyodideWorker: Worker;
  typstWorker: Worker;
  pyodidePending: Map<number, PendingRequest>;
  typstPending: Map<number, PendingRequest>;
  nextPyodideId: number;
  nextTypstId: number;
  initPromise: Promise<void>;
};

type ValidationSource = 'cache' | 'inflight' | 'worker';

const MAX_VALIDATION_CACHE_ENTRIES = 24;

const YAML_SOURCE_TO_SECTION: Record<string, SectionKey> = {
  main_yaml_file: 'cv',
  design_yaml_file: 'design',
  locale_yaml_file: 'locale',
  settings_yaml_file: 'settings'
};

let rendererWorkerService: RendererWorkerService | null = null;

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

async function getRendererWorkerService(fontUrls: string[]) {
  if (rendererWorkerService) {
    await rendererWorkerService.initPromise;
    return rendererWorkerService;
  }

  const startedAt = performance.now();
  const TypstWorker = (await import('./typst.worker?worker')).default;
  const PyodideWorker = (await import('./pyodide.worker?worker')).default;

  const service: RendererWorkerService = {
    typstWorker: new TypstWorker(),
    pyodideWorker: new PyodideWorker(),
    typstPending: new Map(),
    pyodidePending: new Map(),
    nextTypstId: 0,
    nextPyodideId: 0,
    initPromise: Promise.resolve()
  };

  service.typstWorker.onmessage = (event: MessageEvent<{ id: number; type: string; payload?: unknown }>) => {
    const { id, type, payload } = event.data;
    const pending = service.typstPending.get(id);
    if (!pending) return;
    if (type === 'ERROR') {
      pending.reject(errorFromWorker(payload as WorkerErrorPayload));
    } else {
      pending.resolve(payload);
    }
    service.typstPending.delete(id);
  };

  service.pyodideWorker.onmessage = (event: MessageEvent<{ id: number; type: string; payload?: unknown }>) => {
    const { id, type, payload } = event.data;
    const pending = service.pyodidePending.get(id);
    if (!pending) return;
    if (type === 'ERROR') {
      pending.reject(errorFromWorker(payload as WorkerErrorPayload));
    } else {
      pending.resolve(payload);
    }
    service.pyodidePending.delete(id);
  };

  rendererWorkerService = service;
  service.initPromise = Promise.all([
    postRendererMessage(service, 'typst', 'INIT', { fontUrls }),
    postRendererMessage(service, 'pyodide', 'INIT')
  ]).then(() => {
    logViewerDebug('init timings', {
      totalMs: Number((performance.now() - startedAt).toFixed(1)),
      workerLifecycle: 'module'
    });
  });

  await service.initPromise;
  return service;
}

function postRendererMessage<T = unknown>(
  service: RendererWorkerService,
  target: 'pyodide' | 'typst',
  type: string,
  payload?: unknown
) {
  return new Promise<T>((resolve, reject) => {
    if (target === 'pyodide') {
      const id = ++service.nextPyodideId;
      service.pyodidePending.set(id, { resolve: resolve as (value: unknown) => void, reject });
      service.pyodideWorker.postMessage({ id, type, payload });
      return;
    }

    const id = ++service.nextTypstId;
    service.typstPending.set(id, { resolve: resolve as (value: unknown) => void, reject });
    service.typstWorker.postMessage({ id, type, payload });
  });
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

function revokePageUrls(urls: string[]) {
  for (const url of urls) {
    URL.revokeObjectURL(url);
  }
}

function createSvgPageUrls(svgPages: string[]) {
  return svgPages.map((page) => URL.createObjectURL(new Blob([page], { type: 'image/svg+xml' })));
}

function waitForImageDecode(url: string) {
  return new Promise<void>((resolve, reject) => {
    const image = new Image();
    let settled = false;

    const finish = (callback: () => void) => {
      if (settled) {
        return;
      }

      settled = true;
      image.onload = null;
      image.onerror = null;
      callback();
    };

    image.onload = () => finish(resolve);
    image.onerror = () => {
      finish(() => reject(new Error('Failed to load rendered preview page')));
    };
    image.src = url;

    if (typeof image.decode === 'function') {
      void image.decode().then(
        () => finish(resolve),
        () => {
          // Fall back to the load/error handlers when decode is not supported for this asset.
        }
      );
    }
  });
}

async function waitForSvgPages(urls: string[]) {
  await Promise.all(urls.map((url) => waitForImageDecode(url)));
}

export function useViewerRenderer(sections?: CvFileSections) {
  const [zoomFactor, setZoomFactor] = useState(1);
  const [svgPages, setSvgPages] = useState<string[]>([]);
  const [sectionMap, setSectionMap] = useState<SectionMapResult>({ sections: [], preambleLines: 0 });
  const [renderErrors, setRenderErrors] = useState<RenderError[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | undefined>();
  const [renderVersion, setRenderVersion] = useState(0);
  const hasSections = sections !== undefined;
  const cvContent = sections?.cv ?? '';
  const designContent = sections?.design ?? '';
  const localeContent = sections?.locale ?? '';
  const settingsContent = sections?.settings ?? '';

  const rendererServiceRef = useRef<RendererWorkerService | null>(null);
  const pageUrls = useRef<string[]>([]);
  const currentRenderRequest = useRef(0);
  const loadedFonts = useRef<string[]>([]);
  const loadedFontFamilies = useRef(new Set<string>());
  const validationCache = useRef(new Map<string, ViewerValidationResult>());
  const validationInFlight = useRef(new Map<string, Promise<ViewerValidationResult>>());
  const pendingPreviewSections = useRef<CvFileSections | null>(null);
  const previewRenderLoopActive = useRef(false);
  const lastTypstSectionsKey = useRef<string | null>(null);
  const lastTypstContent = useRef<string | null>(null);
  const lastTypstSvgPages = useRef<string[] | null>(null);
  const lastPdfTypstContent = useRef<string | null>(null);
  const lastPdfBytes = useRef<Uint8Array | null>(null);
  const pdfInFlight = useRef(new Map<string, Promise<Uint8Array>>());

  const effectiveZoom = zoomFactor;
  const zoomPercent = Math.round(effectiveZoom * 100);

  const postMessageToPyodide = useCallback(<T = unknown,>(type: string, payload?: unknown) => {
    if (!rendererServiceRef.current) {
      return Promise.reject(new Error('Pyodide worker not initialized'));
    }

    return postRendererMessage<T>(rendererServiceRef.current, 'pyodide', type, payload);
  }, []);

  const postMessageToTypst = useCallback((type: string, payload?: unknown) => {
    if (!rendererServiceRef.current) {
      return Promise.reject(new Error('Typst worker not initialized'));
    }

    return postRendererMessage(rendererServiceRef.current, 'typst', type, payload);
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

    return fontsAdded;
  }, []);

  const renderToTypst = useCallback(
    async (renderSections: CvFileSections) => {
      const key = buildValidationCacheKey(renderSections, renderVersion);
      if (key === lastTypstSectionsKey.current && lastTypstContent.current) {
        return lastTypstContent.current;
      }

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
      lastTypstSectionsKey.current = key;
      lastTypstContent.current = result.content;
      return result.content;
    },
    [checkAndLoadFonts, loadValidationResult, postMessageToTypst, renderVersion]
  );

  const renderToPdf = useCallback(
    async (renderSections: CvFileSections) => {
      const typst = await renderToTypst(renderSections);
      if (!typst) return null;

      if (typst === lastPdfTypstContent.current && lastPdfBytes.current) {
        return lastPdfBytes.current;
      }

      const existingRequest = pdfInFlight.current.get(typst);
      if (existingRequest) {
        return existingRequest;
      }

      const request = postMessageToTypst('PDF', { content: typst })
        .then((bytes) => {
          const pdfBytes = bytes as Uint8Array;
          lastPdfTypstContent.current = typst;
          lastPdfBytes.current = pdfBytes;
          return pdfBytes;
        })
        .finally(() => {
          pdfInFlight.current.delete(typst);
        });

      pdfInFlight.current.set(typst, request);
      return request;
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
    loadedFontFamilies.current = new Set(DEFAULT_FONT_FAMILIES);
    loadedFonts.current = getDefaultFontUrls(import.meta.env.BASE_URL);

    try {
      localStorage.removeItem('loadedFonts');
      localStorage.removeItem('loadedFontFamilies');
    } catch {
      // Local storage may be unavailable in embedded/private contexts.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        rendererServiceRef.current = await getRendererWorkerService(loadedFonts.current);

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
      revokePageUrls(pageUrls.current);
      pageUrls.current = [];
      lastTypstSectionsKey.current = null;
      lastTypstContent.current = null;
      lastTypstSvgPages.current = null;
      lastPdfTypstContent.current = null;
      lastPdfBytes.current = null;
      pdfInFlight.current.clear();
      rendererServiceRef.current = null;
    };
  }, []);

  useEffect(() => {
    validationCache.current.clear();
    validationInFlight.current.clear();
    lastTypstSectionsKey.current = null;
    lastTypstContent.current = null;
    lastTypstSvgPages.current = null;
    lastPdfTypstContent.current = null;
    lastPdfBytes.current = null;
    pdfInFlight.current.clear();
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
          const typstSectionsKey = buildValidationCacheKey(renderSections, renderVersion);

          if (!typst) {
            setSvgPages([]);
            setRenderErrors([]);
            continue;
          }

          // Always update section map when we have typst content (cheap parse)
          setSectionMap(parseTypstSectionMap(typst));

          if (result.usedFallbackTheme) {
            logViewerDebug('render used fallback theme', {
              effectiveDesign: result.effectiveDesign,
              normalizedCvPreview: result.normalizedCv?.slice(0, 2000)
            });
          }

          // Skip Typst SVG render if the content is identical to last render
          if (typst === lastTypstContent.current && lastTypstSvgPages.current) {
            lastTypstSectionsKey.current = typstSectionsKey;
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

          lastTypstSectionsKey.current = typstSectionsKey;
          lastTypstContent.current = typst;

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

          const urls = createSvgPageUrls(svg);
          try {
            await waitForSvgPages(urls);
          } catch (error) {
            revokePageUrls(urls);
            throw error;
          }

          if (requestId !== currentRenderRequest.current || pendingPreviewSections.current) {
            revokePageUrls(urls);
            continue;
          }

          const previousUrls = pageUrls.current;
          pageUrls.current = urls;
          setSvgPages(urls);
          setRenderErrors([]);
          window.setTimeout(() => {
            revokePageUrls(previousUrls);
          }, 0);
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
      sectionMap,
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
      sectionMap,
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
