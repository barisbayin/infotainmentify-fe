import { http } from "./http"; // Veya senin http dosyan neredeyse

// Backend DTO'larına karşılık gelen Tipler
export type PromptListDto = {
    id: number;
    name: string;
    description?: string;
    category?: string;
    language?: string;
    isActive: boolean;
    updatedAt?: string;
};

export type PromptDetailDto = {
    id: number;
    name: string;
    category?: string;
    language?: string;
    description?: string;
    isActive: boolean;
    body: string;
    systemPrompt?: string;
    createdAt: string;
};

export type SavePromptDto = {
    name: string;
    category?: string;
    language?: string;
    description?: string;
    isActive: boolean;
    body: string;
    systemPrompt?: string;
};

export const promptsApi = {
    list(q?: string, category?: string, active?: boolean) {
        const p = new URLSearchParams();
        if (q) p.set("q", q);
        if (category) p.set("category", category);
        if (active !== undefined) p.set("active", String(active));
        return http<PromptListDto[]>(`/api/prompts?${p.toString()}`);
    },

    get(id: number) {
        return http<PromptDetailDto>(`/api/prompts/${id}`);
    },

    create(dto: SavePromptDto) {
        return http<{ id: number; message: string }>("/api/prompts", {
            method: "POST",
            body: JSON.stringify(dto),
        });
    },

    update(id: number, dto: SavePromptDto) {
        return http<void>(`/api/prompts/${id}`, {
            method: "PUT", // Backend'de PUT yaptık
            body: JSON.stringify(dto),
        });
    },

    delete(id: number) {
        return http<void>(`/api/prompts/${id}`, { method: "DELETE" });
    },
};