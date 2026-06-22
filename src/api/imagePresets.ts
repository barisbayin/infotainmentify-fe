import { http } from "./http";

export type ImagePresetListDto = {
    id: number;
    name: string;
    modelName: string;
    size: string;
    updatedAt?: string;
};

export type ImagePresetDetailDto = {
    id: number;
    name: string;
    userAiConnectionId: number;
    modelName: string;
    artStyle?: string;
    size: string;
    quality: string;
    promptTemplate: string;
    negativePrompt?: string;
    imageCountPerScene: number;
    createdAt: string;
    updatedAt?: string;
};

export type SaveImagePresetDto = {
    name: string;
    userAiConnectionId: number;
    modelName: string;
    artStyle?: string;
    size: string;
    quality: string;
    promptTemplate: string;
    negativePrompt?: string;
    imageCountPerScene: number;
};

export const imagePresetsApi = {
    list() {
        return http<ImagePresetListDto[]>("/api/image-presets");
    },

    get(id: number) {
        return http<ImagePresetDetailDto>(`/api/image-presets/${id}`);
    },

    create(dto: SaveImagePresetDto) {
        return http<{ id: number }>("/api/image-presets", {
            method: "POST",
            body: JSON.stringify(dto),
        });
    },

    update(id: number, dto: SaveImagePresetDto) {
        return http<void>(`/api/image-presets/${id}`, {
            method: "PUT",
            body: JSON.stringify(dto),
        });
    },

    delete(id: number) {
        return http<void>(`/api/image-presets/${id}`, { method: "DELETE" });
    },
};