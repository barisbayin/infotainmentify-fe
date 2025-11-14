import { http } from "./http";

// ----------------------------
// DTO TYPES
// ----------------------------
export interface AutoVideoAssetProfileListDto {
    id: number;
    profileName: string;
    topicProfileName: string;
    scriptProfileName: string;
    socialChannelName?: string;
    uploadAfterRender: boolean;
    generateThumbnail: boolean;
    isActive: boolean;
}

export interface AutoVideoAssetProfileDetailDto {
    id: number;

    profileName: string;

    topicGenerationProfileId: number;
    scriptGenerationProfileId: number;
    socialChannelId?: number | null;

    uploadAfterRender: boolean;
    generateThumbnail: boolean;

    titleTemplate?: string | null;
    descriptionTemplate?: string | null;

    isActive: boolean;
}

// ----------------------------
// API CLIENT
// ----------------------------
export const autoVideoProfilesApi = {
    // LIST
    list() {
        return http<AutoVideoAssetProfileListDto[]>(
            "/api/AutoVideoAssetProfiles"
        );
    },

    // GET DETAIL
    get(id: number) {
        return http<AutoVideoAssetProfileDetailDto>(
            `/api/AutoVideoAssetProfiles/${id}`
        );
    },

    // CREATE (dto without id)
    create(dto: Omit<AutoVideoAssetProfileDetailDto, "id">) {
        return http<{ id: number }>("/api/AutoVideoAssetProfiles/save", {
            method: "POST",
            body: JSON.stringify(dto),
        });
    },

    // UPDATE (id + dto without id)
    update(id: number, dto: Omit<AutoVideoAssetProfileDetailDto, "id">) {
        return http<{ id: number }>(`/api/AutoVideoAssetProfiles/save`, {
            method: "POST",
            body: JSON.stringify({ ...dto, id }),
        });
    },

    // DELETE
    delete(id: number) {
        return http<void>(`/api/AutoVideoAssetProfiles/${id}`, {
            method: "DELETE",
        });
    },
};
