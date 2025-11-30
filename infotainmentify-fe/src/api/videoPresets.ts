import { http } from "./http";

export type VideoPresetListDto = {
    id: number;
    name: string;
    modelName: string;
    generationMode: string;
    updatedAt?: string;
};

export type SaveVideoPresetDto = {
    name: string;
    userAiConnectionId: number;
    modelName: string;
    generationMode: number; // Enum ID: 1=TextToVideo, 2=ImageToVideo
    aspectRatio: string;
    durationSeconds: number;
    promptTemplate: string;
    negativePrompt?: string;
    cameraControlSettingsJson?: string;
    advancedSettingsJson?: string;
};

// Detail DTO, Save DTO ile hemen hemen aynı, sadece ID ve tarihler var
export type VideoPresetDetailDto = SaveVideoPresetDto & { id: number; createdAt: string; updatedAt?: string };

export const videoPresetsApi = {
    list() { return http<VideoPresetListDto[]>("/api/video-presets"); },
    get(id: number) { return http<VideoPresetDetailDto>(`/api/video-presets/${id}`); },
    create(dto: SaveVideoPresetDto) {
        return http<{ id: number }>("/api/video-presets", { method: "POST", body: JSON.stringify(dto) });
    },
    update(id: number, dto: SaveVideoPresetDto) {
        return http<void>(`/api/video-presets/${id}`, { method: "PUT", body: JSON.stringify(dto) });
    },
    delete(id: number) { return http<void>(`/api/video-presets/${id}`, { method: "DELETE" }); },
};