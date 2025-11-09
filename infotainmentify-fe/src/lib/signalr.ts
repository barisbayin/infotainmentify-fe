import { HubConnectionBuilder, LogLevel, HubConnection } from "@microsoft/signalr";
import toast from "react-hot-toast";
import { getAuthToken } from "../api/http";

let connection: HubConnection | null = null;

type EventHandlers = {
    onJobProgress?: (data: any) => void;
    onJobCompleted?: (data: any) => void;
};

let handlers: EventHandlers = {};

/**
 * 🔌 SignalR bağlantısını başlatır (hem local hem prod)
 */
export async function initSignalR(newHandlers?: EventHandlers) {
    if (newHandlers) handlers = { ...handlers, ...newHandlers };

    // ✅ Önce eski bağlantı varsa kapat
    if (connection) {
        try {
            await connection.stop();
            console.log("♻️ Eski SignalR bağlantısı kapatıldı.");
        } catch (err) {
            console.warn("⚠️ Eski bağlantı kapatılırken hata:", err);
        }
        connection = null;
    }

    const token = getAuthToken();
    if (!token) {
        console.warn("🚫 SignalR başlatılamadı: kullanıcı oturumu yok.");
        return null;
    }

    // ✅ Temel adres - .env veya fallback
    const baseUrl =
        import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "https://localhost:7177";
    const hubUrl = `${baseUrl}/hubs/notify`;

    console.log("🔗 SignalR bağlanıyor:", hubUrl);
    console.log("🔑 Token:", token);

    connection = new HubConnectionBuilder()
        .withUrl(hubUrl, {
            accessTokenFactory: () => token,
            skipNegotiation: false, // WebSocket fallback devre dışı bırakma
            transport: undefined,   // Otomatik negotiation açık kalsın
        })
        .configureLogging(LogLevel.Information)
        .withAutomaticReconnect()
        .build();

    // --- Events ---
    connection.on("JobProgress", (data) => {
        console.log("📡 JobProgress event geldi:", data);
        if (handlers.onJobProgress) handlers.onJobProgress(data);
        else toast.loading(`${data.status || "İlerleme"}: %${data.progress}`, {
            id: `job-${data.jobId}`,
        });
    });

    connection.on("JobCompleted", (data) => {
        console.log("📡 JobCompleted event geldi:", data);
        if (handlers.onJobCompleted) handlers.onJobCompleted(data);
        else {
            toast.dismiss(`job-${data.jobId}`);
            data.success
                ? toast.success(data.message || "✅ İşlem tamamlandı!")
                : toast.error(data.message || "❌ İşlem başarısız!");
        }
    });



    connection.onreconnecting(() => {
        toast.loading("🔄 SignalR yeniden bağlanıyor...", { id: "signalr" });
    });

    connection.onreconnected(() => {
        toast.dismiss("signalr");
        toast.success("✅ SignalR bağlantısı yenilendi!");
    });

    connection.onclose((err) => {
        console.warn("⚠️ SignalR bağlantısı kapandı:", err);
        toast.error("Sunucu bağlantısı koptu.");
    });

    try {
        await connection.start();
        console.log("✅ SignalR bağlantısı kuruldu.");
    } catch (err: any) {
        if (err?.name !== "AbortError") {
            console.error("❌ SignalR başlatma hatası:", err);
        } else {
            console.warn("⚠️ SignalR bağlantısı iptal edildi (AbortError).");
        }
    }

    return connection;
}

/** 🧹 Bağlantıyı güvenli kapat */
export async function stopSignalR() {
    if (!connection) return;
    try {
        await connection.stop();
        console.log("🧹 SignalR bağlantısı kapatıldı.");
    } catch (err) {
        console.error("SignalR bağlantısı durdurulamadı:", err);
    } finally {
        connection = null;
    }
}

/** 🔍 Aktif bağlantıyı döndürür */
export function getSignalRConnection() {
    return connection;
}
