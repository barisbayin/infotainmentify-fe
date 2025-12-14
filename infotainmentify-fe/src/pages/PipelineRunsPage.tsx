import { useEffect, useState, useRef, useCallback, memo } from "react";
import {
  pipelineRunsApi,
  type PipelineRunListDto,
  type PipelineRunDetailDto,
} from "../api/pipelineRuns";
import {
  pipelineTemplatesApi,
} from "../api/pipelineTemplates";
import toast from "react-hot-toast";
import {
  Page,
  Card,
  Button,
  Label,
  Table,
  THead,
  TR,
  TH,
  TD,
  Modal,
  Select,
  ConfirmModal, 
} from "../components/ui-kit";
import {
  Play,
  RefreshCw,
  Layers,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Activity,
  Copy,
  Calendar,
  Eye, // EKLENDİ
  MinusCircle,
  RefreshCcw,
  Terminal,
} from "lucide-react";
import { conceptsApi } from "../api/concepts";
import { cn } from "../components/ui-kit";
import { TimelineViewer, type SceneLayoutPayload } from "../components/TimelineViewer"; // 🔥 EKLENDİ
import LiveLogViewer from "../components/LiveLogViewer"; // 🔥 LiveLogViewer Eklendi
import VideoPlayer from "../components/VideoPlayer"; // 🔥 VideoPlayer Eklendi



// --- HELPER FUNCTIONS ---

const getStatusColor = (status: string) => {
  switch (status) {
    case "Running":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "Completed":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "Failed":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    case "Pending":
      return "bg-zinc-800 text-zinc-400 border-zinc-700";
    case "Cancelled":
      return "bg-zinc-700 text-zinc-300 border-zinc-600";
    default:
      return "bg-zinc-800 text-zinc-400";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "Running":
      return "İşleniyor";
    case "Completed":
      return "Tamamlandı";
    case "Failed":
      return "Hata Oluştu";
    case "PermanentlyFailed":
      return "Kalıcı Hata";
    case "Pending":
      return "Bekliyor";
    case "Cancelled":
      return "İptal Edildi";
    default:
      return status;
  }
};

const getStageIcon = (status: string) => {
  switch (status) {
    case "Completed":
      return <CheckCircle2 size={18} className="text-emerald-500" />;
    case "Running":
      return <Loader2 size={18} className="text-amber-500 animate-spin" />;
    case "Failed":
    case "PermanentlyFailed":
      return <XCircle size={18} className="text-red-500" />;
    case "Pending":
      return <Clock size={18} className="text-zinc-600" />;
    case "Skipped":
       return <MinusCircle size={18} className="text-zinc-600" />;
    default:
      return (
        <div className="w-4 h-4 rounded-full border-2 border-zinc-700" />
      );
  }
};

