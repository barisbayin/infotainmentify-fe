import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  FolderOpen,
  GripVertical,
  Layers,
  Maximize2,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import UploadConfigModal from "../components/UploadConfigModal";
import { useDebounce } from "../hooks/useDebounce";
import {
  pipelineTemplatesApi,
  type PipelineTemplateHealthDto,
  type PipelineTemplateHealthItemDto,
  type PipelineTemplateListDto,
  type SavePipelineTemplateDto,
  type StageConfigDto,
} from "../api/pipelineTemplates";
import { conceptsApi } from "../api/concepts";
import { topicPresetsApi } from "../api/topicPresets";
import { scriptPresetsApi } from "../api/scriptPresets";
import { imagePresetsApi } from "../api/imagePresets";
import { ttsPresetsApi } from "../api/ttsPresets";
import { sttPresetsApi } from "../api/sttPresets";
import { videoPresetsApi } from "../api/videoPresets";
import { renderPresetsApi } from "../api/renderPresets";
import { WorkflowHealthDetails, WorkflowStudio } from "../components/WorkflowStudio";
import {
  Badge,
  Button,
  Input,
  Label,
  Modal,
  Page,
  Select,
} from "../components/ui-kit";

const STAGE_TYPES = [
  { value: "Topic", label: "Konu" },
  { value: "Script", label: "Senaryo" },
  { value: "Image", label: "Gorsel" },
  { value: "Tts", label: "Seslendirme" },
  { value: "Stt", label: "Altyazi Zamanlama" },
  { value: "Video", label: "Video AI" },
  { value: "SceneLayout", label: "Kurgu / Timeline" },
  { value: "Render", label: "Final Render" },
  { value: "Thumbnail", label: "Kapak" },
  { value: "Upload", label: "Yayin / Yukleme" },
];

const WORKFLOW_STAGE_TYPES = STAGE_TYPES.map((stage) =>
  stage.value === "Video"
    ? { ...stage, value: "VideoAI", label: "Video AI" }
    : stage
);

const PRODUCTION_PROFILES = [
  { value: "Generic", label: "Generic" },
  { value: "Shorts", label: "Shorts" },
  { value: "LongForm", label: "Long Form" },
  { value: "Podcast", label: "Podcast" },
];

const profileLabel = (value?: string) =>
  PRODUCTION_PROFILES.find((profile) => profile.value === value)?.label ?? "Generic";

const stageDisplayLabel = (stageType: string) =>
  WORKFLOW_STAGE_TYPES.find((stage) => stage.value === stageType)?.label ?? stageType;

const stageFlowLabel = (stages: string[]) =>
  stages.map((stageType) => stageDisplayLabel(stageType)).join(" -> ");

const healthStatusLabel = (status?: string) => {
  switch ((status || "").toLowerCase()) {
    case "healthy":
    case "success":
      return "Hazir";
    case "warning":
      return "Uyari";
    case "error":
      return "Blokaj";
    case "info":
      return "Bilgi";
    case "unknown":
      return "Bilinmiyor";
    case "draft":
    case "":
      return "Taslak";
    default:
      return status || "Taslak";
  }
};

type PresetOption = {
  label: string;
  value: string;
};

type WorkflowNodePositionMap = Record<string, { x: number; y: number }>;

type WorkflowBlueprint = {
  key: string;
  title: string;
  badge: string;
  description: string;
  productionProfile: string;
  autoPublish: boolean;
  stages: string[];
};

const WORKFLOW_BLUEPRINTS: WorkflowBlueprint[] = [
  {
    key: "shorts-factory",
    title: "Shorts Hatti",
    badge: "9:16",
    description:
      "Kisa video icin konu, senaryo, gorsel, ses, altyazi, render ve yayin akisi.",
    productionProfile: "Shorts",
    autoPublish: false,
    stages: ["Topic", "Script", "Image", "Tts", "Stt", "SceneLayout", "Render", "Upload"],
  },
  {
    key: "long-form",
    title: "Uzun Video Hatti",
    badge: "16:9",
    description:
      "8-15 dakika pilot long-form icin guvenli timeline, render ve kapak akisi.",
    productionProfile: "LongForm",
    autoPublish: false,
    stages: ["Topic", "Script", "Image", "Tts", "Stt", "SceneLayout", "Render", "Thumbnail"],
  },
  {
    key: "audio-first",
    title: "Podcast / Audio Hatti",
    badge: "audio",
    description:
      "Ses odakli icerik icin anlatim, altyazi, loop gorsel, render ve kapak akisi.",
    productionProfile: "Podcast",
    autoPublish: false,
    stages: ["Topic", "Script", "Image", "Tts", "Stt", "SceneLayout", "Render", "Thumbnail"],
  },
];

