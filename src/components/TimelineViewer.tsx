import { useState, useEffect, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Clock, Info, Type, Image as ImageIcon, RefreshCw, Loader2, Scissors, XCircle, Fingerprint, Copy, ChevronDown, Scan, WandSparkles } from "lucide-react";
import { Badge } from "./ui-kit"; 
import { pipelineRunsApi, type ImageRegenerationMode } from "../api/pipelineRuns";
import toast from "react-hot-toast";

const getPortableFileName = (path?: string) => {
  if (!path) return "";
  const clean = decodeURIComponent(path).replace(/\\/g, "/");
  return clean.split("/").filter(Boolean).pop() || "";
};

const inferSceneNumberFromPath = (path?: string) => {
  const fileName = getPortableFileName(path);
  const match = fileName.match(/scene_(\d+)/i);
  return match ? Number(match[1]) : 0;
};

const shortHash = (hash?: string) => {
  if (!hash) return "";
  return hash.length <= 10 ? hash : hash.slice(0, 10);
};

const getPromptCacheKey = (sceneNumber: number, beatIndex: number, imagePath?: string) =>
  `${sceneNumber}:${Math.max(1, beatIndex || 1)}:${getPortableFileName(imagePath)}`;

const getReviewIssueKey = (issue: SceneLayoutReviewIssue) =>
  [
    issue.code || "issue",
    issue.sceneNumber ?? "",
    issue.segmentIndex ?? "",
    getPortableFileName(issue.imagePath),
  ].join("|");

const countCutClusters = (visualTrack: any[], fastThresholdSec = 1.6, maxConsecutive = 2) => {
  const byScene = visualTrack.reduce<Record<string, any[]>>((acc, visual) => {
    const scene = String(visual.sceneIndex ?? visual.SceneIndex ?? 0);
    acc[scene] = acc[scene] || [];
    acc[scene].push(visual);
    return acc;
  }, {});

  return Object.values(byScene).reduce((total, visuals) => {
    let consecutive = 0;
    let clusters = 0;
    visuals
      .sort((left, right) => Number(left.startTime ?? left.StartTime ?? 0) - Number(right.startTime ?? right.StartTime ?? 0))
      .forEach((visual) => {
        const duration = Number(visual.duration ?? visual.Duration ?? 0);
        if (duration > 0 && duration < fastThresholdSec) {
          consecutive++;
          if (consecutive === maxConsecutive + 1) clusters++;
        } else {
          consecutive = 0;
        }
      });
    return total + clusters;
  }, 0);
};

const isMissingVisualIssue = (issue: SceneLayoutReviewIssue) => {
  const code = String(issue.code || "");
  return code === "visual.missing_image" || code === "timeline.missing_scene_visual";
};

const isRegeneratableReviewIssue = (issue: SceneLayoutReviewIssue) => {
  const code = String(issue.code || "");
  return Boolean(
    issue.sceneNumber &&
      (code.startsWith("visual.") || code === "timeline.missing_scene_visual")
  );
};

const withResolvedIssues = (
  report: SceneLayoutReviewReport,
  resolvedKeys: Set<string>
): SceneLayoutReviewReport => {
  if (resolvedKeys.size === 0) return report;

  const issues = report.issues.filter((issue) => !resolvedKeys.has(getReviewIssueKey(issue)));
  const errorCount = issues.filter((issue) => issue.severity === "Error").length;
  const warningCount = issues.filter((issue) => issue.severity === "Warning").length;
  const infoCount = issues.filter((issue) => issue.severity === "Info").length;

  return {
    ...report,
    issues,
    issueCount: issues.length,
    errorCount,
    warningCount,
    infoCount,
    status: errorCount > 0 ? "Blocked" : warningCount > 0 ? "Review" : "Ready",
    missingImageCount: issues.filter(isMissingVisualIssue).length,
    fallbackImageCount: issues.filter((issue) => issue.code === "visual.fallback_image").length,
    duplicateImageCount: issues.filter((issue) => issue.code === "visual.duplicate_image").length,
    lowQualityImageCount: issues.filter((issue) => issue.code === "visual.low_quality_score").length,
  };
};

