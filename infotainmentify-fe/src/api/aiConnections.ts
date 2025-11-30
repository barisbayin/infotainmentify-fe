import { http } from "./http";

export type UserAiConnectionListDto = {
    id: number;
    name: string;
    provider: string; // Enum string olarak geliyor
    createdAt: string;
};

export type UserAiConnectionDetailDto = {
    id: number;
    name: string;
    provider: string;
    maskedApiKey: string; // "****"
    extraId?: string;
};

export type SaveUserAiConnectionDto = {
    name: string;
    provider: string;
    apiKey: string; // Raw key (gönderirken)
    extraId?: string;
};

// Provider Listesi (Dropdown için)
export const AI_PROVIDERS = [
    { value: "OpenAI", label: "OpenAI (GPT / DALL-E / TTS)" },
    { value: "GoogleVertex", label: "Google Vertex AI (Gemini)" },
    { value: "ElevenLabs", label: "ElevenLabs (Ses)" },
    { value: "StabilityAI", label: "Stability AI (Görsel)" },
    { value: "RunwayML", label: "Runway (Video)" },
    { value: "LumaDreamMachine", label: "Luma (Video)" },
];

export const aiConnectionsApi = {
    list() {
        return http<UserAiConnectionListDto[]>("/api/ai-connections");
    },

    get(id: number) {
        return http<UserAiConnectionDetailDto>(`/api/ai-connections/${id}`);
    },

    create(dto: SaveUserAiConnectionDto) {
        return http<{ id: number }>(`/api/ai-connections`, {
            method: "POST",
            body: JSON.stringify(dto),
        });
    },

    update(id: number, dto: SaveUserAiConnectionDto) {
        return http<void>(`/api/ai-connections/${id}`, {
            method: "PUT",
            body: JSON.stringify(dto),
        });
    },

    delete(id: number) {
        return http<void>(`/api/ai-connections/${id}`, { method: "DELETE" });
    },
};