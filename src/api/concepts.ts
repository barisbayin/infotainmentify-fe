import { http } from "./http";

export type ConceptListDto = {
    id: number;
    name: string;
    description?: string;
    createdAt: string;
    // İleride buraya "templateCount" vs. eklenebilir
};

export type SaveConceptDto = {
    name: string;
    description?: string;
};

export const conceptsApi = {
    list(q?: string) {
        const p = new URLSearchParams();
        if (q) p.set("q", q);
        return http<ConceptListDto[]>(`/api/concepts?${p.toString()}`);
    },

    get(id: number) {
        // Detay DTO ile Save DTO aynı yapıda olabilir (Concept basit olduğu için)
        return http<ConceptListDto>(`/api/concepts/${id}`);
    },

    create(dto: SaveConceptDto) {
        return http<{ id: number }>(`/api/concepts`, {
            method: "POST",
            body: JSON.stringify(dto),
        });
    },

    update(id: number, dto: SaveConceptDto) {
        return http<void>(`/api/concepts/${id}`, {
            method: "PUT",
            body: JSON.stringify(dto),
        });
    },

    delete(id: number) {
        return http<void>(`/api/concepts/${id}`, { method: "DELETE" });
    },
};