import { useEffect, useState } from "react";
import { useDebounce } from "../hooks/useDebounce";
import {
  sttPresetsApi,
  type SttPresetListDto,
  type SaveSttPresetDto,
} from "../api/sttPresets";
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
} from "../components/ui-kit";
import {
  Plus,
  Trash2,
  Save,
  Search,
  RefreshCw,
  Mic,
  FileAudio,
  Captions,
} from "lucide-react";

const EMPTY_FORM: SaveSttPresetDto = {
  name: "",
  userAiConnectionId: 0,
  modelName: "whisper-1",
  languageCode: "auto",
  enableWordLevelTimestamps: true, // Karaoke için varsayılan açık
  enableSpeakerDiarization: false,
  outputFormat: "json",
  prompt: "",
  temperature: 0.0,
  filterProfanity: false,
};

export default function SttPresetsPage() {
  const [items, setItems] = useState<SttPresetListDto[]>([]);
  const [connections, setConnections] = useState<
    { label: string; value: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form, setForm] = useState<SaveSttPresetDto>(EMPTY_FORM);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [presetsData, connectionsData] = await Promise.all([
        sttPresetsApi.list(),
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
      const data = await sttPresetsApi.get(id);
      setForm({
        ...data,
        prompt: data.prompt ?? "",
      });
    } catch {
      toast.error("Detay yüklenemedi");
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
      toast.error("Ad zorunludur.");
      return;
    }
    if (!form.userAiConnectionId) {
      toast.error("AI Bağlantısı seçin.");
      return;
    }

    setDetailLoading(true);
    try {
      if (selectedId) {
        await sttPresetsApi.update(selectedId, form);
        toast.success("Güncellendi.");
      } else {
        await sttPresetsApi.create(form);
        toast.success("Oluşturuldu.");
        handleNew();
      }
      const list = await sttPresetsApi.list();
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
      await sttPresetsApi.delete(selectedId);
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

  const filteredItems = items.filter((i) =>
    i.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  // Helper Toggle
  const Toggle = ({
    label,
    checked,
    onChange,
  }: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <div
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between w-full h-9 px-2 rounded-xl border cursor-pointer select-none ${
        checked
          ? "bg-emerald-500/10 border-emerald-500/30"
          : "bg-zinc-950/50 border-zinc-800"
      }`}
    >
      <span
        className={`text-xs font-medium ${
          checked ? "text-emerald-400" : "text-zinc-400"
        }`}
      >
        {label}
      </span>
      <div
        className={`w-8 h-4 rounded-full relative transition-colors ${
          checked ? "bg-emerald-500" : "bg-zinc-700"
        }`}
      >
        <div
          className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${
            checked ? "left-4.5" : "left-0.5"
          }`}
        />
      </div>
    </div>
  );

  return (
    <Page>
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden pt-2">
        {/* SOL: LİSTE */}
        <div className="col-span-12 lg:col-span-8 flex flex-col h-full min-h-0 gap-4">
          <div className="flex justify-between items-center gap-2 shrink-0">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Mic className="text-indigo-500" /> STT Ayarları (Whisper)
            </h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={loadData}
                className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800"
              >
                <RefreshCw size={18} />
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
                      className={`cursor-pointer border-b border-zinc-800/50 hover:bg-zinc-800/40 ${
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
                </tbody>
              </Table>
            </div>
          </Card>
        </div>

        {/* SAĞ: FORM */}
        <div className="col-span-12 lg:col-span-4 flex flex-col h-full min-h-0">
          <Card className="h-full flex flex-col overflow-hidden border-zinc-800 bg-zinc-900/60 backdrop-blur-xl p-0">
            <div className="flex justify-between items-center p-4 border-b border-zinc-800/50 shrink-0 bg-zinc-900/30">
              <h2 className="text-md font-bold text-white tracking-tight">
                {selectedId ? "STT Ayarı" : "Yeni Ayar"}
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
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-1.5">Preset Adı</Label>
                      <Input
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        className="bg-zinc-950/50 border-zinc-800 h-9 text-sm focus:border-indigo-500"
                        placeholder="Örn: Whisper Karaoke"
                      />
                    </div>
                    <div>
                      <Label className="mb-1.5">AI Bağlantısı</Label>
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
                      <Label className="mb-1.5">Dil Kodu</Label>
                      <Input
                        value={form.languageCode}
                        onChange={(e) =>
                          setForm({ ...form, languageCode: e.target.value })
                        }
                        className="bg-zinc-950/50 border-zinc-800 h-9 text-xs"
                        placeholder="auto"
                      />
                    </div>
                  </div>

                  {/* Advanced Features */}
                  <div>
                    <Label className="mb-2 flex items-center gap-1 text-zinc-400 border-b border-zinc-800 pb-1">
                      <Captions size={12} /> Gelişmiş Özellikler
                    </Label>
                    <div className="grid grid-cols-1 gap-3 mb-3">
                      <div className="flex flex-col gap-1">
                        <Label className="text-[10px] text-zinc-500">
                          Kelime Zamanlaması (Karaoke İçin Şart)
                        </Label>
                        <Toggle
                          label="Word-Level Timestamps"
                          checked={form.enableWordLevelTimestamps}
                          onChange={(v) =>
                            setForm({ ...form, enableWordLevelTimestamps: v })
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-[10px] text-zinc-500">
                          Konuşmacı Ayrımı (Diarization)
                        </Label>
                        <Toggle
                          label="Speaker Diarization"
                          checked={form.enableSpeakerDiarization}
                          onChange={(v) =>
                            setForm({ ...form, enableSpeakerDiarization: v })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-1.5">İpucu (Prompt)</Label>
                    <Textarea
                      className="h-20 font-mono text-xs bg-zinc-950/50 border-zinc-800 resize-none text-zinc-300"
                      value={form.prompt}
                      onChange={(e) =>
                        setForm({ ...form, prompt: e.target.value })
                      }
                      placeholder="Özel isimler, terimler..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="mb-1.5">Sıcaklık (Temp)</Label>
                      <NumberInput
                        value={form.temperature}
                        onChange={(v) => setForm({ ...form, temperature: v })}
                        min={0}
                        max={1}
                        step={0.1}
                      />
                    </div>
                    <div>
                      <Label className="mb-1.5">Küfür Filtresi</Label>
                      <Toggle
                        label="Filtrele"
                        checked={form.filterProfanity}
                        onChange={(v) =>
                          setForm({ ...form, filterProfanity: v })
                        }
                      />
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
            <b>"{form.name}"</b> preseti silinecek.
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
