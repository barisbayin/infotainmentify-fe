import { useEffect, useState } from "react";
import { getSignalRConnection } from "../lib/signalr"; // Yolunu kontrol et
import { Wifi, WifiOff, Loader2 } from "lucide-react";
import Tooltip from "./Tooltip"; // 👈 Az önce yazdığımız Tooltip'i buraya import et

export default function SignalRStatusBadge() {
  const [status, setStatus] = useState<
    "connected" | "reconnecting" | "disconnected"
  >("disconnected");

  useEffect(() => {
    const updateStatus = () => {
      const conn = getSignalRConnection();
      if (!conn) {
        setStatus("disconnected");
        return;
      }
      switch (conn.state) {
        case "Connected":
          setStatus("connected");
          break;
        case "Reconnecting":
          setStatus("reconnecting");
          break;
        default:
          setStatus("disconnected");
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  // Duruma göre ikon, renk ve metin belirleyelim
  const config = {
    connected: {
      icon: Wifi,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      glow: "bg-emerald-400",
      text: "Canlı Bağlantı Aktif",
    },
    reconnecting: {
      icon: Loader2,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      glow: "bg-amber-400",
      text: "Sunucuya yeniden bağlanılıyor...",
    },
    disconnected: {
      icon: WifiOff,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      glow: "bg-rose-400",
      text: "Sunucu bağlantısı koptu",
    },
  }[status];

  const Icon = config.icon;

  return (
    <Tooltip text={config.text}>
      <div
        className={`
          relative flex items-center justify-center h-8 w-8 rounded-full 
          transition-all duration-300 ring-1 ring-inset
          ${config.bg} ring-white/20
        `}
      >
        {/* ✨ Connected durumunda arkada hafif nabız atan bir ışık (Glow) */}
        {status === "connected" && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-20"></span>
        )}

        {/* İkon */}
        <Icon
          className={`h-4 w-4 ${config.color} ${
            status === "reconnecting" ? "animate-spin" : ""
          }`}
          strokeWidth={2.5}
        />

        {/* Çok ufak bir durum noktası (Dot) - sağ üst köşe */}
        <span
          className={`absolute top-0 right-0 -mt-0.5 -mr-0.5 flex h-2.5 w-2.5`}
        >
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
              config.glow
            } ${status === "connected" ? "animate-pulse" : ""}`}
          ></span>
          <span
            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.glow}`}
          ></span>
        </span>
      </div>
    </Tooltip>
  );
}
