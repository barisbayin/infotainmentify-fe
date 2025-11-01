import { useEffect, useRef, useState } from "react";
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
  Badge,
  Field,
  Input,
  Textarea,
} from "../components/ui-kit";
import { promptsApi, type Prompt } from "../api";
import toast from "react-hot-toast";
import { useConfirm } from "../components/confirm";

const EMPTY: Omit<Prompt, "id"> = {
  name: "",
  category: "",
  language: "en-US",
  isActive: true,
  body: "",
};

export default function PromptsPage() {
  const [items, setItems] = useState<Prompt[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<Omit<Prompt, "id">>(EMPTY);
  const debouncedQ = useDebouncedValue(q, 300);
  const confirm = useConfirm();

  async function load() {
    setLoading(true);
    try {
      setItems(await promptsApi.list(debouncedQ));
    } catch (err) {
      console.error(err);
      toast.error("Liste yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(); // eslint-disable-next-line
  }, [debouncedQ]);

  async function onRowClick(p: Prompt) {
    setSelectedId(p.id);
    setDetailLoading(true);
    try {
      const dto = await promptsApi.get(p.id);
      setForm({
        name: dto.name ?? "",
        category: dto.category ?? "",
        language: dto.language ?? "",
        isActive: !!dto.isActive,
        body: dto.body ?? "",
      });
    } finally {
      setDetailLoading(false);
    }
  }

  function resetForm() {
    setSelectedId(null);
    setForm(EMPTY);
  }

  async function onSave() {
    if (!form.name.trim() || !form.body.trim()) {
      toast.error(
        `${!form.name.trim() ? "Başlık gerekli" : ""}${
          !form.name.trim() && !form.body.trim() ? " • " : ""
        }${!form.body.trim() ? "İçerik gerekli" : ""}`
      );
      return;
    }

    const isUpdate = selectedId != null;
    const opPromise: Promise<void> = isUpdate
      ? promptsApi.update(selectedId!, form)
      : promptsApi.create(form).then(() => undefined);

    try {
      await toast.promise(opPromise, {
        loading: "Kaydediliyor…",
        success: isUpdate
          ? `#${selectedId} güncellendi`
          : "Yeni kayıt oluşturuldu",
        error: "Kayıt başarısız",
      });
      resetForm();
      await load();
    } catch (err: any) {
      const d = err?.detail as any;
      if (d?.errors) {
        const list: string[] = [];
        for (const [k, arr] of Object.entries(d.errors) as [
          string,
          string[]
        ][]) {
          arr.forEach((m) => list.push(`${k}: ${m}`));
        }
        if (list.length) toast.error(list.join(" • "));
      }
    }
  }

  async function onDelete() {
    if (!selectedId) return;

    const ok = await confirm({
      title: "Prompt silinsin mi?",
      message: (
        <>
          <b>#{selectedId}</b> kalıcı olarak silinecek. Bu işlem geri alınamaz.
        </>
      ),
      confirmText: "Sil",
      cancelText: "İptal",
      tone: "danger",
      dismissOnBackdrop: true,
    });
    if (!ok) return;

    try {
      await promptsApi.delete(selectedId);
      toast.success(`Silindi #${selectedId}`);
      resetForm();
      await load();
    } catch (err) {
      console.error(err);
      toast.error("Silme başarısız");
    }
  }

  return (
    <Page>
      <div className="grid grid-cols-12 gap-4 h-full">
        {/* SOL — Liste */}
        <section className="col-span-12 xl:col-span-7 flex flex-col min-h-0">
          <Toolbar>
            <Input
              placeholder="Prompt ara…"
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
                  <TH>Ad</TH>
                  <TH>Kategori</TH>
                  <TH>Dil</TH>
                  <TH>Durum</TH>
                </TR>
              </THead>
              <tbody>
                {items.map((p) => {
                  const passive = !p.isActive;
                  const selected = selectedId === p.id;
                  return (
                    <TR
                      key={p.id}
                      onClick={() => onRowClick(p)}
                      className={[
                        "cursor-pointer border-b border-neutral-100",
                        passive
                          ? "bg-rose-50/60 hover:bg-rose-50 text-rose-800"
                          : "hover:bg-neutral-50",
                        selected
                          ? passive
                            ? "ring-1 ring-rose-300"
                            : "bg-neutral-100"
                          : "",
                      ].join(" ")}
                    >
                      <TD>#{p.id}</TD>
                      <TD className="font-medium">{p.name}</TD>
                      <TD>{p.category}</TD>
                      <TD>{p.language}</TD>
                      <TD>
                        <Badge tone={p.isActive ? "success" : "danger"}>
                          {p.isActive ? "Aktif" : "Pasif"}
                        </Badge>
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
                {selectedId ? `Düzenle #${selectedId}` : "Yeni Prompt"}
              </div>
              {selectedId && (
                <div className="text-xs text-neutral-500">Detay yüklendi</div>
              )}
            </CardHeader>

            {/* 🔧 body artık esnek yapıda */}
            <CardBody className="flex flex-col flex-1 min-h-0 overflow-hidden space-y-3">
              {detailLoading ? (
                <div className="p-3 text-sm text-neutral-500">Yükleniyor…</div>
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
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Kategori">
                      <Input
                        value={form.category ?? ""}
                        onChange={(e) =>
                          setForm({ ...form, category: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Dil">
                      <Input
                        value={form.language ?? ""}
                        onChange={(e) =>
                          setForm({ ...form, language: e.target.value })
                        }
                      />
                    </Field>
                  </div>
                  <label className="inline-flex items-center gap-2 select-none">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-neutral-300"
                      checked={form.isActive}
                      onChange={(e) =>
                        setForm({ ...form, isActive: e.target.checked })
                      }
                    />
                    <span className="text-sm text-neutral-700">Aktif</span>
                  </label>

                  {/* 🔥 body tam esner */}
                  <Field
                    label="Prompt İçeriği"
                    className="flex-1 flex flex-col"
                  >
                    <Textarea
                      className="flex-1 resize-none overflow-auto border border-neutral-300 rounded-xl 
                                 bg-neutral-50 px-3 py-2 font-mono text-sm focus:outline-none 
                                 focus:ring-2 focus:ring-neutral-300 transition-all"
                      placeholder="Prompt metnini buraya yazın…"
                      value={form.body}
                      onChange={(e) =>
                        setForm({ ...form, body: e.target.value })
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

function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  const t = useRef<number | null>(null);
  useEffect(() => {
    if (t.current) window.clearTimeout(t.current);
    t.current = window.setTimeout(() => setDebounced(value), delay);
    return () => {
      if (t.current) window.clearTimeout(t.current);
    };
  }, [value, delay]);
  return debounced;
}
