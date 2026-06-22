// import { useEffect, useState } from "react";
// import {
//   Page,
//   Card,
//   CardHeader,
//   CardBody,
//   CardFooter,
//   Toolbar,
//   Table,
//   THead,
//   TR,
//   TH,
//   TD,
//   Field,
//   Input,
//   Button,
// } from "../components/ui-kit";
// import SelectBox from "../components/SelectBox";
// import Switch from "../components/Switch";
// import {
//   jobsApi,
//   type JobSettingListDto,
//   type JobSettingDetailDto,
// } from "../api/jobs";
// import toast from "react-hot-toast";
// import { useConfirm } from "../components/confirm";
// import { http } from "../api/http";
// import { Check, X, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
// import type { JSX } from "react";
// import { getSignalRConnection } from "../lib/signalr"; // ✅ eklendi

// /* ---------------------------------------
//    🔧 Enum ve UI tanımları
// ----------------------------------------*/

// // Job türleri
// const JOB_TYPES = [
//   { value: "TopicGeneration", label: "Topic Üretimi" },
//   { value: "ScriptGeneration", label: "Script Üretimi" },
//   { value: "AutoVideoGeneration", label: "Otomatik Video Üretimi" }, // ✅ yeni
// ];

// // JobType -> ProfileType eşleme
// const PROFILE_TYPE_MAP: Record<string, string> = {
//   TopicGeneration: "TopicGenerationProfile",
//   ScriptGeneration: "ScriptGenerationProfile",
//   AutoVideoGeneration: "VideoGenerationProfile", // ✅ eklendi
//   YouTubeUpload: "YouTubeUploadProfile",
//   ThumbnailRender: "ThumbnailRenderProfile",
// };

// // Durum stilleri
// const STATUS_STYLES: Record<
//   string,
//   { color: string; icon?: JSX.Element; label?: string }
// > = {
//   Pending: {
//     color: "text-gray-500",
//     icon: <Clock size={16} />,
//     label: "Bekliyor",
//   },
//   Running: {
//     color: "text-blue-500",
//     icon: <Loader2 className="animate-spin" size={16} />,
//     label: "Çalışıyor",
//   },
//   Success: {
//     color: "text-green-600",
//     icon: <CheckCircle size={16} />,
//     label: "Başarılı",
//   },
//   Failed: {
//     color: "text-red-500",
//     icon: <XCircle size={16} />,
//     label: "Hata",
//   },
// };

// /* ---------------------------------------
//    🧠 Ana Component
// ----------------------------------------*/
// export default function JobSettingsPage() {
//   const [items, setItems] = useState<JobSettingListDto[]>([]);
//   const [selectedId, setSelectedId] = useState<number | null>(null);
//   const [form, setForm] = useState<Partial<JobSettingDetailDto>>({});
//   const [profileOptions, setProfileOptions] = useState<
//     { value: string; label: string }[]
//   >([]);
//   const [loading, setLoading] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const confirm = useConfirm();

//   /* ---------------------------------------
//      📦 Job listesi
//   ----------------------------------------*/
//   async function load() {
//     setLoading(true);
//     try {
//       const data = await jobsApi.listSettings();
//       setItems(data);
//     } catch {
//       toast.error("Job listesi yüklenemedi");
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     load();
//     const intv = setInterval(load, 10_000); // 🔄 her 10sn’de bir yenile
//     return () => clearInterval(intv);
//   }, []);

//   /* ✅ SignalR jobCompleted event handler */
//   useEffect(() => {
//     const conn = getSignalRConnection();
//     if (!conn) return;

//     const onJobCompleted = (data: any) => {
//       toast.dismiss(`job-${data.jobId}`);

//       if (data.success) {
//         toast.success(
//           `✅ Job #${data.jobId} tamamlandı: ${data.message || "Başarılı"}`
//         );
//       } else {
//         toast.error(
//           `❌ Job #${data.jobId} hata verdi: ${data.message || "Hata oluştu"}`
//         );
//       }

//       // Job listesi otomatik yenilensin
//       load();
//     };

//     conn.on("jobCompleted", onJobCompleted);

//     return () => {
//       conn.off("jobCompleted", onJobCompleted);
//     };
//   }, []); // sadece mount/unmount’ta eklensin

//   /* ---------------------------------------
//      ⚙️ Profil listesi
//   ----------------------------------------*/
//   async function loadProfiles(profileType: string) {
//     if (!profileType) {
//       setProfileOptions([]);
//       return;
//     }

//     const cleanedType = profileType.split(",")[0].split(".").pop()!;