// ... HistoryList is fine ...
const HistoryList = memo(({ 
    items, 
    selectedId, 
    onSelect, 
    loading,
}: { 
    items: PipelineRunListDto[], 
    selectedId: number | null, 
    onSelect: (id: number) => void,
    loading: boolean
}) => {
    return (
        <Card className="flex-1 min-h-0 p-0 overflow-hidden flex flex-col border-zinc-800 bg-zinc-900/40">
            <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-700">
                <Table className="border-none w-full">
                    <THead>
                        <TR className="bg-zinc-900/80 sticky top-0 z-10 backdrop-blur-md">
                            <TH className="text-zinc-400 font-medium w-16">ID</TH>
                            <TH className="text-zinc-400 font-medium">Şablon</TH>
                            <TH className="text-zinc-400 font-medium">İçerik Başlığı</TH> {/* 🔥 YENİ KOLON */}
                            <TH className="text-zinc-400 font-medium text-center w-24">Durum</TH>
                            <TH className="text-zinc-400 font-medium text-right w-24">Saat</TH>
                        </TR>
                    </THead>
                    <tbody>
                        {items.map((item) => (
                            <TR
                                key={item.id}
                                onClick={() => onSelect(item.id)}
                                className={cn(
                                    "cursor-pointer transition-all border-b border-zinc-800/50 hover:bg-zinc-800/40 group",
                                    selectedId === item.id
                                        ? "bg-indigo-500/5"
                                        : ""
                                )}
                            >
                                <TD className="font-mono text-zinc-500 text-xs py-3 group-hover:text-zinc-300 transition-colors pl-4">
                                    #{item.id}
                                </TD>
                                <TD className="font-medium text-zinc-200 py-3">
                                    <div className={cn(
                                        "flex items-center gap-3 transition-all duration-300",
                                        selectedId === item.id ? "translate-x-1" : ""
                                    )}>
                                        {/* Active Line Indicator */}
                                         <div className={cn(
                                            "w-1 rounded-full bg-indigo-500 transition-all duration-300",
                                             selectedId === item.id ? "h-4 opacity-100" : "h-0 opacity-0 w-0"
                                         )} />
                                        
                                        <span className="truncate max-w-[150px] lg:max-w-[200px]" title={item.templateName}>
                                            {item.templateName}
                                        </span>
                                    </div>
                                </TD>
                                <TD className="font-medium text-zinc-200 py-3">
                                    <div className="truncate max-w-[150px] lg:max-w-[200px]" title={item.runContextTitle}>
                                        {item.runContextTitle}
                                    </div>
                                </TD>
                                <TD className="text-center py-3">
                                    <span
                                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium border ${getStatusColor(
                                            item.status
                                        )}`}
                                    >
                                        {getStatusLabel(item.status)}
                                    </span>
                                </TD>
                                <TD className="text-right text-zinc-500 text-xs py-3 font-mono whitespace-nowrap">
                                   {item.startedAt ? (
                                       <div className="flex items-center justify-end gap-1">
                                            {new Date(item.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                       </div>
                                   ) : "-"}
                                </TD>
                            </TR>
                        ))}
                        {items.length === 0 && !loading && (
                            <TR>
                                <TD colSpan={4}>
                                    <div className="flex flex-col items-center justify-center py-10 text-zinc-500 w-full select-none">
                                        <div className="p-3 bg-zinc-800/50 rounded-full border border-zinc-800/50 mb-3">
                                            <Clock className="w-6 h-6 opacity-30" />
                                        </div>
                                        <span className="text-sm font-medium">Henüz bir üretim geçmişi yok.</span>
                                    </div>
                                </TD>
                            </TR>
                        )}
                        {loading && items.length === 0 && (
                            <TR>
                                <TD colSpan={4} className="text-center py-12 text-zinc-500">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 opacity-50"/>
                                    Yükleniyor...
                                </TD>
                            </TR>
                        )}
                    </tbody>
                </Table>
            </div>
        </Card>
    );
});

/*
 * 2. RunDetail (Sağ Taraf)
 * Shows the details of the selected run including stages timeline.
 */
const RunDetail = memo(({ detail, loading, onOpenTimeline, onRetryStage }: { detail: PipelineRunDetailDto | null, loading: boolean, onOpenTimeline: (json: string) => void, onRetryStage: (runId: number, stageName: string) => void }) => {
    const [activeTab, setActiveTab] = useState<"timeline" | "logs" | "video">("timeline");
    const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);

    // Detail değiştiğinde (yeni run seçildiğinde) tab'i timeline'a resetle
    useEffect(() => {
        if(detail?.id) setActiveTab("timeline");
    }, [detail?.id]);
    
    if (loading && !detail) {
        return (
            <Card className="h-full flex items-center justify-center border-zinc-800 bg-zinc-900/60 backdrop-blur-xl">
                 <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </Card>
        );
    }

    if (!detail) {
         return (
             <Card className="h-full flex flex-col items-center justify-center text-zinc-600 gap-4 p-8 text-center border-zinc-800 bg-zinc-900/60 backdrop-blur-xl">
                 <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl">
                     <Layers size={40} className="opacity-30 text-indigo-300" />
                 </div>
                 <div>
                    <p className="text-lg font-medium text-zinc-400">Bir işlem seçin</p>
                    <p className="text-sm text-zinc-600 mt-1 max-w-[200px]">Detayları görüntülemek için sol taraftan bir kayıt seçiniz.</p>
                 </div>
             </Card>
         );
    }

    return (
        <Card className="h-full flex flex-col overflow-hidden overflow-x-hidden border-zinc-800 bg-zinc-900/60 backdrop-blur-xl p-0 transition-all duration-300">
            {/* Header */}
            <div className="p-5 border-b border-zinc-800/50 shrink-0 bg-zinc-900/40 flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3 mb-1.5">
                        <span className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            Run <span className="text-zinc-600">#</span>{detail.id}
                        </span>
                        <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border shadow-sm ${getStatusColor(
                                detail.status
                            )}`}
                        >
                            {getStatusLabel(detail.status)}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                         <span className="flex items-center gap-1.5 bg-zinc-900/50 px-2 py-1 rounded border border-zinc-800/50">
                             <Calendar size={12} className="text-zinc-400"/>
                             {detail.startedAt ? new Date(detail.startedAt).toLocaleString() : "Başlamadı"}
                         </span>
                    </div>
                </div>

                {/* Error Box */}
                {detail.errorMessage && (
                    <div className="group relative max-w-[280px] cursor-pointer animate-in fade-in slide-in-from-right-4">
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-red-400 transition-all hover:bg-red-500/10 hover:border-red-500/30">
                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                            <div className="flex flex-col gap-1 overflow-hidden">
                                <span className="text-xs font-bold uppercase tracking-wider text-red-500">
                                    Hata Oluştu
                                </span>
                                <p className="text-[10px] leading-relaxed line-clamp-2 opacity-80 group-hover:opacity-100">
                                    {detail.errorMessage}
                                </p>
                            </div>
                        </div>

                        <div className="absolute top-full right-0 mt-2 w-96 p-4 bg-zinc-950 border border-red-900/50 rounded-xl shadow-2xl z-50 hidden group-hover:block animate-in fade-in slide-in-from-top-2">
                             <div className="flex justify-between items-center mb-2 border-b border-red-900/30 pb-2">
                                 <span className="text-xs font-bold text-red-400">Hata Detayı</span>
                                 <button
                                     onClick={(e) => {
                                         e.stopPropagation();
                                         navigator.clipboard.writeText(detail.errorMessage || "");
                                         toast.success("Kopyalandı");
                                     }}
                                     className="text-[10px] text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
                                 >
                                     <Copy size={10} /> Kopyala
                                 </button>
                             </div>
                             <div className="max-h-60 overflow-auto font-mono text-[10px] text-red-300 whitespace-pre-wrap scrollbar-thin scrollbar-thumb-zinc-800">
                                 {detail.errorMessage}
                             </div>
                        </div>
                    </div>
                )}
            </div>


            {/* TAB HEADER */}
            {detail && (
                <div className="flex items-center gap-1 bg-zinc-900/40 border-b border-zinc-800/50 px-4 pt-2">
                    <button
                        onClick={() => setActiveTab("timeline")}
                        className={cn(
                            "px-4 py-2 text-xs font-medium border-b-2 transition-all flex items-center gap-2",
                            activeTab === "timeline"
                                ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                                : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30"
                        )}
                    >
                        <Layers size={14} />
                        Zaman Çizelgesi
                    </button>
                    <button
                        onClick={() => setActiveTab("logs")}
                        className={cn(
                            "px-4 py-2 text-xs font-medium border-b-2 transition-all flex items-center gap-2",
                            activeTab === "logs"
                                ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
                                : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30"
                        )}
                    >
                        <Terminal size={14} />
                        Canlı Konsol
                    </button>
                    <button
                        onClick={() => setActiveTab("video")}
                        className={cn(
                            "px-4 py-2 text-xs font-medium border-b-2 transition-all flex items-center gap-2",
                            activeTab === "video"
                                ? "border-rose-500 text-rose-400 bg-rose-500/5"
                                : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30"
                        )}
                    >
                        <Play size={14} />
                        Video Önizleme
                    </button>
                </div>
            )}

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-0 relative scrollbar-thin scrollbar-thumb-zinc-700 bg-zinc-900/20">
                
                {/* TIMELINE TAB */}
                {activeTab === "timeline" && (
                    <div className="p-6 relative">
                         {/* Dikey Çizgi */}
                        <div className="absolute left-[39px] top-6 bottom-6 w-px bg-zinc-800/60 z-0 dashed-line" />

                        {detail.stages.map((stage, idx) => {
                            const isRunning = stage.status === "Running";
                            const isCompleted = stage.status === "Completed";
                            const isFailed = stage.status.includes("Failed");
                            const isSkipped = stage.status === "Skipped";

                            return (
                                <div
                                    key={idx}
                                    className={cn(
                                        "relative z-10 flex gap-4 mb-4 last:mb-0 group transition-all duration-500", // mb-8 -> mb-4, gap-5 -> gap-4
                                        isRunning ? "opacity-100 translate-x-1" : "opacity-90"
                                    )}
                                >
                                    {/* İkon Kutusu */}
                                    <div className="relative pt-1"> {/* Hizalama için pt-1 */}
                                        {isRunning && (
                                            <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-md animate-pulse"></div>
                                        )}
                                        <div
                                            className={cn(
                                                "w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300 relative bg-zinc-950 z-10", // w-10 h-10 -> w-8 h-8
                                                isRunning
                                                    ? "border-amber-500 text-amber-500 shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)] scale-110"
                                                    : isCompleted
                                                    ? "border-emerald-500/50 text-emerald-500 bg-emerald-500/5"
                                                    : isFailed
                                                    ? "border-red-500/50 text-red-500 bg-red-500/5"
                                                    : "border-zinc-800 text-zinc-600"
                                            )}
                                        >
                                            {getStageIcon(stage.status)}
                                        </div>
                                    </div>

                                    {/* Detaylar */}
                                    <div className={cn(
                                        "flex-1 p-3 rounded-lg border transition-all duration-300 flex items-center justify-between gap-4", // Flex row aligned center
                                        isRunning 
                                            ? "bg-zinc-900/80 border-amber-500/20 shadow-lg shadow-black/20" 
                                            : "bg-transparent border-transparent hover:bg-zinc-900/40 hover:border-zinc-800/50"
                                    )}>
                                        {/* İSİM ve BADGE YAN YANA */}
                                        <div className="flex items-center gap-3">
                                            <span
                                                className={`text-sm font-semibold tracking-wide ${
                                                    isRunning ? "text-amber-100" : isCompleted ? "text-zinc-200" : "text-zinc-400"
                                                }`}
                                            >
                                                {stage.stageType}
                                            </span>
                                            
                                            {/* DURUM BADGE'LERI */}
                                            <div className="text-xs">
                                                {isFailed ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                                        {stage.error || "Hata Verme"}
                                                    </span>
                                                ) : isRunning ? (
                                                     <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                        <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse"/>
                                                        İşleniyor
                                                    </span>
                                                ) : isCompleted ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                        Tamamlandı
                                                    </span>
                                                ) : isSkipped ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-500/10 text-zinc-500 border border-zinc-500/20">
                                                        Atlandı
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800/50 text-zinc-500 border border-zinc-700/50">
                                                        Bekliyor
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* SAĞ TARAF AKSİYONLAR */}
                                        <div className="flex items-center gap-2">
                                            {stage.stageType === "SceneLayout" && stage.status === "Completed" && (
                                                <button 
                                                    onClick={() => onOpenTimeline(stage.outputJson || "")}
                                                    className="h-8 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 text-xs font-medium"
                                                >
                                                    <Eye size={14} /> Önizle
                                                </button>
                                            )}

                                            {/* RENDER VIDEO BUTTON */}
                                            {(stage.stageType === "Render" || stage.stageType === "Video") && stage.status === "Completed" && (
                                                 <button 
                                                    onClick={() => setActiveTab("video")}
                                                    className="h-8 px-4 rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/20 transition-all flex items-center gap-2 text-xs font-medium"
                                                 >
                                                     <Play size={14} fill="currentColor" /> İzle
                                                 </button>
                                            )}
                                            
                                            {stage.durationMs > 0 && (
                                                <span className="text-[10px] font-mono text-zinc-500 bg-zinc-950 px-2 py-1 rounded border border-zinc-800/50">
                                                    {(stage.durationMs / 1000).toFixed(1)}s
                                                </span>
                                            )}

                                            {/* RETRY */}
                                            {["Failed", "PermanentlyFailed"].includes(stage.status) && (
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onRetryStage(detail.id, stage.stageType);
                                                    }}
                                                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors border border-zinc-700"
                                                    title="Tekrar Dene"
                                                >
                                                    <RefreshCcw size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* LOGS TAB */}
                {activeTab === "logs" && (
                     <div className="p-4 h-full flex flex-col">
                        <LiveLogViewer runId={detail.id} />
                     </div>
                )}

                {/* VIDEO TAB */}
                {activeTab === "video" && (
                     <div className="p-8 h-full flex flex-col items-center justify-center bg-zinc-950/30">
                        {(() => {
                            // 1. Backend'den gelen doğrudan URL (Öncelikli)
                            let videoPath = detail.finalVideoUrl;

                            // 2. Eğer yoksa eski yöntemle JSON'dan bulmaya çalış (Fallback)
                            if (!videoPath) {
                                const videoStage = detail.stages.find(s => 
                                    (s.stageType === "Video" || s.stageType === "Render") && 
                                    s.status === "Completed" && 
                                    s.outputJson
                                );
                                if (videoStage?.outputJson) {
                                    try {
                                        const out = JSON.parse(videoStage.outputJson);
                                        videoPath = out.path || out.url || out.videoPath || null;
                                    } catch {}
                                }
                            }

                            if (!videoPath) {
                                return (
                                    <div className="text-center text-zinc-500">
                                        <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-800">
                                            <Play size={24} className="opacity-20 ltr:ml-1" />
                                        </div>
                                        <p>Henüz hazır bir video yok.</p>
                                        <p className="text-xs opacity-50 mt-2">Pipeline tamamlandığında video burada görünecektir.</p>
                                    </div>
                                );
                            }

                            return (
                                <div className="flex flex-col items-center gap-4 w-full">
                                     {/* Video Player - Interactive in Tab */}
                                    <div 
                                        className="rounded-xl overflow-hidden shadow-xl border border-zinc-800 bg-black max-w-full"
                                        style={{ width: '32vh' }}
                                    >
                                         <VideoPlayer 
                                            videoUrl={videoPath} 
                                            onExpand={() => setVideoModalUrl(videoPath)}
                                         /> 
                                    </div>
                                </div>
                            );
                        })()}
                     </div>
                )}
            </div>



            {/* Footer Status Bar */}
            {detail.status === "Running" && (
                <div className="p-3 border-t border-zinc-800/50 bg-amber-500/5 backdrop-blur flex justify-center shrink-0">
                    <div className="flex items-center gap-2 text-xs font-medium text-amber-500/80 animate-pulse">
                        <Activity size={14} className="animate-bounce" /> Canlı İzleniyor - Sistem çalışıyor...
                    </div>
                </div>
            )}
            {/* VIDEO PREVIEW MODAL */}
            <Modal
                isOpen={!!videoModalUrl}
                onClose={() => setVideoModalUrl(null)}
                title="Video Önizleme"
                className="w-fit max-w-none" // Modal genişliğini içeriğe göre ayarla
            >
                <div className="flex justify-center items-center bg-black/20 rounded-lg p-2">
                    {/* Dikey (9:16) video için genişliği ekran yüksekliğine göre ayarla: 
                        Height = Width * 1.777
                        Width = Height / 1.777
                        Max Height ~80vh olsun => Width ~40vh (Scroll'u önlemek için biraz küçülttüm)
                    */}
                    <div style={{ width: '40vh' }} className="max-w-full">
                        {videoModalUrl && <VideoPlayer videoUrl={videoModalUrl} className="shadow-none border-none" />}
                    </div>
                </div>
            </Modal>
        </Card>
    );
});


export default function PipelineRunsPage() {
  // --- STATE ---
  const [items, setItems] = useState<PipelineRunListDto[]>([]);
  const [templates, setTemplates] = useState<{ label: string; value: string }[]>([]);
  const [concepts, setConcepts] = useState<{ label: string; value: string }[]>([]);
  
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<PipelineRunDetailDto | null>(null);
  
  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Timeline Modal State
  const [timelineData, setTimelineData] = useState<SceneLayoutPayload | null>(null);

  // Filtreler
  const [selectedConceptId, setSelectedConceptId] = useState<string>("");

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [creating, setCreating] = useState(false);

  // Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });



  // Polling Ref
  const pollRef = useRef<number | null>(null);

  // --- ACTIONS ---
  
  // Helper: Stage JSON Parse
  const openTimeline = useCallback((jsonString?: string) => {
      if (!jsonString) return;
      try {
          const data = JSON.parse(jsonString);
          setTimelineData(data);
      } catch {
          toast.error("Timeline verisi okunamadı.");
      }
  }, []);



  const loadList = useCallback(async (isAutoRefresh = false) => {
    if(!isAutoRefresh) setListLoading(true);
    try {
      const data = await pipelineRunsApi.list(selectedConceptId);
      // Sadece veri değiştiyse update et diyebiliriz ama React zaten diff yapıyor.
      // Yine de simple bir check fena olmazdı ama ID listesi değişebilir.
      setItems(data);
    } catch {
      if(!isAutoRefresh) toast.error("Geçmiş yüklenemedi");
    } finally {
      if(!isAutoRefresh) setListLoading(false);
    }
  }, [selectedConceptId]);

  const loadTemplates = useCallback(async () => {
    try {
      const data = await pipelineTemplatesApi.list();
      setTemplates(data.map((t) => ({ label: t.name, value: t.id.toString() })));
    } catch {}
  }, []);

  const loadConcepts = useCallback(async () => {
    try {
        const cData = await conceptsApi.list();
        setConcepts(cData.map((c) => ({ label: c.name, value: c.id.toString() })));
    } catch {}
  }, []);

  // INIT
  useEffect(() => {
    loadConcepts();
    loadTemplates();
  }, [loadConcepts, loadTemplates]);

  // Filtre değişince
  useEffect(() => {
    loadList();
  }, [loadList]);

  // Toggle Polling
  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback((id: number) => {
    stopPolling();
    pollRef.current = window.setInterval(async () => {
      try {
        const data = await pipelineRunsApi.get(id);
        setDetail((prev) => {
             // Eğer polling sırasında başka bir ID ye geçildiyse (race condition) state'i güncelleme
             // Ancak component unmount durumu için cleanup yeterli olur, id check extra güvenlik.
             return data;
        });

        if (["Completed", "Failed", "Cancelled", "PermanentlyFailed"].includes(data.status)) {
          stopPolling();
          loadList(true); // Sessizce listeyi güncelle (Statü değişti)
        }
      } catch {
        stopPolling();
      }
    }, 2000); 
  }, [stopPolling, loadList]);

  const handleRetryStage = useCallback((runId: number, stageName: string) => {
      setConfirmConfig({
          isOpen: true,
          title: "Aşamayı Tekrar Dene",
          message: (
            <span>
              Bu aşamayı (<b>{stageName}</b>) tekrar denemek istediğinize emin misiniz? <br/>
              <span className="text-xs text-zinc-500">Bu işlem başarısız olan adımı yeniden kuyruğa ekler.</span>
            </span>
          ),
          onConfirm: async () => {
              try {
                // Modal kapandıktan sonra işlemi yap
                await pipelineRunsApi.retryStage(runId, stageName);
                toast.success("Tekrar başlatılıyor...");
                startPolling(runId);
              } catch {
                toast.error("Tekrar deneme başarısız.");
              }
          }
      });
  }, [startPolling]);

  // Cleanup on unmount
  useEffect(() => {
       return () => stopPolling();
  }, [stopPolling]);


  // CLICK HANDLER
  const handleSelect = useCallback(async (id: number) => {
    // Aynı ID ise işlem yapma
    // setState içinde kontrol etmek closure sorununu çözer
    setSelectedId(prev => {
        if(prev === id) return prev;
        
        // Yeni ID seçildi
        stopPolling();
        setDetail(null);
        setDetailLoading(true);

        (async () => {
             try {
                const data = await pipelineRunsApi.get(id);
                setDetail(data);
                if (["Running", "Pending"].includes(data.status)) {
                    startPolling(id);
                }
             } catch {
                 toast.error("Detay yüklenemedi");
             } finally {
                 setDetailLoading(false);
             }
        })();

        return id;
    });
  }, [stopPolling, startPolling]);


  // NEW RUN
  const handleCreate = async () => {
    if (!selectedTemplateId) {
      toast.error("Şablon seçmelisiniz.");
      return;
    }
    setCreating(true);
    try {
      const res = await pipelineRunsApi.create({
        templateId: Number(selectedTemplateId),
        autoStart: true,
      });
      toast.success("Üretim başlatıldı!");
      setIsNewModalOpen(false);
      
      // Listeyi yenile ve yeni üretimi seç
      await loadList();
      handleSelect(res.runId); 
      
    } catch {
      toast.error("Başlatılamadı.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Page>
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden pt-2">
        {/* SOL: LİSTE (Memoized) */}
        <div className="col-span-12 lg:col-span-7 xl:col-span-6 flex flex-col h-full min-h-0 gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
            <h1 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                  <Activity className="text-indigo-400" size={20} />
              </div>
              <div className="flex flex-col">
                  <span>Üretim Geçmişi</span>
                  <span className="text-xs font-normal text-zinc-500">Pipeline koşturmaları</span>
              </div>
            </h1>

            {/* SAĞ GRUP */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="w-full sm:w-48">
                <Select
                  value={selectedConceptId}
                  onChange={setSelectedConceptId}
                  options={[
                    { label: "Tüm Konseptler", value: "" },
                    ...concepts,
                  ]}
                  placeholder="Konsept Filtrele"
                  className="h-10 text-xs bg-zinc-900/50 border-zinc-800"
                />
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => loadList()}
                className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 shrink-0"
              >
                <RefreshCw
                  className={listLoading ? "animate-spin" : ""}
                  size={18}
                />
              </Button>
              <Button
                onClick={() => setIsNewModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white border-none shadow-lg shadow-indigo-500/20 px-4 shrink-0"
              >
                <Play size={18} className="mr-2 fill-current" /> Yeni Üretim
              </Button>
            </div>
          </div>

          <HistoryList 
            items={items} 
            selectedId={selectedId} 
            onSelect={handleSelect} 
            loading={listLoading}
          />
        </div>

        {/* SAĞ: MONITOR (Memoized) */}
        <div className="col-span-12 lg:col-span-5 xl:col-span-6 flex flex-col h-full min-h-0">
             <RunDetail detail={detail} loading={detailLoading} onOpenTimeline={openTimeline} onRetryStage={handleRetryStage} />
        </div>
      </div>

      {/* YENİ RUN MODALI */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Yeni Üretim Başlat"
      >
        <div className="flex flex-col gap-6 pt-2">
          <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
            <Label className="mb-3 text-zinc-300">
              Hangi şablonu (Reçete) kullanacaksın?
            </Label>
            <Select
              value={selectedTemplateId}
              onChange={setSelectedTemplateId}
              options={templates}
              placeholder="Şablon Seçiniz..."
            />
            <div className="flex gap-3 mt-4 text-xs text-zinc-500 bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50">
                <div className="min-w-[4px] bg-indigo-500 rounded-full" />
                <p>
                  Seçtiğiniz şablonun içindeki adımlar (Topic &rarr; Script &rarr; Video &rarr; Publish)
                  sırasıyla işletilecektir. Bu işlem otomatiktir.
                </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setIsNewModalOpen(false)}>
              Vazgeç
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              isLoading={creating}
              disabled={!selectedTemplateId}
              className="bg-indigo-600 hover:bg-indigo-500"
            >
              <Play size={16} className="mr-2 fill-current" /> Başlat ve İzle
            </Button>
          </div>
        </div>
      </Modal>

      {/* TIMELINE MODALI */}
      <Modal 
        isOpen={!!timelineData} 
        onClose={() => setTimelineData(null)} 
        title="Video Kurgu Planı (Timeline)"
        maxWidth="5xl"
      >
         <div className="h-[60vh]">
            {timelineData && <TimelineViewer data={timelineData} />}
         </div>
         <div className="flex justify-end pt-4 border-t border-zinc-800">
            <Button variant="secondary" onClick={() => setTimelineData(null)}>Kapat</Button>
         </div>
      </Modal>
     {/* Global Confirm Modal */}
     <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        variant="primary"
        confirmText="Evet, Tekrar Dene"
     />
    </Page>
  );
}
