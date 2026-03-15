let d;const u=new Promise(n=>{d=n}),g=self.location.origin+"/rendercv-app/cdn/pyodide/v0.29.3/full/pyodide.js";fetch(g).then(n=>n.text()).then(n=>{(0,eval)(n),d(void 0)});function w(){return globalThis.loadPyodide}var b=`# ruff: noqa: F821

from rendercv.schema.rendercv_model_builder import (
    build_rendercv_dictionary_and_model,
    BuildRendercvModelArguments,
)
from rendercv.renderer.templater.templater import render_full_template
from rendercv.exception import RenderCVUserValidationError
from dataclasses import asdict

yaml_input_cv: str  # Set by Pyodide via pyodide.globals.set()
yaml_input_design: str
yaml_input_locale: str
yaml_input_settings: str

kwargs: BuildRendercvModelArguments = {}
kwargs["design_yaml_file"] = yaml_input_design
kwargs["locale_yaml_file"] = yaml_input_locale
kwargs["settings_yaml_file"] = yaml_input_settings

try:
    dictionary, model = build_rendercv_dictionary_and_model(
        yaml_input_cv,
        **kwargs,
    )
except RenderCVUserValidationError as e:
    formatted_errors = []
    for error in e.validation_errors:
        formatted_errors.append(asdict(error))
    result = {"content": None, "errors": formatted_errors}
except Exception as e:
    result = {
        "content": None,
        "errors": [
            {
                "message": str(e),
                "schema_location": [],
                "input": "",
                "yaml_source": "main_yaml_file",
                "yaml_location": None,
            }
        ],
    }
else:
    result = {"content": render_full_template(model, "typst"), "errors": None}

result
`;let o;const h=`
from rendercv.schema.rendercv_model_builder import build_rendercv_dictionary_and_model, BuildRendercvModelArguments
from rendercv.renderer.templater.templater import render_full_template
from rendercv.exception import RenderCVUserValidationError
from dataclasses import asdict
`,p="rendercv-2.7-pyodide-0.29.3-v1",v="pyodide-pkg-cache",i="packages";function y(){return new Promise((n,e)=>{const a=indexedDB.open(v,1);a.onupgradeneeded=r=>{const t=r.target.result;t.objectStoreNames.contains(i)||t.createObjectStore(i)},a.onsuccess=r=>n(r.target.result),a.onerror=r=>e(r.target.error)})}function l(n,e){return new Promise((a,r)=>{const t=n.transaction(i,"readonly").objectStore(i).get(e);t.onsuccess=()=>a(t.result),t.onerror=()=>r(t.error)})}function c(n,e,a){return new Promise((r,t)=>{const s=n.transaction(i,"readwrite").objectStore(i).put(a,e);s.onsuccess=()=>r(),s.onerror=()=>t(s.error)})}async function P(n){try{const e=await y();if(await l(e,"version")!==p)return e.close(),!1;const r=await l(e,"tarball");return e.close(),r?(n.globals.set("_cache_bytes",r),await n.runPythonAsync(`
import tarfile, io, sysconfig
sp = sysconfig.get_path('purelib')
with tarfile.open(fileobj=io.BytesIO(bytes(_cache_bytes.to_py())), mode='r') as tar:
    tar.extractall(sp)
del _cache_bytes
`),!0):!1}catch(e){return console.warn("[pyodide] package cache restore failed:",e),!1}}async function E(n,e){n.globals.set("_new_entries",n.toPy(e)),await n.runPythonAsync(`
import tarfile, io, os, sysconfig
sp = sysconfig.get_path('purelib')
buf = io.BytesIO()
with tarfile.open(fileobj=buf, mode='w') as tar:  # uncompressed: fast write/read
    for name in _new_entries:
        path = f'{sp}/{name}'
        if os.path.exists(path):
            tar.add(path, arcname=name)
del _new_entries
_tarball_bytes = buf.getvalue()
`);const a=n.globals.get("_tarball_bytes").toJs();return n.globals.delete("_tarball_bytes"),a}async function R(n){try{const e=await y();await c(e,"tarball",n),await c(e,"version",p),e.close()}catch(e){console.warn("[pyodide] package cache save failed:",e)}}async function k(){await u,o=await w()({indexURL:self.location.origin+"/rendercv-app/cdn/pyodide/v0.29.3/full/"}),await o.loadPackage(["micropip","typing-inspection"]);const e=o.pyimport("micropip");if(!await P(o)){const r=new Set(o.runPython("import os, sysconfig; list(os.listdir(sysconfig.get_path('purelib')))").toJs()),t=`${self.location.origin}/rendercv-app`;await e.install([`${t}/cdn/pypi-wheels/dnspython-2.8.0-py3-none-any.whl`,`${t}/cdn/pypi-wheels/email_validator-2.3.0-py3-none-any.whl`,`${t}/rendercv-2.7-py3-none-any.whl`,`${t}/cdn/pypi-wheels/phonenumbers-9.0.26-py2.py3-none-any.whl`,`${t}/cdn/pypi-wheels/markdown-3.10.2-py3-none-any.whl`,`${t}/cdn/pypi-wheels/pydantic_extra_types-2.11.0-py3-none-any.whl`,`${t}/cdn/pypi-wheels/ruamel_yaml-0.19.1-py3-none-any.whl`]);const _=[...new Set(o.runPython("import os, sysconfig; list(os.listdir(sysconfig.get_path('purelib')))").toJs())].filter(f=>!r.has(f)),m=await E(o,_);R(m)}await o.runPythonAsync(h)}self.onmessage=async n=>{const{id:e,type:a,payload:r}=n.data;try{switch(a){case"INIT":await k(),self.postMessage({id:e,type:"INIT_SUCCESS"});break;case"RENDER":{const t=r;for(const s of["cv","design","locale","settings"])o.globals.set(`yaml_input_${s}`,t[s]);self.postMessage({id:e,type:"RENDER_SUCCESS",payload:(await o.runPythonAsync(b)).toJs()});break}}}catch(t){self.postMessage({id:e,type:"ERROR",payload:t instanceof Error?{message:t.message,name:t.name,stack:t.stack}:{message:String(t),name:"Error",stack:void 0}})}};
