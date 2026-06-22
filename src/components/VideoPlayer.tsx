import React from "react";
import { cn } from "./ui-kit";
import { Maximize2, Download } from "lucide-react";

interface VideoPlayerProps {
    videoUrl: string | null;
    posterUrl?: string;
    className?: string;
    onExpand?: () => void;
    videoWidth?: number;
    videoHeight?: number;
    aspectRatio?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
    videoUrl,
    posterUrl,
    className,
    onExpand,
    videoWidth,
    videoHeight,
    aspectRatio,
}) => {
    if (!videoUrl) return null;

    const apiBase = import.meta.env.VITE_API_BASE_URL || "";
    const isAbsolute = videoUrl.startsWith("http");
    const normalizedPath = videoUrl.startsWith("/") ? videoUrl : `/${videoUrl}`;
    const fullUrl = isAbsolute ? videoUrl : `${apiBase}${normalizedPath}`;
    const cssAspectRatio =
        videoWidth && videoHeight
            ? `${videoWidth} / ${videoHeight}`
            : aspectRatio?.includes(":")
                ? aspectRatio.replace(":", " / ")
                : "9 / 16";

    return (
        <div className={cn("w-full bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800", className)}>
            <div className="relative" style={{ aspectRatio: cssAspectRatio }}>
                <video
                    className="absolute top-0 left-0 w-full h-full object-contain bg-black"
                    controls
                    playsInline
                    poster={posterUrl}
                    src={fullUrl}
                >
                    Tarayiciniz video etiketini desteklemiyor.
                </video>
            </div>

            <div className="p-3 bg-[#161b22] flex justify-between items-center gap-2">
                <span className="text-xs text-gray-400 font-medium truncate">
                    Final Render{videoWidth && videoHeight ? ` (${videoWidth}x${videoHeight})` : ""}
                </span>

                <div className="flex items-center gap-2 shrink-0">
                    {onExpand && (
                        <button
                            onClick={onExpand}
                            className="text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-200 px-3 py-1.5 rounded transition flex items-center gap-1.5"
                            title="Tam Ekran"
                        >
                            <Maximize2 size={12} />
                            <span className="hidden sm:inline">Buyut</span>
                        </button>
                    )}

                    <a
                        href={fullUrl}
                        download="video.mp4"
                        target="_blank"
                        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded transition flex items-center gap-1.5"
                        rel="noreferrer"
                    >
                        <Download size={12} />
                        Indir
                    </a>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;
