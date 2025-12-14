import React from 'react';
import { cn } from "./ui-kit";
import { Maximize2, Download } from "lucide-react";

interface VideoPlayerProps {
    videoUrl: string | null; // Backend'den gelen URL (örn: /files/User_1/...)
    posterUrl?: string;      // İstersen kapak resmi (thumbnail)
    className?: string;      // Dışarıdan stil verebilmek için
    onExpand?: () => void;   // Büyütme işlevi için callback
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, posterUrl, className, onExpand }) => {
    
    if (!videoUrl) return null;

    // Backend URL'i dinamik al
    const apiBase = import.meta.env.VITE_API_BASE_URL || window.location.origin;
    
    // videoUrl zaten http ile başlıyorsa dokunma, değilse base ile birleştir
    const isAbsolute = videoUrl.startsWith("http");
    const normalizedPath = videoUrl.startsWith("/") ? videoUrl : `/${videoUrl}`;
    const fullUrl = isAbsolute ? videoUrl : `${apiBase}${normalizedPath}`; 

    return (
        <div className={cn("w-full bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800", className)}>
            <div className="relative pt-[177.77%]"> {/* 9:16 Aspect Ratio (Shorts) için */}
                <video 
                    className="absolute top-0 left-0 w-full h-full object-cover"
                    controls 
                    playsInline
                    poster={posterUrl}
                    src={fullUrl}
                >
                    Tarayıcınız video etiketini desteklemiyor.
                </video>
            </div>
            
            {/* Alt Bar */}
            <div className="p-3 bg-[#161b22] flex justify-between items-center gap-2">
                <span className="text-xs text-gray-400 font-medium truncate">Final Render</span>
                
                <div className="flex items-center gap-2 shrink-0">
                    {/* Genişletme Butonu (Varsa) */}
                    {onExpand && (
                        <button 
                            onClick={onExpand}
                            className="text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-200 px-3 py-1.5 rounded transition flex items-center gap-1.5"
                            title="Tam Ekran"
                        >
                            <Maximize2 size={12} />
                            <span className="hidden sm:inline">Büyüt</span>
                        </button>
                    )}

                    {/* İndirme Butonu */}
                    <a 
                        href={fullUrl} 
                        download="video.mp4"
                        target="_blank"
                        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded transition flex items-center gap-1.5"
                        rel="noreferrer"
                    >
                        <Download size={12} />
                        İndir
                    </a>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;