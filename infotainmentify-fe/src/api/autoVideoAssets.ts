import { http } from "./http";

export interface AutoVideoAssetListDto {
    id: number;
    profileId: number;

    topicId?: number | null;
    scriptId?: number | null;

    videoPath?: string | null;
    thumbnailPath?: string | null;

    uploaded: boolean;
    uploadVideoId?: string | null;
    uploadPlatform?: string | null;

    status: number;
    createdAt: string;
}

export interface AutoVideoAssetDetailDto {
    id: number;
    appUserId: number;
    profileId: number;

    topicId?: number | null;
    scriptId?: number | null;

    videoPath?: string | null;
    thumbnailPath?: string | null;

    uploaded: boolean;
    uploadVideoId?: string | null;
    uploadPlatform?: string | null;

    status: number;
    log?: string | null;

    createdAt: string;
    updatedAt?: string | null;
}

export const autoVideoAssetsApi = {
    list() {
        return http<AutoVideoAssetListDto[]>("/api/AutoVideoAssets");
    },

    get(id: number) {
        return http<AutoVideoAssetDetailDto>(`/api/AutoVideoAssets/${id}`);
    },

    getLog(id: number) {
        return http<any[]>(`/api/AutoVideoAssets/${id}/log`);
    },

    delete(id: number) {
        return http<{ success: boolean }>(`/api/AutoVideoAssets/${id}`, {
            method: "DELETE",
        });
    },
};
