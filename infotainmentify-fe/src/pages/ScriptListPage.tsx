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
  scriptsApi,
  type ScriptListDto,
  type ScriptDetailDto,
} from "../api/scripts";
import { topicsApi, type TopicListDto } from "../api/topics";
import toast from "react-hot-toast";
import { useConfirm } from "../components/confirm";
import SelectBox from "../components/SelectBox";
import ButtonGroup from "../components/ButtonGroup";

// ------------------- TYPES -------------------
type ScriptRow = ScriptListDto;

// ------------------- DEFAULT FORM -------------------
const EMPTY_SCRIPT: ScriptDetailDto = {
  id: 0,
  topicId: 0,
  topicCode: "",
  title: "",
  summary: "",
  content: "",
  language: "en",
  metaJson: "{}",
  createdAt: "",
  isActive: true,
};

// ------------------- COMPONENT -------------------
export default function ScriptListPage() {
  const [items, setItems] = useState<ScriptRow[]>([]);
  const [topics, setTopics] = useState<TopicListDto[]>([]);
  const [topicFilter, setTopicFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "passive"
  >("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const [showDetail, setShowDetail] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form, setForm] = useState<ScriptDetailDto>(EMPTY_SCRIPT);

  const confirm = useConfirm();
  const debouncedQ = useDebouncedValue(q, 300);

  // ------------------- LOADERS -------------------
  async function load() {
    setLoading(true);
    try {
      const list = await scriptsApi.list(
        topicFilter ? Number(topicFilter) : undefined,
        debouncedQ
      );
      setItems(list);
    } catch {
      toast.error("Scriptler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  async function loadTopics() {
    try {
      const list = await topicsApi.list();
      setTopics(list);
    } catch {
      toast.error("Topic listesi yüklenemedi");
    }
  }

  useEffect(() => {
    load();
    loadTopics();
  }, []);

  // ------------------- FILTER -------------------
  const filteredItems = items.filter((i) => {
    if (statusFilter === "active" && !i.isActive) return false;
    if (statusFilter === "passive" && i.isActive) return false;
    return (
      i.title.toLowerCase().includes(q.toLowerCase()) ||
      (i.summary?.toLowerCase().includes(q.toLowerCase()) ?? false)
    );
  });

  // ------------------- ROW ACTIONS -------------------
  async function toggleActive(row: ScriptRow) {
    try {
      await scriptsApi.toggleActive(row.id, !row.isActive);
      setItems((prev) =>
        prev.map((x) => (x.id === row.id ? { ...x, isActive: !x.isActive } : x))
      );
      toast.success(
        `Script #${row.id} ${!row.isActive ? "aktif" : "pasif"} yapıldı`
      );
    } catch {
      toast.error("İşlem başarısız");
    }
  }

  async function onDetailClick(row: ScriptRow) {
    setShowDetail(true);
    setSelectedId(row.id);
    setDetailLoading(true);
    try {
      const dto = await scriptsApi.get(row.id);
      setForm({
        ...dto,
        metaJson: formatJson(dto.metaJson),
      });
    } catch {
      toast.error("Detay yüklenemedi");
    } finally {
      setDetailLoading(false);
    }
  }

  async function onSave() {
    try {
      await toast.promise(scriptsApi.save(form), {
        loading: "Kaydediliyor…",
        success: "Güncellendi",
        error: "Kaydetme hatası",
      });
      setShowDetail(false);
      await load();
    } catch {}
  }

  async function onDelete(row: ScriptRow) {
    const ok = await confirm({
      title: "Silinsin mi?",
      message: <>#{row.id} silinecek, emin misin?</>,
      tone: "danger",
    });
    if (!ok) return;
    try {
      await scriptsApi.delete(row.id);
      toast.success("Silindi");
      await load();
    } catch {
      toast.error("Silinemedi");
    }
  }

  // ------------------- RENDER -------------------
  return (
    <Page>
      <Toolbar className="grid grid-cols-[1.5fr_1fr_auto_auto] gap-2">
        <Input
          placeholder="Ara… (title / summary)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        {/* <SelectBox
          value={topicFilter}
          onChange={(v) => setTopicFilter(v)}
          options={[
            { value: "", label: "Tüm Topicler" },
            ...topics.map((t) => ({
              value: String(t.id),
              label: `${t.topicCode} - ${t.premise ?? ""}`,
            })),
          ]}
        /> */}

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
              <TH>Topic</TH>
              <TH>Başlık</TH>
              <TH>Dil</TH>
              <TH>Aktif</TH>
              <TH>Oluşturulma</TH>
              <TH className="text-right">İşlemler</TH>
            </TR>
          </THead>
          <tbody>
            {filteredItems.map((r) => (
              <TR key={r.id} className="hover:bg-neutral-50">
                <TD className="font-mono text-xs">#{r.id}</TD>
                <TD>{r.topicCode ?? r.topicId}</TD>
                <TD>{r.title}</TD>
                <TD>{r.language.toUpperCase()}</TD>
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
                <TD className="text-xs text-neutral-500">
                  {r.createdAt
                    ? new Date(r.createdAt).toLocaleString("tr-TR")
                    : "—"}
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
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <div className="font-semibold text-lg">
                Script Detayı #{selectedId}
              </div>
              <button
                onClick={() => setShowDetail(false)}
                className="text-neutral-500 hover:text-neutral-700 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {detailLoading ? (
                <div>Yükleniyor…</div>
              ) : (
                <>
                  <Field label="Başlık">
                    <Input
                      value={form.title}
                      onChange={(e) =>
                        setForm({ ...form, title: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Özet">
                    <Textarea
                      rows={3}
                      value={form.summary ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, summary: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="İçerik">
                    <Textarea
                      rows={10}
                      value={form.content}
                      onChange={(e) =>
                        setForm({ ...form, content: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Meta JSON">
                    <Textarea
                      rows={6}
                      value={form.metaJson ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, metaJson: e.target.value })
                      }
                    />
                  </Field>
                </>
              )}
            </div>

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

// ------------------- HELPERS -------------------
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
