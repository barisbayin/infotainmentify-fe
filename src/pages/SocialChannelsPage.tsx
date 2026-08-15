import { useEffect, useState } from "react";
import {
  socialChannelsApi,
  PLATFORMS,
  type SocialChannelListDto,
  type SaveSocialChannelDto,
} from "../api/socialChannels";
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
  Share2,
  Youtube,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  AlertTriangle,
  ShieldCheck,
  Copy,
} from "lucide-react";

const YOUTUBE_OAUTH_REDIRECT_URI =
  import.meta.env.VITE_YOUTUBE_OAUTH_REDIRECT_URI ||
  "http://localhost:5173/oauth/youtube/callback";

// Varsayılan Form
const EMPTY_FORM: SaveSocialChannelDto = {
  channelType: 1, // Default YouTube
  channelName: "",
  channelHandle: "",
  channelUrl: "",
  platformChannelId: "",
  rawTokensJson: "",
  scopes: "",
};

const readPendingYoutubeTokenJson = () => {
  try {
    const tokenJson = localStorage.getItem("yt_token_json");
    if (tokenJson?.trim()) return tokenJson;

    const refreshToken = localStorage.getItem("yt_refresh_token");
    const accessToken = localStorage.getItem("yt_access_token");
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
    if (!refreshToken && !accessToken) return "";

    return JSON.stringify(
      {
        access_token: accessToken || undefined,
        refresh_token: refreshToken || undefined,
        client_id: clientId || undefined,
      },
      null,
      2
    );
  } catch {
    return "";
  }
};

const clearPendingYoutubeTokenJson = () => {
  try {
    localStorage.removeItem("yt_token_json");
    localStorage.removeItem("yt_refresh_token");
    localStorage.removeItem("yt_access_token");
  } catch {
    // noop
  }
};

