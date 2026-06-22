import { pipelineRunsApi } from "./pipelineRuns";
import { topicsApi } from "./topics";
// import { scriptsApi } from "./scripts";

// Dashboard verisi için özel tip
export type DashboardStats = {
    totalRuns: number;
    activeRuns: number;
    failedRuns: number;
    totalTopics: number;
    totalScripts: number;
};

export type RecentActivity = {
    id: number;
    title: string;
    type: "Run" | "Topic" | "Script";
    status: string;
    date: string;
};

export const dashboardApi = {
    // Mevcut API'lerden verileri çekip özet çıkarır
    async getStats(): Promise<DashboardStats> {
        // Paralel istek atalım ki hızlı olsun
        const [runs, topics] = await Promise.all([
            pipelineRunsApi.list(), // Backend'e List endpointi eklediğini varsayıyoruz
            topicsApi.list(),
            // scriptsApi.list() // Gerekirse eklersin
        ]);

        // İstatistikleri hesapla
        const activeRuns = runs.filter(r => r.status === "Running" || r.status === "Pending").length;
        const failedRuns = runs.filter(r => r.status === "Failed").length;

        return {
            totalRuns: runs.length,
            activeRuns,
            failedRuns,
            totalTopics: topics.length,
            totalScripts: 0 // Script listesi çekmedik, örnek olsun diye 0
        };
    },

    async getRecentActivity(): Promise<RecentActivity[]> {
        const runs = await pipelineRunsApi.list();
        // Son 5 işlemi al, formatla
        return runs
            .sort((a, b) => new Date(b.startedAt || "").getTime() - new Date(a.startedAt || "").getTime())
            .slice(0, 5)
            .map(r => ({
                id: r.id,
                title: r.templateName || `Pipeline #${r.id}`,
                type: "Run",
                status: r.status,
                date: r.startedAt || new Date().toISOString()
            }));
    }
};