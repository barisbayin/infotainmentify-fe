import { useEffect, useState } from "react";
import {
  aiConnectionsApi,
  AI_PROVIDERS,
  type UserAiConnectionListDto,
  type SaveUserAiConnectionDto,
} from "../api/aiConnections";
import { HttpError } from "../api/http";
import toast from "react-hot-toast";
import {
  Page,
  Card,
  Button,
  Input,
  Label,
  Badge,
  Table,
  THead,
  TR,
  TH,
  TD,
  Modal,
  Select,
  JsonInput,
} from "../components/ui-kit";
import {
  Plus,
  Trash2,
  Save,
  RefreshCw,
  Key,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

const EMPTY_FORM: SaveUserAiConnectionDto = {
  name: "",
  provider: "OpenAI",
  apiKey: "",
  extraId: "",
};

type GoogleVertexAuthMode = "adc" | "json";

const GOOGLE_VERTEX_ADC_MARKER = "ADC";

function isGoogleVertexAdcMarker(value?: string) {
  const normalized = value?.trim().toLowerCase();
  return (
    normalized === "adc" ||
    normalized === "__adc__" ||
    normalized === "applicationdefaultcredentials" ||
    normalized === "applicationdefault"
  );
}

function inferGoogleVertexAuthMode(apiKey?: string): GoogleVertexAuthMode {
  const trimmed = apiKey?.trim();
  if (!trimmed || isGoogleVertexAdcMarker(trimmed)) return "adc";
  return trimmed.startsWith("{") ? "json" : "adc";
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof HttpError)) return fallback;

  const errors = error.detail?.errors;
  if (errors && typeof errors === "object") {
    const first = Object.values(errors).flat().find(Boolean);
    if (typeof first === "string") return first;
  }

  return error.detail?.message || error.detail?.title || error.message || fallback;
}

