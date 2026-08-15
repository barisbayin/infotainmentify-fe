import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Braces, ClipboardList, Copy, RefreshCw, Save, Trash2 } from "lucide-react";
import { promptContractsApi, type PromptContractDto, type StagePromptTraceDto } from "../api/promptContracts";
import { Button, Card, Input, Label, Page, PageHeader, Textarea, cn } from "../components/ui-kit";
import { HelpLabel } from "../components/FieldHelp";

type DiffLine = { type: "equal" | "added" | "removed"; lineNumber: number; text: string };

export default function PromptStudioPage() {
  const [contracts, setContracts] = useState<PromptContractDto[]>([]);
  const [selectedName, setSelectedName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [traces, setTraces] = useState<StagePromptTraceDto[]>([]);
  const [diffLines, setDiffLines] = useState<DiffLine[]>([]);
  const [testResult, setTestResult] = useState<any>(null);
  const [form, setForm] = useState({
    id: undefined as number | undefined,
    name: "",
    systemPromptOverride: "",
    userPromptOverride: "",
    notes: "",
  });

  const selected = useMemo(
    () => contracts.find((x) => x.name === selectedName) ?? contracts[0],
    [contracts, selectedName]
  );

  const load = async () => {
    setLoading(true);
    try {
      const [contractData, traceData] = await Promise.all([
        promptContractsApi.list(),
        promptContractsApi.traces({ limit: 80 }),
      ]);
      setContracts(contractData);
      setTraces(traceData);
      if (!selectedName && contractData[0]) setSelectedName(contractData[0].name);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch((err) => toast.error(err?.message || "Prompt Studio yüklenemedi."));
  }, []);

  useEffect(() => {
    if (!selected) return;
    const active = selected.activeOverride;
    setForm({
      id: active?.id,
      name: active?.name || `${selected.stageType} override`,
      systemPromptOverride: active?.systemPromptOverride || "",
      userPromptOverride: active?.userPromptOverride || "",
      notes: active?.notes || "",
    });
    setDiffLines([]);
    setTestResult(null);
  }, [selected?.name]);

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const saved = await promptContractsApi.saveOverride({
        id: form.id,
        contractName: selected.name,
        name: form.name,
        systemPromptOverride: form.systemPromptOverride,
        userPromptOverride: form.userPromptOverride,
        notes: form.notes,
      });
      toast.success("Prompt override kaydedildi.");
      setForm((x) => ({ ...x, id: saved.id }));
      await load();
      setSelectedName(selected.name);
    } catch (err: any) {
      toast.error(err?.message || "Override kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!form.id) return;
    try {
      await promptContractsApi.deleteOverride(form.id);
      toast.success("Override silindi.");
      await load();
    } catch (err: any) {
      toast.error(err?.message || "Override silinemedi.");
    }
  };

  const runDiff = async () => {
    const baseText = selected?.businessRules.join("\n") || "";
    const overrideText = [form.systemPromptOverride, form.userPromptOverride].filter(Boolean).join("\n\n");
    const result = await promptContractsApi.diff({ baseText, overrideText });
    setDiffLines(result.lines);
  };

  const runTest = async () => {
    if (!selected) return;
    setTesting(true);
    try {
      const result = await promptContractsApi.test({
        contractName: selected.name,
        overrideId: form.id,
        overrideName: form.name,
        baseSystemPrompt: "",
        baseUserPrompt: selected.businessRules.join("\n"),
        systemPromptOverride: form.systemPromptOverride,
        userPromptOverride: form.userPromptOverride,
      });
      setTestResult(result);
      toast.success("Prompt preview üretildi.");
    } catch (err: any) {
      toast.error(err?.message || "Prompt test edilemedi.");
    } finally {
      setTesting(false);
    }
  };

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text || "");
    toast.success(`${label} kopyalandı.`);
  };

  return (
    <Page>
      <PageHeader
        title="Prompt Studio"
        subtitle="Stage sözleşmelerini, override promptlarını ve gerçek üretim trace kayıtlarını tek yerden kontrol et."
        action={
          <Button variant="secondary" onClick={() => load()} isLoading={loading}>
            <RefreshCw size={15} className="mr-2" /> Yenile
          </Button>
        }
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[360px_1fr]">
        <Card className="min-h-0 overflow-y-auto p-3">
          <div className="mb-3 flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
            <Braces size={15} /> Contracts
          </div>
          <div className="space-y-2">
            {contracts.map((contract) => (
              <button
                key={contract.contractKey}
                type="button"
                onClick={() => setSelectedName(contract.name)}
                className={cn(
                  "w-full rounded-xl border p-3 text-left transition",
                  selected?.name === contract.name
                    ? "border-indigo-500/40 bg-indigo-500/10"
                    : "border-zinc-800 bg-zinc-950/45 hover:border-zinc-700"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-black text-white">{contract.stageType}</span>
                  <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400">{contract.version}</span>
                </div>
                <div className="mt-1 font-mono text-[10px] text-indigo-300">{contract.name}</div>
                <p className="mt-2 line-clamp-2 text-xs text-zinc-500">{contract.description}</p>
                {contract.activeOverride && <div className="mt-2 text-[10px] font-bold uppercase text-emerald-300">override aktif</div>}
              </button>
            ))}
          </div>
        </Card>

        {selected && (
          <div className="min-h-0 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[1fr_420px]">
              <Card className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-white">{selected.stageType} Prompt Contract</h2>
                    <p className="mt-1 text-sm text-zinc-500">{selected.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={runDiff}>Diff</Button>
                    <Button variant="secondary" onClick={runTest} isLoading={testing}>Test</Button>
                    {form.id && (
                      <Button variant="danger" onClick={remove}>
                        <Trash2 size={14} className="mr-2" /> Sil
                      </Button>
                    )}
                    <Button onClick={save} isLoading={saving}>
                      <Save size={14} className="mr-2" /> Kaydet
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                  <InfoBox title="Input" items={selected.requiredInputKeys} />
                  <InfoBox title="Output" items={selected.outputShape} />
                  <InfoBox title="Rules" items={selected.businessRules} />
                </div>

                <div>
                  <Label>Override adı</Label>
                  <Input value={form.name} onChange={(e) => setForm((x) => ({ ...x, name: e.target.value }))} />
                </div>
                <div>
                  <HelpLabel help="Boş bırakırsan stage'in gömülü system/base prompt'u kullanılır. Sadece gerçekten davranışı değiştirmek istediğinde doldur.">
                    System override
                  </HelpLabel>
                  <Textarea
                    className="min-h-[160px] font-mono text-xs"
                    value={form.systemPromptOverride}
                    onChange={(e) => setForm((x) => ({ ...x, systemPromptOverride: e.target.value }))}
                    placeholder="Boş = gömülü system prompt"
                  />
                </div>
                <div>
                  <HelpLabel help="Bu alan doluysa stage'in ana user prompt'unun yerine geçer. Kontrat çıktı şeklini korumayı unutma.">
                    User override
                  </HelpLabel>
                  <Textarea
                    className="min-h-[240px] font-mono text-xs"
                    value={form.userPromptOverride}
                    onChange={(e) => setForm((x) => ({ ...x, userPromptOverride: e.target.value }))}
                    placeholder="Boş = stage/preset/concept tarafından oluşturulan prompt"
                  />
                </div>
                <div>
                  <Label>Notlar</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm((x) => ({ ...x, notes: e.target.value }))} />
                </div>
              </Card>

              <div className="space-y-4">
                <Card>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-black text-white">Test Preview</h3>
                    {testResult?.promptText && (
                      <Button variant="secondary" size="sm" onClick={() => copy(testResult.promptText, "Prompt")}>
                        <Copy size={13} className="mr-1.5" /> Kopyala
                      </Button>
                    )}
                  </div>
                  {testResult ? (
                    <pre className="max-h-[360px] overflow-auto rounded-xl border border-zinc-800 bg-zinc-950/70 p-3 text-xs text-zinc-300">{testResult.promptText}</pre>
                  ) : (
                    <p className="text-sm text-zinc-500">Test ile composer'ın final prompt'unu gör.</p>
                  )}
                </Card>

                <Card>
                  <h3 className="mb-3 font-black text-white">Diff</h3>
                  <div className="max-h-[360px] overflow-auto rounded-xl border border-zinc-800 bg-zinc-950/70 p-2">
                    {diffLines.length === 0 ? (
                      <p className="p-2 text-sm text-zinc-500">Diff çalıştırılmadı.</p>
                    ) : (
                      diffLines.slice(0, 200).map((line, index) => (
                        <div
                          key={`${line.type}-${index}`}
                          className={cn(
                            "rounded px-2 py-1 font-mono text-[11px]",
                            line.type === "added" && "bg-emerald-500/10 text-emerald-200",
                            line.type === "removed" && "bg-red-500/10 text-red-200",
                            line.type === "equal" && "text-zinc-500"
                          )}
                        >
                          {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "} {line.text}
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>
            </div>

            <Card className="mt-4">
              <div className="mb-3 flex items-center gap-2">
                <ClipboardList size={16} className="text-indigo-400" />
                <h3 className="font-black text-white">Son Prompt Trace Kayıtları</h3>
              </div>
              <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
                {traces.map((trace) => (
                  <div key={trace.id} className="rounded-xl border border-zinc-800 bg-zinc-950/45 p-3">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-300">{trace.stageType}</span>
                      <span className="font-mono text-[10px] text-indigo-300">{trace.traceKey}</span>
                      <span className="text-[10px] text-zinc-600">Run #{trace.runId}</span>
                    </div>
                    <p className="line-clamp-2 text-xs text-zinc-400">{trace.promptPreview || trace.userPrompt || "-"}</p>
                    <div className="mt-2 font-mono text-[10px] text-zinc-600">prompt {trace.promptHash?.slice(0, 12) || "-"}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </Page>
  );
}

function InfoBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/45 p-3">
      <div className="mb-2 text-xs font-black uppercase tracking-wide text-zinc-500">{title}</div>
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item} className="text-xs text-zinc-300">{item}</div>
        ))}
      </div>
    </div>
  );
}
