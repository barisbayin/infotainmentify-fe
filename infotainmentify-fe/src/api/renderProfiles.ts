import { http } from "./http";

/* ===========================================================
   📦 TYPES
   =========================================================== */
// LIST DTO
export interface RenderProfileListDto {
    id: number;
    name: string;
    resolution: string;
    fps: number;
    style?: string | null;
}

// POSITION ENUM
export const CaptionPositionTypes = {
    Top: 1,
    Middle: 2,
    Bottom: 3,
} as const;

export type CaptionPositionTypes = typeof CaptionPositionTypes[keyof typeof CaptionPositionTypes];

export const CaptionAnimations = {
    None: 0,
    Bounce: 1,
} as const;

export type CaptionAnimations = typeof CaptionAnimations[keyof typeof CaptionAnimations];

// DETAIL DTO (FULL)
export interface RenderProfileDetailDto {
    id: number;
    name: string;

    resolution: string;
    fps: number;
    style?: string | null;

    // CAPTIONS
    captionStyle: string;
    captionFont: string;
    captionSize: number;
    captionGlow: boolean;
    captionGlowColor: string;
    captionGlowSize: number;
    captionOutlineSize: number;
    captionShadowSize: number;
    captionKaraoke: boolean;
    captionHighlightColor: string;

    captionChunkSize: number;
    captionPosition: CaptionPositionTypes;
    captionMarginV: number;
    captionLineSpacing: number;
    captionMaxWidthPercent: number;
    captionBackgroundOpacity: number;
    captionAnimation: CaptionAnimations;

    // MOTION
    motionIntensity: number;
    zoomSpeed: number;
    zoomMax: number;
    panX: number;
    panY: number;

    // TRANSITION
    transition: string;
    transitionDuration: number;
    transitionDirection: string;
    transitionEasing: string;
    transitionStrength: number;

    // TIMELINE
    timelineMode: string;

    // AUDIO
    bgmVolume: number;
    voiceVolume: number;
    duckingStrength: number;

    // AI
    aiRecommendedStyle?: string | null;
    aiRecommendedTransitions?: string | null;
    aiRecommendedCaption?: string | null;
}

/* ===========================================================
   🚀 API FUNCTIONS
   =========================================================== */

export const renderProfilesApi = {
    // ---------------- LIST ----------------
    list() {
        return http<RenderProfileListDto[]>(`/api/renderprofiles`);
    },

    // ---------------- GET ----------------
    get(id: number) {
        return http<RenderProfileDetailDto>(`/api/renderprofiles/${id}`);
    },

    // ---------------- SAVE (CREATE OR UPDATE) ----------------
    save(dto: RenderProfileDetailDto) {
        return http<{ id: number }>(`/api/renderprofiles/save`, {
            method: "POST",
            body: JSON.stringify(dto),
        });
    },

    // ---------------- DELETE ----------------
    delete(id: number) {
        return http<{ success: boolean }>(
            `/api/renderprofiles/${id}`,
            { method: "DELETE" }
        );
    },
};
