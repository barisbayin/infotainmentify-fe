import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  applyNodeChanges,
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeChange,
  type NodeProps,
  type OnNodeDrag,
  type ReactFlowInstance,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  Info,
  RefreshCw,
  Route,
  Settings2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge, Button, Tooltip, cn } from "./ui-kit";
import type {
  PipelineTemplateHealthDto,
  PipelineTemplateHealthItemDto,
  PipelineTemplateHealthStageDto,
  StageConfigDto,
} from "../api/pipelineTemplates";

type PresetOption = {
  label: string;
  value: string;
};

type WorkflowNodeData = Record<string, unknown> & {
  stage: StageConfigDto;
  stageIndex: number;
  label: string;
  hint: string;
  health?: PipelineTemplateHealthStageDto;
  presetOptions: PresetOption[];
  presetOptionsLoading?: boolean;
  onPresetChange?: (stageIndex: number, presetId: number) => void;
  onSettings?: (stageIndex: number) => void;
};

type WorkflowNode = Node<WorkflowNodeData, "stage">;
type WorkflowNodePositionMap = Record<string, { x: number; y: number }>;

const STAGE_LABELS: Record<string, string> = {
  Topic: "Konu",
  Script: "Senaryo",
  Image: "Gorsel",
  Tts: "Seslendirme",
  Stt: "Altyazi Zamanlama",
  VideoAI: "Video AI",
  SceneLayout: "Kurgu / Timeline",
  Render: "Final Render",
  Thumbnail: "Kapak",
  Upload: "Yayin / Yukleme",
};

const STAGE_HINTS: Record<string, string> = {
  Topic: "Video fikrini ve ana aciyi uretir. Senaryo adimi bu ciktiyi kullanir.",
  Script: "Konu ciktisindan baslik, aciklama, etiket ve sahneli anlatim uretir.",
  Image: "Senaryo sahnelerinden gorsel uretir veya gorsel asset hazirlar.",
  Tts: "Senaryodaki anlatim metnini ses dosyalarina cevirir.",
  Stt: "Ses dosyasindan kelime zamanlari cikarir; altyazi ve render icin kullanilir.",
  VideoAI: "Gelecek text/image-to-video adimi. Executor aktif degilse hazirlik kontrolu blokaj verir.",
  SceneLayout: "Senaryo, gorsel ve sesleri final zaman cizelgesine dizer.",
  Render: "Timeline planini FFmpeg ile final video dosyasina cevirir.",
  Thumbnail: "Baslik ve gorsel stilden kapak gorseli uretir.",
  Upload: "Final videoyu secilen platform hedeflerine yukler. Auto publish kapaliysa onay bekler.",
};

function statusLabel(status?: string) {
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
}

function severityTone(severity?: string) {
  switch ((severity || "").toLowerCase()) {
    case "healthy":
    case "success":
      return {
        badge: "success" as const,
        icon: CheckCircle2,
        node: "border-emerald-500/35 bg-emerald-500/7",
        text: "text-emerald-400",
        edge: "#34d399",
        minimap: "#059669",
      };
    case "warning":
      return {
        badge: "warning" as const,
        icon: AlertTriangle,
        node: "border-amber-500/35 bg-amber-500/7",
        text: "text-amber-400",
        edge: "#f59e0b",
        minimap: "#d97706",
      };
    case "error":
      return {
        badge: "error" as const,
        icon: CircleAlert,
        node: "border-rose-500/40 bg-rose-500/7",
        text: "text-rose-400",
        edge: "#fb7185",
        minimap: "#e11d48",
      };
    default:
      return {
        badge: "neutral" as const,
        icon: Info,
        node: "border-zinc-800 bg-zinc-950/90",
        text: "text-zinc-400",
        edge: "#6366f1",
        minimap: "#52525b",
      };
  }
}

function stageKey(stage: StageConfigDto) {
  return `${stage.order}:${stage.stageType}`;
}

function issueSummary(stage?: PipelineTemplateHealthStageDto) {
  if (!stage || stage.issues.length === 0) return "Sorun yok.";
  return stage.issues.map((x) => `${statusLabel(x.severity)}: ${x.message}`).join("\n");
}

function SeverityBadge({ severity }: { severity?: string }) {
  const tone = severityTone(severity);
  return <Badge variant={tone.badge}>{statusLabel(severity)}</Badge>;
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/30 p-6 text-center text-xs text-zinc-500">
      {children}
    </div>
  );
}

