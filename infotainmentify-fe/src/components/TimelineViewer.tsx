import { Clock, Type, Image as ImageIcon } from "lucide-react";
import { Badge } from "./ui-kit"; // UiKit yolunu kendine göre ayarla

// --- TİP TANIMLARI ---
export type VisualEvent = {
  sceneIndex: number;
  imagePath: string;
  startTime: number;
  duration: number;
  effectType: string;
};

export type CaptionEvent = {
  text: string;
  start: number;
  end: number;
};

export type SceneLayoutPayload = {
  width: number;
  height: number;
  totalDuration: number;
  visualTrack: VisualEvent[];
  captionTrack: CaptionEvent[];
};

// --- BİLEŞEN ---
export function TimelineViewer({ data }: { data: any }) { 
  // Not: 'data' tipini 'any' yaptık çünkü Backend'den PascalCase gelebilir.
  
  // 1. Veri Doğrulama ve Normalizasyon (Büyük/Küçük Harf Desteği)
  const visualTrack = data?.visualTrack || data?.VisualTrack;
  const captionTrack = data?.captionTrack || data?.CaptionTrack;
  const totalDuration = data?.totalDuration || data?.TotalDuration || 0;
  const width = data?.width || data?.Width || 0;
  const height = data?.height || data?.Height || 0;

  // 2. Eğer veri yoksa veya görsel listesi boşsa hata göster
  if (!visualTrack || visualTrack.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-2 p-8 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
            <span className="text-lg font-semibold text-zinc-400">Önizleme Verisi Bulunamadı</span>
            <span className="text-xs text-zinc-500 text-center max-w-md">
                Sahne planı (Scene Layout) henüz oluşturulmamış veya veritabanından hatalı formatta gelmiş olabilir.
            </span>
            {/* Debug amaçlı ham veriyi göster (Geliştirme bitince kaldırabilirsin) */}
            <div className="w-full mt-4">
                <p className="text-[10px] text-zinc-600 mb-1 font-mono">DEBUG RAW DATA:</p>
                <pre className="text-[9px] bg-black/50 p-2 rounded text-zinc-500 overflow-auto max-h-32 text-left font-mono border border-zinc-900">
                    {JSON.stringify(data, null, 2)}
                </pre>
            </div>
        </div>
      );
  }

  // 3. Resim Yolu Düzeltici
  // Backend "wwwroot/users/..." döner, biz bunu tarayıcıda açılabilir URL'e çeviriyoruz.
  // Resim Yolu Düzeltici (Regex Destekli)
  // src/components/TimelineViewer.tsx içinde

  // ... (getImageUrl fonksiyonu aynı kalsın) ...
  const getImageUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;

    const baseUrl = "https://localhost:7177"; // Portunun doğru olduğundan emin ol
    let cleanPath = path.replace(/\\/g, "/"); // Ters slashları düzelt

    // 🔥 Agresif Temizlik: "ALL_FILES/" kelimesini gördüğün an öncesini sil
    if (cleanPath.includes("/ALL_FILES/")) {
        cleanPath = cleanPath.split("/ALL_FILES/")[1];
    } 
    // Eğer wwwroot içindeyse
    else if (cleanPath.includes("/wwwroot/")) {
        cleanPath = cleanPath.split("/wwwroot/")[1];
    }
    // Hiçbiri yoksa ve "User_" ile başlıyorsa (Fallback)
    else if (cleanPath.includes("User_")) {
        const idx = cleanPath.indexOf("User_");
        if (idx !== -1) cleanPath = cleanPath.substring(idx);
    }

    // Başındaki slash'ı temizle
    if (cleanPath.startsWith("/")) cleanPath = cleanPath.substring(1);

    return `${baseUrl}/${cleanPath}`;
  };

  // ... (getImageUrl fonksiyonu ve veri hazırlığı aynı) ...

  const isVertical = width < height;

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* 1. ÜST BİLGİ PANELİ */}
      <div className="flex items-center gap-8 px-1 pb-4 border-b border-zinc-800 text-xs text-zinc-400 select-none">
        
        {/* ... (Üst bilgi aynı kalsın) ... */}
        <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/10 rounded-md">
                <Clock size={16} className="text-indigo-500"/> 
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Süre</span>
                <span className="text-zinc-200 font-mono font-medium text-sm">{totalDuration.toFixed(1)}s</span>
            </div>
        </div>
        <div className="w-px h-8 bg-zinc-800" />
        <div className="flex items-center gap-2">
             <div className="p-1.5 bg-purple-500/10 rounded-md">
                <ImageIcon size={16} className="text-purple-500"/> 
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Format</span>
                <span className="text-zinc-200 font-mono font-medium text-sm">{width}x{height}</span>
            </div>
        </div>
        <div className="w-px h-8 bg-zinc-800" />
        <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/10 rounded-md">
                <Type size={16} className="text-emerald-500"/> 
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Altyazı</span>
                <span className="text-zinc-200 font-mono font-medium text-sm">{captionTrack?.length || 0} satır</span>
            </div>
        </div>
      </div>

      {/* 2. ANA TİMELİNE (YATAY SCROLL) */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        <div className="flex gap-4 h-full px-1 min-w-max">
          {visualTrack.map((scene: any, idx: number) => {
            // Veri Çekme (Safe Access)
            const sStart = scene.startTime ?? scene.StartTime;
            const sDuration = scene.duration ?? scene.Duration;
            const sPath = scene.imagePath || scene.ImagePath;
            const sEffect = scene.effectType || scene.EffectType;
            const sIndex = scene.sceneIndex ?? scene.SceneIndex ?? (idx + 1);

            // İlgili Altyazılar
            const sceneCaptions = (captionTrack || []).filter((c: any) => {
                const cStart = c.start ?? c.Start;
                return cStart >= sStart && cStart < (sStart + sDuration);
            });

            return (
              <div key={idx} className={`flex flex-col ${isVertical ? 'w-64' : 'w-80'} shrink-0 gap-2 group`}>
                
                {/* Kart Başlığı (Zaman) */}
                <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-mono font-medium text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                        {sStart?.toFixed(1)}s - {(sStart + sDuration)?.toFixed(1)}s
                    </span>
                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">#{sIndex}</span>
                </div>

                {/* Sahne Kartı */}
                <div className="flex-1 flex flex-col bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm group-hover:border-zinc-700 transition-all duration-300">
                  
                  {/* Resim Alanı (Gelişmiş) */}
                  <div className={`relative ${isVertical ? 'h-64' : 'h-40'} bg-zinc-950 overflow-hidden shrink-0 group-hover:bg-zinc-900 transition-colors`}>
                        {/* Blur Background for Fill */}
                        <div 
                            className="absolute inset-0 bg-cover bg-center opacity-30 blur-xl scale-125"
                            style={{ backgroundImage: `url(${getImageUrl(sPath)})` }}
                        />
                        
                        {/* Main Image */}
                        <img 
                            src={getImageUrl(sPath)} 
                            alt={`Scene ${sIndex}`}
                            className="relative w-full h-full object-contain z-10 p-2 opacity-90 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-500"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://placehold.co/400x600/18181b/52525b?text=Image+Error";
                            }}
                        />

                        {/* Efekt Badge */}
                        <div className="absolute top-2 right-2 z-20">
                            <Badge variant="neutral" className="bg-black/60 backdrop-blur border border-white/10 text-[9px] text-white shadow-sm">
                                {sEffect?.replace(/_/g, " ") || "STATIC"}
                            </Badge>
                        </div>
                  </div>

                  {/* Altyazı Listesi (Kompakt) */}
                  <div className="flex-1 bg-zinc-900/30 p-2 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 min-h-[80px]">
                    <div className="flex flex-col gap-1.5">
                        {sceneCaptions.length > 0 ? (
                            sceneCaptions.map((cap: any, cIdx: number) => (
                                <div key={cIdx} className="text-xs text-zinc-400 leading-snug bg-zinc-950/40 p-1.5 rounded border border-zinc-800/30 hover:bg-zinc-950 hover:text-zinc-200 transition-colors">
                                    <span className="text-indigo-500 font-mono text-[9px] mr-1.5 opacity-60">
                                        {(cap.start ?? cap.Start)?.toFixed(1)}s
                                    </span>
                                    {cap.text || cap.Text}
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex items-center justify-center text-zinc-700 text-[10px] italic opacity-40">
                                ...
                            </div>
                        )}
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}