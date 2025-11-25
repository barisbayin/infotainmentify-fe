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
  renderProfilesApi,
  type RenderProfileListDto,
  type RenderProfileDetailDto,
  CaptionPositionTypes,
  CaptionAnimations,
} from "../api/renderProfiles";

// ------------------- EMPTY FORM -------------------
const EMPTY: Omit<RenderProfileDetailDto, "id"> = {
  name: "Viral - MrBeast Style",

  resolution: "1080x1920",
  fps: 30,

  style: "viral_glow",

  captionStyle: "mrbeast_glow",
  captionFont: "Arial",
  captionSize: 48,
  captionGlow: true,
  captionKaraoke: false,

  captionGlowColor: "#00FFFF",
  captionGlowSize: 12,
  captionOutlineSize: 2,
  captionShadowSize: 4,
  captionHighlightColor: "#FFD700",

  captionChunkSize: 2,
  captionPosition: CaptionPositionTypes.Top,
  captionMarginV: 90,
  captionLineSpacing: 1.15,
  captionMaxWidthPercent: 70,
  captionBackgroundOpacity: 0.0,
  captionAnimation: CaptionAnimations.None,

  motionIntensity: 1.0,
  zoomSpeed: 0.00025,
  zoomMax: 1.08,
  panX: 0,
  panY: 0,

  transition: "crossfade",
  transitionDuration: 0.35,
  transitionDirection: "up",
  transitionEasing: "linear",
  transitionStrength: 1.0,

  timelineMode: "even",

  bgmVolume: 40,
  voiceVolume: 100,
  duckingStrength: 30,

  aiRecommendedStyle: "",
  aiRecommendedTransitions: "",
  aiRecommendedCaption: "",
};

