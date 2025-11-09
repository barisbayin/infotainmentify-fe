import { useEffect, useState, type JSX } from "react";
import {
  Page,
  Card,
  Toolbar,
  Table,
  THead,
  TR,
  TH,
  TD,
  Button,
} from "../components/ui-kit";
import SelectBox from "../components/SelectBox";
import toast from "react-hot-toast";
import { jobExecutionsApi } from "../api/jobExecutions";
import { jobsApi } from "../api/jobs";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { getSignalRConnection } from "../lib/signalr"; // ✅ eklendi

/* ---------- Tipler ---------- */
interface JobExecutionListDto {
  id: number;
  jobId: number;
  jobName: string;
  status: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
}

interface JobOption {
  value: string;
  label: string;
}

/* ---------- Durum ikon + renk ---------- */
const STATUS_STYLES: Record<
  string,
  { color: string; icon: JSX.Element; label: string }
> = {
  Pending: {
    color: "text-gray-500",
    icon: <Clock size={16} />,
    label: "Bekliyor",
  },
  Running: {
    color: "text-blue-500",
    icon: <Loader2 size={16} className="animate-spin" />,
    label: "Çalışıyor",
  },
  Success: {
    color: "text-green-600",
    icon: <CheckCircle size={16} />,
    label: "Başarılı",
  },
  Failed: {
    color: "text-red-500",
    icon: <XCircle size={16} />,
    label: "Hatalı",
  },
};

/* ---------- Yardımcı Fonksiyon ---------- */
function formatDate(date?: string) {
  if (!date) return "—";
  return new Date(date).toLocaleString("tr-TR");
}

function calcDuration(start?: string, end?: string) {
  if (!start) return "—";
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  const sec = Math.round((e - s) / 1000);
  if (sec < 60) return `${sec} sn`;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${min} dk ${rem} sn`;
}

/* ---------- Ana Component ---------- */
export default function JobExecutionsPage() {
  const [jobOptions, setJobOptions] = useState<JobOption[]>([]);
  const [jobId, setJobId] = useState<string>("");
  const [items, setItems] = useState<JobExecutionListDto[]>([]);
  const [loading, setLoading] = useState(false);

  /* --- Job filtreleri yükle --- */
  async function loadJobs() {
    try {
      const jobs = await jobsApi.listSettings();
      setJobOptions(
        jobs.map((x: any) => ({
          value: String(x.id),
          label: `${x.id} — ${x.name}`,
        }))
      );
    } catch {
      toast.error("Job listesi alınamadı");
    }
  }

  /* --- Execution listesi --- */
  async function loadExecutions() {
    setLoading(true);
    try {
      const list = await jobExecutionsApi.list(
        jobId ? Number(jobId) : undefined
      );
      setItems(list);
    } catch {
      toast.error("Job execution listesi alınamadı");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, []);

  /* ✅ SignalR Event Listener */
  useEffect(() => {
    const conn = getSignalRConnection();
    if (!conn) return;

    const onJobCompleted = (data: any) => {
      toast.success(
        data.success
          ? `✅ Job #${data.jobId} tamamlandı!`
          : `❌ Job #${data.jobId} hata verdi: ${data.message ?? ""}`
      );

      // Eğer filtre aktif değilse veya o job gösteriliyorsa tabloyu yenile
      if (!jobId || String(data.jobId) === jobId) {
        loadExecutions();
      }
    };

    conn.on("jobCompleted", onJobCompleted);

    return () => {
      conn.off("jobCompleted", onJobCompleted);
    };
  }, [jobId]); // ✅ jobId değişince handler güncellenir

  useEffect(() => {
    loadExecutions();
    const t = setInterval(loadExecutions, 10_000);
    return () => clearInterval(t);
  }, [jobId]);

  /* --- Render --- */
  return (
    <Page>
      <Toolbar>
        <SelectBox
          label="Job Filtresi"
          value={jobId}
          onChange={(v) => setJobId(v)}
          options={[{ value: "", label: "Tüm Joblar" }, ...jobOptions]}
        />
        <Button onClick={loadExecutions} disabled={loading}>
          {loading ? "Yükleniyor…" : "Yenile"}
        </Button>
      </Toolbar>

      <Card className="mt-3 flex-1 overflow-auto">
        <Table>
          <THead>
            <TR>
              <TH>ID</TH>
              <TH>Job</TH>
              <TH>Durum</TH>
              <TH>Başlangıç</TH>
              <TH>Bitiş</TH>
              <TH>Süre</TH>
              <TH>Hata</TH>
            </TR>
          </THead>
          <tbody>
            {items.map((x) => {
              const st = STATUS_STYLES[x.status] || STATUS_STYLES.Pending;
              return (
                <TR
                  key={x.id}
                  className={`border-b hover:bg-neutral-50 ${
                    x.status === "Running" ? "animate-pulse bg-blue-50" : ""
                  }`}
                >
                  <TD>#{x.id}</TD>
                  <TD>{x.jobName ?? `#${x.jobId}`}</TD>
                  <TD>
                    <div className={`flex items-center gap-1 ${st.color}`}>
                      {st.icon}
                      <span>{st.label}</span>
                    </div>
                  </TD>
                  <TD className="text-xs">{formatDate(x.startedAt)}</TD>
                  <TD className="text-xs">{formatDate(x.completedAt)}</TD>
                  <TD className="text-xs">
                    {calcDuration(x.startedAt, x.completedAt)}
                  </TD>
                  <TD className="text-red-500 text-xs truncate max-w-[200px]">
                    {x.errorMessage ?? ""}
                  </TD>
                </TR>
              );
            })}
          </tbody>
        </Table>
      </Card>
    </Page>
  );
}
