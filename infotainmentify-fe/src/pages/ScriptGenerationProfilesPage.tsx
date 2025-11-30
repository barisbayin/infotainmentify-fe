import { useEffect, useState } from "react";
import {
  Page,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Toolbar,
  Table,
  THead,
  TR,
  TH,
  TD,
  Button,
  Field,
  Input,
  Textarea,
} from "../components/ui-kit";
import toast from "react-hot-toast";
import { useConfirm } from "../components/confirm";
import SelectBox from "../components/SelectBox";
import Switch from "../components/Switch";
import {
  scriptGenerationProfilesApi,
  type ScriptGenerationProfileListDto,
  type ScriptGenerationProfileDetailDto,
} from "../api/scriptProfiles";
import { promptsApi } from "../api/prompts";
import { aiIntegrationsApi } from "../api/aiConnections";
import { topicProfilesApi } from "../api/topicProfiles";

// ------------------- Empty Form -------------------
const EMPTY: Omit<ScriptGenerationProfileDetailDto, "id"> = {
  profileName: "",
  promptId: 0,
  aiConnectionId: 0,
  topicGenerationProfileId: null,
  modelName: "",
  temperature: 0.8,
  language: "en",
  outputMode: "Script",
  configJson: "{}",
  productionType: "",
  renderStyle: "",
  isPublic: false,
  allowRetry: true,
  status: "Pending",

  // Image
  imageAiConnectionId: null,
  imageModelName: "",
  imageRenderStyle: "",
  imageAspectRatio: "9:16",

  // TTS
  ttsAiConnectionId: null,
  ttsModelName: "",
  ttsVoice: "",

  // Video
  videoAiConnectionId: null,
  videoModelName: "",
  videoTemplate: "",

  // STT  🎤🧠 YENİ
  sttAiConnectionId: null,
  sttModelName: "",

  // Auto flags
  autoGenerateAssets: false,
  autoRenderVideo: false,
};

