import{c as n,a as c}from"./index-DJSZai82.js";import{b as o,j as t,e as m,C as x,f,T as h,g as k,O as y}from"./vendor-radix-DCmNHa0D.js";/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const D=n("ExternalLink",[["path",{d:"M15 3h6v6",key:"1q9fwt"}],["path",{d:"M10 14 21 3",key:"gplh6r"}],["path",{d:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",key:"a6xqqp"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const E=n("Linkedin",[["path",{d:"M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z",key:"c2jq9f"}],["rect",{width:"4",height:"12",x:"2",y:"9",key:"mk3on5"}],["circle",{cx:"4",cy:"4",r:"2",key:"bt5ra8"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L=n("LockOpen",[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 9.9-1",key:"1mm8w8"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z=n("Sparkles",[["path",{d:"M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z",key:"4pj2yx"}],["path",{d:"M20 3v4",key:"1olli1"}],["path",{d:"M22 5h-4",key:"1gvqau"}],["path",{d:"M4 17v2",key:"vumght"}],["path",{d:"M5 18H3",key:"zchphs"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const T=n("Ticket",[["path",{d:"M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z",key:"qn84l0"}],["path",{d:"M13 5v2",key:"dyzc3o"}],["path",{d:"M13 17v2",key:"1ont0d"}],["path",{d:"M13 11v2",key:"1wjjxi"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v=n("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]),p=o.createContext({isComposing:()=>!1,setComposing:()=>{},justEndedComposing:()=>!1,markCompositionEnd:()=>{}}),C=()=>o.useContext(p);function R({...a}){const e=o.useRef(!1),i=o.useRef(!1),s=o.useRef(null),d=o.useMemo(()=>({isComposing:()=>e.current,setComposing:l=>{e.current=l},justEndedComposing:()=>i.current,markCompositionEnd:()=>{i.current=!0,s.current&&clearTimeout(s.current),s.current=setTimeout(()=>{i.current=!1},150)}}),[]);return t.jsx(p.Provider,{"data-loc":"client/src/components/ui/dialog.tsx:50",value:d,children:t.jsx(m,{"data-loc":"client/src/components/ui/dialog.tsx:51","data-slot":"dialog",...a})})}function j({...a}){return t.jsx(k,{"data-loc":"client/src/components/ui/dialog.tsx:65","data-slot":"dialog-portal",...a})}function u({className:a,...e}){return t.jsx(y,{"data-loc":"client/src/components/ui/dialog.tsx:79","data-slot":"dialog-overlay",className:c("data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",a),...e})}u.displayName="DialogOverlay";function N({className:a,children:e,showCloseButton:i=!0,onEscapeKeyDown:s,...d}){const{isComposing:l}=C(),g=o.useCallback(r=>{if(r.isComposing||l()){r.preventDefault();return}s?.(r)},[l,s]);return t.jsxs(j,{"data-loc":"client/src/components/ui/dialog.tsx:122","data-slot":"dialog-portal",children:[t.jsx(u,{"data-loc":"client/src/components/ui/dialog.tsx:123"}),t.jsxs(x,{"data-loc":"client/src/components/ui/dialog.tsx:124","data-slot":"dialog-content",className:c("bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",a),onEscapeKeyDown:g,...d,children:[e,i&&t.jsxs(f,{"data-loc":"client/src/components/ui/dialog.tsx:135","data-slot":"dialog-close",className:"ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",children:[t.jsx(v,{"data-loc":"client/src/components/ui/dialog.tsx:139"}),t.jsx("span",{"data-loc":"client/src/components/ui/dialog.tsx:140",className:"sr-only",children:"Close"})]})]})]})}function q({className:a,...e}){return t.jsx("div",{"data-loc":"client/src/components/ui/dialog.tsx:150","data-slot":"dialog-header",className:c("flex flex-col gap-2 text-center sm:text-left",a),...e})}function O({className:a,...e}){return t.jsx(h,{"data-loc":"client/src/components/ui/dialog.tsx:176","data-slot":"dialog-title",className:c("text-lg leading-none font-semibold",a),...e})}export{R as D,D as E,L,z as S,T,E as a,N as b,q as c,O as d};
