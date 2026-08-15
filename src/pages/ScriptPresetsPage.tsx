import { useEffect, useState } from "react";
import { useDebounce } from "../hooks/useDebounce";
import {
  scriptPresetsApi,
  type ScriptPresetListDto,
  type SaveScriptPresetDto,
} from "../api/scriptPresets";
import { aiConnectionsApi } from "../api/aiConnections";
import toast from "react-hot-toast";
import {
  Page,
  Card,
  Button,
  Input,
  Textarea,
  Label,
  Badge,
  Table,
  THead,
  TR,
  TH,
  TD,
  Modal,
  Select,
  NumberInput,
} from "../components/ui-kit";
import { HelpLabel } from "../components/FieldHelp";
import { PromptContractGuard } from "../components/PromptContractGuard";
import { AdvancedSection, PromptPreviewPanel } from "../components/PromptPreviewPanel";
import {
  Plus,
  Trash2,
  Save,
  Search,
  RefreshCw,
  Award,
  Maximize2,
  Copy,
  Cpu,
  Timer,
  Wand2,
} from "lucide-react";

const EMPTY_FORM: SaveScriptPresetDto = {
  name: "",
  userAiConnectionId: 0,
  modelName: "gpt-4o",
  tone: "Engaging",
  targetDurationSec: 60,
  language: "tr-TR",
  includeHook: true,
  includeCta: true,
  promptTemplate: "",
  systemInstruction: "",
};

const LONG_FORM_SCRIPT_SYSTEM = `You are a senior YouTube long-form scriptwriter and scene director for educational infotainment videos.
You write clean narration for TTS, not screenplay directions.
You also provide concise scene-direction intent so downstream Storyboard, Image, EditPlan and Render stages can make human-like editing decisions.
Follow the backend-provided JSON contract exactly. Do not invent unsupported top-level sections.
Keep narration coherent across scenes; every scene must feel like part of one continuous essay.`;

const LONG_FORM_SCRIPT_PROMPT = `Create a long-form YouTube video script about: {Topic}

Language: {Language}
Tone: {Tone}
Target duration: {Duration} seconds

Video format:
- Long-form YouTube video.
- 16:9 horizontal video.
- The final video should feel deliberately edited, not like disconnected captions.
- The visual style should follow the Topic document and production brief.

Structure:
1. Strong hook in the first 20 seconds.
2. Short intro that promises the payoff.
3. 4 to 7 clear chapters/sections.
4. Smooth transitions between chapters.
5. Short recap near the end.
6. Outro with a natural call to action.

Scene rules:
- Create enough narration scenes for long-form pacing, usually 45 to 80 scenes for an 8-12 minute video.
- Prefer 6 to 14 seconds per script scene. Important ideas can be slightly longer.
- audioText should be natural narration, ready for TTS.
- visualPrompt should describe one image-generation-ready 16:9 visual for the scene.
- Avoid on-screen text requirements inside visualPrompt.
- Do not ask the image generator to render labels, subtitles, UI, logos, watermarks, or written paragraphs.
- Use sceneRole, scenePurpose, viewerQuestion, emotionalBeat, visualType, cameraPlan, overlayText, sfxCue, transitionIntent and chapterTitle to explain how the scene should be edited.
- Vary visualType and cameraPlan across consecutive scenes.
- Use a mix of cinematic_image, broll, map, timeline, diagram, quote_card, comparison and text_card when they fit the idea.
- overlayText should be rare and shorter than 6 words.
- sfxCue should be sparse and meaningful.
- Let Storyboard/EditPlan handle multiple visual beats inside a scene; do not force one script scene for every 4 seconds.
- Keep the total estimated duration close to {Duration} seconds.
`;

