import { http } from "./http";

export type SocialChannelListDto = {
    id: number;
    channelName: string;
    platform: string; // "YouTube", "Instagram" vs.
    channelUrl?: string;
    createdAt: string;
};

export type SocialChannelDetailDto = {
    id: number;
    channelName: string;
    platform: string;
    channelHandle?: string;
    channelUrl?: string;
    platformChannelId?: string;
    isTokenExpired: boolean;
    tokenExpiresAt?: string;
    scopes?: string;
    rawTokensJson?: string;
    encryptedTokensJson?: string;
};

export type SaveSocialChannelDto = {
    channelType: number; // Enum ID (1=YouTube, 2=Instagram...)
    channelName: string;
    channelHandle?: string;
    channelUrl?: string;
    platformChannelId?: string;
    rawTokensJson?: string; // JSON string (access_token vs.)
    scopes?: string;
};

// Enum Mapping (Backend Core.Enums.SocialChannelType ile uyumlu olmalı)
export const PLATFORMS = [
    { id: 1, label: "YouTube", color: "text-red-500", bg: "bg-red-500/10 border-red-500/20" },
    { id: 2, label: "Instagram", color: "text-pink-500", bg: "bg-pink-500/10 border-pink-500/20" },
    { id: 3, label: "TikTok", color: "text-zinc-200", bg: "bg-zinc-800 border-zinc-700" },
    { id: 4, label: "Facebook", color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
    { id: 5, label: "Twitter (X)", color: "text-sky-500", bg: "bg-sky-500/10 border-sky-500/20" },
    { id: 6, label: "LinkedIn", color: "text-blue-600", bg: "bg-blue-600/10 border-blue-600/20" },
];

export const socialChannelsApi = {
    list() {
        return http<SocialChannelListDto[]>("/api/social-channels");
    },

    get(id: number) {
        return http<SocialChannelDetailDto>(`/api/social-channels/${id}`);
    },

    create(dto: SaveSocialChannelDto) {
        return http<{ id: number }>(`/api/social-channels`, {
            method: "POST",
            body: JSON.stringify(dto),
        });
    },

    update(id: number, dto: SaveSocialChannelDto) {
        return http<void>(`/api/social-channels/${id}`, {
            method: "PUT",
            body: JSON.stringify(dto),
        });
    },

    delete(id: number) {
        return http<void>(`/api/social-channels/${id}`, { method: "DELETE" });
    },
};