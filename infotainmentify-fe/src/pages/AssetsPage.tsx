import { useEffect, useState, useCallback, useRef } from "react";
import { assetsApi, type AssetListDto, type AssetType } from "../api/assets";
import toast from "react-hot-toast";
import {
  Page,
  Card,
  Button,
  Modal,
} from "../components/ui-kit";
import {
  Music,
  Type,
  Stamp,
  Trash2,
  Upload,
  Play,
  Pause,
  Download,
  FileAudio,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import { useDebounce } from "../hooks/useDebounce";

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------
const TABS: { id: AssetType; label: string; icon: any }[] = [
  { id: "Music", label: "Müzikler", icon: Music },
  { id: "Font", label: "Fontlar", icon: Type },
  { id: "Branding", label: "Marka Görselleri", icon: Stamp },
];

export default function AssetsPage() {
  const [activeTab, setActiveTab] = useState<AssetType>("Music");
  const [items, setItems] = useState<AssetListDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  // Audio Preview State
  const [playingId, setPlayingId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Upload State
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete State
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // -------------------------------------------------------------------------
  // LOAD LIST
  // -------------------------------------------------------------------------
  const loadList = useCallback(async () => {
    setLoading(true);
    // Audio durdur
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        setPlayingId(null);
    }
    
    try {
      const data = await assetsApi.list(activeTab);
      setItems(data);
    } catch {
      toast.error("Dosyalar yüklenemedi.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadList();
    setSearch(""); // Tab değişince aramayı sıfırla
  }, [loadList]);

  // -------------------------------------------------------------------------
  // MEDIA PREVIEW LOGIC
  // -------------------------------------------------------------------------
  const togglePlay = (url: string, id: number) => {
    if (playingId === id) {
      // Pause
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingId(null);
    } else {
      // Start new
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(url);
      audio.onended = () => setPlayingId(null);
      audio.onerror = () => {
        toast.error("Ses dosyası oynatılamadı.");
        setPlayingId(null);
      };
      audio.play();
      audioRef.current = audio;
      setPlayingId(id);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  // -------------------------------------------------------------------------
  // UPLOAD LOGIC
  // -------------------------------------------------------------------------
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Type validation (Basit kontrol)
    if (activeTab === "Music" && !file.type.startsWith("audio/")) {
        toast.error("Lütfen ses dosyası seçin (mp3, wav).");
        return;
    }
    if (activeTab === "Branding" && !file.type.startsWith("image/")) {
        toast.error("Lütfen resim dosyası seçin (png, jpg).");
        return;
    }
    if (activeTab === "Font" && !file.name.match(/\.(ttf|otf|woff|woff2)$/i)) {
        toast.error("Lütfen font dosyası seçin (ttf, otf, woff).");
        return;
    }

    setUploading(true);
    try {
        await assetsApi.upload({ file, type: activeTab });
        toast.success("Dosya yüklendi.");
        loadList();
    } catch (err: any) {
        toast.error(err.message || "Yükleme başarısız.");
    } finally {
        setUploading(false);
        // Inputu temizle ki aynı dosyayı tekrar seçebilsin
        if(fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // -------------------------------------------------------------------------
  // DELETE LOGIC
  // -------------------------------------------------------------------------
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
        await assetsApi.delete(deleteId);
        toast.success("Silindi.");
        // Eğer çalan silindiyse durdur
        if (playingId === deleteId) {
             if (audioRef.current) audioRef.current.pause();
             setPlayingId(null);
        }
        loadList();
    } catch {
        toast.error("Silinemedi.");
    } finally {
        setDeleteId(null);
    }
  };

  // -------------------------------------------------------------------------
  // RENDER HELPERS
  // -------------------------------------------------------------------------
  const filteredItems = items.filter(i => i.name.toLowerCase().includes(debouncedSearch.toLowerCase()));
  
  // Backend'den gelen URL absolute olmayabilir, check etmek lazım ama genelde /files/... döner.
  // Vite env'ine gerek var mı? Genelde <img src="/files/..." /> çalışır eğer proxy varsa.
  // Ancak api/http.ts'de base url var. Biz direkt full URL alalım veya relative ise düzeltelim.
  const getFullUrl = (url: string) => {
      if(url.startsWith("http")) return url;
      const apiBase = import.meta.env.VITE_API_BASE_URL || "";
      // apiBase sonu slash ile bitiyor mu? VITE_API_BASE_URL genelde "http://localhost:5000"
      return `${apiBase}${url.startsWith("/") ? url : "/" + url}`;
  };

  return (
    <Page>
        <div className="flex-1 flex flex-col min-h-0 h-full gap-6">
            
            {/* Header Area */}
            <div className="flex justify-between items-end shrink-0">
                <div>
                     <h1 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
                        <Upload size={24} className="text-zinc-500" /> Medya Dosyaları
                     </h1>
                     <p className="text-xs text-zinc-500 font-medium">Render işlemlerinde kullanılacak yardımcı dosyalar.</p>
                </div>
                <Button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                    disabled={uploading}
                >   
                   {uploading ? <Loader2 className="animate-spin mr-2" size={16}/> : <Upload className="mr-2" size={16} />}
                   {uploading ? "Yükleniyor..." : "Yeni Yükle"}
                </Button>
                {/* Hidden Input for generic upload button action */}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleUpload} 
                    accept={activeTab === "Music" ? "audio/*" : activeTab === "Branding" ? "image/*" : ".ttf,.otf,.woff,.woff2"}
                />
            </div>

            {/* TAB Navigation */}
            <div className="flex items-center gap-1 p-1 bg-zinc-900/50 rounded-xl border border-zinc-800/50 w-fit shrink-0">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all
                            ${activeTab === tab.id 
                                ? "bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700" 
                                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"}
                        `}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Main Content Card */}
            <Card className="flex-1 min-h-0 p-0 overflow-hidden flex flex-col border-zinc-800 bg-zinc-900/40">
                {/* Toolbar */}
                <div className="flex items-center gap-3 p-3 border-b border-zinc-800/50 bg-zinc-900/20">
                     <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                        <input 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
                            placeholder={`${activeTab === "Music" ? "Müzik" : activeTab === "Font" ? "Font" : "Dosya"} ara...`}
                        />
                     </div>
                     <div className="ml-auto">
                        <Button variant="ghost" size="icon" onClick={loadList} className="text-zinc-500 hover:text-zinc-300">
                             <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        </Button>
                     </div>
                </div>

                {/* Grid / List */}
                <div className="flex-1 overflow-y-auto p-4 relative scrollbar-thin scrollbar-thumb-zinc-800">
                     {loading && items.length === 0 ? (
                         <div className="absolute inset-0 flex items-center justify-center text-zinc-600 gap-2">
                             <Loader2 size={24} className="animate-spin" />
                             <span className="text-xs">Dosyalar getiriliyor...</span>
                         </div>
                     ) : filteredItems.length === 0 ? (
                         <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-3 opacity-60">
                             <div className="p-4 bg-zinc-900/50 rounded-full border border-zinc-800"><Upload size={24} /></div>
                             <p className="text-sm">Henüz dosya yok.</p>
                         </div>
                     ) : (
                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                             {filteredItems.map(item => (
                                 <div key={item.id} className="group relative bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-3 hover:bg-zinc-900/80 hover:border-zinc-700 transition-all flex flex-col gap-3">
                                     
                                     {/* Preview Area */}
                                     <div className="aspect-square bg-zinc-950/50 rounded-lg border border-zinc-800/50 overflow-hidden flex items-center justify-center relative">
                                          {activeTab === "Branding" ? (
                                              <img src={getFullUrl(item.url)} alt={item.name} className="w-full h-full object-contain p-2" />
                                          ) : activeTab === "Font" ? (
                                               // Font Preview (Custom font-face dynamically loaded?) 
                                               // It's hard to load font dynamically safely here without dirtying DOM.
                                               // Just show Aa icon or simple letters
                                              <div className="flex flex-col items-center justify-center text-zinc-500 gap-1">
                                                  <span className="text-4xl font-serif">Aa</span>
                                                  <span className="text-[10px] opacity-50">{item.name}</span>
                                              </div>
                                          ) : (
                                              // Music
                                              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${playingId === item.id ? "bg-indigo-500 text-white animate-pulse" : "bg-zinc-800 text-zinc-500 group-hover:bg-zinc-700 group-hover:text-zinc-300"}`}>
                                                  <FileAudio size={24} />
                                              </div>
                                          )}

                                          {/* Overlay Actions */}
                                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                              {activeTab === "Music" && (
                                                  <button 
                                                    onClick={() => togglePlay(getFullUrl(item.url), item.id)}
                                                    className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform"
                                                  >
                                                      {playingId === item.id ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                                                  </button>
                                              )}
                                              <a 
                                                href={getFullUrl(item.url)} 
                                                download 
                                                target="_blank"
                                                className="w-8 h-8 rounded-full bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700 transition-colors"
                                                title="İndir"
                                              >
                                                  <Download size={14} />
                                              </a>
                                          </div>
                                     </div>

                                     {/* Info */}
                                     <div className="flex justify-between items-start gap-2">
                                          <div className="flex flex-col min-w-0">
                                              <span className="text-xs font-medium text-zinc-200 truncate" title={item.name}>{item.name}</span>
                                              <span className="text-[10px] text-zinc-500">{item.sizeInfo}</span>
                                          </div>
                                          <button 
                                            onClick={() => setDeleteId(item.id)}
                                            className="text-zinc-600 hover:text-red-400 p-1 rounded-md hover:bg-zinc-800 transition-colors shrink-0"
                                          >
                                              <Trash2 size={14} />
                                          </button>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     )}
                </div>
            </Card>
        </div>

        {/* Delete Modal */}
        <Modal
            isOpen={!!deleteId}
            onClose={() => setDeleteId(null)}
            title="Dosyayı Sil"
        >
            <div className="flex flex-col gap-4">
                <p className="text-sm text-zinc-400">Bu dosyayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setDeleteId(null)}>Vazgeç</Button>
                    <Button variant="danger" onClick={handleDelete}>Evet, Sil</Button>
                </div>
            </div>
        </Modal>
    </Page>
  );
}
