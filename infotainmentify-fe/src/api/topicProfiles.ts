import { http } from "./http";

// -------------------------
// DTO Tipleri
// -------------------------
export interface TopicGenerationProfileListDto {
    id: number;
    profileName?: string;
    modelName: string;
    promptName?: string;
    aiProvider?: string;
    requestedCount: number;
    status: string;
    startedAt: string;
    completedAt?: string | null;
}

export interface TopicGenerationProfileDetailDto {
    id: number;
    profileName?: string;
    promptId: number;
    aiConnectionId: number;
    modelName: string;
    requestedCount: number;
    rawResponseJson?: string | null;
    startedAt?: string | null;
    completedAt?: string | null;
    status?: string | null;
    promptName?: string | null;
    aiProvider?: string | null;
}

// -------------------------
// Ana API Nesnesi
// -------------------------
export const topicProfilesApi = {
    // Listeleme
    list() {
        return http<TopicGenerationProfileListDto[]>("/api/topicgenerationprofiles");
    },

    // Detay
    get(id: number) {
        return http<TopicGenerationProfileDetailDto>(
            `/api/topicgenerationprofiles/${id}`
        );
    },

    // Yeni oluştur
    create(dto: Omit<TopicGenerationProfileDetailDto, "id">) {
        return http<{ id: number }>("/api/topicgenerationprofiles", {
            method: "POST",
            body: JSON.stringify(dto),
        });
    },

    // Güncelle
    update(id: number, dto: Omit<TopicGenerationProfileDetailDto, "id">) {
        return http<void>(`/api/topicgenerationprofiles/${id}`, {
            method: "PUT",
            body: JSON.stringify(dto),
        });
    },

    // Sil
    delete(id: number) {
        return http<void>(`/api/topicgenerationprofiles/${id}`, {
            method: "DELETE",
        });
    },
};