export default function ScriptPresetsPage() {
  const [items, setItems] = useState<ScriptPresetListDto[]>([]);
  const [connections, setConnections] = useState<
    { label: string; value: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form, setForm] = useState<SaveScriptPresetDto>(EMPTY_FORM);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [previewModal, setPreviewModal] = useState<{
    title: string;
    content: string;
  } | null>(null);
  const effectiveSystemInstruction =
    form.systemInstruction?.trim() || LONG_FORM_SCRIPT_SYSTEM;
  const effectivePromptTemplate =
    form.promptTemplate.trim() || LONG_FORM_SCRIPT_PROMPT;
  const isUsingDefaultScriptPrompt =
    !form.systemInstruction?.trim() || !form.promptTemplate.trim();

  const loadData = async () => {
    setLoading(true);
    try {
      const [presetsData, connectionsData] = await Promise.all([
        scriptPresetsApi.list(),
        aiConnectionsApi.list(),
      ]);
      setItems(presetsData);
      setConnections(
        connectionsData.map((c) => ({
          label: `${c.name} (${c.provider})`,
          value: c.id.toString(),
        }))
      );
    } catch {
      toast.error("Veriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelect = async (id: number) => {
    if (id === selectedId) return;
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const data = await scriptPresetsApi.get(id);
      setForm({
        name: data.name,
        userAiConnectionId: data.userAiConnectionId,
        modelName: data.modelName,
        tone: data.tone,
        targetDurationSec: data.targetDurationSec,
        language: data.language,
        includeHook: data.includeHook,
        includeCta: data.includeCta,
        promptTemplate: data.promptTemplate,
        systemInstruction: data.systemInstruction ?? "",
      });
    } catch {
      toast.error("Detay yüklenemedi.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleNew = () => {
    setSelectedId(null);
    setForm(EMPTY_FORM);
  };

  const applyLongFormStarter = () => {
    setForm((prev) => ({
      ...prev,
      name: prev.name || "Long Form Script - 8-15 dk",
      modelName: prev.modelName || "gpt-4o",
      tone: "Educational, cinematic, curious",
      targetDurationSec: 720,
      language: prev.language || "tr-TR",
      includeHook: true,
      includeCta: true,
      systemInstruction: LONG_FORM_SCRIPT_SYSTEM,
      promptTemplate: LONG_FORM_SCRIPT_PROMPT,
    }));
    toast.success("Long Form script starter uygulandi.");
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Preset adi zorunludur.");
      return;
    }
    if (!form.userAiConnectionId) {
      toast.error("Lütfen bir AI Bağlantısı seçin.");
      return;
    }

    setDetailLoading(true);
    try {
      if (selectedId) {
        await scriptPresetsApi.update(selectedId, form);
        toast.success("Güncellendi.");
      } else {
        await scriptPresetsApi.create(form);
        toast.success("Oluşturuldu.");
        handleNew();
      }
      const list = await scriptPresetsApi.list();
      setItems(list);
    } catch {
      toast.error("Kayıt başarısız.");
    } finally {
      setDetailLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedId) return;
    setDetailLoading(true);
    try {
      await scriptPresetsApi.delete(selectedId);
      toast.success("Silindi.");
      setIsDeleteModalOpen(false);
      handleNew();
      const list = await scriptPresetsApi.list();
      setItems(list);
    } catch {
      toast.error("Silme başarısız.");
    } finally {
      setDetailLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Kopyalandı!");
  };

  const filteredItems = items.filter((i) =>
    i.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  // Helper Toggle Component
  const Toggle = ({
    label,
    checked,
    onChange,
  }: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <div
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between w-full h-9 px-2 rounded-xl border cursor-pointer transition-all select-none ${
        checked
          ? "bg-indigo-500/10 border-indigo-500/30"
          : "bg-zinc-950/50 border-zinc-800"
      }`}
    >
      <span
        className={`text-xs font-medium ${
          checked ? "text-indigo-400" : "text-zinc-400"
        }`}
      >
        {label}
      </span>
      <div
        className={`w-8 h-4 rounded-full relative transition-colors ${
          checked ? "bg-indigo-500" : "bg-zinc-700"
        }`}
      >
        <div
          className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${
            checked ? "left-4.5" : "left-0.5"
          }`}
        />
      </div>
    </div>
  );

  return (
    <Page>
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden pt-2">
        {/* SOL: LİSTE (8 BİRİM) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col h-full min-h-0 gap-4">
          <div className="flex justify-between items-center gap-2 shrink-0">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Award className="text-indigo-500" /> Senaryo Ayarları
            </h1>
            <div className="flex gap-2 relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Ayar ara..."
                className="pl-9 bg-zinc-900/50 border-zinc-800"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={loadData}
                className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800"
              >
                <RefreshCw
                  className={loading ? "animate-spin" : ""}
                  size={18}
                />
              </Button>
              <Button
                onClick={handleNew}
                className="bg-indigo-600 hover:bg-indigo-500 text-white border-none shadow-lg px-4"
              >
                <Plus size={18} className="mr-2" /> Yeni Ayar
              </Button>
            </div>
          </div>

          <Card className="flex-1 min-h-0 p-0 overflow-hidden flex flex-col border-zinc-800 bg-zinc-900/40">
            <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              <Table className="border-none w-full">
                <THead>
                  <TR className="bg-zinc-900/80 sticky top-0 z-10 backdrop-blur-md">
                    <TH className="text-zinc-400 font-medium">Preset Adı</TH>
                    <TH className="text-zinc-400 font-medium">Model</TH>
                    <TH className="text-zinc-400 font-medium">Ton</TH>
                    <TH className="text-zinc-400 font-medium text-right">
                      Güncelleme
                    </TH>
                  </TR>
                </THead>
                <tbody>
                  {filteredItems.map((item) => (
                    <TR
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={`cursor-pointer transition-all border-b border-zinc-800/50 hover:bg-zinc-800/40 
                        ${
                          selectedId === item.id
                            ? "bg-indigo-500/10 border-l-4 border-l-indigo-500"
                            : "border-l-4 border-l-transparent"
                        }`}
                    >
                      <TD className="font-medium text-zinc-200 py-3">
                        {item.name}
                      </TD>
                      <TD className="text-zinc-400 py-3 flex items-center gap-1.5">
                        <Cpu size={14} className="text-indigo-400" />{" "}
                        {item.modelName}
                      </TD>
                      <TD className="text-zinc-400 py-3">
                        <Badge variant="neutral" className="scale-90">
                          {item.tone}
                        </Badge>
                      </TD>
                      <TD className="text-right text-zinc-500 text-xs py-3 font-mono">
                        {item.updatedAt
                          ? new Date(item.updatedAt).toLocaleDateString("tr-TR")
                          : "-"}
                      </TD>
                    </TR>
                  ))}
                  {filteredItems.length === 0 && !loading && (
                    <TR>
                      <TD
                        colSpan={4}
                        className="text-center py-12 text-zinc-500"
                      >
                        Kayıt bulunamadı.
                      </TD>
                    </TR>
                  )}
                </tbody>
              </Table>
            </div>
            <div className="p-2 border-t border-zinc-800 bg-zinc-900/50 text-xs text-zinc-500 text-center shrink-0">
              Toplam {filteredItems.length} kayıt
            </div>
          </Card>
        </div>

        {/* === SAĞ: FORM (4 BİRİM) === */}
        <div className="col-span-12 lg:col-span-4 flex flex-col h-full min-h-0">
          <Card className="h-full flex flex-col overflow-hidden border-zinc-800 bg-zinc-900/60 backdrop-blur-xl p-0">
            <div className="flex justify-between items-center p-4 border-b border-zinc-800/50 shrink-0 bg-zinc-900/30">
              <div className="flex items-center gap-2">
                <div
                  className={`w-1.5 h-6 rounded-full shadow-lg ${
                    selectedId ? "bg-indigo-500" : "bg-emerald-500"
                  }`}
                />
                <h2 className="text-md font-bold text-white tracking-tight">
                  {selectedId ? "Senaryo Ayarları" : "Yeni Ayar"}
                </h2>
              </div>
              {selectedId && (
                <Badge variant="neutral" className="text-[10px]">
                  #{selectedId}
                </Badge>
              )}
            </div>
            <div className="shrink-0 border-b border-zinc-800/50 bg-zinc-950/30 px-4 py-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={applyLongFormStarter}
                className="h-8 w-full justify-center text-xs"
              >
                <Wand2 size={13} className="mr-1.5" />
                Long Form Starter Uygula
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-zinc-700">
              {detailLoading ? (
                <div className="flex h-full items-center justify-center text-zinc-500 gap-2">
                  <RefreshCw className="animate-spin" /> Yükleniyor...
                </div>
              ) : (
                <>
                  {/* İsim ve Connection */}
                  <div className="space-y-4">
                    <div>
                      <HelpLabel help="Preset listesinde ve workflow stage secimlerinde gorunen isim. Long-form icin amaci ve sure bandini isimde belirtmek sonraki secimleri kolaylastirir.">
                        Preset Adı <span className="text-indigo-400">*</span>
                      </HelpLabel>
                      <Input
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        className="bg-zinc-950/50 border-zinc-800 h-9 text-sm focus:border-indigo-500"
                        placeholder="Örn: Viral Shorts v2"
                      />
                    </div>
                    <div>
                      <HelpLabel help="Script'i uretmek icin kullanilacak AI baglantisi. JSON formatina sadik kalan ve uzun context'i iyi yoneten bir model/baglanti sec.">
                        AI Bağlantısı <span className="text-indigo-400">*</span>
                      </HelpLabel>
                      <Select
                        value={form.userAiConnectionId.toString()}
                        onChange={(val) =>
                          setForm({ ...form, userAiConnectionId: Number(val) })
                        }
                        options={connections}
                        placeholder="Bağlantı Seçiniz..."
                      />
                    </div>
                  </div>

                  {/* 3'lü Grid: Model, Ton, Dil */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <HelpLabel help="Metin ureten model adi. JSON sahne yapisini stabil donduren bir model secmek workflow sagligi icin kritik.">
                        Model
                      </HelpLabel>
                      <Input
                        value={form.modelName}
                        onChange={(e) =>
                          setForm({ ...form, modelName: e.target.value })
                        }
                        className="bg-zinc-950/50 border-zinc-800 h-9 text-xs"
                      />
                    </div>
                    <div>
                      <HelpLabel help="Senaryonun anlatim tonu. Prompt icindeki {Tone} degiskenini besler.">
                        Ton
                      </HelpLabel>
                      <Input
                        value={form.tone}
                        onChange={(e) =>
                          setForm({ ...form, tone: e.target.value })
                        }
                        className="bg-zinc-950/50 border-zinc-800 h-9 text-xs"
                        placeholder="Humorous"
                      />
                    </div>
                    <div>
                      <HelpLabel help="Script cikti dili. TTS ve STT presetleriyle uyumlu tutmak iyi olur.">
                        Dil
                      </HelpLabel>
                      <Input
                        value={form.language}
                        onChange={(e) =>
                          setForm({ ...form, language: e.target.value })
                        }
                        className="bg-zinc-950/50 border-zinc-800 h-9 text-xs"
                      />
                    </div>
                  </div>

                  {/* Süre ve Toggle'lar */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <HelpLabel help="Prompt'taki {Duration} degiskenini besler. Long Form icin 480-900 sn ilk test bandi; 900+ sn icin chapter sayisini artirmak gerekir.">
                        <span className="inline-flex items-center gap-1">
                          <Timer size={10} /> Süre (sn)
                        </span>
                      </HelpLabel>
                      <NumberInput
                        value={form.targetDurationSec}
                        onChange={(val) =>
                          setForm({ ...form, targetDurationSec: val })
                        }
                        min={15}
                        max={3600}
                        step={60}
                      />
                    </div>
                    <div>
                      <HelpLabel help="Aciksa user prompt'a videonun ilk saniyelerinde guclu bir kanca istemi eklenir.">
                        Hook
                      </HelpLabel>
                      <Toggle
                        label="Ekle"
                        checked={form.includeHook}
                        onChange={(v) => setForm({ ...form, includeHook: v })}
                      />
                    </div>
                    <div>
                      <HelpLabel help="Aciksa script sonunda dogal bir abone ol/yorum yap/cagri cumlesi istenir. Bilgilendirici long-form'da dozunda tutmak iyi olur.">
                        CTA
                      </HelpLabel>
                      <Toggle
                        label="Ekle"
                        checked={form.includeCta}
                        onChange={(v) => setForm({ ...form, includeCta: v })}
                      />
                    </div>
                  </div>

                  <PromptPreviewPanel
                    title="Senaryo prompt preview"
                    description="Alanlari bos birakirsan sistem long-form varsayilanini kullanir. Burada uretime gidecek etkili prompt'u gorursun."
                    systemInstruction={effectiveSystemInstruction}
                    promptTemplate={effectivePromptTemplate}
                    replacements={{
                      Topic:
                        "Title: Why Do We Procrastinate Even When We Know Better?\nPremise: A funny science-backed explanation of procrastination as emotion regulation.\nCentral question: Why does the brain choose short-term relief over long-term goals?",
                      MainTitle: "Why Do We Procrastinate Even When We Know Better?",
                      BriefTitle: "Why Do We Procrastinate Even When We Know Better?",
                      Angle: "Procrastination is emotion regulation with bad marketing.",
                      Audience: "Curious YouTube viewers who enjoy funny but science-grounded explanations.",
                      TargetDuration: `${form.targetDurationSec} seconds`,
                      MustCover: "instant gratification, anxiety avoidance, dopamine, practical payoff",
                      Avoid: "generic productivity guru advice",
                      Notes: "Use clear examples and visual comedy potential.",
                      Tone: form.tone,
                      Duration: form.targetDurationSec,
                      Language: form.language,
                      ConceptProfile:
                        "Whiteboardly long-form educational comedy profile with strict doodle visual identity.",
                      ConceptName: "Whiteboardly",
                      ChannelPromise: "Explain serious ideas with simple funny visual metaphors.",
                      ConceptAudience: "Smart casual viewers who like science explained without stiffness.",
                      ConceptTone: "Funny, educational, sarcastic, scientifically grounded",
                      VisualStyle: "Simple black-and-white stick figure educational doodles",
                      StyleBible: "Minimal black marker doodles, expressive stick figures, clean white background.",
                      CharacterBible: "Recurring simple stick figure cast with exaggerated expressions.",
                      TextPolicy: "Short handwritten phrases only when useful.",
                      ContentRules: "Keep ideas surprising, clear, and evidence-aware.",
                      DefaultDurationSec: form.targetDurationSec,
                    }}
                    contextItems={[
                      { label: "Tone", value: form.tone },
                      { label: "Duration", value: `${form.targetDurationSec} sn` },
                      { label: "Language", value: form.language },
                      { label: "Hook / CTA", value: `${form.includeHook ? "Hook" : "No hook"} / ${form.includeCta ? "CTA" : "No CTA"}` },
                    ]}
                  />

                  <AdvancedSection
                    title="Gelismis senaryo prompt override"
                    description="Normalde konsept + brief + backend JSON contract yeterli. Sadece script davranisini bilerek degistirmek istediginde doldur."
                  >
                  {isUsingDefaultScriptPrompt && (
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                      Bos alanlar backend long-form varsayilanlariyla calisir. Sadece ozel bir davranis istiyorsan bu bolumu doldur.
                    </div>
                  )}

                  {/* System Prompt */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <HelpLabel help="Opsiyonel. Bos birakirsan backend long-form senaryo yazari rolunu ve JSON disiplinini otomatik kullanir.">
                        System Instruction (opsiyonel)
                      </HelpLabel>
                      <button
                        onClick={() =>
                          setPreviewModal({
                            title: "System Instruction",
                            content: effectiveSystemInstruction,
                          })
                        }
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                      >
                        <Maximize2 size={12} /> Genişlet
                      </button>
                    </div>
                    <Textarea
                      className="h-20 font-mono text-xs bg-zinc-950/50 border-zinc-800 resize-none focus:border-indigo-500/50 text-zinc-300"
                      value={form.systemInstruction}
                      onChange={(e) =>
                        setForm({ ...form, systemInstruction: e.target.value })
                      }
                    />
                  </div>

                  {/* Prompt Template (Flex-1) */}
                  <div className="flex flex-col flex-1 min-h-[200px]">
                    <div className="flex justify-between items-center mb-1.5">
                      <HelpLabel help="Opsiyonel. Bos birakirsan konsept, brief, topic ve sure bilgisini kullanan standart long-form script prompt'u calisir.">
                        Prompt Sablonu (opsiyonel)
                      </HelpLabel>
                      <button
                        onClick={() =>
                          setPreviewModal({
                            title: "Prompt Sablonu",
                            content: effectivePromptTemplate,
                          })
                        }
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                      >
                        <Maximize2 size={12} /> Genişlet
                      </button>
                    </div>
                    <Textarea
                      className="flex-1 h-full w-full font-mono text-xs bg-zinc-950/50 border-zinc-800 focus:ring-indigo-500/20 focus:border-indigo-500 text-zinc-200 resize-none p-3"
                      value={form.promptTemplate}
                      onChange={(e) =>
                        setForm({ ...form, promptTemplate: e.target.value })
                      }
                      placeholder="Bos birak: backend long-form script prompt'unu kullansin."
                    />
                  </div>

                  <PromptContractGuard
                    kind="script"
                    systemInstruction={effectiveSystemInstruction}
                    promptTemplate={effectivePromptTemplate}
                    targetDurationSec={form.targetDurationSec}
                  />
                  </AdvancedSection>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/80 backdrop-blur flex items-center justify-end gap-2 shrink-0">
              <Button
                variant="ghost"
                onClick={handleNew}
                className="text-zinc-400 hover:text-white h-9 px-3 text-xs"
              >
                Vazgeç
              </Button>
              {selectedId && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setIsDeleteModalOpen(true)}
                  isLoading={detailLoading}
                  className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20 h-9 px-3 text-xs"
                >
                  <Trash2 size={14} className="mr-1.5" /> Sil
                </Button>
              )}
              <Button
                variant="primary"
                onClick={handleSave}
                isLoading={detailLoading}
                className="shadow-lg shadow-indigo-600/20 bg-indigo-600 hover:bg-indigo-500 text-white border-none h-9 px-4 text-xs"
              >
                <Save size={14} className="mr-1.5" />{" "}
                {selectedId ? "Kaydet" : "Oluştur"}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Silinsin mi?"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-zinc-300">
            <b>"{form.name}"</b> preseti silinecek.
          </p>
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              İptal
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              isLoading={detailLoading}
            >
              Evet, Sil
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!previewModal}
        onClose={() => setPreviewModal(null)}
        title={previewModal?.title}
        maxWidth="4xl"
      >
        <div className="flex flex-col gap-4">
          <div className="relative group">
            <div className="w-full h-[60vh] p-6 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-sm text-zinc-300 overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-words leading-relaxed shadow-inner">
              {previewModal?.content}
            </div>
            <button
              onClick={() => copyToClipboard(previewModal?.content || "")}
              className="absolute top-4 right-4 p-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-all border border-zinc-700 opacity-50 group-hover:opacity-100 backdrop-blur-sm"
            >
              <Copy size={16} />
            </button>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              variant="secondary"
              onClick={() => setPreviewModal(null)}
              className="min-w-[100px]"
            >
              Kapat
            </Button>
          </div>
        </div>
      </Modal>
    </Page>
  );
}