const normalizeReviewReport = (
  rawReport: any,
  visualTrack: any[],
  captionTrack: any[]
): SceneLayoutReviewReport => {
  const visualDurations = visualTrack
    .map((visual) => Number(visual.duration ?? visual.Duration ?? 0))
    .filter((duration) => duration > 0);
  const fallbackShortHoldCount = visualDurations.filter((duration) => duration < 0.8).length;
  const fallbackCriticalShortHoldCount = visualDurations.filter((duration) => duration < 0.35).length;
  const fallbackLongHoldCount = visualDurations.filter((duration) => duration > 7.05).length;
  const fallbackEditorialHealthyCount = visualDurations.filter((duration) => duration >= 0.8 && duration <= 7.05).length;

  if (rawReport) {
    return {
      status: rawReport.status ?? rawReport.Status ?? "Ready",
      sceneCount: Number(rawReport.sceneCount ?? rawReport.SceneCount ?? 0),
      visualCount: Number(rawReport.visualCount ?? rawReport.VisualCount ?? visualTrack.length),
      audioCount: Number(rawReport.audioCount ?? rawReport.AudioCount ?? 0),
      captionCount: Number(rawReport.captionCount ?? rawReport.CaptionCount ?? captionTrack.length),
      issueCount: Number(rawReport.issueCount ?? rawReport.IssueCount ?? 0),
      errorCount: Number(rawReport.errorCount ?? rawReport.ErrorCount ?? 0),
      warningCount: Number(rawReport.warningCount ?? rawReport.WarningCount ?? 0),
      infoCount: Number(rawReport.infoCount ?? rawReport.InfoCount ?? 0),
      fallbackImageCount: Number(rawReport.fallbackImageCount ?? rawReport.FallbackImageCount ?? 0),
      duplicateImageCount: Number(rawReport.duplicateImageCount ?? rawReport.DuplicateImageCount ?? 0),
      lowQualityImageCount: Number(rawReport.lowQualityImageCount ?? rawReport.LowQualityImageCount ?? 0),
      missingImageCount: Number(rawReport.missingImageCount ?? rawReport.MissingImageCount ?? 0),
      sttTimedVisualCount: Number(rawReport.sttTimedVisualCount ?? rawReport.SttTimedVisualCount ?? 0),
      anchorMatchedVisualCount: Number(rawReport.anchorMatchedVisualCount ?? rawReport.AnchorMatchedVisualCount ?? 0),
      syncedVisualCount: Number(rawReport.syncedVisualCount ?? rawReport.SyncedVisualCount ?? 0),
      visualAudioSyncRate: Number(rawReport.visualAudioSyncRate ?? rawReport.VisualAudioSyncRate ?? 0),
      anchorRejectedVisualCount: Number(rawReport.anchorRejectedVisualCount ?? rawReport.AnchorRejectedVisualCount ?? 0),
      cadenceAdjustedVisualCount: Number(rawReport.cadenceAdjustedVisualCount ?? rawReport.CadenceAdjustedVisualCount ?? 0),
      shortHoldCount: Number(rawReport.shortHoldCount ?? rawReport.ShortHoldCount ?? fallbackShortHoldCount),
      criticalShortHoldCount: Number(rawReport.criticalShortHoldCount ?? rawReport.CriticalShortHoldCount ?? fallbackCriticalShortHoldCount),
      longHoldCount: Number(rawReport.longHoldCount ?? rawReport.LongHoldCount ?? fallbackLongHoldCount),
      cutClusterCount: Number(rawReport.cutClusterCount ?? rawReport.CutClusterCount ?? countCutClusters(visualTrack)),
      editorialSyncRate: Number(rawReport.editorialSyncRate ?? rawReport.EditorialSyncRate ?? (visualTrack.length ? (fallbackEditorialHealthyCount / visualTrack.length) * 100 : 0)),
      averageVisualHoldSec: Number(rawReport.averageVisualHoldSec ?? rawReport.AverageVisualHoldSec ?? (visualDurations.length ? visualDurations.reduce((sum, value) => sum + value, 0) / visualDurations.length : 0)),
      minimumVisualHoldSec: Number(rawReport.minimumVisualHoldSec ?? rawReport.MinimumVisualHoldSec ?? (visualDurations.length ? Math.min(...visualDurations) : 0)),
      maximumVisualHoldSec: Number(rawReport.maximumVisualHoldSec ?? rawReport.MaximumVisualHoldSec ?? (visualDurations.length ? Math.max(...visualDurations) : 0)),
      averageVisualQualityScore: Number(rawReport.averageVisualQualityScore ?? rawReport.AverageVisualQualityScore ?? 0),
      issues: (rawReport.issues ?? rawReport.Issues ?? []).map((issue: any) => ({
        severity: issue.severity ?? issue.Severity ?? "Info",
        code: issue.code ?? issue.Code ?? "",
        message: issue.message ?? issue.Message ?? "",
        actionHint: issue.actionHint ?? issue.ActionHint ?? "",
        sceneNumber: issue.sceneNumber ?? issue.SceneNumber,
        segmentIndex: issue.segmentIndex ?? issue.SegmentIndex,
        imagePath: issue.imagePath ?? issue.ImagePath ?? "",
      })),
    };
  }

  const issues: SceneLayoutReviewIssue[] = [];
  let fallbackImageCount = 0;
  let lowQualityImageCount = 0;
  let missingImageCount = 0;

  visualTrack.forEach((visual) => {
    const sceneNumber = Number(visual.sceneIndex ?? visual.SceneIndex ?? 0);
    const segmentIndex = Number(visual.segmentIndex ?? visual.SegmentIndex ?? 0);
    const imagePath = visual.imagePath || visual.ImagePath || "";
    const sourceScene = inferSceneNumberFromPath(imagePath);
    const isFallback = Boolean(visual.isFallbackImage ?? visual.IsFallbackImage)
      || (sourceScene > 0 && sceneNumber > 0 && sourceScene !== sceneNumber);
    const quality = Number(visual.visualQualityScore ?? visual.VisualQualityScore ?? 0);

    if (!imagePath) {
      missingImageCount++;
      issues.push({
        severity: "Error",
        code: "visual.missing_image",
        message: `Sahne ${sceneNumber || "?"} için image path boş.`,
        actionHint: "Görseli yeniden üret.",
        sceneNumber,
        segmentIndex,
        imagePath,
      });
    }

    if (isFallback) {
      fallbackImageCount++;
      issues.push({
        severity: "Warning",
        code: "visual.fallback_image",
        message: `Sahne ${sceneNumber || "?"} başka bir sahnenin görselini kullanıyor.`,
        actionHint: "Bu karttan görseli yeniden üret.",
        sceneNumber,
        segmentIndex,
        imagePath,
      });
    }

    if (quality > 0 && quality < 62) {
      lowQualityImageCount++;
      issues.push({
        severity: "Warning",
        code: "visual.low_quality_score",
        message: `Sahne ${sceneNumber || "?"} görsel QA skoru düşük: ${quality}/100.`,
        actionHint: "Promptu veya görseli kontrol edip regenerate et.",
        sceneNumber,
        segmentIndex,
        imagePath,
      });
    }
  });

  const duplicateGroups = Object.values(
    visualTrack.reduce<Record<string, any[]>>((acc, visual) => {
      const key = getPortableFileName(visual.imagePath || visual.ImagePath);
      if (!key) return acc;
      acc[key] = acc[key] || [];
      acc[key].push(visual);
      return acc;
    }, {})
  ).filter((items) => new Set(items.map((x) => Number(x.sceneIndex ?? x.SceneIndex ?? 0))).size > 1);

  duplicateGroups.slice(0, 10).forEach((items) => {
    const scenes = Array.from(new Set(items.map((x) => Number(x.sceneIndex ?? x.SceneIndex ?? 0))))
      .filter(Boolean)
      .sort((a, b) => a - b)
      .map((x) => `S${x}`)
      .join(", ");
    issues.push({
      severity: "Warning",
      code: "visual.duplicate_image",
      message: `Aynı görsel birden fazla sahnede kullanılıyor: ${scenes}.`,
      actionHint: "Bilinçli tekrar değilse ilgili sahneleri regenerate et.",
      sceneNumber: Number(items[0].sceneIndex ?? items[0].SceneIndex ?? 0),
      imagePath: items[0].imagePath || items[0].ImagePath || "",
    });
  });

  if (captionTrack.length === 0) {
    issues.push({
      severity: "Info",
      code: "caption.no_word_timing",
      message: "Caption/STT verisi yok veya timeline'a taşınmadı.",
      actionHint: "Kelime zamanlamalı altyazı istiyorsan STT stage çıktısını kontrol et.",
    });
  }

  const qualityScores = visualTrack
    .map((visual) => Number(visual.visualQualityScore ?? visual.VisualQualityScore ?? 0))
    .filter((score) => score > 0);
  const sttTimedVisualCount = visualTrack.filter((visual) =>
    ["stt_word_timing", "editorial_anchor_snap"].includes(
      String(visual.timingSource ?? visual.TimingSource ?? "").toLowerCase()
    )
  ).length;
  const anchorMatchedVisualCount = visualTrack.filter((visual) =>
    String(visual.alignmentSource ?? visual.AlignmentSource ?? "").toLowerCase() === "stt_anchor_phrase"
  ).length;
  const syncedVisualCount = visualTrack.filter((visual) => {
    const timingSource = String(visual.timingSource ?? visual.TimingSource ?? "").toLowerCase();
    const alignmentSource = String(visual.alignmentSource ?? visual.AlignmentSource ?? "").toLowerCase();
    const matchedStart = visual.matchedTranscriptStart ?? visual.MatchedTranscriptStart;
    return ["stt_word_timing", "editorial_anchor_snap", "editorial_cadence", "editorial_scene_start"].includes(timingSource)
      || alignmentSource === "stt_anchor_phrase"
      || matchedStart !== undefined;
  }).length;
  const visualAudioSyncRate = visualTrack.length
    ? Number(((syncedVisualCount / visualTrack.length) * 100).toFixed(1))
    : 0;
  const anchorRejectedVisualCount = visualTrack.filter((visual) => Boolean(visual.anchorRejectedReason ?? visual.AnchorRejectedReason)).length;
  const cadenceAdjustedVisualCount = visualTrack.filter((visual) =>
    String(visual.timingAdjustmentReason ?? visual.TimingAdjustmentReason ?? "").toLowerCase().includes("cadence guard")
  ).length;
  const cutClusterCount = countCutClusters(visualTrack);
  const editorialSyncRate = visualTrack.length
    ? Number(((fallbackEditorialHealthyCount / visualTrack.length) * 100).toFixed(1))
    : 0;
  const errorCount = issues.filter((issue) => issue.severity === "Error").length;
  const warningCount = issues.filter((issue) => issue.severity === "Warning").length;
  const infoCount = issues.filter((issue) => issue.severity === "Info").length;

  return {
    status: errorCount > 0 ? "Blocked" : warningCount > 0 ? "Review" : "Ready",
    sceneCount: new Set(visualTrack.map((visual) => Number(visual.sceneIndex ?? visual.SceneIndex ?? 0)).filter(Boolean)).size,
    visualCount: visualTrack.length,
    audioCount: 0,
    captionCount: captionTrack.length,
    issueCount: issues.length,
    errorCount,
    warningCount,
    infoCount,
    fallbackImageCount,
    duplicateImageCount: duplicateGroups.reduce((sum, items) => sum + items.length, 0),
    lowQualityImageCount,
    missingImageCount,
    sttTimedVisualCount,
    anchorMatchedVisualCount,
    syncedVisualCount,
    visualAudioSyncRate,
    anchorRejectedVisualCount,
    cadenceAdjustedVisualCount,
    shortHoldCount: fallbackShortHoldCount,
    criticalShortHoldCount: fallbackCriticalShortHoldCount,
    longHoldCount: fallbackLongHoldCount,
    cutClusterCount,
    editorialSyncRate,
    averageVisualHoldSec: visualDurations.length ? Number((visualDurations.reduce((sum, value) => sum + value, 0) / visualDurations.length).toFixed(2)) : 0,
    minimumVisualHoldSec: visualDurations.length ? Number(Math.min(...visualDurations).toFixed(2)) : 0,
    maximumVisualHoldSec: visualDurations.length ? Number(Math.max(...visualDurations).toFixed(2)) : 0,
    averageVisualQualityScore: qualityScores.length ? Number((qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length).toFixed(1)) : 0,
    issues,
  };
};

// --- TİP TANIMLARI ---
export type VisualEvent = {
  sceneIndex: number;
  imagePath: string;
  startTime: number;
  duration: number;
  effectType: string;
  visualRole?: string;
  visualType?: string;
  varietyRole?: string;
  varietyReason?: string;
  segmentRole?: string;
  shotType?: string;
  directorIntent?: string;
  cutReason?: string;
  visualIntent?: string;
  narrationFocus?: string;
  visualPurpose?: string;
  anchorPhrase?: string;
  triggerWords?: string[];
  matchedTranscriptStart?: number;
  matchedTranscriptEnd?: number;
  alignmentConfidence?: number;
  alignmentSource?: string;
  textMode?: string;
  allowedText?: string;
  plannedDurationSec?: number;
  beatStartSec?: number;
  beatEndSec?: number;
  timingSource?: string;
  timingAdjustmentReason?: string;
  anchorRejectedReason?: string;
  cadenceStatus?: string;
  audioTransition?: string;
  audioOffsetSec?: number;
  chapterTitle?: string;
  captionMode?: string;
  musicEnergy?: string;
  continuityAnchor?: string;
  composition?: string;
  visualQualityScore?: number;
  visualQualityNotes?: string;
  sourceImageSceneNumber?: number;
  sourceImageBeatIndex?: number;
  isFallbackImage?: boolean;
  promptPartKey?: string;
  promptHash?: string;
  inputHash?: string;
  generationContract?: string;
  imagePrompt?: string;
  negativePrompt?: string;
};

export type CaptionEvent = {
  text: string;
  start: number;
  end: number;
};

export type EditDecisionItem = {
  index: number;
  sceneNumber: number;
  startTime: number;
  endTime: number;
  duration: number;
  segmentRole?: string;
  visualRole?: string;
  visualType?: string;
  transitionType?: string;
  effectType?: string;
  cutReason?: string;
  directorIntent?: string;
  visualIntent?: string;
  narrationFocus?: string;
  visualPurpose?: string;
  anchorPhrase?: string;
  triggerWords?: string[];
  matchedTranscriptStart?: number;
  matchedTranscriptEnd?: number;
  alignmentConfidence?: number;
  alignmentSource?: string;
  textMode?: string;
  allowedText?: string;
  plannedDurationSec?: number;
  beatStartSec?: number;
  beatEndSec?: number;
  timingSource?: string;
  timingAdjustmentReason?: string;
  anchorRejectedReason?: string;
  cadenceStatus?: string;
  chapterTitle?: string;
  overlayText?: string;
  musicEnergy?: string;
  captionMode?: string;
  audioTransition?: string;
  audioOffsetSec?: number;
  imagePath?: string;
  sourceImageSceneNumber?: number;
  sourceImageBeatIndex?: number;
  isFallbackImage?: boolean;
  promptPartKey?: string;
  promptHash?: string;
  inputHash?: string;
  generationContract?: string;
  imagePrompt?: string;
  negativePrompt?: string;
};

export type BrollLayerItem = {
  sceneNumber: number;
  segmentIndex: number;
  layerType: string;
  visualType: string;
  visualRole: string;
  startTime: number;
  endTime: number;
  duration: number;
  imagePath?: string;
  reason?: string;
};

export type SceneLayoutReviewIssue = {
  severity: "Error" | "Warning" | "Info" | string;
  code: string;
  message: string;
  actionHint?: string;
  sceneNumber?: number;
  segmentIndex?: number;
  imagePath?: string;
};

