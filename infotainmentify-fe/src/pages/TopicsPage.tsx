import { useEffect, useRef, useState } from "react";
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
  Input,
  Field,
  Textarea,
  Modal,
} from "../components/ui-kit";
import {
  topicsApi,
  type TopicListDto,
  type TopicDetailDto,
} from "../api/topics";
import toast from "react-hot-toast";
import { useConfirm } from "../components/confirm";
import SelectBox from "../components/SelectBox";
import ButtonGroup from "../components/ButtonGroup";
import { promptsApi } from "../api/prompts";
import Tooltip from "../components/Tooltip";
import Switch from "../components/Switch";

const EMPTY_TOPIC: TopicDetailDto = {
  id: 0,
  topicCode: "",
  category: "",
  subCategory: "",
  series: "",
  premise: "",
  premiseTr: "",
  tone: "",
  potentialVisual: "",
  renderStyle: "",
  voiceHint: "",
  scriptHint: "",
  needsFootage: false,
  factCheck: false,
  topicJson: "",
  scriptGenerated: false,
  promptId: null,
  promptName: "",
  scriptId: null,
  scriptTitle: "",
  scriptGeneratedAt: "",
  priority: 5,
  isActive: true,
};

export default function TopicsPage() {
  const [items, setItems] = useState<TopicListDto[]>([]);
  const [prompts, setPrompts] = useState<{ id: number; title: string }[]>([]);
  const [promptFilter, setPromptFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "passive"
  >("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form, setForm] = useState<TopicDetailDto>(EMPTY_TOPIC);
  const confirm = useConfirm();
  const debouncedQ = useDebouncedValue(q, 300);
  const scrollContainer = useRef<HTMLDivElement>(null);

  async function load() {
    setLoading(true);
    try {
      const list = await topicsApi.list(debouncedQ);
      setItems(list);
    } catch {
      toast.error("Topics yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  async function loadPrompts() {
    try {
      const list = await promptsApi.list();
      setPrompts(
        list.map((p: any) => ({
          id: p.id,
          title: p.title ?? p.name ?? p.promptName ?? `Prompt #${p.id}`,
        }))
      );
    } catch {
      toast.error("Prompts yüklenemedi");
    }
  }

  useEffect(() => {
    load();
    loadPrompts();
  }, []);

  const filteredItems = items.filter((i) => {
    if (promptFilter && String(i.promptId ?? "") !== promptFilter) return false;
    if (statusFilter === "active" && !i.isActive) return false;
    if (statusFilter === "passive" && i.isActive) return false;
    return (
      i.premise?.toLowerCase().includes(q.toLowerCase()) ||
      i.premiseTr?.toLowerCase().includes(q.toLowerCase()) ||
      i.category?.toLowerCase().includes(q.toLowerCase())
    );
  });

  async function toggleActive(row: TopicListDto) {
    try {
      await topicsApi.toggleActive(row.id, !row.isActive);
      setItems((prev) =>
        prev.map((x) => (x.id === row.id ? { ...x, isActive: !x.isActive } : x))
      );
      toast.success(
        `Topic #${row.id} ${!row.isActive ? "aktif" : "pasif"} yapıldı`
      );
    } catch {
      toast.error("İşlem başarısız");
    }
  }

  async function onDetailClick(row: TopicListDto) {
    setShowDetail(true);
    setSelectedId(row.id);
    setDetailLoading(true);
    try {
      const dto = await topicsApi.get(row.id);
      setForm({
        ...dto,
        topicJson: formatJson(dto.topicJson),
      });
    } catch {
      toast.error("Detay yüklenemedi");
    } finally {
      setDetailLoading(false);
    }
  }

  async function onSave() {
    try {
      await toast.promise(topicsApi.save(form), {
        loading: "Kaydediliyor…",
        success: "Güncellendi",
        error: "Kaydetme hatası",
      });
      setShowDetail(false);
      await load();
    } catch {}
  }

  async function onDelete(row: TopicListDto) {
    const ok = await confirm({
      title: "Silinsin mi?",
      message: <>#{row.id} silinecek, emin misin?</>,
      tone: "danger",
    });
    if (!ok) return;
    try {
      await topicsApi.delete(row.id);
      toast.success("Silindi");
      await load();
    } catch {
      toast.error("Silinemedi");
    }
  }

  function StatusDot({ active, text }: { active: boolean; text: string }) {
    return (
      <div className="inline-flex items-center gap-1">
        <span
          className={`w-2 h-2 rounded-full ${
            active ? "bg-green-500" : "bg-gray-300"
          }`}
        ></span>
        <span className="text-xs text-neutral-700">{text}</span>
      </div>
    );
  }

  return (
    <Page className="flex flex-col h-full bg-neutral-50 overflow-hidden">
      {/* --- Toolbar --- */}
      <div className="sticky top-0 z-20 bg-white border-b shadow-sm rounded-t-2xl">
        <Toolbar className="grid grid-cols-[1.5fr_1fr_auto_auto] gap-2 p-2 rounded-t-2xl bg-white">
          <Input
            placeholder="Ara…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <SelectBox
            value={promptFilter}
            onChange={(v) => setPromptFilter(v)}
            options={[
              { value: "", label: "Tüm Promptlar" },
              ...prompts.map((p) => ({ value: String(p.id), label: p.title })),
            ]}
          />

          <ButtonGroup
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: "Hepsi", value: "all" },
              { label: "Aktif", value: "active" },
              { label: "Pasif", value: "passive" },
            ]}
          />

          <Button onClick={load} disabled={loading}>
            {loading ? "Yükleniyor…" : "Yenile"}
          </Button>
        </Toolbar>
      </div>

      {/* --- Table Container --- */}
      <div className="flex-1 p-4 overflow-hidden">
        <Card className="h-full bg-white rounded-2xl shadow-sm flex flex-col overflow-hidden">
          {/* Scroll alanı sadece burada */}
          <div
            ref={scrollContainer}
            className="flex-1 overflow-auto px-1 pb-1 rounded-b-2xl scrollbar-thin scrollbar-thumb-neutral-400 scrollbar-track-transparent"
          >
            <Table>
              <THead>
                <TR>
                  <TH>ID</TH>
                  <TH>Kategori</TH>
                  <TH>Alt Kategori</TH>
                  <TH style={{ width: "280px" }}>Premise</TH>
                  <TH>Prompt</TH>
                  <TH>Script</TH>
                  <TH>Script Durumu</TH>
                  <TH>Aktif</TH>
                  <TH className="text-right">İşlemler</TH>
                </TR>
              </THead>
              <tbody>
                {filteredItems.map((r) => (
                  <TR key={r.id} className="hover:bg-neutral-50">
                    <TD className="font-mono text-xs">#{r.id}</TD>
                    <TD>{r.category ?? "—"}</TD>
                    <TD>{r.subCategory ?? "—"}</TD>

                    <TD className="max-w-[280px]">
                      <Tooltip
                        text={`EN: ${r.premise ?? "—"}\nTR: ${
                          r.premiseTr ?? "—"
                        }`}
                        maxWidth="360px"
                      >
                        <div className="text-[12px] text-neutral-800 line-clamp-2 leading-snug">
                          {r.premise ?? "—"}
                        </div>
                        <div className="text-[11px] text-neutral-500 line-clamp-1 leading-snug">
                          {r.premiseTr ?? ""}
                        </div>
                      </Tooltip>
                    </TD>

                    <TD>
                      {r.promptName ? (
                        <span className="text-xs text-neutral-700">
                          {r.promptName}{" "}
                          <span className="text-neutral-400">
                            #{r.promptId}
                          </span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </TD>

                    <TD>{r.scriptTitle ?? "—"}</TD>

                    <TD>
                      <StatusDot
                        active={r.scriptGenerated}
                        text={r.scriptGenerated ? "Hazır" : "Bekliyor"}
                      />
                    </TD>

                    <TD>
                      <Switch
                        checked={r.isActive}
                        onChange={() => toggleActive(r)}
                        label={r.isActive ? "Aktif" : "Pasif"}
                      />
                    </TD>

                    <TD className="text-right">
                      <div className="inline-flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDetailClick(r)}
                        >
                          Detay
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => onDelete(r)}
                        >
                          Sil
                        </Button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </div>
        </Card>
      </div>
    </Page>
  );
}

// --- Helpers ---
function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  const t = useRef<number | null>(null);
  useEffect(() => {
    if (t.current) clearTimeout(t.current);
    t.current = window.setTimeout(() => setDebounced(value), delay);
    return () => {
      if (t.current) clearTimeout(t.current);
    };
  }, [value, delay]);
  return debounced;
}

function formatJson(raw?: string | null) {
  if (!raw) return "";
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}
