import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  productionWizardApi,
  type ProductionWizardBootstrapDto,
  type ProductionWizardPreflightDto,
  type ProductionWizardRequestDto,
} from "../api/productionWizard";
import type { ProductionBrief } from "../api/pipelineRuns";
import { PRODUCTION_BRIEF_FIELD_LIMITS } from "../api/productionBriefs";
import {
  Page,
  Card,
  Button,
  Input,
  Label,
  Select,
  Textarea,
  Badge,
} from "../components/ui-kit";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Play,
  RefreshCw,
  Route,
  Sparkles,
  WandSparkles,
} from "lucide-react";

const EMPTY_BRIEF: ProductionBrief = {
  mainTitle: "",
  angle: "",
  audience: "",
  targetDuration: "",
  mustCover: "",
  avoid: "",
  hookDirection: "",
  thumbnailDirection: "",
  notes: "",
};

function severityVariant(severity?: string) {
  if (severity === "Error") return "error" as const;
  if (severity === "Warning") return "warning" as const;
  return "neutral" as const;
}

function toBrief(item?: ProductionWizardBootstrapDto["briefs"][number]): ProductionBrief {
  if (!item) return EMPTY_BRIEF;
  return {
    mainTitle: item.mainTitle ?? "",
    angle: item.angle ?? "",
    audience: item.audience ?? "",
    targetDuration: item.targetDuration ?? "",
    mustCover: item.mustCover ?? "",
    avoid: item.avoid ?? "",
    hookDirection: item.hookDirection ?? "",
    thumbnailDirection: item.thumbnailDirection ?? "",
    notes: item.notes ?? "",
  };
}

function FieldCounter({ value, limit }: { value?: string; limit: number }) {
  return (
    <div className="mt-1 text-right text-[10px] text-zinc-500">
      {(value ?? "").length.toLocaleString("tr-TR")} / {limit.toLocaleString("tr-TR")}
    </div>
  );
}

function briefIsEmpty(brief: ProductionBrief) {
  return !Object.values(brief).some((value) => String(value ?? "").trim());
}

