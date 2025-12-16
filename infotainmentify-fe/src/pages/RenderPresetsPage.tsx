import { useEffect, useState } from "react";
import { useDebounce } from "../hooks/useDebounce";
import {
  renderPresetsApi,
  type RenderPresetListDto,
  type SaveRenderPresetDto,
} from "../api/renderPresets";
import { assetsApi, type AssetListDto } from "../api/assets";
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
  RectangleVertical,
  RectangleHorizontal,
  Square,
  Wand2,       // Visual
  Music,       // Audio
  Stamp,       // Brand
  Monitor,     // Tech
  Image as ImageIcon,
  Loader2,
} from "lucide-react";

const EMPTY_FORM: SaveRenderPresetDto = {
  name: "",
  outputWidth: 1080,
  outputHeight: 1920,
  fps: 30,
  bitrateKbps: 6000,
  encoderPreset: "fast",
  containerFormat: "mp4",
  captionSettings: {
    enableCaptions: true,
    styleName: "Modern",
    fontName: "Inter-Bold",
    fontSize: 55,
    primaryColor: "#FFFFFF",
    outlineColor: "#000000",
    outlineSize: 4,
    enableHighlight: true,
    highlightColor: "#FBBF24",
    animation: "Typewriter",
    position: "Bottom",
    marginBottom: 200,
    maxWordsPerLine: 2,
    uppercase: true,
  },
  audioMixSettings: {
    voiceVolumePercent: 100,
    musicVolumePercent: 25,
    sfxVolumePercent: 75,
    enableDucking: true,
    duckingFactor: 30,
    fadeAudioInOut: true,
    fadeDurationSec: 0.5,
  },
  visualEffectsSettings: {
    enableKenBurns: true,
    zoomIntensity: 1.15,
    transitionType: "crossfade",
    transitionDurationSec: 0.5,
    colorFilter: "None",
  },
  brandingSettings: {
    enableWatermark: false,
    watermarkText: "",
    watermarkImagePath: "",
    watermarkColor: "#ffffff",
    opacity: 0.5,
    position: "TopRight",
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

// Helper Component: Toggle
const Toggle = ({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  description?: string;
}) => (
  <div
    onClick={() => onChange(!checked)}
    className={`flex items-center justify-between w-full p-3 rounded-xl border cursor-pointer select-none transition-all ${
      checked
        ? "bg-indigo-500/10 border-indigo-500/30"
        : "bg-zinc-950/30 border-zinc-800 hover:border-zinc-700"
    }`}
  >
    <div className="flex flex-col gap-0.5">
      <span
          className={`text-xs font-medium ${
          checked ? "text-indigo-400" : "text-zinc-300"
          }`}
      >
          {label}
      </span>
      {description && <span className="text-[10px] text-zinc-500">{description}</span>}
    </div>
    
    <div
      className={`w-9 h-5 rounded-full relative transition-colors ${
        checked ? "bg-indigo-500" : "bg-zinc-700"
      }`}
    >
      <div
        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
          checked ? "translate-x-4.5 left-[2px]" : "translate-x-0.5"
        }`}
        style={{ transform: checked ? "translateX(16px)" : "translateX(2px)" }}
      />
    </div>
  </div>
);

// Helper Component: Color Picker
const ColorPicker = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (c: string) => void;
}) => (
    <div className="flex flex-col gap-1.5">
        <span className="text-[10px] uppercase text-zinc-500 font-medium tracking-wider">{label}</span>
        <div className="flex items-center gap-2 bg-zinc-950/30 border border-zinc-800 rounded-lg p-1.5 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
            <input
                type="color"
                value={value || "#000000"}
                onChange={(e) => onChange(e.target.value)}
                className="w-6 h-6 rounded cursor-pointer bg-transparent border-none p-0 overflow-hidden"
            />
            <span className="text-xs font-mono text-zinc-400 uppercase flex-1">{value}</span>
        </div>
    </div>
);

export default function RenderPresetsPage() {
  const [items, setItems] = useState<RenderPresetListDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form, setForm] = useState<SaveRenderPresetDto>(EMPTY_FORM);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [assetList, setAssetList] = useState<AssetListDto[]>([]);
  const [assetLoading, setAssetLoading] = useState(false);

  // Asset Loader
  const loadAssets = async () => {
      setAssetLoading(true);
      try {
          const data = await assetsApi.list("Branding");
          setAssetList(data);
      } catch {
          toast.error("Görseller yüklenemedi.");
      } finally {
          setAssetLoading(false);
      }
  };

  useEffect(() => {
      if(isAssetModalOpen) {
          loadAssets();
      }
  }, [isAssetModalOpen]);

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
      
      // Remove ID and Audit fields for SaveDto compatibility
      const { id: _id, createdAt: _c, updatedAt: _u, ...restData } = data;

      // Nested objeleri bozmadan set et
      setForm({
        ...EMPTY_FORM,
        ...restData,
        captionSettings: {
          ...EMPTY_FORM.captionSettings,
          ...(restData.captionSettings || {}),
        },
        audioMixSettings: {
          ...EMPTY_FORM.audioMixSettings,
          ...(restData.audioMixSettings || {}),
        },
        visualEffectsSettings: {
          ...EMPTY_FORM.visualEffectsSettings,
          ...(restData.visualEffectsSettings || {}),
        },
        brandingSettings: {
          ...EMPTY_FORM.brandingSettings,
          ...(restData.brandingSettings || {}),
        },
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

  // --- FORM TABS ---
  const [activeTab, setActiveTab] = useState<"video" | "caption" | "audio" | "visual" | "brand">("video");



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

          <div className="px-0 pb-2">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                <Input 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Ara..." 
                    className="pl-9 h-9 bg-zinc-900/50 border-zinc-800 text-xs w-full focus:bg-zinc-900 transition-colors"
                />
            </div>
          </div>

          <Card className="flex-1 min-h-0 p-0 overflow-hidden flex flex-col border-zinc-800 bg-zinc-900/40">
            {/* Liste Tablosu */}
            <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-700">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-2">
                    <RefreshCw className="animate-spin text-zinc-600" size={24} />
                    <span className="text-xs">Yükleniyor...</span>
                </div>
              ) : (
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
              )}
            </div>
          </Card>
        </div>

        {/* SAĞ: FORM */}
        <div className="col-span-12 lg:col-span-4 flex flex-col h-full min-h-0">
          <Card className="h-full flex flex-col overflow-hidden border-zinc-800 bg-zinc-900/60 backdrop-blur-xl p-0">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-zinc-800/50 shrink-0 bg-zinc-900/30">
                <div className="flex flex-col">
                     <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                        {selectedId ? <Settings2 size={16} className="text-indigo-400"/> : <Plus size={16} className="text-emerald-400"/>}
                        {selectedId ? "Ayarları Düzenle" : "Yeni Render Ayarı"}
                    </h2>
                    <span className="text-[10px] text-zinc-500 mt-0.5">
                        {selectedId ? `#${selectedId} ID'li preset düzenleniyor` : "Sıfırdan preset oluşturuluyor"}
                    </span>
                </div>
              {selectedId && (
                <Badge variant="neutral" className="bg-zinc-800/50 border-zinc-700/50 text-[10px] font-mono opacity-60">
                  ID: {selectedId}
                </Badge>
              )}
            </div>

            {/* TAB NAVIGATION */}
            <div className="flex items-center gap-1 p-2 border-b border-zinc-800/50 bg-zinc-900/20 overflow-x-auto scrollbar-none">
                {[
                    { id: "video", label: "Video", icon: Monitor },
                    { id: "caption", label: "Altyazı", icon: Type },
                    { id: "audio", label: "Ses", icon: Music },
                    { id: "visual", label: "Efekt", icon: Wand2 },
                    { id: "brand", label: "Marka", icon: Stamp },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                            activeTab === tab.id 
                                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25" 
                                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                        }`}
                    >
                        <tab.icon size={13} /> {tab.label}
                    </button>
                ))}
            </div>


            {/* Content Scroller */}
            <div className={`flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-zinc-700 ${detailLoading ? "opacity-50 pointer-events-none grayscale" : ""}`}>
              {detailLoading && !form.name ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-3">
                    <RefreshCw className="animate-spin text-indigo-500" size={24} />
                    <span className="text-xs">Veriler Yükleniyor...</span>
                </div>
              ) : (
                <>
                  {/* Common: Ad */}
                  <div>
                    <Label className="mb-1.5">Preset Adı</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="bg-zinc-950/50 border-zinc-800 h-10 text-sm focus:border-indigo-500/50"
                      placeholder="Örn: Instagram Reels (1080p)"
                      autoFocus={!selectedId}
                    />
                  </div>

                  {/* -------------------- VIDEO TAB -------------------- */}
                  {activeTab === "video" && (
                     <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Aspect Ratio Grid */}
                        <div>
                            <Label className="mb-2">Çözünürlük & Format</Label>
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                {ASPECT_RATIOS.map((r) => {
                                    const isActive = form.outputWidth === r.width && form.outputHeight === r.height;
                                    return (
                                    <div
                                        key={r.label}
                                        onClick={() => setForm({ ...form, outputWidth: r.width, outputHeight: r.height })}
                                        className={`cursor-pointer flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                                        isActive
                                            ? "bg-indigo-500/10 border-indigo-500 text-indigo-400 ring-1 ring-indigo-500/20"
                                            : "bg-zinc-950/30 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                                        }`}
                                    >
                                        <r.icon size={20} className="mb-2 opacity-80" />
                                        <span className="text-[10px] font-medium">{r.label}</span>
                                        <span className="text-[9px] opacity-50 mt-0.5">{r.width}x{r.height}</span>
                                    </div>
                                    );
                                })}
                            </div>
                        </div>
                        
                        {/* FPS & Bitrate */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>FPS</Label>
                                <Select
                                    value={form.fps.toString()}
                                    onChange={(v) => setForm({ ...form, fps: parseInt(v) })}
                                    options={[
                                        { value: "24", label: "24 FPS (Sinematik)" },
                                        { value: "30", label: "30 FPS (Standart)" },
                                        { value: "60", label: "60 FPS (Akıcı)" },
                                    ]}
                                    className="h-10 text-xs"
                                />
                            </div>
                            <div>
                                <Label>Bitrate (Kbps)</Label>
                                <NumberInput
                                    value={form.bitrateKbps}
                                    onChange={(v) => setForm({ ...form, bitrateKbps: v })}
                                    step={500}
                                    min={1000}
                                    placeholder="6000"
                                    className="h-10"
                                />
                            </div>
                        </div>

                         {/* Encoder & Container */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Encoder Hızı</Label>
                                <Select
                                    value={form.encoderPreset}
                                    onChange={(v) => setForm({ ...form, encoderPreset: v })}
                                    options={[
                                        { value: "ultrafast", label: "Ultra Fast (En Hızlı)" },
                                        { value: "fast", label: "Fast (Dengeli)" },
                                        { value: "medium", label: "Medium (Kaliteli)" },
                                        { value: "slow", label: "Slow (En İyi Kalite)" },
                                    ]}
                                    className="h-10 text-xs"
                                />
                            </div>
                            <div>
                                <Label>Dosya Formatı</Label>
                                <Select
                                    value={form.containerFormat}
                                    onChange={(v) => setForm({ ...form, containerFormat: v })}
                                    options={[
                                        { value: "mp4", label: "MP4 (H.264)" },
                                        { value: "mov", label: "MOV (QuickTime)" },
                                        { value: "mkv", label: "MKV" },
                                    ]}
                                    className="h-10 text-xs"
                                />
                            </div>
                        </div>
                     </div>
                  )}

                  {/* -------------------- CAPTION TAB -------------------- */}
                  {activeTab === "caption" && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Toggle
                            label="Altyazıları Etkinleştir"
                            description="Videoya otomatik oluşturulan altyazıları göm."
                            checked={form.captionSettings.enableCaptions}
                            onChange={(v) => setForm({ ...form, captionSettings: { ...form.captionSettings, enableCaptions: v } })}
                        />

                        {form.captionSettings.enableCaptions && (
                            <>
                                 <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Stil Şablonu</Label>
                                        <Select
                                            value={form.captionSettings.styleName}
                                            onChange={(v) => setForm({ ...form, captionSettings: { ...form.captionSettings, styleName: v } })}
                                            options={[
                                                { value: "Modern", label: "Modern" },
                                                { value: "Classic", label: "Klasik" },
                                                { value: "Bold", label: "Kalın" },
                                                { value: "Minimal", label: "Minimal" },
                                            ]}
                                            className="h-10 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <Label>Animasyon</Label>
                                        <Select
                                            value={form.captionSettings.animation}
                                            onChange={(v) => setForm({ ...form, captionSettings: { ...form.captionSettings, animation: v } })}
                                            options={[
                                                { value: "None", label: "Yok (Sabit)" },
                                                { value: "PopUp", label: "Pop Up" },
                                                { value: "Typewriter", label: "Typewriter" },
                                                { value: "SlideUp", label: "Slide Up" },
                                                { value: "WordByWord", label: "Word by Word" },
                                            ]}
                                            className="h-10 text-xs"
                                        />
                                    </div>
                                 </div>

                                 <div className="grid grid-cols-2 gap-4">
                                     <div>
                                         <Label>Yazı Fontu</Label>
                                          <Input
                                            value={form.captionSettings.fontName}
                                            onChange={(e) => setForm({ ...form, captionSettings: { ...form.captionSettings, fontName: e.target.value } })}
                                            className="h-10 text-xs bg-zinc-950/50 border-zinc-800 focus:border-indigo-500/50"
                                            placeholder="Font adı (örn: Inter-Bold)"
                                        />
                                     </div>
                                     <div className="flex gap-2">
                                          <div className="flex-1">
                                             <Label>Boyut</Label>
                                             <NumberInput value={form.captionSettings.fontSize} onChange={v => setForm({...form, captionSettings: {...form.captionSettings, fontSize: v}})} min={10} max={200} />
                                          </div>
                                          <div className="flex-1">
                                             <Label>Kenarlık</Label>
                                             <NumberInput value={form.captionSettings.outlineSize} onChange={v => setForm({...form, captionSettings: {...form.captionSettings, outlineSize: v}})} min={0} max={20} />
                                          </div>
                                     </div>
                                 </div>

                                 <div className="grid grid-cols-3 gap-3">
                                     <ColorPicker label="Ana Renk" value={form.captionSettings.primaryColor} onChange={c => setForm({...form, captionSettings: {...form.captionSettings, primaryColor: c}})} />
                                     <ColorPicker label="Kenarlık" value={form.captionSettings.outlineColor} onChange={c => setForm({...form, captionSettings: {...form.captionSettings, outlineColor: c}})} />
                                     <div className={!form.captionSettings.enableHighlight ? "opacity-30 pointer-events-none" : ""}>
                                         <ColorPicker label="Vurgu" value={form.captionSettings.highlightColor} onChange={c => setForm({...form, captionSettings: {...form.captionSettings, highlightColor: c}})} />
                                     </div>
                                 </div>

                                 <div className="grid grid-cols-2 gap-3 mt-2">
                                     <Toggle label="Karaoke Vurgusu" checked={form.captionSettings.enableHighlight} onChange={v => setForm({...form, captionSettings: {...form.captionSettings, enableHighlight: v}})} />
                                     <Toggle label="Hepsi Büyük Harf" checked={form.captionSettings.uppercase} onChange={v => setForm({...form, captionSettings: {...form.captionSettings, uppercase: v}})} />
                                 </div>
                                 
                                 <div className="grid grid-cols-2 gap-4">
                                     <div>
                                         <Label>Pozisyon</Label>
                                         <Select
                                            value={form.captionSettings.position}
                                            onChange={(v) => setForm({ ...form, captionSettings: { ...form.captionSettings, position: v } })}
                                            options={[
                                                { value: "Bottom", label: "Alt (Bottom)" },
                                                { value: "Center", label: "Orta (Center)" },
                                                { value: "Top", label: "Üst (Top)" },
                                            ]}
                                            className="h-10 text-xs"
                                        />
                                     </div>
                                     <div>
                                         <Label>Alt Boşluk (px)</Label>
                                         <NumberInput value={form.captionSettings.marginBottom} onChange={v => setForm({...form, captionSettings: {...form.captionSettings, marginBottom: v}})} min={0} step={10} />
                                     </div>
                                 </div>
                                 
                                 <div className="mt-4">
                                    <Label>Satır Başına Max Kelime</Label>
                                    <NumberInput 
                                        value={form.captionSettings.maxWordsPerLine ?? 2} 
                                        onChange={v => setForm({...form, captionSettings: {...form.captionSettings, maxWordsPerLine: v}})} 
                                        min={1} 
                                        max={10} 
                                    />
                                 </div>
                            </>
                        )}
                      </div>
                  )}

                  {/* -------------------- AUDIO TAB -------------------- */}
                  {activeTab === "audio" && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <Label className="flex items-center gap-2 border-b border-zinc-800 pb-1 text-zinc-400">
                             <Music size={14}/> Ses Seviyeleri (Miksaj)
                          </Label>
                          
                          {/* Volume Sliders */}
                          <div className="space-y-5">
                              {[
                                  { label: "Konuşma Sesi (Voice)", key: "voiceVolumePercent", max: 200 },
                                  { label: "Arkaplan Müziği", key: "musicVolumePercent", max: 100 },
                                  { label: "Ses Efektleri (SFX)", key: "sfxVolumePercent", max: 150 },
                              ].map((item) => (
                                  <div key={item.key}>
                                      <div className="flex justify-between text-xs mb-2">
                                          <span className="text-zinc-400 font-medium">{item.label}</span>
                                          <span className="text-indigo-400 font-mono bg-indigo-500/10 px-1.5 rounded">
                                              %{(form.audioMixSettings as any)[item.key]}
                                          </span>
                                      </div>
                                      <input
                                          type="range"
                                          min="0"
                                          max={item.max}
                                          value={(form.audioMixSettings as any)[item.key]}
                                          onChange={(e) => setForm({
                                              ...form,
                                              audioMixSettings: { ...form.audioMixSettings, [item.key]: parseInt(e.target.value) }
                                          })}
                                          className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
                                      />
                                  </div>
                              ))}
                          </div>

                          <div className="grid grid-cols-1 gap-2 border-t border-zinc-800 pt-4">
                              <Toggle
                                label="Audio Ducking"
                                description="Konuşma sırasında müziği otomatik kıs."
                                checked={form.audioMixSettings.enableDucking}
                                onChange={v => setForm({...form, audioMixSettings: {...form.audioMixSettings, enableDucking: v}})}
                              />
                              
                              {form.audioMixSettings.enableDucking && (
                                  <div className="pl-4 border-l-2 border-zinc-800 ml-2 mt-2">
                                      <Label className="text-[10px] mb-1">Kısma Oranı (%{form.audioMixSettings.duckingFactor})</Label>
                                      <div className="flex items-center gap-3">
                                        <input 
                                            type="range" 
                                            min="0" max="100" step="5" 
                                            value={form.audioMixSettings.duckingFactor}
                                            onChange={e => setForm({...form, audioMixSettings: {...form.audioMixSettings, duckingFactor: parseInt(e.target.value)}})}
                                            className="flex-1 h-1.5 bg-zinc-800 rounded-lg accent-indigo-500"
                                        />
                                        <span className="text-[10px] w-8 text-right font-mono">{form.audioMixSettings.duckingFactor}</span>
                                      </div>
                                  </div>
                              )}
                          </div>
                          
                           <div className="grid grid-cols-1 gap-2 border-t border-zinc-800 pt-4">
                              <Toggle
                                label="Fade In/Out"
                                description="Başlangıç ve bitişte sesi yumuşat."
                                checked={form.audioMixSettings.fadeAudioInOut}
                                onChange={v => setForm({...form, audioMixSettings: {...form.audioMixSettings, fadeAudioInOut: v}})}
                              />
                           </div>
                      </div>
                  )}

                  {/* -------------------- VISUAL TAB -------------------- */}
                  {activeTab === "visual" && (
                       <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                           <Toggle
                                label="Ken Burns Efekti"
                                description="Fotoğraflara yavaş zoom hareketi ekle."
                                checked={form.visualEffectsSettings.enableKenBurns}
                                onChange={v => setForm({...form, visualEffectsSettings: {...form.visualEffectsSettings, enableKenBurns: v}})}
                            />
                            
                            {form.visualEffectsSettings.enableKenBurns && (
                                 <div className="bg-zinc-950/30 p-3 rounded-xl border border-zinc-800">
                                      <Label className="text-[10px] mb-2">Zoom Yoğunluğu</Label>
                                      <div className="flex items-center gap-3">
                                          <span className="text-xs text-zinc-500">Hafif</span>
                                          <input 
                                              type="range" min="1.0" max="1.5" step="0.05"
                                              value={form.visualEffectsSettings.zoomIntensity}
                                              onChange={e => setForm({...form, visualEffectsSettings: {...form.visualEffectsSettings, zoomIntensity: parseFloat(e.target.value)}})}
                                              className="flex-1 h-1.5 bg-zinc-800 rounded-lg accent-indigo-500"
                                          />
                                          <span className="text-xs text-zinc-500">Güçlü</span>
                                      </div>
                                      <div className="text-center text-xs font-mono mt-1 text-indigo-400">x{form.visualEffectsSettings.zoomIntensity}</div>
                                 </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Geçiş Efekti</Label>
                                    <Select
                                        value={form.visualEffectsSettings.transitionType}
                                        onChange={v => setForm({...form, visualEffectsSettings: {...form.visualEffectsSettings, transitionType: v}})}
                                        options={[
                                            { value: "none", label: "Yok (Keskin)" },
                                            { value: "fade", label: "Fade (Kararma)" },
                                            { value: "crossfade", label: "Crossfade" },
                                            { value: "dissolve", label: "Dissolve (Erime)" },
                                            { value: "slide", label: "Slide (Kayma)" },
                                        ]}
                                        className="h-10 text-xs"
                                    />
                                </div>
                                <div>
                                    <Label>Renk Filtresi</Label>
                                    <Select
                                        value={form.visualEffectsSettings.colorFilter || "None"}
                                        onChange={v => setForm({...form, visualEffectsSettings: {...form.visualEffectsSettings, colorFilter: v}})}
                                        options={[
                                            { value: "None", label: "Yok" },
                                            { value: "Cinematic", label: "Sinematik" },
                                            { value: "BnW", label: "Siyah Beyaz" },
                                            { value: "Vintage", label: "Vintage" },
                                            { value: "Vibrant", label: "Canlı" },
                                        ]}
                                        className="h-10 text-xs"
                                    />
                                </div>
                            </div>
                       </div>
                  )}

                  {/* -------------------- BRAND TAB -------------------- */}
                  {activeTab === "brand" && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <Toggle
                                label="Filigran (Watermark)"
                                description="Videoya logo veya metin ekle."
                                checked={form.brandingSettings.enableWatermark}
                                onChange={v => setForm({...form, brandingSettings: {...form.brandingSettings, enableWatermark: v}})}
                           />
                           
                           {form.brandingSettings.enableWatermark && (
                               <div className="space-y-4 p-4 rounded-xl bg-zinc-950/30 border border-zinc-800">
                                    <div>
                                        <Label>Filigran Metni</Label>
                                        <Input
                                            value={form.brandingSettings.watermarkText}
                                            onChange={e => setForm({...form, brandingSettings: {...form.brandingSettings, watermarkText: e.target.value}})}
                                            placeholder="Örn: @KanalAdi"
                                            className="h-9 text-xs"
                                        />
                                    </div>
                                    
                                    <div>
                                        <Label>Filigran Görseli</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={form.brandingSettings.watermarkImagePath || ""}
                                                onChange={e => setForm({...form, brandingSettings: {...form.brandingSettings, watermarkImagePath: e.target.value}})}
                                                placeholder="/files/..."
                                                className="h-9 text-xs flex-1"
                                            />
                                            <Button 
                                                variant="outline" 
                                                onClick={() => setIsAssetModalOpen(true)}
                                                className="shrink-0 h-9 px-3 bg-zinc-800/50"
                                            >
                                                <ImageIcon size={14} className="mr-2" /> Seç
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Pozisyon</Label>
                                            <Select
                                                value={form.brandingSettings.position}
                                                onChange={v => setForm({...form, brandingSettings: {...form.brandingSettings, position: v}})}
                                                options={[
                                                    { value: "TopLeft", label: "Sol Üst" },
                                                    { value: "TopRight", label: "Sağ Üst" },
                                                    { value: "BottomLeft", label: "Sol Alt" },
                                                    { value: "BottomRight", label: "Sağ Alt" },
                                                    { value: "Center", label: "Ortala" },
                                                ]}
                                                className="h-9 text-xs"
                                            />
                                        </div>
                                        <div>
                                            <Label>Opaklık</Label>
                                            <div className="flex items-center gap-2 mt-2">
                                                <input 
                                                    type="range" min="0.1" max="1.0" step="0.1"
                                                    value={form.brandingSettings.opacity}
                                                    onChange={e => setForm({...form, brandingSettings: {...form.brandingSettings, opacity: parseFloat(e.target.value)}})}
                                                    className="flex-1 h-1.5 bg-zinc-800 rounded-lg accent-indigo-500"
                                                />
                                                <span className="text-[10px] font-mono">{form.brandingSettings.opacity}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <ColorPicker label="Metin Rengi" value={form.brandingSettings.watermarkColor} onChange={c => setForm({...form, brandingSettings: {...form.brandingSettings, watermarkColor: c}})} />
                               </div>
                           )}
                      </div>
                  )}

                </>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/80 backdrop-blur flex items-center justify-between gap-2 shrink-0">
               <div className="text-[10px] text-zinc-500 hidden sm:block">
                  {/* Status msg or tip */}
               </div>
               <div className="flex items-center gap-2">
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
                        className="shadow-lg shadow-indigo-600/20 bg-indigo-600 hover:bg-indigo-500 text-white border-none h-9 px-4 text-xs group"
                    >
                        <Save size={14} className="mr-1.5 group-hover:scale-110 transition-transform" /> Kaydet
                    </Button>
               </div>
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

      {/* Asset Selection Modal */}
      <Modal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        title="Filigran Görseli Seç"
      >
          <div className="min-h-[300px] max-h-[500px] overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-zinc-800">
               {assetLoading ? (
                   <div className="flex flex-col items-center justify-center py-10 text-zinc-500 gap-2">
                       <Loader2 className="animate-spin" size={24}/>
                       <span className="text-xs">Yükleniyor...</span>
                   </div>
               ) : assetList.length === 0 ? (
                   <div className="text-center py-10 text-zinc-500 text-sm">Hiç görsel bulunamadı. <br/> "Medya Dosyaları" sayfasından yükleyebilirsiniz.</div>
               ) : (
                   <div className="grid grid-cols-3 gap-3">
                       {assetList.map(asset => (
                           <div 
                                key={asset.id} 
                                onClick={() => {
                                    setForm({...form, brandingSettings: {...form.brandingSettings, watermarkImagePath: asset.url}});
                                    setIsAssetModalOpen(false);
                                }}
                                className="group cursor-pointer relative aspect-square bg-zinc-900/50 rounded-lg border border-zinc-800 hover:border-indigo-500 overflow-hidden flex items-center justify-center"
                            >
                                <img src={asset.url} alt={asset.name} className="object-contain w-full h-full p-2" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-xs font-bold text-white">Seç</span>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-[9px] text-zinc-300 truncate text-center">
                                    {asset.name}
                                </div>
                           </div>
                       ))}
                   </div>
               )}
          </div>
      </Modal>
    </Page>
  );
}
