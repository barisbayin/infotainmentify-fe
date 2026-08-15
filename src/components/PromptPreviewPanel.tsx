import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, Copy, Eye, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

type PromptPreviewPanelProps = {
  title: string;
  description?: string;
  systemInstruction?: string;
  promptTemplate: string;
  replacements: Record<string, string | number | null | undefined>;
  contextItems?: { label: string; value?: string | number | null }[];
};

type AdvancedSectionProps = {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

const CONCEPT_TOKENS = [
  "{ConceptProfile}",
  "{ConceptName}",
  "{ChannelPromise}",
  "{ConceptAudience}",
  "{ConceptTone}",
  "{VisualStyle}",
  "{StyleBible}",
  "{CharacterBible}",
  "{TextPolicy}",
  "{ContentRules}",
  "{DefaultDurationSec}",
];

function replaceAllTokens(template: string, replacements: PromptPreviewPanelProps["replacements"]) {
  let result = template || "";
  Object.entries(replacements).forEach(([key, value]) => {
    const token = `{${key}}`;
    result = result.split(token).join(String(value ?? ""));
  });
  return result.trim();
}

function findUnresolvedTokens(text: string) {
  return Array.from(new Set(text.match(/\{[A-Za-z0-9_]+\}/g) ?? []));
}

export function PromptPreviewPanel({
  title,
  description,
  systemInstruction,
  promptTemplate,
  replacements,
  contextItems = [],
}: PromptPreviewPanelProps) {
  const preview = useMemo(() => {
    const system = systemInstruction?.trim()
      ? `SYSTEM\n${replaceAllTokens(systemInstruction, replacements)}\n\n`
      : "";
    return `${system}USER\n${replaceAllTokens(promptTemplate, replacements)}`.trim();
  }, [promptTemplate, replacements, systemInstruction]);

  const unresolved = useMemo(() => findUnresolvedTokens(preview), [preview]);

  const copyPreview = async () => {
    await navigator.clipboard.writeText(preview);
    toast.success("Prompt preview kopyalandi.");
  };

  return (
    <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.04] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-indigo-100">
            <Eye size={15} className="text-indigo-300" />
            {title}
          </div>
          {description && <p className="mt-1 text-xs leading-relaxed text-zinc-400">{description}</p>}
        </div>
        <button
          type="button"
          onClick={copyPreview}
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950/50 px-2 py-1 text-[11px] text-zinc-300 hover:border-indigo-500/50 hover:text-white"
        >
          <Copy size={12} />
          Kopyala
        </button>
      </div>

      {contextItems.length > 0 && (
        <div className="mb-3 grid gap-2 sm:grid-cols-2">
          {contextItems
            .filter((item) => String(item.value ?? "").trim())
            .map((item) => (
              <div key={item.label} className="rounded-lg border border-zinc-800 bg-zinc-950/30 p-2">
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">{item.label}</div>
                <div className="mt-1 line-clamp-2 text-xs text-zinc-200">{item.value}</div>
              </div>
            ))}
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-1.5">
        {CONCEPT_TOKENS.map((token) => (
          <span key={token} className="rounded-full border border-zinc-800 bg-zinc-950/40 px-2 py-0.5 text-[10px] text-zinc-400">
            {token}
          </span>
        ))}
      </div>

      <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-zinc-800 bg-zinc-950/70 p-3 font-mono text-[11px] leading-relaxed text-zinc-300 scrollbar-thin scrollbar-thumb-zinc-700">
        {preview || "Prompt preview icin sablon gir."}
      </pre>

      {unresolved.length > 0 && (
        <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2 text-[11px] text-amber-200">
          Cozulmemis tokenlar: {unresolved.join(", ")}
        </div>
      )}
    </div>
  );
}

export function AdvancedSection({
  title,
  description,
  defaultOpen = false,
  children,
}: AdvancedSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/20">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span>
          <span className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <Sparkles size={14} className="text-indigo-300" />
            {title}
          </span>
          {description && <span className="mt-1 block text-xs text-zinc-500">{description}</span>}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="space-y-4 border-t border-zinc-800/70 p-4">{children}</div>}
    </div>
  );
}
