import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  conceptsApi,
  type ConceptListDto,
  type ConceptProfileDto,
  type SaveConceptProfileDto,
} from "../api/concepts";
import {
  pipelineTemplatesApi,
  type PipelineTemplateListDto,
} from "../api/pipelineTemplates";
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
  CheckCircle2,
  ClipboardList,
  FileText,
  Layers,
  Loader2,
  RefreshCw,
  Save,
  Sparkles,
  WandSparkles,
} from "lucide-react";

const EMPTY_FORM: SaveConceptProfileDto = {
  productionProfile: "LongForm",
  defaultLanguage: "en-US",
  defaultPlatform: "YouTube",
  audience: "",
  tone: "",
  channelPromise: "",
  visualStyleName: "",
  visualStyleBible: "",
  characterBible: "",
  textPolicy: "",
  contentRules: "",
  defaultDurationSec: 600,
  defaultTemplateId: undefined,
  defaultReviewPolicyJson: "",
};

const WHITEBOARDLY_STARTER: Partial<SaveConceptProfileDto> = {
  productionProfile: "LongForm",
  defaultLanguage: "en-US",
  defaultPlatform: "YouTube",
  defaultDurationSec: 600,
  audience:
    "Curious YouTube viewers who enjoy funny, educational, slightly sarcastic science and history explainers.",
  tone:
    "Funny, educational, sarcastic, scientifically grounded, fast enough to stay alive but clear enough for TTS.",
  channelPromise:
    "Every video turns a surprising idea into a clear, funny, visual story that feels handmade instead of generated.",
  visualStyleName: "Whiteboardly stick figure doodles",
  visualStyleBible:
    "Minimal black and white hand-drawn stick figure educational doodles on a clean white background. Thick uneven marker lines, simple props, expressive faces, clear body language, and readable compositions. Use visual comedy, symbolic metaphors, reaction shots, close-ups, wide shots, and simple diagram-like moments. Avoid photorealism, complex scenery, heavy color, UI screenshots, logos, and clutter.",
  characterBible:
    "Use recurring simple stick figures with round heads, expressive eyes, small mouths, thin bodies, and exaggerated reactions. Characters should feel consistent across scenes: curious narrator, confused learner, overconfident expert, and chaos character when useful.",
  textPolicy:
    "Prefer no text inside generated images. If creative direction truly needs text, use only 1-4 punchy English words integrated as handwritten comic text. Never ask render to add overlay text by default.",
  contentRules:
    "Scenes must build a long-form YouTube story: strong hook, promise, chapters, escalating curiosity, payoff, recap, and natural CTA. Visuals must not repeat the same gag or framing for too long.",
  defaultReviewPolicyJson: JSON.stringify(
    {
      reviewBeforeRender: true,
      allowManualImageRegeneration: true,
      renderIsOptional: true,
      thumbnailRequired: true,
      overlayTextDefault: false,
    },
    null,
    2
  ),
};

const profileOptions = [
  { value: "LongForm", label: "Long Form Video" },
  { value: "Shorts", label: "Shorts" },
  { value: "Podcast", label: "Podcast" },
  { value: "Generic", label: "Generic" },
];

function toForm(profile?: ConceptProfileDto): SaveConceptProfileDto {
  if (!profile) return EMPTY_FORM;
  return {
    productionProfile: profile.productionProfile || "LongForm",
    defaultLanguage: profile.defaultLanguage || "en-US",
    defaultPlatform: profile.defaultPlatform || "YouTube",
    audience: profile.audience ?? "",
    tone: profile.tone ?? "",
    channelPromise: profile.channelPromise ?? "",
    visualStyleName: profile.visualStyleName ?? "",
    visualStyleBible: profile.visualStyleBible ?? "",
    characterBible: profile.characterBible ?? "",
    textPolicy: profile.textPolicy ?? "",
    contentRules: profile.contentRules ?? "",
    defaultDurationSec: profile.defaultDurationSec ?? 600,
    defaultTemplateId: profile.defaultTemplateId,
    defaultReviewPolicyJson: profile.defaultReviewPolicyJson ?? "",
  };
}

function wordCount(value?: string) {
  return (value ?? "").trim().split(/\s+/).filter(Boolean).length;
}

