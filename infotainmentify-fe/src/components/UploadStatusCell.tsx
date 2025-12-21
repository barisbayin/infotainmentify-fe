import { ExternalLink, AlertCircle, Loader2 } from "lucide-react";
import { Badge } from "../components/ui-kit";
import type { UploadStagePayload } from "../api/pipelineRuns";

// Platform Renkleri ve İkonları
const PLATFORM_CONFIG: Record<string, { color: string; label: string }> = {
  YouTube: { color: "text-red-500 bg-red-500/10 border-red-500/20", label: "YouTube" },
  Instagram: { color: "text-pink-500 bg-pink-500/10 border-pink-500/20", label: "Instagram" },
  TikTok: { color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20", label: "TikTok" },
};

export function UploadStatusCell({ executions }: { executions: any[] }) {
  // 1. Upload Stage'ini bul
  // executions genelde 'stages' array'idir.
  // stageType: "Upload" olanı arıyoruz.
  const uploadExec = executions?.find(x => x.stageType === "Upload" || x.stageConfig?.stageType === "Upload");

  if (!uploadExec) return <span className="text-zinc-600 text-xs">-</span>;

  // 2. Duruma göre gösterim
  if (uploadExec.status === "Pending" || uploadExec.status === "Running" || uploadExec.status === "WaitingForApproval") {
    return (
      <Badge variant="neutral" className="animate-pulse bg-zinc-800 text-zinc-400 border-zinc-700">
        <Loader2 size={10} className="mr-1 animate-spin" /> Yükleniyor
      </Badge>
    );
  }

  // 3. Output JSON'ı Parse Et
  let results: UploadStagePayload | null = null;
  try {
    if (uploadExec.outputJson) {
      results = JSON.parse(uploadExec.outputJson);
    }
  } catch (e) {
    return <span className="text-red-500 text-xs">JSON Error</span>;
  }

  if (!results || !results.Uploads?.length) {
    if (uploadExec.status === "Completed") {
         // Belki manuel bir şeydir veya boş dönmüştür
         return <span className="text-zinc-500 text-xs">-</span>;
    }
    return <span className="text-zinc-600 text-xs">-</span>;
  }

  // 4. İkonları Listele
  return (
    <div className="flex items-center gap-2">
      {results.Uploads.map((item, idx) => {
        const conf = PLATFORM_CONFIG[item.Platform] || { color: "text-zinc-400", label: item.Platform };
        
        if (!item.IsSuccess) {
           // Hata Durumu
           return (
             <div key={idx} className="group relative" title={item.ErrorMessage || "Hata"}>
               <div className="w-6 h-6 rounded flex items-center justify-center bg-red-900/20 border border-red-800 text-red-500 cursor-help">
                 <AlertCircle size={14} />
               </div>
             </div>
           );
        }

        // Başarılı Durum -> Link
        return (
          <a
            key={idx}
            href={item.VideoUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-7 h-7 rounded flex items-center justify-center border transition-all hover:scale-110 ${conf.color}`}
            title={`${conf.label}: ${item.ChannelName}`}
          >
            <ExternalLink size={14} />
          </a>
        );
      })}
    </div>
  );
}