// ------------------- Component -------------------
export default function ScriptGenerationProfilesPage() {
  const [items, setItems] = useState<ScriptGenerationProfileListDto[]>([]);
  const [filtered, setFiltered] = useState<ScriptGenerationProfileListDto[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] =
    useState<Omit<ScriptGenerationProfileDetailDto, "id">>(EMPTY);

  const [prompts, setPrompts] = useState<{ id: number; name: string }[]>([]);
  const [connections, setConnections] = useState<
    { id: number; name: string; provider: string }[]
  >([]);
  const [topicProfiles, setTopicProfiles] = useState<
    { id: number; name: string }[]
  >([]);

  // Filters
  const [q, setQ] = useState("");
  const [promptFilter, setPromptFilter] = useState<string>("");
  const [connFilter, setConnFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "passive"
  >("all");

  const confirm = useConfirm();

  // -------------------- LOAD DATA --------------------
  async function load() {
    setLoading(true);
    try {
      const data = await scriptGenerationProfilesApi.list();
      setItems(data);
      setFiltered(data);
    } catch {
      toast.error("Liste yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  async function loadSources() {
    try {
      const [p, c, t] = await Promise.all([
        promptsApi.list(),
        aiIntegrationsApi.list(),
        topicProfilesApi.list(),
      ]);
      setPrompts(p.map((x) => ({ id: x.id, name: x.name })));
      setConnections(
        c.map((x) => ({ id: x.id, name: x.name, provider: x.provider }))
      );
      setTopicProfiles(
        t.map((x) => ({ id: x.id, name: x.profileName ?? `Profile #${x.id}` }))
      );
    } catch {
      toast.error("Kaynak listeleri yüklenemedi");
    }
  }

  useEffect(() => {
    load();
    loadSources();
  }, []);

  // -------------------- FILTRELEME --------------------
  useEffect(() => {
    const filteredData = items.filter((x) => {
      const qMatch =
        !q ||
        x.profileName.toLowerCase().includes(q.toLowerCase()) ||
        x.modelName.toLowerCase().includes(q.toLowerCase()) ||
        (x.promptName ?? "").toLowerCase().includes(q.toLowerCase());
      const promptMatch =
        !promptFilter || String(x.promptName ?? "") === promptFilter;
      const connMatch =
        !connFilter || String(x.aiProvider ?? "") === connFilter;
      const statusMatch =
        statusFilter === "all" ||
        (statusFilter === "active" && x.isPublic) ||
        (statusFilter === "passive" && !x.isPublic);
      return qMatch && promptMatch && connMatch && statusMatch;
    });
    setFiltered(filteredData);
  }, [q, promptFilter, connFilter, statusFilter, items]);

  // -------------------- ROW CLICK --------------------
  async function onRowClick(item: ScriptGenerationProfileListDto) {
    setSelectedId(item.id);
    setDetailLoading(true);
    try {
      const dto = await scriptGenerationProfilesApi.get(item.id);
      setForm({ ...dto });
    } catch {
      toast.error("Detay yüklenemedi");
    } finally {
      setDetailLoading(false);
    }
  }

  function resetForm() {
    setSelectedId(null);
    setForm(EMPTY);
  }

  // -------------------- SAVE / DELETE --------------------
  async function onSave() {
    if (
      !form.promptId ||
      !form.aiConnectionId ||
      !form.modelName.trim() ||
      !form.profileName.trim()
    ) {
      toast.error("Prompt, bağlantı, model ve profil adı zorunludur");
      return;
    }

    try {
      await toast.promise(
        scriptGenerationProfilesApi.save({
          ...form,
          id: selectedId ?? 0,
        }),
        {
          loading: "Kaydediliyor…",
          success: selectedId
            ? `#${selectedId} güncellendi`
            : "Yeni profil oluşturuldu",
          error: "Kayıt hatası",
        }
      );
      resetForm();
      await load();
    } catch {
      toast.error("Kayıt başarısız");
    }
  }

  async function onDelete() {
    if (!selectedId) return;
    const ok = await confirm({
      title: "Silinsin mi?",
      message: `#${selectedId} kalıcı olarak silinecek.`,
      confirmText: "Sil",
      cancelText: "İptal",
      tone: "danger",
    });
    if (!ok) return;

    try {
      await scriptGenerationProfilesApi.delete(selectedId);
      toast.success("Silindi");
      resetForm();
      await load();
    } catch {
      toast.error("Silme başarısız");
    }
  }

  // -------------------- RENDER --------------------
  return (
    <Page>
      <div className="grid grid-cols-12 gap-4 h-full">
        {/* SOL - Liste */}
        <section className="col-span-12 xl:col-span-7 flex flex-col min-h-0">
          <Toolbar className="flex gap-2">
            <Input
              placeholder="Ara…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <SelectBox
              value={promptFilter}
              onChange={setPromptFilter}
              options={[
                { value: "", label: "Tüm Promptlar" },
                ...prompts.map((p) => ({ value: p.name, label: p.name })),
              ]}
            />
            <SelectBox
              value={connFilter}
              onChange={setConnFilter}
              options={[
                { value: "", label: "Tüm Bağlantılar" },
                ...connections.map((c) => ({
                  value: c.provider,
                  label: `${c.name} (${c.provider})`,
                })),
              ]}
            />
            <Button onClick={load} disabled={loading}>
              {loading ? "Yükleniyor…" : "Yenile"}
            </Button>
            <Button variant="primary" onClick={resetForm}>
              Yeni
            </Button>
          </Toolbar>

          <Card className="mt-3 flex-1 min-h-0 overflow-auto">
            <Table>
              <THead>
                <TR>
                  <TH>ID</TH>
                  <TH>Profil</TH>
                  <TH>Model</TH>
                  <TH>Prompt</TH>
                  <TH>AI</TH>
                  <TH>Topic Profile</TH>
                </TR>
              </THead>
              <tbody>
                {filtered.map((x) => (
                  <TR
                    key={x.id}
                    onClick={() => onRowClick(x)}
                    className={[
                      "cursor-pointer border-b border-neutral-100 hover:bg-neutral-50",
                      selectedId === x.id ? "bg-neutral-100" : "",
                    ].join(" ")}
                  >
                    <TD>#{x.id}</TD>
                    <TD>{x.profileName}</TD>
                    <TD>{x.modelName}</TD>
                    <TD>{x.promptName ?? "—"}</TD>
                    <TD>{x.aiProvider ?? "—"}</TD>
                    <TD>{x.topicGenerationProfileName ?? "—"}</TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </Card>
        </section>

        {/* SAĞ - Detay */}
        <section className="col-span-12 xl:col-span-5 flex flex-col min-h-0 overflow-hidden">
          <Card className="flex flex-col flex-1 overflow-hidden">
            <CardHeader>
              <div className="text-lg font-semibold">
                {selectedId ? `Düzenle #${selectedId}` : "Yeni Script Profili"}
              </div>
            </CardHeader>

            {/* === Form === */}
            <CardBody className="flex-1 overflow-hidden p-0">
              <div className="h-full overflow-y-auto px-4 py-3 space-y-3">
                {detailLoading ? (
                  <div className="p-3 text-sm text-neutral-500">
                    Yükleniyor…
                  </div>
                ) : (
                  <>
                    {/* ==== Script Settings ==== */}
                    <Field label="Profil Adı">
                      <Input
                        value={form.profileName}
                        onChange={(e) =>
                          setForm({ ...form, profileName: e.target.value })
                        }
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Prompt">
                        <SelectBox
                          value={form.promptId?.toString()}
                          onChange={(v) =>
                            setForm({ ...form, promptId: Number(v) })
                          }
                          options={prompts.map((p) => ({
                            value: p.id.toString(),
                            label: p.name,
                          }))}
                        />
                      </Field>

                      <Field label="AI Bağlantısı (Script)">
                        <SelectBox
                          value={form.aiConnectionId?.toString()}
                          onChange={(v) =>
                            setForm({ ...form, aiConnectionId: Number(v) })
                          }
                          options={connections.map((c) => ({
                            value: c.id.toString(),
                            label: `${c.name} (${c.provider})`,
                          }))}
                        />
                      </Field>
                    </div>

                    <Field label="Topic Profile">
                      <SelectBox
                        value={form.topicGenerationProfileId?.toString() ?? ""}
                        onChange={(v) =>
                          setForm({
                            ...form,
                            topicGenerationProfileId: v ? Number(v) : null,
                          })
                        }
                        options={[
                          { value: "", label: "—" },
                          ...topicProfiles.map((t) => ({
                            value: t.id.toString(),
                            label: t.name,
                          })),
                        ]}
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Model">
                        <Input
                          value={form.modelName}
                          onChange={(e) =>
                            setForm({ ...form, modelName: e.target.value })
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
                    </div>

                    <Field label="Config JSON">
                      <Textarea
                        className="font-mono text-sm"
                        rows={5}
                        value={form.configJson ?? ""}
                        onChange={(e) =>
                          setForm({ ...form, configJson: e.target.value })
                        }
                      />
                    </Field>

                    {/* ==== IMAGE ==== */}
                    <div className="pt-3 border-t border-neutral-200">
                      <h3 className="text-sm font-semibold mb-2">
                        🎨 Image Generation
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="AI Bağlantısı">
                          <SelectBox
                            value={form.imageAiConnectionId?.toString() ?? ""}
                            onChange={(v) =>
                              setForm({
                                ...form,
                                imageAiConnectionId: v ? Number(v) : null,
                              })
                            }
                            options={[
                              { value: "", label: "—" },
                              ...connections.map((c) => ({
                                value: c.id.toString(),
                                label: `${c.name} (${c.provider})`,
                              })),
                            ]}
                          />
                        </Field>
                        <Field label="Model">
                          <Input
                            value={form.imageModelName ?? ""}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                imageModelName: e.target.value,
                              })
                            }
                          />
                        </Field>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Render Stili">
                          <Input
                            value={form.imageRenderStyle ?? ""}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                imageRenderStyle: e.target.value,
                              })
                            }
                          />
                        </Field>
                        <Field label="Aspect Ratio">
                          <Input
                            value={form.imageAspectRatio ?? ""}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                imageAspectRatio: e.target.value,
                              })
                            }
                          />
                        </Field>
                      </div>
                    </div>

                    {/* ==== TTS ==== */}
                    <div className="pt-3 border-t border-neutral-200">
                      <h3 className="text-sm font-semibold mb-2">
                        🗣️ TTS Generation
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="AI Bağlantısı">
                          <SelectBox
                            value={form.ttsAiConnectionId?.toString() ?? ""}
                            onChange={(v) =>
                              setForm({
                                ...form,
                                ttsAiConnectionId: v ? Number(v) : null,
                              })
                            }
                            options={[
                              { value: "", label: "—" },
                              ...connections.map((c) => ({
                                value: c.id.toString(),
                                label: `${c.name} (${c.provider})`,
                              })),
                            ]}
                          />
                        </Field>
                        <Field label="Model">
                          <Input
                            value={form.ttsModelName ?? ""}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                ttsModelName: e.target.value,
                              })
                            }
                          />
                        </Field>
                      </div>
                      <Field label="Ses (Voice)">
                        <Input
                          value={form.ttsVoice ?? ""}
                          onChange={(e) =>
                            setForm({ ...form, ttsVoice: e.target.value })
                          }
                        />
                      </Field>
                    </div>

                    {/* ==== STT ==== */}
                    <div className="pt-3 border-t border-neutral-200">
                      <h3 className="text-sm font-semibold mb-2">
                        🎧 STT (Speech-to-Text)
                      </h3>

                      <div className="grid grid-cols-2 gap-3">
                        <Field label="AI Bağlantısı">
                          <SelectBox
                            value={form.sttAiConnectionId?.toString() ?? ""}
                            onChange={(v) =>
                              setForm({
                                ...form,
                                sttAiConnectionId: v ? Number(v) : null,
                              })
                            }
                            options={[
                              { value: "", label: "—" },
                              ...connections.map((c) => ({
                                value: c.id.toString(),
                                label: `${c.name} (${c.provider})`,
                              })),
                            ]}
                          />
                        </Field>

                        <Field label="STT Model">
                          <Input
                            value={form.sttModelName ?? ""}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                sttModelName: e.target.value,
                              })
                            }
                          />
                        </Field>
                      </div>
                    </div>

                    {/* ==== VIDEO ==== */}
                    <div className="pt-3 border-t border-neutral-200">
                      <h3 className="text-sm font-semibold mb-2">
                        🎬 Video Generation
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="AI Bağlantısı">
                          <SelectBox
                            value={form.videoAiConnectionId?.toString() ?? ""}
                            onChange={(v) =>
                              setForm({
                                ...form,
                                videoAiConnectionId: v ? Number(v) : null,
                              })
                            }
                            options={[
                              { value: "", label: "—" },
                              ...connections.map((c) => ({
                                value: c.id.toString(),
                                label: `${c.name} (${c.provider})`,
                              })),
                            ]}
                          />
                        </Field>
                        <Field label="Model">
                          <Input
                            value={form.videoModelName ?? ""}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                videoModelName: e.target.value,
                              })
                            }
                          />
                        </Field>
                      </div>
                      <Field label="Video Template">
                        <Input
                          value={form.videoTemplate ?? ""}
                          onChange={(e) =>
                            setForm({ ...form, videoTemplate: e.target.value })
                          }
                        />
                      </Field>
                    </div>

                    {/* ==== FLAGS ==== */}
                    <div className="pt-3 border-t border-neutral-200 grid grid-cols-2 gap-3">
                      <Switch
                        checked={form.isPublic}
                        onChange={(v) => setForm({ ...form, isPublic: v })}
                        label="Herkese Açık"
                      />
                      <Switch
                        checked={form.allowRetry}
                        onChange={(v) => setForm({ ...form, allowRetry: v })}
                        label="Tekrar Deneme"
                      />
                      <Switch
                        checked={form.autoGenerateAssets ?? false}
                        onChange={(v) =>
                          setForm({ ...form, autoGenerateAssets: v })
                        }
                        label="Otomatik Görsel + Ses Üret"
                      />
                      <Switch
                        checked={form.autoRenderVideo ?? false}
                        onChange={(v) =>
                          setForm({ ...form, autoRenderVideo: v })
                        }
                        label="Otomatik Video Render"
                      />
                    </div>
                  </>
                )}
              </div>
            </CardBody>

            <CardFooter className="shrink-0 bg-white border-t border-neutral-200 shadow-sm sticky bottom-0 z-10">
              <div className="flex justify-end gap-2 px-2 py-2">
                <Button onClick={resetForm} disabled={detailLoading}>
                  Yeni
                </Button>
                <Button
                  variant="danger"
                  onClick={onDelete}
                  disabled={!selectedId || detailLoading}
                >
                  Sil
                </Button>
                <Button
                  variant="primary"
                  onClick={onSave}
                  disabled={detailLoading}
                >
                  Kaydet
                </Button>
              </div>
            </CardFooter>
          </Card>
        </section>
      </div>
    </Page>
  );
}
