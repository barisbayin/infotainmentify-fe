import { useEffect, useState, useRef, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import {
  pipelineRunsApi,
  type PipelineRunListDto,
  type PipelineRunDetailDto,
  type PipelineStageDto,
  type PipelineTimelinePageDto,
  type ProductionBrief,
} from "../api/pipelineRuns";
import {
  pipelineTemplatesApi,
} from "../api/pipelineTemplates";
import {
  renderPresetsApi,
  type RenderPresetListDto,
} from "../api/renderPresets";
import {
  PRODUCTION_BRIEF_FIELD_LIMITS,
  productionBriefsApi,
  type SavedProductionBriefDto,
} from "../api/productionBriefs";
import toast from "react-hot-toast";
import {
  Page,
  Card,
  Button,
  Input,
  Label,
  Modal,
  Select,
  Textarea,
  ConfirmModal, 
} from "../components/ui-kit";
import {
  Play,
  RefreshCw,
  Layers,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Activity,
  Copy,
  Calendar,
  Eye, // EKLENDİ
  ImageIcon,
  MinusCircle,
  RefreshCcw,
  Terminal,
  AlertCircle,
  Sparkles,
  WandSparkles,
  Upload,
} from "lucide-react";
import { conceptsApi } from "../api/concepts";
import { cn } from "../components/ui-kit";
import { ProductionReviewCenter } from "../components/ProductionReviewCenter";
import { StageValidationReport } from "../components/StageValidationReport";
import { TimelineViewer, type SceneLayoutPayload } from "../components/TimelineViewer"; // 🔥 EKLENDİ
import LiveLogViewer from "../components/LiveLogViewer"; // 🔥 LiveLogViewer Eklendi
import VideoPlayer from "../components/VideoPlayer"; // 🔥 VideoPlayer Eklendi
import { RunHistoryList } from "../components/pipeline-runs/RunHistoryList";
import { RunRenderProgressPanel } from "../components/pipeline-runs/RunRenderProgressPanel";
import { RunStatusBadge } from "../components/pipeline-runs/RunStatusBadge";



// --- HELPER FUNCTIONS ---

const resolveMediaUrl = (url?: string | null) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;

  const apiBase = import.meta.env.VITE_API_BASE_URL || "";
  const normalizedPath = url.startsWith("/") ? url : `/${url}`;
  return `${apiBase}${normalizedPath}`;
};

const EMPTY_PRODUCTION_BRIEF: ProductionBrief = {
  mainTitle: "",
  angle: "",
  audience: "",
  targetDuration: "",
  mustCover: "",
  avoid: "",
  hookDirection: "",
  thumbnailDirection: "",
  notes: "",
};

const normalizeProductionBrief = (brief: ProductionBrief): ProductionBrief | undefined => {
  const clean: ProductionBrief = {
    mainTitle: brief.mainTitle?.trim() ?? "",
    angle: brief.angle?.trim() ?? "",
    audience: brief.audience?.trim() ?? "",
    targetDuration: brief.targetDuration?.trim() ?? "",
    mustCover: brief.mustCover?.trim() ?? "",
    avoid: brief.avoid?.trim() ?? "",
    hookDirection: brief.hookDirection?.trim() ?? "",
    thumbnailDirection: brief.thumbnailDirection?.trim() ?? "",
    notes: brief.notes?.trim() ?? "",
  };

  return Object.values(clean).some(Boolean) ? clean : undefined;
};

function BriefFieldCounter({ value, limit }: { value?: string; limit: number }) {
  return (
    <div className="mt-1 text-right text-[10px] text-zinc-500">
      {(value ?? "").length.toLocaleString("tr-TR")} / {limit.toLocaleString("tr-TR")}
    </div>
  );
}

type ImagePromptLookupItem = {
  imagePrompt: string;
  negativePrompt: string;
  promptHash: string;
  inputHash: string;
  promptPartKey: string;
  generationContract: string;
};

const readField = (source: any, ...names: string[]) => {
  if (!source || typeof source !== "object") return undefined;
  for (const name of names) {
    if (source[name] !== undefined && source[name] !== null) return source[name];
  }
  return undefined;
};

const readStringField = (source: any, ...names: string[]) => {
  const value = readField(source, ...names);
  return typeof value === "string" ? value.trim() : "";
};

