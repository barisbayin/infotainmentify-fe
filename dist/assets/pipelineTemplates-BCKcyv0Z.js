import{m as a,h as t}from"./index-BDG7les7.js";/**
 * @license lucide-react v0.548.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const r=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],n=a("circle-check",r),o={list(e,i){const p=new URLSearchParams;return e&&p.set("q",e),i&&p.set("conceptId",i),t(`/api/pipeline-templates?${p.toString()}`)},get(e){return t(`/api/pipeline-templates/${e}`)},health(e){return t(`/api/pipeline-templates/${e}/health`)},create(e){return t("/api/pipeline-templates",{method:"POST",body:JSON.stringify(e)})},update(e,i){return t(`/api/pipeline-templates/${e}`,{method:"PUT",body:JSON.stringify(i)})},updateWorkflowLayout(e,i){return t(`/api/pipeline-templates/${e}/workflow-layout`,{method:"PUT",body:JSON.stringify({workflowLayoutJson:i}),timeoutMs:1e4})},delete(e){return t(`/api/pipeline-templates/${e}`,{method:"DELETE"})}};export{n as C,o as p};
