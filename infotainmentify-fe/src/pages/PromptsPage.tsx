import { useEffect, useState } from "react";
import { useDebounce } from "../hooks/useDebounce";
import {
  promptsApi,
  type PromptListDto,
  type SavePromptDto,
} from "../api/prompts";
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
  FileText,
  Maximize2,
  Copy,
} from "lucide-react";

const EMPTY_FORM: SavePromptDto = {
  name: "",
  category: "",
  language: "tr-TR",
  isActive: true,
  body: "",
  systemPrompt: "",
  description: "",
};

export default function PromptsPage() {
  const [items, setItems] = useState<PromptListDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form, setForm] = useState<SavePromptDto>(EMPTY_FORM);

  // Modals
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [previewModal, setPreviewModal] = useState<{
    title: string;
    content: string;
  } | null>(null);

  const loadList = async () => {
    setLoading(true);
    try {
      const data = await promptsApi.list(debouncedSearch);
      setItems(data);
    } catch (error) {
      toast.error("Liste yüklenemedi");
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
      const data = await promptsApi.get(id);
      setForm({
        name: data.name,
        category: data.category ?? "",
        language: data.language ?? "tr-TR",
        description: data.description ?? "", // 🔥 BURASI VARDI AMA INPUT YOKTU
        isActive: data.isActive,
        body: data.body,
        systemPrompt: data.systemPrompt ?? "",
      });
    } catch (error) {
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
    if (!form.name.trim() || !form.body.trim()) {
      toast.error("İsim ve Prompt zorunludur.");
      return;
    }

    setDetailLoading(true);
    try {
      if (selectedId) {
        await promptsApi.update(selectedId, form);
        toast.success("Güncellendi.");
      } else {
        await promptsApi.create(form);
        toast.success("Oluşturuldu.");
        handleNew();
      }
      loadList();
    } catch (error) {
      toast.error("İşlem başarısız.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeleteClick = () => setIsDeleteModalOpen(true);

  const confirmDelete = async () => {
    if (!selectedId) return;
    setDetailLoading(true);
    try {
      await promptsApi.delete(selectedId);
      toast.success("Silindi.");
      setIsDeleteModalOpen(false);
      handleNew();
      loadList();
    } catch (error) {
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
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden pt-2">
        {/* SOL: LİSTE */}
        <div className="col-span-12 lg:col-span-8 flex flex-col h-full min-h-0 gap-4">
          <div className="flex gap-2 shrink-0">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
              <Input
                placeholder="Ara..."
                className="pl-9 bg-zinc-900/50 border-zinc-800 focus:border-indigo-500"
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
              <RefreshCw className={loading ? "animate-spin" : ""} size={18} />
            </Button>
            <Button
              onClick={handleNew}
              className="bg-indigo-600 hover:bg-indigo-500 text-white border-none shadow-lg shadow-indigo-500/20 px-4 whitespace-nowrap"
            >
              <Plus size={18} className="mr-2" /> Yeni
            </Button>
          </div>

          <Card className="flex-1 min-h-0 p-0 overflow-hidden flex flex-col border-zinc-800 bg-zinc-900/40">
            <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              <Table className="border-none w-full">
                <THead>
                  <TR className="bg-zinc-900/80 sticky top-0 z-10 backdrop-blur-md">
                    <TH className="text-zinc-400 font-medium">Ad</TH>
                    <TH className="text-zinc-400 font-medium hidden sm:table-cell">
                      Kategori
                    </TH>
                    <TH className="text-zinc-400 font-medium">Dil</TH>
                    <TH className="text-zinc-400 font-medium hidden md:table-cell">
                      Açıklama
                    </TH>
                    <TH className="text-zinc-400 font-medium text-center w-24">
                      Durum
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
                        }
                        ${!item.isActive ? "opacity-70" : ""}`}
                    >
                      <TD className="font-medium text-zinc-200 py-3">
                        {item.name}
                      </TD>
                      <TD className="text-zinc-400 py-3 hidden sm:table-cell">
                        {item.category || "-"}
                      </TD>
                      <TD className="text-zinc-500 text-xs py-3">
                        {item.language}
                      </TD>
                      <TD className="text-zinc-500 text-xs py-3 hidden md:table-cell max-w-xs truncate">
                        {item.description || "..."}
                      </TD>
                      <TD className="text-center py-3">
                        <Badge
                          variant={item.isActive ? "success" : "error"}
                          className="scale-90"
                        >
                          {item.isActive ? "Aktif" : "Pasif"}
                        </Badge>
                      </TD>
                    </TR>
                  ))}
                  {items.length === 0 && !loading && (
                    <TR>
                      <TD
                        colSpan={5}
                        className="text-center py-12 text-zinc-500 flex flex-col items-center justify-center gap-2"
                      >
                        <FileText size={24} className="opacity-50" />
                        <span>Kayıt bulunamadı.</span>
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

        {/* SAĞ: FORM */}
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
                  {selectedId ? "Düzenle" : "Yeni"}
                </h2>
              </div>
              {selectedId && (
                <Badge variant="neutral" className="text-[10px]">
                  #{selectedId}
                </Badge>
              )}
            </div>

            {/* Form Body: Scrollable & Flex */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 scrollbar-thin scrollbar-thumb-zinc-700">
              {detailLoading ? (
                <div className="flex h-full items-center justify-center text-zinc-500 gap-2">
                  <RefreshCw className="animate-spin" /> Yükleniyor...
                </div>
              ) : (
                <>
                  {/* 1. SATIR: AD (Tam Genişlik) */}
                  <div>
                    <Label className="mb-1.5">
                      Prompt Adı <span className="text-indigo-400">*</span>
                    </Label>
                    <Input
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="Örn: Viral YouTube Intro"
                      className="focus:border-indigo-500 bg-zinc-950/50 border-zinc-800 h-9 text-sm"
                    />
                  </div>

                  {/* 2. SATIR: KATEGORİ - DİL - DURUM (3 Eşit Kolon) */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="mb-1.5">Kategori</Label>
                      <Input
                        value={form.category}
                        onChange={(e) =>
                          setForm({ ...form, category: e.target.value })
                        }
                        placeholder="Script"
                        className="bg-zinc-950/50 border-zinc-800 h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="mb-1.5">Dil</Label>
                      <Input
                        value={form.language}
                        onChange={(e) =>
                          setForm({ ...form, language: e.target.value })
                        }
                        className="bg-zinc-950/50 border-zinc-800 h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="mb-1.5">Durum</Label>
                      <div
                        onClick={() =>
                          setForm({ ...form, isActive: !form.isActive })
                        }
                        className={`flex items-center justify-between w-full h-9 px-2 rounded-xl border cursor-pointer transition-all select-none ${
                          form.isActive
                            ? "bg-emerald-500/10 border-emerald-500/30"
                            : "bg-rose-500/10 border-rose-500/30"
                        }`}
                      >
                        <span
                          className={`text-xs font-medium ${
                            form.isActive ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {form.isActive ? "Aktif" : "Pasif"}
                        </span>
                        <div
                          className={`w-8 h-4 rounded-full relative transition-colors ${
                            form.isActive ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${
                              form.isActive ? "left-4.5" : "left-0.5"
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-1.5">Açıklama</Label>
                    <Input
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                      placeholder="Bu prompt ne işe yarar? (Opsiyonel)"
                      className="bg-zinc-950/50 border-zinc-800 h-9 text-sm"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <Label>System Prompt (Rol)</Label>
                      <button
                        onClick={() =>
                          setPreviewModal({
                            title: "System Prompt (Rol Tanımı)",
                            content: form.systemPrompt || "",
                          })
                        }
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                      >
                        <Maximize2 size={12} /> Genişlet
                      </button>
                    </div>
                    <Textarea
                      className="h-20 font-mono text-[11px] leading-tight bg-zinc-950/50 border-zinc-800 resize-none focus:border-indigo-500/50 text-zinc-300"
                      value={form.systemPrompt}
                      onChange={(e) =>
                        setForm({ ...form, systemPrompt: e.target.value })
                      }
                      placeholder='Örn: "Sen profesyonel bir senaristsin..."'
                    />
                  </div>

                  {/* 🔥 FLEX-1 İLE KALAN ALANI DOLDURAN KISIM */}
                  <div className="flex flex-col flex-1 min-h-[200px]">
                    <div className="flex justify-between items-center mb-1.5">
                      <Label>
                        Prompt İçeriği{" "}
                        <span className="text-indigo-400">*</span>
                      </Label>
                      <button
                        onClick={() =>
                          setPreviewModal({
                            title: "Prompt İçeriği",
                            content: form.body,
                          })
                        }
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                      >
                        <Maximize2 size={12} /> Genişlet
                      </button>
                    </div>
                    <Textarea
                      // 🔥 h-full ve resize-none sayesinde kapsayıcıyı (flex-1) doldurur
                      className="flex-1 h-full w-full font-mono text-xs bg-zinc-950/50 border-zinc-800 focus:ring-indigo-500/20 focus:border-indigo-500 text-zinc-200 resize-none p-3"
                      value={form.body}
                      onChange={(e) =>
                        setForm({ ...form, body: e.target.value })
                      }
                      placeholder="Kullanıcıdan gelen input buraya nasıl işlenecek..."
                    />
                  </div>
                </>
              )}
            </div>

            {/* Footer Buttons */}
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
                  onClick={handleDeleteClick}
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

      {/* SİLME MODALI */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Prompt Silinsin mi?"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-zinc-300">
            <b>#{selectedId}</b> numaralı kayıt kalıcı olarak silinecektir.
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

      {/* İÇERİK MODALI */}
      <Modal
        isOpen={!!previewModal}
        onClose={() => setPreviewModal(null)}
        title={previewModal?.title}
        maxWidth="4xl"
      >
        <div className="flex flex-col gap-4">
          <div className="relative group">
            <div
              className="
                w-full h-[60vh] p-6 bg-zinc-950 border border-zinc-800 rounded-xl 
                font-mono text-sm text-zinc-300 overflow-y-auto overflow-x-hidden 
                whitespace-pre-wrap break-words leading-relaxed shadow-inner selection:bg-indigo-500/30
            "
            >
              {previewModal?.content}
            </div>
            <button
              onClick={() => copyToClipboard(previewModal?.content || "")}
              className="absolute top-4 right-4 p-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-all border border-zinc-700 opacity-50 group-hover:opacity-100 backdrop-blur-sm"
              title="Panoya Kopyala"
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
