import"./ByOw0j-_.js";import{bs as jn,F as zn,G as Vn,bE as Kn,T as qn,V as Xn,m as _,bF as He,ae as Qn,l as c,k as u,au as W,E as T,D as A,a5 as Zn,a4 as Ue,a6 as $n,w as et,y as x,u as be,a0 as nt,e as D,g as O,a as L,h as U,i as J,p as Y,a3 as tt,b as B,bD as nn}from"./B8rkFjSR.js";import{k as rt,o as v,m as it,u as st}from"./AsXOyNMW.js";import{i as ot}from"./BrmJDgF5.js";import{p as w}from"./D8bmV50U.js";import{d as fe}from"./BfEvuyO9.js";(function(){try{var t=typeof window<"u"?window:typeof global<"u"?global:typeof globalThis<"u"?globalThis:typeof self<"u"?self:{};t.SENTRY_RELEASE={id:"76bcf360fb07e886594c24bd10902611b0c2f23a"};var e=new t.Error().stack;e&&(t._sentryDebugIds=t._sentryDebugIds||{},t._sentryDebugIds[e]="2970289e-ef7d-4ed4-9c9d-9804386ac6cf",t._sentryDebugIdIdentifier="sentry-dbid-2970289e-ef7d-4ed4-9c9d-9804386ac6cf")}catch{}})();function at(){return Symbol(jn)}const ct=Symbol("NaN");function lt(t,e,n){zn&&Vn();var r=new Xn(t),i=!Kn();qn(()=>{var s=e();s!==s&&(s=ct),i&&s!==null&&typeof s=="object"&&(s={}),r.ensure(s,n)})}class ut extends Map{#e=new Map;#n=_(0);#t=_(0);#r=He||-1;constructor(e){if(super(),e){for(var[n,r]of e)super.set(n,r);this.#t.v=super.size}}#i(e){return He===this.#r?_(e):Qn(e)}has(e){var n=this.#e,r=n.get(e);if(r===void 0){var i=super.get(e);if(i!==void 0)r=this.#i(0),n.set(e,r);else return c(this.#n),!1}return c(r),!0}forEach(e,n){this.#s(),super.forEach(e,n)}get(e){var n=this.#e,r=n.get(e);if(r===void 0){var i=super.get(e);if(i!==void 0)r=this.#i(0),n.set(e,r);else{c(this.#n);return}}return c(r),super.get(e)}set(e,n){var r=this.#e,i=r.get(e),s=super.get(e),o=super.set(e,n),a=this.#n;if(i===void 0)i=this.#i(0),r.set(e,i),u(this.#t,super.size),W(a);else if(s!==n){W(i);var l=a.reactions===null?null:new Set(a.reactions),d=l===null||!i.reactions?.every(p=>l.has(p));d&&W(a)}return o}delete(e){var n=this.#e,r=n.get(e),i=super.delete(e);return r!==void 0&&(n.delete(e),u(this.#t,super.size),u(r,-1),W(this.#n)),i}clear(){if(super.size!==0){super.clear();var e=this.#e;u(this.#t,0);for(var n of e.values())u(n,-1);W(this.#n),e.clear()}}#s(){c(this.#n);var e=this.#e;if(this.#t.v!==e.size){for(var n of super.keys())if(!e.has(n)){var r=this.#i(0);e.set(n,r)}}for([,r]of this.#e)c(r)}keys(){return c(this.#n),super.keys()}values(){return this.#s(),super.values()}entries(){return this.#s(),super.entries()}[Symbol.iterator](){return this.entries()}get size(){return c(this.#t),super.size}}var Je=/\/\*[^*]*\*+([^/*][^*]*\*+)*\//g,dt=/\n/g,ht=/^\s*/,mt=/^(\*?[-#/*\\\w]+(\[[0-9a-z_-]+\])?)\s*/,pt=/^:\s*/,ft=/^((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^)]*?\)|[^};])+)/,_t=/^[;\s]*/,gt=/^\s+|\s+$/g,bt=`
`,Ye="/",Be="*",k="",yt="comment",At="declaration";function vt(t,e){if(typeof t!="string")throw new TypeError("First argument must be a string");if(!t)return[];e=e||{};var n=1,r=1;function i(f){var m=f.match(dt);m&&(n+=m.length);var S=f.lastIndexOf(bt);r=~S?f.length-S:r+f.length}function s(){var f={line:n,column:r};return function(m){return m.position=new o(f),d(),m}}function o(f){this.start=f,this.end={line:n,column:r},this.source=e.source}o.prototype.content=t;function a(f){var m=new Error(e.source+":"+n+":"+r+": "+f);if(m.reason=f,m.filename=e.source,m.line=n,m.column=r,m.source=t,!e.silent)throw m}function l(f){var m=f.exec(t);if(m){var S=m[0];return i(S),t=t.slice(S.length),m}}function d(){l(ht)}function p(f){var m;for(f=f||[];m=h();)m!==!1&&f.push(m);return f}function h(){var f=s();if(!(Ye!=t.charAt(0)||Be!=t.charAt(1))){for(var m=2;k!=t.charAt(m)&&(Be!=t.charAt(m)||Ye!=t.charAt(m+1));)++m;if(m+=2,k===t.charAt(m-1))return a("End of comment missing");var S=t.slice(2,m-2);return r+=2,i(S),t=t.slice(m),r+=2,f({type:yt,comment:S})}}function y(){var f=s(),m=l(mt);if(m){if(h(),!l(pt))return a("property missing ':'");var S=l(ft),Ge=f({type:At,property:We(m[0].replace(Je,k)),value:S?We(S[0].replace(Je,k)):k});return l(_t),Ge}}function b(){var f=[];p(f);for(var m;m=y();)m!==!1&&(f.push(m),p(f));return f}return d(),b()}function We(t){return t?t.replace(gt,k):k}function wt(t,e){let n=null;if(!t||typeof t!="string")return n;const r=vt(t),i=typeof e=="function";return r.forEach(s=>{if(s.type!=="declaration")return;const{property:o,value:a}=s;i?e(o,a,s):a&&(n=n||{},n[o]=a)}),n}function Tt(t){return typeof t=="function"}function Z(t){return t!==null&&typeof t=="object"}const Et=["string","number","bigint","boolean"];function ye(t){return t==null||Et.includes(typeof t)?!0:Array.isArray(t)?t.every(e=>ye(e)):typeof t=="object"?Object.getPrototypeOf(t)===Object.prototype:!1}const H=Symbol("box"),pe=Symbol("is-writable");function g(t,e){const n=A(t);return e?{[H]:!0,[pe]:!0,get current(){return c(n)},set current(r){e(r)}}:{[H]:!0,get current(){return t()}}}function $(t){return Z(t)&&H in t}function Ee(t){return $(t)&&pe in t}function St(t){return $(t)?t:Tt(t)?g(t):tn(t)}function Mt(t){return Object.entries(t).reduce((e,[n,r])=>$(r)?(Ee(r)?Object.defineProperty(e,n,{get(){return r.current},set(i){r.current=i}}):Object.defineProperty(e,n,{get(){return r.current}}),e):Object.assign(e,{[n]:r}),{})}function It(t){return Ee(t)?{[H]:!0,get current(){return t.current}}:t}function tn(t){let e=_(T(t));return{[H]:!0,[pe]:!0,get current(){return c(e)},set current(n){u(e,n,!0)}}}function G(t){let e=_(T(t));return{[H]:!0,[pe]:!0,get current(){return c(e)},set current(n){u(e,n,!0)}}}G.from=St;G.with=g;G.flatten=Mt;G.readonly=It;G.isBox=$;G.isWritableBox=Ee;function rn(...t){return function(e){for(const n of t)if(n){if(e.defaultPrevented)return;typeof n=="function"?n.call(this,e):n.current?.call(this,e)}}}const Rt=/\d/,Nt=["-","_","/","."];function Ct(t=""){if(!Rt.test(t))return t!==t.toLowerCase()}function Dt(t){const e=[];let n="",r,i;for(const s of t){const o=Nt.includes(s);if(o===!0){e.push(n),n="",r=void 0;continue}const a=Ct(s);if(i===!1){if(r===!1&&a===!0){e.push(n),n=s,r=a;continue}if(r===!0&&a===!1&&n.length>1){const l=n.at(-1);e.push(n.slice(0,Math.max(0,n.length-1))),n=l+s,r=a;continue}}n+=s,r=a,i=o}return e.push(n),e}function sn(t){return t?Dt(t).map(e=>Lt(e)).join(""):""}function Ot(t){return kt(sn(t||""))}function Lt(t){return t?t[0].toUpperCase()+t.slice(1):""}function kt(t){return t?t[0].toLowerCase()+t.slice(1):""}function ie(t){if(!t)return{};const e={};function n(r,i){if(r.startsWith("-moz-")||r.startsWith("-webkit-")||r.startsWith("-ms-")||r.startsWith("-o-")){e[sn(r)]=i;return}if(r.startsWith("--")){e[r]=i;return}e[Ot(r)]=i}return wt(t,n),e}function F(...t){return(...e)=>{for(const n of t)typeof n=="function"&&n(...e)}}function Ft(t,e){const n=RegExp(t,"g");return r=>{if(typeof r!="string")throw new TypeError(`expected an argument of type string, but got ${typeof r}`);return r.match(n)?r.replace(n,e):r}}const Pt=Ft(/[A-Z]/,t=>`-${t.toLowerCase()}`);function xt(t){if(!t||typeof t!="object"||Array.isArray(t))throw new TypeError(`expected an argument of type object, but got ${typeof t}`);return Object.keys(t).map(e=>`${Pt(e)}: ${t[e]};`).join(`
`)}function Gt(t={}){return xt(t).replace(`
`," ")}const Ht=["onabort","onanimationcancel","onanimationend","onanimationiteration","onanimationstart","onauxclick","onbeforeinput","onbeforetoggle","onblur","oncancel","oncanplay","oncanplaythrough","onchange","onclick","onclose","oncompositionend","oncompositionstart","oncompositionupdate","oncontextlost","oncontextmenu","oncontextrestored","oncopy","oncuechange","oncut","ondblclick","ondrag","ondragend","ondragenter","ondragleave","ondragover","ondragstart","ondrop","ondurationchange","onemptied","onended","onerror","onfocus","onfocusin","onfocusout","onformdata","ongotpointercapture","oninput","oninvalid","onkeydown","onkeypress","onkeyup","onload","onloadeddata","onloadedmetadata","onloadstart","onlostpointercapture","onmousedown","onmouseenter","onmouseleave","onmousemove","onmouseout","onmouseover","onmouseup","onpaste","onpause","onplay","onplaying","onpointercancel","onpointerdown","onpointerenter","onpointerleave","onpointermove","onpointerout","onpointerover","onpointerup","onprogress","onratechange","onreset","onresize","onscroll","onscrollend","onsecuritypolicyviolation","onseeked","onseeking","onselect","onselectionchange","onselectstart","onslotchange","onstalled","onsubmit","onsuspend","ontimeupdate","ontoggle","ontouchcancel","ontouchend","ontouchmove","ontouchstart","ontransitioncancel","ontransitionend","ontransitionrun","ontransitionstart","onvolumechange","onwaiting","onwebkitanimationend","onwebkitanimationiteration","onwebkitanimationstart","onwebkittransitionend","onwheel"],Ut=new Set(Ht);function Jt(t){return Ut.has(t)}function Yt(...t){const e={...t[0]};for(let n=1;n<t.length;n++){const r=t[n];if(r){for(const i of Object.keys(r)){const s=e[i],o=r[i],a=typeof s=="function",l=typeof o=="function";if(a&&Jt(i)){const d=s,p=o;e[i]=rn(d,p)}else if(a&&l)e[i]=F(s,o);else if(i==="class"){const d=ye(s),p=ye(o);d&&p?e[i]=fe(s,o):d?e[i]=fe(s):p&&(e[i]=fe(o))}else if(i==="style"){const d=typeof s=="object",p=typeof o=="object",h=typeof s=="string",y=typeof o=="string";if(d&&p)e[i]={...s,...o};else if(d&&y){const b=ie(o);e[i]={...s,...b}}else if(h&&p){const b=ie(s);e[i]={...b,...o}}else if(h&&y){const b=ie(s),f=ie(o);e[i]={...b,...f}}else d?e[i]=s:p?e[i]=o:h?e[i]=s:y&&(e[i]=o)}else e[i]=o!==void 0?o:s}for(const i of Object.getOwnPropertySymbols(r)){const s=e[i],o=r[i];e[i]=o!==void 0?o:s}}}return typeof e.style=="object"&&(e.style=Gt(e.style).replaceAll(`
`," ")),e.hidden===!1&&(e.hidden=void 0,delete e.hidden),e.disabled===!1&&(e.disabled=void 0,delete e.disabled),e}const Bt=typeof window<"u"?window:void 0;function Wt(t){let e=t.activeElement;for(;e?.shadowRoot;){const n=e.shadowRoot.activeElement;if(n===e)break;e=n}return e}class jt{#e;#n;constructor(e={}){const{window:n=Bt,document:r=n?.document}=e;n!==void 0&&(this.#e=r,this.#n=rt(i=>{const s=v(n,"focusin",i),o=v(n,"focusout",i);return()=>{s(),o()}}))}get current(){return this.#n?.(),this.#e?Wt(this.#e):null}}new jt;class ee{#e;#n;constructor(e){this.#e=e,this.#n=Symbol(e)}get key(){return this.#n}exists(){return Zn(this.#n)}get(){const e=Ue(this.#n);if(e===void 0)throw new Error(`Context "${this.#e}" not found`);return e}getOr(e){const n=Ue(this.#n);return n===void 0?e:n}set(e){return $n(this.#n,e)}}function zt(t,e){switch(t){case"post":x(e);break;case"pre":et(e);break}}function on(t,e,n,r={}){const{lazy:i=!1}=r;let s=!i,o=Array.isArray(t)?[]:void 0;zt(e,()=>{const a=Array.isArray(t)?t.map(d=>d()):t();if(!s){s=!0,o=a;return}const l=be(()=>n(a,o));return o=a,l})}function M(t,e,n){on(t,"post",e,n)}function Vt(t,e,n){on(t,"pre",e,n)}M.pre=Vt;function ne(t){x(()=>()=>{t()})}function Kt(t,e){return setTimeout(e,t)}function R(t){nt().then(t)}const qt=1,Xt=9,Qt=11;function Ae(t){return Z(t)&&t.nodeType===qt&&typeof t.nodeName=="string"}function an(t){return Z(t)&&t.nodeType===Xt}function Zt(t){return Z(t)&&t.constructor?.name==="VisualViewport"}function $t(t){return Z(t)&&t.nodeType!==void 0}function cn(t){return $t(t)&&t.nodeType===Qt&&"host"in t}function er(t,e){if(!t||!e||!Ae(t)||!Ae(e))return!1;const n=e.getRootNode?.();if(t===e||t.contains(e))return!0;if(n&&cn(n)){let r=e;for(;r;){if(t===r)return!0;r=r.parentNode||r.host}}return!1}function te(t){return an(t)?t:Zt(t)?t.document:t?.ownerDocument??document}function ln(t){return cn(t)?ln(t.host):an(t)?t.defaultView??window:Ae(t)?t.ownerDocument?.defaultView??window:window}function nr(t){let e=t.activeElement;for(;e?.shadowRoot;){const n=e.shadowRoot.activeElement;if(n===e)break;e=n}return e}class Se{element;#e=A(()=>this.element.current?this.element.current.getRootNode()??document:document);get root(){return c(this.#e)}set root(e){u(this.#e,e)}constructor(e){typeof e=="function"?this.element=g(e):this.element=e}getDocument=()=>te(this.root);getWindow=()=>this.getDocument().defaultView??window;getActiveElement=()=>nr(this.root);isActiveElement=e=>e===this.getActiveElement();getElementById(e){return this.root.getElementById(e)}querySelector=e=>this.root?this.root.querySelector(e):null;querySelectorAll=e=>this.root?this.root.querySelectorAll(e):[];setTimeout=(e,n)=>this.getWindow().setTimeout(e,n);clearTimeout=e=>this.getWindow().clearTimeout(e)}function re(t,e){return{[at()]:n=>$(t)?(t.current=n,be(()=>e?.(n)),()=>{"isConnected"in n&&n.isConnected||(t.current=null,e?.(null))}):(t(n),be(()=>e?.(n)),()=>{"isConnected"in n&&n.isConnected||(t(null),e?.(null))})}}function un(t){return t?"true":"false"}function Fi(t){return t?"true":void 0}function dn(t){return t?"":void 0}function Pi(t){return t?!0:void 0}function hn(t){return t?"open":"closed"}function xi(t){return t?"checked":"unchecked"}function Gi(t,e){return e?"mixed":t?"true":"false"}class tr{#e;#n;attrs;constructor(e){this.#e=e.getVariant?e.getVariant():null,this.#n=this.#e?`data-${this.#e}-`:`data-${e.component}-`,this.getAttr=this.getAttr.bind(this),this.selector=this.selector.bind(this),this.attrs=Object.fromEntries(e.parts.map(n=>[n,this.getAttr(n)]))}getAttr(e,n){return n?`data-${n}-${e}`:`${this.#n}${e}`}selector(e,n){return`[${this.getAttr(e,n)}]`}}function rr(t){const e=new tr(t);return{...e.attrs,selector:e.selector,getAttr:e.getAttr}}const Q="ArrowDown",Me="ArrowLeft",Ie="ArrowRight",ce="ArrowUp",mn="End",pn="Enter",ir="Escape",fn="Home",sr="PageDown",or="PageUp",Re=" ",ar="Tab";function cr(t){return window.getComputedStyle(t).getPropertyValue("direction")}function lr(t="ltr",e="horizontal"){return{horizontal:t==="rtl"?Me:Ie,vertical:Q}[e]}function ur(t="ltr",e="horizontal"){return{horizontal:t==="rtl"?Ie:Me,vertical:ce}[e]}function dr(t="ltr",e="horizontal"){return["ltr","rtl"].includes(t)||(t="ltr"),["horizontal","vertical"].includes(e)||(e="horizontal"),{nextKey:lr(t,e),prevKey:ur(t,e)}}const _n=typeof document<"u",je=hr();function hr(){return _n&&window?.navigator?.userAgent&&(/iP(ad|hone|od)/.test(window.navigator.userAgent)||window?.navigator?.maxTouchPoints>2&&/iPad|Macintosh/.test(window?.navigator.userAgent))}function N(t){return t instanceof HTMLElement}function ve(t){return t instanceof Element}function gn(t){return t instanceof Element||t instanceof SVGElement}function Hi(t){return t.pointerType==="touch"}function Ui(t){return t.matches(":focus-visible")}function Ji(t){return t!==null}function mr(t){return t instanceof HTMLInputElement&&"select"in t}class pr{#e;#n=G(null);constructor(e){this.#e=e}getCandidateNodes(){return this.#e.rootNode.current?this.#e.candidateSelector?Array.from(this.#e.rootNode.current.querySelectorAll(this.#e.candidateSelector)):this.#e.candidateAttr?Array.from(this.#e.rootNode.current.querySelectorAll(`[${this.#e.candidateAttr}]:not([data-disabled])`)):[]:[]}focusFirstCandidate(){const e=this.getCandidateNodes();e.length&&e[0]?.focus()}handleKeydown(e,n,r=!1){const i=this.#e.rootNode.current;if(!i||!e)return;const s=this.getCandidateNodes();if(!s.length)return;const o=s.indexOf(e),a=cr(i),{nextKey:l,prevKey:d}=dr(a,this.#e.orientation.current),p=this.#e.loop.current,h={[l]:o+1,[d]:o-1,[fn]:0,[mn]:s.length-1};if(r){const f=l===Q?Ie:Q,m=d===ce?Me:ce;h[f]=o+1,h[m]=o-1}let y=h[n.key];if(y===void 0)return;n.preventDefault(),y<0&&p?y=s.length-1:y===s.length&&p&&(y=0);const b=s[y];if(b)return b.focus(),this.#n.current=b.id,this.#e.onCandidateFocus?.(b),b}getTabIndex(e){const n=this.getCandidateNodes(),r=this.#n.current!==null;return e&&!r&&n[0]===e?(this.#n.current=e.id,0):e?.id===this.#n.current?0:-1}setCurrentTabStopId(e){this.#n.current=e}focusCurrentTabStop(){const e=this.#n.current;if(!e)return;const n=this.#e.rootNode.current?.querySelector(`#${e}`);!n||!N(n)||n.focus()}}class fr{#e;#n=null;constructor(e){this.#e=e,ne(()=>this.#t())}#t(){this.#n&&(window.cancelAnimationFrame(this.#n),this.#n=null)}run(e){this.#t();const n=this.#e.ref.current;if(n){if(typeof n.getAnimations!="function"){this.#r(e);return}this.#n=window.requestAnimationFrame(()=>{const r=n.getAnimations();if(r.length===0){this.#r(e);return}Promise.allSettled(r.map(i=>i.finished)).then(()=>{this.#r(e)})})}}#r(e){const n=()=>{e()};this.#e.afterTick?R(n):n()}}class _r{#e;#n;#t;#r=_(!1);constructor(e){this.#e=e,u(this.#r,e.open.current,!0),this.#n=e.enabled??!0,this.#t=new fr({ref:this.#e.ref,afterTick:this.#e.open}),M(()=>this.#e.open.current,n=>{n&&u(this.#r,!0),this.#n&&this.#t.run(()=>{n===this.#e.open.current&&(this.#e.open.current||u(this.#r,!1),this.#e.onComplete?.())})})}get shouldRender(){return c(this.#r)}}function E(){}function Yi(t,e){return`bits-${t}`}function gr(t,e){var n=D(),r=O(n);lt(r,()=>e.children,i=>{var s=D(),o=O(s);U(o,()=>e.children??J),L(i,s)}),L(t,n)}const br=new ee("BitsConfig");function yr(){const t=new Ar(null,{});return br.getOr(t).opts}class Ar{opts;constructor(e,n){const r=vr(e,n);this.opts={defaultPortalTo:r(i=>i.defaultPortalTo),defaultLocale:r(i=>i.defaultLocale)}}}function vr(t,e){return n=>g(()=>{const i=n(e)?.current;if(i!==void 0)return i;if(t!==null)return n(t.opts)?.current})}function wr(t,e){return n=>{const r=yr();return g(()=>{const i=n();if(i!==void 0)return i;const s=t(r).current;return s!==void 0?s:e})}}const Tr=wr(t=>t.defaultPortalTo,"body");function Bi(t,e){Y(e,!0);const n=Tr(()=>e.to),r=tt();let i=A(s);function s(){if(!_n||e.disabled)return null;let h=null;return typeof n.current=="string"?h=document.querySelector(n.current):h=n.current,h}let o;function a(){o&&(st(o),o=null)}M([()=>c(i),()=>e.disabled],([h,y])=>{if(!h||y){a();return}return o=it(gr,{target:h,props:{children:e.children},context:r}),()=>{a()}});var l=D(),d=O(l);{var p=h=>{var y=D(),b=O(y);U(b,()=>e.children??J),L(h,y)};ot(d,h=>{e.disabled&&h(p)})}L(t,l),B()}class Er{eventName;options;constructor(e,n={bubbles:!0,cancelable:!0}){this.eventName=e,this.options=n}createEvent(e){return new CustomEvent(this.eventName,{...this.options,detail:e})}dispatch(e,n){const r=this.createEvent(n);return e.dispatchEvent(r),r}listen(e,n,r){const i=s=>{n(s)};return v(e,this.eventName,i,r)}}function ze(t,e=500){let n=null;const r=(...i)=>{n!==null&&clearTimeout(n),n=setTimeout(()=>{t(...i)},e)};return r.destroy=()=>{n!==null&&(clearTimeout(n),n=null)},r}function bn(t,e){return t===e||t.contains(e)}function yn(t){return t?.ownerDocument??document}function Sr(t,e){const{clientX:n,clientY:r}=t,i=e.getBoundingClientRect();return n<i.left||n>i.right||r<i.top||r>i.bottom}const Mr=[pn,Re],Ir=[Q,or,fn],An=[ce,sr,mn],Rr=[...Ir,...An];function Ve(t){return t.pointerType==="mouse"}function Nr(t,{select:e=!1}={}){if(!t||!t.focus)return;const n=te(t);if(n.activeElement===t)return;const r=n.activeElement;t.focus({preventScroll:!0}),t!==r&&mr(t)&&e&&t.select()}function Cr(t,{select:e=!1}={},n){const r=n();for(const i of t)if(Nr(i,{select:e}),n()!==r)return!0}let j=_(!1);class C{static _refs=0;static _cleanup;constructor(){x(()=>(C._refs===0&&(C._cleanup=nn(()=>{const e=[],n=i=>{u(j,!1)},r=i=>{u(j,!0)};return e.push(v(document,"pointerdown",n,{capture:!0}),v(document,"pointermove",n,{capture:!0}),v(document,"keydown",r,{capture:!0})),F(...e)})),C._refs++,()=>{C._refs--,C._refs===0&&(u(j,!1),C._cleanup?.())}))}get current(){return c(j)}set current(e){u(j,e,!0)}}var vn=["input:not([inert]):not([inert] *)","select:not([inert]):not([inert] *)","textarea:not([inert]):not([inert] *)","a[href]:not([inert]):not([inert] *)","button:not([inert]):not([inert] *)","[tabindex]:not(slot):not([inert]):not([inert] *)","audio[controls]:not([inert]):not([inert] *)","video[controls]:not([inert]):not([inert] *)",'[contenteditable]:not([contenteditable="false"]):not([inert]):not([inert] *)',"details>summary:first-of-type:not([inert]):not([inert] *)","details:not([inert]):not([inert] *)"],le=vn.join(","),wn=typeof Element>"u",P=wn?function(){}:Element.prototype.matches||Element.prototype.msMatchesSelector||Element.prototype.webkitMatchesSelector,ue=!wn&&Element.prototype.getRootNode?function(t){var e;return t==null||(e=t.getRootNode)===null||e===void 0?void 0:e.call(t)}:function(t){return t?.ownerDocument},de=function(e,n){var r;n===void 0&&(n=!0);var i=e==null||(r=e.getAttribute)===null||r===void 0?void 0:r.call(e,"inert"),s=i===""||i==="true",o=s||n&&e&&(typeof e.closest=="function"?e.closest("[inert]"):de(e.parentNode));return o},Dr=function(e){var n,r=e==null||(n=e.getAttribute)===null||n===void 0?void 0:n.call(e,"contenteditable");return r===""||r==="true"},Tn=function(e,n,r){if(de(e))return[];var i=Array.prototype.slice.apply(e.querySelectorAll(le));return n&&P.call(e,le)&&i.unshift(e),i=i.filter(r),i},he=function(e,n,r){for(var i=[],s=Array.from(e);s.length;){var o=s.shift();if(!de(o,!1))if(o.tagName==="SLOT"){var a=o.assignedElements(),l=a.length?a:o.children,d=he(l,!0,r);r.flatten?i.push.apply(i,d):i.push({scopeParent:o,candidates:d})}else{var p=P.call(o,le);p&&r.filter(o)&&(n||!e.includes(o))&&i.push(o);var h=o.shadowRoot||typeof r.getShadowRoot=="function"&&r.getShadowRoot(o),y=!de(h,!1)&&(!r.shadowRootFilter||r.shadowRootFilter(o));if(h&&y){var b=he(h===!0?o.children:h.children,!0,r);r.flatten?i.push.apply(i,b):i.push({scopeParent:o,candidates:b})}else s.unshift.apply(s,o.children)}}return i},En=function(e){return!isNaN(parseInt(e.getAttribute("tabindex"),10))},Sn=function(e){if(!e)throw new Error("No node provided");return e.tabIndex<0&&(/^(AUDIO|VIDEO|DETAILS)$/.test(e.tagName)||Dr(e))&&!En(e)?0:e.tabIndex},Or=function(e,n){var r=Sn(e);return r<0&&n&&!En(e)?0:r},Lr=function(e,n){return e.tabIndex===n.tabIndex?e.documentOrder-n.documentOrder:e.tabIndex-n.tabIndex},Mn=function(e){return e.tagName==="INPUT"},kr=function(e){return Mn(e)&&e.type==="hidden"},Fr=function(e){var n=e.tagName==="DETAILS"&&Array.prototype.slice.apply(e.children).some(function(r){return r.tagName==="SUMMARY"});return n},Pr=function(e,n){for(var r=0;r<e.length;r++)if(e[r].checked&&e[r].form===n)return e[r]},xr=function(e){if(!e.name)return!0;var n=e.form||ue(e),r=function(a){return n.querySelectorAll('input[type="radio"][name="'+a+'"]')},i;if(typeof window<"u"&&typeof window.CSS<"u"&&typeof window.CSS.escape=="function")i=r(window.CSS.escape(e.name));else try{i=r(e.name)}catch(o){return console.error("Looks like you have a radio button with a name attribute containing invalid CSS selector characters and need the CSS.escape polyfill: %s",o.message),!1}var s=Pr(i,e.form);return!s||s===e},Gr=function(e){return Mn(e)&&e.type==="radio"},Hr=function(e){return Gr(e)&&!xr(e)},Ur=function(e){var n,r=e&&ue(e),i=(n=r)===null||n===void 0?void 0:n.host,s=!1;if(r&&r!==e){var o,a,l;for(s=!!((o=i)!==null&&o!==void 0&&(a=o.ownerDocument)!==null&&a!==void 0&&a.contains(i)||e!=null&&(l=e.ownerDocument)!==null&&l!==void 0&&l.contains(e));!s&&i;){var d,p,h;r=ue(i),i=(d=r)===null||d===void 0?void 0:d.host,s=!!((p=i)!==null&&p!==void 0&&(h=p.ownerDocument)!==null&&h!==void 0&&h.contains(i))}}return s},Ke=function(e){var n=e.getBoundingClientRect(),r=n.width,i=n.height;return r===0&&i===0},Jr=function(e,n){var r=n.displayCheck,i=n.getShadowRoot;if(r==="full-native"&&"checkVisibility"in e){var s=e.checkVisibility({checkOpacity:!1,opacityProperty:!1,contentVisibilityAuto:!0,visibilityProperty:!0,checkVisibilityCSS:!0});return!s}if(getComputedStyle(e).visibility==="hidden")return!0;var o=P.call(e,"details>summary:first-of-type"),a=o?e.parentElement:e;if(P.call(a,"details:not([open]) *"))return!0;if(!r||r==="full"||r==="full-native"||r==="legacy-full"){if(typeof i=="function"){for(var l=e;e;){var d=e.parentElement,p=ue(e);if(d&&!d.shadowRoot&&i(d)===!0)return Ke(e);e.assignedSlot?e=e.assignedSlot:!d&&p!==e.ownerDocument?e=p.host:e=d}e=l}if(Ur(e))return!e.getClientRects().length;if(r!=="legacy-full")return!0}else if(r==="non-zero-area")return Ke(e);return!1},Yr=function(e){if(/^(INPUT|BUTTON|SELECT|TEXTAREA)$/.test(e.tagName))for(var n=e.parentElement;n;){if(n.tagName==="FIELDSET"&&n.disabled){for(var r=0;r<n.children.length;r++){var i=n.children.item(r);if(i.tagName==="LEGEND")return P.call(n,"fieldset[disabled] *")?!0:!i.contains(e)}return!0}n=n.parentElement}return!1},me=function(e,n){return!(n.disabled||kr(n)||Jr(n,e)||Fr(n)||Yr(n))},we=function(e,n){return!(Hr(n)||Sn(n)<0||!me(e,n))},Br=function(e){var n=parseInt(e.getAttribute("tabindex"),10);return!!(isNaN(n)||n>=0)},In=function(e){var n=[],r=[];return e.forEach(function(i,s){var o=!!i.scopeParent,a=o?i.scopeParent:i,l=Or(a,o),d=o?In(i.candidates):a;l===0?o?n.push.apply(n,d):n.push(a):r.push({documentOrder:s,tabIndex:l,item:i,isScope:o,content:d})}),r.sort(Lr).reduce(function(i,s){return s.isScope?i.push.apply(i,s.content):i.push(s.content),i},[]).concat(n)},Rn=function(e,n){n=n||{};var r;return n.getShadowRoot?r=he([e],n.includeContainer,{filter:we.bind(null,n),flatten:!1,getShadowRoot:n.getShadowRoot,shadowRootFilter:Br}):r=Tn(e,n.includeContainer,we.bind(null,n)),In(r)},Nn=function(e,n){n=n||{};var r;return n.getShadowRoot?r=he([e],n.includeContainer,{filter:me.bind(null,n),flatten:!0,getShadowRoot:n.getShadowRoot}):r=Tn(e,n.includeContainer,me.bind(null,n)),r},Ne=function(e,n){if(n=n||{},!e)throw new Error("No node provided");return P.call(e,le)===!1?!1:we(n,e)},Wr=vn.concat("iframe:not([inert]):not([inert] *)").join(","),Cn=function(e,n){if(n=n||{},!e)throw new Error("No node provided");return P.call(e,Wr)===!1?!1:me(n,e)};function X(){return{getShadowRoot:!0,displayCheck:typeof ResizeObserver=="function"&&ResizeObserver.toString().includes("[native code]")?"full":"none"}}function jr(t,e){if(!Ne(t,X()))return zr(t,e);const n=te(t),r=Rn(n.body,X());e==="prev"&&r.reverse();const i=r.indexOf(t);return i===-1?n.body:r.slice(i+1)[0]}function zr(t,e){const n=te(t);if(!Cn(t,X()))return n.body;const r=Nn(n.body,X());e==="prev"&&r.reverse();const i=r.indexOf(t);return i===-1?n.body:r.slice(i+1).find(o=>Ne(o,X()))??n.body}function Dn(t,e,n){const r=e.toLowerCase();if(r.endsWith(" ")){const h=r.slice(0,-1);if(t.filter(m=>m.toLowerCase().startsWith(h)).length<=1)return Dn(t,h,n);const b=n?.toLowerCase();if(b&&b.startsWith(h)&&b.charAt(h.length)===" "&&e.trim()===h)return n;const f=t.filter(m=>m.toLowerCase().startsWith(r));if(f.length>0){const m=n?t.indexOf(n):-1;return qe(f,Math.max(m,0)).find(Wn=>Wn!==n)||n}}const s=e.length>1&&Array.from(e).every(h=>h===e[0])?e[0]:e,o=s.toLowerCase(),a=n?t.indexOf(n):-1;let l=qe(t,Math.max(a,0));s.length===1&&(l=l.filter(h=>h!==n));const p=l.find(h=>h?.toLowerCase().startsWith(o));return p!==n?p:void 0}function qe(t,e){return t.map((n,r)=>t[(e+r)%t.length])}const Vr={afterMs:1e4,onChange:E};function On(t,e){const{afterMs:n,onChange:r,getWindow:i}={...Vr,...e};let s=null,o=_(T(t));function a(){return i().setTimeout(()=>{u(o,t,!0),r?.(t)},n)}return x(()=>()=>{s&&i().clearTimeout(s)}),g(()=>c(o),l=>{u(o,l,!0),r?.(l),s&&i().clearTimeout(s),s=a()})}class Kr{#e;#n;#t=A(()=>this.#e.onMatch?this.#e.onMatch:e=>e.focus());#r=A(()=>this.#e.getCurrentItem?this.#e.getCurrentItem:this.#e.getActiveElement);constructor(e){this.#e=e,this.#n=On("",{afterMs:1e3,getWindow:e.getWindow}),this.handleTypeaheadSearch=this.handleTypeaheadSearch.bind(this),this.resetTypeahead=this.resetTypeahead.bind(this)}handleTypeaheadSearch(e,n){if(!n.length)return;this.#n.current=this.#n.current+e;const r=c(this.#r)(),i=n.find(l=>l===r)?.textContent?.trim()??"",s=n.map(l=>l.textContent?.trim()??""),o=Dn(s,this.#n.current,i),a=n.find(l=>l.textContent?.trim()===o);return a&&c(this.#t)(a),a}resetTypeahead(){this.#n.current=""}get search(){return this.#n.current}}class qr{#e;#n;#t;#r=_(null);constructor(e){this.#e=e,this.#n=A(()=>this.#e.enabled()),this.#t=On(!1,{afterMs:e.transitTimeout??300,onChange:n=>{c(this.#n)&&this.#e.setIsPointerInTransit?.(n)},getWindow:()=>ln(this.#e.triggerNode())}),M([e.triggerNode,e.contentNode,e.enabled],([n,r,i])=>{if(!n||!r||!i)return;const s=a=>{this.#s(a,r)},o=a=>{this.#s(a,n)};return F(v(n,"pointerleave",s),v(r,"pointerleave",o))}),M(()=>c(this.#r),()=>{const n=i=>{if(!c(this.#r))return;const s=i.target;if(!ve(s))return;const o={x:i.clientX,y:i.clientY},a=e.triggerNode()?.contains(s)||e.contentNode()?.contains(s),l=!$r(o,c(this.#r));a?this.#i():l&&(this.#i(),e.onPointerExit())},r=te(e.triggerNode()??e.contentNode());if(r)return v(r,"pointermove",n)})}#i(){u(this.#r,null),this.#t.current=!1}#s(e,n){const r=e.currentTarget;if(!N(r))return;const i={x:e.clientX,y:e.clientY},s=Xr(i,r.getBoundingClientRect()),o=Qr(i,s),a=Zr(n.getBoundingClientRect()),l=ei([...o,...a]);u(this.#r,l,!0),this.#t.current=!0}}function Xr(t,e){const n=Math.abs(e.top-t.y),r=Math.abs(e.bottom-t.y),i=Math.abs(e.right-t.x),s=Math.abs(e.left-t.x);switch(Math.min(n,r,i,s)){case s:return"left";case i:return"right";case n:return"top";case r:return"bottom";default:throw new Error("unreachable")}}function Qr(t,e,n=5){const r=n*1.5;switch(e){case"top":return[{x:t.x-n,y:t.y+n},{x:t.x,y:t.y-r},{x:t.x+n,y:t.y+n}];case"bottom":return[{x:t.x-n,y:t.y-n},{x:t.x,y:t.y+r},{x:t.x+n,y:t.y-n}];case"left":return[{x:t.x+n,y:t.y-n},{x:t.x-r,y:t.y},{x:t.x+n,y:t.y+n}];case"right":return[{x:t.x-n,y:t.y-n},{x:t.x+r,y:t.y},{x:t.x-n,y:t.y+n}]}}function Zr(t){const{top:e,right:n,bottom:r,left:i}=t;return[{x:i,y:e},{x:n,y:e},{x:n,y:r},{x:i,y:r}]}function $r(t,e){const{x:n,y:r}=t;let i=!1;for(let s=0,o=e.length-1;s<e.length;o=s++){const a=e[s].x,l=e[s].y,d=e[o].x,p=e[o].y;l>r!=p>r&&n<(d-a)*(r-l)/(p-l)+a&&(i=!i)}return i}function ei(t){const e=t.slice();return e.sort((n,r)=>n.x<r.x?-1:n.x>r.x?1:n.y<r.y?-1:n.y>r.y?1:0),ni(e)}function ni(t){if(t.length<=1)return t.slice();const e=[];for(let r=0;r<t.length;r++){const i=t[r];for(;e.length>=2;){const s=e[e.length-1],o=e[e.length-2];if((s.x-o.x)*(i.y-o.y)>=(s.y-o.y)*(i.x-o.x))e.pop();else break}e.push(i)}e.pop();const n=[];for(let r=t.length-1;r>=0;r--){const i=t[r];for(;n.length>=2;){const s=n[n.length-1],o=n[n.length-2];if((s.x-o.x)*(i.y-o.y)>=(s.y-o.y)*(i.x-o.x))n.pop();else break}n.push(i)}return n.pop(),e.length===1&&n.length===1&&e[0].x===n[0].x&&e[0].y===n[0].y?e:e.concat(n)}const ti="data-context-menu-trigger",ri="data-context-menu-content",Ce=new ee("Menu.Root"),De=new ee("Menu.Root | Menu.Sub"),Ln=new ee("Menu.Content"),ii=new ee("Menu.Group | Menu.RadioGroup"),si=new Er("bitsmenuopen",{bubbles:!1,cancelable:!0}),oi=rr({component:"menu",parts:["trigger","content","sub-trigger","item","group","group-heading","checkbox-group","checkbox-item","radio-group","radio-item","separator","sub-content","arrow"]});class kn{static create(e){const n=new kn(e);return Ce.set(n)}opts;isUsingKeyboard=new C;#e=_(!1);get ignoreCloseAutoFocus(){return c(this.#e)}set ignoreCloseAutoFocus(e){u(this.#e,e,!0)}#n=_(!1);get isPointerInTransit(){return c(this.#n)}set isPointerInTransit(e){u(this.#n,e,!0)}constructor(e){this.opts=e}getBitsAttr=e=>oi.getAttr(e,this.opts.variant.current)}class Fn{static create(e,n){return De.set(new Fn(e,n,null))}opts;root;parentMenu;contentId=g(()=>"");#e=_(null);get contentNode(){return c(this.#e)}set contentNode(e){u(this.#e,e,!0)}contentPresence;#n=_(null);get triggerNode(){return c(this.#n)}set triggerNode(e){u(this.#n,e,!0)}constructor(e,n,r){this.opts=e,this.root=n,this.parentMenu=r,this.contentPresence=new _r({ref:g(()=>this.contentNode),open:this.opts.open,onComplete:()=>{this.opts.onOpenChangeComplete.current(this.opts.open.current)}}),r&&M(()=>r.opts.open.current,()=>{r.opts.open.current||(this.opts.open.current=!1)})}toggleOpen(){this.opts.open.current=!this.opts.open.current}onOpen(){this.opts.open.current=!0}onClose(){this.opts.open.current=!1}}class Pn{static create(e){return Ln.set(new Pn(e,De.get()))}opts;parentMenu;rovingFocusGroup;domContext;attachment;#e=_("");get search(){return c(this.#e)}set search(e){u(this.#e,e,!0)}#n=0;#t;#r=_(!1);get mounted(){return c(this.#r)}set mounted(e){u(this.#r,e,!0)}#i;constructor(e,n){this.opts=e,this.parentMenu=n,this.domContext=new Se(e.ref),this.attachment=re(this.opts.ref,r=>{this.parentMenu.contentNode!==r&&(this.parentMenu.contentNode=r)}),n.contentId=e.id,this.#i=e.isSub??!1,this.onkeydown=this.onkeydown.bind(this),this.onblur=this.onblur.bind(this),this.onfocus=this.onfocus.bind(this),this.handleInteractOutside=this.handleInteractOutside.bind(this),new qr({contentNode:()=>this.parentMenu.contentNode,triggerNode:()=>this.parentMenu.triggerNode,enabled:()=>this.parentMenu.opts.open.current&&!!this.parentMenu.triggerNode?.hasAttribute(this.parentMenu.root.getBitsAttr("sub-trigger")),onPointerExit:()=>{this.parentMenu.opts.open.current=!1},setIsPointerInTransit:r=>{this.parentMenu.root.isPointerInTransit=r}}),this.#t=new Kr({getActiveElement:()=>this.domContext.getActiveElement(),getWindow:()=>this.domContext.getWindow()}).handleTypeaheadSearch,this.rovingFocusGroup=new pr({rootNode:g(()=>this.parentMenu.contentNode),candidateAttr:this.parentMenu.root.getBitsAttr("item"),loop:this.opts.loop,orientation:g(()=>"vertical")}),M(()=>this.parentMenu.contentNode,r=>{if(!r)return;const i=()=>{R(()=>{this.parentMenu.root.isUsingKeyboard.current&&this.rovingFocusGroup.focusFirstCandidate()})};return si.listen(r,i)}),x(()=>{this.parentMenu.opts.open.current||this.domContext.getWindow().clearTimeout(this.#n)})}#s(){const e=this.parentMenu.contentNode;return e?Array.from(e.querySelectorAll(`[${this.parentMenu.root.getBitsAttr("item")}]:not([data-disabled])`)):[]}#a(){return this.parentMenu.root.isPointerInTransit}onCloseAutoFocus=e=>{this.opts.onCloseAutoFocus.current?.(e),!(e.defaultPrevented||this.#i)&&this.parentMenu.triggerNode&&Ne(this.parentMenu.triggerNode)&&(e.preventDefault(),this.parentMenu.triggerNode.focus())};handleTabKeyDown(e){let n=this.parentMenu;for(;n.parentMenu!==null;)n=n.parentMenu;if(!n.triggerNode)return;e.preventDefault();const r=jr(n.triggerNode,e.shiftKey?"prev":"next");r?(this.parentMenu.root.ignoreCloseAutoFocus=!0,n.onClose(),R(()=>{r.focus(),R(()=>{this.parentMenu.root.ignoreCloseAutoFocus=!1})})):this.domContext.getDocument().body.focus()}onkeydown(e){if(e.defaultPrevented)return;if(e.key===ar){this.handleTabKeyDown(e);return}const n=e.target,r=e.currentTarget;if(!N(n)||!N(r))return;const i=n.closest(`[${this.parentMenu.root.getBitsAttr("content")}]`)?.id===this.parentMenu.contentId.current,s=e.ctrlKey||e.altKey||e.metaKey,o=e.key.length===1;if(this.rovingFocusGroup.handleKeydown(n,e)||e.code==="Space")return;const l=this.#s();i&&!s&&o&&this.#t(e.key,l),e.target?.id===this.parentMenu.contentId.current&&Rr.includes(e.key)&&(e.preventDefault(),An.includes(e.key)&&l.reverse(),Cr(l,{select:!1},()=>this.domContext.getActiveElement()))}onblur(e){ve(e.currentTarget)&&ve(e.target)&&(e.currentTarget.contains?.(e.target)||(this.domContext.getWindow().clearTimeout(this.#n),this.search=""))}onfocus(e){this.parentMenu.root.isUsingKeyboard.current&&R(()=>this.rovingFocusGroup.focusFirstCandidate())}onItemEnter(){return this.#a()}onItemLeave(e){if(e.currentTarget.hasAttribute(this.parentMenu.root.getBitsAttr("sub-trigger"))||this.#a()||this.parentMenu.root.isUsingKeyboard.current)return;this.parentMenu.contentNode?.focus(),this.rovingFocusGroup.setCurrentTabStopId("")}onTriggerLeave(){return!!this.#a()}handleInteractOutside(e){if(!gn(e.target))return;const n=this.parentMenu.triggerNode?.id;if(e.target.id===n){e.preventDefault();return}e.target.closest(`#${n}`)&&e.preventDefault()}get shouldRender(){return this.parentMenu.contentPresence.shouldRender}#o=A(()=>({open:this.parentMenu.opts.open.current}));get snippetProps(){return c(this.#o)}set snippetProps(e){u(this.#o,e)}#l=A(()=>({id:this.opts.id.current,role:"menu","aria-orientation":"vertical",[this.parentMenu.root.getBitsAttr("content")]:"","data-state":hn(this.parentMenu.opts.open.current),onkeydown:this.onkeydown,onblur:this.onblur,onfocus:this.onfocus,dir:this.parentMenu.root.opts.dir.current,style:{pointerEvents:"auto",contain:"layout style"},...this.attachment}));get props(){return c(this.#l)}set props(e){u(this.#l,e)}popperProps={onCloseAutoFocus:e=>this.onCloseAutoFocus(e)}}class ai{opts;content;attachment;#e=_(!1);constructor(e,n){this.opts=e,this.content=n,this.attachment=re(this.opts.ref),this.onpointermove=this.onpointermove.bind(this),this.onpointerleave=this.onpointerleave.bind(this),this.onfocus=this.onfocus.bind(this),this.onblur=this.onblur.bind(this)}onpointermove(e){if(!e.defaultPrevented&&Ve(e))if(this.opts.disabled.current)this.content.onItemLeave(e);else{if(this.content.onItemEnter())return;const r=e.currentTarget;if(!N(r))return;r.focus()}}onpointerleave(e){e.defaultPrevented||Ve(e)&&this.content.onItemLeave(e)}onfocus(e){R(()=>{e.defaultPrevented||this.opts.disabled.current||u(this.#e,!0)})}onblur(e){R(()=>{e.defaultPrevented||u(this.#e,!1)})}#n=A(()=>({id:this.opts.id.current,tabindex:-1,role:"menuitem","aria-disabled":un(this.opts.disabled.current),"data-disabled":dn(this.opts.disabled.current),"data-highlighted":c(this.#e)?"":void 0,[this.content.parentMenu.root.getBitsAttr("item")]:"",onpointermove:this.onpointermove,onpointerleave:this.onpointerleave,onfocus:this.onfocus,onblur:this.onblur,...this.attachment}));get props(){return c(this.#n)}set props(e){u(this.#n,e)}}class xn{static create(e){const n=new ai(e,Ln.get());return new xn(e,n)}opts;item;root;#e=!1;constructor(e,n){this.opts=e,this.item=n,this.root=n.content.parentMenu.root,this.onkeydown=this.onkeydown.bind(this),this.onclick=this.onclick.bind(this),this.onpointerdown=this.onpointerdown.bind(this),this.onpointerup=this.onpointerup.bind(this)}#n(){if(this.item.opts.disabled.current)return;const e=new CustomEvent("menuitemselect",{bubbles:!0,cancelable:!0});if(this.opts.onSelect.current(e),e.defaultPrevented){this.item.content.parentMenu.root.isUsingKeyboard.current=!1;return}this.opts.closeOnSelect.current&&this.item.content.parentMenu.root.opts.onClose()}onkeydown(e){const n=this.item.content.search!=="";if(!(this.item.opts.disabled.current||n&&e.key===Re)&&Mr.includes(e.key)){if(!N(e.currentTarget))return;e.currentTarget.click(),e.preventDefault()}}onclick(e){this.item.opts.disabled.current||this.#n()}onpointerup(e){if(!e.defaultPrevented&&!this.#e){if(!N(e.currentTarget))return;e.currentTarget?.click()}}onpointerdown(e){this.#e=!0}#t=A(()=>Yt(this.item.props,{onclick:this.onclick,onpointerdown:this.onpointerdown,onpointerup:this.onpointerup,onkeydown:this.onkeydown}));get props(){return c(this.#t)}set props(e){u(this.#t,e)}}class Gn{static create(e){return ii.set(new Gn(e,Ce.get()))}opts;root;attachment;#e=_(void 0);get groupHeadingId(){return c(this.#e)}set groupHeadingId(e){u(this.#e,e,!0)}constructor(e,n){this.opts=e,this.root=n,this.attachment=re(this.opts.ref)}#n=A(()=>({id:this.opts.id.current,role:"group","aria-labelledby":this.groupHeadingId,[this.root.getBitsAttr("group")]:"",...this.attachment}));get props(){return c(this.#n)}set props(e){u(this.#n,e)}}class Hn{static create(e){return new Hn(e,Ce.get())}opts;root;attachment;constructor(e,n){this.opts=e,this.root=n,this.attachment=re(this.opts.ref)}#e=A(()=>({id:this.opts.id.current,role:"group",[this.root.getBitsAttr("separator")]:"",...this.attachment}));get props(){return c(this.#e)}set props(e){u(this.#e,e)}}class Un{static create(e){return new Un(e,De.get())}opts;parentMenu;attachment;constructor(e,n){this.opts=e,this.parentMenu=n,this.attachment=re(this.opts.ref,r=>this.parentMenu.triggerNode=r)}onclick=e=>{this.opts.disabled.current||e.detail!==0||(this.parentMenu.toggleOpen(),e.preventDefault())};onpointerdown=e=>{if(!this.opts.disabled.current){if(e.pointerType==="touch")return e.preventDefault();e.button===0&&e.ctrlKey===!1&&(this.parentMenu.toggleOpen(),this.parentMenu.opts.open.current||e.preventDefault())}};onpointerup=e=>{this.opts.disabled.current||e.pointerType==="touch"&&(e.preventDefault(),this.parentMenu.toggleOpen())};onkeydown=e=>{if(!this.opts.disabled.current){if(e.key===Re||e.key===pn){this.parentMenu.toggleOpen(),e.preventDefault();return}e.key===Q&&(this.parentMenu.onOpen(),e.preventDefault())}};#e=A(()=>{if(this.parentMenu.opts.open.current&&this.parentMenu.contentId.current)return this.parentMenu.contentId.current});#n=A(()=>({id:this.opts.id.current,disabled:this.opts.disabled.current,"aria-haspopup":"menu","aria-expanded":un(this.parentMenu.opts.open.current),"aria-controls":c(this.#e),"data-disabled":dn(this.opts.disabled.current),"data-state":hn(this.parentMenu.opts.open.current),[this.parentMenu.root.getBitsAttr("trigger")]:"",onclick:this.onclick,onpointerdown:this.onpointerdown,onpointerup:this.onpointerup,onkeydown:this.onkeydown,...this.attachment}));get props(){return c(this.#n)}set props(e){u(this.#n,e)}}globalThis.bitsDismissableLayers??=new Map;class Oe{static create(e){return new Oe(e)}opts;#e;#n;#t={pointerdown:!1};#r=!1;#i=!1;#s=void 0;#a;#o=E;constructor(e){this.opts=e,this.#n=e.interactOutsideBehavior,this.#e=e.onInteractOutside,this.#a=e.onFocusOutside,x(()=>{this.#s=yn(this.opts.ref.current)});let n=E;const r=()=>{this.#p(),globalThis.bitsDismissableLayers.delete(this),this.#u.destroy(),n()};M([()=>this.opts.enabled.current,()=>this.opts.ref.current],()=>{if(!(!this.opts.enabled.current||!this.opts.ref.current))return Kt(1,()=>{this.opts.ref.current&&(globalThis.bitsDismissableLayers.set(this,this.#n),n(),n=this.#m())}),r}),ne(()=>{this.#p.destroy(),globalThis.bitsDismissableLayers.delete(this),this.#u.destroy(),this.#o(),n()})}#l=e=>{e.defaultPrevented||this.opts.ref.current&&R(()=>{!this.opts.ref.current||this.#f(e.target)||e.target&&!this.#i&&this.#a.current?.(e)})};#m(){return F(v(this.#s,"pointerdown",F(this.#c,this.#_),{capture:!0}),v(this.#s,"pointerdown",F(this.#h,this.#u)),v(this.#s,"focusin",this.#l))}#d=e=>{let n=e;n.defaultPrevented&&(n=Xe(e)),this.#e.current(e)};#u=ze(e=>{if(!this.opts.ref.current){this.#o();return}const n=this.opts.isValidEvent.current(e,this.opts.ref.current)||ui(e,this.opts.ref.current);if(!this.#r||this.#g()||!n){this.#o();return}let r=e;if(r.defaultPrevented&&(r=Xe(r)),this.#n.current!=="close"&&this.#n.current!=="defer-otherwise-close"){this.#o();return}e.pointerType==="touch"?(this.#o(),this.#o=v(this.#s,"click",this.#d,{once:!0})):this.#e.current(r)},10);#c=e=>{this.#t[e.type]=!0};#h=e=>{this.#t[e.type]=!1};#_=()=>{this.opts.ref.current&&(this.#r=li(this.opts.ref.current))};#f=e=>this.opts.ref.current?bn(this.opts.ref.current,e):!1;#p=ze(()=>{for(const e in this.#t)this.#t[e]=!1;this.#r=!1},20);#g(){return Object.values(this.#t).some(Boolean)}#b=()=>{this.#i=!0};#y=()=>{this.#i=!1};props={onfocuscapture:this.#b,onblurcapture:this.#y}}function ci(t=[...globalThis.bitsDismissableLayers]){return t.findLast(([e,{current:n}])=>n==="close"||n==="ignore")}function li(t){const e=[...globalThis.bitsDismissableLayers],n=ci(e);if(n)return n[0].opts.ref.current===t;const[r]=e[0];return r.opts.ref.current===t}function ui(t,e){const n=t.target;if(!gn(n))return!1;const r=!!n.closest(`[${ti}]`);if("button"in t&&t.button>0&&!r)return!1;if("button"in t&&t.button===0&&r)return!0;const i=!!e.closest(`[${ri}]`);return r&&i?!1:yn(n).documentElement.contains(n)&&!bn(e,n)&&Sr(t,e)}function Xe(t){const e=t.currentTarget,n=t.target;let r;t instanceof PointerEvent?r=new PointerEvent(t.type,t):r=new PointerEvent("pointerdown",t);let i=!1;return new Proxy(r,{get:(o,a)=>a==="currentTarget"?e:a==="target"?n:a==="preventDefault"?()=>{i=!0,typeof o.preventDefault=="function"&&o.preventDefault()}:a==="defaultPrevented"?i:a in o?o[a]:t[a]})}function Wi(t,e){Y(e,!0);let n=w(e,"interactOutsideBehavior",3,"close"),r=w(e,"onInteractOutside",3,E),i=w(e,"onFocusOutside",3,E),s=w(e,"isValidEvent",3,()=>!1);const o=Oe.create({id:g(()=>e.id),interactOutsideBehavior:g(()=>n()),onInteractOutside:g(()=>r()),enabled:g(()=>e.enabled),onFocusOutside:g(()=>i()),isValidEvent:g(()=>s()),ref:e.ref});var a=D(),l=O(a);U(l,()=>e.children??J,()=>({props:o.props})),L(t,a),B()}globalThis.bitsEscapeLayers??=new Map;class Le{static create(e){return new Le(e)}opts;domContext;constructor(e){this.opts=e,this.domContext=new Se(this.opts.ref);let n=E;M(()=>e.enabled.current,r=>(r&&(globalThis.bitsEscapeLayers.set(this,e.escapeKeydownBehavior),n=this.#e()),()=>{n(),globalThis.bitsEscapeLayers.delete(this)}))}#e=()=>v(this.domContext.getDocument(),"keydown",this.#n,{passive:!1});#n=e=>{if(e.key!==ir||!di(this))return;const n=new KeyboardEvent(e.type,e);e.preventDefault();const r=this.opts.escapeKeydownBehavior.current;r!=="close"&&r!=="defer-otherwise-close"||this.opts.onEscapeKeydown.current(n)}}function di(t){const e=[...globalThis.bitsEscapeLayers],n=e.findLast(([i,{current:s}])=>s==="close"||s==="ignore");if(n)return n[0]===t;const[r]=e[0];return r===t}function ji(t,e){Y(e,!0);let n=w(e,"escapeKeydownBehavior",3,"close"),r=w(e,"onEscapeKeydown",3,E);Le.create({escapeKeydownBehavior:g(()=>n()),onEscapeKeydown:g(()=>r()),enabled:g(()=>e.enabled),ref:e.ref});var i=D(),s=O(i);U(s,()=>e.children??J),L(t,i),B()}class ke{static instance;#e=tn([]);#n=new WeakMap;#t=new WeakMap;static getInstance(){return this.instance||(this.instance=new ke),this.instance}register(e){const n=this.getActive();n&&n!==e&&n.pause();const r=document.activeElement;r&&r!==document.body&&this.#t.set(e,r),this.#e.current=this.#e.current.filter(i=>i!==e),this.#e.current.unshift(e)}unregister(e){this.#e.current=this.#e.current.filter(r=>r!==e);const n=this.getActive();n&&n.resume()}getActive(){return this.#e.current[0]}setFocusMemory(e,n){this.#n.set(e,n)}getFocusMemory(e){return this.#n.get(e)}isActiveScope(e){return this.getActive()===e}setPreFocusMemory(e,n){this.#t.set(e,n)}getPreFocusMemory(e){return this.#t.get(e)}clearPreFocusMemory(e){this.#t.delete(e)}}class Fe{#e=!1;#n=null;#t=ke.getInstance();#r=[];#i;constructor(e){this.#i=e}get paused(){return this.#e}pause(){this.#e=!0}resume(){this.#e=!1}#s(){for(const e of this.#r)e();this.#r=[]}mount(e){this.#n&&this.unmount(),this.#n=e,this.#t.register(this),this.#l(),this.#a()}unmount(){this.#n&&(this.#s(),this.#o(),this.#t.unregister(this),this.#t.clearPreFocusMemory(this),this.#n=null)}#a(){if(!this.#n)return;const e=new CustomEvent("focusScope.onOpenAutoFocus",{bubbles:!1,cancelable:!0});this.#i.onOpenAutoFocus.current(e),e.defaultPrevented||requestAnimationFrame(()=>{if(!this.#n)return;const n=this.#d();n?(n.focus(),this.#t.setFocusMemory(this,n)):this.#n.focus()})}#o(){const e=new CustomEvent("focusScope.onCloseAutoFocus",{bubbles:!1,cancelable:!0});if(this.#i.onCloseAutoFocus.current?.(e),!e.defaultPrevented){const n=this.#t.getPreFocusMemory(this);if(n&&document.contains(n))try{n.focus()}catch{document.body.focus()}}}#l(){if(!this.#n||!this.#i.trap.current)return;const e=this.#n,n=e.ownerDocument,r=o=>{if(this.#e||!this.#t.isActiveScope(this))return;const a=o.target;if(!a)return;if(e.contains(a))this.#t.setFocusMemory(this,a);else{const d=this.#t.getFocusMemory(this);if(d&&e.contains(d)&&Cn(d))o.preventDefault(),d.focus();else{const p=this.#d(),h=this.#u()[0];(p||h||e).focus()}}},i=o=>{if(!this.#i.loop||this.#e||o.key!=="Tab"||!this.#t.isActiveScope(this))return;const a=this.#m();if(a.length===0)return;const l=a[0],d=a[a.length-1];!o.shiftKey&&n.activeElement===d?(o.preventDefault(),l.focus()):o.shiftKey&&n.activeElement===l&&(o.preventDefault(),d.focus())};this.#r.push(v(n,"focusin",r,{capture:!0}),v(e,"keydown",i));const s=new MutationObserver(()=>{const o=this.#t.getFocusMemory(this);if(o&&!e.contains(o)){const a=this.#d(),l=this.#u()[0],d=a||l;d?(d.focus(),this.#t.setFocusMemory(this,d)):e.focus()}});s.observe(e,{childList:!0,subtree:!0}),this.#r.push(()=>s.disconnect())}#m(){return this.#n?Rn(this.#n,{includeContainer:!1,getShadowRoot:!0}):[]}#d(){return this.#m()[0]||null}#u(){return this.#n?Nn(this.#n,{includeContainer:!1,getShadowRoot:!0}):[]}static use(e){let n=null;return M([()=>e.ref.current,()=>e.enabled.current],([r,i])=>{r&&i?(n||(n=new Fe(e)),n.mount(r)):n&&(n.unmount(),n=null)}),ne(()=>{n?.unmount()}),{get props(){return{tabindex:-1}}}}}function zi(t,e){Y(e,!0);let n=w(e,"enabled",3,!1),r=w(e,"trapFocus",3,!1),i=w(e,"loop",3,!1),s=w(e,"onCloseAutoFocus",3,E),o=w(e,"onOpenAutoFocus",3,E);const a=Fe.use({enabled:g(()=>n()),trap:g(()=>r()),loop:i(),onCloseAutoFocus:g(()=>s()),onOpenAutoFocus:g(()=>o()),ref:e.ref});var l=D(),d=O(l);U(d,()=>e.focusScope??J,()=>({props:a.props})),L(t,l),B()}globalThis.bitsTextSelectionLayers??=new Map;class Pe{static create(e){return new Pe(e)}opts;domContext;#e=E;constructor(e){this.opts=e,this.domContext=new Se(e.ref);let n=E;M(()=>this.opts.enabled.current,r=>(r&&(globalThis.bitsTextSelectionLayers.set(this,this.opts.enabled),n(),n=this.#n()),()=>{n(),this.#r(),globalThis.bitsTextSelectionLayers.delete(this)}))}#n(){return F(v(this.domContext.getDocument(),"pointerdown",this.#t),v(this.domContext.getDocument(),"pointerup",rn(this.#r,this.opts.onPointerUp.current)))}#t=e=>{const n=this.opts.ref.current,r=e.target;!N(n)||!N(r)||!this.opts.enabled.current||!mi(this)||!er(n,r)||(this.opts.onPointerDown.current(e),!e.defaultPrevented&&(this.#e=hi(n,this.domContext.getDocument().body)))};#r=()=>{this.#e(),this.#e=E}}const Qe=t=>t.style.userSelect||t.style.webkitUserSelect;function hi(t,e){const n=Qe(e),r=Qe(t);return se(e,"none"),se(t,"text"),()=>{se(e,n),se(t,r)}}function se(t,e){t.style.userSelect=e,t.style.webkitUserSelect=e}function mi(t){const e=[...globalThis.bitsTextSelectionLayers];if(!e.length)return!1;const n=e.at(-1);return n?n[0]===t:!1}function Vi(t,e){Y(e,!0);let n=w(e,"preventOverflowTextSelection",3,!0),r=w(e,"onPointerDown",3,E),i=w(e,"onPointerUp",3,E);Pe.create({id:g(()=>e.id),onPointerDown:g(()=>r()),onPointerUp:g(()=>i()),enabled:g(()=>e.enabled&&n()),ref:e.ref});var s=D(),o=O(s);U(o,()=>e.children??J),L(t,s),B()}globalThis.bitsIdCounter??={current:0};function pi(t="bits"){return globalThis.bitsIdCounter.current++,`${t}-${globalThis.bitsIdCounter.current}`}class fi{#e;#n=0;#t=_();#r;constructor(e){this.#e=e}#i(){this.#n-=1,this.#r&&this.#n<=0&&(this.#r(),u(this.#t,void 0),this.#r=void 0)}get(...e){return this.#n+=1,c(this.#t)===void 0&&(this.#r=nn(()=>{u(this.#t,this.#e(...e),!0)})),x(()=>()=>{this.#i()}),c(this.#t)}}const ae=new ut;let oe=_(null),_e=null,z=null,V=!1;const Ze=g(()=>{for(const t of ae.values())if(t)return!0;return!1});let ge=null;const _i=new fi(()=>{function t(){document.body.setAttribute("style",c(oe)??""),document.body.style.removeProperty("--scrollbar-width"),je&&_e?.(),u(oe,null)}function e(){z!==null&&(window.clearTimeout(z),z=null)}function n(i,s){e(),V=!0,ge=Date.now();const o=ge,a=()=>{z=null,ge===o&&(Jn(ae)?V=!1:(V=!1,s()))},l=i===null?24:i;z=window.setTimeout(a,l)}function r(){c(oe)===null&&ae.size===0&&!V&&u(oe,document.body.getAttribute("style"),!0)}return M(()=>Ze.current,()=>{if(!Ze.current)return;r(),V=!1;const i=getComputedStyle(document.documentElement),s=getComputedStyle(document.body),o=i.scrollbarGutter?.includes("stable")||s.scrollbarGutter?.includes("stable"),a=window.innerWidth-document.documentElement.clientWidth,d={padding:Number.parseInt(s.paddingRight??"0",10)+a,margin:Number.parseInt(s.marginRight??"0",10)};a>0&&!o&&(document.body.style.paddingRight=`${d.padding}px`,document.body.style.marginRight=`${d.margin}px`,document.body.style.setProperty("--scrollbar-width",`${a}px`)),document.body.style.overflow="hidden",je&&(_e=v(document,"touchmove",p=>{p.target===document.documentElement&&(p.touches.length>1||p.preventDefault())},{passive:!1})),R(()=>{document.body.style.pointerEvents="none",document.body.style.overflow="hidden"})}),ne(()=>()=>{_e?.()}),{get lockMap(){return ae},resetBodyStyle:t,scheduleCleanupIfNoNewLocks:n,cancelPendingCleanup:e,ensureInitialStyleCaptured:r}});class gi{#e=pi();#n;#t=()=>null;#r;locked;constructor(e,n=()=>null){this.#n=e,this.#t=n,this.#r=_i.get(),this.#r&&(this.#r.cancelPendingCleanup(),this.#r.ensureInitialStyleCaptured(),this.#r.lockMap.set(this.#e,this.#n??!1),this.locked=g(()=>this.#r.lockMap.get(this.#e)??!1,r=>this.#r.lockMap.set(this.#e,r)),ne(()=>{if(this.#r.lockMap.delete(this.#e),Jn(this.#r.lockMap))return;const r=this.#t();this.#r.scheduleCleanupIfNoNewLocks(r,()=>{this.#r.resetBodyStyle()})}))}}function Jn(t){for(const[e,n]of t)if(n)return!0;return!1}function Ki(t,e){Y(e,!0);let n=w(e,"preventScroll",3,!0),r=w(e,"restoreScrollDelay",3,null);n()&&new gi(n(),()=>r()),B()}const Yn=[{id:"gemini-3.1-flash-lite-preview",label:"Gemini 3.1 Flash Lite",provider:"google",minTier:"free",cost:1},{id:"gemini-3-flash-preview",label:"Gemini 3 Flash",provider:"google",minTier:"plus",cost:2},{id:"gemini-3.1-pro-preview",label:"Gemini 3.1 Pro",provider:"google",minTier:"plus",cost:3},{id:"claude-sonnet-4-6",label:"Claude Sonnet 4.6",provider:"anthropic",minTier:"plus",cost:3},{id:"claude-opus-4-6",label:"Claude Opus 4.6",provider:"anthropic",minTier:"plus",cost:4}],bi="gemini-3.1-flash-lite-preview";new Set(Yn.map(t=>t.id));Object.fromEntries(Yn.map(t=>[t.id,t.minTier]));const I={yamlEditor:!1,linksCollapsed:!1,selectedFileId:void 0,colorMode:"system",showArchive:!1,showTrash:!1,activeSection:"cv",wordWrap:!0,entriesExpanded:!0,selectedModel:bi};class yi{#e;#n=!1;#t=_(T(I.yamlEditor));#r=_(T(I.linksCollapsed));#i=_(T(I.selectedFileId));#s=_(T(I.colorMode));#a=_(T(I.showArchive));#o=_(T(I.showTrash));#l=_(T(I.activeSection));#m=_(T(I.wordWrap));#d=_(T(I.entriesExpanded));#u=_(T(I.selectedModel));get yamlEditor(){return c(this.#t)}set yamlEditor(e){u(this.#t,e,!0),this.#c()}get linksCollapsed(){return c(this.#r)}set linksCollapsed(e){u(this.#r,e,!0),this.#c()}get selectedFileId(){return c(this.#i)}set selectedFileId(e){u(this.#i,e,!0),this.#c()}get colorMode(){return c(this.#s)}set colorMode(e){u(this.#s,e,!0),this.#c()}get showArchive(){return c(this.#a)}set showArchive(e){u(this.#a,e,!0),this.#c()}get showTrash(){return c(this.#o)}set showTrash(e){u(this.#o,e,!0),this.#c()}get activeSection(){return c(this.#l)}set activeSection(e){u(this.#l,e,!0),this.#c()}get wordWrap(){return c(this.#m)}set wordWrap(e){u(this.#m,e,!0),this.#c()}get entriesExpanded(){return c(this.#d)}set entriesExpanded(e){u(this.#d,e,!0),this.#c()}get selectedModel(){return c(this.#u)}set selectedModel(e){u(this.#u,e,!0),this.#c()}init(e){const n={...I,...e??{}};u(this.#t,n.yamlEditor,!0),u(this.#r,n.linksCollapsed,!0),u(this.#i,n.selectedFileId,!0),u(this.#s,n.colorMode,!0),u(this.#a,n.showArchive,!0),u(this.#o,n.showTrash,!0),u(this.#l,n.activeSection,!0),u(this.#m,n.wordWrap,!0),u(this.#d,n.entriesExpanded,!0),u(this.#u,n.selectedModel,!0)}enableAutoSave(e){this.#e=e,this.#c()}disableAutoSave(){this.#e=void 0}#c(){!this.#e||this.#n||(this.#n=!0,queueMicrotask(()=>{this.#n=!1,this.#e&&this.#e?.(this.snapshot())}))}snapshot(){return{yamlEditor:c(this.#t),linksCollapsed:c(this.#r),selectedFileId:c(this.#i),colorMode:c(this.#s),showArchive:c(this.#a),showTrash:c(this.#o),activeSection:c(this.#l),wordWrap:c(this.#m),entriesExpanded:c(this.#d),selectedModel:c(this.#u)}}}const K=new yi,qi=["classic","engineeringclassic","engineeringresumes","moderncv","sb2nov"],Xi=["english","arabic","danish","dutch","french","german","hebrew","hindi","indonesian","italian","japanese","korean","mandarin_chinese","norwegian_bokmål","norwegian_nynorsk","persian","portuguese","russian","spanish","turkish"],Ai={classic:`design:
  theme: classic
  page:
    size: us-letter
    top_margin: 0.7in
    bottom_margin: 0.7in
    left_margin: 0.7in
    right_margin: 0.7in
    show_footer: true
    show_top_note: true
  colors:
    body: rgb(0, 0, 0)
    name: rgb(0, 79, 144)
    headline: rgb(0, 79, 144)
    connections: rgb(0, 79, 144)
    section_titles: rgb(0, 79, 144)
    links: rgb(0, 79, 144)
    footer: rgb(128, 128, 128)
    top_note: rgb(128, 128, 128)
  typography:
    line_spacing: 0.6em
    alignment: justified
    date_and_location_column_alignment: right
    font_family:
      body: Source Sans 3
      name: Source Sans 3
      headline: Source Sans 3
      connections: Source Sans 3
      section_titles: Source Sans 3
    font_size:
      body: 10pt
      name: 30pt
      headline: 10pt
      connections: 10pt
      section_titles: 1.4em
    small_caps:
      name: false
      headline: false
      connections: false
      section_titles: false
    bold:
      name: true
      headline: false
      connections: false
      section_titles: true
  links:
    underline: false
    show_external_link_icon: false
  header:
    alignment: center
    photo_width: 3.5cm
    photo_position: left
    photo_space_left: 0.4cm
    photo_space_right: 0.4cm
    space_below_name: 0.7cm
    space_below_headline: 0.7cm
    space_below_connections: 0.7cm
    connections:
      phone_number_format: national
      hyperlink: true
      show_icons: true
      display_urls_instead_of_usernames: false
      separator: ''
      space_between_connections: 0.5cm
  section_titles:
    type: with_partial_line
    line_thickness: 0.5pt
    space_above: 0.5cm
    space_below: 0.3cm
  sections:
    allow_page_break: true
    space_between_regular_entries: 1.2em
    space_between_text_based_entries: 0.3em
    show_time_spans_in:
      - experience
  entries:
    date_and_location_width: 4.15cm
    side_space: 0.2cm
    space_between_columns: 0.1cm
    allow_page_break: false
    short_second_row: true
    degree_width: 1cm
    summary:
      space_above: 0cm
      space_left: 0cm
    highlights:
      bullet: •
      nested_bullet: •
      space_left: 0.15cm
      space_above: 0cm
      space_between_items: 0cm
      space_between_bullet_and_text: 0.5em
  templates:
    footer: '*NAME -- PAGE_NUMBER/TOTAL_PAGES*'
    top_note: '*LAST_UPDATED CURRENT_DATE*'
    single_date: MONTH_ABBREVIATION YEAR
    date_range: START_DATE – END_DATE
    time_span: HOW_MANY_YEARS YEARS HOW_MANY_MONTHS MONTHS
    one_line_entry:
      main_column: '**LABEL:** DETAILS'
    education_entry:
      main_column: |-
        **INSTITUTION**, AREA
        SUMMARY
        HIGHLIGHTS
      degree_column: '**DEGREE**'
      date_and_location_column: |-
        LOCATION
        DATE
    normal_entry:
      main_column: |-
        **NAME**
        SUMMARY
        HIGHLIGHTS
      date_and_location_column: |-
        LOCATION
        DATE
    experience_entry:
      main_column: |-
        **COMPANY**, POSITION
        SUMMARY
        HIGHLIGHTS
      date_and_location_column: |-
        LOCATION
        DATE
    publication_entry:
      main_column: |-
        **TITLE**
        SUMMARY
        AUTHORS
        URL (JOURNAL)
      date_and_location_column: DATE
`,engineeringclassic:`design:
  theme: engineeringclassic
  page:
    size: us-letter
    top_margin: 0.7in
    bottom_margin: 0.7in
    left_margin: 0.7in
    right_margin: 0.7in
    show_footer: true
    show_top_note: true
  colors:
    body: rgb(0, 0, 0)
    name: rgb(0, 79, 144)
    headline: rgb(0, 79, 144)
    connections: rgb(0, 79, 144)
    section_titles: rgb(0, 79, 144)
    links: rgb(0, 79, 144)
    footer: rgb(128, 128, 128)
    top_note: rgb(128, 128, 128)
  typography:
    line_spacing: 0.6em
    alignment: justified
    date_and_location_column_alignment: right
    font_family:
      body: Raleway
      name: Raleway
      headline: Raleway
      connections: Raleway
      section_titles: Raleway
    font_size:
      body: 10pt
      name: 30pt
      headline: 10pt
      connections: 10pt
      section_titles: 1.4em
    small_caps:
      name: false
      headline: false
      connections: false
      section_titles: false
    bold:
      name: false
      headline: false
      connections: false
      section_titles: false
  links:
    underline: false
    show_external_link_icon: false
  header:
    alignment: left
    photo_width: 3.5cm
    photo_position: left
    photo_space_left: 0.4cm
    photo_space_right: 0.4cm
    space_below_name: 0.7cm
    space_below_headline: 0.7cm
    space_below_connections: 0.7cm
    connections:
      phone_number_format: national
      hyperlink: true
      show_icons: true
      display_urls_instead_of_usernames: false
      separator: ''
      space_between_connections: 0.5cm
  section_titles:
    type: with_full_line
    line_thickness: 0.5pt
    space_above: 0.5cm
    space_below: 0.3cm
  sections:
    allow_page_break: true
    space_between_regular_entries: 1.2em
    space_between_text_based_entries: 0.3em
    show_time_spans_in: []
  entries:
    date_and_location_width: 4.15cm
    side_space: 0.2cm
    space_between_columns: 0.1cm
    allow_page_break: false
    short_second_row: false
    degree_width: 1cm
    summary:
      space_above: 0.12cm
      space_left: 0cm
    highlights:
      bullet: •
      nested_bullet: •
      space_left: 0cm
      space_above: 0.12cm
      space_between_items: 0.12cm
      space_between_bullet_and_text: 0.5em
  templates:
    footer: '*NAME -- PAGE_NUMBER/TOTAL_PAGES*'
    top_note: '*LAST_UPDATED CURRENT_DATE*'
    single_date: MONTH_ABBREVIATION YEAR
    date_range: START_DATE – END_DATE
    time_span: HOW_MANY_YEARS YEARS HOW_MANY_MONTHS MONTHS
    one_line_entry:
      main_column: '**LABEL:** DETAILS'
    education_entry:
      main_column: |-
        **INSTITUTION**, DEGREE_WITH_AREA -- LOCATION
        SUMMARY
        HIGHLIGHTS
      degree_column:
      date_and_location_column: DATE
    normal_entry:
      main_column: |-
        **NAME** -- **LOCATION**
        SUMMARY
        HIGHLIGHTS
      date_and_location_column: DATE
    experience_entry:
      main_column: |-
        **POSITION**, COMPANY -- LOCATION
        SUMMARY
        HIGHLIGHTS
      date_and_location_column: DATE
    publication_entry:
      main_column: |-
        **TITLE**
        SUMMARY
        AUTHORS
        URL (JOURNAL)
      date_and_location_column: DATE
`,engineeringresumes:`design:
  theme: engineeringresumes
  page:
    size: us-letter
    top_margin: 0.7in
    bottom_margin: 0.7in
    left_margin: 0.7in
    right_margin: 0.7in
    show_footer: false
    show_top_note: true
  colors:
    body: rgb(0, 0, 0)
    name: rgb(0, 0, 0)
    headline: rgb(0, 0, 0)
    connections: rgb(0, 0, 0)
    section_titles: rgb(0, 0, 0)
    links: rgb(0, 0, 0)
    footer: rgb(128, 128, 128)
    top_note: rgb(128, 128, 128)
  typography:
    line_spacing: 0.6em
    alignment: justified
    date_and_location_column_alignment: right
    font_family:
      body: XCharter
      name: XCharter
      headline: XCharter
      connections: XCharter
      section_titles: XCharter
    font_size:
      body: 10pt
      name: 25pt
      headline: 10pt
      connections: 10pt
      section_titles: 1.2em
    small_caps:
      name: false
      headline: false
      connections: false
      section_titles: false
    bold:
      name: false
      headline: false
      connections: false
      section_titles: true
  links:
    underline: true
    show_external_link_icon: false
  header:
    alignment: center
    photo_width: 3.5cm
    photo_position: left
    photo_space_left: 0.4cm
    photo_space_right: 0.4cm
    space_below_name: 0.7cm
    space_below_headline: 0.7cm
    space_below_connections: 0.7cm
    connections:
      phone_number_format: national
      hyperlink: true
      show_icons: false
      display_urls_instead_of_usernames: true
      separator: '|'
      space_between_connections: 0.5cm
  section_titles:
    type: with_full_line
    line_thickness: 0.5pt
    space_above: 0.5cm
    space_below: 0.3cm
  sections:
    allow_page_break: true
    space_between_regular_entries: 0.42cm
    space_between_text_based_entries: 0.15cm
    show_time_spans_in: []
  entries:
    date_and_location_width: 4.15cm
    side_space: 0cm
    space_between_columns: 0.1cm
    allow_page_break: false
    short_second_row: false
    degree_width: 1cm
    summary:
      space_above: 0.08cm
      space_left: 0cm
    highlights:
      bullet: ●
      nested_bullet: ●
      space_left: 0cm
      space_above: 0.08cm
      space_between_items: 0.08cm
      space_between_bullet_and_text: 0.3em
  templates:
    footer: '*NAME -- PAGE_NUMBER/TOTAL_PAGES*'
    top_note: '*LAST_UPDATED CURRENT_DATE*'
    single_date: MONTH_ABBREVIATION YEAR
    date_range: START_DATE – END_DATE
    time_span: HOW_MANY_YEARS YEARS HOW_MANY_MONTHS MONTHS
    one_line_entry:
      main_column: '**LABEL:** DETAILS'
    education_entry:
      main_column: |-
        **INSTITUTION**, DEGREE_WITH_AREA -- LOCATION
        SUMMARY
        HIGHLIGHTS
      degree_column:
      date_and_location_column: DATE
    normal_entry:
      main_column: |-
        **NAME** -- **LOCATION**
        SUMMARY
        HIGHLIGHTS
      date_and_location_column: DATE
    experience_entry:
      main_column: |-
        **POSITION**, COMPANY -- LOCATION
        SUMMARY
        HIGHLIGHTS
      date_and_location_column: DATE
    publication_entry:
      main_column: |-
        **TITLE**
        SUMMARY
        AUTHORS
        URL (JOURNAL)
      date_and_location_column: DATE
`,moderncv:`design:
  theme: moderncv
  page:
    size: us-letter
    top_margin: 0.7in
    bottom_margin: 0.7in
    left_margin: 0.7in
    right_margin: 0.7in
    show_footer: true
    show_top_note: true
  colors:
    body: rgb(0, 0, 0)
    name: rgb(0, 79, 144)
    headline: rgb(0, 79, 144)
    connections: rgb(0, 79, 144)
    section_titles: rgb(0, 79, 144)
    links: rgb(0, 79, 144)
    footer: rgb(128, 128, 128)
    top_note: rgb(128, 128, 128)
  typography:
    line_spacing: 0.6em
    alignment: justified
    date_and_location_column_alignment: right
    font_family:
      body: Fontin
      name: Fontin
      headline: Fontin
      connections: Fontin
      section_titles: Fontin
    font_size:
      body: 10pt
      name: 25pt
      headline: 10pt
      connections: 10pt
      section_titles: 1.4em
    small_caps:
      name: false
      headline: false
      connections: false
      section_titles: false
    bold:
      name: false
      headline: false
      connections: false
      section_titles: false
  links:
    underline: true
    show_external_link_icon: false
  header:
    alignment: left
    photo_width: 4.15cm
    photo_position: left
    photo_space_left: 0cm
    photo_space_right: 0.3cm
    space_below_name: 0.7cm
    space_below_headline: 0.7cm
    space_below_connections: 0.7cm
    connections:
      phone_number_format: national
      hyperlink: true
      show_icons: true
      display_urls_instead_of_usernames: false
      separator: ''
      space_between_connections: 0.5cm
  section_titles:
    type: moderncv
    line_thickness: 0.15cm
    space_above: 0.55cm
    space_below: 0.3cm
  sections:
    allow_page_break: true
    space_between_regular_entries: 1.2em
    space_between_text_based_entries: 0.3em
    show_time_spans_in: []
  entries:
    date_and_location_width: 4.15cm
    side_space: 0cm
    space_between_columns: 0.3cm
    allow_page_break: false
    short_second_row: false
    degree_width: 1cm
    summary:
      space_above: 0.1cm
      space_left: 0cm
    highlights:
      bullet: •
      nested_bullet: •
      space_left: 0cm
      space_above: 0.15cm
      space_between_items: 0.1cm
      space_between_bullet_and_text: 0.3em
  templates:
    footer: '*NAME -- PAGE_NUMBER/TOTAL_PAGES*'
    top_note: '*LAST_UPDATED CURRENT_DATE*'
    single_date: MONTH_ABBREVIATION YEAR
    date_range: START_DATE – END_DATE
    time_span: HOW_MANY_YEARS YEARS HOW_MANY_MONTHS MONTHS
    one_line_entry:
      main_column: '**LABEL:** DETAILS'
    education_entry:
      main_column: |-
        **INSTITUTION**, DEGREE_WITH_AREA -- LOCATION
        SUMMARY
        HIGHLIGHTS
      degree_column:
      date_and_location_column: DATE
    normal_entry:
      main_column: |-
        **NAME** -- **LOCATION**
        SUMMARY
        HIGHLIGHTS
      date_and_location_column: DATE
    experience_entry:
      main_column: |-
        **POSITION**, COMPANY -- LOCATION
        SUMMARY
        HIGHLIGHTS
      date_and_location_column: DATE
    publication_entry:
      main_column: |-
        **TITLE**
        SUMMARY
        AUTHORS
        URL (JOURNAL)
      date_and_location_column: DATE
`,sb2nov:`design:
  theme: sb2nov
  page:
    size: us-letter
    top_margin: 0.7in
    bottom_margin: 0.7in
    left_margin: 0.7in
    right_margin: 0.7in
    show_footer: true
    show_top_note: true
  colors:
    body: rgb(0, 0, 0)
    name: rgb(0, 0, 0)
    headline: rgb(0, 0, 0)
    connections: rgb(0, 0, 0)
    section_titles: rgb(0, 0, 0)
    links: rgb(0, 0, 0)
    footer: rgb(128, 128, 128)
    top_note: rgb(128, 128, 128)
  typography:
    line_spacing: 0.6em
    alignment: justified
    date_and_location_column_alignment: right
    font_family:
      body: New Computer Modern
      name: New Computer Modern
      headline: New Computer Modern
      connections: New Computer Modern
      section_titles: New Computer Modern
    font_size:
      body: 10pt
      name: 30pt
      headline: 10pt
      connections: 10pt
      section_titles: 1.4em
    small_caps:
      name: false
      headline: false
      connections: false
      section_titles: false
    bold:
      name: true
      headline: false
      connections: false
      section_titles: true
  links:
    underline: true
    show_external_link_icon: false
  header:
    alignment: center
    photo_width: 3.5cm
    photo_position: left
    photo_space_left: 0.4cm
    photo_space_right: 0.4cm
    space_below_name: 0.7cm
    space_below_headline: 0.7cm
    space_below_connections: 0.7cm
    connections:
      phone_number_format: national
      hyperlink: true
      show_icons: false
      display_urls_instead_of_usernames: true
      separator: •
      space_between_connections: 0.5cm
  section_titles:
    type: with_full_line
    line_thickness: 0.5pt
    space_above: 0.5cm
    space_below: 0.3cm
  sections:
    allow_page_break: true
    space_between_regular_entries: 1.2em
    space_between_text_based_entries: 0.3em
    show_time_spans_in: []
  entries:
    date_and_location_width: 4.15cm
    side_space: 0.2cm
    space_between_columns: 0.1cm
    allow_page_break: false
    short_second_row: false
    degree_width: 1cm
    summary:
      space_above: 0cm
      space_left: 0cm
    highlights:
      bullet: ◦
      nested_bullet: ◦
      space_left: 0.15cm
      space_above: 0cm
      space_between_items: 0cm
      space_between_bullet_and_text: 0.5em
  templates:
    footer: '*NAME -- PAGE_NUMBER/TOTAL_PAGES*'
    top_note: '*LAST_UPDATED CURRENT_DATE*'
    single_date: MONTH_ABBREVIATION YEAR
    date_range: START_DATE – END_DATE
    time_span: HOW_MANY_YEARS YEARS HOW_MANY_MONTHS MONTHS
    one_line_entry:
      main_column: '**LABEL:** DETAILS'
    education_entry:
      main_column: |-
        **INSTITUTION**
        *DEGREE* *in* *AREA*
        SUMMARY
        HIGHLIGHTS
      degree_column:
      date_and_location_column: |-
        *LOCATION*
        *DATE*
    normal_entry:
      main_column: |-
        **NAME**
        SUMMARY
        HIGHLIGHTS
      date_and_location_column: |-
        *LOCATION*
        *DATE*
    experience_entry:
      main_column: |-
        **POSITION**
        *COMPANY*
        SUMMARY
        HIGHLIGHTS
      date_and_location_column: |-
        *LOCATION*
        *DATE*
    publication_entry:
      main_column: |-
        **TITLE**
        SUMMARY
        AUTHORS
        URL (JOURNAL)
      date_and_location_column: DATE
`},vi={english:`locale:
  language: english
  last_updated: Last updated in
  month: month
  months: months
  year: year
  years: years
  present: present
  phrases:
    degree_with_area: DEGREE in AREA
  month_abbreviations:
    - Jan
    - Feb
    - Mar
    - Apr
    - May
    - June
    - July
    - Aug
    - Sept
    - Oct
    - Nov
    - Dec
  month_names:
    - January
    - February
    - March
    - April
    - May
    - June
    - July
    - August
    - September
    - October
    - November
    - December
`,arabic:`locale:
  language: arabic
  last_updated: آخر تحديث في
  month: شهر
  months: أشهر
  year: سنة
  years: سنوات
  present: الحاضر
  phrases:
    degree_with_area: DEGREE في AREA
  month_abbreviations:
    - ينا
    - فبر
    - مار
    - أبر
    - ماي
    - يون
    - يول
    - أغس
    - سبت
    - أكت
    - نوف
    - ديس
  month_names:
    - يناير
    - فبراير
    - مارس
    - أبريل
    - مايو
    - يونيو
    - يوليو
    - أغسطس
    - سبتمبر
    - أكتوبر
    - نوفمبر
    - ديسمبر
`,danish:`locale:
  language: danish
  last_updated: Senest opdateret
  month: måned
  months: måneder
  year: år
  years: år
  present: nuværende
  phrases:
    degree_with_area: DEGREE i AREA
  month_abbreviations:
    - Jan
    - Feb
    - Mar
    - Apr
    - Maj
    - Jun
    - Jul
    - Aug
    - Sep
    - Okt
    - Nov
    - Dec
  month_names:
    - Januar
    - Februar
    - Marts
    - April
    - Maj
    - Juni
    - Juli
    - August
    - September
    - Oktober
    - November
    - December
`,dutch:`locale:
  language: dutch
  last_updated: Laatst bijgewerkt
  month: maand
  months: maanden
  year: jaar
  years: jaren
  present: heden
  phrases:
    degree_with_area: DEGREE in AREA
  month_abbreviations:
    - Jan
    - Feb
    - Mrt
    - Apr
    - Mei
    - Jun
    - Jul
    - Aug
    - Sep
    - Okt
    - Nov
    - Dec
  month_names:
    - Januari
    - Februari
    - Maart
    - April
    - Mei
    - Juni
    - Juli
    - Augustus
    - September
    - Oktober
    - November
    - December
`,french:`locale:
  language: french
  last_updated: Dernière mise à jour
  month: mois
  months: mois
  year: an
  years: ans
  present: présent
  phrases:
    degree_with_area: DEGREE en AREA
  month_abbreviations:
    - Jan
    - Fév
    - Mar
    - Avr
    - Mai
    - Juin
    - Juil
    - Aoû
    - Sep
    - Oct
    - Nov
    - Déc
  month_names:
    - Janvier
    - Février
    - Mars
    - Avril
    - Mai
    - Juin
    - Juillet
    - Août
    - Septembre
    - Octobre
    - Novembre
    - Décembre
`,german:`locale:
  language: german
  last_updated: Zuletzt aktualisiert
  month: Monat
  months: Monate
  year: Jahr
  years: Jahre
  present: gegenwärtig
  phrases:
    degree_with_area: DEGREE in AREA
  month_abbreviations:
    - Jan
    - Feb
    - Mär
    - Apr
    - Mai
    - Jun
    - Jul
    - Aug
    - Sep
    - Okt
    - Nov
    - Dez
  month_names:
    - Januar
    - Februar
    - März
    - April
    - Mai
    - Juni
    - Juli
    - August
    - September
    - Oktober
    - November
    - Dezember
`,hebrew:`locale:
  language: hebrew
  last_updated: עודכן לאחרונה ב
  month: חודש
  months: חודשים
  year: שנה
  years: שנים
  present: הווה
  phrases:
    degree_with_area: DEGREE בAREA
  month_abbreviations:
    - ינו'
    - פבר'
    - מרץ
    - אפר'
    - מאי
    - יוני
    - יולי
    - אוג'
    - ספט'
    - אוק'
    - נוב'
    - דצמ'
  month_names:
    - ינואר
    - פברואר
    - מרץ
    - אפריל
    - מאי
    - יוני
    - יולי
    - אוגוסט
    - ספטמבר
    - אוקטובר
    - נובמבר
    - דצמבר
`,hindi:`locale:
  language: hindi
  last_updated: अंतिम अद्यतन
  month: महीना
  months: महीने
  year: वर्ष
  years: वर्ष
  present: वर्तमान
  phrases:
    degree_with_area: AREA में DEGREE
  month_abbreviations:
    - जन
    - फर
    - मार
    - अप्र
    - मई
    - जून
    - जुल
    - अग
    - सित
    - अक्ट
    - नव
    - दिस
  month_names:
    - जनवरी
    - फरवरी
    - मार्च
    - अप्रैल
    - मई
    - जून
    - जुलाई
    - अगस्त
    - सितंबर
    - अक्टूबर
    - नवंबर
    - दिसंबर
`,indonesian:`locale:
  language: indonesian
  last_updated: Terakhir diperbarui
  month: bulan
  months: bulan
  year: tahun
  years: tahun
  present: sekarang
  phrases:
    degree_with_area: DEGREE di AREA
  month_abbreviations:
    - Jan
    - Feb
    - Mar
    - Apr
    - Mei
    - Jun
    - Jul
    - Agu
    - Sep
    - Okt
    - Nov
    - Des
  month_names:
    - Januari
    - Februari
    - Maret
    - April
    - Mei
    - Juni
    - Juli
    - Agustus
    - September
    - Oktober
    - November
    - Desember
`,italian:`locale:
  language: italian
  last_updated: Ultimo aggiornamento
  month: mese
  months: mesi
  year: anno
  years: anni
  present: presente
  phrases:
    degree_with_area: DEGREE in AREA
  month_abbreviations:
    - Gen
    - Feb
    - Mar
    - Apr
    - Mag
    - Giu
    - Lug
    - Ago
    - Set
    - Ott
    - Nov
    - Dic
  month_names:
    - Gennaio
    - Febbraio
    - Marzo
    - Aprile
    - Maggio
    - Giugno
    - Luglio
    - Agosto
    - Settembre
    - Ottobre
    - Novembre
    - Dicembre
`,japanese:`locale:
  language: japanese
  last_updated: 最終更新
  month: 月
  months: ヶ月
  year: 年
  years: 年
  present: 現在
  phrases:
    degree_with_area: AREA DEGREE
  month_abbreviations:
    - 1月
    - 2月
    - 3月
    - 4月
    - 5月
    - 6月
    - 7月
    - 8月
    - 9月
    - 10月
    - 11月
    - 12月
  month_names:
    - 1月
    - 2月
    - 3月
    - 4月
    - 5月
    - 6月
    - 7月
    - 8月
    - 9月
    - 10月
    - 11月
    - 12月
`,korean:`locale:
  language: korean
  last_updated: 마지막 업데이트
  month: 월
  months: 개월
  year: 년
  years: 년
  present: 현재
  phrases:
    degree_with_area: AREA DEGREE
  month_abbreviations:
    - 1월
    - 2월
    - 3월
    - 4월
    - 5월
    - 6월
    - 7월
    - 8월
    - 9월
    - 10월
    - 11월
    - 12월
  month_names:
    - 1월
    - 2월
    - 3월
    - 4월
    - 5월
    - 6월
    - 7월
    - 8월
    - 9월
    - 10월
    - 11월
    - 12월
`,mandarin_chinese:`locale:
  language: mandarin_chinese
  last_updated: 最后更新于
  month: 个月
  months: 个月
  year: 年
  years: 年
  present: 至今
  phrases:
    degree_with_area: AREA DEGREE
  month_abbreviations:
    - 1月
    - 2月
    - 3月
    - 4月
    - 5月
    - 6月
    - 7月
    - 8月
    - 9月
    - 10月
    - 11月
    - 12月
  month_names:
    - 一月
    - 二月
    - 三月
    - 四月
    - 五月
    - 六月
    - 七月
    - 八月
    - 九月
    - 十月
    - 十一月
    - 十二月
`,norwegian_bokmål:`locale:
  language: norwegian_bokmål
  last_updated: Sist oppdatert
  month: måned
  months: måneder
  year: år
  years: år
  present: nåværende
  phrases:
    degree_with_area: DEGREE i AREA
  month_abbreviations:
    - Jan
    - Feb
    - Mar
    - Apr
    - Mai
    - Jun
    - Jul
    - Aug
    - Sep
    - Okt
    - Nov
    - Des
  month_names:
    - Januar
    - Februar
    - Mars
    - April
    - Mai
    - Juni
    - Juli
    - August
    - September
    - Oktober
    - November
    - Desember
`,norwegian_nynorsk:`locale:
  language: norwegian_nynorsk
  last_updated: Sist oppdatert
  month: månad
  months: månader
  year: år
  years: år
  present: nåverande
  phrases:
    degree_with_area: DEGREE i AREA
  month_abbreviations:
    - Jan
    - Feb
    - Mar
    - Apr
    - Mai
    - Jun
    - Jul
    - Aug
    - Sep
    - Okt
    - Nov
    - Des
  month_names:
    - Januar
    - Februar
    - Mars
    - April
    - Mai
    - Juni
    - Juli
    - August
    - September
    - Oktober
    - November
    - Desember
`,persian:`locale:
  language: persian
  last_updated: آخرین به‌روزرسانی در
  month: ماه
  months: ماه
  year: سال
  years: سال
  present: حال
  phrases:
    degree_with_area: DEGREE در AREA
  month_abbreviations:
    - ژان
    - فور
    - مار
    - آور
    - مه
    - ژون
    - ژول
    - اوت
    - سپت
    - اکت
    - نوا
    - دسا
  month_names:
    - ژانویه
    - فوریه
    - مارس
    - آوریل
    - مه
    - ژوئن
    - ژوئیه
    - اوت
    - سپتامبر
    - اکتبر
    - نوامبر
    - دسامبر
`,portuguese:`locale:
  language: portuguese
  last_updated: Última atualização
  month: mês
  months: meses
  year: ano
  years: anos
  present: presente
  phrases:
    degree_with_area: DEGREE em AREA
  month_abbreviations:
    - Jan
    - Fev
    - Mar
    - Abr
    - Mai
    - Jun
    - Jul
    - Ago
    - Set
    - Out
    - Nov
    - Dez
  month_names:
    - Janeiro
    - Fevereiro
    - Março
    - Abril
    - Maio
    - Junho
    - Julho
    - Agosto
    - Setembro
    - Outubro
    - Novembro
    - Dezembro
`,russian:`locale:
  language: russian
  last_updated: Последнее обновление
  month: месяц
  months: месяцы
  year: год
  years: лет
  present: настоящее время
  phrases:
    degree_with_area: DEGREE в AREA
  month_abbreviations:
    - Янв
    - Фев
    - Мар
    - Апр
    - Май
    - Июн
    - Июл
    - Авг
    - Сен
    - Окт
    - Ноя
    - Дек
  month_names:
    - Январь
    - Февраль
    - Март
    - Апрель
    - Май
    - Июнь
    - Июль
    - Август
    - Сентябрь
    - Октябрь
    - Ноябрь
    - Декабрь
`,spanish:`locale:
  language: spanish
  last_updated: Última actualización
  month: mes
  months: meses
  year: año
  years: años
  present: presente
  phrases:
    degree_with_area: DEGREE en AREA
  month_abbreviations:
    - Ene
    - Feb
    - Mar
    - Abr
    - May
    - Jun
    - Jul
    - Ago
    - Sep
    - Oct
    - Nov
    - Dic
  month_names:
    - Enero
    - Febrero
    - Marzo
    - Abril
    - Mayo
    - Junio
    - Julio
    - Agosto
    - Septiembre
    - Octubre
    - Noviembre
    - Diciembre
`,turkish:`locale:
  language: turkish
  last_updated: Son güncelleme
  month: ay
  months: ay
  year: yıl
  years: yıl
  present: halen
  phrases:
    degree_with_area: AREA, DEGREE
  month_abbreviations:
    - Oca
    - Şub
    - Mar
    - Nis
    - May
    - Haz
    - Tem
    - Ağu
    - Eyl
    - Eki
    - Kas
    - Ara
  month_names:
    - Ocak
    - Şubat
    - Mart
    - Nisan
    - Mayıs
    - Haziran
    - Temmuz
    - Ağustos
    - Eylül
    - Ekim
    - Kasım
    - Aralık
`};function Bn(){if(typeof crypto<"u"&&typeof crypto.randomUUID=="function")return crypto.randomUUID();const t=crypto.getRandomValues(new Uint8Array(16));t[6]=t[6]&15|64,t[8]=t[8]&63|128;const e=Array.from(t,n=>n.toString(16).padStart(2,"0")).join("");return`${e.slice(0,8)}-${e.slice(8,12)}-${e.slice(12,16)}-${e.slice(16,20)}-${e.slice(20)}`}const q={cv:`cv:
  name: John Doe
  headline:
  location: San Francisco, CA
  email: john.doe@email.com
  photo:
  phone:
  website: https://rendercv.com/
  social_networks:
    - network: LinkedIn
      username: rendercv
    - network: GitHub
      username: rendercv
  custom_connections:
  sections:
    Welcome to RenderCV:
      - RenderCV reads a CV written in a YAML file, and generates a PDF with professional typography.
      - Each section title is arbitrary.
      - You can choose any of the 9 entry types for each section.
      - Markdown syntax is supported everywhere. This is **bold**, *italic*, and [link](https://example.com).
    education:
      - institution: Princeton University
        area: Computer Science
        degree: PhD
        date:
        start_date: 2018-09
        end_date: 2023-05
        location: Princeton, NJ
        summary:
        highlights:
          - 'Thesis: Efficient Neural Architecture Search for Resource-Constrained Deployment'
          - 'Advisor: Prof. Sanjeev Arora'
          - NSF Graduate Research Fellowship, Siebel Scholar (Class of 2022)
      - institution: Boğaziçi University
        area: Computer Engineering
        degree: BS
        date:
        start_date: 2014-09
        end_date: 2018-06
        location: Istanbul, Türkiye
        summary:
        highlights:
          - 'GPA: 3.97/4.00, Valedictorian'
          - Fulbright Scholarship recipient for Graduate Studies
    experience:
      - company: Nexus AI
        position: Co-Founder & CTO
        date:
        start_date: 2023-06
        end_date: present
        location: San Francisco, CA
        summary:
        highlights:
          - Built foundation model infrastructure serving 2M+ monthly API requests with 99.97% uptime
          - Raised $18M Series A led by Sequoia Capital, with participation from a16z and Founders Fund
          - Scaled engineering team from 3 to 28 across ML research, platform, and applied AI divisions
          - Developed proprietary inference optimization reducing latency by 73% compared to baseline
      - company: NVIDIA Research
        position: Research Intern
        date:
        start_date: 2022-05
        end_date: 2022-08
        location: Santa Clara, CA
        summary:
        highlights:
          - Designed sparse attention mechanism reducing transformer memory footprint by 4.2x
          - Co-authored paper accepted at NeurIPS 2022 (spotlight presentation, top 5% of submissions)
      - company: Google DeepMind
        position: Research Intern
        date:
        start_date: 2021-05
        end_date: 2021-08
        location: London, UK
        summary:
        highlights:
          - Developed reinforcement learning algorithms for multi-agent coordination
          - Published research at top-tier venues with significant academic impact
            - ICML 2022 main conference paper, cited 340+ times within two years
            - NeurIPS 2022 workshop paper on emergent communication protocols
            - Invited journal extension in JMLR (2023)
      - company: Apple ML Research
        position: Research Intern
        date:
        start_date: 2020-05
        end_date: 2020-08
        location: Cupertino, CA
        summary:
        highlights:
          - Created on-device neural network compression pipeline deployed across 50M+ devices
          - Filed 2 patents on efficient model quantization techniques for edge inference
      - company: Microsoft Research
        position: Research Intern
        date:
        start_date: 2019-05
        end_date: 2019-08
        location: Redmond, WA
        summary:
        highlights:
          - Implemented novel self-supervised learning framework for low-resource language modeling
          - Research integrated into Azure Cognitive Services, reducing training data requirements by 60%
    projects:
      - name: '[FlashInfer](https://github.com/)'
        date:
        start_date: 2023-01
        end_date: present
        location:
        summary: Open-source library for high-performance LLM inference kernels
        highlights:
          - Achieved 2.8x speedup over baseline attention implementations on A100 GPUs
          - Adopted by 3 major AI labs, 8,500+ GitHub stars, 200+ contributors
      - name: '[NeuralPrune](https://github.com/)'
        date: '2021'
        start_date:
        end_date:
        location:
        summary: Automated neural network pruning toolkit with differentiable masks
        highlights:
          - Reduced model size by 90% with less than 1% accuracy degradation on ImageNet
          - Featured in PyTorch ecosystem tools, 4,200+ GitHub stars
    publications:
      - title: 'Sparse Mixture-of-Experts at Scale: Efficient Routing for Trillion-Parameter Models'
        authors:
          - '*John Doe*'
          - Sarah Williams
          - David Park
        summary:
        doi: 10.1234/neurips.2023.1234
        url:
        journal: NeurIPS 2023
        date: 2023-07
      - title: Neural Architecture Search via Differentiable Pruning
        authors:
          - James Liu
          - '*John Doe*'
        summary:
        doi: 10.1234/neurips.2022.5678
        url:
        journal: NeurIPS 2022, Spotlight
        date: 2022-12
      - title: Multi-Agent Reinforcement Learning with Emergent Communication
        authors:
          - Maria Garcia
          - '*John Doe*'
          - Tom Anderson
        summary:
        doi: 10.1234/icml.2022.9012
        url:
        journal: ICML 2022
        date: 2022-07
      - title: On-Device Model Compression via Learned Quantization
        authors:
          - '*John Doe*'
          - Kevin Wu
        summary:
        doi: 10.1234/iclr.2021.3456
        url:
        journal: ICLR 2021, Best Paper Award
        date: 2021-05
    selected_honors:
      - bullet: MIT Technology Review 35 Under 35 Innovators (2024)
      - bullet: Forbes 30 Under 30 in Enterprise Technology (2024)
      - bullet: ACM Doctoral Dissertation Award Honorable Mention (2023)
      - bullet: Google PhD Fellowship in Machine Learning (2020 – 2023)
      - bullet: Fulbright Scholarship for Graduate Studies (2018)
    skills:
      - label: Languages
        details: Python, C++, CUDA, Rust, Julia
      - label: ML Frameworks
        details: PyTorch, JAX, TensorFlow, Triton, ONNX
      - label: Infrastructure
        details: Kubernetes, Ray, distributed training, AWS, GCP
      - label: Research Areas
        details: Neural architecture search, model compression, efficient inference, multi-agent RL
    patents:
      - number: Adaptive Quantization for Neural Network Inference on Edge Devices (US Patent 11,234,567)
      - number: Dynamic Sparsity Patterns for Efficient Transformer Attention (US Patent 11,345,678)
      - number: Hardware-Aware Neural Architecture Search Method (US Patent 11,456,789)
    invited_talks:
      - reversed_number: Scaling Laws for Efficient Inference — Stanford HAI Symposium (2024)
      - reversed_number: Building AI Infrastructure for the Next Decade — TechCrunch Disrupt (2024)
      - reversed_number: 'From Research to Production: Lessons in ML Systems — NeurIPS Workshop (2023)'
      - reversed_number: "Efficient Deep Learning: A Practitioner's Perspective — Google Tech Talk (2022)"
`,design:`design:
  theme: classic
  page:
    size: us-letter
    top_margin: 0.7in
    bottom_margin: 0.7in
    left_margin: 0.7in
    right_margin: 0.7in
    show_footer: true
    show_top_note: true
  colors:
    body: rgb(0, 0, 0)
    name: rgb(0, 79, 144)
    headline: rgb(0, 79, 144)
    connections: rgb(0, 79, 144)
    section_titles: rgb(0, 79, 144)
    links: rgb(0, 79, 144)
    footer: rgb(128, 128, 128)
    top_note: rgb(128, 128, 128)
  typography:
    line_spacing: 0.6em
    alignment: justified
    date_and_location_column_alignment: right
    font_family:
      body: Source Sans 3
      name: Source Sans 3
      headline: Source Sans 3
      connections: Source Sans 3
      section_titles: Source Sans 3
    font_size:
      body: 10pt
      name: 30pt
      headline: 10pt
      connections: 10pt
      section_titles: 1.4em
    small_caps:
      name: false
      headline: false
      connections: false
      section_titles: false
    bold:
      name: true
      headline: false
      connections: false
      section_titles: true
  links:
    underline: false
    show_external_link_icon: false
  header:
    alignment: center
    photo_width: 3.5cm
    photo_position: left
    photo_space_left: 0.4cm
    photo_space_right: 0.4cm
    space_below_name: 0.7cm
    space_below_headline: 0.7cm
    space_below_connections: 0.7cm
    connections:
      phone_number_format: national
      hyperlink: true
      show_icons: true
      display_urls_instead_of_usernames: false
      separator: ''
      space_between_connections: 0.5cm
  section_titles:
    type: with_partial_line
    line_thickness: 0.5pt
    space_above: 0.5cm
    space_below: 0.3cm
  sections:
    allow_page_break: true
    space_between_regular_entries: 1.2em
    space_between_text_based_entries: 0.3em
    show_time_spans_in:
      - experience
  entries:
    date_and_location_width: 4.15cm
    side_space: 0.2cm
    space_between_columns: 0.1cm
    allow_page_break: false
    short_second_row: true
    degree_width: 1cm
    summary:
      space_above: 0cm
      space_left: 0cm
    highlights:
      bullet: •
      nested_bullet: •
      space_left: 0.15cm
      space_above: 0cm
      space_between_items: 0cm
      space_between_bullet_and_text: 0.5em
  templates:
    footer: '*NAME -- PAGE_NUMBER/TOTAL_PAGES*'
    top_note: '*LAST_UPDATED CURRENT_DATE*'
    single_date: MONTH_ABBREVIATION YEAR
    date_range: START_DATE – END_DATE
    time_span: HOW_MANY_YEARS YEARS HOW_MANY_MONTHS MONTHS
    one_line_entry:
      main_column: '**LABEL:** DETAILS'
    education_entry:
      main_column: |-
        **INSTITUTION**, AREA
        SUMMARY
        HIGHLIGHTS
      degree_column: '**DEGREE**'
      date_and_location_column: |-
        LOCATION
        DATE
    normal_entry:
      main_column: |-
        **NAME**
        SUMMARY
        HIGHLIGHTS
      date_and_location_column: |-
        LOCATION
        DATE
    experience_entry:
      main_column: |-
        **COMPANY**, POSITION
        SUMMARY
        HIGHLIGHTS
      date_and_location_column: |-
        LOCATION
        DATE
    publication_entry:
      main_column: |-
        **TITLE**
        SUMMARY
        AUTHORS
        URL (JOURNAL)
      date_and_location_column: DATE
`,locale:`locale:
  language: english
  last_updated: Last updated in
  month: month
  months: months
  year: year
  years: years
  present: present
  phrases:
    degree_with_area: DEGREE in AREA
  month_abbreviations:
    - Jan
    - Feb
    - Mar
    - Apr
    - May
    - June
    - July
    - Aug
    - Sept
    - Oct
    - Nov
    - Dec
  month_names:
    - January
    - February
    - March
    - April
    - May
    - June
    - July
    - August
    - September
    - October
    - November
    - December
`,settings:`settings:
  current_date: today
  bold_keywords: []
  pdf_title: NAME - CV
`},wi={cv:`cv:
  name: John Doe
  headline:
  location: San Francisco, CA
  email: john.doe@email.com
  photo:
  phone:
  website: https://rendercv.com/
  social_networks:
    - network: LinkedIn
      username: rendercv
    - network: GitHub
      username: rendercv
  custom_connections:
  sections:
    Welcome to RenderCV:
      - RenderCV reads a CV written in a YAML file, and generates a PDF with professional typography.
      - Each section title is arbitrary.
      - You can choose any of the 9 entry types for each section.
      - Markdown syntax is supported everywhere. This is **bold**, *italic*, and [link](https://example.com).
    education:
      - institution: Princeton University
        area: Computer Science
        degree: PhD
        date:
        start_date: 2018-09
        end_date: 2023-05
        location: Princeton, NJ
        summary:
        highlights:
          - 'Thesis: Efficient Neural Architecture Search for Resource-Constrained Deployment'
          - 'Advisor: Prof. Sanjeev Arora'
          - NSF Graduate Research Fellowship, Siebel Scholar (Class of 2022)
      - institution: Boğaziçi University
        area: Computer Engineering
        degree: BS
        date:
        start_date: 2014-09
        end_date: 2018-06
        location: Istanbul, Türkiye
        summary:
        highlights:
          - 'GPA: 3.97/4.00, Valedictorian'
          - Fulbright Scholarship recipient for Graduate Studies
    experience:
      - company: Nexus AI
        position: Co-Founder & CTO
        date:
        start_date: 2023-06
        end_date: present
        location: San Francisco, CA
        summary:
        highlights:
          - Built foundation model infrastructure serving 2M+ monthly API requests with 99.97% uptime
          - Raised $18M Series A led by Sequoia Capital, with participation from a16z and Founders Fund
          - Scaled engineering team from 3 to 28 across ML research, platform, and applied AI divisions
          - Developed proprietary inference optimization reducing latency by 73% compared to baseline
      - company: NVIDIA Research
        position: Research Intern
        date:
        start_date: 2022-05
        end_date: 2022-08
        location: Santa Clara, CA
        summary:
        highlights:
          - Designed sparse attention mechanism reducing transformer memory footprint by 4.2x
          - Co-authored paper accepted at NeurIPS 2022 (spotlight presentation, top 5% of submissions)
      - company: Google DeepMind
        position: Research Intern
        date:
        start_date: 2021-05
        end_date: 2021-08
        location: London, UK
        summary:
        highlights:
          - Developed reinforcement learning algorithms for multi-agent coordination
          - Published research at top-tier venues with significant academic impact
            - ICML 2022 main conference paper, cited 340+ times within two years
            - NeurIPS 2022 workshop paper on emergent communication protocols
            - Invited journal extension in JMLR (2023)
      - company: Apple ML Research
        position: Research Intern
        date:
        start_date: 2020-05
        end_date: 2020-08
        location: Cupertino, CA
        summary:
        highlights:
          - Created on-device neural network compression pipeline deployed across 50M+ devices
          - Filed 2 patents on efficient model quantization techniques for edge inference
      - company: Microsoft Research
        position: Research Intern
        date:
        start_date: 2019-05
        end_date: 2019-08
        location: Redmond, WA
        summary:
        highlights:
          - Implemented novel self-supervised learning framework for low-resource language modeling
          - Research integrated into Azure Cognitive Services, reducing training data requirements by 60%
    projects:
      - name: '[FlashInfer](https://github.com/)'
        date:
        start_date: 2023-01
        end_date: present
        location:
        summary: Open-source library for high-performance LLM inference kernels
        highlights:
          - Achieved 2.8x speedup over baseline attention implementations on A100 GPUs
          - Adopted by 3 major AI labs, 8,500+ GitHub stars, 200+ contributors
      - name: '[NeuralPrune](https://github.com/)'
        date: '2021'
        start_date:
        end_date:
        location:
        summary: Automated neural network pruning toolkit with differentiable masks
        highlights:
          - Reduced model size by 90% with less than 1% accuracy degradation on ImageNet
          - Featured in PyTorch ecosystem tools, 4,200+ GitHub stars
    publications:
      - title: 'Sparse Mixture-of-Experts at Scale: Efficient Routing for Trillion-Parameter Models'
        authors:
          - '*John Doe*'
          - Sarah Williams
          - David Park
        summary:
        doi: 10.1234/neurips.2023.1234
        url:
        journal: NeurIPS 2023
        date: 2023-07
      - title: Neural Architecture Search via Differentiable Pruning
        authors:
          - James Liu
          - '*John Doe*'
        summary:
        doi: 10.1234/neurips.2022.5678
        url:
        journal: NeurIPS 2022, Spotlight
        date: 2022-12
      - title: Multi-Agent Reinforcement Learning with Emergent Communication
        authors:
          - Maria Garcia
          - '*John Doe*'
          - Tom Anderson
        summary:
        doi: 10.1234/icml.2022.9012
        url:
        journal: ICML 2022
        date: 2022-07
      - title: On-Device Model Compression via Learned Quantization
        authors:
          - '*John Doe*'
          - Kevin Wu
        summary:
        doi: 10.1234/iclr.2021.3456
        url:
        journal: ICLR 2021, Best Paper Award
        date: 2021-05
    selected_honors:
      - bullet: MIT Technology Review 35 Under 35 Innovators (2024)
      - bullet: Forbes 30 Under 30 in Enterprise Technology (2024)
      - bullet: ACM Doctoral Dissertation Award Honorable Mention (2023)
      - bullet: Google PhD Fellowship in Machine Learning (2020 – 2023)
      - bullet: Fulbright Scholarship for Graduate Studies (2018)
    skills:
      - label: Languages
        details: Python, C++, CUDA, Rust, Julia
      - label: ML Frameworks
        details: PyTorch, JAX, TensorFlow, Triton, ONNX
      - label: Infrastructure
        details: Kubernetes, Ray, distributed training, AWS, GCP
      - label: Research Areas
        details: Neural architecture search, model compression, efficient inference, multi-agent RL
    patents:
      - number: Adaptive Quantization for Neural Network Inference on Edge Devices (US Patent 11,234,567)
      - number: Dynamic Sparsity Patterns for Efficient Transformer Attention (US Patent 11,345,678)
      - number: Hardware-Aware Neural Architecture Search Method (US Patent 11,456,789)
    invited_talks:
      - reversed_number: Scaling Laws for Efficient Inference — Stanford HAI Symposium (2024)
      - reversed_number: Building AI Infrastructure for the Next Decade — TechCrunch Disrupt (2024)
      - reversed_number: 'From Research to Production: Lessons in ML Systems — NeurIPS Workshop (2023)'
      - reversed_number: "Efficient Deep Learning: A Practitioner's Perspective — Google Tech Talk (2022)"
`,design:`design:
  theme: engineeringclassic
  page:
    size: us-letter
    top_margin: 0.7in
    bottom_margin: 0.7in
    left_margin: 0.7in
    right_margin: 0.7in
    show_footer: true
    show_top_note: true
  colors:
    body: rgb(0, 0, 0)
    name: rgb(0, 79, 144)
    headline: rgb(0, 79, 144)
    connections: rgb(0, 79, 144)
    section_titles: rgb(0, 79, 144)
    links: rgb(0, 79, 144)
    footer: rgb(128, 128, 128)
    top_note: rgb(128, 128, 128)
  typography:
    line_spacing: 0.6em
    alignment: justified
    date_and_location_column_alignment: right
    font_family:
      body: Raleway
      name: Raleway
      headline: Raleway
      connections: Raleway
      section_titles: Raleway
    font_size:
      body: 10pt
      name: 30pt
      headline: 10pt
      connections: 10pt
      section_titles: 1.4em
    small_caps:
      name: false
      headline: false
      connections: false
      section_titles: false
    bold:
      name: false
      headline: false
      connections: false
      section_titles: false
  links:
    underline: false
    show_external_link_icon: false
  header:
    alignment: left
    photo_width: 3.5cm
    photo_position: left
    photo_space_left: 0.4cm
    photo_space_right: 0.4cm
    space_below_name: 0.7cm
    space_below_headline: 0.7cm
    space_below_connections: 0.7cm
    connections:
      phone_number_format: national
      hyperlink: true
      show_icons: true
      display_urls_instead_of_usernames: false
      separator: ''
      space_between_connections: 0.5cm
  section_titles:
    type: with_full_line
    line_thickness: 0.5pt
    space_above: 0.5cm
    space_below: 0.3cm
  sections:
    allow_page_break: true
    space_between_regular_entries: 1.2em
    space_between_text_based_entries: 0.3em
    show_time_spans_in: []
  entries:
    date_and_location_width: 4.15cm
    side_space: 0.2cm
    space_between_columns: 0.1cm
    allow_page_break: false
    short_second_row: false
    degree_width: 1cm
    summary:
      space_above: 0.12cm
      space_left: 0cm
    highlights:
      bullet: •
      nested_bullet: •
      space_left: 0cm
      space_above: 0.12cm
      space_between_items: 0.12cm
      space_between_bullet_and_text: 0.5em
  templates:
    footer: '*NAME -- PAGE_NUMBER/TOTAL_PAGES*'
    top_note: '*LAST_UPDATED CURRENT_DATE*'
    single_date: MONTH_ABBREVIATION YEAR
    date_range: START_DATE – END_DATE
    time_span: HOW_MANY_YEARS YEARS HOW_MANY_MONTHS MONTHS
    one_line_entry:
      main_column: '**LABEL:** DETAILS'
    education_entry:
      main_column: |-
        **INSTITUTION**, DEGREE_WITH_AREA -- LOCATION
        SUMMARY
        HIGHLIGHTS
      degree_column:
      date_and_location_column: DATE
    normal_entry:
      main_column: |-
        **NAME** -- **LOCATION**
        SUMMARY
        HIGHLIGHTS
      date_and_location_column: DATE
    experience_entry:
      main_column: |-
        **POSITION**, COMPANY -- LOCATION
        SUMMARY
        HIGHLIGHTS
      date_and_location_column: DATE
    publication_entry:
      main_column: |-
        **TITLE**
        SUMMARY
        AUTHORS
        URL (JOURNAL)
      date_and_location_column: DATE
`,locale:`locale:
  language: english
  last_updated: Last updated in
  month: month
  months: months
  year: year
  years: years
  present: present
  phrases:
    degree_with_area: DEGREE in AREA
  month_abbreviations:
    - Jan
    - Feb
    - Mar
    - Apr
    - May
    - June
    - July
    - Aug
    - Sept
    - Oct
    - Nov
    - Dec
  month_names:
    - January
    - February
    - March
    - April
    - May
    - June
    - July
    - August
    - September
    - October
    - November
    - December
`,settings:`settings:
  current_date: today
  bold_keywords: []
  pdf_title: NAME - CV
`},Ti={cv:`cv:
  name: John Doe
  headline:
  location: San Francisco, CA
  email: john.doe@email.com
  photo:
  phone:
  website: https://rendercv.com/
  social_networks:
    - network: LinkedIn
      username: rendercv
    - network: GitHub
      username: rendercv
  custom_connections:
  sections:
    Welcome to RenderCV:
      - RenderCV reads a CV written in a YAML file, and generates a PDF with professional typography.
      - Each section title is arbitrary.
      - You can choose any of the 9 entry types for each section.
      - Markdown syntax is supported everywhere. This is **bold**, *italic*, and [link](https://example.com).
    education:
      - institution: Princeton University
        area: Computer Science
        degree: PhD
        date:
        start_date: 2018-09
        end_date: 2023-05
        location: Princeton, NJ
        summary:
        highlights:
          - 'Thesis: Efficient Neural Architecture Search for Resource-Constrained Deployment'
          - 'Advisor: Prof. Sanjeev Arora'
          - NSF Graduate Research Fellowship, Siebel Scholar (Class of 2022)
      - institution: Boğaziçi University
        area: Computer Engineering
        degree: BS
        date:
        start_date: 2014-09
        end_date: 2018-06
        location: Istanbul, Türkiye
        summary:
        highlights:
          - 'GPA: 3.97/4.00, Valedictorian'
          - Fulbright Scholarship recipient for Graduate Studies
    experience:
      - company: Nexus AI
        position: Co-Founder & CTO
        date:
        start_date: 2023-06
        end_date: present
        location: San Francisco, CA
        summary:
        highlights:
          - Built foundation model infrastructure serving 2M+ monthly API requests with 99.97% uptime
          - Raised $18M Series A led by Sequoia Capital, with participation from a16z and Founders Fund
          - Scaled engineering team from 3 to 28 across ML research, platform, and applied AI divisions
          - Developed proprietary inference optimization reducing latency by 73% compared to baseline
      - company: NVIDIA Research
        position: Research Intern
        date:
        start_date: 2022-05
        end_date: 2022-08
        location: Santa Clara, CA
        summary:
        highlights:
          - Designed sparse attention mechanism reducing transformer memory footprint by 4.2x
          - Co-authored paper accepted at NeurIPS 2022 (spotlight presentation, top 5% of submissions)
      - company: Google DeepMind
        position: Research Intern
        date:
        start_date: 2021-05
        end_date: 2021-08
        location: London, UK
        summary:
        highlights:
          - Developed reinforcement learning algorithms for multi-agent coordination
          - Published research at top-tier venues with significant academic impact
            - ICML 2022 main conference paper, cited 340+ times within two years
            - NeurIPS 2022 workshop paper on emergent communication protocols
            - Invited journal extension in JMLR (2023)
      - company: Apple ML Research
        position: Research Intern
        date:
        start_date: 2020-05
        end_date: 2020-08
        location: Cupertino, CA
        summary:
        highlights:
          - Created on-device neural network compression pipeline deployed across 50M+ devices
          - Filed 2 patents on efficient model quantization techniques for edge inference
      - company: Microsoft Research
        position: Research Intern
        date:
        start_date: 2019-05
        end_date: 2019-08
        location: Redmond, WA
        summary:
        highlights:
          - Implemented novel self-supervised learning framework for low-resource language modeling
          - Research integrated into Azure Cognitive Services, reducing training data requirements by 60%
    projects:
      - name: '[FlashInfer](https://github.com/)'
        date:
        start_date: 2023-01
        end_date: present
        location:
        summary: Open-source library for high-performance LLM inference kernels
        highlights:
          - Achieved 2.8x speedup over baseline attention implementations on A100 GPUs
          - Adopted by 3 major AI labs, 8,500+ GitHub stars, 200+ contributors
      - name: '[NeuralPrune](https://github.com/)'
        date: '2021'
        start_date:
        end_date:
        location:
        summary: Automated neural network pruning toolkit with differentiable masks
        highlights:
          - Reduced model size by 90% with less than 1% accuracy degradation on ImageNet
          - Featured in PyTorch ecosystem tools, 4,200+ GitHub stars
    publications:
      - title: 'Sparse Mixture-of-Experts at Scale: Efficient Routing for Trillion-Parameter Models'
        authors:
          - '*John Doe*'
          - Sarah Williams
          - David Park
        summary:
        doi: 10.1234/neurips.2023.1234
        url:
        journal: NeurIPS 2023
        date: 2023-07
      - title: Neural Architecture Search via Differentiable Pruning
        authors:
          - James Liu
          - '*John Doe*'
        summary:
        doi: 10.1234/neurips.2022.5678
        url:
        journal: NeurIPS 2022, Spotlight
        date: 2022-12
      - title: Multi-Agent Reinforcement Learning with Emergent Communication
        authors:
          - Maria Garcia
          - '*John Doe*'
          - Tom Anderson
        summary:
        doi: 10.1234/icml.2022.9012
        url:
        journal: ICML 2022
        date: 2022-07
      - title: On-Device Model Compression via Learned Quantization
        authors:
          - '*John Doe*'
          - Kevin Wu
        summary:
        doi: 10.1234/iclr.2021.3456
        url:
        journal: ICLR 2021, Best Paper Award
        date: 2021-05
    selected_honors:
      - bullet: MIT Technology Review 35 Under 35 Innovators (2024)
      - bullet: Forbes 30 Under 30 in Enterprise Technology (2024)
      - bullet: ACM Doctoral Dissertation Award Honorable Mention (2023)
      - bullet: Google PhD Fellowship in Machine Learning (2020 – 2023)
      - bullet: Fulbright Scholarship for Graduate Studies (2018)
    skills:
      - label: Languages
        details: Python, C++, CUDA, Rust, Julia
      - label: ML Frameworks
        details: PyTorch, JAX, TensorFlow, Triton, ONNX
      - label: Infrastructure
        details: Kubernetes, Ray, distributed training, AWS, GCP
      - label: Research Areas
        details: Neural architecture search, model compression, efficient inference, multi-agent RL
    patents:
      - number: Adaptive Quantization for Neural Network Inference on Edge Devices (US Patent 11,234,567)
      - number: Dynamic Sparsity Patterns for Efficient Transformer Attention (US Patent 11,345,678)
      - number: Hardware-Aware Neural Architecture Search Method (US Patent 11,456,789)
    invited_talks:
      - reversed_number: Scaling Laws for Efficient Inference — Stanford HAI Symposium (2024)
      - reversed_number: Building AI Infrastructure for the Next Decade — TechCrunch Disrupt (2024)
      - reversed_number: 'From Research to Production: Lessons in ML Systems — NeurIPS Workshop (2023)'
      - reversed_number: "Efficient Deep Learning: A Practitioner's Perspective — Google Tech Talk (2022)"
`,design:`design:
  theme: engineeringresumes
  page:
    size: us-letter
    top_margin: 0.7in
    bottom_margin: 0.7in
    left_margin: 0.7in
    right_margin: 0.7in
    show_footer: false
    show_top_note: true
  colors:
    body: rgb(0, 0, 0)
    name: rgb(0, 0, 0)
    headline: rgb(0, 0, 0)
    connections: rgb(0, 0, 0)
    section_titles: rgb(0, 0, 0)
    links: rgb(0, 0, 0)
    footer: rgb(128, 128, 128)
    top_note: rgb(128, 128, 128)
  typography:
    line_spacing: 0.6em
    alignment: justified
    date_and_location_column_alignment: right
    font_family:
      body: XCharter
      name: XCharter
      headline: XCharter
      connections: XCharter
      section_titles: XCharter
    font_size:
      body: 10pt
      name: 25pt
      headline: 10pt
      connections: 10pt
      section_titles: 1.2em
    small_caps:
      name: false
      headline: false
      connections: false
      section_titles: false
    bold:
      name: false
      headline: false
      connections: false
      section_titles: true
  links:
    underline: true
    show_external_link_icon: false
  header:
    alignment: center
    photo_width: 3.5cm
    photo_position: left
    photo_space_left: 0.4cm
    photo_space_right: 0.4cm
    space_below_name: 0.7cm
    space_below_headline: 0.7cm
    space_below_connections: 0.7cm
    connections:
      phone_number_format: national
      hyperlink: true
      show_icons: false
      display_urls_instead_of_usernames: true
      separator: '|'
      space_between_connections: 0.5cm
  section_titles:
    type: with_full_line
    line_thickness: 0.5pt
    space_above: 0.5cm
    space_below: 0.3cm
  sections:
    allow_page_break: true
    space_between_regular_entries: 0.42cm
    space_between_text_based_entries: 0.15cm
    show_time_spans_in: []
  entries:
    date_and_location_width: 4.15cm
    side_space: 0cm
    space_between_columns: 0.1cm
    allow_page_break: false
    short_second_row: false
    degree_width: 1cm
    summary:
      space_above: 0.08cm
      space_left: 0cm
    highlights:
      bullet: ●
      nested_bullet: ●
      space_left: 0cm
      space_above: 0.08cm
      space_between_items: 0.08cm
      space_between_bullet_and_text: 0.3em
  templates:
    footer: '*NAME -- PAGE_NUMBER/TOTAL_PAGES*'
    top_note: '*LAST_UPDATED CURRENT_DATE*'
    single_date: MONTH_ABBREVIATION YEAR
    date_range: START_DATE – END_DATE
    time_span: HOW_MANY_YEARS YEARS HOW_MANY_MONTHS MONTHS
    one_line_entry:
      main_column: '**LABEL:** DETAILS'
    education_entry:
      main_column: |-
        **INSTITUTION**, DEGREE_WITH_AREA -- LOCATION
        SUMMARY
        HIGHLIGHTS
      degree_column:
      date_and_location_column: DATE
    normal_entry:
      main_column: |-
        **NAME** -- **LOCATION**
        SUMMARY
        HIGHLIGHTS
      date_and_location_column: DATE
    experience_entry:
      main_column: |-
        **POSITION**, COMPANY -- LOCATION
        SUMMARY
        HIGHLIGHTS
      date_and_location_column: DATE
    publication_entry:
      main_column: |-
        **TITLE**
        SUMMARY
        AUTHORS
        URL (JOURNAL)
      date_and_location_column: DATE
`,locale:`locale:
  language: english
  last_updated: Last updated in
  month: month
  months: months
  year: year
  years: years
  present: present
  phrases:
    degree_with_area: DEGREE in AREA
  month_abbreviations:
    - Jan
    - Feb
    - Mar
    - Apr
    - May
    - June
    - July
    - Aug
    - Sept
    - Oct
    - Nov
    - Dec
  month_names:
    - January
    - February
    - March
    - April
    - May
    - June
    - July
    - August
    - September
    - October
    - November
    - December
`,settings:`settings:
  current_date: today
  bold_keywords: []
  pdf_title: NAME - CV
`},Ei={cv:`cv:
  name: John Doe
  headline:
  location: San Francisco, CA
  email: john.doe@email.com
  photo:
  phone:
  website: https://rendercv.com/
  social_networks:
    - network: LinkedIn
      username: rendercv
    - network: GitHub
      username: rendercv
  custom_connections:
  sections:
    Welcome to RenderCV:
      - RenderCV reads a CV written in a YAML file, and generates a PDF with professional typography.
      - Each section title is arbitrary.
      - You can choose any of the 9 entry types for each section.
      - Markdown syntax is supported everywhere. This is **bold**, *italic*, and [link](https://example.com).
    education:
      - institution: Princeton University
        area: Computer Science
        degree: PhD
        date:
        start_date: 2018-09
        end_date: 2023-05
        location: Princeton, NJ
        summary:
        highlights:
          - 'Thesis: Efficient Neural Architecture Search for Resource-Constrained Deployment'
          - 'Advisor: Prof. Sanjeev Arora'
          - NSF Graduate Research Fellowship, Siebel Scholar (Class of 2022)
      - institution: Boğaziçi University
        area: Computer Engineering
        degree: BS
        date:
        start_date: 2014-09
        end_date: 2018-06
        location: Istanbul, Türkiye
        summary:
        highlights:
          - 'GPA: 3.97/4.00, Valedictorian'
          - Fulbright Scholarship recipient for Graduate Studies
    experience:
      - company: Nexus AI
        position: Co-Founder & CTO
        date:
        start_date: 2023-06
        end_date: present
        location: San Francisco, CA
        summary:
        highlights:
          - Built foundation model infrastructure serving 2M+ monthly API requests with 99.97% uptime
          - Raised $18M Series A led by Sequoia Capital, with participation from a16z and Founders Fund
          - Scaled engineering team from 3 to 28 across ML research, platform, and applied AI divisions
          - Developed proprietary inference optimization reducing latency by 73% compared to baseline
      - company: NVIDIA Research
        position: Research Intern
        date:
        start_date: 2022-05
        end_date: 2022-08
        location: Santa Clara, CA
        summary:
        highlights:
          - Designed sparse attention mechanism reducing transformer memory footprint by 4.2x
          - Co-authored paper accepted at NeurIPS 2022 (spotlight presentation, top 5% of submissions)
      - company: Google DeepMind
        position: Research Intern
        date:
        start_date: 2021-05
        end_date: 2021-08
        location: London, UK
        summary:
        highlights:
          - Developed reinforcement learning algorithms for multi-agent coordination
          - Published research at top-tier venues with significant academic impact
            - ICML 2022 main conference paper, cited 340+ times within two years
            - NeurIPS 2022 workshop paper on emergent communication protocols
            - Invited journal extension in JMLR (2023)
      - company: Apple ML Research
        position: Research Intern
        date:
        start_date: 2020-05
        end_date: 2020-08
        location: Cupertino, CA
        summary:
        highlights:
          - Created on-device neural network compression pipeline deployed across 50M+ devices
          - Filed 2 patents on efficient model quantization techniques for edge inference
      - company: Microsoft Research
        position: Research Intern
        date:
        start_date: 2019-05
        end_date: 2019-08
        location: Redmond, WA
        summary:
        highlights:
          - Implemented novel self-supervised learning framework for low-resource language modeling
          - Research integrated into Azure Cognitive Services, reducing training data requirements by 60%
    projects:
      - name: '[FlashInfer](https://github.com/)'
        date:
        start_date: 2023-01
        end_date: present
        location:
        summary: Open-source library for high-performance LLM inference kernels
        highlights:
          - Achieved 2.8x speedup over baseline attention implementations on A100 GPUs
          - Adopted by 3 major AI labs, 8,500+ GitHub stars, 200+ contributors
      - name: '[NeuralPrune](https://github.com/)'
        date: '2021'
        start_date:
        end_date:
        location:
        summary: Automated neural network pruning toolkit with differentiable masks
        highlights:
          - Reduced model size by 90% with less than 1% accuracy degradation on ImageNet
          - Featured in PyTorch ecosystem tools, 4,200+ GitHub stars
    publications:
      - title: 'Sparse Mixture-of-Experts at Scale: Efficient Routing for Trillion-Parameter Models'
        authors:
          - '*John Doe*'
          - Sarah Williams
          - David Park
        summary:
        doi: 10.1234/neurips.2023.1234
        url:
        journal: NeurIPS 2023
        date: 2023-07
      - title: Neural Architecture Search via Differentiable Pruning
        authors:
          - James Liu
          - '*John Doe*'
        summary:
        doi: 10.1234/neurips.2022.5678
        url:
        journal: NeurIPS 2022, Spotlight
        date: 2022-12
      - title: Multi-Agent Reinforcement Learning with Emergent Communication
        authors:
          - Maria Garcia
          - '*John Doe*'
          - Tom Anderson
        summary:
        doi: 10.1234/icml.2022.9012
        url:
        journal: ICML 2022
        date: 2022-07
      - title: On-Device Model Compression via Learned Quantization
        authors:
          - '*John Doe*'
          - Kevin Wu
        summary:
        doi: 10.1234/iclr.2021.3456
        url:
        journal: ICLR 2021, Best Paper Award
        date: 2021-05
    selected_honors:
      - bullet: MIT Technology Review 35 Under 35 Innovators (2024)
      - bullet: Forbes 30 Under 30 in Enterprise Technology (2024)
      - bullet: ACM Doctoral Dissertation Award Honorable Mention (2023)
      - bullet: Google PhD Fellowship in Machine Learning (2020 – 2023)
      - bullet: Fulbright Scholarship for Graduate Studies (2018)
    skills:
      - label: Languages
        details: Python, C++, CUDA, Rust, Julia
      - label: ML Frameworks
        details: PyTorch, JAX, TensorFlow, Triton, ONNX
      - label: Infrastructure
        details: Kubernetes, Ray, distributed training, AWS, GCP
      - label: Research Areas
        details: Neural architecture search, model compression, efficient inference, multi-agent RL
    patents:
      - number: Adaptive Quantization for Neural Network Inference on Edge Devices (US Patent 11,234,567)
      - number: Dynamic Sparsity Patterns for Efficient Transformer Attention (US Patent 11,345,678)
      - number: Hardware-Aware Neural Architecture Search Method (US Patent 11,456,789)
    invited_talks:
      - reversed_number: Scaling Laws for Efficient Inference — Stanford HAI Symposium (2024)
      - reversed_number: Building AI Infrastructure for the Next Decade — TechCrunch Disrupt (2024)
      - reversed_number: 'From Research to Production: Lessons in ML Systems — NeurIPS Workshop (2023)'
      - reversed_number: "Efficient Deep Learning: A Practitioner's Perspective — Google Tech Talk (2022)"
`,design:`design:
  theme: moderncv
  page:
    size: us-letter
    top_margin: 0.7in
    bottom_margin: 0.7in
    left_margin: 0.7in
    right_margin: 0.7in
    show_footer: true
    show_top_note: true
  colors:
    body: rgb(0, 0, 0)
    name: rgb(0, 79, 144)
    headline: rgb(0, 79, 144)
    connections: rgb(0, 79, 144)
    section_titles: rgb(0, 79, 144)
    links: rgb(0, 79, 144)
    footer: rgb(128, 128, 128)
    top_note: rgb(128, 128, 128)
  typography:
    line_spacing: 0.6em
    alignment: justified
    date_and_location_column_alignment: right
    font_family:
      body: Fontin
      name: Fontin
      headline: Fontin
      connections: Fontin
      section_titles: Fontin
    font_size:
      body: 10pt
      name: 25pt
      headline: 10pt
      connections: 10pt
      section_titles: 1.4em
    small_caps:
      name: false
      headline: false
      connections: false
      section_titles: false
    bold:
      name: false
      headline: false
      connections: false
      section_titles: false
  links:
    underline: true
    show_external_link_icon: false
  header:
    alignment: left
    photo_width: 4.15cm
    photo_position: left
    photo_space_left: 0cm
    photo_space_right: 0.3cm
    space_below_name: 0.7cm
    space_below_headline: 0.7cm
    space_below_connections: 0.7cm
    connections:
      phone_number_format: national
      hyperlink: true
      show_icons: true
      display_urls_instead_of_usernames: false
      separator: ''
      space_between_connections: 0.5cm
  section_titles:
    type: moderncv
    line_thickness: 0.15cm
    space_above: 0.55cm
    space_below: 0.3cm
  sections:
    allow_page_break: true
    space_between_regular_entries: 1.2em
    space_between_text_based_entries: 0.3em
    show_time_spans_in: []
  entries:
    date_and_location_width: 4.15cm
    side_space: 0cm
    space_between_columns: 0.3cm
    allow_page_break: false
    short_second_row: false
    degree_width: 1cm
    summary:
      space_above: 0.1cm
      space_left: 0cm
    highlights:
      bullet: •
      nested_bullet: •
      space_left: 0cm
      space_above: 0.15cm
      space_between_items: 0.1cm
      space_between_bullet_and_text: 0.3em
  templates:
    footer: '*NAME -- PAGE_NUMBER/TOTAL_PAGES*'
    top_note: '*LAST_UPDATED CURRENT_DATE*'
    single_date: MONTH_ABBREVIATION YEAR
    date_range: START_DATE – END_DATE
    time_span: HOW_MANY_YEARS YEARS HOW_MANY_MONTHS MONTHS
    one_line_entry:
      main_column: '**LABEL:** DETAILS'
    education_entry:
      main_column: |-
        **INSTITUTION**, DEGREE_WITH_AREA -- LOCATION
        SUMMARY
        HIGHLIGHTS
      degree_column:
      date_and_location_column: DATE
    normal_entry:
      main_column: |-
        **NAME** -- **LOCATION**
        SUMMARY
        HIGHLIGHTS
      date_and_location_column: DATE
    experience_entry:
      main_column: |-
        **POSITION**, COMPANY -- LOCATION
        SUMMARY
        HIGHLIGHTS
      date_and_location_column: DATE
    publication_entry:
      main_column: |-
        **TITLE**
        SUMMARY
        AUTHORS
        URL (JOURNAL)
      date_and_location_column: DATE
`,locale:`locale:
  language: english
  last_updated: Last updated in
  month: month
  months: months
  year: year
  years: years
  present: present
  phrases:
    degree_with_area: DEGREE in AREA
  month_abbreviations:
    - Jan
    - Feb
    - Mar
    - Apr
    - May
    - June
    - July
    - Aug
    - Sept
    - Oct
    - Nov
    - Dec
  month_names:
    - January
    - February
    - March
    - April
    - May
    - June
    - July
    - August
    - September
    - October
    - November
    - December
`,settings:`settings:
  current_date: today
  bold_keywords: []
  pdf_title: NAME - CV
`},Si={cv:`cv:
  name: John Doe
  headline:
  location: San Francisco, CA
  email: john.doe@email.com
  photo:
  phone:
  website: https://rendercv.com/
  social_networks:
    - network: LinkedIn
      username: rendercv
    - network: GitHub
      username: rendercv
  custom_connections:
  sections:
    Welcome to RenderCV:
      - RenderCV reads a CV written in a YAML file, and generates a PDF with professional typography.
      - Each section title is arbitrary.
      - You can choose any of the 9 entry types for each section.
      - Markdown syntax is supported everywhere. This is **bold**, *italic*, and [link](https://example.com).
    education:
      - institution: Princeton University
        area: Computer Science
        degree: PhD
        date:
        start_date: 2018-09
        end_date: 2023-05
        location: Princeton, NJ
        summary:
        highlights:
          - 'Thesis: Efficient Neural Architecture Search for Resource-Constrained Deployment'
          - 'Advisor: Prof. Sanjeev Arora'
          - NSF Graduate Research Fellowship, Siebel Scholar (Class of 2022)
      - institution: Boğaziçi University
        area: Computer Engineering
        degree: BS
        date:
        start_date: 2014-09
        end_date: 2018-06
        location: Istanbul, Türkiye
        summary:
        highlights:
          - 'GPA: 3.97/4.00, Valedictorian'
          - Fulbright Scholarship recipient for Graduate Studies
    experience:
      - company: Nexus AI
        position: Co-Founder & CTO
        date:
        start_date: 2023-06
        end_date: present
        location: San Francisco, CA
        summary:
        highlights:
          - Built foundation model infrastructure serving 2M+ monthly API requests with 99.97% uptime
          - Raised $18M Series A led by Sequoia Capital, with participation from a16z and Founders Fund
          - Scaled engineering team from 3 to 28 across ML research, platform, and applied AI divisions
          - Developed proprietary inference optimization reducing latency by 73% compared to baseline
      - company: NVIDIA Research
        position: Research Intern
        date:
        start_date: 2022-05
        end_date: 2022-08
        location: Santa Clara, CA
        summary:
        highlights:
          - Designed sparse attention mechanism reducing transformer memory footprint by 4.2x
          - Co-authored paper accepted at NeurIPS 2022 (spotlight presentation, top 5% of submissions)
      - company: Google DeepMind
        position: Research Intern
        date:
        start_date: 2021-05
        end_date: 2021-08
        location: London, UK
        summary:
        highlights:
          - Developed reinforcement learning algorithms for multi-agent coordination
          - Published research at top-tier venues with significant academic impact
            - ICML 2022 main conference paper, cited 340+ times within two years
            - NeurIPS 2022 workshop paper on emergent communication protocols
            - Invited journal extension in JMLR (2023)
      - company: Apple ML Research
        position: Research Intern
        date:
        start_date: 2020-05
        end_date: 2020-08
        location: Cupertino, CA
        summary:
        highlights:
          - Created on-device neural network compression pipeline deployed across 50M+ devices
          - Filed 2 patents on efficient model quantization techniques for edge inference
      - company: Microsoft Research
        position: Research Intern
        date:
        start_date: 2019-05
        end_date: 2019-08
        location: Redmond, WA
        summary:
        highlights:
          - Implemented novel self-supervised learning framework for low-resource language modeling
          - Research integrated into Azure Cognitive Services, reducing training data requirements by 60%
    projects:
      - name: '[FlashInfer](https://github.com/)'
        date:
        start_date: 2023-01
        end_date: present
        location:
        summary: Open-source library for high-performance LLM inference kernels
        highlights:
          - Achieved 2.8x speedup over baseline attention implementations on A100 GPUs
          - Adopted by 3 major AI labs, 8,500+ GitHub stars, 200+ contributors
      - name: '[NeuralPrune](https://github.com/)'
        date: '2021'
        start_date:
        end_date:
        location:
        summary: Automated neural network pruning toolkit with differentiable masks
        highlights:
          - Reduced model size by 90% with less than 1% accuracy degradation on ImageNet
          - Featured in PyTorch ecosystem tools, 4,200+ GitHub stars
    publications:
      - title: 'Sparse Mixture-of-Experts at Scale: Efficient Routing for Trillion-Parameter Models'
        authors:
          - '*John Doe*'
          - Sarah Williams
          - David Park
        summary:
        doi: 10.1234/neurips.2023.1234
        url:
        journal: NeurIPS 2023
        date: 2023-07
      - title: Neural Architecture Search via Differentiable Pruning
        authors:
          - James Liu
          - '*John Doe*'
        summary:
        doi: 10.1234/neurips.2022.5678
        url:
        journal: NeurIPS 2022, Spotlight
        date: 2022-12
      - title: Multi-Agent Reinforcement Learning with Emergent Communication
        authors:
          - Maria Garcia
          - '*John Doe*'
          - Tom Anderson
        summary:
        doi: 10.1234/icml.2022.9012
        url:
        journal: ICML 2022
        date: 2022-07
      - title: On-Device Model Compression via Learned Quantization
        authors:
          - '*John Doe*'
          - Kevin Wu
        summary:
        doi: 10.1234/iclr.2021.3456
        url:
        journal: ICLR 2021, Best Paper Award
        date: 2021-05
    selected_honors:
      - bullet: MIT Technology Review 35 Under 35 Innovators (2024)
      - bullet: Forbes 30 Under 30 in Enterprise Technology (2024)
      - bullet: ACM Doctoral Dissertation Award Honorable Mention (2023)
      - bullet: Google PhD Fellowship in Machine Learning (2020 – 2023)
      - bullet: Fulbright Scholarship for Graduate Studies (2018)
    skills:
      - label: Languages
        details: Python, C++, CUDA, Rust, Julia
      - label: ML Frameworks
        details: PyTorch, JAX, TensorFlow, Triton, ONNX
      - label: Infrastructure
        details: Kubernetes, Ray, distributed training, AWS, GCP
      - label: Research Areas
        details: Neural architecture search, model compression, efficient inference, multi-agent RL
    patents:
      - number: Adaptive Quantization for Neural Network Inference on Edge Devices (US Patent 11,234,567)
      - number: Dynamic Sparsity Patterns for Efficient Transformer Attention (US Patent 11,345,678)
      - number: Hardware-Aware Neural Architecture Search Method (US Patent 11,456,789)
    invited_talks:
      - reversed_number: Scaling Laws for Efficient Inference — Stanford HAI Symposium (2024)
      - reversed_number: Building AI Infrastructure for the Next Decade — TechCrunch Disrupt (2024)
      - reversed_number: 'From Research to Production: Lessons in ML Systems — NeurIPS Workshop (2023)'
      - reversed_number: "Efficient Deep Learning: A Practitioner's Perspective — Google Tech Talk (2022)"
`,design:`design:
  theme: sb2nov
  page:
    size: us-letter
    top_margin: 0.7in
    bottom_margin: 0.7in
    left_margin: 0.7in
    right_margin: 0.7in
    show_footer: true
    show_top_note: true
  colors:
    body: rgb(0, 0, 0)
    name: rgb(0, 0, 0)
    headline: rgb(0, 0, 0)
    connections: rgb(0, 0, 0)
    section_titles: rgb(0, 0, 0)
    links: rgb(0, 0, 0)
    footer: rgb(128, 128, 128)
    top_note: rgb(128, 128, 128)
  typography:
    line_spacing: 0.6em
    alignment: justified
    date_and_location_column_alignment: right
    font_family:
      body: New Computer Modern
      name: New Computer Modern
      headline: New Computer Modern
      connections: New Computer Modern
      section_titles: New Computer Modern
    font_size:
      body: 10pt
      name: 30pt
      headline: 10pt
      connections: 10pt
      section_titles: 1.4em
    small_caps:
      name: false
      headline: false
      connections: false
      section_titles: false
    bold:
      name: true
      headline: false
      connections: false
      section_titles: true
  links:
    underline: true
    show_external_link_icon: false
  header:
    alignment: center
    photo_width: 3.5cm
    photo_position: left
    photo_space_left: 0.4cm
    photo_space_right: 0.4cm
    space_below_name: 0.7cm
    space_below_headline: 0.7cm
    space_below_connections: 0.7cm
    connections:
      phone_number_format: national
      hyperlink: true
      show_icons: false
      display_urls_instead_of_usernames: true
      separator: •
      space_between_connections: 0.5cm
  section_titles:
    type: with_full_line
    line_thickness: 0.5pt
    space_above: 0.5cm
    space_below: 0.3cm
  sections:
    allow_page_break: true
    space_between_regular_entries: 1.2em
    space_between_text_based_entries: 0.3em
    show_time_spans_in: []
  entries:
    date_and_location_width: 4.15cm
    side_space: 0.2cm
    space_between_columns: 0.1cm
    allow_page_break: false
    short_second_row: false
    degree_width: 1cm
    summary:
      space_above: 0cm
      space_left: 0cm
    highlights:
      bullet: ◦
      nested_bullet: ◦
      space_left: 0.15cm
      space_above: 0cm
      space_between_items: 0cm
      space_between_bullet_and_text: 0.5em
  templates:
    footer: '*NAME -- PAGE_NUMBER/TOTAL_PAGES*'
    top_note: '*LAST_UPDATED CURRENT_DATE*'
    single_date: MONTH_ABBREVIATION YEAR
    date_range: START_DATE – END_DATE
    time_span: HOW_MANY_YEARS YEARS HOW_MANY_MONTHS MONTHS
    one_line_entry:
      main_column: '**LABEL:** DETAILS'
    education_entry:
      main_column: |-
        **INSTITUTION**
        *DEGREE* *in* *AREA*
        SUMMARY
        HIGHLIGHTS
      degree_column:
      date_and_location_column: |-
        *LOCATION*
        *DATE*
    normal_entry:
      main_column: |-
        **NAME**
        SUMMARY
        HIGHLIGHTS
      date_and_location_column: |-
        *LOCATION*
        *DATE*
    experience_entry:
      main_column: |-
        **POSITION**
        *COMPANY*
        SUMMARY
        HIGHLIGHTS
      date_and_location_column: |-
        *LOCATION*
        *DATE*
    publication_entry:
      main_column: |-
        **TITLE**
        SUMMARY
        AUTHORS
        URL (JOURNAL)
      date_and_location_column: DATE
`,locale:`locale:
  language: english
  last_updated: Last updated in
  month: month
  months: months
  year: year
  years: years
  present: present
  phrases:
    degree_with_area: DEGREE in AREA
  month_abbreviations:
    - Jan
    - Feb
    - Mar
    - Apr
    - May
    - June
    - July
    - Aug
    - Sept
    - Oct
    - Nov
    - Dec
  month_names:
    - January
    - February
    - March
    - April
    - May
    - June
    - July
    - August
    - September
    - October
    - November
    - December
`,settings:`settings:
  current_date: today
  bold_keywords: []
  pdf_title: NAME - CV
`};function $e(t){const e=Mi[t.templateId??""];return{cv:t.cv??e?.cv??"",design:t.designs[t.selectedTheme]??Ai[t.selectedTheme]??`design:
  theme: ${t.selectedTheme}`,locale:t.locales[t.selectedLocale]??vi[t.selectedLocale]??`locale:
  language: ${t.selectedLocale}`,settings:t.settings??e?.settings??""}}const xe=[{id:"default-classic",name:"CV (Classic)",theme:"classic",sections:q},{id:"default-engineering-classic",name:"CV (Engineering Classic)",theme:"engineeringclassic",sections:wi},{id:"default-engineering-resumes",name:"CV (Engineering Resumes)",theme:"engineeringresumes",sections:Ti},{id:"default-moderncv",name:"CV (Moderncv)",theme:"moderncv",sections:Ei},{id:"default-sb2nov",name:"CV (Sb2nov)",theme:"sb2nov",sections:Si}],Qi=new Set(xe.map(t=>t.id)),Mi=Object.fromEntries(xe.map(t=>[t.id,{cv:t.sections.cv,settings:t.sections.settings}]));function Ii(){const t=Date.now();return xe.map(e=>Te({id:Bn(),name:e.name,cv:e.sections.cv,settings:e.sections.settings,designs:{[e.theme]:e.sections.design},locales:{english:e.sections.locale},selectedTheme:e.theme,selectedLocale:"english",isLocked:!1,isArchived:!1,isTrashed:!1,isPublic:!1,chatMessages:[],editCount:0,lastEdited:t}))}function Te(t){return Object.defineProperty(t,"isReadOnly",{get(){return this.isLocked||this.isArchived||this.isTrashed},enumerable:!0,configurable:!0}),t}const en=50;class Ri{#e=_(T([]));get files(){return c(this.#e)}set files(e){u(this.#e,e,!0)}#n=_();#t=_(0);get generation(){return c(this.#t)}set generation(e){u(this.#t,e,!0)}get selectedFileId(){return c(this.#n)}set selectedFileId(e){u(this.#n,e,!0),K.selectedFileId=e}#r=_(!0);get loading(){return c(this.#r)}set loading(e){u(this.#r,e,!0)}persistence;#i=[];#s=[];#a;#o=A(()=>this.files.find(e=>e.id===this.selectedFileId));get selectedFile(){return c(this.#o)}set selectedFile(e){u(this.#o,e)}#l=A(()=>this.selectedFile?.isReadOnly);get selectedFileReadOnly(){return c(this.#l)}set selectedFileReadOnly(e){u(this.#l,e)}#m=A(()=>this.selectedFile?$e(this.selectedFile):{cv:"",design:"",locale:"",settings:""});get sections(){return c(this.#m)}set sections(e){u(this.#m,e)}#d=A(()=>this.files.filter(e=>!e.isTrashed&&!e.isArchived).sort((e,n)=>n.lastEdited-e.lastEdited));get activeFiles(){return c(this.#d)}set activeFiles(e){u(this.#d,e)}#u=A(()=>this.files.filter(e=>e.isArchived&&!e.isTrashed).sort((e,n)=>n.lastEdited-e.lastEdited));get archivedFiles(){return c(this.#u)}set archivedFiles(e){u(this.#u,e)}#c=A(()=>this.files.filter(e=>e.isTrashed).sort((e,n)=>n.lastEdited-e.lastEdited));get trashedFiles(){return c(this.#c)}set trashedFiles(e){u(this.#c,e)}loadDefaults(){this.persistence=void 0,this.#i=[],this.#s=[],this.files=Ii(),this.selectedFileId=this.files[0]?.id,this.generation++}loadFiles(e){this.#i=[],this.#s=[],this.files=e.map(n=>Te({...n,chatMessages:n.chatMessages??[],editCount:n.editCount??0})),this.selectedFileId=this.activeFiles[0]?.id,this.generation++}createFile(e,n){const r=Te({id:Bn(),name:e??`CV ${this.activeFiles.length+1}`,cv:n?.cv??q.cv,settings:n?.settings??q.settings,designs:Object.keys(n?.designs??{}).length>0?{...n?.designs}:{classic:q.design},locales:Object.keys(n?.locales??{}).length>0?{...n?.locales}:{english:q.locale},selectedTheme:n?.selectedTheme??"classic",selectedLocale:n?.selectedLocale??"english",isLocked:!1,isArchived:!1,isTrashed:!1,isPublic:!1,chatMessages:[],editCount:0,lastEdited:Date.now()});return this.files=[...this.files,r],this.selectedFileId=r.id,this.persistence?.onCreateFile?.(r),r}selectFile(e){this.selectedFileId=e,this.ensureValidSelection()}setSectionContent(e,n){if(!this.selectedFile||this.selectedFileReadOnly)return;const r=this.selectedFile;switch(e){case"cv":r.cv=n;break;case"settings":r.settings=n;break;case"design":r.designs[r.selectedTheme]=n;break;case"locale":r.locales[r.selectedLocale]=n;break}this.activeFiles[0]?.id!==r.id&&(r.lastEdited=Date.now()),clearTimeout(this.#a),this.#a=setTimeout(()=>{r.lastEdited=Date.now()},500),this.persistence?.onContentChange?.(r.id)}setTheme(e,n){this.#h(e,{selectedTheme:n})}setLocale(e,n){this.#h(e,{selectedLocale:n})}renameFile(e,n){this.#h(e,{name:n})}deleteFile(e){const n=this.files.find(s=>s.id===e),r=n?.isTrashed?this.trashedFiles:n?.isArchived?this.archivedFiles:this.activeFiles,i=this.selectedFileId===e?this.#p(e,r):void 0;this.#g(e),this.files=this.files.filter(s=>s.id!==e),this.selectedFileId===e&&(this.selectedFileId=i),this.ensureValidSelection(),this.persistence?.onDeleteFile?.(e)}trashFile(e){const n=this.selectedFileId===e?this.#p(e,this.activeFiles):void 0;this.#h(e,{isTrashed:!0}),this.selectedFileId===e&&(this.selectedFileId=n),this.ensureValidSelection()}restoreFile(e){this.#h(e,{isTrashed:!1})}archiveFile(e){const n=this.selectedFileId===e?this.#p(e,this.activeFiles):void 0;this.#h(e,{isArchived:!0}),this.selectedFileId===e&&(this.selectedFileId=n),this.ensureValidSelection()}restoreFromArchive(e){this.#h(e,{isArchived:!1})}undo(){for(;this.#i.length>0;){const e=this.#i.pop();if(!e||!this.#_(e.fileId,e.prev))continue;const n=this.selectedFileId;return this.selectedFileId=this.#f(e.selectedFileId)?e.selectedFileId:n,this.#s.push({...e,redoSelectedFileId:n}),this.ensureValidSelection(),!0}return this.ensureValidSelection(),!1}redo(){for(;this.#s.length>0;){const e=this.#s.pop();if(!(!e||!this.#_(e.fileId,e.next)))return this.#i.push({fileId:e.fileId,prev:e.prev,next:e.next,selectedFileId:this.#f(e.selectedFileId)?e.selectedFileId:void 0}),this.selectedFileId=this.#f(e.redoSelectedFileId)?e.redoSelectedFileId:this.selectedFileId,this.ensureValidSelection(),!0}return this.ensureValidSelection(),!1}lockFile(e){this.#h(e,{isLocked:!0})}unlockFile(e){this.#h(e,{isLocked:!1})}makePublic(e){this.#h(e,{isPublic:!0})}makePrivate(e){this.#h(e,{isPublic:!1})}duplicateFile(e){const n=this.files.find(a=>a.id===e);if(!n)return;const r=$e(n),i=this.activeFiles.map(a=>a.name),s=n.name.replace(/ \d+$/,"");let o=2;for(;i.includes(`${s} ${o}`);)o++;return this.createFile(`${s} ${o}`,{cv:r.cv,settings:r.settings,designs:{...n.designs},locales:{...n.locales},selectedTheme:n.selectedTheme,selectedLocale:n.selectedLocale})}#h(e,n){this.ensureValidSelection();const r=this.files.find(s=>s.id===e);if(!r)return;const i={};for(const s of Object.keys(n))i[s]=r[s];this.#i.push({fileId:e,prev:i,next:n,selectedFileId:this.selectedFileId}),this.#i.length>en&&this.#i.splice(0,this.#i.length-en),this.#s=[],Object.assign(r,n),this.persistence?.onUpdateMeta?.(e,n)}#_(e,n){const r=this.files.find(i=>i.id===e);return r?(Object.assign(r,n),this.persistence?.onUpdateMeta?.(e,n),!0):!1}#f(e){return e?this.files.some(n=>n.id===e):!1}ensureValidSelection(){const e=this.selectedFile;e&&(!e.isTrashed&&!e.isArchived||e.isArchived&&!e.isTrashed&&K.showArchive||e.isTrashed&&K.showTrash)||(this.selectedFileId=this.activeFiles[0]?.id??(K.showArchive?this.archivedFiles[0]?.id:void 0)??(K.showTrash?this.trashedFiles[0]?.id:void 0))}#p(e,n){const r=n.findIndex(i=>i.id===e);if(r!==-1)return n[r+1]?.id??n[r-1]?.id}#g(e){this.#i=this.#i.filter(n=>n.fileId!==e).map(n=>({...n,selectedFileId:n.selectedFileId===e?void 0:n.selectedFileId})),this.#s=this.#s.filter(n=>n.fileId!==e).map(n=>({...n,selectedFileId:n.selectedFileId===e?void 0:n.selectedFileId,redoSelectedFileId:n.redoSelectedFileId===e?void 0:n.redoSelectedFileId}))}}const Zi=new Ri;export{Ui as $,St as A,pi as B,ee as C,Wi as D,pn as E,zi as F,ie as G,Ji as H,ln as I,te as J,ve as K,kn as L,xn as M,Fn as N,ar as O,_r as P,Q,pr as R,Re as S,Vi as T,R as U,Me as V,Ie as W,qe as X,Pn as Y,Un as Z,Se as _,re as a,Kt as a0,Fi as a1,Gn as a2,Hn as a3,Hi as a4,Ne as a5,ut as a6,at as a7,lt as a8,wt as a9,qi as aa,Xi as ab,Yn as ac,Ai as ad,dn as b,un as c,rr as d,Yi as e,Zi as f,Gi as g,g as h,N as i,xi as j,Pi as k,hn as l,Yt as m,E as n,ne as o,ji as p,Ki as q,Bi as r,Gt as s,K as t,Qi as u,Bn as v,M as w,$e as x,Bt as y,tn as z};
