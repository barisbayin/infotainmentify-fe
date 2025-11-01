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
import { topicsApi, promptsApi, type Topic } from "../api";
import toast from "react-hot-toast";
import { useConfirm } from "../components/confirm";
import SelectBox from "../components/SelectBox";
import ButtonGroup from "../components/ButtonGroup";
import { Tooltip } from "../components/ui-kit";

type TopicRow = Topic & { promptTitle?: string };

const EMPTY_TOPIC: Omit<Topic, "id"> = {
  topicCode: "",
  category: "",
  premiseTr: "",
  premise: "",
  tone: "",
  potentialVisual: "",
  needsFootage: false,
  factCheck: false,
  tagsJson: "",
  topicJson: "",
  promptId: null,
  isActive: true,
};

export default function TopicsPage() {
  const [items, setItems] = useState<TopicRow[]>([]);
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
  const [form, setForm] = useState<Omit<Topic, "id">>(EMPTY_TOPIC);

  const confirm = useConfirm();
  const debouncedQ = useDebouncedValue(q, 300);

  // --- Load list & prompts
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

  // --- Filters
  const filteredItems = items.filter((i) => {
    if (promptFilter && String(i.promptId ?? "") !== promptFilter) return false;
    if (statusFilter === "active" && !i.isActive) return false;
    if (statusFilter === "passive" && i.isActive) return false;
    return (
      i.topicCode.toLowerCase().includes(q.toLowerCase()) ||
      i.premise?.toLowerCase().includes(q.toLowerCase()) ||
      i.premiseTr?.toLowerCase().includes(q.toLowerCase())
    );
  });

  // --- Row actions
  async function toggleActive(row: TopicRow) {
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

  async function onDetailClick(row: TopicRow) {
    setShowDetail(true);
    setSelectedId(row.id);
    setDetailLoading(true);
    try {
      const dto = await topicsApi.get(row.id);
      setForm({
        ...dto,
        tagsJson: formatJson(dto.tagsJson),
        topicJson: formatJson(dto.topicJson),
      });
    } catch {
      toast.error("Detay yüklenemedi");
    } finally {
      setDetailLoading(false);
    }
  }

  async function onSave() {
    if (!selectedId) return;
    try {
      await toast.promise(topicsApi.update(selectedId, form), {
        loading: "Kaydediliyor…",
        success: "Güncellendi",
        error: "Kaydetme hatası",
      });
      setShowDetail(false);
      await load();
    } catch {}
  }

  async function onDelete(row: TopicRow) {
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

  // --- Render
  return (
    <Page>
      <Toolbar className="grid grid-cols-[1.5fr_1fr_auto_auto] gap-2">
        <Input
          placeholder="Ara… (code / premise)"
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

      <Card className="mt-3 flex-1 overflow-auto">
        <Table>
          <THead>
            <TR>
              <TH>ID</TH>
              <TH>Kod</TH>
              <TH>Prompt</TH>
              <TH>Premise (TR)</TH>
              <TH>Premise (EN)</TH>
              <TH>Aktif</TH>
              <TH className="text-right">İşlemler</TH>
            </TR>
          </THead>
          <tbody>
            {filteredItems.map((r) => (
              <TR key={r.id} className="hover:bg-neutral-50">
                <TD>#{r.id}</TD>
                <TD>{r.topicCode}</TD>
                <TD>{r.promptTitle ?? `#${r.promptId ?? "—"}`}</TD>
                <TD className="text-xs max-w-[250px] truncate">
                  <Tooltip text={r.premiseTr ?? "—"}>
                    {r.premiseTr ?? "—"}
                  </Tooltip>
                </TD>
                <TD className="text-xs max-w-[250px] truncate">
                  <Tooltip text={r.premise ?? "—"}>{r.premise ?? "—"}</Tooltip>
                </TD>
                <TD>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={r.isActive}
                      onChange={() => toggleActive(r)}
                    />
                    <span className="text-xs">
                      {r.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </label>
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
      </Card>

      {/* --- DETAIL MODAL --- */}
      {showDetail && (
        <Modal onClose={() => setShowDetail(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-[700px] max-h-[90vh] flex flex-col overflow-hidden">
            {/* --- Header --- */}
            <div className="sticky top-0 z-10 bg-white border-b p-4 flex justify-between items-center">
              <div className="font-semibold text-lg">
                Topic Detayı #{selectedId}
              </div>
              <button
                onClick={() => setShowDetail(false)}
                className="text-neutral-500 hover:text-neutral-700 text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* --- Scrollable body --- */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {detailLoading ? (
                <div>Yükleniyor…</div>
              ) : (
                <>
                  <Field label="Topic Code">
                    <Input
                      value={form.topicCode}
                      onChange={(e) =>
                        setForm({ ...form, topicCode: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Category">
                    <Input
                      value={form.category ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, category: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Premise (TR)">
                    <Textarea
                      rows={3}
                      value={form.premiseTr ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, premiseTr: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Premise (EN)">
                    <Textarea
                      rows={3}
                      value={form.premise ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, premise: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Tags JSON">
                    <Textarea
                      rows={6}
                      value={form.tagsJson ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, tagsJson: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Topic JSON">
                    <Textarea
                      rows={8}
                      value={form.topicJson ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, topicJson: e.target.value })
                      }
                    />
                  </Field>
                </>
              )}
            </div>

            {/* --- Footer --- */}
            <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end gap-2">
              <Button onClick={() => setShowDetail(false)}>Kapat</Button>
              <Button variant="primary" onClick={onSave}>
                Kaydet
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Page>
  );
}

// --- Helpers
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
