import { useEffect, useState } from "react";
import { useDebounce } from "../hooks/useDebounce";
import {
  conceptsApi,
  type ConceptListDto,
  type SaveConceptDto,
} from "../api/concepts";
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
} from "../components/ui-kit";
import {
  Plus,
  Trash2,
  Save,
  Search,
  RefreshCw,
  X,
  Zap,
  FolderOpen,
  AlertTriangle,
} from "lucide-react";

// Varsayılan Form
const EMPTY_FORM: SaveConceptDto = {
  name: "",
  description: "",
};

export default function ConceptsPage() {
  // State
  const [items, setItems] = useState<ConceptListDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form, setForm] = useState<SaveConceptDto>(EMPTY_FORM);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Actions
  const loadList = async () => {
    setLoading(true);
    try {
      const data = await conceptsApi.list(debouncedSearch);
      setItems(data);
    } catch {
      toast.error("Konseptler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const handleSelect = async (id: number) => {
    if (id === selectedId) return;

    setSelectedId(id);
    setDetailLoading(true);
    try {
      const data = await conceptsApi.get(id);
      setForm({
        name: data.name,
        description: data.description ?? "",
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
    if (!form.name.trim()) {
      toast.error("Konsept adı zorunludur.");
      return;
    }

    setDetailLoading(true);
    try {
      if (selectedId) {
        await conceptsApi.update(selectedId, form);
        toast.success("Güncellendi.");
      } else {
        await conceptsApi.create(form);
        toast.success("Konsept oluşturuldu.");
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
      await conceptsApi.delete(selectedId);
      toast.success("Silindi.");
      setIsDeleteModalOpen(false);
      handleNew();
      loadList();
    } catch {
      toast.error("Silme başarısız. (Altında şablonlar olabilir)");
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
              <FolderOpen className="text-indigo-500" /> Konseptler & Markalar
            </h1>
            <div className="flex gap-2">
              <div className="relative w-64 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                <Input
                  placeholder="Konsept ara..."
                  className="pl-9 bg-zinc-900/50 border-zinc-800"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={loadList}
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
                <Plus size={18} className="mr-2" /> Yeni Konsept
              </Button>
            </div>
          </div>

          <Card className="flex-1 min-h-0 p-0 overflow-hidden flex flex-col border-zinc-800 bg-zinc-900/40">
            <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              <Table className="border-none w-full">
                <THead>
                  <TR className="bg-zinc-900/80 sticky top-0 z-10 backdrop-blur-md">
                    <TH className="text-zinc-400 font-medium">Konsept Adı</TH>
                    <TH className="text-zinc-400 font-medium hidden sm:table-cell">
                      Açıklama
                    </TH>
                    <TH className="text-zinc-400 font-medium text-right w-32">
                      Oluşturulma
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
                      <TD className="font-medium text-zinc-200 py-3 flex items-center gap-2">
                        <Zap size={14} className="text-amber-500" /> {item.name}
                      </TD>
                      <TD className="text-zinc-500 text-sm py-3 hidden sm:table-cell max-w-xs truncate">
                        {item.description || "-"}
                      </TD>
                      <TD className="text-right text-zinc-500 text-xs py-3 font-mono">
                        {new Date(item.createdAt).toLocaleDateString("tr-TR")}
                      </TD>
                    </TR>
                  ))}
                  {items.length === 0 && !loading && (
                    <TR>
                      <TD
                        colSpan={3}
                        className="text-center py-12 text-zinc-500 flex flex-col items-center justify-center gap-2"
                      >
                        <FolderOpen size={32} className="opacity-30" />
                        <span>Henüz bir konsept oluşturmadınız.</span>
                      </TD>
                    </TR>
                  )}
                </tbody>
              </Table>
            </div>
            <div className="p-2 border-t border-zinc-800 bg-zinc-900/50 text-xs text-zinc-500 text-center shrink-0">
              Toplam {items.length} konsept
            </div>
          </Card>
        </div>

        {/* SAĞ: FORM (4 BİRİM) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col h-full min-h-0">
          <Card className="h-full flex flex-col overflow-hidden border-zinc-800 bg-zinc-900/60 backdrop-blur-xl p-0">
            <div className="flex justify-between items-center p-4 border-b border-zinc-800/50 shrink-0 bg-zinc-900/30">
              <div className="flex items-center gap-2">
                <div
                  className={`w-1.5 h-6 rounded-full shadow-lg ${
                    selectedId ? "bg-indigo-500" : "bg-emerald-500"
                  }`}
                />
                <h2 className="text-md font-bold text-white tracking-tight">
                  {selectedId ? "Konsepti Düzenle" : "Yeni Konsept"}
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
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-1.5">
                        Konsept Adı <span className="text-indigo-400">*</span>
                      </Label>
                      <Input
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        placeholder="Örn: Tarih Kanalı, Korku Hikayeleri"
                        className="focus:border-indigo-500 bg-zinc-950/50 border-zinc-800 h-9 text-sm"
                        autoFocus
                      />
                    </div>

                    <div className="flex flex-col flex-1">
                      <Label className="mb-1.5">Açıklama / Notlar</Label>
                      <Textarea
                        className="flex-1 h-32 font-sans text-sm bg-zinc-950/50 border-zinc-800 focus:ring-indigo-500/20 focus:border-indigo-500 text-zinc-200 resize-none p-3"
                        value={form.description}
                        onChange={(e) =>
                          setForm({ ...form, description: e.target.value })
                        }
                        placeholder="Bu konseptin amacı nedir? Hangi kitleye hitap ediyor?"
                      />
                    </div>
                  </div>

                  {/* Bilgilendirme Kutusu */}
                  <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/50 text-xs text-zinc-400 leading-relaxed">
                    <p className="flex items-center gap-2 mb-1 text-zinc-300 font-medium">
                      <Zap size={14} className="text-amber-500" /> İpucu
                    </p>
                    Konseptler, oluşturacağınız video şablonlarını (Templates)
                    gruplamak için kullanılır. Örneğin "Tarih Videoları" altında
                    hem "Shorts" hem de "Uzun Video" şablonları
                    oluşturabilirsiniz.
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
        title="Konsept Silinsin mi?"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
            <AlertTriangle className="text-red-500 shrink-0" size={24} />
            <div className="text-sm text-zinc-300">
              <b>"{form.name}"</b> konsepti silinecek.
              <p className="text-xs text-red-400 mt-1 opacity-80">
                Bu konsepte bağlı tüm Şablonlar (Templates) ve Video Geçmişi de
                silinecektir!
              </p>
            </div>
          </div>
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
    </Page>
  );
}