// --------------------------------------------------
export default function RenderProfilesPage() {
  const [items, setItems] = useState<RenderProfileListDto[]>([]);
  const [filtered, setFiltered] = useState<RenderProfileListDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<Omit<RenderProfileDetailDto, "id">>(EMPTY);

  const [q, setQ] = useState("");

  const confirm = useConfirm();

  // -------------------- LOAD DATA --------------------
  async function load() {
    setLoading(true);
    try {
      const data = await renderProfilesApi.list();
      setItems(data);
      setFiltered(data);
    } catch {
      toast.error("Liste yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // -------------------- FILTER --------------------
  useEffect(() => {
    const f = items.filter((x) => {
      const qMatch =
        !q ||
        x.name.toLowerCase().includes(q.toLowerCase()) ||
        (x.style ?? "").toLowerCase().includes(q.toLowerCase());
      return qMatch;
    });
    setFiltered(f);
  }, [q, items]);

  // -------------------- ROW CLICK --------------------
  async function onRowClick(item: RenderProfileListDto) {
    setSelectedId(item.id);
    setDetailLoading(true);

    try {
      const dto = await renderProfilesApi.get(item.id);
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
    if (!form.name.trim()) {
      toast.error("Profil adı zorunludur");
      return;
    }

    try {
      await toast.promise(
        renderProfilesApi.save({
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
      await renderProfilesApi.delete(selectedId);
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
                  <TH>Çözünürlük</TH>
                  <TH>FPS</TH>
                  <TH>Stil</TH>
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
                    <TD>{x.name}</TD>
                    <TD>{x.resolution}</TD>
                    <TD>{x.fps}</TD>
                    <TD>{x.style ?? "—"}</TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </Card>
        </section>

        {/* SAĞ TARAF - FORM */}
        <section className="col-span-12 xl:col-span-5 flex flex-col min-h-0 overflow-hidden">
          <Card className="flex flex-col flex-1 overflow-hidden">
            <CardHeader>
              <div className="text-lg font-semibold">
                {selectedId ? `Düzenle #${selectedId}` : "Yeni Render Profili"}
              </div>
            </CardHeader>

            <CardBody className="flex-1 overflow-hidden p-0">
              <div className="h-full overflow-y-auto px-4 py-3 space-y-5">
                {detailLoading ? (
                  <div className="p-3 text-sm text-neutral-500">
                    Yükleniyor…
                  </div>
                ) : (
                  <>
                    {/* ---------------------- GENEL ---------------------- */}
                    <div className="font-semibold text-neutral-700">
                      Genel Ayarlar
                    </div>

                    <Field label="Profil Adı">
                      <Input
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Çözünürlük">
                        <Input
                          value={form.resolution}
                          onChange={(e) =>
                            setForm({ ...form, resolution: e.target.value })
                          }
                        />
                      </Field>

                      <Field label="FPS">
                        <Input
                          type="number"
                          value={form.fps}
                          onChange={(e) =>
                            setForm({ ...form, fps: Number(e.target.value) })
                          }
                        />
                      </Field>
                    </div>

                    <Field label="Genel Stil">
                      <Input
                        value={form.style ?? ""}
                        onChange={(e) =>
                          setForm({ ...form, style: e.target.value })
                        }
                      />
                    </Field>

                    {/* ---------------------- CAPTIONS ---------------------- */}
                    <div className="pt-4 font-semibold text-neutral-700">
                      Altyazı Ayarları
                    </div>

                    <Field label="Caption Style">
                      <Input
                        value={form.captionStyle ?? ""}
                        onChange={(e) =>
                          setForm({ ...form, captionStyle: e.target.value })
                        }
                      />
                    </Field>

                    <Field label="Font">
                      <Input
                        value={form.captionFont}
                        onChange={(e) =>
                          setForm({ ...form, captionFont: e.target.value })
                        }
                      />
                    </Field>

                    <Field label="Yazı Boyutu">
                      <Input
                        type="number"
                        value={form.captionSize}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            captionSize: Number(e.target.value),
                          })
                        }
                      />
                    </Field>

                    <Switch
                      checked={form.captionGlow}
                      onChange={(v) => setForm({ ...form, captionGlow: v })}
                      label="Parlama (Glow)"
                    />

                    <Switch
                      checked={form.captionKaraoke}
                      onChange={(v) => setForm({ ...form, captionKaraoke: v })}
                      label="Karaoke Modu"
                    />

                    <Field label="Glow Rengi">
                      <Input
                        value={form.captionGlowColor}
                        onChange={(e) =>
                          setForm({ ...form, captionGlowColor: e.target.value })
                        }
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Glow Size">
                        <Input
                          type="number"
                          value={form.captionGlowSize}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              captionGlowSize: Number(e.target.value),
                            })
                          }
                        />
                      </Field>

                      <Field label="Outline Size">
                        <Input
                          type="number"
                          value={form.captionOutlineSize}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              captionOutlineSize: Number(e.target.value),
                            })
                          }
                        />
                      </Field>
                    </div>

                    <Field label="Shadow Size">
                      <Input
                        type="number"
                        value={form.captionShadowSize}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            captionShadowSize: Number(e.target.value),
                          })
                        }
                      />
                    </Field>

                    <Field label="Highlight Color">
                      <Input
                        value={form.captionHighlightColor}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            captionHighlightColor: e.target.value,
                          })
                        }
                      />
                    </Field>

                    <Field label="Chunk Size (2 kelime)">
                      <Input
                        type="number"
                        value={form.captionChunkSize}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            captionChunkSize: Number(e.target.value),
                          })
                        }
                      />
                    </Field>

                    <Field label="Caption Position">
                      <SelectBox
                        value={form.captionPosition}
                        onChange={(v) =>
                          setForm({
                            ...form,
                            captionPosition: Number(v) as CaptionPositionTypes,
                          })
                        }
                        options={[
                          { label: "Top", value: CaptionPositionTypes.Top },
                          {
                            label: "Middle",
                            value: CaptionPositionTypes.Middle,
                          },
                          {
                            label: "Bottom",
                            value: CaptionPositionTypes.Bottom,
                          },
                        ]}
                      />
                    </Field>

                    <Field label="Caption Animation">
                      <SelectBox
                        value={form.captionAnimation}
                        onChange={(v) =>
                          setForm({
                            ...form,
                            captionAnimation: Number(v) as CaptionAnimations,
                          })
                        }
                        options={[
                          { label: "None", value: CaptionAnimations.None },
                          {
                            label: "Bounce",
                            value: CaptionAnimations.Bounce,
                          },
                        ]}
                      />
                    </Field>

                    <Field label="Margin V">
                      <Input
                        type="number"
                        value={form.captionMarginV}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            captionMarginV: Number(e.target.value),
                          })
                        }
                      />
                    </Field>

                    <Field label="Line Spacing">
                      <Input
                        type="number"
                        step="0.01"
                        value={form.captionLineSpacing}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            captionLineSpacing: Number(e.target.value),
                          })
                        }
                      />
                    </Field>

                    <Field label="Max Width %">
                      <Input
                        type="number"
                        value={form.captionMaxWidthPercent}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            captionMaxWidthPercent: Number(e.target.value),
                          })
                        }
                      />
                    </Field>

                    <Field label="Background Opacity">
                      <Input
                        type="number"
                        step="0.05"
                        value={form.captionBackgroundOpacity}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            captionBackgroundOpacity: Number(e.target.value),
                          })
                        }
                      />
                    </Field>

                    {/* ---------------------- MOTION ---------------------- */}
                    <div className="pt-4 font-semibold text-neutral-700">
                      Kamera Hareketi (Ken Burns)
                    </div>

                    <Field label="Motion Intensity">
                      <Input
                        type="number"
                        step="0.1"
                        value={form.motionIntensity}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            motionIntensity: Number(e.target.value),
                          })
                        }
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Zoom Speed">
                        <Input
                          type="number"
                          step="0.0001"
                          value={form.zoomSpeed}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              zoomSpeed: Number(e.target.value),
                            })
                          }
                        />
                      </Field>

                      <Field label="Zoom Max">
                        <Input
                          type="number"
                          step="0.01"
                          value={form.zoomMax}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              zoomMax: Number(e.target.value),
                            })
                          }
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Pan X">
                        <Input
                          type="number"
                          step="0.1"
                          value={form.panX}
                          onChange={(e) =>
                            setForm({ ...form, panX: Number(e.target.value) })
                          }
                        />
                      </Field>

                      <Field label="Pan Y">
                        <Input
                          type="number"
                          step="0.1"
                          value={form.panY}
                          onChange={(e) =>
                            setForm({ ...form, panY: Number(e.target.value) })
                          }
                        />
                      </Field>
                    </div>

                    {/* ---------------------- TRANSITIONS ---------------------- */}
                    <div className="pt-4 font-semibold text-neutral-700">
                      Geçişler
                    </div>

                    <Field label="Transition">
                      <Input
                        value={form.transition}
                        onChange={(e) =>
                          setForm({ ...form, transition: e.target.value })
                        }
                      />
                    </Field>

                    <Field label="Süre (sn)">
                      <Input
                        type="number"
                        step="0.1"
                        value={form.transitionDuration}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            transitionDuration: Number(e.target.value),
                          })
                        }
                      />
                    </Field>

                    <Field label="Direction">
                      <Input
                        value={form.transitionDirection}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            transitionDirection: e.target.value,
                          })
                        }
                      />
                    </Field>

                    <Field label="Easing">
                      <Input
                        value={form.transitionEasing}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            transitionEasing: e.target.value,
                          })
                        }
                      />
                    </Field>

                    <Field label="Strength">
                      <Input
                        type="number"
                        step="0.1"
                        value={form.transitionStrength}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            transitionStrength: Number(e.target.value),
                          })
                        }
                      />
                    </Field>

                    {/* ---------------------- TIMELINE ---------------------- */}
                    <Field label="Timeline Mode" className="pt-4">
                      <Input
                        value={form.timelineMode}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            timelineMode: e.target.value,
                          })
                        }
                      />
                    </Field>

                    {/* ---------------------- AUDIO ---------------------- */}
                    <div className="pt-4 font-semibold text-neutral-700">
                      Ses Ayarları
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <Field label="BGM Volume">
                        <Input
                          type="number"
                          value={form.bgmVolume}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              bgmVolume: Number(e.target.value),
                            })
                          }
                        />
                      </Field>

                      <Field label="Voice Volume">
                        <Input
                          type="number"
                          value={form.voiceVolume}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              voiceVolume: Number(e.target.value),
                            })
                          }
                        />
                      </Field>

                      <Field label="Ducking">
                        <Input
                          type="number"
                          value={form.duckingStrength}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              duckingStrength: Number(e.target.value),
                            })
                          }
                        />
                      </Field>
                    </div>

                    {/* ---------------------- AI RECOMMENDATIONS ---------------------- */}
                    <div className="pt-4 font-semibold text-neutral-700">
                      AI Önerileri (Readonly)
                    </div>

                    <Field label="Stil Önerisi">
                      <Textarea
                        readOnly
                        value={form.aiRecommendedStyle ?? ""}
                      />
                    </Field>

                    <Field label="Geçiş Önerisi">
                      <Textarea
                        readOnly
                        value={form.aiRecommendedTransitions ?? ""}
                      />
                    </Field>

                    <Field label="Caption Önerisi">
                      <Textarea
                        readOnly
                        value={form.aiRecommendedCaption ?? ""}
                      />
                    </Field>
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
