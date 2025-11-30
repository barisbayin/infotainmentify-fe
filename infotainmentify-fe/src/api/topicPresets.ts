import { http } from "./http";

export type TopicPresetListDto = {
    id: number;
    name: string;
    modelName: string;
    language: string;
    updatedAt?: string;
};

export type TopicPresetDetailDto = {
    id: number;
    name: string;
    description?: string;
    userAiConnectionId: number;
    modelName: string;
    temperature: number;
    language: string;
    promptTemplate: string;
    contextKeywordsJson?: string;
    systemInstruction?: string;
    createdAt: string;
    updatedAt?: string;
};

export type SaveTopicPresetDto = {
    name: string;
    description?: string;
    userAiConnectionId: number;
    modelName: string;
    temperature: number;
    language: string;
    promptTemplate: string;
    contextKeywordsJson?: string;
    systemInstruction?: string;
};

export const topicPresetsApi = {
    list() {
        return http<TopicPresetListDto[]>("/api/topic-presets");
    },

    get(id: number) {
        return http<TopicPresetDetailDto>(`/api/topic-presets/${id}`);
    },

    create(dto: SaveTopicPresetDto) {
        return http<{ id: number; message: string }>("/api/topic-presets", {
            method: "POST",
            body: JSON.stringify(dto),
        });
    },

    update(id: number, dto: SaveTopicPresetDto) {
        return http<void>(`/api/topic-presets/${id}`, {
            method: "PUT",
            body: JSON.stringify(dto),
        });
    },

    delete(id: number) {
        return http<void>(`/api/topic-presets/${id}`, { method: "DELETE" });
    },
};