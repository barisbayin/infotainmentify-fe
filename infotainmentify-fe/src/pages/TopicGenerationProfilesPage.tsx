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
import {
  topicProfilesApi,
  type TopicGenerationProfileDetailDto,
  type TopicGenerationProfileListDto,
} from "../api/topicProfiles";
import { type Prompt } from "../api/types";
import { promptsApi } from "../api/prompts";
import {
  aiIntegrationsApi,
  type UserAiConnectionDetailDto,
} from "../api/aiIntegrations";

const STATUSES = [
  { value: "Pending", label: "Beklemede" },
  { value: "Success", label: "Başarılı" },
  { value: "Failed", label: "Hatalı" },
];

const EMPTY: Omit<TopicGenerationProfileDetailDto, "id"> = {
  promptId: 0,
  aiConnectionId: 0,
  profileName: "",
  modelName: "",
  requestedCount: 1,
  rawResponseJson: "{}",
  startedAt: undefined,
  completedAt: undefined,
  status: "Pending",
  promptName: "",
  aiProvider: "",
};

export default function TopicGenerationProfilesPage() {
  const [items, setItems] = useState<TopicGenerationProfileListDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] =
    useState<Omit<TopicGenerationProfileDetailDto, "id">>(EMPTY);

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [connections, setConnections] = useState<UserAiConnectionDetailDto[]>(
    []
  );

  const confirm = useConfirm();

  // Liste yükle
  async function load() {
    setLoading(true);
    try {
      const data = await topicProfilesApi.list();
      setItems(data);
    } catch {
      toast.error("Liste yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  // Prompts ve AI bağlantıları yükle
  async function loadSources() {
    try {
      const [p, c] = await Promise.all([
        promptsApi.list(),
        aiIntegrationsApi.list(),
      ]);
      setPrompts(p);
      setConnections(c);
    } catch {
      toast.error("Kaynak listeleri yüklenemedi");
    }
  }

  useEffect(() => {
    load();
    loadSources();
  }, []);

  async function onRowClick(item: TopicGenerationProfileListDto) {
    setSelectedId(item.id);
    setDetailLoading(true);
    try {
      const dto = await topicProfilesApi.get(item.id);
      setForm({
        profileName: dto.profileName,
        promptId: dto.promptId,
        aiConnectionId: dto.aiConnectionId,
        modelName: dto.modelName,
        requestedCount: dto.requestedCount,
        rawResponseJson: dto.rawResponseJson ?? "{}",
        startedAt: dto.startedAt,
        completedAt: dto.completedAt,
        status: dto.status ?? "Pending",
        promptName: dto.promptName,
        aiProvider: dto.aiProvider,
      });
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

  async function onSave() {
    if (
      !form.promptId ||
      !form.aiConnectionId ||
      !form.modelName.trim() ||
      !form.profileName?.trim()
    ) {
      toast.error("Prompt, bağlantı, model adı ve profil adı zorunludur");
      return;
    }

    const isUpdate = selectedId != null;
    const opPromise: Promise<void> = isUpdate
      ? topicProfilesApi.update(selectedId!, form)
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

  return (
    <Page>
      <div className="grid grid-cols-12 gap-4 h-full">
        {/* SOL - Liste */}
        <section className="col-span-12 xl:col-span-7 flex flex-col min-h-0">
          <Toolbar>
            <Button onClick={load} disabled={loading}>
              {loading ? "Yenileniyor…" : "Yenile"}
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
                  <TH>Profil Adı</TH>
                  <TH>Prompt</TH>
                  <TH>Bağlantı</TH>
                  <TH>Model</TH>
                  <TH>İstek</TH>
                  <TH>Durum</TH>
                </TR>
              </THead>
              <tbody>
                {items.map((x) => (
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
                    <TD>{x.promptName}</TD>
                    <TD>{x.aiProvider}</TD>
                    <TD>{x.modelName}</TD>
                    <TD>{x.requestedCount}</TD>
                    <TD>{x.status}</TD>
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
                {selectedId
                  ? `Düzenle #${selectedId}`
                  : "Yeni Topic Üretim Profili"}
              </div>
            </CardHeader>

            <CardBody className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {detailLoading ? (
                <div className="p-3 text-sm text-neutral-500">Yükleniyor…</div>
              ) : (
                <div className="flex flex-col gap-4 flex-1">
                  <Field label="Profil Adı">
                    <Input
                      value={form.profileName}
                      onChange={(e) =>
                        setForm({ ...form, profileName: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Prompt">
                    <SelectBox
                      value={form.promptId.toString()}
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
                      value={form.aiConnectionId.toString()}
                      onChange={(v) =>
                        setForm({ ...form, aiConnectionId: Number(v) })
                      }
                      options={connections.map((c) => ({
                        value: c.id.toString(),
                        label: `${c.name} (${c.provider})`,
                      }))}
                    />
                  </Field>

                  <Field label="Model Adı">
                    <Input
                      value={form.modelName}
                      onChange={(e) =>
                        setForm({ ...form, modelName: e.target.value })
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

                  <Field label="Durum">
                    <SelectBox
                      value={form.status ?? "Pending"}
                      onChange={(v) => setForm({ ...form, status: v })}
                      options={STATUSES}
                    />
                  </Field>

                  <Field
                    label="Ham Yanıt (JSON)"
                    className="flex-1 flex flex-col"
                  >
                    <Textarea
                      className="flex-1 font-mono text-sm border border-neutral-300 rounded-xl bg-neutral-50 p-2 resize-none"
                      value={form.rawResponseJson ?? "{}"}
                      onChange={(e) =>
                        setForm({ ...form, rawResponseJson: e.target.value })
                      }
                      placeholder='{ "topics": [...] }'
                    />
                  </Field>
                </div>
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
