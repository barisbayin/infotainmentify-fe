import { http } from "./http";

// Backend Enums ile uyumlu stringler
export type RunStatus = "Pending" | "Running" | "Completed" | "Failed" | "Cancelled" | "Draft" | "WaitingForApproval";
export type StageStatus = "Pending" | "Skipped" | "Running" | "Completed" | "Failed" | "Retrying" | "PermanentlyFailed" | "Outdated" | "Cancelled" | "WaitingForApproval";

export type PipelineStageDto = {
    stageType: string;
    status: StageStatus;
    startedAt?: string;
    finishedAt?: string;
    error?: string;
    durationMs: number;
    outputJson?: string | null;
    outputJsonOmitted?: boolean;
    outputJsonLength?: number;
};

export type PipelineStageOutputDto = {
    runId: number;
    stageType: string;
    outputJson?: string | null;
    outputJsonLength: number;
};

export type PipelineTimelinePageDto = {
    runId: number;
    skip: number;
    take: number;
    totalVisualCount: number;
    sceneNumber?: number;
    totalSceneCount?: number;
    previousSceneNumber?: number;
    nextSceneNumber?: number;
    hasMore: boolean;
    data: any;
};

export type PipelineImagePromptDto = {
    runId: number;
    sceneNumber: number;
    beatIndex: number;
    imagePath?: string;
    imagePrompt?: string;
    negativePrompt?: string;
    promptPartKey?: string;
    promptHash?: string;
    inputHash?: string;
    generationContract?: string;
};

export type PipelineRegenerateImageResultDto = {
    message?: string;
    url: string;
    sceneNumber: number;
    beatIndex: number;
    promptHash?: string;
    inputHash?: string;
    promptPartKey?: string;
    generationContract?: string;
    promptPreview?: string;
    negativePromptPreview?: string;
    mode?: ImageRegenerationMode;
    promptReplanned?: boolean;
    spokenAnchor?: string;
    visualThesis?: string;
    visualArchetype?: string;
    generatedAtUtc?: string;
};

export type ImageRegenerationMode = "resample" | "reframe" | "replan";

export type ContractValidationIssue = {
    severity: "Error" | "Warning" | "Info" | string;
    code: string;
    message: string;
    fieldPath?: string;
    actionHint?: string;
};

export type ContractValidationReport = {
    contractName: string;
    contractVersion: string;
    status: "Ready" | "Review" | "Blocked" | string;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    issueCount: number;
    issues: ContractValidationIssue[];
};

export type PipelineRunListDto = {
    id: number;
    templateName: string; // Backend'den bu isimle geliyor
    runContextTitle?: string;
    status: string;
    startedAt?: string;
    completedAt?: string;
    stages?: PipelineStageDto[];
    conceptName?: string;
    videoTitle?: string;
    sourceRunId?: number;
    derivativeType?: string;
    derivativeLabel?: string;
};

export type PipelineRunDetailDto = {
    id: number;
    runContextTitle?: string;
    templateName?: string;
    status: RunStatus;
    startedAt?: string;
    completedAt?: string;
    errorMessage?: string;
    autoPublish?: boolean;
    packageApprovalStatus?: string;
    packageApprovedAt?: string;
    packageApprovalNote?: string;
    finalVideoUrl?: string;
    finalVideoWidth?: number;
    finalVideoHeight?: number;
    finalVideoAspectRatio?: string;
    thumbnailUrl?: string;
    thumbnailWidth?: number;
    thumbnailHeight?: number;
    sourceRunId?: number;
    derivativeType?: string;
    derivativeGroupId?: string;
    derivativeLabel?: string;
    brief?: ProductionBrief;
    stages: PipelineStageDto[];
};

export type ShortsCandidateDto = {
    candidateId: string;
    title: string;
    hook: string;
    angle: string;
    payoff: string;
    cta: string;
    sourceEvidence: string;
    visualDirection: string;
    durationSec: number;
    hookScore: number;
    standaloneScore: number;
    spoilerRisk: "low" | "medium" | "high" | string;
    sourceSceneNumbers: number[];
};

export type ShortsPlanDto = {
    sourceRunId: number;
    sourceTitle: string;
    generatedAtUtc: string;
    modelName: string;
    warnings: string[];
    candidates: ShortsCandidateDto[];
};

export type CreateShortsRequest = {
    candidates: ShortsCandidateDto[];
    autoStart: boolean;
    pauseBeforeRender: boolean;
    autoPublish: boolean;
};

