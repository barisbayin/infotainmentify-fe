import React, { useCallback, useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { getAuthToken } from "../api/http";
import { pipelineRunsApi } from "../api/pipelineRuns";

interface LiveLogViewerProps {
    runId: number;
}

type ParsedLogLine = {
    time: string;
    message: string;
};

type ConnectionState = "connecting" | "connected" | "reconnecting" | "disconnected";

const logTimePattern = /^(\d{2}:\d{2}:\d{2})\s+-\s+(.*)$/;
const isoLogTimePattern = /^(\d{4}-\d{2}-\d{2}T[^\s]+)\s+-\s+(.*)$/;

const ensureLogHasTime = (log: string): string => {
    const clean = String(log || "").trim();
    if (logTimePattern.test(clean)) return clean;

    const isoMatch = clean.match(isoLogTimePattern);
    if (isoMatch) {
        const parsed = new Date(isoMatch[1]);
        const time = Number.isNaN(parsed.getTime())
            ? "--:--:--"
            : parsed.toLocaleTimeString("tr-TR", { hour12: false });
        return `${time} - ${isoMatch[2]}`;
    }

    const time = new Date().toLocaleTimeString("tr-TR", { hour12: false });
    return `${time} - ${clean || "[INFO] Boş log mesajı alındı."}`;
};

const mergeLogLines = (history: string[], live: string[]): string[] => {
    const result: string[] = [];
    const seen = new Set<string>();
    for (const line of [...history, ...live]) {
        const normalized = ensureLogHasTime(line);
        if (seen.has(normalized)) continue;
        seen.add(normalized);
        result.push(normalized);
    }
    return result;
};

const parseLogLine = (log: string): ParsedLogLine => {
    const match = log.match(logTimePattern);
    return match
        ? { time: match[1], message: match[2] }
        : { time: "--:--:--", message: log };
};

const getLogColor = (message: string) => {
    const normalized = message.toLocaleLowerCase("tr-TR");
    if (message.includes("[HATA]") || normalized.includes("error") || normalized.includes("fatal")) {
        return "text-red-300";
    }
    if (message.includes("[UYARI]") || normalized.includes("warning")) {
        return "text-amber-300";
    }
    if (message.includes("[OK]") || normalized.includes("başarıyla") || normalized.includes("tamamlandı")) {
        return "text-emerald-300";
    }
    if (message.includes("[INFO]")) return "text-sky-200";
    return "text-gray-300";
};

const connectionLabel: Record<ConnectionState, string> = {
    connecting: "Bağlanıyor",
    connected: "Canlı",
    reconnecting: "Yeniden bağlanıyor",
    disconnected: "Bağlantı kesildi",
};

const LiveLogViewer: React.FC<LiveLogViewerProps> = ({ runId }) => {
    const [logs, setLogs] = useState<string[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
    const bottomRef = useRef<HTMLDivElement>(null);
    const mountedRunRef = useRef(runId);

    const loadHistory = useCallback(async () => {
        if (!runId) return;
        setHistoryLoading(true);
        setHistoryError(null);
        try {
            const initialLogs = await pipelineRunsApi.getLogs(runId);
            if (mountedRunRef.current !== runId) return;
            setLogs((liveLogs) => mergeLogLines(initialLogs || [], liveLogs));
        } catch (err: any) {
            if (mountedRunRef.current !== runId) return;
            setHistoryError(err?.message || "Geçmiş loglar alınamadı.");
        } finally {
            if (mountedRunRef.current === runId) setHistoryLoading(false);
        }
    }, [runId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    useEffect(() => {
        if (!runId) return;

        mountedRunRef.current = runId;
        setLogs([]);
        setHistoryError(null);
        setConnectionState("connecting");

        const apiBase = import.meta.env.VITE_API_BASE_URL || window.location.origin;
        let hubUrl = "/hubs/notify";
        try {
            hubUrl = `${new URL(apiBase).origin}/hubs/notify`;
        } catch {
            // Relative hub URL aynı origin üzerinde çalışmaya devam eder.
        }

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, { accessTokenFactory: () => getAuthToken() || "" })
            .withAutomaticReconnect()
            .build();

        const receiveLog = (message: string) => {
            if (mountedRunRef.current !== runId) return;
            setLogs((current) => mergeLogLines(current, [message]));
        };

        connection.on("ReceiveLog", receiveLog);
        connection.onreconnecting(() => setConnectionState("reconnecting"));
        connection.onreconnected(async () => {
            setConnectionState("connected");
            try {
                await connection.invoke("JoinRunGroup", runId.toString());
            } catch {
                setConnectionState("disconnected");
            }
        });
        connection.onclose(() => setConnectionState("disconnected"));

        void loadHistory();
        void (async () => {
            try {
                await connection.start();
                await connection.invoke("JoinRunGroup", runId.toString());
                if (mountedRunRef.current === runId) setConnectionState("connected");
            } catch {
                if (mountedRunRef.current === runId) setConnectionState("disconnected");
            }
        })();

        return () => {
            mountedRunRef.current = -1;
            connection.off("ReceiveLog", receiveLog);
            void connection.stop();
        };
    }, [loadHistory, runId]);

    const stateDotClass = connectionState === "connected"
        ? "bg-emerald-400"
        : connectionState === "connecting" || connectionState === "reconnecting"
            ? "bg-amber-400 animate-pulse"
            : "bg-red-400";

    return (
        <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-gray-700 bg-[#0d1117] font-mono text-sm shadow-xl">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-700 bg-[#161b22] px-4 py-2">
                <div className="flex min-w-0 items-center gap-2 text-gray-300">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${stateDotClass}`} />
                    <span className="font-bold">Canlı Konsol</span>
                    <span className="truncate text-[10px] text-gray-500">Run #{runId} · {connectionLabel[connectionState]}</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => void loadHistory()}
                        disabled={historyLoading}
                        className="rounded-md p-1.5 text-gray-500 transition hover:bg-gray-800 hover:text-gray-200 disabled:opacity-50"
                        title="Geçmiş logları yeniden yükle"
                    >
                        {historyLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    </button>
                    <button
                        type="button"
                        onClick={() => setLogs([])}
                        className="rounded-md p-1.5 text-gray-500 transition hover:bg-gray-800 hover:text-gray-200"
                        title="Ekrandaki logları temizle"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {historyError && (
                <div className="flex items-center justify-between gap-3 border-b border-red-500/20 bg-red-500/10 px-4 py-2 text-xs text-red-200">
                    <span>Geçmiş yüklenemedi: {historyError}. Canlı bağlantı bağımsız çalışmaya devam ediyor.</span>
                    <button type="button" onClick={() => void loadHistory()} className="shrink-0 font-bold underline">Tekrar dene</button>
                </div>
            )}

            <div className="custom-scrollbar flex-1 space-y-1 overflow-y-auto p-4">
                {logs.length === 0 ? (
                    <div className="text-gray-500 opacity-70">
                        {historyLoading ? "Geçmiş loglar yükleniyor..." : "Henüz kayıtlı log yok. Yeni işlemler burada canlı görünecek."}
                    </div>
                ) : (
                    logs.map((log, index) => {
                        const parsed = parseLogLine(log);
                        return (
                            <div key={`${index}-${log}`} className="break-words rounded px-1 py-0.5 transition hover:bg-gray-800/50">
                                <span className={getLogColor(parsed.message)}>
                                    <span className="mr-2 text-gray-600">[{parsed.time}]</span>
                                    {parsed.message}
                                </span>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    );
};

export default LiveLogViewer;
