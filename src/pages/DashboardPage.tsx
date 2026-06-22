import { useEffect, useState } from "react";
import {
  dashboardApi,
  type DashboardStats,
  type RecentActivity,
} from "../api/dashboard";
import { useNavigate } from "react-router-dom";
import {
  Page,
  PageHeader,
  Card,
  Button,
  Badge,
  Table,
  THead,
  TR,
  TH,
  TD,
} from "../components/ui-kit";
import {
  Activity,
  Zap,
  Layers,
  AlertTriangle,
  Play,
  Plus,
  ArrowUpRight,
  Cpu,
} from "lucide-react";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const [s, a] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getRecentActivity(),
        ]);
        setStats(s);
        setActivities(a);
      } catch (error) {
        console.error("Dashboard data failed", error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Selamlama Mesajı (Sabah/Akşam)
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Günaydın";
    if (hour < 18) return "Tünaydın";
    return "İyi Akşamlar";
  };

  return (
    <Page>
      <PageHeader
        title={`${getGreeting()}, Barış 👋`}
        subtitle="İçerik fabrikanda işler yolunda görünüyor."
        action={
          <div className="flex gap-2">
            <Button
              onClick={() => navigate("/topics")}
              variant="secondary"
              className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white"
            >
              <Plus size={16} className="mr-2" /> Yeni Fikir
            </Button>
            <Button
              onClick={() => navigate("/pipeline-runs")}
              className="bg-indigo-600 hover:bg-indigo-500 text-white border-none shadow-lg shadow-indigo-500/20"
            >
              <Play size={16} className="mr-2" /> Üretim Başlat
            </Button>
          </div>
        }
      />

      {/* --- KPI KARTLARI (Üst Satır) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <KpiCard
          title="Aktif Üretim"
          value={stats?.activeRuns ?? 0}
          icon={Activity}
          color="indigo"
          subtext="Şu an işleniyor"
        />
        <KpiCard
          title="Toplam Fikir"
          value={stats?.totalTopics ?? 0}
          icon={Zap}
          color="amber"
          subtext="Havuzdaki fikirler"
        />
        <KpiCard
          title="Tamamlanan"
          value={stats?.totalRuns ?? 0}
          icon={Layers}
          color="emerald"
          subtext="Bugüne kadar"
        />
        <KpiCard
          title="Hatalı"
          value={stats?.failedRuns ?? 0}
          icon={AlertTriangle}
          color="rose"
          subtext="İlgilenilmesi gereken"
        />
      </div>

      {/* --- ANA İÇERİK (8-4 Grid) --- */}
      <div className="grid grid-cols-12 gap-6 mt-6 h-full min-h-0">
        {/* SOL: SON AKTİVİTELER (8 Birim) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <Card className="flex-1 flex flex-col border-zinc-800 bg-zinc-900/40 backdrop-blur-xl p-0 overflow-hidden">
            <div className="p-5 border-b border-zinc-800/50 flex justify-between items-center">
              <h3 className="font-semibold text-zinc-100">
                Son Üretim Aktiviteleri
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/pipeline-runs")}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                Tümünü Gör
              </Button>
            </div>

            <div className="overflow-x-auto">
              <Table className="border-none w-full">
                <THead>
                  <TR className="bg-zinc-900/50">
                    <TH>İşlem</TH>
                    <TH>Tip</TH>
                    <TH>Durum</TH>
                    <TH className="text-right">Zaman</TH>
                  </TR>
                </THead>
                <tbody>
                  {loading ? (
                    <TR>
                      <TD
                        colSpan={4}
                        className="text-center py-8 text-zinc-500"
                      >
                        Yükleniyor...
                      </TD>
                    </TR>
                  ) : activities.length === 0 ? (
                    <TR>
                      <TD
                        colSpan={4}
                        className="text-center py-8 text-zinc-500"
                      >
                        Henüz aktivite yok.
                      </TD>
                    </TR>
                  ) : (
                    activities.map((act) => (
                      <TR
                        key={act.id}
                        className="border-b border-zinc-800/30 hover:bg-zinc-800/20"
                      >
                        <TD className="font-medium text-zinc-300">
                          {act.title}
                        </TD>
                        <TD>
                          <Badge variant="neutral" className="scale-90">
                            {act.type}
                          </Badge>
                        </TD>
                        <TD>{getStatusBadge(act.status)}</TD>
                        <TD className="text-right text-zinc-500 text-xs font-mono">
                          {new Date(act.date).toLocaleTimeString("tr-TR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TD>
                      </TR>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </Card>
        </div>

        {/* SAĞ: SİSTEM & QUICK ACTIONS (4 Birim) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          {/* Sistem Durumu Kartı */}
          <Card className="border-zinc-800 bg-zinc-900/60 p-5">
            <h3 className="font-semibold text-zinc-100 mb-4 flex items-center gap-2">
              <Cpu size={18} className="text-indigo-400" /> Sistem Durumu
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">AI Motoru</span>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-medium text-emerald-400">
                    Online
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">API Latency</span>
                <span className="text-xs font-mono text-zinc-300">124ms</span>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-zinc-400">
                    Storage (Render)
                  </span>
                  <span className="text-xs text-zinc-500">45%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 w-[45%] rounded-full" />
                </div>
              </div>
            </div>
          </Card>

          {/* Hızlı Erişim */}
          <Card className="border-zinc-800 bg-zinc-900/60 p-5 flex-1">
            <h3 className="font-semibold text-zinc-100 mb-4 flex items-center gap-2">
              <ArrowUpRight size={18} className="text-zinc-400" /> Hızlı Erişim
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <QuickAction
                title="Topic Presets"
                onClick={() => navigate("/topic-presets")}
              />
              <QuickAction
                title="Script Presets"
                onClick={() => navigate("/script-presets")}
              />
              <QuickAction
                title="Image Presets"
                onClick={() => navigate("/image-presets")}
              />
              <QuickAction
                title="Video Presets"
                onClick={() => navigate("/video-presets")}
              />
              <QuickAction
                title="Render Presets"
                onClick={() => navigate("/render-presets")}
              />
              <QuickAction
                title="Bağlantılar"
                onClick={() => navigate("/ai-connections")}
              />
            </div>
          </Card>
        </div>
      </div>
    </Page>
  );
}