function shortValue(value?: string | number | null, fallback = "-", max = 130) {
  const text = String(value ?? "").trim();
  if (!text) return fallback;
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

function countProfileSignals(profile?: ProductionWizardBootstrapDto["conceptProfile"] | null) {
  if (!profile) return 0;
  return [
    profile.audience,
    profile.tone,
    profile.channelPromise,
    profile.visualStyleName,
    profile.visualStyleBible,
    profile.characterBible,
    profile.textPolicy,
    profile.contentRules,
    profile.defaultDurationSec,
  ].filter((value) => String(value ?? "").trim()).length;
}

export default function ProductionWizardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<ProductionWizardBootstrapDto | null>(null);
  const [conceptId, setConceptId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [savedBriefId, setSavedBriefId] = useState("");
  const [brief, setBrief] = useState<ProductionBrief>(EMPTY_BRIEF);
  const [autoStart, setAutoStart] = useState(true);
  const [pauseBeforeRender, setPauseBeforeRender] = useState(true);
  const [preflight, setPreflight] = useState<ProductionWizardPreflightDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [starting, setStarting] = useState(false);

  const conceptOptions = useMemo(
    () => (data?.concepts ?? []).map((concept) => ({ value: String(concept.id), label: concept.name })),
    [data]
  );

  const templateOptions = useMemo(
    () =>
      (data?.templates ?? []).map((template) => ({
        value: String(template.id),
        label: `${template.name} (${template.productionProfile}, ${template.stageCount} adim)`,
      })),
    [data]
  );

  const briefOptions = useMemo(
    () => [
      { value: "", label: "Manual brief" },
      ...(data?.briefs ?? []).map((item) => ({
        value: String(item.id),
        label: `${item.name}${item.conceptName ? ` - ${item.conceptName}` : ""}`,
      })),
    ],
    [data]
  );

  const selectedBrief = useMemo(
    () => data?.briefs.find((item) => String(item.id) === savedBriefId),
    [data, savedBriefId]
  );

  const conceptProfile = data?.conceptProfile;
  const profileSignalCount = countProfileSignals(conceptProfile);
  const conceptImpactItems = useMemo(
    () => [
      {
        label: "Dil",
        value: conceptProfile?.defaultLanguage,
        note: "Topic/Script varsayilani",
      },
      {
        label: "Sure",
        value: brief.targetDuration || (conceptProfile?.defaultDurationSec ? `${conceptProfile.defaultDurationSec} sn` : ""),
        note: brief.targetDuration ? "Brief override" : "Concept default",
      },
      {
        label: "Ton",
        value: conceptProfile?.tone,
        note: "CreativeDirector + Script",
      },
      {
        label: "Kitle",
        value: brief.audience || conceptProfile?.audience,
        note: brief.audience ? "Brief override" : "Concept default",
      },
      {
        label: "Kanal vaadi",
        value: conceptProfile?.channelPromise,
        note: "Topic + CreativeDirector",
      },
      {
        label: "Gorsel stil",
        value: conceptProfile?.visualStyleName,
        note: "Storyboard + Image",
      },
      {
        label: "Style bible",
        value: conceptProfile?.visualStyleBible,
        note: "Image prompt",
      },
      {
        label: "Text policy",
        value: conceptProfile?.textPolicy,
        note: "Image/Thumbnail",
      },
    ],
    [brief.audience, brief.targetDuration, conceptProfile]
  );

  const requestPayload: ProductionWizardRequestDto = useMemo(
    () => ({
      conceptId: conceptId ? Number(conceptId) : undefined,
      templateId: templateId ? Number(templateId) : undefined,
      savedBriefId: savedBriefId ? Number(savedBriefId) : undefined,
      brief: briefIsEmpty(brief) ? undefined : brief,
      autoStart,
      pauseBeforeRender,
    }),
    [autoStart, brief, conceptId, pauseBeforeRender, savedBriefId, templateId]
  );

  const loadBootstrap = async (nextConceptId?: string, nextTemplateId?: string) => {
    setLoading(true);
    try {
      const res = await productionWizardApi.bootstrap({
        conceptId: nextConceptId || undefined,
        templateId: nextTemplateId || undefined,
      });
      setData(res);
      setPreflight(res.preflight);
      setConceptId(res.recommendedConceptId ? String(res.recommendedConceptId) : "");
      setTemplateId(res.recommendedTemplateId ? String(res.recommendedTemplateId) : "");

      if (!brief.targetDuration && res.conceptProfile?.defaultDurationSec) {
        setBrief((current) => ({
          ...current,
          targetDuration: `${res.conceptProfile?.defaultDurationSec} seconds`,
        }));
      }
    } catch {
      toast.error("Production wizard yuklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!savedBriefId) return;
    setBrief(toBrief(selectedBrief));
  }, [savedBriefId, selectedBrief]);

  useEffect(() => {
    if (!data || loading) return;

    const handle = window.setTimeout(async () => {
      setChecking(true);
      try {
        const res = await productionWizardApi.preflight(requestPayload);
        setPreflight(res);
      } catch {
        toast.error("Preflight kontrolu calismadi.");
      } finally {
        setChecking(false);
      }
    }, 450);

    return () => window.clearTimeout(handle);
  }, [data, loading, requestPayload]);

  const handleConceptChange = async (value: string) => {
    setConceptId(value);
    setTemplateId("");
    setSavedBriefId("");
    setBrief(EMPTY_BRIEF);
    await loadBootstrap(value);
  };

  const setBriefField = (key: keyof ProductionBrief, value: string) => {
    setSavedBriefId("");
    setBrief((current) => ({ ...current, [key]: value }));
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      const check = await productionWizardApi.preflight(requestPayload);
      setPreflight(check);
      if (!check.canStart) {
        toast.error("Preflight hata seviyesinde madde buldu.");
        return;
      }

      const result = await productionWizardApi.start(requestPayload);
      toast.success(`Run #${result.runId} olusturuldu.`);
      navigate("/pipeline-runs");
    } catch {
      toast.error("Uretim baslatilamadi.");
    } finally {
      setStarting(false);
    }
  };

  if (loading && !data) {
    return (
      <Page>
        <div className="flex h-full items-center justify-center gap-3 text-zinc-400">
          <Loader2 className="animate-spin" />
          Production Wizard yukleniyor...
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 pb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">
                <WandSparkles size={16} />
                Long-form production wizard
              </div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                Yeni Uzun Video Uretimi
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-zinc-400">
                Konsept, brief, workflow ve preflight kontrolunu tek yerde topla.
                Ayrintili prompt yazmak yerine uretim niyetini netlestir.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => loadBootstrap(conceptId, templateId)} disabled={loading}>
                <RefreshCw size={16} className={loading ? "mr-2 animate-spin" : "mr-2"} />
                Yenile
              </Button>
              <Button onClick={handleStart} isLoading={starting} disabled={!preflight?.canStart}>
                <Play size={16} className="mr-2" />
                Uretimi Baslat
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-5">
            <div className="col-span-12 xl:col-span-3">
              <Card className="bg-zinc-900/70">
                <h2 className="mb-4 text-lg font-semibold text-white">Akis</h2>
                <div className="space-y-3">
                  {[
                    ["1", "Konsept", data?.conceptProfile?.conceptName || "Secim bekleniyor"],
                    ["2", "Brief", savedBriefId ? selectedBrief?.name || "Kayitli brief" : brief.mainTitle || "Manual brief"],
                    ["3", "Workflow", data?.templates.find((x) => String(x.id) === templateId)?.name || "Secim bekleniyor"],
                    ["4", "Preflight", preflight?.canStart ? "Baslatmaya hazir" : "Kontrol gerekiyor"],
                  ].map(([index, title, desc]) => (
                    <div key={index} className="rounded-xl border border-zinc-800 bg-zinc-950/20 p-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-xs font-bold text-indigo-300">
                          {index}
                        </span>
                        <div>
                          <div className="text-sm font-medium text-zinc-100">{title}</div>
                          <div className="mt-0.5 line-clamp-2 text-xs text-zinc-500">{desc}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="col-span-12 xl:col-span-6">
              <Card className="bg-zinc-900/70">
                <div className="mb-5 flex items-center gap-2">
                  <ClipboardList size={18} className="text-indigo-300" />
                  <h2 className="text-lg font-semibold text-white">Uretim Girdisi</h2>
                </div>

                <div className="space-y-6">
                  <section className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Konsept</Label>
                      <Select value={conceptId} onChange={handleConceptChange} options={conceptOptions} />
                    </div>
                    <div>
                      <Label>Workflow</Label>
                      <Select value={templateId} onChange={setTemplateId} options={templateOptions} placeholder="Workflow sec" />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Kayitli Brief</Label>
                      <Select value={savedBriefId} onChange={setSavedBriefId} options={briefOptions} />
                    </div>
                  </section>

                  <section className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Ana Baslik</Label>
                      <Input
                        name="mainTitle"
                        value={brief.mainTitle ?? ""}
                        onChange={(e) => setBriefField("mainTitle", e.target.value)}
                        maxLength={PRODUCTION_BRIEF_FIELD_LIMITS.mainTitle}
                        placeholder="Video ne hakkinda?"
                      />
                    </div>
                    <div>
                      <Label>Hedef Sure</Label>
                      <Input
                        value={brief.targetDuration ?? ""}
                        onChange={(e) => setBriefField("targetDuration", e.target.value)}
                        maxLength={PRODUCTION_BRIEF_FIELD_LIMITS.targetDuration}
                        placeholder="10-12 minutes"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Aci / Tez</Label>
                      <Textarea
                        value={brief.angle ?? ""}
                        onChange={(e) => setBriefField("angle", e.target.value)}
                        maxLength={PRODUCTION_BRIEF_FIELD_LIMITS.angle}
                        placeholder="Bu videonun iddiasi, merak sorusu veya anlatim acisi..."
                        className="min-h-[125px]"
                      />
                      <FieldCounter value={brief.angle} limit={PRODUCTION_BRIEF_FIELD_LIMITS.angle} />
                    </div>
                    <div>
                      <Label>Hedef Izleyici</Label>
                      <Textarea
                        value={brief.audience ?? ""}
                        onChange={(e) => setBriefField("audience", e.target.value)}
                        maxLength={PRODUCTION_BRIEF_FIELD_LIMITS.audience}
                        placeholder="Kime konusuyoruz?"
                        className="min-h-[110px]"
                      />
                      <FieldCounter value={brief.audience} limit={PRODUCTION_BRIEF_FIELD_LIMITS.audience} />
                    </div>
                    <div>
                      <Label>Mutlaka Islenecekler</Label>
                      <Textarea
                        value={brief.mustCover ?? ""}
                        onChange={(e) => setBriefField("mustCover", e.target.value)}
                        maxLength={PRODUCTION_BRIEF_FIELD_LIMITS.mustCover}
                        placeholder="Video icinde kesin gecmesi gereken noktalar..."
                        className="min-h-[130px]"
                      />
                      <FieldCounter value={brief.mustCover} limit={PRODUCTION_BRIEF_FIELD_LIMITS.mustCover} />
                    </div>
                    <div>
                      <Label>Kacinilacaklar</Label>
                      <Textarea
                        value={brief.avoid ?? ""}
                        onChange={(e) => setBriefField("avoid", e.target.value)}
                        maxLength={PRODUCTION_BRIEF_FIELD_LIMITS.avoid}
                        placeholder="Klişe, yanlis ton, istemedigin konular..."
                        className="min-h-[100px]"
                      />
                      <FieldCounter value={brief.avoid} limit={PRODUCTION_BRIEF_FIELD_LIMITS.avoid} />
                    </div>
                    <div>
                      <Label>Hook Yonlendirmesi</Label>
                      <Textarea
                        value={brief.hookDirection ?? ""}
                        onChange={(e) => setBriefField("hookDirection", e.target.value)}
                        maxLength={PRODUCTION_BRIEF_FIELD_LIMITS.hookDirection}
                        placeholder="Ilk 10-20 saniyenin gerilimi, sorusu ve payoff vaadi..."
                        className="min-h-[110px]"
                      />
                      <FieldCounter value={brief.hookDirection} limit={PRODUCTION_BRIEF_FIELD_LIMITS.hookDirection} />
                    </div>
                    <div>
                      <Label>Thumbnail Yonlendirmesi</Label>
                      <Textarea
                        value={brief.thumbnailDirection ?? ""}
                        onChange={(e) => setBriefField("thumbnailDirection", e.target.value)}
                        maxLength={PRODUCTION_BRIEF_FIELD_LIMITS.thumbnailDirection}
                        placeholder="Ana gorsel fikir, duygu, nesne/karakter, karsitlik ve kisa metin niyeti..."
                        className="min-h-[110px]"
                      />
                      <FieldCounter value={brief.thumbnailDirection} limit={PRODUCTION_BRIEF_FIELD_LIMITS.thumbnailDirection} />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Notlar / Kaynaklar</Label>
                      <Textarea
                        value={brief.notes ?? ""}
                        onChange={(e) => setBriefField("notes", e.target.value)}
                        maxLength={PRODUCTION_BRIEF_FIELD_LIMITS.notes}
                        placeholder="Ek bilgi, kaynak, ornek, referans..."
                        className="min-h-[125px]"
                      />
                      <FieldCounter value={brief.notes} limit={PRODUCTION_BRIEF_FIELD_LIMITS.notes} />
                    </div>
                  </section>

                  <section className="grid gap-3 md:grid-cols-2">
                    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/20 p-4">
                      <span>
                        <span className="block text-sm font-medium text-zinc-100">Otomatik baslat</span>
                        <span className="mt-1 block text-xs text-zinc-500">Run olusunca hemen calissin.</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={autoStart}
                        onChange={(e) => setAutoStart(e.target.checked)}
                        className="h-4 w-4 accent-indigo-500"
                      />
                    </label>
                    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/20 p-4">
                      <span>
                        <span className="block text-sm font-medium text-zinc-100">Render oncesi dur</span>
                        <span className="mt-1 block text-xs text-zinc-500">Gorsel ve timeline kontrolu icin onerilir.</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={pauseBeforeRender}
                        onChange={(e) => setPauseBeforeRender(e.target.checked)}
                        className="h-4 w-4 accent-indigo-500"
                      />
                    </label>
                  </section>
                </div>
              </Card>
            </div>

            <div className="col-span-12 xl:col-span-3">
              <div className="sticky top-0 flex flex-col gap-5">
                <Card className="bg-zinc-900/70">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Route size={18} className="text-indigo-300" />
                      <h2 className="text-lg font-semibold text-white">Preflight</h2>
                    </div>
                    {checking ? (
                      <Loader2 size={16} className="animate-spin text-zinc-500" />
                    ) : preflight?.canStart ? (
                      <CheckCircle2 size={18} className="text-emerald-400" />
                    ) : (
                      <AlertTriangle size={18} className="text-amber-400" />
                    )}
                  </div>

                  <div className="mb-4 grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
                      <div className="text-lg font-bold text-rose-300">{preflight?.errorCount ?? 0}</div>
                      <div className="text-[10px] uppercase text-zinc-500">Error</div>
                    </div>
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                      <div className="text-lg font-bold text-amber-300">{preflight?.warningCount ?? 0}</div>
                      <div className="text-[10px] uppercase text-zinc-500">Warning</div>
                    </div>
                    <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3">
                      <div className="text-lg font-bold text-sky-300">{preflight?.infoCount ?? 0}</div>
                      <div className="text-[10px] uppercase text-zinc-500">Info</div>
                    </div>
                  </div>

                  <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700">
                    {(preflight?.items ?? []).length === 0 ? (
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-100">
                        Preflight temiz gorunuyor.
                      </div>
                    ) : (
                      preflight?.items.map((item) => (
                        <div key={`${item.code}-${item.message}`} className="rounded-xl border border-zinc-800 bg-zinc-950/20 p-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <Badge variant={severityVariant(item.severity)}>{item.severity}</Badge>
                            <span className="truncate text-[10px] text-zinc-600">{item.target}</span>
                          </div>
                          <div className="text-xs leading-relaxed text-zinc-300">{item.message}</div>
                          {item.howToFix && (
                            <div className="mt-2 rounded-lg border border-zinc-800 bg-black/20 p-2 text-[11px] leading-relaxed text-zinc-500">
                              {item.howToFix}
                            </div>
                          )}
                          {item.actionLabel && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="mt-3 h-7 px-2 text-[10px]"
                              onClick={() => {
                                if (item.actionRoute) navigate(item.actionRoute);
                                else document.querySelector<HTMLInputElement>("[name='mainTitle']")?.focus();
                              }}
                            >
                              {item.actionLabel}
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </Card>

                <Card className="bg-zinc-900/70">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <Sparkles size={16} className="text-indigo-300" />
                        Concept Etkisi
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                        Bu run baslarken concept profile snapshot olarak kaydedilir ve prompt zincirine eklenir.
                      </p>
                    </div>
                    <Badge variant={profileSignalCount >= 6 ? "success" : "warning"}>
                      {profileSignalCount}/9
                    </Badge>
                  </div>

                  {!conceptProfile ? (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-100">
                      Concept profile bulunamadi. Concept Studio'da profil tanimlamak uzun video kalitesini ciddi etkiler.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-3">
                        <div className="mb-1 text-[10px] uppercase tracking-wide text-zinc-500">Profil</div>
                        <div className="text-sm font-semibold text-zinc-100">
                          {conceptProfile.conceptName || "Secili konsept"}
                        </div>
                        <div className="mt-1 text-xs text-zinc-500">
                          {conceptProfile.productionProfile} / {conceptProfile.defaultPlatform}
                        </div>
                      </div>

                      <div className="grid gap-2">
                        {conceptImpactItems.map((item) => (
                          <div key={item.label} className="rounded-xl border border-zinc-800 bg-zinc-950/20 p-3">
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <span className="text-[10px] uppercase tracking-wide text-zinc-500">{item.label}</span>
                              <span className="rounded-full bg-zinc-800/80 px-2 py-0.5 text-[10px] text-zinc-400">
                                {item.note}
                              </span>
                            </div>
                            <div className="line-clamp-3 text-xs leading-relaxed text-zinc-200">
                              {shortValue(item.value)}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-[11px] leading-relaxed text-indigo-100">
                        Topic, Creative Director, Script, Storyboard, Image ve Thumbnail asamalari bu profili okuyacak.
                        Brief'te verdigin baslik, sure ve hedef kitle daha spesifik oldugu icin ilgili alanlarda onde gelir.
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}
