import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  BookMarked,
  FileText,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { conceptsApi } from "../api/concepts";
import {
  PRODUCTION_BRIEF_FIELD_LIMITS,
  productionBriefsApi,
  type SaveProductionBriefDto,
  type SavedProductionBriefDto,
} from "../api/productionBriefs";
import { useDebounce } from "../hooks/useDebounce";
import {
  Badge,
  Button,
  Card,
  Input,
  Label,
  Modal,
  Page,
  Select,
  Table,
  TD,
  TH,
  THead,
  TR,
  Textarea,
  cn,
} from "../components/ui-kit";

const EMPTY_FORM: SaveProductionBriefDto = {
  conceptId: null,
  name: "",
  mainTitle: "",
  angle: "",
  audience: "",
  targetDuration: "",
  mustCover: "",
  avoid: "",
  hookDirection: "",
  thumbnailDirection: "",
  notes: "",
};

const toForm = (item: SavedProductionBriefDto): SaveProductionBriefDto => ({
  conceptId: item.conceptId ?? null,
  name: item.name ?? "",
  mainTitle: item.mainTitle ?? "",
  angle: item.angle ?? "",
  audience: item.audience ?? "",
  targetDuration: item.targetDuration ?? "",
  mustCover: item.mustCover ?? "",
  avoid: item.avoid ?? "",
  hookDirection: item.hookDirection ?? "",
  thumbnailDirection: item.thumbnailDirection ?? "",
  notes: item.notes ?? "",
});

const cleanForSave = (form: SaveProductionBriefDto): SaveProductionBriefDto => ({
  conceptId: form.conceptId || null,
  name: form.name.trim(),
  mainTitle: form.mainTitle?.trim() || undefined,
  angle: form.angle?.trim() || undefined,
  audience: form.audience?.trim() || undefined,
  targetDuration: form.targetDuration?.trim() || undefined,
  mustCover: form.mustCover?.trim() || undefined,
  avoid: form.avoid?.trim() || undefined,
  hookDirection: form.hookDirection?.trim() || undefined,
  thumbnailDirection: form.thumbnailDirection?.trim() || undefined,
  notes: form.notes?.trim() || undefined,
});

function FieldCounter({ value, limit }: { value?: string; limit: number }) {
  return (
    <div className="mt-1 text-right text-[10px] text-zinc-500">
      {(value ?? "").length.toLocaleString("tr-TR")} / {limit.toLocaleString("tr-TR")}
    </div>
  );
}

