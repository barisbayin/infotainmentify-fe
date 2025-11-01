// src/constants/socialOptions.ts
import { Youtube, Instagram, X, Globe, Music } from "lucide-react";
import type { SocialChannelType } from "../api/types";

export const SOCIAL_CHANNEL_OPTIONS: {
    value: SocialChannelType;
    label: string;
    icon: any;
    color: string;
}[] = [
        { value: "YouTube", label: "YouTube", icon: Youtube, color: "text-red-600" },
        { value: "Instagram", label: "Instagram", icon: Instagram, color: "text-pink-500" },
        { value: "TikTok", label: "TikTok", icon: Music, color: "text-fuchsia-600" },
        { value: "Twitter", label: "X (Twitter)", icon: X, color: "text-neutral-800" },
        { value: "Other", label: "Diğer", icon: Globe, color: "text-neutral-500" },
    ];
