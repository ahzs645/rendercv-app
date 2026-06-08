# MicroPython-WASM probes for RenderCV

Two throwaway experiments testing whether [simonw/micropython-wasm](https://github.com/simonw/micropython-wasm)
is usable with this repo. This is a sidecar experiment — it does **not** touch
`apps/web/src/features/viewer/pyodide.worker.ts` or the Pyodide pipeline.

## Probe 1 — direct: can MicroPython import the RenderCV wheel?

```bash
uv run --prerelease allow --with micropython-wasm \
    python experiments/mpwasm/probe_direct_rendercv.py
```

**Result: NO.** Imports fail immediately on MicroPython stdlib gaps and
unsupported CPython features:

```
rendercv:             FAIL  ImportError: no module named 'warnings'
jinja2:               FAIL  ImportError: no module named 'fnmatch'
markdown / ruamel:    FAIL  ImportError: no module named '__future__'
pydantic:             FAIL  ImportError: no module named 'importlib'
phonenumbers:         FAIL  NotImplementedError: unicode name escapes
```

RenderCV (Python >=3.12, CPython/Pyodide deps) cannot run inside MicroPython-WASM
without a major port. The pyodide deps also include `cp313 ... wasm32` *compiled*
wheels (`pydantic_core`, `markupsafe`, `ssl`) that target Pyodide's ABI, not
MicroPython, so they can never import here regardless.

## Probe 2 — bridge: MicroPython sandbox calling host CPython RenderCV

```bash
uv run --python 3.12 --prerelease allow \
    --with micropython-wasm --with rendercv \
    python experiments/mpwasm/bridge_rendercv_host.py
```

**Result: YES.** The untrusted guest runs in the sandbox and reaches RenderCV
only through registered host functions (`get_cv_yaml`, `rendercv_to_typst`).
Output: `ok: True` plus valid Typst for `sample-cv.yaml`.

### Gotcha learned

Do **not** embed the CV YAML as a literal in the guest source — compiling a
multi-hundred-line string literal exhausts MicroPython's fuel before any real
work runs (`wasm trap: all fuel consumed`). Pass payloads across the boundary via
a host call instead. Fuel/memory were also raised (200M fuel, 64 MiB).

## Takeaway

MicroPython-WASM is **not** a replacement for the Pyodide worker. It is viable
only as a sandboxed scripting layer *around* RenderCV:

```
user/custom script in MicroPython sandbox
        ↓ JSON only
host function (CPython or existing Pyodide/RenderCV path)
        ↓
Typst output → existing Typst WASM renderer
```
