import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  pipelineRunsApi,
  type PipelineReviewImagePageDto,
  type PipelineReviewImageItemDto,
  type PipelineReviewIssueDto,
  type PipelineReviewReadinessItemDto,
  type PipelineReviewStageDto,
  type PipelineRunReviewDto,
  type RunReviewDecisionDto,
  type ImageRegenerationMode,
} from "../api/pipelineRuns";
import { Button, cn } from "./ui-kit";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  BarChart3,
  ChevronDown,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  Copy,
  Edit3,
  FileText,
  Film,
  ImageIcon,
  Layers,
  Loader2,
  Package,
  Play,
  RefreshCw,
  Scan,
  RotateCcw,
  Save,
  Timer,
  WandSparkles,
  X,
} from "lucide-react";

type ProductionReviewCenterProps = {
  runId: number;
  canOpenTimeline?: boolean;
  onOpenTimeline?: () => void;
  onRetryStage?: (stageType: string) => void | Promise<void>;
  onApproveStage?: () => void;
  onOpenVideo?: () => void;
  onAssetChanged?: () => void;
  refreshKey?: string | number;
};

type ReviewTab = "overview" | "plan" | "script" | "images" | "timeline" | "package" | "render" | "debug";
const REVIEW_IMAGE_PAGE_SIZE = 18;

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? "https://localhost:7177" : "");

const tabs: { key: ReviewTab; label: string; icon: ReactNode }[] = [
  { key: "overview", label: "Özet", icon: <BarChart3 size={14} /> },
  { key: "plan", label: "Plan", icon: <ClipboardCheck size={14} /> },
  { key: "script", label: "Script", icon: <FileText size={14} /> },
  { key: "images", label: "Images", icon: <ImageIcon size={14} /> },
  { key: "timeline", label: "Timeline", icon: <Layers size={14} /> },
  { key: "package", label: "Package", icon: <Package size={14} /> },
  { key: "render", label: "Render", icon: <Play size={14} /> },
  { key: "debug", label: "Debug", icon: <Code2 size={14} /> },
];

const formatDuration = (seconds?: number) => {
  const total = Math.max(0, Math.round(seconds ?? 0));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return minutes > 0 ? `${minutes}m ${rest}s` : `${rest}s`;
};

const shortHash = (hash?: string) => {
  if (!hash) return "-";
  return hash.length <= 12 ? hash : `${hash.slice(0, 12)}...`;
};

const resolveMediaUrl = (path?: string) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  const clean = decodeURIComponent(path).replace(/\\/g, "/");
  const userFilesIndex = clean.toLowerCase().indexOf("/userfiles/");
  if (userFilesIndex >= 0) return `${API_BASE}${clean.slice(userFilesIndex)}`;
  if (clean.startsWith("/")) return `${API_BASE}${clean}`;
  if (clean.toLowerCase().startsWith("userfiles/")) return `${API_BASE}/${clean}`;
  return `${API_BASE}/${clean}`;
};

const severityClass = (severity?: string) => {
  const key = (severity ?? "").toLowerCase();
  if (key === "error") return "border-red-500/30 bg-red-500/10 text-red-300";
  if (key === "warning") return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  if (key === "healthy" || key === "ready" || key === "info") return "border-emerald-500/25 bg-emerald-500/10 text-emerald-300";
  return "border-sky-500/30 bg-sky-500/10 text-sky-300";
};

const readinessClass = (status?: string) => {
  const key = (status ?? "").toLowerCase();
  if (key === "blocked" || key === "failed" || key === "permanentlyfailed" || key === "error") {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }
  if (key === "review" || key === "outdated" || key === "waitingforapproval" || key === "warning") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  }
  if (key === "ready" || key === "completed" || key === "approved" || key === "info" || key === "healthy") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }
  return "border-zinc-700 bg-zinc-900 text-zinc-400";
};

