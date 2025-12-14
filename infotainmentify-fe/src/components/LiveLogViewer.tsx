import React, { useEffect, useState, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { getAuthToken } from '../api/http';
import { pipelineRunsApi } from '../api/pipelineRuns';

interface LiveLogViewerProps {
    runId: number;
}

const LiveLogViewer: React.FC<LiveLogViewerProps> = ({ runId }) => {
    const [logs, setLogs] = useState<string[]>([]);
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    
    useEffect(() => {
        // 1. Bağlantıyı Oluştur
        
        const apiBase = import.meta.env.VITE_API_BASE_URL || window.location.origin;
        let hubUrl = "/hubs/notify";

        try {
            // API Base URL'den origin'i alıp hub yolunu ekliyoruz
            // Örn: https://api.example.com/api/v1 -> https://api.example.com/hubs/pipeline
            const url = new URL(apiBase);
            hubUrl = `${url.origin}/hubs/notify`;
        } catch (e) {
            console.warn("API Base URL parse edilemedi, relative path kullanılıyor.", e);
        }

        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                accessTokenFactory: () => getAuthToken() || ""
            })
            .withAutomaticReconnect()
            .build();

        setConnection(newConnection);
    }, []);

    useEffect(() => {
        if (connection && runId) {
            // Önce state'i temizle
            setLogs([]);

            // 1. Geçmiş Logları Çek
            pipelineRunsApi.getLogs(runId)
                .then(initialLogs => {
                    setLogs(initialLogs || []);
                    // 2. SignalR Başlat
                    return connection.start();
                })
                .then(() => {
                    console.log('SignalR Connected!');

                    // 3. Odaya (Gruba) Katıl
                    connection.invoke("JoinRunGroup", runId.toString());

                    // 4. Logları Dinle
                    connection.on("ReceiveLog", (message: string) => {
                        setLogs(prev => [...prev, message]);
                    });
                })
                .catch(e => console.error('Connection or Logs failed: ', e));

            // Temizlik
            return () => {
                connection.off("ReceiveLog");
                connection.stop();
            };
        }
    }, [connection, runId]);

    return (
        <div className="w-full h-full flex flex-col bg-[#0d1117] rounded-lg border border-gray-700 shadow-xl overflow-hidden font-mono text-sm">
             {/* Header */}
             <div className="bg-[#161b22] px-4 py-2 border-b border-gray-700 flex items-center justify-between shrink-0">
                <span className="text-gray-300 font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Live Terminal (SignalR)
                </span>
                <span className="text-xs text-gray-500">Connected: Run #{runId}</span>
            </div>

            {/* Terminal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                {logs.length === 0 ? (
                    <div className="text-gray-500 italic opacity-50">Waiting for logs...</div>
                ) : (
                    logs.map((log, index) => (
                        <div key={index} className="break-all transition-all duration-300 hover:bg-gray-800/50">
                             <span className={
                                log.includes("ERROR") ? "text-red-400 font-bold" :
                                log.includes("Warning") ? "text-yellow-400" :
                                log.includes("Success") || log.includes("Completed") ? "text-green-400" :
                                "text-gray-300"
                            }>
                                <span className="text-gray-600 mr-2">[{new Date().toLocaleTimeString()}]</span>
                                {log}
                            </span>
                        </div>
                    ))
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    );
};

export default LiveLogViewer;