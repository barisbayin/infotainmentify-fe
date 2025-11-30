import { useEffect, useState } from "react";
import { useDebounce } from "../hooks/useDebounce";
import {
  pipelineTemplatesApi,
  STAGE_TYPES,
  type PipelineTemplateListDto,
  type SavePipelineTemplateDto,
  type StageConfigDto,
} from "../api/pipelineTemplates";
import { conceptsApi, type ConceptListDto } from "../api/concepts"; // Konsept seçimi için
import toast from "react-hot-toast";
import {
  Page,
  Card,
  Button,
  Input,
  Textarea,
  Label,
  Badge,
  Table,
  THead,
  TR,
  TH,
  TD,
  Modal,
  Select,
  NumberInput,
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
  FileText,
} from "lucide-react";

const EMPTY_FORM: SavePipelineTemplateDto = {
  name: "",
  description: "",
  conceptId: 0,
  stages: [],
};

export default function PipelineTemplatesPage() {
  // --- STATE ---
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

  // Stage Ekleme State'i
  const [selectedStageType, setSelectedStageType] = useState<string>("Topic");
  const [selectedPresetId, setSelectedPresetId] = useState<number>(0);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // --- LOAD ---
  const loadData = async () => {
    setLoading(true);
    try {
      const [templatesData, conceptsData] = await Promise.all([
        pipelineTemplatesApi.list(debouncedSearch),
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
  }, [debouncedSearch]);

  // --- SELECT & FORM ---
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
        stages: data.stages.sort((a, b) => a.order - b.order), // Sıralı gelsin
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
  };

  // --- STAGE YÖNETİMİ (Local State) ---
  const addStage = () => {
    const newStage: StageConfigDto = {
      stageType: selectedStageType,
      order: form.stages.length + 1,
      presetId: selectedPresetId > 0 ? selectedPresetId : undefined,
    };
    setForm((prev) => ({ ...prev, stages: [...prev.stages, newStage] }));
    // Reset inputs
    setSelectedPresetId(0);
  };

  const removeStage = (index: number) => {
    const newStages = form.stages.filter((_, i) => i !== index);
    // Sıra numaralarını düzelt
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

    // Sıra numaralarını düzelt
    newStages.forEach((s, i) => (s.order = i + 1));
    setForm((prev) => ({ ...prev, stages: newStages }));
  };

  // --- SAVE ---
  const handleSave = async () => {
    if (!form.name.trim() || !form.conceptId) {
      toast.error("Ad ve Konsept zorunludur.");
      return;
    }
    if (form.stages.length === 0) {
      toast.error("En az bir aşama (Stage) eklemelisiniz.");
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
      loadData(); // Listeyi tazele
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

  return (
    <Page>
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden pt-2">
        {/* SOL: LİSTE (8 BİRİM) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col h-full min-h-0 gap-4">
          <div className="flex justify-between items-center gap-2 shrink-0">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="text-indigo-500" /> Üretim Şablonları
            </h1>
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
                      <TD className="font-medium text-zinc-200 py-3">
                        {item.name}
                      </TD>
                      <TD className="text-zinc-400 py-3 text-sm flex items-center gap-1">
                        <FolderOpen size={12} className="text-amber-500/70" />{" "}
                        {item.conceptName}
                      </TD>
                      <TD className="text-center text-zinc-500 text-xs py-3">
                        <Badge variant="neutral" className="scale-90">
                          {item.stageCount} Stage
                        </Badge>
                      </TD>
                      <TD className="text-right text-zinc-500 text-xs py-3 font-mono">
                        {new Date(item.createdAt).toLocaleDateString("tr-TR")}
                      </TD>
                    </TR>
                  ))}
                  {items.length === 0 && !loading && (
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
          </Card>
        </div>

        {/* === SAĞ: FORM (4 BİRİM) === */}
        <div className="col-span-12 lg:col-span-4 flex flex-col h-full min-h-0">
          <Card className="h-full flex flex-col overflow-hidden border-zinc-800 bg-zinc-900/60 backdrop-blur-xl p-0">
            <div className="flex justify-between items-center p-4 border-b border-zinc-800/50 shrink-0 bg-zinc-900/30">
              <h2 className="text-md font-bold text-white tracking-tight">
                {selectedId ? "Şablonu Düzenle" : "Yeni Şablon"}
              </h2>
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
                  <div className="pt-2 border-t border-zinc-800/50">
                    <Label className="mb-2 flex items-center justify-between">
                      <span>Pipeline Adımları</span>
                      <span className="text-[10px] text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                        {form.stages.length} Adım
                      </span>
                    </Label>

                    {/* Adım Ekleme Alanı */}
                    <div className="flex items-end gap-2 mb-4 p-2 rounded-xl bg-zinc-950/30 border border-zinc-800/50">
                      <div className="flex-1">
                        <Label className="text-[10px] mb-1">Tip</Label>
                        <Select
                          value={selectedStageType}
                          onChange={setSelectedStageType}
                          options={STAGE_TYPES}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="w-24">
                        <Label className="text-[10px] mb-1">Preset ID</Label>
                        <NumberInput
                          value={selectedPresetId}
                          onChange={setSelectedPresetId}
                          placeholder="ID"
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={addStage}
                        className="h-8 px-3 bg-indigo-600 hover:bg-indigo-500 text-white border-none"
                      >
                        <Plus size={14} />
                      </Button>
                    </div>

                    {/* Adım Listesi (Drag & Drop Simülasyonu) */}
                    <div className="space-y-2">
                      {form.stages.length === 0 && (
                        <div className="text-center py-8 text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-xl">
                          Henüz adım eklenmedi.
                        </div>
                      )}

                      {form.stages.map((stage, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2 rounded-lg border border-zinc-800 bg-zinc-900/80 group hover:border-zinc-700 transition-all"
                        >
                          <div className="flex flex-col items-center justify-center w-6 text-zinc-600 cursor-grab active:cursor-grabbing">
                            <GripVertical size={14} />
                            <span className="text-[9px] font-mono font-bold mt-0.5">
                              {idx + 1}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-zinc-200">
                                {STAGE_TYPES.find(
                                  (t) => t.value === stage.stageType
                                )?.label || stage.stageType}
                              </span>
                              {stage.presetId && (
                                <Badge
                                  variant="brand"
                                  className="text-[9px] py-0 h-4 px-1.5"
                                >
                                  Preset: #{stage.presetId}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1">
                            <div className="flex flex-col gap-0.5">
                              <button
                                onClick={() => moveStage(idx, "up")}
                                disabled={idx === 0}
                                className="p-0.5 text-zinc-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
                              >
                                <ArrowUp size={12} />
                              </button>
                              <button
                                onClick={() => moveStage(idx, "down")}
                                disabled={idx === form.stages.length - 1}
                                className="p-0.5 text-zinc-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
                              >
                                <ArrowDown size={12} />
                              </button>
                            </div>
                            <button
                              onClick={() => removeStage(idx)}
                              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded ml-1"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
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
                <Save size={14} className="mr-1.5" /> Kaydet
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Silinsin mi?"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-zinc-300">
            <b>"{form.name}"</b> şablonu silinecek.
          </p>
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
