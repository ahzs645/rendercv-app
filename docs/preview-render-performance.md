# Preview Render Performance Notes

## Context

The web preview render path currently starts two browser workers from `useViewerRenderer`:

- `pyodide.worker.ts` converts RenderCV YAML sections into Typst source by loading Pyodide, RenderCV, and Python dependencies.
- `typst.worker.ts` compiles the Typst source into SVG pages for preview and PDF bytes for download.

The user-visible first preview time is mostly startup cost, not steady-state render cost.

## Measured Baseline

Measurements used the bundled default sample resume, `CV (Classic)`, rendered in a production build served by `vite preview`.

The timing is measured from page/iframe navigation start until the first preview image is decoded in the browser.

Observed baseline before startup experiments:

| Run | Preview time | Pages |
| --- | ---: | ---: |
| Clean storage | ~2.54s | 2 |
| Warm storage | ~2.45s | 2 |
| Warm storage | ~2.45s | 2 |
| Warm storage | ~2.49s | 2 |

Dev-server measurements were similar, around `2.4s` to `2.6s`.

The warm render logs showed that once the engines are initialized, the actual work is much smaller:

- Pyodide validation/YAML-to-Typst: roughly `120ms`.
- Typst SVG render: roughly `100ms` to `115ms` on warm runs.

This indicates the main bottleneck is worker and WASM/Python startup.

## Startup Cost Drivers

Large local assets involved in startup include:

- `static/cdn/typst/typst_ts_web_compiler_bg.wasm`: about `27 MB`.
- `static/cdn/pyodide/v0.29.3/full/pyodide.asm.wasm`: about `8.3 MB`.
- `static/cdn/pyodide/v0.29.3/full/python_stdlib.zip`: about `2.3 MB`.
- Python package wheels used by RenderCV/Pyodide: several MB total.
- Bundled custom theme archive: about `2.3 MB`, relevant for `ahmadstyle` or custom themes.

The app already parallelizes Pyodide and Typst worker initialization, but both still have large fixed startup costs.

## Experiments Tried

### PDF/Typst Export Caching

`renderToPdf` and `renderToTypst` can reuse Typst already produced by the live preview when sections match, and PDF bytes are cached for repeated downloads.

Impact:

- Helps PDF/export button responsiveness after preview is current.
- Does not materially improve first preview time.

### Font Loading Cleanup

The viewer no longer needs to persist an ever-growing list of previously used font families into `localStorage`. Starting with only default fonts and loading additional families on demand avoids unnecessary font preload growth across sessions.

Impact:

- Reduces avoidable font work in some user histories.
- Not the dominant cost for the default Classic sample.

### Monaco/Diff Code Splitting

Monaco and diff-viewer imports were moved behind lazy boundaries. This separated Monaco into an async chunk and reduced the initial app JS bundle from roughly `3.3 MB` to roughly `1.0 MB`.

Impact:

- Moderate improvement to initial app startup pressure.
- Sample preview improved into roughly the `2.28s` to `2.41s` range in local production timing.
- Does not remove the Pyodide/Typst WASM floor.

### Preload Hints

HTML preload hints were tested for critical Pyodide and Typst assets, including:

- Pyodide loader/WASM.
- Typst runtime bundle.
- Typst compiler WASM.

Impact:

- Did not improve this local production test.
- Cold storage became worse in one run, around `2.69s`.
- Warm runs stayed around `2.34s` to `2.38s`.

Likely reason: preloading a very large Typst WASM file can compete with the app and worker startup fetches instead of helping.

Conclusion: do not add broad eager preloads without more careful resource-priority testing.

### Lazy Theme Registration

Pyodide theme registration was examined because bundled/stored theme archives can add unnecessary work. The best direction is to register custom/bundled themes only when the active design asks for that theme.

Impact:

- Useful for users with stored custom themes or `ahmadstyle` documents.
- Not expected to materially improve the default Classic sample, which uses a built-in theme.

