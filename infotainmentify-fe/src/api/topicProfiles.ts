import { http } from "./http";

// -------------------------
// DTO Tipleri
// -------------------------
export interface TopicGenerationProfileListDto {
    id: number;
    profileName: string;
    modelName: string;
    promptName?: string;
    aiProvider?: string;
    productionType?: string;
    renderStyle?: string;
    language: string;
    requestedCount: number;
    autoGenerateScript: boolean;
    isPublic: boolean;
    allowRetry: boolean;
}

export interface TopicGenerationProfileDetailDto {
    id: number;
    profileName: string;
    promptId: number;
    aiConnectionId: number;
    modelName: string;

    productionType?: string;
    renderStyle?: string;
    language: string;
    temperature: number;
    requestedCount: number;
    maxTokens?: number | null;
    tagsJson?: string | null;
    outputMode: string;
    autoGenerateScript: boolean;
    isPublic: boolean;
    allowRetry: boolean;

    // Görüntüleme alanları (readonly)
    promptName?: string;
    aiProvider?: string;
}

// -------------------------
// Ana API Nesnesi
// -------------------------
export const topicProfilesApi = {
    // 🔹 Listeleme (opsiyonel arama parametresi)
    list(q?: string) {
        const qs = q ? `?q=${encodeURIComponent(q)}` : "";
        return http<TopicGenerationProfileListDto[]>(
            `/api/topicgenerationprofiles${qs}`
        );
    },

    // 🔹 Detay
    get(id: number) {
        return http<TopicGenerationProfileDetailDto>(
            `/api/topicgenerationprofiles/${id}`
        );
    },

    // 🔹 Yeni oluştur
    create(dto: Omit<TopicGenerationProfileDetailDto, "id">) {
        return http<{ id: number }>("/api/topicgenerationprofiles", {
            method: "POST",
            body: JSON.stringify(dto),
        });
    },

    // 🔹 Güncelle
    update(id: number, dto: Omit<TopicGenerationProfileDetailDto, "id">) {
        return http<{ id: number }>(`/api/topicgenerationprofiles/${id}`, {
            method: "PUT",
            body: JSON.stringify(dto),
        });
    },

    // 🔹 Sil
    delete(id: number) {
        return http<void>(`/api/topicgenerationprofiles/${id}`, {
            method: "DELETE",
        });
    },
};
