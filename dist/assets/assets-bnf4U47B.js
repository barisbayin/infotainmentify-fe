import{m as s,h as a}from"./index-BDG7les7.js";/**
 * @license lucide-react v0.548.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c=[["path",{d:"M9 18V5l12-2v13",key:"1jmyc2"}],["circle",{cx:"6",cy:"18",r:"3",key:"fqmcym"}],["circle",{cx:"18",cy:"16",r:"3",key:"1hluhg"}]],d=s("music",c);/**
 * @license lucide-react v0.548.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const o=[["path",{d:"M14 13V8.5C14 7 15 7 15 5a3 3 0 0 0-6 0c0 2 1 2 1 3.5V13",key:"i9gjdv"}],["path",{d:"M20 15.5a2.5 2.5 0 0 0-2.5-2.5h-11A2.5 2.5 0 0 0 4 15.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1z",key:"1vzg3v"}],["path",{d:"M5 22h14",key:"ehvnwv"}]],i=s("stamp",o),n={list(e){return a(`/api/assets/${e}`)},upload(e){const t=new FormData;return t.append("File",e.file),t.append("Type",e.type),a("/api/assets/upload",{method:"POST",body:t})},delete(e){return a(`/api/assets/${e}`,{method:"DELETE"})}};export{d as M,i as S,n as a};
