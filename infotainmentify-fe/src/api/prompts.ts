import { http } from "./http";
import type { Prompt } from "./types";

export type PromptDetailDto = Omit<Prompt, "createdAt" | "updatedAt"> & { id: number };

function savePrompt(dto: PromptDetailDto) {
    return http<{ id: number }>(`/api/prompts/save`, {
        method: "POST",
        body: JSON.stringify(dto),
    });
}

export const promptsApi = {
    list(q?: string, category?: string, active?: boolean) {
        const p = new URLSearchParams();
        if (q) p.set("q", q);
        if (category) p.set("category", category);
        if (active !== undefined) p.set("active", String(active));
        p.set("_ts", String(Date.now()));
        return http<Prompt[]>(`/api/prompts?${p.toString()}`);
    },
    get(id: number) {
        return http<Prompt>(`/api/prompts/${id}`);
    },
    create(dto: Omit<Prompt, "id">) {
        return savePrompt({ id: 0, ...dto });
    },
    update(id: number, dto: Omit<Prompt, "id">) {
        return savePrompt({ id, ...dto }).then(() => undefined);
    },
    delete(id: number) {
        return http<void>(`/api/prompts/${id}`, { method: "DELETE" });
    },
};
