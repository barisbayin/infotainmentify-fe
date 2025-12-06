import { useEffect, useState } from "react";
import { useDebounce } from "../hooks/useDebounce";
import {
  pipelineTemplatesApi,
  type PipelineTemplateListDto,
  type SavePipelineTemplateDto,
  type StageConfigDto,
} from "../api/pipelineTemplates";
import { conceptsApi } from "../api/concepts";

// 🔥 TÜM PRESET API'LERİNİ ÇAĞIRIYORUZ (Dinamik liste için)
import { topicPresetsApi } from "../api/topicPresets";
import { scriptPresetsApi } from "../api/scriptPresets";
import { imagePresetsApi } from "../api/imagePresets";
import { ttsPresetsApi } from "../api/ttsPresets";
import { sttPresetsApi } from "../api/sttPresets";
import { videoPresetsApi } from "../api/videoPresets";
import { renderPresetsApi } from "../api/renderPresets";

import toast from "react-hot-toast";
import {
  Page,
  Card,
  Button,
  Input,
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
  Plus,
  Trash2,
  Save,
  Search,
  RefreshCw,
  Layers,
  ArrowUp,
  ArrowDown,
  GripVertical,
  FolderOpen,
  AlertTriangle,
} from "lucide-react";

// Backend Enum'ı ile eşleşen Tipler
const STAGE_TYPES = [
  { value: "Topic", label: "Konu (Topic)" },
  { value: "Script", label: "Senaryo (Script)" },
  { value: "Image", label: "Görsel (Image)" },
  { value: "Tts", label: "Seslendirme (TTS)" },
  { value: "Stt", label: "Deşifre (STT)" },
  { value: "Video", label: "Video Üretimi" },
  { value: "SceneLayout", label: "Kurgu/Timeline" },
  { value: "Render", label: "Render (Birleştirme)" },
  { value: "Upload", label: "Yükleme (YouTube vs)" },
];

const EMPTY_FORM: SavePipelineTemplateDto = {
  name: "",
  description: "",
  conceptId: 0,
  stages: [],
};

