import { http } from "./http";

export const STAGE_TYPES = [
    { value: "Topic", label: "Konu (Topic)" },
    { value: "Script", label: "Senaryo (Script)" },
    { value: "Image", label: "Gorsel (Image)" },
    { value: "Tts", label: "Seslendirme (TTS)" },
    { value: "Stt", label: "Desifre (STT)" },
    { value: "VideoAI", label: "Video AI" },
    { value: "SceneLayout", label: "Kurgu/Timeline" },
    { value: "Render", label: "Render (Birlestirme)" },
    { value: "Thumbnail", label: "Kapak (Thumbnail)" },
    { value: "Upload", label: "Yukleme (YouTube vs)" },
];

export type StageConfigDto = {
    id?: number;
    stageType: string;
    order: number;
    presetId?: number;
    optionsJson?: string;
};

export type PipelineTemplateListDto = {
    id: number;
    name: string;
    conceptName: string;
    productionProfile: string;
    stageCount: number;
    autoPublish: boolean;
    createdAt: string;
};

export type PipelineTemplateDetailDto = {
    id: number;
    name: string;
    description?: string;
    conceptId: number;
    productionProfile: string;
    workflowLayoutJson?: string;
    stages: StageConfigDto[];
    autoPublish: boolean;
    createdAt: string;
    updatedAt?: string;
};

export type SavePipelineTemplateDto = {
    name: string;
    description?: string;
    conceptId: number;
    productionProfile: string;
    workflowLayoutJson?: string;
    autoPublish: boolean;
    stages: StageConfigDto[];
};

export type PipelineTemplateHealthItemDto = {
    severity: "Healthy" | "Info" | "Warning" | "Error" | string;
    code: string;
    message: string;
    stageOrder?: number;
    stageType?: string;
    details?: string;
};

export type PipelineTemplateHealthUploadTargetDto = {
    socialChannelId: number;
    channelName?: string;
    channelType?: string;
    severity: "Healthy" | "Info" | "Warning" | "Error" | string;
    message?: string;
};

export type PipelineTemplateHealthStageDto = {
    stageConfigId: number;
    order: number;
    stageType: string;
    presetId?: number;
    presetName?: string;
    presetEntityType?: string;
    executorName?: string;
    severity: "Healthy" | "Info" | "Warning" | "Error" | string;
    outputWidth?: number;
    outputHeight?: number;
    fps?: number;
    aspectRatio?: string;
    targetDurationSec?: number;
    imageSize?: string;
    requiredInputs: string[];
    satisfiedInputs: string[];
    issues: PipelineTemplateHealthItemDto[];
    uploadTargets: PipelineTemplateHealthUploadTargetDto[];
};

export type PipelineTemplateHealthDto = {
    templateId: number;
    templateName: string;
    productionProfile: string;
    status: "Healthy" | "Warning" | "Error" | "Unknown" | string;
    isRunnable: boolean;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    stages: PipelineTemplateHealthStageDto[];
    items: PipelineTemplateHealthItemDto[];
    recommendedNextSteps: string[];
};

export const pipelineTemplatesApi = {
    list(q?: string, conceptId?: string) {
        const p = new URLSearchParams();
        if (q) p.set("q", q);
        if (conceptId) p.set("conceptId", conceptId);
        return http<PipelineTemplateListDto[]>(`/api/pipeline-templates?${p.toString()}`);
    },

    get(id: number) {
        return http<PipelineTemplateDetailDto>(`/api/pipeline-templates/${id}`);
    },

    health(id: number) {
        return http<PipelineTemplateHealthDto>(`/api/pipeline-templates/${id}/health`);
    },

    create(dto: SavePipelineTemplateDto) {
        return http<{ id: number }>("/api/pipeline-templates", {
            method: "POST",
            body: JSON.stringify(dto),
        });
    },

    update(id: number, dto: SavePipelineTemplateDto) {
        return http<void>(`/api/pipeline-templates/${id}`, {
            method: "PUT",
            body: JSON.stringify(dto),
        });
    },

    updateWorkflowLayout(id: number, workflowLayoutJson?: string) {
        return http<void>(`/api/pipeline-templates/${id}/workflow-layout`, {
            method: "PUT",
            body: JSON.stringify({ workflowLayoutJson }),
            timeoutMs: 10000,
        });
    },

    delete(id: number) {
        return http<void>(`/api/pipeline-templates/${id}`, { method: "DELETE" });
    },
};
