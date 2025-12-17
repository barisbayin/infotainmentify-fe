import { http } from "./http";

// Backend Enums ile uyumlu stringler
export type RunStatus = "Pending" | "Running" | "Completed" | "Failed" | "Cancelled";
export type StageStatus = "Pending" | "Skipped" | "Running" | "Completed" | "Failed" | "Retrying" | "PermanentlyFailed";

export type PipelineStageDto = {
    stageType: string;
    status: StageStatus;
    startedAt?: string;
    finishedAt?: string;
    error?: string;
    durationMs: number;
    outputJson: string;
};

export type PipelineRunListDto = {
    id: number;
    templateName: string; // Backend'den bu isimle geliyor
    runContextTitle?: string;
    status: string;
    startedAt?: string;
    completedAt?: string;
};

export type PipelineRunDetailDto = {
    id: number;
    status: RunStatus;
    startedAt?: string;
    completedAt?: string;
    errorMessage?: string;
    finalVideoUrl?: string;
    stages: PipelineStageDto[];
};

export type CreatePipelineRunRequest = {
    templateId: number;
    autoStart: boolean;
};

export const pipelineRunsApi = {
    list(conceptId?: string) { // 🔥 Eklendi
        const p = new URLSearchParams();
        if (conceptId) p.set("conceptId", conceptId);
        return http<PipelineRunListDto[]>(`/api/pipeline-runs?${p.toString()}`);
    },

    get(id: number) {
        return http<PipelineRunDetailDto>(`/api/pipeline-runs/${id}`);
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
        });
    },

    retryStage(runId: number, stageType: string) {
        return http<any>(`/api/pipeline-runs/retry/${runId}/${stageType}`, {
            method: "POST"
        });
    },

    reRender(dto: { runId: number; newRenderPresetId?: number }) {
        return http<{ message: string }>("/api/pipeline-runs/re-render", {
            method: "POST",
            body: JSON.stringify(dto),
        });
    },

    getLogs(id: number) {
        return http<string[]>(`/api/pipeline-runs/${id}/logs`);
    }
};