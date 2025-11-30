import { useEffect, useState } from "react";
import { useDebounce } from "../hooks/useDebounce";
import {
  renderPresetsApi,
  type RenderPresetListDto,
  type SaveRenderPresetDto,
} from "../api/renderPresets";
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
  Film,
  Settings2,
  Type,
  Volume2,
  RectangleVertical,
  RectangleHorizontal,
  Square,
} from "lucide-react";

const EMPTY_FORM: SaveRenderPresetDto = {
  name: "",
  outputWidth: 1080,
  outputHeight: 1920,
  fps: 30,
  bitrateKbps: 6000,
  containerFormat: "mp4",
  captionSettings: {
    enableCaptions: true,
    fontName: "Arial-Bold",
    fontSize: 60,
    primaryColor: "#FFFFFF",
    outlineColor: "#000000",
    enableHighlight: true,
    highlightColor: "#FFFF00",
    maxWordsPerLine: 2,
  },
  audioMixSettings: {
    voiceVolumePercent: 100,
    musicVolumePercent: 20,
    enableDucking: true,
  },
};

const ASPECT_RATIOS = [
  {
    width: 1080,
    height: 1920,
    label: "Shorts (9:16)",
    icon: RectangleVertical,
  },
  { width: 1080, height: 1080, label: "Kare (1:1)", icon: Square },
  {
    width: 1920,
    height: 1080,
    label: "Yatay (16:9)",
    icon: RectangleHorizontal,
  },
];

