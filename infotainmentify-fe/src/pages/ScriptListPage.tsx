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
import toast from "react-hot-toast";
import { useConfirm } from "../components/confirm";
import Switch from "../components/Switch";
import Tooltip from "../components/Tooltip";
import ButtonGroup from "../components/ButtonGroup";
import { assetGeneratorApi } from "../api/assetGenerator";

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

export default function ScriptsPage() {
  const [items, setItems] = useState<ScriptListDto[]>([]);
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

  // ---------------- LOAD ----------------
  async function load() {
    setLoading(true);
    try {
      const list = await scriptsApi.list(undefined, debouncedQ);
      setItems(list);
    } catch {
      toast.error("Script listesi yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [debouncedQ]);

  // ---------------- ACTIONS ----------------
  async function toggleActive(row: ScriptListDto) {
    try {
      await scriptsApi.toggleActive(row.id, !row.isActive);
      setItems((prev) =>
        prev.map((x) => (x.id === row.id ? { ...x, isActive: !x.isActive } : x))
      );
      toast.success(`Script #${row.id} durumu değiştirildi`);
    } catch {
      toast.error("İşlem başarısız");
    }
  }

  async function onDetailClick(row: ScriptListDto) {
    setShowDetail(true);
    setSelectedId(row.id);
    setDetailLoading(true);
    try {
      const dto = await scriptsApi.get(row.id);
      setForm({ ...dto, metaJson: formatJson(dto.metaJson) });
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

  async function onDelete(row: ScriptListDto) {
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

  async function handleGenerateAll(scriptId: number) {
    try {
      toast.loading("Üretim başlatılıyor...");
      await assetGeneratorApi.generateFull(scriptId);
      toast.success("🎬 Tüm üretim işlemi başlatıldı!");
    } catch {
      toast.error("Üretim başlatılamadı!");
    } finally {
      toast.dismiss();
    }
  }

  // ---------------- FILTER ----------------
  const filtered = items.filter((i) => {
    if (statusFilter === "active" && !i.isActive) return false;
    if (statusFilter === "passive" && i.isActive) return false;
    return (
      i.title.toLowerCase().includes(q.toLowerCase()) ||
      (i.summary?.toLowerCase().includes(q.toLowerCase()) ?? false)
    );
  });

  // ---------------- RENDER ----------------
  return (
    <Page className="h-full bg-neutral-50">
      <div className="grid grid-cols-12 gap-4 h-full">
        <section className="col-span-12 flex flex-col min-h-0">
          {/* Toolbar */}
          <Toolbar className="grid grid-cols-[1fr_200px_auto] gap-2 items-center">
            <Input
              placeholder="Ara…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-[38px]"
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
            <Button onClick={load} disabled={loading} className="h-[38px]">
              {loading ? "Yükleniyor…" : "Yenile"}
            </Button>
          </Toolbar>

          {/* Table */}
          <Card className="mt-3 flex-1 min-h-0 overflow-auto">
            <Table>
              <THead>
                <TR>
                  <TH>ID</TH>
                  <TH>Topic</TH>
                  <TH>Başlık</TH>
                  <TH>Özet</TH>
                  <TH>Dil</TH>
                  <TH>Aktif</TH>
                  <TH>Oluşturma</TH>
                  <TH className="text-right">İşlemler</TH>
                </TR>
              </THead>
              <tbody>
                {filtered.map((r) => (
                  <TR
                    key={r.id}
                    className="hover:bg-neutral-50 border-b border-neutral-100"
                  >
                    <TD className="font-mono text-xs">#{r.id}</TD>
                    <TD>{r.topicCode ?? r.topicId}</TD>
                    <TD className="max-w-[220px]">
                      <Tooltip text={r.title}>
                        <div className="line-clamp-2">{r.title}</div>
                      </Tooltip>
                    </TD>
                    <TD className="max-w-[260px] text-xs text-neutral-600 line-clamp-2">
                      {r.summary ?? "—"}
                    </TD>
                    <TD>{r.language.toUpperCase()}</TD>
                    <TD>
                      <Switch
                        checked={!!r.isActive}
                        onChange={() => toggleActive(r)}
                        label={r.isActive ? "Aktif" : "Pasif"}
                      />
                    </TD>
                    <TD className="text-xs text-neutral-500">
                      {formatDate(r.createdAt)}
                    </TD>
                    <TD className="text-right">
                      <div className="inline-flex gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleGenerateAll(r.id)}
                        >
                          🎬 Üret
                        </Button>
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
        </section>
      </div>

      {/* Detail Modal */}
      {showDetail && (
        <Modal onClose={() => setShowDetail(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-[850px] max-h-[90vh] flex flex-col overflow-hidden">
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

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
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
                      className="font-mono"
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

// --- Helpers ---
function formatDate(v?: string | null) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString("tr-TR");
  } catch {
    return v;
  }
}

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
