import { useEffect, useRef } from "react";
import { initSignalR, stopSignalR } from "../lib/signalr";
import { useNotifications } from "../context/NotificationContext";

export function useGlobalSignalR() {
    const { startJob, updateJobProgress, finishJob } = useNotifications();
    // Callbackleri useRef içinde tutmak, useEffect dependency sorununu çözer
    // Ancak signalR init sadece bir kere çalışmalı.

    // Notification fonksiyonlarını ref'e atayarak closure sorununu aşabiliriz
    const funcs = useRef({ startJob, updateJobProgress, finishJob });
    useEffect(() => {
        funcs.current = { startJob, updateJobProgress, finishJob };
    }, [startJob, updateJobProgress, finishJob]);

    useEffect(() => {
        let mounted = true;

        const startConnection = async () => {
            await initSignalR({
                onJobProgress: (data: any) => {
                    if (!mounted) return;
                    // Job id string olmalı
                    const jobId = data.jobId?.toString() || "unknown";

                    // İlk progress geldiğinde başlat, sonrakilerde güncelle
                    // Context içindeki startJob check yapıyor zaten.
                    funcs.current.startJob(jobId, data.status ?? "İşlem");
                    funcs.current.updateJobProgress(jobId, data.progress, data.status);
                },
                onJobCompleted: (data: any) => {
                    if (!mounted) return;
                    const jobId = data.jobId?.toString() || "unknown";
                    funcs.current.finishJob(jobId, data.success, data.message);
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