export type SceneLayoutReviewReport = {
  status: "Ready" | "Review" | "Blocked" | string;
  sceneCount: number;
  visualCount: number;
  audioCount: number;
  captionCount: number;
  issueCount: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  fallbackImageCount: number;
  duplicateImageCount: number;
  lowQualityImageCount: number;
  missingImageCount: number;
  sttTimedVisualCount: number;
  anchorMatchedVisualCount: number;
  syncedVisualCount: number;
  visualAudioSyncRate: number;
  anchorRejectedVisualCount: number;
  cadenceAdjustedVisualCount: number;
  shortHoldCount: number;
  criticalShortHoldCount: number;
  longHoldCount: number;
  cutClusterCount: number;
  editorialSyncRate: number;
  averageVisualHoldSec: number;
  minimumVisualHoldSec: number;
  maximumVisualHoldSec: number;
  averageVisualQualityScore: number;
  issues: SceneLayoutReviewIssue[];
};

export type SceneLayoutPayload = {
  width: number;
  height: number;
  totalDuration: number;
  visualTrack: VisualEvent[];
  captionTrack: CaptionEvent[];
  editDecisionList?: EditDecisionItem[];
  brollLayerPlan?: BrollLayerItem[];
  reviewReport?: SceneLayoutReviewReport;
};