const readCredentialString = (source: any, keys: string[]) => {
  if (!source || typeof source !== "object") return "";
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

const validateYoutubeTokenJson = (raw: string, allowMergeWithSavedToken = false) => {
  try {
    const root = JSON.parse(raw);
    if (!root || typeof root !== "object" || Array.isArray(root)) {
      return "YouTube token JSON kok degeri object olmali.";
    }

    const oauthClient =
      root.installed && typeof root.installed === "object"
        ? root.installed
        : root.web && typeof root.web === "object"
          ? root.web
          : root;

    const refreshToken =
      readCredentialString(root, ["refresh_token", "refreshToken", "RefreshToken"]) ||
      readCredentialString(oauthClient, ["refresh_token", "refreshToken", "RefreshToken"]);
    const clientId =
      readCredentialString(root, ["client_id", "clientId", "ClientId"]) ||
      readCredentialString(oauthClient, ["client_id", "clientId", "ClientId"]);
    const clientSecret =
      readCredentialString(root, ["client_secret", "clientSecret", "ClientSecret"]) ||
      readCredentialString(oauthClient, ["client_secret", "clientSecret", "ClientSecret"]);

    if (!allowMergeWithSavedToken && !refreshToken) return "YouTube upload icin refresh_token zorunlu.";
    if (!allowMergeWithSavedToken && !clientId) return "YouTube upload icin client_id zorunlu.";
    if (!clientSecret) return "YouTube upload icin client_secret zorunlu.";
    return "";
  } catch (err: any) {
    return `Token JSON gecersiz: ${err?.message || "parse edilemedi"}`;
  }
};

export default function SocialChannelsPage() {
  // State
  const [items, setItems] = useState<SocialChannelListDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedHasTokens, setSelectedHasTokens] = useState(false);
  const [selectedHasRequiredScopes, setSelectedHasRequiredScopes] = useState(false);
  const [selectedRequiresReauthorization, setSelectedRequiresReauthorization] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [form, setForm] = useState<SaveSocialChannelDto>(EMPTY_FORM);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // --- ACTIONS ---
  const loadList = async () => {
    setLoading(true);
    try {
      const data = await socialChannelsApi.list();
      setItems(data);
    } catch {
      toast.error("Kanallar yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  useEffect(() => {
    const pendingTokenJson = readPendingYoutubeTokenJson();
    if (!pendingTokenJson) return;

    setForm((prev) => ({
      ...prev,
      channelType: 1,
      rawTokensJson: prev.rawTokensJson || pendingTokenJson,
    }));
  }, []);

  const handleSelect = async (id: number) => {
    if (id === selectedId) return;
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const data = await socialChannelsApi.get(id);

      // Platform Enum ID'sini bul (Backend string dönüyor "YouTube", biz ID'ye çeviriyoruz)
      const platformObj = PLATFORMS.find((p) => p.label === data.platform);
      setSelectedHasTokens(Boolean(data.hasTokens));
      setSelectedHasRequiredScopes(Boolean(data.hasRequiredScopes));
      setSelectedRequiresReauthorization(Boolean(data.requiresReauthorization));

      setForm({
        channelType: platformObj ? platformObj.id : 1,
        channelName: data.channelName,
        channelHandle: data.channelHandle ?? "",
        channelUrl: data.channelUrl ?? "",
        platformChannelId: data.platformChannelId ?? "",
        scopes: data.scopes ?? "",
        rawTokensJson: data.rawTokensJson ?? data.encryptedTokensJson ?? "", // Tokenları doldur
      });
    } catch {
      toast.error("Detay yüklenemedi.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleNew = () => {
    setSelectedId(null);
    setSelectedHasTokens(false);
    setSelectedHasRequiredScopes(false);
    setSelectedRequiresReauthorization(false);
    setForm({
      ...EMPTY_FORM,
      rawTokensJson: readPendingYoutubeTokenJson(),
    });
  };

  useEffect(() => {
    const connectedId = Number(sessionStorage.getItem("youtube_connected_channel_id") || 0);
    if (!connectedId || !items.some((item) => item.id === connectedId)) return;

    sessionStorage.removeItem("youtube_connected_channel_id");
    void handleSelect(connectedId);
    toast.success("YouTube upload yetkisi yenilendi.");
    window.history.replaceState({}, "", "/social-channels");
  }, [items]);

  const handleYouTubeReconnect = async () => {
    if (!selectedId) {
      toast.error("Once YouTube kanal kaydini olusturun veya secin.");
      return;
    }

    setOauthLoading(true);
    try {
      const result = await socialChannelsApi.startYouTubeOAuth(selectedId);
      window.location.assign(result.authorizationUrl);
    } catch (err: any) {
      toast.error(err?.message || "YouTube yetkilendirmesi baslatilamadi.");
      setOauthLoading(false);
    }
  };

  const handleCopyYouTubeRedirectUri = async () => {
    try {
      await navigator.clipboard.writeText(YOUTUBE_OAUTH_REDIRECT_URI);
      toast.success("Callback adresi kopyalandi.");
    } catch {
      toast.error("Callback adresi kopyalanamadi.");
    }
  };

  const handleSave = async () => {
    if (!form.channelName.trim()) {
      toast.error("Kanal adı zorunludur.");
      return;
    }

    if (form.channelType === 1 && form.rawTokensJson?.trim()) {
      const tokenError = validateYoutubeTokenJson(
        form.rawTokensJson.trim(),
        Boolean(selectedId && selectedHasTokens)
      );
      if (tokenError) {
        toast.error(tokenError);
        return;
      }
    }

    setDetailLoading(true);
    try {
      const payload: SaveSocialChannelDto = {
        ...form,
        rawTokensJson: form.rawTokensJson?.trim() ? form.rawTokensJson.trim() : undefined,
      };

      if (selectedId) {
        await socialChannelsApi.update(selectedId, payload);
        if (payload.rawTokensJson) clearPendingYoutubeTokenJson();
        setSelectedHasTokens(selectedHasTokens || Boolean(payload.rawTokensJson));
        setForm((prev) => ({ ...prev, rawTokensJson: "" }));
        toast.success("Güncellendi.");
      } else {
        await socialChannelsApi.create(payload);
        toast.success("Kanal eklendi.");
        clearPendingYoutubeTokenJson();
        handleNew();
      }
      loadList();
    } catch (err: any) {
      toast.error(err?.message || "Kaydedilemedi.");
    } finally {
      setDetailLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedId) return;
    setDetailLoading(true);
    try {
      await socialChannelsApi.delete(selectedId);
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

  // Helper: Platform İkonu
  const getPlatformIcon = (platformName: string) => {
    switch (platformName) {
      case "YouTube":
        return <Youtube size={16} />;
      case "Instagram":
        return <Instagram size={16} />;
      case "Facebook":
        return <Facebook size={16} />;
      case "Twitter":
        return <Twitter size={16} />;
      case "LinkedIn":
        return <Linkedin size={16} />;
      default:
        return <Share2 size={16} />;
    }
  };

  const getPlatformStyle = (platformName: string) => {
    return (
      PLATFORMS.find((p) => p.label === platformName)?.bg ||
      "bg-zinc-800 border-zinc-700"
    );
  };

  return (
    <Page>
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden pt-2">
        {/* === SOL: LİSTE (8 BİRİM) === */}
        <div className="col-span-12 lg:col-span-8 flex flex-col h-full min-h-0 gap-4">
          <div className="flex justify-between items-center gap-2 shrink-0">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Share2 className="text-indigo-500" /> Sosyal Hesaplar
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
                <Plus size={18} className="mr-2" /> Hesap Ekle
              </Button>
            </div>
          </div>

          <Card className="flex-1 min-h-0 p-0 overflow-hidden flex flex-col border-zinc-800 bg-zinc-900/40">
            <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              <Table className="border-none w-full">
                <THead>
                  <TR className="bg-zinc-900/80 sticky top-0 z-10 backdrop-blur-md">
                    <TH className="text-zinc-400 font-medium">Kanal Adı</TH>
                    <TH className="text-zinc-400 font-medium">Platform</TH>
                    <TH className="text-zinc-400 font-medium text-right">
                      Eklendiği Tarih
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
                      <TD className="font-medium text-zinc-200 py-3">
                        {item.channelName}
                      </TD>
                      <TD className="py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${getPlatformStyle(
                            item.platform
                          )} text-zinc-300`}
                        >
                          {getPlatformIcon(item.platform)} {item.platform}
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
                        Henüz sosyal hesap eklenmemiş.
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
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-zinc-800/50 shrink-0 bg-zinc-900/30">
              <div className="flex items-center gap-2">
                <div
                  className={`w-1.5 h-6 rounded-full shadow-lg ${
                    selectedId ? "bg-indigo-500" : "bg-emerald-500"
                  }`}
                />
                <h2 className="text-md font-bold text-white tracking-tight">
                  {selectedId ? "Hesap Ayarları" : "Yeni Hesap Bağla"}
                </h2>
              </div>
              {selectedId && (
                <Badge variant="neutral" className="text-[10px]">
                  #{selectedId}
                </Badge>
              )}
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-zinc-700">
              {detailLoading ? (
                <div className="flex h-full items-center justify-center text-zinc-500 gap-2">
                  <RefreshCw className="animate-spin" /> Yükleniyor...
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="space-y-4 flex-1 flex flex-col">
                    {/* Platform Select */}
                    <div>
                      <Label className="mb-1.5">Platform</Label>
                      <Select
                        value={form.channelType.toString()}
                        onChange={(val) =>
                          setForm({ ...form, channelType: parseInt(val) })
                        }
                        options={PLATFORMS.map((p) => ({
                          label: p.label,
                          value: p.id.toString(),
                        }))}
                        placeholder="Platform Seçiniz"
                      />
                    </div>

                    <div>
                      <Label className="mb-1.5">
                        Kanal Adı <span className="text-indigo-400">*</span>
                      </Label>
                      <Input
                        value={form.channelName}
                        onChange={(e) =>
                          setForm({ ...form, channelName: e.target.value })
                        }
                        placeholder="Örn: Gemini Türkiye"
                        className="bg-zinc-950/50 border-zinc-800 h-9 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1.5">Handle (@)</Label>
                        <Input
                          value={form.channelHandle || ""}
                          onChange={(e) =>
                            setForm({ ...form, channelHandle: e.target.value })
                          }
                          placeholder="@geminitr"
                          className="bg-zinc-950/50 border-zinc-800 h-9 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="mb-1.5">Platform ID</Label>
                        <Input
                          value={form.platformChannelId || ""}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              platformChannelId: e.target.value,
                            })
                          }
                          placeholder="UCx..."
                          className="bg-zinc-950/50 border-zinc-800 h-9 text-sm font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="mb-1.5">Kanal URL</Label>
                      <Input
                        value={form.channelUrl || ""}
                        onChange={(e) =>
                          setForm({ ...form, channelUrl: e.target.value })
                        }
                        placeholder="https://youtube.com/..."
                        className="bg-zinc-950/50 border-zinc-800 h-9 text-sm"
                      />
                    </div>

                    {form.channelType === 1 && (
                      <div
                        className={`rounded-lg border p-3 ${
                          selectedHasRequiredScopes && !selectedRequiresReauthorization
                            ? "border-emerald-500/25 bg-emerald-500/5"
                            : "border-amber-500/25 bg-amber-500/5"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 text-xs font-bold text-zinc-100">
                              <ShieldCheck
                                size={15}
                                className={selectedHasRequiredScopes ? "text-emerald-400" : "text-amber-400"}
                              />
                              YouTube upload yetkisi
                            </div>
                            <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
                              {selectedHasRequiredScopes && !selectedRequiresReauthorization
                                ? "Kanal video yukleme scope'una sahip."
                                : selectedId
                                  ? "Video yukleme yetkisi eksik veya dogrulanmamis. Google onayini yenileyin."
                                  : "Once kanal kaydini olusturun, sonra Google yetkisini baglayin."}
                            </p>
                          </div>
                          <Badge
                            variant={selectedHasRequiredScopes && !selectedRequiresReauthorization ? "success" : "warning"}
                            className="shrink-0 text-[10px]"
                          >
                            {selectedHasRequiredScopes && !selectedRequiresReauthorization ? "Hazir" : "Yetki gerekli"}
                          </Badge>
                        </div>
                        {form.scopes && (
                          <div className="mt-2 break-all rounded-md border border-white/5 bg-black/20 px-2 py-1.5 font-mono text-[9px] text-zinc-500">
                            {form.scopes}
                          </div>
                        )}
                        <div className="mt-2 rounded-md border border-white/5 bg-black/20 p-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[9px] font-semibold uppercase text-zinc-500">
                              Google Authorized Redirect URI
                            </span>
                            <button
                              type="button"
                              onClick={handleCopyYouTubeRedirectUri}
                              className="inline-flex h-6 w-6 items-center justify-center rounded border border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                              title="Callback adresini kopyala"
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                          <div className="mt-1 break-all font-mono text-[9px] text-zinc-400">
                            {YOUTUBE_OAUTH_REDIRECT_URI}
                          </div>
                          <p className="mt-1 text-[9px] leading-relaxed text-zinc-600">
                            Bu adres Google Cloud OAuth Client icinde birebir kayitli olmalidir.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={handleYouTubeReconnect}
                          isLoading={oauthLoading}
                          disabled={!selectedId || oauthLoading}
                          className="mt-3 w-full"
                        >
                          <Youtube size={14} className="mr-2" />
                          {selectedHasRequiredScopes ? "YouTube Yetkisini Yenile" : "YouTube'a Yetki Ver"}
                        </Button>
                      </div>
                    )}

                    {/* 🔥 JSON Token Input */}
                    <div className="flex-1 flex flex-col">
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <Label>OAuth Tokens (JSON)</Label>
                        <Badge
                          variant={form.rawTokensJson?.trim() || selectedHasTokens ? "success" : "warning"}
                          className="text-[10px]"
                        >
                          {form.rawTokensJson?.trim()
                            ? "Yeni JSON hazir"
                            : selectedHasTokens
                              ? "Token kayitli"
                              : "Token yok"}
                        </Badge>
                      </div>
                      <div className="flex-1 flex flex-col min-h-0">
                        <JsonInput
                          value={form.rawTokensJson || ""}
                          onChange={(val) =>
                            setForm({ ...form, rawTokensJson: val })
                          }
                          placeholder={
                            selectedId
                              ? "Tokenları güncellemek için yeni JSON yapıştırın..."
                              : '{\n  "access_token": "...",\n  "refresh_token": "...",\n  "client_id": "Google OAuth Client ID",\n  "client_secret": "Google OAuth Client Secret"\n}'
                          }
                          className="flex-1 min-h-[150px]"
                        />
                        <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
                          Yeni hesapta refresh_token, client_id ve client_secret gerekir. Mevcut token kayitliyken sadece client_secret ya da Google OAuth client JSON'u yapistirirsan sistem eski token ile birlestirir.
                        </p>
                      </div>

                    </div>
                  </div>
                </div>
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
        title="Hesap Silinsin mi?"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
            <AlertTriangle className="text-red-500 shrink-0" size={24} />
            <p className="text-sm text-zinc-300">
              <b>"{form.channelName}"</b> hesabı silinecek.
              <br />
              Otomatik yükleme (Upload) işlemleri duracaktır.
            </p>
          </div>
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
