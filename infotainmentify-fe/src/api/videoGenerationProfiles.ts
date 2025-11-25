import { http } from "./http";

/* ============================
   📦 TYPES
   ============================ */

export interface VideoGenerationProfileListDto {
    id: number;
    profileName: string;
    isActive: boolean;
    scriptGenerationProfileId: number;
    scriptGenerationProfileName: string;
    autoVideoRenderProfileName: string;
    socialChannelId?: number | null;
    socialChannelName?: string | null;
}

export interface VideoGenerationProfileDetailDto {
    id: number;
    profileName: string;
    scriptGenerationProfileId: number;
    autoVideoRenderProfileId: number;
    socialChannelId?: number | null;
    uploadAfterRender: boolean;
    generateThumbnail: boolean;
    titleTemplate?: string | null;
    descriptionTemplate?: string | null;
    isActive: boolean;
}

/* ============================
   🚀 API
   ============================ */

export const videoGenerationProfilesApi = {

    // ---------------- LIST ----------------
    list() {
        return http<VideoGenerationProfileListDto[]>(
            `/api/videogenerationprofiles`
        );
    },

    // ---------------- GET ----------------
    get(id: number) {
        return http<VideoGenerationProfileDetailDto>(
            `/api/videogenerationprofiles/${id}`
        );
    },

    // ---------------- SAVE (CREATE OR UPDATE) ----------------
    save(dto: VideoGenerationProfileDetailDto) {
        return http<{ id: number }>(`/api/videogenerationprofiles`, {
            method: "POST",
            body: JSON.stringify(dto),
        });
    },

    // ---------------- DELETE ----------------
    delete(id: number) {
        return http<{ ok: boolean }>(
            `/api/videogenerationprofiles/${id}`,
            { method: "DELETE" }
        );
    },
};
