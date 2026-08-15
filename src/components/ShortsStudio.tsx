import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Check,
  Clock3,
  ExternalLink,
  Link2,
  Loader2,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  Youtube,
} from "lucide-react";
import {
  pipelineRunsApi,
  type ShortsCandidateDto,
  type ShortsChildRunDto,
  type ShortsPlanDto,
} from "../api/pipelineRuns";
import { Button, Card, cn } from "./ui-kit";

type Props = {
  sourceRunId: number;
  currentRunId: number;
  sourceTitle?: string;
  isDerivative?: boolean;
};

const statusTone = (status?: string) => {
  const value = (status || "").toLowerCase();
  if (value === "completed") return "border-emerald-500/25 bg-emerald-500/10 text-emerald-200";
  if (value === "running" || value === "retrying") return "border-amber-500/25 bg-amber-500/10 text-amber-100";
  if (value === "failed" || value === "permanentlyfailed") return "border-red-500/25 bg-red-500/10 text-red-200";
  if (value === "waitingforapproval") return "border-sky-500/25 bg-sky-500/10 text-sky-200";
  return "border-zinc-700 bg-zinc-950/55 text-zinc-300";
};

const scoreTone = (score: number, inverse = false) => {
  const normalized = inverse ? 100 - score : score;
  if (normalized >= 80) return "text-emerald-300";
  if (normalized >= 60) return "text-amber-300";
  return "text-red-300";
};

function Flag({
  checked,
  onChange,
  title,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  title: string;
  description: string;
  disabled?: boolean;
}) {
  return (
    <label className={cn(
      "flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950/35 p-3 transition hover:border-zinc-700",
      disabled && "cursor-not-allowed opacity-45"
    )}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 accent-indigo-500"
      />
      <span>
        <span className="block text-xs font-bold text-zinc-100">{title}</span>
        <span className="mt-0.5 block text-[11px] leading-relaxed text-zinc-500">{description}</span>
      </span>
    </label>
  );
}

function CandidateCard({
  candidate,
  selected,
  onToggle,
}: {
  candidate: ShortsCandidateDto;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "group min-w-0 rounded-xl border p-4 text-left transition",
        selected
          ? "border-indigo-400/60 bg-indigo-500/10 shadow-lg shadow-indigo-500/10"
          : "border-zinc-800 bg-zinc-950/35 hover:border-zinc-700 hover:bg-zinc-900/70"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Shorts adayı</div>
          <div className="mt-1 line-clamp-2 text-sm font-black leading-snug text-white">{candidate.title}</div>
        </div>
        <span className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border",
          selected ? "border-indigo-400 bg-indigo-500 text-white" : "border-zinc-700 bg-zinc-900 text-transparent"
        )}>
          <Check size={14} />
        </span>
      </div>

      <div className="mt-3 rounded-lg border border-white/5 bg-black/20 p-3">
        <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">İlk cümle</div>
        <div className="mt-1 text-xs font-semibold leading-relaxed text-zinc-200">{candidate.hook}</div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-zinc-950/55 p-2">
          <div className={cn("font-mono text-sm font-black", scoreTone(candidate.hookScore))}>{candidate.hookScore}</div>
          <div className="text-[9px] uppercase text-zinc-600">Retention</div>
        </div>
        <div className="rounded-lg bg-zinc-950/55 p-2">
          <div className={cn("font-mono text-sm font-black", scoreTone(candidate.standaloneScore))}>{candidate.standaloneScore}</div>
          <div className="text-[9px] uppercase text-zinc-600">Bağımsızlık</div>
        </div>
        <div className="rounded-lg bg-zinc-950/55 p-2">
          <div className={cn(
            "font-mono text-sm font-black uppercase",
            candidate.spoilerRisk === "low" ? "text-emerald-300" : candidate.spoilerRisk === "medium" ? "text-amber-300" : "text-red-300"
          )}>{candidate.spoilerRisk}</div>
          <div className="text-[9px] uppercase text-zinc-600">Spoiler</div>
        </div>
      </div>

      <div className="mt-3 space-y-2 text-[11px] leading-relaxed">
        <div><span className="font-bold text-zinc-500">Açı:</span> <span className="text-zinc-300">{candidate.angle}</span></div>
        <div><span className="font-bold text-zinc-500">Payoff:</span> <span className="text-zinc-300">{candidate.payoff}</span></div>
        <div><span className="font-bold text-zinc-500">Görsel dil:</span> <span className="text-zinc-400">{candidate.visualDirection}</span></div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="rounded-md border border-zinc-800 bg-zinc-950/60 px-2 py-1 font-mono text-[10px] text-zinc-400">
          {candidate.durationSec} sn
        </span>
        {candidate.sourceSceneNumbers.slice(0, 6).map((scene) => (
          <span key={scene} className="rounded-md border border-zinc-800 bg-zinc-950/60 px-2 py-1 text-[10px] text-zinc-500">
            Sahne {scene}
          </span>
        ))}
      </div>
    </button>
  );
}

