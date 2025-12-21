import { useEffect, useState } from "react";
import { pipelineRunsApi } from "../api/pipelineRuns";
import { conceptsApi } from "../api/concepts";
import { UploadStatusCell } from "../components/UploadStatusCell";
import { 
  Page, Card, Table, THead, TR, TH, TD, Badge, Select, Button 
} from "../components/ui-kit";
import { RefreshCw, PlayCircle, Calendar } from "lucide-react";

export default function PipelineHistoryPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [concepts, setConcepts] = useState<{ label: string; value: string }[]>([]);
  
  // Filtre State'leri
  const [selectedConcept, setSelectedConcept] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Verileri Çek
  const loadData = async () => {
    setLoading(true);
    try {
      const [runsData, conceptsData] = await Promise.all([
        pipelineRunsApi.list(selectedConcept),
        conceptsApi.list()
      ]);
      
      setRuns(runsData);
      setConcepts(conceptsData.map(c => ({ label: c.name, value: c.id.toString() })));
    } catch (error) {
      console.error("Yükleme hatası", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedConcept]); // Konsept değişince otomatik yenile

  return (
    <Page>
      <div className="flex flex-col h-full gap-4">
        
        {/* --- HEADER & FILTER --- */}
        <div className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
            <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <PlayCircle className="text-emerald-500" /> Yayın Akışı
                </h1>
                <p className="text-zinc-500 text-xs mt-1">Üretilen ve yayınlanan videoların raporu.</p>
            </div>

            <div className="flex items-center gap-3">
                {/* Konsept Filtresi */}
                <div className="w-56">
                    <Select
                        value={selectedConcept}
                        onChange={setSelectedConcept}
                        options={[{ label: "Tüm Konseptler", value: "" }, ...concepts]}
                        placeholder="Konsept Filtrele"
                        className="bg-zinc-950 border-zinc-700"
                    />
                </div>

                <Button variant="outline" onClick={loadData} disabled={loading}>
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </Button>
            </div>
        </div>

        {/* --- TABLO --- */}
        <Card className="flex-1 p-0 overflow-hidden border-zinc-800 bg-zinc-900/30">
            <div className="overflow-auto h-full scrollbar-thin">
                <Table>
                    <THead>
                        <TR>
                            <TH>ID</TH>
                            <TH>Video Başlığı / Şablon</TH>
                            <TH>Konsept</TH>
                            <TH>Durum</TH>
                            <TH>Yayın Linkleri (Upload)</TH>
                            <TH className="text-right">Tarih</TH>
                        </TR>
                    </THead>
                    <tbody>
                        {runs.map((run) => (
                            <TR key={run.id} className="hover:bg-zinc-800/30 transition-colors">
                                <TD className="font-mono text-zinc-500 text-xs text-center w-16">#{run.id}</TD>
                                
                                <TD>
                                    <div className="flex flex-col">
                                        {/* Eğer Script aşamasında başlık oluştuysa onu göster, yoksa şablon adını */}
                                        <span className="text-zinc-200 font-medium text-sm">
                                            {run.runContextTitle || run.videoTitle || run.templateName}
                                        </span>
                                        <span className="text-[10px] text-zinc-500">
                                            {run.templateName}
                                        </span>
                                    </div>
                                </TD>

                                <TD>
                                    <Badge variant="neutral" className="border border-zinc-700">
                                        {run.conceptName || "-"}
                                    </Badge>
                                </TD>

                                <TD>
                                    {/* Statü Badge'i */}
                                    <StatusBadge status={run.status} />
                                </TD>

                                {/* 🔥 BURASI BİZİM YENİ HÜCREMİZ */}
                                <TD>
                                    <UploadStatusCell executions={run.stages || run.stageExecutions || []} />
                                </TD>

                                <TD className="text-right text-zinc-500 text-xs font-mono">
                                    <div className="flex items-center justify-end gap-1">
                                        <Calendar size={10} />
                                        {new Date(run.startedAt).toLocaleDateString("tr-TR")}
                                    </div>
                                    <span className="text-[10px] opacity-50">
                                        {new Date(run.startedAt).toLocaleTimeString("tr-TR").slice(0,5)}
                                    </span>
                                </TD>
                            </TR>
                        ))}
                    </tbody>
                </Table>
                
                {runs.length === 0 && !loading && (
                    <div className="text-center py-20 text-zinc-500">
                        Bu kriterde kayıt bulunamadı.
                    </div>
                )}
            </div>
        </Card>
      </div>
    </Page>
  );
}

// Basit Statü Yardımcısı
function StatusBadge({ status }: { status: string }) {
    const styles: any = {
        Pending: { label: "Pending", class: "bg-zinc-500/10 text-zinc-500" },
        Running: { label: "Processing", class: "bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse" },
        Completed: { label: "Completed", class: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
        Failed: { label: "Failed", class: "bg-red-500/10 text-red-400 border-red-500/20" },
        WaitingForApproval: { label: "Onay Bekliyor", class: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
        Cancelled: { label: "İptal", class: "bg-zinc-700 text-zinc-300 border-zinc-600" }
    };
    
    const s = styles[status] || styles["Pending"];
    return <Badge className={`${s.class} border`}>{s.label}</Badge>;
}