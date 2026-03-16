// eslint-disable-next-line @typescript-eslint/no-explicit-any
(self as any).window = self;

interface TypstModule {
  svg: (opts: { mainContent: string }) => Promise<string>;
  pdf: (opts: { mainContent: string }) => Promise<Uint8Array>;
  setCompilerInitOptions: (opts: unknown) => void;
  setRendererInitOptions: (opts: unknown) => void;
}

const BASE_URL = import.meta.env.BASE_URL;

let typst: TypstModule | null = null;

function assetUrl(path: string) {
  return new URL(`${BASE_URL}${path}`, self.location.origin).toString();
}

function extractSvgPages(svg: string): string[] {
  if (!svg) return [];

  const pageOpener = '<g class="typst-page"';
  if (!svg.includes(pageOpener)) return [svg];

  const segments = svg.split(pageOpener);
  const lastPageIndex = segments.length - 2;
  const preamble = segments[0];
  const svgTagEnd = preamble.indexOf('>');
  const baseSvgTag = preamble
    .slice(0, svgTagEnd)
    .replace(/\s+viewBox="[^"]*"/g, '')
    .replace(/\s+width="[^"]*"/g, '')
    .replace(/\s+height="[^"]*"/g, '');
  const sharedContent = preamble.slice(svgTagEnd + 1);

  return segments.slice(1).map((segment, index) => {
    const raw = index === lastPageIndex ? segment.slice(0, segment.lastIndexOf('</svg>')) : segment;
    const attributeEnd = raw.indexOf('>');
    const attributes = raw.slice(0, attributeEnd);
    const inner = raw.slice(attributeEnd + 1);
    const closeIndex = inner.lastIndexOf('</g>');
    const content = closeIndex >= 0 ? inner.slice(0, closeIndex) : inner;
    const width = /data-page-width="([^"]*)"/.exec(attributes)?.[1];
    const height = /data-page-height="([^"]*)"/.exec(attributes)?.[1];
    const dimensions =
      width && height
        ? ` viewBox="0 0 ${width} ${height}" width="${width}pt" height="${height}pt"`
        : '';
    const cleanAttributes = attributes.replace(/\s+transform="[^"]*"/, '');

    return `${baseSvgTag}${dimensions}>${sharedContent}${pageOpener}${cleanAttributes}>${content}</g></svg>`;
  });
}

async function loadScript(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load script ${url}: HTTP ${response.status}`);
  }
  const text = await response.text();
  const blob = new Blob([text], { type: 'application/javascript' });
  const blobUrl = URL.createObjectURL(blob);
  try {
    return await import(/* @vite-ignore */ blobUrl);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

async function initTypst(fontUrls: string[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [, options] = (await Promise.all([
    loadScript(assetUrl('cdn/typst-ts-esm/all-in-one-lite.bundle.js')),
    loadScript(assetUrl('cdn/typst-ts-esm/options.init.mjs'))
  ])) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  typst = (self as any).$typst as TypstModule;
  typst.setCompilerInitOptions({
    getModule: () => assetUrl('cdn/typst/typst_ts_web_compiler_bg.wasm'),
    beforeBuild: [options.preloadRemoteFonts(fontUrls)]
  });
  typst.setRendererInitOptions({
    getModule: () => assetUrl('cdn/typst-renderer/typst_ts_renderer_bg.wasm')
  });
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