//     const endpointMap: Record<string, string> = {
//       TopicGenerationProfile: "topicgenerationprofiles",
//       ScriptGenerationProfile: "scriptgenerationprofiles",
//       VideoGenerationProfile: "videogenerationprofiles", // ✅ eklendi
//       YouTubeUploadProfile: "youtubeuploadprofiles",
//       ThumbnailRenderProfile: "thumbnailrenderprofiles",
//     };

//     const apiPath = endpointMap[cleanedType];
//     if (!apiPath) {
//       toast.error(`Desteklenmeyen profil tipi: ${cleanedType}`);
//       return;
//     }

//     try {
//       const list = await http<any[]>(`/api/${apiPath}`);
//       const opts = list.map((x) => ({
//         value: String(x.id),
//         label:
//           x.profileName?.trim() ||
//           x.name?.trim() ||
//           x.title?.trim() ||
//           `(Profil #${x.id})`,
//       }));
//       setProfileOptions(opts);
//     } catch {
//       toast.error("Profil listesi yüklenemedi");
//       setProfileOptions([]);
//     }
//   }

//   /* ---------------------------------------
//      📄 Satır seçimi
//   ----------------------------------------*/
//   async function onRowClick(item: JobSettingListDto) {
//     setSelectedId(item.id);
//     try {
//       const dto = await jobsApi.getSetting(item.id);
//       setForm(dto);
//       await loadProfiles(dto.profileType);
//     } catch {
//       toast.error("Job detayı yüklenemedi");
//     }
//   }

//   function resetForm() {
//     setSelectedId(null);
//     setForm({});
//     setProfileOptions([]);
//   }

//   /* ---------------------------------------
//      💾 Kaydet
//   ----------------------------------------*/
//   async function onSave() {
//     if (!form.name?.trim()) return toast.error("Job adı zorunludur");
//     if (!form.jobType) return toast.error("Job tipi seçilmelidir");
//     if (!form.profileId) return toast.error("Bir profil seçilmelidir");

//     setSaving(true);
//     try {
//       const id = await jobsApi.upsertSetting(form as JobSettingDetailDto);
//       toast.success(`Job #${id} kaydedildi`);
//       await load();
//       setSelectedId(id);
//     } catch {
//       toast.error("Kayıt başarısız");
//     } finally {
//       setSaving(false);
//     }
//   }

//   /* ---------------------------------------
//      🗑️ Sil
//   ----------------------------------------*/
//   async function onDelete() {
//     if (!selectedId) return;
//     const ok = await confirm({
//       title: "Silinsin mi?",
//       message: `#${selectedId} job kalıcı olarak silinecek.`,
//       tone: "danger",
//     });
//     if (!ok) return;

//     try {
//       await jobsApi.deleteSetting(selectedId);
//       toast.success("Silindi");
//       resetForm();
//       await load();
//     } catch {
//       toast.error("Silme başarısız");
//     }
//   }

//   /* ---------------------------------------
//      🚀 Manuel Tetikleme
//   ----------------------------------------*/
//   async function onTrigger() {
//     if (!selectedId) return;
//     try {
//       await toast.promise(jobsApi.triggerJob(selectedId), {
//         loading: "Job tetikleniyor…",
//         success: "Job çalıştırıldı",
//         error: "Job tetiklenemedi",
//       });
//       await load();
//     } catch {
//       toast.error("Job başlatılamadı");
//     }
//   }

//   /* ---------------------------------------
//      🧭 JobType değiştiğinde otomatik ProfileType ata
//   ----------------------------------------*/
//   async function onJobTypeChange(jobType: string) {
//     const newProfileType = PROFILE_TYPE_MAP[jobType] || "";
//     setForm((f) => ({
//       ...f,
//       jobType,
//       profileType: newProfileType,
//       profileId: undefined,
//     }));
//     if (newProfileType) await loadProfiles(newProfileType);
//   }

//   /* ---------------------------------------
//      🖥️ Render
//   ----------------------------------------*/
//   return (
//     <Page>
//       <div className="grid grid-cols-12 gap-4 h-full">
//         {/* SOL: Liste */}
//         <section className="col-span-12 xl:col-span-8 flex flex-col min-h-0">
//           <Toolbar>
//             <Button onClick={load} disabled={loading}>
//               {loading ? "Yükleniyor…" : "Yenile"}
//             </Button>
//             <Button variant="primary" onClick={resetForm}>
//               Yeni
//             </Button>
//           </Toolbar>

