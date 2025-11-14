import { http } from "./http";

/* -------------------------------
   🧩 Asset Generation API
--------------------------------*/
export const assetGeneratorApi = {
    // 🎨 Sadece sahne bazlı görselleri üret
    generateImages(scriptId: number) {
        return http<void>(`/api/assetgeneration/generate-images/${scriptId}`, {
            method: "POST",
        });
    },

    // 🎤 Sadece sahne bazlı sesleri üret (TTS)
    generateAudios(scriptId: number) {
        return http<void>(`/api/assetgeneration/generate-audios/${scriptId}`, {
            method: "POST",
        });
    },

    // 🎬 Tüm üretim adımlarını (Assets + Video + VideoAsset kayıtları) çalıştır
    generateFull(scriptId: number) {
        return http<void>(`/api/assetgeneration/generate-full/${scriptId}`, {
            method: "POST",
        });
    },
};
