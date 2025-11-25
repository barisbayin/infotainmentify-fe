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
  videoGenerationProfilesApi,
  type VideoGenerationProfileDetailDto,
  type VideoGenerationProfileListDto,
} from "../api/videoGenerationProfiles";

import { scriptGenerationProfilesApi } from "../api/scriptProfiles";
import { socialChannelsApi } from "../api/socialChannels";
import { renderProfilesApi } from "../api/renderProfiles";

// ------------------- Empty Form -------------------
const EMPTY: Omit<VideoGenerationProfileDetailDto, "id"> = {
  profileName: "",
  scriptGenerationProfileId: 0,
  autoVideoRenderProfileId: 0,
  socialChannelId: null,
  uploadAfterRender: true,
  generateThumbnail: true,
  titleTemplate: "",
  descriptionTemplate: "",
  isActive: true,
};

// --------------------------------------------------
export default function VideoGenerationProfilesPage() {
  const [items, setItems] = useState<VideoGenerationProfileListDto[]>([]);
  const [filtered, setFiltered] = useState<VideoGenerationProfileListDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] =
    useState<Omit<VideoGenerationProfileDetailDto, "id">>(EMPTY);

  const [renderProfiles, setRenderProfiles] = useState<
    { id: number; name: string }[]
  >([]);

  const [scriptProfiles, setScriptProfiles] = useState<
    { id: number; name: string }[]
  >([]);

  const [channels, setChannels] = useState<
    { id: number; name: string; platform: string }[]
  >([]);

  // Filters
  const [q, setQ] = useState("");

  const confirm = useConfirm();

  // -------------------- LOAD DATA --------------------
  async function load() {
    setLoading(true);
    try {
      const data = await videoGenerationProfilesApi.list();
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
      const [sp, sc, rp] = await Promise.all([
        scriptGenerationProfilesApi.list(),
        socialChannelsApi.list(),
        renderProfilesApi.list(),
      ]);

      setScriptProfiles(sp.map((x) => ({ id: x.id, name: x.profileName })));

      setChannels(
        sc.map((x) => ({
          id: x.id,
          name: x.channelName ?? `Kanal #${x.id}`,
          platform: x.channelType,
        }))
      );

      setRenderProfiles(rp.map((x) => ({ id: x.id, name: x.name })));
    } catch {
      toast.error("Kaynak listeleri yüklenemedi");
    }
  }

  useEffect(() => {
    load();
    loadSources();
  }, []);

  // -------------------- FILTER --------------------
  useEffect(() => {
    const f = items.filter((x) => {
      const qMatch =
        !q ||
        x.profileName.toLowerCase().includes(q.toLowerCase()) ||
        x.scriptGenerationProfileName.toLowerCase().includes(q.toLowerCase());
      return qMatch;
    });
    setFiltered(f);
  }, [q, items]);

  // -------------------- ROW CLICK --------------------
  async function onRowClick(item: VideoGenerationProfileListDto) {
    setSelectedId(item.id);
    setDetailLoading(true);

    try {
      const dto = await videoGenerationProfilesApi.get(item.id);
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
    if (!form.profileName.trim()) {
      toast.error("Profil adı zorunludur");
      return;
    }
    if (!form.scriptGenerationProfileId) {
      toast.error("Script Generation Profile zorunludur");
      return;
    }

    try {
      await toast.promise(
        videoGenerationProfilesApi.save({
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
      message: `#${selectedId} silinecek.`,
      confirmText: "Sil",
      cancelText: "İptal",
      tone: "danger",
    });
    if (!ok) return;

    try {
      await videoGenerationProfilesApi.delete(selectedId);
      toast.success("Silindi");
      resetForm();
      await load();
    } catch {
      toast.error("Silme başarısız");
    }
  }

  // -------------------- UI --------------------
  return (
    <Page>
      <div className="grid grid-cols-12 gap-4 h-full">
        {/* SOL TARAF - LİSTE */}
        <section className="col-span-12 xl:col-span-7 flex flex-col min-h-0">
          <Toolbar className="flex gap-2">
            <Input
              placeholder="Ara…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
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
                  <TH>Script Profile</TH>
                  <TH>Render Profile</TH>
                  <TH>Kanal</TH>
                  <TH>Aktif</TH>
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
                    <TD>{x.scriptGenerationProfileName}</TD>
                    <TD>{x.autoVideoRenderProfileName}</TD>
                    <TD>{x.socialChannelName ?? "—"}</TD>
                    <TD>{x.isActive ? "✓" : "—"}</TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </Card>
        </section>

        {/* SAĞ TARAF - DETAY FORM */}
        <section className="col-span-12 xl:col-span-5 flex flex-col min-h-0 overflow-hidden">
          <Card className="flex flex-col flex-1 overflow-hidden">
            <CardHeader>
              <div className="text-lg font-semibold">
                {selectedId
                  ? `Düzenle #${selectedId}`
                  : "Yeni Video Generation Profili"}
              </div>
            </CardHeader>

            <CardBody className="flex-1 overflow-hidden p-0">
              <div className="h-full overflow-y-auto px-4 py-3 space-y-3">
                {detailLoading ? (
                  <div className="p-3 text-sm text-neutral-500">
                    Yükleniyor…
                  </div>
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

                    <Field label="Script Generation Profile">
                      <SelectBox
                        value={form.scriptGenerationProfileId?.toString()}
                        onChange={(v) =>
                          setForm({
                            ...form,
                            scriptGenerationProfileId: Number(v),
                          })
                        }
                        options={scriptProfiles.map((x) => ({
                          value: x.id.toString(),
                          label: x.name,
                        }))}
                      />
                    </Field>

                    <Field label="Render Profile">
                      <SelectBox
                        value={form.autoVideoRenderProfileId?.toString()}
                        onChange={(v) =>
                          setForm({
                            ...form,
                            autoVideoRenderProfileId: Number(v),
                          })
                        }
                        options={renderProfiles.map((rp) => ({
                          value: rp.id.toString(),
                          label: rp.name,
                        }))}
                      />
                    </Field>

                    <Field label="Sosyal Kanal">
                      <SelectBox
                        value={form.socialChannelId?.toString() ?? ""}
                        onChange={(v) =>
                          setForm({
                            ...form,
                            socialChannelId: v ? Number(v) : null,
                          })
                        }
                        options={[
                          { value: "", label: "—" },
                          ...channels.map((c) => ({
                            value: c.id.toString(),
                            label: `${c.name} (${c.platform})`,
                          })),
                        ]}
                      />
                    </Field>

                    <Field label="Başlık Şablonu">
                      <Input
                        value={form.titleTemplate ?? ""}
                        onChange={(e) =>
                          setForm({ ...form, titleTemplate: e.target.value })
                        }
                      />
                    </Field>

                    <Field label="Açıklama Şablonu">
                      <Textarea
                        rows={4}
                        value={form.descriptionTemplate ?? ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            descriptionTemplate: e.target.value,
                          })
                        }
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-neutral-200">
                      <Switch
                        checked={form.uploadAfterRender}
                        onChange={(v) =>
                          setForm({ ...form, uploadAfterRender: v })
                        }
                        label="Render Sonrası Otomatik Upload"
                      />

                      <Switch
                        checked={form.generateThumbnail}
                        onChange={(v) =>
                          setForm({ ...form, generateThumbnail: v })
                        }
                        label="Thumbnail Üret"
                      />

                      <Switch
                        checked={form.isActive}
                        onChange={(v) => setForm({ ...form, isActive: v })}
                        label="Aktif"
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