//           <Card className="mt-3 flex-1 min-h-0 overflow-auto">
//             <Table>
//               <THead>
//                 <TR>
//                   <TH>ID</TH>
//                   <TH>Ad</TH>
//                   <TH>Durum</TH>
//                   <TH>AutoRun</TH>
//                   <TH>Periyot</TH>
//                   <TH>Son Çalışma</TH>
//                   <TH>Son Hata</TH>
//                 </TR>
//               </THead>
//               <tbody>
//                 {items.map((x) => (
//                   <TR
//                     key={x.id}
//                     onClick={() => onRowClick(x)}
//                     className={[
//                       "cursor-pointer border-b hover:bg-neutral-50 transition-colors",
//                       selectedId === x.id ? "bg-neutral-100" : "",
//                       x.status === "Running" ? "bg-blue-50 animate-pulse" : "",
//                     ].join(" ")}
//                   >
//                     <TD>#{x.id}</TD>
//                     <TD>{x.name}</TD>
//                     <TD>
//                       <div
//                         className={`flex items-center gap-1 ${
//                           STATUS_STYLES[x.status]?.color
//                         }`}
//                       >
//                         {STATUS_STYLES[x.status]?.icon}
//                         <span>
//                           {STATUS_STYLES[x.status]?.label ?? x.status}
//                         </span>
//                       </div>
//                     </TD>
//                     <TD className="text-center">
//                       {x.isAutoRunEnabled ? (
//                         <Check
//                           className="text-green-600 inline-block"
//                           size={18}
//                         />
//                       ) : (
//                         <X className="text-red-500 inline-block" size={18} />
//                       )}
//                     </TD>
//                     <TD>{x.periodHours ?? "-"}</TD>
//                     <TD className="text-xs text-gray-600">
//                       {x.lastRunAt
//                         ? new Date(x.lastRunAt).toLocaleString()
//                         : "—"}
//                     </TD>
//                     <TD className="text-xs text-red-500 max-w-[180px] truncate">
//                       {x.lastErrorAt
//                         ? new Date(x.lastErrorAt).toLocaleTimeString()
//                         : ""}
//                       {x.lastError ? ` - ${x.lastError}` : ""}
//                     </TD>
//                   </TR>
//                 ))}
//               </tbody>
//             </Table>
//           </Card>
//         </section>

//         {/* SAĞ: Detay */}
//         <section className="col-span-12 xl:col-span-4 flex flex-col min-h-0">
//           <Card className="flex-1 flex flex-col">
//             <CardHeader>
//               <div className="text-lg font-semibold">
//                 {selectedId ? `Düzenle #${selectedId}` : "Yeni Job"}
//               </div>
//             </CardHeader>

//             <CardBody className="flex flex-col gap-4 overflow-auto">
//               <Field label="Ad">
//                 <Input
//                   value={form.name || ""}
//                   onChange={(e) => setForm({ ...form, name: e.target.value })}
//                 />
//               </Field>

//               <Field label="Job Tipi">
//                 <SelectBox
//                   value={form.jobType || ""}
//                   onChange={onJobTypeChange}
//                   options={JOB_TYPES}
//                 />
//               </Field>

//               <Field label="Profil">
//                 <SelectBox
//                   value={form.profileId ? String(form.profileId) : ""}
//                   onChange={(v) => setForm({ ...form, profileId: Number(v) })}
//                   options={profileOptions}
//                 />
//               </Field>

//               <Field label="Periyot (saat)">
//                 <Input
//                   type="number"
//                   value={form.periodHours ?? ""}
//                   onChange={(e) =>
//                     setForm({ ...form, periodHours: Number(e.target.value) })
//                   }
//                 />
//               </Field>

//               <Field label="Otomatik Çalışma">
//                 <Switch
//                   checked={!!form.isAutoRunEnabled}
//                   onChange={(v) => setForm({ ...form, isAutoRunEnabled: v })}
//                 />
//               </Field>

//               <Field label="Durum">
//                 <Input value={form.status || "Pending"} disabled />
//               </Field>

//               {form.lastError && (
//                 <Field label="Son Hata">
//                   <Input value={form.lastError} disabled />
//                 </Field>
//               )}
//             </CardBody>

//             <CardFooter className="flex justify-end gap-2">
//               <Button onClick={resetForm}>Yeni</Button>
//               <Button
//                 variant="danger"
//                 onClick={onDelete}
//                 disabled={!selectedId}
//               >
//                 Sil
//               </Button>
//               <Button
//                 variant="primary"
//                 onClick={onTrigger}
//                 disabled={!selectedId}
//               >
//                 Tetikle
//               </Button>
//               <Button variant="primary" onClick={onSave} disabled={saving}>
//                 Kaydet
//               </Button>
//             </CardFooter>
//           </Card>
//         </section>
//       </div>
//     </Page>
//   );
// }
