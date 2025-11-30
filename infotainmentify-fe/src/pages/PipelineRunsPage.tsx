import { useEffect, useState, useRef } from "react";
import {
  pipelineRunsApi,
  type PipelineRunListDto,
  type PipelineRunDetailDto,
  type PipelineStageDto,
} from "../api/pipelineRuns";
import {
  pipelineTemplatesApi,
  type PipelineTemplateListDto,
} from "../api/pipelineTemplates"; // Şablon seçimi için
import toast from "react-hot-toast";
import {
  Page,
  Card,
  Button,
  Label,
  Badge,
  Table,
  THead,
  TR,
  TH,
  TD,
  Modal,
  Select,
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
} from "lucide-react";

export default function PipelineRunsPage() {
  // --- STATE ---
  const [items, setItems] = useState<PipelineRunListDto[]>([]);
  const [templates, setTemplates] = useState<
    { label: string; value: string }[]
  >([]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<PipelineRunDetailDto | null>(null);
  const [loading, setLoading] = useState(false); // Liste yükleme

  // Yeni Run Modalı
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [creating, setCreating] = useState(false);

  // Polling Ref
  const pollRef = useRef<number | null>(null);

  // --- ACTIONS ---

  const loadList = async () => {
    setLoading(true);
    try {
      // Şimdilik list endpoint'i yoksa boş array dönebilir, backend'e eklenmesi lazım.
      // Mock data ile test edebilirsin veya backend controller'a GetAll eklemelisin.
      // const data = await pipelineRunsApi.list();
      // setItems(data);
      // Backend'de List endpointi eksikse geçici çözüm:
      // setItems([]);
    } catch {
      toast.error("Geçmiş yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  // Şablonları yükle (Modal için)
  const loadTemplates = async () => {
    try {
      const data = await pipelineTemplatesApi.list();
      setTemplates(
        data.map((t) => ({ label: t.name, value: t.id.toString() }))
      );
    } catch {}
  };

  useEffect(() => {
    loadList();
    loadTemplates();
    return () => stopPolling();
  }, []);

  // Polling Başlat/Durdur
  const startPolling = (id: number) => {
    stopPolling();
    pollRef.current = window.setInterval(async () => {
      try {
        const data = await pipelineRunsApi.get(id);
        setDetail(data);
        // Eğer bittiyse durdur
        if (
          data.status === "Completed" ||
          data.status === "Failed" ||
          data.status === "Cancelled"
        ) {
          stopPolling();
          loadList(); // Listeyi güncelle (durum değişti)
        }
      } catch {
        stopPolling();
      }
    }, 2000); // 2 saniyede bir
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  // Satır Seçimi
  const handleSelect = async (id: number) => {
    if (id === selectedId) return;
    setSelectedId(id);
    setDetail(null); // Öncekini temizle
    stopPolling(); // Önceki polling'i durdur

    try {
      const data = await pipelineRunsApi.get(id);
      setDetail(data);
      // Eğer çalışıyorsa polling başlat
      if (data.status === "Running" || data.status === "Pending") {
        startPolling(id);
      }
    } catch {
      toast.error("Detay yüklenemedi");
    }
  };

  // Yeni Run Başlat
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
      await loadList();
      handleSelect(res.runId); // Otomatik seç
    } catch {
      toast.error("Başlatılamadı.");
    } finally {
      setCreating(false);
    }
  };

  // --- RENDER HELPERS ---

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
      default:
        return "bg-zinc-800 text-zinc-400";
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
      default:
        return (
          <div className="w-4 h-4 rounded-full border-2 border-zinc-700" />
        );
    }
  };

  return (
    <Page>
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden pt-2">
        {/* SOL: LİSTE (7 BİRİM) */}
        <div className="col-span-12 lg:col-span-7 flex flex-col h-full min-h-0 gap-4">
          <div className="flex justify-between items-center gap-2 shrink-0">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="text-indigo-500" /> Üretim Geçmişi
            </h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={loadList}
                className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800"
              >
                <RefreshCw size={18} />
              </Button>
              <Button
                onClick={() => setIsNewModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white border-none shadow-lg px-4"
              >
                <Play size={18} className="mr-2" /> Yeni Üretim
              </Button>
            </div>
          </div>

          <Card className="flex-1 min-h-0 p-0 overflow-hidden flex flex-col border-zinc-800 bg-zinc-900/40">
            <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-700">
              <Table className="border-none w-full">
                <THead>
                  <TR className="bg-zinc-900/80 sticky top-0 z-10 backdrop-blur-md">
                    <TH className="text-zinc-400 font-medium">ID</TH>
                    <TH className="text-zinc-400 font-medium">Şablon</TH>
                    <TH className="text-zinc-400 font-medium text-center">
                      Durum
                    </TH>
                    <TH className="text-zinc-400 font-medium text-right">
                      Başlangıç
                    </TH>
                  </TR>
                </THead>
                <tbody>
                  {items.map((item) => (
                    <TR
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={`cursor-pointer transition-all border-b border-zinc-800/50 hover:bg-zinc-800/40 
                        ${
                          selectedId === item.id
                            ? "bg-indigo-500/10 border-l-4 border-l-indigo-500"
                            : "border-l-4 border-l-transparent"
                        }`}
                    >
                      <TD className="font-mono text-zinc-500 text-xs">
                        #{item.id}
                      </TD>
                      <TD className="font-medium text-zinc-200">
                        {item.templateName}
                      </TD>
                      <TD className="text-center py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium border ${getStatusColor(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </TD>
                      <TD className="text-right text-zinc-500 text-xs py-3 font-mono">
                        {item.startedAt
                          ? new Date(item.startedAt).toLocaleTimeString()
                          : "-"}
                      </TD>
                    </TR>
                  ))}
                  {items.length === 0 && !loading && (
                    <TR>
                      <TD
                        colSpan={4}
                        className="text-center py-12 text-zinc-500"
                      >
                        Kayıt bulunamadı.
                      </TD>
                    </TR>
                  )}
                </tbody>
              </Table>
            </div>
          </Card>
        </div>

        {/* SAĞ: MONITOR (5 BİRİM) */}
        <div className="col-span-12 lg:col-span-5 flex flex-col h-full min-h-0">
          <Card className="h-full flex flex-col overflow-hidden border-zinc-800 bg-zinc-900/60 backdrop-blur-xl p-0">
            {detail ? (
              <>
                {/* Header */}
                <div className="p-5 border-b border-zinc-800/50 shrink-0 bg-zinc-900/30 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-bold text-white">
                        Run #{detail.id}
                      </span>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium border ${getStatusColor(
                          detail.status
                        )}`}
                      >
                        {detail.status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Başlangıç:{" "}
                      {detail.startedAt
                        ? new Date(detail.startedAt).toLocaleString()
                        : "-"}
                    </p>
                  </div>
                  {/* Eğer hata varsa göster */}
                  {detail.errorMessage && (
                    <div className="max-w-[200px] text-[10px] text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20">
                      Error: {detail.errorMessage}
                    </div>
                  )}
                </div>

                {/* TIMELINE / STAGES */}
                <div className="flex-1 overflow-y-auto p-5 space-y-0 relative scrollbar-thin scrollbar-thumb-zinc-700">
                  {/* Dikey Çizgi */}
                  <div className="absolute left-[34px] top-8 bottom-8 w-px bg-zinc-800 z-0" />

                  {detail.stages.map((stage, idx) => {
                    const isRunning = stage.status === "Running";
                    const isCompleted = stage.status === "Completed";
                    const isFailed = stage.status.includes("Failed");

                    return (
                      <div
                        key={idx}
                        className="relative z-10 flex gap-4 mb-6 last:mb-0 group"
                      >
                        {/* İkon Kutusu */}
                        <div
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-all 
                                        ${
                                          isRunning
                                            ? "bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                                            : isCompleted
                                            ? "bg-emerald-500/10 border-emerald-500/30"
                                            : isFailed
                                            ? "bg-red-500/10 border-red-500/30"
                                            : "bg-zinc-900 border-zinc-800"
                                        }`}
                        >
                          {getStageIcon(stage.status)}
                        </div>

                        {/* Detaylar */}
                        <div className="flex-1 pt-1">
                          <div className="flex justify-between items-center mb-1">
                            <span
                              className={`text-sm font-medium ${
                                isRunning ? "text-white" : "text-zinc-300"
                              }`}
                            >
                              {stage.stageType}
                            </span>
                            {stage.durationMs > 0 && (
                              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900/50 px-1.5 py-0.5 rounded">
                                {(stage.durationMs / 1000).toFixed(1)}s
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {isFailed ? (
                              <span className="text-red-400">
                                {stage.error || "Hata oluştu"}
                              </span>
                            ) : isRunning ? (
                              <span className="text-amber-500 animate-pulse">
                                İşleniyor...
                              </span>
                            ) : isCompleted ? (
                              <span className="text-emerald-500/70">
                                Tamamlandı
                              </span>
                            ) : (
                              "Bekliyor"
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Actions */}
                {detail.status === "Running" && (
                  <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/80 backdrop-blur flex justify-center shrink-0">
                    <div className="flex items-center gap-2 text-xs text-zinc-400 animate-pulse">
                      <Activity size={14} /> Canlı izleniyor...
                    </div>
                  </div>
                )}
              </>
            ) : (
              // BOŞ DURUM
              <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-3 p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-inner">
                  <Layers size={32} className="opacity-20" />
                </div>
                <p className="text-sm font-medium">Bir işlem seçin</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* YENİ RUN MODALI */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Yeni Üretim Başlat"
      >
        <div className="flex flex-col gap-6 pt-2">
          <div>
            <Label className="mb-2">
              Hangi şablonu (Reçete) kullanacaksın?
            </Label>
            <Select
              value={selectedTemplateId}
              onChange={setSelectedTemplateId}
              options={templates}
              placeholder="Şablon Seçiniz..."
            />
            <p className="text-xs text-zinc-500 mt-2">
              Seçtiğiniz şablonun içindeki adımlar (Topic - Script - Video)
              sırasıyla işletilecektir.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsNewModalOpen(false)}>
              Vazgeç
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              isLoading={creating}
              disabled={!selectedTemplateId}
            >
              <Play size={16} className="mr-2" /> Başlat
            </Button>
          </div>
        </div>
      </Modal>
    </Page>
  );
}