// --- BİLEŞEN ---
export function TimelineViewer({
  data,
  runId,
  onPageChange,
}: {
  data: any;
  runId?: number;
  onPageChange?: (pageIndex: number, pageSize: number) => void;
}) {
  // Not: 'data' tipini 'any' yaptık çünkü Backend'den PascalCase gelebilir.

  // 1. Veri Doğrulama ve Normalizasyon (Büyük/Küçük Harf Desteği)
  const [visualTrack, setVisualTrack] = useState<any[]>([]);
  const [visualPage, setVisualPage] = useState(0);
  const [resolvedReviewIssueKeys, setResolvedReviewIssueKeys] = useState<Set<string>>(new Set());
  const timelinePageMeta = data?.timelinePage || data?.TimelinePage;

  useEffect(() => {
    const tracks = data?.visualTrack || data?.VisualTrack || [];
    const meta = data?.timelinePage || data?.TimelinePage;
    const metaTake = Number(meta?.take ?? meta?.Take ?? 0);
    const metaSkip = Number(meta?.skip ?? meta?.Skip ?? 0);
    setVisualTrack(tracks);
    setVisualPage(metaTake > 0 ? Math.floor(metaSkip / metaTake) : 0);
    setResolvedReviewIssueKeys(new Set());
  }, [data]);

  const captionTrack = data?.captionTrack || data?.CaptionTrack;
  const editDecisionList = data?.editDecisionList || data?.EditDecisionList || [];
  const brollLayerPlan = data?.brollLayerPlan || data?.BrollLayerPlan || [];
  const totalDuration = data?.totalDuration || data?.TotalDuration || 0;
  const width = data?.width || data?.Width || 0;
  const height = data?.height || data?.Height || 0;
  
  // Loading State
  const [regenerating, setRegenerating] = useState<Record<number, boolean>>({});
  const [showReviewDetails, setShowReviewDetails] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [showEditorPlan, setShowEditorPlan] = useState(false);
  const [openPromptCards, setOpenPromptCards] = useState<Record<number, boolean>>({});
  const [promptCache, setPromptCache] = useState<Record<string, { imagePrompt: string; negativePrompt: string; loading?: boolean; error?: string }>>({});

  const copyPromptText = async (text: string, label: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast.success(`${label} kopyalandı.`);
  };

  const loadPromptForVisual = async (sceneNumber: number, beatIndex: number, imagePath: string | undefined, cacheKey: string) => {
    if (!runId || !sceneNumber) return;

    const cached = promptCache[cacheKey];
    if (cached?.loading || cached?.imagePrompt || cached?.negativePrompt) return;

    setPromptCache((prev) => ({
      ...prev,
      [cacheKey]: { imagePrompt: cached?.imagePrompt || "", negativePrompt: cached?.negativePrompt || "", loading: true },
    }));

    try {
      const result = await pipelineRunsApi.imagePrompt(runId, sceneNumber, beatIndex, imagePath);
      setPromptCache((prev) => ({
        ...prev,
        [cacheKey]: {
          imagePrompt: result.imagePrompt || "",
          negativePrompt: result.negativePrompt || "",
        },
      }));
    } catch {
      setPromptCache((prev) => ({
        ...prev,
        [cacheKey]: {
          imagePrompt: cached?.imagePrompt || "",
          negativePrompt: cached?.negativePrompt || "",
          error: "Prompt yuklenemedi.",
        },
      }));
      toast.error("Prompt yuklenemedi.");
    }
  };

  const handleRegenerate = async (
    sceneNumber: number,
    progressKey: number,
    beatIndex?: number,
    imagePath?: string,
    trackIndex = progressKey,
    mode: ImageRegenerationMode = "resample"
  ) => {
    if(!runId) return;
    setRegenerating(prev => ({ ...prev, [progressKey]: true }));
    try {
        const res = await pipelineRunsApi.regenerateSceneImage(runId, sceneNumber, beatIndex, imagePath, mode);
        const responseBeatIndex = Number(res.beatIndex || beatIndex || 1);
        const oldPromptKey = getPromptCacheKey(sceneNumber, beatIndex ?? 1, imagePath);
        const newPromptKey = getPromptCacheKey(res.sceneNumber ?? sceneNumber, responseBeatIndex, res.url);
        setPromptCache(prev => {
            const next = { ...prev };
            delete next[oldPromptKey];
            if (res.promptPreview || res.negativePromptPreview) {
                next[newPromptKey] = {
                    imagePrompt: res.promptPreview || "",
                    negativePrompt: res.negativePromptPreview || "",
                };
            }
            return next;
        });
        toast.success(mode === "replan" ? "Görsel fikri yeniden planlandı ve üretildi." : mode === "reframe" ? "Farklı kadraj üretildi." : "Görsel yeniden üretildi.");
        setVisualTrack(prev => {
            const next = [...prev];
            if(next[trackIndex]) {
                const updated = { ...next[trackIndex] };
                // Backend ne dönerse onu basıyoruz, hem camel hem pascal case support
                updated.imagePath = res.url;
                updated.ImagePath = res.url;
                updated.sourceImageSceneNumber = res.sceneNumber ?? sceneNumber;
                updated.SourceImageSceneNumber = res.sceneNumber ?? sceneNumber;
                updated.sourceImageBeatIndex = responseBeatIndex || updated.sourceImageBeatIndex || updated.SourceImageBeatIndex || 1;
                updated.SourceImageBeatIndex = updated.sourceImageBeatIndex;
                updated.promptHash = res.promptHash || updated.promptHash || updated.PromptHash;
                updated.PromptHash = updated.promptHash;
                updated.inputHash = res.inputHash || updated.inputHash || updated.InputHash;
                updated.InputHash = updated.inputHash;
                updated.promptPartKey = res.promptPartKey || updated.promptPartKey || updated.PromptPartKey;
                updated.PromptPartKey = updated.promptPartKey;
                updated.generationContract = res.generationContract || updated.generationContract || updated.GenerationContract;
                updated.GenerationContract = updated.generationContract;
                updated.spokenAnchor = res.spokenAnchor || updated.spokenAnchor || updated.SpokenAnchor;
                updated.SpokenAnchor = updated.spokenAnchor;
                updated.visualThesis = res.visualThesis || updated.visualThesis || updated.VisualThesis;
                updated.VisualThesis = updated.visualThesis;
                updated.visualArchetype = res.visualArchetype || updated.visualArchetype || updated.VisualArchetype;
                updated.VisualArchetype = updated.visualArchetype;
                updated.imagePrompt = res.promptPreview || "";
                updated.ImagePrompt = updated.imagePrompt;
                updated.negativePrompt = res.negativePromptPreview || "";
                updated.NegativePrompt = updated.negativePrompt;
                updated.isFallbackImage = false;
                updated.IsFallbackImage = false;
                next[trackIndex] = updated;
            }
            return next;
        });
    } catch(e) {
        toast.error(e instanceof Error ? e.message : "Görsel yenilenemedi.");
    } finally {
        setRegenerating(prev => ({ ...prev, [progressKey]: false }));
    }
  };

  const findVisualIndexForIssue = (issue: SceneLayoutReviewIssue) => {
    const issueScene = Number(issue.sceneNumber || 0);
    const issueSegment = Number(issue.segmentIndex || 0);
    const issueFile = getPortableFileName(issue.imagePath);
    if (!issueScene) return -1;

    return visualTrack.findIndex((visual) => {
      const visualScene = Number(visual.sceneIndex ?? visual.SceneIndex ?? 0);
      if (visualScene !== issueScene) return false;

      const visualSegment = Number(visual.segmentIndex ?? visual.SegmentIndex ?? 0);
      if (issueSegment > 0 && visualSegment === issueSegment) return true;

      const visualFile = getPortableFileName(visual.imagePath || visual.ImagePath);
      if (issueFile && visualFile === issueFile) return true;

      return !issueFile && issueSegment <= 0;
    });
  };

  const handleRegenerateIssue = async (issue: SceneLayoutReviewIssue, issueIndex: number) => {
    if (!runId || !issue.sceneNumber) return false;

    const visualIndex = findVisualIndexForIssue(issue);
    const beatIndex = Number(issue.segmentIndex || 0) > 0 ? Number(issue.segmentIndex) : undefined;

    if (visualIndex >= 0) {
      await handleRegenerate(Number(issue.sceneNumber), visualIndex, beatIndex, issue.imagePath);
      setResolvedReviewIssueKeys(prev => new Set(prev).add(getReviewIssueKey(issue)));
      return true;
    }

    const progressKey = -1000 - issueIndex;
    setRegenerating(prev => ({ ...prev, [progressKey]: true }));
    try {
      const res = await pipelineRunsApi.regenerateSceneImage(runId, Number(issue.sceneNumber), beatIndex, issue.imagePath);
      const sceneNumber = Number(res.sceneNumber || issue.sceneNumber);
      const sourceBeatIndex = Number(res.beatIndex || beatIndex || issue.segmentIndex || 1);
      const relatedDecision = editDecisionList.find((decision: any) =>
        Number(decision.sceneNumber ?? decision.SceneNumber ?? 0) === sceneNumber &&
        Number(decision.sourceImageBeatIndex ?? decision.SourceImageBeatIndex ?? decision.segmentIndex ?? decision.SegmentIndex ?? sourceBeatIndex) === sourceBeatIndex
      ) || editDecisionList.find((decision: any) =>
        Number(decision.sceneNumber ?? decision.SceneNumber ?? 0) === sceneNumber
      );
      const startTime = Number(relatedDecision?.startTime ?? relatedDecision?.StartTime ?? 0);
      const duration = Number(relatedDecision?.duration ?? relatedDecision?.Duration ?? 4);
      const effectType = relatedDecision?.effectType ?? relatedDecision?.EffectType ?? "static";

      setVisualTrack(prev => {
        const next = [...prev, {
          sceneIndex: sceneNumber,
          SceneIndex: sceneNumber,
          segmentIndex: sourceBeatIndex,
          SegmentIndex: sourceBeatIndex,
          startTime,
          StartTime: startTime,
          duration,
          Duration: duration,
          effectType,
          EffectType: effectType,
          imagePath: res.url,
          ImagePath: res.url,
          sourceImageSceneNumber: sceneNumber,
          SourceImageSceneNumber: sceneNumber,
          sourceImageBeatIndex: sourceBeatIndex,
          SourceImageBeatIndex: sourceBeatIndex,
          isFallbackImage: false,
          IsFallbackImage: false,
          visualRole: "manual_repair",
          VisualRole: "manual_repair",
          promptHash: res.promptHash,
          PromptHash: res.promptHash,
          inputHash: res.inputHash,
          InputHash: res.inputHash,
          promptPartKey: res.promptPartKey,
          PromptPartKey: res.promptPartKey,
          generationContract: res.generationContract,
          GenerationContract: res.generationContract,
          imagePrompt: res.promptPreview,
          ImagePrompt: res.promptPreview,
          negativePrompt: res.negativePromptPreview,
          NegativePrompt: res.negativePromptPreview,
        }];

        return next.sort((a, b) => {
          const aStart = Number(a.startTime ?? a.StartTime ?? 0);
          const bStart = Number(b.startTime ?? b.StartTime ?? 0);
          if (aStart !== bStart) return aStart - bStart;
          return Number(a.sceneIndex ?? a.SceneIndex ?? 0) - Number(b.sceneIndex ?? b.SceneIndex ?? 0);
        });
      });

      setResolvedReviewIssueKeys(prev => new Set(prev).add(getReviewIssueKey(issue)));
      toast.success("Eksik gorsel uretildi ve timeline'a eklendi.");
      return true;
    } catch {
      toast.error("Görsel yenilenemedi");
      return false;
    } finally {
      setRegenerating(prev => ({ ...prev, [progressKey]: false }));
    }
  };

  const handleRegenerateMissingIssues = async () => {
    const missingEntries = reviewReport.issues
      .map((issue, index) => ({ issue, index }))
      .filter(({ issue }) => isMissingVisualIssue(issue) && isRegeneratableReviewIssue(issue));

    if (!missingEntries.length) {
      toast("Eksik gorsel bulunmuyor.");
      return;
    }

    setRegenerating(prev => ({ ...prev, [-99999]: true }));
    let successCount = 0;
    try {
      for (const entry of missingEntries) {
        const ok = await handleRegenerateIssue(entry.issue, entry.index);
        if (ok) successCount++;
      }
      toast.success(`${successCount}/${missingEntries.length} eksik gorsel uretildi.`);
    } finally {
      setRegenerating(prev => ({ ...prev, [-99999]: false }));
    }
  };

  // 2. Eğer veri yoksa veya görsel listesi boşsa hata göster
  // Note: visualTrack might be empty initially before effect runs but data is present? 
  // We should check data first or wait for effect? 
  // Actually checking 'data' props for empty logic is better for initial render, 
  // but we use 'visualTrack' state for rendering.
  // Let's use visualTrack state, but initialize it lazily if possible or just rely on effect.
  // To avoid flash of empty state, we can initialize state directly.
  
  const rawReviewIssues = data?.reviewReport?.issues || data?.reviewReport?.Issues || data?.ReviewReport?.issues || data?.ReviewReport?.Issues || [];
  const hasData = (data?.visualTrack || data?.VisualTrack || []).length > 0 || rawReviewIssues.length > 0;

  if (!hasData) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-2 p-8 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
            <span className="text-lg font-semibold text-zinc-400">Önizleme Verisi Bulunamadı</span>
            <span className="text-xs text-zinc-500 text-center max-w-md">
                Sahne planı (Scene Layout) henüz oluşturulmamış veya veritabanından hatalı formatta gelmiş olabilir.
            </span>
            <div className="w-full mt-4">
                <p className="text-[10px] text-zinc-600 mb-1 font-mono">DEBUG RAW DATA:</p>
                <pre className="text-[9px] bg-black/50 p-2 rounded text-zinc-500 overflow-auto max-h-32 text-left font-mono border border-zinc-900">
                    {JSON.stringify(data, null, 2)}
                </pre>
            </div>
        </div>
      );
  }

  // 3. Resim Yolu Düzeltici
  const getImageUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;

    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "https://localhost:7177"; 
    let cleanPath = path.replace(/\\/g, "/"); 

    if (cleanPath.includes("/ALL_FILES/")) {
        cleanPath = cleanPath.split("/ALL_FILES/")[1];
    } else if (cleanPath.includes("/wwwroot/")) {
        cleanPath = cleanPath.split("/wwwroot/")[1];
    } else if (cleanPath.includes("User_")) {
        const idx = cleanPath.indexOf("User_");
        if (idx !== -1) cleanPath = cleanPath.substring(idx);
    }

    if (cleanPath.startsWith("/")) cleanPath = cleanPath.substring(1);

    return `${baseUrl}/${cleanPath}`;
  };

  const getFileName = (path?: string) => {
    if (!path) return "";
    const clean = decodeURIComponent(path).replace(/\\/g, "/");
    return clean.split("/").filter(Boolean).pop() || "";
  };

  const inferSourceSceneFromPath = (path?: string) => {
    const fileName = getFileName(path);
    const match = fileName.match(/scene_(\d+)/i);
    return match ? Number(match[1]) : 0;
  };

  const isVertical = width < height;
  const reviewReport = withResolvedIssues(
    normalizeReviewReport(data?.reviewReport || data?.ReviewReport, visualTrack, captionTrack || []),
    resolvedReviewIssueKeys
  );
  const missingRepairableIssueCount = reviewReport.issues.filter(
    (issue) => isMissingVisualIssue(issue) && isRegeneratableReviewIssue(issue)
  ).length;
  const reviewStatus = String(reviewReport.status || "Ready");
  const promptTraceCount = visualTrack.filter((visual) => visual.promptHash || visual.PromptHash).length;
  const promptTraceCoverage = visualTrack.length
    ? Math.round((promptTraceCount / visualTrack.length) * 100)
    : 0;
  const visualAudioSyncRate = Number(reviewReport.visualAudioSyncRate ?? 0);
  const syncTone = visualAudioSyncRate >= 70 ? "emerald" : visualAudioSyncRate >= 35 ? "amber" : "zinc";
  const editorialSyncRate = Number(reviewReport.editorialSyncRate ?? 0);
  const rhythmTone = editorialSyncRate >= 90 ? "emerald" : editorialSyncRate >= 70 ? "amber" : "rose";
  const reviewStatusMeta =
    reviewStatus === "Blocked"
      ? {
          label: "Blokaj",
          description: "Render öncesi düzeltilmesi gereken kritik konu var.",
          icon: XCircle,
          className: "border-rose-500/25 bg-rose-500/10 text-rose-200",
        }
      : reviewStatus === "Review"
        ? {
            label: "Kontrol Gerekli",
            description: "Render alınabilir ama önce gözden geçirmek iyi olur.",
            icon: AlertTriangle,
            className: "border-amber-500/25 bg-amber-500/10 text-amber-200",
          }
        : {
            label: "Hazır",
            description: "Timeline render öncesi temel kontrollerden geçti.",
            icon: CheckCircle2,
            className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-200",
          };
  const ReviewIcon = reviewStatusMeta.icon;
  const isServerPagedTimeline = Boolean(timelinePageMeta);
  const timelinePageSize = Number(timelinePageMeta?.take ?? timelinePageMeta?.Take ?? 36);
  const totalVisualCount = Number(timelinePageMeta?.totalVisualCount ?? timelinePageMeta?.TotalVisualCount ?? visualTrack.length);
  const totalVisualPages = Math.max(1, Math.ceil(totalVisualCount / timelinePageSize));
  const safeVisualPage = Math.min(visualPage, totalVisualPages - 1);
  const visualPageStart = isServerPagedTimeline
    ? Number(timelinePageMeta?.skip ?? timelinePageMeta?.Skip ?? 0)
    : safeVisualPage * timelinePageSize;
  const currentVisualCount = isServerPagedTimeline
    ? visualTrack.length
    : Math.min(timelinePageSize, Math.max(totalVisualCount - visualPageStart, 0));
  const visualPageEnd = Math.min(visualPageStart + currentVisualCount, totalVisualCount);
  const pagedVisualTrack = isServerPagedTimeline
    ? visualTrack
    : visualTrack.slice(visualPageStart, Math.min(visualPageStart + timelinePageSize, visualTrack.length));

  const changeVisualPage = (pageIndex: number) => {
    const nextPage = Math.max(0, Math.min(totalVisualPages - 1, pageIndex));
    if (isServerPagedTimeline && onPageChange) {
      onPageChange(nextPage, timelinePageSize);
      return;
    }
    setVisualPage(nextPage);
  };

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      <div className="shrink-0 rounded-xl border border-zinc-800 bg-zinc-950/35 px-3 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
            <MetricPill icon={<Clock size={13} />} label="Süre" value={`${totalDuration.toFixed(1)}s`} tone="indigo" />
            <MetricPill icon={<ImageIcon size={13} />} label="Format" value={`${width}x${height}`} tone="purple" />
            <MetricPill icon={<ImageIcon size={13} />} label="Shot" value={`${reviewReport.visualCount || visualTrack.length}/${reviewReport.sceneCount || "-"} sahne`} tone="cyan" />
            <MetricPill icon={<Type size={13} />} label="Altyazı" value={`${captionTrack?.length || 0}`} tone="emerald" />
            <MetricPill icon={<Scissors size={13} />} label="EDL" value={`${editDecisionList.length}`} tone="sky" />
            <MetricPill icon={<Clock size={13} />} label="Sync" value={`%${visualAudioSyncRate.toFixed(1)}`} tone={syncTone} />
            <MetricPill icon={<Scissors size={13} />} label="Ritim" value={`%${editorialSyncRate.toFixed(1)}`} tone={rhythmTone} />
            <MetricPill icon={<Fingerprint size={13} />} label="Prompt" value={`${promptTraceCount}/${visualTrack.length || 0} · %${promptTraceCoverage}`} tone="fuchsia" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowOverview((value) => !value)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-[11px] font-semibold text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800"
            >
              Özet {showOverview ? "Gizle" : "Göster"}
              <ChevronDown size={13} className={showOverview ? "rotate-180 transition" : "transition"} />
            </button>
            {editDecisionList.length > 0 && (
              <button
                type="button"
                onClick={() => setShowEditorPlan((value) => !value)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-200 transition hover:border-emerald-400/40"
              >
                EDL {showEditorPlan ? "Gizle" : "Aç"}
                <ChevronDown size={13} className={showEditorPlan ? "rotate-180 transition" : "transition"} />
              </button>
            )}
          </div>
        </div>
      </div>
      {/* 1. ÜST BİLGİ PANELİ */}
      <div className={`${showOverview ? "flex" : "hidden"} shrink-0 items-center gap-8 overflow-x-auto px-1 pb-3 border-b border-zinc-800 text-xs text-zinc-400 select-none`}>
        <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/10 rounded-md">
                <Clock size={16} className="text-indigo-500"/> 
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Süre</span>
                <span className="text-zinc-200 font-mono font-medium text-sm">{totalDuration.toFixed(1)}s</span>
            </div>
        </div>
        <div className="w-px h-8 bg-zinc-800" />
        <div className="flex items-center gap-2">
             <div className="p-1.5 bg-purple-500/10 rounded-md">
                <ImageIcon size={16} className="text-purple-500"/> 
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Format</span>
                <span className="text-zinc-200 font-mono font-medium text-sm">{width}x{height}</span>
            </div>
        </div>
        <div className="w-px h-8 bg-zinc-800" />
        <div className="flex items-center gap-2">
            <div className="p-1.5 bg-cyan-500/10 rounded-md">
                <ImageIcon size={16} className="text-cyan-400"/>
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Shot</span>
                <span className="text-zinc-200 font-mono font-medium text-sm">
                    {reviewReport.visualCount || visualTrack.length} / {reviewReport.sceneCount || "-"} sahne
                </span>
            </div>
        </div>
        <div className="w-px h-8 bg-zinc-800" />
        <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/10 rounded-md">
                <Type size={16} className="text-emerald-500"/> 
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Altyazı</span>
                <span className="text-zinc-200 font-mono font-medium text-sm">{captionTrack?.length || 0} satır</span>
            </div>
        </div>
        <div className="w-px h-8 bg-zinc-800" />
        <div className="flex items-center gap-2">
            <div className="p-1.5 bg-sky-500/10 rounded-md">
                <Scissors size={16} className="text-sky-400"/>
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">B-roll / Info</span>
                <span className="text-zinc-200 font-mono font-medium text-sm">{brollLayerPlan.length} vurus</span>
            </div>
        </div>
        <div className="w-px h-8 bg-zinc-800" />
        <div className="flex items-center gap-2">
            <div className="p-1.5 bg-fuchsia-500/10 rounded-md">
                <Fingerprint size={16} className="text-fuchsia-400"/>
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Prompt Trace</span>
                <span className="text-zinc-200 font-mono font-medium text-sm">{promptTraceCount}/{visualTrack.length || 0} · %{promptTraceCoverage}</span>
            </div>
        </div>
      </div>

      {/* 2. ANA TİMELİNE (YATAY SCROLL) */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/35 p-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2">
            <div className={`rounded-lg border p-2 ${reviewStatusMeta.className}`}>
              <ReviewIcon size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-zinc-100">
                Render Öncesi Kontrol
                <Badge variant="neutral" className={`${reviewStatusMeta.className} text-[10px]`}>
                  {reviewStatusMeta.label}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">{reviewStatusMeta.description}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="grid grid-cols-2 gap-2 text-center text-[10px] sm:grid-cols-4 xl:grid-cols-9">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-2 py-1.5">
              <div className="text-zinc-500">Hata</div>
              <div className="font-mono text-sm font-bold text-rose-300">{reviewReport.errorCount}</div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-2 py-1.5">
              <div className="text-zinc-500">Uyarı</div>
              <div className="font-mono text-sm font-bold text-amber-300">{reviewReport.warningCount}</div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-2 py-1.5">
              <div className="text-zinc-500">Fallback</div>
              <div className="font-mono text-sm font-bold text-amber-200">{reviewReport.fallbackImageCount}</div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-2 py-1.5">
              <div className="text-zinc-500">QA Ort.</div>
              <div className="font-mono text-sm font-bold text-zinc-200">
                {reviewReport.averageVisualQualityScore > 0 ? reviewReport.averageVisualQualityScore.toFixed(1) : "-"}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-2 py-1.5">
              <div className="text-zinc-500">Sync</div>
              <div className={`font-mono text-sm font-bold ${visualAudioSyncRate >= 70 ? "text-emerald-300" : visualAudioSyncRate >= 35 ? "text-amber-300" : "text-zinc-300"}`}>
                %{visualAudioSyncRate.toFixed(1)}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-2 py-1.5">
              <div className="text-zinc-500">Anchor</div>
              <div className="font-mono text-sm font-bold text-sky-300">
                {reviewReport.anchorMatchedVisualCount}/{reviewReport.visualCount || visualTrack.length || 0}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-2 py-1.5">
              <div className="text-zinc-500">Ritim</div>
              <div className={`font-mono text-sm font-bold ${editorialSyncRate >= 90 ? "text-emerald-300" : editorialSyncRate >= 70 ? "text-amber-300" : "text-rose-300"}`}>
                %{editorialSyncRate.toFixed(1)}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-2 py-1.5">
              <div className="text-zinc-500">Kisa / Uzun</div>
              <div className="font-mono text-sm font-bold text-amber-200">
                {reviewReport.shortHoldCount} / {reviewReport.longHoldCount}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-2 py-1.5">
              <div className="text-zinc-500">Cluster</div>
              <div className={`font-mono text-sm font-bold ${reviewReport.cutClusterCount > 0 ? "text-rose-300" : "text-emerald-300"}`}>
                {reviewReport.cutClusterCount}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowReviewDetails((value) => !value)}
            className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800"
          >
            {showReviewDetails ? "Detay Gizle" : "Detay"}
          </button>
          {missingRepairableIssueCount > 0 && runId && (
            <button
              type="button"
              onClick={handleRegenerateMissingIssues}
              disabled={Boolean(regenerating[-99999])}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/25 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-200 transition hover:border-indigo-400/50 hover:bg-indigo-500/20 disabled:cursor-wait disabled:opacity-60"
            >
              {regenerating[-99999] ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <RefreshCw size={13} />
              )}
              Eksik gorselleri uret ({missingRepairableIssueCount})
            </button>
          )}
          </div>
        </div>

        {showReviewDetails && reviewReport.issues.length > 0 ? (
          <div className="mt-2 grid gap-1.5">
            {reviewReport.issues.slice(0, 5).map((issue, index) => {
              const severity = String(issue.severity || "Info");
              const IssueIcon = severity === "Error" ? XCircle : severity === "Warning" ? AlertTriangle : Info;
              const severityClass = severity === "Error"
                ? "border-rose-500/20 bg-rose-500/10 text-rose-200"
                : severity === "Warning"
                  ? "border-amber-500/20 bg-amber-500/10 text-amber-200"
                  : "border-sky-500/20 bg-sky-500/10 text-sky-200";
              const canRegenerateIssue = Boolean(runId && isRegeneratableReviewIssue(issue));
              const issueProgressKey = -1000 - index;

              return (
                <div key={`${issue.code}-${index}`} className="grid grid-cols-[20px_64px_1fr_auto] items-start gap-2 rounded-lg border border-zinc-800/60 bg-zinc-900/30 px-2 py-1.5 text-[10px]">
                  <IssueIcon size={13} className={severity === "Error" ? "text-rose-300" : severity === "Warning" ? "text-amber-300" : "text-sky-300"} />
                  <span className={`rounded-full border px-1.5 py-0.5 text-center text-[9px] ${severityClass}`}>
                    {issue.sceneNumber ? `S${issue.sceneNumber}` : severity}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-zinc-300">{issue.message}</div>
                    {issue.actionHint && <div className="mt-0.5 truncate text-zinc-600">{issue.actionHint}</div>}
                  </div>
                  {canRegenerateIssue ? (
                    <button
                      type="button"
                      onClick={() => handleRegenerateIssue(issue, index)}
                      disabled={Boolean(regenerating[issueProgressKey])}
                      className="rounded-md border border-indigo-500/25 bg-indigo-500/10 px-2 py-1 text-[9px] font-semibold text-indigo-200 transition hover:border-indigo-400/50 hover:bg-indigo-500/20 disabled:cursor-wait disabled:opacity-60"
                    >
                      {regenerating[issueProgressKey] ? "..." : "Yenile"}
                    </button>
                  ) : (
                    <span />
                  )}
                </div>
              );
            })}
            {reviewReport.issues.length > 5 && (
              <div className="text-center text-[10px] text-zinc-600">
                +{reviewReport.issues.length - 5} kontrol maddesi daha timeline kartlarında takip edilebilir.
              </div>
            )}
          </div>
        ) : showReviewDetails ? (
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-500/15 bg-emerald-500/5 px-2 py-2 text-xs text-emerald-200">
            <CheckCircle2 size={14} />
            Görsel timeline için kritik bir uyarı bulunmadı.
          </div>
        ) : null}
      </div>

      {showEditorPlan && editDecisionList.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/35 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                    <Scissors size={14} className="text-emerald-400" />
                    Editor Decision List
                </div>
                <Badge variant="neutral" className="text-[9px]">
                    {editDecisionList.length} karar
                </Badge>
            </div>
            <div className="max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
                <div className="grid gap-1.5">
                    {editDecisionList.slice(0, 12).map((item: any, index: number) => {
                        const start = Number(item.startTime ?? item.StartTime ?? 0);
                        const end = Number(item.endTime ?? item.EndTime ?? 0);
                        const sceneNo = item.sceneNumber ?? item.SceneNumber ?? "-";
                        const segmentRole = item.segmentRole || item.SegmentRole || "";
                        const transition = item.transitionType || item.TransitionType || "";
                        const effect = item.effectType || item.EffectType || "";
                        const audioTransition = item.audioTransition || item.AudioTransition || "";
                        const audioOffset = Number(item.audioOffsetSec ?? item.AudioOffsetSec ?? 0);
                        const cutReason = item.cutReason || item.CutReason || item.directorIntent || item.DirectorIntent || "";
                        const visualIntent = item.visualIntent || item.VisualIntent || "";
                        const narrationFocus = item.narrationFocus || item.NarrationFocus || "";
                        const visualPurpose = item.visualPurpose || item.VisualPurpose || "";
                        const textMode = item.textMode || item.TextMode || "none";
                        const allowedText = item.allowedText || item.AllowedText || "";
                        const chapterTitle = item.chapterTitle || item.ChapterTitle || "";
                        const promptHash = item.promptHash || item.PromptHash || "";

                        return (
                            <div key={`${sceneNo}-${index}`} className="grid grid-cols-[84px_72px_72px_1fr] items-center gap-2 rounded-lg border border-zinc-800/60 bg-zinc-900/35 px-2 py-1.5 text-[10px]">
                                <span className="font-mono text-zinc-500">
                                    {start.toFixed(1)}-{end.toFixed(1)}s
                                </span>
                                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-center text-[9px] text-emerald-200">
                                    {String(segmentRole || "beat").replace(/_/g, " ")}
                                </span>
                                <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-1.5 py-0.5 text-center text-[9px] text-sky-200">
                                    {audioTransition && audioTransition !== "straight" ? `${String(audioTransition).replace(/_/g, "-")} ${audioOffset.toFixed(2)}s` : "audio"}
                                </span>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 text-zinc-300">
                                        <span className="font-semibold">S{sceneNo}</span>
                                        {chapterTitle && <span className="truncate text-zinc-500">{chapterTitle}</span>}
                                        {promptHash && <span className="shrink-0 text-fuchsia-300/70">#{shortHash(promptHash)}</span>}
                                        <span className="ml-auto shrink-0 text-zinc-600">
                                            {[transition, effect].filter(Boolean).join(" / ")}
                                        </span>
                                    </div>
                                    {cutReason && (
                                        <div className="mt-0.5 truncate text-[9px] text-zinc-600">
                                            {cutReason}
                                        </div>
                                    )}
                                    {(visualIntent || narrationFocus || visualPurpose || (textMode && textMode !== "none")) && (
                                        <div className="mt-0.5 truncate text-[9px] text-indigo-300/70">
                                            {[
                                                visualIntent && `intent: ${visualIntent}`,
                                                narrationFocus && `focus: ${narrationFocus}`,
                                                visualPurpose && `purpose: ${visualPurpose}`,
                                                textMode && textMode !== "none" && `text: ${textMode}${allowedText ? ` "${allowedText}"` : ""}`
                                            ].filter(Boolean).join(" / ")}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {editDecisionList.length > 12 && (
                        <div className="text-center text-[10px] text-zinc-600">
                            +{editDecisionList.length - 12} karar daha timeline kartlarinda devam ediyor.
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {totalVisualCount > timelinePageSize && (
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-950/35 px-3 py-2 text-xs text-zinc-400">
          <div>
            Timeline penceresi:{" "}
            <span className="font-mono text-zinc-200">
              {visualPageStart + 1}-{visualPageEnd} / {totalVisualCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => changeVisualPage(safeVisualPage - 1)}
              disabled={safeVisualPage <= 0}
              className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-1.5 font-semibold text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Onceki
            </button>
            <span className="font-mono text-[11px] text-zinc-500">
              {safeVisualPage + 1}/{totalVisualPages}
            </span>
            <button
              type="button"
              onClick={() => changeVisualPage(safeVisualPage + 1)}
              disabled={safeVisualPage >= totalVisualPages - 1}
              className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-1.5 font-semibold text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Sonraki
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        <div className="flex gap-4 min-h-full px-1 min-w-max">
          {pagedVisualTrack.map((scene: any, localIdx: number) => {
            const idx = visualPageStart + localIdx;
            // Veri Çekme (Safe Access)
            const sStart = scene.startTime ?? scene.StartTime;
            const sDuration = scene.duration ?? scene.Duration;
            const sPath = scene.imagePath || scene.ImagePath;
            const sEffect = scene.effectType || scene.EffectType;
            const sIndex = scene.sceneIndex ?? scene.SceneIndex ?? (idx + 1);
            const sSegmentIndex = scene.segmentIndex ?? scene.SegmentIndex;
            const sRole = scene.visualRole || scene.VisualRole;
            const sVisualType = scene.visualType || scene.VisualType;
            const sVarietyRole = scene.varietyRole || scene.VarietyRole;
            const sVarietyReason = scene.varietyReason || scene.VarietyReason;
            const sSegmentRole = scene.segmentRole || scene.SegmentRole;
            const sShot = scene.shotType || scene.ShotType;
            const sIntent = scene.directorIntent || scene.DirectorIntent;
            const sCutReason = scene.cutReason || scene.CutReason;
            const sSpokenAnchor = scene.spokenAnchor || scene.SpokenAnchor || "";
            const sVisualThesis = scene.visualThesis || scene.VisualThesis || "";
            const sVisualArchetype = scene.visualArchetype || scene.VisualArchetype || "";
            const sForbiddenReuse = scene.forbiddenReuse || scene.ForbiddenReuse || "";
            const sVisualIntent = scene.visualIntent || scene.VisualIntent;
            const sNarrationFocus = scene.narrationFocus || scene.NarrationFocus;
            const sVisualPurpose = scene.visualPurpose || scene.VisualPurpose;
            const sAnchorPhrase = scene.anchorPhrase || scene.AnchorPhrase || "";
            const sTriggerWords = (scene.triggerWords || scene.TriggerWords || []) as string[];
            const sMatchedTranscriptStart = Number(scene.matchedTranscriptStart ?? scene.MatchedTranscriptStart ?? 0);
            const sMatchedTranscriptEnd = Number(scene.matchedTranscriptEnd ?? scene.MatchedTranscriptEnd ?? 0);
            const sAlignmentConfidence = Number(scene.alignmentConfidence ?? scene.AlignmentConfidence ?? 0);
            const sAlignmentSource = scene.alignmentSource || scene.AlignmentSource || "";
            const sTextMode = scene.textMode || scene.TextMode || "none";
            const sAllowedText = scene.allowedText || scene.AllowedText;
            const sPlannedDuration = Number(scene.plannedDurationSec ?? scene.PlannedDurationSec ?? 0);
            const sBeatStart = Number(scene.beatStartSec ?? scene.BeatStartSec ?? 0);
            const sBeatEnd = Number(scene.beatEndSec ?? scene.BeatEndSec ?? 0);
            const sTimingSource = scene.timingSource || scene.TimingSource || "";
            const sTimingAdjustmentReason = scene.timingAdjustmentReason || scene.TimingAdjustmentReason || "";
            const sAnchorRejectedReason = scene.anchorRejectedReason || scene.AnchorRejectedReason || "";
            const sCadenceStatus = String(scene.cadenceStatus || scene.CadenceStatus || "balanced").toLowerCase();
            const sAudioTransition = scene.audioTransition || scene.AudioTransition;
            const sAudioOffset = Number(scene.audioOffsetSec ?? scene.AudioOffsetSec ?? 0);
            const sChapter = scene.chapterTitle || scene.ChapterTitle;
            const sEnergy = scene.musicEnergy || scene.MusicEnergy;
            const sAnchor = scene.continuityAnchor || scene.ContinuityAnchor;
            const sComposition = scene.composition || scene.Composition;
            const sQuality = Number(scene.visualQualityScore ?? scene.VisualQualityScore ?? 0);
            const sQualityNotes = scene.visualQualityNotes || scene.VisualQualityNotes;
            const sSourceScene = Number(scene.sourceImageSceneNumber ?? scene.SourceImageSceneNumber ?? 0);
            const sSourceBeat = Number(scene.sourceImageBeatIndex ?? scene.SourceImageBeatIndex ?? 0);
            const sPromptPartKey = scene.promptPartKey || scene.PromptPartKey || "";
            const sPromptHash = scene.promptHash || scene.PromptHash || "";
            const sInputHash = scene.inputHash || scene.InputHash || "";
            const sGenerationContract = scene.generationContract || scene.GenerationContract || "";
            const inferredSourceScene = inferSourceSceneFromPath(sPath);
            const promptSceneNumber = Number(sSourceScene || inferredSourceScene || sIndex || 0);
            const promptBeatIndex = Number(sSourceBeat || sSegmentIndex || 1);
            const promptCacheKey = getPromptCacheKey(promptSceneNumber, promptBeatIndex, sPath);
            const cachedPrompt = promptCache[promptCacheKey];
            const sImagePrompt = scene.imagePrompt || scene.ImagePrompt || scene.finalPrompt || scene.FinalPrompt || scene.promptUsed || scene.PromptUsed || cachedPrompt?.imagePrompt || "";
            const sNegativePrompt = scene.negativePrompt || scene.NegativePrompt || scene.negativePromptUsed || scene.NegativePromptUsed || cachedPrompt?.negativePrompt || "";
            const isFallbackImage = Boolean(scene.isFallbackImage ?? scene.IsFallbackImage)
                || (inferredSourceScene > 0 && inferredSourceScene !== Number(sIndex));
            const regenerateBeatIndex = isFallbackImage
                ? Number(sSegmentIndex ?? 1)
                : Number(sSourceBeat || sSegmentIndex || 1);

            const isRegenerating = regenerating[idx];
            const isPromptOpen = Boolean(openPromptCards[idx]);
            const hasPromptText = Boolean(sImagePrompt || sNegativePrompt);
            const canLoadPrompt = Boolean(runId && promptSceneNumber > 0);
            const isPromptLoading = Boolean(cachedPrompt?.loading);
            const promptError = cachedPrompt?.error || "";
            const canShowPromptButton = hasPromptText || canLoadPrompt || isPromptLoading || Boolean(promptError);
            const cadenceBadgeClass = sCadenceStatus === "critical_short"
                ? "bg-rose-500/15 border-rose-500/30 text-rose-200"
                : sCadenceStatus === "short" || sCadenceStatus === "long"
                  ? "bg-amber-500/15 border-amber-500/30 text-amber-200"
                  : sCadenceStatus === "fast"
                    ? "bg-sky-500/10 border-sky-500/20 text-sky-200"
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-200";
            const cadenceBorderClass = isFallbackImage
                ? "border-amber-500/35 group-hover:border-amber-400/60"
                : sCadenceStatus === "critical_short"
                  ? "border-rose-500/40 group-hover:border-rose-400/60"
                  : sCadenceStatus === "short" || sCadenceStatus === "long"
                    ? "border-amber-500/30 group-hover:border-amber-400/50"
                    : "border-zinc-800 group-hover:border-zinc-700";

            // İlgili Altyazılar
            const sceneCaptions = (captionTrack || []).filter((c: any) => {
                const cStart = c.start ?? c.Start;
                return cStart >= sStart && cStart < (sStart + sDuration);
            });

            return (
              <div key={idx} className={`flex flex-col ${isVertical ? 'w-80' : 'w-[460px]'} shrink-0 gap-2 group`}>
                
                {/* Kart Başlığı (Zaman) */}
                <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-mono font-medium text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                        {sStart?.toFixed(1)}s - {(sStart + sDuration)?.toFixed(1)}s
                    </span>
                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">#{sIndex}</span>
                </div>

                {/* Sahne Kartı */}
                <div className={`flex-1 flex flex-col bg-zinc-900 border rounded-xl overflow-hidden shadow-sm transition-all duration-300 ${cadenceBorderClass}`}>
                  
                  {/* Resim Alanı (Gelişmiş) */}
                  <div className={`relative ${isVertical ? 'h-80' : 'h-64'} bg-zinc-950 overflow-hidden shrink-0 group-hover:bg-zinc-900 transition-colors`}>
                        {/* Main Image */}
                        <img 
                            src={getImageUrl(sPath)}
                            alt={`Scene ${sIndex}`}
                            loading="lazy"
                            decoding="async"
                            fetchPriority="low"
                            className={`relative w-full h-full object-contain z-10 p-2 opacity-90 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-500 ${isRegenerating ? 'blur-sm grayscale' : ''}`}
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://placehold.co/400x600/18181b/52525b?text=Image+Error";
                            }}
                        />

                        {/* Loading Overlay */}
                        {isRegenerating && (
                            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                                <Loader2 className="animate-spin text-white" size={24} />
                            </div>
                        )}

                        {/* Image revision controls */}
                        {runId && !isRegenerating && (
                            <div className="absolute top-2 left-2 z-30 flex items-center gap-1 rounded-lg border border-white/10 bg-black/75 p-1 shadow-lg backdrop-blur">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        void handleRegenerate(Number(sIndex), idx, regenerateBeatIndex, sPath, isServerPagedTimeline ? localIdx : idx, "resample");
                                    }}
                                    className="rounded-md p-1.5 text-zinc-200 transition hover:bg-zinc-700 hover:text-white"
                                    title="Aynı promptla yeniden üret"
                                >
                                    <RefreshCw size={13} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        void handleRegenerate(Number(sIndex), idx, regenerateBeatIndex, sPath, isServerPagedTimeline ? localIdx : idx, "reframe");
                                    }}
                                    className="rounded-md p-1.5 text-cyan-200 transition hover:bg-cyan-500/20 hover:text-cyan-100"
                                    title="Aynı anlatı için farklı kadraj ve kompozisyon üret"
                                >
                                    <Scan size={13} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        void handleRegenerate(Number(sIndex), idx, regenerateBeatIndex, sPath, isServerPagedTimeline ? localIdx : idx, "replan");
                                    }}
                                    className="rounded-md p-1.5 text-fuchsia-200 transition hover:bg-fuchsia-500/20 hover:text-fuchsia-100"
                                    title="Anlatı anını AI ile yeniden yorumla ve yeni görsel fikir üret"
                                >
                                    <WandSparkles size={13} />
                                </button>
                            </div>
                        )}

                        {/* Efekt Badge */}
                        <div className="absolute top-2 right-2 z-20">
                            <Badge variant="neutral" className="bg-black/60 backdrop-blur border border-white/10 text-[9px] text-white shadow-sm">
                                {sEffect?.replace(/_/g, " ") || "STATIC"}
                            </Badge>
                        </div>
                  </div>

                  {(isFallbackImage || sRole || sVisualType || sVarietyRole || sSegmentRole || sAudioTransition || sShot || sChapter || sIntent || sCutReason || sSpokenAnchor || sVisualThesis || sVisualArchetype || sForbiddenReuse || sVisualIntent || sNarrationFocus || sVisualPurpose || sAnchorPhrase || sAlignmentSource || (sTextMode && sTextMode !== "none") || sPlannedDuration > 0 || sTimingSource || sTimingAdjustmentReason || sAnchorRejectedReason || sAnchor || sComposition || sQuality > 0 || sPromptHash || canShowPromptButton) && (
                    <div className="border-t border-zinc-800/70 bg-zinc-950/35 p-2 space-y-1.5">
                        <div className="flex flex-wrap gap-1">
                            {isFallbackImage && (
                                <Badge variant="neutral" className="bg-amber-500/10 border-amber-500/25 text-amber-200 text-[9px]">
                                    fallback S{sSourceScene || inferredSourceScene || "?"}{sSourceBeat > 0 ? ` / B${sSourceBeat}` : ""}
                                </Badge>
                            )}
                            {sChapter && (
                                <Badge variant="neutral" className="bg-indigo-500/10 border-indigo-500/20 text-indigo-200 text-[9px]">
                                    {sChapter}
                                </Badge>
                            )}
                            {sRole && (
                                <Badge variant="neutral" className="bg-zinc-800/70 border-zinc-700 text-zinc-300 text-[9px]">
                                    {String(sRole).replace(/_/g, " ")}
                                </Badge>
                            )}
                            {sVisualType && (
                                <Badge variant="neutral" className="bg-cyan-500/10 border-cyan-500/20 text-cyan-200 text-[9px]">
                                    {String(sVisualType).replace(/_/g, " ")}
                                </Badge>
                            )}
                            {sVarietyRole && (
                                <Badge variant="neutral" className="bg-blue-500/10 border-blue-500/20 text-blue-200 text-[9px]">
                                    {String(sVarietyRole).replace(/_/g, " ")}
                                </Badge>
                            )}
                            {sSegmentRole && (
                                <Badge variant="neutral" className="bg-emerald-500/10 border-emerald-500/20 text-emerald-200 text-[9px]">
                                    {String(sSegmentRole).replace(/_/g, " ")}
                                </Badge>
                            )}
                            {sVisualArchetype && (
                                <Badge variant="neutral" className="bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-200 text-[9px]">
                                    {String(sVisualArchetype).replace(/_/g, " ")}
                                </Badge>
                            )}
                            {sAudioTransition && sAudioTransition !== "straight" && (
                                <Badge variant="neutral" className="bg-sky-500/10 border-sky-500/20 text-sky-200 text-[9px]">
                                    {String(sAudioTransition).replace(/_/g, "-")} {sAudioOffset.toFixed(2)}s
                                </Badge>
                            )}
                            {sShot && (
                                <Badge variant="neutral" className="bg-purple-500/10 border-purple-500/20 text-purple-200 text-[9px]">
                                    {String(sShot).replace(/_/g, " ")}
                                </Badge>
                            )}
                            {sEnergy && (
                                <Badge variant="neutral" className="bg-amber-500/10 border-amber-500/20 text-amber-200 text-[9px]">
                                    enerji: {String(sEnergy).replace(/_/g, " ")}
                                </Badge>
                            )}
                            {sQuality > 0 && (
                                <Badge
                                    variant="neutral"
                                    className={`${sQuality >= 78 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-200" : sQuality >= 62 ? "bg-amber-500/10 border-amber-500/20 text-amber-200" : "bg-rose-500/10 border-rose-500/20 text-rose-200"} text-[9px]`}
                                >
                                    QA {sQuality}/100
                                </Badge>
                            )}
                            {sPlannedDuration > 0 && (
                                <Badge variant="neutral" className="bg-zinc-800/70 border-zinc-700 text-zinc-300 text-[9px]">
                                    plan {sPlannedDuration.toFixed(1)}s
                                </Badge>
                            )}
                            <Badge variant="neutral" className={`${cadenceBadgeClass} text-[9px]`}>
                                {sCadenceStatus.replace(/_/g, " ")} · {Number(sDuration || 0).toFixed(2)}s
                            </Badge>
                            {sTimingSource && (
                                <Badge variant="neutral" className="bg-emerald-500/10 border-emerald-500/20 text-emerald-200 text-[9px]">
                                    {String(sTimingSource).replace(/_/g, " ")}
                                    {sBeatEnd > sBeatStart ? ` ${sBeatStart.toFixed(1)}-${sBeatEnd.toFixed(1)}s` : ""}
                                </Badge>
                            )}
                            {sAlignmentSource && (
                                <Badge variant="neutral" className={`${sAlignmentConfidence >= 0.6 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-200" : "bg-amber-500/10 border-amber-500/20 text-amber-200"} text-[9px]`}>
                                    sync {Math.round(sAlignmentConfidence * 100)}%
                                    {sMatchedTranscriptEnd > sMatchedTranscriptStart ? ` @ ${sMatchedTranscriptStart.toFixed(1)}s` : ""}
                                </Badge>
                            )}
                            {sTextMode && sTextMode !== "none" && (
                                <Badge variant="neutral" className="bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-200 text-[9px]">
                                    text: {String(sTextMode).replace(/_/g, " ")}
                                </Badge>
                            )}
                            {sPromptHash && (
                                <Badge variant="neutral" className="bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-200 text-[9px]">
                                    prompt #{shortHash(sPromptHash)}
                                </Badge>
                            )}
                            {canShowPromptButton && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const nextOpen = !openPromptCards[idx];
                                        setOpenPromptCards((prev) => ({ ...prev, [idx]: nextOpen }));
                                        if (nextOpen && canLoadPrompt && !hasPromptText && !isPromptLoading) {
                                            void loadPromptForVisual(promptSceneNumber, promptBeatIndex, sPath, promptCacheKey);
                                        }
                                    }}
                                    className="rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-2 py-0.5 text-[9px] font-bold text-fuchsia-100 transition hover:border-fuchsia-400/50 hover:bg-fuchsia-500/20"
                                >
                                    Prompt {isPromptOpen ? "gizle" : "gör"}
                                </button>
                            )}
                        </div>
                        {(sIntent || sCutReason || sVisualIntent) && (
                            <p className="text-[10px] leading-snug text-zinc-400 line-clamp-2">
                                {[sCutReason, sIntent].filter(Boolean).join(" · ")}
                            </p>
                        )}
                        {sVisualIntent && (
                            <p className="text-[9px] leading-snug text-cyan-200/80 line-clamp-2">
                                <span className="font-semibold text-cyan-200">Visual intent:</span> {sVisualIntent}
                            </p>
                        )}
                        {(sSpokenAnchor || sVisualThesis || sForbiddenReuse || sAnchorPhrase || sNarrationFocus || sVisualPurpose || sAllowedText || sTimingAdjustmentReason || sAnchorRejectedReason) && (
                            <div className="grid gap-1 rounded-lg border border-indigo-500/10 bg-indigo-500/5 px-2 py-1.5">
                                {sSpokenAnchor && (
                                    <p className="text-[9px] leading-snug text-emerald-200/90 line-clamp-2">
                                        <span className="font-semibold text-emerald-300">Spoken anchor:</span> {sSpokenAnchor}
                                    </p>
                                )}
                                {sVisualThesis && (
                                    <p className="text-[9px] leading-snug text-fuchsia-100/90 line-clamp-2">
                                        <span className="font-semibold text-fuchsia-200">Visual thesis:</span> {sVisualThesis}
                                    </p>
                                )}
                                {sAnchorPhrase && (
                                    <p className="text-[9px] leading-snug text-emerald-200/90 line-clamp-2">
                                        <span className="font-semibold text-emerald-300">Anchor:</span> {sAnchorPhrase}
                                        {sTriggerWords.length > 0 ? ` · ${sTriggerWords.slice(0, 6).join(", ")}` : ""}
                                    </p>
                                )}
                                {sNarrationFocus && (
                                    <p className="text-[9px] leading-snug text-indigo-200/90 line-clamp-2">
                                        <span className="font-semibold text-indigo-300">Focus:</span> {sNarrationFocus}
                                    </p>
                                )}
                                {sVisualPurpose && (
                                    <p className="text-[9px] leading-snug text-indigo-200/70 line-clamp-2">
                                        <span className="font-semibold text-indigo-300">Purpose:</span> {sVisualPurpose}
                                    </p>
                                )}
                                {sForbiddenReuse && (
                                    <p className="text-[9px] leading-snug text-amber-200/75 line-clamp-2">
                                        <span className="font-semibold text-amber-200">Bu sahnede tekrar etme:</span> {sForbiddenReuse}
                                    </p>
                                )}
                                {sAllowedText && sTextMode !== "none" && (
                                    <p className="text-[9px] leading-snug text-fuchsia-100/80 line-clamp-1">
                                        <span className="font-semibold text-fuchsia-200">Allowed text:</span> {sAllowedText}
                                    </p>
                                )}
                                {sTimingAdjustmentReason && (
                                    <p className="text-[9px] leading-snug text-sky-200/80 line-clamp-2">
                                        <span className="font-semibold text-sky-200">Timing:</span> {sTimingAdjustmentReason}
                                    </p>
                                )}
                                {sAnchorRejectedReason && (
                                    <p className="text-[9px] leading-snug text-amber-200/80 line-clamp-2">
                                        <span className="font-semibold text-amber-200">Anchor fallback:</span> {sAnchorRejectedReason}
                                    </p>
                                )}
                            </div>
                        )}
                        {(sVarietyReason || sAnchor || sComposition || sQualityNotes) && (
                            <p className="text-[9px] leading-snug text-zinc-600 line-clamp-2">
                                {[sVarietyReason, sAnchor, sComposition, sQualityNotes].filter(Boolean).join(" · ")}
                            </p>
                        )}
                        {(sPromptPartKey || sGenerationContract || sInputHash) && (
                            <p className="text-[9px] leading-snug text-fuchsia-200/60 line-clamp-1">
                                <span className="font-semibold text-fuchsia-200/80">Trace:</span>{" "}
                                {[sPromptPartKey, sGenerationContract, sInputHash && `input #${shortHash(sInputHash)}`].filter(Boolean).join(" · ")}
                            </p>
                        )}
                        {isPromptOpen && (hasPromptText || isPromptLoading || promptError) && (
                            <div className="space-y-2 rounded-lg border border-fuchsia-500/15 bg-fuchsia-500/[0.04] p-2">
                                {isPromptLoading && (
                                    <div className="flex items-center gap-2 text-[10px] text-fuchsia-100/80">
                                        <Loader2 size={12} className="animate-spin" />
                                        Prompt detayi yukleniyor...
                                    </div>
                                )}
                                {promptError && (
                                    <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-2 py-1.5 text-[10px] text-rose-200">
                                        {promptError}
                                    </div>
                                )}
                                {sImagePrompt && (
                                    <PromptBlock
                                        title="Image prompt"
                                        text={sImagePrompt}
                                        onCopy={() => copyPromptText(sImagePrompt, "Image prompt")}
                                    />
                                )}
                                {sNegativePrompt && (
                                    <PromptBlock
                                        title="Negative prompt"
                                        text={sNegativePrompt}
                                        onCopy={() => copyPromptText(sNegativePrompt, "Negative prompt")}
                                        tone="negative"
                                    />
                                )}
                            </div>
                        )}
                    </div>
                  )}

                  {/* Altyazı Listesi (Kompakt) */}
                  <div className="flex-1 bg-zinc-900/30 p-2 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 min-h-[80px]">
                    <div className="flex flex-col gap-1.5">
                        {sceneCaptions.length > 0 ? (
                            sceneCaptions.map((cap: any, cIdx: number) => (
                                <div key={cIdx} className="text-xs text-zinc-400 leading-snug bg-zinc-950/40 p-1.5 rounded border border-zinc-800/30 hover:bg-zinc-950 hover:text-zinc-200 transition-colors">
                                    <span className="text-indigo-500 font-mono text-[9px] mr-1.5 opacity-60">
                                        {(cap.start ?? cap.Start)?.toFixed(1)}s
                                    </span>
                                    {cap.text || cap.Text}
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex items-center justify-center text-zinc-700 text-[10px] italic opacity-40">
                                ...
                            </div>
                        )}
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MetricPill({
  icon,
  label,
  value,
  tone = "zinc",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: "indigo" | "purple" | "cyan" | "emerald" | "sky" | "fuchsia" | "amber" | "rose" | "zinc";
}) {
  const toneClass =
    tone === "indigo"
      ? "border-indigo-500/20 bg-indigo-500/10 text-indigo-200"
      : tone === "purple"
        ? "border-purple-500/20 bg-purple-500/10 text-purple-200"
        : tone === "cyan"
          ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-200"
          : tone === "emerald"
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
            : tone === "sky"
              ? "border-sky-500/20 bg-sky-500/10 text-sky-200"
              : tone === "fuchsia"
                ? "border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-200"
                : tone === "amber"
                  ? "border-amber-500/20 bg-amber-500/10 text-amber-200"
                  : tone === "rose"
                    ? "border-rose-500/20 bg-rose-500/10 text-rose-200"
                    : "border-zinc-800 bg-zinc-900/70 text-zinc-300";

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 ${toneClass}`}>
      <span className="shrink-0 opacity-90">{icon}</span>
      <span className="text-[9px] font-bold uppercase tracking-wide opacity-65">{label}</span>
      <span className="font-mono text-[11px] font-semibold">{value}</span>
    </div>
  );
}

function PromptBlock({
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
    <div className={`rounded-lg border p-2 ${tone === "negative" ? "border-rose-500/15 bg-rose-500/[0.04]" : "border-fuchsia-500/15 bg-zinc-950/45"}`}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className={`text-[9px] font-bold uppercase tracking-wide ${tone === "negative" ? "text-rose-200" : "text-fuchsia-200"}`}>
          {title}
        </span>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900/80 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white"
        >
          <Copy size={10} /> Kopyala
        </button>
      </div>
      <div className="max-h-36 overflow-y-auto whitespace-pre-wrap rounded-md bg-black/25 p-2 text-[10px] leading-relaxed text-zinc-300 scrollbar-thin scrollbar-thumb-zinc-800">
        {text}
      </div>
    </div>
  );
}
