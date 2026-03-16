// Polyfill window so the Typst.ts all-in-one bundle can set $typst
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(self as any).window = self;

interface TypstModule {
  svg: (opts: { mainContent: string }) => Promise<string>;
  pdf: (opts: { mainContent: string }) => Promise<Uint8Array>;
  setCompilerInitOptions: (opts: unknown) => void;
  setRendererInitOptions: (opts: unknown) => void;
}

const BUNDLE_URL = '/rendercv-app/cdn/typst-ts-esm/all-in-one-lite.bundle.js';
const OPTIONS_URL = '/rendercv-app/cdn/typst-ts-esm/options.init.mjs';
const COMPILER_WASM_URL = '/rendercv-app/cdn/typst/typst_ts_web_compiler_bg.wasm';
const RENDERER_WASM_URL = '/rendercv-app/cdn/typst-renderer/typst_ts_renderer_bg.wasm';

let typst: TypstModule | null = null;

/**
 * Split a Typst multi-page SVG into one standalone SVG string per page.
 * Pure string manipulation — no DOM APIs required, O(n) in total string length.
 *
 * Typst SVG structure (guaranteed by the renderer):
 *   <svg …>
 *     <defs>…</defs>
 *     <g class="typst-page" data-page-width="W" data-page-height="H" transform="…">…</g>
 *     …
 *   </svg>
 */
function extractSvgPages(svg: string): string[] {
  if (!svg) return [];

  const PAGE_OPENER = '<g class="typst-page"';
  if (!svg.includes(PAGE_OPENER)) return [svg];

  // Split on PAGE_OPENER → [preamble, page1_tail, page2_tail, …]
  const segments = svg.split(PAGE_OPENER);
  const lastPageIdx = segments.length - 2;
  const preamble = segments[0];

  // The preamble starts with <svg …> — strip per-page sizing (set individually per page).
  const svgTagEnd = preamble.indexOf('>');
  const baseSvgTag = preamble
    .slice(0, svgTagEnd)
    .replace(/\s+viewBox="[^"]*"/g, '')
    .replace(/\s+width="[^"]*"/g, '')
    .replace(/\s+height="[^"]*"/g, '');

  // Everything after the opening <svg> tag: <defs>, <style>, etc. Shared across all pages.
  const sharedContent = preamble.slice(svgTagEnd + 1);

  return segments.slice(1).map((seg, i) => {
    // Final segment carries a trailing </svg>; drop it.
    const raw = i === lastPageIdx ? seg.slice(0, seg.lastIndexOf('</svg>')) : seg;

    // <g …> attribute string is everything before the first >.
    const attrEnd = raw.indexOf('>');
    const attrs = raw.slice(0, attrEnd);
    const inner = raw.slice(attrEnd + 1);

    // Page-closing </g> is always the outermost (last) one in this segment.
    const closeIdx = inner.lastIndexOf('</g>');
    const content = closeIdx >= 0 ? inner.slice(0, closeIdx) : inner;

    const width = /data-page-width="([^"]*)"/.exec(attrs)?.[1];
    const height = /data-page-height="([^"]*)"/.exec(attrs)?.[1];
    const dims =
      width && height
        ? ` viewBox="0 0 ${width} ${height}" width="${width}pt" height="${height}pt"`
        : '';

    // Strip the combined-layout transform; each page SVG is independently positioned.
    const cleanAttrs = attrs.replace(/\s+transform="[^"]*"/, '');

    return `${baseSvgTag}${dims}>${sharedContent}${PAGE_OPENER}${cleanAttrs}>${content}</g></svg>`;
  });
}

async function loadScript(url: string): Promise<unknown> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Failed to load script ${url}: HTTP ${r.status}`);
  const text = await r.text();
  const blob = new Blob([text], { type: 'application/javascript' });
  const blobUrl = URL.createObjectURL(blob);
  try {
    return await import(/* @vite-ignore */ blobUrl);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

async function initTypst(fontUrls: string[]) {
  // Both scripts are independent network fetches — load them concurrently.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [, options] = (await Promise.all([
    loadScript(BUNDLE_URL),
    loadScript(OPTIONS_URL)
  ])) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  typst = (self as any).$typst as TypstModule;

  typst.setCompilerInitOptions({
    getModule: () => COMPILER_WASM_URL,
    beforeBuild: [options.preloadRemoteFonts(fontUrls)]
  });
  typst.setRendererInitOptions({ getModule: () => RENDERER_WASM_URL });
}

self.onmessage = async (event: MessageEvent<{ id: number; type: string; payload?: unknown }>) => {
  const { id, type, payload } = event.data;

  try {
    switch (type) {
      case 'INIT':
      case 'REINIT': {
        const { fontUrls } = payload as { fontUrls: string[] };
        await initTypst(fontUrls);
        self.postMessage({ id, type: 'SUCCESS' });
        break;
      }
      case 'SVG': {
        if (!typst) throw new Error('Typst not initialized');
        const { content } = payload as { content: string };
        const svg = await typst.svg({ mainContent: content });
        self.postMessage({ id, type: 'SUCCESS', payload: extractSvgPages(svg) });
        break;
      }
      case 'PDF': {
        if (!typst) throw new Error('Typst not initialized');
        const { content } = payload as { content: string };
        const pdf = await typst.pdf({ mainContent: content });
        self.postMessage({ id, type: 'SUCCESS', payload: pdf }, { transfer: [pdf.buffer] });
        break;
      }
    }
  } catch (error) {
    self.postMessage({
      id,
      type: 'ERROR',
      payload:
        error instanceof Error
          ? { message: error.message, name: error.name, stack: error.stack }
          : { message: String(error), name: 'Error', stack: undefined }
    });
  }
};
