#!/usr/bin/env bash
# Build the Pyodide 0.29.3 runtime from source via the official emscripten
# Docker toolchain, then apply our offline patch.
#
# This is the "true source build" path. It is SLOW (cross-compiling CPython +
# native packages to wasm32 takes ~1–3 h and needs Docker + ~20 GB disk) and it
# reproduces a STOCK binary — functionally equivalent to what the jsDelivr CDN
# already serves. The compiled artifacts are NOT guaranteed bit-for-bit identical
# to the vendored ones (emscripten/LLVM builds are not fully deterministic), so
# for reproducible vendoring prefer ../vendor-pyodide.mjs. Use this only when you
# need to patch CPython or a native package itself.
#
# Usage:
#   scripts/vendor/build-from-source/build.sh
# Result is written to scripts/vendor/build-from-source/dist/ ; nothing in
# static/ is touched until you copy it over yourself.

set -euo pipefail

PYODIDE_VERSION="0.29.3"
# Native wasm32 packages this app actually loads from the Pyodide distribution
# (pure-Python deps come from PyPI via ../vendor-pyodide.mjs, not from here).
PYODIDE_PACKAGES="micropip,pydantic_core,markupsafe,ssl,openssl"

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$HERE/../../.." && pwd)"
WORK="$HERE/.work"
DIST="$HERE/dist"

command -v docker >/dev/null 2>&1 || { echo "docker is required" >&2; exit 1; }

echo ">> Cloning pyodide $PYODIDE_VERSION (recursive)…"
rm -rf "$WORK"
git clone --depth 1 --branch "$PYODIDE_VERSION" --recursive \
  https://github.com/pyodide/pyodide "$WORK"

echo ">> Building inside the pinned pyodide-env image (this takes a while)…"
# run_docker drops into the toolchain image pinned by the checked-out version.
docker run --rm \
  -v "$WORK":/src -w /src \
  "pyodide/pyodide-env:$(cat "$WORK/Makefile.envs" | sed -n 's/^export PYODIDE_IMAGE_TAG ?= //p' | tr -d '[:space:]' || echo 'latest')" \
  bash -lc "make && PYODIDE_PACKAGES='$PYODIDE_PACKAGES' make -C packages"

echo ">> Applying offline patch to built pyodide.js…"
node "$HERE/patch-built.mjs" "$WORK/dist/pyodide.js"

echo ">> Collecting artifacts into dist/…"
rm -rf "$DIST"
mkdir -p "$DIST"
cp -R "$WORK/dist/." "$DIST/"

cat <<EOF

Done. Built distribution is in:
  $DIST

To adopt it, copy the files this app uses into static/ and re-run the verifier
to regenerate hashes if you intend to update the lock:
  cp $DIST/{pyodide.js,pyodide.asm.js,pyodide.asm.wasm,python_stdlib.zip,pyodide-lock.json,*.whl,*.zip} \\
     $REPO_ROOT/static/cdn/pyodide/v$PYODIDE_VERSION/full/

NOTE: source-built binaries may differ byte-for-byte from the vendored ones.
If you adopt them, regenerate scripts/vendor/pyodide-assets.lock.json hashes.
EOF
