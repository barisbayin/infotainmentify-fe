import { http } from "./http";

export type ScriptPresetListDto = {
    id: number;
    name: string;
    modelName: string;
    tone: string; // "Humorous", "Dark"
    updatedAt?: string;
};

export type ScriptPresetDetailDto = {
    id: number;
    name: string;
    userAiConnectionId: number;
    modelName: string;
    tone: string;
    targetDurationSec: number;
    language: string;
    includeHook: boolean;
    includeCta: boolean;
    promptTemplate: string;
    systemInstruction?: string;
    createdAt: string;
    updatedAt?: string;
};

export type SaveScriptPresetDto = {
    name: string;
    userAiConnectionId: number;
    modelName: string;
    tone: string;
    targetDurationSec: number;
    language: string;
    includeHook: boolean;
    includeCta: boolean;
    promptTemplate: string;
    systemInstruction?: string;
};

export const scriptPresetsApi = {
    list() {
        return http<ScriptPresetListDto[]>("/api/script-presets");
    },

    get(id: number) {
        return http<ScriptPresetDetailDto>(`/api/script-presets/${id}`);
    },

    create(dto: SaveScriptPresetDto) {
        return http<{ id: number }>("/api/script-presets", {
            method: "POST",
            body: JSON.stringify(dto),
        });
    },

    update(id: number, dto: SaveScriptPresetDto) {
        return http<void>(`/api/script-presets/${id}`, {
            method: "PUT",
            body: JSON.stringify(dto),
        });
    },

    delete(id: number) {
        return http<void>(`/api/script-presets/${id}`, { method: "DELETE" });
    },
};