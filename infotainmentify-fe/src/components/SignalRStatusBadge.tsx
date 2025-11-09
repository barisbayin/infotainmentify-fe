import { useEffect, useState } from "react";
import { getSignalRConnection } from "../lib/signalr";
import { Wifi, WifiOff, Loader2 } from "lucide-react";

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

  return (
    <div
      className="relative flex items-center justify-center w-6 h-6"
      title={
        status === "connected"
          ? "SignalR bağlı"
          : status === "reconnecting"
          ? "Yeniden bağlanıyor..."
          : "Bağlantı kopuk"
      }
    >
      {status === "connected" && (
        <>
          <div className="absolute w-5 h-5 rounded-full bg-green-400/30 animate-pulse-signal blur-md"></div>
          <Wifi
            className="relative w-4 h-4 text-green-500 drop-shadow-sm"
            strokeWidth={2}
          />
        </>
      )}

      {status === "reconnecting" && (
        <Loader2
          className="w-4 h-4 text-yellow-500 animate-spin"
          strokeWidth={2}
        />
      )}

      {status === "disconnected" && (
        <WifiOff className="w-4 h-4 text-red-500" strokeWidth={2} />
      )}
    </div>
  );
}
