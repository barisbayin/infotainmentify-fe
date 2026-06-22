import React, { useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { getAuthToken } from '../api/http';
import { pipelineRunsApi } from '../api/pipelineRuns';

interface LiveLogViewerProps {
    runId: number;
}

type ParsedLogLine = {
    time: string;
    message: string;
};

const logTimePattern = /^(\d{2}:\d{2}:\d{2})\s+-\s+(.*)$/;

const ensureLogHasTime = (log: string): string => {
    if (logTimePattern.test(log)) {
        return log;
    }

    const time = new Date().toLocaleTimeString('tr-TR', { hour12: false });
    return `${time} - ${log}`;
};

const parseLogLine = (log: string): ParsedLogLine => {
    const match = log.match(logTimePattern);
    if (match) {
        return {
            time: match[1],
            message: match[2],
        };
    }

    return {
        time: '--:--:--',
        message: log,
    };
};

const getLogColor = (message: string) => {
    if (message.includes('[HATA]') || message.includes('ERROR') || message.includes('FATAL')) {
        return 'text-red-300';
    }

    if (message.includes('[UYARI]') || message.includes('Warning')) {
        return 'text-amber-300';
    }

    if (message.includes('[OK]') || message.includes('başarıyla') || message.includes('tamamlandı')) {
        return 'text-emerald-300';
    }

    if (message.includes('[INFO]')) {
        return 'text-sky-200';
    }

    return 'text-gray-300';
};

const LiveLogViewer: React.FC<LiveLogViewerProps> = ({ runId }) => {
    const [logs, setLogs] = useState<string[]>([]);
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    useEffect(() => {
        const apiBase = import.meta.env.VITE_API_BASE_URL || window.location.origin;
        let hubUrl = '/hubs/notify';

        try {
            const url = new URL(apiBase);
            hubUrl = `${url.origin}/hubs/notify`;
        } catch (e) {
            console.warn('API base URL parse edilemedi, relative hub yolu kullanılacak.', e);
        }

        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                accessTokenFactory: () => getAuthToken() || '',
            })
            .withAutomaticReconnect()
            .build();

        setConnection(newConnection);
    }, []);

    useEffect(() => {
        if (!connection || !runId) return;

        setLogs([]);

        pipelineRunsApi.getLogs(runId)
            .then(initialLogs => {
                setLogs((initialLogs || []).map(ensureLogHasTime));
                return connection.start();
            })
            .then(() => {
                console.log('SignalR canlı konsol bağlantısı kuruldu.');
                return connection.invoke('JoinRunGroup', runId.toString());
            })
            .then(() => {
                connection.on('ReceiveLog', (message: string) => {
                    setLogs(prev => [...prev, ensureLogHasTime(message)]);
                });
            })
            .catch(e => console.error('Canlı konsol bağlantısı veya geçmiş loglar alınamadı:', e));

        return () => {
            connection.off('ReceiveLog');
            connection.stop().catch(() => undefined);
        };
    }, [connection, runId]);

    return (
        <div className="w-full h-full flex flex-col bg-[#0d1117] rounded-lg border border-gray-700 shadow-xl overflow-hidden font-mono text-sm">
            <div className="bg-[#161b22] px-4 py-2 border-b border-gray-700 flex items-center justify-between shrink-0">
                <span className="text-gray-300 font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Canlı Konsol
                </span>
                <span className="text-xs text-gray-500">SignalR bağlı: Run #{runId}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                {logs.length === 0 ? (
                    <div className="text-gray-500 italic opacity-60">Log bekleniyor...</div>
                ) : (
                    logs.map((log, index) => {
                        const parsed = parseLogLine(log);
                        return (
                            <div key={`${index}-${log}`} className="break-words transition-all duration-300 hover:bg-gray-800/50 px-1 py-0.5 rounded">
                                <span className={getLogColor(parsed.message)}>
                                    <span className="text-gray-600 mr-2">[{parsed.time}]</span>
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
