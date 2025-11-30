import { http } from "./http";

export type SttPresetListDto = {
    id: number;
    name: string;
    modelName: string;
    languageCode: string;
    updatedAt?: string;
};

export type SaveSttPresetDto = {
    name: string;
    userAiConnectionId: number;
    modelName: string;
    languageCode: string;
    enableWordLevelTimestamps: boolean;
    enableSpeakerDiarization: boolean;
    outputFormat: string;
    prompt?: string;
    temperature: number;
    filterProfanity: boolean;
};

export type SttPresetDetailDto = SaveSttPresetDto & { id: number; createdAt: string; updatedAt?: string };

export const sttPresetsApi = {
    list() { return http<SttPresetListDto[]>("/api/stt-presets"); },
    get(id: number) { return http<SttPresetDetailDto>(`/api/stt-presets/${id}`); },
    create(dto: SaveSttPresetDto) { return http<{ id: number }>("/api/stt-presets", { method: "POST", body: JSON.stringify(dto) }); },
    update(id: number, dto: SaveSttPresetDto) { return http<void>(`/api/stt-presets/${id}`, { method: "PUT", body: JSON.stringify(dto) }); },
    delete(id: number) { return http<void>(`/api/stt-presets/${id}`, { method: "DELETE" }); },
};