### Deferred Package Cache Tar Creation

On clean storage, Pyodide installs packages and then creates an IndexedDB tarball cache. Deferring tarball creation until after first render avoids blocking the first visible preview on cache preparation.

Latest observed production sample timing with this direction:

| Run | Preview time | Pages |
| --- | ---: | ---: |
| Clean storage | ~2.32s | 2 |
| Warm storage | ~2.22s | 2 |
| Warm storage | ~2.27s | 2 |

Impact:

- Small but measurable improvement.
- Mostly affects clean-storage and startup contention.
- Needs serialization/queueing around Pyodide operations because the Python runtime uses mutable globals.

## Ranked Next Steps

### 1. Pre-generate Typst or SVG for Bundled Samples

Expected impact: high for first-load default-sample UX.

The default files are static. Generate Typst, or even SVG pages, for those examples at build time and key them by sample id/content hash. The first preview can render immediately from cached/generated output while Pyodide warms in the background for edits and arbitrary user content.

Pros:

- Avoids Pyodide on the first default sample render.
- Low privacy risk because bundled samples are static.
- Low risk to RenderCV parity for user documents.

Cons:

- Only helps bundled sample resumes or exact matches.
- Needs invalidation when sample content or theme templates change.

### 2. Persistent In-Page Renderer Service

Expected impact: medium for SPA route changes and multi-preview pages.

Create a module-level renderer service that owns one Pyodide worker and one Typst worker per browser document. Hooks subscribe to it instead of creating and terminating workers per mount.

Pros:

- Avoids duplicate Pyodide/Typst startup in the same app session.
- Lower risk than `SharedWorker`.
- Helps route transitions, review flows, and any page with multiple preview surfaces.

Cons:

- Does not improve first cold load.
- Requires careful ownership of hook-local blob URLs and global worker caches.

### 3. Server-Side YAML-to-Typst Endpoint

Expected impact: high for normal online user previews.

Add an API endpoint that runs native RenderCV server-side and returns Typst content or validation errors. Keep Pyodide as offline/fallback behavior.

Pros:

- Avoids client Pyodide startup for online users.
- Keeps behavior tied to the real Python RenderCV package.

Cons:

- Sends CV content to the server, which has privacy/product implications.
- Adds backend cost and operational latency.
- Needs careful version parity with client assets.

### 4. SharedWorker Renderer

Expected impact: medium in same-origin multi-tab/session scenarios.

A `SharedWorker` could keep one renderer runtime across same-origin tabs/windows.

Pros:

- Can share warm Pyodide/Typst runtimes beyond one React tree.
- May help popup previews or multiple tabs.

Cons:

- Browser support is weaker than dedicated workers.
- Lifetime is tied to owning documents.
- Current worker code assumes dedicated `self.onmessage`.
- Pyodide operations must be serialized because render code mutates global Python variables.

Recommendation: try an in-page singleton first. Consider `SharedWorker` only after the simpler service exists.

### 5. JS-Native YAML-to-Typst for Built-In Themes

Expected impact: very high if complete.

Port the YAML normalization, validation, date/social handling, Markdown conversion, and template rendering into TypeScript for built-in themes.

Pros:

- Could remove Pyodide from the common built-in-theme path.

Cons:

- High maintenance risk.
- Hard to preserve exact parity with RenderCV/Pydantic/Jinja behavior.
- Better treated as a longer-term product architecture decision.

## Current Recommendation

Do these in order:

1. Keep the small worker/cache startup optimizations that measured positively.
2. Implement pre-generated Typst/SVG for the bundled default samples.
3. Extract an in-page renderer singleton to avoid repeated startup inside one app session.
4. Decide whether server-side rendering is acceptable from a privacy and infrastructure perspective.

Preload hints should not be the next focus unless tested with precise resource timing and priority behavior; broad preloads of large WASM assets did not help in the local measurements.
