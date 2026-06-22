import { http } from "./http";

export type TtsPresetListDto = {
    id: number;
    name: string;
    voiceId: string;
    languageCode: string;
    updatedAt?: string;
};

export type TtsPresetDetailDto = {
    id: number;
    name: string;
    userAiConnectionId: number;
    voiceId: string;
    languageCode: string;
    engineModel?: string;
    speakingRate: number;
    pitch: number;
    stability: number;
    clarity: number;
    styleExaggeration: number;
    createdAt: string;
    updatedAt?: string;
};

export type SaveTtsPresetDto = {
    name: string;
    userAiConnectionId: number;
    voiceId: string;
    languageCode: string;
    engineModel?: string;
    speakingRate: number;
    pitch: number;
    stability: number;
    clarity: number;
    styleExaggeration: number;
};

export const ttsPresetsApi = {
    list() {
        return http<TtsPresetListDto[]>("/api/tts-presets");
    },

    get(id: number) {
        return http<TtsPresetDetailDto>(`/api/tts-presets/${id}`);
    },

    create(dto: SaveTtsPresetDto) {
        return http<{ id: number }>("/api/tts-presets", {
            method: "POST",
            body: JSON.stringify(dto),
        });
    },

    update(id: number, dto: SaveTtsPresetDto) {
        return http<void>(`/api/tts-presets/${id}`, {
            method: "PUT",
            body: JSON.stringify(dto),
        });
    },

    delete(id: number) {
        return http<void>(`/api/tts-presets/${id}`, { method: "DELETE" });
    },
};