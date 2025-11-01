import { http, qs } from "./http";
import type { Topic, GenerateTopicsRequest, GenerateTopicsResponse } from "./types";

export const topicsApi = {
    list(q?: string, category?: string) {
        return http<Topic[]>(`/api/topics${qs({ q, category })}`);
    },
    get(id: number) {
        return http<Topic>(`/api/topics/${id}`);
    },
    create(dto: Omit<Topic, "id">) {
        return http<{ id: number }>(`/api/topics`, { method: "POST", body: JSON.stringify(dto) });
    },
    update(id: number, dto: Omit<Topic, "id">) {
        return http<void>(`/api/topics/${id}`, { method: "PUT", body: JSON.stringify(dto) });
    },
    delete(id: number) {
        return http<void>(`/api/topics/${id}`, { method: "DELETE" });
    },

    generateFromPrompt(promptId: number) {
        return http<{ jobId?: number; createdTopicIds?: number[] }>(
            `/api/generate/topics${qs({ promptId })}`,
            { method: "POST" }
        );
    },
    generate(payload: GenerateTopicsRequest) {
        return http<GenerateTopicsResponse>(`/api/generate/topics`, {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    // ✅ Yeni ekleme:
    toggleActive(id: number, isActive: boolean) {
        return http<void>(`/api/topics/${id}/active/${isActive}`, {
            method: "PUT",
        });
    },
};
