import { http } from "./http";

/* ===========================================================
   📦 TYPES
   =========================================================== */

export interface GenerateFromTopicsRequest {
    profileId: number;
    topicIds?: number[];
}

export interface GenerateResponse {
    message: string;
}

/* ===========================================================
   🚀 API FUNCTIONS
   =========================================================== */

export const scriptGeneratorApi = {
    // ---------------- PROFILE-BASED GENERATION ----------------
    generate(profileId: number) {
        return http<GenerateResponse>(
            `/api/scriptgeneration/generate?profileId=${profileId}`,
            { method: "POST" }
        );
    },

    // ---------------- TOPIC-LIST BASED GENERATION ----------------
    generateFromTopics(payload: GenerateFromTopicsRequest) {
        return http<GenerateResponse>(`/api/scriptgeneration/generate-from-topics`, {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },
};
