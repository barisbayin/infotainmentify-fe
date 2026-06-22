import { http } from "./http";

// Asset Türleri (Backend Enum ile uyumlu string'ler)
export type AssetType = "Music" | "Font" | "Branding";

// Listeleme Ekranı için (Hafif Veri)
export type AssetListDto = {
    id: number;
    name: string;      // Kullanıcının gördüğü isim
    type: string;      // "Music", "Font" vb.
    url: string;       // Public URL (/files/...)
    sizeInfo: string;  // "2.5 MB"
};

// Detay ve Upload Sonrası Dönüş için (Tam Veri)
export type AssetDetailDto = {
    id: number;
    name: string;
    physicalName: string;
    type: string;
    url: string;
    sizeInfo: string;
    durationSec?: number; // Sadece müzikler için dolu gelir
    createdAt: string;
};

// Upload işlemi için gerekli parametreler
// (Backend 'AssetUploadDto' bekliyor ama bu FormData olarak gidecek)
export type UploadAssetParams = {
    file: File;
    type: AssetType;
};

export const assetsApi = {
    // 📂 Türüne göre dosyaları getir
    list(type: AssetType) {
        return http<AssetListDto[]>(`/api/assets/${type}`);
    },

    // ⬆️ Dosya Yükle (FormData kullanılır)
    upload(params: UploadAssetParams) {
        const formData = new FormData();
        formData.append("File", params.file);
        formData.append("Type", params.type);

        // Not: FormData gönderirken 'Content-Type' header'ını tarayıcı otomatik ayarlar.
        // http wrapper'ının body'ye FormData verildiğinde JSON.stringify yapmadığından emin olmalısın.
        return http<AssetDetailDto>("/api/assets/upload", {
            method: "POST",
            body: formData as any, // Wrapper tip hatası verirse 'as any' veya 'BodyInit' kullanılır
        });
    },

    // 🗑️ Dosya Sil
    delete(id: number) {
        return http<void>(`/api/assets/${id}`, { method: "DELETE" });
    },
};