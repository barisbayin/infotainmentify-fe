import { useEffect, useState } from "react";
import {
  dashboardApi,
  type DashboardStats,
  type RecentActivity,
} from "../api/dashboard";
import { useNavigate } from "react-router-dom";
import {
  Page,
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
  Monitor,
  TrendingUp,
  Calendar,
  MoreHorizontal
} from "lucide-react";

export default function Dashboard() {
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return "İyi Geceler";
    if (hour < 12) return "Günaydın";
    if (hour < 18) return "Tünaydın";
    return "İyi Akşamlar";
  };

  return (
    <Page>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
           <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
             {getGreeting()}, Barış
           </h1>
           <p className="text-zinc-400 mt-1 flex items-center gap-2">
             <Calendar size={14} /> 
             {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
           </p>
        </div>
        <div className="flex gap-2">
            <Button
              onClick={() => navigate("/pipeline-runs")}
              className="bg-indigo-600 hover:bg-indigo-500 text-white border-none shadow-lg shadow-indigo-500/20 px-6"
            >
              <Play size={18} className="mr-2 fill-current" /> Üretimi Başlat
            </Button>
        </div>
      </div>

      {/* Main Grid Layout (Bento Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-6">
        
        {/* KPI: Aktif Üretim */}
        <KpiCard
          title="Aktif Üretim"
          value={stats?.activeRuns ?? 0}
          icon={Activity}
          gradient="from-indigo-500/20 to-violet-500/5"
          border="border-indigo-500/20"
          text="text-indigo-400"
          trend="+24%"
        />

        {/* KPI: Konsept Havuzu */}
        <KpiCard
          title="Konsept Havuzu"
          value={stats?.totalTopics ?? 0}
          icon={Zap}
          gradient="from-amber-500/20 to-orange-500/5"
          border="border-amber-500/20"
          text="text-amber-400"
          trend="+12 Video"
        />

        {/* KPI: Tamamlanan */}
        <KpiCard
          title="Tamamlanan"
          value={stats?.totalRuns ?? 0}
          icon={Layers}
          gradient="from-emerald-500/20 to-teal-500/5"
          border="border-emerald-500/20"
          text="text-emerald-400"
          trend="Başarılı"
        />

        {/* KPI: Hata Oranı */}
        <KpiCard
          title="Hata Durumu"
          value={stats?.failedRuns ?? 0}
          icon={AlertTriangle}
          gradient="from-rose-500/20 to-red-500/5"
          border="border-rose-500/20"
          text="text-rose-400"
          trend="Stabil"
        />

        {/* --- ORTA BLOK (Chart & Stats) --- */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 row-span-2">
             <Card className="h-full flex flex-col border-zinc-800 bg-zinc-900/40 backdrop-blur-xl p-0">
                <div className="p-5 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                            <TrendingUp size={18} className="text-indigo-400"/>
                        </div>
                        <div>
                            <h3 className="font-semibold text-zinc-100">Son Aktiviteler</h3>
                            <p className="text-xs text-zinc-500">Otomatik üretim günlüğü</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate("/pipeline-runs")} className="text-xs">
                        Tümünü Gör <ArrowUpRight size={14} className="ml-1"/>
                    </Button>
                </div>
                
                <div className="flex-1 overflow-x-auto p-2">
                     <Table className="border-none w-full">
                        <THead>
                          <TR className="bg-transparent border-b border-zinc-800/30">
                            <TH className="text-xs font-semibold text-zinc-500">İŞLEM</TH>
                            <TH className="text-xs font-semibold text-zinc-500">TİP</TH>
                            <TH className="text-xs font-semibold text-zinc-500 text-center">DURUM</TH>
                            <TH className="text-xs font-semibold text-zinc-500 text-right">ZAMAN</TH>
                          </TR>
                        </THead>
                        <tbody>
                          {loading ? (
                             <TR><TD colSpan={4} className="text-center py-10 text-zinc-500">Yükleniyor...</TD></TR>
                          ) : activities.length === 0 ? (
                             <TR><TD colSpan={4} className="text-center py-10 text-zinc-500">Kayıt bulunamadı.</TD></TR>
                          ) : (
                             activities.map((act) => (
                                <TR key={act.id} className="border-b border-zinc-800/20 hover:bg-white/5 transition-colors">
                                   <TD className="font-medium text-zinc-300 py-3">
                                       <div className="flex items-center gap-3">
                                           <div className={`w-2 h-2 rounded-full ${getStatusDotColor(act.status)}`} />
                                           {act.title}
                                       </div>
                                   </TD>
                                   <TD className="py-3">
                                       <Badge variant="neutral" className="bg-zinc-800/50 text-zinc-400 border-zinc-700/50 text-[10px]">
                                           {act.type}
                                       </Badge>
                                   </TD>
                                   <TD className="text-center py-3">{getStatusBadge(act.status)}</TD>
                                   <TD className="text-right text-zinc-500 text-xs font-mono py-3">
                                       {new Date(act.date).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                                   </TD>
                                </TR>
                             ))
                          )}
                        </tbody>
                     </Table>
                </div>
             </Card>
        </div>

        {/* --- SAĞ BLOK (Quick Actions & Status) --- */}
        <div className="col-span-1 md:col-span-2 lg:col-span-1 row-span-2 flex flex-col gap-4">
             {/* Quick Actions */}
             <Card className="border-zinc-800 bg-zinc-900/40 p-4">
                 <h3 className="text-sm font-semibold text-zinc-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <Zap size={14} /> Hızlı Erişim
                 </h3>
                 <div className="grid grid-cols-2 gap-2">
                     <QuickActionBtn title="Yeni Fikir" onClick={() => navigate("/topics")} icon={Plus} />
                     <QuickActionBtn title="Şablonlar" onClick={() => navigate("/pipeline-templates")} icon={Layers} />
                     <QuickActionBtn title="Presets" onClick={() => navigate("/video-presets")} icon={Monitor} />
                     <QuickActionBtn title="Ayarlar" onClick={() => navigate("/assets")} icon={MoreHorizontal} />
                 </div>
             </Card>

             {/* System Health */}
             <Card className="flex-1 border-zinc-800 bg-zinc-900/40 p-4 flex flex-col justify-between">
                 <div>
                    <h3 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                        <Cpu size={14} /> Sistem
                    </h3>
                    <div className="space-y-4">
                        <SystemMetric label="API Latency" value="45ms" status="good" />
                        <SystemMetric label="Render Queue" value="Idle" status="good" />
                        <SystemMetric label="Storage" value="64%" status="warning" />
                    </div>
                 </div>
                 <div className="mt-4 pt-4 border-t border-zinc-800/50">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Tüm Sistemler Normal
                    </div>
                 </div>
             </Card>
        </div>

      </div>
    </Page>
  );
}

// --- SUB COMPONENTS ---

function KpiCard({ title, value, icon: Icon, gradient, border, text, trend }: any) {
    return (
        <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${gradient} ${border} p-5 group transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl`}>
             <div className="flex justify-between items-start mb-4">
                 <div className={`p-2.5 rounded-xl bg-black/20 backdrop-blur-sm border border-white/5 ${text}`}>
                     <Icon size={22} />
                 </div>
                 {trend && (
                     <span className="text-[10px] font-medium bg-white/5 px-2 py-1 rounded-full text-zinc-300 border border-white/5">
                         {trend}
                     </span>
                 )}
             </div>
             <div>
                 <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">{title}</p>
                 <h2 className="text-3xl font-bold text-white mt-1 tabular-nums">{value}</h2>
             </div>
             
             {/* Background Decoration */}
             <Icon className={`absolute -right-4 -bottom-4 w-24 h-24 opacity-5 rotate-12 ${text} group-hover:scale-110 transition-transform duration-500`} />
        </div>
    )
}

function QuickActionBtn({ title, onClick, icon: Icon }: any) {
    return (
        <button 
           onClick={onClick}
           className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/50 hover:bg-zinc-800 hover:border-zinc-700 hover:text-white text-zinc-400 transition-all group"
        >
            <Icon size={18} className="group-hover:text-indigo-400 transition-colors" />
            <span className="text-[10px] font-medium">{title}</span>
        </button>
    )
}

function SystemMetric({ label, value, status }: any) {
    const colors: any = {
        good: "bg-emerald-500",
        warning: "bg-amber-500",
        danger: "bg-red-500"
    }
    return (
        <div className="flex justify-between items-center group">
            <span className="text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">{label}</span>
            <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-300">{value}</span>
                <div className={`w-1.5 h-1.5 rounded-full ${colors[status]}`} />
            </div>
        </div>
    )
}

function getStatusDotColor(status: string) {
    switch (status) {
      case "Running": return "bg-amber-500 animate-pulse";
      case "Completed": return "bg-emerald-500";
      case "Failed": return "bg-red-500";
      default: return "bg-zinc-500";
    }
}
  
function getStatusBadge(status: string) {
    switch (status) {
      case "Running":
        return <Badge variant="warning" className="animate-pulse">Çalışıyor</Badge>;
      case "Completed":
        return <Badge variant="success">Tamamlandı</Badge>;
      case "Failed":
        return <Badge variant="error">Hata</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
}
