import { http } from "./http";

// Liste DTO
export type UserAiConnectionListDto = {
    id: number;
    name: string;
    provider: string;
    textModel: string;
    imageModel: string;
    videoModel: string;
    temperature: number;
};

// Backend artık STRING gönderiyor → FE'de de STRING olacak
export type UserAiConnectionDetailDto = UserAiConnectionListDto & {
    credentials?: string | null;   // <-- ARTIK STRING
};

// -------------------------
// Yardımcı Save fonksiyonu
// -------------------------
function saveIntegration(dto: UserAiConnectionDetailDto) {
    const isUpdate = dto.id && dto.id > 0;
    const url = isUpdate
        ? `/api/ai-integrations/${dto.id}`
        : `/api/ai-integrations`;

    return http<{ id: number }>(url, {
        method: isUpdate ? "PUT" : "POST",
        body: JSON.stringify(dto),
    });
}

// -------------------------
// Ana API Nesnesi
// -------------------------
export const aiIntegrationsApi = {
    // Liste
    list() {
        return http<UserAiConnectionListDto[]>(`/api/ai-integrations`);
    },

    // Detay
    get(id: number) {
        return http<UserAiConnectionDetailDto>(`/api/ai-integrations/${id}`);
    },

    // Yeni oluştur
    create(dto: Omit<UserAiConnectionDetailDto, "id">) {
        return saveIntegration({ id: 0, ...dto });
    },

    // Güncelle
    update(id: number, dto: Omit<UserAiConnectionDetailDto, "id">) {
        return saveIntegration({ id, ...dto }).then(() => undefined);
    },

    // Sil
    delete(id: number) {
        return http<void>(`/api/ai-integrations/${id}`, { method: "DELETE" });
    },
};
