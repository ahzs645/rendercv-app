const m=self.location.origin+"/rendercv-app/cdn/pyodide/v0.29.3/full/pyodide.js";importScripts(m);const f=globalThis.loadPyodide;var u=`# ruff: noqa: F821

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
`;let o;const g=`
from rendercv.schema.rendercv_model_builder import build_rendercv_dictionary_and_model, BuildRendercvModelArguments
from rendercv.renderer.templater.templater import render_full_template
from rendercv.exception import RenderCVUserValidationError
from dataclasses import asdict
`,d="rendercv-2.7-pyodide-0.29.3-v1",w="pyodide-pkg-cache",i="packages";function p(){return new Promise((t,e)=>{const a=indexedDB.open(w,1);a.onupgradeneeded=n=>{const r=n.target.result;r.objectStoreNames.contains(i)||r.createObjectStore(i)},a.onsuccess=n=>t(n.target.result),a.onerror=n=>e(n.target.error)})}function l(t,e){return new Promise((a,n)=>{const r=t.transaction(i,"readonly").objectStore(i).get(e);r.onsuccess=()=>a(r.result),r.onerror=()=>n(r.error)})}function c(t,e,a){return new Promise((n,r)=>{const s=t.transaction(i,"readwrite").objectStore(i).put(a,e);s.onsuccess=()=>n(),s.onerror=()=>r(s.error)})}async function b(t){try{const e=await p();if(await l(e,"version")!==d)return e.close(),!1;const n=await l(e,"tarball");return e.close(),n?(t.globals.set("_cache_bytes",n),await t.runPythonAsync(`
import tarfile, io, sysconfig
sp = sysconfig.get_path('purelib')
with tarfile.open(fileobj=io.BytesIO(bytes(_cache_bytes.to_py())), mode='r') as tar:
    tar.extractall(sp)
del _cache_bytes
`),!0):!1}catch(e){return console.warn("[pyodide] package cache restore failed:",e),!1}}async function h(t,e){t.globals.set("_new_entries",t.toPy(e)),await t.runPythonAsync(`
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
`);const a=t.globals.get("_tarball_bytes").toJs();return t.globals.delete("_tarball_bytes"),a}async function v(t){try{const e=await p();await c(e,"tarball",t),await c(e,"version",d),e.close()}catch(e){console.warn("[pyodide] package cache save failed:",e)}}async function E(){o=await f({indexURL:self.location.origin+"/rendercv-app/cdn/pyodide/v0.29.3/full/"}),await o.loadPackage(["micropip","typing-inspection"]);const t=o.pyimport("micropip");if(!await b(o)){const a=new Set(o.runPython("import os, sysconfig; list(os.listdir(sysconfig.get_path('purelib')))").toJs()),n=`${self.location.origin}/rendercv-app`;await t.install([`${n}/cdn/pypi-wheels/dnspython-2.8.0-py3-none-any.whl`,`${n}/cdn/pypi-wheels/email_validator-2.3.0-py3-none-any.whl`,`${n}/rendercv-2.7-py3-none-any.whl`,`${n}/cdn/pypi-wheels/phonenumbers-9.0.26-py2.py3-none-any.whl`,`${n}/cdn/pypi-wheels/markdown-3.10.2-py3-none-any.whl`,`${n}/cdn/pypi-wheels/pydantic_extra_types-2.11.0-py3-none-any.whl`,`${n}/cdn/pypi-wheels/ruamel_yaml-0.19.1-py3-none-any.whl`]);const s=[...new Set(o.runPython("import os, sysconfig; list(os.listdir(sysconfig.get_path('purelib')))").toJs())].filter(_=>!a.has(_)),y=await h(o,s);v(y)}await o.runPythonAsync(g)}self.onmessage=async t=>{const{id:e,type:a,payload:n}=t.data;try{switch(a){case"INIT":await E(),self.postMessage({id:e,type:"INIT_SUCCESS"});break;case"RENDER":{const r=n;for(const s of["cv","design","locale","settings"])o.globals.set(`yaml_input_${s}`,r[s]);self.postMessage({id:e,type:"RENDER_SUCCESS",payload:(await o.runPythonAsync(u)).toJs()});break}}}catch(r){self.postMessage({id:e,type:"ERROR",payload:r instanceof Error?{message:r.message,name:r.name,stack:r.stack}:{message:String(r),name:"Error",stack:void 0}})}};