export type ShortsChildRunDto = {
    runId: number;
    sourceRunId: number;
    candidateId: string;
    title: string;
    durationSec: number;
    status: RunStatus | string;
    createdAt: string;
    renderStatus?: string;
    uploadStatus?: string;
    videoUrl?: string;
    uploadUrl?: string;
};

export type CreateShortsResultDto = {
    sourceRunId: number;
    derivativeGroupId: string;
    runs: ShortsChildRunDto[];
};

export type PipelineReviewIssueDto = {
    severity: "Error" | "Warning" | "Info" | string;
    stageType: string;
    code: string;
    message: string;
    actionHint?: string;
    actionType?: "open_timeline" | "retry_stage" | "approve_stage" | "open_video" | "regenerate_image" | string;
    actionLabel?: string;
    sceneNumber?: number;
    beatIndex?: number;
    imagePath?: string;
};

export type PipelineReviewStageDto = {
    stageType: string;
    status: StageStatus | string;
    durationMs: number;
    hasOutput: boolean;
    error?: string;
    validationStatus?: string;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    contractName?: string;
    contractVersion?: string;
    modelName?: string;
    inputHash?: string;
    promptHash?: string;
    outputHash?: string;
    promptTraceCount?: number;
    promptTraceJson?: string;
    validationJson?: string;
};

export type PipelineReviewImageItemDto = {
    sceneNumber: number;
    beatIndex: number;
    beatCount: number;
    imagePath?: string;
    promptPartKey?: string;
    promptHash?: string;
    inputHash?: string;
    generationContract?: string;
    imagePrompt?: string;
    negativePrompt?: string;
    spokenAnchor?: string;
    visualThesis?: string;
    visualArchetype?: string;
    forbiddenReuse?: string;
    semanticSignature?: string;
    visualIntent?: string;
    visualPurpose?: string;
    narrationFocus?: string;
    visualType?: string;
    varietyRole?: string;
    effectType?: string;
    transitionType?: string;
    textMode?: string;
    allowedText?: string;
    plannedDurationSec?: number;
    visualQualityScore?: number;
    visualQualityNotes?: string;
    isMissing?: boolean;
    isFallback?: boolean;
    isLowQuality?: boolean;
    timelineDurationSec?: number;
    timelineUseCount?: number;
};

export type PipelineReviewReadinessItemDto = {
    severity: "Error" | "Warning" | "Info" | string;
    code: string;
    message: string;
    target?: string;
    actionType?: "open_timeline" | "retry_stage" | "approve_stage" | "open_video" | "regenerate_image" | "approve_package" | string;
    actionLabel?: string;
};

export type PipelineRunReviewDto = {
    id: number;
    status: RunStatus | string;
    title: string;
    brief?: ProductionBrief;
    script: {
        sceneCount: number;
        wordCount: number;
        estimatedDurationSec: number;
        wordsPerMinute: number;
    };
    visuals: {
        storyboardShotCount: number;
        imageCount: number;
        visualEventCount?: number;
        uniqueTimelineImageCount?: number;
        missingImageCount: number;
        fallbackImageCount: number;
        lowQualityImageCount: number;
        averageQualityScore: number;
        imagesPerMinute: number;
        visualEventsPerMinute?: number;
        uniqueImagesPerMinute?: number;
    };
    timeline: {
        totalDurationSec: number;
        visualCount: number;
        audioCount: number;
        averageVisualDurationSec: number;
        longestVisualDurationSec: number;
        longHoldCount: number;
        sttTimedVisualCount: number;
        status: string;
    };
    render: {
        hasVideo: boolean;
        videoUrl?: string;
        durationSec: number;
        fileSizeMb: number;
        width: number;
        height: number;
        aspectRatio?: string;
        audioQaStatus?: string;
        audioWarnings: string[];
    };
    package: {
        hasStage?: boolean;
        canRetry?: boolean;
        retryHint?: string;
        hasThumbnail: boolean;
        thumbnailUrl?: string;
        validationStatus?: string;
        isReady?: boolean;
        errorCount?: number;
        warningCount?: number;
        infoCount?: number;
        titleOptionCount: number;
        thumbnailConceptCount: number;
        chapterCount: number;
        tagCount: number;
        checklistCount: number;
        approvalStatus?: string;
        approvedAt?: string;
        approvalNote?: string;
        canApprove?: boolean;
        approvalHint?: string;
        readyToUpload?: boolean;
        readyToUploadHint?: string;
        titleOptions?: string[];
        thumbnailConcepts?: { name: string; prompt: string; rationale: string }[];
        description?: string;
        chapters?: { timestamp: string; title: string; startSec: number }[];
        tags?: string[];
        hashtags?: string[];
        tagGenerationSource?: string;
        tagSearchIntent?: string;
        tagModelName?: string;
        tagPromptVersion?: string;
        tagGeneratedAt?: string;
        pinnedComment?: string;
        uploadChecklist?: string[];
    };
    stages: PipelineReviewStageDto[];
    images: PipelineReviewImageItemDto[];
    readiness: PipelineReviewReadinessItemDto[];
    issues: PipelineReviewIssueDto[];
};

