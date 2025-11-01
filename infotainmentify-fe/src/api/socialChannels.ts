import { http } from "./http";

// -------------------------
// DTO Tipleri
// -------------------------
export type SocialChannelType =
    | "YouTube"
    | "Instagram"
    | "TikTok"
    | "Twitter"
    | "Other";

export interface UserSocialChannelListDto {
    id: number;
    channelType: SocialChannelType;
    channelName: string;
    channelHandle?: string | null;
    channelUrl?: string | null;
}

export interface UserSocialChannelDetailDto {
    id: number;
    channelType: SocialChannelType;
    channelName: string;
    channelHandle?: string | null;
    channelUrl?: string | null;
    platformChannelId?: string | null;
    tokens?: Record<string, any> | null;
    tokenExpiresAt?: string | null;
    scopes?: string | null;
}

// -------------------------
// Ana API Nesnesi
// -------------------------
export const socialChannelsApi = {
    // Listeleme
    list() {
        return http<UserSocialChannelListDto[]>("/api/social-channels");
    },

    // Detay
    get(id: number) {
        return http<UserSocialChannelDetailDto>(`/api/social-channels/${id}`);
    },

    // Yeni oluştur
    create(dto: Omit<UserSocialChannelDetailDto, "id">) {
        return http<{ id: number }>("/api/social-channels", {
            method: "POST",
            body: JSON.stringify(dto),
        });
    },

    // Güncelle
    update(id: number, dto: Omit<UserSocialChannelDetailDto, "id">) {
        return http<void>(`/api/social-channels/${id}`, {
            method: "PUT",
            body: JSON.stringify(dto),
        });
    },

    // Sil
    delete(id: number) {
        return http<void>(`/api/social-channels/${id}`, { method: "DELETE" });
    },
};