const MetricCard = ({
  icon,
  label,
  value,
  hint,
  tone = "zinc",
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "zinc" | "green" | "amber" | "red" | "indigo";
}) => {
  const toneClass = {
    zinc: "border-zinc-800 bg-zinc-950/45 text-zinc-300",
    green: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
    amber: "border-amber-500/20 bg-amber-500/10 text-amber-200",
    red: "border-red-500/20 bg-red-500/10 text-red-200",
    indigo: "border-indigo-500/20 bg-indigo-500/10 text-indigo-200",
  }[tone];

  return (
    <div className={cn("rounded-xl border p-4", toneClass)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-zinc-500">{icon}</div>
        {hint && <span className="rounded-full border border-zinc-800 bg-black/20 px-2 py-0.5 text-[10px] text-zinc-500">{hint}</span>}
      </div>
      <div className="text-2xl font-black tracking-tight text-white">{value}</div>
      <div className="mt-1 text-xs font-medium text-zinc-500">{label}</div>
    </div>
  );
};

const getIssueActionKey = (issue: Pick<PipelineReviewIssueDto, "actionType" | "stageType" | "code" | "sceneNumber" | "beatIndex" | "imagePath">) =>
  `${issue.actionType || "none"}:${issue.stageType}:${issue.code}:${issue.sceneNumber ?? 0}:${issue.beatIndex ?? 0}:${issue.imagePath || ""}`;

const getImageActionKey = (image: PipelineReviewImageItemDto) =>
  `regenerate_image:Image:image.card:${image.sceneNumber}:${image.beatIndex}:${image.imagePath || ""}`;

const isAbortLikeError = (err: any) => {
  const message = String(err?.message || err || "").toLowerCase();
  return err?.name === "AbortError" || message.includes("aborted") || message.includes("abort");
};

const parseJson = <T,>(json?: string): T | null => {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
};

const copyText = async (text: string, label: string) => {
  if (!text) return;
  await navigator.clipboard.writeText(text);
  toast.success(`${label} kopyalandı.`);
};

export function ProductionReviewCenter({
  runId,
  canOpenTimeline,
  onOpenTimeline,
  onRetryStage,
  onApproveStage,
  onOpenVideo,
  onAssetChanged,
  refreshKey,
}: ProductionReviewCenterProps) {
  const [review, setReview] = useState<PipelineRunReviewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ tone: "success" | "error" | "info"; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<ReviewTab>("overview");
  const [imagePage, setImagePage] = useState<PipelineReviewImagePageDto | null>(null);
  const [imagePageLoading, setImagePageLoading] = useState(false);
  const [imagePageIndex, setImagePageIndex] = useState(0);
  const [packageDetail, setPackageDetail] = useState<PipelineRunReviewDto["package"] | null>(null);
  const [packageLoading, setPackageLoading] = useState(false);
  const [decisions, setDecisions] = useState<RunReviewDecisionDto[]>([]);
  const [decisionLoadingGate, setDecisionLoadingGate] = useState<string | null>(null);

  const loadReview = useCallback(async (initial = false) => {
    try {
      setError(null);
      if (initial) setLoading(true);
      const data = await pipelineRunsApi.review(runId);
      setReview(data);
    } catch (err: any) {
      setError(err?.message || "Review verisi alınamadı.");
    } finally {
      setLoading(false);
    }
  }, [runId]);

  const loadImagePage = useCallback(async (pageIndex = imagePageIndex) => {
    try {
      setImagePageLoading(true);
      const data = await pipelineRunsApi.reviewImages(
        runId,
        pageIndex * REVIEW_IMAGE_PAGE_SIZE,
        REVIEW_IMAGE_PAGE_SIZE
      );
      setImagePage(data);
      setImagePageIndex(pageIndex);
    } catch (err: any) {
      toast.error(err?.message || "Gorsel listesi yuklenemedi.");
    } finally {
      setImagePageLoading(false);
    }
  }, [imagePageIndex, runId]);

  const loadPackageDetail = useCallback(async () => {
    try {
      setPackageLoading(true);
      const data = await pipelineRunsApi.reviewPackage(runId);
      setPackageDetail(data);
    } catch (err: any) {
      toast.error(err?.message || "Yayin paketi yuklenemedi.");
    } finally {
      setPackageLoading(false);
    }
  }, [runId]);

  const loadDecisions = useCallback(async () => {
    try {
      const data = await pipelineRunsApi.listReviewDecisions(runId);
      setDecisions(data);
    } catch {
      setDecisions([]);
    }
  }, [runId]);

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        setError(null);
        setLoading((value) => value || !review);
        const data = await pipelineRunsApi.review(runId);
        if (!ignore) setReview(data);
      } catch (err: any) {
        if (!ignore) setError(err?.message || "Review verisi alınamadı.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    load();
    loadDecisions();
    return () => {
      ignore = true;
    };
  }, [runId, refreshKey, loadDecisions]);

  useEffect(() => {
    setImagePage(null);
    setImagePageIndex(0);
    setPackageDetail(null);
  }, [runId, refreshKey]);

  useEffect(() => {
    setActionFeedback(null);
  }, [runId]);

  useEffect(() => {
    if (activeTab === "images" && !imagePage && !imagePageLoading) {
      void loadImagePage(0);
    }
  }, [activeTab, imagePage, imagePageLoading, loadImagePage]);

  useEffect(() => {
    if (activeTab === "package" && !packageDetail && !packageLoading) {
      void loadPackageDetail();
    }
  }, [activeTab, packageDetail, packageLoading, loadPackageDetail]);

  const saveDecision = async (gate: string, status: "Approved" | "Rejected" | "Pending") => {
    try {
      setDecisionLoadingGate(gate);
      await pipelineRunsApi.saveReviewDecision(runId, gate, { status });
      toast.success(`${gate} kararı kaydedildi.`);
      await loadDecisions();
    } catch (err: any) {
      toast.error(err?.message || "Review kararı kaydedilemedi.");
    } finally {
      setDecisionLoadingGate(null);
    }
  };

  const issueSummary = useMemo(() => {
    const issues = review?.issues ?? [];
    return {
      errors: issues.filter((x) => String(x.severity).toLowerCase() === "error").length,
      warnings: issues.filter((x) => String(x.severity).toLowerCase() === "warning").length,
      infos: issues.filter((x) => String(x.severity).toLowerCase() === "info").length,
    };
  }, [review?.issues]);

  const visualEventRate = review?.visuals.visualEventsPerMinute ?? review?.visuals.imagesPerMinute ?? 0;
  const visualEventCount = review?.visuals.visualEventCount ?? review?.timeline.visualCount ?? review?.visuals.imageCount ?? 0;
  const visualTone = !review ? "zinc" : visualEventRate >= 10 ? "green" : visualEventCount > 0 ? "amber" : "zinc";
  const holdTone = !review || review.timeline.longHoldCount > 0 ? "amber" : "green";
  const issueTone = issueSummary.errors > 0 ? "red" : issueSummary.warnings > 0 ? "amber" : "green";

  const handleAction = async (
    actionType?: string,
    payload?: Partial<PipelineReviewIssueDto> & { actionLabel?: string; note?: string; target?: string; mode?: ImageRegenerationMode }
  ) => {
    if (!actionType || !review) return;

    switch (actionType) {
      case "open_timeline":
        onOpenTimeline?.();
        return;
      case "retry_stage":
        {
          const rawStage = payload?.stageType || payload?.target || "";
          if (rawStage.toLowerCase() === "package" && !review.package.canRetry) {
            toast.error(review.package.retryHint || "Bu run içinde Thumbnail/Package aşaması yok.");
            return;
          }
          const normalizedStage =
            rawStage.toLowerCase() === "package"
              ? "Thumbnail"
              : rawStage.toLowerCase() === "images"
                ? "Image"
                : rawStage.toLowerCase() === "script"
                  ? "Script"
                  : rawStage;
          if (!normalizedStage || !onRetryStage) {
            setActionFeedback({ tone: "error", message: "Bu aşama için yeniden üretim aksiyonu kullanılamıyor." });
            return;
          }

          const actionKey = `retry_stage:${normalizedStage}`;
          try {
            setActionLoadingKey(actionKey);
            setActionFeedback({ tone: "info", message: `${normalizedStage} yeniden üretim isteği gönderiliyor...` });
            await onRetryStage(normalizedStage);
            setActionFeedback({
              tone: "success",
              message: `${normalizedStage} yeniden üretim isteği kuyruğa alındı. Aşama durumu ve konsol otomatik güncellenecek.`,
            });
            void loadReview();
            if (activeTab === "package") void loadPackageDetail();
            void Promise.resolve(onAssetChanged?.()).catch(() => undefined);
          } catch (err: any) {
            setActionFeedback({
              tone: "error",
              message: err?.message || `${normalizedStage} yeniden üretim isteği başlatılamadı.`,
            });
          } finally {
            setActionLoadingKey(null);
          }
        }
        return;
      case "approve_stage":
        onApproveStage?.();
        return;
      case "open_video":
        onOpenVideo?.();
        return;
      case "approve_package": {
        try {
          setActionLoadingKey("approve_package");
          await pipelineRunsApi.approvePackage(runId, payload?.note);
          toast.success("YouTube paketi onaylandı.");
          if (activeTab === "package") await loadPackageDetail();
          await loadReview();
        } catch (err: any) {
          toast.error(err?.message || "Paket onaylanamadı.");
        } finally {
          setActionLoadingKey(null);
        }
        return;
      }
      case "regenerate_image": {
        if (!payload?.sceneNumber) {
          onOpenTimeline?.();
          return;
        }

        const actionKey = getIssueActionKey({
          actionType,
          stageType: payload.stageType || "Image",
          code: payload.code || "image",
          sceneNumber: payload.sceneNumber,
          beatIndex: payload.beatIndex,
          imagePath: payload.imagePath,
        });

        try {
          setActionLoadingKey(actionKey);
          const mode = (payload.mode || "resample") as ImageRegenerationMode;
          const result = await pipelineRunsApi.regenerateSceneImage(runId, payload.sceneNumber, payload.beatIndex, payload.imagePath, mode);
          payload.sceneNumber = result.sceneNumber;
          payload.beatIndex = result.beatIndex;
          setImagePage((current) => {
            if (!current) return current;

            return {
              ...current,
              images: current.images.map((image) => {
                const sameScene = image.sceneNumber === result.sceneNumber;
                const sameBeat = image.beatIndex === result.beatIndex;
                const samePath = !payload.imagePath || image.imagePath === payload.imagePath;
                if (!sameScene || !sameBeat || !samePath) return image;

                return {
                  ...image,
                  imagePath: result.url,
                  promptHash: result.promptHash || image.promptHash,
                  inputHash: result.inputHash || image.inputHash,
                  promptPartKey: result.promptPartKey || image.promptPartKey,
                  generationContract: result.generationContract || image.generationContract,
                  imagePrompt: result.promptPreview || image.imagePrompt,
                  negativePrompt: result.negativePromptPreview || image.negativePrompt,
                  spokenAnchor: result.spokenAnchor || image.spokenAnchor,
                  visualThesis: result.visualThesis || image.visualThesis,
                  visualArchetype: result.visualArchetype || image.visualArchetype,
                  isMissing: false,
                  isFallback: false,
                  isLowQuality: false,
                };
              }),
            };
          });
          toast.success(`Sahne ${payload.sceneNumber}${payload.beatIndex ? ` / Beat ${payload.beatIndex}` : ""} görseli yenilendi.`);
          onAssetChanged?.();
          if (activeTab === "images") void loadImagePage(imagePageIndex);
          void loadReview();
        } catch (err: any) {
          toast.error(err?.message || "Görsel yenilenemedi.");
        } finally {
          setActionLoadingKey(null);
        }
      }
    }
  };

  const canRunIssueAction = (issue: PipelineReviewIssueDto | PipelineReviewReadinessItemDto): boolean => {
    switch (issue.actionType) {
      case "open_timeline":
        return Boolean(canOpenTimeline && onOpenTimeline);
      case "retry_stage":
        {
          const target = "stageType" in issue ? issue.stageType : issue.target;
          return Boolean(onRetryStage && target && (target.toLowerCase() !== "package" || review?.package.canRetry));
        }
      case "approve_stage":
        return Boolean(onApproveStage);
      case "open_video":
        return Boolean(onOpenVideo);
      case "regenerate_image":
        return "sceneNumber" in issue && !!issue.sceneNumber;
      case "approve_package":
        return true;
      default:
        return false;
    }
  };

  if (loading && !review) {
    return (
      <div className="flex h-full items-center justify-center p-10 text-zinc-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-indigo-400" />
        Review merkezi yükleniyor...
      </div>
    );
  }

  if (error && !review) {
    return (
      <div className="m-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
        {error}
      </div>
    );
  }

  if (!review) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-zinc-800 bg-zinc-950/30 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase", readinessClass(review.status))}>
                {review.status}
              </span>
              <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase", readinessClass(review.timeline.status))}>
                Timeline {review.timeline.status}
              </span>
              <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase", readinessClass(review.package.approvalStatus))}>
                Package {review.package.approvalStatus || "Pending"}
              </span>
            </div>
            <h3 className="truncate text-lg font-black text-white">{review.title || `Run #${review.id}`}</h3>
            <p className="mt-1 max-w-4xl text-xs leading-relaxed text-zinc-500">
              Run çıktısını production kontrol ekranı gibi oku: plan, script, image QA, timeline ritmi, yayın paketi, render ve contract trace tek yerde.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => loadReview()}>
              <RefreshCw size={14} className="mr-2" /> Yenile
            </Button>
            {canOpenTimeline && (
              <Button variant="primary" size="sm" onClick={onOpenTimeline} className="bg-indigo-600 hover:bg-indigo-500">
                <Layers size={14} className="mr-2" /> Timeline Aç
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1 rounded-xl border border-zinc-800 bg-zinc-950/50 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition",
                activeTab === tab.key
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950/30"
                  : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {actionFeedback && (
          <div className={cn(
            "mt-3 rounded-lg border px-3 py-2 text-xs leading-relaxed",
            actionFeedback.tone === "success"
              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
              : actionFeedback.tone === "error"
                ? "border-red-500/25 bg-red-500/10 text-red-200"
                : "border-sky-500/25 bg-sky-500/10 text-sky-200"
          )}>
            {actionFeedback.message}
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        {activeTab === "overview" && (
          <OverviewTab
            review={review}
            issueSummary={issueSummary}
            visualTone={visualTone as any}
            holdTone={holdTone as any}
            issueTone={issueTone}
            canRunIssueAction={canRunIssueAction}
            onAction={handleAction}
            actionLoadingKey={actionLoadingKey}
          />
        )}
        {activeTab === "plan" && (
          <PlanTab
            review={review}
            decisions={decisions}
            onDecision={saveDecision}
            decisionLoadingGate={decisionLoadingGate}
          />
        )}
        {activeTab === "script" && <ScriptTab review={review} />}
        {activeTab === "images" && (
          <ImagesTab
            runId={review.id}
            images={imagePage?.images ?? []}
            totalImageCount={imagePage?.totalImageCount ?? review.visuals.imageCount ?? 0}
            timelineUsedImageCount={imagePage?.timelineUsedImageCount}
            unusedImageCount={imagePage?.unusedImageCount}
            pageIndex={imagePageIndex}
            pageSize={REVIEW_IMAGE_PAGE_SIZE}
            isLoading={imagePageLoading}
            hasMore={Boolean(imagePage?.hasMore)}
            onPageChange={loadImagePage}
            onRegenerate={(image, mode) =>
              handleAction("regenerate_image", {
                stageType: "Image",
                code: "image.card",
                sceneNumber: image.sceneNumber,
                beatIndex: image.beatIndex,
                imagePath: image.imagePath,
                mode,
              })
            }
            actionLoadingKey={actionLoadingKey}
          />
        )}
        {activeTab === "timeline" && <TimelineTab review={review} onOpenTimeline={onOpenTimeline} canOpenTimeline={canOpenTimeline} />}
        {activeTab === "package" && (
          <PackageTab
            review={{ ...review, package: packageDetail ?? review.package }}
            packageLoading={packageLoading}
            onApprove={() => handleAction("approve_package")}
            onRetry={() => handleAction("retry_stage", { target: "package" })}
            onSaved={async () => {
              await loadPackageDetail();
              await loadReview();
            }}
            actionLoadingKey={actionLoadingKey}
          />
        )}
        {activeTab === "render" && <RenderTab review={review} onApproveStage={onApproveStage} onOpenVideo={onOpenVideo} />}
        {activeTab === "debug" && <DebugTab stages={review.stages ?? []} />}
      </div>
    </div>
  );
}

function OverviewTab({
  review,
  issueSummary,
  visualTone,
  holdTone,
  issueTone,
  canRunIssueAction,
  onAction,
  actionLoadingKey,
}: {
  review: PipelineRunReviewDto;
  issueSummary: { errors: number; warnings: number; infos: number };
  visualTone: "zinc" | "green" | "amber" | "red" | "indigo";
  holdTone: "zinc" | "green" | "amber" | "red" | "indigo";
  issueTone: "zinc" | "green" | "amber" | "red" | "indigo";
  canRunIssueAction: (issue: PipelineReviewIssueDto | PipelineReviewReadinessItemDto) => boolean;
  onAction: (actionType?: string, payload?: any) => void;
  actionLoadingKey: string | null;
}) {
  const visualEventCount = review.visuals.visualEventCount ?? review.timeline.visualCount ?? review.visuals.imageCount ?? 0;
  const visualEventRate = review.visuals.visualEventsPerMinute ?? review.visuals.imagesPerMinute ?? 0;
  const uniqueTimelineImages = review.visuals.uniqueTimelineImageCount ?? 0;
  const uniqueImageRate = review.visuals.uniqueImagesPerMinute ?? 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard icon={<Timer size={18} />} label="Timeline duration" value={formatDuration(review.timeline.totalDurationSec)} hint={`${review.script.wordCount} words`} tone="indigo" />
        <MetricCard icon={<Film size={18} />} label="Visual events" value={`${visualEventRate.toFixed(1)}/min`} hint={`${visualEventCount} cuts`} tone={visualTone} />
        <MetricCard icon={<ImageIcon size={18} />} label="Unique images" value={uniqueTimelineImages || "-"} hint={uniqueImageRate > 0 ? `${uniqueImageRate.toFixed(1)}/min` : "timeline assets"} tone={uniqueTimelineImages > 0 ? "green" : "zinc"} />
        <MetricCard icon={<Layers size={18} />} label="Average hold" value={`${review.timeline.averageVisualDurationSec.toFixed(1)}s`} hint={`${review.timeline.longHoldCount} long hold`} tone={holdTone} />
        <MetricCard icon={<AlertTriangle size={18} />} label="Review issue" value={review.issues.length} hint={`${issueSummary.errors} errors · ${issueSummary.warnings} warnings`} tone={issueTone} />
        <div className="hidden">
        <MetricCard icon={<Timer size={18} />} label="Timeline süresi" value={formatDuration(review.timeline.totalDurationSec)} hint={`${review.script.wordCount} kelime`} tone="indigo" />
        <MetricCard icon={<ImageIcon size={18} />} label="Görsel yoğunluğu" value={`${review.visuals.imagesPerMinute.toFixed(1)}/dk`} hint={`${review.visuals.imageCount} görsel`} tone={visualTone} />
        <MetricCard icon={<Film size={18} />} label="Ortalama görsel kalış" value={`${review.timeline.averageVisualDurationSec.toFixed(1)}s`} hint={`${review.timeline.longHoldCount} uzun hold`} tone={holdTone} />
        <MetricCard icon={<AlertTriangle size={18} />} label="Review issue" value={review.issues.length} hint={`${issueSummary.errors} hata · ${issueSummary.warnings} uyarı`} tone={issueTone} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr]">
        <Panel title="Readiness" icon={<ClipboardCheck size={16} className="text-indigo-400" />}>
          <div className="space-y-2">
            {(review.readiness ?? []).map((item) => (
              <ActionRow
                key={item.code}
                severity={item.severity}
                stageType={item.target || "review"}
                code={item.code}
                message={item.message}
                actionLabel={item.actionLabel}
                canAction={canRunIssueAction(item)}
                isLoading={actionLoadingKey === item.actionType}
                onAction={() => onAction(item.actionType, { stageType: item.target, code: item.code })}
              />
            ))}
          </div>
        </Panel>

        <Panel title="Üretim Sağlığı" icon={<BarChart3 size={16} className="text-indigo-400" />}>
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            {review.stages.map((stage) => (
              <StageHealthRow key={stage.stageType} stage={stage} />
            ))}
          </div>
        </Panel>
      </div>

      <IssueList
        issues={review.issues}
        canRunIssueAction={canRunIssueAction}
        onAction={onAction}
        actionLoadingKey={actionLoadingKey}
      />
    </div>
  );
}