export default function ConceptStudioPage() {
  const [concepts, setConcepts] = useState<ConceptListDto[]>([]);
  const [templates, setTemplates] = useState<PipelineTemplateListDto[]>([]);
  const [selectedConceptId, setSelectedConceptId] = useState("");
  const [profile, setProfile] = useState<ConceptProfileDto | null>(null);
  const [form, setForm] = useState<SaveConceptProfileDto>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedConcept = concepts.find((x) => String(x.id) === selectedConceptId);

  const conceptOptions = concepts.map((concept) => ({
    value: String(concept.id),
    label: concept.name,
  }));

  const templateOptions = [
    { value: "", label: "Template secilmedi" },
    ...templates.map((template) => ({
      value: String(template.id),
      label: `${template.name} (${template.productionProfile})`,
    })),
  ];

  const health = useMemo(() => {
    const checks = [
      {
        label: "Kitle",
        ok: wordCount(form.audience) >= 8,
        hint: "Videonun kime konustugunu netlestir.",
      },
      {
        label: "Ton",
        ok: wordCount(form.tone) >= 6,
        hint: "Mizah, tempo ve anlatim hissini tarif et.",
      },
      {
        label: "Kanal vaadi",
        ok: wordCount(form.channelPromise) >= 10,
        hint: "Bu konsept izleyiciye ne vaat ediyor?",
      },
      {
        label: "Gorsel stil",
        ok: wordCount(form.visualStyleBible) >= 30,
        hint: "Image promptlarinin beslenecegi stil anayasasi.",
      },
      {
        label: "Metin politikasi",
        ok: wordCount(form.textPolicy) >= 8,
        hint: "Gorselde yaziyi ne zaman kullanacagini belirle.",
      },
      {
        label: "Uretim hatti",
        ok: Boolean(form.defaultTemplateId),
        hint: "Bu konsepte varsayilan workflow bagla.",
      },
    ];
    const readyCount = checks.filter((x) => x.ok).length;
    return { checks, readyCount, total: checks.length };
  }, [form]);

  const loadInitial = async () => {
    setLoading(true);
    try {
      const data = await conceptsApi.list();
      setConcepts(data);
      if (!selectedConceptId && data.length > 0) {
        setSelectedConceptId(String(data[0].id));
      }
    } catch {
      toast.error("Konseptler yuklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async (conceptId: string) => {
    if (!conceptId) return;
    setDetailLoading(true);
    try {
      const [profileData, templateData] = await Promise.all([
        conceptsApi.getProfile(Number(conceptId)),
        pipelineTemplatesApi.list(undefined, conceptId),
      ]);
      setProfile(profileData);
      setTemplates(templateData);
      setForm(toForm(profileData));
    } catch {
      toast.error("Concept profile yuklenemedi.");
      setProfile(null);
      setTemplates([]);
      setForm(EMPTY_FORM);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedConceptId) {
      loadProfile(selectedConceptId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConceptId]);

  const setField = <K extends keyof SaveConceptProfileDto>(
    key: K,
    value: SaveConceptProfileDto[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const applyStarter = () => {
    setForm((current) => ({
      ...current,
      ...WHITEBOARDLY_STARTER,
      defaultTemplateId: current.defaultTemplateId,
    }));
    toast.success("Whiteboardly starter profile uygulandi.");
  };

  const handleSave = async () => {
    if (!selectedConceptId) {
      toast.error("Once konsept sec.");
      return;
    }

    if (form.defaultReviewPolicyJson?.trim()) {
      try {
        JSON.parse(form.defaultReviewPolicyJson);
      } catch {
        toast.error("Review policy JSON gecersiz.");
        return;
      }
    }

    setSaving(true);
    try {
      const payload: SaveConceptProfileDto = {
        ...form,
        defaultDurationSec: form.defaultDurationSec || undefined,
        defaultTemplateId: form.defaultTemplateId || undefined,
      };
      const saved = await conceptsApi.saveProfile(Number(selectedConceptId), payload);
      setProfile(saved);
      setForm(toForm(saved));
      toast.success("Concept profile kaydedildi.");
    } catch {
      toast.error("Concept profile kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Page>
        <div className="flex h-full items-center justify-center text-zinc-400 gap-3">
          <Loader2 className="animate-spin" />
          Concept Studio yukleniyor...
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
                <Sparkles size={16} />
                Long video command center
              </div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                Concept Studio
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-zinc-400">
                Konseptin kitle, ton, gorsel stil, metin politikasi ve varsayilan
                workflow kararlarini burada tutuyoruz. Boylece her preset icine
                tekrar tekrar prompt yazmak yerine uretim bu profilden beslenir.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={applyStarter} disabled={!selectedConceptId}>
                <WandSparkles size={16} className="mr-2" />
                Whiteboardly Starter
              </Button>
              <Button
                variant="outline"
                onClick={() => selectedConceptId && loadProfile(selectedConceptId)}
                disabled={!selectedConceptId || detailLoading}
              >
                <RefreshCw
                  size={16}
                  className={detailLoading ? "mr-2 animate-spin" : "mr-2"}
                />
                Yenile
              </Button>
              <Button onClick={handleSave} isLoading={saving} disabled={!selectedConceptId}>
                <Save size={16} className="mr-2" />
                Kaydet
              </Button>
            </div>
          </div>

          {concepts.length === 0 ? (
            <Card className="border-amber-500/20 bg-amber-500/5">
              <div className="flex items-start gap-3 text-sm text-amber-100">
                <ClipboardList className="mt-0.5 text-amber-300" size={18} />
                <div>
                  Once Konseptler ekranindan en az bir konsept olustur. Sonra bu
                  ekranda long-form uretim profilini baglayabiliriz.
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-12 gap-5">
              <div className="col-span-12 xl:col-span-4">
                <div className="sticky top-0 flex flex-col gap-5">
                  <Card className="bg-zinc-900/70">
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-white">
                          Konsept Secimi
                        </h2>
                        <p className="mt-1 text-xs text-zinc-500">
                          Profile bu konseptin kalici uretim hafizasi olacak.
                        </p>
                      </div>
                      {profile?.exists ? (
                        <Badge variant="success">Kayitli</Badge>
                      ) : (
                        <Badge variant="warning">Yeni profil</Badge>
                      )}
                    </div>
                    <Label>Konsept</Label>
                    <Select
                      value={selectedConceptId}
                      onChange={setSelectedConceptId}
                      options={conceptOptions}
                    />
                    {selectedConcept && (
                      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/20 p-4">
                        <div className="text-sm font-medium text-zinc-100">
                          {selectedConcept.name}
                        </div>
                        <div className="mt-2 text-xs leading-relaxed text-zinc-500">
                          {selectedConcept.description || "Aciklama yok."}
                        </div>
                      </div>
                    )}
                  </Card>

                  <Card className="bg-zinc-900/70">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-white">
                          Profile Health
                        </h2>
                        <p className="mt-1 text-xs text-zinc-500">
                          Long video icin eksik kararlar.
                        </p>
                      </div>
                      <Badge
                        variant={
                          health.readyCount === health.total
                            ? "success"
                            : health.readyCount >= 4
                              ? "warning"
                              : "error"
                        }
                      >
                        {health.readyCount}/{health.total}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {health.checks.map((check) => (
                        <div
                          key={check.label}
                          className="rounded-xl border border-zinc-800 bg-zinc-950/20 p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-medium text-zinc-200">
                              {check.label}
                            </div>
                            {check.ok ? (
                              <CheckCircle2 size={16} className="text-emerald-400" />
                            ) : (
                              <span className="h-2 w-2 rounded-full bg-rose-400" />
                            )}
                          </div>
                          <div className="mt-1 text-xs leading-relaxed text-zinc-500">
                            {check.hint}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>

              <div className="col-span-12 xl:col-span-8">
                <Card className="bg-zinc-900/70">
                  {detailLoading ? (
                    <div className="flex min-h-[520px] items-center justify-center text-zinc-500 gap-3">
                      <Loader2 className="animate-spin" />
                      Profile yukleniyor...
                    </div>
                  ) : (
                    <div className="space-y-7">
                      <section>
                        <div className="mb-4 flex items-center gap-2">
                          <Layers size={18} className="text-indigo-300" />
                          <h2 className="text-lg font-semibold text-white">
                            Uretim Kararlari
                          </h2>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <Label>Production Profile</Label>
                            <Select
                              value={form.productionProfile}
                              onChange={(value) => setField("productionProfile", value)}
                              options={profileOptions}
                            />
                          </div>
                          <div>
                            <Label>Varsayilan Workflow</Label>
                            <Select
                              value={form.defaultTemplateId ? String(form.defaultTemplateId) : ""}
                              onChange={(value) =>
                                setField(
                                  "defaultTemplateId",
                                  value ? Number(value) : undefined
                                )
                              }
                              options={templateOptions}
                            />
                          </div>
                          <div>
                            <Label>Platform</Label>
                            <Input
                              value={form.defaultPlatform}
                              onChange={(e) => setField("defaultPlatform", e.target.value)}
                              placeholder="YouTube"
                            />
                          </div>
                          <div>
                            <Label>Dil</Label>
                            <Input
                              value={form.defaultLanguage}
                              onChange={(e) => setField("defaultLanguage", e.target.value)}
                              placeholder="en-US"
                            />
                          </div>
                          <div>
                            <Label>Hedef Sure (saniye)</Label>
                            <Input
                              type="number"
                              min={15}
                              max={7200}
                              value={form.defaultDurationSec ?? ""}
                              onChange={(e) =>
                                setField(
                                  "defaultDurationSec",
                                  e.target.value ? Number(e.target.value) : undefined
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label>Gorsel Stil Adi</Label>
                            <Input
                              value={form.visualStyleName ?? ""}
                              onChange={(e) => setField("visualStyleName", e.target.value)}
                              placeholder="Whiteboardly stick figure doodles"
                            />
                          </div>
                        </div>
                      </section>

                      <section>
                        <div className="mb-4 flex items-center gap-2">
                          <FileText size={18} className="text-indigo-300" />
                          <h2 className="text-lg font-semibold text-white">
                            Creative DNA
                          </h2>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <Label>Kitle</Label>
                            <Textarea
                              value={form.audience ?? ""}
                              onChange={(e) => setField("audience", e.target.value)}
                              placeholder="Bu konsept kime konusuyor?"
                              className="min-h-[120px]"
                            />
                          </div>
                          <div>
                            <Label>Ton</Label>
                            <Textarea
                              value={form.tone ?? ""}
                              onChange={(e) => setField("tone", e.target.value)}
                              placeholder="Mizah, tempo, anlatim hissi..."
                              className="min-h-[120px]"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label>Kanal Vaadi</Label>
                            <Textarea
                              value={form.channelPromise ?? ""}
                              onChange={(e) => setField("channelPromise", e.target.value)}
                              placeholder="Bu konsept her videoda izleyiciye ne vaat ediyor?"
                              className="min-h-[100px]"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label>Gorsel Stil Bible</Label>
                            <Textarea
                              value={form.visualStyleBible ?? ""}
                              onChange={(e) => setField("visualStyleBible", e.target.value)}
                              placeholder="Image promptlarina beslenecek stil kurallari..."
                              className="min-h-[180px]"
                            />
                          </div>
                          <div>
                            <Label>Karakter Bible</Label>
                            <Textarea
                              value={form.characterBible ?? ""}
                              onChange={(e) => setField("characterBible", e.target.value)}
                              placeholder="Tekrar eden karakterler, mimikler, gorsel dil..."
                              className="min-h-[150px]"
                            />
                          </div>
                          <div>
                            <Label>Metin Politikasi</Label>
                            <Textarea
                              value={form.textPolicy ?? ""}
                              onChange={(e) => setField("textPolicy", e.target.value)}
                              placeholder="Gorselde yazi ne zaman olur, render overlay varsayilan mi?"
                              className="min-h-[150px]"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label>Icerik Kurallari</Label>
                            <Textarea
                              value={form.contentRules ?? ""}
                              onChange={(e) => setField("contentRules", e.target.value)}
                              placeholder="Hook, chapter, pacing, tekrar etmeme, thumbnail ihtiyaci..."
                              className="min-h-[130px]"
                            />
                          </div>
                        </div>
                      </section>

                      <section>
                        <div className="mb-4 flex items-center gap-2">
                          <ClipboardList size={18} className="text-indigo-300" />
                          <h2 className="text-lg font-semibold text-white">
                            Review Policy
                          </h2>
                        </div>
                        <Textarea
                          value={form.defaultReviewPolicyJson ?? ""}
                          onChange={(e) =>
                            setField("defaultReviewPolicyJson", e.target.value)
                          }
                          placeholder='{"reviewBeforeRender": true}'
                          className="min-h-[150px] font-mono text-xs"
                        />
                        <p className="mt-2 text-xs text-zinc-500">
                          Burasi render opsiyonel mi, thumbnail zorunlu mu, manuel
                          gorsel kontrolu var mi gibi kararlarin JSON alani.
                        </p>
                      </section>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
