import { http } from "./http";

/* ===========================================================
   📦 TYPES
   =========================================================== */

export interface ScriptGenerationResult {
    totalRequested: number;
    successCount: number;
    failedCount: number;
    generatedTopicIds: number[];
    failedTopicIds: number[];
    provider?: string | null;
    model?: string | null;
    temperature?: number;
    language?: string | null;
    productionType?: string | null;
    renderStyle?: string | null;
    message?: string | null;
}

export interface GenerateFromTopicsRequest {
    profileId: number;
    topicIds?: number[];
}

/* ===========================================================
   🚀 API FUNCTIONS
   =========================================================== */

export const scriptGeneratorApi = {
    // ---------------- PROFILE-BASED GENERATION ----------------
    generate(profileId: number) {
        // ✅ controller route = POST /api/scriptgeneration/generate/{profileId}
        return http<{ success: boolean; message: string; data: ScriptGenerationResult }>(
            `/api/scriptgeneration/generate/${profileId}`,
            { method: "POST" }
        );
    },

    // ---------------- TOPIC-LIST BASED GENERATION (future feature) ----------------
    generateFromTopics(payload: GenerateFromTopicsRequest) {
        return http<{ success: boolean; message: string; data?: ScriptGenerationResult }>(
            `/api/scriptgeneration/generate-from-topics`,
            {
                method: "POST",
                body: JSON.stringify(payload),
            }
        );
    },

    generateAsync(profileId: number) {
        return http<{ success: boolean; message: string }>(
            `/api/scriptgeneration/generate-async?profileId=${profileId}`,
            { method: "POST" }
        );
    },

    // ✅ Seçilen topic'ler için profile göre script üretimi başlatır
    generateFromTopicsAsync(req: GenerateFromTopicsRequest) {
        return http<{ success: boolean; message: string }>(
            `/api/scriptgeneration/generate-from-topics-async`,
            {
                method: "POST",
                body: JSON.stringify(req),
            }
        );
    },
};
