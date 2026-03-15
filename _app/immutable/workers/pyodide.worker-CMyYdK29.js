(()=>{var u=self.location.origin+"/rendercv-app/cdn/pyodide/v0.29.3/full/pyodide.js";importScripts(u);var l=globalThis.loadPyodide;var c=`# ruff: noqa: F821

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
`;var s,g=`
from rendercv.schema.rendercv_model_builder import build_rendercv_dictionary_and_model, BuildRendercvModelArguments
from rendercv.renderer.templater.templater import render_full_template
from rendercv.exception import RenderCVUserValidationError
from dataclasses import asdict
`,y="rendercv-2.7-pyodide-0.29.3-v1",b="pyodide-pkg-cache",i="packages";function m(){return new Promise((t,e)=>{let a=indexedDB.open(b,1);a.onupgradeneeded=n=>{let r=n.target.result;r.objectStoreNames.contains(i)||r.createObjectStore(i)},a.onsuccess=n=>t(n.target.result),a.onerror=n=>e(n.target.error)})}function d(t,e){return new Promise((a,n)=>{let r=t.transaction(i,"readonly").objectStore(i).get(e);r.onsuccess=()=>a(r.result),r.onerror=()=>n(r.error)})}function p(t,e,a){return new Promise((n,r)=>{let o=t.transaction(i,"readwrite").objectStore(i).put(a,e);o.onsuccess=()=>n(),o.onerror=()=>r(o.error)})}async function w(t){try{let e=await m();if(await d(e,"version")!==y)return e.close(),!1;let n=await d(e,"tarball");return e.close(),n?(t.globals.set("_cache_bytes",n),await t.runPythonAsync(`
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
`);let a=t.globals.get("_tarball_bytes").toJs();return t.globals.delete("_tarball_bytes"),a}async function v(t){try{let e=await m();await p(e,"tarball",t),await p(e,"version",y),e.close()}catch(e){console.warn("[pyodide] package cache save failed:",e)}}async function P(){s=await l({indexURL:self.location.origin+"/rendercv-app/cdn/pyodide/v0.29.3/full/"}),await s.loadPackage(["micropip","typing-inspection"]);let t=s.pyimport("micropip");if(!await w(s)){let a=new Set(s.runPython("import os, sysconfig; list(os.listdir(sysconfig.get_path('purelib')))").toJs()),n=`${self.location.origin}/rendercv-app`;await t.install([`${n}/cdn/pypi-wheels/dnspython-2.8.0-py3-none-any.whl`,`${n}/cdn/pypi-wheels/email_validator-2.3.0-py3-none-any.whl`,`${n}/rendercv-2.7-py3-none-any.whl`,`${n}/cdn/pypi-wheels/phonenumbers-9.0.26-py2.py3-none-any.whl`,`${n}/cdn/pypi-wheels/markdown-3.10.2-py3-none-any.whl`,`${n}/cdn/pypi-wheels/pydantic_extra_types-2.11.0-py3-none-any.whl`,`${n}/cdn/pypi-wheels/ruamel_yaml-0.19.1-py3-none-any.whl`]);let o=[...new Set(s.runPython("import os, sysconfig; list(os.listdir(sysconfig.get_path('purelib')))").toJs())].filter(f=>!a.has(f)),_=await h(s,o);v(_)}await s.runPythonAsync(g)}self.onmessage=async t=>{let{id:e,type:a,payload:n}=t.data;try{switch(a){case"INIT":await P(),self.postMessage({id:e,type:"INIT_SUCCESS"});break;case"RENDER":{let r=n;for(let o of["cv","design","locale","settings"])s.globals.set(`yaml_input_${o}`,r[o]);self.postMessage({id:e,type:"RENDER_SUCCESS",payload:(await s.runPythonAsync(c)).toJs()});break}}}catch(r){self.postMessage({id:e,type:"ERROR",payload:r instanceof Error?{message:r.message,name:r.name,stack:r.stack}:{message:String(r),name:"Error",stack:void 0}})}};})();