export default function PipelineTemplatesPage() {
  // --- MAIN STATE ---
  const [items, setItems] = useState<PipelineTemplateListDto[]>([]);
  const [concepts, setConcepts] = useState<{ label: string; value: string }[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form, setForm] = useState<SavePipelineTemplateDto>(EMPTY_FORM);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // --- STAGE BUILDER STATE ---
  const [selectedStageType, setSelectedStageType] = useState<string>("Topic");
  const [selectedPresetId, setSelectedPresetId] = useState<number>(0);

  // Dinamik Preset Listesi
  const [availablePresets, setAvailablePresets] = useState<
    { label: string; value: string }[]
  >([]);
  const [presetLoading, setPresetLoading] = useState(false);

  const [selectedConceptId, setSelectedConceptId] = useState<string>("");

  // --- LOAD DATA ---
  const loadData = async () => {
    setLoading(true);
    try {
      const [templatesData, conceptsData] = await Promise.all([
        // 🔥 Filtreyi gönderiyoruz
        pipelineTemplatesApi.list(debouncedSearch, selectedConceptId),
        conceptsApi.list(),
      ]);
      setItems(templatesData);
      setConcepts(
        conceptsData.map((c) => ({ label: c.name, value: c.id.toString() }))
      );
    } catch {
      toast.error("Veriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [debouncedSearch, selectedConceptId]);

  // --- DİNAMİK PRESET GETİRME ---
  useEffect(() => {
    const fetchPresets = async () => {
      setPresetLoading(true);
      setAvailablePresets([]); // Listeyi temizle
      setSelectedPresetId(0); // Seçimi sıfırla

      try {
        let data: any[] = [];

        // Seçilen tipe göre ilgili API'ye git
        switch (selectedStageType) {
          case "Topic":
            data = await topicPresetsApi.list();
            break;
          case "Script":
            data = await scriptPresetsApi.list();
            break;
          case "Image":
            data = await imagePresetsApi.list();
            break;
          case "Tts":
            data = await ttsPresetsApi.list();
            break;
          case "Stt":
            data = await sttPresetsApi.list();
            break;
          case "Video":
            data = await videoPresetsApi.list();
            break;
          case "SceneLayout":
          case "Render":
            data = await renderPresetsApi.list();
            break;
            
          // SceneLayout, Upload gibi preset gerektirmeyenler boş kalır
          default:
            data = [];
            break;
        }

        setAvailablePresets(
          data.map((d) => ({
            label: d.name,
            value: d.id.toString(),
          }))
        );
      } catch (error) {
        console.error("Presetler çekilemedi", error);
      } finally {
        setPresetLoading(false);
      }
    };

    fetchPresets();
  }, [selectedStageType]);

  // --- FORM HANDLERS ---
  const handleSelect = async (id: number) => {
    if (id === selectedId) return;
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const data = await pipelineTemplatesApi.get(id);
      setForm({
        name: data.name,
        description: data.description ?? "",
        conceptId: data.conceptId,
        // Sıralamayı garantiye al
        stages: data.stages.sort((a, b) => a.order - b.order),
      });
    } catch {
      toast.error("Detay yüklenemedi.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleNew = () => {
    setSelectedId(null);
    setForm(EMPTY_FORM);
    setSelectedStageType("Topic"); // Reset to default
    setAvailablePresets([]);
  };

  // --- STAGE İŞLEMLERİ ---
  const addStage = () => {
    // Validasyon: Eğer preset listesi doluysa ve seçim yapılmadıysa
    if (availablePresets.length > 0 && selectedPresetId === 0) {
      toast.error("Lütfen bir Preset seçin.");
      return;
    }

    const newStage: StageConfigDto = {
      stageType: selectedStageType,
      order: form.stages.length + 1,
      presetId: selectedPresetId > 0 ? selectedPresetId : undefined,
    };

    setForm((prev) => ({ ...prev, stages: [...prev.stages, newStage] }));

    // Seçimi sıfırla ama tipi koru (seri ekleme için kolaylık)
    setSelectedPresetId(0);
  };

  const removeStage = (index: number) => {
    const newStages = form.stages.filter((_, i) => i !== index);
    // Sıraları güncelle (1, 2, 3...)
    newStages.forEach((s, i) => (s.order = i + 1));
    setForm((prev) => ({ ...prev, stages: newStages }));
  };

  const moveStage = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === form.stages.length - 1) return;

    const newStages = [...form.stages];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    // Swap
    [newStages[index], newStages[targetIndex]] = [
      newStages[targetIndex],
      newStages[index],
    ];

    // Sıraları güncelle
    newStages.forEach((s, i) => (s.order = i + 1));
    setForm((prev) => ({ ...prev, stages: newStages }));
  };

  // --- KAYIT ---
  const handleSave = async () => {
    if (!form.name.trim() || !form.conceptId) {
      toast.error("Şablon Adı ve Konsept zorunludur.");
      return;
    }
    if (form.stages.length === 0) {
      toast.error("En az bir işlem adımı (Stage) eklemelisiniz.");
      return;
    }

    setDetailLoading(true);
    try {
      if (selectedId) {
        await pipelineTemplatesApi.update(selectedId, form);
        toast.success("Güncellendi.");
      } else {
        await pipelineTemplatesApi.create(form);
        toast.success("Oluşturuldu.");
        handleNew();
      }
      loadData();
    } catch {
      toast.error("Kayıt başarısız.");
    } finally {
      setDetailLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedId) return;
    setDetailLoading(true);
    try {
      await pipelineTemplatesApi.delete(selectedId);
      toast.success("Silindi.");
      setIsDeleteModalOpen(false);
      handleNew();
      loadData();
    } catch {
      toast.error("Silme başarısız.");
    } finally {
      setDetailLoading(false);
    }
  };

  // Filtreleme (Client side)
  const filteredItems = items.filter((i) =>
    i.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <Page>
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden pt-2">
        {/* === SOL: LİSTE (8 BİRİM) === */}
        <div className="col-span-12 lg:col-span-8 flex flex-col h-full min-h-0 gap-4">
          <div className="flex justify-between items-center gap-2 shrink-0">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="text-indigo-500" /> Üretim Şablonları
            </h1>

            {/* SAĞ GRUP */}
            <div className="flex items-center gap-2">
              {/* 🔥 YENİ: KONSEPT FİLTRESİ */}
              <div className="w-48">
                <Select
                  value={selectedConceptId}
                  onChange={setSelectedConceptId}
                  // "Tüm Konseptler" seçeneğini başa ekliyoruz
                  options={[
                    { label: "Tüm Konseptler", value: "" },
                    ...concepts,
                  ]}
                  placeholder="Konsept Filtrele"
                  className="h-9 text-xs bg-zinc-900/50 border-zinc-800"
                />
              </div>
              <div className="flex gap-2 relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  placeholder="Şablon ara..."
                  className="pl-9 bg-zinc-900/50 border-zinc-800"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={loadData}
                  className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800"
                >
                  <RefreshCw
                    className={loading ? "animate-spin" : ""}
                    size={18}
                  />
                </Button>
                <Button
                  onClick={handleNew}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white border-none shadow-lg px-4"
                >
                  <Plus size={18} className="mr-2" /> Yeni Şablon
                </Button>
              </div>
            </div>
          </div>

          <Card className="flex-1 min-h-0 p-0 overflow-hidden flex flex-col border-zinc-800 bg-zinc-900/40">
            <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-700">
              <Table className="border-none w-full">
                <THead>
                  <TR className="bg-zinc-900/80 sticky top-0 z-10 backdrop-blur-md">
                    <TH className="text-zinc-400 font-medium">Şablon Adı</TH>
                    <TH className="text-zinc-400 font-medium">Konsept</TH>
                    <TH className="text-zinc-400 font-medium text-center">
                      Adım
                    </TH>
                    <TH className="text-zinc-400 font-medium text-right">
                      Tarih
                    </TH>
                  </TR>
                </THead>
                <tbody>
                  {filteredItems.map((item) => (
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
                      <TD className="font-medium text-zinc-200 py-3">
                        {item.name}
                      </TD>
                      <TD className="text-zinc-400 py-3 text-sm flex items-center gap-1">
                        <FolderOpen size={12} className="text-amber-500/70" />{" "}
                        {item.conceptName}
                      </TD>
                      <TD className="text-center text-zinc-500 text-xs py-3">
                        <Badge variant="neutral" className="scale-90">
                          {item.stageCount} Adım
                        </Badge>
                      </TD>
                      <TD className="text-right text-zinc-500 text-xs py-3 font-mono">
                        {new Date(item.createdAt).toLocaleDateString("tr-TR")}
                      </TD>
                    </TR>
                  ))}
                  {filteredItems.length === 0 && !loading && (
                    <TR>
                      <TD
                        colSpan={4}
                        className="text-center py-12 text-zinc-500"
                      >
                        Şablon bulunamadı.
                      </TD>
                    </TR>
                  )}
                </tbody>
              </Table>
            </div>
            <div className="p-2 border-t border-zinc-800 bg-zinc-900/50 text-xs text-zinc-500 text-center shrink-0">
              Toplam {filteredItems.length} kayıt
            </div>
          </Card>
        </div>

        {/* === SAĞ: FORM (4 BİRİM) === */}
        <div className="col-span-12 lg:col-span-4 flex flex-col h-full min-h-0">
          <Card className="h-full flex flex-col overflow-hidden border-zinc-800 bg-zinc-900/60 backdrop-blur-xl p-0">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-zinc-800/50 shrink-0 bg-zinc-900/30">
              <div className="flex items-center gap-2">
                <div
                  className={`w-1.5 h-6 rounded-full shadow-lg ${
                    selectedId ? "bg-indigo-500" : "bg-emerald-500"
                  }`}
                />
                <h2 className="text-md font-bold text-white tracking-tight">
                  {selectedId ? "Şablonu Düzenle" : "Yeni Şablon"}
                </h2>
              </div>
              {selectedId && (
                <Badge variant="neutral" className="text-[10px]">
                  #{selectedId}
                </Badge>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-zinc-700">
              {detailLoading ? (
                <div className="flex h-full items-center justify-center text-zinc-500 gap-2">
                  <RefreshCw className="animate-spin" /> Yükleniyor...
                </div>
              ) : (
                <>
                  {/* Başlık & Konsept */}
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-1.5">
                        Şablon Adı <span className="text-indigo-400">*</span>
                      </Label>
                      <Input
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        className="bg-zinc-950/50 border-zinc-800 h-9 text-sm focus:border-indigo-500"
                        placeholder="Örn: Shorts Factory V1"
                      />
                    </div>
                    <div>
                      <Label className="mb-1.5">
                        Bağlı Konsept <span className="text-indigo-400">*</span>
                      </Label>
                      <Select
                        value={form.conceptId.toString()}
                        onChange={(val) =>
                          setForm({ ...form, conceptId: Number(val) })
                        }
                        options={concepts}
                        placeholder="Konsept Seçiniz..."
                      />
                    </div>
                    <div>
                      <Label className="mb-1.5">Açıklama</Label>
                      <Input
                        value={form.description}
                        onChange={(e) =>
                          setForm({ ...form, description: e.target.value })
                        }
                        className="bg-zinc-950/50 border-zinc-800 h-9 text-sm"
                        placeholder="Opsiyonel"
                      />
                    </div>
                  </div>

                  {/* --- STAGE BUILDER --- */}
                  <div className="pt-4 mt-2 border-t border-zinc-800/50">
                    <Label className="mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Layers size={12} /> Pipeline Adımları
                      </span>
                      <span className="text-[10px] text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                        {form.stages.length} Adım
                      </span>
                    </Label>

                    {/* Adım Ekleme Alanı (Kompakt Grid) */}
                    <div className="flex items-end gap-2 mb-4 p-2.5 rounded-xl bg-zinc-950/30 border border-zinc-800/50">
                      <div className="w-1/3">
                        <Label className="text-[10px] mb-1 text-zinc-500">
                          Tip
                        </Label>
                        <Select
                          value={selectedStageType}
                          onChange={setSelectedStageType}
                          options={STAGE_TYPES}
                          className="h-8 text-xs"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <Label className="text-[10px] mb-1 text-zinc-500 flex items-center gap-1">
                          {presetLoading && (
                            <RefreshCw size={8} className="animate-spin" />
                          )}
                          Preset (Ayar)
                        </Label>
                        <Select
                          value={selectedPresetId.toString()}
                          onChange={(val) => setSelectedPresetId(Number(val))}
                          options={availablePresets}
                          placeholder={
                            availablePresets.length > 0
                              ? "Seçiniz..."
                              : "Gerekmiyor"
                          }
                          className="h-8 text-xs"
                          // Gerekmiyorsa disabled yap
                          // disabled={availablePresets.length === 0}
                        />
                      </div>

                      <Button
                        size="sm"
                        onClick={addStage}
                        className="h-8 px-3 bg-indigo-600 hover:bg-indigo-500 text-white border-none shadow-lg shadow-indigo-500/20 shrink-0"
                      >
                        <Plus size={14} />
                      </Button>
                    </div>

                    {/* Adım Listesi */}
                    <div className="space-y-2">
                      {form.stages.length === 0 && (
                        <div className="text-center py-8 text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
                          Henüz adım eklenmedi. <br /> Yukarıdan tip seçip
                          ekleyin.
                        </div>
                      )}

                      {form.stages.map((stage, idx) => {
                        const stageLabel =
                          STAGE_TYPES.find((t) => t.value === stage.stageType)
                            ?.label || stage.stageType;
                        // Preset adını bilmiyoruz (sadece ID var), ama UI'da ID göstermek yeterli.
                        // İleride istersen "loadedPresets" diye bir map tutabiliriz ama şimdilik ID yeterli.

                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-2 rounded-lg border border-zinc-800 bg-zinc-900/80 group hover:border-zinc-700 transition-all"
                          >
                            <div className="flex flex-col items-center justify-center w-6 text-zinc-600 cursor-grab active:cursor-grabbing select-none">
                              <GripVertical size={14} />
                              <span className="text-[9px] font-mono font-bold mt-0.5 text-zinc-700 group-hover:text-zinc-500">
                                {idx + 1}
                              </span>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-zinc-200 truncate">
                                  {stageLabel}
                                </span>
                                {stage.presetId ? (
                                  <Badge
                                    variant="brand"
                                    className="text-[9px] py-0 h-4 px-1.5 font-mono"
                                  >
                                    #{stage.presetId}
                                  </Badge>
                                ) : (
                                  <span className="text-[9px] text-zinc-600 italic">
                                    default
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                              <div className="flex flex-col gap-0.5">
                                <button
                                  onClick={() => moveStage(idx, "up")}
                                  disabled={idx === 0}
                                  className="p-0.5 text-zinc-500 hover:text-white disabled:opacity-10 disabled:cursor-not-allowed"
                                >
                                  <ArrowUp size={10} />
                                </button>
                                <button
                                  onClick={() => moveStage(idx, "down")}
                                  disabled={idx === form.stages.length - 1}
                                  className="p-0.5 text-zinc-500 hover:text-white disabled:opacity-10 disabled:cursor-not-allowed"
                                >
                                  <ArrowDown size={10} />
                                </button>
                              </div>
                              <button
                                onClick={() => removeStage(idx)}
                                className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded ml-1 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/80 backdrop-blur flex items-center justify-end gap-2 shrink-0">
              <Button
                variant="ghost"
                onClick={handleNew}
                className="text-zinc-400 hover:text-white h-9 px-3 text-xs"
              >
                Vazgeç
              </Button>
              {selectedId && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20 h-9 px-3 text-xs"
                >
                  <Trash2 size={14} className="mr-1.5" /> Sil
                </Button>
              )}
              <Button
                variant="primary"
                onClick={handleSave}
                className="shadow-lg shadow-indigo-600/20 bg-indigo-600 hover:bg-indigo-500 text-white border-none h-9 px-4 text-xs"
              >
                <Save size={14} className="mr-1.5" />{" "}
                {selectedId ? "Kaydet" : "Oluştur"}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Şablon Silinsin mi?"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
            <AlertTriangle className="text-red-500 shrink-0" size={24} />
            <p className="text-sm text-zinc-300">
              <b>"{form.name}"</b> şablonu silinecek.
            </p>
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              İptal
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Evet, Sil
            </Button>
          </div>
        </div>
      </Modal>
    </Page>
  );
}
