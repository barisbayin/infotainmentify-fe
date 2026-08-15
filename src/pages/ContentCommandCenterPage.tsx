import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Code2,
  Eye,
  FileText,
  ImageIcon,
  Layers,
  Loader2,
  Package,
  Play,
  RefreshCw,
  RotateCcw,
  Scissors,
  Terminal,
  Upload,
  WandSparkles,
  XCircle,
} from "lucide-react";
import {
  pipelineRunsApi,
  type PipelineRunDetailDto,
  type PipelineStageDto,
  type PipelineTimelinePageDto,
} from "../api/pipelineRuns";
import { Button, Card, Page, cn } from "../components/ui-kit";
import { RunStatusBadge } from "../components/pipeline-runs/RunStatusBadge";
import { RunRenderProgressPanel } from "../components/pipeline-runs/RunRenderProgressPanel";
import { ProductionReviewCenter } from "../components/ProductionReviewCenter";
import { TimelineViewer } from "../components/TimelineViewer";
import LiveLogViewer from "../components/LiveLogViewer";
import VideoPlayer from "../components/VideoPlayer";
import { ShortsStudio } from "../components/ShortsStudio";

const DETAIL_POLL_INTERVAL_MS = 5000;
type CenterTab = "video" | "brief" | "stages" | "review" | "timeline" | "shorts" | "package" | "outputs" | "logs";

const resolveMediaUrl = (url?: string | null) => {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;

  const apiBase = import.meta.env.VITE_API_BASE_URL || "";
  const normalizedPath = url.startsWith("/") ? url : `/${url}`;
  return `${apiBase}${normalizedPath}`;
};

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleString("tr-TR") : "-";

const formatDuration = (ms?: number) => {
  const total = Math.max(0, Math.round((ms ?? 0) / 1000));
  if (total < 60) return `${total}s`;
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}m ${seconds}s`;
};

const getStageTone = (status?: string) => {
  const key = (status || "").toLowerCase();
  if (key === "completed") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  if (key === "running" || key === "retrying") return "border-amber-500/25 bg-amber-500/10 text-amber-200";
  if (key === "failed" || key === "permanentlyfailed") return "border-red-500/25 bg-red-500/10 text-red-200";
  if (key === "waitingforapproval" || key === "outdated") return "border-sky-500/25 bg-sky-500/10 text-sky-200";
  return "border-zinc-800 bg-zinc-950/40 text-zinc-400";
};

const getStageIcon = (status?: string) => {
  switch (status) {
    case "Completed":
      return <CheckCircle2 size={15} className="text-emerald-300" />;
    case "Running":
    case "Retrying":
      return <Loader2 size={15} className="animate-spin text-amber-300" />;
    case "Failed":
    case "PermanentlyFailed":
      return <XCircle size={15} className="text-red-300" />;
    case "WaitingForApproval":
      return <Clock size={15} className="text-sky-300" />;
    default:
      return <Clock size={15} className="text-zinc-500" />;
  }
};

const canRetryStage = (stage: PipelineStageDto) =>
  ["Completed", "Failed", "PermanentlyFailed", "Outdated", "Cancelled", "WaitingForApproval"].includes(stage.status);

const isActiveRun = (status?: string) =>
  ["Pending", "Running", "WaitingForApproval"].includes(status || "");

const canStartUpload = (detail: PipelineRunDetailDto | null) => {
  if (!detail) return false;
  const renderStage = detail.stages.find((stage) => stage.stageType === "Render");
  const uploadStage = detail.stages.find((stage) => stage.stageType === "Upload");
  if (renderStage?.status !== "Completed") return false;
  if (uploadStage?.status === "Completed") return false;
  if (["Running", "Retrying"].includes(uploadStage?.status || "")) return false;
  return true;
};

const shouldShowUploadProgressPanel = (stage?: PipelineStageDto) =>
  Boolean(stage && ["Pending", "Running", "Retrying", "Failed", "PermanentlyFailed", "Cancelled"].includes(stage.status));

const getUploadProgressLabel = (stage?: PipelineStageDto) => {
  switch (stage?.status) {
    case "Pending":
      return "Upload kuyruga alindi, worker bekleniyor.";
    case "Running":
    case "Retrying":
      return "YouTube upload calisiyor. Byte progress SignalR ile guncellenecek.";
    case "Failed":
    case "PermanentlyFailed":
      return stage.error || "Upload hata verdi.";
    case "Cancelled":
      return "Upload durduruldu.";
    default:
      return undefined;
  }
};

const getTitle = (detail: PipelineRunDetailDto | null) =>
  detail?.runContextTitle ||
  detail?.brief?.mainTitle ||
  detail?.templateName ||
  (detail ? `Run #${detail.id}` : "Icerik Merkezi");

function MetricCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
      <div className="mb-3 flex items-center justify-between text-zinc-500">
        {icon}
        {hint && <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-[10px]">{hint}</span>}
      </div>
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="mt-1 text-xs text-zinc-500">{label}</div>
    </div>
  );
}

function StageRail({
  stages,
  onRetry,
  busyStage,
}: {
  stages: PipelineStageDto[];
  onRetry: (stageType: string) => void;
  busyStage?: string | null;
}) {
  return (
    <Card className="p-0">
      <div className="border-b border-zinc-800/70 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-bold text-zinc-100">
          <Layers size={15} className="text-indigo-300" />
          Stage cockpit
        </div>
        <div className="mt-1 text-xs text-zinc-500">Durum, hata ve retry kararlarini buradan ver.</div>
      </div>
      <div className="grid gap-2 p-3 md:grid-cols-2 2xl:grid-cols-3">
        {stages.map((stage, index) => (
          <div
            key={`${stage.stageType}-${index}`}
            className={cn("mb-2 rounded-xl border p-3", getStageTone(stage.status))}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {getStageIcon(stage.status)}
                  <span className="truncate text-sm font-bold text-zinc-100">{stage.stageType}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-zinc-500">
                  <span>{stage.status}</span>
                  <span>{formatDuration(stage.durationMs)}</span>
                  {stage.outputJsonLength ? <span>{Math.round(stage.outputJsonLength / 1024)} KB output</span> : null}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                disabled={!canRetryStage(stage)}
                isLoading={busyStage === stage.stageType}
                onClick={() => onRetry(stage.stageType)}
                className={cn(
                  "h-8 shrink-0 px-2",
                  stage.stageType === "Upload" && "gap-1.5 px-2.5"
                )}
                title="Bu stage'i yeniden calistir"
              >
                <RotateCcw size={13} />
                {stage.stageType === "Upload" && <span className="text-[11px]">Tekrar dene</span>}
              </Button>
            </div>
            {stage.error && (
              <div className="mt-2 line-clamp-3 rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1.5 text-[10px] leading-relaxed text-red-200">
                {stage.error}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

function StageOutputsPanel({ runId, stages }: { runId: number; stages: PipelineStageDto[] }) {
  const [openStage, setOpenStage] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState<string | null>(null);
  const [outputs, setOutputs] = useState<Record<string, string>>({});

  const loadOutput = async (stage: PipelineStageDto) => {
    const nextOpen = openStage === stage.stageType ? null : stage.stageType;
    setOpenStage(nextOpen);
    if (!nextOpen || outputs[stage.stageType]) return;

    setLoadingStage(stage.stageType);
    try {
      const response = await pipelineRunsApi.stageOutput(runId, stage.stageType);
      setOutputs((prev) => ({ ...prev, [stage.stageType]: response.outputJson || "" }));
    } catch (err: any) {
      toast.error(err?.message || "Stage ciktisi yuklenemedi.");
    } finally {
      setLoadingStage(null);
    }
  };

  return (
    <Card className="p-0">
      <div className="border-b border-zinc-800/70 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-bold text-zinc-100">
          <Code2 size={15} className="text-indigo-300" />
          Stage outputs
        </div>
        <div className="mt-1 text-xs text-zinc-500">JSON ciktilari tikladikca yuklenir; ilk sayfa acilisini yavaslatmaz.</div>
      </div>
      <div className="space-y-2 p-3">
        {stages.map((stage) => {
          const isOpen = openStage === stage.stageType;
          return (
            <div key={stage.stageType} className="rounded-xl border border-zinc-800 bg-zinc-950/35">
              <button
                type="button"
                onClick={() => void loadOutput(stage)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <div>
                  <div className="text-sm font-bold text-zinc-100">{stage.stageType}</div>
                  <div className="mt-0.5 text-[10px] text-zinc-500">
                    {stage.outputJsonLength ? `${Math.round(stage.outputJsonLength / 1024)} KB` : "Output yok"}
                  </div>
                </div>
                {loadingStage === stage.stageType ? <Loader2 size={15} className="animate-spin" /> : <Eye size={15} />}
              </button>
              {isOpen && (
                <pre className="max-h-[520px] overflow-auto border-t border-zinc-800 bg-black/40 p-4 text-[11px] leading-relaxed text-zinc-300">
                  {outputs[stage.stageType] || "Output bulunamadi."}
                </pre>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function PackagePanel({
  runId,
  onChanged,
}: {
  runId: number;
  onChanged: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [generatingTags, setGeneratingTags] = useState(false);
  const [pkg, setPkg] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPkg(await pipelineRunsApi.reviewPackage(runId));
    } catch (err: any) {
      toast.error(err?.message || "Yayin paketi yuklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    void load();
  }, [load]);

  const approve = async () => {
    setApproving(true);
    try {
      await pipelineRunsApi.approvePackage(runId, "Content center onayi");
      toast.success("Yayin paketi onaylandi.");
      await load();
      onChanged();
    } catch (err: any) {
      toast.error(err?.message || "Paket onaylanamadi.");
    } finally {
      setApproving(false);
    }
  };

  const regenerateTags = async () => {
    setGeneratingTags(true);
    try {
      const result = await pipelineRunsApi.regeneratePackageTags(runId);
      toast.success(`AI ${result.tags.length} arama odaklı etiket üretti.`);
      await load();
      onChanged();
    } catch (err: any) {
      toast.error(err?.message || "AI etiketleri üretilemedi.");
    } finally {
      setGeneratingTags(false);
    }
  };

  if (loading) {
    return (
      <Card className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-indigo-300" />
      </Card>
    );
  }

  if (!pkg?.hasStage) {
    return (
      <Card className="border-amber-500/20 bg-amber-500/10">
        <div className="font-bold text-amber-200">Package stage yok</div>
        <div className="mt-1 text-sm text-amber-100/70">{pkg?.retryHint || "Thumbnail/Package stage eklenmeli veya retry edilmeli."}</div>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-lg font-black text-white">YouTube package</div>
            <div className="text-xs text-zinc-500">Baslik, aciklama, bolumler, tagler ve upload hazirligi.</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={generatingTags}
              isLoading={generatingTags}
              onClick={regenerateTags}
              title="Final senaryo ve brief üzerinden yalnızca YouTube etiketlerini yeniden üretir."
            >
              <WandSparkles size={14} className="mr-1.5" />
              AI etiket
            </Button>
            <Button
              size="sm"
              variant={pkg.canApprove ? "primary" : "outline"}
              disabled={!pkg.canApprove}
              isLoading={approving}
              onClick={approve}
            >
              <CheckCircle2 size={14} className="mr-1.5" />
              Paketi onayla
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <section>
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">Title options</div>
            <div className="space-y-2">
              {(pkg.titleOptions || []).map((title: string, index: number) => (
                <div key={`${title}-${index}`} className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-200">
                  {title}
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">Description</div>
            <div className="whitespace-pre-wrap rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 text-sm leading-relaxed text-zinc-300">
              {pkg.description || "Aciklama yok."}
            </div>
          </section>

          <section>
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">Tags</div>
            <div className="flex flex-wrap gap-2">
              {[...(pkg.tags || []), ...(pkg.hashtags || [])].map((tag: string) => (
                <span key={tag} className="rounded-full border border-zinc-800 bg-zinc-950/60 px-2 py-1 text-xs text-zinc-300">
                  {tag}
                </span>
              ))}
            </div>
          </section>
        </div>
      </Card>

      <Card>
        <div className="mb-3 text-sm font-black text-white">Readiness</div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-500">Validation</span>
            <span className="text-zinc-100">{pkg.validationStatus || "-"}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-500">Approval</span>
            <span className="text-zinc-100">{pkg.approvalStatus || "-"}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-500">Ready to upload</span>
            <span className={pkg.readyToUpload ? "text-emerald-300" : "text-amber-300"}>
              {pkg.readyToUpload ? "Ready" : "Review"}
            </span>
          </div>
          {pkg.readyToUploadHint && <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 text-xs text-zinc-400">{pkg.readyToUploadHint}</div>}
        </div>
      </Card>
    </div>
  );
}

export default function ContentCommandCenterPage() {
  const params = useParams();
  const navigate = useNavigate();
  const runId = Number(params.id);
  const [detail, setDetail] = useState<PipelineRunDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CenterTab>("video");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [timelinePage, setTimelinePage] = useState<PipelineTimelinePageDto | null>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineSceneNumber, setTimelineSceneNumber] = useState(1);
  const timelineRequestKeyRef = useRef<string | null>(null);
  const timelineRequestSeqRef = useRef(0);

  const loadDetail = useCallback(async (initial = false) => {
    if (!runId) return;
    if (initial) setLoading(true);
    try {
      setDetail(await pipelineRunsApi.get(runId));
    } catch (err: any) {
      toast.error(err?.message || "Run detayi alinamadi.");
    } finally {
      setLoading(false);
    }
  }, [runId]);

  const loadTimelineScene = useCallback(async (sceneNumber = timelineSceneNumber) => {
    if (!runId) return;
    const targetScene = Math.max(1, sceneNumber || 1);
    const requestKey = `${runId}:${targetScene}`;
    if (timelineRequestKeyRef.current === requestKey) return;
    timelineRequestKeyRef.current = requestKey;
    const requestSeq = ++timelineRequestSeqRef.current;
    setTimelineLoading(true);
    try {
      const page = await pipelineRunsApi.timelineScene(runId, targetScene);
      if (requestSeq !== timelineRequestSeqRef.current) return;
      setTimelinePage(page);
      setTimelineSceneNumber(page.sceneNumber || targetScene);
    } catch (err: any) {
      if (requestSeq !== timelineRequestSeqRef.current) return;
      toast.error(err?.message || "Timeline yuklenemedi.");
    } finally {
      if (timelineRequestKeyRef.current === requestKey) timelineRequestKeyRef.current = null;
      if (requestSeq === timelineRequestSeqRef.current) setTimelineLoading(false);
    }
  }, [runId, timelineSceneNumber]);

  useEffect(() => {
    void loadDetail(true);
  }, [loadDetail]);

  useEffect(() => {
    if (!detail || !isActiveRun(detail.status)) return;
    const timer = window.setInterval(() => void loadDetail(false), DETAIL_POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [detail?.status, loadDetail]);

  useEffect(() => {
    if (activeTab === "timeline" && !timelinePage && !timelineLoading) {
      void loadTimelineScene(timelineSceneNumber);
    }
  }, [activeTab, loadTimelineScene, timelineLoading, timelinePage, timelineSceneNumber]);

  const renderStage = useMemo(
    () => detail?.stages.find((stage) => stage.stageType === "Render"),
    [detail?.stages]
  );
  const uploadStage = useMemo(
    () => detail?.stages.find((stage) => stage.stageType === "Upload"),
    [detail?.stages]
  );
  const waitingStage = detail?.stages.find((stage) => stage.status === "WaitingForApproval");
  const renderActive = Boolean(renderStage && ["Running", "Retrying"].includes(renderStage.status));
  const uploadActive = Boolean(uploadStage && ["Running", "Retrying"].includes(uploadStage.status));
  const showUploadProgressPanel = shouldShowUploadProgressPanel(uploadStage);
  const videoUrl = resolveMediaUrl(detail?.finalVideoUrl);
  const thumbnailUrl = resolveMediaUrl(detail?.thumbnailUrl);
  const completedStages = detail?.stages.filter((stage) => stage.status === "Completed").length ?? 0;
  const failedStages = detail?.stages.filter((stage) => ["Failed", "PermanentlyFailed"].includes(stage.status)).length ?? 0;
  const uploadCanRetry = Boolean(uploadStage && canRetryStage(uploadStage));
  const uploadCanStart = canStartUpload(detail) && !uploadCanRetry;

  const runAction = async (key: string, action: () => Promise<any>, success: string, rethrow = false) => {
    setBusyAction(key);
    try {
      await action();
      toast.success(success);
      void loadDetail(false);
    } catch (err: any) {
      toast.error(err?.message || "Islem basarisiz oldu.");
      if (rethrow) throw err;
    } finally {
      setBusyAction(null);
    }
  };

  const retryStage = (stageType: string, rethrow = false) =>
    runAction(
      `retry:${stageType}`,
      () => pipelineRunsApi.retryStage(runId, stageType),
      `${stageType} yeniden baslatildi.`,
      rethrow
    );

  const approve = () =>
    runAction("approve", () => pipelineRunsApi.approve(runId), "Onay verildi.");

  const startUpload = () =>
    runAction("upload", () => pipelineRunsApi.startUpload(runId), "Upload baslatildi.");

  const cancel = () =>
    runAction("cancel", () => pipelineRunsApi.cancel(runId), "Uretim durduruldu.");

  if (!runId || Number.isNaN(runId)) {
    return (
      <Page>
        <Card className="m-auto max-w-lg text-center">
          <div className="text-lg font-bold text-white">Gecersiz run ID</div>
          <Button className="mt-4" onClick={() => navigate("/pipeline-runs")}>Pipeline'a don</Button>
        </Card>
      </Page>
    );
  }

  const tabs: { key: CenterTab; label: string; icon: ReactNode }[] = [
    { key: "video", label: "Video", icon: <Play size={14} /> },
    { key: "brief", label: "Brief", icon: <FileText size={14} /> },
    { key: "stages", label: "Stages", icon: <Layers size={14} /> },
    { key: "review", label: "Kontrol", icon: <CheckCircle2 size={14} /> },
    { key: "timeline", label: "Timeline", icon: <Layers size={14} /> },
    { key: "shorts", label: "Shorts", icon: <Scissors size={14} /> },
    { key: "package", label: "Package", icon: <Package size={14} /> },
    { key: "outputs", label: "Ciktilar", icon: <Code2 size={14} /> },
    { key: "logs", label: "Konsol", icon: <Terminal size={14} /> },
  ];

  const currentTimelineScene = timelinePage?.sceneNumber || timelineSceneNumber || 1;
  const totalTimelineScenes = timelinePage?.totalSceneCount || timelinePage?.data?.reviewReport?.sceneCount || 0;
  const previousTimelineScene = timelinePage?.previousSceneNumber || (currentTimelineScene > 1 ? currentTimelineScene - 1 : undefined);
  const nextTimelineScene = timelinePage?.nextSceneNumber || (totalTimelineScenes > currentTimelineScene ? currentTimelineScene + 1 : undefined);

  return (
    <Page className="content-command-center">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
        <div className="shrink-0 rounded-2xl border border-zinc-800 bg-zinc-900/55 p-3 shadow-xl backdrop-blur-xl">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => navigate("/pipeline-runs")}
                className="mb-2 inline-flex items-center gap-2 text-[11px] font-semibold text-zinc-500 transition hover:text-zinc-200"
              >
                <ArrowLeft size={14} />
                Pipeline'a don
              </button>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="max-w-4xl truncate text-xl font-black tracking-tight text-white">
                  {loading && !detail ? "Icerik yukleniyor..." : getTitle(detail)}
                </h1>
                {detail && <RunStatusBadge status={detail.status} rounded="full" />}
                {detail?.packageApprovalStatus && (
                  <span className="rounded-full border border-zinc-700 bg-zinc-950/60 px-2.5 py-1 text-xs text-zinc-300">
                    Package: {detail.packageApprovalStatus}
                  </span>
                )}
                {detail?.derivativeType === "Short" && (
                  <span className="rounded-full border border-indigo-500/25 bg-indigo-500/10 px-2.5 py-1 text-xs font-bold text-indigo-200">
                    Short · Kaynak #{detail.sourceRunId}
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
                <span>Run #{runId}</span>
                <span>{detail?.templateName || "Template yok"}</span>
                <span>Baslangic: {formatDate(detail?.startedAt)}</span>
                {detail?.completedAt && <span>Bitis: {formatDate(detail.completedAt)}</span>}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => void loadDetail(false)} isLoading={loading}>
                <RefreshCw size={14} className="mr-1.5" />
                Yenile
              </Button>
              {waitingStage && (
                <Button size="sm" onClick={approve} isLoading={busyAction === "approve"}>
                  <Play size={14} className="mr-1.5" />
                  {waitingStage.stageType === "Render" ? "Render'a basla" : "Onayla"}
                </Button>
              )}
              {uploadCanStart && (
                <Button size="sm" onClick={startUpload} isLoading={busyAction === "upload"}>
                  <Upload size={14} className="mr-1.5" />
                  Upload baslat
                </Button>
              )}
              {uploadStage && (
                <Button
                  variant={uploadCanRetry ? "primary" : "secondary"}
                  size="sm"
                  disabled={!uploadCanRetry}
                  onClick={() => retryStage("Upload")}
                  isLoading={busyAction === "retry:Upload"}
                  className={cn(uploadCanRetry && "bg-red-600 hover:bg-red-500 text-white shadow-red-500/20")}
                  title="Upload stage'ini yeniden kuyruğa alır. Video YouTube'a gitmediyse buradan tekrar deneyebilirsin."
                >
                  <RotateCcw size={14} className="mr-1.5" />
                  Upload tekrar dene
                </Button>
              )}
              {detail && isActiveRun(detail.status) && (
                <Button variant="danger" size="sm" onClick={cancel} isLoading={busyAction === "cancel"}>
                  <XCircle size={14} className="mr-1.5" />
                  Durdur
                </Button>
              )}
            </div>
          </div>
        </div>

        {detail && (
          <RunRenderProgressPanel
            runId={detail.id}
            active={renderActive || uploadActive || Boolean(uploadStage && ["Pending", "Running", "Retrying"].includes(uploadStage.status))}
            totalSeconds={undefined}
            stageHint={showUploadProgressPanel ? "Upload" : renderActive ? "Render" : undefined}
            labelHint={showUploadProgressPanel ? getUploadProgressLabel(uploadStage) : undefined}
            statusHint={showUploadProgressPanel ? uploadStage?.status : renderStage?.status}
            errorHint={showUploadProgressPanel ? uploadStage?.error : undefined}
          />
        )}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/45">
            <div className="shrink-0 border-b border-zinc-800 bg-zinc-950/35 p-2">
              <div className="flex gap-2 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition",
                      activeTab === tab.key
                        ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                        : "border border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:text-zinc-100"
                    )}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {activeTab === "video" && (
                <div className="space-y-4">
                  {detail?.errorMessage && (
                    <Card className="border-red-500/20 bg-red-500/10">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 text-red-300" size={18} />
                        <div>
                          <div className="font-bold text-red-200">Run hatasi</div>
                          <div className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-red-100/80">{detail.errorMessage}</div>
                        </div>
                      </div>
                    </Card>
                  )}

                  <div className="grid gap-3 md:grid-cols-4">
                    <MetricCard label="Completed stage" value={`${completedStages}/${detail?.stages.length || 0}`} icon={<CheckCircle2 size={17} />} />
                    <MetricCard label="Failed stage" value={failedStages} icon={<AlertTriangle size={17} />} />
                    <MetricCard label="Video" value={detail?.finalVideoUrl ? "Var" : "Yok"} hint={detail?.finalVideoAspectRatio} icon={<Play size={17} />} />
                    <MetricCard label="Thumbnail" value={detail?.thumbnailUrl ? "Var" : "Yok"} icon={<ImageIcon size={17} />} />
                  </div>

                  <div className="grid gap-4">
                    <Card className="space-y-4 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-black text-white">Final video</div>
                          <div className="text-xs text-zinc-500">Render varsa burada oynatilir; yoksa render karari stage panelinden verilir.</div>
                        </div>
                      </div>
                      {videoUrl ? (
                        <VideoPlayer
                          videoUrl={videoUrl}
                          posterUrl={thumbnailUrl}
                          videoWidth={detail?.finalVideoWidth}
                          videoHeight={detail?.finalVideoHeight}
                          aspectRatio={detail?.finalVideoAspectRatio}
                        />
                      ) : (
                        <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-950/35 text-sm text-zinc-500">
                          Final video henuz yok.
                        </div>
                      )}
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === "brief" && (
                <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
                    <Card className="p-4">
                      <div className="mb-3 text-lg font-black text-white">Brief & kapak</div>
                      {thumbnailUrl ? (
                        <img
                          src={thumbnailUrl}
                          alt="Thumbnail"
                          className="mb-4 aspect-video w-full rounded-xl border border-zinc-800 object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="mb-4 flex aspect-video items-center justify-center rounded-xl border border-dashed border-zinc-800 text-xs text-zinc-500">
                          Thumbnail yok
                        </div>
                      )}
                      <div className="space-y-3 text-sm">
                        {[
                          ["Ana baslik", detail?.brief?.mainTitle],
                          ["Aci", detail?.brief?.angle],
                          ["Kitle", detail?.brief?.audience],
                          ["Sure", detail?.brief?.targetDuration],
                          ["Mutlaka", detail?.brief?.mustCover],
                          ["Kacin", detail?.brief?.avoid],
                          ["Hook", detail?.brief?.hookDirection],
                          ["Thumbnail", detail?.brief?.thumbnailDirection],
                          ["Not", detail?.brief?.notes],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-lg border border-zinc-800 bg-zinc-950/35 p-3">
                            <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">{label}</div>
                            <div className="mt-1 text-zinc-300">{value || "-"}</div>
                          </div>
                        ))}
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="mb-3 text-lg font-black text-white">Run ozeti</div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <MetricCard label="Run ID" value={`#${runId}`} icon={<Activity size={17} />} />
                        <MetricCard label="Template" value={detail?.templateName || "-"} icon={<Layers size={17} />} />
                        <MetricCard label="Package" value={detail?.packageApprovalStatus || "-"} icon={<Package size={17} />} />
                        <MetricCard label="Auto publish" value={detail?.autoPublish ? "Acik" : "Kapali"} icon={<Upload size={17} />} />
                      </div>
                    </Card>
                </div>
              )}

              {activeTab === "stages" && detail && (
                <StageRail
                  stages={detail.stages}
                  busyStage={busyAction?.startsWith("retry:") ? busyAction.split(":")[1] : null}
                  onRetry={retryStage}
                />
              )}

              {activeTab === "review" && detail && (
                <ProductionReviewCenter
                  runId={detail.id}
                  canOpenTimeline
                  onOpenTimeline={() => setActiveTab("timeline")}
                  onRetryStage={(stageType) => retryStage(stageType, true)}
                  onApproveStage={approve}
                  onOpenVideo={() => setActiveTab("video")}
                  onAssetChanged={() => {
                    void loadDetail(false);
                    setTimelinePage(null);
                  }}
                  refreshKey={`${detail.status}:${detail.packageApprovalStatus || ""}:${detail.stages.map((stage) => `${stage.stageType}-${stage.status}-${stage.outputJsonLength ?? 0}`).join("|")}`}
                />
              )}

              {activeTab === "timeline" && (
                <div className="space-y-3">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <div className="text-lg font-black text-white">
                        Timeline {totalTimelineScenes ? `Sahne ${currentTimelineScene}/${totalTimelineScenes}` : `Sahne ${currentTimelineScene}`}
                      </div>
                      <div className="text-xs text-zinc-500">Sahne sahne yuklenir; agir run'larda timeout riskini dusurur.</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={!previousTimelineScene || timelineLoading}
                        onClick={() => previousTimelineScene && void loadTimelineScene(previousTimelineScene)}
                      >
                        Onceki
                      </Button>
                      <label className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/45 px-2 py-1 text-xs text-zinc-400">
                        Sahne
                        <input
                          type="number"
                          min={1}
                          max={totalTimelineScenes || undefined}
                          value={timelineSceneNumber}
                          onChange={(event) => setTimelineSceneNumber(Math.max(1, Number(event.target.value) || 1))}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") void loadTimelineScene(timelineSceneNumber);
                          }}
                          className="h-7 w-16 rounded-lg border border-zinc-800 bg-zinc-900 px-2 text-center font-mono text-xs text-zinc-100 outline-none focus:border-indigo-500/50"
                        />
                      </label>
                      <Button variant="ghost" size="sm" onClick={() => void loadTimelineScene(timelineSceneNumber)} isLoading={timelineLoading}>
                        <RefreshCw size={14} className="mr-1.5" />
                        Yukle
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={!nextTimelineScene || timelineLoading}
                        onClick={() => nextTimelineScene && void loadTimelineScene(nextTimelineScene)}
                      >
                        Sonraki
                      </Button>
                    </div>
                  </div>
                  {timelineLoading && !timelinePage ? (
                    <Card className="flex h-80 items-center justify-center">
                      <Loader2 className="animate-spin text-indigo-300" />
                    </Card>
                  ) : timelinePage ? (
                    <TimelineViewer
                      runId={runId}
                      data={timelinePage.data}
                    />
                  ) : (
                    <Card className="text-sm text-zinc-500">Timeline henuz yuklenmedi.</Card>
                  )}
                </div>
              )}

              {activeTab === "package" && detail && (
                <PackagePanel runId={detail.id} onChanged={() => void loadDetail(false)} />
              )}

              {activeTab === "shorts" && detail && (
                <ShortsStudio
                  sourceRunId={detail.sourceRunId || detail.id}
                  currentRunId={detail.id}
                  sourceTitle={detail.derivativeType === "Short" ? detail.derivativeLabel : getTitle(detail)}
                  isDerivative={detail.derivativeType === "Short"}
                />
              )}

              {activeTab === "outputs" && detail && (
                <StageOutputsPanel runId={detail.id} stages={detail.stages} />
              )}

              {activeTab === "logs" && detail && (
                <div className="h-[calc(100vh-260px)] min-h-[520px]">
                  <LiveLogViewer runId={detail.id} />
                </div>
              )}
            </div>
        </div>
      </div>
    </Page>
  );
}
