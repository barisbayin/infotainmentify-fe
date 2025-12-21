import { lazy, type ComponentType } from "react";

// 1. ELİMİZDE KESİN OLANLAR (Bunları import ediyoruz)
const PromptsPage = lazy(() => import("./pages/PromptsPage"));
const BlankPage = lazy(() => import("./pages/BlankPageTemplate"));
const TopicsPage = lazy(() => import("./pages/TopicsPage"));
const AiConnectionsPage = lazy(() => import("./pages/AiConnectionsPage"));
const SocialChannelsPage = lazy(() => import("./pages/SocialChannelsPage"));
const ConceptsPage = lazy(() => import("./pages/ConceptsPage"));
const ScriptsPage = lazy(() => import("./pages/ScriptListPage"));
const TopicPresetsPage = lazy(() => import("./pages/TopicPresetsPage"));
const ScriptPresetsPage = lazy(() => import("./pages/ScriptPresetsPage"));
const ImagePresetsPage = lazy(() => import("./pages/ImagePresetsPage"));
const TtsPresetsPage = lazy(() => import("./pages/TtsPresetsPage"));
const RenderPresetsPage = lazy(() => import("./pages/RenderPresetsPage"));
const VideoPresetsPage = lazy(() => import("./pages/VideoPresetsPage"));
const SttPresetsPage = lazy(() => import("./pages/SttPresetsPage"));
const PipelineTemplatesPage = lazy(
  () => import("./pages/PipelineTemplatesPage")
);
const PipelineRunsPage = lazy(() => import("./pages/PipelineRunsPage"));
const AssetsPage = lazy(() => import("./pages/AssetsPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));

// 2. HENÜZ OLMAYANLAR (Dosyayı import etme, direkt BlankPage değişkenini kullan)
// const DashboardPage = lazy(() => import("./pages/DashboardPage")); // ❌ BU DOSYA YOKSA PATLAR!

const PipelineHistoryPage = lazy(() => import("./pages/PipelineHistoryPage"));

export interface AppRoute {
  path: string;
  element: ComponentType;
}

export const routes: AppRoute[] = [
  // --- MEVCUT SAYFALAR ---
  { path: "/dashboard", element: DashboardPage },
  { path: "/prompts", element: PromptsPage },
  { path: "/topics", element: TopicsPage },
  { path: "/ai-connections", element: AiConnectionsPage },
  { path: "/social-channels", element: SocialChannelsPage },
  { path: "/concepts", element: ConceptsPage },
  { path: "/scripts", element: ScriptsPage },
  { path: "/topic-presets", element: TopicPresetsPage },
  { path: "/script-presets", element: ScriptPresetsPage },
  { path: "/image-presets", element: ImagePresetsPage },
  { path: "/tts-presets", element: TtsPresetsPage },
  { path: "/render-presets", element: RenderPresetsPage },
  { path: "/video-presets", element: VideoPresetsPage },
  { path: "/stt-presets", element: SttPresetsPage },
  { path: "/pipeline-templates", element: PipelineTemplatesPage },
  { path: "/pipeline-runs", element: PipelineRunsPage },
  { path: "/pipeline-history", element: PipelineHistoryPage }, // 🔥 EKLENDİ
  { path: "/assets", element: AssetsPage },

  // --- GEÇİCİ SAYFALAR (Hepsi BlankPage'e gider) ---
  // Dashboard dosyası olmadığı için BlankPage kullanıyoruz

  { path: "/users", element: BlankPage },
  { path: "/job-settings", element: BlankPage },
  { path: "/job-executions", element: BlankPage },
];
