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
};

export type PipelineRunListDto = {
    id: number;
    templateName: string; // Join ile gelmeli
    status: RunStatus;
    startedAt?: string;
    completedAt?: string;
};

export type PipelineRunDetailDto = {
    id: number;
    status: RunStatus;
    startedAt?: string;
    completedAt?: string;
    errorMessage?: string;
    stages: PipelineStageDto[];
};

export type CreatePipelineRunRequest = {
    templateId: number;
    autoStart: boolean;
};

export const pipelineRunsApi = {
    list() {
        // Backend'de list endpoint'i query ile filtre alabilir, şimdilik düz çekiyoruz
        return http<PipelineRunListDto[]>("/api/pipeline-runs"); // Backend controller'a List endpoint'i eklediğini varsayıyorum
        // Eğer controllerda List yoksa, şimdilik boş döner veya hata verir, controller'a ekleme gerekebilir.
        // *Not: Backend Controller adımında List endpointini yazmamış olabiliriz, aşağıda not düşeceğim.*
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
};