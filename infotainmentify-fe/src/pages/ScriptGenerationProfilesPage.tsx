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
  scriptGenerationProfilesApi,
  type ScriptGenerationProfileListDto,
  type ScriptGenerationProfileDetailDto,
} from "../api/scriptProfiles";
import { promptsApi } from "../api/prompts";
import { aiIntegrationsApi } from "../api/aiIntegrations";
import { topicProfilesApi } from "../api/topicProfiles";
import toast from "react-hot-toast";
import { useConfirm } from "../components/confirm";
import SelectBox from "../components/SelectBox";

// ------------------- DEFAULT FORM -------------------
const EMPTY_PROFILE: ScriptGenerationProfileDetailDto = {
  id: 0,
  profileName: "",
  promptId: 0,
  aiConnectionId: 0,
  topicGenerationProfileId: null,
  modelName: "",
  temperature: 0.8,
  language: "en",
  outputMode: "Script",
  configJson: "{}",
  status: "Pending",
  productionType: "",
  renderStyle: "",
  isPublic: false,
  allowRetry: true,
};

// ------------------- COMPONENT -------------------
export default function ScriptGenerationProfilesPage() {
  const [items, setItems] = useState<ScriptGenerationProfileListDto[]>([]);
  const [prompts, setPrompts] = useState<{ id: number; name: string }[]>([]);
  const [aiConnections, setAiConnections] = useState<
    { id: number; name: string }[]
  >([]);
  const [topicProfiles, setTopicProfiles] = useState<
    { id: number; name: string }[]
  >([]);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  const [showDetail, setShowDetail] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form, setForm] =
    useState<ScriptGenerationProfileDetailDto>(EMPTY_PROFILE);

  const confirm = useConfirm();
  const debouncedQ = useDebouncedValue(q, 300);

  // ------------------- LOADERS -------------------
  async function load() {
    setLoading(true);
    try {
      const list = await scriptGenerationProfilesApi.list();
      setItems(list);
    } catch {
      toast.error("Script profilleri yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  async function loadRelations() {
    try {
      const [p, a, t] = await Promise.all([
        promptsApi.list(),
        aiIntegrationsApi.list(),
        topicProfilesApi.list(),
      ]);
      setPrompts(
        p.map((x: any) => ({
          id: x.id,
          name: x.name ?? x.title ?? `Prompt #${x.id}`,
        }))
      );
      setAiConnections(
        a.map((x: any) => ({
          id: x.id,
          name: x.name ?? `AI #${x.id}`,
        }))
      );
      setTopicProfiles(
        t.map((x: any) => ({
          id: x.id,
          name: x.profileName ?? `Profile #${x.id}`,
        }))
      );
    } catch {
      toast.error("Bağımlı veriler yüklenemedi");
    }
  }

  useEffect(() => {
    load();
    loadRelations();
  }, []);

  // ------------------- FILTER -------------------
  const filteredItems = items.filter((i) => {
    if (!debouncedQ) return true;
    return (
      i.profileName?.toLowerCase().includes(debouncedQ.toLowerCase()) ||
      i.modelName.toLowerCase().includes(debouncedQ.toLowerCase()) ||
      i.promptName?.toLowerCase().includes(debouncedQ.toLowerCase()) ||
      i.aiProvider?.toLowerCase().includes(debouncedQ.toLowerCase())
    );
  });

  // ------------------- ROW ACTIONS -------------------
  async function onDetailClick(row: ScriptGenerationProfileListDto) {
    setShowDetail(true);
    setSelectedId(row.id);
    setDetailLoading(true);
    try {
      const dto = await scriptGenerationProfilesApi.get(row.id);
      setForm({
        ...dto,
        configJson: formatJson(dto.configJson),
      });
    } catch {
      toast.error("Detay yüklenemedi");
    } finally {
      setDetailLoading(false);
    }
  }

  async function onSave() {
    try {
      await toast.promise(scriptGenerationProfilesApi.save(form), {
        loading: "Kaydediliyor…",
        success: "Kaydedildi",
        error: "Kaydetme hatası",
      });
      setShowDetail(false);
      await load();
    } catch {}
  }

  async function onDelete(row: ScriptGenerationProfileListDto) {
    const ok = await confirm({
      title: "Silinsin mi?",
      message: <>#{row.id} silinecek, emin misin?</>,
      tone: "danger",
    });
    if (!ok) return;
    try {
      await scriptGenerationProfilesApi.delete(row.id);
      toast.success("Silindi");
      await load();
    } catch {
      toast.error("Silinemedi");
    }
  }

  // ------------------- RENDER -------------------
  return (
    <Page>
      <Toolbar className="grid grid-cols-[1.5fr_auto_auto] gap-2">
        <Input
          placeholder="Ara… (profil / model / provider)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <Button onClick={load} disabled={loading}>
          {loading ? "Yükleniyor…" : "Yenile"}
        </Button>

        <Button
          variant="primary"
          onClick={() => {
            setForm(EMPTY_PROFILE);
            setShowDetail(true);
            setSelectedId(null);
          }}
        >
          Yeni Profil
        </Button>
      </Toolbar>

      <Card className="mt-3 flex-1 overflow-auto">
        <Table>
          <THead>
            <TR>
              <TH>ID</TH>
              <TH>Profil</TH>
              <TH>Model</TH>
              <TH>Prompt</TH>
              <TH>AI Provider</TH>
              <TH>Topic Profile</TH>
              <TH>Durum</TH>
              <TH className="text-right">İşlemler</TH>
            </TR>
          </THead>
          <tbody>
            {filteredItems.map((r) => (
              <TR key={r.id} className="hover:bg-neutral-50">
                <TD className="font-mono text-xs">#{r.id}</TD>
                <TD>{r.profileName}</TD>
                <TD>{r.modelName}</TD>
                <TD>{r.promptName ?? "—"}</TD>
                <TD>{r.aiProvider ?? "—"}</TD>
                <TD>{r.topicGenerationProfileName ?? "—"}</TD>
                <TD>{r.status ?? "—"}</TD>
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
                Script Generation Profile #{selectedId ?? "Yeni"}
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
                  <Field label="Profil Adı">
                    <Input
                      value={form.profileName ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, profileName: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Prompt">
                    <SelectBox
                      value={String(form.promptId)}
                      onChange={(v) =>
                        setForm({ ...form, promptId: Number(v) })
                      }
                      options={prompts.map((p) => ({
                        value: String(p.id),
                        label: p.name,
                      }))}
                    />
                  </Field>
                  <Field label="AI Connection">
                    <SelectBox
                      value={String(form.aiConnectionId)}
                      onChange={(v) =>
                        setForm({ ...form, aiConnectionId: Number(v) })
                      }
                      options={aiConnections.map((a) => ({
                        value: String(a.id),
                        label: a.name,
                      }))}
                    />
                  </Field>
                  <Field label="Topic Generation Profile">
                    <SelectBox
                      value={String(form.topicGenerationProfileId ?? "")}
                      onChange={(v) =>
                        setForm({
                          ...form,
                          topicGenerationProfileId: v ? Number(v) : null,
                        })
                      }
                      options={[
                        { value: "", label: "—" },
                        ...topicProfiles.map((t) => ({
                          value: String(t.id),
                          label: t.name,
                        })),
                      ]}
                    />
                  </Field>
                  <Field label="Model">
                    <Input
                      value={form.modelName}
                      onChange={(e) =>
                        setForm({ ...form, modelName: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Temperature">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={form.temperature}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          temperature: parseFloat(e.target.value),
                        })
                      }
                    />
                  </Field>
                  <Field label="Dil">
                    <Input
                      value={form.language ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, language: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Config JSON">
                    <Textarea
                      rows={6}
                      value={form.configJson ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, configJson: e.target.value })
                      }
                    />
                  </Field>
                  <div className="flex items-center gap-5 pt-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.isPublic}
                        onChange={(e) =>
                          setForm({ ...form, isPublic: e.target.checked })
                        }
                      />{" "}
                      Public
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.allowRetry}
                        onChange={(e) =>
                          setForm({ ...form, allowRetry: e.target.checked })
                        }
                      />{" "}
                      Allow Retry
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
