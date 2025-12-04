import { useEffect, useState } from "react";
import {
  aiConnectionsApi,
  AI_PROVIDERS,
  type UserAiConnectionListDto,
  type SaveUserAiConnectionDto,
} from "../api/aiConnections";
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

// Varsayılan Form
const EMPTY_FORM: SaveUserAiConnectionDto = {
  name: "",
  provider: "OpenAI", // Default seçim
  apiKey: "",
  extraId: "",
};

export default function AiIntegrationsPage() {
  // --- STATE ---
  const [items, setItems] = useState<UserAiConnectionListDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form, setForm] = useState<SaveUserAiConnectionDto>(EMPTY_FORM);

  // Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // --- ACTIONS ---
  const loadList = async () => {
    setLoading(true);
    try {
      const data = await aiConnectionsApi.list();
      setItems(data);
    } catch {
      toast.error("Bağlantılar yüklenemedi");
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

      setForm({
        name: data.name,
        provider: data.provider,

        // 🔥 GÜNCELLEME: Backend'den gelen (artık şifresi çözülmüş) key'i buraya basıyoruz.
        // Eskiden: apiKey: "" yapıyorduk.
        apiKey: data.maskedApiKey || "",

        extraId: data.extraId ?? "",
      });
    } catch {
      toast.error("Detay yüklenemedi.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleNew = () => {
    setSelectedId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Bağlantı adı zorunludur.");
      return;
    }
    // Yeni kayıtta API Key şart, güncellemede opsiyonel
    if (!selectedId && !form.apiKey.trim()) {
      toast.error("API Anahtarı zorunludur.");
      return;
    }

    setDetailLoading(true);
    try {
      if (selectedId) {
        await aiConnectionsApi.update(selectedId, form);
        toast.success("Güncellendi.");
      } else {
        await aiConnectionsApi.create(form);
        toast.success("Bağlantı oluşturuldu.");
        handleNew();
      }
      loadList();
    } catch (err: any) {
      // Backend'den gelen validasyon mesajını göster (örn: "sk- ile başlamalı")
      toast.error("Kaydedilemedi. Girdileri kontrol edin.");
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
      toast.error("Silme başarısız.");
    } finally {
      setDetailLoading(false);
    }
  };

  // Provider'a göre renk
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

  return (
    <Page>
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden pt-2">
        {/* === SOL: LİSTE (8 BİRİM) === */}
        <div className="col-span-12 lg:col-span-8 flex flex-col h-full min-h-0 gap-4">
          <div className="flex justify-between items-center gap-2 shrink-0">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="text-indigo-500" /> AI Bağlantıları
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
                <Plus size={18} className="mr-2" /> Yeni Bağlantı
              </Button>
            </div>
          </div>

          <Card className="flex-1 min-h-0 p-0 overflow-hidden flex flex-col border-zinc-800 bg-zinc-900/40">
            <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              <Table className="border-none w-full">
                <THead>
                  <TR className="bg-zinc-900/80 sticky top-0 z-10 backdrop-blur-md">
                    <TH className="text-zinc-400 font-medium">Bağlantı Adı</TH>
                    <TH className="text-zinc-400 font-medium">
                      Sağlayıcı (Provider)
                    </TH>
                    <TH className="text-zinc-400 font-medium text-right">
                      Oluşturulma
                    </TH>
                  </TR>
                </THead>
                <tbody>
                  {items.map((item) => (
                    <TR
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={`cursor-pointer transition-all border-b border-zinc-800/50 hover:bg-zinc-800/40 
                        ${
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
                        Henüz bağlantı eklenmemiş.
                      </TD>
                    </TR>
                  )}
                </tbody>
              </Table>
            </div>
          </Card>
        </div>

        {/* === SAĞ: FORM (4 BİRİM) === */}
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
                  {selectedId ? "Bağlantıyı Düzenle" : "Yeni Bağlantı"}
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
                  <RefreshCw className="animate-spin" /> Yükleniyor...
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-1.5">
                        Bağlantı Adı (Takma İsim){" "}
                        <span className="text-indigo-400">*</span>
                      </Label>
                      <Input
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        placeholder="Örn: Şahsi OpenAI Hesabım"
                        className="focus:border-indigo-500 bg-zinc-950/50 border-zinc-800 h-9 text-sm"
                      />
                    </div>

                    {/* PROVIDER ALANI (GÜNCEL) */}
                    <div>
                      <Label className="mb-1.5">Sağlayıcı (Provider)</Label>
                      <Select
                        value={form.provider}
                        onChange={(val) => setForm({ ...form, provider: val })}
                        options={AI_PROVIDERS} // Serviste tanımladığımız liste
                        placeholder="Sağlayıcı Seçiniz"
                      />
                    </div>

                    {/* API KEY / JSON ALANI */}
                    <div>
                      <Label className="mb-1.5">
                        {form.provider === "GoogleVertex"
                          ? "Service Account JSON"
                          : "API Anahtarı"}
                        {!selectedId && (
                          <span className="text-indigo-400">*</span>
                        )}
                      </Label>

                      {form.provider === "GoogleVertex" ? (
                        // 🔥 DÜZELTME: className="h-64" ekledik. Artık kutunun boyu sabit olacak.
                        <JsonInput
                          value={form.apiKey}
                          onChange={(val) => setForm({ ...form, apiKey: val })}
                          placeholder={
                            '{\n  "type": "service_account",\n  "project_id": "..."\n}'
                          }
                          className="h-64"
                        />
                      ) : (
                        // Standart Password Input
                        <Input
                          type="password"
                          value={form.apiKey}
                          onChange={(e) =>
                            setForm({ ...form, apiKey: e.target.value })
                          }
                          placeholder={
                            selectedId
                              ? "Değiştirmek istemiyorsanız boş bırakın"
                              : "sk-..."
                          }
                          className="bg-zinc-950/50 border-zinc-800 h-9 text-sm font-mono placeholder:text-zinc-600"
                          autoComplete="off"
                        />
                      )}

                      {form.provider !== "GoogleVertex" && (
                        <p className="text-[10px] text-zinc-500 mt-1.5 flex items-center gap-1.5">
                          <ShieldCheck size={12} className="text-emerald-500" />
                          Bu anahtar veritabanında AES-256 ile şifrelenerek
                          saklanır.
                        </p>
                      )}
                    </div>

                    {/* Google Vertex seçiliyse Extra ID göster */}
                    {form.provider === "GoogleVertex" && (
                      <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
                        <Label className="mb-1.5 text-blue-400">
                          Project ID (Opsiyonel)
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
                          <AlertCircle size={10} /> JSON içinde varsa otomatik
                          algılanır.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/80 backdrop-blur flex items-center justify-end gap-2 shrink-0">
              <Button
                variant="ghost"
                onClick={handleNew}
                className="text-zinc-400 hover:text-white h-9 px-3 text-xs"
              >
                Vazgeç
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
                {selectedId ? "Kaydet" : "Oluştur"}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Silme Modalı */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Bağlantı Silinsin mi?"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-zinc-300">
            <b>"{form.name}"</b> bağlantısı silinecek.
            <br />
            <br />
            <span className="text-red-400 text-xs">
              ⚠️ Uyarı: Bu bağlantıyı kullanan Preset'ler çalışmayı
              durdurabilir.
            </span>
          </p>
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              İptal
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
