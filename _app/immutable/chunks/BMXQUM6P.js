var es=Object.defineProperty;var ts=Object.getPrototypeOf;var ns=Reflect.get;var Pr=n=>{throw TypeError(n)};var rs=(n,e,t)=>e in n?es(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t;var _=(n,e,t)=>rs(n,typeof e!="symbol"?e+"":e,t),Vn=(n,e,t)=>e.has(n)||Pr("Cannot "+t);var i=(n,e,t)=>(Vn(n,e,"read from private field"),t?t.call(n):e.get(n)),c=(n,e,t)=>e.has(n)?Pr("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(n):e.set(n,t),g=(n,e,t,r)=>(Vn(n,e,"write to private field"),r?r.call(n,t):e.set(n,t),t),m=(n,e,t)=>(Vn(n,e,"access private method"),t);var xr=(n,e,t)=>ns(ts(n),t,e);import"./Bzak7iHL.js";import{bo as is,G as ss,J as os,bz as as,V as cs,Z as ls,m as v,bA as Gr,ag as us,l as u,k as h,au as st,F as x,E as I,ab as ds,aa as Hr,ac as hs,w as ms,y as He,u as Xn,a6 as ps,e as he,g as me,a as pe,h as tt,i as nt,p as rt,a9 as fs,b as it,by as ai}from"./huZ9HP8w.js";import{k as _s,o as R,m as gs,u as bs}from"./DUzgjjXE.js";import{i as ys}from"./B-OzrtHY.js";import{p as C}from"./Dcya6Ggp.js";import{d as Kn}from"./JkY6G8Wb.js";function As(){return Symbol(is)}const vs=Symbol("NaN");function ws(n,e,t){ss&&os();var r=new ls(n),s=!as();cs(()=>{var o=e();o!==o&&(o=vs),s&&o!==null&&typeof o=="object"&&(o={}),r.ensure(o,t)})}var z,V,q,Mn,j,ut,pn;const Er=class Er extends Map{constructor(t){super();c(this,j);c(this,z,new Map);c(this,V,v(0));c(this,q,v(0));c(this,Mn,Gr||-1);if(t){for(var[r,s]of t)super.set(r,s);i(this,q).v=super.size}}has(t){var r=i(this,z),s=r.get(t);if(s===void 0)if(super.has(t))s=m(this,j,ut).call(this,0),r.set(t,s);else return u(i(this,V)),!1;return u(s),!0}forEach(t,r){m(this,j,pn).call(this),super.forEach(t,r)}get(t){var r=i(this,z),s=r.get(t);if(s===void 0)if(super.has(t))s=m(this,j,ut).call(this,0),r.set(t,s);else{u(i(this,V));return}return u(s),super.get(t)}set(t,r){var f;var s=i(this,z),o=s.get(t),a=super.get(t),l=super.set(t,r),d=i(this,V);if(o===void 0)o=m(this,j,ut).call(this,0),s.set(t,o),h(i(this,q),super.size),st(d);else if(a!==r){st(o);var p=d.reactions===null?null:new Set(d.reactions),b=p===null||!((f=o.reactions)!=null&&f.every(T=>p.has(T)));b&&st(d)}return l}delete(t){var r=i(this,z),s=r.get(t),o=super.delete(t);return s!==void 0&&(r.delete(t),h(s,-1)),o&&(h(i(this,q),super.size),st(i(this,V))),o}clear(){if(super.size!==0){super.clear();var t=i(this,z);h(i(this,q),0);for(var r of t.values())h(r,-1);st(i(this,V)),t.clear()}}keys(){return u(i(this,V)),super.keys()}values(){return m(this,j,pn).call(this),super.values()}entries(){return m(this,j,pn).call(this),super.entries()}[Symbol.iterator](){return this.entries()}get size(){return u(i(this,q)),super.size}};z=new WeakMap,V=new WeakMap,q=new WeakMap,Mn=new WeakMap,j=new WeakSet,ut=function(t){return Gr===i(this,Mn)?v(t):us(t)},pn=function(){u(i(this,V));var t=i(this,z);if(i(this,q).v!==t.size){for(var r of xr(Er.prototype,this,"keys").call(this))if(!t.has(r)){var s=m(this,j,ut).call(this,0);t.set(r,s)}}for([,s]of i(this,z))u(s)};let Qn=Er;var Ur=/\/\*[^*]*\*+([^/*][^*]*\*+)*\//g,Ts=/\n/g,Es=/^\s*/,Ss=/^(\*?[-#/*\\\w]+(\[[0-9a-z_-]+\])?)\s*/,Is=/^:\s*/,Ms=/^((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^)]*?\)|[^};])+)/,Rs=/^[;\s]*/,Ns=/^\s+|\s+$/g,Ds=`
`,Jr="/",Yr="*",ge="",Cs="comment",Os="declaration";function Ls(n,e){if(typeof n!="string")throw new TypeError("First argument must be a string");if(!n)return[];e=e||{};var t=1,r=1;function s(A){var y=A.match(Ts);y&&(t+=y.length);var O=A.lastIndexOf(Ds);r=~O?A.length-O:r+A.length}function o(){var A={line:t,column:r};return function(y){return y.position=new a(A),p(),y}}function a(A){this.start=A,this.end={line:t,column:r},this.source=e.source}a.prototype.content=n;function l(A){var y=new Error(e.source+":"+t+":"+r+": "+A);if(y.reason=A,y.filename=e.source,y.line=t,y.column=r,y.source=n,!e.silent)throw y}function d(A){var y=A.exec(n);if(y){var O=y[0];return s(O),n=n.slice(O.length),y}}function p(){d(Es)}function b(A){var y;for(A=A||[];y=f();)y!==!1&&A.push(y);return A}function f(){var A=o();if(!(Jr!=n.charAt(0)||Yr!=n.charAt(1))){for(var y=2;ge!=n.charAt(y)&&(Yr!=n.charAt(y)||Jr!=n.charAt(y+1));)++y;if(y+=2,ge===n.charAt(y-1))return l("End of comment missing");var O=n.slice(2,y-2);return r+=2,s(O),n=n.slice(y),r+=2,A({type:Cs,comment:O})}}function T(){var A=o(),y=d(Ss);if(y){if(f(),!d(Is))return l("property missing ':'");var O=d(Ms),un=A({type:Os,property:Br(y[0].replace(Ur,ge)),value:O?Br(O[0].replace(Ur,ge)):ge});return d(Rs),un}}function S(){var A=[];b(A);for(var y;y=T();)y!==!1&&(A.push(y),b(A));return A}return p(),S()}function Br(n){return n?n.replace(Ns,ge):ge}function ks(n,e){let t=null;if(!n||typeof n!="string")return t;const r=Ls(n),s=typeof e=="function";return r.forEach(o=>{if(o.type!=="declaration")return;const{property:a,value:l}=o;s?e(a,l,o):l&&(t=t||{},t[a]=l)}),t}function Fs(n){return typeof n=="function"}function rn(n){return n!==null&&typeof n=="object"}const Ps=["string","number","bigint","boolean"];function Zn(n){return n==null||Ps.includes(typeof n)?!0:Array.isArray(n)?n.every(e=>Zn(e)):typeof n=="object"?Object.getPrototypeOf(n)===Object.prototype:!1}const $e=Symbol("box"),zn=Symbol("is-writable");function w(n,e){const t=I(n);return e?{[$e]:!0,[zn]:!0,get current(){return u(t)},set current(r){e(r)}}:{[$e]:!0,get current(){return n()}}}function sn(n){return rn(n)&&$e in n}function fr(n){return sn(n)&&zn in n}function xs(n){return sn(n)?n:Fs(n)?w(n):ci(n)}function Gs(n){return Object.entries(n).reduce((e,[t,r])=>sn(r)?(fr(r)?Object.defineProperty(e,t,{get(){return r.current},set(s){r.current=s}}):Object.defineProperty(e,t,{get(){return r.current}}),e):Object.assign(e,{[t]:r}),{})}function Hs(n){return fr(n)?{[$e]:!0,get current(){return n.current}}:n}function ci(n){let e=v(x(n));return{[$e]:!0,[zn]:!0,get current(){return u(e)},set current(t){h(e,t,!0)}}}function Ue(n){let e=v(x(n));return{[$e]:!0,[zn]:!0,get current(){return u(e)},set current(t){h(e,t,!0)}}}Ue.from=xs;Ue.with=w;Ue.flatten=Gs;Ue.readonly=Hs;Ue.isBox=sn;Ue.isWritableBox=fr;function li(...n){return function(e){var t;for(const r of n)if(r){if(e.defaultPrevented)return;typeof r=="function"?r.call(this,e):(t=r.current)==null||t.call(this,e)}}}const Us=/\d/,Js=["-","_","/","."];function Ys(n=""){if(!Us.test(n))return n!==n.toLowerCase()}function Bs(n){const e=[];let t="",r,s;for(const o of n){const a=Js.includes(o);if(a===!0){e.push(t),t="",r=void 0;continue}const l=Ys(o);if(s===!1){if(r===!1&&l===!0){e.push(t),t=o,r=l;continue}if(r===!0&&l===!1&&t.length>1){const d=t.at(-1);e.push(t.slice(0,Math.max(0,t.length-1))),t=d+o,r=l;continue}}t+=o,r=l,s=a}return e.push(t),e}function ui(n){return n?Bs(n).map(e=>js(e)).join(""):""}function Ws(n){return zs(ui(n||""))}function js(n){return n?n[0].toUpperCase()+n.slice(1):""}function zs(n){return n?n[0].toLowerCase()+n.slice(1):""}function dn(n){if(!n)return{};const e={};function t(r,s){if(r.startsWith("-moz-")||r.startsWith("-webkit-")||r.startsWith("-ms-")||r.startsWith("-o-")){e[ui(r)]=s;return}if(r.startsWith("--")){e[r]=s;return}e[Ws(r)]=s}return ks(n,t),e}function xe(...n){return(...e)=>{for(const t of n)typeof t=="function"&&t(...e)}}function Vs(n,e){const t=RegExp(n,"g");return r=>{if(typeof r!="string")throw new TypeError(`expected an argument of type string, but got ${typeof r}`);return r.match(t)?r.replace(t,e):r}}const Ks=Vs(/[A-Z]/,n=>`-${n.toLowerCase()}`);function qs(n){if(!n||typeof n!="object"||Array.isArray(n))throw new TypeError(`expected an argument of type object, but got ${typeof n}`);return Object.keys(n).map(e=>`${Ks(e)}: ${n[e]};`).join(`
`)}function Xs(n={}){return qs(n).replace(`
`," ")}const Qs=["onabort","onanimationcancel","onanimationend","onanimationiteration","onanimationstart","onauxclick","onbeforeinput","onbeforetoggle","onblur","oncancel","oncanplay","oncanplaythrough","onchange","onclick","onclose","oncompositionend","oncompositionstart","oncompositionupdate","oncontextlost","oncontextmenu","oncontextrestored","oncopy","oncuechange","oncut","ondblclick","ondrag","ondragend","ondragenter","ondragleave","ondragover","ondragstart","ondrop","ondurationchange","onemptied","onended","onerror","onfocus","onfocusin","onfocusout","onformdata","ongotpointercapture","oninput","oninvalid","onkeydown","onkeypress","onkeyup","onload","onloadeddata","onloadedmetadata","onloadstart","onlostpointercapture","onmousedown","onmouseenter","onmouseleave","onmousemove","onmouseout","onmouseover","onmouseup","onpaste","onpause","onplay","onplaying","onpointercancel","onpointerdown","onpointerenter","onpointerleave","onpointermove","onpointerout","onpointerover","onpointerup","onprogress","onratechange","onreset","onresize","onscroll","onscrollend","onsecuritypolicyviolation","onseeked","onseeking","onselect","onselectionchange","onselectstart","onslotchange","onstalled","onsubmit","onsuspend","ontimeupdate","ontoggle","ontouchcancel","ontouchend","ontouchmove","ontouchstart","ontransitioncancel","ontransitionend","ontransitionrun","ontransitionstart","onvolumechange","onwaiting","onwebkitanimationend","onwebkitanimationiteration","onwebkitanimationstart","onwebkittransitionend","onwheel"],Zs=new Set(Qs);function $s(n){return Zs.has(n)}function eo(...n){const e={...n[0]};for(let t=1;t<n.length;t++){const r=n[t];if(r){for(const s of Object.keys(r)){const o=e[s],a=r[s],l=typeof o=="function",d=typeof a=="function";if(l&&$s(s)){const p=o,b=a;e[s]=li(p,b)}else if(l&&d)e[s]=xe(o,a);else if(s==="class"){const p=Zn(o),b=Zn(a);p&&b?e[s]=Kn(o,a):p?e[s]=Kn(o):b&&(e[s]=Kn(a))}else if(s==="style"){const p=typeof o=="object",b=typeof a=="object",f=typeof o=="string",T=typeof a=="string";if(p&&b)e[s]={...o,...a};else if(p&&T){const S=dn(a);e[s]={...o,...S}}else if(f&&b){const S=dn(o);e[s]={...S,...a}}else if(f&&T){const S=dn(o),A=dn(a);e[s]={...S,...A}}else p?e[s]=o:b?e[s]=a:f?e[s]=o:T&&(e[s]=a)}else e[s]=a!==void 0?a:o}for(const s of Object.getOwnPropertySymbols(r)){const o=e[s],a=r[s];e[s]=a!==void 0?a:o}}}return typeof e.style=="object"&&(e.style=Xs(e.style).replaceAll(`
`," ")),e.hidden===!1&&(e.hidden=void 0,delete e.hidden),e.disabled===!1&&(e.disabled=void 0,delete e.disabled),e}const to=typeof window<"u"?window:void 0;function no(n){let e=n.activeElement;for(;e!=null&&e.shadowRoot;){const t=e.shadowRoot.activeElement;if(t===e)break;e=t}return e}var Je,pt;class ro{constructor(e={}){c(this,Je);c(this,pt);const{window:t=to,document:r=t==null?void 0:t.document}=e;t!==void 0&&(g(this,Je,r),g(this,pt,_s(s=>{const o=R(t,"focusin",s),a=R(t,"focusout",s);return()=>{o(),a()}})))}get current(){var e;return(e=i(this,pt))==null||e.call(this),i(this,Je)?no(i(this,Je)):null}}Je=new WeakMap,pt=new WeakMap;new ro;var ft,X;class on{constructor(e){c(this,ft);c(this,X);g(this,ft,e),g(this,X,Symbol(e))}get key(){return i(this,X)}exists(){return ds(i(this,X))}get(){const e=Hr(i(this,X));if(e===void 0)throw new Error(`Context "${i(this,ft)}" not found`);return e}getOr(e){const t=Hr(i(this,X));return t===void 0?e:t}set(e){return hs(i(this,X),e)}}ft=new WeakMap,X=new WeakMap;function io(n,e){switch(n){case"post":He(e);break;case"pre":ms(e);break}}function di(n,e,t,r={}){const{lazy:s=!1}=r;let o=!s,a=Array.isArray(n)?[]:void 0;io(e,()=>{const l=Array.isArray(n)?n.map(p=>p()):n();if(!o){o=!0,a=l;return}const d=Xn(()=>t(l,a));return a=l,d})}function Y(n,e,t){di(n,"post",e,t)}function so(n,e,t){di(n,"pre",e,t)}Y.pre=so;function an(n){He(()=>()=>{n()})}function oo(n,e){return setTimeout(e,n)}function ne(n){ps().then(n)}const ao=1,co=9,lo=11;function $n(n){return rn(n)&&n.nodeType===ao&&typeof n.nodeName=="string"}function hi(n){return rn(n)&&n.nodeType===co}function uo(n){var e;return rn(n)&&((e=n.constructor)==null?void 0:e.name)==="VisualViewport"}function ho(n){return rn(n)&&n.nodeType!==void 0}function mi(n){return ho(n)&&n.nodeType===lo&&"host"in n}function mo(n,e){var r;if(!n||!e||!$n(n)||!$n(e))return!1;const t=(r=e.getRootNode)==null?void 0:r.call(e);if(n===e||n.contains(e))return!0;if(t&&mi(t)){let s=e;for(;s;){if(n===s)return!0;s=s.parentNode||s.host}}return!1}function cn(n){return hi(n)?n:uo(n)?n.document:(n==null?void 0:n.ownerDocument)??document}function pi(n){var e;return mi(n)?pi(n.host):hi(n)?n.defaultView??window:$n(n)?((e=n.ownerDocument)==null?void 0:e.defaultView)??window:window}function po(n){let e=n.activeElement;for(;e!=null&&e.shadowRoot;){const t=e.shadowRoot.activeElement;if(t===e)break;e=t}return e}var _t;class _r{constructor(e){_(this,"element");c(this,_t,I(()=>this.element.current?this.element.current.getRootNode()??document:document));_(this,"getDocument",()=>cn(this.root));_(this,"getWindow",()=>this.getDocument().defaultView??window);_(this,"getActiveElement",()=>po(this.root));_(this,"isActiveElement",e=>e===this.getActiveElement());_(this,"querySelector",e=>this.root?this.root.querySelector(e):null);_(this,"querySelectorAll",e=>this.root?this.root.querySelectorAll(e):[]);_(this,"setTimeout",(e,t)=>this.getWindow().setTimeout(e,t));_(this,"clearTimeout",e=>this.getWindow().clearTimeout(e));typeof e=="function"?this.element=w(e):this.element=e}get root(){return u(i(this,_t))}set root(e){h(i(this,_t),e)}getElementById(e){return this.root.getElementById(e)}}_t=new WeakMap;function ln(n,e){return{[As()]:t=>sn(n)?(n.current=t,Xn(()=>e==null?void 0:e(t)),()=>{"isConnected"in t&&t.isConnected||(n.current=null,e==null||e(null))}):(n(t),Xn(()=>e==null?void 0:e(t)),()=>{"isConnected"in t&&t.isConnected||(n(null),e==null||e(null))})}}function fi(n){return n?"true":"false"}function qa(n){return n?"true":void 0}function _i(n){return n?"":void 0}function Xa(n){return n?!0:void 0}function gi(n){return n?"open":"closed"}function Qa(n){return n?"checked":"unchecked"}function Za(n,e){return e?"mixed":n?"true":"false"}var Ye,gt;class fo{constructor(e){c(this,Ye);c(this,gt);_(this,"attrs");g(this,Ye,e.getVariant?e.getVariant():null),g(this,gt,i(this,Ye)?`data-${i(this,Ye)}-`:`data-${e.component}-`),this.getAttr=this.getAttr.bind(this),this.selector=this.selector.bind(this),this.attrs=Object.fromEntries(e.parts.map(t=>[t,this.getAttr(t)]))}getAttr(e,t){return t?`data-${t}-${e}`:`${i(this,gt)}${e}`}selector(e,t){return`[${this.getAttr(e,t)}]`}}Ye=new WeakMap,gt=new WeakMap;function _o(n){const e=new fo(n);return{...e.attrs,selector:e.selector,getAttr:e.getAttr}}const mt="ArrowDown",gr="ArrowLeft",br="ArrowRight",vn="ArrowUp",bi="End",yi="Enter",go="Escape",Ai="Home",bo="PageDown",yo="PageUp",yr=" ",Ao="Tab";function vo(n){return window.getComputedStyle(n).getPropertyValue("direction")}function wo(n="ltr",e="horizontal"){return{horizontal:n==="rtl"?gr:br,vertical:mt}[e]}function To(n="ltr",e="horizontal"){return{horizontal:n==="rtl"?br:gr,vertical:vn}[e]}function Eo(n="ltr",e="horizontal"){return["ltr","rtl"].includes(n)||(n="ltr"),["horizontal","vertical"].includes(e)||(e="horizontal"),{nextKey:wo(n,e),prevKey:To(n,e)}}const vi=typeof document<"u",Wr=So();function So(){var n,e;return vi&&((n=window==null?void 0:window.navigator)==null?void 0:n.userAgent)&&(/iP(ad|hone|od)/.test(window.navigator.userAgent)||((e=window==null?void 0:window.navigator)==null?void 0:e.maxTouchPoints)>2&&/iPad|Macintosh/.test(window==null?void 0:window.navigator.userAgent))}function ie(n){return n instanceof HTMLElement}function er(n){return n instanceof Element}function wi(n){return n instanceof Element||n instanceof SVGElement}function $a(n){return n.pointerType==="touch"}function ec(n){return n.matches(":focus-visible")}function tc(n){return n!==null}function Io(n){return n instanceof HTMLInputElement&&"select"in n}var N,Q;class Mo{constructor(e){c(this,N);c(this,Q,Ue(null));g(this,N,e)}getCandidateNodes(){return i(this,N).rootNode.current?i(this,N).candidateSelector?Array.from(i(this,N).rootNode.current.querySelectorAll(i(this,N).candidateSelector)):i(this,N).candidateAttr?Array.from(i(this,N).rootNode.current.querySelectorAll(`[${i(this,N).candidateAttr}]:not([data-disabled])`)):[]:[]}focusFirstCandidate(){var t;const e=this.getCandidateNodes();e.length&&((t=e[0])==null||t.focus())}handleKeydown(e,t,r=!1){var A,y;const s=i(this,N).rootNode.current;if(!s||!e)return;const o=this.getCandidateNodes();if(!o.length)return;const a=o.indexOf(e),l=vo(s),{nextKey:d,prevKey:p}=Eo(l,i(this,N).orientation.current),b=i(this,N).loop.current,f={[d]:a+1,[p]:a-1,[Ai]:0,[bi]:o.length-1};if(r){const O=d===mt?br:mt,un=p===vn?gr:vn;f[O]=a+1,f[un]=a-1}let T=f[t.key];if(T===void 0)return;t.preventDefault(),T<0&&b?T=o.length-1:T===o.length&&b&&(T=0);const S=o[T];if(S)return S.focus(),i(this,Q).current=S.id,(y=(A=i(this,N)).onCandidateFocus)==null||y.call(A,S),S}getTabIndex(e){const t=this.getCandidateNodes(),r=i(this,Q).current!==null;return e&&!r&&t[0]===e?(i(this,Q).current=e.id,0):(e==null?void 0:e.id)===i(this,Q).current?0:-1}setCurrentTabStopId(e){i(this,Q).current=e}focusCurrentTabStop(){var r;const e=i(this,Q).current;if(!e)return;const t=(r=i(this,N).rootNode.current)==null?void 0:r.querySelector(`#${e}`);!t||!ie(t)||t.focus()}}N=new WeakMap,Q=new WeakMap;var Be,be,re,tr,fn;class Ro{constructor(e){c(this,re);c(this,Be);c(this,be,null);g(this,Be,e),an(()=>m(this,re,tr).call(this))}run(e){m(this,re,tr).call(this);const t=i(this,Be).ref.current;if(t){if(typeof t.getAnimations!="function"){m(this,re,fn).call(this,e);return}g(this,be,window.requestAnimationFrame(()=>{const r=t.getAnimations();if(r.length===0){m(this,re,fn).call(this,e);return}Promise.allSettled(r.map(s=>s.finished)).then(()=>{m(this,re,fn).call(this,e)})}))}}}Be=new WeakMap,be=new WeakMap,re=new WeakSet,tr=function(){i(this,be)&&(window.cancelAnimationFrame(i(this,be)),g(this,be,null))},fn=function(e){const t=()=>{e()};i(this,Be).afterTick?ne(t):t()};var K,bt,yt,ye;class No{constructor(e){c(this,K);c(this,bt);c(this,yt);c(this,ye,v(!1));g(this,K,e),h(i(this,ye),e.open.current,!0),g(this,bt,e.enabled??!0),g(this,yt,new Ro({ref:i(this,K).ref,afterTick:i(this,K).open})),Y(()=>i(this,K).open.current,t=>{t&&h(i(this,ye),!0),i(this,bt)&&i(this,yt).run(()=>{var r,s;t===i(this,K).open.current&&(i(this,K).open.current||h(i(this,ye),!1),(s=(r=i(this,K)).onComplete)==null||s.call(r))})})}get shouldRender(){return u(i(this,ye))}}K=new WeakMap,bt=new WeakMap,yt=new WeakMap,ye=new WeakMap;function G(){}function nc(n,e){return`bits-${n}`}function Do(n,e){var t=he(),r=me(t);ws(r,()=>e.children,s=>{var o=he(),a=me(o);tt(a,()=>e.children??nt),pe(s,o)}),pe(n,t)}const Co=new on("BitsConfig");function Oo(){const n=new Lo(null,{});return Co.getOr(n).opts}class Lo{constructor(e,t){_(this,"opts");const r=ko(e,t);this.opts={defaultPortalTo:r(s=>s.defaultPortalTo),defaultLocale:r(s=>s.defaultLocale)}}}function ko(n,e){return t=>w(()=>{var o,a;const s=(o=t(e))==null?void 0:o.current;if(s!==void 0)return s;if(n!==null)return(a=t(n.opts))==null?void 0:a.current})}function Fo(n,e){return t=>{const r=Oo();return w(()=>{const s=t();if(s!==void 0)return s;const o=n(r).current;return o!==void 0?o:e})}}const Po=Fo(n=>n.defaultPortalTo,"body");function rc(n,e){rt(e,!0);const t=Po(()=>e.to),r=fs();let s=I(o);function o(){if(!vi||e.disabled)return null;let f=null;return typeof t.current=="string"?f=document.querySelector(t.current):f=t.current,f}let a;function l(){a&&(bs(a),a=null)}Y([()=>u(s),()=>e.disabled],([f,T])=>{if(!f||T){l();return}return a=gs(Do,{target:f,props:{children:e.children},context:r}),()=>{l()}});var d=he(),p=me(d);{var b=f=>{var T=he(),S=me(T);tt(S,()=>e.children??nt),pe(f,T)};ys(p,f=>{e.disabled&&f(b)})}pe(n,d),it()}class xo{constructor(e,t={bubbles:!0,cancelable:!0}){_(this,"eventName");_(this,"options");this.eventName=e,this.options=t}createEvent(e){return new CustomEvent(this.eventName,{...this.options,detail:e})}dispatch(e,t){const r=this.createEvent(t);return e.dispatchEvent(r),r}listen(e,t,r){const s=o=>{t(o)};return R(e,this.eventName,s,r)}}function jr(n,e=500){let t=null;const r=(...s)=>{t!==null&&clearTimeout(t),t=setTimeout(()=>{n(...s)},e)};return r.destroy=()=>{t!==null&&(clearTimeout(t),t=null)},r}function Ti(n,e){return n===e||n.contains(e)}function Ei(n){return(n==null?void 0:n.ownerDocument)??document}function Go(n,e){const{clientX:t,clientY:r}=n,s=e.getBoundingClientRect();return t<s.left||t>s.right||r<s.top||r>s.bottom}const Ho=[yi,yr],Uo=[mt,yo,Ai],Si=[vn,bo,bi],Jo=[...Uo,...Si];function zr(n){return n.pointerType==="mouse"}function Yo(n,{select:e=!1}={}){if(!n||!n.focus)return;const t=cn(n);if(t.activeElement===n)return;const r=t.activeElement;n.focus({preventScroll:!0}),n!==r&&Io(n)&&e&&n.select()}function Bo(n,{select:e=!1}={},t){const r=t();for(const s of n)if(Yo(s,{select:e}),t()!==r)return!0}let ot=v(!1);const J=class J{constructor(){He(()=>(J._refs===0&&(J._cleanup=ai(()=>{const e=[],t=s=>{h(ot,!1)},r=s=>{h(ot,!0)};return e.push(R(document,"pointerdown",t,{capture:!0}),R(document,"pointermove",t,{capture:!0}),R(document,"keydown",r,{capture:!0})),xe(...e)})),J._refs++,()=>{var e;J._refs--,J._refs===0&&(h(ot,!1),(e=J._cleanup)==null||e.call(J))}))}get current(){return u(ot)}set current(e){h(ot,e,!0)}};_(J,"_refs",0),_(J,"_cleanup");let nr=J;/*!
* tabbable 6.4.0
* @license MIT, https://github.com/focus-trap/tabbable/blob/master/LICENSE
*/var Ii=["input:not([inert]):not([inert] *)","select:not([inert]):not([inert] *)","textarea:not([inert]):not([inert] *)","a[href]:not([inert]):not([inert] *)","button:not([inert]):not([inert] *)","[tabindex]:not(slot):not([inert]):not([inert] *)","audio[controls]:not([inert]):not([inert] *)","video[controls]:not([inert]):not([inert] *)",'[contenteditable]:not([contenteditable="false"]):not([inert]):not([inert] *)',"details>summary:first-of-type:not([inert]):not([inert] *)","details:not([inert]):not([inert] *)"],wn=Ii.join(","),Mi=typeof Element>"u",Ge=Mi?function(){}:Element.prototype.matches||Element.prototype.msMatchesSelector||Element.prototype.webkitMatchesSelector,Tn=!Mi&&Element.prototype.getRootNode?function(n){var e;return n==null||(e=n.getRootNode)===null||e===void 0?void 0:e.call(n)}:function(n){return n==null?void 0:n.ownerDocument},En=function(e,t){var r;t===void 0&&(t=!0);var s=e==null||(r=e.getAttribute)===null||r===void 0?void 0:r.call(e,"inert"),o=s===""||s==="true",a=o||t&&e&&(typeof e.closest=="function"?e.closest("[inert]"):En(e.parentNode));return a},Wo=function(e){var t,r=e==null||(t=e.getAttribute)===null||t===void 0?void 0:t.call(e,"contenteditable");return r===""||r==="true"},Ri=function(e,t,r){if(En(e))return[];var s=Array.prototype.slice.apply(e.querySelectorAll(wn));return t&&Ge.call(e,wn)&&s.unshift(e),s=s.filter(r),s},Sn=function(e,t,r){for(var s=[],o=Array.from(e);o.length;){var a=o.shift();if(!En(a,!1))if(a.tagName==="SLOT"){var l=a.assignedElements(),d=l.length?l:a.children,p=Sn(d,!0,r);r.flatten?s.push.apply(s,p):s.push({scopeParent:a,candidates:p})}else{var b=Ge.call(a,wn);b&&r.filter(a)&&(t||!e.includes(a))&&s.push(a);var f=a.shadowRoot||typeof r.getShadowRoot=="function"&&r.getShadowRoot(a),T=!En(f,!1)&&(!r.shadowRootFilter||r.shadowRootFilter(a));if(f&&T){var S=Sn(f===!0?a.children:f.children,!0,r);r.flatten?s.push.apply(s,S):s.push({scopeParent:a,candidates:S})}else o.unshift.apply(o,a.children)}}return s},Ni=function(e){return!isNaN(parseInt(e.getAttribute("tabindex"),10))},Di=function(e){if(!e)throw new Error("No node provided");return e.tabIndex<0&&(/^(AUDIO|VIDEO|DETAILS)$/.test(e.tagName)||Wo(e))&&!Ni(e)?0:e.tabIndex},jo=function(e,t){var r=Di(e);return r<0&&t&&!Ni(e)?0:r},zo=function(e,t){return e.tabIndex===t.tabIndex?e.documentOrder-t.documentOrder:e.tabIndex-t.tabIndex},Ci=function(e){return e.tagName==="INPUT"},Vo=function(e){return Ci(e)&&e.type==="hidden"},Ko=function(e){var t=e.tagName==="DETAILS"&&Array.prototype.slice.apply(e.children).some(function(r){return r.tagName==="SUMMARY"});return t},qo=function(e,t){for(var r=0;r<e.length;r++)if(e[r].checked&&e[r].form===t)return e[r]},Xo=function(e){if(!e.name)return!0;var t=e.form||Tn(e),r=function(l){return t.querySelectorAll('input[type="radio"][name="'+l+'"]')},s;if(typeof window<"u"&&typeof window.CSS<"u"&&typeof window.CSS.escape=="function")s=r(window.CSS.escape(e.name));else try{s=r(e.name)}catch(a){return console.error("Looks like you have a radio button with a name attribute containing invalid CSS selector characters and need the CSS.escape polyfill: %s",a.message),!1}var o=qo(s,e.form);return!o||o===e},Qo=function(e){return Ci(e)&&e.type==="radio"},Zo=function(e){return Qo(e)&&!Xo(e)},$o=function(e){var t,r=e&&Tn(e),s=(t=r)===null||t===void 0?void 0:t.host,o=!1;if(r&&r!==e){var a,l,d;for(o=!!((a=s)!==null&&a!==void 0&&(l=a.ownerDocument)!==null&&l!==void 0&&l.contains(s)||e!=null&&(d=e.ownerDocument)!==null&&d!==void 0&&d.contains(e));!o&&s;){var p,b,f;r=Tn(s),s=(p=r)===null||p===void 0?void 0:p.host,o=!!((b=s)!==null&&b!==void 0&&(f=b.ownerDocument)!==null&&f!==void 0&&f.contains(s))}}return o},Vr=function(e){var t=e.getBoundingClientRect(),r=t.width,s=t.height;return r===0&&s===0},ea=function(e,t){var r=t.displayCheck,s=t.getShadowRoot;if(r==="full-native"&&"checkVisibility"in e){var o=e.checkVisibility({checkOpacity:!1,opacityProperty:!1,contentVisibilityAuto:!0,visibilityProperty:!0,checkVisibilityCSS:!0});return!o}if(getComputedStyle(e).visibility==="hidden")return!0;var a=Ge.call(e,"details>summary:first-of-type"),l=a?e.parentElement:e;if(Ge.call(l,"details:not([open]) *"))return!0;if(!r||r==="full"||r==="full-native"||r==="legacy-full"){if(typeof s=="function"){for(var d=e;e;){var p=e.parentElement,b=Tn(e);if(p&&!p.shadowRoot&&s(p)===!0)return Vr(e);e.assignedSlot?e=e.assignedSlot:!p&&b!==e.ownerDocument?e=b.host:e=p}e=d}if($o(e))return!e.getClientRects().length;if(r!=="legacy-full")return!0}else if(r==="non-zero-area")return Vr(e);return!1},ta=function(e){if(/^(INPUT|BUTTON|SELECT|TEXTAREA)$/.test(e.tagName))for(var t=e.parentElement;t;){if(t.tagName==="FIELDSET"&&t.disabled){for(var r=0;r<t.children.length;r++){var s=t.children.item(r);if(s.tagName==="LEGEND")return Ge.call(t,"fieldset[disabled] *")?!0:!s.contains(e)}return!0}t=t.parentElement}return!1},In=function(e,t){return!(t.disabled||Vo(t)||ea(t,e)||Ko(t)||ta(t))},rr=function(e,t){return!(Zo(t)||Di(t)<0||!In(e,t))},na=function(e){var t=parseInt(e.getAttribute("tabindex"),10);return!!(isNaN(t)||t>=0)},Oi=function(e){var t=[],r=[];return e.forEach(function(s,o){var a=!!s.scopeParent,l=a?s.scopeParent:s,d=jo(l,a),p=a?Oi(s.candidates):l;d===0?a?t.push.apply(t,p):t.push(l):r.push({documentOrder:o,tabIndex:d,item:s,isScope:a,content:p})}),r.sort(zo).reduce(function(s,o){return o.isScope?s.push.apply(s,o.content):s.push(o.content),s},[]).concat(t)},Li=function(e,t){t=t||{};var r;return t.getShadowRoot?r=Sn([e],t.includeContainer,{filter:rr.bind(null,t),flatten:!1,getShadowRoot:t.getShadowRoot,shadowRootFilter:na}):r=Ri(e,t.includeContainer,rr.bind(null,t)),Oi(r)},ki=function(e,t){t=t||{};var r;return t.getShadowRoot?r=Sn([e],t.includeContainer,{filter:In.bind(null,t),flatten:!0,getShadowRoot:t.getShadowRoot}):r=Ri(e,t.includeContainer,In.bind(null,t)),r},Ar=function(e,t){if(t=t||{},!e)throw new Error("No node provided");return Ge.call(e,wn)===!1?!1:rr(t,e)},ra=Ii.concat("iframe:not([inert]):not([inert] *)").join(","),Fi=function(e,t){if(t=t||{},!e)throw new Error("No node provided");return Ge.call(e,ra)===!1?!1:In(t,e)};function ht(){return{getShadowRoot:!0,displayCheck:typeof ResizeObserver=="function"&&ResizeObserver.toString().includes("[native code]")?"full":"none"}}function ia(n,e){if(!Ar(n,ht()))return sa(n,e);const t=cn(n),r=Li(t.body,ht());e==="prev"&&r.reverse();const s=r.indexOf(n);return s===-1?t.body:r.slice(s+1)[0]}function sa(n,e){const t=cn(n);if(!Fi(n,ht()))return t.body;const r=ki(t.body,ht());e==="prev"&&r.reverse();const s=r.indexOf(n);return s===-1?t.body:r.slice(s+1).find(a=>Ar(a,ht()))??t.body}function Pi(n,e,t){const r=e.toLowerCase();if(r.endsWith(" ")){const f=r.slice(0,-1);if(n.filter(y=>y.toLowerCase().startsWith(f)).length<=1)return Pi(n,f,t);const S=t==null?void 0:t.toLowerCase();if(S&&S.startsWith(f)&&S.charAt(f.length)===" "&&e.trim()===f)return t;const A=n.filter(y=>y.toLowerCase().startsWith(r));if(A.length>0){const y=t?n.indexOf(t):-1;return Kr(A,Math.max(y,0)).find($i=>$i!==t)||t}}const o=e.length>1&&Array.from(e).every(f=>f===e[0])?e[0]:e,a=o.toLowerCase(),l=t?n.indexOf(t):-1;let d=Kr(n,Math.max(l,0));o.length===1&&(d=d.filter(f=>f!==t));const b=d.find(f=>f==null?void 0:f.toLowerCase().startsWith(a));return b!==t?b:void 0}function Kr(n,e){return n.map((t,r)=>n[(e+r)%n.length])}const oa={afterMs:1e4,onChange:G};function xi(n,e){const{afterMs:t,onChange:r,getWindow:s}={...oa,...e};let o=null,a=v(x(n));function l(){return s().setTimeout(()=>{h(a,n,!0),r==null||r(n)},t)}return He(()=>()=>{o&&s().clearTimeout(o)}),w(()=>u(a),d=>{h(a,d,!0),r==null||r(d),o&&s().clearTimeout(o),o=l()})}var Z,$,Rn,Nn;class aa{constructor(e){c(this,Z);c(this,$);c(this,Rn,I(()=>i(this,Z).onMatch?i(this,Z).onMatch:e=>e.focus()));c(this,Nn,I(()=>i(this,Z).getCurrentItem?i(this,Z).getCurrentItem:i(this,Z).getActiveElement));g(this,Z,e),g(this,$,xi("",{afterMs:1e3,getWindow:e.getWindow})),this.handleTypeaheadSearch=this.handleTypeaheadSearch.bind(this),this.resetTypeahead=this.resetTypeahead.bind(this)}handleTypeaheadSearch(e,t){var d,p;if(!t.length)return;i(this,$).current=i(this,$).current+e;const r=u(i(this,Nn))(),s=((p=(d=t.find(b=>b===r))==null?void 0:d.textContent)==null?void 0:p.trim())??"",o=t.map(b=>{var f;return((f=b.textContent)==null?void 0:f.trim())??""}),a=Pi(o,i(this,$).current,s),l=t.find(b=>{var f;return((f=b.textContent)==null?void 0:f.trim())===a});return l&&u(i(this,Rn))(l),l}resetTypeahead(){i(this,$).current=""}get search(){return i(this,$).current}}Z=new WeakMap,$=new WeakMap,Rn=new WeakMap,Nn=new WeakMap;var Ae,At,We,se,fe,ir,sr;class ca{constructor(e){c(this,fe);c(this,Ae);c(this,At);c(this,We);c(this,se,v(null));g(this,Ae,e),g(this,At,I(()=>i(this,Ae).enabled())),g(this,We,xi(!1,{afterMs:e.transitTimeout??300,onChange:t=>{var r,s;u(i(this,At))&&((s=(r=i(this,Ae)).setIsPointerInTransit)==null||s.call(r,t))},getWindow:()=>pi(i(this,Ae).triggerNode())})),Y([e.triggerNode,e.contentNode,e.enabled],([t,r,s])=>{if(!t||!r||!s)return;const o=l=>{m(this,fe,sr).call(this,l,r)},a=l=>{m(this,fe,sr).call(this,l,t)};return xe(R(t,"pointerleave",o),R(r,"pointerleave",a))}),Y(()=>u(i(this,se)),()=>{const t=s=>{var p,b;if(!u(i(this,se)))return;const o=s.target;if(!er(o))return;const a={x:s.clientX,y:s.clientY},l=((p=e.triggerNode())==null?void 0:p.contains(o))||((b=e.contentNode())==null?void 0:b.contains(o)),d=!ha(a,u(i(this,se)));l?m(this,fe,ir).call(this):d&&(m(this,fe,ir).call(this),e.onPointerExit())},r=cn(e.triggerNode()??e.contentNode());if(r)return R(r,"pointermove",t)})}}Ae=new WeakMap,At=new WeakMap,We=new WeakMap,se=new WeakMap,fe=new WeakSet,ir=function(){h(i(this,se),null),i(this,We).current=!1},sr=function(e,t){const r=e.currentTarget;if(!ie(r))return;const s={x:e.clientX,y:e.clientY},o=la(s,r.getBoundingClientRect()),a=ua(s,o),l=da(t.getBoundingClientRect()),d=ma([...a,...l]);h(i(this,se),d,!0),i(this,We).current=!0};function la(n,e){const t=Math.abs(e.top-n.y),r=Math.abs(e.bottom-n.y),s=Math.abs(e.right-n.x),o=Math.abs(e.left-n.x);switch(Math.min(t,r,s,o)){case o:return"left";case s:return"right";case t:return"top";case r:return"bottom";default:throw new Error("unreachable")}}function ua(n,e,t=5){const r=t*1.5;switch(e){case"top":return[{x:n.x-t,y:n.y+t},{x:n.x,y:n.y-r},{x:n.x+t,y:n.y+t}];case"bottom":return[{x:n.x-t,y:n.y-t},{x:n.x,y:n.y+r},{x:n.x+t,y:n.y-t}];case"left":return[{x:n.x+t,y:n.y-t},{x:n.x-r,y:n.y},{x:n.x+t,y:n.y+t}];case"right":return[{x:n.x-t,y:n.y-t},{x:n.x+r,y:n.y},{x:n.x-t,y:n.y+t}]}}function da(n){const{top:e,right:t,bottom:r,left:s}=n;return[{x:s,y:e},{x:t,y:e},{x:t,y:r},{x:s,y:r}]}function ha(n,e){const{x:t,y:r}=n;let s=!1;for(let o=0,a=e.length-1;o<e.length;a=o++){const l=e[o].x,d=e[o].y,p=e[a].x,b=e[a].y;d>r!=b>r&&t<(p-l)*(r-d)/(b-d)+l&&(s=!s)}return s}function ma(n){const e=n.slice();return e.sort((t,r)=>t.x<r.x?-1:t.x>r.x?1:t.y<r.y?-1:t.y>r.y?1:0),pa(e)}function pa(n){if(n.length<=1)return n.slice();const e=[];for(let r=0;r<n.length;r++){const s=n[r];for(;e.length>=2;){const o=e[e.length-1],a=e[e.length-2];if((o.x-a.x)*(s.y-a.y)>=(o.y-a.y)*(s.x-a.x))e.pop();else break}e.push(s)}e.pop();const t=[];for(let r=n.length-1;r>=0;r--){const s=n[r];for(;t.length>=2;){const o=t[t.length-1],a=t[t.length-2];if((o.x-a.x)*(s.y-a.y)>=(o.y-a.y)*(s.x-a.x))t.pop();else break}t.push(s)}return t.pop(),e.length===1&&t.length===1&&e[0].x===t[0].x&&e[0].y===t[0].y?e:e.concat(t)}const fa="data-context-menu-trigger",_a="data-context-menu-content",vr=new on("Menu.Root"),wr=new on("Menu.Root | Menu.Sub"),Gi=new on("Menu.Content"),ga=new on("Menu.Group | Menu.RadioGroup"),ba=new xo("bitsmenuopen",{bubbles:!1,cancelable:!0}),ya=_o({component:"menu",parts:["trigger","content","sub-trigger","item","group","group-heading","checkbox-group","checkbox-item","radio-group","radio-item","separator","sub-content","arrow"]});var vt,wt;const Sr=class Sr{constructor(e){_(this,"opts");_(this,"isUsingKeyboard",new nr);c(this,vt,v(!1));c(this,wt,v(!1));_(this,"getBitsAttr",e=>ya.getAttr(e,this.opts.variant.current));this.opts=e}static create(e){const t=new Sr(e);return vr.set(t)}get ignoreCloseAutoFocus(){return u(i(this,vt))}set ignoreCloseAutoFocus(e){h(i(this,vt),e,!0)}get isPointerInTransit(){return u(i(this,wt))}set isPointerInTransit(e){h(i(this,wt),e,!0)}};vt=new WeakMap,wt=new WeakMap;let qr=Sr;var Tt,Et;const Ir=class Ir{constructor(e,t,r){_(this,"opts");_(this,"root");_(this,"parentMenu");_(this,"contentId",w(()=>""));c(this,Tt,v(null));_(this,"contentPresence");c(this,Et,v(null));this.opts=e,this.root=t,this.parentMenu=r,this.contentPresence=new No({ref:w(()=>this.contentNode),open:this.opts.open,onComplete:()=>{this.opts.onOpenChangeComplete.current(this.opts.open.current)}}),r&&Y(()=>r.opts.open.current,()=>{r.opts.open.current||(this.opts.open.current=!1)})}static create(e,t){return wr.set(new Ir(e,t,null))}get contentNode(){return u(i(this,Tt))}set contentNode(e){h(i(this,Tt),e,!0)}get triggerNode(){return u(i(this,Et))}set triggerNode(e){h(i(this,Et),e,!0)}toggleOpen(){this.opts.open.current=!this.opts.open.current}onOpen(){this.opts.open.current=!0}onClose(){this.opts.open.current=!1}};Tt=new WeakMap,Et=new WeakMap;let Xr=Ir;var St,It,Mt,Rt,Nt,de,Hi,_n,Dt,Ct;const Mr=class Mr{constructor(e,t){c(this,de);_(this,"opts");_(this,"parentMenu");_(this,"rovingFocusGroup");_(this,"domContext");_(this,"attachment");c(this,St,v(""));c(this,It,0);c(this,Mt);c(this,Rt,v(!1));c(this,Nt);_(this,"onCloseAutoFocus",e=>{var t,r;(r=(t=this.opts.onCloseAutoFocus).current)==null||r.call(t,e),!(e.defaultPrevented||i(this,Nt))&&this.parentMenu.triggerNode&&Ar(this.parentMenu.triggerNode)&&(e.preventDefault(),this.parentMenu.triggerNode.focus())});c(this,Dt,I(()=>({open:this.parentMenu.opts.open.current})));c(this,Ct,I(()=>({id:this.opts.id.current,role:"menu","aria-orientation":"vertical",[this.parentMenu.root.getBitsAttr("content")]:"","data-state":gi(this.parentMenu.opts.open.current),onkeydown:this.onkeydown,onblur:this.onblur,onfocus:this.onfocus,dir:this.parentMenu.root.opts.dir.current,style:{pointerEvents:"auto",contain:"layout style"},...this.attachment})));_(this,"popperProps",{onCloseAutoFocus:e=>this.onCloseAutoFocus(e)});this.opts=e,this.parentMenu=t,this.domContext=new _r(e.ref),this.attachment=ln(this.opts.ref,r=>{this.parentMenu.contentNode!==r&&(this.parentMenu.contentNode=r)}),t.contentId=e.id,g(this,Nt,e.isSub??!1),this.onkeydown=this.onkeydown.bind(this),this.onblur=this.onblur.bind(this),this.onfocus=this.onfocus.bind(this),this.handleInteractOutside=this.handleInteractOutside.bind(this),new ca({contentNode:()=>this.parentMenu.contentNode,triggerNode:()=>this.parentMenu.triggerNode,enabled:()=>{var r;return this.parentMenu.opts.open.current&&!!((r=this.parentMenu.triggerNode)!=null&&r.hasAttribute(this.parentMenu.root.getBitsAttr("sub-trigger")))},onPointerExit:()=>{this.parentMenu.opts.open.current=!1},setIsPointerInTransit:r=>{this.parentMenu.root.isPointerInTransit=r}}),g(this,Mt,new aa({getActiveElement:()=>this.domContext.getActiveElement(),getWindow:()=>this.domContext.getWindow()}).handleTypeaheadSearch),this.rovingFocusGroup=new Mo({rootNode:w(()=>this.parentMenu.contentNode),candidateAttr:this.parentMenu.root.getBitsAttr("item"),loop:this.opts.loop,orientation:w(()=>"vertical")}),Y(()=>this.parentMenu.contentNode,r=>{if(!r)return;const s=()=>{ne(()=>{this.parentMenu.root.isUsingKeyboard.current&&this.rovingFocusGroup.focusFirstCandidate()})};return ba.listen(r,s)}),He(()=>{this.parentMenu.opts.open.current||this.domContext.getWindow().clearTimeout(i(this,It))})}static create(e){return Gi.set(new Mr(e,wr.get()))}get search(){return u(i(this,St))}set search(e){h(i(this,St),e,!0)}get mounted(){return u(i(this,Rt))}set mounted(e){h(i(this,Rt),e,!0)}handleTabKeyDown(e){let t=this.parentMenu;for(;t.parentMenu!==null;)t=t.parentMenu;if(!t.triggerNode)return;e.preventDefault();const r=ia(t.triggerNode,e.shiftKey?"prev":"next");r?(this.parentMenu.root.ignoreCloseAutoFocus=!0,t.onClose(),ne(()=>{r.focus(),ne(()=>{this.parentMenu.root.ignoreCloseAutoFocus=!1})})):this.domContext.getDocument().body.focus()}onkeydown(e){var p,b;if(e.defaultPrevented)return;if(e.key===Ao){this.handleTabKeyDown(e);return}const t=e.target,r=e.currentTarget;if(!ie(t)||!ie(r))return;const s=((p=t.closest(`[${this.parentMenu.root.getBitsAttr("content")}]`))==null?void 0:p.id)===this.parentMenu.contentId.current,o=e.ctrlKey||e.altKey||e.metaKey,a=e.key.length===1;if(this.rovingFocusGroup.handleKeydown(t,e)||e.code==="Space")return;const d=m(this,de,Hi).call(this);s&&!o&&a&&i(this,Mt).call(this,e.key,d),((b=e.target)==null?void 0:b.id)===this.parentMenu.contentId.current&&Jo.includes(e.key)&&(e.preventDefault(),Si.includes(e.key)&&d.reverse(),Bo(d,{select:!1},()=>this.domContext.getActiveElement()))}onblur(e){var t,r;er(e.currentTarget)&&er(e.target)&&((r=(t=e.currentTarget).contains)!=null&&r.call(t,e.target)||(this.domContext.getWindow().clearTimeout(i(this,It)),this.search=""))}onfocus(e){this.parentMenu.root.isUsingKeyboard.current&&ne(()=>this.rovingFocusGroup.focusFirstCandidate())}onItemEnter(){return m(this,de,_n).call(this)}onItemLeave(e){if(e.currentTarget.hasAttribute(this.parentMenu.root.getBitsAttr("sub-trigger"))||m(this,de,_n).call(this)||this.parentMenu.root.isUsingKeyboard.current)return;const t=this.parentMenu.contentNode;t==null||t.focus(),this.rovingFocusGroup.setCurrentTabStopId("")}onTriggerLeave(){return!!m(this,de,_n).call(this)}handleInteractOutside(e){var r;if(!wi(e.target))return;const t=(r=this.parentMenu.triggerNode)==null?void 0:r.id;if(e.target.id===t){e.preventDefault();return}e.target.closest(`#${t}`)&&e.preventDefault()}get shouldRender(){return this.parentMenu.contentPresence.shouldRender}get snippetProps(){return u(i(this,Dt))}set snippetProps(e){h(i(this,Dt),e)}get props(){return u(i(this,Ct))}set props(e){h(i(this,Ct),e)}};St=new WeakMap,It=new WeakMap,Mt=new WeakMap,Rt=new WeakMap,Nt=new WeakMap,de=new WeakSet,Hi=function(){const e=this.parentMenu.contentNode;return e?Array.from(e.querySelectorAll(`[${this.parentMenu.root.getBitsAttr("item")}]:not([data-disabled])`)):[]},_n=function(){return this.parentMenu.root.isPointerInTransit},Dt=new WeakMap,Ct=new WeakMap;let Qr=Mr;var je,Ot;class Aa{constructor(e,t){_(this,"opts");_(this,"content");_(this,"attachment");c(this,je,v(!1));c(this,Ot,I(()=>({id:this.opts.id.current,tabindex:-1,role:"menuitem","aria-disabled":fi(this.opts.disabled.current),"data-disabled":_i(this.opts.disabled.current),"data-highlighted":u(i(this,je))?"":void 0,[this.content.parentMenu.root.getBitsAttr("item")]:"",onpointermove:this.onpointermove,onpointerleave:this.onpointerleave,onfocus:this.onfocus,onblur:this.onblur,...this.attachment})));this.opts=e,this.content=t,this.attachment=ln(this.opts.ref),this.onpointermove=this.onpointermove.bind(this),this.onpointerleave=this.onpointerleave.bind(this),this.onfocus=this.onfocus.bind(this),this.onblur=this.onblur.bind(this)}onpointermove(e){if(!e.defaultPrevented&&zr(e))if(this.opts.disabled.current)this.content.onItemLeave(e);else{if(this.content.onItemEnter())return;const r=e.currentTarget;if(!ie(r))return;r.focus()}}onpointerleave(e){e.defaultPrevented||zr(e)&&this.content.onItemLeave(e)}onfocus(e){ne(()=>{e.defaultPrevented||this.opts.disabled.current||h(i(this,je),!0)})}onblur(e){ne(()=>{e.defaultPrevented||h(i(this,je),!1)})}get props(){return u(i(this,Ot))}set props(e){h(i(this,Ot),e)}}je=new WeakMap,Ot=new WeakMap;var Lt,Dn,Ui,kt;const Rr=class Rr{constructor(e,t){c(this,Dn);_(this,"opts");_(this,"item");_(this,"root");c(this,Lt,!1);c(this,kt,I(()=>eo(this.item.props,{onclick:this.onclick,onpointerdown:this.onpointerdown,onpointerup:this.onpointerup,onkeydown:this.onkeydown})));this.opts=e,this.item=t,this.root=t.content.parentMenu.root,this.onkeydown=this.onkeydown.bind(this),this.onclick=this.onclick.bind(this),this.onpointerdown=this.onpointerdown.bind(this),this.onpointerup=this.onpointerup.bind(this)}static create(e){const t=new Aa(e,Gi.get());return new Rr(e,t)}onkeydown(e){const t=this.item.content.search!=="";if(!(this.item.opts.disabled.current||t&&e.key===yr)&&Ho.includes(e.key)){if(!ie(e.currentTarget))return;e.currentTarget.click(),e.preventDefault()}}onclick(e){this.item.opts.disabled.current||m(this,Dn,Ui).call(this)}onpointerup(e){var t;if(!e.defaultPrevented&&!i(this,Lt)){if(!ie(e.currentTarget))return;(t=e.currentTarget)==null||t.click()}}onpointerdown(e){g(this,Lt,!0)}get props(){return u(i(this,kt))}set props(e){h(i(this,kt),e)}};Lt=new WeakMap,Dn=new WeakSet,Ui=function(){if(this.item.opts.disabled.current)return;const e=new CustomEvent("menuitemselect",{bubbles:!0,cancelable:!0});if(this.opts.onSelect.current(e),e.defaultPrevented){this.item.content.parentMenu.root.isUsingKeyboard.current=!1;return}this.opts.closeOnSelect.current&&this.item.content.parentMenu.root.opts.onClose()},kt=new WeakMap;let Zr=Rr;var Ft,Pt;const Nr=class Nr{constructor(e,t){_(this,"opts");_(this,"root");_(this,"attachment");c(this,Ft,v(void 0));c(this,Pt,I(()=>({id:this.opts.id.current,role:"group","aria-labelledby":this.groupHeadingId,[this.root.getBitsAttr("group")]:"",...this.attachment})));this.opts=e,this.root=t,this.attachment=ln(this.opts.ref)}static create(e){return ga.set(new Nr(e,vr.get()))}get groupHeadingId(){return u(i(this,Ft))}set groupHeadingId(e){h(i(this,Ft),e,!0)}get props(){return u(i(this,Pt))}set props(e){h(i(this,Pt),e)}};Ft=new WeakMap,Pt=new WeakMap;let $r=Nr;var xt;const Dr=class Dr{constructor(e,t){_(this,"opts");_(this,"root");_(this,"attachment");c(this,xt,I(()=>({id:this.opts.id.current,role:"group",[this.root.getBitsAttr("separator")]:"",...this.attachment})));this.opts=e,this.root=t,this.attachment=ln(this.opts.ref)}static create(e){return new Dr(e,vr.get())}get props(){return u(i(this,xt))}set props(e){h(i(this,xt),e)}};xt=new WeakMap;let ei=Dr;var Cn,Gt;const Cr=class Cr{constructor(e,t){_(this,"opts");_(this,"parentMenu");_(this,"attachment");_(this,"onclick",e=>{this.opts.disabled.current||e.detail!==0||(this.parentMenu.toggleOpen(),e.preventDefault())});_(this,"onpointerdown",e=>{if(!this.opts.disabled.current){if(e.pointerType==="touch")return e.preventDefault();e.button===0&&e.ctrlKey===!1&&(this.parentMenu.toggleOpen(),this.parentMenu.opts.open.current||e.preventDefault())}});_(this,"onpointerup",e=>{this.opts.disabled.current||e.pointerType==="touch"&&(e.preventDefault(),this.parentMenu.toggleOpen())});_(this,"onkeydown",e=>{if(!this.opts.disabled.current){if(e.key===yr||e.key===yi){this.parentMenu.toggleOpen(),e.preventDefault();return}e.key===mt&&(this.parentMenu.onOpen(),e.preventDefault())}});c(this,Cn,I(()=>{if(this.parentMenu.opts.open.current&&this.parentMenu.contentId.current)return this.parentMenu.contentId.current}));c(this,Gt,I(()=>({id:this.opts.id.current,disabled:this.opts.disabled.current,"aria-haspopup":"menu","aria-expanded":fi(this.parentMenu.opts.open.current),"aria-controls":u(i(this,Cn)),"data-disabled":_i(this.opts.disabled.current),"data-state":gi(this.parentMenu.opts.open.current),[this.parentMenu.root.getBitsAttr("trigger")]:"",onclick:this.onclick,onpointerdown:this.onpointerdown,onpointerup:this.onpointerup,onkeydown:this.onkeydown,...this.attachment})));this.opts=e,this.parentMenu=t,this.attachment=ln(this.opts.ref,r=>this.parentMenu.triggerNode=r)}static create(e){return new Cr(e,wr.get())}get props(){return u(i(this,Gt))}set props(e){h(i(this,Gt),e)}};Cn=new WeakMap,Gt=new WeakMap;let ti=Cr;globalThis.bitsDismissableLayers??(globalThis.bitsDismissableLayers=new Map);var ze,ve,oe,Ve,Ke,ae,Ht,ee,On,et,Ji,Ln,qe,kn,Fn,Pn,xn,Ut,Yi,Gn,Hn;const Or=class Or{constructor(e){c(this,et);_(this,"opts");c(this,ze);c(this,ve);c(this,oe,{pointerdown:!1});c(this,Ve,!1);c(this,Ke,!1);c(this,ae);c(this,Ht);c(this,ee,G);c(this,On,e=>{e.defaultPrevented||this.opts.ref.current&&ne(()=>{var t,r;!this.opts.ref.current||i(this,xn).call(this,e.target)||e.target&&!i(this,Ke)&&((r=(t=i(this,Ht)).current)==null||r.call(t,e))})});c(this,Ln,e=>{let t=e;t.defaultPrevented&&(t=ni(e)),i(this,ze).current(e)});c(this,qe,jr(e=>{if(!this.opts.ref.current){i(this,ee).call(this);return}const t=this.opts.isValidEvent.current(e,this.opts.ref.current)||Ta(e,this.opts.ref.current);if(!i(this,Ve)||m(this,et,Yi).call(this)||!t){i(this,ee).call(this);return}let r=e;if(r.defaultPrevented&&(r=ni(r)),i(this,ve).current!=="close"&&i(this,ve).current!=="defer-otherwise-close"){i(this,ee).call(this);return}e.pointerType==="touch"?(i(this,ee).call(this),g(this,ee,R(i(this,ae),"click",i(this,Ln),{once:!0}))):i(this,ze).current(r)},10));c(this,kn,e=>{i(this,oe)[e.type]=!0});c(this,Fn,e=>{i(this,oe)[e.type]=!1});c(this,Pn,()=>{this.opts.ref.current&&g(this,Ve,wa(this.opts.ref.current))});c(this,xn,e=>this.opts.ref.current?Ti(this.opts.ref.current,e):!1);c(this,Ut,jr(()=>{for(const e in i(this,oe))i(this,oe)[e]=!1;g(this,Ve,!1)},20));c(this,Gn,()=>{g(this,Ke,!0)});c(this,Hn,()=>{g(this,Ke,!1)});_(this,"props",{onfocuscapture:i(this,Gn),onblurcapture:i(this,Hn)});this.opts=e,g(this,ve,e.interactOutsideBehavior),g(this,ze,e.onInteractOutside),g(this,Ht,e.onFocusOutside),He(()=>{g(this,ae,Ei(this.opts.ref.current))});let t=G;const r=()=>{i(this,Ut).call(this),globalThis.bitsDismissableLayers.delete(this),i(this,qe).destroy(),t()};Y([()=>this.opts.enabled.current,()=>this.opts.ref.current],()=>{if(!(!this.opts.enabled.current||!this.opts.ref.current))return oo(1,()=>{this.opts.ref.current&&(globalThis.bitsDismissableLayers.set(this,i(this,ve)),t(),t=m(this,et,Ji).call(this))}),r}),an(()=>{i(this,Ut).destroy(),globalThis.bitsDismissableLayers.delete(this),i(this,qe).destroy(),i(this,ee).call(this),t()})}static create(e){return new Or(e)}};ze=new WeakMap,ve=new WeakMap,oe=new WeakMap,Ve=new WeakMap,Ke=new WeakMap,ae=new WeakMap,Ht=new WeakMap,ee=new WeakMap,On=new WeakMap,et=new WeakSet,Ji=function(){return xe(R(i(this,ae),"pointerdown",xe(i(this,kn),i(this,Pn)),{capture:!0}),R(i(this,ae),"pointerdown",xe(i(this,Fn),i(this,qe))),R(i(this,ae),"focusin",i(this,On)))},Ln=new WeakMap,qe=new WeakMap,kn=new WeakMap,Fn=new WeakMap,Pn=new WeakMap,xn=new WeakMap,Ut=new WeakMap,Yi=function(){return Object.values(i(this,oe)).some(Boolean)},Gn=new WeakMap,Hn=new WeakMap;let or=Or;function va(n=[...globalThis.bitsDismissableLayers]){return n.findLast(([e,{current:t}])=>t==="close"||t==="ignore")}function wa(n){const e=[...globalThis.bitsDismissableLayers],t=va(e);if(t)return t[0].opts.ref.current===n;const[r]=e[0];return r.opts.ref.current===n}function Ta(n,e){const t=n.target;if(!wi(t))return!1;const r=!!t.closest(`[${fa}]`);if("button"in n&&n.button>0&&!r)return!1;if("button"in n&&n.button===0&&r)return!0;const s=!!e.closest(`[${_a}]`);return r&&s?!1:Ei(t).documentElement.contains(t)&&!Ti(e,t)&&Go(n,e)}function ni(n){const e=n.currentTarget,t=n.target;let r;n instanceof PointerEvent?r=new PointerEvent(n.type,n):r=new PointerEvent("pointerdown",n);let s=!1;return new Proxy(r,{get:(a,l)=>l==="currentTarget"?e:l==="target"?t:l==="preventDefault"?()=>{s=!0,typeof a.preventDefault=="function"&&a.preventDefault()}:l==="defaultPrevented"?s:l in a?a[l]:n[l]})}function ic(n,e){rt(e,!0);let t=C(e,"interactOutsideBehavior",3,"close"),r=C(e,"onInteractOutside",3,G),s=C(e,"onFocusOutside",3,G),o=C(e,"isValidEvent",3,()=>!1);const a=or.create({id:w(()=>e.id),interactOutsideBehavior:w(()=>t()),onInteractOutside:w(()=>r()),enabled:w(()=>e.enabled),onFocusOutside:w(()=>s()),isValidEvent:w(()=>o()),ref:e.ref});var l=he(),d=me(l);tt(d,()=>e.children??nt,()=>({props:a.props})),pe(n,l),it()}globalThis.bitsEscapeLayers??(globalThis.bitsEscapeLayers=new Map);var Un,Jn;const Lr=class Lr{constructor(e){_(this,"opts");_(this,"domContext");c(this,Un,()=>R(this.domContext.getDocument(),"keydown",i(this,Jn),{passive:!1}));c(this,Jn,e=>{if(e.key!==go||!Ea(this))return;const t=new KeyboardEvent(e.type,e);e.preventDefault();const r=this.opts.escapeKeydownBehavior.current;r!=="close"&&r!=="defer-otherwise-close"||this.opts.onEscapeKeydown.current(t)});this.opts=e,this.domContext=new _r(this.opts.ref);let t=G;Y(()=>e.enabled.current,r=>(r&&(globalThis.bitsEscapeLayers.set(this,e.escapeKeydownBehavior),t=i(this,Un).call(this)),()=>{t(),globalThis.bitsEscapeLayers.delete(this)}))}static create(e){return new Lr(e)}};Un=new WeakMap,Jn=new WeakMap;let ar=Lr;function Ea(n){const e=[...globalThis.bitsEscapeLayers],t=e.findLast(([s,{current:o}])=>o==="close"||o==="ignore");if(t)return t[0]===n;const[r]=e[0];return r===n}function sc(n,e){rt(e,!0);let t=C(e,"escapeKeydownBehavior",3,"close"),r=C(e,"onEscapeKeydown",3,G);ar.create({escapeKeydownBehavior:w(()=>t()),onEscapeKeydown:w(()=>r()),enabled:w(()=>e.enabled),ref:e.ref});var s=he(),o=me(s);tt(o,()=>e.children??nt),pe(n,s),it()}var te,Jt,we;const Yn=class Yn{constructor(){c(this,te,ci([]));c(this,Jt,new WeakMap);c(this,we,new WeakMap)}static getInstance(){return this.instance||(this.instance=new Yn),this.instance}register(e){const t=this.getActive();t&&t!==e&&t.pause();const r=document.activeElement;r&&r!==document.body&&i(this,we).set(e,r),i(this,te).current=i(this,te).current.filter(s=>s!==e),i(this,te).current.unshift(e)}unregister(e){i(this,te).current=i(this,te).current.filter(r=>r!==e);const t=this.getActive();t&&t.resume()}getActive(){return i(this,te).current[0]}setFocusMemory(e,t){i(this,Jt).set(e,t)}getFocusMemory(e){return i(this,Jt).get(e)}isActiveScope(e){return this.getActive()===e}setPreFocusMemory(e,t){i(this,we).set(e,t)}getPreFocusMemory(e){return i(this,we).get(e)}clearPreFocusMemory(e){i(this,we).delete(e)}};te=new WeakMap,Jt=new WeakMap,we=new WeakMap,_(Yn,"instance");let cr=Yn;var ce,D,L,Te,le,M,Bi,Wi,ji,zi,ur,gn,dr;const kr=class kr{constructor(e){c(this,M);c(this,ce,!1);c(this,D,null);c(this,L,cr.getInstance());c(this,Te,[]);c(this,le);g(this,le,e)}get paused(){return i(this,ce)}pause(){g(this,ce,!0)}resume(){g(this,ce,!1)}mount(e){i(this,D)&&this.unmount(),g(this,D,e),i(this,L).register(this),m(this,M,zi).call(this),m(this,M,Wi).call(this)}unmount(){i(this,D)&&(m(this,M,Bi).call(this),m(this,M,ji).call(this),i(this,L).unregister(this),i(this,L).clearPreFocusMemory(this),g(this,D,null))}static use(e){let t=null;return Y([()=>e.ref.current,()=>e.enabled.current],([r,s])=>{r&&s?(t||(t=new kr(e)),t.mount(r)):t&&(t.unmount(),t=null)}),an(()=>{t==null||t.unmount()}),{get props(){return{tabindex:-1}}}}};ce=new WeakMap,D=new WeakMap,L=new WeakMap,Te=new WeakMap,le=new WeakMap,M=new WeakSet,Bi=function(){for(const e of i(this,Te))e();g(this,Te,[])},Wi=function(){if(!i(this,D))return;const e=new CustomEvent("focusScope.onOpenAutoFocus",{bubbles:!1,cancelable:!0});i(this,le).onOpenAutoFocus.current(e),e.defaultPrevented||requestAnimationFrame(()=>{if(!i(this,D))return;const t=m(this,M,gn).call(this);t?(t.focus(),i(this,L).setFocusMemory(this,t)):i(this,D).focus()})},ji=function(){var t,r;const e=new CustomEvent("focusScope.onCloseAutoFocus",{bubbles:!1,cancelable:!0});if((r=(t=i(this,le).onCloseAutoFocus).current)==null||r.call(t,e),!e.defaultPrevented){const s=i(this,L).getPreFocusMemory(this);if(s&&document.contains(s))try{s.focus()}catch{document.body.focus()}}},zi=function(){if(!i(this,D)||!i(this,le).trap.current)return;const e=i(this,D),t=e.ownerDocument,r=a=>{if(i(this,ce)||!i(this,L).isActiveScope(this))return;const l=a.target;if(!l)return;if(e.contains(l))i(this,L).setFocusMemory(this,l);else{const p=i(this,L).getFocusMemory(this);if(p&&e.contains(p)&&Fi(p))a.preventDefault(),p.focus();else{const b=m(this,M,gn).call(this),f=m(this,M,dr).call(this)[0];(b||f||e).focus()}}},s=a=>{if(!i(this,le).loop||i(this,ce)||a.key!=="Tab"||!i(this,L).isActiveScope(this))return;const l=m(this,M,ur).call(this);if(l.length===0)return;const d=l[0],p=l[l.length-1];!a.shiftKey&&t.activeElement===p?(a.preventDefault(),d.focus()):a.shiftKey&&t.activeElement===d&&(a.preventDefault(),p.focus())};i(this,Te).push(R(t,"focusin",r,{capture:!0}),R(e,"keydown",s));const o=new MutationObserver(()=>{const a=i(this,L).getFocusMemory(this);if(a&&!e.contains(a)){const l=m(this,M,gn).call(this),d=m(this,M,dr).call(this)[0],p=l||d;p?(p.focus(),i(this,L).setFocusMemory(this,p)):e.focus()}});o.observe(e,{childList:!0,subtree:!0}),i(this,Te).push(()=>o.disconnect())},ur=function(){return i(this,D)?Li(i(this,D),{includeContainer:!1,getShadowRoot:!0}):[]},gn=function(){return m(this,M,ur).call(this)[0]||null},dr=function(){return i(this,D)?ki(i(this,D),{includeContainer:!1,getShadowRoot:!0}):[]};let lr=kr;function oc(n,e){rt(e,!0);let t=C(e,"enabled",3,!1),r=C(e,"trapFocus",3,!1),s=C(e,"loop",3,!1),o=C(e,"onCloseAutoFocus",3,G),a=C(e,"onOpenAutoFocus",3,G);const l=lr.use({enabled:w(()=>t()),trap:w(()=>r()),loop:s(),onCloseAutoFocus:w(()=>o()),onOpenAutoFocus:w(()=>a()),ref:e.ref});var d=he(),p=me(d);tt(p,()=>e.focusScope??nt,()=>({props:l.props})),pe(n,d),it()}globalThis.bitsTextSelectionLayers??(globalThis.bitsTextSelectionLayers=new Map);var Xe,Bn,Vi,Wn,Yt;const Fr=class Fr{constructor(e){c(this,Bn);_(this,"opts");_(this,"domContext");c(this,Xe,G);c(this,Wn,e=>{const t=this.opts.ref.current,r=e.target;!ie(t)||!ie(r)||!this.opts.enabled.current||!Ia(this)||!mo(t,r)||(this.opts.onPointerDown.current(e),!e.defaultPrevented&&g(this,Xe,Sa(t,this.domContext.getDocument().body)))});c(this,Yt,()=>{i(this,Xe).call(this),g(this,Xe,G)});this.opts=e,this.domContext=new _r(e.ref);let t=G;Y(()=>this.opts.enabled.current,r=>(r&&(globalThis.bitsTextSelectionLayers.set(this,this.opts.enabled),t(),t=m(this,Bn,Vi).call(this)),()=>{t(),i(this,Yt).call(this),globalThis.bitsTextSelectionLayers.delete(this)}))}static create(e){return new Fr(e)}};Xe=new WeakMap,Bn=new WeakSet,Vi=function(){return xe(R(this.domContext.getDocument(),"pointerdown",i(this,Wn)),R(this.domContext.getDocument(),"pointerup",li(i(this,Yt),this.opts.onPointerUp.current)))},Wn=new WeakMap,Yt=new WeakMap;let hr=Fr;const ri=n=>n.style.userSelect||n.style.webkitUserSelect;function Sa(n,e){const t=ri(e),r=ri(n);return hn(e,"none"),hn(n,"text"),()=>{hn(e,t),hn(n,r)}}function hn(n,e){n.style.userSelect=e,n.style.webkitUserSelect=e}function Ia(n){const e=[...globalThis.bitsTextSelectionLayers];if(!e.length)return!1;const t=e.at(-1);return t?t[0]===n:!1}function ac(n,e){rt(e,!0);let t=C(e,"preventOverflowTextSelection",3,!0),r=C(e,"onPointerDown",3,G),s=C(e,"onPointerUp",3,G);hr.create({id:w(()=>e.id),onPointerDown:w(()=>r()),onPointerUp:w(()=>s()),enabled:w(()=>e.enabled&&t()),ref:e.ref});var o=he(),a=me(o);tt(a,()=>e.children??nt),pe(n,o),it()}globalThis.bitsIdCounter??(globalThis.bitsIdCounter={current:0});function Ma(n="bits"){return globalThis.bitsIdCounter.current++,`${n}-${globalThis.bitsIdCounter.current}`}var Bt,Qe,Ee,Se,jn,Ki;class Ra{constructor(e){c(this,jn);c(this,Bt);c(this,Qe,0);c(this,Ee,v());c(this,Se);g(this,Bt,e)}get(...e){return g(this,Qe,i(this,Qe)+1),u(i(this,Ee))===void 0&&g(this,Se,ai(()=>{h(i(this,Ee),i(this,Bt).call(this,...e),!0)})),He(()=>()=>{m(this,jn,Ki).call(this)}),u(i(this,Ee))}}Bt=new WeakMap,Qe=new WeakMap,Ee=new WeakMap,Se=new WeakMap,jn=new WeakSet,Ki=function(){g(this,Qe,i(this,Qe)-1),i(this,Se)&&i(this,Qe)<=0&&(i(this,Se).call(this),h(i(this,Ee),void 0),g(this,Se,void 0))};const bn=new Qn;let mn=v(null),_e=null,at=null,ct=!1;const ii=w(()=>{for(const n of bn.values())if(n)return!0;return!1});let qn=null;const Na=new Ra(()=>{function n(){document.body.setAttribute("style",u(mn)??""),document.body.style.removeProperty("--scrollbar-width"),Wr&&(_e==null||_e()),h(mn,null)}function e(){at!==null&&(window.clearTimeout(at),at=null)}function t(s,o){e(),ct=!0,qn=Date.now();const a=qn,l=()=>{at=null,qn===a&&(qi(bn)?ct=!1:(ct=!1,o()))},d=s===null?24:s;at=window.setTimeout(l,d)}function r(){u(mn)===null&&bn.size===0&&!ct&&h(mn,document.body.getAttribute("style"),!0)}return Y(()=>ii.current,()=>{var b,f;if(!ii.current)return;r(),ct=!1;const s=getComputedStyle(document.documentElement),o=getComputedStyle(document.body),a=((b=s.scrollbarGutter)==null?void 0:b.includes("stable"))||((f=o.scrollbarGutter)==null?void 0:f.includes("stable")),l=window.innerWidth-document.documentElement.clientWidth,p={padding:Number.parseInt(o.paddingRight??"0",10)+l,margin:Number.parseInt(o.marginRight??"0",10)};l>0&&!a&&(document.body.style.paddingRight=`${p.padding}px`,document.body.style.marginRight=`${p.margin}px`,document.body.style.setProperty("--scrollbar-width",`${l}px`)),document.body.style.overflow="hidden",Wr&&(_e=R(document,"touchmove",T=>{T.target===document.documentElement&&(T.touches.length>1||T.preventDefault())},{passive:!1})),ne(()=>{document.body.style.pointerEvents="none",document.body.style.overflow="hidden"})}),an(()=>()=>{_e==null||_e()}),{get lockMap(){return bn},resetBodyStyle:n,scheduleCleanupIfNoNewLocks:t,cancelPendingCleanup:e,ensureInitialStyleCaptured:r}});var Ie,Wt,jt,k;class Da{constructor(e,t=()=>null){c(this,Ie,Ma());c(this,Wt);c(this,jt,()=>null);c(this,k);_(this,"locked");g(this,Wt,e),g(this,jt,t),g(this,k,Na.get()),i(this,k)&&(i(this,k).cancelPendingCleanup(),i(this,k).ensureInitialStyleCaptured(),i(this,k).lockMap.set(i(this,Ie),i(this,Wt)??!1),this.locked=w(()=>i(this,k).lockMap.get(i(this,Ie))??!1,r=>i(this,k).lockMap.set(i(this,Ie),r)),an(()=>{if(i(this,k).lockMap.delete(i(this,Ie)),qi(i(this,k).lockMap))return;const r=i(this,jt).call(this);i(this,k).scheduleCleanupIfNoNewLocks(r,()=>{i(this,k).resetBodyStyle()})}))}}Ie=new WeakMap,Wt=new WeakMap,jt=new WeakMap,k=new WeakMap;function qi(n){for(const[e,t]of n)if(t)return!0;return!1}function cc(n,e){rt(e,!0);let t=C(e,"preventScroll",3,!0),r=C(e,"restoreScrollDelay",3,null);t()&&new Da(t(),()=>r()),it()}const Xi=[{id:"gemini-3.1-flash-lite-preview",label:"Gemini 3.1 Flash Lite",provider:"google",minTier:"free",cost:1},{id:"gemini-3-flash-preview",label:"Gemini 3 Flash",provider:"google",minTier:"plus",cost:2},{id:"gemini-3.1-pro-preview",label:"Gemini 3.1 Pro",provider:"google",minTier:"plus",cost:3},{id:"claude-sonnet-4-6",label:"Claude Sonnet 4.6",provider:"anthropic",minTier:"plus",cost:3},{id:"claude-opus-4-6",label:"Claude Opus 4.6",provider:"anthropic",minTier:"plus",cost:4}],Ca="gemini-3.1-flash-lite-preview";new Set(Xi.map(n=>n.id));Object.fromEntries(Xi.map(n=>[n.id,n.minTier]));const B={yamlEditor:!1,linksCollapsed:!1,selectedFileId:void 0,colorMode:"system",showArchive:!1,showTrash:!1,activeSection:"cv",wordWrap:!0,entriesExpanded:!0,selectedModel:Ca};var ue,Ze,Me,Re,Ne,De,Ce,Oe,Le,ke,Fe,Pe,F,H;class Oa{constructor(){c(this,F);c(this,ue);c(this,Ze,!1);c(this,Me,v(x(B.yamlEditor)));c(this,Re,v(x(B.linksCollapsed)));c(this,Ne,v(x(B.selectedFileId)));c(this,De,v(x(B.colorMode)));c(this,Ce,v(x(B.showArchive)));c(this,Oe,v(x(B.showTrash)));c(this,Le,v(x(B.activeSection)));c(this,ke,v(x(B.wordWrap)));c(this,Fe,v(x(B.entriesExpanded)));c(this,Pe,v(x(B.selectedModel)))}get yamlEditor(){return u(i(this,Me))}set yamlEditor(e){h(i(this,Me),e,!0),m(this,F,H).call(this)}get linksCollapsed(){return u(i(this,Re))}set linksCollapsed(e){h(i(this,Re),e,!0),m(this,F,H).call(this)}get selectedFileId(){return u(i(this,Ne))}set selectedFileId(e){h(i(this,Ne),e,!0),m(this,F,H).call(this)}get colorMode(){return u(i(this,De))}set colorMode(e){h(i(this,De),e,!0),m(this,F,H).call(this)}get showArchive(){return u(i(this,Ce))}set showArchive(e){h(i(this,Ce),e,!0),m(this,F,H).call(this)}get showTrash(){return u(i(this,Oe))}set showTrash(e){h(i(this,Oe),e,!0),m(this,F,H).call(this)}get activeSection(){return u(i(this,Le))}set activeSection(e){h(i(this,Le),e,!0),m(this,F,H).call(this)}get wordWrap(){return u(i(this,ke))}set wordWrap(e){h(i(this,ke),e,!0),m(this,F,H).call(this)}get entriesExpanded(){return u(i(this,Fe))}set entriesExpanded(e){h(i(this,Fe),e,!0),m(this,F,H).call(this)}get selectedModel(){return u(i(this,Pe))}set selectedModel(e){h(i(this,Pe),e,!0),m(this,F,H).call(this)}init(e){const t={...B,...e??{}};h(i(this,Me),t.yamlEditor,!0),h(i(this,Re),t.linksCollapsed,!0),h(i(this,Ne),t.selectedFileId,!0),h(i(this,De),t.colorMode,!0),h(i(this,Ce),t.showArchive,!0),h(i(this,Oe),t.showTrash,!0),h(i(this,Le),t.activeSection,!0),h(i(this,ke),t.wordWrap,!0),h(i(this,Fe),t.entriesExpanded,!0),h(i(this,Pe),t.selectedModel,!0)}enableAutoSave(e){g(this,ue,e),m(this,F,H).call(this)}disableAutoSave(){g(this,ue,void 0)}snapshot(){return{yamlEditor:u(i(this,Me)),linksCollapsed:u(i(this,Re)),selectedFileId:u(i(this,Ne)),colorMode:u(i(this,De)),showArchive:u(i(this,Ce)),showTrash:u(i(this,Oe)),activeSection:u(i(this,Le)),wordWrap:u(i(this,ke)),entriesExpanded:u(i(this,Fe)),selectedModel:u(i(this,Pe))}}}ue=new WeakMap,Ze=new WeakMap,Me=new WeakMap,Re=new WeakMap,Ne=new WeakMap,De=new WeakMap,Ce=new WeakMap,Oe=new WeakMap,Le=new WeakMap,ke=new WeakMap,Fe=new WeakMap,Pe=new WeakMap,F=new WeakSet,H=function(){!i(this,ue)||i(this,Ze)||(g(this,Ze,!0),queueMicrotask(()=>{var e;g(this,Ze,!1),i(this,ue)&&((e=i(this,ue))==null||e.call(this,this.snapshot()))}))};const lt=new Oa,La={classic:`design:
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
`},ka={english:`locale:
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
`},lc=["classic","engineeringclassic","engineeringresumes","moderncv","sb2nov"],uc=["english","arabic","danish","dutch","french","german","hebrew","hindi","indonesian","italian","japanese","korean","mandarin_chinese","norwegian_bokmål","norwegian_nynorsk","persian","portuguese","russian","spanish","turkish"];function Qi(){if(typeof crypto<"u"&&typeof crypto.randomUUID=="function")return crypto.randomUUID();const n=crypto.getRandomValues(new Uint8Array(16));n[6]=n[6]&15|64,n[8]=n[8]&63|128;const e=Array.from(n,t=>t.toString(16).padStart(2,"0")).join("");return`${e.slice(0,8)}-${e.slice(8,12)}-${e.slice(12,16)}-${e.slice(16,20)}-${e.slice(20)}`}const dt={cv:`cv:
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
`},Fa={cv:`cv:
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
`},Pa={cv:`cv:
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
`},xa={cv:`cv:
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
`},Ga={cv:`cv:
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
`};function si(n){const e=Ha[n.templateId??""];return{cv:n.cv??(e==null?void 0:e.cv)??"",design:n.designs[n.selectedTheme]??La[n.selectedTheme]??`design:
  theme: ${n.selectedTheme}`,locale:n.locales[n.selectedLocale]??ka[n.selectedLocale]??`locale:
  language: ${n.selectedLocale}`,settings:n.settings??(e==null?void 0:e.settings)??""}}const Tr=[{id:"default-classic",name:"CV (Classic)",theme:"classic",sections:dt},{id:"default-engineering-classic",name:"CV (Engineering Classic)",theme:"engineeringclassic",sections:Fa},{id:"default-engineering-resumes",name:"CV (Engineering Resumes)",theme:"engineeringresumes",sections:Pa},{id:"default-moderncv",name:"CV (Moderncv)",theme:"moderncv",sections:xa},{id:"default-sb2nov",name:"CV (Sb2nov)",theme:"sb2nov",sections:Ga}],dc=new Set(Tr.map(n=>n.id)),Ha=Object.fromEntries(Tr.map(n=>[n.id,{cv:n.sections.cv,settings:n.sections.settings}]));function Ua(){const n=Date.now();return Tr.map(e=>mr({id:Qi(),name:e.name,cv:e.sections.cv,settings:e.sections.settings,designs:{[e.theme]:e.sections.design},locales:{english:e.sections.locale},selectedTheme:e.theme,selectedLocale:"english",isLocked:!1,isArchived:!1,isTrashed:!1,isPublic:!1,chatMessages:[],editCount:0,lastEdited:n}))}function mr(n){return Object.defineProperty(n,"isReadOnly",{get(){return this.isLocked||this.isArchived||this.isTrashed},enumerable:!0,configurable:!0}),n}const oi=50;var zt,Vt,Kt,qt,P,W,Xt,Qt,Zt,$t,en,tn,nn,E,U,pr,yn,An,Zi;class Ja{constructor(){c(this,E);c(this,zt,v(x([])));c(this,Vt,v());c(this,Kt,v(0));c(this,qt,v(!0));_(this,"persistence");c(this,P,[]);c(this,W,[]);c(this,Xt);c(this,Qt,I(()=>this.files.find(e=>e.id===this.selectedFileId)));c(this,Zt,I(()=>{var e;return(e=this.selectedFile)==null?void 0:e.isReadOnly}));c(this,$t,I(()=>this.selectedFile?si(this.selectedFile):{cv:"",design:"",locale:"",settings:""}));c(this,en,I(()=>this.files.filter(e=>!e.isTrashed&&!e.isArchived).sort((e,t)=>t.lastEdited-e.lastEdited)));c(this,tn,I(()=>this.files.filter(e=>e.isArchived&&!e.isTrashed).sort((e,t)=>t.lastEdited-e.lastEdited)));c(this,nn,I(()=>this.files.filter(e=>e.isTrashed).sort((e,t)=>t.lastEdited-e.lastEdited)))}get files(){return u(i(this,zt))}set files(e){h(i(this,zt),e,!0)}get generation(){return u(i(this,Kt))}set generation(e){h(i(this,Kt),e,!0)}get selectedFileId(){return u(i(this,Vt))}set selectedFileId(e){h(i(this,Vt),e,!0),lt.selectedFileId=e}get loading(){return u(i(this,qt))}set loading(e){h(i(this,qt),e,!0)}get selectedFile(){return u(i(this,Qt))}set selectedFile(e){h(i(this,Qt),e)}get selectedFileReadOnly(){return u(i(this,Zt))}set selectedFileReadOnly(e){h(i(this,Zt),e)}get sections(){return u(i(this,$t))}set sections(e){h(i(this,$t),e)}get activeFiles(){return u(i(this,en))}set activeFiles(e){h(i(this,en),e)}get archivedFiles(){return u(i(this,tn))}set archivedFiles(e){h(i(this,tn),e)}get trashedFiles(){return u(i(this,nn))}set trashedFiles(e){h(i(this,nn),e)}loadDefaults(){var e;this.persistence=void 0,g(this,P,[]),g(this,W,[]),this.files=Ua(),this.selectedFileId=(e=this.files[0])==null?void 0:e.id,this.generation++}loadFiles(e){var t;g(this,P,[]),g(this,W,[]),this.files=e.map(r=>mr({...r,chatMessages:r.chatMessages??[],editCount:r.editCount??0})),this.selectedFileId=(t=this.activeFiles[0])==null?void 0:t.id,this.generation++}createFile(e,t){var s,o;const r=mr({id:Qi(),name:e??`CV ${this.activeFiles.length+1}`,cv:(t==null?void 0:t.cv)??dt.cv,settings:(t==null?void 0:t.settings)??dt.settings,designs:Object.keys((t==null?void 0:t.designs)??{}).length>0?{...t==null?void 0:t.designs}:{classic:dt.design},locales:Object.keys((t==null?void 0:t.locales)??{}).length>0?{...t==null?void 0:t.locales}:{english:dt.locale},selectedTheme:(t==null?void 0:t.selectedTheme)??"classic",selectedLocale:(t==null?void 0:t.selectedLocale)??"english",isLocked:!1,isArchived:!1,isTrashed:!1,isPublic:!1,chatMessages:[],editCount:0,lastEdited:Date.now()});return this.files=[...this.files,r],this.selectedFileId=r.id,(o=(s=this.persistence)==null?void 0:s.onCreateFile)==null||o.call(s,r),r}selectFile(e){this.selectedFileId=e,this.ensureValidSelection()}setSectionContent(e,t){var s,o,a;if(!this.selectedFile||this.selectedFileReadOnly)return;const r=this.selectedFile;switch(e){case"cv":r.cv=t;break;case"settings":r.settings=t;break;case"design":r.designs[r.selectedTheme]=t;break;case"locale":r.locales[r.selectedLocale]=t;break}((s=this.activeFiles[0])==null?void 0:s.id)!==r.id&&(r.lastEdited=Date.now()),clearTimeout(i(this,Xt)),g(this,Xt,setTimeout(()=>{r.lastEdited=Date.now()},500)),(a=(o=this.persistence)==null?void 0:o.onContentChange)==null||a.call(o,r.id)}setTheme(e,t){m(this,E,U).call(this,e,{selectedTheme:t})}setLocale(e,t){m(this,E,U).call(this,e,{selectedLocale:t})}renameFile(e,t){m(this,E,U).call(this,e,{name:t})}deleteFile(e){var o,a;const t=this.files.find(l=>l.id===e),r=t!=null&&t.isTrashed?this.trashedFiles:t!=null&&t.isArchived?this.archivedFiles:this.activeFiles,s=this.selectedFileId===e?m(this,E,An).call(this,e,r):void 0;m(this,E,Zi).call(this,e),this.files=this.files.filter(l=>l.id!==e),this.selectedFileId===e&&(this.selectedFileId=s),this.ensureValidSelection(),(a=(o=this.persistence)==null?void 0:o.onDeleteFile)==null||a.call(o,e)}trashFile(e){const t=this.selectedFileId===e?m(this,E,An).call(this,e,this.activeFiles):void 0;m(this,E,U).call(this,e,{isTrashed:!0}),this.selectedFileId===e&&(this.selectedFileId=t),this.ensureValidSelection()}restoreFile(e){m(this,E,U).call(this,e,{isTrashed:!1})}archiveFile(e){const t=this.selectedFileId===e?m(this,E,An).call(this,e,this.activeFiles):void 0;m(this,E,U).call(this,e,{isArchived:!0}),this.selectedFileId===e&&(this.selectedFileId=t),this.ensureValidSelection()}restoreFromArchive(e){m(this,E,U).call(this,e,{isArchived:!1})}undo(){for(;i(this,P).length>0;){const e=i(this,P).pop();if(!e||!m(this,E,pr).call(this,e.fileId,e.prev))continue;const t=this.selectedFileId;return this.selectedFileId=m(this,E,yn).call(this,e.selectedFileId)?e.selectedFileId:t,i(this,W).push({...e,redoSelectedFileId:t}),this.ensureValidSelection(),!0}return this.ensureValidSelection(),!1}redo(){for(;i(this,W).length>0;){const e=i(this,W).pop();if(!(!e||!m(this,E,pr).call(this,e.fileId,e.next)))return i(this,P).push({fileId:e.fileId,prev:e.prev,next:e.next,selectedFileId:m(this,E,yn).call(this,e.selectedFileId)?e.selectedFileId:void 0}),this.selectedFileId=m(this,E,yn).call(this,e.redoSelectedFileId)?e.redoSelectedFileId:this.selectedFileId,this.ensureValidSelection(),!0}return this.ensureValidSelection(),!1}lockFile(e){m(this,E,U).call(this,e,{isLocked:!0})}unlockFile(e){m(this,E,U).call(this,e,{isLocked:!1})}makePublic(e){m(this,E,U).call(this,e,{isPublic:!0})}makePrivate(e){m(this,E,U).call(this,e,{isPublic:!1})}duplicateFile(e){const t=this.files.find(l=>l.id===e);if(!t)return;const r=si(t),s=this.activeFiles.map(l=>l.name),o=t.name.replace(/ \d+$/,"");let a=2;for(;s.includes(`${o} ${a}`);)a++;return this.createFile(`${o} ${a}`,{cv:r.cv,settings:r.settings,designs:{...t.designs},locales:{...t.locales},selectedTheme:t.selectedTheme,selectedLocale:t.selectedLocale})}ensureValidSelection(){var r,s,o;const e=this.selectedFile;(e?!e.isTrashed&&!e.isArchived||e.isArchived&&!e.isTrashed&&lt.showArchive||e.isTrashed&&lt.showTrash:!1)||(this.selectedFileId=((r=this.activeFiles[0])==null?void 0:r.id)??(lt.showArchive?(s=this.archivedFiles[0])==null?void 0:s.id:void 0)??(lt.showTrash?(o=this.trashedFiles[0])==null?void 0:o.id:void 0))}}zt=new WeakMap,Vt=new WeakMap,Kt=new WeakMap,qt=new WeakMap,P=new WeakMap,W=new WeakMap,Xt=new WeakMap,Qt=new WeakMap,Zt=new WeakMap,$t=new WeakMap,en=new WeakMap,tn=new WeakMap,nn=new WeakMap,E=new WeakSet,U=function(e,t){var o,a;this.ensureValidSelection();const r=this.files.find(l=>l.id===e);if(!r)return;const s={};for(const l of Object.keys(t))s[l]=r[l];i(this,P).push({fileId:e,prev:s,next:t,selectedFileId:this.selectedFileId}),i(this,P).length>oi&&i(this,P).splice(0,i(this,P).length-oi),g(this,W,[]),Object.assign(r,t),(a=(o=this.persistence)==null?void 0:o.onUpdateMeta)==null||a.call(o,e,t)},pr=function(e,t){var s,o;const r=this.files.find(a=>a.id===e);return r?(Object.assign(r,t),(o=(s=this.persistence)==null?void 0:s.onUpdateMeta)==null||o.call(s,e,t),!0):!1},yn=function(e){return e?this.files.some(t=>t.id===e):!1},An=function(e,t){var s,o;const r=t.findIndex(a=>a.id===e);if(r!==-1)return((s=t[r+1])==null?void 0:s.id)??((o=t[r-1])==null?void 0:o.id)},Zi=function(e){g(this,P,i(this,P).filter(t=>t.fileId!==e).map(t=>({...t,selectedFileId:t.selectedFileId===e?void 0:t.selectedFileId}))),g(this,W,i(this,W).filter(t=>t.fileId!==e).map(t=>({...t,selectedFileId:t.selectedFileId===e?void 0:t.selectedFileId,redoSelectedFileId:t.redoSelectedFileId===e?void 0:t.redoSelectedFileId})))};const hc=new Ja;export{ec as $,xs as A,Ma as B,on as C,ic as D,yi as E,oc as F,dn as G,tc as H,pi as I,cn as J,er as K,qr as L,Zr as M,Xr as N,Ao as O,No as P,mt as Q,Mo as R,yr as S,ac as T,ne as U,gr as V,br as W,Kr as X,Qr as Y,ti as Z,_r as _,ln as a,oo as a0,qa as a1,$r as a2,ei as a3,$a as a4,Ar as a5,Qn as a6,ws as a7,ks as a8,As as a9,lc as aa,uc as ab,Xi as ac,La as ad,_i as b,fi as c,_o as d,nc as e,hc as f,Za as g,w as h,ie as i,Qa as j,Xa as k,gi as l,eo as m,G as n,an as o,sc as p,cc as q,rc as r,Xs as s,lt as t,dc as u,Qi as v,Y as w,si as x,to as y,ci as z};