function StageNodeCard({ data }: NodeProps<WorkflowNode>) {
  const [presetOpen, setPresetOpen] = useState(false);
  const tone = severityTone(data.health?.severity);
  const Icon = tone.icon;
  const selectedValue = data.stage.presetId ? data.stage.presetId.toString() : "";
  const hasSelectedOption = data.presetOptions.some(
    (option) => option.value === selectedValue
  );
  const selectedLabel =
    data.presetOptions.find((option) => option.value === selectedValue)?.label ??
    (data.stage.presetId ? `Preset #${data.stage.presetId}` : "");
  const presetDisabled =
    data.presetOptionsLoading || (!data.presetOptions.length && !data.stage.presetId);
  const presetPlaceholder = data.presetOptionsLoading
    ? "Yukleniyor..."
    : data.presetOptions.length > 0
      ? "Varsayilan / secilmedi"
      : "Preset gerekmiyor";

  const handlePresetSelect = (presetId: number) => {
    data.onPresetChange?.(data.stageIndex, presetId);
    setPresetOpen(false);
  };

  return (
    <div
      className={cn(
        "w-[238px] cursor-grab rounded-xl border p-3 shadow-xl shadow-black/20 backdrop-blur active:cursor-grabbing",
        tone.node
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-zinc-950 !bg-indigo-400"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-zinc-950 !bg-indigo-400"
      />

      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="rounded-md bg-zinc-950 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
              #{data.stage.order}
            </span>
            <Tooltip content={data.hint}>
              <Info size={12} className="cursor-help text-zinc-600" />
            </Tooltip>
          </div>
          <div className="mt-1 truncate text-sm font-bold text-zinc-100">
            {data.label}
          </div>
        </div>
        <Tooltip content={issueSummary(data.health)}>
          <Icon size={17} className={cn("shrink-0", tone.text)} />
        </Tooltip>
      </div>

      <label className="text-[10px] font-medium uppercase tracking-wide text-zinc-600">
        Kullanilacak Preset
      </label>
      <div
        className="nodrag nowheel relative mt-1"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          disabled={presetDisabled}
          onClick={() => setPresetOpen((value) => !value)}
          className="flex h-8 w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/80 px-2 text-left text-xs text-zinc-200 outline-none transition-colors hover:border-zinc-700 focus:border-indigo-500 disabled:cursor-not-allowed disabled:text-zinc-600"
        >
          <span className="truncate">
            {selectedLabel || presetPlaceholder}
          </span>
          <span className="ml-2 text-[10px] text-zinc-600">v</span>
        </button>

        {presetOpen && !presetDisabled && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-44 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 p-1 shadow-2xl shadow-black/50">
            <button
              type="button"
              onClick={() => handlePresetSelect(0)}
              className={cn(
                "flex w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-zinc-800",
                !selectedValue ? "text-indigo-300" : "text-zinc-400"
              )}
            >
              Varsayilan / secilmedi
            </button>
            {data.stage.presetId && !hasSelectedOption && (
              <button
                type="button"
                onClick={() => handlePresetSelect(data.stage.presetId ?? 0)}
                className="flex w-full rounded-md px-2 py-1.5 text-left text-xs text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                Preset #{data.stage.presetId}
              </button>
            )}
            {data.presetOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handlePresetSelect(Number(option.value))}
                className={cn(
                  "flex w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-zinc-800",
                  option.value === selectedValue ? "text-indigo-300" : "text-zinc-300"
                )}
              >
                <span className="truncate">{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1 text-[11px] text-zinc-500">
        {data.health?.presetName && (
          <div className="truncate">
            Secili: <span className="text-zinc-300">{data.health.presetName}</span>
          </div>
        )}
        {data.health?.executorName && (
          <div className="truncate">
            Calistirici: <span className="text-zinc-400">{data.health.executorName}</span>
          </div>
        )}
        {data.health?.aspectRatio && (
          <div>
            Cikti:{" "}
            <span className="text-zinc-300">
              {data.health.outputWidth}x{data.health.outputHeight} / {data.health.aspectRatio}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-zinc-800/70 pt-2">
        <SeverityBadge severity={data.health?.severity ?? "Draft"} />
        {data.onSettings && (
          <button
            type="button"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={() => data.onSettings?.(data.stageIndex)}
            className="nodrag rounded-md border border-zinc-800 px-2 py-1 text-[11px] text-zinc-400 transition-colors hover:border-indigo-500/50 hover:text-indigo-200"
          >
            Ayar
          </button>
        )}
      </div>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  stage: StageNodeCard,
};

export function WorkflowStudio({
  stages,
  health,
  loading,
  presetOptionsByStageType = {},
  presetOptionsLoading,
  onRefresh,
  onOpenHealth,
  onFixFinding,
  onStagePresetChange,
  onStageSettings,
  nodePositions,
  onNodePositionsChange,
  canvasClassName,
  className,
  focusMode = false,
}: {
  stages: StageConfigDto[];
  health: PipelineTemplateHealthDto | null;
  loading?: boolean;
  presetOptionsByStageType?: Record<string, PresetOption[]>;
  presetOptionsLoading?: boolean;
  onRefresh?: () => void;
  onOpenHealth?: () => void;
  onFixFinding?: (item: PipelineTemplateHealthItemDto) => void;
  onStagePresetChange?: (stageIndex: number, presetId: number) => void;
  onStageSettings?: (stageIndex: number) => void;
  nodePositions?: WorkflowNodePositionMap;
  onNodePositionsChange?: (positions: WorkflowNodePositionMap) => void;
  canvasClassName?: string;
  className?: string;
  focusMode?: boolean;
}) {
  const sortedStages = useMemo(
    () => [...stages].sort((a, b) => a.order - b.order),
    [stages]
  );

  const healthByOrder = useMemo(() => {
    const map = new Map<number, PipelineTemplateHealthStageDto>();
    health?.stages.forEach((stage) => map.set(stage.order, stage));
    return map;
  }, [health]);

  const layoutNodes = useMemo<WorkflowNode[]>(() => {
    const columns =
      sortedStages.length <= 3 ? Math.max(sortedStages.length, 1) : 3;

    return sortedStages.map((stage, index) => {
      const stageHealth = healthByOrder.get(stage.order);
      const stageIndex = stages.indexOf(stage);
      const row = Math.floor(index / columns);
      const columnInRow = index % columns;
      const column = row % 2 === 0 ? columnInRow : columns - 1 - columnInRow;

      return {
        id: stageKey(stage),
        type: "stage",
        position: {
          x: column * 315,
          y: row * 205 + 36,
        },
        data: {
          stage,
          stageIndex,
          label: STAGE_LABELS[stage.stageType] ?? stage.stageType,
          hint: STAGE_HINTS[stage.stageType] ?? "Ozel adim.",
          health: stageHealth,
          presetOptions: presetOptionsByStageType[stage.stageType] ?? [],
          presetOptionsLoading,
          onPresetChange: onStagePresetChange,
          onSettings: onStageSettings,
        },
      };
    });
  }, [
    sortedStages,
    healthByOrder,
    stages,
    presetOptionsByStageType,
    presetOptionsLoading,
    onStagePresetChange,
    onStageSettings,
  ]);

  const [internalNodePositions, setInternalNodePositions] =
    useState<WorkflowNodePositionMap>({});
  const activeNodePositions = nodePositions ?? internalNodePositions;

  const [nodes, setNodes] = useState<WorkflowNode[]>(() =>
    layoutNodes.map((node) => ({
      ...node,
      position: activeNodePositions[node.id] ?? node.position,
    }))
  );
  const latestNodesRef = useRef<WorkflowNode[]>(nodes);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (isDraggingRef.current) {
      return;
    }

    setNodes((currentNodes) =>
      layoutNodes.map((node) => {
        const currentNode = currentNodes.find((item) => item.id === node.id);

        return {
          ...node,
          position:
            activeNodePositions[node.id] ??
            currentNode?.position ??
            node.position,
        };
      })
    );
  }, [layoutNodes, activeNodePositions]);

  useEffect(() => {
    latestNodesRef.current = nodes;
  }, [nodes]);

  const persistNodePositions = useCallback(
    (nextNodes: WorkflowNode[]) => {
      const nextPositions = nextNodes.reduce<WorkflowNodePositionMap>(
        (acc, node) => {
          acc[node.id] = node.position;
          return acc;
        },
        {}
      );

      if (onNodePositionsChange) {
        onNodePositionsChange(nextPositions);
      } else {
        setInternalNodePositions(nextPositions);
      }
    },
    [onNodePositionsChange]
  );

  const handleNodesChange = useCallback((changes: NodeChange<WorkflowNode>[]) => {
    setNodes((currentNodes) => {
      const nextNodes = applyNodeChanges(changes, currentNodes) as WorkflowNode[];
      latestNodesRef.current = nextNodes;
      return nextNodes;
    });
  }, []);

  const handleNodeDragStart = useCallback<OnNodeDrag<WorkflowNode>>(() => {
    isDraggingRef.current = true;
  }, []);

  const handleNodeDragStop = useCallback<OnNodeDrag<WorkflowNode>>(
    (_event, node, draggedNodes) => {
      isDraggingRef.current = false;

      const draggedPositionById = new Map<string, { x: number; y: number }>();
      draggedNodes.forEach((draggedNode) => {
        draggedPositionById.set(draggedNode.id, draggedNode.position);
      });
      draggedPositionById.set(node.id, node.position);

      setNodes((currentNodes) => {
        const sourceNodes =
          currentNodes.length > 0 ? currentNodes : latestNodesRef.current;
        const nextNodes = sourceNodes.map((currentNode) => {
          const draggedPosition = draggedPositionById.get(currentNode.id);

          return draggedPosition
            ? { ...currentNode, position: draggedPosition }
            : currentNode;
        });

        latestNodesRef.current = nextNodes;
        persistNodePositions(nextNodes);
        return nextNodes;
      });
    },
    [persistNodePositions]
  );

  const flowKey = useMemo(
    () => sortedStages.map((stage) => stageKey(stage)).join("|"),
    [sortedStages]
  );

  const handleFlowInit = useCallback(
    (instance: ReactFlowInstance<WorkflowNode, Edge>) => {
      window.requestAnimationFrame(() => {
        instance.fitView({ padding: 0.22, duration: 180 });
      });
    },
    []
  );

  const edges = useMemo<Edge[]>(() => {
    return nodes.slice(0, -1).map((node, index) => {
      const nextNode = nodes[index + 1];
      const nextTone = severityTone(nextNode.data.health?.severity);

      return {
        id: `${node.id}->${nextNode.id}`,
        source: node.id,
        target: nextNode.id,
        type: "smoothstep",
        animated: health ? health.isRunnable : false,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: nextTone.edge,
        },
        style: {
          stroke: nextTone.edge,
          strokeWidth: 2,
        },
      };
    });
  }, [nodes, health]);

  const statusTone = severityTone(health?.status);
  const StatusIcon = statusTone.icon;

  return (
    <div className={cn("rounded-xl border border-zinc-800 bg-zinc-950/35 p-3", className)}>
      <div className={cn("flex items-start justify-between gap-3", focusMode ? "mb-2" : "mb-3")}>
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Route size={15} className="text-indigo-400" />
            Uretim Akisi
            <Tooltip content="Kutular uretim adimlarini gosterir. Siralama sagdaki adim listesinden gelir; kutulari surukleyerek sadece ekrandaki yerlerini duzenlersin.">
              <Info size={13} className="cursor-help text-zinc-500" />
            </Tooltip>
          </div>
          {!focusMode && (
            <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
              Kutudan preset sec, ayari ac, hazirlik durumunu dogrudan adim uzerinde oku.
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <SeverityBadge severity={health?.status ?? "Draft"} />
          {onRefresh && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onRefresh}
              className="h-7 px-2"
              disabled={loading}
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            </Button>
          )}
        </div>
      </div>

      {sortedStages.length === 0 ? (
        <EmptyState>Once hazir baslangic sec veya adim ekle; akis burada canlanacak.</EmptyState>
      ) : (
        <div
          className={cn(
            "h-[460px] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950",
            canvasClassName
          )}
        >
          <ReactFlow
            key={flowKey}
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={handleNodesChange}
            onNodeDragStart={handleNodeDragStart}
            onNodeDragStop={handleNodeDragStop}
            onInit={handleFlowInit}
            colorMode="dark"
            minZoom={0.35}
            maxZoom={1.4}
            nodesDraggable
            nodesConnectable={false}
            panOnDrag={[1, 2]}
            selectionOnDrag={false}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={18}
              size={1}
              color="rgba(113, 113, 122, 0.28)"
            />
            <Controls position="bottom-left" showInteractive={false} />
          </ReactFlow>
        </div>
      )}

      {!focusMode && (
        <>
          <WorkflowReadinessPanel health={health} compact />

          <div className="mt-3 grid grid-cols-3 gap-2">
            <Metric
              icon={<CircleAlert size={13} />}
              label="Hata"
              value={health?.errorCount ?? 0}
              className="text-rose-400"
            />
            <Metric
              icon={<AlertTriangle size={13} />}
              label="Uyari"
              value={health?.warningCount ?? 0}
              className="text-amber-400"
            />
            <Metric
              icon={<Info size={13} />}
              label="Bilgi"
              value={health?.infoCount ?? 0}
              className="text-sky-400"
            />
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-zinc-800/70 pt-3">
            <div className="flex items-center gap-2 text-[11px] text-zinc-500">
              <StatusIcon size={14} className={statusTone.text} />
              {health
                ? health.isRunnable
                  ? "Kosulabilir gorunuyor."
                  : "Once hata seviyesindeki noktalar duzelmeli."
                : "Kayitli hat secilince hazirlik kontrolu calisir."}
            </div>
            {onOpenHealth && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onOpenHealth}
                className="h-7 px-2 text-[11px]"
              >
                Detay
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  className,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-2 py-1.5">
      <div className={cn("flex items-center gap-1 text-xs font-bold", className)}>
        {icon}
        {value}
      </div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wide text-zinc-600">{label}</div>
    </div>
  );
}

type ReadinessState = "ready" | "warning" | "blocked" | "info";

type ReadinessCheck = {
  label: string;
  detail: string;
  value?: ReactNode;
  state: ReadinessState;
};

const LONG_FORM_REQUIRED_STAGES = [
  "Topic",
  "Script",
  "Image",
  "Tts",
  "Stt",
  "SceneLayout",
  "Render",
];

function WorkflowReadinessPanel({
  health,
  compact,
}: {
  health: PipelineTemplateHealthDto | null;
  compact?: boolean;
}) {
  if (!health) {
    return (
      <div className="mt-3 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/30 px-3 py-2 text-[11px] text-zinc-500">
        Uretime hazirlik raporu icin kayitli hat sec ve hazirlik kontrolu calistir.
      </div>
    );
  }

  const checks = buildReadinessChecks(health);
  const readyCount = checks.filter((check) => check.state === "ready").length;
  const blockedCount = checks.filter((check) => check.state === "blocked").length;
  const warningCount = checks.filter((check) => check.state === "warning").length;
  const readinessPercent = Math.round((readyCount / checks.length) * 100);
  const headline = blockedCount
    ? "Blokaj var"
    : warningCount
      ? "Dikkatli baslat"
      : "Uretime hazir";
  const headlineSeverity = blockedCount ? "Error" : warningCount ? "Warning" : "Healthy";

  return (
    <section className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950/35 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <ShieldCheck size={15} className={severityTone(headlineSeverity).text} />
            Uretime Hazirlik
            <SeverityBadge severity={headlineSeverity} />
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
            {headline} - {readyCount}/{checks.length} kontrol temiz - %{readinessPercent}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
          <span className="rounded-full border border-zinc-800 bg-zinc-900/70 px-2 py-1">
            {health.productionProfile}
          </span>
          <span className="rounded-full border border-zinc-800 bg-zinc-900/70 px-2 py-1">
            {health.isRunnable ? "Baslatilabilir" : "Bloklu"}
          </span>
        </div>
      </div>

      <div className={cn("mt-3 grid gap-2", compact ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-2")}>
        {checks.map((check) => (
          <ReadinessCheckCard key={check.label} check={check} compact={compact} />
        ))}
      </div>
    </section>
  );
}

function ReadinessCheckCard({
  check,
  compact,
}: {
  check: ReadinessCheck;
  compact?: boolean;
}) {
  const severity =
    check.state === "ready"
      ? "Healthy"
      : check.state === "blocked"
        ? "Error"
        : check.state === "warning"
          ? "Warning"
          : "Info";
  const tone = severityTone(severity);
  const Icon = tone.icon;

  return (
    <div className={cn("rounded-lg border px-3 py-2", tone.node)}>
      <div className="flex items-start gap-2">
        <Icon size={14} className={cn("mt-0.5 shrink-0", tone.text)} />
        <div className="min-w-0">
          <div className="text-xs font-bold text-zinc-100">{check.label}</div>
          {check.value && (
            <div className={cn("mt-0.5 font-mono text-[10px]", tone.text)}>{check.value}</div>
          )}
          <div className={cn("mt-1 text-[10px] leading-relaxed text-zinc-500", compact && "line-clamp-2")}>
            {check.detail}
          </div>
        </div>
      </div>
    </div>
  );
}

function buildReadinessChecks(health: PipelineTemplateHealthDto): ReadinessCheck[] {
  const isLongForm = health.productionProfile === "LongForm";
  const stages = health.stages;
  const findStage = (stageType: string) =>
    stages.find((stage) => stage.stageType.toLowerCase() === stageType.toLowerCase());
  const hasStage = (stageType: string) => Boolean(findStage(stageType));
  const missingLongStages = LONG_FORM_REQUIRED_STAGES.filter((stageType) => !hasStage(stageType));
  const scriptStage = findStage("Script");
  const imageStage = findStage("Image");
  const ttsStage = findStage("Tts");
  const sttStage = findStage("Stt");
  const renderStage = findStage("Render");
  const thumbnailStage = findStage("Thumbnail");
  const uploadStage = findStage("Upload");
  const presetOrConnectionErrors = health.items.filter(
    (item) => item.code.includes("preset") || item.code.includes("connection")
  );
  const scriptDurationOk = (scriptStage?.targetDurationSec ?? 0) >= 480;
  const imageLandscape = imageSizeLooksLandscape(imageStage?.imageSize);
  const renderLongFormOk = renderLooksLongForm(renderStage);
  const captionReady =
    Boolean(ttsStage) &&
    Boolean(sttStage) &&
    !hasError(ttsStage?.severity) &&
    !hasError(sttStage?.severity);

  return [
    {
      label: "Profil",
      value: health.productionProfile,
      state: isLongForm ? "ready" : "info",
      detail: isLongForm
        ? "Long-form hazirlik kurallari aktif."
        : "Uzun video icin profil LongForm secilirse daha net kontroller calisir.",
    },
    {
      label: "Adim omurgasi",
      value: missingLongStages.length
        ? `Eksik: ${missingLongStages.map((stageType) => STAGE_LABELS[stageType] ?? stageType).join(", ")}`
        : "Konu -> Render",
      state: missingLongStages.length ? (isLongForm ? "blocked" : "warning") : "ready",
      detail: missingLongStages.length
        ? "Uzun video akisi icin temel adim zinciri tamamlanmali."
        : "Konu, senaryo, gorsel, ses, timeline ve render zinciri mevcut.",
    },
    {
      label: "Preset / baglanti",
      value: presetOrConnectionErrors.length ? `${presetOrConnectionErrors.length} sorun` : "Secimler temiz",
      state: presetOrConnectionErrors.length ? "blocked" : "ready",
      detail: presetOrConnectionErrors.length
        ? "Preset veya AI baglanti eksikleri uretim baslamadan cozulmeli."
        : "Adim presetleri ve baglantilar hazirlik kontrolunde blokaj vermiyor.",
    },
    {
      label: "Script suresi",
      value: scriptStage?.targetDurationSec ? `${scriptStage.targetDurationSec} sn` : "Bilinmiyor",
      state: scriptDurationOk ? "ready" : isLongForm ? "warning" : "info",
      detail: scriptDurationOk
        ? "8 dakika ve uzeri hedef sure long-form icin uygun."
        : "Long-form icin 480-900 sn ilk test bandi daha saglikli olur.",
    },
    {
      label: "Gorsel / render",
      value: renderStage?.aspectRatio
        ? `${renderStage.outputWidth}x${renderStage.outputHeight} / ${renderStage.aspectRatio}`
        : imageStage?.imageSize ?? "Bilinmiyor",
      state: renderLongFormOk && (imageLandscape || !imageStage?.imageSize) ? "ready" : isLongForm ? "warning" : "info",
      detail: renderLongFormOk
        ? "Render 16:9/HD long-form icin uygun gorunuyor."
        : "Long-form icin gorsel landscape, render 1920x1080 veya en az HD 16:9 olmali.",
    },
    {
      label: "Ses / caption",
      value: captionReady ? "TTS + STT" : "Kontrol et",
      state: captionReady ? "ready" : isLongForm ? "warning" : "info",
      detail: captionReady
        ? "Seslendirme ve transcript adimlari altyazi/render icin hazir gorunuyor."
        : "Uzun videoda altyazi kalitesi icin TTS ve STT adimlarini presetli tutmak iyi olur.",
    },
    {
      label: "Yayin",
      value: uploadStage ? "Adim var" : "Opsiyonel",
      state: uploadStage ? (hasError(uploadStage.severity) ? "warning" : "ready") : "info",
      detail: uploadStage
        ? "Yayin hedefleri hazirlik raporunda ayrica kontrol edilir."
        : "Render testleri icin yayin adimi sart degil; yayin akisi icin sonra eklenebilir.",
    },
    {
      label: "Kapak",
      value: thumbnailStage ? "Kapak adimi" : "Eksik/opsiyonel",
      state: thumbnailStage ? (hasError(thumbnailStage.severity) ? "warning" : "ready") : isLongForm ? "warning" : "info",
      detail: thumbnailStage
        ? "Kapak gorseli akis ciktisi olarak uretilecek."
        : "YouTube long-form icin kapak adimi eklemek yayin hazirligini tamamlar.",
    },
    {
      label: "Baslatma kapisi",
      value: health.isRunnable ? "Baslatilabilir" : "Bloklu",
      state: health.isRunnable ? "ready" : "blocked",
      detail: health.isRunnable
        ? "Hata seviyesinde blokaj gorunmuyor."
        : "Uretim baslatmadan once hata seviyesindeki uyarilari duzelt.",
    },
  ];
}

function hasError(severity?: string) {
  return (severity || "").toLowerCase() === "error";
}

function renderLooksLongForm(stage?: PipelineTemplateHealthStageDto) {
  if (!stage) return false;
  const width = stage.outputWidth ?? 0;
  const height = stage.outputHeight ?? 0;
  const ratio = width && height ? width / height : 0;
  const ratioLabel = (stage.aspectRatio || "").replace(/\s/g, "");
  const isLandscape16x9 =
    ratioLabel === "16:9" ||
    ratioLabel === "1.78:1" ||
    (ratio >= 1.7 && ratio <= 1.82);
  return isLandscape16x9 && width >= 1280 && height >= 720;
}

function imageSizeLooksLandscape(size?: string) {
  if (!size) return false;
  const normalized = size.toLowerCase();
  if (normalized.includes("landscape") || normalized.includes("16:9")) return true;
  const match = normalized.match(/(\d+)\D+(\d+)/);
  if (!match) return false;
  const width = Number(match[1]);
  const height = Number(match[2]);
  return width > height;
}

export function WorkflowHealthDetails({
  health,
  loading,
  onFixFinding,
}: {
  health: PipelineTemplateHealthDto | null;
  loading?: boolean;
  onFixFinding?: (item: PipelineTemplateHealthItemDto) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-zinc-500">
        <RefreshCw size={16} className="animate-spin" />
        Hazirlik kontrolu calisiyor...
      </div>
    );
  }

  if (!health) {
    return <EmptyState>Kayitli bir hat secince hazirlik raporu burada gorunur.</EmptyState>;
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-5">
        <SummaryCard
          icon={<Route size={17} />}
          label="Profil"
          value={health.productionProfile}
          severity={health.productionProfile === "LongForm" ? "Warning" : "Info"}
        />
        <SummaryCard
          icon={<ShieldCheck size={17} />}
          label="Durum"
          value={statusLabel(health.status)}
          severity={health.status}
        />
        <SummaryCard icon={<CircleAlert size={17} />} label="Hata" value={health.errorCount} severity="Error" />
        <SummaryCard icon={<AlertTriangle size={17} />} label="Uyari" value={health.warningCount} severity="Warning" />
        <SummaryCard icon={<Sparkles size={17} />} label="Baslatma" value={health.isRunnable ? "Hazir" : "Bloklu"} severity={health.isRunnable ? "Healthy" : "Error"} />
      </div>

      <WorkflowReadinessPanel health={health} />

      {health.recommendedNextSteps.length > 0 && (
        <section>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-white">
            <Sparkles size={15} className="text-indigo-400" />
            Sonraki oneriler
          </h4>
          <div className="space-y-2">
            {health.recommendedNextSteps.map((step) => (
              <div key={step} className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-3 py-2 text-sm text-indigo-100">
                {step}
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-white">
          <Settings2 size={15} className="text-zinc-400" />
          Adim raporu
        </h4>
        <div className="space-y-2">
          {health.stages.map((stage) => (
            <StageHealthRow
              key={`${stage.order}-${stage.stageType}`}
              stage={stage}
              onFixFinding={onFixFinding}
            />
          ))}
        </div>
      </section>

      <section>
        <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-white">
          <AlertTriangle size={15} className="text-amber-400" />
          Tum uyarilar
        </h4>
        {health.items.length === 0 ? (
          <EmptyState>Uyari yok. Temiz gorunuyor.</EmptyState>
        ) : (
          <div className="space-y-2">
            {health.items.map((item, index) => (
              <FindingRow
                key={`${item.code}-${index}`}
                item={item}
                onFix={onFixFinding}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  severity,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  severity?: string;
}) {
  const tone = severityTone(severity);
  return (
    <div className={cn("rounded-xl border p-3", tone.node)}>
      <div className={cn("mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide", tone.text)}>
        {icon}
        {label}
      </div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
  );
}

function StageHealthRow({
  stage,
  onFixFinding,
}: {
  stage: PipelineTemplateHealthStageDto;
  onFixFinding?: (item: PipelineTemplateHealthItemDto) => void;
}) {
  const tone = severityTone(stage.severity);
  const Icon = tone.icon;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/35 p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Icon size={15} className={tone.text} />
            <span className="font-mono text-[11px] text-zinc-500">#{stage.order}</span>
            <span className="font-bold text-white">{STAGE_LABELS[stage.stageType] ?? stage.stageType}</span>
            <SeverityBadge severity={stage.severity} />
          </div>
          <div className="mt-2 grid gap-1 text-[11px] text-zinc-500 md:grid-cols-2">
            <span>Preset: <b className="text-zinc-300">{stage.presetName ?? (stage.presetId ? `#${stage.presetId}` : "varsayilan")}</b></span>
            <span>Calistirici: <b className="text-zinc-300">{stage.executorName ?? "eksik"}</b></span>
            {stage.requiredInputs.length > 0 && (
              <span>Girdi: <b className="text-zinc-300">{stage.satisfiedInputs.length}/{stage.requiredInputs.length}</b></span>
            )}
            {stage.aspectRatio && (
              <span>Cikti: <b className="text-zinc-300">{stage.outputWidth}x{stage.outputHeight} / {stage.aspectRatio}</b></span>
            )}
            {stage.targetDurationSec && (
              <span>Hedef sure: <b className="text-zinc-300">{Math.round(stage.targetDurationSec / 60)} dk / {stage.targetDurationSec} sn</b></span>
            )}
            {stage.imageSize && (
              <span>Gorsel: <b className="text-zinc-300">{stage.imageSize}</b></span>
            )}
          </div>
        </div>
      </div>

      {stage.uploadTargets.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {stage.uploadTargets.map((target) => (
            <Badge key={target.socialChannelId} variant={severityTone(target.severity).badge}>
              {target.channelName ?? `Kanal #${target.socialChannelId}`} {target.channelType ? `(${target.channelType})` : ""}
            </Badge>
          ))}
        </div>
      )}

      {stage.issues.length > 0 && (
        <div className="mt-3 space-y-1">
          {stage.issues.map((issue, index) => (
            <FindingRow
              key={`${issue.code}-${index}`}
              item={issue}
              compact
              onFix={onFixFinding}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FindingRow({
  item,
  compact,
  onFix,
}: {
  item: PipelineTemplateHealthItemDto;
  compact?: boolean;
  onFix?: (item: PipelineTemplateHealthItemDto) => void;
}) {
  const tone = severityTone(item.severity);
  const Icon = tone.icon;
  const fixLabel = getFixLabel(item);

  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2",
        compact ? "text-xs" : "text-sm"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Icon size={14} className={cn("mt-0.5 shrink-0", tone.text)} />
        <div className="min-w-0 flex-1">
          <div className="text-zinc-200">
            {item.stageOrder && (
              <span className="mr-2 font-mono text-[11px] text-zinc-500">
                #{item.stageOrder} {item.stageType ? STAGE_LABELS[item.stageType] ?? item.stageType : ""}
              </span>
            )}
            {item.message}
          </div>
          <div className="mt-1 font-mono text-[10px] text-zinc-600">{item.code}</div>
        </div>
        {onFix && fixLabel && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onFix(item)}
            className="h-7 shrink-0 px-2 text-[11px]"
          >
            {fixLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

function getFixLabel(item: PipelineTemplateHealthItemDto) {
  if (item.code.startsWith("preset.connection")) return "AI ayari";
  if (item.code.startsWith("upload.channel")) return "Kanal ayari";
  if (item.code.startsWith("upload.")) return "Yayin ayari";
  if (item.code.startsWith("profile.longform.")) return "Preset ayari";
  if (item.code.includes("preset")) return "Preset sec";
  if (item.code === "workflow.autopublish_without_upload") return "Yayin ekle";
  if (item.code.startsWith("stage.dependency")) return "Adim sirasi";
  if (item.code.startsWith("workflow.")) return "Akis";
  return null;
}
