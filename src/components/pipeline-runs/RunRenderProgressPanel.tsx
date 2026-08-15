import { memo, useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { Activity, Clock, UploadCloud } from "lucide-react";
import { getAuthToken } from "../../api/http";
import type { RenderProgressDto } from "../../api/pipelineRuns";
import { cn } from "../ui-kit";

type RunRenderProgressPanelProps = {
  runId: number;
  active: boolean;
  totalSeconds?: number;
  stageHint?: "Render" | "Upload";
  labelHint?: string;
  statusHint?: string;
  errorHint?: string | null;
};

const pickText = (source: any, ...keys: string[]) => {
  if (!source) return "";
  for (const key of keys) {
    const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
    const value = source[key] ?? source[pascalKey];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

const pickNumber = (source: any, ...keys: string[]) => {
  if (!source) return undefined;
  for (const key of keys) {
    const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
    const value = source[key] ?? source[pascalKey];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return undefined;
};

const clampPercent = (value?: number) => Math.max(0, Math.min(100, Number.isFinite(value ?? NaN) ? Number(value) : 0));

const normalizeRenderProgress = (payload: any): RenderProgressDto => ({
  runId: pickNumber(payload, "runId") ?? 0,
  stage: pickText(payload, "stage"),
  label: pickText(payload, "label"),
  status: pickText(payload, "status"),
  percent: clampPercent(pickNumber(payload, "percent")),
  currentSeconds: pickNumber(payload, "currentSeconds"),
  totalSeconds: pickNumber(payload, "totalSeconds"),
  currentBytes: pickNumber(payload, "currentBytes"),
  totalBytes: pickNumber(payload, "totalBytes"),
  chunkIndex: pickNumber(payload, "chunkIndex"),
  totalChunks: pickNumber(payload, "totalChunks"),
  isCompleted: Boolean(payload?.isCompleted ?? payload?.IsCompleted ?? false),
  timestampUtc: payload?.timestampUtc ?? payload?.TimestampUtc,
});

const formatProgressTime = (seconds?: number) => {
  if (!Number.isFinite(seconds ?? NaN) || Number(seconds) < 0) return "--:--";

  const total = Math.floor(Number(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainingSeconds = total % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const formatBytes = (bytes?: number) => {
  if (!Number.isFinite(bytes ?? NaN) || Number(bytes) < 0) return "--";

  const units = ["B", "KB", "MB", "GB"];
  let value = Number(bytes);
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
};

const getNotifyHubUrl = () => {
  const apiBase = import.meta.env.VITE_API_BASE_URL || window.location.origin;

  try {
    const url = new URL(apiBase);
    return `${url.origin}/hubs/notify`;
  } catch {
    return "/hubs/notify";
  }
};

export const RunRenderProgressPanel = memo(({
  runId,
  active,
  totalSeconds,
  stageHint,
  labelHint,
  statusHint,
  errorHint,
}: RunRenderProgressPanelProps) => {
  const [progress, setProgress] = useState<RenderProgressDto | null>(null);
  const [connectionState, setConnectionState] = useState<"connecting" | "connected" | "offline">("connecting");

  useEffect(() => {
    setProgress(null);
  }, [runId]);

  useEffect(() => {
    if (!runId) return;

    let disposed = false;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(getNotifyHubUrl(), {
        accessTokenFactory: () => getAuthToken() || "",
      })
      .withAutomaticReconnect()
      .build();

    const joinRunGroup = async () => {
      if (disposed) return;
      try {
        await connection.invoke("JoinRunGroup", runId.toString());
        setConnectionState("connected");
      } catch {
        if (!disposed) setConnectionState("offline");
      }
    };

    connection.on("RenderProgress", (payload: any) => {
      const next = normalizeRenderProgress(payload);
      if (next.runId && next.runId !== runId) return;
      setProgress(next);
    });

    connection.onreconnecting(() => {
      if (!disposed) setConnectionState("connecting");
    });

    connection.onreconnected(() => {
      void joinRunGroup();
    });

    connection.onclose(() => {
      if (!disposed) setConnectionState("offline");
    });

    setConnectionState("connecting");
    connection.start()
      .then(joinRunGroup)
      .catch(() => {
        if (!disposed) setConnectionState("offline");
      });

    return () => {
      disposed = true;
      connection.off("RenderProgress");

      const stopConnection = async () => {
        try {
          if (connection.state === signalR.HubConnectionState.Connected) {
            await connection.invoke("LeaveRunGroup", runId.toString());
          }
        } catch {
          // noop
        } finally {
          await connection.stop().catch(() => undefined);
        }
      };

      void stopConnection();
    };
  }, [runId]);

  if (!active && !progress && !stageHint && !errorHint) return null;

  const percent = clampPercent(progress?.percent ?? 0);
  const effectiveStage = progress?.stage || stageHint || "Render";
  const effectiveStatus = progress?.status || statusHint || "";
  const isUpload = effectiveStage.toLowerCase() === "upload";
  const isFailed = /fail|error|hata|cancel/i.test(effectiveStatus) || Boolean(errorHint);
  const current = progress?.currentSeconds ?? (totalSeconds ? totalSeconds * (percent / 100) : undefined);
  const total = progress?.totalSeconds ?? totalSeconds;
  const chunkText = progress?.chunkIndex && progress?.totalChunks
    ? isUpload
      ? `Hedef ${progress.chunkIndex}/${progress.totalChunks}`
      : `Chunk ${progress.chunkIndex}/${progress.totalChunks}`
    : isUpload
      ? "YouTube"
      : "Tek gecis";
  const title = isUpload ? "Upload ilerleme" : "Render ilerleme";
  const fallbackLabel = isUpload
    ? "YouTube upload takip ediliyor"
    : active
      ? "FFmpeg render takip ediliyor"
      : "Render bilgisi bekleniyor";
  const measureText = isUpload
    ? `${formatBytes(progress?.currentBytes)} / ${formatBytes(progress?.totalBytes)}`
    : `${formatProgressTime(current)} / ${formatProgressTime(total)}`;
  const stateLabel = connectionState === "connected"
    ? "SignalR live"
    : connectionState === "connecting"
      ? "Baglaniyor"
      : "SignalR offline";
  const label = progress?.label || errorHint || labelHint || fallbackLabel;
  const working = active && !progress?.isCompleted && !isFailed;

  return (
    <div
      className={cn(
        "mx-5 mt-4 rounded-xl border p-4 shadow-lg",
        isFailed
          ? "border-red-500/25 bg-red-500/[0.07] shadow-red-950/20"
          : isUpload
            ? "border-sky-500/20 bg-sky-500/[0.06] shadow-sky-950/20"
            : "border-indigo-500/20 bg-indigo-500/[0.06] shadow-indigo-950/20"
      )}
    >
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-indigo-500/25 bg-indigo-500/10 text-indigo-300">
            {isUpload ? (
              <UploadCloud size={17} className={working ? "animate-pulse" : ""} />
            ) : (
              <Activity size={17} className={working ? "animate-pulse" : ""} />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-bold text-zinc-100">{title}</span>
              <span className="rounded-full border border-zinc-700 bg-zinc-950/60 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
                {chunkText}
              </span>
            </div>
            <div className="mt-0.5 truncate text-xs text-zinc-400">
              {label}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          {effectiveStatus && (
            <span
              className={cn(
                "rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-wide",
                isFailed
                  ? "border-red-500/20 bg-red-500/10 text-red-300"
                  : "border-zinc-800 bg-zinc-950/50 text-zinc-300"
              )}
            >
              {effectiveStatus}
            </span>
          )}
          <span className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/50 px-2 py-1 font-mono">
            {isUpload ? <UploadCloud size={12} className="text-indigo-300" /> : <Clock size={12} className="text-indigo-300" />}
            {measureText}
          </span>
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px]",
              connectionState === "connected"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                : connectionState === "connecting"
                  ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
                  : "border-red-500/20 bg-red-500/10 text-red-300"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                connectionState === "connected" ? "bg-emerald-400" : connectionState === "connecting" ? "bg-amber-400 animate-pulse" : "bg-red-400"
              )}
            />
            {stateLabel}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-3 flex-1 overflow-hidden rounded-full border border-zinc-800 bg-zinc-950">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-500",
              isFailed ? "bg-gradient-to-r from-red-500 to-rose-400" : "bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="w-14 text-right font-mono text-sm font-bold text-indigo-200">
          {Math.round(percent)}%
        </div>
      </div>
    </div>
  );
});

RunRenderProgressPanel.displayName = "RunRenderProgressPanel";