export type PipelineReviewImagePageDto = {
    runId: number;
    skip: number;
    take: number;
    totalImageCount: number;
    timelineUsedImageCount?: number;
    unusedImageCount?: number;
    hasMore: boolean;
    images: PipelineReviewImageItemDto[];
};

export type CreatePipelineRunRequest = {
    templateId: number;
    autoStart: boolean;
    pauseBeforeRender?: boolean;
    savedBriefId?: number;
    brief?: ProductionBrief;
};

export type ProductionBrief = {
    mainTitle?: string;
    angle?: string;
    audience?: string;
    targetDuration?: string;
    mustCover?: string;
    avoid?: string;
    hookDirection?: string;
    thumbnailDirection?: string;
    notes?: string;
};

export type RenderProgressDto = {
    runId: number;
    stage?: string;
    label?: string;
    status?: string;
    percent: number;
    currentSeconds?: number;
    totalSeconds?: number;
    currentBytes?: number;
    totalBytes?: number;
    chunkIndex?: number;
    totalChunks?: number;
    isCompleted?: boolean;
    timestampUtc?: string;
};

export interface UploadResultItem {
    Platform: string;     // "YouTube", "Instagram"
    ChannelName: string;
    VideoUrl: string | null;
    IsSuccess: boolean;
    ErrorMessage: string | null;
}

export interface UploadStagePayload {
    Uploads: UploadResultItem[];
    CompletedAt: string;
}

