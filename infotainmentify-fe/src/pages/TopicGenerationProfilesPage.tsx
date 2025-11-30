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
import ButtonGroup from "../components/ButtonGroup";
import {
  topicProfilesApi,
  type TopicGenerationProfileDetailDto,
  type TopicGenerationProfileListDto,
} from "../api/topicProfiles";
import { promptsApi } from "../api/prompts";
import { aiIntegrationsApi } from "../api/aiConnections";
import Switch from "../components/Switch";

// ------------------- Empty Form -------------------
const EMPTY: Omit<TopicGenerationProfileDetailDto, "id"> = {
  profileName: "",
  promptId: 0,
  aiConnectionId: 0,
  modelName: "",
  productionType: "",
  renderStyle: "",
  language: "en",
  temperature: 0.7,
  requestedCount: 30,
  maxTokens: undefined,
  tagsJson: "",
  outputMode: "Topic",
  autoGenerateScript: false,
  isPublic: false,
  allowRetry: true,
  promptName: "",
  aiProvider: "",
};

export default function TopicGenerationProfilesPage() {
  const [items, setItems] = useState<TopicGenerationProfileListDto[]>([]);
  const [filtered, setFiltered] = useState<TopicGenerationProfileListDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] =
    useState<Omit<TopicGenerationProfileDetailDto, "id">>(EMPTY);

  const [prompts, setPrompts] = useState<{ id: number; name: string }[]>([]);
  const [connections, setConnections] = useState<
    { id: number; name: string; provider: string }[]
  >([]);

  // 🔍 Toolbar filtreleri
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
      const data = await topicProfilesApi.list();
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
      const [p, c] = await Promise.all([
        promptsApi.list(),
        aiIntegrationsApi.list(),
      ]);
      setPrompts(p.map((x) => ({ id: x.id, name: x.name })));
      setConnections(
        c.map((x) => ({ id: x.id, name: x.name, provider: x.provider }))
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
  async function onRowClick(item: TopicGenerationProfileListDto) {
    setSelectedId(item.id);
    setDetailLoading(true);
    try {
      const dto = await topicProfilesApi.get(item.id);
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

    const isUpdate = selectedId != null;
    const opPromise: Promise<void> = isUpdate
      ? topicProfilesApi.update(selectedId!, form).then(() => undefined)
      : topicProfilesApi.create(form).then(() => undefined);

    try {
      await toast.promise(opPromise, {
        loading: "Kaydediliyor…",
        success: isUpdate
          ? `#${selectedId} güncellendi`
          : "Yeni profil oluşturuldu",
        error: "Kayıt hatası",
      });
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
      await topicProfilesApi.delete(selectedId);
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
          {/* 🔹 Toolbar */}
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

          {/* 🔹 Liste Tablosu */}
          <Card className="mt-3 flex-1 min-h-0 overflow-auto">
            <Table>
              <THead>
                <TR>
                  <TH>ID</TH>
                  <TH>Profil Adı</TH>
                  <TH>Prompt</TH>
                  <TH>Bağlantı</TH>
                  <TH>Model</TH>
                  <TH>Dil</TH>
                  <TH>Adet</TH>
                  <TH>Durum</TH>
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
                    <TD>{x.promptName ?? "—"}</TD>
                    <TD>{x.aiProvider ?? "—"}</TD>
                    <TD>{x.modelName}</TD>
                    <TD>{x.language}</TD>
                    <TD>{x.requestedCount}</TD>
                    <TD>{x.isPublic ? "Aktif" : "Pasif"}</TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </Card>
        </section>

        {/* SAĞ - Detay */}
        <section className="col-span-12 xl:col-span-5 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <div className="text-lg font-semibold">
                {selectedId ? `Düzenle #${selectedId}` : "Yeni Üretim Profili"}
              </div>
            </CardHeader>

            <CardBody className="flex flex-col flex-1 min-h-0 overflow-hidden space-y-3">
              {detailLoading ? (
                <div className="p-3 text-sm text-neutral-500">Yükleniyor…</div>
              ) : (
                <>
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

                    <Field label="AI Bağlantısı">
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

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Model Adı">
                      <Input
                        value={form.modelName}
                        onChange={(e) =>
                          setForm({ ...form, modelName: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Dil">
                      <Input
                        value={form.language}
                        onChange={(e) =>
                          setForm({ ...form, language: e.target.value })
                        }
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Sıcaklık (Temperature)">
                      <Input
                        type="number"
                        step="0.1"
                        value={form.temperature}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            temperature: parseFloat(e.target.value),
                          })
                        }
                      />
                    </Field>
                    <Field label="Maks. Token">
                      <Input
                        type="number"
                        value={form.maxTokens ?? ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            maxTokens: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          })
                        }
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Üretim Türü">
                      <Input
                        value={form.productionType ?? ""}
                        onChange={(e) =>
                          setForm({ ...form, productionType: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Render Stili">
                      <Input
                        value={form.renderStyle ?? ""}
                        onChange={(e) =>
                          setForm({ ...form, renderStyle: e.target.value })
                        }
                      />
                    </Field>
                  </div>

                  <Field label="Etiketler (JSON)">
                    <Textarea
                      className="font-mono text-sm"
                      value={form.tagsJson ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, tagsJson: e.target.value })
                      }
                      placeholder='["science","viral"]'
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Çıktı Modu">
                      <Input
                        value={form.outputMode}
                        onChange={(e) =>
                          setForm({ ...form, outputMode: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="İstek Sayısı">
                      <Input
                        type="number"
                        value={form.requestedCount}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            requestedCount: Number(e.target.value),
                          })
                        }
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <Switch
                      checked={form.autoGenerateScript}
                      onChange={(v) =>
                        setForm({ ...form, autoGenerateScript: v })
                      }
                      label="Otomatik Script"
                    />
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
                  </div>
                </>
              )}
            </CardBody>

            <CardFooter>
              <div className="flex justify-end gap-2">
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
