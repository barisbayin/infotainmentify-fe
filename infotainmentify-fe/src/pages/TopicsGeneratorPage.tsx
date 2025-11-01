// import { useEffect, useMemo, useRef, useState } from "react";
// import {
//   Page,
//   Toolbar,
//   Card,
//   CardHeader,
//   CardBody,
//   CardFooter,
//   Table,
//   THead,
//   TR,
//   TH,
//   TD,
//   Button,
//   Badge,
//   Field,
//   Input,
//   Textarea,
// } from "../components/ui-kit";
// import { promptsApi, type Prompt } from "../api";
// import { topicsApi, type Topic } from "../api";
// import toast from "react-hot-toast";
// import { useNavigate } from "react-router-dom";

// type GenParams = {
//   count: number; // kaç topic üretilecek
//   language?: string | null; // "en","tr"...
//   category?: string | null; // opsiyonel üst kategori
//   tone?: string | null; // metin tonu
//   needsFootage?: boolean; // görüntü ihtiyacı
//   factCheck?: boolean; // fact-check işareti
//   tagsJson?: string | null; // JSON string (["cats","science"])
//   seedNotes?: string | null; // yaratıcı yönlendirme notları (LLM'e gider)
//   ownerUserId?: number | null; // user-bazlı sahiplik
// };

// const DEFAULT_PARAMS: GenParams = {
//   count: 10,
//   language: "en",
//   category: "",
//   tone: "",
//   needsFootage: false,
//   factCheck: true,
//   tagsJson: "",
//   seedNotes: "",
//   ownerUserId: null,
// };

// export default function TopicsGeneratorPage() {
//   // Prompt listesi
//   const [q, setQ] = useState("");
//   const [prompts, setPrompts] = useState<Prompt[]>([]);
//   const [loading, setLoading] = useState(false);
//   const debouncedQ = useDebouncedValue(q, 300);

//   // Seçili prompt + form
//   const [selected, setSelected] = useState<Prompt | null>(null);
//   const [params, setParams] = useState<GenParams>(DEFAULT_PARAMS);
//   const [running, setRunning] = useState(false);
//   const [preview, setPreview] = useState<string>(""); // örnek konu başlıkları (optional)
//   const navigate = useNavigate();

//   async function loadPrompts() {
//     setLoading(true);
//     try {
//       // aktif prompt’lar ya da q’ya göre
//       const list = await promptsApi.list(debouncedQ);
//       setPrompts(list);
//     } catch (e) {
//       console.error(e);
//       toast.error("Prompts yüklenemedi");
//     } finally {
//       setLoading(false);
//     }
//   }
//   useEffect(() => {
//     loadPrompts(); /* eslint-disable-next-line */
//   }, [debouncedQ]);

//   // Generate
//   async function onGenerate() {
//     if (!selected) {
//       toast.error("Prompt seçmelisin");
//       return;
//     }
//     if (!params.count || params.count < 1) {
//       toast.error("Count 1 veya üzeri olmalı");
//       return;
//     }

//     setRunning(true);
//     try {
//       // --- V1: mevcut endpoint'i kullan (query-string promptId) ---
//       const res = await toast.promise(
//         promptsApi.generateFromPrompt(selected.id),
//         {
//           loading: "Generating topics…",
//           success: "Generation started",
//           error: "Generation failed",
//         }
//       );

//       // Eğer backend createdTopicIds döndürüyorsa onları kullanıp Topics sayfasına geçelim
//       if (res?.createdTopicIds && res.createdTopicIds.length) {
//         // küçük bir “highlight” akışı: querystring ile gönder
//         const ids = res.createdTopicIds.join(",");
//         navigate(`/topics?highlight=${encodeURIComponent(ids)}`, {
//           replace: true,
//         });
//         return;
//       }

//       // Job id döndüyse user’a bilgi ver; Topics sayfasına geçip elle refresh de yapabilir
//       if (res?.jobId) {
//         toast.success(`Job #${res.jobId} queued`);
//         navigate(`/topics`, { replace: true });
//         return;
//       }

//       // Hiçbiri yoksa yine de listeye götürelim
//       navigate(`/topics`, { replace: true });
//     } catch (e) {
//       console.error(e);
//     } finally {
//       setRunning(false);
//     }
//   }