export default function RenderPresetsPage() {
  const [items, setItems] = useState<RenderPresetListDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form, setForm] = useState<SaveRenderPresetDto>(EMPTY_FORM);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const loadList = async () => {
    setLoading(true);
    try {
      const data = await renderPresetsApi.list();
      setItems(data);
    } catch {
      toast.error("Yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, [debouncedSearch]);

  const handleSelect = async (id: number) => {
    if (id === selectedId) return;
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const data = await renderPresetsApi.get(id);
      // Nested objeleri bozmadan set et
      setForm({
        ...data,
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
    setDetailLoading(true);
    try {
      if (selectedId) {
        await renderPresetsApi.update(selectedId, form);
        toast.success("Güncellendi.");
      } else {
        await renderPresetsApi.create(form);
        toast.success("Oluşturuldu.");
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
      await renderPresetsApi.delete(selectedId);
      toast.success("Silindi.");
      setIsDeleteModalOpen(false);
      handleNew();
      loadList();
    } catch {
      toast.error("Hata.");
    } finally {
      setDetailLoading(false);
    }
  };

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
          ? "bg-indigo-500/10 border-indigo-500/30"
          : "bg-zinc-950/50 border-zinc-800"
      }`}
    >
      <span
        className={`text-xs font-medium ${
          checked ? "text-indigo-400" : "text-zinc-400"
        }`}
      >
        {label}
      </span>
      <div
        className={`w-8 h-4 rounded-full relative transition-colors ${
          checked ? "bg-indigo-500" : "bg-zinc-700"
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
              <Film className="text-indigo-500" /> Render Ayarları
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
                onClick={handleNew}
                className="bg-indigo-600 hover:bg-indigo-500 text-white border-none shadow-lg px-4"
              >
                <Plus size={18} className="mr-2" /> Yeni Ayar
              </Button>
            </div>
          </div>

          <Card className="flex-1 min-h-0 p-0 overflow-hidden flex flex-col border-zinc-800 bg-zinc-900/40">
            {/* Liste Tablosu */}
            <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-700">
              <Table className="border-none w-full">
                <THead>
                  <TR className="bg-zinc-900/80 sticky top-0 z-10 backdrop-blur-md">
                    <TH className="text-zinc-400 font-medium">Ad</TH>
                    <TH className="text-zinc-400 font-medium">Çözünürlük</TH>
                    <TH className="text-zinc-400 font-medium text-center">
                      FPS
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
                      <TD className="text-zinc-400 py-3 font-mono text-xs">
                        {item.outputWidth}x{item.outputHeight}
                      </TD>
                      <TD className="text-center text-zinc-500 text-xs py-3">
                        {item.fps}
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
                {selectedId ? "Render Ayarı" : "Yeni Ayar"}
              </h2>
              {selectedId && (
                <Badge variant="neutral" className="text-[10px]">
                  #{selectedId}
                </Badge>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-zinc-700">
              {detailLoading ? (
                <div className="text-center p-10 text-zinc-500">
                  Yükleniyor...
                </div>
              ) : (
                <>
                  {/* Genel */}
                  <div>
                    <Label className="mb-1.5">Ayar Adı</Label>
                    <Input
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      className="bg-zinc-950/50 border-zinc-800 h-9 text-sm"
                      placeholder="Örn: 1080p Shorts"
                    />
                  </div>

                  {/* Video Specs */}
                  <div>
                    <Label className="mb-2 flex items-center gap-1 text-zinc-400 border-b border-zinc-800 pb-1">
                      <Settings2 size={12} /> Video Formatı
                    </Label>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {ASPECT_RATIOS.map((r) => {
                        const isActive =
                          form.outputWidth === r.width &&
                          form.outputHeight === r.height;
                        return (
                          <div
                            key={r.label}
                            onClick={() =>
                              setForm({
                                ...form,
                                outputWidth: r.width,
                                outputHeight: r.height,
                              })
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

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1.5">FPS</Label>
                        <Select
                          value={form.fps.toString()}
                          onChange={(v) =>
                            setForm({ ...form, fps: parseInt(v) })
                          }
                          options={[
                            { value: "30", label: "30 FPS" },
                            { value: "60", label: "60 FPS" },
                          ]}
                        />
                      </div>
                      <div>
                        <Label className="mb-1.5">Bitrate (Kbps)</Label>
                        <NumberInput
                          value={form.bitrateKbps}
                          onChange={(v) => setForm({ ...form, bitrateKbps: v })}
                          step={500}
                          min={1000}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Altyazı */}
                  <div>
                    <Label className="mb-2 flex items-center gap-1 text-zinc-400 border-b border-zinc-800 pb-1">
                      <Type size={12} /> Altyazı Stili
                    </Label>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <Toggle
                        label="Altyazı Aktif"
                        checked={form.captionSettings.enableCaptions}
                        onChange={(v) =>
                          setForm({
                            ...form,
                            captionSettings: {
                              ...form.captionSettings,
                              enableCaptions: v,
                            },
                          })
                        }
                      />
                      <Toggle
                        label="Vurgu (Karaoke)"
                        checked={form.captionSettings.enableHighlight}
                        onChange={(v) =>
                          setForm({
                            ...form,
                            captionSettings: {
                              ...form.captionSettings,
                              enableHighlight: v,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <Label className="mb-1">Font Boyutu</Label>
                        <NumberInput
                          value={form.captionSettings.fontSize}
                          onChange={(v) =>
                            setForm({
                              ...form,
                              captionSettings: {
                                ...form.captionSettings,
                                fontSize: v,
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label className="mb-1">Satır Başına Kelime</Label>
                        <NumberInput
                          value={form.captionSettings.maxWordsPerLine}
                          onChange={(v) =>
                            setForm({
                              ...form,
                              captionSettings: {
                                ...form.captionSettings,
                                maxWordsPerLine: v,
                              },
                            })
                          }
                          min={1}
                          max={5}
                        />
                      </div>
                    </div>
                    {/* Renk Seçiciler (HTML Color Input) */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="mb-1 text-[10px]">Ana Renk</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={form.captionSettings.primaryColor}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                captionSettings: {
                                  ...form.captionSettings,
                                  primaryColor: e.target.value,
                                },
                              })
                            }
                            className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                          />
                          <span className="text-[10px] font-mono text-zinc-500">
                            {form.captionSettings.primaryColor}
                          </span>
                        </div>
                      </div>
                      <div>
                        <Label className="mb-1 text-[10px]">Kenarlık</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={form.captionSettings.outlineColor}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                captionSettings: {
                                  ...form.captionSettings,
                                  outlineColor: e.target.value,
                                },
                              })
                            }
                            className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="mb-1 text-[10px]">Vurgu</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={form.captionSettings.highlightColor}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                captionSettings: {
                                  ...form.captionSettings,
                                  highlightColor: e.target.value,
                                },
                              })
                            }
                            className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Audio */}
                  <div>
                    <Label className="mb-2 flex items-center gap-1 text-zinc-400 border-b border-zinc-800 pb-1">
                      <Volume2 size={12} /> Ses Miksajı
                    </Label>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-zinc-400">
                            Ses Sesi (Voice)
                          </span>{" "}
                          <span className="text-zinc-200">
                            {form.audioMixSettings.voiceVolumePercent}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="200"
                          value={form.audioMixSettings.voiceVolumePercent}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              audioMixSettings: {
                                ...form.audioMixSettings,
                                voiceVolumePercent: parseInt(e.target.value),
                              },
                            })
                          }
                          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-zinc-400">Müzik Sesi</span>{" "}
                          <span className="text-zinc-200">
                            {form.audioMixSettings.musicVolumePercent}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={form.audioMixSettings.musicVolumePercent}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              audioMixSettings: {
                                ...form.audioMixSettings,
                                musicVolumePercent: parseInt(e.target.value),
                              },
                            })
                          }
                          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>
                      <Toggle
                        label="Ducking (Konuşurken Müziği Kıs)"
                        checked={form.audioMixSettings.enableDucking}
                        onChange={(v) =>
                          setForm({
                            ...form,
                            audioMixSettings: {
                              ...form.audioMixSettings,
                              enableDucking: v,
                            },
                          })
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

      {/* Silme Modalı */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Silinsin mi?"
      >
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
    </Page>
  );
}
