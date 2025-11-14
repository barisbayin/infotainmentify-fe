import { http } from "./http";

/* -------------------------------
   🎬 DTO Tanımları
--------------------------------*/
export interface VideoAssetListDto {
    id: number;
    scriptId: number;
    assetType: string;
    assetKey: string;
    filePath: string;
    isGenerated: boolean;
    isUploaded: boolean;
    generatedAt?: string | null;
    uploadedAt?: string | null;
}

export interface VideoAssetDetailDto extends VideoAssetListDto {
    metadataJson?: string | null;
}

/* -------------------------------
   ⚙️ API Nesnesi
--------------------------------*/
export const videoAssetsApi = {
    // 🔹 Listeleme (filtrelerle)
    list(params?: {
        scriptId?: number;
        assetType?: string;
        from?: string;
        to?: string;
    }) {
        const query = new URLSearchParams();
        if (params?.scriptId) query.append("scriptId", params.scriptId.toString());
        if (params?.assetType) query.append("assetType", params.assetType);
        if (params?.from) query.append("from", params.from);
        if (params?.to) query.append("to", params.to);
        const qs = query.toString() ? `?${query.toString()}` : "";
        return http<VideoAssetListDto[]>(`/api/videoassets${qs}`);
    },

    // 🔹 Detay
    get(id: number) {
        return http<VideoAssetDetailDto>(`/api/videoassets/${id}`);
    },

    // 🔹 Silme
    delete(id: number) {
        return http<void>(`/api/videoassets/${id}`, { method: "DELETE" });
    },

    // 🔹 (Opsiyonel) Yeniden Yükleme veya İşaretleme gibi ileri işlemler için placeholder
    markUploaded(id: number) {
        return http<void>(`/api/videoassets/${id}/mark-uploaded`, { method: "POST" });
    },
};
