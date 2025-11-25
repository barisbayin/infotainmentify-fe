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
} from "../components/ui-kit";

import {
  aiIntegrationsApi,
  type UserAiConnectionDetailDto,
} from "../api/aiIntegrations";

import toast from "react-hot-toast";
import { useConfirm } from "../components/confirm";
import SelectBox from "../components/SelectBox";
import KeyValueEditor from "../components/KeyValueEditor";

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

const EMPTY_FORM = {
  name: "",
  provider: "OpenAI",
  textModel: "",
  imageModel: "",
  videoModel: "",
  temperature: 0.7,
};

export default function AiIntegrationsPage() {
  const [items, setItems] = useState<UserAiConnectionDetailDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // FORM STATE (credentials hariç)
  const [form, setForm] =
    useState<Omit<UserAiConnectionDetailDto, "id" | "credentials">>(EMPTY_FORM);

  // CREDENTIALS AYRI STATE (hayat kurtaran değişiklik)
  const [creds, setCreds] = useState<Record<string, string>>({ "": "" });

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const confirm = useConfirm();

  // ---------------- LOAD LIST -----------------
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

  // ---------------- ROW CLICK -----------------
  async function onRowClick(item: UserAiConnectionDetailDto) {
    setSelectedId(item.id);
    setDetailLoading(true);

    try {
      const dto = await aiIntegrationsApi.get(item.id);

      // FORM VERİLERİ
      setForm({
        name: dto.name,
        provider: dto.provider,
        textModel: dto.textModel,
        imageModel: dto.imageModel,
        videoModel: dto.videoModel,
        temperature: dto.temperature,
      });

      // CREDENTIALS VERİLERİ
      let parsed: Record<string, string> = {};
      try {
        if (typeof dto.credentials === "string") {
          parsed = JSON.parse(dto.credentials);
        } else {
          parsed = dto.credentials ?? {};
        }
      } catch {
        parsed = {};
      }

      if (!parsed || Object.keys(parsed).length === 0) {
        parsed = { "": "" };
      }

      setCreds(parsed);
    } catch {
      toast.error("Detay yüklenemedi");
    } finally {
      setDetailLoading(false);
    }
  }

  // ---------------- RESET FORM -----------------
  function resetForm() {
    setSelectedId(null);
    setForm(EMPTY_FORM);
    setCreds({ "": "" });
  }

  // ---------------- SAVE -----------------
  async function onSave() {
    if (!form.name.trim()) {
      toast.error("Ad zorunludur");
      return;
    }

    const payload: any = {
      ...form,
      credentials: JSON.stringify(creds),
    };

    const isUpdate = selectedId != null;

    const op = isUpdate
      ? aiIntegrationsApi.update(selectedId!, payload)
      : aiIntegrationsApi.create(payload);

    try {
      await toast.promise(op, {
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

  // ---------------- DELETE -----------------
  async function onDelete() {
    if (!selectedId) return;

    const ok = await confirm({
      title: "Silinsin mi?",
      message: `#${selectedId} silinecek.`,
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
      toast.error("Silinemedi");
    }
  }

  // ---------------- UI -----------------
  return (
    <Page>
      <div className="grid grid-cols-12 gap-4 h-full">
        {/* SOL LİSTE */}
        <section className="col-span-12 xl:col-span-7 flex flex-col min-h-0">
          <Toolbar>
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
                  <TH>Ad</TH>
                  <TH>Provider</TH>
                  <TH>Text</TH>
                  <TH>Image</TH>
                  <TH>Video</TH>
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
                    <TD>{x.name}</TD>
                    <TD>{x.provider}</TD>
                    <TD>{x.textModel}</TD>
                    <TD>{x.imageModel}</TD>
                    <TD>{x.videoModel}</TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </Card>
        </section>

        {/* SAĞ DETAY PANEL */}
        <section className="col-span-12 xl:col-span-5 flex flex-col min-h-0 overflow-hidden">
          <Card className="flex flex-col flex-1 overflow-hidden">
            <CardHeader>
              <div className="text-lg font-semibold">
                {selectedId ? `Düzenle #${selectedId}` : "Yeni AI Entegrasyonu"}
              </div>
            </CardHeader>

            <CardBody className="flex-1 overflow-hidden p-0">
              <div className="h-full overflow-y-auto px-4 py-3 space-y-4">
                {detailLoading ? (
                  <div className="p-3 text-sm text-neutral-500">
                    Yükleniyor…
                  </div>
                ) : (
                  <>
                    <Field label="Ad">
                      <Input
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                      />
                    </Field>

                    <Field label="Sağlayıcı">
                      <SelectBox
                        value={form.provider}
                        onChange={(v) => setForm({ ...form, provider: v })}
                        options={PROVIDERS}
                      />
                    </Field>

                    <Field label="Metin Modeli">
                      <Input
                        value={form.textModel}
                        onChange={(e) =>
                          setForm({ ...form, textModel: e.target.value })
                        }
                      />
                    </Field>

                    <Field label="Görsel Modeli">
                      <Input
                        value={form.imageModel}
                        onChange={(e) =>
                          setForm({ ...form, imageModel: e.target.value })
                        }
                      />
                    </Field>

                    <Field label="Video Modeli">
                      <Input
                        value={form.videoModel}
                        onChange={(e) =>
                          setForm({ ...form, videoModel: e.target.value })
                        }
                      />
                    </Field>

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
                      />
                    </Field>

                    <Field label="Kimlik Bilgileri (Credentials)">
                      <KeyValueEditor
                        value={creds}
                        onChange={(v) => setCreds(v)}
                      />
                    </Field>
                  </>
                )}
              </div>
            </CardBody>

            <CardFooter className="shrink-0 sticky bottom-0 bg-white border-t border-neutral-200 p-2 flex justify-end gap-2">
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
            </CardFooter>
          </Card>
        </section>
      </div>
    </Page>
  );
}
