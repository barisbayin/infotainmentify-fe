import { useEffect, useState } from "react";
import { useDebounce } from "../hooks/useDebounce";
import { topicsApi, type TopicListDto, type SaveTopicDto } from "../api/topics";
import { conceptsApi } from "../api/concepts"; // 🔥 Konsept Servisi
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
} from "../components/ui-kit";
import {
  Plus,
  Trash2,
  Save,
  Search,
  RefreshCw,
  Lightbulb,
  Maximize2,
  Copy,
  FolderOpen,
} from "lucide-react";

// Varsayılan Form
const EMPTY_FORM: SaveTopicDto = {
  title: "",
  premise: "",
  languageCode: "tr-TR",
  conceptId: undefined,
  category: "",
  subCategory: "",
  series: "",
  tone: "",
  renderStyle: "",
  visualPromptHint: "",
  tagsJson: "",
};

export default function TopicsPage() {
  // --- STATE ---
  const [items, setItems] = useState<TopicListDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  // 🔥 KONSEPT FİLTRE STATE
  const [concepts, setConcepts] = useState<{ label: string; value: string }[]>(
    []
  );
  const [selectedConceptId, setSelectedConceptId] = useState<string>("");

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form, setForm] = useState<SaveTopicDto>(EMPTY_FORM);

  // Modals
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [previewModal, setPreviewModal] = useState<{
    title: string;
    content: string;
  } | null>(null);

  // --- INIT (Konseptleri Yükle) ---
  useEffect(() => {
    const fetchConcepts = async () => {
      try {
        const data = await conceptsApi.list();
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

  // --- ACTIONS ---
  const loadList = async () => {
    setLoading(true);
    try {
      // 🔥 GÜNCELLEME: selectedConceptId'yi 3. parametre olarak gönderiyoruz
      const data = await topicsApi.list(
        debouncedSearch,
        undefined, // category (şimdilik boş)
        selectedConceptId // <-- FİLTRE BURADA GİDİYOR
      );
      setItems(data);
    } catch {
      toast.error("Liste yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedConceptId]); // Filtre değişince tetikle

  const handleSelect = async (id: number) => {
    if (id === selectedId) return;
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const data = await topicsApi.get(id);
      setForm({
        title: data.title,
        premise: data.premise,
        languageCode: data.languageCode ?? "tr-TR",
        conceptId: data.conceptId ?? undefined,
        category: data.category ?? "",
        subCategory: data.subCategory ?? "",
        series: data.series ?? "",
        tone: data.tone ?? "",
        renderStyle: data.renderStyle ?? "",
        visualPromptHint: data.visualPromptHint ?? "",
        tagsJson: data.tagsJson ?? "",
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

  const handleSave = async () => {
    if (!form.title.trim() || !form.premise.trim()) {
      toast.error("Başlık ve Ana Fikir zorunludur.");
      return;
    }

    setDetailLoading(true);
    try {
      if (selectedId) {
        await topicsApi.update(selectedId, form);
        toast.success("Güncellendi.");
      } else {
        await topicsApi.create(form);
        toast.success("Fikir oluşturuldu.");
        handleNew();
      }
      loadList();
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
      await topicsApi.delete(selectedId);
      toast.success("Silindi.");
      setIsDeleteModalOpen(false);
      handleNew();
      loadList();
    } catch {
      toast.error("Silme başarısız.");
    } finally {
      setDetailLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Kopyalandı!");
  };

  return (
    <Page>
      {/* ANA GRID (8-4 Düzeni) */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden pt-2">
        {/* === SOL: LİSTE (8 BİRİM) === */}
        <div className="col-span-12 lg:col-span-8 flex flex-col h-full min-h-0 gap-4">
          <div className="flex justify-between items-center gap-2 shrink-0">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Lightbulb className="text-indigo-500" /> Fikir Havuzu
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                <Input
                  placeholder="Fikirlerde ara..."
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
              <Button
                onClick={handleNew}
                className="bg-indigo-600 hover:bg-indigo-500 text-white border-none shadow-lg px-4 h-10"
              >
                <Plus size={18} className="mr-2" /> Yeni Fikir
              </Button>
            </div>
          </div>

          <Card className="flex-1 min-h-0 p-0 overflow-hidden flex flex-col border-zinc-800 bg-zinc-900/40">
            <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              <Table className="border-none w-full">
                <THead>
                  <TR className="bg-zinc-900/80 sticky top-0 z-10 backdrop-blur-md">
                    <TH className="text-zinc-400 font-medium">Başlık</TH>
                    <TH className="text-zinc-400 font-medium">Kategori</TH>
                    <TH className="text-zinc-400 font-medium hidden md:table-cell">
                      Ana Fikir (Özet)
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
                        {item.category ? (
                          <Badge variant="neutral" className="scale-90">
                            {item.category}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TD>
                      <TD className="text-zinc-500 text-xs py-3 hidden md:table-cell max-w-xs truncate">
                        {item.premise}
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
                        className="text-center py-12 text-zinc-500 flex flex-col items-center justify-center gap-2"
                      >
                        <Lightbulb size={24} className="opacity-50" />
                        <span>Henüz bir fikir yok.</span>
                      </TD>
                    </TR>
                  )}
                </tbody>
              </Table>
            </div>
            <div className="p-2 border-t border-zinc-800 bg-zinc-900/50 text-xs text-zinc-500 text-center shrink-0">
              Toplam {items.length} fikir
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
                  {selectedId ? "Fikri Düzenle" : "Yeni Fikir"}
                </h2>
              </div>
              {selectedId && (
                <Badge variant="neutral" className="text-[10px]">
                  #{selectedId}
                </Badge>
              )}
            </div>

            {/* Form Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-zinc-700">
              {detailLoading ? (
                <div className="flex h-full items-center justify-center text-zinc-500 gap-2">
                  <RefreshCw className="animate-spin" /> Yükleniyor...
                </div>
              ) : (
                <>
                  {/* Başlık & Dil */}
                  <div className="space-y-4">
                    {/* Başlık & Konsept */}
                    <div className="grid grid-cols-3 gap-3">
                      {/* Konsept Seçimi (1 Birim) */}
                      <div>
                        <Label className="mb-1.5">Bağlı Konsept</Label>
                        <Select
                          value={form.conceptId?.toString() || ""}
                          onChange={(val) =>
                            setForm({ ...form, conceptId: Number(val) })
                          }
                          // Filter ile "Tümü" seçeneğini (value="") kaldırıyoruz, çünkü kayıtta boş olamaz (veya opsiyonel)
                          options={concepts.filter((c) => c.value !== "")}
                          placeholder="Seçiniz..."
                          className="bg-zinc-950/50 border-zinc-800 h-9 text-sm"
                        />
                      </div>

                      {/* Fikir Başlığı (2 Birim - Geniş) */}
                      <div className="col-span-2">
                        <Label className="mb-1.5">
                          Fikir Başlığı{" "}
                          <span className="text-indigo-400">*</span>
                        </Label>
                        <Input
                          value={form.title}
                          onChange={(e) =>
                            setForm({ ...form, title: e.target.value })
                          }
                          placeholder="Örn: Kedilerin Mırlama Sırrı"
                          className="focus:border-indigo-500 bg-zinc-900/50 border-zinc-800 h-9 text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1.5">Kategori</Label>
                        <Input
                          value={form.category}
                          onChange={(e) =>
                            setForm({ ...form, category: e.target.value })
                          }
                          placeholder="Bilim"
                          className="bg-zinc-950/50 border-zinc-800 h-9 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="mb-1.5">Dil</Label>
                        <Input
                          value={form.languageCode}
                          onChange={(e) =>
                            setForm({ ...form, languageCode: e.target.value })
                          }
                          className="bg-zinc-950/50 border-zinc-800 h-9 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ana Fikir (Expandable) */}
                  <div className="flex flex-col flex-1 min-h-[150px]">
                    <div className="flex justify-between items-center mb-1.5">
                      <Label>
                        Ana Fikir (Premise){" "}
                        <span className="text-indigo-400">*</span>
                      </Label>
                      <button
                        onClick={() =>
                          setPreviewModal({
                            title: "Ana Fikir",
                            content: form.premise,
                          })
                        }
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                      >
                        <Maximize2 size={12} /> Genişlet
                      </button>
                    </div>
                    <Textarea
                      className="flex-1 h-32 font-mono text-xs bg-zinc-950/50 border-zinc-800 focus:ring-indigo-500/20 focus:border-indigo-500 text-zinc-200 resize-none p-3"
                      value={form.premise}
                      onChange={(e) =>
                        setForm({ ...form, premise: e.target.value })
                      }
                      placeholder="Videonun temel konusu ne olacak? Detaylı açıklama..."
                    />
                  </div>

                  {/* Detaylar (Grid) */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800/50">
                    <div>
                      <Label className="mb-1.5">Alt Kategori</Label>
                      <Input
                        value={form.subCategory}
                        onChange={(e) =>
                          setForm({ ...form, subCategory: e.target.value })
                        }
                        className="bg-zinc-950/50 border-zinc-800 h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="mb-1.5">Seri Adı</Label>
                      <Input
                        value={form.series}
                        onChange={(e) =>
                          setForm({ ...form, series: e.target.value })
                        }
                        className="bg-zinc-950/50 border-zinc-800 h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="mb-1.5">Ton (Tone)</Label>
                      <Input
                        value={form.tone}
                        onChange={(e) =>
                          setForm({ ...form, tone: e.target.value })
                        }
                        className="bg-zinc-950/50 border-zinc-800 h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="mb-1.5">Görsel Stil</Label>
                      <Input
                        value={form.renderStyle}
                        onChange={(e) =>
                          setForm({ ...form, renderStyle: e.target.value })
                        }
                        className="bg-zinc-950/50 border-zinc-800 h-8 text-xs"
                      />
                    </div>
                  </div>

                  {/* Visual Prompt Hint */}
                  <div>
                    <Label className="mb-1.5">Görsel İpucu (AI Hint)</Label>
                    <Textarea
                      className="h-16 font-mono text-xs bg-zinc-950/50 border-zinc-800 resize-none"
                      value={form.visualPromptHint}
                      onChange={(e) =>
                        setForm({ ...form, visualPromptHint: e.target.value })
                      }
                      placeholder="AI görsel üretirken neye dikkat etsin?"
                    />
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
                  isLoading={detailLoading}
                  className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20 h-9 px-3 text-xs"
                >
                  <Trash2 size={14} className="mr-1.5" /> Sil
                </Button>
              )}
              <Button
                variant="primary"
                onClick={handleSave}
                isLoading={detailLoading}
                className="shadow-lg shadow-indigo-600/20 bg-indigo-600 hover:bg-indigo-500 text-white border-none h-9 px-4 text-xs"
              >
                <Save size={14} className="mr-1.5" />{" "}
                {selectedId ? "Kaydet" : "Oluştur"}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Silme Modalı */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Fikir Silinsin mi?"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-zinc-300">
            <b>"{form.title}"</b> başlıklı fikir silinecek.
          </p>
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              İptal
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              isLoading={detailLoading}
            >
              Evet, Sil
            </Button>
          </div>
        </div>
      </Modal>

      {/* Focus Mode Modalı */}
      <Modal
        isOpen={!!previewModal}
        onClose={() => setPreviewModal(null)}
        title={previewModal?.title}
        maxWidth="4xl"
      >
        <div className="flex flex-col gap-4">
          <div className="relative group">
            <div className="w-full h-[60vh] p-6 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-sm text-zinc-300 overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-words leading-relaxed shadow-inner">
              {previewModal?.content}
            </div>
            <button
              onClick={() => copyToClipboard(previewModal?.content || "")}
              className="absolute top-4 right-4 p-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-all border border-zinc-700 opacity-50 group-hover:opacity-100 backdrop-blur-sm"
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