const EMPTY_FORM: SavePipelineTemplateDto = {
  name: "",
  description: "",
  conceptId: 0,
  productionProfile: "Generic",
  workflowLayoutJson: undefined,
  autoPublish: false,
  stages: [],
};

const parseWorkflowNodePositions = (
  workflowLayoutJson?: string
): WorkflowNodePositionMap => {
  if (!workflowLayoutJson) return {};

  try {
    return JSON.parse(workflowLayoutJson) as WorkflowNodePositionMap;
  } catch (error) {
    console.error("Workflow layout parse edilemedi", error);
    return {};
  }
};

const serializeWorkflowNodePositions = (positions: WorkflowNodePositionMap) => {
  return Object.keys(positions).length > 0 ? JSON.stringify(positions) : undefined;
};

const buildStagesFromBlueprint = (blueprint: WorkflowBlueprint): StageConfigDto[] =>
  blueprint.stages.map((stageType, index) => ({
    stageType,
    order: index + 1,
  }));

export default function PipelineTemplatesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<PipelineTemplateListDto[]>([]);
  const [concepts, setConcepts] = useState<PresetOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form, setForm] = useState<SavePipelineTemplateDto>(EMPTY_FORM);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [health, setHealth] = useState<PipelineTemplateHealthDto | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [isWorkflowFocusOpen, setIsWorkflowFocusOpen] = useState(false);

  const [selectedStageType, setSelectedStageType] = useState<string>("Topic");
  const [selectedPresetId, setSelectedPresetId] = useState<number>(0);
  const [availablePresets, setAvailablePresets] = useState<PresetOption[]>([]);
  const [presetLoading, setPresetLoading] = useState(false);
  const [selectedConceptId, setSelectedConceptId] = useState<string>("");

  const [uploadModal, setUploadModal] = useState<{
    isOpen: boolean;
    stageIndex: number | null;
  }>({
    isOpen: false,
    stageIndex: null,
  });
  const [stagePresetModal, setStagePresetModal] = useState<{
    isOpen: boolean;
    stageIndex: number | null;
  }>({
    isOpen: false,
    stageIndex: null,
  });
  const [stagePresetOptions, setStagePresetOptions] = useState<PresetOption[]>([]);
  const [stagePresetLoading, setStagePresetLoading] = useState(false);
  const [stagePresetValue, setStagePresetValue] = useState<number>(0);
  const [workflowPresetOptions, setWorkflowPresetOptions] = useState<
    Record<string, PresetOption[]>
  >({});
  const [workflowPresetOptionsLoading, setWorkflowPresetOptionsLoading] =
    useState(false);
  const [workflowNodePositions, setWorkflowNodePositions] =
    useState<WorkflowNodePositionMap>({});
  const workflowLayoutSaveTimer = useRef<number | null>(null);

  const saveWorkflowNodePositions = (positions: WorkflowNodePositionMap) => {
    const workflowLayoutJson = serializeWorkflowNodePositions(positions);
    setWorkflowNodePositions(positions);
    setForm((prev) => ({ ...prev, workflowLayoutJson }));

    if (!selectedId) return;

    if (workflowLayoutSaveTimer.current) {
      window.clearTimeout(workflowLayoutSaveTimer.current);
    }

    const templateId = selectedId;
    workflowLayoutSaveTimer.current = window.setTimeout(() => {
      pipelineTemplatesApi
        .updateWorkflowLayout(templateId, workflowLayoutJson)
        .catch((error) => {
          console.error("Workflow layout BE'ye kaydedilemedi", error);
          toast.error("Akis yerlesimi kaydedilemedi.");
        });
    }, 500);
  };

  const clearWorkflowNodePositions = () => {
    setWorkflowNodePositions({});
    setForm((prev) => ({ ...prev, workflowLayoutJson: undefined }));
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [templatesData, conceptsData] = await Promise.all([
        pipelineTemplatesApi.list(debouncedSearch, selectedConceptId),
        conceptsApi.list(),
      ]);
      setItems(templatesData);
      setConcepts(
        conceptsData.map((concept) => ({
          label: concept.name,
          value: concept.id.toString(),
        }))
      );
    } catch {
      toast.error("Veriler yuklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const loadHealth = async (templateId: number) => {
    setHealthLoading(true);
    try {
      const data = await pipelineTemplatesApi.health(templateId);
      setHealth(data);
    } catch (error) {
      console.error("Workflow health alinamadi", error);
      setHealth(null);
      toast.error("Hazirlik kontrolu alinamadi.");
    } finally {
      setHealthLoading(false);
    }
  };

  const loadPresetOptionsForStage = async (stageType: string) => {
    let data: any[] = [];

    switch (stageType) {
      case "Topic":
        data = await topicPresetsApi.list();
        break;
      case "Script":
        data = await scriptPresetsApi.list();
        break;
      case "Image":
      case "Thumbnail":
        data = await imagePresetsApi.list();
        break;
      case "Tts":
        data = await ttsPresetsApi.list();
        break;
      case "Stt":
        data = await sttPresetsApi.list();
        break;
      case "Video":
      case "VideoAI":
        data = await videoPresetsApi.list();
        break;
      case "SceneLayout":
      case "Render":
        data = await renderPresetsApi.list();
        break;
      default:
        data = [];
        break;
    }

    return data.map((preset) => ({
      label: preset.name,
      value: preset.id.toString(),
    }));
  };

  useEffect(() => {
    loadData();
  }, [debouncedSearch, selectedConceptId]);

  useEffect(() => {
    return () => {
      if (workflowLayoutSaveTimer.current) {
        window.clearTimeout(workflowLayoutSaveTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchPresets = async () => {
      setPresetLoading(true);
      setAvailablePresets([]);
      setSelectedPresetId(0);

      try {
        const options = await loadPresetOptionsForStage(selectedStageType);
        if (!cancelled) {
          setAvailablePresets(options);
        }
      } catch (error) {
        console.error("Presetler cekilemedi", error);
      } finally {
        if (!cancelled) {
          setPresetLoading(false);
        }
      }
    };

    fetchPresets();

    return () => {
      cancelled = true;
    };
  }, [selectedStageType]);

  useEffect(() => {
    const stageTypes = Array.from(
      new Set(form.stages.map((stage) => stage.stageType))
    ).filter((stageType) => stageType !== "Upload");

    if (stageTypes.length === 0) {
      setWorkflowPresetOptions({});
      return;
    }

    let cancelled = false;

    const fetchWorkflowPresetOptions = async () => {
      setWorkflowPresetOptionsLoading(true);
      try {
        const entries = await Promise.all(
          stageTypes.map(async (stageType) => [
            stageType,
            await loadPresetOptionsForStage(stageType),
          ] as const)
        );

        if (!cancelled) {
          setWorkflowPresetOptions(Object.fromEntries(entries));
        }
      } catch (error) {
        console.error("Workflow preset secenekleri alinamadi", error);
      } finally {
        if (!cancelled) {
          setWorkflowPresetOptionsLoading(false);
        }
      }
    };

    fetchWorkflowPresetOptions();

    return () => {
      cancelled = true;
    };
  }, [form.stages.map((stage) => stage.stageType).join("|")]);

  const handleSelect = async (id: number) => {
    if (id === selectedId) return;

    setSelectedId(id);
    setDetailLoading(true);
    try {
      const data = await pipelineTemplatesApi.get(id);
      setForm({
        name: data.name,
        description: data.description ?? "",
        conceptId: data.conceptId,
        productionProfile: data.productionProfile ?? "Generic",
        workflowLayoutJson: data.workflowLayoutJson,
        autoPublish: data.autoPublish,
        stages: data.stages.sort((a, b) => a.order - b.order),
      });
      setWorkflowNodePositions(parseWorkflowNodePositions(data.workflowLayoutJson));
      await loadHealth(id);
    } catch {
      toast.error("Detay yuklenemedi.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleNew = () => {
    setSelectedId(null);
    setForm(EMPTY_FORM);
    setHealth(null);
    setWorkflowNodePositions({});
    setSelectedStageType("Topic");
    setSelectedPresetId(0);
    setAvailablePresets([]);
  };

  const applyWorkflowBlueprint = (blueprint: WorkflowBlueprint) => {
    setForm((prev) => ({
      ...prev,
      name: prev.name || blueprint.title,
      description: prev.description || blueprint.description,
      productionProfile: blueprint.productionProfile,
      autoPublish: blueprint.autoPublish,
      stages: buildStagesFromBlueprint(blueprint),
    }));
    setHealth(null);
    setSelectedStageType(blueprint.stages[0] ?? "Topic");
    setSelectedPresetId(0);
    setAvailablePresets([]);
    clearWorkflowNodePositions();
    toast.success(`${blueprint.title} taslagi uygulandi.`);
  };

  const addStage = () => {
    if (availablePresets.length > 0 && selectedPresetId === 0) {
      toast.error("Lutfen bir preset sec.");
      return;
    }

    const newStage: StageConfigDto = {
      stageType: selectedStageType === "Video" ? "VideoAI" : selectedStageType,
      order: form.stages.length + 1,
      presetId: selectedPresetId > 0 ? selectedPresetId : undefined,
    };

    setForm((prev) => ({ ...prev, stages: [...prev.stages, newStage] }));
    setHealth(null);
    setSelectedPresetId(0);
  };

  const removeStage = (index: number) => {
    const newStages = form.stages.filter((_, stageIndex) => stageIndex !== index);
    newStages.forEach((stage, stageIndex) => (stage.order = stageIndex + 1));
    setForm((prev) => ({ ...prev, stages: newStages }));
    setHealth(null);
  };

  const moveStage = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === form.stages.length - 1) return;

    const newStages = [...form.stages];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newStages[index], newStages[targetIndex]] = [
      newStages[targetIndex],
      newStages[index],
    ];
    newStages.forEach((stage, stageIndex) => (stage.order = stageIndex + 1));
    setForm((prev) => ({ ...prev, stages: newStages }));
    setHealth(null);
  };

  const openStagePresetModal = async (index: number) => {
    const stage = form.stages[index];
    if (!stage) return;

    if (stage.stageType === "Upload") {
      setUploadModal({ isOpen: true, stageIndex: index });
      return;
    }

    setStagePresetModal({ isOpen: true, stageIndex: index });
    setStagePresetValue(stage.presetId ?? 0);
    setStagePresetOptions([]);
    setStagePresetLoading(true);

    try {
      const options = await loadPresetOptionsForStage(stage.stageType);
      setStagePresetOptions(options);
    } catch (error) {
      console.error("Stage presetleri alinamadi", error);
      toast.error("Preset listesi alinamadi.");
    } finally {
      setStagePresetLoading(false);
    }
  };

  const saveStagePreset = () => {
    if (stagePresetModal.stageIndex === null) return;

    const newStages = [...form.stages];
    const stage = newStages[stagePresetModal.stageIndex];
    if (!stage) return;

    stage.presetId = stagePresetValue > 0 ? stagePresetValue : undefined;
    setForm({ ...form, stages: newStages });
    setHealth(null);
    setStagePresetModal({ isOpen: false, stageIndex: null });
  };

  const handleWorkflowPresetChange = (stageIndex: number, presetId: number) => {
    const newStages = [...form.stages];
    const stage = newStages[stageIndex];
    if (!stage) return;

    newStages[stageIndex] = {
      ...stage,
      presetId: presetId > 0 ? presetId : undefined,
    };
    setForm({ ...form, stages: newStages });
    setHealth(null);
  };

  const handleHealthFix = (item: PipelineTemplateHealthItemDto) => {
    setIsHealthModalOpen(false);

    if (
      item.code.startsWith("preset.connection") ||
      item.code === "preset.connection_secret_missing"
    ) {
      navigate("/ai-connections");
      return;
    }

    if (item.code.startsWith("upload.channel")) {
      navigate("/social-channels");
      return;
    }

    if (item.stageOrder) {
      const stageIndex = form.stages.findIndex(
        (stage) => stage.order === item.stageOrder
      );
      if (stageIndex >= 0) {
        if (item.stageType === "Upload" || item.code.startsWith("upload.")) {
          setUploadModal({ isOpen: true, stageIndex });
          return;
        }

        if (item.code.includes("preset") || item.code.startsWith("profile.longform.")) {
          void openStagePresetModal(stageIndex);
          return;
        }
      }
    }

    if (item.code === "workflow.autopublish_without_upload") {
      setSelectedStageType("Upload");
      toast("Yayin adimini ekleme alanini hazirladim.");
      return;
    }

    toast("Bu uyari icin adim sirasini ve akis listesini gozden gecir.");
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.conceptId) {
      toast.error("Hat adi ve konsept zorunlu.");
      return;
    }
    if (form.stages.length === 0) {
      toast.error("En az bir adim eklemelisin.");
      return;
    }

    setDetailLoading(true);
    try {
      if (selectedId) {
        await pipelineTemplatesApi.update(selectedId, form);
        await loadHealth(selectedId);
        toast.success("Guncellendi.");
      } else {
        await pipelineTemplatesApi.create(form);
        toast.success("Olusturuldu.");
        handleNew();
      }
      loadData();
    } catch {
      toast.error("Kayit basarisiz.");
    } finally {
      setDetailLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedId) return;
    setDetailLoading(true);
    try {
      await pipelineTemplatesApi.delete(selectedId);
      toast.success("Silindi.");
      setIsDeleteModalOpen(false);
      handleNew();
      loadData();
    } catch {
      toast.error("Silme basarisiz.");
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );
  const selectedTemplate = selectedId
    ? items.find((item) => item.id === selectedId)
    : null;
  const selectedConceptLabel =
    concepts.find((concept) => concept.value === form.conceptId.toString())
      ?.label ?? selectedTemplate?.conceptName;

  return (
    <Page>
      <div className="flex h-full min-h-0 flex-col gap-4">
        <div className="shrink-0 rounded-2xl border border-zinc-800/70 bg-zinc-950/45 px-4 py-3 shadow-xl shadow-black/20">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Layers className="text-indigo-400" size={22} />
                <h1 className="text-xl font-bold tracking-tight text-white">
                  Uretim Hatlari
                </h1>
                <Badge variant={selectedId ? "neutral" : "success"}>
                  {selectedId ? `#${selectedId}` : "Taslak"}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Uzun video, shorts veya podcast icin akisi sec; presetleri bagla ve hazirligini kontrol et.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="w-52">
                <Select
                  value={selectedConceptId}
                  onChange={setSelectedConceptId}
                  options={[{ label: "Tum Konseptler", value: "" }, ...concepts]}
                  placeholder="Konsept filtrele"
                  className="h-9 text-xs"
                />
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  placeholder="Hat ara..."
                  className="h-9 pl-9"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={loadData}
                className="h-9 w-9 rounded-xl border-zinc-800 bg-zinc-950/40"
              >
                <RefreshCw className={loading ? "animate-spin" : ""} size={16} />
              </Button>
              <Button
                onClick={handleNew}
                className="h-9 rounded-xl bg-indigo-600 px-4 text-white hover:bg-indigo-500"
              >
                <Plus size={16} className="mr-2" /> Yeni Hat
              </Button>
            </div>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/45">
            <div className="shrink-0 border-b border-zinc-800/70 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-bold text-white">Hatlarim</div>
                  <div className="text-[11px] text-zinc-500">
                    {filteredItems.length} uretim hatti
                  </div>
                </div>
                <Badge variant="neutral" className="text-[10px]">
                  {items.length} toplam
                </Badge>
              </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-800">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`w-full rounded-xl border p-3 text-left transition-all ${
                    selectedId === item.id
                      ? "border-indigo-500/50 bg-indigo-500/10 shadow-lg shadow-indigo-500/10"
                      : "border-zinc-800/70 bg-zinc-900/35 hover:border-zinc-700 hover:bg-zinc-900/70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-zinc-100">
                        {item.name}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-zinc-500">
                        <FolderOpen size={11} className="text-amber-500/70" />
                        <span className="truncate">{item.conceptName}</span>
                      </div>
                    </div>
                    <Badge variant="neutral" className="shrink-0 text-[10px]">
                      {item.stageCount}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 text-[10px] text-zinc-600">
                    <span>{item.stageCount} adim</span>
                    <Badge variant="neutral" className="max-w-[96px] truncate text-[10px]">
                      {profileLabel(item.productionProfile)}
                    </Badge>
                    <span>{new Date(item.createdAt).toLocaleDateString("tr-TR")}</span>
                  </div>
                </button>
              ))}

              {filteredItems.length === 0 && !loading && (
                <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-center text-xs text-zinc-500">
                  Uretim hatti bulunamadi.
                </div>
              )}
            </div>
          </aside>

          <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/45">
            <div className="shrink-0 border-b border-zinc-800/70 bg-zinc-900/30 p-4">
              <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-7 w-1.5 rounded-full ${
                        selectedId ? "bg-indigo-500" : "bg-emerald-500"
                      }`}
                    />
                    <div>
                      <h2 className="truncate text-lg font-bold text-white">
                        {form.name || (selectedId ? "Hatti Duzenle" : "Yeni Uretim Hatti")}
                      </h2>
                      <div className="mt-0.5 text-[11px] text-zinc-500">
                        {selectedConceptLabel || "Konsept secilmedi"} / {form.stages.length} adim
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsWorkflowFocusOpen(true)}
                    className="h-8 rounded-lg px-3 text-xs"
                  >
                    <Maximize2 size={13} className="mr-1.5" />
                    Odak
                  </Button>
                  <Badge
                    variant={
                      health?.status === "Error"
                        ? "error"
                        : health?.status === "Warning"
                          ? "warning"
                          : health?.status
                            ? "success"
                            : "neutral"
                    }
                  >
                    {healthStatusLabel(health?.status)}
                  </Badge>
                  <Badge variant="neutral">
                    Hata {health?.errorCount ?? 0} / Uyari {health?.warningCount ?? 0} / Bilgi {health?.infoCount ?? 0}
                  </Badge>
                  <Badge variant={form.productionProfile === "LongForm" ? "warning" : "neutral"}>
                    {profileLabel(form.productionProfile)}
                  </Badge>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/35 p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                      Hat Bilgisi
                    </div>
                    <div className="mt-0.5 text-[11px] text-zinc-600">
                      Bu alan sadece hattin kimligini belirler; akisi alttaki kartlardan veya sag panelden kur.
                    </div>
                  </div>
                </div>

              <div className="grid gap-3 xl:grid-cols-[1.1fr_.8fr_.75fr_1fr_auto]">
                <div>
                  <Label className="mb-1">Hat Adi *</Label>
                  <Input
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    className="h-9 bg-zinc-950/50"
                    placeholder="Orn: Uzun Video - Belgesel"
                  />
                </div>
                <div>
                  <Label className="mb-1">Konsept *</Label>
                  <Select
                    value={form.conceptId.toString()}
                    onChange={(value) => setForm({ ...form, conceptId: Number(value) })}
                    options={concepts}
                    placeholder="Konsept sec..."
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="mb-1">Profil</Label>
                  <Select
                    value={form.productionProfile ?? "Generic"}
                    onChange={(value) => {
                      setForm({ ...form, productionProfile: value });
                      setHealth(null);
                    }}
                    options={PRODUCTION_PROFILES}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="mb-1">Aciklama</Label>
                  <Input
                    value={form.description}
                    onChange={(event) =>
                      setForm({ ...form, description: event.target.value })
                    }
                    className="h-9 bg-zinc-950/50"
                    placeholder="Opsiyonel"
                  />
                </div>
                <label className="flex h-9 items-center gap-2 self-end rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={form.autoPublish}
                    onChange={(event) => {
                      setForm({ ...form, autoPublish: event.target.checked });
                      setHealth(null);
                    }}
                    className="h-4 w-4 cursor-pointer accent-indigo-500"
                  />
                  Otomatik yayin
                </label>
              </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 scrollbar-thin scrollbar-thumb-zinc-800">
              {detailLoading ? (
                <div className="flex h-full items-center justify-center gap-2 text-zinc-500">
                  <RefreshCw className="animate-spin" /> Yukleniyor...
                </div>
              ) : (
                <div className="flex min-h-full flex-col gap-4">
                  <section className="shrink-0 rounded-xl border border-zinc-800 bg-zinc-900/30 p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-bold text-white">
                          <FolderOpen size={15} className="text-indigo-400" />
                          Hazir Baslangiclar
                        </div>
                        <p className="mt-1 text-[11px] text-zinc-500">
                          Sifirdan adim dizmek yerine bir hat sec, sonra presetleri kutular uzerinden doldur.
                        </p>
                      </div>
                      <Badge variant="neutral" className="hidden shrink-0 text-[10px] sm:inline-flex">
                        Tek tikla kurulum
                      </Badge>
                    </div>

                    <div className="grid gap-2 lg:grid-cols-3">
                      {WORKFLOW_BLUEPRINTS.map((blueprint) => {
                        const isActive =
                          form.productionProfile === blueprint.productionProfile &&
                          form.stages.map((stage) => stage.stageType).join("|") === blueprint.stages.join("|");

                        return (
                          <button
                            key={blueprint.key}
                            type="button"
                            onClick={() => applyWorkflowBlueprint(blueprint)}
                            className={`rounded-xl border p-3 text-left transition-all ${
                              isActive
                                ? "border-indigo-500/60 bg-indigo-500/10 shadow-lg shadow-indigo-500/10"
                                : "border-zinc-800 bg-zinc-950/40 hover:border-indigo-500/40 hover:bg-zinc-900/70"
                            }`}
                          >
                            <div className="mb-2 flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-bold text-zinc-100">
                                  {blueprint.title}
                                </div>
                                <div className="mt-1 text-[11px] leading-relaxed text-zinc-500">
                                  {blueprint.description}
                                </div>
                              </div>
                              <Badge variant={isActive ? "success" : "neutral"} className="shrink-0 text-[10px]">
                                {blueprint.badge}
                              </Badge>
                            </div>
                            <div className="truncate rounded-lg border border-zinc-800/70 bg-zinc-950/60 px-2 py-1.5 text-[10px] text-zinc-400">
                              {stageFlowLabel(blueprint.stages)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_340px]">
                  <div className="min-w-0">
                    <WorkflowStudio
                      stages={form.stages}
                      health={health}
                      loading={healthLoading}
                      presetOptionsByStageType={workflowPresetOptions}
                      presetOptionsLoading={workflowPresetOptionsLoading}
                      nodePositions={workflowNodePositions}
                      onNodePositionsChange={saveWorkflowNodePositions}
                      onRefresh={() => {
                        if (!selectedId) {
                          toast.error("Hazirlik kontrolu icin once hatti kaydet.");
                          return;
                        }
                        loadHealth(selectedId);
                      }}
                      onOpenHealth={() => setIsHealthModalOpen(true)}
                      onFixFinding={handleHealthFix}
                      onStagePresetChange={handleWorkflowPresetChange}
                      onStageSettings={openStagePresetModal}
                    />
                  </div>

                  <aside className="flex min-h-0 flex-col gap-3 overflow-hidden">
                    <div className="shrink-0 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3">
                      <div className="flex items-center gap-2 text-sm font-bold text-indigo-100">
                        <Layers size={14} className="text-indigo-300" />
                        Kurulum Rehberi
                      </div>
                      <div className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-zinc-400">
                        <div><b className="text-zinc-200">1.</b> Hazir baslangic sec.</div>
                        <div><b className="text-zinc-200">2.</b> Kutular uzerinden presetleri bagla.</div>
                        <div><b className="text-zinc-200">3.</b> Hazirlik kontrolu calistir, hata kalmayinca kaydet.</div>
                      </div>
                    </div>

                    <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-zinc-800 bg-zinc-900/35 p-3">
                      <Label className="mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Layers size={12} /> Adim Sirasi
                        </span>
                        <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[10px] text-zinc-500">
                          {form.stages.length} adim
                        </span>
                      </Label>

                      <div className="mb-3 grid grid-cols-[1fr_1fr_auto] items-end gap-2 rounded-xl border border-zinc-800/70 bg-zinc-950/35 p-2.5">
                        <div>
                          <Label className="mb-1 text-[10px] text-zinc-500">Adim</Label>
                          <Select
                            value={selectedStageType}
                            onChange={setSelectedStageType}
                            options={WORKFLOW_STAGE_TYPES}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="min-w-0">
                          <Label className="mb-1 flex items-center gap-1 text-[10px] text-zinc-500">
                            {presetLoading && <RefreshCw size={8} className="animate-spin" />}
                            Preset
                          </Label>
                          <Select
                            value={selectedPresetId.toString()}
                            onChange={(value) => setSelectedPresetId(Number(value))}
                            options={availablePresets}
                            placeholder={availablePresets.length > 0 ? "Sec..." : "Yok"}
                            className="h-8 text-xs"
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={addStage}
                          className="h-8 rounded-lg bg-indigo-600 px-3 text-white hover:bg-indigo-500"
                        >
                          <Plus size={14} />
                        </Button>
                      </div>

                      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
                        {form.stages.length === 0 && (
                          <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/25 py-8 text-center text-xs text-zinc-500">
                            Once hazir baslangic sec veya adim ekle.
                          </div>
                        )}

                        {form.stages.map((stage, index) => {
                          const stageLabel =
                            stageDisplayLabel(stage.stageType);

                          return (
                            <div
                              key={`${stage.stageType}-${index}`}
                              className="group flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/45 p-2 transition-all hover:border-zinc-700"
                            >
                              <div className="flex w-7 flex-col items-center justify-center text-zinc-600">
                                <GripVertical size={14} />
                                <span className="mt-0.5 font-mono text-[9px] font-bold text-zinc-700">
                                  {index + 1}
                                </span>
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="truncate text-xs font-bold text-zinc-200">
                                    {stageLabel}
                                  </span>
                                  {stage.stageType === "Upload" ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setUploadModal({ isOpen: true, stageIndex: index })}
                                      className="ml-1 h-5 rounded-md px-2 py-0 text-[10px]"
                                    >
                                      <Settings size={10} className="mr-1" /> Ayar
                                    </Button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => openStagePresetModal(index)}
                                      className={`ml-1 rounded-full px-2 py-0.5 font-mono text-[9px] transition-colors ${
                                        stage.presetId
                                          ? "bg-indigo-500/10 text-indigo-400 ring-1 ring-inset ring-indigo-500/20 hover:bg-indigo-500/20"
                                          : "bg-zinc-800/60 text-zinc-500 ring-1 ring-inset ring-zinc-700/50 hover:text-zinc-300"
                                      }`}
                                    >
                                      {stage.presetId ? `#${stage.presetId}` : "preset sec"}
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                                <div className="flex flex-col gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => moveStage(index, "up")}
                                    disabled={index === 0}
                                    className="p-0.5 text-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-10"
                                  >
                                    <ArrowUp size={10} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveStage(index, "down")}
                                    disabled={index === form.stages.length - 1}
                                    className="p-0.5 text-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-10"
                                  >
                                    <ArrowDown size={10} />
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeStage(index)}
                                  className="ml-1 rounded p-1.5 text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </aside>
                </div>
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-zinc-800/70 bg-zinc-900/70 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] text-zinc-500">
                  Adim ve preset degisiklikleri Kaydet ile kalici olur; canvas pozisyonlari otomatik kaydedilir.
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={handleNew}
                    className="h-9 px-3 text-xs text-zinc-400 hover:text-white"
                  >
                    Vazgec
                  </Button>
                  {selectedId && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="h-9 px-3 text-xs"
                    >
                      <Trash2 size={14} className="mr-1.5" /> Sil
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    className="h-9 bg-indigo-600 px-4 text-xs text-white hover:bg-indigo-500"
                  >
                    <Save size={14} className="mr-1.5" />
                    {selectedId ? "Kaydet" : "Olustur"}
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {isWorkflowFocusOpen && (
        <div className="absolute inset-0 z-40 flex flex-col bg-zinc-950 p-4">
          <div className="mb-3 flex shrink-0 flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3 shadow-2xl shadow-black/40 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-indigo-400" />
                <h2 className="truncate text-base font-bold text-white">
                  {form.name || "Hat Odak Modu"}
                </h2>
                <Badge
                  variant={
                    health?.status === "Error"
                      ? "error"
                      : health?.status === "Warning"
                        ? "warning"
                        : health?.status
                          ? "success"
                          : "neutral"
                  }
                >
                  {healthStatusLabel(health?.status)}
                </Badge>
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">
                {selectedConceptLabel || "Konsept secilmedi"} / {form.stages.length} adim
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {selectedId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => loadHealth(selectedId)}
                  className="h-8 rounded-lg px-3 text-xs"
                  disabled={healthLoading}
                >
                  <RefreshCw
                    size={13}
                    className={`mr-1.5 ${healthLoading ? "animate-spin" : ""}`}
                  />
                  Kontrol
                </Button>
              )}
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSave}
                className="h-8 rounded-lg bg-indigo-600 px-3 text-xs text-white hover:bg-indigo-500"
              >
                <Save size={13} className="mr-1.5" />
                Kaydet
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsWorkflowFocusOpen(false)}
                className="h-8 rounded-lg px-3 text-xs"
              >
                <X size={13} className="mr-1.5" />
                Kapat
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            <WorkflowStudio
              stages={form.stages}
              health={health}
              loading={healthLoading}
              presetOptionsByStageType={workflowPresetOptions}
              presetOptionsLoading={workflowPresetOptionsLoading}
              nodePositions={workflowNodePositions}
              onNodePositionsChange={saveWorkflowNodePositions}
              canvasClassName="h-full min-h-0 flex-1 max-h-none"
              className="flex h-full min-h-0 flex-col"
              focusMode
              onRefresh={() => {
                if (!selectedId) {
                  toast.error("Hazirlik kontrolu icin once hatti kaydet.");
                  return;
                }
                loadHealth(selectedId);
              }}
              onOpenHealth={() => setIsHealthModalOpen(true)}
              onFixFinding={handleHealthFix}
              onStagePresetChange={handleWorkflowPresetChange}
              onStageSettings={openStagePresetModal}
            />
          </div>
        </div>
      )}

      <Modal
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
        title="Uretime Hazirlik"
        maxWidth="4xl"
      >
        <WorkflowHealthDetails
          health={health}
          loading={healthLoading}
          onFixFinding={handleHealthFix}
        />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Uretim Hatti Silinsin mi?"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
            <AlertTriangle className="shrink-0 text-red-500" size={24} />
            <p className="text-sm text-zinc-300">
              <b>"{form.name}"</b> uretim hatti silinecek.
            </p>
          </div>
          <div className="mt-2 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              Iptal
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Evet, Sil
            </Button>
          </div>
        </div>
      </Modal>

      <UploadConfigModal
        isOpen={uploadModal.isOpen}
        onClose={() => setUploadModal({ isOpen: false, stageIndex: null })}
        initialConfig={
          uploadModal.stageIndex !== null && form.stages[uploadModal.stageIndex]
            ? form.stages[uploadModal.stageIndex].optionsJson
            : undefined
        }
        onSave={(json) => {
          if (uploadModal.stageIndex === null) return;
          const newStages = [...form.stages];
          newStages[uploadModal.stageIndex].optionsJson = json;
          setForm({ ...form, stages: newStages });
          setHealth(null);
        }}
      />

      <Modal
        isOpen={stagePresetModal.isOpen}
        onClose={() => setStagePresetModal({ isOpen: false, stageIndex: null })}
        title="Adim Preseti Sec"
      >
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 text-xs text-zinc-400">
            {stagePresetModal.stageIndex !== null &&
            form.stages[stagePresetModal.stageIndex] ? (
              <>
                <b className="text-zinc-200">
                  #{form.stages[stagePresetModal.stageIndex].order}{" "}
                  {stageDisplayLabel(form.stages[stagePresetModal.stageIndex].stageType)}
                </b>{" "}
                icin preset seciyorsun. Kaydettikten sonra hazirlik kontrolunu tekrar calistir.
              </>
            ) : (
              "Adim bulunamadi."
            )}
          </div>

          <div>
            <Label className="mb-1.5">Preset</Label>
            <Select
              value={stagePresetValue.toString()}
              onChange={(value) => setStagePresetValue(Number(value))}
              options={stagePresetOptions}
              placeholder={
                stagePresetLoading
                  ? "Yukleniyor..."
                  : stagePresetOptions.length > 0
                    ? "Preset sec..."
                    : "Bu adim icin preset bulunamadi"
              }
              className="h-9 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setStagePresetModal({ isOpen: false, stageIndex: null })}
            >
              Vazgec
            </Button>
            <Button
              variant="primary"
              onClick={saveStagePreset}
              disabled={stagePresetLoading || stagePresetOptions.length === 0}
            >
              Preseti Uygula
            </Button>
          </div>
        </div>
      </Modal>
    </Page>
  );
}