const readNumberField = (source: any, fallback: number, ...names: string[]) => {
  const value = readField(source, ...names);
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const readArrayField = (source: any, ...names: string[]) => {
  const value = readField(source, ...names);
  return Array.isArray(value) ? value : [];
};

const imagePromptLookupKey = (sceneNumber: number, beatIndex: number) =>
  `${sceneNumber}:${Math.max(1, Number.isFinite(beatIndex) ? beatIndex : 1)}`;

const buildImagePromptLookup = (imageOutput: any) => {
  const lookup = new Map<string, ImagePromptLookupItem>();
  if (!imageOutput || typeof imageOutput !== "object") return lookup;

  const promptParts = readArrayField(imageOutput, "promptParts", "PromptParts");
  const promptPartLookup = new Map<string, any>();

  promptParts.forEach((part: any) => {
    const sceneNumber = readNumberField(part, 0, "sceneNumber", "SceneNumber");
    const beatIndex = readNumberField(part, 1, "beatIndex", "BeatIndex", "segmentIndex", "SegmentIndex");
    const partKey = readStringField(part, "key", "Key", "promptPartKey", "PromptPartKey");

    if (partKey) promptPartLookup.set(partKey, part);
    if (sceneNumber > 0) promptPartLookup.set(imagePromptLookupKey(sceneNumber, beatIndex), part);
  });

  readArrayField(imageOutput, "sceneImages", "SceneImages", "images", "Images").forEach((image: any) => {
    const sceneNumber = readNumberField(image, 0, "sceneNumber", "SceneNumber");
    const beatIndex = readNumberField(image, 1, "beatIndex", "BeatIndex", "segmentIndex", "SegmentIndex");
    if (sceneNumber <= 0) return;

    const promptPartKey = readStringField(image, "promptPartKey", "PromptPartKey");
    const promptPart = (promptPartKey && promptPartLookup.get(promptPartKey)) || promptPartLookup.get(imagePromptLookupKey(sceneNumber, beatIndex));
    const imagePrompt =
      readStringField(image, "imagePrompt", "ImagePrompt", "promptUsed", "PromptUsed", "finalPrompt", "FinalPrompt") ||
      readStringField(promptPart, "finalPrompt", "FinalPrompt");
    const negativePrompt =
      readStringField(image, "negativePrompt", "NegativePrompt", "negativePromptUsed", "NegativePromptUsed") ||
      readStringField(promptPart, "negativePrompt", "NegativePrompt");

    if (!imagePrompt && !negativePrompt) return;

    lookup.set(imagePromptLookupKey(sceneNumber, beatIndex), {
      imagePrompt,
      negativePrompt,
      promptHash: readStringField(image, "promptHash", "PromptHash") || readStringField(promptPart, "promptHash", "PromptHash"),
      inputHash: readStringField(image, "inputHash", "InputHash") || readStringField(promptPart, "inputHash", "InputHash"),
      promptPartKey: promptPartKey || readStringField(promptPart, "key", "Key"),
      generationContract: readStringField(image, "generationContract", "GenerationContract"),
    });
  });

  return lookup;
};

const enrichSceneLayoutWithImagePrompts = (data: any, imageOutput: any): SceneLayoutPayload => {
  const lookup = buildImagePromptLookup(imageOutput);
  if (lookup.size === 0) return data as SceneLayoutPayload;

  const enrichItem = (item: any) => {
    if (!item || typeof item !== "object") return item;

    const sceneNumber = readNumberField(item, 0, "sourceImageSceneNumber", "SourceImageSceneNumber", "sceneIndex", "SceneIndex", "sceneNumber", "SceneNumber");
    const beatIndex = readNumberField(item, 1, "sourceImageBeatIndex", "SourceImageBeatIndex", "beatIndex", "BeatIndex", "segmentIndex", "SegmentIndex");
    const promptInfo = lookup.get(imagePromptLookupKey(sceneNumber, beatIndex)) || lookup.get(imagePromptLookupKey(sceneNumber, 1));

    if (!promptInfo) return item;

    return {
      ...item,
      imagePrompt: readStringField(item, "imagePrompt", "ImagePrompt", "promptUsed", "PromptUsed", "finalPrompt", "FinalPrompt") || promptInfo.imagePrompt,
      negativePrompt: readStringField(item, "negativePrompt", "NegativePrompt", "negativePromptUsed", "NegativePromptUsed") || promptInfo.negativePrompt,
      promptHash: readStringField(item, "promptHash", "PromptHash") || promptInfo.promptHash,
      inputHash: readStringField(item, "inputHash", "InputHash") || promptInfo.inputHash,
      promptPartKey: readStringField(item, "promptPartKey", "PromptPartKey") || promptInfo.promptPartKey,
      generationContract: readStringField(item, "generationContract", "GenerationContract") || promptInfo.generationContract,
    };
  };

  const visualTrack = readArrayField(data, "visualTrack", "VisualTrack");
  const editDecisionList = readArrayField(data, "editDecisionList", "EditDecisionList");

  return {
    ...data,
    visualTrack: visualTrack.map(enrichItem),
    VisualTrack: data?.VisualTrack ? visualTrack.map(enrichItem) : data?.VisualTrack,
    editDecisionList: editDecisionList.map(enrichItem),
    EditDecisionList: data?.EditDecisionList ? editDecisionList.map(enrichItem) : data?.EditDecisionList,
  } as SceneLayoutPayload;
};

type CreativeDirectorChapterPreview = {
  title?: string;
  purpose?: string;
  viewerQuestion?: string;
  emotionalBeat?: string;
  visualDirection?: string;
  pacing?: string;
};

type CreativeDirectorPreview = {
  videoPromise?: string;
  coreQuestion?: string;
  narrativeAngle?: string;
  hookStrategy?: string;
  retentionStrategy?: string;
  visualStrategy?: string;
  pacingStrategy?: string;
  payoff?: string;
  chapters: CreativeDirectorChapterPreview[];
};

type ScriptSceneDirectionPreview = {
  sceneNumber?: number;
  sceneRole?: string;
  scenePurpose?: string;
  viewerQuestion?: string;
  emotionalBeat?: string;
  visualType?: string;
  visualVarietyRole?: string;
  visualVarietyReason?: string;
  cameraPlan?: string;
  overlayText?: string;
  sfxCue?: string;
  transitionIntent?: string;
  chapterTitle?: string;
  audioText?: string;
};

type ScriptDirectionPreview = {
  title?: string;
  scenes: ScriptSceneDirectionPreview[];
};

type YouTubePackagePreview = {
  titleOptions: string[];
  thumbnailConcepts: { name?: string; prompt?: string; rationale?: string }[];
  description?: string;
  chapters: { timestamp?: string; title?: string }[];
  tags: string[];
  hashtags: string[];
  pinnedComment?: string;
  uploadChecklist: string[];
};

type RenderAudioQaPreview = {
  meanVolumeDb?: number;
  maxVolumeDb?: number;
  silenceDurationSec?: number;
  silenceRatio?: number;
  silenceSegmentCount?: number;
  status?: string;
  warnings: string[];
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

const DETAIL_POLL_INTERVAL_MS = 5000;
const ACTIVE_RUN_STATUSES = new Set<string>(["Pending", "Running"]);
const STOP_POLLING_RUN_STATUSES = new Set<string>([
  "Completed",
  "Failed",
  "Cancelled",
  "WaitingForApproval",
  "PermanentlyFailed",
]);

const parseCreativeDirectorOutput = (json?: string | null): CreativeDirectorPreview | null => {
  if (!json) return null;

  try {
    const data = JSON.parse(json);
    const rawChapters = data.chapters ?? data.Chapters ?? [];

    return {
      videoPromise: pickText(data, "videoPromise"),
      coreQuestion: pickText(data, "coreQuestion"),
      narrativeAngle: pickText(data, "narrativeAngle"),
      hookStrategy: pickText(data, "hookStrategy"),
      retentionStrategy: pickText(data, "retentionStrategy"),
      visualStrategy: pickText(data, "visualStrategy"),
      pacingStrategy: pickText(data, "pacingStrategy"),
      payoff: pickText(data, "payoff"),
      chapters: Array.isArray(rawChapters)
        ? rawChapters.slice(0, 6).map((chapter: any) => ({
            title: pickText(chapter, "title"),
            purpose: pickText(chapter, "purpose"),
            viewerQuestion: pickText(chapter, "viewerQuestion"),
            emotionalBeat: pickText(chapter, "emotionalBeat"),
            visualDirection: pickText(chapter, "visualDirection"),
            pacing: pickText(chapter, "pacing"),
          }))
        : [],
    };
  } catch {
    return null;
  }
};

const parseScriptDirectionOutput = (json?: string | null): ScriptDirectionPreview | null => {
  if (!json) return null;

  try {
    const data = JSON.parse(json);
    const rawScenes = data.scenes ?? data.Scenes ?? data.items ?? data.Items ?? [];
    if (!Array.isArray(rawScenes)) return null;

    return {
      title: pickText(data, "title", "videoTitle"),
      scenes: rawScenes.slice(0, 8).map((scene: any, index: number) => ({
        sceneNumber: pickNumber(scene, "sceneNumber", "index") ?? index + 1,
        sceneRole: pickText(scene, "sceneRole", "role", "sceneType"),
        scenePurpose: pickText(scene, "scenePurpose", "purpose", "intent"),
        viewerQuestion: pickText(scene, "viewerQuestion", "retentionGoal", "question"),
        emotionalBeat: pickText(scene, "emotionalBeat", "emotion", "tone"),
        visualType: pickText(scene, "visualType", "imageType", "shotCategory"),
        visualVarietyRole: pickText(scene, "visualVarietyRole", "varietyRole"),
        visualVarietyReason: pickText(scene, "visualVarietyReason", "varietyReason"),
        cameraPlan: pickText(scene, "cameraPlan", "cameraMotion", "motion"),
        overlayText: pickText(scene, "overlayText", "onScreenText"),
        sfxCue: pickText(scene, "sfxCue", "soundCue", "audioCue"),
        transitionIntent: pickText(scene, "transitionIntent", "transitionType", "transition"),
        chapterTitle: pickText(scene, "chapterTitle", "chapter"),
        audioText: pickText(scene, "audioText", "text", "narration"),
      })),
    };
  } catch {
    return null;
  }
};

const parseYouTubePackageOutput = (json?: string | null): YouTubePackagePreview | null => {
  if (!json) return null;

  try {
    const data = JSON.parse(json);
    const pkg = data.youtubePackage ?? data.YouTubePackage;
    if (!pkg) return null;

    return {
      titleOptions: pkg.titleOptions ?? pkg.TitleOptions ?? [],
      thumbnailConcepts: pkg.thumbnailConcepts ?? pkg.ThumbnailConcepts ?? [],
      description: pkg.description ?? pkg.Description ?? "",
      chapters: pkg.chapters ?? pkg.Chapters ?? [],
      tags: pkg.tags ?? pkg.Tags ?? [],
      hashtags: pkg.hashtags ?? pkg.Hashtags ?? [],
      pinnedComment: pkg.pinnedComment ?? pkg.PinnedComment ?? "",
      uploadChecklist: pkg.uploadChecklist ?? pkg.UploadChecklist ?? [],
    };
  } catch {
    return null;
  }
};

const parseRenderAudioQaOutput = (json?: string | null): RenderAudioQaPreview | null => {
  if (!json) return null;

  try {
    const data = JSON.parse(json);
    const qa = data.audioQa ?? data.AudioQa;
    if (!qa) return null;

    return {
      meanVolumeDb: qa.meanVolumeDb ?? qa.MeanVolumeDb,
      maxVolumeDb: qa.maxVolumeDb ?? qa.MaxVolumeDb,
      silenceDurationSec: qa.silenceDurationSec ?? qa.SilenceDurationSec,
      silenceRatio: qa.silenceRatio ?? qa.SilenceRatio,
      silenceSegmentCount: qa.silenceSegmentCount ?? qa.SilenceSegmentCount,
      status: qa.status ?? qa.Status,
      warnings: qa.warnings ?? qa.Warnings ?? [],
    };
  } catch {
    return null;
  }
};

const getStageLabel = (stageType: string) => {
  switch (stageType) {
    case "CreativeDirector":
      return "Creative Director";
    case "SceneLayout":
      return "Kurgu / Timeline";
    case "EditPlan":
      return "Edit Plan";
    case "Tts":
      return "Seslendirme";
    case "Stt":
      return "Altyazi Zamanlama";
    case "Thumbnail":
      return "Kapak";
    case "Upload":
      return "YouTube Yukleme";
    default:
      return stageType;
  }
};

const findRunStage = (detail: PipelineRunDetailDto, stageType: string) =>
  detail.stages.find((stage) => stage.stageType.toLowerCase() === stageType.toLowerCase());

const canRegenerateStage = (stage?: PipelineStageDto) =>
  Boolean(stage && ["Completed", "Failed", "PermanentlyFailed", "Outdated", "Cancelled", "WaitingForApproval"].includes(stage.status));

const canContinueUpload = (detail: PipelineRunDetailDto) => {
  const uploadStage = findRunStage(detail, "Upload");
  const renderStage = findRunStage(detail, "Render") || findRunStage(detail, "Video");
  if (!renderStage || renderStage.status !== "Completed") return false;
  if (uploadStage?.status === "Completed") return false;
  if (["Running", "Retrying"].includes(uploadStage?.status || "")) return false;

  return ["Completed", "WaitingForApproval", "Failed", "Cancelled", "Running"].includes(detail.status)
    && (!uploadStage || ["Pending", "Outdated", "WaitingForApproval", "Failed", "PermanentlyFailed", "Cancelled"].includes(uploadStage.status));
};

const shouldShowUploadProgressPanel = (stage?: PipelineStageDto) =>
  Boolean(stage && ["Pending", "Running", "Retrying", "Failed", "PermanentlyFailed", "Cancelled"].includes(stage.status));

const getUploadProgressLabel = (stage?: PipelineStageDto) => {
  switch (stage?.status) {
    case "Pending":
      return "Upload kuyruga alindi, worker bekleniyor.";
    case "Running":
    case "Retrying":
      return "YouTube upload çalışıyor. Byte progress SignalR ile güncellenecek.";
    case "Failed":
    case "PermanentlyFailed":
      return stage.error || "Upload hata verdi.";
    case "Cancelled":
      return "Upload durduruldu.";
    default:
      return undefined;
  }
};

const getStageIcon = (status: string) => {
  switch (status) {
    case "Completed":
      return <CheckCircle2 size={18} className="text-emerald-500" />;
    case "Outdated":
      return <AlertCircle size={18} className="text-orange-500" />;
    case "WaitingForApproval":
      return <Clock size={18} className="text-blue-400" />;
    case "Running":
      return <Loader2 size={18} className="text-amber-500 animate-spin" />;
    case "Failed":
    case "PermanentlyFailed":
      return <XCircle size={18} className="text-red-500" />;
    case "Cancelled":
      return <XCircle size={18} className="text-zinc-500" />;
    case "Pending":
      return <Clock size={18} className="text-zinc-600" />;
    case "Skipped":
       return <MinusCircle size={18} className="text-zinc-600" />;
    default:
      return (
        <div className="w-4 h-4 rounded-full border-2 border-zinc-700" />
      );
  }
};

/*
 * 2. RunDetail (Sağ Taraf)
 * Shows the details of the selected run including stages timeline.
 */
const CreativeDirectorStagePreview = ({ outputJson }: { outputJson?: string | null }) => {
    const plan = parseCreativeDirectorOutput(outputJson);

    if (!plan) {
        return (
            <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-[11px] text-zinc-500">
                Creative Director ciktisi okunamadi veya henuz uretilmedi.
            </div>
        );
    }

    const highlights = [
        { label: "Video vaadi", value: plan.videoPromise },
        { label: "Ana soru", value: plan.coreQuestion },
        { label: "Aci", value: plan.narrativeAngle },
        { label: "Hook", value: plan.hookStrategy },
        { label: "Retention", value: plan.retentionStrategy },
        { label: "Gorsel strateji", value: plan.visualStrategy },
        { label: "Payoff", value: plan.payoff },
    ].filter((item) => item.value);

    return (
        <div className="mt-3 rounded-xl border border-indigo-500/15 bg-indigo-500/[0.04] p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-200">
                    <Sparkles size={14} className="text-indigo-400" />
                    Creative Director Ozeti
                </div>
                <div className="flex flex-wrap gap-1.5 text-[10px] text-zinc-400">
                    <span className="rounded-full border border-zinc-800 bg-zinc-950/70 px-2 py-0.5">
                        Girdi: Topic + Brief
                    </span>
                    <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-indigo-300">
                        Cikti: Strateji + Bolum Plani
                    </span>
                </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
                {highlights.slice(0, 6).map((item) => (
                    <div key={item.label} className="rounded-lg border border-zinc-800/70 bg-zinc-950/35 p-2">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                            {item.label}
                        </div>
                        <div className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-zinc-300">
                            {item.value}
                        </div>
                    </div>
                ))}
            </div>

            {plan.chapters.length > 0 && (
                <div className="mt-3 rounded-lg border border-zinc-800/70 bg-zinc-950/30 p-2">
                    <div className="mb-2 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                        Bolum Akisi
                    </div>
                    <div className="grid gap-1.5 md:grid-cols-2 xl:grid-cols-3">
                        {plan.chapters.map((chapter, index) => (
                            <div key={`${chapter.title}-${index}`} className="rounded-md border border-zinc-800/70 bg-zinc-900/35 px-2 py-1.5">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="truncate text-[11px] font-semibold text-zinc-200">
                                        {index + 1}. {chapter.title || "Bolum"}
                                    </span>
                                    {chapter.pacing && (
                                        <span className="shrink-0 rounded-full bg-zinc-950 px-1.5 py-0.5 text-[9px] text-zinc-500">
                                            {chapter.pacing}
                                        </span>
                                    )}
                                </div>
                                <div className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-zinc-500">
                                    {chapter.viewerQuestion || chapter.purpose || chapter.visualDirection || "-"}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const ScriptDirectionStagePreview = ({ outputJson }: { outputJson?: string | null }) => {
    const script = parseScriptDirectionOutput(outputJson);

    if (!script || script.scenes.length === 0) {
        return (
            <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-[11px] text-zinc-500">
                Scene Direction ciktisi okunamadi veya henuz uretilmedi.
            </div>
        );
    }

    const roles = Array.from(
        new Set(script.scenes.map((scene) => scene.sceneRole).filter((role): role is string => Boolean(role)))
    ).slice(0, 5);

    return (
        <div className="mt-3 rounded-xl border border-cyan-500/15 bg-cyan-500/[0.035] p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-100">
                    <Layers size={14} className="text-cyan-400" />
                    Scene Direction V2
                </div>
                <div className="flex flex-wrap gap-1.5 text-[10px] text-zinc-400">
                    <span className="rounded-full border border-zinc-800 bg-zinc-950/70 px-2 py-0.5">
                        Girdi: Topic + Creative Director
                    </span>
                    <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-cyan-300">
                        Cikti: Sahne niyeti + gorsel plan
                    </span>
                </div>
            </div>

            <div className="mb-3 grid gap-2 md:grid-cols-3">
                <div className="rounded-lg border border-zinc-800/70 bg-zinc-950/35 p-2">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                        Baslik
                    </div>
                    <div className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-300">
                        {script.title || "Script basligi yok"}
                    </div>
                </div>
                <div className="rounded-lg border border-zinc-800/70 bg-zinc-950/35 p-2">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                        Orneklenen sahne
                    </div>
                    <div className="mt-1 text-[11px] font-semibold text-zinc-200">
                        {script.scenes.length} sahne
                    </div>
                </div>
                <div className="rounded-lg border border-zinc-800/70 bg-zinc-950/35 p-2">
                    <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                        Rol cesitliligi
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                        {(roles.length ? roles : ["role yok"]).map((role) => (
                            <span key={role} className="rounded-full border border-zinc-800 bg-zinc-950 px-1.5 py-0.5 text-[9px] text-zinc-400">
                                {role}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid gap-2 lg:grid-cols-2">
                {script.scenes.map((scene) => (
                    <div key={`${scene.sceneNumber}-${scene.scenePurpose}`} className="rounded-lg border border-zinc-800/70 bg-zinc-950/35 p-2.5">
                        <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                                <div className="truncate text-[11px] font-bold text-zinc-100">
                                    #{scene.sceneNumber} {scene.chapterTitle || scene.sceneRole || "Sahne"}
                                </div>
                                <div className="mt-0.5 line-clamp-1 text-[10px] text-zinc-500">
                                    {scene.emotionalBeat || "duygu yok"} / {scene.visualType || "gorsel tipi yok"}
                                </div>
                            </div>
                            {scene.transitionIntent && (
                                <span className="shrink-0 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-1.5 py-0.5 text-[9px] text-cyan-300">
                                    {scene.transitionIntent}
                                </span>
                            )}
                        </div>
                        <div className="line-clamp-2 text-[10px] leading-relaxed text-zinc-400">
                            {scene.scenePurpose || scene.audioText || "-"}
                        </div>
                        {scene.viewerQuestion && (
                            <div className="mt-2 rounded-md border border-zinc-800/70 bg-zinc-900/35 px-2 py-1 text-[10px] leading-relaxed text-zinc-500">
                                Soru: {scene.viewerQuestion}
                            </div>
                        )}
                        <div className="mt-2 flex flex-wrap gap-1">
                            {scene.cameraPlan && (
                                <span className="rounded-full bg-zinc-900 px-1.5 py-0.5 text-[9px] text-zinc-400">
                                    Kamera: {scene.cameraPlan}
                                </span>
                            )}
                            {scene.visualVarietyRole && (
                                <span className="rounded-full bg-cyan-500/10 px-1.5 py-0.5 text-[9px] text-cyan-300">
                                    Variety: {scene.visualVarietyRole.replace(/_/g, " ")}
                                </span>
                            )}
                            {scene.overlayText && (
                                <span className="rounded-full bg-zinc-900 px-1.5 py-0.5 text-[9px] text-zinc-400">
                                    Overlay: {scene.overlayText}
                                </span>
                            )}
                            {scene.sfxCue && (
                                <span className="rounded-full bg-zinc-900 px-1.5 py-0.5 text-[9px] text-zinc-400">
                                    SFX: {scene.sfxCue}
                                </span>
                            )}
                        </div>
                        {scene.visualVarietyReason && (
                            <div className="mt-2 line-clamp-2 text-[9px] leading-relaxed text-cyan-200/60">
                                {scene.visualVarietyReason}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const LAZY_PREVIEW_STAGE_TYPES = new Set(["CreativeDirector", "Script", "Storyboard", "Render", "Thumbnail"]);

const StageLazyOutputPreview = ({ runId, stage }: { runId: number; stage: PipelineStageDto }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [outputJson, setOutputJson] = useState<string | null>(stage.outputJson ?? null);
    const [error, setError] = useState<string | null>(null);

    const canLazyLoad = Boolean(stage.outputJsonOmitted && LAZY_PREVIEW_STAGE_TYPES.has(stage.stageType));
    const visibleOutput = outputJson || stage.outputJson || null;

    const loadOutput = async () => {
        if (visibleOutput || loading || !canLazyLoad) return;

        setLoading(true);
        setError(null);
        try {
            const response = await pipelineRunsApi.stageOutput(runId, stage.stageType);
            setOutputJson(response.outputJson || null);
        } catch (err: any) {
            setError(err?.message || "Stage çıktısı yüklenemedi.");
        } finally {
            setLoading(false);
        }
    };

    if (!visibleOutput && !canLazyLoad) return null;

    return (
        <div className="mt-3 rounded-xl border border-zinc-800/70 bg-zinc-950/25 p-2.5">
            <button
                type="button"
                onClick={() => {
                    const nextOpen = !isOpen;
                    setIsOpen(nextOpen);
                    if (nextOpen) void loadOutput();
                }}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-left text-[11px] font-semibold text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800"
            >
                <span>{stage.stageType} detayını {isOpen ? "gizle" : "yükle"}</span>
                {loading ? <Loader2 size={13} className="animate-spin text-indigo-300" /> : <Eye size={13} className="text-zinc-500" />}
            </button>

            {isOpen && (
                <div className="mt-2">
                    {error && (
                        <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-200">
                            {error}
                        </div>
                    )}
                    {stage.stageType === "CreativeDirector" && visibleOutput && (
                        <CreativeDirectorStagePreview outputJson={visibleOutput} />
                    )}
                    {stage.stageType === "Script" && visibleOutput && (
                        <ScriptDirectionStagePreview outputJson={visibleOutput} />
                    )}
                    {visibleOutput && <StageValidationReport outputJson={visibleOutput} />}
                </div>
            )}
        </div>
    );
};

const RunDetail = memo(({ detail, loading, onOpenTimeline, onRetryStage, onReRenderClick, onApprove, onStartUpload, onCancel, onOpenContentCenter, onAssetChanged }: { detail: PipelineRunDetailDto | null, loading: boolean, onOpenTimeline: (json?: string | null) => void | Promise<void>, onRetryStage: (runId: number, stageName: string) => Promise<void>, onReRenderClick: (runId: number) => void, onApprove: (runId: number) => void, onStartUpload: (runId: number) => void, onCancel: (runId: number) => void, onOpenContentCenter: (runId: number) => void, onAssetChanged?: () => void | Promise<void> }) => {
    const [activeTab, setActiveTab] = useState<"review" | "timeline" | "logs" | "video">("review");
    const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);

    // Detail değiştiğinde (yeni run seçildiğinde) tab'i timeline'a resetle
    useEffect(() => {
        if(detail?.id) setActiveTab("review");
    }, [detail?.id]);
    
    if (loading && !detail) {
        return (
            <Card className="h-full flex items-center justify-center border-zinc-800 bg-zinc-900/60 backdrop-blur-xl">
                 <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </Card>
        );
    }

    if (!detail) {
         return (
             <Card className="h-full flex flex-col items-center justify-center text-zinc-600 gap-4 p-8 text-center border-zinc-800 bg-zinc-900/60 backdrop-blur-xl">
                 <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl">
                     <Layers size={40} className="opacity-30 text-indigo-300" />
                 </div>
                 <div>
                    <p className="text-lg font-medium text-zinc-400">Bir işlem seçin</p>
                    <p className="text-sm text-zinc-600 mt-1 max-w-[200px]">Detayları görüntülemek için sol taraftan bir kayıt seçiniz.</p>
                 </div>
             </Card>
         );
    }

    const canCancel = ["Pending", "Running", "WaitingForApproval"].includes(detail.status);
    const waitingStage = detail.stages.find((stage) => stage.status === "WaitingForApproval");
    const uploadStage = findRunStage(detail, "Upload");
    const editPlanStage = findRunStage(detail, "EditPlan");
    const thumbnailStage = findRunStage(detail, "Thumbnail");
    const uploadCanContinue = canContinueUpload(detail);
    const uploadCanRetry = Boolean(uploadStage && canRegenerateStage(uploadStage));
    const uploadCanStart = uploadCanContinue && !uploadCanRetry;
    const approveLabel = uploadCanStart
        ? "YouTube'a Yukle"
        : waitingStage?.stageType === "Render"
            ? "Render'a Basla"
            : "Onayla";
    const thumbnailUrl = resolveMediaUrl(detail.thumbnailUrl);
    const youtubePackage = parseYouTubePackageOutput(detail.stages.find((stage) => stage.stageType === "Thumbnail")?.outputJson);
    const renderStage = detail.stages.find((stage) => stage.stageType === "Render" || stage.stageType === "Video");
    const isRenderProgressActive = Boolean(
        renderStage &&
        ["Running", "Retrying"].includes(renderStage.status)
    );
    const isUploadProgressActive = Boolean(
        uploadStage &&
        ["Running", "Retrying"].includes(uploadStage.status)
    );
    const showUploadProgressPanel = shouldShowUploadProgressPanel(uploadStage);
    const sceneLayoutStage = detail.stages.find((stage) => stage.stageType === "SceneLayout");
    const reviewRefreshKey = `${detail.status}:${detail.stages.map((stage) => `${stage.stageType}-${stage.status}-${stage.durationMs}`).join("|")}`;
    const audioQa = parseRenderAudioQaOutput(renderStage?.outputJson);

    return (
        <Card className="h-full flex flex-col overflow-hidden overflow-x-hidden border-zinc-800 bg-zinc-900/60 backdrop-blur-xl p-0 transition-all duration-300">
            {/* Header */}
            <div className="p-5 border-b border-zinc-800/50 shrink-0 bg-zinc-900/40 flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3 mb-1.5">
                        <span className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            Run <span className="text-zinc-600">#</span>{detail.id}
                        </span>
                        <RunStatusBadge status={detail.status} rounded="full" />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                         <span className="flex items-center gap-1.5 bg-zinc-900/50 px-2 py-1 rounded border border-zinc-800/50">
                             <Calendar size={12} className="text-zinc-400"/>
                             {detail.startedAt ? new Date(detail.startedAt).toLocaleString() : "Başlamadı"}
                         </span>
                         


                        {detail.status === "WaitingForApproval" && (
                             <Button
                                 variant="primary"
                                 size="sm"
                                 onClick={() => onApprove(detail.id)}
                                 className="h-7 px-3 text-[10px] gap-1.5 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                             >
                                 <CheckCircle2 size={12} /> {approveLabel}
                             </Button>
                         )}

                        {canCancel && (
                             <Button
                                 variant="danger"
                                 size="sm"
                                 onClick={() => onCancel(detail.id)}
                                 className="h-7 px-3 text-[10px] gap-1.5"
                             >
                                 <XCircle size={12} /> Durdur
                             </Button>
                         )}
                    </div>
                </div>

                {/* Error Box */}
                {detail.errorMessage && (
                    <div className="group relative max-w-[280px] cursor-pointer animate-in fade-in slide-in-from-right-4">
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-red-400 transition-all hover:bg-red-500/10 hover:border-red-500/30">
                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                            <div className="flex flex-col gap-1 overflow-hidden">
                                <span className="text-xs font-bold uppercase tracking-wider text-red-500">
                                    Hata Oluştu
                                </span>
                                <p className="text-[10px] leading-relaxed line-clamp-2 opacity-80 group-hover:opacity-100">
                                    {detail.errorMessage}
                                </p>
                            </div>
                        </div>

                        <div className="absolute top-full right-0 mt-2 w-96 p-4 bg-zinc-950 border border-red-900/50 rounded-xl shadow-2xl z-50 hidden group-hover:block animate-in fade-in slide-in-from-top-2">
                             <div className="flex justify-between items-center mb-2 border-b border-red-900/30 pb-2">
                                 <span className="text-xs font-bold text-red-400">Hata Detayı</span>
                                 <button
                                     onClick={(e) => {
                                         e.stopPropagation();
                                         navigator.clipboard.writeText(detail.errorMessage || "");
                                         toast.success("Kopyalandı");
                                     }}
                                     className="text-[10px] text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
                                 >
                                     <Copy size={10} /> Kopyala
                                 </button>
                             </div>
                             <div className="max-h-60 overflow-auto font-mono text-[10px] text-red-300 whitespace-pre-wrap scrollbar-thin scrollbar-thumb-zinc-800">
                                 {detail.errorMessage}
                             </div>
                        </div>
                    </div>
                )}
            </div>

            <RunRenderProgressPanel
                runId={detail.id}
                active={isRenderProgressActive || isUploadProgressActive || Boolean(uploadStage && ["Pending", "Running", "Retrying"].includes(uploadStage.status))}
                stageHint={showUploadProgressPanel ? "Upload" : isRenderProgressActive ? "Render" : undefined}
                labelHint={showUploadProgressPanel ? getUploadProgressLabel(uploadStage) : undefined}
                statusHint={showUploadProgressPanel ? uploadStage?.status : renderStage?.status}
                errorHint={showUploadProgressPanel ? uploadStage?.error : undefined}
            />

            <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800/50 bg-zinc-950/25 px-4 py-2">
                <span className="mr-1 text-[10px] font-bold uppercase tracking-wide text-zinc-600">Hizli aksiyon</span>
                <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onOpenContentCenter(detail.id)}
                    className="h-7 px-2.5 text-[10px]"
                    title="Bu run icin tum icerik, karar, review, timeline ve outputlari tek ekranda acar."
                >
                    <Eye size={12} className="mr-1.5" /> Icerik Merkezi
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    disabled={!canRegenerateStage(editPlanStage)}
                    onClick={() => { if (editPlanStage) void onRetryStage(detail.id, "EditPlan").catch(() => undefined); }}
                    className="h-7 px-2.5 text-[10px]"
                    title="Edit kararlarini ve anchor phrase planini yeniden uretir; sonrasindaki timeline/render adimlari tekrar kosar."
                >
                    <RefreshCcw size={12} className="mr-1.5" /> EditPlan Yenile
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    disabled={!canRegenerateStage(sceneLayoutStage)}
                    onClick={() => { if (sceneLayoutStage) void onRetryStage(detail.id, "SceneLayout").catch(() => undefined); }}
                    className="h-7 px-2.5 text-[10px]"
                    title="STT kelime zamanina gore timeline'i ve gorsel gecislerini yeniden hesaplar."
                >
                    <Layers size={12} className="mr-1.5" /> Timeline Yenile
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    disabled={!canRegenerateStage(thumbnailStage)}
                    onClick={() => { if (thumbnailStage) void onRetryStage(detail.id, "Thumbnail").catch(() => undefined); }}
                    className="h-7 px-2.5 text-[10px]"
                    title="Kapak gorseli ve YouTube paketini yeniden uretir."
                >
                    <ImageIcon size={12} className="mr-1.5" /> Paket Yenile
                </Button>
                <Button
                    variant={uploadCanStart ? "primary" : "secondary"}
                    size="sm"
                    disabled={!uploadCanStart}
                    onClick={() => onStartUpload(detail.id)}
                    className={cn(
                        "h-7 px-2.5 text-[10px]",
                        uploadCanStart && "bg-red-600 hover:bg-red-500 text-white shadow-red-500/20"
                    )}
                    title={uploadStage ? "Render sonrasi Upload adimini baslatir." : "Template'e sonradan eklenen Upload adimini bu run icin olusturup baslatir."}
                >
                    <Upload size={12} className="mr-1.5" /> YouTube'a Yukle
                </Button>
                {uploadStage && (
                    <Button
                        variant={uploadCanRetry ? "primary" : "secondary"}
                        size="sm"
                        disabled={!uploadCanRetry}
                        onClick={() => { void onRetryStage(detail.id, "Upload").catch(() => undefined); }}
                        className={cn(
                            "h-7 px-2.5 text-[10px]",
                            uploadCanRetry && "bg-red-600 hover:bg-red-500 text-white shadow-red-500/20"
                        )}
                        title="Mevcut Upload stage'ini yeniden kuyruğa alır. Eski run'larda upload tamamlandı görünüp video gitmediyse bunu kullan."
                    >
                        <RefreshCcw size={12} className="mr-1.5" /> Upload Tekrar Dene
                    </Button>
                )}
                {!uploadStage && (
                    <span className="text-[10px] text-amber-300/80">
                        Upload execution henuz olusmamis; buton template'ten olusturup baslatir.
                    </span>
                )}
            </div>

            {/* TAB HEADER */}
            {detail && (
                <div className="flex items-center gap-1 bg-zinc-900/40 border-b border-zinc-800/50 px-4 pt-2">
                    <button
                        onClick={() => setActiveTab("review")}
                        className={cn(
                            "px-4 py-2 text-xs font-medium border-b-2 transition-all flex items-center gap-2",
                            activeTab === "review"
                                ? "border-fuchsia-500 text-fuchsia-300 bg-fuchsia-500/5"
                                : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30"
                        )}
                    >
                        <Sparkles size={14} />
                        Review
                    </button>
                    <button
                        onClick={() => setActiveTab("timeline")}
                        className={cn(
                            "px-4 py-2 text-xs font-medium border-b-2 transition-all flex items-center gap-2",
                            activeTab === "timeline"
                                ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                                : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30"
                        )}
                    >
                        <Layers size={14} />
                        Zaman Çizelgesi
                    </button>
                    <button
                        onClick={() => setActiveTab("logs")}
                        className={cn(
                            "px-4 py-2 text-xs font-medium border-b-2 transition-all flex items-center gap-2",
                            activeTab === "logs"
                                ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
                                : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30"
                        )}
                    >
                        <Terminal size={14} />
                        Canlı Konsol
                    </button>
                    <button
                        onClick={() => setActiveTab("video")}
                        className={cn(
                            "px-4 py-2 text-xs font-medium border-b-2 transition-all flex items-center gap-2",
                            activeTab === "video"
                                ? "border-rose-500 text-rose-400 bg-rose-500/5"
                                : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30"
                        )}
                    >
                        <Play size={14} />
                        Video Önizleme
                    </button>
                </div>
            )}

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-0 relative scrollbar-thin scrollbar-thumb-zinc-700 bg-zinc-900/20">
                {activeTab === "review" && (
                    <ProductionReviewCenter
                        runId={detail.id}
                        refreshKey={reviewRefreshKey}
                        canOpenTimeline={sceneLayoutStage?.status === "Completed" && Boolean(sceneLayoutStage.outputJson || sceneLayoutStage.outputJsonOmitted)}
                        onOpenTimeline={() => {
                            if (sceneLayoutStage?.status === "Completed") onOpenTimeline(sceneLayoutStage.outputJson);
                        }}
                        onRetryStage={(stageType) => onRetryStage(detail.id, stageType)}
                        onApproveStage={() => onApprove(detail.id)}
                        onOpenVideo={() => setActiveTab("video")}
                        onAssetChanged={onAssetChanged}
                    />
                )}
                
                {/* TIMELINE TAB */}
                {activeTab === "timeline" && (
                    <div className="p-6 relative">
                         {/* Dikey Çizgi */}
                        <div className="absolute left-[39px] top-6 bottom-6 w-px bg-zinc-800/60 z-0 dashed-line" />

                        {detail.stages.map((stage, idx) => {
                            const isRunning = stage.status === "Running";
                            const isCompleted = stage.status === "Completed";
                            const isFailed = stage.status.includes("Failed");
                            const isSkipped = stage.status === "Skipped";
                            const isOutdated = stage.status === "Outdated";
                            const isCancelled = stage.status === "Cancelled";
                            const isWaitingApproval = stage.status === "WaitingForApproval";

                            return (
                                <div
                                    key={idx}
                                    className={cn(
                                        "relative z-10 flex items-center gap-4 mb-4 last:mb-0 group transition-all duration-500", // mb-8 -> mb-4, gap-5 -> gap-4
                                        isRunning ? "opacity-100 translate-x-1" : "opacity-90"
                                    )}
                                >
                                    {/* İkon Kutusu */}
                                    <div className="relative">
                                        {isRunning && (
                                            <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-md animate-pulse"></div>
                                        )}
                                        <div
                                            className={cn(
                                                "w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300 relative bg-zinc-950 z-10", // w-10 h-10 -> w-8 h-8
                                                isRunning
                                                    ? "border-amber-500 text-amber-500 shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)] scale-110"
                                                    : isCompleted
                                                    ? "border-emerald-500/50 text-emerald-500 bg-emerald-500/5"
                                                    : isFailed
                                                    ? "border-red-500/50 text-red-500 bg-red-500/5"
                                                    : isOutdated
                                                    ? "border-orange-500/50 text-orange-500 bg-orange-500/5"
                                                     : isCancelled
                                                     ? "border-zinc-600 text-zinc-500 bg-zinc-800/40"
                                                     : isWaitingApproval
                                                     ? "border-blue-500/50 text-blue-400 bg-blue-500/5"
                                                     : "border-zinc-800 text-zinc-600"
                                            )}
                                        >
                                            {getStageIcon(stage.status)}
                                        </div>
                                    </div>

                                    {/* Detaylar */}
                                    <div className={cn(
                                        "flex-1 p-3 rounded-lg border transition-all duration-300",
                                        isRunning 
                                            ? "bg-zinc-900/80 border-amber-500/20 shadow-lg shadow-black/20" 
                                            : "bg-transparent border-transparent hover:bg-zinc-900/40 hover:border-zinc-800/50"
                                    )}>
                                        <div className="flex items-center justify-between gap-4">
                                        {/* İSİM ve BADGE YAN YANA */}
                                        <div className="flex items-center gap-3">
                                            <span
                                                className={`text-sm font-semibold tracking-wide ${
                                                    isRunning ? "text-amber-100" : isCompleted ? "text-zinc-200" : "text-zinc-400"
                                                }`}
                                            >
                                                {getStageLabel(stage.stageType)}
                                            </span>
                                            
                                            {/* DURUM BADGE'LERI */}
                                            <div className="text-xs">
                                                {isFailed ? (
                                                    <div className="flex flex-col max-w-[300px] lg:max-w-[500px] rounded-lg border border-red-500/20 bg-red-500/5 overflow-hidden group/error shadow-sm">
                                                        {/* Header */}
                                                        <div className="flex items-center justify-between px-3 py-1.5 border-b border-red-500/10 bg-red-500/10">
                                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 uppercase tracking-wider">
                                                                <AlertTriangle size={10} />
                                                                <span>Hata Detayı</span>
                                                            </div>
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigator.clipboard.writeText(stage.error || "");
                                                                    toast.success("Hata kopyalandı");
                                                                }}
                                                                className="p-1 rounded hover:bg-red-500/20 text-red-400 hover:text-red-200 transition-colors"
                                                                title="Hatayı Kopyala"
                                                            >
                                                                <Copy size={12} />
                                                            </button>
                                                        </div>
                                                        {/* Content */}
                                                        <div className="p-2.5 max-h-[150px] overflow-y-auto scrollbar-thin scrollbar-thumb-red-500/20 text-left">
                                                            <span className="text-[10px] font-mono text-red-300/90 break-all whitespace-pre-wrap leading-relaxed block">
                                                                {stage.error || "Hata detayı bulunamadı."}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : isRunning ? (
                                                     <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                        <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse"/>
                                                        İşleniyor
                                                    </span>
                                                ) : isCompleted ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                        Tamamlandı
                                                    </span>
                                                ) : isSkipped ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-500/10 text-zinc-500 border border-zinc-500/20">
                                                        Atlandı
                                                    </span>
                                                ) : isOutdated ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-orange-500/10 text-orange-500 border border-orange-500/20">
                                                        Güncel Değil
                                                    </span>
                                                 ) : isCancelled ? (
                                                     <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-700/40 text-zinc-400 border border-zinc-600/50">
                                                         Durduruldu
                                                     </span>
                                                 ) : isWaitingApproval ? (
                                                     <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                         <span className="w-1 h-1 rounded-full bg-blue-400" />
                                                         Kontrol bekliyor
                                                     </span>
                                                 ) : (
                                                     <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800/50 text-zinc-500 border border-zinc-700/50">
                                                         Bekliyor
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* SAĞ TARAF AKSİYONLAR */}
                                        <div className="flex items-center gap-2">
                                            {stage.stageType === "SceneLayout" && stage.status === "Completed" && (
                                                <button 
                                                    onClick={() => onOpenTimeline(stage.outputJson)}
                                                    className="h-8 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 text-xs font-medium"
                                                >
                                                    <Eye size={14} /> Önizle
                                                </button>
                                            )}
                                            {/* RENDER / VIDEO ACTIONS */}
                                            {stage.stageType === "EditPlan" && canRegenerateStage(stage) && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        void onRetryStage(detail.id, "EditPlan").catch(() => undefined);
                                                    }}
                                                    className="h-8 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-all flex items-center gap-2 text-xs font-medium"
                                                    title="Edit karar planini yeniden uret"
                                                >
                                                    <RefreshCcw size={14} /> Yeniden Uret
                                                </button>
                                            )}

                                            {stage.stageType === "SceneLayout" && canRegenerateStage(stage) && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        void onRetryStage(detail.id, "SceneLayout").catch(() => undefined);
                                                    }}
                                                    className="h-8 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-all flex items-center gap-2 text-xs font-medium"
                                                    title="Timeline'i STT kelime zamanina gore yeniden hesapla"
                                                >
                                                    <RefreshCcw size={14} /> Timeline Yenile
                                                </button>
                                            )}

                                            {stage.stageType === "Thumbnail" && canRegenerateStage(stage) && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        void onRetryStage(detail.id, "Thumbnail").catch(() => undefined);
                                                    }}
                                                    className="h-8 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-all flex items-center gap-2 text-xs font-medium"
                                                    title="Kapak ve YouTube paketini yeniden uret"
                                                >
                                                    <RefreshCcw size={14} /> Paket Yenile
                                                </button>
                                            )}

                                            {stage.stageType === "Upload" && uploadCanStart && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onStartUpload(detail.id);
                                                    }}
                                                    className="h-8 px-4 rounded-lg bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20 transition-all flex items-center gap-2 text-xs font-medium"
                                                    title="Render sonrasi bekleyen YouTube upload adimini baslat"
                                                >
                                                    <Upload size={14} /> YouTube'a Yukle
                                                </button>
                                            )}

                                            {stage.stageType === "Upload" && canRegenerateStage(stage) && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        void onRetryStage(detail.id, "Upload").catch(() => undefined);
                                                    }}
                                                    className="h-8 px-4 rounded-lg bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20 transition-all flex items-center gap-2 text-xs font-medium"
                                                    title="Upload adimini yeniden dene"
                                                >
                                                    <RefreshCcw size={14} /> Upload Tekrar Dene
                                                </button>
                                            )}

                                            {/* RENDER / VIDEO ACTIONS */}
                                            {(stage.stageType === "Render" || stage.stageType === "Video") && (
                                                <>
                                                    {/* RE-RENDER BUTTON (Outdated or Completed) */}
                                                    {(stage.status === "Outdated" || stage.status === "Completed") && (
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onReRenderClick(detail.id);
                                                            }}
                                                            className={cn(
                                                                "h-8 px-4 rounded-lg flex items-center gap-2 text-xs font-medium transition-all shadow-lg",
                                                                stage.status === "Outdated" 
                                                                    ? "bg-orange-600 hover:bg-orange-500 text-white shadow-orange-500/20 animate-pulse" 
                                                                    : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
                                                            )}
                                                            title="Yeniden Render Al"
                                                        >
                                                            <RefreshCw size={14} /> 
                                                            {stage.status === "Outdated" ? "Güncelle (Render)" : "Yeniden"}
                                                        </button>
                                                    )}

                                                    {/* WATCH BUTTON */}
                                                    {stage.status === "Completed" && (
                                                        <button 
                                                            onClick={() => setActiveTab("video")}
                                                            className="h-8 px-4 rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/20 transition-all flex items-center gap-2 text-xs font-medium"
                                                        >
                                                            <Play size={14} fill="currentColor" /> İzle
                                                        </button>
                                                    )}
                                                    {stage.status === "WaitingForApproval" && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onApprove(detail.id);
                                                            }}
                                                            className="h-8 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 text-xs font-medium"
                                                            title="Kontrol sonrasi render asamasini baslat"
                                                        >
                                                            <Play size={14} fill="currentColor" /> Render'a Basla
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                            
                                            {stage.durationMs > 0 && (
                                                <span className="text-[10px] font-mono text-zinc-500 bg-zinc-950 px-2 py-1 rounded border border-zinc-800/50">
                                                    {(stage.durationMs / 1000).toFixed(1)}s
                                                </span>
                                            )}

                                            {/* RETRY */}
                                            {["Failed", "PermanentlyFailed"].includes(stage.status) && (
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        void onRetryStage(detail.id, stage.stageType).catch(() => undefined);
                                                    }}
                                                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors border border-zinc-700"
                                                    title="Tekrar Dene"
                                                >
                                                    <RefreshCcw size={14} />
                                                </button>
                                            )}
                                        </div>
                                        </div>
                                        <StageLazyOutputPreview runId={detail.id} stage={stage} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* LOGS TAB */}
                {activeTab === "logs" && (
                     <div className="p-4 h-full flex flex-col">
                        <LiveLogViewer runId={detail.id} />
                     </div>
                )}

                {/* VIDEO TAB */}
                {activeTab === "video" && (
                     <div className="p-8 h-full flex flex-col items-center justify-center bg-zinc-950/30">
                        {thumbnailUrl && (
                            <div className="mb-6 w-full max-w-xl rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 shadow-xl shadow-black/20">
                                <div className="mb-2 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                                        <ImageIcon size={14} className="text-indigo-400" />
                                        Kapak Gorseli
                                    </div>
                                    {detail.thumbnailWidth && detail.thumbnailHeight && (
                                        <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5 font-mono text-[10px] text-zinc-500">
                                            {detail.thumbnailWidth}x{detail.thumbnailHeight}
                                        </span>
                                    )}
                                </div>
                                <img
                                    src={thumbnailUrl}
                                    alt="Kapak gorseli"
                                    className="aspect-video w-full rounded-lg border border-zinc-800 bg-black object-contain"
                                />
                            </div>
                        )}
                        {youtubePackage && (
                            <div className="mb-6 grid w-full max-w-5xl grid-cols-1 gap-3 lg:grid-cols-3">
                                <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                                    <div className="mb-2 text-xs font-bold text-zinc-200">YouTube Title Options</div>
                                    <div className="space-y-1.5">
                                        {youtubePackage.titleOptions.slice(0, 5).map((title, index) => (
                                            <div key={`${title}-${index}`} className="rounded-lg border border-zinc-800 bg-zinc-950/45 px-2 py-1.5 text-xs text-zinc-300">
                                                {title}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                                    <div className="mb-2 text-xs font-bold text-zinc-200">Chapters</div>
                                    <div className="max-h-40 space-y-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
                                        {youtubePackage.chapters.slice(0, 10).map((chapter, index) => (
                                            <div key={`${chapter.timestamp}-${index}`} className="flex gap-2 rounded-lg border border-zinc-800 bg-zinc-950/45 px-2 py-1.5 text-xs">
                                                <span className="font-mono text-indigo-300">{chapter.timestamp || "00:00"}</span>
                                                <span className="truncate text-zinc-300">{chapter.title || "Chapter"}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                                    <div className="mb-2 text-xs font-bold text-zinc-200">Upload Checklist</div>
                                    <div className="space-y-1">
                                        {youtubePackage.uploadChecklist.slice(0, 5).map((item, index) => (
                                            <div key={`${item}-${index}`} className="flex gap-2 text-[11px] text-zinc-400">
                                                <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-400" />
                                                <span>{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {(youtubePackage.hashtags.length > 0 || youtubePackage.tags.length > 0) && (
                                        <div className="mt-3 flex flex-wrap gap-1">
                                            {[...youtubePackage.hashtags, ...youtubePackage.tags.slice(0, 6)].slice(0, 10).map((tag, index) => (
                                                <span key={`${tag}-${index}`} className="rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[10px] text-zinc-500">
                                                    {tag.startsWith("#") ? tag : `#${tag}`}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {audioQa && (
                            <div className="mb-6 w-full max-w-5xl rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                                <div className="mb-2 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                                        <Activity size={14} className={audioQa.status === "Ready" ? "text-emerald-400" : "text-amber-400"} />
                                        Audio QA
                                    </div>
                                    <span className={cn("rounded-full border px-2 py-0.5 text-[10px]", audioQa.status === "Ready" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-amber-500/30 bg-amber-500/10 text-amber-300")}>
                                        {audioQa.status || "Unknown"}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
                                    <div className="rounded-lg border border-zinc-800 bg-zinc-950/45 p-2">
                                        <div className="text-zinc-500">Mean</div>
                                        <div className="font-mono text-zinc-200">{Number(audioQa.meanVolumeDb ?? 0).toFixed(1)} dB</div>
                                    </div>
                                    <div className="rounded-lg border border-zinc-800 bg-zinc-950/45 p-2">
                                        <div className="text-zinc-500">Peak</div>
                                        <div className="font-mono text-zinc-200">{Number(audioQa.maxVolumeDb ?? 0).toFixed(1)} dB</div>
                                    </div>
                                    <div className="rounded-lg border border-zinc-800 bg-zinc-950/45 p-2">
                                        <div className="text-zinc-500">Silence</div>
                                        <div className="font-mono text-zinc-200">{Number(audioQa.silenceDurationSec ?? 0).toFixed(1)}s</div>
                                    </div>
                                    <div className="rounded-lg border border-zinc-800 bg-zinc-950/45 p-2">
                                        <div className="text-zinc-500">Ratio</div>
                                        <div className="font-mono text-zinc-200">{((audioQa.silenceRatio ?? 0) * 100).toFixed(1)}%</div>
                                    </div>
                                </div>
                                {audioQa.warnings.length > 0 && (
                                    <div className="mt-2 text-xs text-amber-300">
                                        {audioQa.warnings.join(" ")}
                                    </div>
                                )}
                            </div>
                        )}
                        {(() => {
                            // 1. Backend'den gelen doğrudan URL (Öncelikli)
                            let videoPath = detail.finalVideoUrl;

                            // 2. Eğer yoksa eski yöntemle JSON'dan bulmaya çalış (Fallback)
                            if (!videoPath) {
                                const videoStage = detail.stages.find(s => 
                                    (s.stageType === "Video" || s.stageType === "Render") && 
                                    s.status === "Completed" && 
                                    s.outputJson
                                );
                                if (videoStage?.outputJson) {
                                    try {
                                        const out = JSON.parse(videoStage.outputJson);
                                        videoPath = out.path || out.url || out.videoPath || null;
                                    } catch {}
                                }
                            }

                            if (!videoPath) {
                                return (
                                    <div className="text-center text-zinc-500">
                                        <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-800">
                                            <Play size={24} className="opacity-20 ltr:ml-1" />
                                        </div>
                                        <p>Henüz hazır bir video yok.</p>
                                        <p className="text-xs opacity-50 mt-2">Pipeline tamamlandığında video burada görünecektir.</p>
                                    </div>
                                );
                            }

                            return (
                                <div className="flex flex-col items-center gap-4 w-full">
                                     {/* Video Player - Interactive in Tab */}
                                    <div 
                                        className="rounded-xl overflow-hidden shadow-xl border border-zinc-800 bg-black max-w-full"
                                        style={{
                                            width: detail.finalVideoWidth && detail.finalVideoHeight && detail.finalVideoWidth >= detail.finalVideoHeight
                                                ? "min(100%, 72vh)"
                                                : "min(100%, 32vh)"
                                        }}
                                    >
                                         <VideoPlayer 
                                            videoUrl={videoPath} 
                                            videoWidth={detail.finalVideoWidth}
                                            videoHeight={detail.finalVideoHeight}
                                            aspectRatio={detail.finalVideoAspectRatio}
                                            onExpand={() => setVideoModalUrl(videoPath)}
                                         /> 
                                    </div>
                                </div>
                            );
                        })()}
                     </div>
                )}
            </div>



            {/* Footer Status Bar */}
            {detail.status === "Running" && (
                <div className="p-3 border-t border-zinc-800/50 bg-amber-500/5 backdrop-blur flex justify-center shrink-0">
                    <div className="flex items-center gap-2 text-xs font-medium text-amber-500/80 animate-pulse">
                        <Activity size={14} className="animate-bounce" /> Canlı İzleniyor - Sistem çalışıyor...
                    </div>
                </div>
            )}
            {/* VIDEO PREVIEW MODAL */}
            <Modal
                isOpen={!!videoModalUrl}
                onClose={() => setVideoModalUrl(null)}
                title="Video Önizleme"
                className="w-fit max-w-none" // Modal genişliğini içeriğe göre ayarla
            >
                <div className="flex justify-center items-center bg-black/20 rounded-lg p-2">
                    {/* Dikey (9:16) video için genişliği ekran yüksekliğine göre ayarla: 
                        Height = Width * 1.777
                        Width = Height / 1.777
                        Max Height ~80vh olsun => Width ~40vh (Scroll'u önlemek için biraz küçülttüm)
                    */}
                    <div
                        style={{
                            width: detail?.finalVideoWidth && detail?.finalVideoHeight && detail.finalVideoWidth >= detail.finalVideoHeight
                                ? "80vw"
                                : "40vh"
                        }}
                        className="max-w-full"
                    >
                        {videoModalUrl && (
                            <VideoPlayer
                                videoUrl={videoModalUrl}
                                videoWidth={detail?.finalVideoWidth}
                                videoHeight={detail?.finalVideoHeight}
                                aspectRatio={detail?.finalVideoAspectRatio}
                                className="shadow-none border-none"
                            />
                        )}
                    </div>
                </div>
            </Modal>
        </Card>
    );
});


export default function PipelineRunsPage() {
  const navigate = useNavigate();
  // --- STATE ---
  const [items, setItems] = useState<PipelineRunListDto[]>([]);
  const [templates, setTemplates] = useState<{ label: string; value: string }[]>([]);
  const [concepts, setConcepts] = useState<{ label: string; value: string }[]>([]);
  const [productionBriefs, setProductionBriefs] = useState<SavedProductionBriefDto[]>([]);
  
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<PipelineRunDetailDto | null>(null);
  
  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Timeline Modal State
  const [timelineData, setTimelineData] = useState<SceneLayoutPayload | null>(null);
  const [timelinePageInfo, setTimelinePageInfo] = useState<PipelineTimelinePageDto | null>(null);
  const [timelineOpening, setTimelineOpening] = useState(false);
  const [timelineSceneNumber, setTimelineSceneNumber] = useState(1);
  const timelineRequestKeyRef = useRef<string | null>(null);
  const timelineRequestSeqRef = useRef(0);

  // Filtreler
  const [selectedConceptId, setSelectedConceptId] = useState<string>("");

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedSavedBriefId, setSelectedSavedBriefId] = useState<string>("");
  const [pauseBeforeRender, setPauseBeforeRender] = useState(true);
  const [productionBrief, setProductionBrief] = useState<ProductionBrief>(EMPTY_PRODUCTION_BRIEF);
  const [creating, setCreating] = useState(false);

  // Re-Render States
  const [isReRenderModalOpen, setIsReRenderModalOpen] = useState(false);
  const [reRenderRunId, setReRenderRunId] = useState<number | null>(null);
  const [renderPresets, setRenderPresets] = useState<RenderPresetListDto[]>([]);
  const [selectedRenderPresetId, setSelectedRenderPresetId] = useState<string>("");

  // Confirm Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    onConfirm: () => void;
    confirmText?: string;
    variant?: "primary" | "danger";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    confirmText: "Onayla",
    variant: "primary",
  });



  // Polling Ref
  const pollRef = useRef<number | null>(null);

  // --- ACTIONS ---
  
  const fetchStageOutputJson = useCallback(async (stageType: string, inlineJson?: string | null) => {
      if (inlineJson) return inlineJson;
      const runId = detail?.id ?? selectedId;
      if (!runId) return "";

      const response = await pipelineRunsApi.stageOutput(runId, stageType);
      return response.outputJson || "";
  }, [detail?.id, selectedId]);

  const loadTimelineScene = useCallback(async (sceneNumber = timelineSceneNumber) => {
      const runId = detail?.id ?? selectedId;
      if (!runId) return;
      const targetScene = Math.max(1, sceneNumber || 1);
      const requestKey = `${runId}:${targetScene}`;
      if (timelineRequestKeyRef.current === requestKey) return;
      timelineRequestKeyRef.current = requestKey;
      const requestSeq = ++timelineRequestSeqRef.current;

      const loadingToast = toast.loading("Timeline verisi yukleniyor...");
      setTimelineOpening(true);

      try {
          const response = await pipelineRunsApi.timelineScene(runId, targetScene);
          if (requestSeq !== timelineRequestSeqRef.current) return;
          setTimelineData(response.data);
          setTimelinePageInfo(response);
          setTimelineSceneNumber(response.sceneNumber || targetScene);
      } catch (err: any) {
          if (requestSeq !== timelineRequestSeqRef.current) return;
          toast.error(err?.message || "Timeline verisi okunamadi.");
      } finally {
          toast.dismiss(loadingToast);
          if (timelineRequestKeyRef.current === requestKey) timelineRequestKeyRef.current = null;
          if (requestSeq === timelineRequestSeqRef.current) setTimelineOpening(false);
      }
  }, [detail?.id, selectedId, timelineSceneNumber]);

  // Helper: Stage JSON Parse
  const openTimeline = useCallback(async (jsonString?: string | null) => {
      const runId = detail?.id ?? selectedId;
      if (runId) {
        await loadTimelineScene(1);
        return;
      }

      if (timelineOpening) return;

      const loadingToast = toast.loading("Timeline verisi yükleniyor...");
      setTimelineOpening(true);

      try {
          const sceneLayoutJson = await fetchStageOutputJson("SceneLayout", jsonString);

          if (!sceneLayoutJson) {
              toast.error("Timeline verisi bulunamadı.");
              return;
          }

          const data = JSON.parse(sceneLayoutJson);
          setTimelineData(data);
          setTimelinePageInfo(null);
      } catch {
          toast.error("Timeline verisi okunamadı.");
      } finally {
          toast.dismiss(loadingToast);
          setTimelineOpening(false);
      }
  }, [detail?.id, fetchStageOutputJson, loadTimelineScene, selectedId, timelineOpening]);



  const loadList = useCallback(async (isAutoRefresh = false) => {
    if(!isAutoRefresh) setListLoading(true);
    try {
      const data = await pipelineRunsApi.list(selectedConceptId);
      // Sadece veri değiştiyse update et diyebiliriz ama React zaten diff yapıyor.
      // Yine de simple bir check fena olmazdı ama ID listesi değişebilir.
      setItems(data);
    } catch {
      if(!isAutoRefresh) toast.error("Geçmiş yüklenemedi");
    } finally {
      if(!isAutoRefresh) setListLoading(false);
    }
  }, [selectedConceptId]);

  const loadTemplates = useCallback(async () => {
    if (templates.length > 0) return;
    try {
      const data = await pipelineTemplatesApi.list();
      setTemplates(data.map((t) => ({ label: t.name, value: t.id.toString() })));
    } catch {}
  }, [templates.length]);

  const loadConcepts = useCallback(async () => {
    try {
        const cData = await conceptsApi.list();
        setConcepts(cData.map((c) => ({ label: c.name, value: c.id.toString() })));
    } catch {}
  }, []);

  const loadProductionBriefs = useCallback(async (force = false) => {
    if (!force && productionBriefs.length > 0) return;
    try {
        const data = await productionBriefsApi.list();
        setProductionBriefs(data);
    } catch {}
  }, [productionBriefs.length]);

  const loadRenderPresets = useCallback(async () => {
    if (renderPresets.length > 0) return;
    try {
        const data = await renderPresetsApi.list();
        setRenderPresets(data);
    } catch {}
  }, [renderPresets.length]);

  // INIT
  useEffect(() => {
    loadConcepts();
  }, [loadConcepts]);

  // Filtre değişince
  useEffect(() => {
    loadList();
  }, [loadList]);

  // Toggle Polling
  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const onReRenderClick = useCallback((runId: number) => {
      setReRenderRunId(runId);
      setIsReRenderModalOpen(true);
      setSelectedRenderPresetId(""); 
      void loadRenderPresets();
  }, [loadRenderPresets]);

  const handleReRender = async () => {
      if(!reRenderRunId) return;
      try {
          await pipelineRunsApi.reRender({
              runId: reRenderRunId,
              newRenderPresetId: selectedRenderPresetId ? Number(selectedRenderPresetId) : undefined
          });
          toast.success("Yeniden render kuyruğa alındı.");
          setIsReRenderModalOpen(false);
          startPolling(reRenderRunId);
      } catch {
          toast.error("İşlem başarısız.");
      }
  };

  const startPolling = useCallback((id: number) => {
    stopPolling();
    let inFlight = false;
    pollRef.current = window.setInterval(async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const data = await pipelineRunsApi.get(id);
        setDetail(() => {
             // Eğer polling sırasında başka bir ID ye geçildiyse (race condition) state'i güncelleme
             // Ancak component unmount durumu için cleanup yeterli olur, id check extra güvenlik.
             return data;
        });

        if (STOP_POLLING_RUN_STATUSES.has(data.status)) {
          stopPolling();
          loadList(true); // Sessizce listeyi güncelle (Statü değişti)
        }
      } catch {
        stopPolling();
      } finally {
        inFlight = false;
      }
    }, DETAIL_POLL_INTERVAL_MS);
  }, [stopPolling, loadList]);

  const handleRetryStage = useCallback(async (runId: number, stageName: string) => {
      const toastId = toast.loading(`${stageName} yeniden üretim isteği gönderiliyor...`);
      try {
        const result = await pipelineRunsApi.retryStage(runId, stageName);
        toast.success(result?.message || `${stageName} yeniden üretim isteği kuyruğa alındı.`, { id: toastId });
        startPolling(runId);
        void pipelineRunsApi.get(runId)
          .then((fresh) => setDetail((current) => current?.id === runId ? fresh : current))
          .catch(() => undefined);
      } catch (err: any) {
        toast.error(err?.message || `${stageName} yeniden üretim isteği başlatılamadı.`, { id: toastId });
        throw err;
      }
  }, [startPolling]);

  // Cleanup on unmount
  useEffect(() => {
       return () => stopPolling();
  }, [stopPolling]);

  const refreshSelectedDetail = useCallback(async () => {
    if (!selectedId) return;
    try {
      const data = await pipelineRunsApi.get(selectedId);
      setDetail(data);
      loadList(true);
    } catch {
      // Review aksiyonundan sonra sessiz refresh başarısız olursa ana akışı bozmayalım.
    }
  }, [selectedId, loadList]);

  // CLICK HANDLER
  const handleSelect = useCallback(async (id: number) => {
    // Aynı ID ise işlem yapma
    // setState içinde kontrol etmek closure sorununu çözer
    setSelectedId(prev => {
        if(prev === id) return prev;
        
        // Yeni ID seçildi
        stopPolling();
        setDetail(null);
        setDetailLoading(true);

        (async () => {
             try {
                const data = await pipelineRunsApi.get(id);
                setDetail(data);
                if (ACTIVE_RUN_STATUSES.has(data.status)) {
                    startPolling(id);
                }
             } catch {
                 toast.error("Detay yüklenemedi");
             } finally {
                 setDetailLoading(false);
             }
        })();

        return id;
    });
  }, [stopPolling, startPolling]);

  const openNewRunModal = useCallback(() => {
    setIsNewModalOpen(true);
    void loadTemplates();
    void loadProductionBriefs(true);
  }, [loadProductionBriefs, loadTemplates]);

  const handleSavedBriefChange = useCallback((id: string) => {
    setSelectedSavedBriefId(id);

    if (!id) {
      setProductionBrief({ ...EMPTY_PRODUCTION_BRIEF });
      return;
    }

    const selected = productionBriefs.find((brief) => String(brief.id) === id);
    if (!selected) return;

    setProductionBrief({
      mainTitle: selected.mainTitle ?? "",
      angle: selected.angle ?? "",
      audience: selected.audience ?? "",
      targetDuration: selected.targetDuration ?? "",
      mustCover: selected.mustCover ?? "",
      avoid: selected.avoid ?? "",
      hookDirection: selected.hookDirection ?? "",
      thumbnailDirection: selected.thumbnailDirection ?? "",
      notes: selected.notes ?? "",
    });
  }, [productionBriefs]);


  // NEW RUN
  const handleCreate = async () => {
    if (!selectedTemplateId) {
      toast.error("Şablon seçmelisiniz.");
      return;
    }
    setCreating(true);
    try {
      const brief = normalizeProductionBrief(productionBrief);
      const res = await pipelineRunsApi.create({
        templateId: Number(selectedTemplateId),
        autoStart: true,
        pauseBeforeRender,
        savedBriefId: selectedSavedBriefId ? Number(selectedSavedBriefId) : undefined,
        brief,
      });
      toast.success("Üretim başlatıldı!");
      setIsNewModalOpen(false);
      setSelectedSavedBriefId("");
      setProductionBrief({ ...EMPTY_PRODUCTION_BRIEF });
      
      // Listeyi yenile ve yeni üretimi seç
      await loadList();
      handleSelect(res.runId); 
      
    } catch {
      toast.error("Başlatılamadı.");
    } finally {
      setCreating(false);
    }
  };



  const handleApprove = async (runId: number) => {
      try {
          await pipelineRunsApi.approve(runId);
          toast.success("Onaylandı, işlem devam ediyor...");
          startPolling(runId);
      } catch {
          toast.error("Onay işlemi başarısız.");
      }
  };

  const handleApproveWithFallback = async (runId: number) => {
      try {
          await pipelineRunsApi.approve(runId);
          toast.success("Onaylandi, islem devam ediyor...");
          startPolling(runId);
      } catch (approveError: any) {
          try {
              await pipelineRunsApi.start(runId);
              toast.success("Run kaldigi yerden tekrar tetiklendi...");
              startPolling(runId);
          } catch (startError: any) {
              toast.error(startError?.message || approveError?.message || "Onay islemi basarisiz.");
          }
      }
  };

  const handleStartUpload = async (runId: number) => {
      try {
          await pipelineRunsApi.startUpload(runId);
          toast.success("Upload baslatildi...");
          startPolling(runId);
      } catch (error: any) {
          const detail = error?.detail;
          toast.error(detail?.message || detail?.error || error?.message || "Upload baslatilamadi.");
      }
  };

  const handleCancelRun = useCallback((runId: number) => {
      setConfirmConfig({
          isOpen: true,
          title: "Uretimi Durdur",
          message: (
            <span>
              Bu uretimi durdurmak istedigine emin misin? <br/>
              <span className="text-xs text-zinc-500">Calisan AI/render islemi iptal edilir; uretilmis ara dosyalar korunur.</span>
            </span>
          ),
          confirmText: "Evet, Durdur",
          variant: "danger",
          onConfirm: async () => {
              try {
                await pipelineRunsApi.cancel(runId);
                toast.success("Uretim durduruldu.");
                stopPolling();
                const data = await pipelineRunsApi.get(runId);
                setDetail(data);
                await loadList(true);
              } catch {
                toast.error("Uretim durdurulamadi.");
              }
          }
      });
  }, [loadList, stopPolling]);

  const currentTimelineScene = timelinePageInfo?.sceneNumber || timelineSceneNumber || 1;
  const totalTimelineScenes = timelinePageInfo?.totalSceneCount || timelineData?.reviewReport?.sceneCount || 0;
  const previousTimelineScene = timelinePageInfo?.previousSceneNumber || (currentTimelineScene > 1 ? currentTimelineScene - 1 : undefined);
  const nextTimelineScene = timelinePageInfo?.nextSceneNumber || (totalTimelineScenes > currentTimelineScene ? currentTimelineScene + 1 : undefined);

  return (
    <Page>
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden pt-2">
        {/* SOL: LİSTE (Memoized) */}
        <div className="col-span-12 lg:col-span-7 xl:col-span-6 flex flex-col h-full min-h-0 gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
            <h1 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                  <Activity className="text-indigo-400" size={20} />
              </div>
              <div className="flex flex-col">
                  <span>Üretim Geçmişi</span>
                  <span className="text-xs font-normal text-zinc-500">Pipeline koşturmaları</span>
              </div>
            </h1>

            {/* SAĞ GRUP */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="w-full sm:w-48">
                <Select
                  value={selectedConceptId}
                  onChange={setSelectedConceptId}
                  options={[
                    { label: "Tüm Konseptler", value: "" },
                    ...concepts,
                  ]}
                  placeholder="Konsept Filtrele"
                  className="h-10 text-xs bg-zinc-900/50 border-zinc-800"
                />
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => loadList()}
                className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 shrink-0"
              >
                <RefreshCw
                  className={listLoading ? "animate-spin" : ""}
                  size={18}
                />
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate("/production-wizard")}
                className="bg-zinc-800/80 hover:bg-zinc-700 text-white border-zinc-700 px-4 shrink-0"
              >
                <WandSparkles size={18} className="mr-2" /> Wizard
              </Button>
              <Button
                onClick={openNewRunModal}
                className="bg-indigo-600 hover:bg-indigo-500 text-white border-none shadow-lg shadow-indigo-500/20 px-4 shrink-0"
              >
                <Play size={18} className="mr-2 fill-current" /> Yeni Üretim
              </Button>
            </div>
          </div>

          <RunHistoryList
            items={items}
            selectedId={selectedId}
            onSelect={handleSelect}
            loading={listLoading}
          />
        </div>

        {/* SAĞ: MONITOR (Memoized) */}
        <div className="col-span-12 lg:col-span-5 xl:col-span-6 flex flex-col h-full min-h-0">
             <RunDetail
            detail={detail}
            loading={detailLoading}
            onOpenTimeline={openTimeline}
            onRetryStage={handleRetryStage}
            onReRenderClick={onReRenderClick}
            onApprove={handleApproveWithFallback}
            onStartUpload={handleStartUpload}
            onCancel={handleCancelRun}
            onOpenContentCenter={(runId) => navigate(`/content/${runId}`)}
            onAssetChanged={refreshSelectedDetail}
          />
        </div>
      </div>

      {/* YENİ RUN MODALI */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Yeni Üretim Başlat"
      >
        <div className="flex flex-col gap-6 pt-2">
          <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
            <Label className="mb-3 text-zinc-300">
              Hangi şablonu (Reçete) kullanacaksın?
            </Label>
            <Select
              value={selectedTemplateId}
              onChange={setSelectedTemplateId}
              options={templates}
              placeholder="Şablon Seçiniz..."
            />
            <div className="flex gap-3 mt-4 text-xs text-zinc-500 bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50">
                <div className="min-w-[4px] bg-indigo-500 rounded-full" />
                <p>
                  Seçtiğiniz şablonun içindeki adımlar (Topic &rarr; Script &rarr; Video &rarr; Publish)
                  sırasıyla işletilecektir. Bu işlem otomatiktir.
                </p>
            </div>
            <div className="mt-4 rounded-xl border border-zinc-800/70 bg-zinc-950/40 p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-100">Kayitli Brief Sec</p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                    Kutuphaneden secince alanlar otomatik dolar. Sonra burada uretime ozel duzenleyebilirsin.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => loadProductionBriefs(true)}
                  className="h-8 px-3 rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                  Yenile
                </button>
              </div>
              <Select
                value={selectedSavedBriefId}
                onChange={handleSavedBriefChange}
                options={[
                  { label: "Elle yaz / kayitli brief kullanma", value: "" },
                  ...productionBriefs.map((brief) => ({
                    value: String(brief.id),
                    label: brief.conceptName
                      ? `${brief.name} - ${brief.conceptName}`
                      : brief.name,
                  })),
                ]}
                placeholder="Brief sec..."
              />
            </div>
            <div className="mt-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
              <div className="mb-3">
                <p className="text-sm font-semibold text-zinc-100">Uretim Brief'i</p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                  Long video icin ana basligi burada ver. Topic ve sahne promptlari bu brief'e baglanir.
                  Bos birakirsan topic preset eski otomatik fikir uretim modunda calisir.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label>Ana Baslik</Label>
                  <Input
                    value={productionBrief.mainTitle ?? ""}
                    onChange={(e) => setProductionBrief((prev) => ({ ...prev, mainTitle: e.target.value }))}
                    maxLength={PRODUCTION_BRIEF_FIELD_LIMITS.mainTitle}
                    placeholder="Orn: Osmanli'nin son 100 yilinda gercekten ne oldu?"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Aci / Tez</Label>
                  <Textarea
                    value={productionBrief.angle ?? ""}
                    onChange={(e) => setProductionBrief((prev) => ({ ...prev, angle: e.target.value }))}
                    maxLength={PRODUCTION_BRIEF_FIELD_LIMITS.angle}
                    placeholder="Ana iddia, merak sorusu, farkli bakis ve finalde varilacak sonuc..."
                    className="min-h-[110px]"
                  />
                  <BriefFieldCounter value={productionBrief.angle} limit={PRODUCTION_BRIEF_FIELD_LIMITS.angle} />
                </div>
                <div>
                  <Label>Hedef Izleyici</Label>
                  <Textarea
                    value={productionBrief.audience ?? ""}
                    onChange={(e) => setProductionBrief((prev) => ({ ...prev, audience: e.target.value }))}
                    maxLength={PRODUCTION_BRIEF_FIELD_LIMITS.audience}
                    placeholder="Merakli genel izleyici, tarih severler..."
                    className="min-h-[90px]"
                  />
                  <BriefFieldCounter value={productionBrief.audience} limit={PRODUCTION_BRIEF_FIELD_LIMITS.audience} />
                </div>
                <div>
                  <Label>Hedef Sure</Label>
                  <Input
                    value={productionBrief.targetDuration ?? ""}
                    onChange={(e) => setProductionBrief((prev) => ({ ...prev, targetDuration: e.target.value }))}
                    maxLength={PRODUCTION_BRIEF_FIELD_LIMITS.targetDuration}
                    placeholder="10-15 dk"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Kacinilacak Seyler</Label>
                  <Textarea
                    value={productionBrief.avoid ?? ""}
                    onChange={(e) => setProductionBrief((prev) => ({ ...prev, avoid: e.target.value }))}
                    maxLength={PRODUCTION_BRIEF_FIELD_LIMITS.avoid}
                    placeholder="Komplo dili, tekrar, abartili iddia..."
                    className="min-h-[90px]"
                  />
                  <BriefFieldCounter value={productionBrief.avoid} limit={PRODUCTION_BRIEF_FIELD_LIMITS.avoid} />
                </div>
                <div className="md:col-span-2">
                  <Label>Mutlaka Islensin</Label>
                  <Textarea
                    value={productionBrief.mustCover ?? ""}
                    onChange={(e) => setProductionBrief((prev) => ({ ...prev, mustCover: e.target.value }))}
                    maxLength={PRODUCTION_BRIEF_FIELD_LIMITS.mustCover}
                    placeholder={"- Giris sorusu\n- 3 ana bolum\n- Finalde net cevap"}
                    className="min-h-[120px]"
                  />
                  <BriefFieldCounter value={productionBrief.mustCover} limit={PRODUCTION_BRIEF_FIELD_LIMITS.mustCover} />
                </div>
                <div>
                  <Label>Hook Yonlendirmesi</Label>
                  <Textarea
                    value={productionBrief.hookDirection ?? ""}
                    onChange={(e) => setProductionBrief((prev) => ({ ...prev, hookDirection: e.target.value }))}
                    maxLength={PRODUCTION_BRIEF_FIELD_LIMITS.hookDirection}
                    placeholder="Ilk 10-20 saniyenin gerilimi, sorusu ve payoff vaadi..."
                    className="min-h-[100px]"
                  />
                  <BriefFieldCounter value={productionBrief.hookDirection} limit={PRODUCTION_BRIEF_FIELD_LIMITS.hookDirection} />
                </div>
                <div>
                  <Label>Thumbnail Yonlendirmesi</Label>
                  <Textarea
                    value={productionBrief.thumbnailDirection ?? ""}
                    onChange={(e) => setProductionBrief((prev) => ({ ...prev, thumbnailDirection: e.target.value }))}
                    maxLength={PRODUCTION_BRIEF_FIELD_LIMITS.thumbnailDirection}
                    placeholder="Ana gorsel fikir, duygu, karsitlik ve kisa metin niyeti..."
                    className="min-h-[100px]"
                  />
                  <BriefFieldCounter value={productionBrief.thumbnailDirection} limit={PRODUCTION_BRIEF_FIELD_LIMITS.thumbnailDirection} />
                </div>
                <div className="md:col-span-2">
                  <Label>Not / Kaynak / Ek Talimat</Label>
                  <Textarea
                    value={productionBrief.notes ?? ""}
                    onChange={(e) => setProductionBrief((prev) => ({ ...prev, notes: e.target.value }))}
                    maxLength={PRODUCTION_BRIEF_FIELD_LIMITS.notes}
                    placeholder="Kullanilacak kaynaklar, ozel anlatim notlari, ornekler..."
                    className="min-h-[110px]"
                  />
                  <BriefFieldCounter value={productionBrief.notes} limit={PRODUCTION_BRIEF_FIELD_LIMITS.notes} />
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-zinc-100">Render oncesi dur ve kontrol ettir</p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                    Acikken gorseller ve kurgu plani uretildikten sonra final render baslamaz.
                    Timeline'i kontrol edip Render'a Basla dediginde devam eder.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPauseBeforeRender((value) => !value)}
                  className={cn(
                    "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
                    pauseBeforeRender
                      ? "border-blue-400/40 bg-blue-600"
                      : "border-zinc-700 bg-zinc-800"
                  )}
                  aria-pressed={pauseBeforeRender}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                      pauseBeforeRender ? "left-5" : "left-0.5"
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setIsNewModalOpen(false)}>
              Vazgeç
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              isLoading={creating}
              disabled={!selectedTemplateId}
              className="bg-indigo-600 hover:bg-indigo-500"
            >
              <Play size={16} className="mr-2 fill-current" /> Başlat ve İzle
            </Button>
          </div>
        </div>
      </Modal>

      {/* TIMELINE MODALI */}
      <Modal
        isOpen={!!timelineData}
        onClose={() => {
          setTimelineData(null);
          setTimelinePageInfo(null);
        }}
        title="Video Kurgu Planı (Timeline)"
        maxWidth="full"
        className="h-[92vh] max-h-[92vh]"
      >
         <div className="h-[calc(92vh-7rem)] min-h-0">
            {timelineData && <TimelineViewer data={timelineData} runId={detail?.id} />}
         </div>
         <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                disabled={!previousTimelineScene || timelineOpening}
                onClick={() => previousTimelineScene && void loadTimelineScene(previousTimelineScene)}
              >
                Onceki Sahne
              </Button>
              <label className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/45 px-2 py-1 text-xs text-zinc-400">
                Sahne
                <Input
                  type="number"
                  min={1}
                  max={totalTimelineScenes || undefined}
                  value={timelineSceneNumber}
                  onChange={(event) => setTimelineSceneNumber(Math.max(1, Number(event.target.value) || 1))}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void loadTimelineScene(timelineSceneNumber);
                  }}
                  className="h-8 w-20 text-center font-mono"
                />
                {totalTimelineScenes ? <span>/ {totalTimelineScenes}</span> : null}
              </label>
              <Button
                variant="ghost"
                disabled={timelineOpening}
                isLoading={timelineOpening}
                onClick={() => void loadTimelineScene(timelineSceneNumber)}
              >
                Yukle
              </Button>
              <Button
                variant="secondary"
                disabled={!nextTimelineScene || timelineOpening}
                onClick={() => nextTimelineScene && void loadTimelineScene(nextTimelineScene)}
              >
                Sonraki Sahne
              </Button>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                setTimelineData(null);
                setTimelinePageInfo(null);
              }}
            >
              Kapat
            </Button>
         </div>
      </Modal>

     {/* Global Confirm Modal */}
     <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        variant={confirmConfig.variant ?? "primary"}
        confirmText={confirmConfig.confirmText ?? "Onayla"}
     />

      {/* RE-RENDER MODAL */}
      <Modal
          isOpen={isReRenderModalOpen}
          onClose={() => setIsReRenderModalOpen(false)}
          title="Yeniden Render Al"
      >
          <div className="flex flex-col gap-4">
              <div className="bg-zinc-950/30 p-4 rounded-xl border border-zinc-800 text-sm text-zinc-400">
                  <p>Mevcut pipeline çıktısını (Senaryo, Ses, Medya) kullanarak sadece <b>Video Render</b> aşamasını tekrar çalıştırır.</p>
                  <p className="mt-2 text-xs text-zinc-500">Bu işlem yeni bir video üretir ancak içeriği değiştirmez.</p>
              </div>

              <div>
                  <Label>Farklı Bir Render Ayarı Kullan (Opsiyonel)</Label>
                  <Select
                      value={selectedRenderPresetId}
                      onChange={setSelectedRenderPresetId}
                      options={[
                          { label: "Varsayılan (Değiştirme)", value: "" },
                          ...renderPresets.map(p => ({ label: p.name, value: p.id.toString() }))
                      ]}
                      className="mt-1.5"
                  />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                  <Button variant="ghost" onClick={() => setIsReRenderModalOpen(false)}>İptal</Button>
                  <Button variant="primary" onClick={handleReRender} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                      <RefreshCw size={16} className="mr-2" /> Render Başlat
                  </Button>
              </div>
          </div>
      </Modal>
    </Page>
  );
}
