import { http } from "./http";

/* ===========================================================
   📦 TYPES
   =========================================================== */

export interface ScriptGenerationProfileListDto {
    id: number;
    profileName?: string | null;
    modelName: string;
    temperature: number;
    language?: string | null;
    status?: string | null;
    isActive: boolean;
    startedAt?: string | null;
    completedAt?: string | null;
    promptName?: string | null;
    aiConnectionName?: string | null;
    aiProvider?: string | null;
    topicGenerationProfileName?: string | null;
}

export interface ScriptGenerationProfileDetailDto {
    id: number;
    profileName?: string | null;
    promptId: number;
    aiConnectionId: number;
    topicGenerationProfileId?: number | null;
    modelName: string;
    temperature: number;
    language?: string | null;
    topicIdsJson?: string | null;
    configJson?: string | null;
    rawResponseJson?: string | null;
    status?: string | null;
    isActive: boolean;
    startedAt?: string | null;
    completedAt?: string | null;
    promptName?: string | null;
    aiConnectionName?: string | null;
    aiProvider?: string | null;
    topicGenerationProfileName?: string | null;
}

/* ===========================================================
   🚀 API FUNCTIONS
   =========================================================== */

export const scriptsProfilesApi = {
    // ---------------- LIST ----------------
    list() {
        return http<ScriptGenerationProfileListDto[]>("/api/scriptgenerationprofiles");
    },

    // ---------------- GET ----------------
    get(id: number) {
        return http<ScriptGenerationProfileDetailDto>(`/api/scriptgenerationprofiles/${id}`);
    },

    // ---------------- CREATE ----------------
    create(dto: Omit<ScriptGenerationProfileDetailDto, "id">) {
        return http<{ id: number }>("/api/scriptgenerationprofiles", {
            method: "POST",
            body: JSON.stringify(dto),
        });
    },

    // ---------------- UPDATE ----------------
    update(id: number, dto: Omit<ScriptGenerationProfileDetailDto, "id">) {
        return http<void>(`/api/scriptgenerationprofiles/${id}`, {
            method: "PUT",
            body: JSON.stringify(dto),
        });
    },

    // ---------------- DELETE ----------------
    delete(id: number) {
        return http<void>(`/api/scriptgenerationprofiles/${id}`, {
            method: "DELETE",
        });
    },

    // ---------------- TOGGLE ACTIVE ----------------
    toggleActive(id: number, isActive: boolean) {
        return http<void>(`/api/scriptgenerationprofiles/${id}/active/${isActive}`, {
            method: "PUT",
        });
    },
};
