import { http } from "./http"; // Veya senin http helper dosyan

export type TopicListDto = {
    id: number;
    title: string;
    premise: string;
    category?: string;
    series?: string;
    createdAt: string;
};

export type TopicDetailDto = {
    id: number;
    title: string;
    premise: string;
    languageCode: string;
    category?: string;
    subCategory?: string;
    series?: string;
    tagsJson?: string;
    tone?: string;
    renderStyle?: string;
    visualPromptHint?: string;
    createdAt: string;
    updatedAt?: string;
};

export type SaveTopicDto = {
    title: string;
    premise: string;
    languageCode: string;
    category?: string;
    subCategory?: string;
    series?: string;
    tagsJson?: string;
    tone?: string;
    renderStyle?: string;
    visualPromptHint?: string;
};

export const topicsApi = {
    list(q?: string, category?: string) {
        const p = new URLSearchParams();
        if (q) p.set("q", q);
        if (category) p.set("category", category);
        return http<TopicListDto[]>(`/api/topics?${p.toString()}`);
    },

    get(id: number) {
        return http<TopicDetailDto>(`/api/topics/${id}`);
    },

    create(dto: SaveTopicDto) {
        return http<{ id: number }>(`/api/topics`, {
            method: "POST",
            body: JSON.stringify(dto),
        });
    },

    update(id: number, dto: SaveTopicDto) {
        return http<void>(`/api/topics/${id}`, {
            method: "PUT",
            body: JSON.stringify(dto),
        });
    },

    delete(id: number) {
        return http<void>(`/api/topics/${id}`, { method: "DELETE" });
    },
};