//   // (Opsiyonel) JSON format helper
//   function formatTagsJson() {
//     const raw = params.tagsJson || "";
//     if (!raw.trim()) return;
//     try {
//       const obj = JSON.parse(raw);
//       setParams((p) => ({ ...p, tagsJson: JSON.stringify(obj, null, 2) }));
//       toast.success("tagsJson formatted");
//     } catch {
//       toast.error("tagsJson parse error");
//     }
//   }

//   return (
//     <Page>
//       <div className="grid grid-cols-12 gap-4 h-full">
//         {/* LEFT: Prompt List */}
//         <section className="col-span-12 lg:col-span-6 flex flex-col min-h-0">
//           <Toolbar>
//             <Input
//               placeholder="Search prompts…"
//               value={q}
//               onChange={(e) => setQ(e.target.value)}
//             />
//             <Button onClick={loadPrompts} disabled={loading}>
//               {loading ? "Refreshing…" : "Refresh"}
//             </Button>
//           </Toolbar>

//           <Card className="mt-3 flex-1 min-h-0 overflow-auto">
//             <Table>
//               <THead>
//                 <TR>
//                   <TH>ID</TH>
//                   <TH>Name</TH>
//                   <TH>Category</TH>
//                   <TH>Lang</TH>
//                   <TH>Active</TH>
//                   <TH className="text-right pr-3">Select</TH>
//                 </TR>
//               </THead>
//               <tbody>
//                 {prompts.map((p) => {
//                   const active = !!p.isActive;
//                   const isSel = selected?.id === p.id;
//                   return (
//                     <TR
//                       key={p.id}
//                       className={[
//                         "border-b border-neutral-100",
//                         isSel ? "bg-neutral-100" : "hover:bg-neutral-50",
//                         !active ? "opacity-75" : "",
//                       ].join(" ")}
//                     >
//                       <TD>#{p.id}</TD>
//                       <TD className="font-medium">{p.name}</TD>
//                       <TD>{p.category ?? "—"}</TD>
//                       <TD>{p.language ?? "—"}</TD>
//                       <TD>
//                         <Badge tone={active ? "success" : "danger"}>
//                           {active ? "Active" : "Passive"}
//                         </Badge>
//                       </TD>
//                       <TD className="text-right">
//                         <Button
//                           size="sm"
//                           variant={isSel ? "primary" : "ghost"}
//                           onClick={() => setSelected(p)}
//                         >
//                           {isSel ? "Selected" : "Select"}
//                         </Button>
//                       </TD>
//                     </TR>
//                   );
//                 })}
//               </tbody>
//             </Table>
//           </Card>
//         </section>

//         {/* RIGHT: Generator Form */}
//         <section className="col-span-12 lg:col-span-6 flex flex-col min-h-0">
//           <Card className="flex-1 min-h-0 flex flex-col">
//             <CardHeader>
//               <div className="text-lg font-semibold text-neutral-800">
//                 Topic Generator
//               </div>
//               <div className="text-xs text-neutral-500">
//                 Seçili prompt:{" "}
//                 {selected ? (
//                   <b>
//                     #{selected.id} • {selected.name}
//                   </b>
//                 ) : (
//                   "—"
//                 )}
//               </div>
//             </CardHeader>

//             <CardBody className="space-y-3 overflow-auto">
//               <div className="grid grid-cols-2 gap-3">
//                 <Field label="Count *">
//                   <Input
//                     type="number"
//                     min={1}
//                     value={params.count}
//                     onChange={(e) =>
//                       setParams((p) => ({
//                         ...p,
//                         count: Math.max(1, Number(e.target.value || 0)),
//                       }))
//                     }
//                   />
//                 </Field>

//                 <Field label="Language">
//                   <Input
//                     placeholder="en / tr …"
//                     value={params.language ?? ""}
//                     onChange={(e) =>
//                       setParams((p) => ({ ...p, language: e.target.value }))
//                     }
//                   />
//                 </Field>
//               </div>

