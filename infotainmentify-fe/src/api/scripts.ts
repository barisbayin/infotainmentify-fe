import { http, qs } from "./http";

/* ===========================================================
   📦 TYPES
   =========================================================== */

export interface ScriptListDto {
    id: number;
    topicId: number;
    topicCode?: string | null;
    title: string;
    summary?: string | null;
    language: string;
    createdAt: string;
    updatedAt?: string | null;
    isActive: boolean;
}

export interface ScriptDetailDto {
    id: number;
    topicId: number;
    topicCode?: string | null;
    title: string;
    summary?: string | null;
    content: string;
    language: string;
    metaJson?: string | null;
    createdAt: string;
    updatedAt?: string | null;
    isActive: boolean;
}

/* ===========================================================
   🚀 API FUNCTIONS
   =========================================================== */

export const scriptsApi = {
    // ---------------- LIST & DETAIL ----------------
    list(topicId?: number | null, q?: string) {
        return http<ScriptListDto[]>(`/api/scripts${qs({ topicId, q })}`);
    },

    get(id: number) {
        return http<ScriptDetailDto>(`/api/scripts/${id}`);
    },

    // ---------------- CREATE/UPDATE (UPSERT) ----------------
    save(dto: ScriptDetailDto) {
        // id varsa update, yoksa create
        const method = dto.id ? "PUT" : "POST";
        const url = dto.id ? `/api/scripts/${dto.id}` : `/api/scripts`;
        return http<ScriptDetailDto>(url, {
            method,
            body: JSON.stringify(dto),
        });
    },

    // ---------------- DELETE ----------------
    delete(id: number) {
        return http<void>(`/api/scripts/${id}`, { method: "DELETE" });
    },

    // ---------------- TOGGLE ACTIVE ----------------
    toggleActive(id: number, isActive: boolean) {
        return http<void>(`/api/scripts/${id}/active/${isActive}`, {
            method: "PUT",
        });
    },
};
