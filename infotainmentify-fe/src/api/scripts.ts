import { http } from "./http";

export type ScriptListDto = {
    id: number;
    title: string;
    topicTitle: string;
    estimatedDurationSec: number;
    createdAt: string;
};

export type ScriptDetailDto = {
    id: number;
    topicId?: number;
    title: string;
    description?: string;
    tags?: string;
    content: string;
    scenesJson?: string;
    languageCode: string;
    estimatedDurationSec: number;
    createdAt: string;
};

export type SaveScriptDto = {
    topicId?: number;
    title: string;
    description?: string;
    tags?: string;
    content: string;
    scenesJson?: string;
    languageCode: string;
    estimatedDurationSec: number;
};

export const scriptsApi = {
    // 🔥 GÜNCELLEME: conceptId parametresi eklendi
    list(q?: string, topicId?: number, conceptId?: number) {
        const p = new URLSearchParams();
        if (q) p.set("q", q);
        if (topicId) p.set("topicId", String(topicId));
        if (conceptId) p.set("conceptId", String(conceptId)); // Backend bunu bekliyor

        return http<ScriptListDto[]>(`/api/scripts?${p.toString()}`);
    },

    get(id: number) {
        return http<ScriptDetailDto>(`/api/scripts/${id}`);
    },

    create(dto: SaveScriptDto) {
        return http<{ id: number }>(`/api/scripts`, {
            method: "POST",
            body: JSON.stringify(dto),
        });
    },

    update(id: number, dto: SaveScriptDto) {
        return http<void>(`/api/scripts/${id}`, {
            method: "PUT",
            body: JSON.stringify(dto),
        });
    },

    delete(id: number) {
        return http<void>(`/api/scripts/${id}`, { method: "DELETE" });
    },
};