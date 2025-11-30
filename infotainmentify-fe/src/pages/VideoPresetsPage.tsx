import { useEffect, useState } from "react";
import { useDebounce } from "../hooks/useDebounce";
import {
  videoPresetsApi,
  type VideoPresetListDto,
  type SaveVideoPresetDto,
} from "../api/videoPresets";
import { aiConnectionsApi } from "../api/aiConnections";
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
  JsonInput,
} from "../components/ui-kit";
import {
  Plus,
  Trash2,
  Save,
  Search,
  RefreshCw,
  Clapperboard,
  Maximize2,
  Copy,
  Image as ImageIcon,
  Type,
  RectangleVertical,
  RectangleHorizontal,
  Square,
  Camera,
  Sliders,
} from "lucide-react";

const EMPTY_FORM: SaveVideoPresetDto = {
  name: "",
  userAiConnectionId: 0,
  modelName: "runway-gen-3-alpha",
  generationMode: 2, // 2 = ImageToVideo (Varsayılan)
  aspectRatio: "9:16",
  durationSeconds: 5,
  promptTemplate: "",
  negativePrompt: "",
  cameraControlSettingsJson: "",
  advancedSettingsJson: "",
};

const ASPECT_RATIOS = [
  { value: "9:16", label: "Shorts (9:16)", icon: RectangleVertical },
  { value: "16:9", label: "Yatay (16:9)", icon: RectangleHorizontal },
  { value: "1:1", label: "Kare (1:1)", icon: Square },
];