export default function ProductionBriefsPage() {
  const [items, setItems] = useState<SavedProductionBriefDto[]>([]);
  const [concepts, setConcepts] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [conceptFilter, setConceptFilter] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<SaveProductionBriefDto>(EMPTY_FORM);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 500);

  const conceptOptions = useMemo(
    () => [{ label: "Konsept yok / genel brief", value: "" }, ...concepts],
    [concepts]
  );

  const loadConcepts = async () => {
    try {
      const data = await conceptsApi.list();
      setConcepts(data.map((c) => ({ label: c.name, value: String(c.id) })));
    } catch {
      toast.error("Konseptler yuklenemedi.");
    }
  };

  const loadList = async () => {
    setLoading(true);
    try {
      const data = await productionBriefsApi.list({
        q: debouncedSearch,
        conceptId: conceptFilter,
      });
      setItems(data);
    } catch {
      toast.error("Brief kutuphanesi yuklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConcepts();
  }, []);

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, conceptFilter]);

  const handleNew = () => {
    setSelectedId(null);
    setForm(EMPTY_FORM);
  };

  const handleSelect = async (id: number) => {
    if (id === selectedId) return;

    setSelectedId(id);
    setDetailLoading(true);
    try {
      const data = await productionBriefsApi.get(id);
      setForm(toForm(data));
    } catch {
      toast.error("Brief detayi yuklenemedi.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Brief adi zorunludur.");
      return;
    }

    setDetailLoading(true);
    try {
      const payload = cleanForSave(form);
      if (selectedId) {
        await productionBriefsApi.update(selectedId, payload);
        toast.success("Brief guncellendi.");
      } else {
        const res = await productionBriefsApi.create(payload);
        toast.success("Brief kaydedildi.");
        setSelectedId(res.id);
      }
      await loadList();
    } catch {
      toast.error("Brief kaydedilemedi.");
    } finally {
      setDetailLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedId) return;

    setDetailLoading(true);
    try {
      await productionBriefsApi.delete(selectedId);
      toast.success("Brief silindi.");
      setIsDeleteModalOpen(false);
      handleNew();
      await loadList();
    } catch {
      toast.error("Brief silinemedi.");
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <Page>
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden pt-2">
        <div className="col-span-12 lg:col-span-7 flex flex-col h-full min-h-0 gap-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between shrink-0">
            <h1 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="p-2 rounded-lg border border-indigo-500/20 bg-indigo-500/10">
                <BookMarked className="text-indigo-400" size={20} />
              </div>
              <div className="flex flex-col">
                <span>Brief Kutuphanesi</span>
                <span className="text-xs font-normal text-zinc-500">
                  Aklina gelen uzun video fikirlerini onceden kaydet
                </span>
              </div>
            </h1>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Brief ara..."
                  className="pl-9 h-10"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="w-full sm:w-56">
                <Select
                  value={conceptFilter}
                  onChange={setConceptFilter}
                  options={[{ label: "Tum konseptler", value: "" }, ...concepts]}
                  placeholder="Konsept filtrele"
                />
              </div>

              <Button variant="outline" size="icon" onClick={loadList}>
                <RefreshCw className={loading ? "animate-spin" : ""} size={18} />
              </Button>

              <Button onClick={handleNew} className="shrink-0">
                <Plus size={16} className="mr-2" /> Yeni Brief
              </Button>
            </div>
          </div>

          <Card className="flex-1 min-h-0 p-0 overflow-hidden flex flex-col border-zinc-800 bg-zinc-900/40">
            <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-700">
              <Table className="border-none w-full">
                <THead>
                  <TR className="bg-zinc-900/80 sticky top-0 z-10 backdrop-blur-md">
                    <TH>Brief</TH>
                    <TH className="hidden md:table-cell">Konsept</TH>
                    <TH className="hidden xl:table-cell">Sure</TH>
                    <TH className="text-right w-32">Tarih</TH>
                  </TR>
                </THead>
                <tbody>
                  {items.map((item) => (
                    <TR
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={cn(
                        "cursor-pointer transition-all border-l-4",
                        selectedId === item.id
                          ? "bg-indigo-500/10 border-l-indigo-500"
                          : "border-l-transparent"
                      )}
                    >
                      <TD className="py-3">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-zinc-100 truncate max-w-[260px]">
                            {item.name}
                          </span>
                          <span className="text-xs text-zinc-500 truncate max-w-[360px]">
                            {item.mainTitle || item.angle || "Baslik bekliyor"}
                          </span>
                        </div>
                      </TD>
                      <TD className="hidden md:table-cell py-3 text-sm text-zinc-400">
                        {item.conceptName || "-"}
                      </TD>
                      <TD className="hidden xl:table-cell py-3 text-xs text-zinc-500">
                        {item.targetDuration || "-"}
                      </TD>
                      <TD className="text-right py-3 text-xs font-mono text-zinc-500">
                        {new Date(item.updatedAt || item.createdAt).toLocaleDateString("tr-TR")}
                      </TD>
                    </TR>
                  ))}
                  {items.length === 0 && !loading && (
                    <TR>
                      <TD colSpan={4}>
                        <div className="flex flex-col items-center justify-center py-12 text-zinc-500 gap-2">
                          <FileText size={30} className="opacity-30" />
                          <span>Henuz kayitli brief yok.</span>
                        </div>
                      </TD>
                    </TR>
                  )}
                </tbody>
              </Table>
            </div>
            <div className="p-2 border-t border-zinc-800 bg-zinc-900/50 text-xs text-zinc-500 text-center shrink-0">
              Toplam {items.length} brief
            </div>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-5 flex flex-col h-full min-h-0">
          <Card className="h-full flex flex-col overflow-hidden border-zinc-800 bg-zinc-900/60 p-0">
            <div className="flex justify-between items-center p-4 border-b border-zinc-800/50 shrink-0 bg-zinc-900/30">
              <div className="flex items-center gap-2">
                <div className={cn("w-1.5 h-6 rounded-full", selectedId ? "bg-indigo-500" : "bg-emerald-500")} />
                <h2 className="text-md font-bold text-white">
                  {selectedId ? "Brief Duzenle" : "Yeni Brief"}
                </h2>
              </div>
              {selectedId && <Badge variant="neutral">#{selectedId}</Badge>}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-700">
              {detailLoading ? (
                <div className="flex h-full items-center justify-center text-zinc-500 gap-2">
                  <RefreshCw className="animate-spin" /> Yukleniyor...
                </div>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <Label>Brief Adi *</Label>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        maxLength={PRODUCTION_BRIEF_FIELD_LIMITS.name}
                        placeholder="Orn: Roma neden coktu?"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Konsept</Label>
                      <Select
                        value={form.conceptId ? String(form.conceptId) : ""}
                        onChange={(value) =>
                          setForm({ ...form, conceptId: value ? Number(value) : null })
                        }
                        options={conceptOptions}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Ana Baslik</Label>
                      <Input
                        value={form.mainTitle ?? ""}
                        onChange={(e) => setForm({ ...form, mainTitle: e.target.value })}
                        maxLength={PRODUCTION_BRIEF_FIELD_LIMITS.mainTitle}
                        placeholder="Videonun ana basligi"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Aci / Tez</Label>
                      <Textarea
                        value={form.angle ?? ""}
                        onChange={(e) => setForm({ ...form, angle: e.target.value })}
                        maxLength={PRODUCTION_BRIEF_FIELD_LIMITS.angle}
                        placeholder="Ana iddia, merak sorusu, izleyiciye sunulacak farkli bakis ve finalde varilacak sonuc..."
                        className="min-h-[130px]"
                      />
                      <FieldCounter value={form.angle} limit={PRODUCTION_BRIEF_FIELD_LIMITS.angle} />
                    </div>

                    <div>
                      <Label>Hedef Izleyici</Label>
                      <Textarea
                        value={form.audience ?? ""}
                        onChange={(e) => setForm({ ...form, audience: e.target.value })}
                        maxLength={PRODUCTION_BRIEF_FIELD_LIMITS.audience}
                        placeholder="Kim izleyecek, ne biliyor ve videodan ne bekliyor?"
                        className="min-h-[96px]"
                      />
                      <FieldCounter value={form.audience} limit={PRODUCTION_BRIEF_FIELD_LIMITS.audience} />
                    </div>

                    <div>
                      <Label>Hedef Sure</Label>
                      <Input
                        value={form.targetDuration ?? ""}
                        onChange={(e) => setForm({ ...form, targetDuration: e.target.value })}
                        maxLength={PRODUCTION_BRIEF_FIELD_LIMITS.targetDuration}
                        placeholder="10-15 dk"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Kacinilacak Seyler</Label>
                      <Textarea
                        value={form.avoid ?? ""}
                        onChange={(e) => setForm({ ...form, avoid: e.target.value })}
                        maxLength={PRODUCTION_BRIEF_FIELD_LIMITS.avoid}
                        placeholder="Konu sinirlari, yanlis iddialar, kliseler, ton ve gorsel yasaklar..."
                        className="min-h-[96px]"
                      />
                      <FieldCounter value={form.avoid} limit={PRODUCTION_BRIEF_FIELD_LIMITS.avoid} />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Mutlaka Islensin</Label>
                      <Textarea
                        value={form.mustCover ?? ""}
                        onChange={(e) => setForm({ ...form, mustCover: e.target.value })}
                        maxLength={PRODUCTION_BRIEF_FIELD_LIMITS.mustCover}
                        placeholder={"- Kanitlanacak ana noktalar\n- Ornekler ve kaynaklar\n- Bolum sirasi\n- Finalde verilecek cevap"}
                        className="min-h-[150px]"
                      />
                      <FieldCounter value={form.mustCover} limit={PRODUCTION_BRIEF_FIELD_LIMITS.mustCover} />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Hook Yonlendirmesi</Label>
                      <Textarea
                        value={form.hookDirection ?? ""}
                        onChange={(e) => setForm({ ...form, hookDirection: e.target.value })}
                        maxLength={PRODUCTION_BRIEF_FIELD_LIMITS.hookDirection}
                        placeholder="Ilk 10-20 saniyede hangi gerilim, soru veya sasirtici iddia acilmali? Izleyiciye hangi payoff vaat edilmeli?"
                        className="min-h-[110px]"
                      />
                      <FieldCounter value={form.hookDirection} limit={PRODUCTION_BRIEF_FIELD_LIMITS.hookDirection} />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Thumbnail Yonlendirmesi</Label>
                      <Textarea
                        value={form.thumbnailDirection ?? ""}
                        onChange={(e) => setForm({ ...form, thumbnailDirection: e.target.value })}
                        maxLength={PRODUCTION_BRIEF_FIELD_LIMITS.thumbnailDirection}
                        placeholder="Tek bakista okunacak ana gorsel fikir, duygu, karsitlik, karakter/nesne ve gerekiyorsa en fazla 4 kelimelik metin niyeti..."
                        className="min-h-[110px]"
                      />
                      <FieldCounter value={form.thumbnailDirection} limit={PRODUCTION_BRIEF_FIELD_LIMITS.thumbnailDirection} />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Not / Kaynak / Ek Talimat</Label>
                      <Textarea
                        value={form.notes ?? ""}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        maxLength={PRODUCTION_BRIEF_FIELD_LIMITS.notes}
                        placeholder="Kaynaklar, referanslar, anlatim notlari..."
                        className="min-h-[140px]"
                      />
                      <FieldCounter value={form.notes} limit={PRODUCTION_BRIEF_FIELD_LIMITS.notes} />
                    </div>
                  </div>

                  <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs leading-relaxed text-zinc-400">
                    Bu brief'i kaydettikten sonra Uretim Hatti ekraninda yeni uretim baslatirken secebilirsin.
                    Istersen orada uretime ozel son dakika degisiklik de yapabilirsin.
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/80 flex items-center justify-end gap-2 shrink-0">
              <Button variant="ghost" onClick={handleNew}>
                Vazgec
              </Button>
              {selectedId && (
                <Button variant="danger" onClick={() => setIsDeleteModalOpen(true)}>
                  <Trash2 size={14} className="mr-1.5" /> Sil
                </Button>
              )}
              <Button onClick={handleSave} isLoading={detailLoading}>
                <Save size={14} className="mr-1.5" /> Kaydet
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Brief Silinsin mi?"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg border border-red-500/20 bg-red-500/10">
            <AlertTriangle className="text-red-500 shrink-0" size={24} />
            <div className="text-sm text-zinc-300">
              <b>{form.name}</b> brief kaydi silinecek. Daha once baslamis uretimlerin snapshot'i etkilenmez.
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>
              Iptal
            </Button>
            <Button variant="danger" onClick={confirmDelete} isLoading={detailLoading}>
              Evet, Sil
            </Button>
          </div>
        </div>
      </Modal>
    </Page>
  );
}