export default function AiIntegrationsPage() {
  const [items, setItems] = useState<UserAiConnectionListDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form, setForm] = useState<SaveUserAiConnectionDto>(EMPTY_FORM);
  const [googleVertexAuthMode, setGoogleVertexAuthMode] =
    useState<GoogleVertexAuthMode>("adc");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const loadList = async () => {
    setLoading(true);
    try {
      const data = await aiConnectionsApi.list();
      setItems(data);
    } catch {
      toast.error("Baglantilar yuklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  const handleSelect = async (id: number) => {
    if (id === selectedId) return;

    setSelectedId(id);
    setDetailLoading(true);
    try {
      const data = await aiConnectionsApi.get(id);
      const apiKey = data.maskedApiKey || "";
      const authMode =
        data.provider === "GoogleVertex"
          ? inferGoogleVertexAuthMode(apiKey)
          : "adc";

      setGoogleVertexAuthMode(authMode);
      setForm({
        name: data.name,
        provider: data.provider,
        apiKey:
          data.provider === "GoogleVertex" && authMode === "adc"
            ? GOOGLE_VERTEX_ADC_MARKER
            : apiKey,
        extraId: data.extraId ?? "",
      });
    } catch {
      toast.error("Detay yuklenemedi.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleNew = () => {
    setSelectedId(null);
    setGoogleVertexAuthMode("adc");
    setForm(EMPTY_FORM);
  };

  const handleProviderChange = (provider: string) => {
    if (provider === "GoogleVertex") {
      const mode = inferGoogleVertexAuthMode(form.apiKey);
      setGoogleVertexAuthMode(mode);
      setForm({
        ...form,
        provider,
        apiKey: mode === "adc" ? GOOGLE_VERTEX_ADC_MARKER : form.apiKey,
      });
      return;
    }

    setForm({
      ...form,
      provider,
      apiKey:
        form.provider === "GoogleVertex" && isGoogleVertexAdcMarker(form.apiKey)
          ? ""
          : form.apiKey,
    });
  };

  const handleGoogleVertexAuthModeChange = (mode: GoogleVertexAuthMode) => {
    setGoogleVertexAuthMode(mode);
    setForm({
      ...form,
      apiKey:
        mode === "adc"
          ? GOOGLE_VERTEX_ADC_MARKER
          : isGoogleVertexAdcMarker(form.apiKey)
            ? ""
            : form.apiKey,
    });
  };

  const normalizeSavePayload = (): SaveUserAiConnectionDto => ({
    ...form,
    name: form.name.trim(),
    apiKey:
      form.provider === "GoogleVertex" && googleVertexAuthMode === "adc"
        ? GOOGLE_VERTEX_ADC_MARKER
        : form.apiKey.trim(),
    extraId: form.extraId?.trim() || undefined,
  });

  const handleSave = async () => {
    const payload = normalizeSavePayload();

    if (!payload.name) {
      toast.error("Baglanti adi zorunludur.");
      return;
    }

    if (
      payload.provider === "GoogleVertex" &&
      googleVertexAuthMode === "adc" &&
      !payload.extraId
    ) {
      toast.error("Google Vertex ADC icin Project ID zorunludur.");
      return;
    }

    if (!selectedId && !payload.apiKey.trim()) {
      toast.error("API anahtari zorunludur.");
      return;
    }

    setDetailLoading(true);
    try {
      if (selectedId) {
        await aiConnectionsApi.update(selectedId, payload);
        toast.success("Guncellendi.");
      } else {
        await aiConnectionsApi.create(payload);
        toast.success("Baglanti olusturuldu.");
        handleNew();
      }
      loadList();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Kaydedilemedi. Girdileri kontrol edin."));
    } finally {
      setDetailLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedId) return;
    setDetailLoading(true);
    try {
      await aiConnectionsApi.delete(selectedId);
      toast.success("Silindi.");
      setIsDeleteModalOpen(false);
      handleNew();
      loadList();
    } catch {
      toast.error("Silme basarisiz.");
    } finally {
      setDetailLoading(false);
    }
  };

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case "OpenAI":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "GoogleVertex":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "ElevenLabs":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      default:
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  const googleVertexModeButtonClass = (mode: GoogleVertexAuthMode) =>
    `text-left rounded-xl border p-3 transition-all ${
      googleVertexAuthMode === mode
        ? "border-blue-400/60 bg-blue-500/15 text-blue-100"
        : "border-zinc-700/80 bg-zinc-900/50 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
    }`;

  return (
    <Page>
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden pt-2">
        <div className="col-span-12 lg:col-span-8 flex flex-col h-full min-h-0 gap-4">
          <div className="flex justify-between items-center gap-2 shrink-0">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="text-indigo-500" /> AI Baglantilari
            </h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={loadList}
                className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800"
              >
                <RefreshCw
                  className={loading ? "animate-spin" : ""}
                  size={18}
                />
              </Button>
              <Button
                onClick={handleNew}
                className="bg-indigo-600 hover:bg-indigo-500 text-white border-none shadow-lg px-4"
              >
                <Plus size={18} className="mr-2" /> Yeni Baglanti
              </Button>
            </div>
          </div>

          <Card className="flex-1 min-h-0 p-0 overflow-hidden flex flex-col border-zinc-800 bg-zinc-900/40">
            <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              <Table className="border-none w-full">
                <THead>
                  <TR className="bg-zinc-900/80 sticky top-0 z-10 backdrop-blur-md">
                    <TH className="text-zinc-400 font-medium">Baglanti Adi</TH>
                    <TH className="text-zinc-400 font-medium">
                      Saglayici (Provider)
                    </TH>
                    <TH className="text-zinc-400 font-medium text-right">
                      Olusturulma
                    </TH>
                  </TR>
                </THead>
                <tbody>
                  {items.map((item) => (
                    <TR
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={`cursor-pointer transition-all border-b border-zinc-800/50 hover:bg-zinc-800/40 ${
                        selectedId === item.id
                          ? "bg-indigo-500/10 border-l-4 border-l-indigo-500"
                          : "border-l-4 border-l-transparent"
                      }`}
                    >
                      <TD className="font-medium text-zinc-200 py-3 flex items-center gap-2">
                        <Key size={14} className="text-zinc-500" /> {item.name}
                      </TD>
                      <TD className="py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getProviderBadge(
                            item.provider
                          )}`}
                        >
                          {item.provider}
                        </span>
                      </TD>
                      <TD className="text-right text-zinc-500 text-xs py-3 font-mono">
                        {new Date(item.createdAt).toLocaleDateString("tr-TR")}
                      </TD>
                    </TR>
                  ))}
                  {items.length === 0 && !loading && (
                    <TR>
                      <TD
                        colSpan={3}
                        className="text-center py-12 text-zinc-500"
                      >
                        Henuz baglanti eklenmemis.
                      </TD>
                    </TR>
                  )}
                </tbody>
              </Table>
            </div>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col h-full min-h-0">
          <Card className="h-full flex flex-col overflow-hidden border-zinc-800 bg-zinc-900/60 backdrop-blur-xl p-0">
            <div className="flex justify-between items-center p-4 border-b border-zinc-800/50 shrink-0 bg-zinc-900/30">
              <div className="flex items-center gap-2">
                <div
                  className={`w-1.5 h-6 rounded-full shadow-lg ${
                    selectedId ? "bg-indigo-500" : "bg-emerald-500"
                  }`}
                />
                <h2 className="text-md font-bold text-white tracking-tight">
                  {selectedId ? "Baglantiyi Duzenle" : "Yeni Baglanti"}
                </h2>
              </div>
              {selectedId && (
                <Badge variant="neutral" className="text-[10px]">
                  #{selectedId}
                </Badge>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-zinc-700">
              {detailLoading ? (
                <div className="flex h-full items-center justify-center text-zinc-500 gap-2">
                  <RefreshCw className="animate-spin" /> Yukleniyor...
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label className="mb-1.5">
                      Baglanti Adi (Takma Isim){" "}
                      <span className="text-indigo-400">*</span>
                    </Label>
                    <Input
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="Orn: Google Vertex ADC"
                      className="focus:border-indigo-500 bg-zinc-950/50 border-zinc-800 h-9 text-sm"
                    />
                  </div>

                  <div>
                    <Label className="mb-1.5">Saglayici (Provider)</Label>
                    <Select
                      value={form.provider}
                      onChange={handleProviderChange}
                      options={AI_PROVIDERS}
                      placeholder="Saglayici Seciniz"
                    />
                  </div>

                  {form.provider === "GoogleVertex" ? (
                    <div className="space-y-3">
                      <Label className="mb-1.5">
                        Google Vertex Kimlik Yontemi{" "}
                        <span className="text-indigo-400">*</span>
                      </Label>

                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleGoogleVertexAuthModeChange("adc")}
                          className={googleVertexModeButtonClass("adc")}
                        >
                          <span className="block text-xs font-semibold">
                            ADC
                          </span>
                          <span className="mt-1 block text-[10px] opacity-70">
                            gcloud ADC veya GOOGLE_APPLICATION_CREDENTIALS.
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleGoogleVertexAuthModeChange("json")}
                          className={googleVertexModeButtonClass("json")}
                        >
                          <span className="block text-xs font-semibold">
                            Service Account JSON
                          </span>
                          <span className="mt-1 block text-[10px] opacity-70">
                            JSON dosya icerigini elle sakla.
                          </span>
                        </button>
                      </div>

                      {googleVertexAuthMode === "adc" ? (
                        <div className="rounded-xl border border-blue-500/25 bg-blue-500/10 p-3">
                          <div className="flex items-center gap-2 text-sm font-semibold text-blue-200">
                            <ShieldCheck size={15} /> ADC aktif
                          </div>
                          <p className="mt-1 text-xs text-blue-100/70">
                            JSON yapistirmana gerek yok. Kayit sirasinda API
                            Key alani backend'e "ADC" olarak gonderilir.
                          </p>
                          <div className="mt-3 rounded-lg border border-blue-400/20 bg-zinc-950/50 px-3 py-2 font-mono text-xs text-blue-100">
                            {GOOGLE_VERTEX_ADC_MARKER}
                          </div>
                        </div>
                      ) : (
                        <JsonInput
                          value={form.apiKey}
                          onChange={(val) => setForm({ ...form, apiKey: val })}
                          placeholder={
                            '{\n  "type": "service_account",\n  "project_id": "..."\n}'
                          }
                          className="h-64"
                        />
                      )}

                      <p className="text-[10px] text-zinc-500 flex items-center gap-1.5">
                        <ShieldCheck size={12} className="text-emerald-500" />
                        Kaydedilen kimlik bilgisi veritabaninda sifrelenir.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Label className="mb-1.5">
                        API Anahtari{" "}
                        {!selectedId && (
                          <span className="text-indigo-400">*</span>
                        )}
                      </Label>
                      <Input
                        type="password"
                        value={form.apiKey}
                        onChange={(e) =>
                          setForm({ ...form, apiKey: e.target.value })
                        }
                        placeholder={
                          selectedId
                            ? "Degistirmek istemiyorsaniz bos birakin"
                            : "sk-..."
                        }
                        className="bg-zinc-950/50 border-zinc-800 h-9 text-sm font-mono placeholder:text-zinc-600"
                        autoComplete="off"
                      />
                      <p className="text-[10px] text-zinc-500 mt-1.5 flex items-center gap-1.5">
                        <ShieldCheck size={12} className="text-emerald-500" />
                        Bu anahtar veritabaninda sifrelenerek saklanir.
                      </p>
                    </div>
                  )}

                  {form.provider === "GoogleVertex" && (
                    <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
                      <Label className="mb-1.5 text-blue-400">
                        Project ID{" "}
                        {googleVertexAuthMode === "adc" && (
                          <span className="text-indigo-400">*</span>
                        )}
                      </Label>
                      <Input
                        value={form.extraId}
                        onChange={(e) =>
                          setForm({ ...form, extraId: e.target.value })
                        }
                        placeholder="my-google-project-id"
                        className="bg-zinc-900 border-blue-500/30 h-9 text-sm"
                      />
                      <p className="text-[10px] text-blue-400/70 mt-1 flex items-center gap-1">
                        <AlertCircle size={10} />
                        {googleVertexAuthMode === "adc"
                          ? "ADC modunda zorunlu. Backend bu project ile Vertex istegi atar."
                          : "JSON icinde project_id varsa bos birakabilirsin."}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/80 backdrop-blur flex items-center justify-end gap-2 shrink-0">
              <Button
                variant="ghost"
                onClick={handleNew}
                className="text-zinc-400 hover:text-white h-9 px-3 text-xs"
              >
                Vazgec
              </Button>
              {selectedId && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setIsDeleteModalOpen(true)}
                  isLoading={detailLoading}
                  className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20 h-9 px-3 text-xs"
                >
                  <Trash2 size={14} className="mr-1.5" /> Sil
                </Button>
              )}
              <Button
                variant="primary"
                onClick={handleSave}
                isLoading={detailLoading}
                className="shadow-lg shadow-indigo-600/20 bg-indigo-600 hover:bg-indigo-500 text-white border-none h-9 px-4 text-xs"
              >
                <Save size={14} className="mr-1.5" />{" "}
                {selectedId ? "Kaydet" : "Olustur"}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Baglanti Silinsin mi?"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-zinc-300">
            <b>"{form.name}"</b> baglantisi silinecek.
            <br />
            <br />
            <span className="text-red-400 text-xs">
              Uyari: Bu baglantiyi kullanan presetler calismayi durdurabilir.
            </span>
          </p>
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              Iptal
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              isLoading={detailLoading}
            >
              Evet, Sil
            </Button>
          </div>
        </div>
      </Modal>
    </Page>
  );
}