export default function VideoPresetsPage() {
  const [items, setItems] = useState<VideoPresetListDto[]>([]);
  const [connections, setConnections] = useState<
    { label: string; value: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form, setForm] = useState<SaveVideoPresetDto>(EMPTY_FORM);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [previewModal, setPreviewModal] = useState<{
    title: string;
    content: string;
  } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [presetsData, connectionsData] = await Promise.all([
        videoPresetsApi.list(),
        aiConnectionsApi.list(),
      ]);
      setItems(presetsData);
      setConnections(
        connectionsData.map((c) => ({
          label: `${c.name} (${c.provider})`,
          value: c.id.toString(),
        }))
      );
    } catch {
      toast.error("Veriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelect = async (id: number) => {
    if (id === selectedId) return;
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const data = await videoPresetsApi.get(id);
      setForm(data);
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
    if (!form.name.trim() || !form.promptTemplate.trim()) {
      toast.error("Ad ve Prompt Şablonu zorunludur.");
      return;
    }
    if (!form.userAiConnectionId) {
      toast.error("Lütfen bir AI Bağlantısı seçin.");
      return;
    }

    setDetailLoading(true);
    try {
      if (selectedId) {
        await videoPresetsApi.update(selectedId, form);
        toast.success("Güncellendi.");
      } else {
        await videoPresetsApi.create(form);
        toast.success("Oluşturuldu.");
        handleNew();
      }
      const list = await videoPresetsApi.list();
      setItems(list);
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
      await videoPresetsApi.delete(selectedId);
      toast.success("Silindi.");
      setIsDeleteModalOpen(false);
      handleNew();
      const list = await videoPresetsApi.list();
      setItems(list);
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

  const filteredItems = items.filter((i) =>
    i.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <Page>
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden pt-2">
        {/* SOL: LİSTE */}
        <div className="col-span-12 lg:col-span-8 flex flex-col h-full min-h-0 gap-4">
          <div className="flex justify-between items-center gap-2 shrink-0">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Clapperboard className="text-indigo-500" /> AI Video Ayarları
            </h1>
            <div className="flex gap-2 relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Preset ara..."
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
                <Plus size={18} className="mr-2" /> Yeni Ayar
              </Button>
            </div>
          </div>

          <Card className="flex-1 min-h-0 p-0 overflow-hidden flex flex-col border-zinc-800 bg-zinc-900/40">
            <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-700">
              <Table className="border-none w-full">
                <THead>
                  <TR className="bg-zinc-900/80 sticky top-0 z-10 backdrop-blur-md">
                    <TH className="text-zinc-400 font-medium">Preset Adı</TH>
                    <TH className="text-zinc-400 font-medium">Model</TH>
                    <TH className="text-zinc-400 font-medium text-center">
                      Mod
                    </TH>
                    <TH className="text-zinc-400 font-medium text-right">
                      Güncelleme
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
                      <TD className="text-zinc-400 py-3 text-sm">
                        {item.modelName}
                      </TD>
                      <TD className="text-center py-3">
                        {item.generationMode === "ImageToVideo" ? (
                          <Badge variant="brand" className="scale-90">
                            I2V
                          </Badge>
                        ) : (
                          <Badge variant="neutral" className="scale-90">
                            T2V
                          </Badge>
                        )}
                      </TD>
                      <TD className="text-right text-zinc-500 text-xs py-3 font-mono">
                        {item.updatedAt
                          ? new Date(item.updatedAt).toLocaleDateString("tr-TR")
                          : "-"}
                      </TD>
                    </TR>
                  ))}
                  {filteredItems.length === 0 && !loading && (
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
            <div className="p-2 border-t border-zinc-800 bg-zinc-900/50 text-xs text-zinc-500 text-center shrink-0">
              Toplam {filteredItems.length} kayıt
            </div>
          </Card>
        </div>

        {/* === SAĞ: FORM === */}
        <div className="col-span-12 lg:col-span-4 flex flex-col h-full min-h-0">
          <Card className="h-full flex flex-col overflow-hidden border-zinc-800 bg-zinc-900/60 backdrop-blur-xl p-0">
            <div className="flex justify-between items-center p-4 border-b border-zinc-800/50 shrink-0 bg-zinc-900/30">
              <h2 className="text-md font-bold text-white tracking-tight">
                {selectedId ? "AI Video Ayarı" : "Yeni Ayar"}
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
                  {/* İsim ve Connection */}
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-1.5">
                        Preset Adı <span className="text-indigo-400">*</span>
                      </Label>
                      <Input
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        className="bg-zinc-950/50 border-zinc-800 h-9 text-sm focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <Label className="mb-1.5">
                        AI Bağlantısı <span className="text-indigo-400">*</span>
                      </Label>
                      <Select
                        value={form.userAiConnectionId.toString()}
                        onChange={(val) =>
                          setForm({ ...form, userAiConnectionId: Number(val) })
                        }
                        options={connections}
                        placeholder="Bağlantı Seçiniz..."
                      />
                    </div>
                  </div>

                  {/* Model ve Süre */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="mb-1.5">Model</Label>
                      <Input
                        value={form.modelName}
                        onChange={(e) =>
                          setForm({ ...form, modelName: e.target.value })
                        }
                        className="bg-zinc-950/50 border-zinc-800 h-9 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="mb-1.5">Süre (sn)</Label>
                      <NumberInput
                        value={form.durationSeconds}
                        onChange={(v) =>
                          setForm({ ...form, durationSeconds: v })
                        }
                        min={1}
                        max={60}
                      />
                    </div>
                  </div>

                  {/* Generation Mode (Visual Selector) */}
                  <div>
                    <Label className="mb-2">Üretim Modu</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Image To Video */}
                      <div
                        onClick={() => setForm({ ...form, generationMode: 2 })}
                        className={`cursor-pointer flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                          form.generationMode === 2
                            ? "bg-indigo-500/10 border-indigo-500 text-indigo-400"
                            : "bg-zinc-950/30 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                        }`}
                      >
                        <ImageIcon size={16} />
                        <div className="flex flex-col">
                          <span className="text-xs font-medium">
                            Image-to-Video
                          </span>
                          <span className="text-[9px] opacity-70">
                            Resmi canlandırır
                          </span>
                        </div>
                      </div>
                      {/* Text To Video */}
                      <div
                        onClick={() => setForm({ ...form, generationMode: 1 })}
                        className={`cursor-pointer flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                          form.generationMode === 1
                            ? "bg-indigo-500/10 border-indigo-500 text-indigo-400"
                            : "bg-zinc-950/30 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                        }`}
                      >
                        <Type size={16} />
                        <div className="flex flex-col">
                          <span className="text-xs font-medium">
                            Text-to-Video
                          </span>
                          <span className="text-[9px] opacity-70">
                            Metinden üretir
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Aspect Ratio */}
                  <div>
                    <Label className="mb-2">En-Boy Oranı</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {ASPECT_RATIOS.map((r) => {
                        const isActive = form.aspectRatio === r.value;
                        return (
                          <div
                            key={r.value}
                            onClick={() =>
                              setForm({ ...form, aspectRatio: r.value })
                            }
                            className={`cursor-pointer flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                              isActive
                                ? "bg-indigo-500/10 border-indigo-500 text-indigo-400"
                                : "bg-zinc-950/30 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                            }`}
                          >
                            <r.icon size={18} />
                            <span className="text-[9px] mt-1">{r.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Prompt Template (Flex-1) */}
                  <div className="flex flex-col flex-1 min-h-[150px]">
                    <div className="flex justify-between items-center mb-1.5">
                      <Label>
                        Video Prompt Şablonu{" "}
                        <span className="text-indigo-400">*</span>
                      </Label>
                      <button
                        onClick={() =>
                          setPreviewModal({
                            title: "Prompt Şablonu",
                            content: form.promptTemplate,
                          })
                        }
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                      >
                        <Maximize2 size={12} /> Genişlet
                      </button>
                    </div>
                    <Textarea
                      className="flex-1 h-full w-full font-mono text-xs bg-zinc-950/50 border-zinc-800 focus:ring-indigo-500/20 focus:border-indigo-500 text-zinc-200 resize-none p-3"
                      value={form.promptTemplate}
                      onChange={(e) =>
                        setForm({ ...form, promptTemplate: e.target.value })
                      }
                      placeholder="Örn: Cinematic drone shot of {SceneDescription}, highly detailed..."
                    />
                  </div>

                  {/* Camera Controls (JSON) */}
                  <div>
                    <Label className="mb-1.5 flex items-center gap-1">
                      <Camera size={12} /> Kamera Kontrolü (JSON)
                    </Label>
                    <JsonInput
                      value={form.cameraControlSettingsJson || ""}
                      onChange={(v) =>
                        setForm({ ...form, cameraControlSettingsJson: v })
                      }
                      placeholder='{"zoom": 1, "pan_x": 0}'
                    />
                  </div>

                  {/* Advanced Settings (JSON) */}
                  <div>
                    <Label className="mb-1.5 flex items-center gap-1">
                      <Sliders size={12} /> Gelişmiş Ayarlar (JSON)
                    </Label>
                    <JsonInput
                      value={form.advancedSettingsJson || ""}
                      onChange={(v) =>
                        setForm({ ...form, advancedSettingsJson: v })
                      }
                      placeholder='{"motion_bucket": 127, "seed": 1234}'
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
        {/* Standart silme modal içeriği */}
        <div className="flex flex-col gap-4">
          <p className="text-sm text-zinc-300">
            <b>"{form.name}"</b> silinecek.
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

      <Modal
        isOpen={!!previewModal}
        onClose={() => setPreviewModal(null)}
        title={previewModal?.title}
        maxWidth="4xl"
      >
        <div className="flex flex-col gap-4">
          <div className="relative group">
            <div className="w-full h-[60vh] p-6 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-sm text-zinc-300 overflow-y-auto whitespace-pre-wrap break-words">
              {previewModal?.content}
            </div>
            <button
              onClick={() => copyToClipboard(previewModal?.content || "")}
              className="absolute top-4 right-4 p-2 bg-zinc-800/80 text-zinc-400 rounded-lg"
            >
              <Copy size={16} />
            </button>
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={() => setPreviewModal(null)}>
              Kapat
            </Button>
          </div>
        </div>
      </Modal>
    </Page>
  );
}
