import { useEffect, useState, useMemo } from "react";
import { useDebounce } from "../hooks/useDebounce";
import {
  scriptsApi,
  type ScriptListDto,
  type SaveScriptDto,
} from "../api/scripts";
import { conceptsApi } from "../api/concepts"; // 🔥 KONSEPT SERVİSİ EKLENDİ
import toast from "react-hot-toast";
import {
  Page,
  Card,
  Button,
  Input,
  Textarea,
  Badge,
  Table,
  THead,
  TR,
  TH,
  TD,
  Modal,
  JsonInput,
  Select,
  CodeViewer,
} from "../components/ui-kit";
import {
  Trash2,
  Save,
  Search,
  RefreshCw,
  BookOpen,
  Maximize2,
  Copy,
  Timer,
  Database,
  Globe,
  Clapperboard,
  FileText,
  LayoutList,
  Code,
} from "lucide-react";

const EMPTY_FORM: SaveScriptDto = {
  title: "",
  content: "",
  languageCode: "tr-TR",
  estimatedDurationSec: 0,
  scenesJson: "",
  topicId: undefined,
  description: "",
  tags: "",
};

type TabType = "text" | "scenes" | "raw";

export default function ScriptsPage() {
  // --- STATE ---
  const [items, setItems] = useState<ScriptListDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  // 🔥 KONSEPT FİLTRE STATE
  const [concepts, setConcepts] = useState<{ label: string; value: string }[]>(
    []
  );
  const [selectedConceptId, setSelectedConceptId] = useState<string>("");

  // Detay & Form
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form, setForm] = useState<SaveScriptDto>(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState<TabType>("text");

  // Modals
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [previewModal, setPreviewModal] = useState<{
    title: string;
    content: string;
  } | null>(null);

  // --- PARSED SCENES (Görselleştirme için) ---
  const parsedScenes = useMemo(() => {
    try {
      return form.scenesJson ? JSON.parse(form.scenesJson) : [];
    } catch {
      return null;
    }
  }, [form.scenesJson]);

  // --- ACTIONS ---

  // 1. Konseptleri Yükle (Sayfa açılışında 1 kere)
  useEffect(() => {
    const fetchConcepts = async () => {
      try {
        const data = await conceptsApi.list();
        // Dropdown formatına çevir ve başına "Tümü" ekle
        setConcepts([
          { label: "Tüm Konseptler", value: "" },
          ...data.map((c) => ({ label: c.name, value: c.id.toString() })),
        ]);
      } catch (err) {
        console.error("Konseptler yüklenemedi", err);
      }
    };
    fetchConcepts();
  }, []);

  // 2. Listeyi Yükle (Arama veya Filtre değişince)
  const loadList = async () => {
    setLoading(true);
    try {
      // 🔥 DÜZELTME: Parametreleri API'ye paslıyoruz
      const data = await scriptsApi.list(
        debouncedSearch, // q (Arama)
        undefined, // topicId (Şimdilik filtre yok, null geçiyoruz)
        selectedConceptId ? Number(selectedConceptId) : undefined // conceptId (Varsa gönder)
      );
      setItems(data);
    } catch {
      toast.error("Senaryolar yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedConceptId]); // Filtre değişince tetikle

  useEffect(() => {
    handleNew(); // Seçimi kaldırır, formu temizler (EMPTY_FORM basar)
  }, [selectedConceptId]);

  // Detay Getir
  const handleSelect = async (id: number) => {
    if (id === selectedId) return;
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const data = await scriptsApi.get(id);

      // 🔥 JSON FORMATLAMA MANTIĞI
      let prettyScenes = data.scenesJson ?? "";
      try {
        if (prettyScenes) {
          const parsed = JSON.parse(prettyScenes);
          prettyScenes = JSON.stringify(parsed, null, 2); // 2 boşluklu indent
        }
      } catch {
        /* Hatalıysa olduğu gibi kalsın */
      }

      setForm({
        title: data.title,
        content: data.content,
        languageCode: data.languageCode,
        estimatedDurationSec: data.estimatedDurationSec,
        scenesJson: prettyScenes, // 🔥 Formatlanmış hali
        topicId: data.topicId,
        description: data.description || "",
        tags: data.tags || "",
      });
      setActiveTab("text");
    } catch {
      toast.error("Detay yüklenemedi.");
    } finally {
      setDetailLoading(false);
    }
  };

  // Kaydet
  const handleSave = async () => {
    if (!selectedId) return;
    setDetailLoading(true);
    try {
      await scriptsApi.update(selectedId, form);
      toast.success("Senaryo güncellendi.");
      loadList();
    } catch {
      toast.error("Güncelleme başarısız.");
    } finally {
      setDetailLoading(false);
    }
  };

  // Sil
  const confirmDelete = async () => {
    if (!selectedId) return;
    setDetailLoading(true);
    try {
      await scriptsApi.delete(selectedId);
      toast.success("Silindi.");
      setIsDeleteModalOpen(false);
      setSelectedId(null);
      setForm(EMPTY_FORM);
      loadList();
    } catch {
      toast.error("Silme başarısız.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleNew = () => {
    setSelectedId(null);
    setForm(EMPTY_FORM);
    setActiveTab("text"); // Tab'i de varsayılana döndür
  };



  return (
    <Page>
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden pt-2">
        {/* === SOL: LİSTE PANELİ (8 BİRİM) === */}
        <div className="col-span-12 lg:col-span-8 flex flex-col h-full min-h-0 gap-4">
          <div className="flex justify-between items-center gap-2 shrink-0">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="text-indigo-500" /> Senaryo Havuzu
            </h1>

            <div className="flex gap-2">
              {/* 🔥 KONSEPT FİLTRESİ */}
              <div className="w-48">
                <Select
                  value={selectedConceptId}
                  onChange={setSelectedConceptId}
                  options={concepts}
                  placeholder="Konsept Filtrele"
                  className="h-10 text-xs bg-zinc-900/50 border-zinc-800"
                />
              </div>

              <div className="relative w-64 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  placeholder="Senaryo ara..."
                  className="pl-9 bg-zinc-900/50 border-zinc-800 h-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={loadList}
                className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 h-10 w-10"
              >
                <RefreshCw
                  className={loading ? "animate-spin" : ""}
                  size={18}
                />
              </Button>
            </div>
          </div>

          <Card className="flex-1 min-h-0 p-0 overflow-hidden flex flex-col border-zinc-800 bg-zinc-900/40">
            <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              <Table className="border-none w-full">
                <THead>
                  <TR className="bg-zinc-900/80 sticky top-0 z-10 backdrop-blur-md">
                    <TH className="text-zinc-400 font-medium">Başlık</TH>
                    <TH className="text-zinc-400 font-medium">Topic</TH>
                    <TH className="text-zinc-400 font-medium text-center">
                      Süre
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
                        {item.title}
                      </TD>
                      <TD className="text-zinc-400 py-3 text-sm">
                        {item.topicTitle !== "-" ? (
                          <span className="flex items-center gap-1.5 text-indigo-400/90">
                            <Database size={12} /> {item.topicTitle}
                          </span>
                        ) : (
                          <span className="text-zinc-600 opacity-50">-</span>
                        )}
                      </TD>
                      <TD className="text-center text-zinc-500 text-xs py-3 font-mono">
                        {item.estimatedDurationSec > 0
                          ? `${item.estimatedDurationSec}s`
                          : "-"}
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
                        className="text-center py-16 text-zinc-500 flex flex-col items-center justify-center gap-2"
                      >
                        <BookOpen size={32} className="opacity-20" />
                        <span>Henüz senaryo yok.</span>
                      </TD>
                    </TR>
                  )}
                </tbody>
              </Table>
            </div>
            <div className="p-2 border-t border-zinc-800 bg-zinc-900/50 text-xs text-zinc-500 text-center shrink-0">
              Toplam {items.length} kayıt
            </div>
          </Card>
        </div>

        {/* === SAĞ: İNCELEME PANELİ (4 BİRİM) === */}
        <div className="col-span-12 lg:col-span-4 flex flex-col h-full min-h-0">
          <Card className="h-full flex flex-col overflow-hidden border-zinc-800 bg-zinc-900/60 backdrop-blur-xl p-0">
            {selectedId ? (
              <>
                {/* Header & Metadata */}
                <div className="p-5 border-b border-zinc-800/50 shrink-0 bg-zinc-900/30 space-y-4">
                  {/* Başlık Input */}
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 mb-1 block">
                      Senaryo Başlığı
                    </label>
                    <Input
                      value={form.title}
                      onChange={(e) =>
                        setForm({ ...form, title: e.target.value })
                      }
                      className="bg-transparent border-transparent hover:border-zinc-700 focus:bg-zinc-950 focus:border-indigo-500 text-lg font-bold text-white px-0 h-auto py-1 transition-all"
                    />
                  </div>

                  {/* Video Açıklaması */}
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 mb-1 block">
                      Video Açıklaması
                    </label>
                    <Textarea
                      value={form.description || ""}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                      rows={2}
                      className="bg-transparent border-transparent hover:border-zinc-700 focus:bg-zinc-950 focus:border-indigo-500 text-sm text-zinc-300 px-2 min-h-0 py-2 transition-all resize-none"
                    />
                  </div>

                  {/* Etiketler */}
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 mb-1 block">
                      Etiketler
                    </label>
                    <Input
                      value={form.tags || ""}
                      onChange={(e) => setForm({ ...form, tags: e.target.value })}
                      className="bg-transparent border-transparent hover:border-zinc-700 focus:bg-zinc-950 focus:border-indigo-500 text-xs font-mono text-indigo-300 px-2 h-8 transition-all"
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>

                  {/* Chips */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950/50 border border-zinc-800">
                      <Globe size={14} className="text-zinc-400" />
                      <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-500 uppercase">
                          Dil
                        </span>
                        <span className="text-xs font-mono text-zinc-300">
                          {form.languageCode}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950/50 border border-zinc-800">
                      <Timer size={14} className="text-zinc-400" />
                      <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-500 uppercase">
                          Süre
                        </span>
                        <span className="text-xs font-mono text-zinc-300">
                          {form.estimatedDurationSec} sn
                        </span>
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center gap-2 p-2 rounded-lg bg-indigo-500/5 border border-indigo-500/20">
                      <Database size={14} className="text-indigo-400" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[10px] text-indigo-400/70 uppercase">
                          Kaynak Topic ID
                        </span>
                        <span className="text-xs font-mono text-indigo-300 truncate">
                          #{form.topicId || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* TABS */}
                  <div className="flex p-1 bg-zinc-950 rounded-lg border border-zinc-800">
                    <button
                      onClick={() => setActiveTab("text")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                        activeTab === "text"
                          ? "bg-zinc-800 text-white shadow-sm"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      <FileText size={14} /> Metin
                    </button>
                    <button
                      onClick={() => setActiveTab("scenes")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                        activeTab === "scenes"
                          ? "bg-zinc-800 text-white shadow-sm"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      <Clapperboard size={14} /> Sahneler
                    </button>
                    <button
                      onClick={() => setActiveTab("raw")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                        activeTab === "raw"
                          ? "bg-zinc-800 text-white shadow-sm"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      <Code size={14} /> JSON
                    </button>
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-zinc-950/30 p-4 scrollbar-thin scrollbar-thumb-zinc-700 relative">
                  {detailLoading ? (
                    <div className="flex h-full items-center justify-center text-zinc-500 gap-2">
                      <RefreshCw className="animate-spin" /> Yükleniyor...
                    </div>
                  ) : (
                    <>
                      {/* TEXT TAB */}
                      {activeTab === "text" && (
                        <div className="h-full flex flex-col">
                          <div className="flex justify-between mb-2">
                            <label className="text-xs font-medium text-zinc-500">
                              Tam Metin
                            </label>
                            <button
                              onClick={() =>
                                setPreviewModal({
                                  title: "Senaryo",
                                  content: form.content,
                                })
                              }
                              className="text-xs text-indigo-400 hover:text-indigo-300 flex gap-1"
                            >
                              <Maximize2 size={12} /> Genişlet
                            </button>
                          </div>
                          <Textarea
                            value={form.content}
                            onChange={(e) =>
                              setForm({ ...form, content: e.target.value })
                            }
                            className="flex-1 resize-none bg-zinc-950 border-zinc-800 focus:ring-indigo-500/20 font-serif text-sm leading-relaxed p-4"
                          />
                        </div>
                      )}

                      {/* SCENES TAB (FIXED) */}
                      {activeTab === "scenes" && (
                        <div className="space-y-3">
                          {Array.isArray(parsedScenes) &&
                          parsedScenes.length > 0 ? (
                            parsedScenes.map((scene: any, idx: number) => (
                              <div
                                key={idx}
                                className="p-3 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700 transition-colors"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <Badge
                                    variant="neutral"
                                    className="text-[10px]"
                                  >
                                    Sahne{" "}
                                    {scene.scene || scene.Scene || idx + 1}
                                  </Badge>
                                  {(scene.duration || scene.Duration) && (
                                    <span className="text-[10px] text-zinc-500 font-mono">
                                      {scene.duration || scene.Duration}s
                                    </span>
                                  )}
                                </div>

                                {/* 🔥 SES METNİ DÜZELTME */}
                                <div className="text-xs text-zinc-300 mb-2 font-medium">
                                  <span className="text-indigo-400 mr-1">
                                    🔊
                                  </span>
                                  {scene.audio ||
                                    scene.Audio ||
                                    scene.audioText ||
                                    scene.AudioText ||
                                    "Ses yok"}
                                </div>

                                {/* 🔥 GÖRSEL PROMPT DÜZELTME */}
                                <div className="text-[11px] text-zinc-500 italic bg-zinc-950/50 p-2 rounded border border-zinc-800/50">
                                  <span className="text-emerald-500/70 mr-1">
                                    🖼️
                                  </span>
                                  {scene.visual ||
                                    scene.Visual ||
                                    scene.visualPrompt ||
                                    scene.VisualPrompt ||
                                    "Görsel tanımı yok"}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="flex flex-col items-center justify-center h-40 text-zinc-500 text-xs">
                              <LayoutList
                                size={24}
                                className="mb-2 opacity-50"
                              />
                              Görselleştirilecek sahne verisi bulunamadı. JSON'ı
                              kontrol edin.
                            </div>
                          )}
                        </div>
                      )}

                      {/* TAB 3: RAW JSON */}
                      {activeTab === "raw" && (
                        <div className="h-full flex flex-col min-h-0">
                          {" "}
                          {/* min-h-0 önemli */}
                          <div className="flex justify-between mb-2 shrink-0">
                            <label className="text-xs font-medium text-zinc-500">
                              Scenes JSON (Düzenle)
                            </label>
                            <button
                              onClick={() =>
                                setPreviewModal({
                                  title: "Sahne JSON",
                                  content: form.scenesJson || "",
                                })
                              }
                              className="text-xs text-indigo-400 hover:text-indigo-300 flex gap-1"
                            >
                              <Maximize2 size={12} /> Genişlet
                            </button>
                          </div>
                          {/* 🔥 JSON INPUT ARTIK TAM BOY */}
                          <JsonInput
                            value={form.scenesJson || ""}
                            onChange={(val) =>
                              setForm({ ...form, scenesJson: val })
                            }
                            placeholder="[]"
                            className="flex-1 h-full"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/80 backdrop-blur flex justify-between items-center shrink-0">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setIsDeleteModalOpen(true)}
                    isLoading={detailLoading}
                    className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20 h-9 px-3 text-xs"
                  >
                    <Trash2 size={14} className="mr-1.5" /> Sil
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    isLoading={detailLoading}
                    className="shadow-lg shadow-indigo-600/20 bg-indigo-600 hover:bg-indigo-500 text-white border-none h-9 px-4 text-xs"
                  >
                    <Save size={14} className="mr-1.5" /> Değişiklikleri Kaydet
                  </Button>
                </div>
              </>
            ) : (
              // Empty State
              <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-3 p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-inner">
                  <BookOpen size={32} className="opacity-20" />
                </div>
                <p className="text-sm font-medium">Bir senaryo seçin</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modallar (Silme & Preview) Aynı */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Silinsin mi?"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-zinc-300">Geri alınamaz işlem.</p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              İptal
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Evet
            </Button>
          </div>
        </div>
      </Modal>

      {/* FOCUS MODE MODALI */}
      <Modal
        isOpen={!!previewModal}
        onClose={() => setPreviewModal(null)}
        title={previewModal?.title}
        maxWidth="4xl"
      >
        <div className="flex flex-col gap-4">
          <div className="relative h-[60vh]">
            {" "}
            {/* Yükseklik burada verilmeli */}
            {/* 🔥 ESKİ DIV YERİNE BU GELDİ */}
            <CodeViewer value={previewModal?.content || ""} />
            {/* Kopyala Butonu */}
            {/* Kopyala Butonu (Her zaman görünür, sağ üstte asılı) */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(previewModal?.content || "");
                toast.success("Panoya kopyalandı!"); // Toast mesajını garantiye al
              }}
              className="absolute top-4 right-4 p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-colors border border-zinc-700 z-50 shadow-lg"
              title="Kopyala"
            >
              <Copy size={16} />
            </button>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              variant="secondary"
              onClick={() => setPreviewModal(null)}
              className="min-w-[100px]"
            >
              Kapat
            </Button>
          </div>
        </div>
      </Modal>
    </Page>
  );
}
