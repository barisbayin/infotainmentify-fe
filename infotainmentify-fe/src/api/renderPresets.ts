import { http } from "./http";

// ---------------------------------------------------------------------------
// ENUMS YERİNE TYPE DEFINITIONS (Hata Çözümü Burada)
// ---------------------------------------------------------------------------

// String Enum Type Definitions (Backend uyumlu)
export type CaptionAnimationTypes = "None" | "PopUp" | "Typewriter" | "SlideUp" | "WordByWord";
export type CaptionPositionTypes = "Top" | "Bottom" | "Center";

// ---------------------------------------------------------------------------
// SUB-SETTINGS DTOs
// ---------------------------------------------------------------------------

export type RenderCaptionSettingsDto = {
    enableCaptions: boolean;
    styleName: string;
    fontName: string;
    fontSize: number;
    primaryColor: string;
    outlineColor: string;
    outlineSize: number;
    enableHighlight: boolean;
    highlightColor: string;
    animation: string;
    position: string;
    marginBottom: number;
    maxWordsPerLine: number;
    uppercase: boolean;
};

export type RenderAudioMixSettingsDto = {
    voiceVolumePercent: number;
    musicVolumePercent: number;
    sfxVolumePercent: number;
    enableDucking: boolean;
    duckingFactor: number;
    fadeAudioInOut: boolean;
    fadeDurationSec: number;
};

export type RenderVisualEffectsSettingsDto = {
    enableKenBurns: boolean;
    zoomIntensity: number;
    transitionType: string;
    transitionDurationSec: number;
    colorFilter?: string;
};

export type RenderBrandingSettingsDto = {
    enableWatermark: boolean;
    watermarkText: string;
    watermarkImagePath?: string;
    watermarkColor: string;
    opacity: number;
    position: string;
};

// ---------------------------------------------------------------------------
// MAIN DTOs
// ---------------------------------------------------------------------------

export type RenderPresetListDto = {
    id: number;
    name: string;
    outputWidth: number;
    outputHeight: number;
    fps: number;
    encoderPreset: string;
    updatedAt?: string;
};

export type RenderPresetDetailDto = {
    id: number;
    name: string;

    // Teknik
    outputWidth: number;
    outputHeight: number;
    fps: number;
    bitrateKbps: number;
    encoderPreset: string;
    containerFormat: string;

    // Ayarlar
    captionSettings: RenderCaptionSettingsDto;
    audioMixSettings: RenderAudioMixSettingsDto;
    visualEffectsSettings: RenderVisualEffectsSettingsDto;
    brandingSettings: RenderBrandingSettingsDto;
    createdAt?: string;
    updatedAt?: string;
};

// Save DTO
export type SaveRenderPresetDto = Omit<RenderPresetDetailDto, "id" | "createdAt" | "updatedAt">;

// ---------------------------------------------------------------------------
// API CALLS
// ---------------------------------------------------------------------------

export const renderPresetsApi = {
    list() {
        return http<RenderPresetListDto[]>("/api/render-presets");
    },
    get(id: number) {
        return http<RenderPresetDetailDto>(`/api/render-presets/${id}`);
    },
    create(dto: SaveRenderPresetDto) {
        return http<{ id: number }>("/api/render-presets", { method: "POST", body: JSON.stringify(dto) });
    },
    update(id: number, dto: SaveRenderPresetDto) {
        return http<void>(`/api/render-presets/${id}`, { method: "PUT", body: JSON.stringify(dto) });
    },
    delete(id: number) {
        return http<void>(`/api/render-presets/${id}`, { method: "DELETE" });
    },
};