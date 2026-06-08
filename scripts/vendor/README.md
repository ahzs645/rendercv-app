# Vendored Pyodide runtime — source of record

The web app runs RenderCV (Python) entirely in the browser via **Pyodide
0.29.3**. The runtime and its Python wheels live as static files under:

- `static/cdn/pyodide/v0.29.3/full/` — the Pyodide distribution (CPython→wasm,
  stdlib, and the native wasm32 wheels: `pydantic_core`, `markupsafe`, `ssl`)
- `static/cdn/pypi-wheels/` — pure-Python deps installed via `micropip`
- `static/rendercv-2.8-py3-none-any.whl` — the RenderCV package itself

None of these are built in this repo — they are **stock upstream artifacts**.
This directory records exactly where each one comes from so they can be
re-fetched and verified instead of trusted as opaque committed binaries.

## Provenance (all verified byte-for-byte)

| Asset group | Upstream source | Notes |
|---|---|---|
| Pyodide runtime + native wheels (17 files) | jsDelivr Pyodide CDN `https://cdn.jsdelivr.net/pyodide/v0.29.3/full/` | identical to the [GitHub 0.29.3 release](https://github.com/pyodide/pyodide/releases/tag/0.29.3) |
| `pyodide.js` | same CDN, **+ offline patch** | only non-stock file — see below |
| 6 PyPI wheels + RenderCV 2.8 | PyPI / `files.pythonhosted.org` | RenderCV is the stock published wheel |

### The one non-stock file: `pyodide.js`

`pyodide.js` is upstream 0.29.3 (same `BUILD_ID`) with **two deliberate edits**
so the app stays fully self-hosted and never calls out to jsDelivr at runtime:

1. drop the subresource-integrity arg from the browser `fetch` helper
2. fall back to the local `indexURL` instead of the jsDelivr CDN for packages

These rules live in [`offline-patch.mjs`](./offline-patch.mjs) and are re-applied
automatically during vendoring. Applying them to upstream `pyodide.js` reproduces
the committed file's sha256 exactly.

## `pyodide-assets.lock.json`

The lockfile pins every asset: destination path, upstream URL, and the sha256 of
the **final vendored bytes** (post-patch for `pyodide.js`). It is the contract
the verifier enforces.

## Reproducible vendoring (recommended path)

```bash
pnpm vendor:pyodide          # download from upstream, re-apply patch, verify, write
pnpm vendor:pyodide:check    # verify the committed files against the lock (no network)
```

Any sha256 mismatch aborts the run before touching the working tree. A clean
`pnpm vendor:pyodide` produces files byte-identical to what is committed.

### Dropping the binaries from git (optional)

To stop committing ~18 MB of binaries, gitignore the vendored paths and run
`pnpm vendor:pyodide` as a `postinstall` / pre-build step. Keep
`pyodide-assets.lock.json` and this `scripts/vendor/` dir in git — they are the
source of record. (Not done automatically; it changes CI/dev bootstrap.)

## True source build (`build-from-source/`)

`build-from-source/build.sh` cross-compiles Pyodide 0.29.3 from source via the
official emscripten Docker toolchain, then applies the same offline patch.

This reproduces a **stock** binary and is only worth doing to patch CPython or a
native package itself. It is slow (~1–3 h, needs Docker + ~20 GB disk) and the
output is **not guaranteed bit-for-bit identical** to the vendored files
(emscripten/LLVM builds aren't fully deterministic). For plain reproducibility,
use `vendor:pyodide` instead. If you adopt source-built artifacts, regenerate the
lockfile hashes.

## Updating the Pyodide version

1. Bump the version in the `static/cdn/pyodide/vX.Y.Z/full/` path and in the
   `pyodide.worker.ts` URLs.
2. Re-fetch from the new CDN version and confirm the two `offline-patch.mjs`
   rules still each match exactly once (the verifier errors loudly if not).
3. Refresh PyPI wheel versions/URLs/hashes in the lockfile.
4. Run `pnpm vendor:pyodide` and commit the updated lockfile.