export const pipelineRunsApi = {
    list(conceptId?: string) { // 🔥 Eklendi
        const p = new URLSearchParams();
        if (conceptId) p.set("conceptId", conceptId);
        return http<PipelineRunListDto[]>(`/api/pipeline-runs?${p.toString()}`);
    },

    get(id: number) {
        return http<PipelineRunDetailDto>(`/api/pipeline-runs/${id}`);
    },

    planShorts(id: number, dto: { candidateCount: number; minDurationSec: number; maxDurationSec: number }) {
        return http<ShortsPlanDto>(`/api/pipeline-runs/${id}/shorts/plan`, {
            method: "POST",
            body: JSON.stringify(dto),
            timeoutMs: 120000,
        });
    },

    createShorts(id: number, dto: CreateShortsRequest) {
        return http<CreateShortsResultDto>(`/api/pipeline-runs/${id}/shorts`, {
            method: "POST",
            body: JSON.stringify(dto),
            timeoutMs: 120000,
        });
    },

    listShorts(id: number) {
        return http<ShortsChildRunDto[]>(`/api/pipeline-runs/${id}/shorts`, {
            timeoutMs: 30000,
        });
    },

    review(id: number) {
        return http<PipelineRunReviewDto>(`/api/pipeline-runs/${id}/review`, {
            timeoutMs: 45000,
        });
    },

    reviewImages(id: number, skip = 0, take = 18) {
        const p = new URLSearchParams();
        p.set("skip", String(skip));
        p.set("take", String(take));
        return http<PipelineReviewImagePageDto>(`/api/pipeline-runs/${id}/review/images?${p.toString()}`, {
            timeoutMs: 30000,
        });
    },

    reviewPackage(id: number) {
        return http<PipelineRunReviewDto["package"]>(`/api/pipeline-runs/${id}/review/package`, {
            timeoutMs: 30000,
        });
    },

    stageOutput(id: number, stageType: string) {
        return http<PipelineStageOutputDto>(`/api/pipeline-runs/${id}/stages/${encodeURIComponent(stageType)}/output`, {
            timeoutMs: 60000,
        });
    },

    timeline(id: number, skip = 0, take = 18, sceneNumber?: number) {
        const p = new URLSearchParams();
        if (sceneNumber && sceneNumber > 0) {
            p.set("sceneNumber", String(sceneNumber));
        } else {
            p.set("skip", String(skip));
            p.set("take", String(take));
        }
        return http<PipelineTimelinePageDto>(`/api/pipeline-runs/${id}/timeline?${p.toString()}`, {
            timeoutMs: 30000,
        });
    },

    timelineScene(id: number, sceneNumber = 1) {
        const p = new URLSearchParams();
        p.set("sceneNumber", String(Math.max(1, sceneNumber)));
        return http<PipelineTimelinePageDto>(`/api/pipeline-runs/${id}/timeline?${p.toString()}`, {
            timeoutMs: 30000,
        });
    },

    imagePrompt(id: number, sceneNumber: number, beatIndex?: number, imagePath?: string) {
        const p = new URLSearchParams();
        if (beatIndex && beatIndex > 0) p.set("beatIndex", String(beatIndex));
        if (imagePath) p.set("imagePath", imagePath);
        const qs = p.toString();
        return http<PipelineImagePromptDto>(
            `/api/pipeline-runs/${id}/images/${sceneNumber}/prompt${qs ? `?${qs}` : ""}`,
            { timeoutMs: 30000 }
        );
    },

    create(dto: CreatePipelineRunRequest) {
        return http<{ runId: number; message: string }>("/api/pipeline-runs", {
            method: "POST",
            body: JSON.stringify(dto),
        });
    },

    start(id: number) {
        return http<{ message: string }>(`/api/pipeline-runs/${id}/start`, {
            method: "POST",
            timeoutMs: 60000,
        });
    },

    approve(id: number) {
        return http<{ message: string }>(`/api/pipeline-runs/${id}/approve`, {
            method: "POST",
            timeoutMs: 60000,
        });
    },

    startUpload(id: number) {
        return http<{ message: string }>(`/api/pipeline-runs/${id}/start-upload`, {
            method: "POST",
            timeoutMs: 120000,
        });
    },

    approvePackage(id: number, note?: string) {
        return http<{ message: string }>(`/api/pipeline-runs/${id}/package/approve`, {
            method: "POST",
            body: JSON.stringify({ note }),
        });
    },

    updatePackage(id: number, dto: {
        titleOptions: string[];
        description: string;
        chapters: { timestamp: string; title: string; startSec: number }[];
        tags: string[];
        hashtags: string[];
        pinnedComment: string;
        uploadChecklist: string[];
    }) {
        return http<{ message: string }>(`/api/pipeline-runs/${id}/package`, {
            method: "PUT",
            body: JSON.stringify(dto),
        });
    },

    regeneratePackageTags(id: number) {
        return http<{
            tags: string[];
            hashtags: string[];
            searchIntent: string;
            source: string;
            modelName: string;
            promptVersion: string;
            generatedAt: string;
        }>(`/api/pipeline-runs/${id}/package/tags/regenerate`, {
            method: "POST",
            timeoutMs: 120000,
        });
    },

    listReviewDecisions(id: number) {
        return http<RunReviewDecisionDto[]>(`/api/pipeline-runs/${id}/review-decisions`);
    },

    saveReviewDecision(id: number, gate: string, dto: { status: "Approved" | "Rejected" | "Pending"; note?: string }) {
        return http<RunReviewDecisionDto>(`/api/pipeline-runs/${id}/review-decisions/${encodeURIComponent(gate)}`, {
            method: "POST",
            body: JSON.stringify(dto),
        });
    },

    cancel(id: number) {
        return http<{ message: string }>(`/api/pipeline-runs/${id}/cancel`, {
            method: "POST",
            timeoutMs: 60000,
        });
    },

    retryStage(runId: number, stageType: string) {
        return http<{ message: string; runId: number; stageType: string; status: string }>(`/api/pipeline-runs/retry/${runId}/${encodeURIComponent(stageType)}`, {
            method: "POST",
            timeoutMs: 30000,
        });
    },

    reRender(dto: { runId: number; newRenderPresetId?: number }) {
        return http<{ message: string }>("/api/pipeline-runs/re-render", {
            method: "POST",
            body: JSON.stringify(dto),
            timeoutMs: 120000,
        });
    },

    getLogs(id: number) {
        return http<string[]>(`/api/pipeline-runs/${id}/logs`, { timeoutMs: 30000 });
    },

    regenerateSceneImage(runId: number, sceneNumber: number, beatIndex?: number, imagePath?: string, mode: ImageRegenerationMode = "resample") {
        const p = new URLSearchParams();
        if (beatIndex !== undefined && beatIndex !== null) p.set("beatIndex", String(beatIndex));
        if (imagePath) p.set("imagePath", imagePath);
        p.set("mode", mode);
        const qs = p.toString();

        return http<PipelineRegenerateImageResultDto>(`/api/pipeline-runs/${runId}/scenes/${sceneNumber}/regenerate${qs ? `?${qs}` : ""}`, {
            method: "POST",
            timeoutMs: 180000,
        });
    }
};

export type RunReviewDecisionDto = {
    id: number;
    gate: string;
    status: "Approved" | "Rejected" | "Pending" | string;
    note?: string;
    decidedAt?: string;
};
