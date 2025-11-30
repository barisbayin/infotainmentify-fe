import { http } from "./http";

export type RenderPresetListDto = {
    id: number;
    name: string;
    outputWidth: number;
    outputHeight: number;
    fps: number;
    updatedAt?: string;
};

export type RenderPresetDetailDto = {
    id: number;
    name: string;
    outputWidth: number;
    outputHeight: number;
    fps: number;
    bitrateKbps: number;
    containerFormat: string;
    captionSettings: {
        enableCaptions: boolean;
        fontName: string;
        fontSize: number;
        primaryColor: string;
        outlineColor: string;
        enableHighlight: boolean;
        highlightColor: string;
        maxWordsPerLine: number;
    };
    audioMixSettings: {
        voiceVolumePercent: number;
        musicVolumePercent: number;
        enableDucking: boolean;
    };
};

// Save DTO ile Detail DTO yapısı %99 aynı
export type SaveRenderPresetDto = Omit<RenderPresetDetailDto, "id" | "createdAt" | "updatedAt">;

export const renderPresetsApi = {
    list() { return http<RenderPresetListDto[]>("/api/render-presets"); },
    get(id: number) { return http<RenderPresetDetailDto>(`/api/render-presets/${id}`); },
    create(dto: SaveRenderPresetDto) {
        return http<{ id: number }>("/api/render-presets", { method: "POST", body: JSON.stringify(dto) });
    },
    update(id: number, dto: SaveRenderPresetDto) {
        return http<void>(`/api/render-presets/${id}`, { method: "PUT", body: JSON.stringify(dto) });
    },
    delete(id: number) { return http<void>(`/api/render-presets/${id}`, { method: "DELETE" }); },
};