//               <div className="grid grid-cols-2 gap-3">
//                 <Field label="Category">
//                   <Input
//                     value={params.category ?? ""}
//                     onChange={(e) =>
//                       setParams((p) => ({ ...p, category: e.target.value }))
//                     }
//                   />
//                 </Field>
//                 <Field label="Tone">
//                   <Input
//                     placeholder="educational, witty, dramatic…"
//                     value={params.tone ?? ""}
//                     onChange={(e) =>
//                       setParams((p) => ({ ...p, tone: e.target.value }))
//                     }
//                   />
//                 </Field>
//               </div>

//               <div className="grid grid-cols-2 gap-3">
//                 <label className="inline-flex items-center gap-2 select-none">
//                   <input
//                     type="checkbox"
//                     className="h-4 w-4 rounded border-neutral-300"
//                     checked={!!params.needsFootage}
//                     onChange={(e) =>
//                       setParams((p) => ({
//                         ...p,
//                         needsFootage: e.target.checked,
//                       }))
//                     }
//                   />
//                   <span className="text-sm text-neutral-700">
//                     Needs Footage
//                   </span>
//                 </label>

//                 <label className="inline-flex items-center gap-2 select-none">
//                   <input
//                     type="checkbox"
//                     className="h-4 w-4 rounded border-neutral-300"
//                     checked={!!params.factCheck}
//                     onChange={(e) =>
//                       setParams((p) => ({ ...p, factCheck: e.target.checked }))
//                     }
//                   />
//                   <span className="text-sm text-neutral-700">Fact Check</span>
//                 </label>
//               </div>

//               <Field
//                 label={
//                   <div className="flex items-center justify-between">
//                     <span>tagsJson (JSON)</span>
//                     <Button size="xs" variant="ghost" onClick={formatTagsJson}>
//                       Format JSON
//                     </Button>
//                   </div>
//                 }
//               >
//                 <Textarea
//                   rows={5}
//                   placeholder='e.g. ["cats","history","weird"]'
//                   value={params.tagsJson ?? ""}
//                   onChange={(e) =>
//                     setParams((p) => ({ ...p, tagsJson: e.target.value }))
//                   }
//                 />
//               </Field>

//               <Field label="Seed Notes (LLM yönlendirme)">
//                 <Textarea
//                   rows={4}
//                   placeholder="Örn: clickbaity ama doğrulanabilir gerçekler, her başlığa 1 cümle özet…"
//                   value={params.seedNotes ?? ""}
//                   onChange={(e) =>
//                     setParams((p) => ({ ...p, seedNotes: e.target.value }))
//                   }
//                 />
//               </Field>

//               {/* Kullanıcı bazlı sahiplik (opsiyonel) */}
//               <Field label="Owner User Id (optional)">
//                 <Input
//                   placeholder="Örn: 101"
//                   value={params.ownerUserId ?? ""}
//                   onChange={(e) =>
//                     setParams((p) => ({
//                       ...p,
//                       ownerUserId: e.target.value
//                         ? Number(e.target.value)
//                         : null,
//                     }))
//                   }
//                 />
//               </Field>

//               {/* (opsiyonel) önizleme alanı */}
//               <Field label="Preview (optional)">
//                 <Textarea
//                   rows={6}
//                   placeholder="Generate öncesi örnek başlıklar / notlar…"
//                   value={preview}
//                   onChange={(e) => setPreview(e.target.value)}
//                 />
//               </Field>
//             </CardBody>

//             <CardFooter className="flex justify-end gap-2">
//               <Button variant="ghost" onClick={() => setParams(DEFAULT_PARAMS)}>
//                 Reset
//               </Button>
//               <Button
//                 variant="primary"
//                 onClick={onGenerate}
//                 disabled={!selected || running}
//               >
//                 {running ? "Generating…" : "Generate"}
//               </Button>
//             </CardFooter>
//           </Card>
//         </section>
//       </div>
//     </Page>
//   );
// }

// function useDebouncedValue<T>(value: T, delay = 300) {
//   const [debounced, setDebounced] = useState(value);
//   const t = useRef<number | null>(null);
//   useEffect(() => {
//     if (t.current) window.clearTimeout(t.current);
//     t.current = window.setTimeout(() => setDebounced(value), delay);
//     return () => {
//       if (t.current) window.clearTimeout(t.current);
//     };
//   }, [value, delay]);
//   return debounced;
// }
