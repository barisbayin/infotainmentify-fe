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
  Badge,
} from "../components/ui-kit";
import { useConfirm } from "../components/confirm";
import toast from "react-hot-toast";
import SelectBox from "../components/SelectBox";
import { SOCIAL_CHANNEL_OPTIONS } from "../constants/socialOptions";
import {
  socialChannelsApi,
  type UserSocialChannelDetailDto,
  type UserSocialChannelListDto,
  type SocialChannelType,
} from "../api/socialChannels";
import { generateCodeChallenge, generateCodeVerifier } from "../utils/oauth";

// --------------------------------------------------
// Boş DTO
// --------------------------------------------------
const EMPTY: Omit<UserSocialChannelDetailDto, "id"> = {
  channelType: "YouTube",
  channelName: "",
  channelHandle: "",
  channelUrl: "",
  platformChannelId: "",
  tokens: {},
  tokenExpiresAt: null,
  scopes: "",
};

// --------------------------------------------------
// Component
// --------------------------------------------------
export default function SocialChannelsPage() {
  const [items, setItems] = useState<UserSocialChannelListDto[]>([]);
  const [form, setForm] =
    useState<Omit<UserSocialChannelDetailDto, "id">>(EMPTY);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const confirm = useConfirm();

  // ----------------------- Load -----------------------
  async function load() {
    setLoading(true);
    try {
      const list = await socialChannelsApi.list();
      setItems(list);
    } catch {
      toast.error("Kanal listesi yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // ----------------------- Row Click -----------------------
  async function onRowClick(item: UserSocialChannelListDto) {
    setSelectedId(item.id);
    setDetailLoading(true);
    try {
      const dto = await socialChannelsApi.get(item.id);
      setForm({
        channelType: dto.channelType,
        channelName: dto.channelName ?? "",
        channelHandle: dto.channelHandle ?? "",
        channelUrl: dto.channelUrl ?? "",
        platformChannelId: dto.platformChannelId ?? "",
        tokens: dto.tokens ?? {},
        tokenExpiresAt: dto.tokenExpiresAt ?? null,
        scopes: dto.scopes ?? "",
      });
    } catch {
      toast.error("Kanal detayı yüklenemedi");
    } finally {
      setDetailLoading(false);
    }
  }

  // ----------------------- Reset -----------------------
  function resetForm() {
    setSelectedId(null);
    setForm(EMPTY);
  }

  // ----------------------- Save -----------------------
  async function onSave() {
    const isUpdate = selectedId != null;

    const opPromise: Promise<void> = isUpdate
      ? socialChannelsApi.update(selectedId!, form)
      : socialChannelsApi.create(form).then(() => undefined);

    try {
      await toast.promise(opPromise, {
        loading: "Kaydediliyor…",
        success: isUpdate ? "Kanal güncellendi" : "Yeni kanal eklendi",
        error: "Kayıt başarısız",
      });
      resetForm();
      await load();
    } catch {
      toast.error("Kaydetme başarısız");
    }
  }

  // ----------------------- Delete -----------------------
  async function onDelete() {
    if (!selectedId) return;
    const ok = await confirm({
      title: "Kanalı silinsin mi?",
      message: (
        <>
          <b>#{selectedId}</b> kalıcı olarak silinecek. Bu işlem geri alınamaz.
        </>
      ),
      confirmText: "Sil",
      cancelText: "İptal",
      tone: "danger",
    });
    if (!ok) return;

    try {
      await socialChannelsApi.delete(selectedId);
      toast.success("Kanal silindi");
      resetForm();
      await load();
    } catch {
      toast.error("Silme başarısız");
    }
  }

  const refreshToken = form.tokens?.refresh_token;

  const isConnected =
    refreshToken !== undefined &&
    refreshToken !== null &&
    refreshToken !== "" &&
    refreshToken.trim().length > 3;

  async function startYouTubeOAuth() {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);

    // LocalStorage’da tutalım
    localStorage.setItem("yt_pkce_verifier", verifier);

    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      redirect_uri: "http://localhost:5173/oauth/youtube/callback",
      response_type: "code",
      access_type: "offline",
      include_granted_scopes: "true",
      scope: "openid https://www.googleapis.com/auth/youtube.upload",
      prompt: "consent",
      code_challenge: challenge,
      code_challenge_method: "S256",
    });

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  // ----------------------- Render -----------------------
  return (
    <Page>
      <div className="grid grid-cols-12 gap-4 h-full">
        {/* SOL — Liste */}
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
                  <TH>Platform</TH>
                  <TH>Kanal Adı</TH>
                  <TH>URL</TH>
                </TR>
              </THead>
              <tbody>
                {items.map((x) => {
                  const selected = selectedId === x.id;
                  return (
                    <TR
                      key={x.id}
                      onClick={() => onRowClick(x)}
                      className={`cursor-pointer border-b border-neutral-100 hover:bg-neutral-50 ${
                        selected ? "bg-neutral-100" : ""
                      }`}
                    >
                      <TD>#{x.id}</TD>
                      <TD>
                        <Badge tone="neutral">{x.channelType}</Badge>
                      </TD>
                      <TD>{x.channelName}</TD>
                      <TD className="text-blue-600 truncate max-w-[180px]">
                        {x.channelUrl}
                      </TD>
                    </TR>
                  );
                })}
              </tbody>
            </Table>
          </Card>
        </section>

        {/* SAĞ — Detay */}
        <section className="col-span-12 xl:col-span-5 flex flex-col min-h-0">
          <Card className="flex-1 min-h-0 flex flex-col">
            <CardHeader>
              <div className="text-lg font-semibold text-neutral-800">
                {selectedId
                  ? `Kanal Düzenle #${selectedId}`
                  : "Yeni Sosyal Medya Kanalı"}
              </div>
            </CardHeader>

            <CardBody className="space-y-3 flex-1 min-h-0 overflow-auto pb-3">
              {detailLoading ? (
                <div className="p-3 text-sm text-neutral-500">Yükleniyor…</div>
              ) : (
                <>
                  <SelectBox
                    label="Platform"
                    value={form.channelType}
                    onChange={(v) =>
                      setForm({ ...form, channelType: v as SocialChannelType })
                    }
                    options={SOCIAL_CHANNEL_OPTIONS}
                  />

                  <Field label="Kanal Adı">
                    <Input
                      value={form.channelName ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, channelName: e.target.value })
                      }
                    />
                  </Field>

                  <Field label="Kullanıcı Adı (Handle)">
                    <Input
                      value={form.channelHandle ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, channelHandle: e.target.value })
                      }
                    />
                  </Field>

                  <Field label="Kanal URL’si">
                    <Input
                      value={form.channelUrl ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, channelUrl: e.target.value })
                      }
                    />
                  </Field>

                  <Field label="Platform Kanal ID">
                    <Input
                      value={form.platformChannelId ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, platformChannelId: e.target.value })
                      }
                    />
                  </Field>

                  {form.channelType === "YouTube" && (
                    <div className="flex gap-3">
                      {!localStorage.getItem("yt_refresh_token") ? (
                        <Button variant="primary" onClick={startYouTubeOAuth}>
                          🎥 YouTube Bağla
                        </Button>
                      ) : (
                        <Button variant="primary" disabled>
                          ✔ Bağlı
                        </Button>
                      )}
                    </div>
                  )}

                  <Field label="Token Bilgileri (JSON)">
                    <Textarea
                      rows={10}
                      className="min-h-[220px]"
                      value={JSON.stringify(form.tokens ?? {}, null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          setForm({ ...form, tokens: parsed });
                        } catch {
                          toast.error("JSON formatı hatalı");
                        }
                      }}
                    />
                  </Field>

                  <Field label="İzinler (Scopes)">
                    <Textarea
                      rows={3}
                      value={form.scopes ?? ""}
                      onChange={(e) =>
                        setForm({ ...form, scopes: e.target.value })
                      }
                    />
                  </Field>
                </>
              )}
            </CardBody>

            <CardFooter className="shrink-0 sticky bottom-0 bg-white border-t">
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
