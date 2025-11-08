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
import { promptsApi } from "../api/prompts";
import { scriptGenerationProfilesApi } from "../api/scriptProfiles";
import { scriptGeneratorApi } from "../api/scriptGenerator";
import toast from "react-hot-toast";
import { useConfirm } from "../components/confirm";
import SelectBox from "../components/SelectBox";
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
  allowScriptGeneration: true,
};

export default function TopicsPage() {
  const [items, setItems] = useState<TopicListDto[]>([]);
  const [prompts, setPrompts] = useState<{ id: number; title: string }[]>([]);
  const [promptFilter, setPromptFilter] = useState("");
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

  /* ===========================================================
     ⚙️ SCRIPT GENERATION MODAL STATES
     =========================================================== */
  const [showGenerate, setShowGenerate] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<TopicListDto | null>(null);
  const [scriptProfiles, setScriptProfiles] = useState<
    { id: number; name: string }[]
  >([]);
  const [selectedProfile, setSelectedProfile] = useState("");
  const [genLoading, setGenLoading] = useState(false);

  /* ===========================================================
     📡 LOADERS
     =========================================================== */
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

  async function loadProfiles() {
    try {
      const list = await scriptGenerationProfilesApi.list();
      setScriptProfiles(
        list.map((p: any) => ({
          id: p.id,
          name: p.profileName ?? `Profil #${p.id}`,
        }))
      );
    } catch {
      toast.error("Script profilleri yüklenemedi");
    }
  }

  useEffect(() => {
    load();
    loadPrompts();
  }, [debouncedQ]);

  const filtered = items.filter((i) => {
    if (promptFilter && String(i.promptId ?? "") !== promptFilter) return false;
    if (statusFilter === "active" && !i.isActive) return false;
    if (statusFilter === "passive" && i.isActive) return false;
    return (
      i.premise?.toLowerCase().includes(q.toLowerCase()) ||
      i.premiseTr?.toLowerCase().includes(q.toLowerCase()) ||
      i.category?.toLowerCase().includes(q.toLowerCase())
    );
  });

  /* ===========================================================
     🧠 ACTIONS
     =========================================================== */
  async function toggleActive(row: TopicListDto) {
    try {
      await topicsApi.toggleActive(row.id, !row.isActive);
      setItems((prev) =>
        prev.map((x) => (x.id === row.id ? { ...x, isActive: !x.isActive } : x))
      );
      toast.success(`Topic #${row.id} durumu değiştirildi`);
    } catch {
      toast.error("İşlem başarısız");
    }
  }

  async function toggleAllowScript(row: TopicListDto, allow: boolean) {
    try {
      await topicsApi.setAllowScript(row.id, allow);
      setItems((prev) =>
        prev.map((x) =>
          x.id === row.id ? { ...x, allowScriptGeneration: allow } : x
        )
      );
      toast.success(
        `#${row.id} için script üretimi ${allow ? "açıldı" : "kapandı"}`
      );
    } catch {
      toast.error("Script üretim izni değiştirilemedi");
    }
  }

  async function onDetailClick(row: TopicListDto) {
    setShowDetail(true);
    setSelectedId(row.id);
    setDetailLoading(true);
    try {
      const dto = await topicsApi.get(row.id);
      setForm({ ...dto, topicJson: formatJson(dto.topicJson) });
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

  /* ===========================================================
     🚀 SCRIPT GENERATION
     =========================================================== */
  async function openGenerateModal(row: TopicListDto) {
    setSelectedTopic(row);
    setShowGenerate(true);
    if (scriptProfiles.length === 0) await loadProfiles();
  }

  async function handleGenerate() {
    if (!selectedProfile || !selectedTopic) return;
    setGenLoading(true);
    try {
      const res = await scriptGeneratorApi.generateFromTopics({
        profileId: Number(selectedProfile),
        topicIds: [selectedTopic.id],
      });

      toast.success(res.message ?? "Üretim tamamlandı");
      setShowGenerate(false);
      await load();
    } catch {
      toast.error("Üretim sırasında hata oluştu");
    } finally {
      setGenLoading(false);
    }
  }

  /* ===========================================================
     🧱 COMPONENTS
     =========================================================== */
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

  /* ===========================================================
     🖼️ RENDER
     =========================================================== */
  return (
    <Page className="h-full bg-neutral-50">
      <div className="grid grid-cols-12 gap-4 h-full">
        <section className="col-span-12 flex flex-col min-h-0">
          <Toolbar className="grid grid-cols-[1fr_220px_160px_auto] gap-2 items-center">
            <Input
              placeholder="Ara…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-[38px]"
            />

            <SelectBox
              value={promptFilter}
              onChange={(v) => setPromptFilter(v)}
              options={[
                { value: "", label: "Tüm Promptlar" },
                ...prompts.map((p) => ({
                  value: String(p.id),
                  label: p.title,
                })),
              ]}
              className="h-[38px]"
            />

            <div className="flex items-center justify-between border border-neutral-300 rounded-lg h-[38px] overflow-hidden bg-white">
              {[
                { label: "Hepsi", value: "all" },
                { label: "Aktif", value: "active" },
                { label: "Pasif", value: "passive" },
              ].map((opt, idx) => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value as any)}
                  className={`flex-1 h-full text-sm transition-colors ${
                    statusFilter === opt.value
                      ? "bg-neutral-200 text-neutral-900"
                      : "bg-white hover:bg-neutral-100 text-neutral-600"
                  } ${idx !== 2 ? "border-r border-neutral-300" : ""}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <Button onClick={load} disabled={loading} className="h-[38px]">
              {loading ? "Yükleniyor…" : "Yenile"}
            </Button>
          </Toolbar>

          {/* 🧾 TABLO */}
          <Card className="mt-3 flex-1 min-h-0 overflow-auto">
            <Table>
              <THead>
                <TR>
                  <TH>ID</TH>
                  <TH>Kategori</TH>
                  <TH>Alt Kategori</TH>
                  <TH style={{ width: "280px" }}>Premise</TH>
                  <TH>Prompt</TH>
                  <TH>Script</TH>
                  <TH>Durum</TH>
                  <TH>Aktif</TH>
                  <TH>İzin Ver</TH>
                  <TH>Script İşlemi</TH>
                  <TH className="text-right">İşlemler</TH>
                </TR>
              </THead>
              <tbody>
                {filtered.map((r) => (
                  <TR key={r.id} className="hover:bg-neutral-50 border-b">
                    <TD className="font-mono text-xs">#{r.id}</TD>
                    <TD>{r.category ?? "—"}</TD>
                    <TD>{r.subCategory ?? "—"}</TD>
                    <TD className="max-w-[280px]">
                      <Tooltip
                        text={`EN: ${r.premise ?? "—"}\nTR: ${
                          r.premiseTr ?? "—"
                        }`}
                      >
                        <div className="text-[12px] text-neutral-800 line-clamp-2 leading-snug">
                          {r.premise ?? "—"}
                        </div>
                        <div className="text-[11px] text-neutral-500 line-clamp-1 leading-snug">
                          {r.premiseTr ?? ""}
                        </div>
                      </Tooltip>
                    </TD>
                    <TD>{r.promptName ?? "—"}</TD>
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
                    <TD>
                      <Switch
                        checked={!!r.allowScriptGeneration}
                        onChange={(v) => toggleAllowScript(r, v)}
                        label={r.allowScriptGeneration ? "Açık" : "Kapalı"}
                      />
                    </TD>
                    <TD>
                      <Button
                        size="sm"
                        variant={
                          r.scriptGenerated
                            ? "ghost"
                            : r.allowScriptGeneration
                            ? "primary"
                            : "ghost"
                        }
                        disabled={!r.allowScriptGeneration || r.scriptGenerated}
                        onClick={() => openGenerateModal(r)}
                      >
                        {r.scriptGenerated
                          ? "Tamam"
                          : r.allowScriptGeneration
                          ? "Üret"
                          : "—"}
                      </Button>
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
        </section>
      </div>

      {/* 🎬 GENERATE MODAL */}
      {showGenerate && (
        <Modal onClose={() => setShowGenerate(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-[500px] flex flex-col overflow-hidden">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <div className="font-semibold text-lg">
                Script Üret — #{selectedTopic?.id} ({selectedTopic?.category})
              </div>
              <button
                onClick={() => setShowGenerate(false)}
                className="text-neutral-500 hover:text-neutral-700 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <Field label="Script Generation Profile">
                <SelectBox
                  value={selectedProfile}
                  onChange={(v) => setSelectedProfile(v)}
                  options={scriptProfiles.map((p) => ({
                    value: String(p.id),
                    label: p.name,
                  }))}
                />
              </Field>
              <div className="text-sm text-neutral-500">
                Bu işlem yalnızca <b>AllowScriptGeneration = true</b> ve{" "}
                <b>ScriptGenerated = false</b> topicler için çalışır.
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end gap-2">
              <Button onClick={() => setShowGenerate(false)}>İptal</Button>
              <Button
                variant="primary"
                disabled={!selectedProfile || genLoading}
                onClick={handleGenerate}
              >
                {genLoading ? "Üretiliyor..." : "Üret"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 🧩 DETAY MODAL */}
      {showDetail && (
        <Modal onClose={() => setShowDetail(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-[850px] max-h-[90vh] flex flex-col overflow-hidden">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <div className="font-semibold text-lg">
                Topic Detayı #{selectedId} —{" "}
                <span className="font-mono text-sm text-neutral-500">
                  {form.topicCode}
                </span>
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
                  <div className="flex items-center gap-5 pb-2">
                    <Switch
                      checked={!!form.allowScriptGeneration}
                      onChange={(v) =>
                        setForm({ ...form, allowScriptGeneration: v })
                      }
                      label="Script Üretimine İzin Ver"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Category">
                      <Input value={form.category ?? ""} readOnly />
                    </Field>
                    <Field label="SubCategory">
                      <Input value={form.subCategory ?? ""} readOnly />
                    </Field>
                    <Field label="Series">
                      <Input value={form.series ?? ""} readOnly />
                    </Field>
                    <Field label="Tone">
                      <Input value={form.tone ?? ""} readOnly />
                    </Field>
                    <Field label="Render Style">
                      <Input value={form.renderStyle ?? ""} readOnly />
                    </Field>
                    <Field label="Priority">
                      <Input value={String(form.priority)} readOnly />
                    </Field>
                  </div>

                  <Field label="Premise (EN)">
                    <Textarea rows={3} value={form.premise ?? ""} readOnly />
                  </Field>
                  <Field label="Premise (TR)">
                    <Textarea rows={3} value={form.premiseTr ?? ""} readOnly />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Voice Hint">
                      <Input value={form.voiceHint ?? ""} readOnly />
                    </Field>
                    <Field label="Script Hint">
                      <Input value={form.scriptHint ?? ""} readOnly />
                    </Field>
                    <Field label="Potential Visual">
                      <Input value={form.potentialVisual ?? ""} readOnly />
                    </Field>
                    <Field label="Prompt">
                      <Input
                        value={`${form.promptName ?? ""} #${
                          form.promptId ?? ""
                        }`}
                        readOnly
                      />
                    </Field>
                    <Field label="Script Title">
                      <Input value={form.scriptTitle ?? ""} readOnly />
                    </Field>
                    <Field label="Script Generated At">
                      <Input
                        value={formatDate(form.scriptGeneratedAt)}
                        readOnly
                      />
                    </Field>
                  </div>

                  <Field label="Topic JSON">
                    <Textarea
                      rows={10}
                      value={form.topicJson ?? ""}
                      readOnly
                      className="font-mono"
                    />
                  </Field>

                  <div className="flex items-center gap-5 pt-3">
                    <Switch
                      checked={form.isActive}
                      onChange={(v) => setForm({ ...form, isActive: v })}
                      label="Aktif"
                    />
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.scriptGenerated}
                        readOnly
                      />{" "}
                      Script Hazır
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.factCheck}
                        readOnly
                      />{" "}
                      Fact Check
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.needsFootage}
                        readOnly
                      />{" "}
                      Footage Gerekiyor
                    </label>
                  </div>
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

/* ===========================================================
   🔧 HELPERS
   =========================================================== */
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
