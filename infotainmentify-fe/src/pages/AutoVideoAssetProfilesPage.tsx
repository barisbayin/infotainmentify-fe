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
  autoVideoProfilesApi,
  type AutoVideoAssetProfileListDto,
  type AutoVideoAssetProfileDetailDto,
} from "../api/autoVideoProfiles";

import { topicProfilesApi } from "../api/topicProfiles";
import { scriptGenerationProfilesApi } from "../api/scriptProfiles";
import { socialChannelsApi } from "../api/socialChannels";

// ------------------- EMPTY FORM -------------------
const EMPTY: Omit<AutoVideoAssetProfileDetailDto, "id"> = {
  profileName: "",
  topicGenerationProfileId: 0,
  scriptGenerationProfileId: 0,
  socialChannelId: undefined,
  uploadAfterRender: true,
  generateThumbnail: true,
  titleTemplate: "",
  descriptionTemplate: "",
  isActive: true,
};

export default function AutoVideoAssetProfilesPage() {
  const confirm = useConfirm();

  // Left list
  const [items, setItems] = useState<AutoVideoAssetProfileListDto[]>([]);
  const [filtered, setFiltered] = useState<AutoVideoAssetProfileListDto[]>([]);
  const [loading, setLoading] = useState(false);

  // Right detail form
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form, setForm] =
    useState<Omit<AutoVideoAssetProfileDetailDto, "id">>(EMPTY);

  // Dropdown sources
  const [topicProfiles, setTopicProfiles] = useState<any[]>([]);
  const [scriptProfiles, setScriptProfiles] = useState<any[]>([]);
  const [socialChannels, setSocialChannels] = useState<any[]>([]);

  // Filters (optional)
  const [q, setQ] = useState("");

  // -------------------- LOAD LIST --------------------
  async function load() {
    setLoading(true);
    try {
      const data = await autoVideoProfilesApi.list(); // fetch wrapper = direct array
      setItems(data);
      setFiltered(data);
    } catch {
      toast.error("Liste yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  // -------------------- LOAD SOURCES --------------------
  async function loadSources() {
    try {
      const [t, s, c] = await Promise.all([
        topicProfilesApi.list(),
        scriptGenerationProfilesApi.list("Active"),
        socialChannelsApi.list(),
      ]);
      setTopicProfiles(t);
      setScriptProfiles(s);
      setSocialChannels(c);
    } catch {
      toast.error("Dropdown verileri yüklenemedi.");
    }
  }

  useEffect(() => {
    load();
    loadSources();
  }, []);

  // ---------------- FILTERING ----------------
  useEffect(() => {
    const f = items.filter((x) => {
      const qMatch =
        !q ||
        x.profileName.toLowerCase().includes(q.toLowerCase()) ||
        x.topicProfileName.toLowerCase().includes(q.toLowerCase()) ||
        x.scriptProfileName.toLowerCase().includes(q.toLowerCase());

      return qMatch;
    });
    setFiltered(f);
  }, [q, items]);

  // ---------------- SELECT ROW ----------------
  async function onRowClick(item: AutoVideoAssetProfileListDto) {
    setSelectedId(item.id);
    setDetailLoading(true);
    try {
      const dto = await autoVideoProfilesApi.get(item.id);
      const { id, ...rest } = dto;
      setForm(rest);
    } catch {
      toast.error("Detay yüklenemedi.");
    } finally {
      setDetailLoading(false);
    }
  }

  // ---------------- RESET (NEW) ----------------
  function resetForm() {
    setSelectedId(null);
    setForm(EMPTY);
  }

  // ---------------- SAVE ----------------
  async function onSave() {
    if (!form.profileName.trim()) {
      toast.error("Profil adı zorunludur.");
      return;
    }

    if (!form.topicGenerationProfileId) {
      toast.error("Topic profili seçilmelidir.");
      return;
    }

    if (!form.scriptGenerationProfileId) {
      toast.error("Script profili seçilmelidir.");
      return;
    }

    const isUpdate = selectedId != null;

    const op = isUpdate
      ? autoVideoProfilesApi.update(selectedId!, form).then(() => undefined)
      : autoVideoProfilesApi.create(form).then(() => undefined);

    try {
      await toast.promise(op, {
        loading: "Kaydediliyor…",
        success: isUpdate
          ? `Profil #${selectedId} güncellendi`
          : `Yeni profil oluşturuldu`,
        error: "Kayıt hatası",
      });
      resetForm();
      load();
    } catch {
      toast.error("Kayıt başarısız.");
    }
  }

  // ---------------- DELETE ----------------
  async function onDelete() {
    if (!selectedId) return;

    const ok = await confirm({
      title: "Silinsin mi?",
      message: `Profil #${selectedId} kalıcı olarak silinecek.`,
      confirmText: "Sil",
      cancelText: "İptal",
      tone: "danger",
    });

    if (!ok) return;

    try {
      await autoVideoProfilesApi.delete(selectedId);
      toast.success("Silindi.");
      resetForm();
      load();
    } catch {
      toast.error("Silme başarısız.");
    }
  }

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <Page>
      <div className="grid grid-cols-12 gap-4 h-full">
        {/* SOL — Liste */}
        <section className="col-span-12 xl:col-span-7 flex flex-col min-h-0">
          {/* Toolbar */}
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

          {/* List Table */}
          <Card className="mt-3 flex-1 min-h-0 overflow-auto">
            <Table>
              <THead>
                <TR>
                  <TH>ID</TH>
                  <TH>Profil</TH>
                  <TH>Topic Profil</TH>
                  <TH>Script Profil</TH>
                  <TH>Sosyal Kanal</TH>
                  <TH>Upload</TH>
                  <TH>Thumbnail</TH>
                </TR>
              </THead>
              <tbody>
                {filtered.map((x) => (
                  <TR
                    key={x.id}
                    onClick={() => onRowClick(x)}
                    className={[
                      "cursor-pointer border-b hover:bg-neutral-50",
                      selectedId === x.id ? "bg-neutral-100" : "",
                    ].join(" ")}
                  >
                    <TD>#{x.id}</TD>
                    <TD>{x.profileName}</TD>
                    <TD>{x.topicProfileName}</TD>
                    <TD>{x.scriptProfileName}</TD>
                    <TD>{x.socialChannelName ?? "—"}</TD>
                    <TD>{x.uploadAfterRender ? "Evet" : "Hayır"}</TD>
                    <TD>{x.generateThumbnail ? "Evet" : "Hayır"}</TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </Card>
        </section>

        {/* SAĞ — Detay Form */}
        <section className="col-span-12 xl:col-span-5 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <div className="text-lg font-semibold">
                {selectedId ? `Profil Düzenle #${selectedId}` : "Yeni Profil"}
              </div>
            </CardHeader>

            <CardBody className="flex flex-col flex-1 overflow-auto space-y-3">
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

                  <Field label="Topic Generation Profile">
                    <SelectBox
                      value={form.topicGenerationProfileId.toString()}
                      onChange={(v) =>
                        setForm({
                          ...form,
                          topicGenerationProfileId: Number(v),
                        })
                      }
                      options={topicProfiles.map((t) => ({
                        value: t.id.toString(),
                        label: t.profileName,
                      }))}
                    />
                  </Field>

                  <Field label="Script Generation Profile">
                    <SelectBox
                      value={form.scriptGenerationProfileId.toString()}
                      onChange={(v) =>
                        setForm({
                          ...form,
                          scriptGenerationProfileId: Number(v),
                        })
                      }
                      options={scriptProfiles.map((s) => ({
                        value: s.id.toString(),
                        label: s.profileName,
                      }))}
                    />
                  </Field>

                  <Field label="Sosyal Kanal (opsiyonel)">
                    <SelectBox
                      value={form.socialChannelId?.toString() ?? ""}
                      onChange={(v) =>
                        setForm({
                          ...form,
                          socialChannelId: v ? Number(v) : undefined,
                        })
                      }
                      options={[
                        { value: "", label: "Seçilmedi" },
                        ...socialChannels.map((x) => ({
                          value: x.id.toString(),
                          label: `${x.platform} – ${x.channelName ?? ""}`,
                        })),
                      ]}
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Upload sonrası yükle">
                      <Switch
                        checked={form.uploadAfterRender}
                        onChange={(v) =>
                          setForm({ ...form, uploadAfterRender: v })
                        }
                      />
                    </Field>

                    <Field label="Thumbnail üret">
                      <Switch
                        checked={form.generateThumbnail}
                        onChange={(v) =>
                          setForm({ ...form, generateThumbnail: v })
                        }
                      />
                    </Field>
                  </div>

                  <Field label="Title Template">
                    <Input
                      value={form.titleTemplate ?? ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          titleTemplate: e.target.value,
                        })
                      }
                    />
                  </Field>

                  <Field label="Description Template">
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
