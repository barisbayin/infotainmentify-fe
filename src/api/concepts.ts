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

export type ConceptProfileDto = {
    id?: number;
    conceptId: number;
    conceptName: string;
    exists: boolean;
    productionProfile: string;
    defaultLanguage: string;
    defaultPlatform: string;
    audience?: string;
    tone?: string;
    channelPromise?: string;
    visualStyleName?: string;
    visualStyleBible?: string;
    characterBible?: string;
    textPolicy?: string;
    contentRules?: string;
    defaultDurationSec?: number;
    defaultTemplateId?: number;
    defaultTemplateName?: string;
    defaultReviewPolicyJson?: string;
};

export type SaveConceptProfileDto = {
    productionProfile: string;
    defaultLanguage: string;
    defaultPlatform: string;
    audience?: string;
    tone?: string;
    channelPromise?: string;
    visualStyleName?: string;
    visualStyleBible?: string;
    characterBible?: string;
    textPolicy?: string;
    contentRules?: string;
    defaultDurationSec?: number;
    defaultTemplateId?: number;
    defaultReviewPolicyJson?: string;
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

    getProfile(id: number) {
        return http<ConceptProfileDto>(`/api/concepts/${id}/profile`);
    },

    saveProfile(id: number, dto: SaveConceptProfileDto) {
        return http<ConceptProfileDto>(`/api/concepts/${id}/profile`, {
            method: "PUT",
            body: JSON.stringify(dto),
        });
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
