import { http, qs } from "./http";

export type PromptOverrideDto = {
    id: number;
    name: string;
    contractName: string;
    contractVersion: string;
    stageType: string;
    systemPromptOverride: string;
    userPromptOverride: string;
    notes: string;
    createdAt: string;
    updatedAt?: string;
};

export type PromptContractDto = {
    name: string;
    version: string;
    contractKey: string;
    stageType: string;
    productionProfile: string;
    description: string;
    requiredInputKeys: string[];
    outputShape: string[];
    businessRules: string[];
    activeOverride?: PromptOverrideDto | null;
};

export type StagePromptTraceDto = {
    id: number;
    runId: number;
    stageExecutionId: number;
    stageType: string;
    contractName: string;
    contractVersion: string;
    modelName: string;
    traceKey: string;
    sceneNumber?: number;
    beatIndex?: number;
    inputHash: string;
    promptHash: string;
    outputHash: string;
    systemPrompt: string;
    userPrompt: string;
    negativePrompt: string;
    promptPreview: string;
    createdAt: string;
};

export const promptContractsApi = {
    list() {
        return http<PromptContractDto[]>("/api/prompt-contracts");
    },
    traces(params: { runId?: number; stageExecutionId?: number; stageType?: string; limit?: number } = {}) {
        return http<StagePromptTraceDto[]>(`/api/prompt-contracts/traces${qs(params)}`);
    },
    saveOverride(dto: {
        id?: number;
        contractName: string;
        name: string;
        systemPromptOverride: string;
        userPromptOverride: string;
        notes?: string;
    }) {
        return http<PromptOverrideDto>("/api/prompt-contracts/overrides", {
            method: "POST",
            body: JSON.stringify(dto),
        });
    },
    deleteOverride(id: number) {
        return http<{ message: string }>(`/api/prompt-contracts/overrides/${id}`, { method: "DELETE" });
    },
    diff(dto: { baseText: string; overrideText: string }) {
        return http<{ added: number; removed: number; lines: { type: "equal" | "added" | "removed"; lineNumber: number; text: string }[] }>("/api/prompt-contracts/diff", {
            method: "POST",
            body: JSON.stringify(dto),
        });
    },
    test(dto: {
        contractName: string;
        overrideId?: number;
        overrideName?: string;
        baseSystemPrompt?: string;
        baseUserPrompt?: string;
        systemPromptOverride?: string;
        userPromptOverride?: string;
    }) {
        return http<any>("/api/prompt-contracts/test", {
            method: "POST",
            body: JSON.stringify(dto),
        });
    },
};