function ChildRunCard({ run, onOpen }: { run: ShortsChildRunDto; onOpen: () => void }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/35 p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] text-zinc-600">#{run.runId}</span>
            <span className={cn("rounded-md border px-2 py-1 text-[10px] font-bold", statusTone(run.status))}>{run.status}</span>
            {run.renderStatus && <span className="text-[10px] text-zinc-500">Render: {run.renderStatus}</span>}
            {run.uploadStatus && <span className="text-[10px] text-zinc-500">Upload: {run.uploadStatus}</span>}
          </div>
          <div className="mt-1 truncate text-sm font-bold text-zinc-100">{run.title || `Short #${run.runId}`}</div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {run.uploadUrl && (
            <a
              href={run.uploadUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 px-2.5 text-xs font-bold text-red-200 hover:bg-red-500/20"
            >
              <Youtube size={13} /> YouTube <ExternalLink size={11} />
            </a>
          )}
          <Button size="sm" variant="secondary" onClick={onOpen}>
            Aç
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ShortsStudio({ sourceRunId, currentRunId, sourceTitle, isDerivative }: Props) {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<ShortsPlanDto | null>(null);
  const [children, setChildren] = useState<ShortsChildRunDto[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [candidateCount, setCandidateCount] = useState(3);
  const [minDurationSec, setMinDurationSec] = useState(35);
  const [maxDurationSec, setMaxDurationSec] = useState(50);
  const [autoStart, setAutoStart] = useState(true);
  const [pauseBeforeRender, setPauseBeforeRender] = useState(true);
  const [autoPublish, setAutoPublish] = useState(false);
  const [busy, setBusy] = useState<"plan" | "create" | "load" | null>(null);

  const loadChildren = useCallback(async (quiet = false) => {
    if (!sourceRunId) return;
    if (!quiet) setBusy("load");
    try {
      setChildren(await pipelineRunsApi.listShorts(sourceRunId));
    } catch (error: any) {
      if (!quiet) toast.error(error?.message || "Shorts run'ları alınamadı.");
    } finally {
      if (!quiet) setBusy(null);
    }
  }, [sourceRunId]);

  useEffect(() => {
    void loadChildren();
  }, [loadChildren]);

  useEffect(() => {
    if (!children.some((item) => ["Running", "Retrying", "Pending"].includes(item.status))) return;
    const timer = window.setInterval(() => void loadChildren(true), 5000);
    return () => window.clearInterval(timer);
  }, [children, loadChildren]);

  const selectedCandidates = useMemo(
    () => plan?.candidates.filter((candidate) => selectedIds.has(candidate.candidateId)) ?? [],
    [plan, selectedIds]
  );

  const createPlan = async () => {
    setBusy("plan");
    try {
      const result = await pipelineRunsApi.planShorts(sourceRunId, {
        candidateCount,
        minDurationSec,
        maxDurationSec,
      });
      setPlan(result);
      setSelectedIds(new Set(result.candidates.slice(0, 1).map((candidate) => candidate.candidateId)));
      toast.success(`${result.candidates.length} Shorts fikri hazır.`);
    } catch (error: any) {
      toast.error(error?.message || "Shorts planı üretilemedi.");
    } finally {
      setBusy(null);
    }
  };

  const createRuns = async () => {
    if (selectedCandidates.length === 0) {
      toast.error("En az bir Shorts adayı seç.");
      return;
    }

    setBusy("create");
    try {
      const result = await pipelineRunsApi.createShorts(sourceRunId, {
        candidates: selectedCandidates,
        autoStart,
        pauseBeforeRender: autoPublish ? false : pauseBeforeRender,
        autoPublish,
      });
      setPlan(null);
      setSelectedIds(new Set());
      await loadChildren(true);
      toast.success(`${result.runs.length} Shorts run'ı oluşturuldu${autoStart ? " ve üretim başladı" : ""}.`);
    } catch (error: any) {
      toast.error(error?.message || "Shorts run'ı oluşturulamadı.");
    } finally {
      setBusy(null);
    }
  };

  if (isDerivative && currentRunId !== sourceRunId) {
    return (
      <div className="space-y-3">
        <Card className="border-indigo-500/20 bg-indigo-500/5 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-black text-white"><Link2 size={16} className="text-indigo-300" /> Uzun videodan türetilmiş Short</div>
              <div className="mt-1 text-xs text-zinc-500">Kaynak run #{sourceRunId}. Aday planı, kaynak senaryo ve sahne kanıtlarına bağlı üretildi.</div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => navigate(`/content/${sourceRunId}`)}>Kaynak videoyu aç</Button>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-bold text-white">Yayın sonrası</div>
          <div className="mt-2 flex items-start gap-2 text-xs leading-relaxed text-zinc-400">
            <Youtube size={15} className="mt-0.5 shrink-0 text-red-300" />
            YouTube Studio'da bu Short için “İlgili video” alanından kaynak uzun videoyu bağla. Bu seçim YouTube tarafında manuel yapılıyor.
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-zinc-950/20 to-zinc-950/40 p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-lg font-black text-white"><Sparkles size={18} className="text-indigo-300" /> Shorts Studio</div>
            <div className="mt-1 text-xs leading-relaxed text-zinc-400">
              <span className="font-semibold text-zinc-200">{sourceTitle || `Run #${sourceRunId}`}</span> içinden bağımsız, dikey ve kaynağa sadık Shorts fikirleri çıkar. Her aday kendi 9:16 senaryo, görsel, TTS/STT, kelime vurgulu altyazı, render, kapak ve YouTube upload hattına dönüşür.
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              ["Aday", candidateCount, setCandidateCount, 1, 5],
              ["Min sn", minDurationSec, setMinDurationSec, 20, 120],
              ["Maks sn", maxDurationSec, setMaxDurationSec, 20, 180],
            ].map(([label, value, setter, min, max]) => (
              <label key={String(label)} className="rounded-lg border border-zinc-800 bg-zinc-950/45 p-2">
                <span className="block text-[9px] font-bold uppercase tracking-wide text-zinc-600">{String(label)}</span>
                <input
                  type="number"
                  value={Number(value)}
                  min={Number(min)}
                  max={Number(max)}
                  onChange={(event) => (setter as (value: number) => void)(Number(event.target.value))}
                  className="mt-1 h-7 w-20 bg-transparent font-mono text-sm font-bold text-white outline-none"
                />
              </label>
            ))}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button onClick={() => void createPlan()} isLoading={busy === "plan"} disabled={busy !== null && busy !== "plan"}>
            <WandSparkles size={14} className="mr-1.5" /> AI adaylarını planla
          </Button>
          <span className="text-[11px] text-zinc-600">Kaynak senaryoyu bozmaz; en iyi kanca, kanıt ve payoff parçalarını yeniden kurgular.</span>
        </div>
      </Card>

      {plan && (
        <>
          <div className="grid gap-3 xl:grid-cols-3">
            {plan.candidates.map((candidate) => (
              <CandidateCard
                key={candidate.candidateId}
                candidate={candidate}
                selected={selectedIds.has(candidate.candidateId)}
                onToggle={() => setSelectedIds((current) => {
                  const next = new Set(current);
                  if (next.has(candidate.candidateId)) next.delete(candidate.candidateId);
                  else next.add(candidate.candidateId);
                  return next;
                })}
              />
            ))}
          </div>

          <Card className="p-4">
            <div className="grid gap-3 lg:grid-cols-3">
              <Flag checked={autoStart} onChange={setAutoStart} title="Üretimi hemen başlat" description="Seçilen adayların pipeline run'larını oluşturur ve ilk aşamayı başlatır." />
              <Flag checked={pauseBeforeRender} onChange={setPauseBeforeRender} disabled={autoPublish} title="Render öncesi dur" description="Görselleri ve timeline'ı kontrol etmen için onay kapısında bekler." />
              <Flag checked={autoPublish} onChange={(value) => { setAutoPublish(value); if (value) setPauseBeforeRender(false); }} title="Render sonrası otomatik yayınla" description="Render başarılıysa mevcut YouTube kanal ayarıyla upload aşamasına devam eder." />
            </div>
            <div className="mt-4 flex flex-col gap-3 border-t border-zinc-800 pt-4 md:flex-row md:items-center md:justify-between">
              <div className="text-xs text-zinc-500"><span className="font-bold text-zinc-200">{selectedCandidates.length}</span> aday seçili. Çoklu seçim paralel AI yükünü artırır.</div>
              <Button onClick={() => void createRuns()} isLoading={busy === "create"} disabled={selectedCandidates.length === 0 || busy !== null && busy !== "create"}>
                <Play size={14} className="mr-1.5" /> Seçilenleri üret
              </Button>
            </div>
          </Card>
        </>
      )}

      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-black text-white"><Clock3 size={15} className="text-zinc-400" /> Türetilen Shorts</div>
            <div className="mt-0.5 text-[11px] text-zinc-600">Render onayı, timeline kontrolü ve yayın durumu çocuk run'ın içerik merkezinden yönetilir.</div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => void loadChildren()} isLoading={busy === "load"}><RefreshCw size={13} className="mr-1.5" /> Yenile</Button>
        </div>
        <div className="mt-3 space-y-2">
          {children.length > 0 ? children.map((run) => (
            <ChildRunCard key={run.runId} run={run} onOpen={() => navigate(`/content/${run.runId}`)} />
          )) : (
            <div className="flex min-h-28 items-center justify-center rounded-xl border border-dashed border-zinc-800 text-xs text-zinc-600">
              {busy === "load" ? <Loader2 className="animate-spin" size={18} /> : "Bu uzun videodan henüz Shorts üretilmedi."}
            </div>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-300" />
          <div>
            <div className="text-sm font-bold text-white">Yayın kontrolü</div>
            <div className="mt-1 text-xs leading-relaxed text-zinc-500">9:16 video, aktif kelime altyazısı, kapak metni, paket ve upload otomasyonda. Yayından sonra YouTube Studio'da Short'un “İlgili video” alanına bu kaynak uzun videoyu seç; izleyiciyi ana içeriğe taşıyan son bağlantı budur.</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
