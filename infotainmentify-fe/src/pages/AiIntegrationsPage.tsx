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
import {
  aiIntegrationsApi,
  type UserAiConnectionDetailDto,
} from "../api/aiIntegrations";
import toast from "react-hot-toast";
import { useConfirm } from "../components/confirm";
import SelectBox from "../components/SelectBox";

import { Brain, Sparkles, Network, Cloud, Atom, Circle } from "lucide-react";

const PROVIDERS = [
  {
    value: "OpenAI",
    label: "OpenAI (ChatGPT)",
    icon: Brain,
    color: "text-emerald-600",
  },
  {
    value: "GoogleVertex",
    label: "Google Vertex / Gemini",
    icon: Sparkles,
    color: "text-blue-600",
  },
  {
    value: "DeepSeek",
    label: "DeepSeek",
    icon: Network,
    color: "text-indigo-500",
  },
  {
    value: "AzureOpenAI",
    label: "Azure OpenAI",
    icon: Cloud,
    color: "text-sky-600",
  },
  {
    value: "Anthropic",
    label: "Anthropic (Claude)",
    icon: Atom,
    color: "text-orange-500",
  },
  {
    value: "Custom",
    label: "Özel / Diğer",
    icon: Circle,
    color: "text-neutral-500",
  },
];
const EMPTY: Omit<UserAiConnectionDetailDto, "id"> = {
  name: "",
  provider: "OpenAI",
  textModel: "",
  imageModel: "",
  videoModel: "",
  temperature: 0.7,
  credentials: {},
};

export default function AiIntegrationsPage() {
  const [items, setItems] = useState<UserAiConnectionDetailDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] =
    useState<Omit<UserAiConnectionDetailDto, "id">>(EMPTY);
  const confirm = useConfirm();

  async function load() {
    setLoading(true);
    try {
      const data = await aiIntegrationsApi.list();
      setItems(data);
    } catch {
      toast.error("Liste yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onRowClick(item: UserAiConnectionDetailDto) {
    setSelectedId(item.id);
    setDetailLoading(true);
    try {
      const dto = await aiIntegrationsApi.get(item.id);
      setForm({
        name: dto.name,
        provider: dto.provider,
        textModel: dto.textModel,
        imageModel: dto.imageModel,
        videoModel: dto.videoModel,
        temperature: dto.temperature,
        credentials: dto.credentials ?? {},
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
    if (!form.name.trim() || !form.provider.trim()) {
      toast.error("Ad ve sağlayıcı zorunludur");
      return;
    }

    const isUpdate = selectedId != null;
    const opPromise: Promise<void> = isUpdate
      ? aiIntegrationsApi.update(selectedId!, form)
      : aiIntegrationsApi.create(form).then(() => undefined);

    try {
      await toast.promise(opPromise, {
        loading: "Kaydediliyor…",
        success: isUpdate ? `#${selectedId} güncellendi` : "Yeni kayıt eklendi",
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
      await aiIntegrationsApi.delete(selectedId);
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
                  <TH>Ad</TH>
                  <TH>Sağlayıcı</TH>
                  <TH>Metin Modeli</TH>
                  <TH>Görsel Modeli</TH>
                  <TH>Video Modeli</TH>
                  <TH>Temperature</TH>
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
                    <TD className="font-medium">{x.name}</TD>
                    <TD>{x.provider}</TD>
                    <TD>{x.textModel}</TD>
                    <TD>{x.imageModel}</TD>
                    <TD>{x.videoModel}</TD>
                    <TD>{x.temperature}</TD>
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
                {selectedId ? `Düzenle #${selectedId}` : "Yeni AI Entegrasyonu"}
              </div>
            </CardHeader>

            <CardBody className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {detailLoading ? (
                <div className="p-3 text-sm text-neutral-500">Yükleniyor…</div>
              ) : (
                <div className="flex flex-col gap-4 flex-1">
                  {/* Ad */}
                  <Field label="Ad">
                    <Input
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      className="rounded-xl border-neutral-300 focus:ring-2 focus:ring-neutral-300"
                    />
                  </Field>

                  {/* Sağlayıcı */}
                  <Field label="Sağlayıcı">
                    <SelectBox
                      value={form.provider}
                      onChange={(v) => setForm({ ...form, provider: v })}
                      options={PROVIDERS}
                    />
                  </Field>
                  {/* textModel */}
                  <Field label="Metin Modeli">
                    <Input
                      value={form.textModel}
                      onChange={(e) =>
                        setForm({ ...form, textModel: e.target.value })
                      }
                      className="rounded-xl border-neutral-300 focus:ring-2 focus:ring-neutral-300"
                    />
                  </Field>

                  {/* Görsel Modeli */}
                  <Field label="Görsel Modeli">
                    <Input
                      value={form.imageModel}
                      onChange={(e) =>
                        setForm({ ...form, imageModel: e.target.value })
                      }
                      className="rounded-xl border-neutral-300 focus:ring-2 focus:ring-neutral-300"
                    />
                  </Field>
                  {/* Video Modeli */}
                  <Field label="Video Modeli">
                    <Input
                      value={form.videoModel}
                      onChange={(e) =>
                        setForm({ ...form, videoModel: e.target.value })
                      }
                      className="rounded-xl border-neutral-300 focus:ring-2 focus:ring-neutral-300"
                    />
                  </Field>
                  {/* temperature */}
                  <Field label="Temperature">
                    <Input
                      type="number"
                      value={form.temperature}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          temperature: Number(e.target.value),
                        })
                      }
                      className="rounded-xl border-neutral-300 focus:ring-2 focus:ring-neutral-300"
                    />
                  </Field>

                  {/* JSON */}
                  <Field
                    label="Kimlik Bilgileri (JSON)"
                    className="flex-1 flex flex-col"
                  >
                    <Textarea
                      className="flex-1 rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 
                   font-mono text-sm resize-none overflow-auto focus:outline-none 
                   focus:ring-2 focus:ring-neutral-300 transition-all"
                      placeholder='{ "apiKey": "sk-..." }'
                      value={JSON.stringify(form.credentials ?? {}, null, 2)}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        if (!val) {
                          setForm({ ...form, credentials: {} });
                          return;
                        }
                        try {
                          const parsed = JSON.parse(val);
                          if (
                            typeof parsed === "object" &&
                            !Array.isArray(parsed)
                          ) {
                            setForm({ ...form, credentials: parsed });
                          }
                        } catch {
                          // yazarken hata gösterme
                        }
                      }}
                      onBlur={(e) => {
                        try {
                          JSON.parse(e.target.value);
                        } catch {
                          toast.error("JSON formatı hatalı, düzeltin.");
                        }
                      }}
                    />
                  </Field>
                </div>
              )}
            </CardBody>

            <CardFooter className="shrink-0 sticky bottom-0">
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
