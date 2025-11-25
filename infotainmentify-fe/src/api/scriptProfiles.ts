import { http, qs } from "./http";

/* ===========================================================
   📦 TYPES
   =========================================================== */

export interface ScriptGenerationProfileListDto {
    id: number;

    // 🏷️ Genel bilgiler
    profileName: string;
    modelName: string;
    language: string;
    outputMode: string;
    productionType?: string | null;
    renderStyle?: string | null;
    temperature: number;
    isPublic: boolean;
    allowRetry: boolean;
    status: string;

    // 🔗 Ana bağlantı
    aiConnectionId: number;
    aiConnectionName: string;
    aiProvider: string;

    // 🎨 Görsel AI
    imageAiConnectionId?: number | null;
    imageAiConnectionName?: string | null;

    // 🗣️ TTS AI
    ttsAiConnectionId?: number | null;
    ttsAiConnectionName?: string | null;

    // 🗣️ TTS AI
    sttAiConnectionId?: number | null;
    sttAiConnectionName?: string | null;

    // 🎬 Video AI
    videoAiConnectionId?: number | null;
    videoAiConnectionName?: string | null;

    // 🔗 İlişkisel
    promptId: number;
    promptName: string;
    topicGenerationProfileId?: number | null;
    topicGenerationProfileName?: string | null;
}

export interface ScriptGenerationProfileDetailDto {
    id: number;
    appUserId?: number;

    // 🧠 Ana alanlar
    promptId: number;
    aiConnectionId: number;
    topicGenerationProfileId?: number | null;
    profileName: string;
    modelName: string;
    temperature: number;
    language: string;
    outputMode: string;
    configJson?: string | null;
    status: string;
    productionType?: string | null;
    renderStyle?: string | null;
    isPublic: boolean;
    allowRetry: boolean;

    // 🎨 Görsel üretim
    imageAiConnectionId?: number | null;
    imageModelName?: string | null;
    imageRenderStyle?: string | null;
    imageAspectRatio?: string | null;

    // 🗣️ Seslendirme üretimi
    ttsAiConnectionId?: number | null;
    ttsModelName?: string | null;
    ttsVoice?: string | null;

    sttAiConnectionId?: number | null;
    sttModelName?: string | null;

    // 🎬 Video üretimi
    videoAiConnectionId?: number | null;
    videoModelName?: string | null;
    videoTemplate?: string | null;

    // 🔄 Otomatik üretim bayrakları
    autoGenerateAssets: boolean;
    autoRenderVideo: boolean;

    // only for display
    promptName?: string | null;
    aiConnectionName?: string | null;
    aiProvider?: string | null;
    topicGenerationProfileName?: string | null;
    imageAiConnectionName?: string | null;
    ttsAiConnectionName?: string | null;
    videoAiConnectionName?: string | null;
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