function PlanTab({
  review,
  decisions,
  onDecision,
  decisionLoadingGate,
}: {
  review: PipelineRunReviewDto;
  decisions: RunReviewDecisionDto[];
  onDecision: (gate: string, status: "Approved" | "Rejected" | "Pending") => void;
  decisionLoadingGate: string | null;
}) {
  const brief = review.brief ?? {};
  const gates = [
    { gate: "creative-director", label: "Creative Director plan", help: "Konu vaadi, açı, chapter ve görsel strateji mantıklı mı?" },
    { gate: "script", label: "Script approval", help: "Anlatı, kelime/süre yoğunluğu ve bölüm akışı yeterli mi?" },
    { gate: "scene-direction", label: "Scene direction", help: "Storyboard/görsel beat yönlendirmesi tekrar etmeyen, izlenebilir bir kurgu vaat ediyor mu?" },
  ];
  const decisionMap = Object.fromEntries(decisions.map((x) => [x.gate, x]));

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.85fr_1.15fr]">
      <Panel title="Production Brief" icon={<ClipboardCheck size={16} className="text-indigo-400" />}>
        <InfoGrid
          items={[
            ["Ana başlık", brief.mainTitle || review.title || "-"],
            ["Açı / tez", brief.angle || "-"],
            ["Hedef kitle", brief.audience || "-"],
            ["Hedef süre", brief.targetDuration || "-"],
            ["Mutlaka işle", brief.mustCover || "-"],
            ["Kaçın", brief.avoid || "-"],
            ["Hook yönlendirmesi", brief.hookDirection || "-"],
            ["Thumbnail yönlendirmesi", brief.thumbnailDirection || "-"],
            ["Notlar", brief.notes || "-"],
          ]}
        />
      </Panel>
      <Panel title="Manual Approval Gates" icon={<CheckCircle2 size={16} className="text-emerald-400" />}>
        <div className="space-y-2">
          {gates.map((gate) => {
            const decision = decisionMap[gate.gate];
            return (
              <div key={gate.gate} className="rounded-xl border border-zinc-800 bg-zinc-950/45 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black text-white">{gate.label}</span>
                      <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", readinessClass(decision?.status || "Pending"))}>
                        {decision?.status || "Pending"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">{gate.help}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onDecision(gate.gate, "Rejected")}
                      isLoading={decisionLoadingGate === gate.gate}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onDecision(gate.gate, "Approved")}
                      isLoading={decisionLoadingGate === gate.gate}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
      <Panel title="Run Readiness" icon={<CheckCircle2 size={16} className="text-emerald-400" />}>
        <div className="space-y-2">
          {(review.readiness ?? []).map((item) => (
            <div key={item.code} className="rounded-xl border border-zinc-800 bg-zinc-950/45 p-3">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", severityClass(item.severity))}>{item.severity}</span>
                <span className="font-mono text-[10px] text-zinc-600">{item.code}</span>
              </div>
              <div className="text-sm text-zinc-200">{item.message}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function ScriptTab({ review }: { review: PipelineRunReviewDto }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <MetricCard icon={<FileText size={18} />} label="Sahne" value={review.script.sceneCount} />
        <MetricCard icon={<FileText size={18} />} label="Kelime" value={review.script.wordCount} />
        <MetricCard icon={<Timer size={18} />} label="Tahmini süre" value={formatDuration(review.script.estimatedDurationSec)} />
        <MetricCard icon={<BarChart3 size={18} />} label="WPM" value={review.script.wordsPerMinute.toFixed(1)} />
      </div>
      <Panel title="Script Health" icon={<FileText size={16} className="text-indigo-400" />}>
        <p className="text-sm leading-relaxed text-zinc-400">
          Long-form için ana risk, AI'ın duration alanlarını doldurup narration yoğunluğunu düşük bırakması. Burada kelime/süre oranı ve sahne sayısı hızlı kontrol edilir.
        </p>
      </Panel>
    </div>
  );
}

function ImagesTab({
  runId,
  images,
  totalImageCount,
  timelineUsedImageCount,
  unusedImageCount,
  pageIndex,
  pageSize,
  isLoading,
  hasMore,
  onPageChange,
  onRegenerate,
  actionLoadingKey,
}: {
  runId: number;
  images: PipelineReviewImageItemDto[];
  totalImageCount: number;
  timelineUsedImageCount?: number;
  unusedImageCount?: number;
  pageIndex: number;
  pageSize: number;
  isLoading: boolean;
  hasMore: boolean;
  onPageChange: (pageIndex: number) => void;
  onRegenerate: (image: PipelineReviewImageItemDto, mode: ImageRegenerationMode) => void;
  actionLoadingKey: string | null;
}) {
  const sorted = [...images].sort((a, b) => {
    if ((b.isMissing ? 1 : 0) !== (a.isMissing ? 1 : 0)) return (b.isMissing ? 1 : 0) - (a.isMissing ? 1 : 0);
    if ((b.isLowQuality ? 1 : 0) !== (a.isLowQuality ? 1 : 0)) return (b.isLowQuality ? 1 : 0) - (a.isLowQuality ? 1 : 0);
    return a.sceneNumber - b.sceneNumber || a.beatIndex - b.beatIndex;
  });
  const usedTotal = timelineUsedImageCount ?? images.filter((x) => (x.timelineUseCount ?? 0) > 0).length;
  const unusedTotal = unusedImageCount ?? Math.max(0, totalImageCount - usedTotal);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <MetricCard icon={<ImageIcon size={18} />} label="Generated" value={totalImageCount} hint={`${images.length} on page`} />
        <MetricCard icon={<Timer size={18} />} label="Used in timeline" value={usedTotal} tone={unusedTotal === 0 && totalImageCount > 0 ? "green" : "amber"} />
        <MetricCard icon={<AlertTriangle size={18} />} label="Unused" value={unusedTotal} tone={unusedTotal > 0 ? "amber" : "green"} />
        <MetricCard icon={<AlertTriangle size={18} />} label="Page QA" value={images.filter((x) => x.isMissing || x.isLowQuality).length} tone={images.some((x) => x.isMissing) ? "red" : images.some((x) => x.isLowQuality) ? "amber" : "green"} />
        <div className="hidden">
        <MetricCard icon={<ImageIcon size={18} />} label="Toplam görsel" value={images.length} />
        <MetricCard icon={<AlertTriangle size={18} />} label="Eksik" value={images.filter((x) => x.isMissing).length} tone={images.some((x) => x.isMissing) ? "red" : "green"} />
        <MetricCard icon={<AlertTriangle size={18} />} label="Düşük kalite" value={images.filter((x) => x.isLowQuality).length} tone={images.some((x) => x.isLowQuality) ? "amber" : "green"} />
        <MetricCard icon={<Timer size={18} />} label="Timeline'da kullanıldı" value={images.filter((x) => (x.timelineUseCount ?? 0) > 0).length} />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-950/45 px-3 py-2 text-xs text-zinc-400">
        <span>
          Gorsel penceresi:{" "}
          <span className="font-mono text-zinc-200">
            {totalImageCount === 0 ? 0 : pageIndex * pageSize + 1}-{Math.min((pageIndex + 1) * pageSize, totalImageCount)} / {totalImageCount}
          </span>
        </span>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" disabled={isLoading || pageIndex <= 0} onClick={() => onPageChange(pageIndex - 1)}>
            Onceki
          </Button>
          <Button variant="secondary" size="sm" disabled={isLoading || !hasMore} onClick={() => onPageChange(pageIndex + 1)}>
            Sonraki
          </Button>
        </div>
      </div>
      {isLoading && (
        <div className="flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950/40 p-5 text-sm text-zinc-500">
          <Loader2 size={16} className="mr-2 animate-spin text-indigo-400" />
          Gorseller yukleniyor...
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {sorted.map((image) => (
          <ImageReviewCard
            key={`${image.sceneNumber}-${image.beatIndex}-${image.imagePath}`}
            runId={runId}
            image={image}
            onRegenerate={(mode) => onRegenerate(image, mode)}
            isLoading={actionLoadingKey === getImageActionKey(image)}
          />
        ))}
      </div>
    </div>
  );
}

function TimelineTab({ review, canOpenTimeline, onOpenTimeline }: { review: PipelineRunReviewDto; canOpenTimeline?: boolean; onOpenTimeline?: () => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <MetricCard icon={<Timer size={18} />} label="Toplam süre" value={formatDuration(review.timeline.totalDurationSec)} />
        <MetricCard icon={<Layers size={18} />} label="Visual event" value={review.timeline.visualCount} />
        <MetricCard icon={<Film size={18} />} label="Ortalama hold" value={`${review.timeline.averageVisualDurationSec.toFixed(1)}s`} tone={review.timeline.averageVisualDurationSec > 6 ? "amber" : "green"} />
        <MetricCard icon={<AlertTriangle size={18} />} label="Uzun hold" value={review.timeline.longHoldCount} tone={review.timeline.longHoldCount > 0 ? "amber" : "green"} />
      </div>
      <Panel title="Kurgu Ritmi" icon={<Layers size={16} className="text-indigo-400" />}>
        <p className="text-sm leading-relaxed text-zinc-400">
          Render motoru artık uzun tek-görsel hold'ları mikro cut'lara böler. Yine de gerçek kalite için farklı visual beat sayısı yüksek olmalı; hedef uzun videoda 10+ görsel/dk.
        </p>
        {canOpenTimeline && (
          <Button className="mt-4" variant="primary" onClick={onOpenTimeline}>
            <Layers size={14} className="mr-2" /> Detay Timeline'ı Aç
          </Button>
        )}
      </Panel>
    </div>
  );
}

function PackageTab({
  review,
  packageLoading,
  onApprove,
  onRetry,
  onSaved,
  actionLoadingKey,
}: {
  review: PipelineRunReviewDto;
  packageLoading?: boolean;
  onApprove: () => void;
  onRetry?: () => void;
  onSaved?: () => void | Promise<void>;
  actionLoadingKey: string | null;
}) {
  const pkg = review.package;
  const thumbnailUrl = resolveMediaUrl(pkg.thumbnailUrl);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingTags, setGeneratingTags] = useState(false);
  const [draft, setDraft] = useState(() => packageToDraft(pkg));

  useEffect(() => {
    setDraft(packageToDraft(pkg));
  }, [pkg.titleOptions, pkg.description, pkg.pinnedComment, pkg.uploadChecklist, pkg.tags, pkg.hashtags, pkg.chapters]);

  const savePackage = async () => {
    try {
      setSaving(true);
      await pipelineRunsApi.updatePackage(review.id, {
        titleOptions: lines(draft.titleOptions).slice(0, 5),
        description: draft.description,
        chapters: lines(draft.chapters).map((line) => {
          const [timestamp, ...titleParts] = line.split("|");
          const title = titleParts.join("|").trim();
          return { timestamp: timestamp.trim(), title, startSec: parseTimestamp(timestamp.trim()) };
        }).filter((x) => x.title),
        tags: csv(draft.tags),
        hashtags: csv(draft.hashtags),
        pinnedComment: draft.pinnedComment,
        uploadChecklist: lines(draft.uploadChecklist),
      });
      toast.success("Yayın paketi güncellendi. Onay tekrar bekliyor.");
      setEditing(false);
      await onSaved?.();
    } catch (err: any) {
      toast.error(err?.message || "Yayın paketi kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const regenerateTags = async () => {
    try {
      setGeneratingTags(true);
      const result = await pipelineRunsApi.regeneratePackageTags(review.id);
      setDraft((current) => ({
        ...current,
        tags: result.tags.join(", "),
        hashtags: result.hashtags.join(", "),
      }));
      toast.success(`AI ${result.tags.length} arama odaklı etiket üretti.`);
      await onSaved?.();
    } catch (err: any) {
      toast.error(err?.message || "AI etiketleri üretilemedi.");
    } finally {
      setGeneratingTags(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.8fr_1.2fr]">
      <Panel title="Thumbnail" icon={<ImageIcon size={16} className="text-emerald-400" />}>
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-black">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} className="aspect-video w-full object-contain" loading="lazy" decoding="async" />
          ) : (
            <div className="flex aspect-video items-center justify-center text-sm text-zinc-600">Thumbnail yok</div>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", readinessClass(pkg.validationStatus))}>{pkg.validationStatus || "Missing"}</span>
          <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", readinessClass(pkg.approvalStatus))}>Approval {pkg.approvalStatus || "Pending"}</span>
          <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", readinessClass(pkg.readyToUpload ? "Ready" : "Review"))}>
            {pkg.readyToUpload ? "Ready to upload" : "Upload gate"}
          </span>
        </div>
        <div className={cn(
          "mt-3 rounded-xl border p-3 text-xs leading-relaxed",
          pkg.readyToUpload ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200" : "border-amber-500/25 bg-amber-500/10 text-amber-200"
        )}>
          {pkg.readyToUploadHint || (pkg.readyToUpload ? "Yayın paketi hazır." : "Yayın öncesi paket/render/timeline kontrolü gerekiyor.")}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRetry}
            disabled={!pkg.canRetry || actionLoadingKey === "retry_stage:Thumbnail"}
            isLoading={actionLoadingKey === "retry_stage:Thumbnail"}
          >
            <RotateCcw size={14} className="mr-2" /> Paketi Yeniden Üret
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setEditing((value) => !value)}>
            {editing ? <X size={14} className="mr-2" /> : <Edit3 size={14} className="mr-2" />}
            {editing ? "Vazgeç" : "Paketi Düzenle"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={regenerateTags}
            disabled={generatingTags}
            isLoading={generatingTags}
            title="Final senaryo ve brief üzerinden yalnızca YouTube etiketlerini yeniden üretir."
          >
            <WandSparkles size={14} className="mr-2" /> Etiketleri AI ile Üret
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onApprove}
            disabled={!pkg.canApprove || actionLoadingKey === "approve_package"}
            isLoading={actionLoadingKey === "approve_package"}
          >
            <CheckCircle2 size={14} className="mr-2" /> Paketi Onayla
          </Button>
        </div>
        {(pkg.retryHint || pkg.approvalHint) && (
          <p className="mt-3 text-xs leading-relaxed text-zinc-500">
            {!pkg.canRetry && pkg.retryHint ? pkg.retryHint : pkg.approvalHint}
          </p>
        )}
      </Panel>

      <div className="space-y-4">
        {packageLoading && (
          <Panel title="Package Detayi" icon={<Loader2 size={16} className="animate-spin text-indigo-400" />}>
            <div className="text-sm text-zinc-500">Yayin paketi detaylari yukleniyor...</div>
          </Panel>
        )}
        {editing && (
          <Panel title="Package Editor" icon={<Edit3 size={16} className="text-indigo-400" />}>
            <div className="space-y-3">
              <EditorField
                label="Başlık seçenekleri"
                value={draft.titleOptions}
                onChange={(value) => setDraft((x) => ({ ...x, titleOptions: value }))}
                hint="Her satır bir başlık. İlk 5 satır kaydedilir."
              />
              <EditorField
                label="Açıklama"
                value={draft.description}
                onChange={(value) => setDraft((x) => ({ ...x, description: value }))}
                rows={7}
              />
              <EditorField
                label="Chapters"
                value={draft.chapters}
                onChange={(value) => setDraft((x) => ({ ...x, chapters: value }))}
                hint="Format: 00:00 | Chapter title"
              />
              <EditorField
                label="Tags"
                value={draft.tags}
                onChange={(value) => setDraft((x) => ({ ...x, tags: value }))}
                hint="Virgülle ayır."
              />
              <EditorField
                label="Hashtags"
                value={draft.hashtags}
                onChange={(value) => setDraft((x) => ({ ...x, hashtags: value }))}
                hint="Virgülle ayır."
              />
              <EditorField
                label="Pinned comment"
                value={draft.pinnedComment}
                onChange={(value) => setDraft((x) => ({ ...x, pinnedComment: value }))}
                rows={3}
              />
              <EditorField
                label="Upload checklist"
                value={draft.uploadChecklist}
                onChange={(value) => setDraft((x) => ({ ...x, uploadChecklist: value }))}
                hint="Her satır bir kontrol maddesi."
              />
              <Button onClick={savePackage} isLoading={saving} disabled={saving}>
                <Save size={14} className="mr-2" /> Paketi Kaydet
              </Button>
            </div>
          </Panel>
        )}

        {pkg.thumbnailConcepts && pkg.thumbnailConcepts.length > 0 && (
          <Panel title="Thumbnail Concepts" icon={<ImageIcon size={16} className="text-emerald-400" />}>
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
              {pkg.thumbnailConcepts.map((concept, index) => (
                <div key={`${concept.name}-${index}`} className="rounded-xl border border-zinc-800 bg-zinc-950/45 p-3">
                  <div className="mb-1 text-sm font-black text-white">{concept.name || `Concept ${index + 1}`}</div>
                  <p className="text-xs leading-relaxed text-zinc-500">{concept.rationale || "Rationale yok."}</p>
                  <div className="mt-2 rounded-lg border border-zinc-800 bg-black/20 p-2 text-[11px] leading-relaxed text-zinc-400">{concept.prompt}</div>
                </div>
              ))}
            </div>
          </Panel>
        )}

        <Panel title="Başlık Seçenekleri" icon={<FileText size={16} className="text-indigo-400" />}>
          <ListBlock items={pkg.titleOptions ?? []} />
        </Panel>
        <Panel title="Açıklama" icon={<FileText size={16} className="text-indigo-400" />}>
          <CopyableText text={pkg.description || ""} empty="Açıklama yok" />
        </Panel>
        <Panel title="Chapters" icon={<Timer size={16} className="text-indigo-400" />}>
          <div className="space-y-1">
            {(pkg.chapters ?? []).map((chapter, index) => (
              <div key={`${chapter.timestamp}-${index}`} className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/45 px-3 py-2 text-xs">
                <span className="font-mono text-indigo-300">{chapter.timestamp}</span>
                <span className="text-zinc-300">{chapter.title}</span>
              </div>
            ))}
            {(pkg.chapters ?? []).length === 0 && <EmptyText>Chapter yok</EmptyText>}
          </div>
        </Panel>
        <Panel title="Tags / Checklist" icon={<Package size={16} className="text-emerald-400" />}>
          <div className="space-y-3">
            {(pkg.tagGenerationSource || pkg.tagSearchIntent) && (
              <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-3 py-2">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase text-indigo-300">
                  <span>{pkg.tagGenerationSource === "ai" ? "AI SEO" : pkg.tagGenerationSource || "Etiket kaynağı"}</span>
                  {pkg.tagModelName && <span className="text-zinc-500">{pkg.tagModelName}</span>}
                  {pkg.tagPromptVersion && <span className="text-zinc-600">{pkg.tagPromptVersion}</span>}
                </div>
                {pkg.tagSearchIntent && (
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">{pkg.tagSearchIntent}</p>
                )}
              </div>
            )}
            <ChipList items={[...(pkg.tags ?? []), ...(pkg.hashtags ?? [])]} />
            <ListBlock items={pkg.uploadChecklist ?? []} />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function packageToDraft(pkg: PipelineRunReviewDto["package"]) {
  return {
    titleOptions: (pkg.titleOptions ?? []).join("\n"),
    description: pkg.description || "",
    chapters: (pkg.chapters ?? []).map((x) => `${x.timestamp} | ${x.title}`).join("\n"),
    tags: (pkg.tags ?? []).join(", "),
    hashtags: (pkg.hashtags ?? []).join(", "),
    pinnedComment: pkg.pinnedComment || "",
    uploadChecklist: (pkg.uploadChecklist ?? []).join("\n"),
  };
}

function lines(value: string) {
  return value.split(/\r?\n/g).map((x) => x.trim()).filter(Boolean);
}

function csv(value: string) {
  return value.split(/[,\n]/g).map((x) => x.trim()).filter(Boolean);
}

function parseTimestamp(value: string) {
  const parts = value.split(":").map((x) => Number(x));
  if (parts.some((x) => Number.isNaN(x))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

function EditorField({
  label,
  value,
  onChange,
  hint,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-zinc-500">{label}</span>
        {hint && <span className="text-[10px] text-zinc-600">{hint}</span>}
      </div>
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="ui-field w-full rounded-xl border border-zinc-800 bg-zinc-950/45 px-3 py-2 text-xs text-zinc-100 outline-none transition focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
      />
    </label>
  );
}

function RenderTab({ review, onApproveStage, onOpenVideo }: { review: PipelineRunReviewDto; onApproveStage?: () => void; onOpenVideo?: () => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <MetricCard icon={<Play size={18} />} label="Video" value={review.render.hasVideo ? "Hazır" : "Yok"} tone={review.render.hasVideo ? "green" : "amber"} />
        <MetricCard icon={<Timer size={18} />} label="Süre" value={formatDuration(review.render.durationSec)} />
        <MetricCard icon={<Film size={18} />} label="Boyut" value={review.render.fileSizeMb ? `${review.render.fileSizeMb.toFixed(1)} MB` : "-"} />
        <MetricCard icon={<BarChart3 size={18} />} label="Audio QA" value={review.render.audioQaStatus || "-"} tone={review.render.audioQaStatus === "Ready" ? "green" : "zinc"} />
      </div>
      <Panel title="Render Kontrolü" icon={<Play size={16} className="text-indigo-400" />}>
        <div className="flex flex-wrap gap-2">
          {onOpenVideo && (
            <Button variant="secondary" onClick={onOpenVideo}>
              <Play size={14} className="mr-2" /> Video/Sesi Aç
            </Button>
          )}
          {onApproveStage && (
            <Button variant="primary" onClick={onApproveStage}>
              <CheckCircle2 size={14} className="mr-2" /> Render'a Başla / Devam Et
            </Button>
          )}
        </div>
        {review.render.audioWarnings.length > 0 && (
          <div className="mt-4 space-y-2">
            {review.render.audioWarnings.map((warning, index) => (
              <div key={index} className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">{warning}</div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function DebugTab({ stages }: { stages: PipelineReviewStageDto[] }) {
  return (
    <div className="space-y-3">
      {stages.map((stage) => (
        <StageDebugCard key={stage.stageType} stage={stage} />
      ))}
    </div>
  );
}

function StageDebugCard({ stage }: { stage: PipelineReviewStageDto }) {
  const validation = parseJson<any>(stage.validationJson);
  const promptParts = parseJson<any[]>(stage.promptTraceJson) ?? [];

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/35 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-black text-white">{stage.stageType}</span>
            <span className={cn("rounded-full border px-2 py-0.5 text-[10px]", readinessClass(stage.status))}>{stage.status}</span>
            {stage.validationStatus && <span className={cn("rounded-full border px-2 py-0.5 text-[10px]", readinessClass(stage.validationStatus))}>{stage.validationStatus}</span>}
          </div>
          <div className="mt-1 text-[10px] text-zinc-600">
            {stage.contractName || "-"} {stage.contractVersion ? `/ ${stage.contractVersion}` : ""} · {stage.modelName || "model yok"}
          </div>
        </div>
        <div className="flex gap-2">
          {stage.promptTraceJson && (
            <Button variant="secondary" size="sm" onClick={() => copyText(stage.promptTraceJson || "", "Prompt trace")}>
              <Copy size={13} className="mr-1.5" /> Trace
            </Button>
          )}
          {stage.validationJson && (
            <Button variant="secondary" size="sm" onClick={() => copyText(stage.validationJson || "", "Validation")}>
              <Copy size={13} className="mr-1.5" /> Validation
            </Button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <DebugPill label="Input" value={shortHash(stage.inputHash)} />
        <DebugPill label="Prompt" value={shortHash(stage.promptHash)} />
        <DebugPill label="Output" value={shortHash(stage.outputHash)} />
      </div>
      {validation?.issues?.length > 0 && (
        <div className="mt-3 space-y-2">
          {validation.issues.slice(0, 5).map((issue: any, index: number) => (
            <div key={index} className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs">
              <span className={cn("mr-2 rounded-full border px-2 py-0.5 text-[10px]", severityClass(issue.severity))}>{issue.severity}</span>
              <span className="text-zinc-300">{issue.message}</span>
            </div>
          ))}
        </div>
      )}
      {promptParts.length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-2">
          {promptParts.slice(0, 6).map((part, index) => (
            <div key={part.key || index} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 text-xs">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="font-mono text-indigo-300">{part.key || `part-${index + 1}`}</span>
                <span className="text-zinc-600">S{part.sceneNumber ?? "?"} / B{part.beatIndex ?? "?"}</span>
              </div>
              <div className="line-clamp-2 text-zinc-300">{part.narrationFocus || part.visualIntent || part.visualPurpose || "-"}</div>
              <div className="mt-2 font-mono text-[10px] text-zinc-600">prompt {shortHash(part.promptHash)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ImageReviewCard({ runId, image, onRegenerate, isLoading }: { runId: number; image: PipelineReviewImageItemDto; onRegenerate: (mode: ImageRegenerationMode) => void; isLoading: boolean }) {
  const imageUrl = resolveMediaUrl(image.imagePath);
  const tone = image.isMissing ? "border-red-500/30" : image.isLowQuality || image.isFallback ? "border-amber-500/30" : "border-zinc-800";
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptError, setPromptError] = useState("");
  const [promptDetail, setPromptDetail] = useState<{ imagePrompt?: string; negativePrompt?: string } | null>(null);
  const imagePrompt = image.imagePrompt || promptDetail?.imagePrompt || "";
  const negativePrompt = image.negativePrompt || promptDetail?.negativePrompt || "";
  const hasPrompt = Boolean(imagePrompt || negativePrompt || runId);

  const togglePrompt = async () => {
    const nextOpen = !promptOpen;
    setPromptOpen(nextOpen);
    if (!nextOpen || !runId || promptDetail || image.imagePrompt || image.negativePrompt || promptLoading) return;

    setPromptError("");
    setPromptLoading(true);
    try {
      const result = await pipelineRunsApi.imagePrompt(runId, image.sceneNumber, image.beatIndex, image.imagePath);
      setPromptDetail({
        imagePrompt: result.imagePrompt || "",
        negativePrompt: result.negativePrompt || "",
      });
    } catch {
      setPromptError("Prompt yuklenemedi.");
      toast.error("Prompt yuklenemedi.");
    } finally {
      setPromptLoading(false);
    }
  };

  return (
    <div className={cn("overflow-hidden rounded-2xl border bg-zinc-950/45 transition-all duration-300", tone, isLoading && "border-indigo-400/50 shadow-lg shadow-indigo-500/10")}>
      <div className="relative aspect-video bg-black">
        {imageUrl && !image.isMissing ? (
          <img
            src={imageUrl}
            className={cn("h-full w-full object-contain transition-all duration-500", isLoading && "scale-[1.02] blur-[2px] grayscale opacity-60")}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-zinc-600">Görsel yok</div>
        )}
        {isLoading && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/55 backdrop-blur-sm">
            <div className="relative mb-3">
              <div className="absolute inset-0 animate-ping rounded-full bg-indigo-400/30" />
              <div className="relative rounded-full border border-indigo-300/30 bg-indigo-500/20 p-3">
                <Loader2 size={24} className="animate-spin text-indigo-100" />
              </div>
            </div>
            <div className="rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[11px] font-bold text-white">
              Gorsel yenileniyor...
            </div>
          </div>
        )}
        <div className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold text-white">
          S{image.sceneNumber} / B{image.beatIndex}
        </div>
        <div className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[10px] text-zinc-200">
          QA {image.visualQualityScore || "-"}
        </div>
      </div>
      <div className="space-y-3 p-3">
        <div className="flex flex-wrap gap-1.5">
          {image.isMissing && <BadgeText tone="red">missing</BadgeText>}
          {image.isLowQuality && <BadgeText tone="amber">low quality</BadgeText>}
          {image.isFallback && <BadgeText tone="amber">fallback</BadgeText>}
          {image.visualType && <BadgeText>{image.visualType}</BadgeText>}
          {image.varietyRole && <BadgeText>{image.varietyRole}</BadgeText>}
          {image.visualArchetype && <BadgeText>{image.visualArchetype}</BadgeText>}
          {image.effectType && <BadgeText>{image.effectType}</BadgeText>}
        </div>
        {image.spokenAnchor && (
          <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/5 px-2.5 py-2 text-[11px] leading-relaxed text-emerald-100/80">
            <span className="font-bold text-emerald-200">Spoken anchor:</span> {image.spokenAnchor}
          </div>
        )}
        {image.visualThesis && (
          <div className="rounded-lg border border-fuchsia-500/10 bg-fuchsia-500/5 px-2.5 py-2 text-[11px] leading-relaxed text-fuchsia-100/80">
            <span className="font-bold text-fuchsia-200">Visual thesis:</span> {image.visualThesis}
          </div>
        )}
        <div className="text-xs leading-relaxed text-zinc-400">
          {image.narrationFocus || image.visualPurpose || image.visualIntent || "Narration focus yok."}
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-600">
          <span>Timeline: {(image.timelineDurationSec ?? 0).toFixed(1)}s</span>
          <span>Use: {image.timelineUseCount ?? 0}</span>
          <span>Text: {image.textMode || "none"}</span>
          <span>Hash: {shortHash(image.promptHash)}</span>
        </div>
        {image.visualQualityNotes && <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-2 text-[11px] text-zinc-500">{image.visualQualityNotes}</div>}
        {image.forbiddenReuse && (
          <div className="rounded-lg border border-amber-500/10 bg-amber-500/5 p-2 text-[10px] leading-relaxed text-amber-100/65">
            <span className="font-bold text-amber-200/80">Bu sahnede tekrar etme:</span> {image.forbiddenReuse}
          </div>
        )}
        {hasPrompt && (
          <div className="overflow-hidden rounded-xl border border-fuchsia-500/15 bg-fuchsia-500/[0.04]">
            <button
              type="button"
              onClick={togglePrompt}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[11px] font-bold text-fuchsia-100 transition hover:bg-fuchsia-500/10"
            >
              <span>{promptLoading ? "Prompt yukleniyor" : "Image prompt / negative prompt"}</span>
              <ChevronDown size={14} className={promptOpen ? "rotate-180 transition" : "transition"} />
            </button>
            {promptOpen && (
              <div className="space-y-2 border-t border-fuchsia-500/10 p-2">
                {promptLoading && (
                  <div className="flex items-center gap-2 rounded-lg border border-fuchsia-500/10 bg-fuchsia-500/[0.04] px-2 py-1.5 text-[10px] text-fuchsia-100/80">
                    <Loader2 size={12} className="animate-spin" />
                    Prompt detayi yukleniyor...
                  </div>
                )}
                {promptError && (
                  <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-2 py-1.5 text-[10px] text-rose-200">
                    {promptError}
                  </div>
                )}
                {imagePrompt && (
                  <ReviewPromptBlock title="Image prompt" text={imagePrompt} onCopy={() => copyText(imagePrompt, "Image prompt")} />
                )}
                {negativePrompt && (
                  <ReviewPromptBlock
                    title="Negative prompt"
                    text={negativePrompt}
                    onCopy={() => copyText(negativePrompt, "Negative prompt")}
                    tone="negative"
                  />
                )}
              </div>
            )}
          </div>
        )}
        <div className="grid grid-cols-3 gap-2">
          <Button variant="secondary" size="sm" onClick={() => onRegenerate("resample")} isLoading={isLoading} disabled={isLoading} title="Aynı promptla yeniden üret">
            <RefreshCw size={14} className="mr-1.5" /> Tekrar
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onRegenerate("reframe")} disabled={isLoading} title="Aynı anlatı için farklı kadraj üret">
            <Scan size={14} className="mr-1.5" /> Kadraj
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onRegenerate("replan")} disabled={isLoading} title="AI ile yeni bir görsel fikir planla">
            <WandSparkles size={14} className="mr-1.5" /> Fikir
          </Button>
        </div>
      </div>
    </div>
  );
}

function IssueList({
  issues,
  canRunIssueAction,
  onAction,
  actionLoadingKey,
}: {
  issues: PipelineReviewIssueDto[];
  canRunIssueAction: (issue: PipelineReviewIssueDto) => boolean;
  onAction: (actionType?: string, payload?: any) => void;
  actionLoadingKey: string | null;
}) {
  return (
    <Panel title="Kontrol Notları" icon={<AlertTriangle size={16} className="text-amber-400" />}>
      {issues.length === 0 ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          Şu an bloklayıcı review notu görünmüyor. Timeline ve görselleri manuel gözle kontrol etmek yine iyi fikir.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
          {issues.map((issue, index) => (
            <ActionRow
              key={`${issue.stageType}-${issue.code}-${index}`}
              severity={issue.severity}
              stageType={issue.stageType || "Genel"}
              code={issue.code}
              message={issue.message}
              hint={issue.actionHint}
              actionLabel={issue.actionLabel}
              canAction={canRunIssueAction(issue)}
              isLoading={actionLoadingKey === getIssueActionKey(issue)}
              onAction={() => onAction(issue.actionType, issue)}
            />
          ))}
        </div>
      )}
    </Panel>
  );
}

function ActionRow({
  severity,
  stageType,
  code,
  message,
  hint,
  actionLabel,
  canAction,
  isLoading,
  onAction,
}: {
  severity?: string;
  stageType?: string;
  code?: string;
  message: string;
  hint?: string;
  actionLabel?: string;
  canAction?: boolean;
  isLoading?: boolean;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/45 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", severityClass(severity))}>{severity || "Info"}</span>
        {stageType && <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-400">{stageType}</span>}
        {code && <span className="font-mono text-[10px] text-zinc-600">{code}</span>}
      </div>
      <div className="text-sm font-medium text-zinc-200">{message}</div>
      {hint && <div className="mt-1.5 text-xs text-zinc-500">{hint}</div>}
      {actionLabel && canAction && (
        <div className="mt-3">
          <Button type="button" variant="secondary" size="sm" onClick={onAction} disabled={isLoading} isLoading={isLoading} className="h-7 px-2.5 text-[10px]">
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

function StageHealthRow({ stage }: { stage: PipelineReviewStageDto }) {
  const totalIssues = stage.errorCount + stage.warningCount + stage.infoCount;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/35 px-3 py-2">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-xs font-bold text-zinc-200">{stage.stageType}</span>
          <span className={cn("rounded-full border px-2 py-0.5 text-[10px]", readinessClass(stage.status))}>{stage.status}</span>
          {stage.validationStatus && <span className={cn("rounded-full border px-2 py-0.5 text-[10px]", readinessClass(stage.validationStatus))}>Contract: {stage.validationStatus}</span>}
        </div>
        <div className="mt-1 text-[10px] text-zinc-600">
          {stage.hasOutput ? "Output var" : "Output yok"}
          {stage.durationMs > 0 ? ` · ${(stage.durationMs / 1000).toFixed(1)}s` : ""}
          {stage.promptTraceCount ? ` · ${stage.promptTraceCount} trace` : ""}
        </div>
      </div>
      <div className={cn("rounded-full border px-2 py-0.5 text-[10px]", totalIssues > 0 ? "border-amber-500/30 bg-amber-500/10 text-amber-300" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300")}>
        {totalIssues > 0 ? `${totalIssues} issue` : "temiz"}
      </div>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-zinc-100">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function InfoGrid({ items }: { items: [string, ReactNode][] }) {
  return (
    <div className="space-y-2">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-950/45 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-600">{label}</div>
          <div className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">{value}</div>
        </div>
      ))}
    </div>
  );
}

function ListBlock({ items }: { items: string[] }) {
  if (!items?.length) return <EmptyText>Liste boş</EmptyText>;
  return (
    <div className="space-y-1">
      {items.map((item, index) => (
        <div key={`${item}-${index}`} className="rounded-lg border border-zinc-800 bg-zinc-950/45 px-3 py-2 text-xs text-zinc-300">{item}</div>
      ))}
    </div>
  );
}

function ChipList({ items }: { items: string[] }) {
  if (!items?.length) return <EmptyText>Tag yok</EmptyText>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, index) => (
        <BadgeText key={`${item}-${index}`}>{item}</BadgeText>
      ))}
    </div>
  );
}

function CopyableText({ text, empty }: { text: string; empty: string }) {
  if (!text) return <EmptyText>{empty}</EmptyText>;
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/45 p-3">
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">{text}</div>
      <Button variant="secondary" size="sm" onClick={() => copyText(text, "Metin")} className="mt-3">
        <Copy size={13} className="mr-1.5" /> Kopyala
      </Button>
    </div>
  );
}

function ReviewPromptBlock({
  title,
  text,
  onCopy,
  tone = "default",
}: {
  title: string;
  text: string;
  onCopy: () => void;
  tone?: "default" | "negative";
}) {
  return (
    <div className={cn("rounded-lg border p-2", tone === "negative" ? "border-rose-500/15 bg-rose-500/[0.04]" : "border-fuchsia-500/15 bg-zinc-950/50")}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className={cn("text-[9px] font-bold uppercase tracking-wide", tone === "negative" ? "text-rose-200" : "text-fuchsia-200")}>{title}</span>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900/80 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white"
        >
          <Copy size={10} /> Kopyala
        </button>
      </div>
      <div className="max-h-32 overflow-y-auto whitespace-pre-wrap rounded-md bg-black/25 p-2 text-[10px] leading-relaxed text-zinc-300 scrollbar-thin scrollbar-thumb-zinc-800">
        {text}
      </div>
    </div>
  );
}

function BadgeText({ children, tone = "zinc" }: { children: ReactNode; tone?: "zinc" | "red" | "amber" }) {
  const cls = tone === "red"
    ? "border-red-500/30 bg-red-500/10 text-red-300"
    : tone === "amber"
      ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
      : "border-zinc-700 bg-zinc-900 text-zinc-300";
  return <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold", cls)}>{children}</span>;
}

function DebugPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2">
      <div className="text-[10px] font-bold uppercase text-zinc-600">{label}</div>
      <div className="mt-1 font-mono text-xs text-zinc-300">{value}</div>
    </div>
  );
}

function EmptyText({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-zinc-800 bg-zinc-950/45 px-3 py-2 text-xs text-zinc-600">{children}</div>;
}
