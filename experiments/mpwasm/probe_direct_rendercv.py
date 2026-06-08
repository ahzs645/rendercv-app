"""Probe 1: can MicroPython-WASM import the vendored RenderCV wheel directly?

This unpacks the RenderCV wheel plus its dependency wheels into a site dir,
then asks a MicroPython-WASM sandbox to import them. It is expected to FAIL on
some imports (pydantic_core etc. are CPython/Pyodide-compiled extensions, and
MicroPython only supports a subset of CPython). The point is to get the exact
blocker instead of guessing.

Run:
    uv run --prerelease allow --with micropython-wasm \
        python experiments/mpwasm/probe_direct_rendercv.py
"""

from pathlib import Path
from zipfile import ZipFile

from micropython_wasm import MicroPythonWasmError, run

HERE = Path(__file__).resolve().parent
REPO_ROOT = HERE.parents[1]

INPUT_DIR = HERE / ".mp-input"
SITE_DIR = INPUT_DIR / "site"
SITE_DIR.mkdir(parents=True, exist_ok=True)

# RenderCV itself.
rendercv_wheels = sorted((REPO_ROOT / "static").glob("rendercv-*.whl"))

# Dependency wheels live in TWO places in this repo:
#   static/cdn/pypi-wheels/          -> pure-Python deps (markdown, phonenumbers, ...)
#   static/cdn/pyodide/<ver>/full/   -> pydantic, jinja2, ruamel.yaml, markupsafe, ...
# Several of the pyodide ones are cp313 wasm32 *compiled* wheels — they target
# Pyodide's WASM ABI, not MicroPython, so they will not import here. That's an
# expected, informative failure.
dependency_wheels = sorted((REPO_ROOT / "static" / "cdn" / "pypi-wheels").glob("*.whl"))
dependency_wheels += sorted(
    (REPO_ROOT / "static" / "cdn" / "pyodide").glob("v*/full/*.whl")
)

if not rendercv_wheels:
    raise SystemExit("Could not find static/rendercv-*.whl")

wheels = rendercv_wheels + dependency_wheels

print("Unpacking wheels into", SITE_DIR.relative_to(REPO_ROOT))
for wheel in wheels:
    tag = " (compiled/wasm)" if "wasm32" in wheel.name else ""
    print(" -", wheel.relative_to(REPO_ROOT), tag)
    with ZipFile(wheel) as archive:
        archive.extractall(SITE_DIR)

code = r"""
import sys

sys.path.append("/input/site")

print("MicroPython sys.path:")
for item in sys.path:
    print(" ", item)

print("\nImport probes:")

for module_name in [
    "rendercv",
    "jinja2",
    "markdown",
    "phonenumbers",
    "pydantic",
    "pydantic_extra_types",
    "ruamel.yaml",
]:
    try:
        __import__(module_name)
        print(module_name + ": OK")
    except Exception as e:
        print(module_name + ": FAIL: " + type(e).__name__ + ": " + str(e))

print("\nRenderCV builder probe:")

try:
    from rendercv.schema.rendercv_model_builder import build_rendercv_dictionary_and_model
    from rendercv.renderer.templater.templater import render_full_template
    print("RenderCV core imports: OK")
except Exception as e:
    print("RenderCV core imports: FAIL: " + type(e).__name__ + ": " + str(e))
"""

try:
    result = run(
        code,
        readonly_dir=INPUT_DIR,
        memory_bytes=64 * 1024 * 1024,
        fuel=80_000_000,
        wall_timeout_seconds=5.0,
    )
except MicroPythonWasmError as exc:
    print("MicroPython-WASM trapped or exited:")
    print(exc)
else:
    print(result.stdout, end="")
    if result.stderr:
        print("\nSTDERR:")
        print(result.stderr)
