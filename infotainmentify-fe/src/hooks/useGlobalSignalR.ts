import { useEffect } from "react";
import toast from "react-hot-toast";
import { initSignalR, stopSignalR } from "../lib/signalr";

export function useGlobalSignalR() {
    useEffect(() => {
        let mounted = true;

        const startConnection = async () => {
            await initSignalR({
                onJobProgress: (data: any) => {
                    if (!mounted) return;
                    toast.loading(`${data.status ?? "İşlem"} (%${data.progress})`, {
                        id: `job-${data.jobId}`,
                    });
                },
                onJobCompleted: (data: any) => {
                    if (!mounted) return;
                    toast.dismiss(`job-${data.jobId}`);
                    if (data.success) {
                        toast.success(data.message || "✅ Görev tamamlandı!");
                    } else {
                        toast.error(data.message || "❌ Görev başarısız!");
                    }
                },
            });
        };

        startConnection();

        return () => {
            mounted = false;
            stopSignalR();
        };
    }, []);
}