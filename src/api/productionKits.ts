import { http } from "./http";

export type ProductionKitDto = {
    id: number;
    name: string;
    description: string;
    conceptId?: number | null;
    templateId?: number | null;
    conceptName?: string;
    templateName?: string;
    productionProfile: string;
    presetMapJson: string;
    reviewPolicyJson: string;
    healthSnapshotJson: string;
    createdAt: string;
    updatedAt?: string;
};

export type ProductionKitRequest = Omit<ProductionKitDto, "id" | "conceptName" | "templateName" | "createdAt" | "updatedAt">;

export const productionKitsApi = {
    list() {
        return http<ProductionKitDto[]>("/api/production-kits");
    },
    get(id: number) {
        return http<ProductionKitDto>(`/api/production-kits/${id}`);
    },
    create(dto: ProductionKitRequest) {
        return http<ProductionKitDto>("/api/production-kits", {
            method: "POST",
            body: JSON.stringify(dto),
        });
    },
    update(id: number, dto: ProductionKitRequest) {
        return http<ProductionKitDto>(`/api/production-kits/${id}`, {
            method: "PUT",
            body: JSON.stringify(dto),
        });
    },
    delete(id: number) {
        return http<{ message: string }>(`/api/production-kits/${id}`, { method: "DELETE" });
    },
};
