import {
    Home, FileText, Sparkles, Settings, ListChecks, Cpu, Shield,
    BookOpen, Award, Video, Cast, Film, Layers, Zap, FolderOpen, Image, Mic2, Speech, LayoutTemplate
} from "lucide-react";

export const MENU_CONFIG = [
    {
        key: "genel",
        title: "GENEL BAKIŞ",
        icon: Home,
        items: [{ to: "/dashboard", label: "Kontrol Paneli", icon: Home }],
    },
    {
        key: "icerik",
        title: "İÇERİK FABRİKASI",
        icon: Sparkles,
        items: [
            { to: "/concepts", label: "Konseptler & Markalar", icon: FolderOpen },
            { to: "/topics", label: "Fikir Havuzu (Topics)", icon: Zap },
            { to: "/scripts", label: "Senaryolar", icon: BookOpen },
            { to: "/prompts", label: "Prompt Kütüphanesi", icon: FileText },
            { to: "/topic-presets", label: "Konu Ayarları", icon: Settings },
            { to: "/script-presets", label: "Senaryo Ayarları", icon: Award },
            { to: "/tts-presets", label: "TTS Ayarları", icon: Speech },
            { to: "/stt-presets", label: "STT Ayarları", icon: Mic2 },
            { to: "/image-presets", label: "AI Görsel Ayarları", icon: Image },
            { to: "/video-presets", label: "AI Video Ayarları", icon: Cast },
        ],
    },
    {
        key: "video",
        title: "VİDEO STÜDYOSU",
        icon: Video,
        items: [
            { to: "/pipeline-runs", label: "Üretim Hattı (Pipeline)", icon: Layers },
            { to: "/pipeline-templates", label: "Üretim Hattı Şablonları", icon: LayoutTemplate },
            { to: "/render-presets", label: "Render Ayarları", icon: Film },
            { to: "/assets", label: "Medya Dosyaları", icon: Film },
        ],
    },
    {
        key: "yonetim",
        title: "SİSTEM & AYARLAR",
        icon: Settings,
        items: [
            { to: "/social-channels", label: "Sosyal Hesaplar", icon: Settings },
            { to: "/ai-connections", label: "AI Bağlantıları", icon: Cpu },
            { to: "/users", label: "Kullanıcılar", icon: Shield },
        ],
    },
];