// --- ALT BİLEŞENLER ---

function KpiCard({ title, value, icon: Icon, color, subtext }: any) {
  const colors: any = {
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur p-5 relative overflow-hidden group hover:border-zinc-700 transition-all">
      <div className={`absolute top-4 right-4 p-2 rounded-lg ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div className="relative z-10">
        <p className="text-sm font-medium text-zinc-500">{title}</p>
        <h2 className="text-3xl font-bold text-white mt-2">{value}</h2>
        <p className="text-xs text-zinc-600 mt-1">{subtext}</p>
      </div>
      {/* Glow Effect */}
      <div
        className={`absolute -bottom-6 -left-6 w-24 h-24 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity ${colors[
          color
        ]
          .split(" ")[0]
          .replace("/10", "")}`}
      />
    </Card>
  );
}

function QuickAction({ title, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center p-3 rounded-lg border border-zinc-800 bg-zinc-950/50 hover:bg-zinc-800 hover:border-zinc-700 hover:text-white text-zinc-400 text-xs font-medium transition-all"
    >
      {title}
    </button>
  );
}

function getStatusBadge(status: string) {
  switch (status) {
    case "Running":
      return (
        <Badge variant="warning" className="animate-pulse">
          Çalışıyor
        </Badge>
      );
    case "Completed":
      return <Badge variant="success">Tamamlandı</Badge>;
    case "Failed":
      return <Badge variant="error">Hata</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}
