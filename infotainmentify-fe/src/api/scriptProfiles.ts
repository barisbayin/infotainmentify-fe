import { http, qs } from "./http";

/* ===========================================================
   📦 TYPES
   =========================================================== */

export interface ScriptGenerationProfileListDto {
    id: number;
    profileName: string;
    modelName: string;
    temperature: number;
    language?: string | null;
    status?: string | null;
    productionType?: string | null;
    renderStyle?: string | null;
    isPublic: boolean;
    allowRetry: boolean;
    promptName?: string | null;
    aiConnectionName?: string | null;
    aiProvider?: string | null;
    topicGenerationProfileName?: string | null;
}

export interface ScriptGenerationProfileDetailDto {
    id: number;
    profileName: string;
    promptId: number;
    aiConnectionId: number;
    topicGenerationProfileId?: number | null;
    modelName: string;
    temperature: number;
    language?: string | null;
    outputMode?: string | null;
    configJson?: string | null;
    status?: string | null;
    productionType?: string | null;
    renderStyle?: string | null;
    isPublic: boolean;
    allowRetry: boolean;

    // only for display
    promptName?: string | null;
    aiConnectionName?: string | null;
    aiProvider?: string | null;
    topicGenerationProfileName?: string | null;
}

/* ===========================================================
   🚀 API FUNCTIONS
   =========================================================== */

export const scriptGenerationProfilesApi = {
    // ---------------- LIST ----------------
    list(status?: string | null) {
        return http<ScriptGenerationProfileListDto[]>(
            `/api/scriptgenerationprofiles${qs({ status })}`
        );
    },

    // ---------------- GET ----------------
    get(id: number) {
        return http<ScriptGenerationProfileDetailDto>(
            `/api/scriptgenerationprofiles/${id}`
        );
    },

    // ---------------- SAVE (CREATE OR UPDATE) ----------------
    save(dto: ScriptGenerationProfileDetailDto) {
        return http<{ id: number }>(`/api/scriptgenerationprofiles/save`, {
            method: "POST",
            body: JSON.stringify(dto),
        });
    },

    // ---------------- DELETE ----------------
    delete(id: number) {
        return http<{ success: boolean }>(
            `/api/scriptgenerationprofiles/${id}`,
            { method: "DELETE" }
        );
    },
};
