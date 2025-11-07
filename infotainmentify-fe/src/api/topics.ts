import { http, qs } from "./http";

/* ===========================================================
   📦 TYPES
   =========================================================== */

export interface TopicListDto {
    id: number;
    category?: string | null;
    subCategory?: string | null;
    tone?: string | null;
    needsFootage: boolean;
    factCheck: boolean;
    scriptGenerated: boolean;
    isActive: boolean;
    updatedAt?: string | null;
    promptId?: number | null;
    promptName?: string | null;
    scriptId?: number | null;
    scriptTitle?: string | null;
    premise?: string | null;
    premiseTr?: string | null;
    renderStyle?: string | null;
    productionType?: string | null;
}

export interface TopicDetailDto {
    id: number;
    topicCode: string;
    category?: string | null;
    subCategory?: string | null;
    series?: string | null;
    premise?: string | null;
    premiseTr?: string | null;
    tone?: string | null;
    potentialVisual?: string | null;
    renderStyle?: string | null;
    voiceHint?: string | null;
    scriptHint?: string | null;
    needsFootage: boolean;
    factCheck: boolean;
    topicJson?: string | null;
    scriptGenerated: boolean;
    promptId?: number | null;
    promptName?: string | null;
    scriptId?: number | null;
    scriptTitle?: string | null;
    scriptGeneratedAt?: string | null;
    priority: number;
    isActive: boolean;
}

/* ===========================================================
   🚀 API FUNCTIONS
   =========================================================== */

export const topicsApi = {
    // ---------------- LIST & DETAIL ----------------
    list(q?: string, category?: string) {
        return http<TopicListDto[]>(`/api/topics${qs({ q, category })}`);
    },

    get(id: number) {
        return http<TopicDetailDto>(`/api/topics/${id}`);
    },

    // ---------------- CREATE/UPDATE (UPSERT) ----------------
    save(dto: TopicDetailDto) {
        return http<{ id: number }>(`/api/topics`, {
            method: "POST",
            body: JSON.stringify(dto),
        });
    },

    // ---------------- DELETE ----------------
    delete(id: number) {
        return http<void>(`/api/topics/${id}`, { method: "DELETE" });
    },

    // ---------------- TOGGLE ACTIVE ----------------
    toggleActive(id: number, isActive: boolean) {
        return http<void>(`/api/topics/${id}/active${qs({ isActive })}`, {
            method: "PUT",
        });
    },

    // ---------------- GENERATION OPS ----------------
    generateFromPrompt(promptId: number) {
        return http<{ jobId?: number; createdTopicIds?: number[] }>(
            `/api/generate/topics${qs({ promptId })}`,
            { method: "POST" }
        );
    },
};
