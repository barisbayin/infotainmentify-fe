import { useEffect, useState } from "react";
import { useDebounce } from "../hooks/useDebounce";
import {
  ttsPresetsApi,
  type TtsPresetListDto,
  type SaveTtsPresetDto,
} from "../api/ttsPresets";
import { aiConnectionsApi } from "../api/aiConnections";
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
  NumberInput,
} from "../components/ui-kit";
import {
  Plus,
  Trash2,
  Save,
  Search,
  RefreshCw,
  Mic2,
  Volume2,
  Activity,
  Zap,
} from "lucide-react";

const EMPTY_FORM: SaveTtsPresetDto = {
  name: "",
  userAiConnectionId: 0,
  voiceId: "",
  languageCode: "tr-TR",
  engineModel: "",
  speakingRate: 1.0,
  pitch: 0.0,
  stability: 0.5,
  clarity: 0.75,
  styleExaggeration: 0.0,
};

export default function TtsPresetsPage() {
  const [items, setItems] = useState<TtsPresetListDto[]>([]);
  const [connections, setConnections] = useState<
    { label: string; value: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form, setForm] = useState<SaveTtsPresetDto>(EMPTY_FORM);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [presetsData, connectionsData] = await Promise.all([
        ttsPresetsApi.list(),
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
      const data = await ttsPresetsApi.get(id);
      setForm({
        name: data.name,
        userAiConnectionId: data.userAiConnectionId,
        voiceId: data.voiceId,
        languageCode: data.languageCode,
        engineModel: data.engineModel ?? "",
        speakingRate: data.speakingRate,
        pitch: data.pitch,
        stability: data.stability,
        clarity: data.clarity,
        styleExaggeration: data.styleExaggeration,
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
    if (!form.name.trim() || !form.voiceId.trim()) {
      toast.error("Ad ve Ses ID zorunludur.");
      return;
    }
    if (!form.userAiConnectionId) {
      toast.error("Lütfen bir AI Bağlantısı seçin.");
      return;
    }

    setDetailLoading(true);
    try {
      if (selectedId) {
        await ttsPresetsApi.update(selectedId, form);
        toast.success("Güncellendi.");
      } else {
        await ttsPresetsApi.create(form);
        toast.success("Oluşturuldu.");
        handleNew();
      }
      const list = await ttsPresetsApi.list();
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
      await ttsPresetsApi.delete(selectedId);
      toast.success("Silindi.");
      setIsDeleteModalOpen(false);
      handleNew();
      const list = await ttsPresetsApi.list();
      setItems(list);
    } catch {
      toast.error("Silme başarısız.");
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredItems = items.filter((i) =>
    i.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <Page>
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden pt-2">
        {/* SOL: LİSTE (8 BİRİM) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col h-full min-h-0 gap-4">
          <div className="flex justify-between items-center gap-2 shrink-0">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Mic2 className="text-indigo-500" /> Ses Ayarları (TTS)
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
            <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              <Table className="border-none w-full">
                <THead>
                  <TR className="bg-zinc-900/80 sticky top-0 z-10 backdrop-blur-md">
                    <TH className="text-zinc-400 font-medium">Preset Adı</TH>
                    <TH className="text-zinc-400 font-medium">Voice ID</TH>
                    <TH className="text-zinc-400 font-medium">Dil</TH>
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
                      <TD className="text-zinc-400 py-3 text-sm font-mono text-indigo-400">
                        {item.voiceId}
                      </TD>
                      <TD className="text-zinc-400 py-3">
                        {item.languageCode}
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

        {/* === SAĞ: FORM (4 BİRİM) === */}
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
                  {selectedId ? "Ses Ayarları" : "Yeni Ayar"}
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
                        placeholder="Örn: Google Tr-A Hızlı"
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

                  {/* Voice Config */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label className="mb-1.5">
                        Voice ID / İsim{" "}
                        <span className="text-indigo-400">*</span>
                      </Label>
                      <Input
                        value={form.voiceId}
                        onChange={(e) =>
                          setForm({ ...form, voiceId: e.target.value })
                        }
                        className="bg-zinc-950/50 border-zinc-800 h-9 text-sm font-mono"
                        placeholder="Örn: tr-TR-Standard-A"
                      />
                    </div>
                    <div>
                      <Label className="mb-1.5">Dil Kodu</Label>
                      <Input
                        value={form.languageCode}
                        onChange={(e) =>
                          setForm({ ...form, languageCode: e.target.value })
                        }
                        className="bg-zinc-950/50 border-zinc-800 h-9 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="mb-1.5">Model (Opsiyonel)</Label>
                      <Input
                        value={form.engineModel || ""}
                        onChange={(e) =>
                          setForm({ ...form, engineModel: e.target.value })
                        }
                        className="bg-zinc-950/50 border-zinc-800 h-9 text-xs"
                        placeholder="eleven_multilingual_v2"
                      />
                    </div>
                  </div>

                  {/* Google / Standart Ayarlar */}
                  <div>
                    <Label className="mb-2 flex items-center gap-1 text-zinc-400 border-b border-zinc-800 pb-1">
                      <Volume2 size={12} /> Temel Ayarlar (Google/Azure)
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1.5">Hız (Rate)</Label>
                        <NumberInput
                          value={form.speakingRate}
                          onChange={(v) =>
                            setForm({ ...form, speakingRate: v })
                          }
                          min={0.25}
                          max={4.0}
                          step={0.05}
                        />
                      </div>
                      <div>
                        <Label className="mb-1.5">Ton (Pitch)</Label>
                        <NumberInput
                          value={form.pitch}
                          onChange={(v) => setForm({ ...form, pitch: v })}
                          min={-20}
                          max={20}
                          step={0.5}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ElevenLabs Ayarları */}
                  <div>
                    <Label className="mb-2 flex items-center gap-1 text-zinc-400 border-b border-zinc-800 pb-1">
                      <Activity size={12} /> ElevenLabs Ayarları
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1.5">Stability</Label>
                        <NumberInput
                          value={form.stability}
                          onChange={(v) => setForm({ ...form, stability: v })}
                          min={0}
                          max={1}
                          step={0.05}
                        />
                      </div>
                      <div>
                        <Label className="mb-1.5">Clarity</Label>
                        <NumberInput
                          value={form.clarity}
                          onChange={(v) => setForm({ ...form, clarity: v })}
                          min={0}
                          max={1}
                          step={0.05}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="mb-1.5">Style Exaggeration</Label>
                        <NumberInput
                          value={form.styleExaggeration}
                          onChange={(v) =>
                            setForm({ ...form, styleExaggeration: v })
                          }
                          min={0}
                          max={1}
                          step={0.05}
                        />
                      </div>
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

      {/* Modals */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Silinsin mi?"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-zinc-300">
            <b>"{form.name}"</b> preseti silinecek.
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
    </Page>
  );
}
