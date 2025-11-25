import { http } from "./http";

export type Concept = {
    id: number;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

export type ConceptDetailDto = Omit<Concept, "createdAt" | "updatedAt"> & {
    id: number;
};

function saveConcept(dto: ConceptDetailDto) {
    return http<{ id: number }>(`/api/concepts/save`, {
        method: "POST",
        body: JSON.stringify(dto),
    });
}

export const conceptsApi = {
    list(q?: string, active?: boolean) {
        const p = new URLSearchParams();
        if (q) p.set("q", q);
        if (active !== undefined) p.set("active", String(active));
        p.set("_ts", String(Date.now()));
        return http<Concept[]>(`/api/concepts?${p.toString()}`);
    },

    get(id: number) {
        return http<Concept>(`/api/concepts/${id}`);
    },

    create(dto: Omit<Concept, "id">) {
        // id=0 → create
        return saveConcept({ id: 0, ...dto });
    },

    update(id: number, dto: Omit<Concept, "id">) {
        // id>0 → update
        return saveConcept({ id, ...dto }).then(() => undefined);
    },

    delete(id: number) {
        return http<void>(`/api/concepts/${id}`, { method: "DELETE" });
    },
};
