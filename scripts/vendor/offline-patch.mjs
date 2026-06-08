// The offline patch applied to upstream pyodide.js.
//
// Our vendored pyodide.js is upstream 0.29.3 (same BUILD_ID) with two deliberate
// edits so the app stays fully self-hosted and never reaches out to jsDelivr at
// runtime:
//   1. drop the subresource-integrity arg from the browser fetch helper
//   2. fall back to the local indexURL (not the jsDelivr CDN) for packages
//
// Shared by vendor-pyodide.mjs (re-vendor from CDN) and the source build
// (patch the freshly compiled pyodide.js). Each rule must match exactly once,
// or upstream changed shape and the patch must be revisited.

export const OFFLINE_PATCHES = [
  {
    from: 'return{response:fetch(n,t?{integrity:t}:{})}',
    to: 'return{response:fetch(n)}'
  },
  {
    from: 'e.cdnUrl=O(e.packageBaseUrl??`https://cdn.jsdelivr.net/pyodide/v${x}/full/`)',
    to: 'e.cdnUrl=O(e.packageBaseUrl??e.indexURL)'
  }
];

/** Apply every offline patch rule to pyodide.js source text. Throws if any rule
 *  does not match exactly once. Returns the patched text. */
export function applyOfflinePatch(text) {
  for (const { from, to } of OFFLINE_PATCHES) {
    const count = text.split(from).length - 1;
    if (count !== 1) {
      throw new Error(
        `offline patch rule expected exactly 1 match but found ${count}: ${from.slice(0, 48)}…\n` +
          'Upstream pyodide.js changed shape — update OFFLINE_PATCHES in scripts/vendor/offline-patch.mjs.'
      );
    }
    text = text.replace(from, to);
  }
  return text;
}
