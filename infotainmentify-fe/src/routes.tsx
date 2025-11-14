// src/routes.tsx
import PromptsPage from "./pages/PromptsPage";
import DashboardPage from "./pages/DashboardPage";
import TopicsPage from "./pages/TopicsPage";
// import TopicsGeneratorPage from "./pages/TopicsGeneratorPage";
import BlankPageTemplate from "./pages/BlankPageTemplate";
import AiIntegrationsPage from "./pages/AiIntegrationsPage";
import SocialChannelsPage from "./pages/SocialChannelsPage";
import TopicGenerationProfilesPage from "./pages/TopicGenerationProfilesPage";
import JobSettingsPage from "./pages/JobSettingsPage";
import JobExecutionsPage from "./pages/JobExecutionsPage";
import ScriptListPage from "./pages/ScriptListPage";
import ScriptGenerationProfilesPage from "./pages/ScriptGenerationProfilesPage";
import VideoAssetsPage from "./pages/VideoAssetsPage";
import AutoVideoAssetProfilesPage from "./pages/AutoVideoAssetProfilesPage";
import AutoVideoAssetsPage from "./pages/AutoVideoAssetsPage";

export const routes = [
  { path: "/dashboard", element: DashboardPage },
  { path: "/prompts", element: PromptsPage },
  { path: "/topics", element: TopicsPage },
  // { path: "/generator", element: TopicsGeneratorPage },
  { path: "/generate", element: BlankPageTemplate },
  { path: "/plugins", element: BlankPageTemplate },
  { path: "/ai-integrations", element: AiIntegrationsPage },
  { path: "/social-channels", element: SocialChannelsPage },
  { path: "/topic-generation-profiles", element: TopicGenerationProfilesPage },
  { path: "/job-settings", element: JobSettingsPage },
  { path: "/job-executions", element: JobExecutionsPage },
  { path: "/scripts", element: ScriptListPage },
  {
    path: "/script-generation-profiles",
    element: ScriptGenerationProfilesPage,
  },
  { path: "/video-assets", element: VideoAssetsPage },
  { path: "/auto-video-asset-profiles", element: AutoVideoAssetProfilesPage },
  { path: "/auto-video-assets", element: AutoVideoAssetsPage },
];
