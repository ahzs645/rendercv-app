"""Probe 2: MicroPython-WASM as a sandboxed scripting layer over host RenderCV.

The untrusted guest code runs inside the MicroPython-WASM sandbox and can only
reach RenderCV through a registered host function. The actual import/render
happens in trusted host CPython. Values cross the WASM boundary as
JSON-compatible data.

Run (RenderCV must be installed in the host interpreter):
    uv run --python 3.12 --prerelease allow \
        --with micropython-wasm \
        --with rendercv \
        python experiments/mpwasm/bridge_rendercv_host.py
"""

from dataclasses import asdict
from pathlib import Path

from micropython_wasm import MicroPythonSession

from rendercv.exception import RenderCVUserValidationError
from rendercv.renderer.templater.templater import render_full_template
from rendercv.schema.rendercv_model_builder import build_rendercv_dictionary_and_model


def rendercv_to_typst(
    cv_yaml: str,
    design_yaml: str = "",
    locale_yaml: str = "",
    settings_yaml: str = "",
):
    kwargs = {}

    if design_yaml.strip():
        kwargs["design_yaml_file"] = design_yaml
    if locale_yaml.strip():
        kwargs["locale_yaml_file"] = locale_yaml
    if settings_yaml.strip():
        kwargs["settings_yaml_file"] = settings_yaml

    try:
        _, model = build_rendercv_dictionary_and_model(cv_yaml, **kwargs)
        typst = render_full_template(model, "typst")
        return {
            "ok": True,
            "typst": typst,
            "typst_preview": typst[:1000],
        }
    except RenderCVUserValidationError as exc:
        return {
            "ok": False,
            "errors": [asdict(error) for error in exc.validation_errors],
        }
    except Exception as exc:
        return {
            "ok": False,
            "errors": [{"message": f"{type(exc).__name__}: {exc}"}],
        }


sample_path = Path(__file__).resolve().parent / "sample-cv.yaml"

if not sample_path.exists():
    raise SystemExit(
        "Create experiments/mpwasm/sample-cv.yaml using a known-good RenderCV YAML file."
    )

cv_yaml = sample_path.read_text()


def get_cv_yaml():
    # Hand the YAML across the boundary via a host call instead of embedding it
    # as a multi-hundred-line literal in the guest source — compiling such a
    # literal exhausts MicroPython's fuel before any real work happens.
    return cv_yaml


# The guest stays tiny: fetch input from the host, render via the host, report.
guest_code = """
cv_yaml = get_cv_yaml()

result = rendercv_to_typst(cv_yaml)

print("ok:", result["ok"])

if result["ok"]:
    print(result["typst_preview"])
else:
    print(result["errors"])
"""

with MicroPythonSession(
    memory_bytes=64 * 1024 * 1024,
    fuel=200_000_000,
    wall_timeout_seconds=15.0,
    host_functions={
        "rendercv_to_typst": rendercv_to_typst,
        "get_cv_yaml": get_cv_yaml,
    },
) as session:
    result = session.run(guest_code)
    print(result.stdout, end="")
    if result.stderr:
        print(result.stderr)
