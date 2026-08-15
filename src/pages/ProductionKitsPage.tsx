import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Package, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { productionKitsApi, type ProductionKitDto, type ProductionKitRequest } from "../api/productionKits";
import { conceptsApi, type ConceptListDto } from "../api/concepts";
import { pipelineTemplatesApi, type PipelineTemplateListDto } from "../api/pipelineTemplates";
import { Button, Card, Input, Label, Page, PageHeader, Textarea, cn } from "../components/ui-kit";
import { HelpLabel } from "../components/FieldHelp";

const emptyKit: ProductionKitRequest = {
  name: "Long-form Production Kit",
  description: "",
  conceptId: undefined,
  templateId: undefined,
  productionProfile: "LongForm",
  presetMapJson: "{}",
  reviewPolicyJson: JSON.stringify({ requirePackageApproval: true, requireRenderReview: true }, null, 2),
  healthSnapshotJson: "{}",
};

export default function ProductionKitsPage() {
  const [kits, setKits] = useState<ProductionKitDto[]>([]);
  const [concepts, setConcepts] = useState<ConceptListDto[]>([]);
  const [templates, setTemplates] = useState<PipelineTemplateListDto[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductionKitRequest>(emptyKit);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selected = kits.find((x) => x.id === selectedId);

  const load = async () => {
    setLoading(true);
    try {
      const [kitData, conceptData, templateData] = await Promise.all([
        productionKitsApi.list(),
        conceptsApi.list(),
        pipelineTemplatesApi.list(),
      ]);
      setKits(kitData);
      setConcepts(conceptData);
      setTemplates(templateData);
      if (!selectedId && kitData[0]) setSelectedId(kitData[0].id);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch((err) => toast.error(err?.message || "Production kit yüklenemedi."));
  }, []);

  useEffect(() => {
    if (!selected) {
      setForm(emptyKit);
      return;
    }
    setForm({
      name: selected.name,
      description: selected.description || "",
      conceptId: selected.conceptId ?? undefined,
      templateId: selected.templateId ?? undefined,
      productionProfile: selected.productionProfile || "LongForm",
      presetMapJson: selected.presetMapJson || "{}",
      reviewPolicyJson: selected.reviewPolicyJson || "{}",
      healthSnapshotJson: selected.healthSnapshotJson || "{}",
    });
  }, [selectedId, kits.length]);

  const save = async () => {
    setSaving(true);
    try {
      if (selectedId) {
        const updated = await productionKitsApi.update(selectedId, form);
        setKits((items) => items.map((x) => (x.id === updated.id ? updated : x)));
        toast.success("Production kit güncellendi.");
      } else {
        const created = await productionKitsApi.create(form);
        setKits((items) => [created, ...items]);
        setSelectedId(created.id);
        toast.success("Production kit oluşturuldu.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Production kit kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!selectedId) return;
    try {
      await productionKitsApi.delete(selectedId);
      setKits((items) => items.filter((x) => x.id !== selectedId));
      setSelectedId(null);
      toast.success("Production kit silindi.");
    } catch (err: any) {
      toast.error(err?.message || "Production kit silinemedi.");
    }
  };

  const setField = <K extends keyof ProductionKitRequest>(key: K, value: ProductionKitRequest[K]) =>
    setForm((x) => ({ ...x, [key]: value }));

  return (
    <Page>
      <PageHeader
        title="Production Kits"
        subtitle="Konsept + workflow şablonu + preset/policy bundle. Uzun video üretimini tek paketten başlatmak için omurga."
        action={
          <>
            <Button variant="secondary" onClick={() => load()} isLoading={loading}>
              <RefreshCw size={15} className="mr-2" /> Yenile
            </Button>
            <Button onClick={() => setSelectedId(null)}>
              <Plus size={15} className="mr-2" /> Yeni Kit
            </Button>
          </>
        }
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[340px_1fr]">
        <Card className="min-h-0 overflow-y-auto p-3">
          <div className="mb-3 flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
            <Package size={15} /> Kitler
          </div>
          <div className="space-y-2">
            {kits.map((kit) => (
              <button
                key={kit.id}
                type="button"
                onClick={() => setSelectedId(kit.id)}
                className={cn(
                  "w-full rounded-xl border p-3 text-left transition",
                  selectedId === kit.id ? "border-indigo-500/40 bg-indigo-500/10" : "border-zinc-800 bg-zinc-950/45 hover:border-zinc-700"
                )}
              >
                <div className="text-sm font-black text-white">{kit.name}</div>
                <div className="mt-1 text-[10px] text-zinc-500">{kit.productionProfile} · {kit.conceptName || "Konsept yok"} · {kit.templateName || "Workflow yok"}</div>
                <p className="mt-2 line-clamp-2 text-xs text-zinc-500">{kit.description || "Açıklama yok"}</p>
              </button>
            ))}
            {kits.length === 0 && <div className="rounded-xl border border-zinc-800 p-4 text-sm text-zinc-500">Henüz kit yok.</div>}
          </div>
        </Card>

        <Card className="min-h-0 overflow-y-auto">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-white">{selectedId ? "Kit Düzenle" : "Yeni Kit"}</h2>
              <p className="mt-1 text-sm text-zinc-500">Bu paket ileride wizard başlangıcında “tek tık üretim profili” gibi çalışacak.</p>
            </div>
            <div className="flex gap-2">
              {selectedId && (
                <Button variant="danger" onClick={remove}>
                  <Trash2 size={14} className="mr-2" /> Sil
                </Button>
              )}
              <Button onClick={save} isLoading={saving}>
                <Save size={14} className="mr-2" /> Kaydet
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div>
              <Label>Kit adı</Label>
              <Input value={form.name} onChange={(e) => setField("name", e.target.value)} />
            </div>
            <div>
              <Label>Production profile</Label>
              <Input value={form.productionProfile} onChange={(e) => setField("productionProfile", e.target.value)} />
            </div>
            <div>
              <HelpLabel help="Kit hangi kanal/konsept kimliğine bağlı olacak? Prompt context buradan gelir.">Konsept</HelpLabel>
              <select
                className="ui-field h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950/30 px-3 text-sm text-white"
                value={form.conceptId ?? ""}
                onChange={(e) => setField("conceptId", e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">Seçilmedi</option>
                {concepts.map((concept) => <option key={concept.id} value={concept.id}>{concept.name}</option>)}
              </select>
            </div>
            <div>
              <HelpLabel help="Kit hangi workflow şablonunu kullanacak? Stage zinciri ve preset seçimleri buradan gelir.">Workflow şablonu</HelpLabel>
              <select
                className="ui-field h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950/30 px-3 text-sm text-white"
                value={form.templateId ?? ""}
                onChange={(e) => setField("templateId", e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">Seçilmedi</option>
                {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <Label>Açıklama</Label>
            <Textarea value={form.description} onChange={(e) => setField("description", e.target.value)} />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <JsonBox
              label="Preset map JSON"
              help={'Stage bazlı preset tercihlerini saklamak için. Örnek: { "Script": 3, "Render": 8 }'}
              value={form.presetMapJson}
              onChange={(value) => setField("presetMapJson", value)}
            />
            <JsonBox
              label="Review policy JSON"
              help="Render öncesi paket onayı, manuel review gate ve kalite eşikleri gibi kuralları saklar."
              value={form.reviewPolicyJson}
              onChange={(value) => setField("reviewPolicyJson", value)}
            />
            <JsonBox
              label="Health snapshot JSON"
              help="Workflow/preset sağlığını snapshot olarak saklamak için. Şimdilik manuel/diagnostic alan."
              value={form.healthSnapshotJson}
              onChange={(value) => setField("healthSnapshotJson", value)}
            />
          </div>
        </Card>
      </div>
    </Page>
  );
}

function JsonBox({ label, help, value, onChange }: { label: string; help: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <HelpLabel help={help}>{label}</HelpLabel>
      <Textarea className="min-h-[260px] font-mono text-xs" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
