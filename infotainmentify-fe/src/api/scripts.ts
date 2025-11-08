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
    renderStyle?: string | null;
    productionType?: string | null;
    modelName?: string | null;
    promptName?: string | null;
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
    renderStyle?: string | null;
    productionType?: string | null;
    metaJson?: string | null;
    scriptJson?: string | null;
    promptName?: string | null;
    modelName?: string | null;
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
        const method = dto.id && dto.id > 0 ? "PUT" : "POST";
        const url = dto.id && dto.id > 0 ? `/api/scripts/${dto.id}` : `/api/scripts`;
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
